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
import { usePlaylist, PlaylistItem } from '../contexts/PlaylistContext'

interface Props {
  onPlay: (item: PlaylistItem) => void
  currentTrack: Track | null
}

function itemId(item: PlaylistItem) {
  return item.kind === 'local' ? item.track.id : item.track.id
}

function itemLabel(item: PlaylistItem) {
  if (item.kind === 'local') return item.track.originalName.replace(/\.[^.]+$/, '')
  return `${item.track.title} — ${item.track.artist}`
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

function SortableRow({
  item,
  active,
  onPlay,
  onRemove,
}: {
  item: PlaylistItem
  active: boolean
  onPlay: () => void
  onRemove: () => void
}) {
  const id = itemId(item)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2.5 px-4 py-3 select-none transition-colors ${
        isDragging ? 'bg-orange-500/5 opacity-70' : active ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing transition-colors flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <DragHandle />
      </span>
      <button
        onClick={onPlay}
        className="flex-1 text-left min-w-0"
        aria-label={`Play ${itemLabel(item)}`}
      >
        <p className={`text-sm truncate transition-colors ${active ? 'text-orange-300' : 'text-zinc-300 hover:text-zinc-100'}`}>
          {active && <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 mb-0.5" />}
          {itemLabel(item)}
        </p>
      </button>
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

export function PlaylistPanel({ onPlay, currentTrack }: Props) {
  const { items, remove, reorder } = usePlaylist()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = items.findIndex(i => itemId(i) === active.id)
    const toIndex = items.findIndex(i => itemId(i) === over.id)
    reorder(fromIndex, toIndex)
  }

  if (items.length === 0) return null

  return (
    <div className="bg-[#111113] border border-[#1e1e21] rounded-2xl overflow-hidden">
      <p className="text-[10px] uppercase tracking-widest text-zinc-600 px-4 pt-3 pb-1.5 font-mono">
        Playlist · {items.length}
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(itemId)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-[#1e1e21]">
            {items.map(item => (
              <SortableRow
                key={itemId(item)}
                item={item}
                active={isActive(item, currentTrack)}
                onPlay={() => onPlay(item)}
                onRemove={() => remove(itemId(item))}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}
