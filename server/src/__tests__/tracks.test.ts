import request from 'supertest';
import path from 'path';
import type { Client } from '@libsql/client';

process.env.JWT_SECRET = 'test-secret-for-tracks-tests';

const BLOB_URL = 'https://blob.vercel-storage.com/test-file.mp3';

jest.mock('@vercel/blob', () => ({
  put: jest.fn().mockResolvedValue({ url: BLOB_URL }),
  del: jest.fn().mockResolvedValue(undefined),
}));

let testDb: Client;
let mockUsedBytes = 0;

jest.mock('../../db/index', () => ({
  ...jest.requireActual('../../db/index'),
  getDb: () => testDb,
  getUserUploadedBytes: jest.fn(async () => mockUsedBytes),
}));

import app from '../app';

const SAMPLE_MP3 = path.join(__dirname, '../../samples/MusicSample.mp3');

let authCookie: string;
let userId: string;

beforeAll(async () => {
  const { createMemoryDb, initDb } = jest.requireActual('../../db/index');
  testDb = createMemoryDb();
  await initDb(testDb);

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'uploader@example.com', password: 'password123' });
  expect(res.status).toBe(201);
  userId = res.body.id;
  authCookie = res.headers['set-cookie'][0];
});

describe('POST /api/tracks/upload', () => {
  it('returns 401 without auth', async () => {
    // No file attached — auth check runs before multer, so no ECONNRESET
    const res = await request(app).post('/api/tracks/upload');
    expect(res.status).toBe(401);
  });

  it('returns 201 with track metadata including externalUrl', async () => {
    const res = await request(app)
      .post('/api/tracks/upload')
      .set('Cookie', authCookie)
      .attach('file', SAMPLE_MP3);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      originalName: 'MusicSample.mp3',
      mimeType: 'audio/mpeg',
      source: 'upload',
      externalUrl: BLOB_URL,
    });
    expect(typeof res.body.id).toBe('string');
  });

  it('returns 413 when user quota is exceeded', async () => {
    mockUsedBytes = 100 * 1024 * 1024; // at 100MB limit
    const res = await request(app)
      .post('/api/tracks/upload')
      .set('Cookie', authCookie)
      .attach('file', SAMPLE_MP3);
    expect(res.status).toBe(413);
    expect(res.body.error).toMatch(/quota/i);
    mockUsedBytes = 0;
  });
});

describe('GET /api/tracks', () => {
  it('returns samples + uploads when authenticated', async () => {
    const res = await request(app)
      .get('/api/tracks')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    const uploads = res.body.filter((t: { source: string }) => t.source === 'upload');
    expect(uploads.length).toBeGreaterThan(0);
    expect(uploads[0].externalUrl).toBe(BLOB_URL);
  });
});

describe('DELETE /api/tracks/:id', () => {
  let uploadedId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/tracks/upload')
      .set('Cookie', authCookie)
      .attach('file', SAMPLE_MP3);
    uploadedId = res.body.id;
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).delete(`/api/tracks/${uploadedId}`);
    expect(res.status).toBe(401);
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app)
      .delete('/api/tracks/00000000-0000-0000-0000-000000000000')
      .set('Cookie', authCookie);
    expect(res.status).toBe(404);
  });

  it('deletes the track and returns 204', async () => {
    const res = await request(app)
      .delete(`/api/tracks/${uploadedId}`)
      .set('Cookie', authCookie);
    expect(res.status).toBe(204);
  });

  it('returns 404 after deletion', async () => {
    const res = await request(app)
      .delete(`/api/tracks/${uploadedId}`)
      .set('Cookie', authCookie);
    expect(res.status).toBe(404);
  });
});
