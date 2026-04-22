export interface Track {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  source: 'sample' | 'upload'
  externalUrl?: string
}

export interface SearchTrack {
  id: string
  title: string
  artist: string
  albumArt: string | null
  previewUrl: string | null
  durationMs: number
  source: 'deezer'
}
