import { memo } from 'react'
import { Track } from '../types'
import { usePlaylist } from '../contexts/PlaylistContext'

interface Props {
  tracks: Track[]
  currentTrack: Track | null
  onSelect: (track: Track) => void
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const TrackList = memo(function TrackList({ tracks, currentTrack, onSelect }: Props) {
  const { addLocal, items } = usePlaylist()

  if (tracks.length === 0) {
    return <p className="text-zinc-600 text-sm py-6 text-center">No tracks yet. Upload an audio file to get started.</p>
  }
  return (
    <ul className="divide-y divide-[#1e1e21]">
      {tracks.map(track => {
        const active = track.filename === currentTrack?.filename
        const inPlaylist = items.some(i => i.kind === 'local' && i.track.id === track.id)
        return (
          <li key={track.filename} className={`flex items-center gap-3 px-4 py-3 ${active ? 'bg-white/[0.03]' : ''}`}>
            <div
              onClick={() => onSelect(track)}
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${active ? 'bg-orange-500' : 'bg-zinc-700'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate transition-colors ${active ? 'text-orange-300' : 'text-zinc-200'}`}>
                  {track.originalName.replace(/\.[^.]+$/, '')}
                </p>
                <p className="text-xs text-zinc-600 font-mono">{formatSize(track.size)} · {track.source}</p>
              </div>
            </div>
            <button
              onClick={() => addLocal(track)}
              disabled={inPlaylist}
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                inPlaylist
                  ? 'text-orange-400 cursor-default'
                  : 'text-zinc-600 hover:text-orange-400 hover:bg-orange-500/10'
              }`}
              aria-label="Add to playlist"
            >
              {inPlaylist ? (
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5-1-1z" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M8.5 3.5v4h4v1h-4v4h-1v-4h-4v-1h4v-4h1z" />
                </svg>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
})
