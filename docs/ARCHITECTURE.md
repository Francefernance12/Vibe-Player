# Architecture Reference

Last updated: 2026-05-07 (Post-7 Deezer cross-device + audio-on-logout fixes)

---

## System Overview

Vibe Player is a full-stack music player web app deployed on Vercel. The frontend is a React/TypeScript single-page application built with Vite; the backend is an Express API running as a Vercel serverless function. Audio files are stored on Vercel Blob (user uploads) or bundled with the server (sample tracks). Metadata and user data are persisted in a Turso-hosted libSQL (SQLite-compatible) database. Authentication uses JWTs stored in httpOnly cookies.

---

## Tech Stack

| Layer | Choice | Version |
|---|---|---|
| Frontend | React + TypeScript (Vite) | React 18, Vite 5 |
| Styling | Tailwind CSS | v3 |
| Audio | Howler.js | v2 |
| Backend | Node.js + Express | Express 4 |
| Database | Turso (libSQL) via `@libsql/client` | — |
| File Storage | Vercel Blob (`@vercel/blob`) | — |
| AI Inference | Groq (`llama-3.3-70b-versatile`) | — |
| Testing (backend) | Jest + Supertest | — |
| Testing (frontend) | Vitest + React Testing Library | — |
| Deployment | Vercel (serverless + static) | — |

---

## Repository Layout

```
/
├── api/
│   └── index.ts              ← Vercel serverless entry point (wraps Express app)
├── client/
│   ├── index.html            ← Google Fonts (Syne, JetBrains Mono, Cormorant Garamond)
│   └── src/
│       ├── App.tsx           ← Root: AuthGate + Player layout + tab state
│       ├── types.ts          ← Re-export barrel: Track, SearchTrack, TrackSource from shared/types.ts
│       ├── components/
│       │   ├── PlayerBar.tsx       ← Fixed bottom bar: controls, shuffle, loop, volume
│       │   ├── PlayerControls.tsx  ← Prev/play/next buttons
│       │   ├── ProgressBar.tsx     ← ref-based seek bar (no setState on tick)
│       │   ├── VolumeControl.tsx   ← Volume slider
│       │   ├── TrackList.tsx       ← Library list; desktop +/trash; mobile ⋮ menu
│       │   ├── SearchBar.tsx       ← Deezer search input
│       │   ├── SearchResults.tsx   ← Deezer result dropdown (absolute overlay)
│       │   ├── PlaylistPanel.tsx   ← Accordion per playlist; filter/sort; DnD
│       │   ├── FileUpload.tsx      ← Drag-and-drop + click upload
│       │   ├── StorageBar.tsx      ← Quota progress bar (tier badge, % used)
│       │   ├── Tooltip.tsx         ← Mouse-following track info card (desktop only)
│       │   ├── ChatBubble.tsx      ← Fixed orange FAB
│       │   ├── ChatWindow.tsx      ← Slide-in chat panel; action feedback lines
│       │   ├── PricingPage.tsx     ← Mockup tier page (feature/pricing-mockup branch)
│       │   ├── LoginPage.tsx       ← Auth form
│       │   └── RegisterPage.tsx    ← Auth form
│       ├── contexts/
│       │   ├── AuthContext.tsx     ← user, loading, login, register, logout
│       │   └── PlaylistContext.tsx ← playlists CRUD; API sync; localStorage fallback
│       ├── hooks/
│       │   ├── usePlayer.ts        ← Howler wiring; shuffle/loop/queue refs
│       │   ├── useChat.ts          ← Rolling 20-msg history; extractAction parser
│       │   └── useQuota.ts         ← Fetches quota; exposes refresh callback
│       └── utils/
│           ├── trackFilter.ts      ← Filter + sort helpers for TrackList
│           └── deezer.ts           ← resolveDeezerUrl: re-mints expiring preview URL at play time
├── server/
│   ├── db/
│   │   ├── index.ts           ← Async query helpers; initDb(); getDb()
│   │   ├── migrate.ts         ← Idempotent migration runner (uses db.executeMultiple)
│   │   └── migrations/
│   │       ├── 001_create_users.sql
│   │       ├── 002_create_playlists.sql
│   │       ├── 003_create_playlist_tracks.sql
│   │       ├── 004_create_uploaded_tracks.sql
│   │       ├── 005_add_indexes.sql
│   │       └── 006_create_deezer_tracks.sql
│   ├── samples/               ← Bundled royalty-free MP3s (served via stream endpoint)
│   └── src/
│       ├── app.ts             ← Express app; route registration; error middleware
│       ├── index.ts           ← Local dev entry: initDb() then app.listen()
│       ├── tracks.ts          ← Sample track metadata builder
│       ├── middleware/
│       │   └── auth.ts        ← JWT cookie verification; attaches req.user
│       └── routes/
│           ├── auth.ts        ← /register, /login, /logout, /me
│           ├── tracks.ts      ← GET /tracks, POST /upload, DELETE /:id, GET /:filename/stream, POST/DELETE /deezer
│           ├── search.ts      ← GET /search?q= (Deezer proxy)
│           ├── deezer.ts      ← GET /track/:id — fresh preview URL proxy (replaces expiring cached URL)
│           ├── playlists.ts   ← CRUD for user playlists + track membership
│           ├── quota.ts       ← GET /user/quota
│           ├── chat.ts        ← POST /chat (Groq, rate-limited)
│           └── health.ts      ← GET /health
├── shared/
│   └── types.ts               ← Track, SearchTrack shared between client + server
├── docs/
│   ├── ARCHITECTURE.md        ← this file
│   ├── DECISIONS.md           ← library and architecture decision log
│   ├── PLAN.md                ← phase-by-phase project plan
│   ├── PLANCHECKLIST.md       ← session-level progress tracker
│   ├── REVIEW.md              ← written by opencode sub-agent only
│   └── DATABASE_SCHEMA.md     ← approved before any Phase 3 DB code
├── .claude/
│   ├── commands/commitReview.md
│   └── skills/vercel-react-best-practices/
├── CLAUDE.md
├── vercel.json
└── package.json               ← root: concurrently dev script + test runners
```

