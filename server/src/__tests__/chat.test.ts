import request from 'supertest'
import type { Client } from '@libsql/client'

process.env.JWT_SECRET = 'test-secret-for-chat-tests'
process.env.GROQ_API_KEY = 'test-groq-key'

const MOCK_REPLY = 'Jazz is a genre that originated in New Orleans!'

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: MOCK_REPLY } }],
        }),
      },
    },
  }))
})

let testDb: Client

jest.mock('../../db/index', () => ({
  ...jest.requireActual('../../db/index'),
  getDb: () => testDb,
}))

import app from '../app'

let authCookie: string
let rateLimitCookie: string

beforeAll(async () => {
  const { createMemoryDb, initDb } = jest.requireActual('../../db/index')
  testDb = createMemoryDb()
  await initDb(testDb)

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'chat@example.com', password: 'password123' })
  authCookie = res.headers['set-cookie'][0]

  const res2 = await request(app)
    .post('/api/auth/register')
    .send({ email: 'ratelimit@example.com', password: 'password123' })
  rateLimitCookie = res2.headers['set-cookie'][0]
})

describe('POST /api/chat', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'hello' }] })
    expect(res.status).toBe(401)
  })

  it('returns 400 if messages is not an array', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Cookie', authCookie)
      .send({ messages: 'not an array' })
    expect(res.status).toBe(400)
  })

  it('returns 200 with reply from Groq', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Cookie', authCookie)
      .send({ messages: [{ role: 'user', content: 'Tell me about jazz' }], trackName: 'Kind of Blue' })
    expect(res.status).toBe(200)
    expect(res.body.reply).toBe(MOCK_REPLY)
  })

  it('returns 429 after exceeding rate limit', async () => {
    // Send 5 requests to exhaust the limit for the rateLimitCookie user
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/chat')
        .set('Cookie', rateLimitCookie)
        .send({ messages: [{ role: 'user', content: 'hi' }] })
    }
    const res = await request(app)
      .post('/api/chat')
      .set('Cookie', rateLimitCookie)
      .send({ messages: [{ role: 'user', content: 'hi again' }] })
    expect(res.status).toBe(429)
  })
})
