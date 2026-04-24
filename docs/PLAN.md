# Music Player Web App — Project Plan

## Project Overview

A lightweight, Vercel-optimized music player web app built with React/TypeScript, Tailwind CSS, Node.js/Express, and SQLite. Built incrementally across ~5-hour sessions.

**Deployment**: Vercel (serverless-compatible) **Live URL**: [https://vibe-player.vercel.app](https://vibe-player.vercel.app)

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
| Database           | Turso (libSQL) via @libsql/client    |
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

**Deployed**: [https://vibe-player.vercel.app](https://vibe-player.vercel.app)

Sessions 1A, 1B, and 1C are complete. The live URL serves the app with upload, playback, seek, volume control, and sample tracks working end-to-end.

---

## Phase 2 — External APIs

**Goal**: Search and stream from Deezer. Playlist management persisted to localStorage (no database yet).

**API choice**: Deezer public API. No API key, no OAuth, no `.env` variables required. Search and 30-second preview MP3 URLs are available to anonymous requests. See `docs/DECISIONS.md` for the full rationale and the history of the Spotify attempt.

---

### ~~Session 2A (Spotify attempt) — SUPERSEDED~~

> Spotify Web API requires the app owner to have an active Premium subscription to use the search endpoint. All Spotify code was removed and replaced with Deezer.

---

### Session 2A — Deezer Search ✅ COMPLETE

> Deezer public API, no credentials. Search + 30-second preview URLs. All Spotify code removed.

---

### Session 2B — Playlist Management (Frontend Only) ✅ COMPLETE

> Drag-and-drop reorderable playlist stored in localStorage. Add-to-playlist on local tracks and Deezer results.

---

### Session 2C — Bug Fixes + Core UX Features ✅ COMPLETE

> Deezer previews play. Playlist items play. Delete uploaded tracks. Track list filterable and sortable.

---

### Session 2D — Multi-Playlist + UI Polish ✅ COMPLETE

> Multi-playlist support (`playlists:v2`), collapsible accordion, inline playlist picker with grid-rows animation, orange dot for now-playing.

---

## Phase 3 — Authentication + Database ✅ COMPLETE

### Session 3A — SQLite Setup ✅ COMPLETE
> migrations 001–003, typed DB helpers, in-memory tests.

### Session 3B — Auth Endpoints ✅ COMPLETE
> bcrypt + JWT + httpOnly cookies. `/register`, `/login`, `/logout`, `/me`. Rate-limited.

### Session 3C — Auth UI + Playlist Persistence ✅ COMPLETE
> LoginPage, RegisterPage, AuthContext, AuthGate. Playlists synced to Turso on every mutation.

---

## Phase 3B — Database Hotfix ✅ COMPLETE

### Session 5A — SQLite → Turso (libSQL) ✅ COMPLETE
> `better-sqlite3` wrote to `/tmp` which is ephemeral per Vercel container. Replaced with `@libsql/client` pointing to a Turso-hosted SQLite instance. All DB helpers made async. 42 server tests pass.

---

## Phase 4 — Polish + Scale

**Goal**: Production-ready performance, mobile support, and documented architecture.

---

### Session 4A — Performance ✅ COMPLETE
> Loading skeletons, bundle audit (94 kB gzip), Lighthouse 92/92/96/82 on mobile.

### Session 4B — Mobile Responsiveness ✅ COMPLETE
> Fixed bottom-sheet player, swipe gestures (`react-swipeable`), 44px touch targets, touch seek on ProgressBar.

### ~~Session 4C — Backlog + Architecture Docs~~ DEFERRED
> Deferred in favour of upload persistence and AI chatbot (Phase 5).

---

## Phase 5 — Feature Additions

### Session 5B — Upload Persistence (Vercel Blob) 🔄 Code complete, pending env var

**Problem**: Uploaded files written to `/tmp` vanish on Vercel cold start or different device.

**Fix**: `@vercel/blob` `put()` stores the file on Vercel's CDN and returns a permanent public URL. Metadata stored in Turso (`uploaded_tracks` table). Player uses blob URL via existing `externalUrl` field.

**User action required**: Vercel dashboard → Storage → Create Blob Store → add `BLOB_READ_WRITE_TOKEN` to Vercel env vars + local `.env`.

**Checkpoint**: Upload → log out → log back in → file still plays; works from another device.

---

### Session 5C — AI Music Assistant Chatbot ✅ COMPLETE

- Orange bubble + slide-in chat panel. Groq `llama-3.1-8b-instant`, auth-protected, 5 req/min rate limit, 20-message rolling history.

---

### Session 5D — Upload Size Limit + Per-User Quota UI ⬜ NEXT

**Problems**:
1. Files over ~5MB return 413 — multer has no file size cap set; Vercel Hobby plan caps function bodies at 4.5MB.
2. No per-user storage cap — a single user could fill the Blob store.

**Fix 1 — raise the per-file limit**:
- Set `limits: { fileSize: 50 * 1024 * 1024 }` (50MB) in multer config.
- Note: Vercel Hobby plan hard-caps request bodies at 4.5MB. The multer fix works locally and on Pro. On Hobby, files over 4.5MB will still 413 at the Vercel edge — document this constraint clearly.

**Fix 2 — per-user quota (free tier = 100MB)**:
- `getUserUploadedBytes(db, userId)` — `SUM(size)` from `uploaded_tracks`.
- Quota check in `POST /upload`: if `used + incoming > 100MB` → 413 `{ error, used, limit }`.
- `GET /api/user/quota` → `{ used: number, limit: number, tier: 'free' }`.

**UI**:
- `StorageBar` component below `FileUpload`: tier badge ("Free Trial"), filled progress bar, `X MB of 100 MB used`.
- `useQuota()` hook — fetches on mount, refreshes after each upload or delete.

**Files**:

| File | Change |
|---|---|
| `server/src/routes/tracks.ts` | multer 50MB limit; quota check before `put()` |
| `server/db/index.ts` | `getUserUploadedBytes()` helper |
| `server/src/routes/quota.ts` | New: `GET /api/user/quota` |
| `server/src/app.ts` | Register `/api/quota` |
| `server/src/__tests__/quota.test.ts` | New: 401, 200 with used/limit/tier |
| `server/src/__tests__/tracks.test.ts` | Add: upload fails when quota exceeded |
| `client/src/hooks/useQuota.ts` | New: fetches quota, exposes used/limit/tier/refresh |
| `client/src/components/StorageBar.tsx` | New: tier badge + progress bar |
| `client/src/__tests__/StorageBar.test.tsx` | New: renders bar, tier label, correct percentage |
| `client/src/App.tsx` | Mount `StorageBar` below `FileUpload`; pass `onUpload` refresh callback |

**Checkpoint**:
1. Upload a 12MB file locally → succeeds (multer allows it).
2. Upload until quota is nearly full → upload rejected with clear message.
3. `StorageBar` updates immediately after each upload/delete.
4. On Vercel Hobby: files > 4.5MB still 413 — documented, not a bug.

---

## Phase 6 — Playback Modes, Layout Overhaul, Cascade Delete, Extended Chat

### Session 6A — Player Enhancements ⬜ NOT STARTED

**Goals**: Shuffle, loop modes (track / queue), autoplay-next, and play-context (navigate within library or a specific playlist independently).

**Key approach**: `useRef` for `shuffleRef`, `loopModeRef`, and `queueRef` so Howl's `onend` closure always sees latest values. `play(track, context?)` sets the queue on each play call.

**Loop modes**: `none` (stop at end) → `track` (restart current) → `queue` (wrap to first) — cycled by a single button.

**Files**: `client/src/hooks/usePlayer.ts`, `client/src/App.tsx`

**Checkpoint**: Shuffle → next is random within queue; loop-track restarts; loop-queue wraps; playlist track → next/prev stays within that playlist.

---

### Session 6B — Desktop Layout Overhaul ⬜ NOT STARTED

**Goals**: Unified `PlayerBar` always visible at bottom (replaces `MobilePlayerBar` + embedded desktop card). Two tabs — Library (search/upload/tracks) and Playlists — in the main content area.

**PlayerBar additions**: Shuffle button (orange when active), Loop cycle button, VolumeControl (desktop only).

**Files**: `client/src/components/PlayerBar.tsx` (renamed), `client/src/App.tsx`

**Checkpoint**: Desktop shows tabs; player bar always visible; shuffle/loop buttons work; VolumeControl present on desktop.

---

### Session 6C — Cascade Delete + Extended Chat Actions ⬜ NOT STARTED

**Cascade delete**: `removeTrackFromAllPlaylists(trackId)` added to `PlaylistContext`. Called from `handleDeleteTrack` — track disappears from every playlist it was in.

**New chat action types** (6 additions):
- `pause`, `resume`, `skip`, `prev` — direct player controls
- `set_volume` — e.g. `{ type: "set_volume", level: "0.5" }`
- `search_and_play` — fetches `/api/search?q=...`, plays first result with `previewUrl`

**Files**: `client/src/contexts/PlaylistContext.tsx`, `client/src/App.tsx`, `server/src/routes/chat.ts`

**Checkpoint**: Delete library track → removed from all playlists; chat pause/skip/volume/search-and-play all work with confirmation messages.

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

