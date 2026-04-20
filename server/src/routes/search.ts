import { Router, Request, Response } from 'express';

const router = Router();

interface SpotifyToken { token: string; expiresAt: number }
let cached: SpotifyToken | null = null;

async function getToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) return cached.token;
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error('Spotify credentials not configured');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Spotify token error: ${res.status}`);
  const data = await res.json() as { access_token: string; expires_in: number };
  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 - 5000 };
  return cached.token;
}

export interface SearchTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  durationMs: number;
  previewUrl: string | null;
  source: 'spotify';
}

/** GET /api/search?q=<query> */
router.get('/', async (req: Request, res: Response) => {
  const q = (req.query['q'] as string | undefined)?.trim();
  if (!q) { res.status(400).json({ error: 'q is required' }); return; }

  try {
    const token = await getToken();
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=20`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      throw new Error(`Spotify search error: ${r.status} ${body}`);
    }
    const data = await r.json() as { tracks: { items: SpotifyTrackItem[] } };

    const tracks: SearchTrack[] = data.tracks.items.map(t => ({
      id: t.id,
      name: t.name,
      artist: t.artists.map(a => a.name).join(', '),
      album: t.album.name,
      durationMs: t.duration_ms,
      previewUrl: t.preview_url,
      source: 'spotify',
    }));
    res.json(tracks);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    const status = msg.includes('not configured') ? 503 : 500;
    res.status(status).json({ error: msg });
  }
});

interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string };
  duration_ms: number;
  preview_url: string | null;
}

export default router;
