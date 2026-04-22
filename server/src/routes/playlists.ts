import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb, getPlaylistsByUser, getPlaylistById, createPlaylist, deletePlaylist, getTracksByPlaylist, replacePlaylistTracks } from '../../db/index'
import { authMiddleware } from '../middleware/auth'
import type { DbTrackSource } from '../../../shared/types'

const router = Router()

// All playlist routes require auth
router.use(authMiddleware)

// GET /api/playlists — list all playlists with their tracks
router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const playlists = getPlaylistsByUser(db, req.user!.userId)
  const result = playlists.map(p => {
    const dbTracks = getTracksByPlaylist(db, p.id)
    const items = dbTracks.map(t => JSON.parse(t.track_data))
    return { id: p.id, name: p.name, items }
  })
  res.json(result)
})

// POST /api/playlists — create a new playlist
router.post('/', (req: Request, res: Response) => {
  const { name, id } = req.body ?? {}
  if (typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'name is required' })
    return
  }
  const db = getDb()
  const playlist = createPlaylist(db, {
    id: typeof id === 'string' && id ? id : uuidv4(),
    user_id: req.user!.userId,
    name: name.trim(),
  })
  res.status(201).json({ id: playlist.id, name: playlist.name })
})

// DELETE /api/playlists/:id
router.delete('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string
  const db = getDb()
  const playlist = getPlaylistById(db, id)
  if (!playlist) { res.status(404).json({ error: 'Not found' }); return }
  if (playlist.user_id !== req.user!.userId) { res.status(403).json({ error: 'Forbidden' }); return }
  deletePlaylist(db, id)
  res.status(204).send()
})

// PUT /api/playlists/:id/tracks — replace all tracks (full sync / reorder)
router.put('/:id/tracks', (req: Request, res: Response) => {
  const id = req.params.id as string
  const db = getDb()
  const playlist = getPlaylistById(db, id)
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

  replacePlaylistTracks(db, id, tracks)
  res.status(204).send()
})

export default router
