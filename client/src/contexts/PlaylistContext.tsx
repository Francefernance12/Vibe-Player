import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { Track, SearchTrack } from '../types'
import { useAuth } from './AuthContext'

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
  defaultPlaylistId: string
  createPlaylist: (name: string) => string
  addLocal: (track: Track, playlistId: string) => void
  addDeezer: (track: SearchTrack) => void
  removeFromPlaylist: (trackId: string, playlistId: string) => void
  reorderPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => void
  isInPlaylist: (trackId: string, playlistId: string) => boolean
}

export const LOCAL_FAVORITES_ID = 'favorites'
const STORAGE_KEY = 'playlists:v2'

function itemId(item: PlaylistItem): string {
  return item.track.id
}

function defaultPlaylists(): Playlist[] {
  return [{ id: LOCAL_FAVORITES_ID, name: 'Favorites', items: [] }]
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
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists)) } catch { /* quota */ }
}

async function fetchPlaylists(): Promise<Playlist[]> {
  const res = await fetch('/api/playlists', { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch playlists')
  return res.json()
}

async function syncPlaylistTracks(playlistId: string, items: PlaylistItem[]): Promise<void> {
  await fetch(`/api/playlists/${playlistId}/tracks`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })
}

async function createPlaylistApi(name: string, id: string): Promise<{ id: string; name: string }> {
  const res = await fetch('/api/playlists', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, id }),
  })
  return res.json()
}


const PlaylistContext = createContext<PlaylistContextValue | null>(null)

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState<Playlist[]>(loadFromStorage)
  const prevUserIdRef = useRef<string | null>(null)

  // Load from API when user logs in; fall back to localStorage when logged out
  useEffect(() => {
    const prevId = prevUserIdRef.current
    prevUserIdRef.current = user?.id ?? null

    if (user) {
      fetchPlaylists()
        .then(setPlaylists)
        .catch(() => { /* keep current state on fetch failure */ })
    } else if (prevId !== null) {
      // User just logged out — reload from localStorage
      setPlaylists(loadFromStorage())
    }
  }, [user])

  // Persist to localStorage only when NOT logged in
  useEffect(() => {
    if (!user) saveToStorage(playlists)
  }, [playlists, user])

  const defaultPlaylistId = playlists.find(p => p.name === 'Favorites')?.id ?? LOCAL_FAVORITES_ID

  const createPlaylist = useCallback((name: string): string => {
    const id = crypto.randomUUID()
    const trimmed = name.trim() || 'Untitled'
    setPlaylists(prev => [...prev, { id, name: trimmed, items: [] }])
    if (user) createPlaylistApi(trimmed, id).catch(console.error)
    return id
  }, [user])

  const addLocal = useCallback((track: Track, playlistId: string) => {
    setPlaylists(prev => {
      const next = prev.map(p =>
        p.id !== playlistId ? p
        : p.items.some(i => itemId(i) === track.id) ? p
        : { ...p, items: [...p.items, { kind: 'local' as const, track }] }
      )
      if (user) {
        const updated = next.find(p => p.id === playlistId)
        if (updated) syncPlaylistTracks(playlistId, updated.items).catch(console.error)
      }
      return next
    })
  }, [user])

  const addDeezer = useCallback((track: SearchTrack) => {
    setPlaylists(prev => {
      const favId = prev.find(p => p.name === 'Favorites')?.id ?? LOCAL_FAVORITES_ID
      const next = prev.map(p =>
        p.id !== favId ? p
        : p.items.some(i => itemId(i) === track.id) ? p
        : { ...p, items: [...p.items, { kind: 'deezer' as const, track }] }
      )
      if (user) {
        const updated = next.find(p => p.id === favId)
        if (updated) syncPlaylistTracks(favId, updated.items).catch(console.error)
      }
      return next
    })
  }, [user])

  const removeFromPlaylist = useCallback((trackId: string, playlistId: string) => {
    setPlaylists(prev => {
      const next = prev.map(p =>
        p.id !== playlistId ? p
        : { ...p, items: p.items.filter(i => itemId(i) !== trackId) }
      )
      if (user) {
        const updated = next.find(p => p.id === playlistId)
        if (updated) syncPlaylistTracks(playlistId, updated.items).catch(console.error)
      }
      return next
    })
  }, [user])

  const reorderPlaylist = useCallback((playlistId: string, fromIndex: number, toIndex: number) => {
    setPlaylists(prev => {
      const next = prev.map(p => {
        if (p.id !== playlistId) return p
        const items = [...p.items]
        const [moved] = items.splice(fromIndex, 1)
        items.splice(toIndex, 0, moved)
        return { ...p, items }
      })
      if (user) {
        const updated = next.find(p => p.id === playlistId)
        if (updated) syncPlaylistTracks(playlistId, updated.items).catch(console.error)
      }
      return next
    })
  }, [user])

  const isInPlaylist = useCallback((trackId: string, playlistId: string): boolean =>
    playlists.find(p => p.id === playlistId)?.items.some(i => itemId(i) === trackId) ?? false
  , [playlists])

  return (
    <PlaylistContext.Provider value={{
      playlists,
      defaultPlaylistId,
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
