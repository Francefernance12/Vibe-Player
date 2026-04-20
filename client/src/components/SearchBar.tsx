import { useState, useEffect, useRef } from 'react'
import { SearchTrack } from '../types'

interface Props {
  onResults: (results: SearchTrack[]) => void
}

export function SearchBar({ onResults }: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { onResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.status === 503) { setError('Spotify not configured'); onResults([]); return }
        if (!res.ok) throw new Error(`Search failed: ${res.statusText}`)
        onResults(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        onResults([])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, onResults])

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search Spotify…"
        aria-label="Search Spotify"
        className="w-full bg-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {loading && (
        <span className="absolute right-3 top-2.5 text-xs text-zinc-500">Searching…</span>
      )}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
