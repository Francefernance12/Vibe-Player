# Architecture & Library Decisions

Decisions are grouped by phase in chronological order. Each entry records what was chosen, what the alternatives were, and why.

---

## Phase 1 — Scaffold

### Session 1A — Backend

**Express over Fastify**
Chose Express for broad ecosystem compatibility and straightforward middleware model. Vercel's serverless adapter expects a standard Node.js request handler, which Express satisfies without extra config.

**multer 2.x for file uploads**
Used multer for multipart/form-data parsing. Pinned to 2.x (not 1.x) because 1.x has publicly disclosed CVE-level vulnerabilities. The 2.x API is backwards-compatible for `diskStorage` + `single()` usage.

**uuid for track IDs**
Track IDs are generated at read-time (not stored), so uuid v4 is sufficient. No DB in Phase 1.

**ts-node-dev for development**
Chosen over nodemon + ts-node for faster incremental rebuilds via transpile-only mode.

**Vercel serverless: /tmp for uploads, process.cwd() for samples**
Vercel's Lambda-based runtime has a read-only filesystem except for `/tmp`. Uploaded files are written to `/tmp` in production (ephemeral — cleared between invocations). Sample MP3s are bundled with the function via `vercel.json` `includeFiles` and accessed via `process.cwd()/server/samples`. Local dev uses `__dirname`-relative paths. Persistent upload storage replaced with Vercel Blob in Phase 5.

---

### Session 1B — Frontend

**Howler.js for audio playback**
Chosen over the Web Audio API directly and over `<audio>` element because Howler abstracts cross-browser quirks, supports HTML5 streaming (`html5: true`), and provides a clean seek/volume/event API. The alternative (`<audio>` element via a ref) would have required manual event wiring for every browser edge case.

**useRef + requestAnimationFrame for ProgressBar ticks**
The ProgressBar updates on every Howler seek tick. Using `useState` on every tick causes a React re-render at ~60fps — unnecessary since only two DOM text nodes and one CSS width value change. Instead, a `requestAnimationFrame` loop writes directly to the DOM via `useRef`.

**Vite over Create React App**
CRA is deprecated. Vite provides faster HMR, native ESM, and first-class TypeScript support. Vite proxy (`/api → localhost:3001`) replaces the need for a separate CORS config during development.

**Vitest over Jest for the frontend**
Vitest is natively integrated with Vite — same config file, same transform pipeline, faster startup. Jest requires a separate Babel/ts-jest transform setup and can't reuse the Vite config. Vitest globals (`test`, `vi`, `expect`) are enabled via `globals: true` in `vite.config.ts`.

**Tailwind CSS for styling**
Utility-first approach keeps component files self-contained (no separate `.module.css` files). Tailwind's JIT compiler means only used classes are in the production bundle.

---

### Session 1C — Deployment

**Vercel for deployment**
Chosen for zero-config static + serverless hosting. The Vite build outputs to `client/dist/` served as static files; Express runs as a single Vercel serverless function at `api/index.ts`. Alternatives (Railway, Render, Fly.io) would require a persistent server process, adding cost and complexity.

---

## Phase 2 — External APIs & Polish

### Session 2A — Deezer Search

**Deezer public API over Spotify**
Spotify was attempted first but requires the developer app owner to hold an active Premium subscription (403 returned from `GET /v1/search` with valid Client Credentials token). Deezer's public search API (`https://api.deezer.com/search?q=`) requires no API key, no OAuth, and no account. It returns 30-second preview MP3 URLs for free, which are playable directly via Howler.js. The backend route is a thin proxy with no token logic or `.env` variables needed.

**Deezer preview URLs played via Howler**
Deezer's 30-second preview URLs are direct MP3 links. A synthetic `Track` object is constructed from the preview URL and passed to the existing `usePlayer` hook — the same pattern used for local tracks. No new playback infrastructure needed.

**.env removed from git tracking**
`.env` was accidentally committed in early sessions. Removed with `git rm --cached .env`. The file is gitignored. No credentials are required for Deezer — `.env` now contains only `PORT=3001` for local development.

---

### Phase 2 Polish — "Wax" Design System

