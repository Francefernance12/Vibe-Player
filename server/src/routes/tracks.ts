import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { put, del } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { getSampleTracks, resolveTrackPath, AUDIO_MIME } from '../tracks';
import {
  getDb,
  createUploadedTrack,
  getUploadedTracksByUser,
  getUploadedTrackById,
  deleteUploadedTrack,
  getUserUploadedBytes,
} from '../../db';
import { authMiddleware, AuthPayload, getJwtSecret } from '../middleware/auth';
import { Track } from '../../../shared/types';

const router = Router();

const FREE_QUOTA_BYTES = 100 * 1024 * 1024; // 100MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (AUDIO_MIME[ext]) return cb(null, true);
    cb(new Error('Only audio files are allowed'));
  },
});

function tryGetUserId(req: Request): string | null {
  try {
    const token = req.cookies?.token;
    if (!token) return null;
    const payload = jwt.verify(token, getJwtSecret()) as AuthPayload;
    return payload.userId;
  } catch {
    return null;
  }
}

/** GET /api/tracks — samples always; user's uploaded tracks appended when logged in */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const samples = getSampleTracks();
    const userId = tryGetUserId(req);
    if (!userId) {
      res.json(samples);
      return;
    }
    const db = getDb();
    const rows = await getUploadedTracksByUser(db, userId);
    const uploads: Track[] = rows.map(t => ({
      id: t.id,
      filename: t.filename,
      originalName: t.original_name,
      mimeType: t.mime_type,
      size: t.size,
      source: 'upload' as const,
      externalUrl: t.blob_url,
    }));
    res.json([...samples, ...uploads]);
  } catch (err) {
    next(err);
  }
});

/** POST /api/tracks/upload — requires auth; stores file in Vercel Blob + Turso */
router.post('/upload', authMiddleware, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  try {
    const db = getDb();
    const used = await getUserUploadedBytes(db, req.user!.userId);
    if (used + req.file.size > FREE_QUOTA_BYTES) {
      res.status(413).json({
        error: `Storage quota exceeded. You have used ${Math.round(used / 1024 / 1024)} MB of your ${Math.round(FREE_QUOTA_BYTES / 1024 / 1024)} MB limit.`,
        used,
        limit: FREE_QUOTA_BYTES,
      });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const mimeType = AUDIO_MIME[ext] ?? req.file.mimetype;
    const filename = `${Date.now()}-${req.file.originalname}`;

    const { url } = await put(filename, req.file.buffer, {
      access: 'public',
      contentType: mimeType,
    });

    const id = uuidv4();
    await createUploadedTrack(db, {
      id,
      user_id: req.user!.userId,
      filename,
      original_name: req.file.originalname,
      mime_type: mimeType,
      size: req.file.size,
      blob_url: url,
    });

    const track: Track = {
      id,
      filename,
      originalName: req.file.originalname,
      mimeType: mimeType,
      size: req.file.size,
      source: 'upload',
      externalUrl: url,
    };
    res.status(201).json(track);
  } catch (err) {
    next(err);
  }
});

/** GET /api/tracks/:filename/stream — serves sample tracks only */
router.get('/:filename/stream', (req: Request, res: Response) => {
  const filename = req.params['filename'] as string;
  const filePath = resolveTrackPath(filename);
  if (!filePath) {
    res.status(404).json({ error: 'Track not found' });
    return;
  }
  const ext = path.extname(filename).toLowerCase();
  const mimeType = AUDIO_MIME[ext] ?? 'application/octet-stream';
  const stat = fs.statSync(filePath);
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Accept-Ranges', 'bytes');
  fs.createReadStream(filePath).pipe(res);
});

/** DELETE /api/tracks/:id — removes uploaded track from Blob + Turso */
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  try {
    const db = getDb();
    const track = await getUploadedTrackById(db, id);
    if (!track) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }
    if (track.user_id !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    await del(track.blob_url);
    await deleteUploadedTrack(db, id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
