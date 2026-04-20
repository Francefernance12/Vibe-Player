import request from 'supertest';
import app from '../app';

const MOCK_DEEZER_RESPONSE = {
  data: [
    {
      id: 3135556,
      title: 'Creep',
      artist: { name: 'Radiohead' },
      album: { cover_medium: 'https://example.com/cover.jpg' },
      preview: 'https://example.com/preview.mp3',
      duration: 239,
    },
  ],
};

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(MOCK_DEEZER_RESPONSE),
  }) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /api/search', () => {
  it('returns 400 when q is missing', async () => {
    const res = await request(app).get('/api/search');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/q is required/);
  });

  it('returns an array of SearchTrack objects with correct shape', async () => {
    const res = await request(app).get('/api/search?q=radiohead');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({
      id: '3135556',
      title: 'Creep',
      artist: 'Radiohead',
      albumArt: 'https://example.com/cover.jpg',
      previewUrl: 'https://example.com/preview.mp3',
      durationMs: 239000,
      source: 'deezer',
    });
  });

  it('returns 500 when Deezer request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });
    const res = await request(app).get('/api/search?q=test');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Deezer search error/);
  });
});
