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

function SortableRow({ item, onRemove }: { item: PlaylistItem; onRemove: () => void }) {
  const id = itemId(item)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 px-4 py-2.5 select-none ${isDragging ? 'bg-zinc-700 opacity-80' : 'hover:bg-zinc-800'} transition-colors`}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing text-lg leading-none"
        aria-label="Drag to reorder"
      >
        ⠿
      </span>
      <p className="flex-1 text-sm text-zinc-100 truncate">{itemLabel(item)}</p>
      <button
        onClick={onRemove}
        className="text-zinc-600 hover:text-red-400 transition-colors text-xs px-1"
        aria-label="Remove from playlist"
      >
        ✕
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
    <div className="bg-zinc-900 rounded-2xl overflow-hidden">
      <p className="text-xs text-zinc-500 px-4 pt-3 pb-1">Playlist · {items.length} track{items.length !== 1 ? 's' : ''}</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(itemId)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-zinc-800">
            {items.map(item => (
              <SortableRow key={itemId(item)} item={item} onRemove={() => remove(itemId(item))} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}
