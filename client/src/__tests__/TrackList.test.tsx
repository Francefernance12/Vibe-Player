import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { TrackList } from '../components/TrackList'
import { Track } from '../types'

const TRACKS: Track[] = [
  { id: '1', filename: 'a.mp3', originalName: 'Alpha.mp3', mimeType: 'audio/mpeg', size: 1024, source: 'sample' },
  { id: '2', filename: 'b.mp3', originalName: 'Beta.mp3',  mimeType: 'audio/mpeg', size: 2048, source: 'upload' },
  { id: '3', filename: 'c.mp3', originalName: 'Gamma.mp3', mimeType: 'audio/mpeg', size: 3072, source: 'sample' },
]

test('renders the correct number of items from mock data', () => {
  render(<TrackList tracks={TRACKS} currentTrack={null} onSelect={() => {}} />)
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
})

test('shows track names without extension', () => {
  render(<TrackList tracks={TRACKS} currentTrack={null} onSelect={() => {}} />)
  expect(screen.getByText('Alpha')).toBeInTheDocument()
  expect(screen.getByText('Beta')).toBeInTheDocument()
})

test('calls onSelect with correct track when clicked', async () => {
  const onSelect = vi.fn()
  render(<TrackList tracks={TRACKS} currentTrack={null} onSelect={onSelect} />)
  await userEvent.click(screen.getByText('Beta'))
  expect(onSelect).toHaveBeenCalledWith(TRACKS[1])
})

test('renders empty state when tracks array is empty', () => {
  render(<TrackList tracks={[]} currentTrack={null} onSelect={() => {}} />)
  expect(screen.getByText(/no tracks yet/i)).toBeInTheDocument()
})
