import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { Track, SearchTrack } from '../types'

export type PlaylistItem =
  | { kind: 'local'; track: Track }
  | { kind: 'deezer'; track: SearchTrack }

interface PlaylistContextValue {
  items: PlaylistItem[]
  addLocal: (track: Track) => void
  addDeezer: (track: SearchTrack) => void
  remove: (id: string) => void
  reorder: (fromIndex: number, toIndex: number) => void
}

const PlaylistContext = createContext<PlaylistContextValue | null>(null)

const STORAGE_KEY = 'playlist:v1'

function loadFromStorage(): PlaylistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PlaylistItem[]
  } catch {
    return []
  }
}

function saveToStorage(items: PlaylistItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // storage quota exceeded — fail silently
  }
}

function itemId(item: PlaylistItem) {
  return item.kind === 'local' ? item.track.id : item.track.id
}

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PlaylistItem[]>(loadFromStorage)

  useEffect(() => { saveToStorage(items) }, [items])

  const addLocal = useCallback((track: Track) => {
    setItems(prev => prev.some(i => itemId(i) === track.id) ? prev : [...prev, { kind: 'local', track }])
  }, [])

  const addDeezer = useCallback((track: SearchTrack) => {
    setItems(prev => prev.some(i => itemId(i) === track.id) ? prev : [...prev, { kind: 'deezer', track }])
  }, [])

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(i => itemId(i) !== id))
  }, [])

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setItems(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  return (
    <PlaylistContext.Provider value={{ items, addLocal, addDeezer, remove, reorder }}>
      {children}
    </PlaylistContext.Provider>
  )
}

export function usePlaylist() {
  const ctx = useContext(PlaylistContext)
  if (!ctx) throw new Error('usePlaylist must be used inside PlaylistProvider')
  return ctx
}
