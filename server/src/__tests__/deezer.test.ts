import request from 'supertest';
import app from '../app';

const MOCK_DEEZER_TRACK = {
  id: 3135556,
  title: 'Creep',
  artist: { name: 'Radiohead' },
  album: { cover_medium: 'https://example.com/cover.jpg' },
  preview: 'https://cdns-preview-fresh.dzcdn.net/stream/c-newtoken-0.mp3',
  duration: 239,
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /api/deezer/track/:id', () => {
  it('returns 400 for non-numeric id', async () => {
    const res = await request(app).get('/api/deezer/track/abc');
    expect(res.status).toBe(400);
  });

  it('returns 200 with previewUrl on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_DEEZER_TRACK),
    }) as jest.Mock;

    const res = await request(app).get('/api/deezer/track/3135556');
    expect(res.status).toBe(200);
    expect(res.body.previewUrl).toBe(MOCK_DEEZER_TRACK.preview);
  });

  it('returns 502 when Deezer responds with 5xx', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 }) as jest.Mock;
    const res = await request(app).get('/api/deezer/track/3135556');
    expect(res.status).toBe(502);
  });

  it('returns 404 when Deezer payload has no preview', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, title: 'x' }),
    }) as jest.Mock;
    const res = await request(app).get('/api/deezer/track/1');
    expect(res.status).toBe(404);
  });

  it('returns 404 when Deezer payload has an error field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error: { type: 'DataException', message: 'no data' } }),
    }) as jest.Mock;
    const res = await request(app).get('/api/deezer/track/999999999');
    expect(res.status).toBe(404);
  });
});
