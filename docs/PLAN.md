# Music Player Web App — Project Plan

## Project Overview

A lightweight, Vercel-optimized music player web app built with React/TypeScript,
Tailwind CSS, Node.js/Express, and SQLite. Built incrementally across ~5-hour sessions.

**Deployment**: Vercel (serverless-compatible)

---

## Tools & Agents Reference

| Type | Name | Purpose |
|---|---|---|
| Main agent | Claude Code (`claude`) | Primary development |
| Sub-agent | OpenCode (`opencode/big-pickle`) | Commit review + PR creation |
| Claude Code command | `/review` — `.claude/commands/review.md` | Manual end-of-session trigger |
| MCP | Spotify MCP | Phase 2 — music search |
| MCP | YouTube Music MCP | Phase 2 — audio streaming |
| Plugin | `frontend-design@claude-plugins-official` | High-quality UI generation |
| Skill | `vercel-react-best-practices` | Re-render and performance rules |
| Playwright MCP | (optional) | Live browser testing of playback |

> GitHub MCP is not used. Git and PR operations are handled by the opencode
> sub-agent via the `/review` slash command. Run `/review` manually at the
> end of each session — there is no auto-hook.

---

## Repository Structure

```
/
├── .claude/
│   ├── commands/
│   │   └── review.md              ← /review slash command
│   ├── skills/
│   │   └── vercel-react-best-practices/
│   │       ├── SKILL.md
│   │       ├── AGENTS.md
│   │       └── rules/             ← individual rule files
│   └── settings.json              ← frontend-design plugin enabled
│
├── client/                        ← React/TS frontend (Vite)
│   └── src/
│       ├── components/            ← TrackList, PlayerControls, ProgressBar, etc.
│       ├── contexts/              ← PlaylistContext, AuthContext (Phase 3)
│       ├── pages/                 ← LoginPage, RegisterPage (Phase 3)
│       └── hooks/                 ← usePlayer, usePlaylist, etc.
│
├── server/                        ← Node/Express backend
│   ├── routes/                    ← tracks, upload, stream, auth, search
│   ├── db/                        ← migrations + index.ts (Phase 3)
│   ├── uploads/                   ← user-uploaded audio (gitignored)
│   └── samples/                   ← bundled royalty-free tracks
│
├── shared/                        ← shared TypeScript types
│
├── docs/
│   ├── DATABASE_SCHEMA.md         ← written + reviewed before any DB code
│   ├── DECISIONS.md               ← log of library/architecture choices
│   ├── PLAN.md                    ← this file
│   ├── PLANCHECKLIST.md           ← updated every session
│   ├── REVIEW.md                  ← opencode only, never written by Claude Code
│   └── ARCHITECTURE.md            ← Phase 4
│
├── skills-lock.json
├── CLAUDE.md                      ← Claude Code instructions
├── .env                           ← gitignored
├── .gitignore
└── vercel.json
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Styling | Tailwind CSS |
| Audio | Howler.js |
| Backend | Node.js + Express |
| Database | SQLite via better-sqlite3 (Phase 3+) |
| Testing (backend) | Jest + Supertest |
| Testing (frontend) | Vitest + React Testing Library |
| Deployment | Vercel |

---

## CLAUDE.md Rules (enforced every session)

```
## VERY IMPORTANT
- Be simple. Work incrementally. Validate each step before moving on.
- Use latest stable library APIs.

## Documentation Rules
- Add an entry to docs/DECISIONS.md whenever a library or architecture choice is made.
- Update docs/PLANCHECKLIST.md at the end of every session.
- Never write to docs/REVIEW.md — that belongs to the opencode sub-agent.
- docs/DATABASE_SCHEMA.md must exist and be approved before any DB code (Phase 3).

## Testing Rules
- Every new Express endpoint gets a Supertest test.
- Every new React component gets at least one Vitest test.
- DB tests always use :memory: SQLite, never the real file.
- Run all tests before every commit.

