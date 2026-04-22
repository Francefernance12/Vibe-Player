import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { getAllTracks, resolveTrackPath, isSampleFilename, UPLOADS_DIR, AUDIO_MIME } from '../tracks';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (AUDIO_MIME[ext]) return cb(null, true);
    cb(new Error('Only audio files are allowed'));
  },
});

/** GET /api/tracks */
router.get('/', (_req: Request, res: Response) => {
  res.json(getAllTracks());
});

/** POST /api/upload */
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const ext = path.extname(req.file.originalname).toLowerCase();
  const track = {
    id: req.file.filename,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: AUDIO_MIME[ext] ?? req.file.mimetype,
    size: req.file.size,
    source: 'upload' as const,
  };
  res.status(201).json(track);
});

/** GET /api/tracks/:filename/stream */
router.get('/:filename/stream', (req: Request, res: Response) => {
  const filename = req.params['filename'] as string;
  const filePath = resolveTrackPath(filename);
  if (!filePath) {
    res.status(404).json({ error: 'Track not found' });
    return;
  }
  const ext = path.extname(filename as string).toLowerCase();
  const mimeType = AUDIO_MIME[ext] ?? 'application/octet-stream';
  const stat = fs.statSync(filePath);
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Accept-Ranges', 'bytes');
  fs.createReadStream(filePath).pipe(res);
});

/** DELETE /api/tracks/:filename */
router.delete('/:filename', (req: Request, res: Response) => {
  const { filename } = req.params as { filename: string };
  if (isSampleFilename(filename)) {
    res.status(403).json({ error: 'Cannot delete sample tracks' });
    return;
  }
  const uploadPath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(uploadPath)) {
    res.status(404).json({ error: 'Track not found' });
    return;
  }
  fs.unlinkSync(uploadPath);
  res.status(204).end();
});

export default router;
