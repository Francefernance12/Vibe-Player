import request from 'supertest'

process.env.JWT_SECRET = 'test-secret-for-auth-tests'

// Replace the DB singleton with an in-memory database for isolation
jest.mock('../../db/index', () => {
  const actual = jest.requireActual('../../db/index')
  const db = actual.createMemoryDb()
  return { ...actual, getDb: () => db }
})

import app from '../app'

const EMAIL = 'test@example.com'
const PASSWORD = 'password123'

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201 with id + email', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: EMAIL, password: PASSWORD })
    expect(res.status).toBe(201)
    expect(res.body.email).toBe(EMAIL)
    expect(res.body.id).toBeDefined()
  })

  it('returns 409 if email already registered', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: EMAIL, password: PASSWORD })
    expect(res.status).toBe(409)
  })

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: PASSWORD })
    expect(res.status).toBe(400)
  })

  it('returns 400 for short password', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'new@example.com', password: 'short' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('returns 200 with user info on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD })
    expect(res.status).toBe(200)
    expect(res.body.email).toBe(EMAIL)
  })

  it('returns 401 for wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'wrongpassword' })
    expect(res.status).toBe(401)
  })

  it('returns 401 for unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: PASSWORD })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns user info with valid JWT cookie', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD })
    const cookie = loginRes.headers['set-cookie']
    const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie)
    expect(meRes.status).toBe(200)
    expect(meRes.body.email).toBe(EMAIL)
  })
})
