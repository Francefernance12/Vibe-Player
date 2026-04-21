import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { TrackList } from '../components/TrackList'
import { PlaylistProvider } from '../contexts/PlaylistContext'
import { Track } from '../types'

const TRACKS: Track[] = [
  { id: '1', filename: 'a.mp3', originalName: 'Alpha.mp3', mimeType: 'audio/mpeg', size: 1024, source: 'sample' },
  { id: '2', filename: 'b.mp3', originalName: 'Beta.mp3',  mimeType: 'audio/mpeg', size: 2048, source: 'upload' },
  { id: '3', filename: 'c.mp3', originalName: 'Gamma.mp3', mimeType: 'audio/mpeg', size: 3072, source: 'sample' },
]

function wrap(ui: React.ReactElement) {
  return render(<PlaylistProvider>{ui}</PlaylistProvider>)
}

test('renders the correct number of items from mock data', () => {
  wrap(<TrackList tracks={TRACKS} currentTrack={null} onSelect={() => {}} onDelete={() => {}} />)
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
})

test('shows track names without extension', () => {
  wrap(<TrackList tracks={TRACKS} currentTrack={null} onSelect={() => {}} onDelete={() => {}} />)
  expect(screen.getByText('Alpha')).toBeInTheDocument()
  expect(screen.getByText('Beta')).toBeInTheDocument()
})

test('calls onSelect with correct track when clicked', async () => {
  const onSelect = vi.fn()
  wrap(<TrackList tracks={TRACKS} currentTrack={null} onSelect={onSelect} onDelete={() => {}} />)
  await userEvent.click(screen.getByText('Beta'))
  expect(onSelect).toHaveBeenCalledWith(TRACKS[1])
})

test('renders empty state when tracks array is empty', () => {
  wrap(<TrackList tracks={[]} currentTrack={null} onSelect={() => {}} onDelete={() => {}} />)
  expect(screen.getByText(/no tracks yet/i)).toBeInTheDocument()
})

test('delete button renders only for upload-source rows', () => {
  wrap(<TrackList tracks={TRACKS} currentTrack={null} onSelect={() => {}} onDelete={() => {}} />)
  const deleteButtons = screen.getAllByLabelText('Delete track')
  expect(deleteButtons).toHaveLength(1) // only Beta is upload
})

test('calls onDelete when delete button clicked', async () => {
  const onDelete = vi.fn()
  wrap(<TrackList tracks={TRACKS} currentTrack={null} onSelect={() => {}} onDelete={onDelete} />)
  await userEvent.click(screen.getByLabelText('Delete track'))
  expect(onDelete).toHaveBeenCalledWith(TRACKS[1])
})
