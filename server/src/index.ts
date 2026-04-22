import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import app from './app';
import { getJwtSecret } from './middleware/auth';

const PORT = process.env.PORT ?? 3001;

// Fail fast if required env vars are missing
getJwtSecret();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
