import { memo, useState } from 'react'
import { Track } from '../types'
import { usePlaylist } from '../contexts/PlaylistContext'

interface Props {
  tracks: Track[]
  currentTrack: Track | null
  onSelect: (track: Track) => void
  onDelete: (track: Track) => void
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5-1-1z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M8.5 3.5v4h4v1h-4v4h-1v-4h-4v-1h4v-4h1z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M6 2a1 1 0 0 0-1 1v.5H2.5v1H4v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-8h1.5v-1H11V3a1 1 0 0 0-1-1H6zm0 1h4v.5H6V3zm-1 2h6v7.5H5V5zm2 1.5v4h1v-4H7zm2 0v4h1v-4H9z" />
    </svg>
  )
}

export const TrackList = memo(function TrackList({ tracks, currentTrack, onSelect, onDelete }: Props) {
  const { playlists, addLocal, isInPlaylist } = usePlaylist()
  const [openPickerId, setOpenPickerId] = useState<string | null>(null)

  const inAnyPlaylist = (trackId: string) => playlists.some(p => isInPlaylist(trackId, p.id))

  if (tracks.length === 0) {
    return <p className="text-zinc-600 text-sm py-6 text-center">No tracks yet. Upload an audio file to get started.</p>
  }

  return (
    <ul className="divide-y divide-[#1e1e21]">
      {tracks.map(track => {
        const active = track.filename === currentTrack?.filename
        const pickerOpen = openPickerId === track.id
        const inAny = inAnyPlaylist(track.id)

        return (
          <li key={track.filename} className={`${active ? 'bg-white/[0.03]' : ''}`}>
            <div className="flex items-center gap-3 px-4 py-3">
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
                onClick={() => setOpenPickerId(pickerOpen ? null : track.id)}
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  inAny
                    ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
                    : 'text-zinc-600 hover:text-orange-400 hover:bg-orange-500/10'
                }`}
                aria-label="Add to playlist"
              >
                {inAny ? <CheckIcon /> : <PlusIcon />}
              </button>
              <button
                onClick={() => onDelete(track)}
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-zinc-700 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                aria-label="Delete track"
              >
                <TrashIcon />
              </button>
            </div>

            {/* Inline playlist picker */}
            <div className={`grid transition-[grid-template-rows] duration-150 ease-in-out ${pickerOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <ul className="px-4 pb-2 flex flex-col gap-1">
                  {playlists.map(playlist => {
                    const already = isInPlaylist(track.id, playlist.id)
                    return (
                      <li key={playlist.id}>
                        <button
                          onClick={() => {
                            if (!already) addLocal(track, playlist.id)
                          }}
                          disabled={already}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            already
                              ? 'text-orange-400 bg-orange-500/5 cursor-default'
                              : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 flex-shrink-0 ${already ? 'text-orange-400' : 'text-transparent'}`}>
                            <CheckIcon />
                          </span>
                          <span className="font-mono truncate">{playlist.name}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
})
