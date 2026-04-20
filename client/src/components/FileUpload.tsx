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
      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`)
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
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${dragging ? 'border-indigo-400 bg-indigo-950/30' : 'border-zinc-700 hover:border-zinc-500'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }}
        />
        <p className="text-sm text-zinc-400">
          {uploading ? 'Uploading…' : 'Drop an audio file here, or click to browse'}
        </p>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
