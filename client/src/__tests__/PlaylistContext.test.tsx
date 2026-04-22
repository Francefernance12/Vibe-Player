import { render, act } from '@testing-library/react'
import { PlaylistProvider, usePlaylist, DEFAULT_PLAYLIST_ID } from '../contexts/PlaylistContext'
import { Track, SearchTrack } from '../types'

const LOCAL_TRACK: Track = { id: 't1', filename: 'a.mp3', originalName: 'Alpha.mp3', mimeType: 'audio/mpeg', size: 1000, source: 'sample' }
const TRACK2: Track = { ...LOCAL_TRACK, id: 't2', filename: 'b.mp3', originalName: 'Beta.mp3' }
const DEEZER_TRACK: SearchTrack = { id: 'd1', title: 'Creep', artist: 'Radiohead', albumArt: null, previewUrl: null, durationMs: 239000, source: 'deezer' }

function Harness({ fn }: { fn: (ctx: ReturnType<typeof usePlaylist>) => void }) {
  const ctx = usePlaylist()
  fn(ctx)
  return null
}

function setup(fn: (ctx: ReturnType<typeof usePlaylist>) => void) {
  return render(<PlaylistProvider><Harness fn={fn} /></PlaylistProvider>)
}

beforeEach(() => localStorage.clear())

test('starts with Favorites playlist', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  expect(ctx.playlists).toHaveLength(1)
  expect(ctx.playlists[0].name).toBe('Favorites')
  expect(ctx.playlists[0].id).toBe(DEFAULT_PLAYLIST_ID)
  expect(ctx.playlists[0].items).toHaveLength(0)
})

test('addLocal adds a local track to specified playlist', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => ctx.addLocal(LOCAL_TRACK, DEFAULT_PLAYLIST_ID))
  expect(ctx.playlists[0].items).toHaveLength(1)
  expect(ctx.playlists[0].items[0].kind).toBe('local')
})

test('addLocal does not duplicate', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => { ctx.addLocal(LOCAL_TRACK, DEFAULT_PLAYLIST_ID); ctx.addLocal(LOCAL_TRACK, DEFAULT_PLAYLIST_ID) })
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
  act(() => ctx.addLocal(LOCAL_TRACK, DEFAULT_PLAYLIST_ID))
  act(() => ctx.removeFromPlaylist('t1', DEFAULT_PLAYLIST_ID))
  expect(ctx.playlists[0].items).toHaveLength(0)
})

test('reorderPlaylist moves item to new index', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => { ctx.addLocal(LOCAL_TRACK, DEFAULT_PLAYLIST_ID); ctx.addLocal(TRACK2, DEFAULT_PLAYLIST_ID) })
  act(() => ctx.reorderPlaylist(DEFAULT_PLAYLIST_ID, 0, 1))
  expect(ctx.playlists[0].items[0].track.id).toBe('t2')
  expect(ctx.playlists[0].items[1].track.id).toBe('t1')
})

test('isInPlaylist returns correct boolean', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => ctx.addLocal(LOCAL_TRACK, DEFAULT_PLAYLIST_ID))
  expect(ctx.isInPlaylist('t1', DEFAULT_PLAYLIST_ID)).toBe(true)
  expect(ctx.isInPlaylist('t2', DEFAULT_PLAYLIST_ID)).toBe(false)
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
  act(() => ctx.addLocal(LOCAL_TRACK, DEFAULT_PLAYLIST_ID))

  let ctx2!: ReturnType<typeof usePlaylist>
  setup(c => { ctx2 = c })
  expect(ctx2.playlists[0].items).toHaveLength(1)
})
