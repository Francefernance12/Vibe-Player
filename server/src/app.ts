import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import healthRouter from './routes/health';
import tracksRouter from './routes/tracks';
import searchRouter from './routes/search';
import authRouter from './routes/auth';
import playlistsRouter from './routes/playlists';
import chatRouter from './routes/chat';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/tracks', tracksRouter);
app.use('/api/search', searchRouter);
app.use('/api/auth', authRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/chat', chatRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
