import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { DatabaseUnavailableError } from '../db/retry';
import healthRouter from './routes/health';
import tracksRouter from './routes/tracks';
import searchRouter from './routes/search';
import deezerRouter from './routes/deezer';
import authRouter from './routes/auth';
import playlistsRouter from './routes/playlists';
import chatRouter from './routes/chat';
import quotaRouter from './routes/quota';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/tracks', tracksRouter);
app.use('/api/search', searchRouter);
app.use('/api/deezer', deezerRouter);
app.use('/api/auth', authRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/user/quota', quotaRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'File too large. Maximum size is 50 MB.' });
    return;
  }
  if (err instanceof DatabaseUnavailableError) {
    console.error('[DB_UNAVAILABLE]', err.message, err.cause);
    res.status(503)
      .set('Retry-After', '5')
      .json({
        error: 'Our database is temporarily unavailable. This is a server-side issue, not your fault. Please try again in a moment.',
        retryable: true,
        code: 'DB_UNAVAILABLE',
      });
    return;
  }
  // Log full stack + code so transient infra issues are diagnosable in Vercel runtime logs.
  const code = (err as Error & { code?: string }).code;
  console.error(code ? `[${code}]` : '[ERR]', err.stack ?? err.message);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
