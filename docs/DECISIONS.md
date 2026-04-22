# Architecture & Library Decisions

Decisions are grouped by phase and session in chronological order.

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
Vercel's Lambda-based runtime has a read-only filesystem except for `/tmp`. Uploaded files are written to `/tmp` in production (ephemeral — cleared between invocations). Sample MP3s are bundled with the function via `vercel.json` `includeFiles` and accessed via `process.cwd()/server/samples`. Local dev uses `__dirname`-relative paths. Persistent upload storage (S3/Cloudflare R2) is a Phase 4 backlog item.

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

**Dual Track type definition (known divergence)**
`client/src/types.ts` defines its own `Track` interface rather than re-exporting from `shared/types.ts`. Any new field added to the shared type must also be added to the client copy. The divergence was caught by the Vercel build when `externalUrl` was added to `shared/types.ts` but not `client/src/types.ts`. When the DB lands, consolidate to a single source of truth.

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

### Session 3A — SQLite

**better-sqlite3 for SQLite**
Chosen over `sqlite3` (callback-based, no TypeScript types out of the box) and over full ORMs (Prisma, Drizzle — overkill for this scale). `better-sqlite3` is synchronous, which simplifies migration runners and query helpers. Migrations are plain SQL files executed in filename order by a small custom runner (`server/db/migrate.ts`). The `_migrations` table tracks which files have already been applied, making the runner idempotent.

**DB file at /tmp/music.db on Vercel**
`getDb()` checks `process.env.VERCEL` and uses `/tmp/music.db` in production (Vercel's writable path). Local dev uses `path.join(__dirname, '../../db/music.db')`. Same pattern as uploads.

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
`PUT /api/playlists/:id/tracks` replaces the entire track list on every mutation (add, remove, reorder). Simpler than differential sync — no conflict resolution needed at this scale. The client sends current state; the server overwrites. Debouncing reorder calls is a known improvement for Phase 4.

**Favorites playlist identified by name, not fixed ID**
Server-side, each user's Favorites playlist has a UUID primary key (not a fixed `'favorites'` string). The frontend identifies it via `playlists.find(p => p.name === 'Favorites')?.id`. This works for the common case but is fragile if the user renames Favorites — a known limitation documented in `REVIEW.md`.

**Express error middleware for async route failures**
Express 4 does not auto-propagate rejected async handlers. Auth route handlers (`/register`, `/login`) are wrapped in try/catch calling `next(err)`. A 4-arg error middleware in `app.ts` returns `{ error: 'Internal server error' }` with status 500. Without this, a missing `JWT_SECRET` on Vercel caused silent 504 timeouts.

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
