import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import healthRouter from './routes/health';
import tracksRouter from './routes/tracks';
import searchRouter from './routes/search';
import authRouter from './routes/auth';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/tracks', tracksRouter);
app.use('/api/search', searchRouter);
app.use('/api/auth', authRouter);

export default app;
