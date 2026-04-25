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
- ✅ **Checkpoint**: Playlist UI renders and persists

---

### Session 2C — Bug Fixes + Core UX Features ✅ COMPLETE

- ✅ `externalUrl?: string` added to `Track` in `shared/types.ts` and `client/src/types.ts`
- ✅ `usePlayer.play()` uses `externalUrl` as Howler src when present
- ✅ Deezer preview URLs play correctly via Howler
- ✅ `PlaylistPanel.onPlay` wired — local tracks use API stream; Deezer uses externalUrl
- ✅ `DELETE /api/tracks/:filename` — deletes from uploads/ only, 403 for samples
- ✅ Filter input + sort dropdown (A–Z, Z–A, Size ↑↓, Source) in TrackList
- ✅ 40 tests pass (11 server + 29 client)

---

### Session 2D — Multi-Playlist + UI Polish ✅ COMPLETE

- ✅ `PlaylistContext` rewritten for multi-playlist support (`playlists:v2` storage key)
- ✅ `createPlaylist(name): string` added; `addLocal` now requires `playlistId`
- ✅ `PlaylistPanel` rewritten: collapsible accordion per playlist, chevron toggle, track count badge
- ✅ "New playlist" inline input with `create` button and Escape-to-cancel
- ✅ DndContext scoped per-playlist accordion section
- ✅ Currently-playing item highlighted with orange dot + animated pulse
- ✅ `TrackList` updated: inline playlist picker expands below each row (grid-rows animation)
- ✅ All tests updated for new multi-playlist API: 42 tests pass (11 server + 31 client)

---

## Phase 3 — Authentication + Database

### Session 3A — Schema Update + SQLite Setup ✅ COMPLETE

- ✅ `better-sqlite3` + `@types/better-sqlite3` installed in `/server`
- ✅ Migrations 001–003: users, playlists, playlist_tracks
- ✅ Migration runner (`server/db/migrate.ts`) — idempotent
- ✅ `server/db/index.ts` — typed query helpers + `createMemoryDb()` for tests
- ✅ 11 DB tests pass with `:memory:` database

---

### Session 3B — Auth Endpoints ✅ COMPLETE

