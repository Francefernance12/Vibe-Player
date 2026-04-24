import request from 'supertest';
import app from '../app';

describe('GET /api/health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/tracks', () => {
  it('returns an array (samples only when unauthenticated)', async () => {
    const res = await request(app).get('/api/tracks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/tracks/:filename/stream', () => {
  it('returns a response with audio Content-Type for a sample file', async () => {
    const res = await request(app).get('/api/tracks/MusicSample.mp3/stream');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/audio/);
  });

  it('returns 404 for a non-existent file', async () => {
    const res = await request(app).get('/api/tracks/nonexistent.mp3/stream');
    expect(res.status).toBe(404);
  });
});
