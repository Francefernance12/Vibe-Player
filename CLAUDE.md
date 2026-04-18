# Music Player — Claude Guidelines

## VERY IMPORTANT

- Be simple. Approach tasks in a simple, incremental way.
- Work incrementally ALWAYS. Small, simple steps. Validate each increment before moving on.
- Use latest stable library APIs as of now.

## Project Context

This is a lightweight music player web app.
- Frontend: React + TypeScript, Tailwind CSS, Howler.js
- Backend: Node.js + Express
- Database: SQLite via better-sqlite3 (Phase 3+)
- Testing: Jest + Supertest (backend), Vitest + React Testing Library (frontend)
- Deployed on Vercel

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
- Use in-memory SQLite for all database tests (never the real file).

## Debugging Rules

- Always identify root cause BEFORE fixing.
- Reproduce the bug consistently first.
- Try one fix at a time. Be methodical.
- Do not apply workarounds. Fix the real problem.

## File Structure

`/client`        React/TS frontend (Vite)
`/server`        Express backend
`/shared`        Shared TypeScript types
`/server/db`     SQLite database + migrations
`/server/uploads`  Uploaded audio files (gitignored)
`/server/samples`  Bundled sample tracks


Quick Reference: Commands:
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