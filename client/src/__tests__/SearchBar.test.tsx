import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { SearchBar } from '../components/SearchBar'

beforeEach(() => {
  global.fetch = vi.fn()
})
afterEach(() => { vi.restoreAllMocks() })

test('renders search input', () => {
  render(<SearchBar onResults={() => {}} />)
  expect(screen.getByRole('searchbox')).toBeInTheDocument()
})

test('calls onResults with empty array when query is cleared', async () => {
  const onResults = vi.fn()
  render(<SearchBar onResults={onResults} />)
  const input = screen.getByRole('searchbox')
  await userEvent.type(input, 'a')
  await userEvent.clear(input)
  expect(onResults).toHaveBeenCalledWith([])
})

test('calls fetch and onResults when query is typed', async () => {
  const mockResults = [{ id: '1', title: 'Creep', artist: 'Radiohead', albumArt: null, previewUrl: null, durationMs: 239000, source: 'deezer' }]
  ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResults) })
  const onResults = vi.fn()
  render(<SearchBar onResults={onResults} />)
  await userEvent.type(screen.getByRole('searchbox'), 'test')
  await waitFor(() => expect(onResults).toHaveBeenCalledWith(mockResults), { timeout: 1000 })
})
