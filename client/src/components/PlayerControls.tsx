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
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        disabled={!hasTrack}
        aria-label="Previous"
        className="p-3 sm:p-2 text-zinc-500 hover:text-zinc-200 disabled:opacity-25 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M5 5h2v10H5V5zm3 5 7-5v10L8 10z" />
        </svg>
      </button>

      <button
        onClick={isPlaying ? onPause : onPlay}
        disabled={!hasTrack}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-400 active:scale-95 disabled:opacity-25 flex items-center justify-center transition-all"
      >
        {isPlaying ? (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
            <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white translate-x-px">
            <path d="M6 4l12 6-12 6V4z" />
          </svg>
        )}
      </button>

      <button
        onClick={onNext}
        disabled={!hasTrack}
        aria-label="Next"
        className="p-3 sm:p-2 text-zinc-500 hover:text-zinc-200 disabled:opacity-25 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M13 5h2v10h-2V5zm-8 0l7 5-7 5V5z" />
        </svg>
      </button>
    </div>
  )
})
