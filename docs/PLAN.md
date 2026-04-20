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
| MCP                 | YouTube Music MCP                                    | Phase 2 — audio streaming (TBD)  |
| Plugin              | `frontend-design@claude-plugins-official`            | High-quality UI generation       |
| Skill               | `vercel-react-best-practices`                        | Re-render and performance rules  |
| Playwright MCP      | (optional)                                           | Live browser testing of playback |


> GitHub MCP is not used. Git and PR operations are handled by the opencode sub-agent via the `/commitReview` slash command. Run `/commitReview` manually at the end of each session — there is no auto-hook.
>
> External music API strategy (Spotify, YouTube, etc.) will be decided at the start of Phase 2. Direct REST APIs will be used rather than MCPs.

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

Sessions 1A, 1B, and 1C are complete. See `docs/PLANCHECKLIST.md` for the full item-by-item breakdown. The live URL serves the app with upload, playback, seek, volume control, and sample tracks working end-to-end.

**Outstanding note from** `docs/REVIEW.md`: The root `tsconfig.json` added in Session 1C may conflict with `server/tsconfig.json`. Verify there is no build conflict before starting Session 2A.

---

## Phase 2 — External APIs

**Goal**: Search and stream from an external music source. Playlist management persisted to localStorage (no database yet).

> The external API approach will be decided at the start of Session 2A. Research options (Spotify Web API, YouTube Data API, SoundCloud API, or yt-dlp for YouTube audio) and document the chosen approach in `docs/DECISIONS.md` before writing any code. Direct REST APIs will be used — no MCPs. Key considerations: free tier availability, OAuth complexity, TOS restrictions on audio streaming.

---

### Session 2A — External API Research + Search Endpoint

**Deliverable**: Working search bar returning real track metadata from a chosen API.

Steps:

1. Research and pick an external music API — document the decision in `docs/DECISIONS.md`
  - Spotify Web API: rich metadata, requires OAuth, no direct audio streaming
  - YouTube Data API: search works, audio extraction has TOS restrictions
  - SoundCloud API: free tier available, direct audio URLs on some tracks
  - Last.fm API: metadata only, no streaming
2. Register API credentials and store in `.env`
3. Add `GET /api/search?q=` endpoint — proxy search results from the chosen API
4. Build `SearchBar` component in the frontend
5. Display search results alongside local tracks in `TrackList`
6. Write Supertest tests — mock the external API response
7. Update `docs/PLANCHECKLIST.md`
8. Commit, run `/commitReview`

**Checkpoint**: Typing in the search bar returns real track metadata from the chosen API.

---

### Session 2B — Audio Streaming from External Source

**Deliverable**: Tracks from the external API play in the player.

> This session's approach depends on the API chosen in 2A. If Spotify: use 30-second preview URLs (no OAuth needed for previews). If YouTube: research yt-dlp or a Node.js wrapper. Document the approach first.

Steps:

1. Confirm audio streaming approach — document in `docs/DECISIONS.md`
2. Add streaming or proxy endpoint as needed
3. Wire search result tracks to Howler.js so they play when clicked
4. Handle loading states (external audio may take longer to buffer than local files)
5. Write tests for the streaming/proxy endpoint
6. Update `docs/PLANCHECKLIST.md`
7. Commit, run `/commitReview`

**Checkpoint**: Click a search result → audio plays in the player.

---

### Session 2C — Playlist Management (Frontend Only)

**Deliverable**: Reorderable playlist that persists across page refreshes.

Steps:

1. Create `PlaylistContext` in `/client/src/contexts/`
2. Add "Add to playlist" button on each track (local + search results)
3. Build `PlaylistPanel` component with drag-and-drop (`@dnd-kit/core`)
4. Persist playlist to `localStorage` — temporary, replaced in Phase 3
5. Write Vitest tests for playlist context: add, remove, reorder
6. Update `docs/PLANCHECKLIST.md`
7. Commit, run `/commitReview` — opencode creates PR from `phase-2` branch into `main`

**Checkpoint**: Build a playlist from local + search tracks, reorder it, refresh — it persists.

---

## Phase 3 — Authentication + Database

**Goal**: Users can register, log in, and have playlists saved server-side. `docs/DATABASE_SCHEMA.md` already exists and is approved — use it as the source of truth. Do not deviate from it without updating the doc first.

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
5. Confirm `ProgressBar` Howler.js ticks do not cause re-renders (ref-based approach from 1B)
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

