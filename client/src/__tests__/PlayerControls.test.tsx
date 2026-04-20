import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { PlayerControls } from '../components/PlayerControls'

const noop = () => {}

test('calls onPlay when play button is clicked', async () => {
  const onPlay = vi.fn()
  render(<PlayerControls isPlaying={false} hasTrack={true} onPlay={onPlay} onPause={noop} onNext={noop} onPrev={noop} />)
  await userEvent.click(screen.getByLabelText('Play'))
  expect(onPlay).toHaveBeenCalledTimes(1)
})

test('shows pause button when isPlaying is true', () => {
  render(<PlayerControls isPlaying={true} hasTrack={true} onPlay={noop} onPause={noop} onNext={noop} onPrev={noop} />)
  expect(screen.getByLabelText('Pause')).toBeInTheDocument()
})

test('calls onPause when pause button is clicked', async () => {
  const onPause = vi.fn()
  render(<PlayerControls isPlaying={true} hasTrack={true} onPlay={noop} onPause={onPause} onNext={noop} onPrev={noop} />)
  await userEvent.click(screen.getByLabelText('Pause'))
  expect(onPause).toHaveBeenCalledTimes(1)
})

test('buttons are disabled when hasTrack is false', () => {
  render(<PlayerControls isPlaying={false} hasTrack={false} onPlay={noop} onPause={noop} onNext={noop} onPrev={noop} />)
  expect(screen.getByLabelText('Play')).toBeDisabled()
  expect(screen.getByLabelText('Previous')).toBeDisabled()
  expect(screen.getByLabelText('Next')).toBeDisabled()
})
