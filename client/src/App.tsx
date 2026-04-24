import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Track, SearchTrack } from './types'
import { usePlayer } from './hooks/usePlayer'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PlaylistProvider, usePlaylist } from './contexts/PlaylistContext'
import { PlaylistItem } from './contexts/PlaylistContext'
import { ChatAction } from './hooks/useChat'
import { TrackList } from './components/TrackList'
import { FileUpload } from './components/FileUpload'
import { SearchBar } from './components/SearchBar'
import { SearchResults } from './components/SearchResults'
import { PlaylistPanel } from './components/PlaylistPanel'
import { PlayerBar } from './components/PlayerBar'
import { LoginPage } from './components/LoginPage'
import { RegisterPage } from './components/RegisterPage'
import { ChatBubble } from './components/ChatBubble'
import { ChatWindow } from './components/ChatWindow'
import { StorageBar } from './components/StorageBar'
import { useQuota } from './hooks/useQuota'
import { filterAndSortTracks, SortOption } from './utils/trackFilter'

function makeSyntheticTrack(result: SearchTrack): Track {
  return {
    id: result.id,
    filename: result.previewUrl ?? result.id,
    originalName: `${result.title} — ${result.artist}`,
    mimeType: 'audio/mpeg',
    size: 0,
    source: 'deezer',
    externalUrl: result.previewUrl ?? undefined,
  }
}


function TrackListSkeleton() {
  return (
    <ul className="divide-y divide-[#1e1e21]">
      {[0, 1, 2, 3].map(i => (
        <li key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 flex-shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="h-3 bg-zinc-800 rounded w-3/5" />
            <div className="h-2.5 bg-zinc-800/60 rounded w-1/4" />
          </div>
        </li>
      ))}
    </ul>
  )
}

const SORT_LABELS: Record<SortOption, string> = {
  default: 'Default',
  az: 'A–Z',
  za: 'Z–A',
  sizeAsc: 'Size ↑',
  sizeDesc: 'Size ↓',
  source: 'Source',
}

