import { useRef, useEffect, useCallback } from 'react'

interface Props {
  isPlaying: boolean
  getDuration: () => number
  getSeek: () => number
  onSeek: (ratio: number) => void
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

/**
 * Updates the progress bar via direct DOM mutation on every Howler tick.
 * No setState on ticks — see vercel-react-best-practices: rerender-use-ref-transient-values.
 */
export function ProgressBar({ isPlaying, getDuration, getSeek, onSeek }: Props) {
  const barRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const elapsedRef = useRef<HTMLSpanElement>(null)
  const durationRef = useRef<HTMLSpanElement>(null)
  const rafRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    const dur = getDuration()
    const seek = getSeek()
    const ratio = dur > 0 ? seek / dur : 0
    if (fillRef.current) fillRef.current.style.width = `${ratio * 100}%`
    if (elapsedRef.current) elapsedRef.current.textContent = fmt(seek)
    if (durationRef.current) durationRef.current.textContent = fmt(dur)
    rafRef.current = requestAnimationFrame(tick)
  }, [getDuration, getSeek])

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [isPlaying, tick])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(ratio)
  }, [onSeek])

  return (
    <div className="flex items-center gap-2 w-full select-none">
      <span ref={elapsedRef} className="text-xs text-zinc-500 w-8 text-right tabular-nums">0:00</span>
      <div
        ref={barRef}
        onClick={handleClick}
        className="flex-1 h-1.5 bg-zinc-700 rounded-full cursor-pointer relative group"
      >
        <div ref={fillRef} className="h-full bg-indigo-400 rounded-full transition-none" style={{ width: '0%' }} />
        <div className="absolute inset-y-0 -top-1.5 -bottom-1.5 left-0 right-0" />
      </div>
      <span ref={durationRef} className="text-xs text-zinc-500 w-8 tabular-nums">0:00</span>
    </div>
  )
}
