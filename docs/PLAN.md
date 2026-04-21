# Music Player Web App — Project Plan

## Project Overview

A lightweight, Vercel-optimized music player web app built with React/TypeScript, Tailwind CSS, Node.js/Express, and SQLite. Built incrementally across ~5-hour sessions.

**Deployment**: Vercel (serverless-compatible) **Live URL**: https://vibe-player.vercel.app

---

## Tools & Agents Reference


| Type                | Name                                                 | Purpose                          |
| ------------------- | ---------------------------------------------------- | -------------------------------- |
| Main agent          | Claude Code (`claude`)                               | Primary development              |
| Sub-agent           | OpenCode (`opencode/big-pickle`)                     | Commit review + PR creation      |
| Claude Code command | `/commitReview` — `.claude/commands/commitReview.md` | Manual end-of-session trigger    |
| Plugin              | `frontend-design@claude-plugins-official`            | High-quality UI generation       |
| Skill               | `vercel-react-best-practices`                        | Re-render and performance rules  |
| Playwright MCP      | (optional)                                           | Live browser testing of playback |


> GitHub MCP is not used. Git and PR operations are handled by the opencode sub-agent via the `/commitReview` slash command. Run `/commitReview` manually at the end of each session — there is no auto-hook.
>
> Spotify was attempted in Session 2A but requires Premium to use the Web API search endpoint. Replaced with Deezer public API — no API key, no OAuth, no account required. See docs/DECISIONS.md for full context.

---

## Repository Structure

```
/
├── .claude/
│   ├── commands/
│   │   └── commitReview.md        ← /commitReview slash command
│   ├── skills/
│   │   └── vercel-react-best-practices/
│   │       ├── SKILL.md
│   │       ├── AGENTS.md
│   │       └── rules/             ← individual rule files
│   └── settings.json              ← frontend-design plugin enabled
│
├── client/                        ← React/TS frontend (Vite)
│   └── src/
│       ├── components/            ← TrackList, PlayerControls, SearchBar, etc.
│       ├── contexts/              ← PlaylistContext, AuthContext (Phase 3)
│       ├── pages/                 ← LoginPage, RegisterPage (Phase 3)
│       └── hooks/                 ← usePlayer, usePlaylist, etc.
│
├── server/                        ← Node/Express backend
│   ├── routes/                    ← tracks, upload, stream, search
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
├── api/
│   └── index.ts                   ← Vercel serverless entry point
│
├── skills-lock.json
├── CLAUDE.md                      ← Claude Code instructions
├── .env                           ← gitignored
├── .gitignore
└── vercel.json

```

---

## Tech Stack


| Layer              | Choice                               |
| ------------------ | ------------------------------------ |
| Frontend           | React + TypeScript (Vite)            |
| Styling            | Tailwind CSS                         |
| Audio              | Howler.js                            |
| Backend            | Node.js + Express                    |
| Search             | Deezer public API (no key required)  |
| Database           | SQLite via better-sqlite3 (Phase 3+) |
| Testing (backend)  | Jest + Supertest                     |
| Testing (frontend) | Vitest + React Testing Library       |
| Deployment         | Vercel                               |


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
4. Run /commitReview

```

---

## Phase 1 — Beta Playback (No Database) ✅ COMPLETE

**Deployed**: https://vibe-player.vercel.app

Sessions 1A, 1B, and 1C are complete. The live URL serves the app with upload, playback, seek, volume control, and sample tracks working end-to-end.

---

## Phase 2 — External APIs

**Goal**: Search and stream from Deezer. Playlist management persisted to localStorage (no database yet).

**API choice**: Deezer public API. No API key, no OAuth, no `.env` variables required. Search and 30-second preview MP3 URLs are available to anonymous requests. See `docs/DECISIONS.md` for the full rationale and the history of the Spotify attempt.

---

### Session 2A — Deezer Search (REPLACES Spotify attempt) 🔄

**Context**: Spotify code was built in a prior attempt but is blocked because the Web API requires a Premium subscription. All Spotify-related files must be removed and replaced with a Deezer implementation. No `.env` variables are needed for Deezer.

**Deliverable**: Working search bar returning Deezer track metadata, with 30-second previews playable via the existing Howler.js player.

Steps:

1. Add decision entry to `docs/DECISIONS.md` — Deezer chosen over Spotify, reason: no auth required, 30-second preview MP3 URLs available for free
2. Remove all Spotify-specific code:
  - `server/src/routes/search.ts` — rewrite for Deezer
  - `server/src/__tests__/search.test.ts` — rewrite tests
  - `client/src/components/SearchBar.tsx` — keep, rewire to new endpoint
  - `client/src/components/SearchResults.tsx` — keep, update types
  - `client/src/__tests__/SearchBar.test.tsx` — update mocks
  - Remove `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` from `.env` and any token-caching logic in the server
3. Implement Deezer search endpoint:
  - `GET /api/search?q=` proxies `https://api.deezer.com/search?q=`
  - Returns normalized array: `{ id, title, artist, albumArt, previewUrl, durationMs }`
  - Returns 400 if `q` is missing or empty
  - No credentials needed — direct fetch, no token logic
4. Wire `previewUrl` to the existing `usePlayer` hook via a synthetic `Track` object — same pattern as local tracks, just a different URL source
5. Update `client/src/types.ts` — replace any Spotify-specific types with source-agnostic `Track` shape (source: `'local' | 'deezer'`)
6. Rewrite tests:
  - `GET /api/search` returns 400 with no query
  - `GET /api/search?q=test` returns correct shape (mock `fetch` to Deezer)
  - `SearchBar` renders results from mock data
