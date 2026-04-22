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
> 403 regardless of credentials without Premium. All Spotify code was
> removed and replaced with Deezer in the new Session 2A below.

---

### Session 2A — Deezer Search ✅ COMPLETE

> Deezer public API requires no API key, no OAuth, no `.env` variables.
> Search returns track metadata + direct 30-second preview MP3 URLs.

- ✅ Decision entry added to `docs/DECISIONS.md` — Deezer chosen, Spotify blocked
- ✅ `GET /api/search?q=` proxies Deezer, returns normalized `SearchTrack[]`
- ✅ `SearchBar` + `SearchResults` components built and wired
- ✅ `client/src/types.ts` updated — `SearchTrack.source: 'deezer'`
- ✅ Tests pass: search returns 400 without q, correct shape with q
- ✅ Manual smoke test: search returns Deezer tracks
- ✅ **Checkpoint**: Search results appear in UI

---

### Session 2B — Playlist Management (Frontend Only) ✅ COMPLETE

- ✅ `PlaylistContext` created with React context
- ✅ "Add to playlist" button on each track (local + Deezer results)
- ✅ `PlaylistPanel` component with drag-and-drop reordering (`@dnd-kit`)
- ✅ Playlist persisted to `localStorage` with versioned key (`playlist:v1`)
- ✅ All playlist context tests pass (add, remove, reorder, persistence)
- ✅ **Known issue**: Playlist items cannot be played (display-only)
- ✅ **Known issue**: Deezer preview URLs do not play (routing bug)
- ✅ **Checkpoint**: Playlist UI renders and persists

---
Session 2C — Bug Fixes + Core UX Features ✅ COMPLETE
Bug Fix 1 — Deezer Previews

✅ Add externalUrl?: string to Track in shared/types.ts AND client/src/types.ts
✅ Update usePlayer.play() to use externalUrl as Howler src when present
✅ Update handleSearchSelect in App.tsx to set externalUrl: result.previewUrl

Bug Fix 2 — Playlist Playback

✅ Add onPlay: (item: PlaylistItem) => void prop to PlaylistPanel
✅ Wire onPlay in App.tsx — local tracks use API route; Deezer items use externalUrl
✅ Make each SortableRow track-name area clickable
✅ Highlight currently-playing item in playlist

Delete Uploaded Tracks

✅ DELETE /api/tracks/:filename endpoint — deletes from uploads/ only, 403 for samples
✅ Supertest: delete succeeds for upload; returns 403 for sample
✅ Delete icon button on upload-source rows in TrackList (hidden for samples)
✅ On delete: call endpoint, remove from local state, stop playback if active
✅ Vitest: delete button renders only for upload rows

Sort & Filter

✅ Filter input above TrackList: real-time match on originalName
✅ Sort dropdown: A–Z, Z–A, Size ↑, Size ↓, Source (samples first)
✅ State in App.tsx, client-side only
✅ Vitest: filter narrows results; sort orders correctly

Wrap-up

✅ npm test — 40 tests pass (11 server + 29 client)
✅ Hotfix: client/src/types.ts missing externalUrl — caught by Vercel build on PR #3, fixed and pushed
⬜ Manual smoke test: Deezer plays · playlist plays · delete works · filter/sort works
⬜ Checkpoint: All four items working with passing tests (pending PR #3 merge)

---

Session 2D — Multi-Playlist + UI Polish ✅ COMPLETE

- ✅ PlaylistContext rewritten for multi-playlist support (`playlists:v2` storage key)
- ✅ `createPlaylist(name): string` added; `addLocal` now requires `playlistId`; `addDeezer` always targets favorites
- ✅ `PlaylistPanel` rewritten: collapsible accordion per playlist, chevron toggle, track count badge
- ✅ "New playlist" inline input with `create` button and Escape-to-cancel
- ✅ DndContext scoped per-playlist accordion section
- ✅ Currently-playing item highlighted with orange dot + animated pulse
- ✅ `TrackList` updated: inline playlist picker expands below each row (grid-rows animation)
- ✅ Picker shows all playlists with orange checkmark for already-added ones
- ✅ `SearchResults` updated: `playlists.some(...)` instead of stale `items` reference
- ✅ All tests updated for new multi-playlist API: 42 tests pass (11 server + 31 client)
- ✅ Update docs/PLANCHECKLIST.md and docs/DECISIONS.md

---

## Phase 3 — Authentication + Database

### Session 3A — Schema Update + SQLite Setup ✅ COMPLETE

- ✅ `docs/DATABASE_SCHEMA.md` updated: source enum `'local' | 'deezer'`, Spotify/YouTube references removed
- ✅ Deezer track JSON shape documented in schema
- ✅ `better-sqlite3` + `@types/better-sqlite3` installed in `/server`
- ✅ `/server/db/migrations/` directory created
- ✅ `001_create_users.sql` written from schema
- ✅ `002_create_playlists.sql` written from schema
- ✅ `003_create_playlist_tracks.sql` written from schema
- ✅ Migration runner (`server/db/migrate.ts`) — idempotent, tracks applied migrations in `_migrations` table
- ✅ `server/db/index.ts` — typed query helpers: users (CRUD), playlists (CRUD), playlist_tracks (add/remove/replace)
- ✅ `createMemoryDb()` helper for isolated test databases
- ✅ 11 DB tests in `server/src/__tests__/db.test.ts` — all pass with `:memory:`
- ✅ All tests pass: 22 server tests (11 original + 11 DB)
- ✅ **Checkpoint**: All DB tests pass with `:memory:` database

---

### Session 3B — Auth Endpoints ✅ COMPLETE

- ✅ `bcrypt` + `cookie-parser` installed for password hashing and cookie parsing
- ✅ `jsonwebtoken` installed for JWT sessions
- ✅ `POST /api/auth/register` endpoint — validates email/password, creates user, sets httpOnly cookie
- ✅ `POST /api/auth/login` endpoint — verifies credentials, sets httpOnly cookie
- ✅ `POST /api/auth/logout` endpoint — clears token cookie
- ✅ `GET /api/auth/me` endpoint — returns current user from JWT
- ✅ `authMiddleware` implemented in `server/src/middleware/auth.ts`
- ✅ Test: register creates user, returns 201 with id + email
- ✅ Test: register returns 409 if email already registered
- ✅ Test: register returns 400 for invalid email format
- ✅ Test: register returns 400 for short password
- ✅ Test: login with wrong password returns 401
- ✅ Test: login with unknown email returns 401
- ✅ Test: `/api/auth/me` with valid JWT cookie returns user
- ✅ Test: `/api/auth/me` with no JWT returns 401
- ✅ All tests pass: 34 server tests (22 prior + 9 auth + 3 search)
- ✅ **Checkpoint**: Register → get JWT cookie → use on `/api/auth/me`

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

- ✅ Root `tsconfig.json` / `server/tsconfig.json` conflict resolved (fixed in Phase 2 polish pass)
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
| 2B | 2026-04-20 | Playlist display-only (no playback); Deezer preview routing bug | ⬜ Scheduled for 2C |