import request from 'supertest';
import app from '../app';

const MOCK_TOKEN_RESPONSE = { access_token: 'test-token', expires_in: 3600 };
const MOCK_SEARCH_RESPONSE = {
  tracks: {
    items: [
      {
        id: 'abc123',
        name: 'Test Song',
        artists: [{ name: 'Test Artist' }],
        album: { name: 'Test Album' },
        duration_ms: 200000,
        preview_url: 'https://example.com/preview.mp3',
      },
    ],
  },
};

function mockFetch(tokenRes: object, searchRes: object) {
  let calls = 0;
  global.fetch = jest.fn().mockImplementation(() => {
    calls++;
    const body = calls === 1 ? tokenRes : searchRes;
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
  }) as jest.Mock;
}

beforeEach(() => {
  process.env['SPOTIFY_CLIENT_ID'] = 'test-id';
  process.env['SPOTIFY_CLIENT_SECRET'] = 'test-secret';
  // Reset token cache between tests by forcing expiry
  jest.resetModules();
});

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env['SPOTIFY_CLIENT_ID'];
  delete process.env['SPOTIFY_CLIENT_SECRET'];
});

describe('GET /api/search', () => {
  it('returns 400 when q is missing', async () => {
    const res = await request(app).get('/api/search');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/q is required/);
  });

  it('returns 503 when Spotify credentials are not set', async () => {
    delete process.env['SPOTIFY_CLIENT_ID'];
    delete process.env['SPOTIFY_CLIENT_SECRET'];
    const res = await request(app).get('/api/search?q=test');
    expect(res.status).toBe(503);
  });

  it('returns an array of SearchTrack objects with the correct shape', async () => {
    mockFetch(MOCK_TOKEN_RESPONSE, MOCK_SEARCH_RESPONSE);
    const res = await request(app).get('/api/search?q=test');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({
      id: 'abc123',
      name: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      durationMs: 200000,
      source: 'spotify',
    });
  });
});
