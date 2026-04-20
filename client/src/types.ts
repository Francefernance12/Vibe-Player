export interface Track {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  source: 'sample' | 'upload'
}

export interface SearchTrack {
  id: string
  name: string
  artist: string
  album: string
  durationMs: number
  previewUrl: string | null
  source: 'spotify'
}
