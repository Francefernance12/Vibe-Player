export interface Track {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  source: 'sample' | 'upload'
}
