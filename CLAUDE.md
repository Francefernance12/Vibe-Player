# Music Player — Claude Guidelines

## VERY IMPORTANT

- Be simple. Approach tasks in a simple, incremental way.
- Work incrementally ALWAYS. Small, simple steps. Validate each increment before moving on.
- Use latest stable library APIs as of now.

## Project Context

This is a lightweight music player web app called Vibe Player.

- Frontend: React + TypeScript, Tailwind CSS, Howler.js (Vite)
- Backend: Node.js + Express (serverless via `api/index.ts`)
- Database: Turso (libSQL / `@libsql/client`) — remote SQLite-compatible
- File Storage: Vercel Blob (`@vercel/blob`) for user uploads
- AI Chat: Groq (`llama-3.3-70b-versatile`)
- Auth: JWT in httpOnly cookies (bcrypt + jsonwebtoken)
- Testing: Jest + Supertest (backend), Vitest + React Testing Library (frontend)
- Deployed on Vercel (static + serverless)

## Mandatory Code Style

- Do not overengineer. Keep it simple.
- Identify root cause before fixing issues. Prove with evidence, then fix.
- Favor clear, concise docstring comments.
- Favor short modules, short functions. Name things clearly.
- Never use emojis in code, print statements, or logging.
- Keep README.md concise.

## Testing Rules

- Every new Express endpoint gets a Supertest test.
- Every new React component gets at least one Vitest test.
- Run tests after every session before committing.
- Use in-memory libSQL (`createClient({ url: ':memory:' })`) for all database tests (never the real Turso URL).

## Debugging Rules

- Always identify root cause BEFORE fixing.
- Reproduce the bug consistently first.
- Try one fix at a time. Be methodical.
- Do not apply workarounds. Fix the real problem.

## File Structure

```
/api             Vercel serverless entry point (wraps Express app)
/client          React/TS frontend (Vite)
/server          Express backend
/shared          Shared TypeScript types (Track, SearchTrack, TrackSource)
/server/db       libSQL database helpers + migrations
/server/samples  Bundled sample tracks (served via stream endpoint)
/docs            Architecture, decisions, plan, checklist docs
```

Note: there is no `/server/uploads` — user uploads go to Vercel Blob, not the filesystem.

## Required Environment Variables

| Variable | Purpose |
|---|---|
| `TURSO_URL` | Turso libSQL database URL |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |
| `GROQ_API_KEY` | Groq LLM inference |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | Local dev port (default 3001) |

Set in `.env` locally (gitignored) and in Vercel project settings for production/preview.

## Documentation Rules

- Add an entry to `docs/DECISIONS.md` whenever a library or architecture choice is made.
- `docs/PLANCHECKLIST.md` is updated at the end of every session.
- Never write to `docs/REVIEW.md` — that belongs to the opencode sub-agent.

## Quick Reference: Commands

```
# Development
npm run dev          # Start both client and server (use concurrently)
npm run dev:client   # Frontend only (port 5173)
npm run dev:server   # Backend only (port 3001)

# Testing
npm test             # Run all tests
npm run test:client  # Vitest (frontend)
npm run test:server  # Jest (backend)

# Deployment
vercel               # Preview deploy
vercel --prod        # Production deploy
```
