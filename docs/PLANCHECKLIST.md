# Plan Checklist

Track progress session by session. Check off items as they are completed and verified.
This file is the first thing any agent or collaborator should read to understand current state.

**Legend**: ✅ Done · 🔄 In progress · ⬜ Not started · ❌ Blocked

---

## Phase 1 — Beta Playback

### Session 1A — Project Scaffold + Backend API

- ⬜ Monorepo structure created (`/client`, `/server`, `/shared`)
- ⬜ `CLAUDE.md` added to project root
- ⬜ Express server scaffolded with basic error handling
- ⬜ `GET /api/health` endpoint — returns `{ status: "ok" }`
- ⬜ `GET /api/tracks` endpoint — returns list of sample + uploaded tracks
- ⬜ `POST /api/upload` endpoint — accepts audio file, saves to `/server/uploads/`
- ⬜ `GET /api/tracks/:id/stream` endpoint — streams audio file by ID
- ⬜ Sample audio files added to `/server/samples/`
- ⬜ Jest + Supertest installed and configured
- ⬜ Test: health check returns 200
- ⬜ Test: `/api/tracks` returns an array
- ⬜ Test: upload returns 201 with track metadata
- ⬜ Test: stream endpoint returns correct audio content-type
- ⬜ All tests pass: `npm run test:server`
- ⬜ **Checkpoint**: `curl localhost:3001/api/health` → `{ status: "ok" }`

---

### Session 1B — Frontend UI + Audio Engine

- ⬜ React + TypeScript + Vite scaffolded in `/client`
- ⬜ Tailwind CSS installed and configured
- ⬜ Howler.js installed (`howler` + `@types/howler`)
- ⬜ `TrackList` component — fetches `/api/tracks`, renders list
- ⬜ `PlayerControls` component — play/pause, previous/next buttons
- ⬜ `ProgressBar` component — current time / duration display, seekable
- ⬜ `VolumeControl` component — volume slider
- ⬜ `FileUpload` component — drag-and-drop + click to upload
- ⬜ Howler.js wired to `PlayerControls` and `ProgressBar`
- ⬜ Vite proxy configured (`/api` → `localhost:3001`)
- ⬜ Vitest + React Testing Library installed
- ⬜ Test: `TrackList` renders correct number of items from mock data
- ⬜ Test: `PlayerControls` calls `onPlay` when play button clicked
- ⬜ Test: `ProgressBar` renders correct time string
- ⬜ All tests pass: `npm run test:client`
- ⬜ **Checkpoint**: Upload MP3 → appears in list → plays with working seek/pause

---

### Session 1C — Polish + Vercel Deployment

- ⬜ `vercel.json` configured (client at `/`, API at `/api`)
- ⬜ Express wrapped for Vercel serverless compatibility
- ⬜ `.env` + `dotenv` set up, `.env` added to `.gitignore`
- ⬜ Full test suite passes before deploy
- ⬜ Deployed to Vercel: `vercel --prod`
- ⬜ Live URL verified: health check, upload, playback all work
- ⬜ Code pushed to GitHub via GitHub MCP
- ⬜ **Checkpoint**: Live Vercel URL plays music end-to-end

---

## Phase 2 — External APIs + MCP Integration

### Session 2A — GitHub MCP + Spotify Search

- ⬜ GitHub MCP configured in Claude Code settings
- ⬜ Spotify MCP capabilities researched and documented
- ⬜ `GET /api/search?q=` endpoint — proxies Spotify search
- ⬜ `SearchBar` component added to frontend
- ⬜ Search results displayed in UI
- ⬜ Test: search endpoint returns expected shape (mock MCP response)
- ⬜ **Checkpoint**: Typing in search bar returns real Spotify track metadata

---

### Session 2B — YouTube Audio Streaming

- ⬜ YouTube MCP or yt-dlp integration researched and decision documented in `DECISIONS.md`
- ⬜ `GET /api/youtube/stream?url=` endpoint added
- ⬜ Audio piped correctly through Express with proper headers
- ⬜ YouTube URL input added to UI
- ⬜ Howler.js wired to YouTube stream
- ⬜ Test: stream endpoint returns audio content-type
- ⬜ **Checkpoint**: Paste YouTube URL → app plays audio

