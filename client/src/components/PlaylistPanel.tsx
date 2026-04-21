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
import { usePlaylist, PlaylistItem } from '../contexts/PlaylistContext'

function itemId(item: PlaylistItem) {
  return item.kind === 'local' ? item.track.id : item.track.id
}

function itemLabel(item: PlaylistItem) {
  if (item.kind === 'local') return item.track.originalName.replace(/\.[^.]+$/, '')
  return `${item.track.title} — ${item.track.artist}`
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

function SortableRow({ item, onRemove }: { item: PlaylistItem; onRemove: () => void }) {
  const id = itemId(item)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2.5 px-4 py-3 select-none transition-colors ${
        isDragging ? 'bg-orange-500/5 opacity-70' : 'hover:bg-white/[0.02]'
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing transition-colors"
        aria-label="Drag to reorder"
      >
        <DragHandle />
      </span>
      <p className="flex-1 text-sm text-zinc-300 truncate">{itemLabel(item)}</p>
      <button
        onClick={onRemove}
        className="text-zinc-700 hover:text-red-400 transition-colors p-0.5 rounded"
        aria-label="Remove from playlist"
      >
        <RemoveIcon />
      </button>
    </li>
  )
}

export function PlaylistPanel() {
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
              <SortableRow key={itemId(item)} item={item} onRemove={() => remove(itemId(item))} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}
