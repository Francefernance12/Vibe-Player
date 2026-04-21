import { filterAndSortTracks } from '../utils/trackFilter'
import { Track } from '../types'

const TRACKS: Track[] = [
  { id: '1', filename: 'a.mp3', originalName: 'Banana.mp3', mimeType: 'audio/mpeg', size: 3000, source: 'upload' },
  { id: '2', filename: 'b.mp3', originalName: 'Apple.mp3',  mimeType: 'audio/mpeg', size: 1000, source: 'sample' },
  { id: '3', filename: 'c.mp3', originalName: 'Cherry.mp3', mimeType: 'audio/mpeg', size: 2000, source: 'upload' },
]

test('returns all tracks when filter is empty', () => {
  expect(filterAndSortTracks(TRACKS, '', 'default')).toHaveLength(3)
})

test('filter narrows by originalName case-insensitively', () => {
  const result = filterAndSortTracks(TRACKS, 'an', 'default')
  expect(result.map(t => t.originalName)).toEqual(['Banana.mp3'])
})

test('sort az orders alphabetically', () => {
  const result = filterAndSortTracks(TRACKS, '', 'az')
  expect(result.map(t => t.originalName)).toEqual(['Apple.mp3', 'Banana.mp3', 'Cherry.mp3'])
})

test('sort za reverses alphabetical order', () => {
  const result = filterAndSortTracks(TRACKS, '', 'za')
  expect(result.map(t => t.originalName)).toEqual(['Cherry.mp3', 'Banana.mp3', 'Apple.mp3'])
})

test('sort sizeAsc orders smallest first', () => {
  const result = filterAndSortTracks(TRACKS, '', 'sizeAsc')
  expect(result.map(t => t.size)).toEqual([1000, 2000, 3000])
})

test('sort sizeDesc orders largest first', () => {
  const result = filterAndSortTracks(TRACKS, '', 'sizeDesc')
  expect(result.map(t => t.size)).toEqual([3000, 2000, 1000])
})

test('sort source puts samples first', () => {
  const result = filterAndSortTracks(TRACKS, '', 'source')
  expect(result[0].source).toBe('sample')
})