---

## Frontend Architecture

### Component Hierarchy

```
AuthProvider
  └── AuthGate (shows LoginPage / RegisterPage when logged out)
        └── PlaylistProvider
              └── Player (App.tsx main content)
                    ├── Header (wordmark, StorageBar, Plans button)
                    ├── Tab switcher (Library | Playlists)
                    ├── [Library tab]
                    │     ├── SearchBar + SearchResults (absolute overlay)
                    │     ├── FileUpload
                    │     ├── StorageBar
                    │     └── TrackList
                    │           ├── Tooltip (portal, desktop hover)
                    │           ├── MobileMenu (portal, mobile ⋮)
                    │           └── InfoBottomSheet (portal, mobile info)
                    ├── [Playlists tab]
                    │     └── PlaylistPanel
                    │           └── DndContext (per accordion section)
                    ├── PlayerBar (fixed bottom)
                    │     ├── PlayerControls
                    │     ├── ProgressBar
                    │     ├── Shuffle + Loop buttons
                    │     └── VolumeControl (sm: only)
                    └── ChatBubble → ChatWindow (slide-in panel)
```

### Context Providers

- **`AuthProvider`** — wraps the entire app. Provides `user`, `loading`, `login`, `register`, `logout`. Calls `GET /api/auth/me` on mount to restore session from httpOnly cookie.
- **`PlaylistProvider`** — wraps the Player (inside `AuthGate`). Provides `playlists`, `createPlaylist`, `addLocal`, `addDeezer`, `remove`, `reorder`, `isInPlaylist`, `removeTrackFromAllPlaylists`. Syncs to `/api/playlists` when logged in; falls back to `localStorage` (`playlists:v2`) when logged out.

### Key Hooks