7. Run full test suite — all must pass
8. Manual smoke test: search "radiohead", click a result, audio plays
9. Update `docs/PLANCHECKLIST.md`
10. Commit, run `/commitReview`

**Checkpoint**: Search "radiohead" → results appear → click a track → 30-second preview plays through the existing player.

**Deezer API reference**:

```
Search:  GET https://api.deezer.com/search?q=radiohead
Track:   GET https://api.deezer.com/track/3135556

```

Key response fields: `id`, `title`, `artist.name`, `album.cover_medium`, `preview` (direct MP3 URL), `duration` (seconds).

---

### Session 2B — Playlist Management (Frontend Only)

**Deliverable**: Reorderable playlist that persists across page refreshes.

Steps:

1. Create `PlaylistContext` in `/client/src/contexts/`
2. Add "Add to playlist" button on each track (local + Deezer results)
3. Build `PlaylistPanel` component with drag-and-drop (`@dnd-kit/core`)
4. Persist playlist to `localStorage` — temporary, replaced in Phase 3
5. Version the localStorage key (`playlist:v1`) and wrap in try/catch per the `client-localstorage-schema` rule in the Vercel best-practices skill
6. Write Vitest tests for playlist context: add, remove, reorder
7. Update `docs/PLANCHECKLIST.md`
8. Commit, run `/commitReview` — opencode creates PR from `phase-2` branch into `main`

**Checkpoint**: Build a playlist from local + Deezer tracks, reorder it, refresh — it persists.

> Note: Session 2B was previously "YouTube Audio Streaming". That feature is moved to the Phase 4 backlog — it has TOS complexity that is not worth blocking Phase 3 over. Playlist management is more valuable to implement now.

---

## Phase 3 — Authentication + Database

**Goal**: Users can register, log in, and have playlists saved server-side. `docs/DATABASE_SCHEMA.md` already exists and is approved — use it as the source of truth. Do not deviate from it without updating the doc first.

> Note: `DATABASE_SCHEMA.md` still references `'spotify'` as a source value in `playlist_tracks`. Update it to `'deezer'` before Session 3A begins.

---

### Session 3A — Schema Update + SQLite Setup

**Deliverable**: All database operations tested with in-memory SQLite.

Steps:

1. Update `docs/DATABASE_SCHEMA.md`: change source enum from `'local' | 'spotify' | 'youtube'` to `'local' | 'deezer'` and update the Deezer track JSON shape accordingly
2. Install `better-sqlite3`
3. Create `/server/db/migrations/`:
  - `001_create_users.sql`
  - `002_create_playlists.sql`
  - `003_create_playlist_tracks.sql`
  - Write these exactly from the updated `docs/DATABASE_SCHEMA.md`
4. Write `/server/db/migrate.ts` — simple runner, executes migrations in order
5. Write `/server/db/index.ts` — typed query helpers for all tables
6. Write Jest tests for all DB operations using `:memory:` database
7. Run `npm run test:server` — all must pass
8. Update `docs/PLANCHECKLIST.md`
9. Commit, run `/commitReview`

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
7. Commit, run `/commitReview`

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
9. Commit, run `/commitReview` — opencode creates PR from `phase-3` branch into `main`

**Checkpoint**: Register → log in → build playlist → refresh → playlist persists.

---

## Phase 4 — Polish + Scale

**Goal**: Production-ready performance, mobile support, and documented architecture.

---

### Session 4A — Performance Audit

Steps:

1. Resolve the root `tsconfig.json` / `server/tsconfig.json` conflict flagged in `docs/REVIEW.md`
2. Run Lighthouse on the live Vercel URL
3. Fix any score below 80 on mobile (lazy loading, bundle splitting)
4. Run `vite-plugin-visualizer` to inspect bundle composition
5. Confirm `ProgressBar` Howler.js ticks do not cause re-renders
6. Add loading skeletons to `TrackList` and search results
7. Update `docs/PLANCHECKLIST.md`
8. Commit, run `/commitReview`

**Checkpoint**: Lighthouse performance score > 80 on mobile.

---

### Session 4B — Mobile Responsiveness

Steps:

1. Audit all components at 375px viewport width
2. Fix Tailwind breakpoints for small screens
3. Implement bottom-sheet player for mobile (slides up when a track is playing)
4. Add swipe-to-skip gesture (`react-swipeable`)
5. Update `docs/PLANCHECKLIST.md`
6. Commit, run `/commitReview`

**Checkpoint**: App is fully usable on a phone screen.

---

### Session 4C — Backlog + Architecture Docs

Steps:

1. Write `docs/ARCHITECTURE.md` documenting current system design
2. Create `BACKLOG.md` in root with effort vs. impact scoring for each idea
3. Pick one item from the backlog and implement it
4. Commit, run `/commitReview` — opencode creates final PR into `main`

**Backlog ideas to score**:

- YouTube audio streaming (yt-dlp wrapper — deferred from Phase 2)
- Offline mode (service worker + Cache API)
- Waveform visualizer (Web Audio API `AnalyserNode`)
- Collaborative playlist URLs (read-only, no login required)
- Last.fm scrobbling
- PWA — installable on phone
- PostgreSQL migration for multi-user scale
- Discord Rich Presence
- Persistent upload storage (S3 or Cloudflare R2, replacing `/tmp` on Vercel)

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
/commitReview

# Deploy
vercel --prod

```

