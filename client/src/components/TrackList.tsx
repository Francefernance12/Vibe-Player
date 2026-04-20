import { memo } from 'react'
import { Track } from '../types'

interface Props {
  tracks: Track[]
  currentTrack: Track | null
  onSelect: (track: Track) => void
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const TrackList = memo(function TrackList({ tracks, currentTrack, onSelect }: Props) {
  if (tracks.length === 0) {
    return <p className="text-zinc-500 text-sm py-4 text-center">No tracks yet. Upload an audio file to get started.</p>
  }
  return (
    <ul className="divide-y divide-zinc-800">
      {tracks.map(track => {
        const active = track.filename === currentTrack?.filename
        return (
          <li
            key={track.filename}
            onClick={() => onSelect(track)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800 transition-colors ${active ? 'bg-zinc-800' : ''}`}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-indigo-400' : 'bg-zinc-600'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${active ? 'text-indigo-300' : 'text-zinc-100'}`}>
                {track.originalName.replace(/\.[^.]+$/, '')}
              </p>
              <p className="text-xs text-zinc-500">{formatSize(track.size)} · {track.source}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
})