| Hook | Responsibility |
|---|---|
| `usePlayer` | Howler instance lifecycle; play/pause/seek/volume; shuffle/loop/queue refs; auto-advance on `onend` |
| `useChat` | Rolling 20-message history; POST to `/api/chat`; `extractAction` parser; action dispatch |
| `useQuota` | Fetches `GET /api/user/quota`; provides `refresh()` called after upload/delete |
| `usePlaylist` | Re-exports `PlaylistContext` with a null-check guard |

### Key Patterns

**`useRef` for Howl closures** — `shuffleRef`, `loopModeRef`, `queueRef`, `currentTrackRef`, `volumeRef`, and `playInternalRef` are all `useRef` so Howl's `onend` closure always reads current values. A mirrored `useState` exists for each toggle purely to trigger re-renders.

**Portal rendering for overlays** — `Tooltip`, `MobileMenu`, `InfoBottomSheet`, and `PricingPage` all render via `createPortal(…, document.body)`. This avoids z-index and `overflow: hidden` clipping from parent containers.

**`grid-rows` CSS transitions for accordions** — `PlaylistPanel` section open/close and `TrackList` inline playlist picker both use `transition-[grid-template-rows]` with `grid-rows-[0fr]/[1fr]`. Pure CSS — no JS height measurement, no `max-height` hacks.

**Mouse-following tooltip** — `onMouseMove` tracks cursor position; `bottom: window.innerHeight - pos.y + 16` anchors the card's bottom edge above the cursor without `transform`, avoiding conflict with the `animate-fade-in` keyframe.

---

## Backend Architecture

### Route Table

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | — | Health check |
| POST | `/api/auth/register` | — | Create account; auto-creates Favorites playlist |
| POST | `/api/auth/login` | — | Issue JWT cookie |
| POST | `/api/auth/logout` | — | Clear JWT cookie |
| GET | `/api/auth/me` | cookie | Return current user |
| GET | `/api/tracks` | optional | Samples always; user uploads + saved Deezer tracks appended when logged in (Deezer rows omit `externalUrl` on purpose — see Deezer flow below) |
| POST | `/api/tracks/upload` | required | multer → quota check → Vercel Blob put → Turso insert |
| DELETE | `/api/tracks/:id` | required | Delete blob + Turso row (ownership checked) |
| GET | `/api/tracks/:filename/stream` | — | Stream sample MP3 from bundled `server/samples/` |
| POST | `/api/tracks/deezer` | required | Save a Deezer track to the user's library (idempotent upsert in `deezer_tracks`) |
| DELETE | `/api/tracks/deezer/:id` | required | Remove a Deezer track from the user's library (idempotent) |
| GET | `/api/search?q=` | — | Deezer proxy; returns normalized `SearchTrack[]` |
| GET | `/api/deezer/track/:id` | — | Proxies `https://api.deezer.com/track/{id}` and returns a fresh `previewUrl` (URLs are signed and expire — never cache long-term) |
| GET | `/api/playlists` | required | List user's playlists |
| POST | `/api/playlists` | required | Create playlist |
| DELETE | `/api/playlists/:id` | required | Delete playlist |
| PUT | `/api/playlists/:id/tracks` | required | Replace playlist track list (full-replace sync) |
| GET | `/api/user/quota` | required | `{ used, limit, tier }` |
| POST | `/api/chat` | required | Groq inference; 5 req/min per user |

### Middleware Chain

```
cors
  → json (body parsing)
    → cookieParser
      → [route-level] authMiddleware (verifies JWT; attaches req.user)
        → [chat route] express-rate-limit (5/min keyed on req.user.userId)
          → route handler
            → [4-arg] error middleware (returns { error } with status 500)
```

### Database Helpers (`server/db/index.ts`)

