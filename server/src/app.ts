import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
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
  console.error(err.message);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
