import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import app from './app';
import { getJwtSecret } from './middleware/auth';
import { initDb } from '../db';

const PORT = process.env.PORT ?? 3001;

// Fail fast if required env vars are missing
getJwtSecret();

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
