import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health';
import tracksRouter from './routes/tracks';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/tracks', tracksRouter);

export default app;
