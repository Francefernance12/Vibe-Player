# Plan Checklist

Track progress session by session. Check off items as they are completed and verified.
This file is the first thing any agent or collaborator should read to understand current state.

**Legend**: ✅ Done · 🔄 In progress · ⬜ Not started · ❌ Blocked · ~~strikethrough~~ Superseded

---

## Phase 1 — Beta Playback ✅ COMPLETE

### Session 1A — Project Scaffold + Backend API

- ✅ Monorepo structure created (`/client`, `/server`, `/shared`)
- ✅ `CLAUDE.md` added to project root
- ✅ Express server scaffolded with basic error handling
- ✅ `GET /api/health` endpoint — returns `{ status: "ok" }`
- ✅ `GET /api/tracks` endpoint — returns list of sample + uploaded tracks
- ✅ `POST /api/tracks/upload` endpoint — accepts audio file, saves to `/server/uploads/`
- ✅ `GET /api/tracks/:filename/stream` endpoint — streams audio file by filename
- ✅ Sample audio files added to `/server/samples/` (sample1.mp3, sample2.mp3, sample3.mp3)
- ✅ Jest + Supertest installed and configured
- ✅ Test: health check returns 200
- ✅ Test: `/api/tracks` returns an array
- ✅ Test: upload returns 201 with track metadata
- ✅ Test: stream endpoint returns correct audio content-type
- ✅ All tests pass: `npm run test:server`
- ✅ **Checkpoint**: `curl localhost:3001/api/health` → `{ status: "ok" }`

---

### Session 1B — Frontend UI + Audio Engine

- ✅ React + TypeScript + Vite scaffolded in `/client`
- ✅ Tailwind CSS installed and configured
- ✅ Howler.js installed (`howler` + `@types/howler`)
- ✅ `TrackList` component — fetches `/api/tracks`, renders list
- ✅ `PlayerControls` component — play/pause, previous/next buttons
- ✅ `ProgressBar` component — current time / duration display, seekable (ref-based, no setState on tick)
- ✅ `VolumeControl` component — volume slider
- ✅ `FileUpload` component — drag-and-drop + click to upload
- ✅ Howler.js wired via `usePlayer` hook to all controls
- ✅ Vite proxy configured (`/api` → `localhost:3001`)
- ✅ Vitest + React Testing Library installed
- ✅ Test: `TrackList` renders correct number of items from mock data
- ✅ Test: `PlayerControls` calls `onPlay` when play button clicked
- ✅ Test: `ProgressBar` renders correct time string
- ✅ All tests pass: `npm run test:client` (10 tests, 3 files)
- ✅ **Checkpoint**: Upload MP3 → appears in list → plays with working seek/pause

---

### Session 1C — Polish + Vercel Deployment

- ✅ `vercel.json` configured (client at `/`, API routed via rewrites to `/api/index.ts`)
- ✅ Express wrapped for Vercel serverless compatibility (`api/index.ts` exports app)
- ✅ `/tmp` used for uploads on Vercel; samples bundled via `includeFiles`
- ✅ `.env` (PORT=3001) set up, `.env` confirmed in `.gitignore`
- ✅ Full test suite passes: 5 server + 10 client = 15 tests
- ✅ Deployed to Vercel: `vercel --prod` — https://vibe-player.vercel.app
- ✅ Live URL verified: health check + tracks working
- ✅ Code pushed to GitHub
- ✅ **Checkpoint**: Live Vercel URL serves the app end-to-end

---

## Phase 2 — External APIs

### ~~Session 2A (Spotify attempt) — SUPERSEDED~~

> Spotify Web API requires the app owner to have an active Premium subscription
> to use the search endpoint. The implementation was correct but the API returns
> 403 regardless of credentials without Premium. All Spotify code will be
> removed and replaced with Deezer in the new Session 2A below.

- ~~✅ GitHub MCP configured~~
- ~~✅ Spotify Web API (Client Credentials) endpoint built~~
- ~~✅ `GET /api/search?q=` endpoint — calls Spotify search~~
- ~~✅ `SearchBar` component — debounced input~~
- ~~✅ `SearchResults` component~~
- ~~✅ Spotify preview URLs wired to Howler~~
- ~~✅ Tests written (8 server, 13 client)~~
- ~~❌ **Checkpoint blocked**: Spotify returns 403 — Premium required~~

---

### Session 2A — Deezer Search (replaces Spotify) ✅

> Deezer public API requires no API key, no OAuth, no `.env` variables.
> Search returns track metadata + direct 30-second preview MP3 URLs.
> All Spotify-specific code removed and replaced.

