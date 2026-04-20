import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health';
import tracksRouter from './routes/tracks';
import searchRouter from './routes/search';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/tracks', tracksRouter);
app.use('/api/search', searchRouter);

export default app;