**Orange accent + Syne + JetBrains Mono**
Replaced the default indigo Tailwind accent with a cohesive "Wax" design system: orange-500 (`#f97316`) as the sole accent color, `#0a0a0b` body, `#111113` card surfaces, `#1e1e21` borders. Syne (Google Fonts, weight 700/800) for the wordmark; JetBrains Mono for timestamps and metadata labels. Avoids generic AI-generated aesthetics; orange provides high contrast on near-black backgrounds.

**Search results as absolute overlay**
`SearchResults` is positioned `absolute top-full z-50` inside a `relative` wrapper, floating over the layout rather than pushing content down. This prevents the search dropdown from reflowing the playlist and track list panels beneath it.

**~~Dual Track type definition (known divergence)~~ — resolved in Session 7C**
`client/src/types.ts` originally defined its own `Track` interface in parallel with `shared/types.ts`. The divergence was caught by the Vercel build when `externalUrl` was added to `shared/types.ts` but not the client copy. In Session 7C, `client/src/types.ts` was converted to a re-export barrel (`export type { Track, SearchTrack, TrackSource } from '../../shared/types'`). `SearchTrack` was also migrated from a local interface in `server/src/routes/search.ts` to `shared/types.ts`. `shared/types.ts` is now the single source of truth for all shared types.

---

### Session 2D — Multi-Playlist

**Multi-playlist architecture (playlists:v2)**
`PlaylistContext` was redesigned from a single flat `items: PlaylistItem[]` array to `playlists: Playlist[]`, each with its own `id`, `name`, and `items`. The default "Favorites" playlist uses a stable `id: 'favorites'` constant. New storage key `playlists:v2` is a breaking change vs `playlist:v1` — existing saved playlists are not migrated (acceptable for pre-auth local state). `addDeezer` always targets Favorites; `addLocal` requires an explicit `playlistId`.

**Inline playlist picker over floating dropdown**
TrackList's "+" button opens a playlist picker that expands inline below the track row using a CSS `grid-rows-[0fr]/[1fr]` transition. A floating/fixed dropdown would be clipped by `overflow-hidden` on the parent card. The inline accordion avoids this with no JavaScript height measurement.

**grid-rows transition for accordions**
Both `PlaylistPanel` sections and the TrackList inline picker use `transition-[grid-template-rows]` with `grid-rows-[0fr]/[1fr]` for smooth open/close animation. Pure-CSS — no `max-height` hacks, no JS measurement, no layout thrash.

---

## Phase 3 — Authentication & Database

### Session 3A — Initial SQLite Setup (later replaced)

**better-sqlite3 for SQLite**
Chosen over `sqlite3` (callback-based, no TypeScript types out of the box) and over full ORMs (Prisma, Drizzle — overkill for this scale). `better-sqlite3` is synchronous, which simplifies migration runners and query helpers. Migrations are plain SQL files executed in filename order by a small custom runner (`server/db/migrate.ts`). The `_migrations` table tracks which files have already been applied, making the runner idempotent.

> **Note**: `better-sqlite3` was replaced by `@libsql/client` in Phase 3B (Session 5A). The SQL schema and migration files were unchanged — only the driver and async call pattern changed.

---

### Session 3B — Auth Endpoints

**bcrypt + jsonwebtoken + httpOnly cookies**
Passwords hashed with `bcrypt` (cost factor 12). Sessions issued as JWTs stored in `httpOnly; SameSite=lax` cookies — not `localStorage` — to prevent XSS access to tokens. `cookie-parser` reads the cookie server-side. `authMiddleware` in `server/src/middleware/auth.ts` verifies the JWT and attaches `req.user`. Auth tests mock `getDb()` with `createMemoryDb()` via `jest.mock` so no real DB file is touched.

**express-rate-limit on auth routes**
`/api/auth/register` and `/api/auth/login` are rate-limited to 20 requests per 15 minutes per IP. Mitigates brute-force and registration spam without adding complex infrastructure.

**7-day JWT TTL, no refresh tokens**
JWTs expire after 7 days. No refresh token mechanism — logout clears the cookie client-side but the token remains technically valid until expiry. Accepted risk at this project scale.

---

### Session 3C — Auth UI & Playlist Persistence

**AuthGate pattern in App.tsx**
A `AuthGate` component sits between `AuthProvider` and the player. It reads `user` and `loading` from context and renders `LoginPage`, `RegisterPage`, or the player accordingly. `showRegister` state inside `AuthGate` controls which form is shown; a `useEffect` resets it to `false` on logout so the user always returns to the login page.

