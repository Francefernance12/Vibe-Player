# Architecture Reference

Last updated: 2026-04-24 (Session 4C)

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
│       ├── types.ts          ← Client-side Track, SearchTrack, Playlist interfaces
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
│           └── trackFilter.ts      ← Filter + sort helpers for TrackList
├── server/
│   ├── db/
│   │   ├── index.ts           ← Async query helpers; initDb(); getDb()
│   │   ├── migrate.ts         ← Idempotent migration runner
│   │   └── migrations/
│   │       ├── 001_create_users.sql
│   │       ├── 002_create_playlists.sql
│   │       ├── 003_create_playlist_tracks.sql
│   │       └── 004_create_uploaded_tracks.sql
│   ├── samples/               ← Bundled royalty-free MP3s (served via stream endpoint)
│   └── src/
│       ├── app.ts             ← Express app; route registration; error middleware
│       ├── index.ts           ← Local dev entry: initDb() then app.listen()
│       ├── tracks.ts          ← Sample track metadata builder
│       ├── middleware/
│       │   └── auth.ts        ← JWT cookie verification; attaches req.user
│       └── routes/
│           ├── auth.ts        ← /register, /login, /logout, /me
│           ├── tracks.ts      ← GET /tracks, POST /upload, DELETE /:id, GET /:filename/stream
│           ├── search.ts      ← GET /search?q= (Deezer proxy)
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
| GET | `/api/tracks` | optional | Samples always; user uploads appended when logged in |
| POST | `/api/tracks/upload` | required | multer → quota check → Vercel Blob put → Turso insert |
| DELETE | `/api/tracks/:id` | required | Delete blob + Turso row (ownership checked) |
| GET | `/api/tracks/:filename/stream` | — | Stream sample MP3 from bundled `server/samples/` |
| GET | `/api/search?q=` | — | Deezer proxy; returns normalized `SearchTrack[]` |
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
| `findUserByEmail` | Look up user for login |
| `createPlaylist` | Insert playlist row |
| `getPlaylists` | List playlists for a user |
| `deletePlaylist` | Delete playlist row |
| `setPlaylistTracks` | Replace track list (full-replace) |
| `createUploadedTrack` | Insert uploaded track metadata |
| `getUploadedTracks` | List user's uploaded tracks |
| `deleteUploadedTrack` | Delete track row |
| `getUserUploadedBytes` | `SUM(size)` for quota check |

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

---

## Testing Strategy

**Backend (Jest + Supertest)** — 52 tests across 7 files. Each test file uses `createClient({ url: ':memory:' })` with `await initDb(db)` in `beforeAll`/`beforeEach`. Route handlers are tested through the full Express app via Supertest — no unit mocks of Express layers. Auth tests use real bcrypt + JWT; Blob upload tests mock `@vercel/blob.put`.

| File | Covers |
|---|---|
| `api.test.ts` | Health, tracks list, upload, stream, search |
| `auth.test.ts` | Register, login, logout, /me, duplicate email |
| `db.test.ts` | All DB helper functions (in-memory) |
| `playlists.test.ts` | CRUD + track sync endpoints |
| `tracks.test.ts` | Upload quota check; delete ownership |
| `quota.test.ts` | /api/user/quota: 401, 200 with used/limit/tier |
| `chat.test.ts` | /api/chat: auth, rate limit (mocked Groq) |

**Frontend (Vitest + React Testing Library)** — 49 tests across 10 files. Components are rendered with a `PlaylistProvider` + `AuthProvider` wrapper when needed. Howler.js is mocked globally in `test-setup.ts`. `localStorage` is reset between tests.

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
                              └── Deezer public API ─ search proxy (no key required)
```

### Required Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `TURSO_DATABASE_URL` | server | libSQL database URL |
| `TURSO_AUTH_TOKEN` | server | libSQL auth token |
| `BLOB_READ_WRITE_TOKEN` | server | Vercel Blob storage |
| `GROQ_API_KEY` | server | Groq LLM inference |
| `JWT_SECRET` | server | JWT signing secret |
| `PORT` | server (local only) | Local dev port (default 3001) |

All variables are set in Vercel project settings (production + preview environments) and in the local `.env` file (gitignored).
