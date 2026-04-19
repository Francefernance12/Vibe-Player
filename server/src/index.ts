import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import app from './app';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
