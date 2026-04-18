# Music Player Web App — Project Plan

## Project Overview

A lightweight, Vercel-optimized music player web app built with React/TypeScript, Tailwind CSS, Node.js/Express, and SQLite. Designed to be learned and built incrementally over multiple sessions.

**Repo**: Connected via GitHub MCP Server  
**Deployment**: Vercel (serverless-compatible)  
**Session structure**: Each session chunk fits within a ~5-hour reset window

---

## Tech Stack


| Layer              | Choice                         | Reason                                |
| ------------------ | ------------------------------ | ------------------------------------- |
| Frontend           | React + TypeScript             | Strong tooling, Claude excels with it |
| Styling            | Tailwind CSS                   | Utility-first, fast iteration         |
| Audio              | Howler.js                      | Cross-browser audio, simple API       |
| Backend            | Node.js + Express              | Lightweight, well-documented          |
| Database           | SQLite (via better-sqlite3)    | Zero-config, easily swappable         |
| Testing (backend)  | Jest + Supertest               | Standard Express testing stack        |
| Testing (frontend) | Vitest + React Testing Library | Vite-native, fast                     |
| Build/Dev          | Vite                           | Fast HMR for React/TS                 |
| Deployment         | Vercel                         | Edge-optimized, free tier             |


---

## Phase 1 — Beta Playback (No Database)

**Goal**: A working music player that can play uploaded audio files and bundled sample tracks. No login, no persistence.

### Session 1A — Project Scaffold + Backend API

**What you'll build**: The skeleton of the project with a working Express server that serves audio files.

Steps for Claude Code:

1. Initialize the monorepo structure
  ```
   /client   (React/TS/Vite frontend)
   /server   (Node/Express backend)
   /shared   (shared TypeScript types)
  ```
2. Set up `CLAUDE.md` in root with coding principles (see template below)
3. Scaffold the Express server
  - `GET /api/health` — health check endpoint
  - `GET /api/tracks` — returns list of available sample tracks
  - `POST /api/upload` — accepts audio file upload (multipart/form-data), stores in `/server/uploads/`
  - `GET /api/tracks/:id/stream` — streams audio file by ID
4. Add sample audio files (royalty-free, e.g. from pixabay) to `/server/samples/`
5. Write Jest + Supertest unit tests for all endpoints
  - Test: health check returns 200
  - Test: `/api/tracks` returns an array
  - Test: upload returns 201 with track metadata
  - Test: stream endpoint returns audio content-type header
6. Verify all tests pass: `npm test`

**Checkpoint**: `curl http://localhost:3001/api/health` returns `{ status: "ok" }`

---

### Session 1B — Frontend UI + Audio Engine

**What you'll build**: A functional player UI wired to the backend.

Steps for Claude Code:

1. Scaffold the React/TS client with Vite
2. Install and configure Tailwind CSS
3. Install Howler.js: `npm install howler @types/howler`
4. Build components (in this order, validate each before next):
  - `TrackList` — fetches and displays `/api/tracks`, renders a list
  - `PlayerControls` — play/pause button, previous/next
  - `ProgressBar` — displays current time / duration, seekable
  - `VolumeControl` — slider for volume
  - `FileUpload` — drag-and-drop or click to upload audio files
5. Wire Howler.js to `PlayerControls` and `ProgressBar`
6. Add Vitest tests:
  - Test: `TrackList` renders a list when given mock track data
  - Test: `PlayerControls` calls onPlay when play button clicked
  - Test: `ProgressBar` renders correct time display
7. Configure Vite proxy to forward `/api` to Express (`localhost:3001`)
8. Verify end-to-end: upload a file, see it appear in list, press play

**Checkpoint**: Can upload an MP3, see it in the track list, and play it with working seek/pause.

---

### Session 1C — Polish + Deployment

**What you'll build**: Vercel deployment and quality pass.

Steps for Claude Code:

1. Add `vercel.json` to configure routing (client served at `/`, API at `/api`)
2. Make Express compatible with Vercel serverless (wrap in `module.exports`)
3. Add environment variable support via `.env` + `dotenv`
4. Run full test suite, fix any failures
5. Deploy to Vercel via CLI: `vercel --prod`
6. Verify deployed URL: health check, upload, playback all work
7. Push to GitHub repo via GitHub MCP

**Checkpoint**: Live URL plays music. GitHub repo is up to date.

---

## Phase 2 — External APIs + MCP Integration

**Goal**: Connect to external music sources. Users can search and stream from YouTube Music or Spotify.

> Note: Spotify and YouTube APIs have OAuth requirements. This phase will explore what's available via MCPs and may use yt-dlp or unofficial wrappers for YouTube audio. Document decisions as you go.

### Session 2A — GitHub MCP + Spotify MCP Setup

Steps for Claude Code:

1. Configure GitHub MCP server in Claude Code settings
2. Research Spotify MCP capabilities — what endpoints are available?
3. Add `GET /api/search?q=` endpoint that proxies Spotify search results
4. Display search results in a new `SearchBar` component on the frontend
5. Write tests for the search endpoint (mock the MCP response)

