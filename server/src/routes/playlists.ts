import { Router, Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb, getPlaylistsByUser, getPlaylistById, createPlaylist, deletePlaylist, getTracksByPlaylist, replacePlaylistTracks } from '../../db/index'
import { authMiddleware } from '../middleware/auth'
import type { DbTrackSource } from '../../../shared/types'

const router = Router()

// All playlist routes require auth
router.use(authMiddleware)

// GET /api/playlists — list all playlists with their tracks
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb()
    const playlists = await getPlaylistsByUser(db, req.user!.userId)
    const result = await Promise.all(playlists.map(async p => {
      const dbTracks = await getTracksByPlaylist(db, p.id)
      const items = dbTracks.map(t => JSON.parse(t.track_data))
      return { id: p.id, name: p.name, items }
    }))
    res.json(result)
  } catch (err) { next(err) }
})

// POST /api/playlists — create a new playlist
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, id } = req.body ?? {}
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' })
      return
    }
    const db = getDb()
    const playlist = await createPlaylist(db, {
      id: typeof id === 'string' && id ? id : uuidv4(),
      user_id: req.user!.userId,
      name: name.trim(),
    })
    res.status(201).json({ id: playlist.id, name: playlist.name })
  } catch (err) { next(err) }
})

// DELETE /api/playlists/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const db = getDb()
    const playlist = await getPlaylistById(db, id)
    if (!playlist) { res.status(404).json({ error: 'Not found' }); return }
    if (playlist.user_id !== req.user!.userId) { res.status(403).json({ error: 'Forbidden' }); return }
    await deletePlaylist(db, id)
    res.status(204).send()
  } catch (err) { next(err) }
})

// PUT /api/playlists/:id/tracks — replace all tracks (full sync / reorder)
router.put('/:id/tracks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string
    const db = getDb()
    const playlist = await getPlaylistById(db, id)
    if (!playlist) { res.status(404).json({ error: 'Not found' }); return }
    if (playlist.user_id !== req.user!.userId) { res.status(403).json({ error: 'Forbidden' }); return }

    const { items } = req.body ?? {}
    if (!Array.isArray(items)) { res.status(400).json({ error: 'items must be an array' }); return }

    const tracks = items.map((item: { kind: string }, i: number) => ({
      id: uuidv4(),
      playlist_id: id,
      position: i,
      source: (item.kind === 'local' ? 'local' : 'deezer') as DbTrackSource,
      track_data: JSON.stringify(item),
    }))

    await replacePlaylistTracks(db, id, tracks)
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
