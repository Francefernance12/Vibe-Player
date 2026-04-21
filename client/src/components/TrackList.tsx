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
    return <p className="text-zinc-500 text-sm py-4 text-center">No tracks yet. Upload an audio file to get started.</p>
  }
  return (
    <ul className="divide-y divide-zinc-800">
      {tracks.map(track => {
        const active = track.filename === currentTrack?.filename
        const inPlaylist = items.some(i => i.kind === 'local' && i.track.id === track.id)
        return (
          <li
            key={track.filename}
            className={`flex items-center gap-3 px-4 py-3 ${active ? 'bg-zinc-800' : ''}`}
          >
            <div
              onClick={() => onSelect(track)}
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:bg-zinc-800 transition-colors -mx-4 px-4 -my-3 py-3"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-indigo-400' : 'bg-zinc-600'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${active ? 'text-indigo-300' : 'text-zinc-100'}`}>
                  {track.originalName.replace(/\.[^.]+$/, '')}
                </p>
                <p className="text-xs text-zinc-500">{formatSize(track.size)} · {track.source}</p>
              </div>
            </div>
            <button
              onClick={() => addLocal(track)}
              disabled={inPlaylist}
              className={`text-xs px-2 py-1 rounded transition-colors flex-shrink-0 ${inPlaylist ? 'text-zinc-600 cursor-default' : 'text-zinc-400 hover:text-indigo-400'}`}
              aria-label="Add to playlist"
            >
              {inPlaylist ? '✓' : '+'}
            </button>
          </li>
        )
      })}
    </ul>
  )
})