| Function | Description |
|---|---|
| `getDb()` | Returns (or creates) the `@libsql/client` instance |
| `initDb(db?)` | Runs migrations + `PRAGMA foreign_keys = ON` |
| `createUser` | Insert user with hashed password |
| `getUserByEmail` | Look up user for login |
| `createPlaylist` | Insert playlist row |
| `getPlaylistsByUser` | List playlists for a user |
| `getPlaylistsWithTracks` | List playlists + all tracks via single LEFT JOIN (N+1-free) |
| `deletePlaylist` | Delete playlist row |
| `replacePlaylistTracks` | Replace track list (full-replace, atomic via `db.batch`) |
| `createUploadedTrack` | Insert uploaded track metadata |
| `getUploadedTracksByUser` | List user's uploaded tracks |
| `getUploadedTrackById` | Look up single upload by UUID (ownership check) |
| `deleteUploadedTrack` | Delete track row |
| `getUserUploadedBytes` | `SUM(size)` for quota check |
| `saveDeezerTrack` | Upsert a Deezer track for a user (`INSERT OR REPLACE` on composite PK `(id, user_id)`) |
| `getDeezerTracksByUser` | List the user's saved Deezer tracks |
| `deleteDeezerTrack` | Remove a Deezer track for a user (idempotent) |

---

## Data Flows

### Auth Flow

```
Register form → POST /api/auth/register
  → bcrypt hash password
  → INSERT users
  → INSERT playlists (Favorites)
  → sign JWT → Set-Cookie: token (httpOnly, SameSite=lax, 7d)
  → client AuthContext.user set
  → PlaylistContext switches from localStorage to API sync
```

### Playlist Sync Flow

```
User mutates playlist (add / remove / reorder)
  → PlaylistContext local state updated immediately (optimistic)
  → if logged in: PUT /api/playlists/:id/tracks { tracks: [...] }
  → server: DELETE existing rows + INSERT new rows in order
  → if logged out: write to localStorage (playlists:v2)
```

### Audio Playback Flow

```
Track click → player.play(track, context?)
  → queueRef = context ?? libraryTracks (fallback on first play)
  → currentTrackRef = track
  → new Howl({ src, html5: true })
    → onend fires:
        loopMode === 'track'  → seek(0), play()
        loopMode === 'queue'  → advance (wrap at end)
        shuffle               → random pick from queueRef
        linear                → advance (stop at end)
  → PlayerBar re-renders via useState mirrors
```

### Upload Flow

```
FileUpload drag/drop → FormData → POST /api/tracks/upload
  → multer.memoryStorage (50MB limit)
  → quota check: getUserUploadedBytes + incoming > 100MB → 413
  → @vercel/blob.put(filename, buffer) → permanent CDN URL
  → createUploadedTrack(db, userId, { name, url, size })
  → client: track appended to library; useQuota.refresh()
```

### Deezer Library + Playback Flow

```
Search Deezer → user adds track to library
  → POST /api/tracks/deezer { id, title, artist, albumArt, previewUrl, durationMs }
  → INSERT OR REPLACE INTO deezer_tracks  (composite PK on id + user_id makes this idempotent)
  → client: track appended to library state

GET /api/tracks (authenticated)
  → returns samples + uploaded_tracks rows + deezer_tracks rows
  → Deezer rows are returned WITHOUT externalUrl on purpose
    (the cached preview_url is volatile and would silently 404 in Howler)

User clicks a Deezer track
  → usePlayer.createAndPlay(track)
  → resolveDeezerUrl(track) → GET /api/deezer/track/:id
  → server proxies https://api.deezer.com/track/{id} → returns fresh `previewUrl`
  → new Howl({ src: previewUrl, html5: true }) → play()
  → currentTrackRef stays bound to the original track for queue lookup
```

The "resolve at play time" pattern exists because Deezer's CDN URLs are signed
and expire (hours to days). A cached URL stored at "add to library" time would
silently fail on a second device or after the token expires.

### Auth State / Player Cleanup

```
User clicks Logout
  → AuthContext.logout() → POST /api/auth/logout (clears cookie)
  → AuthContext.user = null
  → AuthGate switches: <Player> unmounts, <LoginPage> mounts
  → usePlayer's useEffect cleanup runs: howlRef.current?.unload()
  → audio stops; underlying <audio> element is destroyed
```