**PlaylistContext API sync strategy: full-replace PUT**
`PUT /api/playlists/:id/tracks` replaces the entire track list on every mutation (add, remove, reorder). Simpler than differential sync — no conflict resolution needed at this scale. The client sends current state; the server overwrites. Debouncing reorder calls is a known improvement for a future phase.

**Favorites playlist identified by name, not fixed ID**
Server-side, each user's Favorites playlist has a UUID primary key (not a fixed `'favorites'` string). The frontend identifies it via `playlists.find(p => p.name === 'Favorites')?.id`. This works for the common case but is fragile if the user renames Favorites — a known limitation documented in `REVIEW.md`.

**Express error middleware for async route failures**
Express 4 does not auto-propagate rejected async handlers. Auth route handlers (`/register`, `/login`) are wrapped in try/catch calling `next(err)`. A 4-arg error middleware in `app.ts` returns `{ error: 'Internal server error' }` with status 500. Without this, a missing `JWT_SECRET` on Vercel caused silent 504 timeouts.

---

## Phase 3B — Database Hotfix

### Session 5A — SQLite → Turso (libSQL)

**Root cause: Vercel containers are ephemeral**
`better-sqlite3` wrote to `/tmp/music.db`. Each Vercel serverless invocation gets a fresh container with an empty `/tmp`, so a user registered in one request was invisible to a login request hitting a different container. This is not a bug — it is how serverless functions work.

**Turso (libSQL) over SQLite file / better-sqlite3**
Replaced with `@libsql/client` pointing to a Turso-hosted SQLite instance (`libsql://…turso.io`). The SQL schema and migration files are unchanged — only the driver and call pattern changed (sync → async). Turso's free tier covers this project's needs, and the libSQL wire protocol is fully compatible with the existing SQLite migrations.

**Async DB helpers throughout**
`better-sqlite3` is synchronous; `@libsql/client` is Promise-based. All DB helper functions in `server/db/index.ts` are now `async`. Route handlers already used `async/await`, so only `await` keywords and `next: NextFunction` additions were needed. No architectural changes to the Express layer.

**`initDb()` called at server startup, not inside `getDb()`**
Migrations and the `PRAGMA foreign_keys = ON` call are async and must be awaited before the first request is served. `initDb()` is called in `server/src/index.ts` (local dev, blocks `app.listen`) and in `api/index.ts` (Vercel, stored as a module-level promise awaited by the handler). `getDb()` remains synchronous — it only creates the libSQL `Client` object, which is cheap.

**In-memory libSQL client for tests**
`createClient({ url: ':memory:' })` provides isolated per-test databases with no filesystem I/O. Tests call `await initDb(db)` in `beforeAll`/`beforeEach` to apply migrations before any requests run.

---

## Phase 5 — Feature Additions

### Session 5B — Upload Persistence (Vercel Blob)

**Vercel Blob over ephemeral `/tmp` for uploaded files**
`multer.diskStorage` wrote to `/tmp` on Vercel, which is cleared between container invocations — uploaded tracks would 404 after a cold start or from a different device. Replaced with `@vercel/blob`: `put()` uploads the file buffer directly to Vercel's CDN and returns a permanent public URL. The blob URL is stored in a new Turso table (`uploaded_tracks`) keyed by `user_id`, so each user's uploads persist across sessions and devices. Sample tracks continue to be served from the bundled filesystem via the streaming endpoint.

**Multer memoryStorage instead of diskStorage**
With Vercel Blob, files never need to touch the local filesystem. Switching to `multer.memoryStorage()` puts the file bytes in `req.file.buffer`, which is passed directly to `put()`. This also removes the `/tmp` dependency entirely — no `IS_VERCEL` branching needed in the upload path.

**Upload route requires auth; DELETE uses track ID (not filename)**
Uploaded tracks are associated with a `user_id` in Turso, so the upload endpoint now requires a valid JWT cookie. The delete endpoint was changed from `/:filename` to `/:id`, using the Turso-generated UUID as the stable identifier. The client was updated to call `DELETE /api/tracks/${track.id}`. Ownership is checked server-side before deleting.

**GET /api/tracks is auth-aware (not auth-required)**
Unauthenticated requests return sample tracks only. Authenticated requests append the user's uploaded tracks (with `externalUrl` set to the blob URL). The player's existing `externalUrl` handling in `usePlayer` covers blob URLs without any client-side changes.

