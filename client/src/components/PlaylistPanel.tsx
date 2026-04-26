import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Track } from '../types'
import { usePlaylist, PlaylistItem, Playlist } from '../contexts/PlaylistContext'
import { Tooltip, TrackInfoCard, SearchTrackInfoCard } from './Tooltip'

type SortOption = 'default' | 'az' | 'za'

interface Props {
  onPlay: (item: PlaylistItem, playlistItems: PlaylistItem[]) => void
  currentTrack: Track | null
}

function itemId(item: PlaylistItem) { return item.track.id }

function itemLabel(item: PlaylistItem) {
  if (item.kind === 'local') return item.track.originalName.replace(/\.[^.]+$/, '')
  return item.track.title
}

function itemSubLabel(item: PlaylistItem) {
  if (item.kind === 'local') {
    const size = item.track.size > 0
      ? item.track.size >= 1_048_576
        ? `${(item.track.size / 1_048_576).toFixed(1)} MB`
        : `${Math.round(item.track.size / 1024)} KB`
      : null
    return size ? `${item.track.source} · ${size}` : item.track.source
  }
  return item.track.artist
}

function isActive(item: PlaylistItem, currentTrack: Track | null): boolean {
  if (!currentTrack) return false
  if (item.kind === 'local') return item.track.filename === currentTrack.filename
  return item.track.id === currentTrack.id
}

function DragHandle() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
      <circle cx="5" cy="4" r="1.2" /><circle cx="11" cy="4" r="1.2" />
      <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
      <circle cx="5" cy="12" r="1.2" /><circle cx="11" cy="12" r="1.2" />
    </svg>
  )
}

function RemoveIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path d="M12 4.7L11.3 4 8 7.3 4.7 4 4 4.7 7.3 8 4 11.3l.7.7L8 8.7l3.3 3.3.7-.7L8.7 8z" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    >
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SortableRow({
  item, active, onPlay, onRemove, draggable,
}: {
  item: PlaylistItem
  active: boolean
  onPlay: () => void
  onRemove: () => void
  draggable: boolean
}) {
  const id = itemId(item)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const tooltipContent = item.kind === 'local'
    ? <TrackInfoCard track={item.track} />
    : <SearchTrackInfoCard track={item.track} />

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2.5 px-4 py-2 select-none transition-colors ${
        isDragging ? 'bg-orange-500/5 opacity-70' : active ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
      }`}
    >
      {draggable ? (
        <span
          {...attributes}
          {...listeners}
          className="text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing transition-colors flex-shrink-0"
          aria-label="Drag to reorder"
        >
          <DragHandle />
        </span>
      ) : (
        <span className="w-3.5 flex-shrink-0" />
      )}

      <Tooltip content={tooltipContent} className="flex-1 min-w-0">
        <button
          onClick={onPlay}
          className="w-full text-left min-w-0"
          aria-label={`Play ${itemLabel(item)}`}
        >
          <p className={`text-sm truncate transition-colors leading-tight ${active ? 'text-orange-300' : 'text-zinc-300 hover:text-zinc-100'}`}>
            {active && <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 mb-0.5 animate-pulse" />}
            {itemLabel(item)}
          </p>
          <p className="text-[10px] font-mono text-zinc-600 truncate mt-0.5">{itemSubLabel(item)}</p>
        </button>
      </Tooltip>

      <button
        onClick={onRemove}
        className="text-zinc-700 hover:text-red-400 transition-colors p-0.5 rounded flex-shrink-0"
        aria-label="Remove from playlist"
      >
        <RemoveIcon />
      </button>
    </li>
  )
}

const SORT_LABELS: Record<SortOption, string> = { default: 'Default', az: 'A–Z', za: 'Z–A' }

function PlaylistSection({
  playlist, expanded, onToggle, onPlay, currentTrack,
}: {
  playlist: Playlist
  expanded: boolean
  onToggle: () => void
  onPlay: (item: PlaylistItem, playlistItems: PlaylistItem[]) => void
  currentTrack: Track | null
}) {
  const { removeFromPlaylist, reorderPlaylist } = usePlaylist()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [filterText, setFilterText] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('default')
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sortOpen) return
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen])

  const isFiltered = filterText !== '' || sortOption !== 'default'

  const displayItems = useMemo(() => {
    let items = playlist.items
    if (filterText) {
      const q = filterText.toLowerCase()
      items = items.filter(i =>
        itemLabel(i).toLowerCase().includes(q) || itemSubLabel(i).toLowerCase().includes(q)
      )
    }
    if (sortOption === 'az') items = [...items].sort((a, b) => itemLabel(a).localeCompare(itemLabel(b)))
    else if (sortOption === 'za') items = [...items].sort((a, b) => itemLabel(b).localeCompare(itemLabel(a)))
    return items
  }, [playlist.items, filterText, sortOption])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = playlist.items.findIndex(i => itemId(i) === active.id)
    const toIndex = playlist.items.findIndex(i => itemId(i) === over.id)
    reorderPlaylist(playlist.id, fromIndex, toIndex)
  }, [playlist, reorderPlaylist])

  return (
    <div className="border-b border-[#1e1e21] last:border-b-0">
      {/* Accordion header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/[0.02] transition-colors group"
      >
        <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
          <ChevronIcon open={expanded} />
        </span>
        <span className="flex-1 text-left text-xs font-mono uppercase tracking-wider text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">
          {playlist.name}
        </span>
        <span className="text-[10px] font-mono text-zinc-600 flex-shrink-0">
          {playlist.items.length}
        </span>
      </button>

      {/* Filter + sort bar — only when expanded and has items */}
      {expanded && playlist.items.length > 0 && (
        <div className="flex items-center gap-2 px-4 pb-2 border-b border-[#1e1e21]/50">
          <input
            type="text"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Filter…"
            aria-label="Filter playlist tracks"
            className="flex-1 bg-transparent text-xs font-mono text-zinc-300 placeholder-zinc-700 outline-none min-w-0"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              aria-label="Clear filter"
              className="text-zinc-600 hover:text-zinc-300 text-sm font-mono leading-none transition-colors flex-shrink-0"
            >
              ×
            </button>
          )}
          <div ref={sortRef} className="relative flex-shrink-0">
            <button
              onClick={() => setSortOpen(o => !o)}
              className={`flex items-center gap-0.5 text-[10px] font-mono transition-colors ${
                sortOption !== 'default' ? 'text-orange-400' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {SORT_LABELS[sortOption]}
              <svg viewBox="0 0 16 16" fill="currentColor" className={`w-2.5 h-2.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`}>
                <path d="M4 6l4 4 4-4H4z" />
              </svg>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-[#111113] border border-[#1e1e21] rounded-xl overflow-hidden shadow-xl shadow-black/60 min-w-[5rem]">
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([opt, label]) => (
                  <button
                    key={opt}
                    onClick={() => { setSortOption(opt); setSortOpen(false) }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] font-mono transition-colors ${
                      sortOption === opt
                        ? 'text-orange-400 bg-orange-500/10'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Items (animated) */}
      <div className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          {displayItems.length === 0 ? (
            <p className="text-xs text-zinc-700 px-4 py-3 font-mono italic">
              {filterText ? 'no matches' : 'empty'}
            </p>
          ) : isFiltered ? (
            /* Plain list when filtered/sorted — DnD disabled */
            <ul className="divide-y divide-[#1e1e21]">
              {displayItems.map(item => (
                <SortableRow
                  key={itemId(item)}
                  item={item}
                  active={isActive(item, currentTrack)}
                  onPlay={() => onPlay(item, playlist.items)}
                  onRemove={() => removeFromPlaylist(itemId(item), playlist.id)}
                  draggable={false}
                />
              ))}
            </ul>
          ) : (
            /* DnD-enabled list when no filter/sort */
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={playlist.items.map(itemId)} strategy={verticalListSortingStrategy}>
                <ul className="divide-y divide-[#1e1e21]">
                  {playlist.items.map(item => (
                    <SortableRow
                      key={itemId(item)}
                      item={item}
                      active={isActive(item, currentTrack)}
                      onPlay={() => onPlay(item, playlist.items)}
                      onRemove={() => removeFromPlaylist(itemId(item), playlist.id)}
                      draggable={true}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  )
}

export function PlaylistPanel({ onPlay, currentTrack }: Props) {
  const { playlists, createPlaylist } = usePlaylist()
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['favorites']))
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (creating) inputRef.current?.focus()
  }, [creating])

  function toggleSection(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    const id = createPlaylist(name)
    setExpanded(prev => new Set([...prev, id]))
    setNewName('')
    setCreating(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') { setCreating(false); setNewName('') }
  }

  const totalTracks = playlists.reduce((sum, p) => sum + p.items.length, 0)

  return (
    <div className="bg-[#111113] border border-[#1e1e21] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
          Playlists · {totalTracks}
        </p>
        <button
          onClick={() => setCreating(true)}
          className="text-zinc-600 hover:text-orange-400 transition-colors p-0.5 rounded"
          aria-label="New playlist"
          title="New playlist"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </button>
      </div>

      {creating && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <input
            ref={inputRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Playlist name"
            aria-label="New playlist name"
            className="flex-1 bg-[#1e1e21] border border-[#2a2a2f] rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-orange-500/50 font-mono"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="text-xs font-mono text-orange-400 hover:text-orange-300 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors px-2 py-1.5"
          >
            create
          </button>
        </div>
      )}

      <div>
        {playlists.map(playlist => (
          <PlaylistSection
            key={playlist.id}
            playlist={playlist}
            expanded={expanded.has(playlist.id)}
            onToggle={() => toggleSection(playlist.id)}
            onPlay={onPlay}
            currentTrack={currentTrack}
          />
        ))}
      </div>
    </div>
  )
}
