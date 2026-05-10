/**
 * Transient database error handling for libSQL/Turso.
 *
 * Turso's HTTP/2 pipeline endpoint occasionally drops connections (ECONNRESET)
 * or returns 5xx during regional failover. These are server-side, not user-caused,
 * and usually clear within a second. We retry a small number of times with short
 * backoff, and surface a typed error if they don't.
 */

const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ENETUNREACH',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNREFUSED',
  'EPIPE',
  'UND_ERR_SOCKET',
])

const TRANSIENT_MESSAGE_FRAGMENTS = [
  'socket hang up',
  'network error',
  'fetch failed',
  'request to ',
  'stream has been aborted',
]

interface ErrnoLike {
  code?: unknown
  errno?: unknown
  name?: unknown
  message?: unknown
  status?: unknown
  cause?: unknown
}

function getErrCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined
  const e = err as ErrnoLike
  if (typeof e.code === 'string') return e.code
  return undefined
}

function getErrName(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined
  const e = err as ErrnoLike
  if (typeof e.name === 'string') return e.name
  return undefined
}

function getErrMessage(err: unknown): string {
  if (!err) return ''
  if (typeof err === 'string') return err
  if (typeof err === 'object' && 'message' in (err as object)) {
    const m = (err as ErrnoLike).message
    if (typeof m === 'string') return m
  }
  return String(err)
}

function getErrStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined
  const s = (err as ErrnoLike).status
  if (typeof s === 'number') return s
  return undefined
}

/**
 * True when err looks like a transient network/server failure that's worth retrying.
 * Inspects the error itself, its `cause`, and common libSQL/node-fetch shapes.
 */
export function isTransientDbError(err: unknown): boolean {
  if (!err) return false

  const code = getErrCode(err)
  if (code && TRANSIENT_ERROR_CODES.has(code)) return true

  const name = getErrName(err)
  if (name === 'FetchError' || name === 'AbortError') return true

  const status = getErrStatus(err)
  if (typeof status === 'number' && status >= 500 && status <= 599) return true

  const message = getErrMessage(err).toLowerCase()
  for (const fragment of TRANSIENT_MESSAGE_FRAGMENTS) {
    if (message.includes(fragment)) return true
  }
  for (const c of TRANSIENT_ERROR_CODES) {
    if (message.includes(c.toLowerCase())) return true
  }

  // Recurse into `cause` (node-fetch wraps the underlying socket error there).
  if (typeof err === 'object' && err !== null && 'cause' in (err as object)) {
    const cause = (err as ErrnoLike).cause
    if (cause && cause !== err) return isTransientDbError(cause)
  }

  return false
}

/**
 * Sentinel thrown by withDbRetry after all retries fail. The Express error
 * middleware uses `instanceof DatabaseUnavailableError` to return a 503.
 */
export class DatabaseUnavailableError extends Error {
  readonly code = 'DB_UNAVAILABLE'
  readonly cause: unknown

  constructor(message: string, cause: unknown) {
    super(message)
    this.name = 'DatabaseUnavailableError'
    this.cause = cause
  }
}

export interface WithDbRetryOptions {
  /** Total attempts including the first try. Default 3 (1 initial + 2 retries). */
  retries?: number
  /** Delays in ms between attempts. Default [150, 400]. */
  backoffMs?: number[]
  /** Override sleep for tests. */
  sleep?: (ms: number) => Promise<void>
}

const DEFAULT_BACKOFF_MS = [150, 400]

function defaultSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Run `fn`, retrying on transient errors with short backoff. Non-transient errors
 * are re-thrown immediately so caller logic (validation, conflict, not-found) is
 * untouched. After exhaustion, throws DatabaseUnavailableError.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts: WithDbRetryOptions = {}
): Promise<T> {
  const backoff = opts.backoffMs ?? DEFAULT_BACKOFF_MS
  const totalAttempts = opts.retries ?? backoff.length + 1
  const sleep = opts.sleep ?? defaultSleep

  let lastErr: unknown
  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isTransientDbError(err)) throw err
      const remaining = totalAttempts - attempt - 1
      if (remaining <= 0) break
      const delay = backoff[Math.min(attempt, backoff.length - 1)]
      await sleep(delay)
    }
  }

  throw new DatabaseUnavailableError(
    'Database temporarily unavailable after retries',
    lastErr
  )
}
