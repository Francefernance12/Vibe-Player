import { Router, Request, Response } from 'express';

const router = Router();

export interface SearchTrack {
  id: string;
  title: string;
  artist: string;
  albumArt: string | null;
  previewUrl: string | null;
  durationMs: number;
  source: 'deezer';
}

/** GET /api/search?q=<query> */
router.get('/', async (req: Request, res: Response) => {
  const q = (req.query['q'] as string | undefined)?.trim();
  if (!q) { res.status(400).json({ error: 'q is required' }); return; }

  try {
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=20`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Deezer search error: ${r.status}`);
    const data = await r.json() as { data: DeezerTrack[] };

    const tracks: SearchTrack[] = data.data.map(t => ({
      id: String(t.id),
      title: t.title,
      artist: t.artist.name,
      albumArt: t.album.cover_medium ?? null,
      previewUrl: t.preview || null,
      durationMs: t.duration * 1000,
      source: 'deezer',
    }));
    res.json(tracks);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    res.status(500).json({ error: msg });
  }
});

interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string };
  album: { cover_medium: string };
  preview: string;
  duration: number;
}

export default router;
