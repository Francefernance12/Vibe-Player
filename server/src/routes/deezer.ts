import { Router, Request, Response } from 'express';

const router = Router();

/** GET /api/deezer/track/:id — proxies Deezer's track endpoint to mint a fresh preview URL.
 *  Deezer's preview CDN URLs are signed and expire — never cache long-term. */
router.get('/track/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  if (!/^\d+$/.test(id)) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }
  try {
    const r = await fetch(`https://api.deezer.com/track/${id}`);
    if (!r.ok) {
      res.status(502).json({ error: 'deezer fetch failed' });
      return;
    }
    const t = await r.json() as { preview?: string; error?: unknown };
    if (t.error || !t.preview) {
      res.status(404).json({ error: 'no preview available' });
      return;
    }
    res.json({ previewUrl: t.preview });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'fetch error';
    res.status(500).json({ error: msg });
  }
});

export default router;
