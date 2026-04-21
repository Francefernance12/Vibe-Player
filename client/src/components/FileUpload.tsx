import { useRef, useState, useCallback, DragEvent } from 'react'
import { Track } from '../types'

interface Props {
  onUploaded: (track: Track) => void
}

export function FileUpload({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/tracks/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Upload failed: ${res.status}`)
      }
      const track = await res.json() as Track
      onUploaded(track)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onUploaded])

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }, [upload])

  const onDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
          dragging
            ? 'border-orange-500/50 bg-orange-500/5 text-orange-400'
            : 'border-[#1e1e21] hover:border-zinc-600 text-zinc-500 hover:text-zinc-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }}
        />
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
          <path d="M10 3l-4 4h3v6h2V7h3L10 3zM4 15h12v2H4v-2z" />
        </svg>
        <span className="text-sm">
          {uploading ? 'Uploading…' : 'Drop audio file or click to browse'}
        </span>
      </div>
      {error && <p className="text-xs text-red-400 mt-1.5 px-1">{error}</p>}
    </div>
  )
}