function SortSelect({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        aria-label="Sort tracks"
      >
        {SORT_LABELS[value]}
        <svg viewBox="0 0 16 16" fill="currentColor" className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <path d="M4 6l4 4 4-4H4z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-[#111113] border border-[#1e1e21] rounded-xl overflow-hidden shadow-xl shadow-black/60 min-w-[5.5rem]">
          {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                value === opt
                  ? 'text-orange-400 bg-orange-500/10'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.05]'
              }`}
            >
              {SORT_LABELS[opt]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Player() {
  const { user, logout } = useAuth()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<SearchTrack[]>([])
  const [filterText, setFilterText] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('default')
  const [searching, setSearching] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'library' | 'playlists'>('library')
  const { quota, refresh: refreshQuota } = useQuota()
  const { playlists, addLocal, defaultPlaylistId } = usePlaylist()
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const player = usePlayer(tracks)

  useEffect(() => {
    fetch('/api/tracks')
      .then(r => r.json())
      .then((data: Track[]) => setTracks(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const visibleTracks = useMemo(
    () => filterAndSortTracks(tracks, filterText, sortOption),
    [tracks, filterText, sortOption]
  )

  const handleUploaded = useCallback((track: Track) => {
    setTracks(prev => [...prev, track])
    refreshQuota()
  }, [refreshQuota])

  const handleSelect = useCallback((track: Track) => {
    player.play(track, visibleTracks)
  }, [player, visibleTracks])

  const handleSearchSelect = useCallback((result: SearchTrack) => {
    if (!result.previewUrl) return
    player.play(makeSyntheticTrack(result))
  }, [player])

  const handlePlaylistPlay = useCallback((item: PlaylistItem, playlistItems: PlaylistItem[]) => {
    const queue = playlistItems.flatMap(i => {
      if (i.kind === 'local') return [i.track]
      return i.track.previewUrl ? [makeSyntheticTrack(i.track)] : []
    })
    if (item.kind === 'local') {
      player.play(item.track, queue)
    } else {
      if (!item.track.previewUrl) return
      player.play(makeSyntheticTrack(item.track), queue)
    }
  }, [player])

  const handleAddDeezerToTracks = useCallback((result: SearchTrack) => {
    const track = makeSyntheticTrack(result)
    setTracks(prev => prev.some(t => t.id === track.id) ? prev : [...prev, track])
  }, [])

  const handleDeleteTrack = useCallback(async (track: Track) => {
    if (track.source === 'upload') {
      await fetch(`/api/tracks/${encodeURIComponent(track.id)}`, { method: 'DELETE' })
      refreshQuota()
    }
    setTracks(prev => prev.filter(t => t.filename !== track.filename))
    if (player.currentTrack?.filename === track.filename) player.stop()
  }, [player, refreshQuota])

  const library = useMemo(
    () => tracks.map(t => ({ id: t.id, name: t.originalName.replace(/\.[^.]+$/, '') })).slice(0, 40),
    [tracks]
  )

  const playlistSummaries = useMemo(
    () => playlists.map(p => ({ id: p.id, name: p.name })),
    [playlists]
  )

  const handleChatAction = useCallback((action: ChatAction): string | void => {
    if (action.type === 'play') {
      const track = tracks.find(t => t.id === action.trackId)
      if (track) {
        player.play(track)
        return `Playing "${track.originalName.replace(/\.[^.]+$/, '')}".`
      }
      return 'Track not found in your library.'
    } else if (action.type === 'search') {
      if (!action.query) return
      fetch(`/api/search?q=${encodeURIComponent(action.query)}`)
        .then(r => r.json())
        .then((data: SearchTrack[]) => { if (Array.isArray(data)) setSearchResults(data) })
        .catch(console.error)
      return `Searching for "${action.query}"…`
    } else if (action.type === 'add_to_playlist') {
      const track = tracks.find(t => t.id === action.trackId)
      if (track) {
        const targetId = action.playlistId ?? defaultPlaylistId
        const playlist = playlists.find(p => p.id === targetId)
        addLocal(track, targetId)
        return `Added to "${playlist?.name ?? 'your playlist'}".`
      }
      return 'Track not found in your library.'
    }
  }, [tracks, player, addLocal, defaultPlaylistId, playlists])

  const nowPlayingName = player.currentTrack
    ? player.currentTrack.originalName.replace(/\.[^.]+$/, '')
    : null

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex flex-col items-center justify-start py-10 px-4 pb-28">
      <PlayerBar
        nowPlayingName={nowPlayingName}
        isPlaying={player.isPlaying}
        hasTrack={player.currentTrack !== null}
        onPlay={player.resume}
        onPause={player.pause}
        onNext={player.next}
        onPrev={player.prev}
        getDuration={player.getDuration}
        getSeek={player.getSeek}
        onSeek={player.seek}
        shuffle={player.shuffle}
        loopMode={player.loopMode}
        onToggleShuffle={player.toggleShuffle}
        onCycleLoop={player.cycleLoop}
        volume={player.volume}
        onVolumeChange={player.setVolume}
      />
      <div className="w-full max-w-md flex flex-col gap-3">

        {/* Wordmark + user */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
            <h1 className="font-display text-xl font-bold tracking-tight text-zinc-50">Vibe Player</h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-600 truncate max-w-[140px]">{user.email}</span>
              <button
                onClick={logout}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-5 border-b border-[#1e1e21]">
          {(['library', 'playlists'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[10px] font-mono uppercase tracking-widest pb-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-zinc-200 border-orange-500'
                  : 'text-zinc-600 border-transparent hover:text-zinc-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Library tab */}
        {activeTab === 'library' && (
          <>
            {/* Search */}
            <div
              className="relative"
              ref={searchContainerRef}
              onKeyDown={e => { if (e.key === 'Escape') setSearchResults([]) }}
            >
              <SearchBar onResults={setSearchResults} onSearching={setSearching} />
              <SearchResults results={searchResults} tracks={tracks} loading={searching} onSelect={handleSearchSelect} onAddToTracks={handleAddDeezerToTracks} />
            </div>

            <FileUpload onUploaded={handleUploaded} />

            {quota && <StorageBar used={quota.used} limit={quota.limit} tier={quota.tier} />}

            {/* Track list */}
            <div className="bg-[#111113] border border-[#1e1e21] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-[#1e1e21]">
                <input
                  type="text"
                  placeholder="Filter tracks…"
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
                />
                <SortSelect value={sortOption} onChange={setSortOption} />
              </div>
              {loading ? (
                <TrackListSkeleton />
              ) : (
                <TrackList
                  tracks={visibleTracks}
                  currentTrack={player.currentTrack}
                  onSelect={handleSelect}
                  onDelete={handleDeleteTrack}
                />
              )}
            </div>
          </>
        )}

        {/* Playlists tab */}
        {activeTab === 'playlists' && (
          <PlaylistPanel onPlay={handlePlaylistPlay} currentTrack={player.currentTrack} />
        )}

      </div>

      <ChatBubble isOpen={isChatOpen} onToggle={() => setIsChatOpen(o => !o)} />
      <ChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        trackName={nowPlayingName}
        library={library}
        playlists={playlistSummaries}
        onAction={handleChatAction}
      />
    </div>
  )
}

function AuthGate() {
  const { user, loading } = useAuth()
  const [showRegister, setShowRegister] = useState(false)

  // Reset to login page whenever the user logs out
  useEffect(() => {
    if (!user && !loading) setShowRegister(false)
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <span className="text-zinc-600 text-sm">Loading…</span>
      </div>
    )
  }

  if (!user) {
    return showRegister
      ? <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />
      : <LoginPage onSwitchToRegister={() => setShowRegister(true)} />
  }

  return (
    <PlaylistProvider>
      <Player />
    </PlaylistProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}