---

### Session 2C — Playlist Management (Frontend)

- ⬜ `PlaylistContext` created with React context
- ⬜ "Add to playlist" button on each track
- ⬜ `PlaylistPanel` component with reorderable list
- ⬜ `@dnd-kit/core` installed for drag-and-drop
- ⬜ Playlist persisted to `localStorage` (temporary, replaced in Phase 3)
- ⬜ Test: add track to playlist
- ⬜ Test: remove track from playlist
- ⬜ Test: reorder tracks in playlist
- ⬜ **Checkpoint**: Playlist persists on page refresh

---

## Phase 3 — Authentication + Database

### Session 3A — SQLite Setup

- ⬜ `DATABASE_SCHEMA.md` reviewed before writing any code
- ⬜ `better-sqlite3` installed
- ⬜ `/server/db/migrations/` directory created
- ⬜ `001_create_users.sql` migration written
- ⬜ `002_create_playlists.sql` migration written
- ⬜ `003_create_playlist_tracks.sql` migration written
- ⬜ Migration runner (`migrate.ts`) implemented
- ⬜ `db.ts` query helper module written with full TypeScript types
- ⬜ All DB operations tested with in-memory SQLite
- ⬜ **Checkpoint**: All DB tests pass with `:memory:` database

---

### Session 3B — Auth Endpoints

- ⬜ `bcrypt` installed for password hashing
- ⬜ `jsonwebtoken` installed for JWT sessions
- ⬜ `POST /api/auth/register` endpoint
- ⬜ `POST /api/auth/login` endpoint
- ⬜ `GET /api/auth/me` endpoint
- ⬜ `authMiddleware` implemented and applied to protected routes
- ⬜ Test: register creates user, returns JWT
- ⬜ Test: login with wrong password returns 401
- ⬜ Test: `/api/auth/me` with valid JWT returns user
- ⬜ Test: `/api/auth/me` with no JWT returns 401
- ⬜ **Checkpoint**: Register → get JWT → use on `/api/auth/me` via curl

---

### Session 3C — Auth UI + Playlist Persistence

- ⬜ `LoginPage` component built
- ⬜ `RegisterPage` component built
- ⬜ JWT stored in `httpOnly` cookie
- ⬜ `AuthContext` created (current user, login, logout)
- ⬜ `GET /api/playlists` endpoint (auth-protected)
- ⬜ `POST /api/playlists` endpoint (auth-protected)
- ⬜ Playlist save/load migrated from `localStorage` to API
- ⬜ Test: login form shows error on bad credentials
- ⬜ Test: register form validates email format
- ⬜ **Checkpoint**: Register → build playlist → refresh → playlist still there

---

## Phase 4 — Polish + Scale

### Session 4A — Performance

- ⬜ Lighthouse audit run on live Vercel URL
- ⬜ Performance issues identified and fixed
- ⬜ Loading skeletons added to `TrackList` and search results
- ⬜ Bundle size audited with `vite-plugin-visualizer`
- ⬜ **Checkpoint**: Lighthouse score > 80 on mobile

---

### Session 4B — Mobile Responsiveness

- ⬜ All components audited at 375px viewport
- ⬜ Tailwind breakpoints fixed for mobile
- ⬜ Bottom-sheet player implemented for mobile
- ⬜ Swipe gestures added (`react-swipeable`)
- ⬜ **Checkpoint**: App is fully usable on a phone

---

### Session 4C — Backlog + Architecture Docs

- ⬜ `BACKLOG.md` created with effort vs. impact matrix
- ⬜ `ARCHITECTURE.md` written documenting current system design
- ⬜ One backlog feature selected and implemented
- ⬜ **Checkpoint**: Docs written, feature shipped

---

## Agent Review Log

Use this section to record findings from the OpenCode commit reviewer.

| Session | Commit | Findings | Resolved |
|---|---|---|---|
| — | — | — | — |