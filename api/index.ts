import dotenv from 'dotenv';
dotenv.config();

// Re-export the Express app as a Vercel serverless function.
// Vercel's @vercel/node runtime adapts the request/response cycle.
export { default } from '../server/src/app';
