import { memo } from 'react'
import { SearchTrack } from '../types'
import { usePlaylist } from '../contexts/PlaylistContext'

interface Props {
  results: SearchTrack[]
  onSelect: (track: SearchTrack) => void
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const SearchResults = memo(function SearchResults({ results, onSelect }: Props) {
  const { addDeezer, items } = usePlaylist()

  if (results.length === 0) return null
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden">
      <p className="text-xs text-zinc-500 px-4 pt-3 pb-1">Deezer results</p>
      <ul className="divide-y divide-zinc-800">
        {results.map(t => {
          const inPlaylist = items.some(i => i.kind === 'deezer' && i.track.id === t.id)
          return (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <div
                onClick={() => onSelect(t)}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              >
                {t.albumArt ? (
                  <img src={t.albumArt} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded bg-zinc-700 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">{t.title}</p>
                  <p className="text-xs text-zinc-500 truncate">{t.artist}</p>
                </div>
                <span className="text-xs text-zinc-600 tabular-nums">{fmt(t.durationMs)}</span>
              </div>
              <button
                onClick={() => addDeezer(t)}
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
    </div>
  )
})
