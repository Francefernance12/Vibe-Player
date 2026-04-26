import { memo } from 'react'
import { useSwipeable } from 'react-swipeable'
import { Track } from '../types'
import { PlayerControls } from './PlayerControls'
import { ProgressBar } from './ProgressBar'
import { VolumeControl } from './VolumeControl'
import { Tooltip, TrackInfoCard } from './Tooltip'

function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6C13.6 6.6 14.8 6 16.1 6H22" />
      <path d="M22 18h-5.9c-1.3 0-2.5-.6-3.3-1.7l-.8-1.1" />
      <path d="M22 6h-5.9c-1.3 0-2.5.6-3.3 1.7l-.8 1.1" />
      <path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7L9 11" />
      <polyline points="19 21 22 18 19 15" />
      <polyline points="19 9 22 6 19 3" />
    </svg>
  )
}

function RepeatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  )
}

interface Props {
  currentTrack: Track | null
  nowPlayingName: string | null
  isPlaying: boolean
  hasTrack: boolean
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onPrev: () => void
  getDuration: () => number
  getSeek: () => number
  onSeek: (ratio: number) => void
  shuffle: boolean
  loopMode: 'none' | 'track' | 'queue'
  onToggleShuffle: () => void
  onCycleLoop: () => void
  volume: number
  onVolumeChange: (v: number) => void
}

export const PlayerBar = memo(function PlayerBar({
  currentTrack, nowPlayingName, isPlaying, hasTrack,
  onPlay, onPause, onNext, onPrev,
  getDuration, getSeek, onSeek,
  shuffle, loopMode, onToggleShuffle, onCycleLoop,
  volume, onVolumeChange,
}: Props) {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => { if (hasTrack) onNext() },
    onSwipedRight: () => { if (hasTrack) onPrev() },
    trackMouse: false,
    preventScrollOnSwipe: true,
  })

  const loopActive = loopMode !== 'none'

  return (
    <div
      {...swipeHandlers}
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4"
    >
      <div className="w-full max-w-md bg-[#111113] border-t border-x border-[#1e1e21] rounded-t-2xl">
      <div className="px-4 pt-2.5">
        <ProgressBar isPlaying={isPlaying} getDuration={getDuration} getSeek={getSeek} onSeek={onSeek} />
      </div>

      <div className="flex items-center gap-1 px-3 py-1.5">
        {/* Shuffle */}
        <button
          onClick={onToggleShuffle}
          aria-label="Toggle shuffle"
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
            shuffle ? 'text-orange-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          <ShuffleIcon />
        </button>

        {/* Loop — shows a "1" badge when looping single track */}
        <button
          onClick={onCycleLoop}
          aria-label="Cycle loop mode"
          className={`relative p-1.5 rounded-lg transition-colors flex-shrink-0 ${
            loopActive ? 'text-orange-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          <RepeatIcon />
          {loopMode === 'track' && (
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full flex items-center justify-center text-[7px] text-white font-bold leading-none pointer-events-none">
              1
            </span>
          )}
        </button>

        {/* Track name — tooltip shows full metadata on hover */}
        {currentTrack ? (
          <Tooltip content={<TrackInfoCard track={currentTrack} />} className="flex-1 min-w-0 mx-1">
            <p className="text-sm font-medium text-zinc-100 truncate cursor-default">{nowPlayingName}</p>
          </Tooltip>
        ) : (
          <p className="flex-1 text-zinc-500 font-normal text-xs truncate mx-1 min-w-0">Select a track</p>
        )}

        {/* Playback controls */}
        <PlayerControls
          isPlaying={isPlaying}
          hasTrack={hasTrack}
          onPlay={onPlay}
          onPause={onPause}
          onNext={onNext}
          onPrev={onPrev}
        />

        {/* Volume — desktop only */}
        <div className="hidden sm:flex ml-1 flex-shrink-0">
          <VolumeControl volume={volume} onVolumeChange={onVolumeChange} />
        </div>
      </div>
      </div>
    </div>
  )
})
