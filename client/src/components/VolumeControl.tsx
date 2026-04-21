import { memo } from 'react'

interface Props {
  volume: number
  onVolumeChange: (v: number) => void
}

export const VolumeControl = memo(function VolumeControl({ volume, onVolumeChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-zinc-500 flex-shrink-0">
        {volume === 0 ? (
          <path d="M10 4L6 7H3v6h3l4 3V4zM14.5 7l-1 1c.3.5.5 1.2.5 2s-.2 1.5-.5 2l1 1C15 12.3 15.5 11.2 15.5 10s-.5-2.3-1-3zM13 8.5l-1 1c.1.2.2.3.2.5s-.1.3-.2.5l1 1c.4-.5.6-1 .6-1.5S13.4 9 13 8.5z" />
        ) : volume < 0.5 ? (
          <path d="M10 4L6 7H3v6h3l4 3V4zM13 8.5l-1 1c.1.2.2.3.2.5s-.1.3-.2.5l1 1c.4-.5.6-1 .6-1.5S13.4 9 13 8.5z" />
        ) : (
          <path d="M10 4L6 7H3v6h3l4 3V4zM14.5 7l-1 1c.3.5.5 1.2.5 2s-.2 1.5-.5 2l1 1C15 12.3 15.5 11.2 15.5 10s-.5-2.3-1-3z" />
        )}
      </svg>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={e => onVolumeChange(Number(e.target.value))}
        aria-label="Volume"
        className="w-20 accent-orange-500 cursor-pointer"
      />
    </div>
  )
})
