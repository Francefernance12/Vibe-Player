import { useState, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Track, SearchTrack } from '../types'

const SUPPORTS_HOVER = (() => {
  try {
    return typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
  } catch {
    return false
  }
})()

const CARD_WIDTH = 256
const GAP = 16
const CARD_HEIGHT_EST = 164

// ---------- card content ----------

function formatSize(bytes: number) {
  if (bytes <= 0) return '—'
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 w-11 flex-shrink-0 pt-px leading-none mt-0.5">
        {label}
      </span>
      <span className="text-[11px] font-mono text-zinc-300 leading-snug break-all">{value}</span>
    </div>
  )
}

function CardShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#0a0a0b] border border-[#2a2a2f] rounded-xl overflow-hidden shadow-2xl shadow-black/90 w-64">
      <div className="h-px bg-gradient-to-r from-orange-500/70 via-orange-400/30 to-transparent" />
      <div className="px-3 pt-2 pb-0.5">
        <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-orange-500/50">Track Info</span>
      </div>
      <div className="px-3 pb-3 flex flex-col gap-1.5 mt-1">{children}</div>
    </div>
  )
}

export function TrackInfoCard({ track }: { track: Track }) {
  let name = track.originalName.replace(/\.[^.]+$/, '')
  let artist = '—'
  if (track.source === 'deezer') {
    const sep = name.indexOf(' — ')
    if (sep !== -1) { artist = name.slice(sep + 3); name = name.slice(0, sep) }
  }
  const source = track.source === 'upload' ? 'Uploaded' : track.source === 'deezer' ? 'Deezer' : 'Sample'
  return (
    <CardShell>
      <Row label="name" value={name} />
      <Row label="artist" value={artist} />
      <Row label="source" value={source} />
      <Row label="size" value={formatSize(track.size)} />
      <Row label="type" value={track.mimeType.replace('audio/', '')} />
    </CardShell>
  )
}

export function SearchTrackInfoCard({ track }: { track: SearchTrack }) {
  return (
    <CardShell>
      <Row label="title" value={track.title} />
      <Row label="artist" value={track.artist} />
      <Row label="source" value="Deezer" />
      <Row label="size" value="—" />
      <Row label="preview" value={track.previewUrl ? '30 sec' : 'none'} />
    </CardShell>
  )
}

// ---------- tooltip wrapper ----------

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setPos(null)
  }, [])

  if (!SUPPORTS_HOVER) {
    return <div className={className}>{children}</div>
  }

  const style: React.CSSProperties = pos ? (() => {
    const left = Math.max(8, Math.min(pos.x - CARD_WIDTH / 2, window.innerWidth - CARD_WIDTH - 8))
    const fitsAbove = pos.y - CARD_HEIGHT_EST - GAP > 0
    return fitsAbove
      ? { position: 'fixed', left, bottom: window.innerHeight - pos.y + GAP, zIndex: 9999, pointerEvents: 'none' }
      : { position: 'fixed', left, top: pos.y + GAP + 20, zIndex: 9999, pointerEvents: 'none' }
  })() : {}

  return (
    <>
      <div onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className={className}>
        {children}
      </div>
      {pos && createPortal(
        <div style={style} className="animate-fade-in">
          {content}
        </div>,
        document.body
      )}
    </>
  )
}
