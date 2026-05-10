import { isTransientDbError, withDbRetry, DatabaseUnavailableError } from '../../db/retry'

// --- isTransientDbError ---

describe('isTransientDbError', () => {
  test('detects ECONNRESET via code', () => {
    const err = Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })
    expect(isTransientDbError(err)).toBe(true)
  })

  test('detects ETIMEDOUT via code', () => {
    const err = Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })
    expect(isTransientDbError(err)).toBe(true)
  })

  test('detects FetchError by name', () => {
    const err = Object.assign(new Error('fetch failed'), { name: 'FetchError' })
    expect(isTransientDbError(err)).toBe(true)
  })

  test('detects 5xx HTTP status', () => {
    const err = Object.assign(new Error('upstream'), { status: 503 })
    expect(isTransientDbError(err)).toBe(true)
  })

  test('detects ECONNRESET in cause chain (node-fetch wraps it)', () => {
    const cause = Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })
    const wrapped = Object.assign(
      new Error('request to https://x.turso.io failed'),
      { name: 'FetchError', cause }
    )
    expect(isTransientDbError(wrapped)).toBe(true)
  })

  test('detects fragment in message when code is missing', () => {
    expect(isTransientDbError(new Error('socket hang up'))).toBe(true)
  })

  test('does NOT flag a syntax error', () => {
    expect(isTransientDbError(new SyntaxError('bad input'))).toBe(false)
  })

  test('does NOT flag a 4xx HTTP status', () => {
    const err = Object.assign(new Error('not found'), { status: 404 })
    expect(isTransientDbError(err)).toBe(false)
  })

  test('does NOT flag a plain Error', () => {
    expect(isTransientDbError(new Error('something else'))).toBe(false)
  })

  test('handles null and undefined', () => {
    expect(isTransientDbError(null)).toBe(false)
    expect(isTransientDbError(undefined)).toBe(false)
  })
})

// --- withDbRetry ---

const noSleep = async (_ms: number) => { /* no-op for fast tests */ }

describe('withDbRetry', () => {
  test('succeeds on first attempt without retrying', async () => {
    const fn = jest.fn().mockResolvedValue('ok')
    const result = await withDbRetry(fn, { sleep: noSleep })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('retries on transient error and eventually succeeds', async () => {
    const transient = Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' })
    const fn = jest.fn()
      .mockRejectedValueOnce(transient)
      .mockRejectedValueOnce(transient)
      .mockResolvedValueOnce('recovered')
    const result = await withDbRetry(fn, { sleep: noSleep })
    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('throws DatabaseUnavailableError after exhausting retries', async () => {
    const transient = Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' })
    const fn = jest.fn().mockRejectedValue(transient)
    await expect(withDbRetry(fn, { sleep: noSleep })).rejects.toBeInstanceOf(DatabaseUnavailableError)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('preserves the original error as cause when wrapping', async () => {
    const transient = Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' })
    const fn = jest.fn().mockRejectedValue(transient)
    try {
      await withDbRetry(fn, { sleep: noSleep })
      fail('expected throw')
    } catch (err) {
      expect(err).toBeInstanceOf(DatabaseUnavailableError)
      expect((err as DatabaseUnavailableError).cause).toBe(transient)
    }
  })

  test('does NOT retry non-transient errors', async () => {
    const validation = new SyntaxError('bad input')
    const fn = jest.fn().mockRejectedValue(validation)
    await expect(withDbRetry(fn, { sleep: noSleep })).rejects.toBe(validation)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('honors custom retry count', async () => {
    const transient = Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' })
    const fn = jest.fn().mockRejectedValue(transient)
    await expect(withDbRetry(fn, { retries: 2, sleep: noSleep })).rejects.toBeInstanceOf(DatabaseUnavailableError)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
