import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PlayerBar } from '../components/PlayerBar'

const mockTrack = {
  id: 'test-id', filename: 'test.mp3', originalName: 'Test Track.mp3',
  mimeType: 'audio/mpeg', size: 1_048_576, source: 'upload' as const,
}

const baseProps = {
  currentTrack: null,
  nowPlayingName: null,
  isPlaying: false,
  hasTrack: false,
  onPlay: vi.fn(),
  onPause: vi.fn(),
  onNext: vi.fn(),
  onPrev: vi.fn(),
  getDuration: () => 0,
  getSeek: () => 0,
  onSeek: vi.fn(),
  shuffle: false,
  loopMode: 'none' as const,
  onToggleShuffle: vi.fn(),
  onCycleLoop: vi.fn(),
  volume: 1,
  onVolumeChange: vi.fn(),
}

describe('PlayerBar', () => {
  it('shows placeholder when no track is playing', () => {
    render(<PlayerBar {...baseProps} />)
    expect(screen.getByText('Select a track')).toBeTruthy()
  })

  it('shows track name when playing', () => {
    render(<PlayerBar {...baseProps} currentTrack={mockTrack} nowPlayingName="Test Track" hasTrack />)
    expect(screen.getByText('Test Track')).toBeTruthy()
  })

  it('calls onToggleShuffle when shuffle button clicked', () => {
    const onToggleShuffle = vi.fn()
    render(<PlayerBar {...baseProps} onToggleShuffle={onToggleShuffle} />)
    fireEvent.click(screen.getByLabelText('Toggle shuffle'))
    expect(onToggleShuffle).toHaveBeenCalledOnce()
  })

  it('calls onCycleLoop when loop button clicked', () => {
    const onCycleLoop = vi.fn()
    render(<PlayerBar {...baseProps} onCycleLoop={onCycleLoop} />)
    fireEvent.click(screen.getByLabelText('Cycle loop mode'))
    expect(onCycleLoop).toHaveBeenCalledOnce()
  })

  it('shows "1" badge when loopMode is track', () => {
    render(<PlayerBar {...baseProps} loopMode="track" />)
    expect(screen.getByText('1')).toBeTruthy()
  })
})
