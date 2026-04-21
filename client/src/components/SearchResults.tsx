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
    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#111113] border border-[#1e1e21] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
      <p className="text-[10px] uppercase tracking-widest text-zinc-600 px-4 pt-3 pb-1.5 font-mono">Deezer</p>
      <ul className="divide-y divide-[#1e1e21] max-h-72 overflow-y-auto">
        {results.map(t => {
          const inPlaylist = items.some(i => i.kind === 'deezer' && i.track.id === t.id)
          return (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
              <div
                onClick={() => onSelect(t)}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              >
                {t.albumArt ? (
                  <img src={t.albumArt} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-zinc-800 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">{t.title}</p>
                  <p className="text-xs text-zinc-500 truncate">{t.artist}</p>
                </div>
                <span className="font-mono text-xs text-zinc-600">{fmt(t.durationMs)}</span>
              </div>
              <button
                onClick={() => addDeezer(t)}
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
    </div>
  )
})
