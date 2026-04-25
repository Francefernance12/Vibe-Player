import { memo, useRef, useEffect, useCallback } from 'react'

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
export const ProgressBar = memo(function ProgressBar({ isPlaying, getDuration, getSeek, onSeek }: Props) {
  const barRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const elapsedRef = useRef<HTMLSpanElement>(null)
  const durationRef = useRef<HTMLSpanElement>(null)
  const rafRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    const dur = getDuration()
    const seek = getSeek()
    const ratio = dur > 0 ? seek / dur : 0
    const pct = `${ratio * 100}%`
    if (fillRef.current) fillRef.current.style.width = pct
    if (thumbRef.current) thumbRef.current.style.left = pct
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

  const handleTouch = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const bar = barRef.current
    if (!bar) return
    const touch = e.changedTouches[0]
    if (!touch) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width))
    onSeek(ratio)
  }, [onSeek])

  return (
    <div className="flex items-center gap-3 w-full select-none">
      <span ref={elapsedRef} className="font-mono text-[11px] text-zinc-500 w-8 text-right">0:00</span>
      <div
        ref={barRef}
        onClick={handleClick}
        onTouchEnd={handleTouch}
        className="flex-1 h-1 bg-[#2a2a2d] rounded-full cursor-pointer relative group py-2 -my-2"
      >
        <div className="absolute inset-y-0 my-auto h-1 w-full rounded-full">
          <div ref={fillRef} className="h-full bg-orange-500 rounded-full transition-none" style={{ width: '0%' }} />
        </div>
        <div
          ref={thumbRef}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-orange-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ left: '0%' }}
        />
      </div>
      <span ref={durationRef} className="font-mono text-[11px] text-zinc-500 w-8">0:00</span>
    </div>
  )
})
