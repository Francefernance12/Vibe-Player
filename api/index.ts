// Vercel serverless entry point. Re-exports the Express app.
// Environment variables are configured in the Vercel dashboard (not .env).
import app from '../server/src/app'
import { initDb } from '../server/db'

// Run migrations on every cold start (idempotent, fast)
const ready = initDb()

export default async function handler(req: Parameters<typeof app>[0], res: Parameters<typeof app>[1]) {
  await ready
  return app(req, res)
}