---

### Session 5C — AI Music Assistant Chatbot

**Groq + `llama-3.1-8b-instant` (later upgraded)**
Free-tier inference at ~750 tok/s. Chosen over OpenRouter for simpler integration (official `groq-sdk`), no credit card required on free tier, and adequate speed without streaming. Later upgraded to `llama-3.3-70b-versatile` — see Session 6C.

**`express-rate-limit` keyed on `req.user.userId`**
Rate limiting per authenticated user rather than per IP avoids false-positives on shared IPs (offices, NAT). Auth middleware runs before the limiter so `req.user` is always populated by the time the key is generated. `validate: { xForwardedForHeader: false }` suppresses a spurious IPv6 warning on Vercel.

**`role: 'assistant' as const` in useChat spread**
TypeScript widens object literal property values to `string` when spread into an array. Spreading `{ role: 'assistant' }` produces `role: string`, which is incompatible with the `ChatMessage` union `'user' | 'assistant'`. Adding `as const` to the role preserves the literal type and satisfies the state setter's type constraint. Applied to all three `setMessages` call sites in `useChat`.

---

### Session 5D — Upload Limits + Per-User Quota

**50MB multer file size limit**
Default multer memoryStorage has no file size cap. Files over the Express default body limit (or Vercel's 4.5MB Hobby cap) return 413 with no clear message. Setting `limits: { fileSize: 50 * 1024 * 1024 }` makes multer reject oversized files with a consistent 413 and an error message before buffering the entire body. Chosen over a lower cap to give free-tier users headroom for lossless audio files.

**Vercel Hobby body size constraint**
Vercel Hobby plan caps serverless function request bodies at 4.5MB regardless of multer config. Files over 4.5MB will 413 at the Vercel edge in production on Hobby. Documented as a known constraint rather than worked around — upgrading to Vercel Pro raises this limit to 500MB.

**Per-user quota computed from `uploaded_tracks.size`**
Rather than adding a separate quota-tracking table, total usage is `SUM(size)` over `uploaded_tracks WHERE user_id = ?`. This stays in sync automatically on upload and delete without extra write paths. A constant `FREE_QUOTA_BYTES = 100 * 1024 * 1024` (100MB) represents the free tier. Tier is a string enum (`'free'`) returned from the quota endpoint, making it easy to add paid tiers later without a DB migration.

**`StorageBar` UI placement**
Placed below `FileUpload` so the user sees remaining space immediately before choosing a file. Refreshed via `useQuota()` hook after every upload and delete so the bar stays accurate without polling.

---

## Phase 6 — Playback Modes, Layout, Cascade Delete

### Session 6A — Player Enhancements

**`useRef` for Howl closure state (shuffle / loopMode / queue)**
Howl's `onend` callback is captured in a closure when the `Howl` is created. If shuffle/loopMode/queue were plain `useState` values, the closure would see stale values from the render cycle when `play()` was last called. Using `useRef` for these values lets the closure always read the latest state without re-creating the Howl on every toggle. A separate `useState` mirrors each ref purely for triggering re-renders (button active states).

**Play context as a separate queue ref**
Rather than always navigating the full library on next/prev, `play(track, context?)` optionally sets `queueRef` to a caller-supplied list (e.g., a playlist's items, or the current filtered library view). This cleanly separates "what is playing" from "what queue is being navigated", enabling shuffle to work independently within either context without mixing library and playlist tracks.

**Loop mode cycle: none → track → queue**
Three modes rather than a binary toggle. `none` = stop at end. `track` = restart current song (Howl `seek(0)`). `queue` = wrap from last to first. Cycled with a single button to avoid UI clutter.

---

### Session 6B — Desktop Layout

**Unified PlayerBar replaces MobilePlayerBar + desktop card**
The mobile fixed bottom bar (`sm:hidden`) and the desktop embedded player card (`hidden sm:flex`) are replaced by a single `PlayerBar` component always visible at the bottom. This follows standard music player conventions (Spotify, Apple Music) and eliminates the inconsistency of having two different player UIs. Shuffle and loop buttons are added to this bar.

**Tabs (Library | Playlists) on desktop**
Separates upload/search/library actions from playlist management — previously everything was stacked vertically, making the page long and hard to navigate with many playlists. Tabs are client-side state only (no routing) to keep the app single-page without React Router.

---

### Session 6C — Cascade Delete + UX Polish

**Cascade delete via `removeTrackFromAllPlaylists` in PlaylistContext**
When a track is deleted from the library, it should disappear from all playlists. Previously, playlist items became orphaned (stored as `{ kind: 'local', track }` references with no validity check at play time). The cascade function filters all playlist items in one pass and syncs to the backend, keeping playlists consistent without a server-side foreign key (playlist items are stored as JSON blobs, not relational rows).

**Chat action expansion: 6 new types**
Added `pause`, `resume`, `skip`, `prev`, `set_volume`, and `search_and_play` to the assistant's action vocabulary. `search_and_play` is the most complex: it fetches `/api/search?q=...` on the client and plays the first result with a `previewUrl` — combining the existing search and play flows. Volume is passed as a float string (`"0.7"`) since all action payloads are strings in the JSON schema.

**Model upgrade: `llama-3.3-70b-versatile`**
Switched from `llama-3.1-8b-instant` to `llama-3.3-70b-versatile` for reliably following structured action tag instructions. Still on Groq free tier. The larger model is necessary as the action vocabulary grows — a 6-rule prompt with placeholders is too complex for an 8B model to follow consistently.

**Tooltip positioning: `bottom` anchor + `onMouseMove`**
The original tooltip used `getBoundingClientRect()` on the trigger element and `transform: translateY(-100%)` for placement above the cursor. Two problems: (1) the element rect positions relative to the element, not the cursor position; (2) the `animate-fade-in` CSS keyframe also sets `transform`, fighting the inline style and preventing above-cursor placement during animation. Replaced with `onMouseMove` tracking `e.clientX/e.clientY` and `bottom: window.innerHeight - pos.y + GAP` to anchor the card's bottom edge above the cursor — no `transform` for positioning, so no animation conflict. Falls back to `top: pos.y + GAP + 20` when near the top of the viewport.

**Hover device detection via `matchMedia`**
Tooltip is disabled on touch devices using `window.matchMedia('(hover: hover) and (pointer: fine)').matches` evaluated once at module load. Wrapped in a try/catch IIFE so jsdom (test environment) doesn't throw on `matchMedia` — returns `false` in tests, which correctly disables the tooltip in test renders.

**Mobile ⋮ context menu via portal**
On mobile, the desktop track action buttons (`+` / trash) are hidden with `hidden sm:flex`. A single `⋮` button (visible only on mobile via `flex sm:hidden`) opens a `MobileMenu` component rendered via `createPortal` to `document.body`. Portal rendering avoids z-index and overflow clipping from the track list container. The menu closes on outside interaction via `touchstart`/`mousedown` listeners on `document`. "Info" opens an `InfoBottomSheet` (also portal-rendered) with full track metadata rendered by `TrackInfoCard`. "Add to Playlist" reuses the existing inline playlist picker by setting `openPickerId`.

**Deezer track library persistence via localStorage**
Search results added to the library were previously lost on page refresh — only the sample tracks and user-uploaded tracks survived. Deezer tracks are now written to `localStorage` under the key `deezer-library-tracks` (JSON array) on every add and loaded back on mount in `App.tsx`. This keeps the library consistent across sessions without requiring a backend endpoint or user authentication.

---

## Feature Branch — Pricing Mockup

**Pricing page: design mockup on dedicated branch**
`feature/pricing-mockup` holds a `PricingPage.tsx` component that renders as a full-screen portal over the main app. The page is clearly a mockup: a diagonal semi-transparent MOCKUP watermark spans the full page (Cormorant Garamond, `text-[18vw]`, `text-white/[0.022]`, `rotate-[-22deg]`), and a sticky amber banner explicitly states no payment infrastructure exists. Three tiers (Free / Pro / Max) are displayed but all CTAs are disabled. Cormorant Garamond (Google Fonts, added to `client/index.html`) is used for price numerals and edition marks to contrast with the existing Syne + JetBrains Mono stack. Max tier uses a custom gold accent (`#c9a96e`) distinct from the standard orange.

---

## AI Workflow & Tooling

**Claude Code (claude CLI) as primary development agent**
Used for all code generation, refactoring, and implementation. Runs in the project directory with access to file tools, bash, and MCP servers. Project instructions are in `CLAUDE.md` and enforced every session.

**OpenCode (opencode/big-pickle) as commit reviewer**
A separate sub-agent invoked via the `/commitReview` slash command at the end of each session. It reads git history, writes `docs/REVIEW.md`, and creates GitHub PRs. Kept separate from Claude Code so the reviewer has no bias toward the code it is reviewing.

**GitHub MCP server**
Enables Claude Code to interact with the GitHub API directly (list PRs, create branches, read files) without shelling out to `gh`. Configured in Claude Code MCP settings. Used from Session 2A onward.

**Context7 MCP server**
Provides up-to-date library documentation fetched at query time. Used when Claude Code needs current API references for Howler.js, Vite, Express, or Vercel — training data cutoffs can lag behind library releases.

**frontend-design plugin skill**
Generates high-quality, production-grade UI code with a distinct visual style. Applied when building React components to avoid generic AI-default aesthetics.

**vercel-react-best-practices skill**
A curated set of Vercel engineering rules (re-render avoidance, ref-based transient values, memoization, bundle hygiene). Consulted before writing any React component. The ProgressBar's ref-based tick update is a direct result of this skill's `rerender-use-ref-transient-values` rule.

**`perf-optimizer` custom agent**
A project-local Claude Code sub-agent defined in `.claude/agents/perf-optimizer.md`. Implements a strict two-stage workflow: Stage 1 produces a ranked audit list (top 5 findings, ROI-ordered) and halts for user approval before touching any code; Stage 2 implements only the approved changes one at a time, then runs the test suite and reports results. Used for all three Phase 7 sessions (7A frontend, 7B backend, 7C code quality). The agent maintains persistent memory in `.claude/agent-memory/perf-optimizer/` — recording recurring bottleneck patterns, architectural constraints, and per-session outcomes — so institutional knowledge accumulates across sessions without re-deriving it from code.

---

## Phase 7 — Optimization & Code Quality

### Session 7A — Frontend Performance

**`useChat` stale closure fix via refs**
`sendMessage` read `messages` and `isLoading` from state, but both were captured in a closure from the last render. Adding a read operation (like checking history length) before the Groq call would see a stale array. Replaced with `messagesRef` and `isLoadingRef` written on every state change. `sendMessage` reads refs, not state — eliminates the stale closure entirely. State variables are retained solely for triggering re-renders.

**`Tooltip` 60fps setState eliminated**
The original `Tooltip` tracked cursor position with `useState({ x, y })`, causing a React re-render on every `mousemove` event (~60fps). Replaced with `posRef` (a plain ref) and direct writes to `cardRef.current.style.left`/`.bottom`. The boolean `visible` state is kept for show/hide since that does need a render cycle.

**`PlaylistContext` reorder debounce**
`PUT /api/playlists/:id/tracks` was firing on every `onDragEnd` event, including intermediate reorder steps. A 400ms debounce via `reorderDebounceRef` batches rapid drag events into a single network request. Local state is still updated immediately (optimistic), so the UI remains responsive. This reduces Turso write pressure during active DnD sessions.

**`React.memo` on `PlayerBar` and `ProgressBar`**
Both components receive stable props (player callbacks wired with `useCallback`) and re-rendered on every `App` state change (e.g., track selection, search input changes). Wrapping with `React.memo` prevents unnecessary re-renders with no functional change.

---

### Session 7B — Backend Performance

**N+1 elimination in `GET /api/playlists`**
The original handler fetched playlists for the user, then `Promise.all`-ed a `getTracksByPlaylist` call per playlist — N round-trips to Turso for N playlists. Each Turso round-trip is ~50ms; 5 playlists = ~300ms worst case. Replaced with `getPlaylistsWithTracks`, a single LEFT JOIN query that returns all playlists and their tracks in one request. Worst-case latency drops to ~50ms regardless of playlist count.

**`db.executeMultiple` for multi-statement migrations**
`@libsql/client`'s `db.execute(sql)` only runs the first statement in a semicolon-separated SQL string — subsequent statements are silently ignored. `db.executeMultiple(sql)` runs all statements. The migration runner used `db.execute`, which meant `005_add_indexes.sql` (three `CREATE INDEX` statements) would only apply the first index. Fixed by switching the runner to `db.executeMultiple`.

**DB indexes applied (migration 005)**
`idx_playlists_user_id`, `idx_playlist_tracks_playlist_id`, and `idx_uploaded_tracks_user_id` were specified in `DATABASE_SCHEMA.md` but never applied. Migration 005 adds all three. At current data volumes these are precautionary, but they eliminate full-table scans on the most common query patterns (user-scoped lookups).

---

### Session 7C — Code Quality

**Type consolidation: `shared/types.ts` as single source of truth**
See Phase 2 Polish — "Dual Track type definition" entry above for the history. `SearchTrack` was moved into `shared/types.ts` and the server's local definition replaced with an import. `client/src/types.ts` was converted to a thin re-export barrel (`export type { Track, SearchTrack, TrackSource } from '../../shared/types'`) so the 14 existing client import sites required no changes. Deleting `client/src/types.ts` entirely was considered but rejected — no path alias is available in `tsconfig.app.json`, so all import sites would have needed the deep relative path `../../shared/types`. Barrel approach keeps diffs minimal. No runtime behaviour changed — pure structural cleanup.

**`handleDeleteTrack` data consistency fix**
The original `handleDeleteTrack` in `App.tsx` called `DELETE /api/tracks/:id`, then unconditionally removed the track from local state — even if the network request failed. This caused the track to disappear from the UI on a failed delete and reappear on the next page load, leaving the user confused. Fixed by moving the local state mutation inside the `.then()` handler so it only runs when the server confirms 204.

**Japanese filename encoding fix (multer / busboy)**
`multer`'s underlying `busboy` library decodes multipart form `filename` bytes as Latin-1 by default. UTF-8 filenames (e.g. Japanese, Chinese, accented characters) are garbled in `req.file.originalname`. Fix: `Buffer.from(req.file.originalname, 'latin1').toString('utf8')` re-encodes the bytes correctly. ASCII filenames are unaffected (ASCII is a subset of both Latin-1 and UTF-8). Covered by a unit-level test that round-trips a Japanese katakana filename through the Buffer conversion — an integration test was not feasible because `form-data` (used by supertest) strips control character bytes from filenames before sending.

---

## Post-Phase 7 — Viewport & Layout Fixes

**`overflow-x: hidden` on `html` and `body` for universal horizontal scroll prevention**
`ChatWindow` slides off-screen using `translate-x-full` combined with `w-full` (100vw on mobile). When closed, the element occupies the range `[100vw, 200vw]` horizontally — outside the visible viewport but still part of the document's scroll width. Most browsers on all platforms and devices will create a scrollable dead zone here, allowing the user to drag the page sideways to reveal blank space. The fix is `overflow-x: hidden` on both `html` and `body` in `index.css`. Both selectors are required: some browsers (notably iOS Safari, but also certain versions of Samsung Internet and older Android WebView) use `html` as the scroll container root and ignore `overflow-x` on `body` alone. Applying both is the cross-browser standard. This fix is not iOS-specific — it covers any browser on any device or screen size that would otherwise expose the off-screen translated content.

**MobileMenu viewport clamping**
The `⋮` context menu in `TrackList.tsx` was positioned with `right: window.innerWidth - pos.x`, anchoring its right edge to the tap position. On narrow viewports (any device under ~200px wider than the menu), tapping near the left edge of the screen caused the menu's left side to extend off-screen. Replaced with a `left`-based calculation clamped to `[8px, window.innerWidth - MENU_WIDTH - 8px]`. This keeps the menu fully on-screen on any viewport width down to 320px (the smallest common screen width across all device classes — not just phones, but also small-screen tablets and niche Android devices).

---

## Post-Phase 7 — Bug Fixes

**Deezer library tracks moved from localStorage to server-side (`deezer_tracks` table)**
Deezer tracks added to the library via the search results "Add to Library" action were previously saved only to `localStorage` (`deezer-library-tracks` key). `localStorage` is per-browser, per-device — loading the app on a second device (or a different browser) returned an empty key, so those tracks simply never appeared there. The fix adds a `deezer_tracks` table in Turso with a composite primary key `(id, user_id)` (multiple users can save the same Deezer track), and two new authenticated endpoints: `POST /api/tracks/deezer` (upsert) and `DELETE /api/tracks/deezer/:id`. `GET /api/tracks` now fetches both uploaded and Deezer library tracks in a single `Promise.all` and merges them into the response. For authenticated users, the server is the source of truth; `localStorage` persistence is retained as a fallback for unauthenticated users only (no regression for that case).