Without the unload-on-unmount cleanup, a `Howl` keeps an `<audio>` element alive
even after its React component is gone — playback would continue with no UI to
stop it. The cleanup is a single-line `useEffect` that runs on `usePlayer` unmount.

---

## Testing Strategy

**Backend (Jest + Supertest)** — 9 test files. Each test file uses `createClient({ url: ':memory:' })` with `await initDb(db)` in `beforeAll`/`beforeEach`. Route handlers are tested through the full Express app via Supertest — no unit mocks of Express layers. Auth tests use real bcrypt + JWT; Blob upload tests mock `@vercel/blob.put`; Deezer endpoint tests mock `global.fetch`.

| File | Covers |
|---|---|
| `api.test.ts` | Health, tracks list, upload, stream, search |
| `auth.test.ts` | Register, login, logout, /me, duplicate email |
| `db.test.ts` | All DB helper functions (in-memory) |
| `playlists.test.ts` | CRUD + track sync endpoints |
| `tracks.test.ts` | Upload quota; delete ownership; latin1→utf8 filename encoding; Deezer library save + delete; GET /api/tracks shape (no `externalUrl` on Deezer rows) |
| `search.test.ts` | Deezer search proxy: 400 without `q`, success shape with `q` |
| `deezer.test.ts` | `/api/deezer/track/:id`: 400 on non-numeric id, 200 with fresh `previewUrl`, 502 on Deezer 5xx, 404 on missing/error preview |
| `quota.test.ts` | /api/user/quota: 401, 200 with used/limit/tier |
| `chat.test.ts` | /api/chat: auth, rate limit (mocked Groq) |

**Frontend (Vitest + React Testing Library)** — 10 test files. Components are rendered with a `PlaylistProvider` + `AuthProvider` wrapper when needed. Howler.js is mocked globally in `test-setup.ts`. `localStorage` is reset between tests.

| File | Covers |
|---|---|
| `PlayerControls.test.tsx` | Prev/play/next callbacks |
| `ProgressBar.test.tsx` | Time string rendering |
| `SearchBar.test.tsx` | Input change, submit event |
| `TrackList.test.tsx` | Render, active highlight, delete button |
| `PlaylistContext.test.tsx` | Add, remove, reorder, persistence, cascade delete |
| `AuthForms.test.tsx` | Login / register form submission |
| `PlayerBar.test.tsx` | Shuffle, loop, volume controls |
| `StorageBar.test.tsx` | Tier label, percentage bar |
| `ChatWindow.test.tsx` | Message rendering, action feedback lines |
| `trackFilter.test.ts` | Filter + sort utility functions |

---

## Deployment Topology

```
Browser
  │
  ├── Static assets ──── Vercel CDN (client/dist/ — Vite build)
  │
  └── API requests ───── Vercel Serverless Function (api/index.ts)
                              │
                              ├── Turso (libSQL) ── users, playlists, uploaded_tracks
                              │     URL: TURSO_DATABASE_URL (env var)
                              │     Token: TURSO_AUTH_TOKEN (env var)
                              │
                              ├── Vercel Blob ────── uploaded audio files (CDN URLs)
                              │     Token: BLOB_READ_WRITE_TOKEN (env var)
                              │
                              ├── Groq API ────────── AI chat inference
                              │     Key: GROQ_API_KEY (env var)
                              │
                              └── Deezer public API ─ search proxy (/api/search) +
                                                      track endpoint (/api/deezer/track/:id, fresh preview URL minting)
                                                      No API key required
```

### Required Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `TURSO_URL` | server | libSQL database URL |
| `TURSO_AUTH_TOKEN` | server | libSQL auth token |
| `BLOB_READ_WRITE_TOKEN` | server | Vercel Blob storage |
| `GROQ_API_KEY` | server | Groq LLM inference |
| `JWT_SECRET` | server | JWT signing secret |
| `PORT` | server (local only) | Local dev port (default 3001) |

All variables are set in Vercel project settings (production + preview environments) and in the local `.env` file (gitignored).