**Checkpoint**: Typing in the search bar returns real Spotify track metadata.

---

### Session 2B — YouTube Audio Streaming

Steps for Claude Code:

1. Research YouTube Music MCP or yt-dlp integration
2. Add `GET /api/youtube/stream?url=` endpoint
3. Stream audio through Express (pipe response, set correct headers)
4. Add a "YouTube URL" input field to the UI
5. Wire Howler.js to play the streamed YouTube audio
6. Test: stream endpoint returns audio stream with correct content-type

**Checkpoint**: Paste a YouTube URL, app plays the audio.

---

### Session 2C — Playlist Management (Frontend Only)

Steps for Claude Code:

1. Add playlist state to a React context (`PlaylistContext`)
2. "Add to playlist" button on each track (local + search results)
3. `PlaylistPanel` component — reorderable list (drag-and-drop with `@dnd-kit/core`)
4. Persist playlist to `localStorage` (no database yet)
5. Write Vitest tests for playlist context operations (add, remove, reorder)

**Checkpoint**: Can build a playlist from local files + Spotify results, reorder it, and it persists on refresh.

---

## Phase 3 — Authentication + Database

**Goal**: Users can register, log in, and have their playlists saved server-side.

### Session 3A — SQLite Database Setup

Steps for Claude Code:

1. Install `better-sqlite3` and set up `/server/db/` directory
2. Create database schema migrations:
  ```sql
   users (id, email, password_hash, created_at)
   playlists (id, user_id, name, created_at)
   playlist_tracks (id, playlist_id, track_data JSON, position)
  ```
3. Write a `db.ts` module with typed query helpers
4. Write Jest tests for all database operations (use in-memory SQLite for tests)

**Checkpoint**: `npm test` passes all DB tests with an in-memory database.

---

### Session 3B — Auth Endpoints

Steps for Claude Code:

1. Install `bcrypt` (password hashing) and `jsonwebtoken` (JWT sessions)
2. Add endpoints:
  - `POST /api/auth/register` — create user, return JWT
  - `POST /api/auth/login` — verify credentials, return JWT
  - `GET /api/auth/me` — return current user from JWT (auth middleware)
3. Add `authMiddleware` to protect future user-specific routes
4. Write Supertest tests for all auth flows (happy path + error cases)

**Checkpoint**: Register a user via curl/Postman, get a JWT back, use it on `/api/auth/me`.

---

### Session 3C — Auth UI + Playlist Persistence

Steps for Claude Code:

1. Build `LoginPage` and `RegisterPage` components
2. Store JWT in `httpOnly` cookie (more secure than localStorage)
3. Add `AuthContext` to React — provides current user and login/logout
4. Move playlist save/load from `localStorage` to `/api/playlists` endpoints
5. Add `GET /api/playlists` and `POST /api/playlists` endpoints (auth-protected)
6. Vitest tests for auth UI components (login form validation, error states)

**Checkpoint**: Register, log in, build a playlist, refresh the page — playlist is still there.

---

## Phase 4 — Polish, Performance, and Brainstorm

**Goal**: Production-readiness pass and exploration of next features.

### Session 4A — Performance Audit

Steps for Claude Code:

1. Run Lighthouse audit on deployed Vercel URL
2. Fix any critical performance issues (image optimization, lazy loading)
3. Add React.memo / useMemo to prevent unnecessary re-renders during audio playback (high-frequency updates from Howler.js)
4. Add loading skeletons for track list and search results
5. Audit and reduce bundle size with Vite's `vite-plugin-visualizer`

**Checkpoint**: Lighthouse performance score > 80 on mobile.

---

### Session 4B — Mobile Responsiveness

Steps for Claude Code:

1. Audit all components on mobile viewport (375px wide)
2. Fix Tailwind breakpoints for small screens
3. Implement a bottom-sheet player for mobile (slides up when track is playing)
4. Test gestures: swipe to skip track (use `react-swipeable`)

**Checkpoint**: App is fully usable on a phone screen.

---

### Session 4C — Brainstorm & Backlog

Ideas to evaluate and prioritize:

- **Offline mode** — service worker + cache API for recently played tracks
- **Waveform visualizer** — using Web Audio API's `AnalyserNode`
- **Collaborative playlists** — shared playlist URLs (no login required for viewer)
- **Discord Rich Presence** — show what you're listening to
- **Smart shuffle** — ML-style audio fingerprinting to group similar songs
- **Last.fm scrobbling** — track listening history
- **PostgreSQL migration** — swap SQLite for Postgres for multi-user scale
- **PWA** — installable on phone as a native-like app

Steps for Claude Code:

1. Create `BACKLOG.md` with scored feature ideas (effort vs. impact matrix)
2. Pick one small feature from the list and implement it
3. Write a `ARCHITECTURE.md` documenting current system design

---

## CLAUDE.md Template (put this in your project root)

```markdown
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

/client        React/TS frontend (Vite)
/server        Express backend
/shared        Shared TypeScript types
/server/db     SQLite database + migrations
/server/uploads  Uploaded audio files (gitignored)
/server/samples  Bundled sample tracks
```

---

## Quick Reference: Commands

```bash
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

