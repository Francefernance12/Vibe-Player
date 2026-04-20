import { memo } from 'react'

interface Props {
  isPlaying: boolean
  hasTrack: boolean
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onPrev: () => void
}

export const PlayerControls = memo(function PlayerControls({
  isPlaying, hasTrack, onPlay, onPause, onNext, onPrev,
}: Props) {
  return (
    <div className="flex items-center gap-4 justify-center">
      <button
        onClick={onPrev}
        disabled={!hasTrack}
        aria-label="Previous"
        className="p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
        </svg>
      </button>

      <button
        onClick={isPlaying ? onPause : onPlay}
        disabled={!hasTrack}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="w-11 h-11 rounded-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 flex items-center justify-center transition-colors"
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
            <path d="M6 19h4V5H6zm8-14v14h4V5z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white ml-0.5">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <button
        onClick={onNext}
        disabled={!hasTrack}
        aria-label="Next"
        className="p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
        </svg>
      </button>
    </div>
  )
})
