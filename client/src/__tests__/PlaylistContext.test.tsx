import { render, act } from '@testing-library/react'
import { AuthProvider } from '../contexts/AuthContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { PlaylistProvider, usePlaylist, LOCAL_FAVORITES_ID } from '../contexts/PlaylistContext'
import { Track, SearchTrack } from '../types'

const LOCAL_TRACK: Track = { id: 't1', filename: 'a.mp3', originalName: 'Alpha.mp3', mimeType: 'audio/mpeg', size: 1000, source: 'sample' }
const TRACK2: Track = { ...LOCAL_TRACK, id: 't2', filename: 'b.mp3', originalName: 'Beta.mp3' }
const DEEZER_TRACK: SearchTrack = { id: 'd1', title: 'Creep', artist: 'Radiohead', albumArt: null, previewUrl: null, durationMs: 239000, source: 'deezer' }

// Auth/me returns 401 (not logged in) — keeps tests isolated from API
beforeEach(() => {
  localStorage.clear()
  global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) } as unknown as Response)
})

function Harness({ fn }: { fn: (ctx: ReturnType<typeof usePlaylist>) => void }) {
  const ctx = usePlaylist()
  fn(ctx)
  return null
}

function setup(fn: (ctx: ReturnType<typeof usePlaylist>) => void) {
  return render(
    <NotificationProvider>
      <AuthProvider>
        <PlaylistProvider><Harness fn={fn} /></PlaylistProvider>
      </AuthProvider>
    </NotificationProvider>
  )
}

test('starts with Favorites playlist', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  expect(ctx.playlists).toHaveLength(1)
  expect(ctx.playlists[0].name).toBe('Favorites')
  expect(ctx.playlists[0].id).toBe(LOCAL_FAVORITES_ID)
  expect(ctx.playlists[0].items).toHaveLength(0)
})

test('addLocal adds a local track to specified playlist', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => ctx.addLocal(LOCAL_TRACK, LOCAL_FAVORITES_ID))
  expect(ctx.playlists[0].items).toHaveLength(1)
  expect(ctx.playlists[0].items[0].kind).toBe('local')
})

test('addLocal does not duplicate', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => { ctx.addLocal(LOCAL_TRACK, LOCAL_FAVORITES_ID); ctx.addLocal(LOCAL_TRACK, LOCAL_FAVORITES_ID) })
  expect(ctx.playlists[0].items).toHaveLength(1)
})

test('addDeezer adds a Deezer track to Favorites', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => ctx.addDeezer(DEEZER_TRACK))
  expect(ctx.playlists[0].items).toHaveLength(1)
  expect(ctx.playlists[0].items[0].kind).toBe('deezer')
})

test('removeFromPlaylist removes by id', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => ctx.addLocal(LOCAL_TRACK, LOCAL_FAVORITES_ID))
  act(() => ctx.removeFromPlaylist('t1', LOCAL_FAVORITES_ID))
  expect(ctx.playlists[0].items).toHaveLength(0)
})

test('reorderPlaylist moves item to new index', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => { ctx.addLocal(LOCAL_TRACK, LOCAL_FAVORITES_ID); ctx.addLocal(TRACK2, LOCAL_FAVORITES_ID) })
  act(() => ctx.reorderPlaylist(LOCAL_FAVORITES_ID, 0, 1))
  expect(ctx.playlists[0].items[0].track.id).toBe('t2')
  expect(ctx.playlists[0].items[1].track.id).toBe('t1')
})

test('isInPlaylist returns correct boolean', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => ctx.addLocal(LOCAL_TRACK, LOCAL_FAVORITES_ID))
  expect(ctx.isInPlaylist('t1', LOCAL_FAVORITES_ID)).toBe(true)
  expect(ctx.isInPlaylist('t2', LOCAL_FAVORITES_ID)).toBe(false)
})

test('createPlaylist adds a new playlist', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => { ctx.createPlaylist('My Mix') })
  expect(ctx.playlists).toHaveLength(2)
  expect(ctx.playlists[1].name).toBe('My Mix')
})

test('persists to localStorage and reloads', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => ctx.addLocal(LOCAL_TRACK, LOCAL_FAVORITES_ID))

  let ctx2!: ReturnType<typeof usePlaylist>
  setup(c => { ctx2 = c })
  expect(ctx2.playlists[0].items).toHaveLength(1)
})