## Code Style
- Do not overengineer.
- Identify root cause before fixing issues.
- Short modules, short functions, clear names.
- No emojis in code or logs.

## End of Session
1. Update docs/PLANCHECKLIST.md
2. Run full test suite — fix any failures
3. Commit
4. Run /review
```

---

## Phase 1 — Beta Playback (No Database)

**Goal**: A working music player that plays uploaded audio files and bundled
samples. No login, no persistence. All tests pass on a live Vercel URL.

---

### Session 1A — Project Scaffold + Backend API

**Deliverable**: Working Express server with four endpoints and passing tests.

Steps:
1. Create monorepo structure: `/client`, `/server`, `/shared`, `/docs`
2. Confirm `CLAUDE.md` exists in root with all rules above
3. Confirm `docs/PLANCHECKLIST.md` exists with all phases listed, all unchecked
4. Confirm `docs/DECISIONS.md` exists (even if empty)
5. Scaffold Express server in `/server`
6. Implement four endpoints:
   - `GET /api/health` → `{ status: "ok" }`
   - `GET /api/tracks` → array of track metadata from `/server/samples/` and `/server/uploads/`
   - `POST /api/upload` → accepts `multipart/form-data`, saves to `/server/uploads/`, returns track metadata
   - `GET /api/tracks/:id/stream` → streams audio file, sets correct `Content-Type`
7. Add 2–3 royalty-free `.mp3` files to `/server/samples/`
8. Install Jest + Supertest, write tests:
   - `GET /api/health` returns 200 with `{ status: "ok" }`
   - `GET /api/tracks` returns an array
   - `POST /api/upload` with a test file returns 201 with track metadata
   - `GET /api/tracks/:id/stream` returns a response with audio `Content-Type`
9. Run `npm run test:server` — all must pass
10. Add decision entry to `docs/DECISIONS.md` for any library choices made
11. Update `docs/PLANCHECKLIST.md`
12. Commit, run `/review`

**Checkpoint**: `curl http://localhost:3001/api/health` returns `{ "status": "ok" }`

---

### Session 1B — Frontend UI + Audio Engine

**Deliverable**: Full player UI wired to the backend, playable in browser.

Steps:
1. Scaffold React + TypeScript + Vite in `/client`
2. Install and configure Tailwind CSS
3. Install Howler.js: `npm install howler @types/howler`
4. Configure Vite proxy: `/api` → `http://localhost:3001`
5. Build components in this order — validate each before moving to the next:
   - `TrackList` — fetches `GET /api/tracks`, renders a clickable list
   - `PlayerControls` — play/pause, previous/next; wired to Howler.js
   - `ProgressBar` — current time / duration display, seekable via click/drag;
     use a `ref` to update the bar on Howler ticks — do NOT use `setState`
     on every tick, this causes unnecessary re-renders
   - `VolumeControl` — volume slider wired to Howler
   - `FileUpload` — drag-and-drop or click; calls `POST /api/upload`
6. Consult `.claude/skills/vercel-react-best-practices/SKILL.md` before writing
   any component — apply relevant rules (especially re-render section 5)
7. Write Vitest + React Testing Library tests:
   - `TrackList` renders the correct number of items from mock data
   - `PlayerControls` calls `onPlay` when play button is clicked
   - `ProgressBar` renders the correct time string format
8. Run `npm run test:client` — all must pass
9. Manual smoke test: upload an MP3 → appears in list → plays → seek works → pause works
10. Update `docs/PLANCHECKLIST.md`
11. Commit, run `/review`

**Checkpoint**: Upload a file, play it, seek to a specific point — all working locally.

---

### Session 1C — Polish + Vercel Deployment

**Deliverable**: Live Vercel URL with working upload and playback.

Steps:
1. Add `vercel.json`:
   - Route `/api/*` to Express server function
   - Route everything else to the Vite client build