- ✅ `bcrypt` + `jsonwebtoken` + `cookie-parser` installed
- ✅ `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- ✅ `authMiddleware` in `server/src/middleware/auth.ts`
- ✅ 9 auth endpoint tests; 34 server tests pass total

---

### Session 3C — Auth UI + Playlist Persistence ✅ COMPLETE

- ✅ `LoginPage` + `RegisterPage` components
- ✅ `AuthContext` (`user`, `loading`, `login`, `register`, `logout`)
- ✅ `AuthGate` in `App.tsx` — shows login/register when not logged in
- ✅ Playlist CRUD endpoints (GET, POST, DELETE, PUT /tracks) — all auth-protected
- ✅ Register auto-creates Favorites playlist in DB
- ✅ `PlaylistContext` syncs to API when logged in; falls back to localStorage when not
- ✅ 42 server + 36 client = 78 total tests pass
- ✅ **Checkpoint**: Register → build playlist → refresh → playlist still there

---

## Phase 3B — Hotfix: Persistent Database

### Session 5A — SQLite → Turso (libSQL) ✅ COMPLETE

- ✅ Root cause: Vercel `/tmp` ephemeral per invocation — register and login hit different containers
- ✅ `better-sqlite3` replaced with `@libsql/client` (Turso-hosted remote SQLite)
- ✅ All DB helpers made async; route handlers updated
- ✅ `initDb()` called at startup in both `server/src/index.ts` and `api/index.ts`
- ✅ In-memory libSQL client for tests: `createClient({ url: ':memory:' })`
- ✅ 42 server tests pass
- ✅ **Checkpoint**: Register → log out → log in → succeeds on live Vercel URL

---

## Phase 4 — Polish + Scale

### Session 4A — Performance ✅ COMPLETE

- ✅ Loading skeletons added to `TrackList` and `SearchResults`
- ✅ Bundle size: 308 kB uncompressed / 94 kB gzipped
- ✅ `rollup-plugin-visualizer` installed
- ✅ Lighthouse (2026-04-22, mobile): Performance 92 · Accessibility 92 · Best Practices 96 · SEO 82

---

### Session 4B — Mobile Responsiveness ✅ COMPLETE

- ✅ Fixed bottom-sheet player (`react-swipeable` swipe left/right → next/prev)
- ✅ Prev/next touch targets: `p-3 sm:p-2` (~44px on mobile)
- ✅ `ProgressBar` touch support via `onTouchEnd`
- ✅ All 36 client tests pass

---

### Session 4C — Backlog + Architecture Docs ✅ COMPLETE

- ✅ `docs/PLANCHECKLIST.md` updated: all Phase 6 sessions marked complete
- ✅ `docs/PLAN.md` updated: Phase 6 and 5D marked complete
- ✅ `docs/DECISIONS.md` updated: Phase 6 "(planned)" removed; tooltip, mobile menu, pricing entries added
- ✅ `docs/ARCHITECTURE.md` created: system overview, component hierarchy, route table, data flows, testing strategy, deployment topology
- ✅ Test count: 49 client + 52 server = 101 total

---

## Phase 5 — Feature Additions

### Session 5B — Upload Persistence (Vercel Blob) ✅ COMPLETE

- ✅ `@vercel/blob` installed; `multer.memoryStorage()`; `put()` to CDN; `createUploadedTrack` to Turso
- ✅ `DELETE /api/tracks/:id` uses Turso UUID, not filename
- ✅ `GET /api/tracks` auth-aware: adds user's uploads to samples for logged-in users
- ✅ `server/db/migrations/004_create_uploaded_tracks.sql`
- ✅ 45 server tests pass

---

### Session 5C — AI Music Assistant Chatbot (Groq) ✅ COMPLETE

- ✅ `POST /api/chat` — auth-protected, 5 req/min rate limit, Groq `llama-3.3-70b-versatile`
- ✅ `useChat` hook — rolling 20-message history, `extractAction` parser
- ✅ `ChatBubble` (fixed FAB) + `ChatWindow` (slide-in panel)
- ✅ Chat actions: `play`, `search`, `add_to_playlist`, `pause`, `resume`, `skip`, `prev`, `set_volume`, `search_and_play`
- ✅ Action feedback rendered as dim italic lines in chat
- ✅ 49 client + 52 server = 101 tests pass

---

### Session 5D — Upload Size Limit + Per-User Quota UI ✅ COMPLETE

- ✅ multer `limits: { fileSize: 50MB }`; quota check before `put()`
- ✅ `GET /api/user/quota` → `{ used, limit, tier }`
- ✅ `StorageBar` component — tier badge, progress bar, orange at ≥90%
- ✅ `useQuota` hook — refreshes after upload/delete
- ✅ **Known constraint**: Vercel Hobby caps request bodies at 4.5MB; files >4.5MB still 413 in production

---

## Phase 6 — Playback Modes, Layout Overhaul, Cascade Delete, Extended Chat

### Session 6A — Player Enhancements ✅ COMPLETE

- ✅ `usePlayer.ts` rewritten: `shuffleRef`, `loopModeRef`, `queueRef`, `currentTrackRef`, `volumeRef`, `playInternalRef` (all `useRef` so Howl `onend` closure sees current values)
- ✅ `play(track, context?)` — sets `queueRef` if context provided; falls back to `libraryTracks` on first play
- ✅ `onend` auto-advance: loop-track restarts, shuffle picks random, linear advances, queue-loop wraps, otherwise stops
- ✅ `toggleShuffle()` / `cycleLoop()` sync refs + `useState` for re-renders
- ✅ Library track click → `player.play(track, visibleTracks)` (filtered library as queue context)
- ✅ Playlist track click → `player.play(track, playlistQueue)` (playlist as queue context)
- ✅ All client tests pass

---

### Session 6B — Desktop Layout Overhaul ✅ COMPLETE

- ✅ `PlayerBar.tsx` (renamed from MobilePlayerBar): always-visible fixed bottom bar, `max-w-md` width, swipe gestures preserved
- ✅ Shuffle button (orange when active) + Loop cycle button (badge "1" for track-loop mode)
- ✅ `VolumeControl` desktop-only (`hidden sm:flex`)
- ✅ Library / Playlists tab switcher in `App.tsx` (orange underline on active)
- ✅ Removed `hidden sm:flex` embedded desktop player card; padding `pb-28`
- ✅ Temporal dead zone bug fixed: `visibleTracks` useMemo hoisted above `handleSelect`
- ✅ All client tests pass

---

### Session 6C — Cascade Delete + UX Polish ✅ COMPLETE

- ✅ `removeTrackFromAllPlaylists(trackId)` in `PlaylistContext`; called from `handleDeleteTrack`
- ✅ Deezer tracks persisted to `localStorage` (`deezer-library-tracks` key); survive page refresh
- ✅ `Tooltip.tsx` — mouse-following via `onMouseMove`, `bottom` anchor (no transform conflict), `matchMedia` hover detection
- ✅ `TrackList.tsx` — `⋮` mobile button (portal menu: Info / Add to playlist / Delete); `InfoBottomSheet`; desktop `+`/trash `hidden sm:flex`
- ✅ `PlaylistPanel.tsx` — per-playlist filter + sort dropdown; DnD disabled when filter active
- ✅ 49 client + 52 server tests pass

---

### Session feature/pricing-mockup — Mockup Pricing Page ✅ COMPLETE

- ✅ `PricingPage.tsx` — full-screen portal overlay; 3 tiers (Free / Pro / Max); all CTAs disabled
- ✅ Diagonal "MOCKUP" watermark (Cormorant Garamond, semi-transparent)
- ✅ Sticky amber banner: "MOCKUP ONLY — no payment is processed"
- ✅ "Plans" button in app header → `showPricing` state
- ✅ Cormorant Garamond font added to `client/index.html`

---

## Phase 7 — Optimization & Code Quality

### Session 7A — Frontend Performance Audit ✅ COMPLETE

- ✅ `useChat.ts` — stale closure fix: `messagesRef` + `isLoadingRef` added; `sendMessage` reads/writes via refs; `messages`/`isLoading` removed from dep array; `clearMessages` clears ref
- ✅ `Tooltip.tsx` — replaced `pos` useState (60fps setState) with `posRef` + direct `cardRef.current.style` writes; `visible` boolean retained for show/hide
- ✅ `PlaylistContext.tsx` — `reorderPlaylist` PUT debounced 400ms (`reorderDebounceRef`); state update remains immediate (optimistic)
- ✅ `PlayerBar.tsx` — wrapped with `React.memo`
- ✅ `ProgressBar.tsx` — wrapped with `React.memo`
- ✅ `SearchBar.tsx` — `onSearching` added to `useEffect` dep array (was missing)
- ✅ 49 client + 52 server tests pass; bundle 105 kB gzip

---

### Session 7B — Backend Performance Audit ✅ COMPLETE

- ✅ `server/db/migrations/005_add_indexes.sql` — `CREATE INDEX IF NOT EXISTS` for `playlists(user_id)`, `playlist_tracks(playlist_id)`, `uploaded_tracks(user_id)`
- ✅ `server/db/migrate.ts` — `db.execute` → `db.executeMultiple` so multi-statement migration files run correctly
- ✅ `server/db/index.ts` — `getPlaylistsWithTracks` helper via single LEFT JOIN; `PlaylistWithTracks` interface exported
- ✅ `server/src/routes/playlists.ts` — `GET /api/playlists` N+1 `Promise.all` replaced with single `getPlaylistsWithTracks` call
- ✅ `server/db/index.ts` `replacePlaylistTracks` — accurate docstring confirming `db.batch('write')` is atomic; manual `BEGIN/COMMIT` must not be added
- ✅ `server/src/middleware/auth.ts` — fast-path exit intent + `getJwtSecret()` fail-fast comments
- ✅ `server/src/routes/chat.ts` — MemoryStore cold-start reset comment
- ✅ `server/src/routes/tracks.ts` — per-request freshness comment for `getUserUploadedBytes`
- ✅ 52 server tests pass

---

## Agent Review Log

| Session | Date | Findings | Resolved |
|---|---|---|---|
| 1A–1C | 2026-04-19 | `.env` in diff; tsconfig conflict; missing error boundary on SearchBar | ⬜ Pending |
| 2A (Spotify) | 2026-04-20 | Spotify 403 — Premium required; code complete but blocked | ✅ Superseded by Deezer |
| 2B | 2026-04-20 | Playlist display-only (no playback); Deezer preview routing bug | ✅ Fixed in 2C |
| 3C | 2026-04-22 | Playlist sync debounce missing; Favorites lookup by name fragile | ✅ Fixed in 7A: reorderPlaylist debounced |
| 5C | 2026-04-23 | AI action reliability on 8B model; backtick-wrapped JSON dropped | ✅ Fixed: 70B model + parser hardening |
| 6B | 2026-04-24 | Tab state lost on re-render; `playInternalRef` assigned during render | ⬜ Low risk, accepted |
| 6C | 2026-04-24 | Tooltip transform/animation conflict causing placement issues | ✅ Fixed: bottom anchor approach |
| 7A | 2026-04-25 | `PlayerBar` memo bypassed if parent passes inline callbacks; `SearchBar` dep fix is a behavioral change | ⬜ Low risk, accepted |
| 7B | 2026-04-25 | `db.batch` already atomic — no code change needed; rate limiter resets on cold start (documented) | ✅ Documented |
