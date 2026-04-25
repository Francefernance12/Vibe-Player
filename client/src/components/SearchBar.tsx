import { useState, useEffect, useRef } from 'react'
import { SearchTrack } from '../types'

interface Props {
  onResults: (results: SearchTrack[]) => void
  onSearching?: (loading: boolean) => void
}

export function SearchBar({ onResults, onSearching }: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { onResults([]); setError(null); onSearching?.(false); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      onSearching?.(true)
      setError(null)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.error ?? `Search failed: ${res.status}`)
        }
        onResults(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        onResults([])
      } finally {
        setLoading(false)
        onSearching?.(false)
      }
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, onResults, onSearching])

  return (
    <div>
      <div className="relative">
        <svg
          viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none"
        >
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="M13 13l3.5 3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search Deezer…"
          aria-label="Search Deezer"
          className="w-full bg-[#111113] border border-[#1e1e21] text-zinc-100 placeholder-zinc-600 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-colors"
        />
        {loading && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-zinc-600 border-t-orange-400 rounded-full animate-spin" />
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-1.5 px-1">{error}</p>}
    </div>
  )
}