2. Wrap Express app for Vercel serverless: `module.exports = app`
3. Add `.env` support via `dotenv`; confirm `.env` is in `.gitignore`
4. Run full test suite (`npm run test:server` + `npm run test:client`) — fix any failures
5. Run `vercel --prod`
6. Verify live URL:
   - Health check returns `{ "status": "ok" }`
   - Upload an audio file
   - Play it back
7. Update `docs/PLANCHECKLIST.md`: mark Session 1C and Phase 1 complete
8. Commit, run `/review` — opencode creates PR from `phase-1` branch into `main`

**Checkpoint**: Live Vercel URL plays uploaded audio. All tests pass.

---

## Phase 2 — External APIs

**Goal**: Search and stream from Spotify and/or YouTube. Playlist management
persisted to localStorage (no database yet).

> Spotify requires OAuth app registration. YouTube has TOS restrictions on
> audio extraction. Document every decision in `docs/DECISIONS.md`.

---

### Session 2A — Spotify MCP + Search Endpoint

**Deliverable**: Working search bar returning real Spotify track metadata.

Steps:
1. Configure Spotify MCP — document the setup in `docs/DECISIONS.md`
2. Add `GET /api/search?q=` endpoint proxying Spotify search results
3. Build `SearchBar` component in the frontend
4. Display search results alongside local tracks
5. Write tests — mock the MCP response in Supertest tests
6. Update `docs/PLANCHECKLIST.md`
7. Commit, run `/review`

**Checkpoint**: Typing in the search bar returns real Spotify track metadata.

---

### Session 2B — YouTube Audio Streaming

**Deliverable**: Pasting a YouTube URL plays audio in the player.

Steps:
1. Research YouTube MCP or yt-dlp; document the chosen approach in `docs/DECISIONS.md`
2. Add `GET /api/youtube/stream?url=` endpoint — pipe audio through Express
3. Set correct `Content-Type` and streaming headers
4. Add a YouTube URL input field to the UI
5. Wire Howler.js to accept the streamed URL
6. Write tests for the stream endpoint
7. Update `docs/PLANCHECKLIST.md`
8. Commit, run `/review`

**Checkpoint**: Paste a YouTube URL → app plays audio.

---

### Session 2C — Playlist Management (Frontend Only)

**Deliverable**: Reorderable playlist that persists across page refreshes.

Steps:
1. Create `PlaylistContext` in `/client/src/contexts/`
2. Add "Add to playlist" button on each track (local + search results)
3. Build `PlaylistPanel` component with drag-and-drop (`@dnd-kit/core`)
4. Persist playlist to `localStorage` — this is temporary, replaced in Phase 3
5. Write Vitest tests for playlist context: add, remove, reorder
6. Update `docs/PLANCHECKLIST.md`
7. Commit, run `/review` — opencode creates PR from `phase-2` branch into `main`

**Checkpoint**: Build a playlist, reorder it, refresh — it persists.

---

## Phase 3 — Authentication + Database

**Goal**: Users can register, log in, and have playlists saved server-side.
`docs/DATABASE_SCHEMA.md` already exists and is approved — use it as the
source of truth. Do not deviate from it without updating the doc first.

---

### Session 3A — SQLite Setup + Migrations

**Deliverable**: All database operations tested with in-memory SQLite.

Steps:
1. Confirm `docs/DATABASE_SCHEMA.md` is the approved version before writing code
2. Install `better-sqlite3`
3. Create `/server/db/migrations/`:
   - `001_create_users.sql`
   - `002_create_playlists.sql`
   - `003_create_playlist_tracks.sql`
   - Write these exactly from `docs/DATABASE_SCHEMA.md` — no deviations
4. Write `/server/db/migrate.ts` — simple runner that executes migrations in order
5. Write `/server/db/index.ts` — typed query helpers for all tables
6. Write Jest tests for all DB operations using `:memory:` database
7. Run `npm run test:server` — all must pass
8. Update `docs/PLANCHECKLIST.md`
9. Commit, run `/review`

**Checkpoint**: All DB tests pass with in-memory SQLite. No real `.db` file created.

---

### Session 3B — Auth Endpoints

**Deliverable**: Register and login flow working via curl/Postman.

