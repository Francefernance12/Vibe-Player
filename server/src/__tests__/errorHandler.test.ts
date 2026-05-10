import express, { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import request from 'supertest'
import { DatabaseUnavailableError } from '../../db/retry'

// Build a tiny app that mirrors the real error middleware so we can drive
// errors deterministically without standing up real DB / multer routes.
function buildApp(throwErr: Error) {
  const app = express()
  app.get('/boom', (_req: Request, _res: Response, next: NextFunction) => {
    next(throwErr)
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File too large. Maximum size is 50 MB.' })
      return
    }
    if (err instanceof DatabaseUnavailableError) {
      res.status(503)
        .set('Retry-After', '5')
        .json({
          error: 'Our database is temporarily unavailable. This is a server-side issue, not your fault. Please try again in a moment.',
          retryable: true,
          code: 'DB_UNAVAILABLE',
        })
      return
    }
    res.status(500).json({ error: 'Internal server error' })
  })
  return app
}

describe('error middleware', () => {
  // Silence expected console.error noise from these tests
  let errSpy: jest.SpyInstance
  beforeAll(() => { errSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) })
  afterAll(() => { errSpy.mockRestore() })

  test('DatabaseUnavailableError -> 503 with friendly message + Retry-After', async () => {
    const cause = Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })
    const app = buildApp(new DatabaseUnavailableError('db down', cause))

    const res = await request(app).get('/boom')

    expect(res.status).toBe(503)
    expect(res.headers['retry-after']).toBe('5')
    expect(res.body).toEqual({
      error: 'Our database is temporarily unavailable. This is a server-side issue, not your fault. Please try again in a moment.',
      retryable: true,
      code: 'DB_UNAVAILABLE',
    })
  })

  test('Unknown error -> generic 500', async () => {
    const app = buildApp(new Error('boom'))
    const res = await request(app).get('/boom')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
  })
})

