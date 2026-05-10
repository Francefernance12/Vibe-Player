import request from 'supertest'
import type { Client } from '@libsql/client'

process.env.JWT_SECRET = 'test-secret-for-chat-tests'
process.env.GROQ_API_KEY = 'test-groq-key'

const MOCK_REPLY = 'Jazz is a genre that originated in New Orleans!'

const mockCreate = jest.fn().mockResolvedValue({
  choices: [{ message: { content: MOCK_REPLY } }],
})

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
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
let promptCookie: string

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

  const res3 = await request(app)
    .post('/api/auth/register')
    .send({ email: 'prompt@example.com', password: 'password123' })
  promptCookie = res3.headers['set-cookie'][0]
})

beforeEach(() => {
  mockCreate.mockClear()
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
      .send({
        messages: [{ role: 'user', content: 'Tell me about jazz' }],
        currentTrack: { id: 't1', name: 'Kind of Blue' },
        isPlaying: true,
      })
    expect(res.status).toBe(200)
    expect(res.body.reply).toBe(MOCK_REPLY)
  })

  it('embeds currentTrack id in the system prompt and instructs the model to use it for "this song"', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Cookie', promptCookie)
      .send({
        messages: [{ role: 'user', content: 'add this song to favorites' }],
        currentTrack: { id: 'abc-123', name: 'Bohemian Rhapsody' },
        isPlaying: true,
      })
    expect(res.status).toBe(200)
    const sysPrompt = mockCreate.mock.calls[0][0].messages[0].content as string
    expect(sysPrompt).toContain('id: abc-123')
    expect(sysPrompt).toContain('Bohemian Rhapsody')
    expect(sysPrompt).toMatch(/this song/i)
    expect(sysPrompt).toMatch(/use the id/i)
  })

  it('falls back to a clarification instruction when nothing is playing', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Cookie', promptCookie)
      .send({
        messages: [{ role: 'user', content: 'pause' }],
        currentTrack: null,
      })
    expect(res.status).toBe(200)
    const sysPrompt = mockCreate.mock.calls[0][0].messages[0].content as string
    expect(sysPrompt).toContain('Currently playing: nothing')
    expect(sysPrompt).toMatch(/ask them which track they mean/i)
  })

  it('documents all action types and the anti-hallucination rule', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Cookie', promptCookie)
      .send({
        messages: [{ role: 'user', content: 'hi' }],
        currentTrack: null,
      })
    expect(res.status).toBe(200)
    const sysPrompt = mockCreate.mock.calls[0][0].messages[0].content as string
    expect(sysPrompt).toContain('"type":"play"')
    expect(sysPrompt).toContain('"type":"search"')
    expect(sysPrompt).toContain('"type":"add_to_playlist"')
    expect(sysPrompt).toContain('"type":"add_to_favorites"')
    expect(sysPrompt).toContain('"type":"pause"')
    expect(sysPrompt).toContain('"type":"resume"')
    expect(sysPrompt).toContain('"type":"next"')
    expect(sysPrompt).toContain('"type":"prev"')
    expect(sysPrompt).toMatch(/ANTI-HALLUCINATION/i)
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
