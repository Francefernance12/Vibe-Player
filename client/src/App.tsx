import { useState, useEffect, useCallback, useMemo } from 'react'
import { Track, SearchTrack } from './types'
import { usePlayer } from './hooks/usePlayer'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PlaylistProvider } from './contexts/PlaylistContext'
import { PlaylistItem } from './contexts/PlaylistContext'
import { TrackList } from './components/TrackList'
import { PlayerControls } from './components/PlayerControls'
import { ProgressBar } from './components/ProgressBar'
import { VolumeControl } from './components/VolumeControl'
import { FileUpload } from './components/FileUpload'
import { SearchBar } from './components/SearchBar'
import { SearchResults } from './components/SearchResults'
import { PlaylistPanel } from './components/PlaylistPanel'
import { LoginPage } from './components/LoginPage'
import { RegisterPage } from './components/RegisterPage'
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

function Player() {
  const { user, logout } = useAuth()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<SearchTrack[]>([])
  const [filterText, setFilterText] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('default')
  const [searching, setSearching] = useState(false)

  const player = usePlayer(tracks)

  useEffect(() => {
    fetch('/api/tracks')
      .then(r => r.json())
      .then((data: Track[]) => setTracks(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleUploaded = useCallback((track: Track) => {
    setTracks(prev => [...prev, track])
  }, [])

  const handleSelect = useCallback((track: Track) => { player.play(track) }, [player])

  const handleSearchSelect = useCallback((result: SearchTrack) => {
    if (!result.previewUrl) return
    player.play(makeSyntheticTrack(result))
  }, [player])

  const handlePlaylistPlay = useCallback((item: PlaylistItem) => {
    if (item.kind === 'local') {
      player.play(item.track)
    } else {
      if (!item.track.previewUrl) return
      player.play(makeSyntheticTrack(item.track))
    }
  }, [player])

  const handleAddDeezerToTracks = useCallback((result: SearchTrack) => {
    const track = makeSyntheticTrack(result)
    setTracks(prev => prev.some(t => t.id === track.id) ? prev : [...prev, track])
  }, [])

  const handleDeleteTrack = useCallback(async (track: Track) => {
    if (track.source === 'upload') {
      await fetch(`/api/tracks/${encodeURIComponent(track.filename)}`, { method: 'DELETE' })
    }
    setTracks(prev => prev.filter(t => t.filename !== track.filename))
    if (player.currentTrack?.filename === track.filename) player.stop()
  }, [player])

  const visibleTracks = useMemo(
    () => filterAndSortTracks(tracks, filterText, sortOption),
    [tracks, filterText, sortOption]
  )

  const nowPlayingName = player.currentTrack
    ? player.currentTrack.originalName.replace(/\.[^.]+$/, '')
    : null

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex flex-col items-center justify-start py-10 px-4">
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

        {/* Search */}
        <div className="relative">
          <SearchBar onResults={setSearchResults} onSearching={setSearching} />
          <SearchResults results={searchResults} tracks={tracks} loading={searching} onSelect={handleSearchSelect} onAddToTracks={handleAddDeezerToTracks} />
        </div>

        <PlaylistPanel onPlay={handlePlaylistPlay} currentTrack={player.currentTrack} />

        <FileUpload onUploaded={handleUploaded} />

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
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
              className="bg-transparent text-xs text-zinc-500 outline-none cursor-pointer hover:text-zinc-300 transition-colors"
              aria-label="Sort tracks"
            >
              <option value="default">Default</option>
              <option value="az">A–Z</option>
              <option value="za">Z–A</option>
              <option value="sizeAsc">Size ↑</option>
              <option value="sizeDesc">Size ↓</option>
              <option value="source">Source</option>
            </select>
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

        {/* Player */}
        <div className="bg-[#111113] border border-[#1e1e21] rounded-2xl p-4 flex flex-col gap-3">
          <div className="min-h-[1.25rem]">
            {nowPlayingName ? (
              <p className="text-sm font-medium text-zinc-100 truncate">{nowPlayingName}</p>
            ) : (
              <p className="text-sm text-zinc-600">Select a track to play</p>
            )}
          </div>
          <ProgressBar
            isPlaying={player.isPlaying}
            getDuration={player.getDuration}
            getSeek={player.getSeek}
            onSeek={player.seek}
          />
          <div className="flex items-center justify-between">
            <PlayerControls
              isPlaying={player.isPlaying}
              hasTrack={player.currentTrack !== null}
              onPlay={player.resume}
              onPause={player.pause}
              onNext={player.next}
              onPrev={player.prev}
            />
            <VolumeControl volume={player.volume} onVolumeChange={player.setVolume} />
          </div>
        </div>

      </div>
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
