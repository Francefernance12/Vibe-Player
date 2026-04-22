export type TrackSource = 'sample' | 'upload' | 'deezer';

/** Source values stored in the database (excludes ephemeral 'sample' variants) */
export type DbTrackSource = 'local' | 'deezer';

export interface Track {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  source: TrackSource;
  externalUrl?: string;
}
