import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../app';

const SAMPLE_MP3 = path.join(__dirname, '../../samples/sample1.mp3');

describe('GET /api/health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/tracks', () => {
  it('returns an array', async () => {
    const res = await request(app).get('/api/tracks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/tracks/upload', () => {
  it('returns 201 with track metadata when uploading an audio file', async () => {
    expect(fs.existsSync(SAMPLE_MP3)).toBe(true);
    const res = await request(app)
      .post('/api/tracks/upload')
      .attach('file', SAMPLE_MP3);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      filename: expect.any(String),
      originalName: 'sample1.mp3',
      mimeType: 'audio/mpeg',
      size: expect.any(Number),
      source: 'upload',
    });
    // Clean up uploaded file
    const uploaded = path.join(__dirname, '../../uploads', res.body.filename);
    if (fs.existsSync(uploaded)) fs.unlinkSync(uploaded);
  });
});

describe('DELETE /api/tracks/:filename', () => {
  it('returns 403 when trying to delete a sample track', async () => {
    const res = await request(app).delete('/api/tracks/sample1.mp3');
    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent file', async () => {
    const res = await request(app).delete('/api/tracks/doesnotexist.mp3');
    expect(res.status).toBe(404);
  });

  it('deletes an uploaded file and returns 204', async () => {
    // Upload a file first
    const upload = await request(app)
      .post('/api/tracks/upload')
      .attach('file', SAMPLE_MP3);
    expect(upload.status).toBe(201);
    const { filename } = upload.body;

    const del = await request(app).delete(`/api/tracks/${filename}`);
    expect(del.status).toBe(204);

    // Confirm it is gone
    const stream = await request(app).get(`/api/tracks/${filename}/stream`);
    expect(stream.status).toBe(404);
  });
});

describe('GET /api/tracks/:filename/stream', () => {
  it('returns a response with audio Content-Type for a sample file', async () => {
    const res = await request(app).get('/api/tracks/sample1.mp3/stream');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/audio/);
  });

  it('returns 404 for a non-existent file', async () => {
    const res = await request(app).get('/api/tracks/nonexistent.mp3/stream');
    expect(res.status).toBe(404);
  });
});
