import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { Track, SearchTrack } from '../types'

export type PlaylistItem =
  | { kind: 'local'; track: Track }
  | { kind: 'deezer'; track: SearchTrack }

export interface Playlist {
  id: string
  name: string
  items: PlaylistItem[]
}

interface PlaylistContextValue {
  playlists: Playlist[]
  createPlaylist: (name: string) => string
  addLocal: (track: Track, playlistId: string) => void
  addDeezer: (track: SearchTrack) => void
  removeFromPlaylist: (trackId: string, playlistId: string) => void
  reorderPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => void
  isInPlaylist: (trackId: string, playlistId: string) => boolean
}

export const DEFAULT_PLAYLIST_ID = 'favorites'
const STORAGE_KEY = 'playlists:v2'

function itemId(item: PlaylistItem): string {
  return item.track.id
}

function defaultPlaylists(): Playlist[] {
  return [{ id: DEFAULT_PLAYLIST_ID, name: 'Favorites', items: [] }]
}

function loadFromStorage(): Playlist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPlaylists()
    return JSON.parse(raw) as Playlist[]
  } catch {
    return defaultPlaylists()
  }
}

function saveToStorage(playlists: Playlist[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists))
  } catch { /* quota exceeded */ }
}

const PlaylistContext = createContext<PlaylistContextValue | null>(null)

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>(loadFromStorage)

  useEffect(() => { saveToStorage(playlists) }, [playlists])

  const createPlaylist = useCallback((name: string): string => {
    const id = crypto.randomUUID()
    setPlaylists(prev => [...prev, { id, name: name.trim() || 'Untitled', items: [] }])
    return id
  }, [])

  const addLocal = useCallback((track: Track, playlistId: string) => {
    setPlaylists(prev => prev.map(p =>
      p.id !== playlistId ? p
      : p.items.some(i => itemId(i) === track.id) ? p
      : { ...p, items: [...p.items, { kind: 'local' as const, track }] }
    ))
  }, [])

  const addDeezer = useCallback((track: SearchTrack) => {
    setPlaylists(prev => prev.map(p =>
      p.id !== DEFAULT_PLAYLIST_ID ? p
      : p.items.some(i => itemId(i) === track.id) ? p
      : { ...p, items: [...p.items, { kind: 'deezer' as const, track }] }
    ))
  }, [])

  const removeFromPlaylist = useCallback((trackId: string, playlistId: string) => {
    setPlaylists(prev => prev.map(p =>
      p.id !== playlistId ? p
      : { ...p, items: p.items.filter(i => itemId(i) !== trackId) }
    ))
  }, [])

  const reorderPlaylist = useCallback((playlistId: string, fromIndex: number, toIndex: number) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p
      const next = [...p.items]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return { ...p, items: next }
    }))
  }, [])

  const isInPlaylist = useCallback((trackId: string, playlistId: string): boolean => {
    return playlists.find(p => p.id === playlistId)
      ?.items.some(i => itemId(i) === trackId) ?? false
  }, [playlists])

  return (
    <PlaylistContext.Provider value={{
      playlists,
      createPlaylist,
      addLocal,
      addDeezer,
      removeFromPlaylist,
      reorderPlaylist,
      isInPlaylist,
    }}>
      {children}
    </PlaylistContext.Provider>
  )
}

export function usePlaylist() {
  const ctx = useContext(PlaylistContext)
  if (!ctx) throw new Error('usePlaylist must be used inside PlaylistProvider')
  return ctx
}
