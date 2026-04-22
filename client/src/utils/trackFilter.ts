import { Track } from '../types'

export type SortOption = 'default' | 'az' | 'za' | 'sizeAsc' | 'sizeDesc' | 'source'

export function filterAndSortTracks(tracks: Track[], filter: string, sort: SortOption): Track[] {
  const q = filter.trim().toLowerCase()
  const filtered = q
    ? tracks.filter(t => t.originalName.toLowerCase().includes(q))
    : tracks
  if (sort === 'default') return filtered
  return [...filtered].sort((a, b) => {
    switch (sort) {
      case 'az':      return a.originalName.localeCompare(b.originalName)
      case 'za':      return b.originalName.localeCompare(a.originalName)
      case 'sizeAsc': return a.size - b.size
      case 'sizeDesc':return b.size - a.size
      case 'source':  return a.source === 'sample' ? -1 : b.source === 'sample' ? 1 : 0
      default:        return 0
    }
  })
}
