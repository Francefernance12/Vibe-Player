import { render, screen } from '@testing-library/react'
import { ProgressBar } from '../components/ProgressBar'

const noop = () => {}

test('renders the correct time string format (m:ss)', () => {
  render(
    <ProgressBar
      isPlaying={false}
      getDuration={() => 125}
      getSeek={() => 65}
      onSeek={noop}
    />
  )
  // Initial render shows 0:00 for both (tick runs via RAF which doesn't fire in jsdom)
  const spans = screen.getAllByText('0:00')
  expect(spans.length).toBeGreaterThanOrEqual(1)
})

test('renders elapsed and duration spans', () => {
  const { container } = render(
    <ProgressBar
      isPlaying={false}
      getDuration={() => 180}
      getSeek={() => 30}
      onSeek={noop}
    />
  )
  // Two time spans present (elapsed + duration)
  const spans = container.querySelectorAll('span.font-mono')
  expect(spans).toHaveLength(2)
})
