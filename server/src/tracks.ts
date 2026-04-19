import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Track } from '../../shared/types';

const SAMPLES_DIR = path.join(__dirname, '..', 'samples');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const AUDIO_MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
};

function readDir(dir: string, source: Track['source']): Track[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => AUDIO_MIME[path.extname(f).toLowerCase()])
    .map(f => ({
      id: uuidv4(),
      filename: f,
      originalName: f,
      mimeType: AUDIO_MIME[path.extname(f).toLowerCase()],
      size: fs.statSync(path.join(dir, f)).size,
      source,
    }));
}

/** Returns all tracks (samples + uploads). IDs are regenerated each call. */
export function getAllTracks(): Track[] {
  return [...readDir(SAMPLES_DIR, 'sample'), ...readDir(UPLOADS_DIR, 'upload')];
}

/** Finds the file path for a given filename across samples and uploads. */
export function resolveTrackPath(filename: string): string | null {
  for (const dir of [SAMPLES_DIR, UPLOADS_DIR]) {
    const fullPath = path.join(dir, filename);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

export { UPLOADS_DIR, AUDIO_MIME };