- ✅ Decision entry added to `docs/DECISIONS.md` — Deezer chosen, Spotify blocked reason documented
- ✅ All Spotify-specific server code removed (`routes/search.ts` rewritten)
- ✅ Token-caching / credential logic removed from server
- ✅ `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` removed from `.env`
- ✅ `GET /api/search?q=` rewritten to proxy `https://api.deezer.com/search?q=`
- ✅ Response normalized to `{ id, title, artist, albumArt, previewUrl, durationMs, source: 'deezer' }`
- ✅ `client/src/types.ts` updated — `SearchTrack.source` changed to `'deezer'`
- ✅ `SearchBar` component rewired — no API key needed, "Spotify" references removed
- ✅ `SearchResults` component updated — shows album art, "Deezer results" label
- ✅ Tests rewritten:
  - ✅ `GET /api/search` returns 400 with no query
  - ✅ `GET /api/search?q=test` returns correct Deezer shape (mock fetch)
  - ✅ `SearchBar` renders results from mock data
- ✅ All tests pass: 8 server (2 files) + 13 client (4 files)
- ✅ Manual smoke test: `curl /api/search?q=radiohead` returns Deezer tracks with previewUrl confirmed
- ✅ **Checkpoint**: Search returns Deezer results, preview audio plays

---

### Session 2B — Playlist Management (Frontend Only)

- ✅ `PlaylistContext` created with React context (`/client/src/contexts/PlaylistContext.tsx`)
- ✅ "Add to playlist" button on each track (local + Deezer results), shows ✓ when already added
- ✅ `PlaylistPanel` component with reorderable list (`@dnd-kit/sortable`)
- ✅ `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` installed
- ✅ Playlist persisted to `localStorage` with versioned key (`playlist:v1`)
- ✅ `localStorage` access wrapped in try/catch
- ✅ Test: add local track to playlist
- ✅ Test: add Deezer track to playlist
- ✅ Test: no duplicates added
- ✅ Test: remove track from playlist
- ✅ Test: reorder tracks in playlist
- ✅ Test: persists to localStorage and reloads
- ✅ All tests pass: 8 server (2 files) + 20 client (5 files)
- ⬜ **Checkpoint**: Playlist persists on page refresh

> Note: YouTube streaming was the original Session 2B. Moved to Phase 4 backlog
> due to TOS complexity. Playlist management is higher value for Phase 3 prep.

---

## Phase 3 — Authentication + Database

### Session 3A — Schema Update + SQLite Setup

> Before writing any code, update `docs/DATABASE_SCHEMA.md` to replace
> `'spotify'` with `'deezer'` in the source enum and track JSON shapes.

- ⬜ `docs/DATABASE_SCHEMA.md` updated: source enum changed to `'local' | 'deezer'`
- ⬜ Deezer track JSON shape documented in schema
- ⬜ `better-sqlite3` installed
- ⬜ `/server/db/migrations/` directory created
- ⬜ `001_create_users.sql` written from schema
- ⬜ `002_create_playlists.sql` written from schema
- ⬜ `003_create_playlist_tracks.sql` written from schema
- ⬜ Migration runner (`migrate.ts`) implemented
- ⬜ `db/index.ts` query helper module written with full TypeScript types
- ⬜ All DB operations tested with in-memory SQLite
- ⬜ All tests pass
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
- ⬜ All tests pass
- ⬜ **Checkpoint**: Register → get JWT → use on `/api/auth/me` via curl

---

### Session 3C — Auth UI + Playlist Persistence

- ⬜ `LoginPage` component built
- ⬜ `RegisterPage` component built
- ⬜ JWT stored in `httpOnly` cookie
- ⬜ `AuthContext` created (current user, login, logout)
- ⬜ `GET /api/playlists` endpoint (auth-protected)
- ⬜ `POST /api/playlists` endpoint (auth-protected)
- ⬜ `PUT /api/playlists/:id/tracks` endpoint (reorder)
- ⬜ Playlist save/load migrated from `localStorage` to API
- ⬜ Test: login form shows error on bad credentials
- ⬜ Test: register form validates email format
- ⬜ All tests pass
- ⬜ **Checkpoint**: Register → build playlist → refresh → playlist still there

---

## Phase 4 — Polish + Scale

### Session 4A — Performance

- ⬜ Root `tsconfig.json` / `server/tsconfig.json` conflict resolved
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

| Session | Date | Findings | Resolved |
|---|---|---|---|
| 1A–1C | 2026-04-19 | `.env` in diff; tsconfig conflict; missing error boundary on SearchBar | ⬜ Pending |
| 2A (Spotify) | 2026-04-20 | Spotify 403 — Premium required; code complete but blocked | ✅ Superseded by Deezer |