import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Track } from '../../shared/types';

// On Vercel, the filesystem is read-only except for /tmp.
// Files included via vercel.json includeFiles land under process.cwd().
const IS_VERCEL = !!process.env.VERCEL;

const SAMPLES_DIR = IS_VERCEL
  ? path.join(process.cwd(), 'server', 'samples')
  : path.join(__dirname, '..', 'samples');

const UPLOADS_DIR = IS_VERCEL
  ? '/tmp'
  : path.join(__dirname, '..', 'uploads');

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

/** Returns sample tracks only. Uploaded tracks are stored in Turso + Blob. */
export function getSampleTracks(): Track[] {
  return readDir(SAMPLES_DIR, 'sample');
}

/** Finds the file path for a sample track by filename. */
export function resolveTrackPath(filename: string): string | null {
  const fullPath = path.join(SAMPLES_DIR, filename);
  return fs.existsSync(fullPath) ? fullPath : null;
}

export { AUDIO_MIME };
