import { useState, useEffect, useCallback } from 'react'
import { Track, SearchTrack } from './types'
import { usePlayer } from './hooks/usePlayer'
import { TrackList } from './components/TrackList'
import { PlayerControls } from './components/PlayerControls'
import { ProgressBar } from './components/ProgressBar'
import { VolumeControl } from './components/VolumeControl'
import { FileUpload } from './components/FileUpload'
import { SearchBar } from './components/SearchBar'
import { SearchResults } from './components/SearchResults'

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<SearchTrack[]>([])

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

  const handleSelect = useCallback((track: Track) => {
    player.play(track)
  }, [player])

  const handleSearchSelect = useCallback((result: SearchTrack) => {
    if (!result.previewUrl) return
    const synthetic: Track = {
      id: result.id,
      filename: result.previewUrl,
      originalName: `${result.title} — ${result.artist}`,
      mimeType: 'audio/mpeg',
      size: 0,
      source: 'upload',
    }
    player.play(synthetic)
  }, [player])

  const nowPlayingName = player.currentTrack
    ? player.currentTrack.originalName.replace(/\.[^.]+$/, '')
    : null

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-md flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Vibe Player</h1>

        <SearchBar onResults={setSearchResults} />
        <SearchResults results={searchResults} onSelect={handleSearchSelect} />

        <FileUpload onUploaded={handleUploaded} />

        <div className="bg-zinc-900 rounded-2xl overflow-hidden">
          {loading ? (
            <p className="text-zinc-500 text-sm p-4 text-center">Loading tracks…</p>
          ) : (
            <TrackList
              tracks={tracks}
              currentTrack={player.currentTrack}
              onSelect={handleSelect}
            />
          )}
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 flex flex-col gap-3">
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
