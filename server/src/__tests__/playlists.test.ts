import request from 'supertest'
import type { Client } from '@libsql/client'

process.env.JWT_SECRET = 'test-secret-for-playlist-tests'

let testDb: Client

jest.mock('../../db/index', () => ({
  ...jest.requireActual('../../db/index'),
  getDb: () => testDb,
}))

import app from '../app'

const EMAIL = 'pl-test@example.com'
const PASSWORD = 'password123'
let cookie: string[]

beforeAll(async () => {
  const { createMemoryDb, initDb } = jest.requireActual('../../db/index')
  testDb = createMemoryDb()
  await initDb(testDb)
  const res = await request(app).post('/api/auth/register').send({ email: EMAIL, password: PASSWORD })
  cookie = res.headers['set-cookie'] as unknown as string[]
})

describe('GET /api/playlists', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/playlists')
    expect(res.status).toBe(401)
  })

  it('returns playlists for authenticated user (includes auto-created Favorites)', async () => {
    const res = await request(app).get('/api/playlists').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
    expect(res.body[0].name).toBe('Favorites')
  })
})

describe('POST /api/playlists', () => {
  it('creates a playlist and returns 201', async () => {
    const res = await request(app)
      .post('/api/playlists')
      .set('Cookie', cookie)
      .send({ name: 'My Mix' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('My Mix')
    expect(res.body.id).toBeDefined()
  })

  it('returns 400 without a name', async () => {
    const res = await request(app).post('/api/playlists').set('Cookie', cookie).send({})
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/playlists/:id/tracks', () => {
  let playlistId: string

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/playlists')
      .set('Cookie', cookie)
      .send({ name: 'Track Test' })
    playlistId = res.body.id
  })

  it('replaces tracks and returns 204', async () => {
    const items = [
      { kind: 'local', track: { id: 'abc', filename: 'a.mp3', originalName: 'A', mimeType: 'audio/mpeg', size: 100, source: 'upload' } },
    ]
    const res = await request(app)
      .put(`/api/playlists/${playlistId}/tracks`)
      .set('Cookie', cookie)
      .send({ items })
    expect(res.status).toBe(204)
  })

  it('tracks are returned in subsequent GET', async () => {
    const res = await request(app).get('/api/playlists').set('Cookie', cookie)
    const playlist = res.body.find((p: { id: string }) => p.id === playlistId)
    expect(playlist.items).toHaveLength(1)
    expect(playlist.items[0].track.id).toBe('abc')
  })
})

describe('DELETE /api/playlists/:id', () => {
  it('deletes a playlist and returns 204', async () => {
    const create = await request(app)
      .post('/api/playlists')
      .set('Cookie', cookie)
      .send({ name: 'To Delete' })
    const del = await request(app)
      .delete(`/api/playlists/${create.body.id}`)
      .set('Cookie', cookie)
    expect(del.status).toBe(204)
  })

  it('returns 404 for non-existent playlist', async () => {
    const res = await request(app).delete('/api/playlists/nonexistent').set('Cookie', cookie)
    expect(res.status).toBe(404)
  })
})
