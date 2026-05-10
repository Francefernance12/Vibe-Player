import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { Track, SearchTrack } from '../types'
import { useAuth } from './AuthContext'
import { useNotify } from './NotificationContext'
import { apiFetch, isDbUnavailable } from '../utils/api'

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
  removeTrackFromAllPlaylists: (trackId: string) => void
  reorderPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => void
  isInPlaylist: (trackId: string, playlistId: string) => boolean
}

export const LOCAL_FAVORITES_ID = 'favorites'
const STORAGE_KEY = 'playlists:v2'
const REORDER_DEBOUNCE_MS = 400

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
  const res = await apiFetch('/api/playlists')
  if (!res.ok) throw new Error('Failed to fetch playlists')
  return res.json()
}

async function syncPlaylistTracks(playlistId: string, items: PlaylistItem[]): Promise<void> {
  const res = await apiFetch(`/api/playlists/${playlistId}/tracks`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })
  if (!res.ok) throw new Error(`Failed to sync playlist tracks (status ${res.status})`)
}

async function createPlaylistApi(name: string, id: string): Promise<{ id: string; name: string }> {
  const res = await apiFetch('/api/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, id }),
  })
  return res.json()
}


const PlaylistContext = createContext<PlaylistContextValue | null>(null)

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const notify = useNotify()
  const [playlists, setPlaylists] = useState<Playlist[]>(loadFromStorage)
  const prevUserIdRef = useRef<string | null>(null)
  const reorderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Surface DB outages as a single coalesced toast; log the rest. Defined inside the
  // provider so it captures the latest `notify` from context.
  const handleSyncError = useCallback((err: unknown) => {
    if (isDbUnavailable(err)) {
      notify({ type: 'error', message: err.message })
    } else {
      console.error(err)
      notify({ type: 'error', message: 'Could not save your playlist changes. Please try again.' })
    }
  }, [notify])

  // Load from API when user logs in; fall back to localStorage when logged out
  useEffect(() => {
    const prevId = prevUserIdRef.current
    prevUserIdRef.current = user?.id ?? null

    if (user) {
      fetchPlaylists()
        .then(setPlaylists)
        .catch(err => {
          if (isDbUnavailable(err)) notify({ type: 'error', message: err.message })
          // else: keep current state silently — could be 401 on first paint
        })
    } else if (prevId !== null) {
      // User just logged out — reload from localStorage
      setPlaylists(loadFromStorage())
    }
  }, [user, notify])

  // Persist to localStorage only when NOT logged in
  useEffect(() => {
    if (!user) saveToStorage(playlists)
  }, [playlists, user])

  const defaultPlaylistId = playlists.find(p => p.name === 'Favorites')?.id ?? LOCAL_FAVORITES_ID

  const createPlaylist = useCallback((name: string): string => {
    const id = crypto.randomUUID()
    const trimmed = name.trim() || 'Untitled'
    setPlaylists(prev => [...prev, { id, name: trimmed, items: [] }])
    if (user) createPlaylistApi(trimmed, id).catch(handleSyncError)
    return id
  }, [user, handleSyncError])

  const addLocal = useCallback((track: Track, playlistId: string) => {
    setPlaylists(prev => {
      const next = prev.map(p =>
        p.id !== playlistId ? p
        : p.items.some(i => itemId(i) === track.id) ? p
        : { ...p, items: [...p.items, { kind: 'local' as const, track }] }
      )
      if (user) {
        const updated = next.find(p => p.id === playlistId)
        if (updated) syncPlaylistTracks(playlistId, updated.items).catch(handleSyncError)
      }
      return next
    })
  }, [user, handleSyncError])

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
        if (updated) syncPlaylistTracks(favId, updated.items).catch(handleSyncError)
      }
      return next
    })
  }, [user, handleSyncError])

  const removeFromPlaylist = useCallback((trackId: string, playlistId: string) => {
    setPlaylists(prev => {
      const next = prev.map(p =>
        p.id !== playlistId ? p
        : { ...p, items: p.items.filter(i => itemId(i) !== trackId) }
      )
      if (user) {
        const updated = next.find(p => p.id === playlistId)
        if (updated) syncPlaylistTracks(playlistId, updated.items).catch(handleSyncError)
      }
      return next
    })
  }, [user, handleSyncError])

  const reorderPlaylist = useCallback((playlistId: string, fromIndex: number, toIndex: number) => {
    let reordered: PlaylistItem[] | null = null
    setPlaylists(prev => {
      const next = prev.map(p => {
        if (p.id !== playlistId) return p
        const items = [...p.items]
        const [moved] = items.splice(fromIndex, 1)
        items.splice(toIndex, 0, moved)
        reordered = items
        return { ...p, items }
      })
      return next
    })
    if (user && reordered) {
      if (reorderDebounceRef.current) clearTimeout(reorderDebounceRef.current)
      const snapshot = reordered
      reorderDebounceRef.current = setTimeout(() => {
        syncPlaylistTracks(playlistId, snapshot).catch(handleSyncError)
      }, REORDER_DEBOUNCE_MS)
    }
  }, [user, handleSyncError])

  const removeTrackFromAllPlaylists = useCallback((trackId: string) => {
    setPlaylists(prev => {
      const next = prev.map(p => ({ ...p, items: p.items.filter(i => itemId(i) !== trackId) }))
      if (user) {
        next.forEach((p, i) => {
          if (p.items.length !== prev[i].items.length) {
            syncPlaylistTracks(p.id, p.items).catch(handleSyncError)
          }
        })
      }
      return next
    })
  }, [user, handleSyncError])

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
      removeTrackFromAllPlaylists,
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
