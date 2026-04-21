import { render, act } from '@testing-library/react'
import { PlaylistProvider, usePlaylist } from '../contexts/PlaylistContext'
import { Track, SearchTrack } from '../types'

const LOCAL_TRACK: Track = { id: 't1', filename: 'a.mp3', originalName: 'Alpha.mp3', mimeType: 'audio/mpeg', size: 1000, source: 'sample' }
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

test('starts empty', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  expect(ctx.items).toHaveLength(0)
})

test('addLocal adds a local track', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => ctx.addLocal(LOCAL_TRACK))
  expect(ctx.items).toHaveLength(1)
  expect(ctx.items[0].kind).toBe('local')
})

test('addLocal does not duplicate', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => { ctx.addLocal(LOCAL_TRACK); ctx.addLocal(LOCAL_TRACK) })
  expect(ctx.items).toHaveLength(1)
})

test('addDeezer adds a Deezer track', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => ctx.addDeezer(DEEZER_TRACK))
  expect(ctx.items).toHaveLength(1)
  expect(ctx.items[0].kind).toBe('deezer')
})

test('remove removes by id', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => ctx.addLocal(LOCAL_TRACK))
  act(() => ctx.remove('t1'))
  expect(ctx.items).toHaveLength(0)
})

test('reorder moves item to new index', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  const TRACK2: Track = { ...LOCAL_TRACK, id: 't2', filename: 'b.mp3', originalName: 'Beta.mp3' }
  setup(c => { ctx = c })
  act(() => { ctx.addLocal(LOCAL_TRACK); ctx.addLocal(TRACK2) })
  act(() => ctx.reorder(0, 1))
  expect(ctx.items[0].track.id).toBe('t2')
  expect(ctx.items[1].track.id).toBe('t1')
})

test('persists to localStorage and reloads', () => {
  let ctx!: ReturnType<typeof usePlaylist>
  setup(c => { ctx = c })
  act(() => ctx.addLocal(LOCAL_TRACK))

  // Second mount reads from storage
  let ctx2!: ReturnType<typeof usePlaylist>
  setup(c => { ctx2 = c })
  expect(ctx2.items).toHaveLength(1)
})
