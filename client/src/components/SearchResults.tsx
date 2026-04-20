import { memo } from 'react'
import { SearchTrack } from '../types'

interface Props {
  results: SearchTrack[]
  onSelect: (track: SearchTrack) => void
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const SearchResults = memo(function SearchResults({ results, onSelect }: Props) {
  if (results.length === 0) return null
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden">
      <p className="text-xs text-zinc-500 px-4 pt-3 pb-1">Spotify results</p>
      <ul className="divide-y divide-zinc-800">
        {results.map(t => (
          <li
            key={t.id}
            onClick={() => onSelect(t)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{t.name}</p>
              <p className="text-xs text-zinc-500 truncate">{t.artist} · {t.album}</p>
            </div>
            <span className="text-xs text-zinc-600 tabular-nums">{fmt(t.durationMs)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
})