Steps:
1. Install `bcrypt` and `jsonwebtoken`
2. Implement endpoints:
   - `POST /api/auth/register` — validate input, hash password (cost 12), insert user, return JWT
   - `POST /api/auth/login` — verify credentials, return JWT
   - `GET /api/auth/me` — decode JWT from `httpOnly` cookie, return user
3. Write `authMiddleware` — attaches user to request or returns 401
4. Apply `authMiddleware` to all playlist endpoints
5. Write Supertest tests:
   - Register creates user, returns JWT
   - Login with wrong password returns 401
   - `GET /api/auth/me` with valid JWT returns user
   - `GET /api/auth/me` with no JWT returns 401
6. Update `docs/PLANCHECKLIST.md`
7. Commit, run `/review`

**Checkpoint**: `curl -X POST /api/auth/register` → get JWT → use on `/api/auth/me`.

---

### Session 3C — Auth UI + Playlist Persistence

**Deliverable**: Full end-to-end auth flow with server-side playlist storage.

Steps:
1. Build `LoginPage` and `RegisterPage` in `/client/src/pages/`
2. Store JWT in `httpOnly` cookie (set by server response, not JS)
3. Create `AuthContext` in `/client/src/contexts/` — current user, login, logout
4. Add `GET /api/playlists` and `POST /api/playlists` endpoints (auth-protected)
5. Add `PUT /api/playlists/:id/tracks` for reorder operations
6. Migrate playlist save/load from `localStorage` to the API
7. Write Vitest tests for auth UI:
   - Login form shows error on bad credentials
   - Register form validates email format
8. Update `docs/PLANCHECKLIST.md`
9. Commit, run `/review` — opencode creates PR from `phase-3` branch into `main`

**Checkpoint**: Register → log in → build playlist → refresh → playlist persists.

---

## Phase 4 — Polish + Scale

**Goal**: Production-ready performance, mobile support, and documented architecture.

---

### Session 4A — Performance Audit

Steps:
1. Run Lighthouse on the live Vercel URL
2. Fix any score below 80 on mobile (lazy loading, bundle splitting)
3. Run `vite-plugin-visualizer` to inspect bundle composition
4. Audit `ProgressBar` — confirm Howler.js ticks do not cause re-renders
   (ref-based approach from Session 1B should already handle this)
5. Add loading skeletons to `TrackList` and search results
6. Update `docs/PLANCHECKLIST.md`
7. Commit, run `/review`

**Checkpoint**: Lighthouse performance score > 80 on mobile.

---

### Session 4B — Mobile Responsiveness

Steps:
1. Audit all components at 375px viewport width
2. Fix Tailwind breakpoints for small screens
3. Implement bottom-sheet player for mobile (slides up when a track is playing)
4. Add swipe-to-skip gesture (`react-swipeable`)
5. Update `docs/PLANCHECKLIST.md`
6. Commit, run `/review`

**Checkpoint**: App is fully usable on a phone screen.

---

### Session 4C — Backlog + Architecture Docs

Steps:
1. Write `docs/ARCHITECTURE.md` documenting current system design
2. Create `BACKLOG.md` in root with effort vs. impact scoring for each idea
3. Pick one item from the backlog and implement it
4. Commit, run `/review` — opencode creates final PR into `main`

**Backlog ideas to score**:
- Offline mode (service worker + Cache API)
- Waveform visualizer (Web Audio API `AnalyserNode`)
- Collaborative playlist URLs (read-only, no login required)
- Last.fm scrobbling
- PWA — installable on phone
- PostgreSQL migration for multi-user scale
- Discord Rich Presence

---

## Quick Reference

```bash
# Development
npm run dev           # client + server together
npm run dev:client    # frontend only (port 5173)
npm run dev:server    # backend only (port 3001)

# Testing
npm run test:server   # Jest + Supertest
npm run test:client   # Vitest + React Testing Library

# Review + PR (manual, end of session)
/review

# Deploy
vercel --prod
```