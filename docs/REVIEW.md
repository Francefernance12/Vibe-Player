# Code Review

---

## Date: 2026-04-24

## Branch Name: session-4c

## What Changed

Documentation-only session. One commit on this branch:

- `docs/ARCHITECTURE.md` — Created from scratch. Full architecture reference covering system overview, tech stack, repository layout, component hierarchy (with ASCII tree), context providers, key hooks, key patterns (useRef closures, portal rendering, grid-rows transitions, mouse-following tooltip), backend route table (all 16 endpoints with auth column), middleware chain, DB helper table, four data flows (auth, playlist sync, audio playback, upload), testing strategy (both suites broken down by file), and deployment topology with env var table.
- `docs/PLANCHECKLIST.md` — All Phase 6 sessions (6A, 6B, 6C) marked complete with actual delivered items. `feature/pricing-mockup` session added. Session 4C marked complete. Test count updated to 101 (49 client + 52 server).
- `docs/PLAN.md` — Phase 6 sessions updated from "NOT STARTED" to ✅ COMPLETE with one-line summaries. Sessions 5B, 5D, 4C status corrected. `feature/pricing-mockup` entry added.
- `docs/DECISIONS.md` — "(planned)" removed from all three Phase 6 headings. Five new decision entries appended: tooltip `bottom`-anchor positioning, `matchMedia` hover detection, mobile portal ⋮ menu, Deezer `localStorage` persistence, and pricing mockup design branch strategy.

## Issues Spotted

**None critical** — this is a docs-only change with no code modifications. Tests confirm no regressions: 52 server + 49 client all pass.

Minor observations:
- `ARCHITECTURE.md` route table lists `GET /api/tracks/:filename/stream` as unauthenticated — this is correct but worth confirming the stream route still has no auth guard in `server/src/routes/tracks.ts` (it should be open for sample playback).
- The `DECISIONS.md` entry for "Session 5E" referenced in the model upgrade decision (`llama-3.1-8b-instant` → `llama-3.3-70b-versatile` in "Session 5E") doesn't correspond to a named session in `PLAN.md` or `PLANCHECKLIST.md` — the upgrade was actually part of Session 5C/5D work. Low impact since the decision entry is accurate about the _what_ and _why_.
- `PLANCHECKLIST.md` Agent Review Log row for Session 6B notes "Tab state lost on re-render; `playInternalRef` assigned during render" as low risk/accepted — no action needed, just flagging it is documented.

## Suggestions

- The `ARCHITECTURE.md` "Key Patterns" section mentions `matchMedia` hover detection but the component it applies to (`Tooltip.tsx`) isn't linked. Consider adding `client/src/components/Tooltip.tsx:L1` as a cross-reference for future readers.
- `DECISIONS.md` now has a "Feature Branch — Pricing Mockup" section at the bottom that sits outside the Phase numbering scheme. If more feature branches are added in future, consider introducing a "Phase 7 — Standalone Features" heading to keep the structure consistent.
- The `ARCHITECTURE.md` testing strategy table could note which test files require a `PlaylistProvider` wrapper and which don't — this trips up contributors adding new tests for the first time.

## Date: 2026-04-20

## Branch Name: review/session-1A-1C

## What Changed

11 files changed, 331 insertions(+), 13 deletions(-)

### Files Modified:
- `.env` - Environment configuration
- `client/src/App.tsx` - App component updates
- `client/src/__tests__/SearchBar.test.tsx` - SearchBar test
- `client/src/components/SearchBar.tsx` - SearchBar component
- `client/src/components/SearchResults.tsx` - SearchResults component
- `client/src/types.ts` - TypeScript types
- `docs/DECISIONS.md` - Documentation
- `docs/PLANCHECKLIST.md` - Planning checklist
- `server/src/__tests__/search.test.ts` - Backend search test
- `server/src/app.ts` - Express app
- `server/src/routes/search.ts` - Search route endpoint

### Summary:
- Added Spotify search endpoint with backend route
- Added SearchBar UI component with tests
- Added SearchResults component
- Implemented related TypeScript types

## Issues Spotted

1. **.env file in diff**: The `.env` file shows up in the diff as having changes. This could contain sensitive credentials - verify no secrets are being committed.

2. **Missing error boundary**: The SearchBar component lacks error boundary handling for failed API calls.

## Suggestions

1. **Add environment validation**: Consider adding runtime validation for required env vars (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET) rather than failing silently at runtime.

2. **Increase test coverage**: Consider adding integration tests for the Spotify search endpoint with mock responses.

3. **Loading states**: Add loading/pending states to SearchBar while fetching results.

4. **Rate limiting**: The Spotify API has rate limits - consider adding client-side debouncing to prevent excessive requests.

---

## Date: 2026-04-20

## Branch Name: review/session-2A (HEAD at d12d3d1)

## What Changed

15 files changed, 309 insertions(+), 363 deletions(-)

### Files Modified:
- `.claude/settings.local.json` - Local settings
- `.env_example` - Environment example
- `.gitignore` - Git ignore rules
- `client/src/App.tsx` - App component
- `client/src/__tests__/SearchBar.test.tsx` - SearchBar test
- `client/src/components/SearchBar.tsx` - SearchBar component
- `client/src/components/SearchResults.tsx` - SearchResults component
- `client/src/types.ts` - TypeScript types
- `docs/DECISIONS.md` - Documentation decisions
- `docs/PLAN.md` - Project plan (major refactored)
- `docs/PLANCHECKLIST.md` - Planning checklist
- `docs/REVIEW.md` - This review file
- `server/samples/MusicSample.mp3` - New sample audio file
- `server/src/__tests__/search.test.ts` - Backend search test
- `server/src/routes/search.ts` - Search route endpoint

### Summary:
- Replaced Spotify search with Deezer search integration
- Added sample MP3 file to server/samples
- Refactored search route (massive reduction in lines)
- Updated planning documents
- Added .env_example for environment configuration

## Issues Spotted

1. **Binary file in repo**: `server/samples/MusicSample.mp3` (733KB) is now tracked - consider if this is intentional or should be gitignored.

2. **Large documentation diff**: docs/PLAN.md and docs/PLANCHECKLIST.md show major changes - verify changes are properly tracked.

## Suggestions

1. **Verify .gitignore**: Ensure `server/uploads/` is properly gitignored for future file uploads.

2. **Add search provider abstraction**: Consider abstracting the search provider (Spotify/Dezer) to make it swappable.

3. **Sample file strategy**: Decide if samples should be in repo or fetched from external source.

---

## Date: 2026-04-20

## Branch Name: main (current)

## What Changed

13 files changed, 539 insertions(+), 134 deletions(-)

### Files Modified:
- `client/package-lock.json` - Dependencies
- `client/package.json` - Dependencies
- `client/src/App.tsx` - App component
- `client/src/__tests__/PlaylistContext.test.tsx` - Playlist context test
- `client/src/__tests__/TrackList.test.tsx` - TrackList test
- `client/src/components/PlaylistPanel.tsx` - Playlist panel component
- `client/src/components/SearchResults.tsx` - Search results component
- `client/src/components/TrackList.tsx` - Track list component
- `client/src/contexts/PlaylistContext.tsx` - Playlist context
- `docs/PLAN.md` - Project plan
- `docs/PLANCHECKLIST.md` - Planning checklist
- `docs/REVIEW.md` - This review file
- `.claude/commands/commitReview.md` - Commit command

### Summary:
- Added playlist management with drag-and-drop persistence
- Added PlaylistPanel component
- Added PlaylistContext with state management
- Updated tests for playlist functionality

## Issues Spotted

1. **State persistence**: Verify that playlist order is properly persisted across page reloads - check localStorage usage.

2. **No confirmation dialogs**: The UI lacks confirmation dialogs when deleting playlists or tracks.

## Suggestions

1. **Add undo functionality**: Consider adding undo for playlist/track removal actions.

2. **Optimistic updates**: The drag-and-drop could use optimistic UI updates for better UX.

3. **Accessibility**: Ensure drag-and-drop is keyboard accessible.

---

## Date: 2026-04-20

## Branch Name: polish-phase2 (HEAD at b274ea0)

## What Changed

14 files changed, 211 insertions(+), 102 deletions(-)

### Files Modified:
- `.claude/commands/commitReview.md` - Commit command updates
- `client/index.html` - HTML template
- `client/src/App.tsx` - App component
- `client/src/__tests__/ProgressBar.test.tsx` - ProgressBar test
- `client/src/components/FileUpload.tsx` - FileUpload component
- `client/src/components/PlayerControls.tsx` - PlayerControls component
- `client/src/components/PlaylistPanel.tsx` - PlaylistPanel component
- `client/src/components/ProgressBar.tsx` - ProgressBar component
- `client/src/components/SearchBar.tsx` - SearchBar component
- `client/src/components/SearchResults.tsx` - SearchResults component
- `client/src/components/TrackList.tsx` - TrackList component
- `client/src/components/VolumeControl.tsx` - VolumeControl component
- `client/tailwind.config.js` - Tailwind configuration
- `tsconfig.json` - TypeScript configuration

### Summary:
- tsconfig.json fix for proper path resolution
- Enhanced error handling across components
- Wax design system integration (Tailwind updates)
- Polish phase2 improvements to UI components

## Issues Spotted

1. **Tailwind config changes**: Verify custom theme configuration doesn't conflict with future library updates.

2. **Multiple component changes**: 12 component files modified - risk of introducing regressions.

## Suggestions

1. **Verify error handling**: Ensure all API error paths are properly tested with mock failures.

2. **Consider component tests**: Add unit tests for individual components if missing.

3. **Theme documentation**: Document the custom Wax theme configuration for future developers.

---

## Date: 2026-04-21

## Branch Name: session-2c

## What Changed

14 files changed, 345 insertions(+), 92 deletions(-)

### Files Modified:
- `shared/types.ts` — added `externalUrl?: string` to Track interface
- `client/src/hooks/usePlayer.ts` — play() now uses externalUrl as Howler src when present
- `client/src/App.tsx` — wired playlist playback, delete handler, filter/sort state
- `client/src/components/PlaylistPanel.tsx` — added onPlay prop, clickable rows, active item highlight
- `client/src/components/TrackList.tsx` — added onDelete prop, delete button for upload rows only
- `client/src/utils/trackFilter.ts` — new: filterAndSortTracks utility (filter + 5 sort modes)
- `client/src/__tests__/TrackList.test.tsx` — updated for new props; added delete button tests
- `client/src/__tests__/trackFilter.test.ts` — new: 7 tests for filter and sort logic
- `server/src/tracks.ts` — added isSampleFilename() helper
- `server/src/routes/tracks.ts` — added DELETE /api/tracks/:filename (403 sample, 404 missing, 204 ok)
- `server/src/__tests__/api.test.ts` — 3 new delete endpoint tests
- `docs/DATABASE_SCHEMA.md` — updated source enum and track shapes from Spotify/YouTube to Deezer
- `docs/DECISIONS.md` — added Wax design system entry
- `docs/PLANCHECKLIST.md` — Session 2C marked complete; tsconfig item ticked in 4A

## Issues Spotted

1. **IDs regenerated on every GET /api/tracks**: `tracks.ts` calls `uuidv4()` at read-time, so local track IDs differ between page loads and playlist storage. Playlist "active" detection falls back to filename comparison, which works but means stored playlist item IDs are stale after refresh.

2. **handleDeleteTrack is async but errors are swallowed**: If the DELETE fetch fails, tracks state is still updated and playback stopped. Should surface a failure state.

3. **No confirmation on delete**: Uploaded tracks are deleted immediately on button click with no undo. Easy to delete accidentally.

## Suggestions

1. **Stabilise track IDs**: Generate IDs from filename hash or store them in a lightweight JSON manifest so they are stable across restarts. This will be needed anyway when the DB lands in Phase 3.

2. **Add error feedback on delete failure**: Catch the fetch error and show a transient error message rather than silently failing.

3. **Debounce filter input**: The filter runs on every keystroke via useMemo — acceptable now but worth debouncing if the track list grows large.

---

## Date: 2026-04-21

## Branch Name: session-2d

## What Changed

19 files changed, 784 insertions(+), 219 deletions(-)

### Files Modified:
- `client/src/contexts/PlaylistContext.tsx` — full rewrite: multi-playlist architecture (`playlists:v2` key), `createPlaylist()`, `addLocal(track, playlistId)`, `addDeezer()` targets Favorites, `isInPlaylist()` helper
- `client/src/components/PlaylistPanel.tsx` — full rewrite: collapsible accordion per playlist, chevron toggle, track count badge, inline "New playlist" form with Escape-to-cancel, DndContext scoped per section, animated pulse on active track
- `client/src/components/TrackList.tsx` — inline playlist picker expands below each row (grid-rows transition), checkmarks per playlist, delete button for all track sources (not just uploads)
- `client/src/components/SearchResults.tsx` — "+" now adds Deezer track to tracks list via `onAddToTracks` prop; checkmark reflects presence in tracks list (not playlist)
- `client/src/App.tsx` — added `handleAddDeezerToTracks` (dedup guard), `handleDeleteTrack` skips API call for non-upload sources, `makeSyntheticTrack` sets `source: 'deezer'`
- `client/src/types.ts` / `shared/types.ts` — `Track.source` extended to `'sample' | 'upload' | 'deezer'`
- `client/src/__tests__/PlaylistContext.test.tsx` — rewritten for new multi-playlist API (9 tests)
- `client/src/__tests__/TrackList.test.tsx` — updated for delete-all and picker behavior
- `docs/DECISIONS.md` — added multi-playlist architecture and grid-rows accordion decisions
- `docs/PLANCHECKLIST.md` — Session 2D marked complete

## Issues Spotted

1. **`addDeezer` in PlaylistContext is now unused externally**: SearchResults no longer calls `addDeezer` — it calls `onAddToTracks` instead. `addDeezer` still exists on the context but is only wired in `PlaylistContext.tsx` internally. The `PlaylistPanel` playlist items can still be `kind: 'deezer'` when a Deezer track added to the tracks list is then added to a playlist via the inline picker — this path correctly uses `addLocal`, not `addDeezer`. `addDeezer` may be dead code going forward.

2. **`docs/PLAN.md` not updated**: The modified file list includes `docs/PLAN.md` in the diff but it was not explicitly updated this session; changes may be stale.

3. **Deezer tracks in playlist stored as `kind: 'local'`**: When a Deezer track (source: 'deezer') is added to a playlist via the TrackList picker, it goes through `addLocal()` and is stored as `{ kind: 'local', track }`. The `itemLabel` function in `PlaylistPanel` uses `track.originalName.replace(...)` for local items — which works because `makeSyntheticTrack` sets `originalName: "${title} — ${artist}"`. However, the distinction between a real local file and a Deezer synthetic track is lost in playlist storage.

## Suggestions

1. **Remove or repurpose `addDeezer`**: Since Deezer tracks now flow through the tracks list and get added to playlists via `addLocal`, `addDeezer` is likely dead code. Remove it in Session 3A cleanup or repurpose it for a "quick add to Favorites" shortcut if desired.

2. **Add `kind: 'deezer'` to PlaylistItem**: Currently `kind` is `'local' | 'deezer'`, but Deezer tracks added via the picker are stored as `kind: 'local'`. Consider checking `track.source === 'deezer'` in `addLocal` and storing as `kind: 'deezer'` for correct label formatting in PlaylistPanel.

3. **Playlist picker close-on-outside-click**: The inline picker has no blur/outside-click handler to close it. Users must click the "+" button again to close.

---

## Date: 2026-04-22

## Branch Name: session-3a

## What Changed

11 files changed, 730 insertions(+), 39 deletions(-)

### Files Modified:
- `docs/DATABASE_SCHEMA.md` — source enum updated to `'local' | 'deezer'`; Spotify/YouTube shapes replaced with Deezer shape
- `docs/DECISIONS.md` — better-sqlite3 rationale filled in (was placeholder "deferred to Phase 3")
- `docs/PLANCHECKLIST.md` — Session 3A marked complete
- `server/db/migrations/` — 3 SQL files: users, playlists, playlist_tracks
- `server/db/migrate.ts` — idempotent migration runner; `_migrations` table tracks applied files
- `server/db/index.ts` — typed query helpers for all three tables; `createMemoryDb()` for test isolation
- `server/src/__tests__/db.test.ts` — 11 tests covering CRUD, cascade delete, ordering, atomic replace, idempotency
- `server/package.json` — `better-sqlite3` + `@types/better-sqlite3` added

## Issues Spotted

1. **`getDb()` singleton caches module-level**: `_db` is a module variable. Fine for long-running Express but under Vercel serverless, the SQLite file path (`server/db/music.db`) will be in the read-only filesystem — needs to move to `/tmp/music.db` for Vercel prod (same pattern as uploads).

2. **`replacePlaylistTracks` resets `added_at`**: On a reorder, all `added_at` timestamps are set to `now`, losing original insertion time. Not critical for Phase 3 but worth noting.

3. **`foreign_keys = ON` only set inside `runMigrations`**: The pragma is applied once per connection during migration. This is safe with `better-sqlite3` (single synchronous connection) but should be explicitly documented.

## Suggestions

1. **Add `getDb()` Vercel `/tmp` note to DECISIONS.md**: The DB file path will need a runtime check similar to the existing `/tmp` uploads logic.

2. **Extract `TrackSource` union type to `shared/types.ts`**: Currently `'local' | 'deezer'` is duplicated between `db/index.ts` and `types.ts`. A shared type would prevent drift.

3. **Add `getPlaylistTrackById` helper**: Session 3B will need to verify track ownership before delete/reorder — a missing helper today.

---

## Date: 2026-04-22

## Branch Name: session-3b

## What Changed

9 files changed, 450 insertions(+), 19 deletions(-)

### Files Modified:
- `server/package.json` — added `bcrypt`, `jsonwebtoken`, `cookie-parser` + dev types
- `server/package-lock.json` — dependency lockfile
- `server/src/app.ts` — added `cookie-parser` middleware and auth router mount
- `server/src/middleware/auth.ts` — new: `authMiddleware`, `getJwtSecret()`, `AuthPayload` type
- `server/src/routes/auth.ts` — new: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `server/src/__tests__/auth.test.ts` — new: 9 auth endpoint tests
- `docs/DECISIONS.md` — auth decisions documented
- `docs/PLANCHECKLIST.md` — Session 3B marked complete
- `.env_example` — added `JWT_SECRET` placeholder

### Summary:
- Implemented full auth flow: register, login, logout, and `/me` endpoints
- Passwords hashed with bcrypt (cost factor 12)
- Sessions issued as JWTs stored in `httpOnly; SameSite=lax` cookies
- `authMiddleware` reads and verifies JWT from cookie, attaches `req.user`
- Auth tests use `jest.mock` to replace `getDb()` with `createMemoryDb()` — no real DB file touched
- All 34 server tests pass (22 prior + 9 auth + 3 search)

## Issues Spotted

1. **`getDb()` path resolution**: The path `path.join(__dirname, '..', '..', 'server', 'db', 'music.db')` works when `__dirname` is `server/src/` (ts-node), but after `tsc` compilation to `dist/`, `__dirname` becomes `server/dist/src/` — the relative path would resolve incorrectly. Worth adding a test or explicit path assertion before Vercel deployment.

2. **No rate limiting on auth endpoints**: `/api/auth/register` and `/api/auth/login` have no rate limiting. In production, brute-force and registration spam are easy without it. Consider `express-rate-limit` on these routes before 3C.

3. **No logout invalidation**: The logout route clears the cookie client-side, but the JWT remains valid until expiry (7 days). A short-lived token (e.g., 1 hour) + refresh token would mitigate this, but adds complexity. For now, the 7-day window is an accepted risk at this project scale.

## Suggestions

1. **Add `express-rate-limit`**: Apply to `/api/auth/register` and `/api/auth/login` before shipping to production. Simple, low-overhead mitigation.

2. **Short-circuit on missing `JWT_SECRET`**: `getJwtSecret()` throws at call time. Consider calling it at server startup (in `index.ts`) so a missing secret fails fast rather than at first auth request.

3. **Consider `httpOnly` + `Secure` flag on Vercel**: The cookie sets `secure: process.env.NODE_ENV === 'production'` — verify `NODE_ENV` is set correctly in Vercel environment variables so cookies are secure in production.

---

## Date: 2026-04-22

## Branch Name: session-3c

## What Changed

15 files changed, 900 insertions(+), 229 deletions(-)

### Files Modified:
- `client/src/App.tsx` — split into `AuthGate` + `Player` components; `AuthProvider` wraps the tree; shows `LoginPage`/`RegisterPage` when not logged in
- `client/src/contexts/AuthContext.tsx` — new: `AuthProvider`, `useAuth()`, `login`, `register`, `logout`, session check on mount
- `client/src/contexts/PlaylistContext.tsx` — rewritten: loads from API when logged in; syncs on every mutation; falls back to localStorage when not
- `client/src/components/LoginPage.tsx` — new: email/password form with error display
- `client/src/components/RegisterPage.tsx` — new: form with client-side validation (email format, password length ≥ 8)
- `client/src/__tests__/AuthForms.test.tsx` — new: 6 tests (login error, register validation, nav links)
- `client/src/__tests__/PlaylistContext.test.tsx` — updated: wraps with `AuthProvider`, fetch mocked as 401
- `client/src/__tests__/TrackList.test.tsx` — updated: wraps with `AuthProvider`
- `server/src/routes/playlists.ts` — new: `GET`, `POST`, `DELETE /api/playlists`, `PUT /api/playlists/:id/tracks` (all auth-protected, ownership-checked)
- `server/src/routes/auth.ts` — register now auto-creates Favorites playlist in DB
- `server/src/app.ts` — wired `playlistsRouter`
- `server/src/__tests__/playlists.test.ts` — new: 8 tests covering CRUD + track sync
- `docs/PLANCHECKLIST.md` — Session 3C marked complete

### Summary:
- App is now fully gated behind auth (register/login required)
- `PlaylistContext` syncs to API on every mutation when user is logged in; uses localStorage when logged out
- `PUT /api/playlists/:id/tracks` is a full-replace sync — client sends complete current state
- Register auto-creates a Favorites playlist in the DB so every user starts with one
- All tests pass: 42 server + 36 client = 78 total

## Issues Spotted

1. **`PlaylistContext` syncs on every keystroke of reorder**: Each drag-and-drop position change triggers a `PUT /api/playlists/:id/tracks` with the full track list. If the user reorders quickly, many requests fire in sequence. No debounce or request cancellation.

2. **`defaultPlaylistId` finds Favorites by name**: `playlists.find(p => p.name === 'Favorites')?.id` is fragile — if a user renames their Favorites playlist, `addDeezer` will silently fall back to `LOCAL_FAVORITES_ID` (`'favorites'`) which won't match any server playlist.

3. **No loading state during playlist fetch**: `PlaylistProvider` fetches playlists from API on login but shows whatever was in localStorage in the meantime (or the default empty Favorites). There's no loading indicator, so the UI may briefly show stale data.

4. **`createPlaylist` fire-and-forget on API error**: If `POST /api/playlists` fails, the playlist exists in local state but not in the DB. On next page load, it disappears. No error surfaced to the user.

## Suggestions

1. **Debounce `PUT /api/playlists/:id/tracks`**: Add a 500ms debounce on the sync call for reorder operations to avoid flooding the server during fast drag-and-drop.

2. **Store Favorites ID stably**: Instead of finding by name, store the Favorites playlist ID in a user preference or in a dedicated field. Alternatively, mark the auto-created playlist with a `is_default` flag in the DB.

3. **Add loading state in `PlaylistProvider`**: Expose an `isLoading` boolean from context and show a spinner in `PlaylistPanel` while the first fetch completes.

4. **Retry or rollback on `createPlaylist` failure**: Catch the API error and either remove the locally-created playlist or show a toast error so the user knows the playlist wasn't saved.

---

## Date: 2026-04-22

## Branch Name: session-3c (production auth fix)

## What Changed

2 files changed, 59 insertions(+), 49 deletions(-)

### Files Modified:
- `server/src/routes/auth.ts` — wrapped `/register` and `/login` async handlers in try/catch calling `next(err)`; added `NextFunction` to import
- `server/src/app.ts` — added Express 4-arg error-handling middleware (logs and returns 500 JSON)

### Summary:
- Root cause: `JWT_SECRET` env var was missing from Vercel dashboard. `getJwtSecret()` threw synchronously inside an async Express 4 handler. Express 4 does not auto-propagate rejected Promises — the response was never sent and Vercel returned a 504 timeout.
- Evidence of bug: user was created in DB (bcrypt + `createUser` ran before the throw), so "Email already registered" appeared on second attempt.
- Fix: try/catch on both async handlers forwards errors to Express error pipeline; new error middleware returns `{ error: 'Internal server error' }` with status 500 instead of hanging indefinitely.
- All 42 server tests pass after the change.

## Issues Spotted

1. **`deletePlaylistApi` was dead code (already fixed)**: The earlier commit on this branch removed an unused function that was causing TS6133 build failure on Vercel. Confirmed removed.

2. **`foreign_keys = ON` only applied in `getDb()` (pre-existing)**: The pragma is set correctly in the DB helper but should be verified on Vercel's `/tmp` cold-start path.

## Suggestions

1. **Startup validation for `JWT_SECRET`**: The `api/index.ts` Vercel entry point never calls `getJwtSecret()` at startup. A startup check (e.g., call it once in `api/index.ts`) would surface a missing secret immediately on cold start rather than on the first auth request.

2. **Return specific 500 message in dev**: The error middleware currently returns a generic message in all environments. In development, logging `err.stack` would speed up debugging.

---

## Date: 2026-04-22

## Branch Name: session-3c

## What Changed

18 files changed, 1176 insertions(+), 339 deletions(-)

### Files Modified:
- `.claude/commands/commitReview.md` - Updated commitReview skill
- `.claude/settings.local.json` - Local settings
- `client/src/App.tsx` - App component refactored
- `client/src/__tests__/AuthForms.test.tsx` - New 81-line auth form tests
- `client/src/__tests__/PlaylistContext.test.tsx` - Updated playlist context tests
- `client/src/__tests__/TrackList.test.tsx` - Updated track list tests
- `client/src/components/LoginPage.tsx` - New login page component
- `client/src/components/RegisterPage.tsx` - New register page component
- `client/src/contexts/AuthContext.tsx` - New auth context
- `client/src/contexts/PlaylistContext.tsx` - Refactored playlist context
- `docs/DECISIONS.md` - Updated documentation
- `docs/PLAN.md` - Updated project plan
- `docs/PLANCHECKLIST.md` - Updated checklist
- `docs/REVIEW.md` - This review file (appended)
- `server/src/__tests__/playlists.test.ts` - New 100-line playlist API tests
- `server/src/app.ts` - Updated Express app
- `server/src/routes/auth.ts` - Updated auth routes
- `server/src/routes/playlists.ts` - New 74-line playlists routes

### Summary:
- Added full authentication flow (register, login, logout, session check)
- Created LoginPage and RegisterPage components
- Created AuthContext for React state management
- Added playlist API routes (GET, POST, DELETE, PUT tracks)
- Refactored PlaylistContext to sync with API when authenticated
- Added comprehensive test coverage (auth forms, playlists)

## Issues Spotted

1. **No debounce on playlist reorder sync**: Each drag movement fires `PUT /api/playlists/:id/tracks`. Fast drags trigger many concurrent requests.

2. **Favoritesplaylist lookup by name**: Finding Favorites by name is fragile—renaming breaks Deezer track additions.

3. **No error feedback on API failures**: Playlist creation errors aren't surfaced to users.

4. **Missing loading states**: No loading indicator during initial playlist fetch.

## Suggestions

1. **Debounce playlist track sync**: Add ~500ms debounce on PUT during reorder.

2. **Store Favorites ID in user profile**: Use DB flag or store ID instead of name lookup.

3. **Add toast notifications for API errors**: Surface failures to users.

4. **Add isLoading state to PlaylistContext**: Expose loading state, show spinner in UI.

---

## Date: 2026-04-22

## Branch Name: session-4a (HEAD at e1656be)

## What Changed

7 files changed, 466 insertions(+), 14 deletions(-)

### Files Modified:
- `client/package-lock.json` - 403 new lines added (major dependency updates)
- `client/package.json` - 1 line added (new dependency)
- `client/src/App.tsx` - 23 lines changed
- `client/src/components/SearchBar.tsx` - 7 lines changed
- `client/src/components/SearchResults.tsx` - 21 lines changed
- `client/vite.config.ts` - 7 lines changed
- `docs/PLANCHECKLIST.md` - 18 lines changed

### Summary:
- Added loading skeletons + bundle visualizer setup
- Lighthouse scores recorded: Perf 92, A11y 92, BP 96, SEO 82

## Issues Spotted

1. **Large `package-lock.json` diff**: 403 lines added to lockfile. Verify dependencies are intentional and versioned correctly.

2. **Bundle visualizer added**: Confirm this is for development analysis only and won't bloat production builds.

## Suggestions

1. **Pin dependency versions**: After the package-lock update, ensure versions are pinned for reproducibility.

2. **Keep Lighthouse scores above 90**: Scores are good but SEO at 82 could be improved for production.

---

## Date: 2026-04-22

## Branch Name: session-4b (HEAD at 748b0cd)

## What Changed

6 files changed, 100 insertions(+), 14 deletions(-)

### Files Modified:
- `client/package-lock.json` — added `react-swipeable@7.0.2` dependency
- `client/package.json` — added `react-swipeable@7.0.2`
- `client/src/App.tsx` — added `MobilePlayerBar` component with swipe gestures; main container adds `pb-32 sm:pb-10` for bottom bar clearance
- `client/src/components/PlayerControls.tsx` — enlarged prev/next touch targets: `p-3 sm:p-2` (44px on mobile)
- `client/src/components/ProgressBar.tsx` — added `onTouchEnd` handler for mobile seeking
- `docs/PLANCHECKLIST.md` — Session 4B marked complete

### Summary:
- Implemented fixed bottom-sheet player for mobile with `sm:hidden` class
- Inline desktop player hidden on mobile with `hidden sm:flex`
- Added swipe left/right on bottom bar to trigger next/prev track using `react-swipeable`
- Enlarged prev/next button touch targets from `p-2` to `p-3` on mobile (~44px)
- Added touch support to `ProgressBar` for mobile seeking via `onTouchEnd`
- All mobile-first responsive design uses Tailwind `sm:` breakpoint
- All 36 client tests pass after changes

## Issues Spotted

1. **Swipe prevention on vertical scroll**: The swipe handler sets `preventScrollOnSwipe: true`, which could interfere with vertical scrolling on the bottom bar if the user starts a vertical scroll gesture that begins on the bar. Testing on real devices recommended.

2. **No haptic feedback on mobile**: Swipe gestures and touch interactions have no haptic feedback (vibration) that would enhance the mobile UX. Consider adding `navigator.vibrate(50)` on successful swipe.

3. **Touch target size for progress bar**: The progress bar has `py-2 -my-2` to enlarge the clickable area, but on mobile this gives an effective height of only ~24px. Apple HIG recommends minimum 44px touch targets — consider increasing to `py-3 -my-3` on mobile.

## Suggestions

1. **Test swipe on real devices**: Verify `preventScrollOnSwipe: true` doesn't break vertical scrolling on iOS Safari and Android Chrome. May need to adjust to `preventScrollOnSwipe: 'touch'` or remove entirely.

2. **Add visual feedback on swipe**: Consider adding a subtle transform animation or visual indicator when the user swipes left/right to show that the gesture was recognized before the track changes.

3. **Increase progress bar touch target**: Change `ProgressBar` to use `py-3 -my-3 sm:py-2 sm:-my-2` to meet minimum 44px touch target guideline on mobile while keeping desktop compact.

4. **Test with long track names**: The bottom bar uses `truncate` on track name. Verify that very long track names don't cause layout shift or overflow on small screens (320px).

---

## Date: 2026-04-22

## Branch Name: session-5a (HEAD at 6e938ba)

## What Changed

12 files changed, 688 insertions(+), 597 deletions(-)

### Files Modified:
- `api/index.ts` — awaits `initDb()` before first request
- `docs/PLANCHECKLIST.md` — Session 5A marked complete; Turso migration documented
- `server/db/index.ts` — rewritten for libSQL: async helpers, `Client` replaces `Database`, `initDb()` runs PRAGMA + migrations
- `server/db/migrate.ts` — async; `runMigrations()` takes `Client`
- `server/package-lock.json` — 777 lines changed: `better-sqlite3` removed, `@libsql/client` added
- `server/package.json` — `better-sqlite3` replaced with `@libsql/client`
- `server/src/__tests__/auth.test.ts` — async test setup: `beforeAll(createMemoryDb + initDb)`
- `server/src/__tests__/db.test.ts` — all helpers awaited; `beforeEach(createMemoryDb + initDb)`
- `server/src/__tests__/playlists.test.ts` — async test setup
- `server/src/index.ts` — calls `initDb()` before `app.listen()`
- `server/src/routes/auth.ts` — all DB calls awaited; `/me` handler wrapped in try/catch
- `server/src/routes/playlists.ts` — all handlers async + try/catch; DB calls awaited

### Summary:
- Root cause: Vercel `/tmp` SQLite DB is ephemeral per serverless invocation — register writes user in one container, login runs in a new container and can't find user
- Solution: migrate from `better-sqlite3` (local file) to `@libsql/client` (remote Turso database for persistent storage)
- All DB helpers converted to async
- Migrations rewritten for async API
- Tests updated: use in-memory libSQL client, call `initDb(db)` in `beforeAll`/`beforeEach`
- Production env vars added to Vercel: `TURSO_URL`, `TURSO_AUTH_TOKEN`
- All 42 server tests pass after migration

## Issues Spotted

1. **`api/index.ts` calls `initDb()` on every cold start**: Each serverless invocation runs `initDb()`, which applies PRAGMA and checks migrations. This is safe (migrations table is idempotent) but adds latency. Worth profiling if cold-start time becomes an issue.

2. **`getDb()` singleton uses module-level cache**: The libSQL `Client` is cached in `_db` at module level. Under Vercel's execution model, this cache persists for the lifetime of a warm container. If Turso connection times out, `_db` will hold a stale client. No retry/reconnect logic exists. Consider implementing connection health checks or lazy reconnection.

3. **No transaction support in `replacePlaylistTracks`**: The helper deletes all tracks then inserts new ones in separate queries. If the second query fails (network issue, timeout), the playlist ends up empty. libSQL supports transactions — wrapping the operation in `BEGIN`/`COMMIT` would prevent partial state.

4. **Test isolation uses `:memory:` client per test**: `createMemoryDb()` returns a fresh in-memory client. This is correct and fast, but the `:memory:` URL creates a new isolated DB per client. Multiple concurrent calls to `createMemoryDb()` are safe (each test gets its own DB).

## Suggestions

1. **Add connection retry to `getDb()`**: If a query fails with a connection error, clear `_db` and retry once. This would prevent serverless functions from hanging on stale clients after idle periods.

2. **Wrap `replacePlaylistTracks` in a transaction**: Use `db.batch()` (libSQL batch API) or explicit `BEGIN`/`COMMIT` to ensure atomic delete + insert. This prevents data loss on partial failures.

3. **Extract `resolveDbUrl()` to `.env` check at startup**: The function reads `TURSO_URL` at runtime. If missing in production, it falls back to `file:./music.db`, which will fail on Vercel (read-only filesystem). Add an explicit startup check in `initDb()` or `api/index.ts` to fail fast with a clear error message if `TURSO_URL` is missing in production.

4. **Document Turso URL format in `.env_example`**: Add a comment to `.env_example` showing the expected Turso URL format (e.g., `libsql://[your-db].turso.io`) and link to Turso docs for obtaining auth tokens.


---

## Date: 2026-04-23

## Branch Name: session-5c

## What Changed

20 files changed, 860 insertions(+), 275 deletions(-) across two features:

**Session 5B — Upload Persistence via Vercel Blob + Turso**
- `server/db/migrations/004_create_uploaded_tracks.sql` — new table tracking blob URL, user_id, metadata
- `server/db/index.ts` — CRUD helpers for uploaded_tracks
- `server/src/tracks.ts` — stripped to samples-only; removed disk-based upload logic
- `server/src/routes/tracks.ts` — multer.memoryStorage(), Blob put/del, auth-aware GET
- `server/src/__tests__/tracks.test.ts` — mocks @vercel/blob + db, covers 401/201/GET/DELETE paths
- `client/src/App.tsx` — delete now uses track.id (Turso UUID) not filename

**Session 5C — AI Music Assistant via Groq**
- `server/src/routes/chat.ts` — auth + rate-limit (5/min per user) + Groq llama-3.1-8b-instant
- `server/src/app.ts` — registers /api/chat
- `server/src/__tests__/chat.test.ts` — 401/400/200/429 coverage, groq-sdk mocked
- `client/src/hooks/useChat.ts` — rolling 20-msg history, 429 user message
- `client/src/components/ChatBubble.tsx` — fixed orange FAB, chat/X icon toggle
- `client/src/components/ChatWindow.tsx` — slide-in panel, message bubbles, loading dots
- `client/src/__tests__/ChatWindow.test.tsx` — empty state, closed class, send button, onClose

## Issues Spotted

1. **Rate limit uses `req.user?.userId ?? 'anonymous'`**: The fallback to `'anonymous'` is dead code since `authMiddleware` runs before the rate limiter and would have already returned 401. Not a bug but adds confusion — remove the fallback.

2. **No max message length validation on `/api/chat`**: A user could send a very long message, causing excessive token usage on Groq. Add a simple body-size check (e.g., reject if `content.length > 2000`).

3. **`useChat` history cap is client-only**: Rolling 20-message cap prevents unbounded memory client-side, but the full history is still sent in each request body. If a user finds a way to inflate the array, the server will forward it all to Groq. Consider capping total chars on the server side before the Groq call.

4. **`ChatWindow` test mocks `fetch` globally**: The global mock is set at module level — any test that runs after this file in the same suite will inherit the mock. Use `beforeEach`/`afterEach` with `vi.restoreAllMocks()` to isolate.

## Suggestions

- Add a server-side `content` length guard on POST /api/chat (e.g., 2000 chars per message).
- Consider streaming Groq response in future when context grows (the `stream: true` option is available).
- The `tryGetUserId` helper is a useful pattern — consider extracting it to `server/src/middleware/auth.ts` if it's needed in other routes.

---

## Date: 2026-04-23

## Branch Name: session-5c (TS hotfix)

## What Changed

1 file changed — `client/src/hooks/useChat.ts`: added `as const` to three `role: 'assistant'` literals in `setMessages` calls. TypeScript was widening the role to `string`, causing build failure on Vercel.

Also updated:
- `docs/DECISIONS.md`: documented the `as const` fix rationale and the Groq + rate-limit decisions
- `docs/PLANCHECKLIST.md`: marked TS fix as complete

## Issues Spotted

None additional beyond those noted in the prior session-5c review.

## Suggestions

- Consider defining a helper `assistantMsg(content: string): ChatMessage` to avoid the `as const` pattern at every call site.
- Add a client-side Vitest snapshot or type-level test (using `satisfies`) to catch this class of regression early.

---

## Date: 2026-04-24

## Branch Name: session-5c (Session 5D work)

## What Changed

27 files changed, 1215 insertions(+), 279 deletions(-) — cumulative diff from main includes all of 5B, 5C, and 5D.

**Session 5D additions in this commit:**
- `server/src/routes/tracks.ts` — multer `limits: { fileSize: 50MB }`; quota check (SUM of size) before Blob `put()`; 413 with used/limit in body when exceeded
- `server/src/app.ts` — `multer.MulterError LIMIT_FILE_SIZE` caught in global error handler → 413
- `server/db/index.ts` — `getUserUploadedBytes()` helper; `rootDir` removed from tsconfig to stop IDE false-positives from `db/` and `shared/` being outside `src/`
- `server/src/routes/quota.ts` — new: `GET /api/user/quota` → `{ used, limit, tier }`
- `server/src/__tests__/quota.test.ts` — 401 without auth, 200 with shape check
- `server/src/__tests__/tracks.test.ts` — quota exceeded → 413
- `client/src/hooks/useQuota.ts` — fetches on mount, `refresh()` called after upload/delete
- `client/src/components/StorageBar.tsx` — tier badge, filled progress bar, orange at ≥90%
- `client/src/__tests__/StorageBar.test.tsx` — renders label, progressbar role, aria-valuenow
- `client/src/App.tsx` — mounts `StorageBar` below `FileUpload`; `refreshQuota()` wired into `handleUploaded` and `handleDeleteTrack`

**Also fixed this session:**
- `getUserUploadedBytes` was silently removed by the IDE linter after being added — re-added
- `server/tsconfig.json` `rootDir: "./src"` caused TS6059 errors for all imports from `../db` and `../../shared` — removed `rootDir` entirely (Vercel builds from source, not from `dist/`)

## Issues Spotted

1. **`FREE_QUOTA_BYTES` is duplicated**: defined independently as `100 * 1024 * 1024` in both `routes/tracks.ts` and `routes/quota.ts`. If the value changes, both must be updated. Extract to a shared constant (e.g., `server/src/config.ts`).

2. **No 413 test for multer file size limit**: the quota-exceeded 413 is tested, but the multer `LIMIT_FILE_SIZE` 413 (files > 50MB) has no test. Add a test that sends an oversized buffer and expects 413 with "File too large".

3. **`useQuota` silently swallows all fetch errors**: if the server is down or returns an unexpected error, `quota` stays `null` and `StorageBar` is simply not rendered — acceptable, but worth noting.

4. **`StorageBar` shows `0.0 MB of 100 MB used` on first login before any uploads** — minor UX: consider showing "No uploads yet" when `used === 0` instead of `0.0 MB`.

## Suggestions

- Extract `FREE_QUOTA_BYTES` to `server/src/config.ts` and import it in both routes.
- Add a multer file-size 413 test to `tracks.test.ts`.
- Consider a `session-5d` branch next time to keep PRs scoped to one session's work.

---

## Date: 2026-04-24

## Branch: session-5c (continued)

## What Changed

### AI Assistant App Integration
- **`server/src/routes/chat.ts`** — system prompt now includes the user's music library (up to 40 tracks with IDs) and playlist list; action tag format instructions added so the AI can embed `<action>{"type":"play","trackId":"..."}` etc. at the end of responses.
- **`client/src/hooks/useChat.ts`** — signature changed from `useChat(trackName?)` to `useChat({ trackName, library, playlists, onAction })`; added `extractAction()` to parse and strip `<action>...</action>` tags from AI replies before display; parsed action dispatched via `onAction` callback.
- **`client/src/components/ChatWindow.tsx`** — new props forwarded to `useChat`; suggestion chips added to empty state ("Tell me about this track", "Recommend similar artists", etc.); desktop window lifted to `sm:bottom-4` (was `sm:bottom-0`); slide-in transition smoothed to `duration-300 ease-out`; input form uses `env(safe-area-inset-bottom)` to avoid iOS home indicator overlap.
- **`client/src/components/ChatBubble.tsx`** — bubble now fades/scales out when chat is open (`opacity-0 scale-75 pointer-events-none`), eliminating overlap with the ChatWindow submit button; added `shadow-orange-500/20` glow.
- **`client/src/App.tsx`** — added `usePlaylist()` for playlist context; `library` and `playlistSummaries` memos built from track/playlist state; `handleChatAction` dispatches `play` (→ `player.play`), `search` (→ fetch `/api/search` + `setSearchResults`), and `add_to_playlist` (→ `addLocal`) actions.

### Sample Cleanup
- Deleted `server/samples/sample1.mp3`, `sample2.mp3`, `sample3.mp3` — only `MusicSample.mp3` remains.
- Updated `api.test.ts` and `tracks.test.ts` to use `MusicSample.mp3` as the test fixture.

## Issues Spotted

1. **Action reliability depends on LLM compliance** — the AI is instructed to append action tags, but `llama-3.1-8b-instant` may omit or malformat them under rephrasing. The `extractAction` parser silently drops malformed JSON (safe default), but the user sees no feedback that their command wasn't executed. Consider a brief toast like "Playing…" or "Added to playlist" triggered in `handleChatAction`.

2. **Library slice is client-only** — `library.slice(0, 40)` happens on the client before sending; if the user has > 40 tracks the AI won't know about them. The slice is hardcoded identically in App.tsx and in the server prompt builder (the server also slices to 40). Both are 40, which is consistent, but the limit is invisible to the user.

3. **`handleChatAction` is not memoized against `defaultPlaylistId` changing** — `defaultPlaylistId` comes from `usePlaylist()` and could change if the Favorites playlist is renamed. The `useCallback` dep array includes it correctly, so this is fine — just noting it's load-bearing.

4. **`search` action opens results in the Deezer panel but doesn't visually indicate the chat triggered it** — the results appear without explanation. A banner like "Vibe searched for 'jazz'" in the search container would clarify the source.

5. **`server/samples/sample1.mp3` was the stream test fixture** — updated correctly, but if `MusicSample.mp3` is ever deleted the stream test will 404. Consider a small synthetic fixture (generated silence) committed to the test helpers instead of relying on a real audio file.

## Suggestions

- Add a lightweight toast/notification system (`react-hot-toast` or a custom one) so AI-triggered actions give visual confirmation.
- Move `LIBRARY_LIMIT = 40` to a shared constant used by both App.tsx and chat.ts to keep them in sync.
- Add a `chat.test.ts` case asserting that `library` and `playlists` appear in the system prompt (mock `buildSystemPrompt` or inspect the groq call args).

---

## Date: 2026-04-24 (continued)

## Branch: session-5c

## What Changed

### AI Action Reliability Fix

**Root causes addressed:**
1. `llama-3.1-8b-instant` (8B) too weak to reliably follow structured output instructions → switched to `llama-3.3-70b-versatile` (70B, still free on Groq).
2. System prompt used passive/conditional language and literal placeholder text `"EXACT_ID_FROM_LIBRARY"` that small models copied verbatim → rewrote with numbered `RULE 1/2/3` blocks, `CRITICAL CONSTRAINTS` header, explicit "replace the placeholder" language, and a failure case ("if the track is not in the library, say so in text — do NOT invent an ID").
3. `extractAction()` silently dropped actions when the model wrapped JSON in backticks or markdown code fences → added pre-parse sanitization to strip both patterns.

**UX improvements:**
- `onAction` callback now returns `string | void`; confirmed actions are appended to chat as `kind: 'action'` messages, rendered as small centered italic lines (not bubbles).
- Suggestion chips reworded to unambiguously express intent: `'Play something from my library'`, `'Search for chill jazz'`, `'What is this genre called?'`, `'Add this track to my Favorites'`.

### Bug Fix: Groq 400 on follow-up messages
`kind: 'action'` messages (UI-only feedback appended locally) were included in the `messages` array sent to the Groq API, which rejects unknown properties. Fixed by filtering to `apiMessages = nextMessages.filter(m => !m.kind).map(({ role, content }) => ({ role, content }))` before the fetch — action feedback messages are display-only and should not enter conversation history.

### Files Changed
- `server/src/routes/chat.ts` — model `llama-3.1-8b-instant` → `llama-3.3-70b-versatile`; `max_tokens` 512 → 400; `buildSystemPrompt` rewritten with imperative numbered rules
- `client/src/hooks/useChat.ts` — `extractAction` hardened; `onAction` typed as `(action) => string | void`; `apiMessages` filtered before fetch; `kind: 'action'` messages appended on confirmation
- `client/src/App.tsx` — `handleChatAction` returns confirmation strings per action type
- `client/src/components/ChatWindow.tsx` — `kind === 'action'` messages rendered as dim italic; suggestion chips updated

## Issues Spotted

1. **Rate limit still 5 req/min** — the 70B model is slower than 8B; if users have a slow connection and retry quickly they could hit the limit before receiving their first reply. Consider raising to 8–10 req/min now that responses take slightly longer.

2. **`apiMessages` filtering removes action feedback from history** — correct, but also means if the user says "play that again" after an action, the assistant has no memory it triggered the action. Consider keeping a lightweight action log separate from `messages` to pass as context.

3. **`handleChatAction` for `add_to_playlist` uses `playlists` from the outer closure** — if playlists haven't loaded from the server yet (network delay), `playlists.find(...)` returns `undefined` and the confirmation says `'Added to "your playlist".'` instead of the real name. Benign but slightly misleading.

4. **No test coverage for `extractAction` sanitization** — the backtick/code-fence stripping is untested. A unit test for the utility would prevent regressions.

## Suggestions

- Raise chat rate limit to 8 req/min to account for 70B model latency.
- Add `useChat.test.ts` with unit tests for `extractAction` covering: clean JSON, backtick-wrapped JSON, code-fence-wrapped JSON, missing action tag, malformed JSON.
- Add a `'No action' | string` union return from `handleChatAction` and surface a brief inline error if the track/playlist wasn't found (currently silently shows "Track not found." which may be missed).

---

## Date: 2026-04-24

## Branch Name: session-6b

## What Changed

**Session 6A — Player Enhancements**
- `usePlayer.ts` rewritten: `shuffleRef`, `loopModeRef`, `queueRef`, `currentTrackRef`, `volumeRef` added as refs so Howl's `onend` closure always sees current values without stale captures.
- `play(track, context?)` sets the active queue; falls back to `libraryTracks` on first play without a context.
- `onend` auto-advances: `loopMode === 'track'` restarts, shuffle picks a random pool entry, linear picks next index, `loopMode === 'queue'` wraps to `queue[0]`, otherwise stops.
- `next()`/`prev()` navigate within `queueRef` (respecting shuffle on next).
- `toggleShuffle()` and `cycleLoop()` sync refs + useState for re-renders.
- `PlaylistPanel.tsx` `onPlay` signature updated to `(item, playlistItems)` so App can build the playlist queue context.

**Session 6B — Desktop Layout + Unified PlayerBar**
- New `PlayerBar.tsx`: always-visible fixed bottom bar replacing both `MobilePlayerBar` and the hidden desktop card. Constrained to `max-w-md mx-auto` to match content width. Shuffle (orange when active) + Loop buttons (with "1" badge when looping track). VolumeControl desktop-only. Swipe gestures preserved.
- `App.tsx`: Library / Playlists tab switcher added below wordmark. Library tab: search, upload, quota bar, tracklist. Playlists tab: `PlaylistPanel`. Padding adjusted to `pb-28` for all viewports.

**Bug Fix**
- `visibleTracks` `useMemo` was referenced in `handleSelect`'s deps before its declaration (temporal dead zone crash on mount). Fixed by hoisting the `useMemo` above the callbacks.

## Issues Spotted

1. **No `usePlayer` tests** — The hook is now significantly more complex (queue logic, shuffle, loop modes, `onend` branching) but has no unit tests. Howler makes this hard to mock, but a happy-path test for `toggleShuffle`/`cycleLoop` state changes would catch regressions.
2. **Shuffle on `next()` vs `onend` diverge slightly** — Manual `next()` with shuffle picks from `pool` excluding current; `onend` shuffle does the same but reads `currentTrackRef` which may lag by one render if play hasn't settled. Low risk in practice.
3. **Tab state lost on re-render edge cases** — Switching to Playlists tab hides the search container, so `searchResults` accumulate invisibly. They clear on next search but a stale result set could appear if the user tabs back. Consider clearing `searchResults` on tab switch.
4. **`playInternalRef.current = createAndPlay` assigned during render** — Safe (synchronous, before any event), but could be moved into a `useEffect` to be strictly correct. Not a bug in practice.

## Suggestions

- Add `onTabChange` callback that clears `searchResults` when leaving Library tab.
- Consider exposing `queueRef.current.length` so the UI can show "X tracks in queue".
- The "1" badge on the loop button is 7px text in a 10px circle — may be too small on low-DPI screens. Consider an outlined "1" or a different visual cue.
- Session 6C (cascade delete + extended chat actions) is the natural next step and closes the remaining player control gap in the chat assistant.

---

## Date: 2026-04-24

## Branch Name: session-6c

## What Changed

4 commits, 7 files changed across three sub-tasks:

**Cascade delete + Deezer persistence fix**
- `client/src/contexts/PlaylistContext.tsx` — added `removeTrackFromAllPlaylists(trackId)`: filters every playlist's items and syncs changed playlists to the backend if logged in.
- `client/src/App.tsx` — `handleDeleteTrack` calls `removeTrackFromAllPlaylists(track.id)` after removing from local state; `saveDeezerTracks()` also called to keep localStorage consistent. `loadDeezerTracks()` merged into the initial fetch so Deezer tracks survive refresh. `visibleTracks` `useMemo` hoisted above `handleSelect` to fix temporal dead zone crash on mount.

**Tooltip overhaul (mouse-following + hover detection)**
- `client/src/components/Tooltip.tsx` — new file: `SUPPORTS_HOVER` detected via `window.matchMedia('(hover: hover) and (pointer: fine)')` (try/catch for jsdom). Tooltip now uses `onMouseMove` to track `e.clientX`/`e.clientY` and positions above the cursor with `translateY(-100%)`, horizontally clamped to viewport edges (`max-w-64`, 8px margin). `TrackInfoCard` and `SearchTrackInfoCard` card components extracted here.
- `client/src/index.css` — added `@keyframes slide-up` + `.animate-slide-up` for the mobile info bottom sheet.

**Mobile 3-dots options menu for TrackList**
- `client/src/components/TrackList.tsx` — existing `+` and trash buttons now `hidden sm:flex` (desktop only). New `⋮` button (`flex sm:hidden`) opens a portal-rendered `MobileMenu` with Info / Add to playlist / Delete actions. "Add" closes menu and triggers existing inline picker. "Info" opens `InfoBottomSheet` — a full-width bottom sheet rendered via `createPortal` showing `TrackInfoCard`.

**Test updates**
- `client/src/__tests__/PlayerBar.test.tsx` — added `mockTrack` constant and `currentTrack={mockTrack}` to the "shows track name" test (required because `TrackInfoCard` now renders inside a `Tooltip` guarded by `currentTrack` being non-null).

All 49 client tests and 52 server tests pass.

## Issues Spotted

1. **`MobileMenu` closes on any outside tap, including tapping a different track's ⋮ button** — tapping from one track's menu directly to another's ⋮ button will close the first and open the second correctly, but a brief flash may occur. Low severity.

2. **`InfoBottomSheet` has no close button** — users must tap the backdrop to close. On small screens, if the keyboard is open, the backdrop may be occluded. Consider adding an explicit close button or swipe-down gesture.

3. **`SUPPORTS_HOVER` is computed once at module load time** — this is correct for a persistent browser session, but if a user plugs in a mouse after page load, the tooltip won't activate until refresh. Acceptable tradeoff for simplicity.

4. **Tooltip card width is hardcoded as `CARD_WIDTH = 256`** — matches `w-64` Tailwind class. If the card width changes in `CardShell`, the clamping math will be off. Consider deriving from the rendered element width via a ref if this becomes a maintenance concern.

5. **`removeTrackFromAllPlaylists` uses `itemId(i)` which reads `item.track.id`** — this matches how tracks are stored in playlists. However, `saveDeezerTracks` in `handleDeleteTrack` filters by `filename`, while `removeTrackFromAllPlaylists` filters by `id`. These are consistent for both upload and Deezer tracks (IDs are stable), but worth noting the dual filter logic.

## Suggestions

- Add a swipe-down gesture to `InfoBottomSheet` using `react-swipeable` (already a dependency) for a more native feel.
- Consider showing the `⋮` menu inline below the track row (same pattern as the playlist picker) on very small screens rather than a floating portal, to avoid z-index layering issues with the fixed `PlayerBar`.
- Add `aria-haspopup="menu"` and `aria-expanded` to the ⋮ button for accessibility.
- Move `CARD_WIDTH` into a shared constant if `CardShell`'s width ever needs to change.

---

## Date: 2026-04-25

## Branch Name: session-7a

## What Changed

7 files changed, 83 insertions(+), 37 deletions(-) — frontend performance audit via perf-optimizer.

### Files Modified:
- `client/src/hooks/useChat.ts` — stale closure fix: added `messagesRef` and `isLoadingRef` refs; `sendMessage` now reads/writes through refs instead of closure-captured state; `messages` and `isLoading` removed from `useCallback` dep array; `clearMessages` resets both ref and state
- `client/src/components/Tooltip.tsx` — replaced `pos` useState (triggering re-render on every mousemove at 60fps) with `posRef` + `cardRef`; `handleMouseMove` now writes directly to `cardRef.current.style.*` without setState; `visible` boolean state retained only for show/hide class toggle
- `client/src/contexts/PlaylistContext.tsx` — added `REORDER_DEBOUNCE_MS = 400` constant and `reorderDebounceRef`; `reorderPlaylist` state update is now immediate (optimistic) while the `PUT /api/playlists/:id/tracks` network call is debounced 400ms to avoid flooding the server on rapid drag-and-drop
- `client/src/components/PlayerBar.tsx` — wrapped with `React.memo`
- `client/src/components/ProgressBar.tsx` — wrapped with `React.memo`
- `client/src/components/SearchBar.tsx` — added `onSearching` to `useEffect` dependency array (was missing, causing the effect to silently not re-run when the prop changed)
- `docs/PLANCHECKLIST.md` — Session 7A marked complete; Agent Review Log updated

### Summary:
- Phase 7A frontend performance audit complete. Three root issues fixed: (1) stale closure in `useChat.sendMessage` was rebuilding the function on every message because `messages` was in deps — now uses refs. (2) Tooltip was calling `setState` inside every `mousemove` event (60fps) — now writes directly to DOM. (3) Playlist reorder was firing a PUT on every drag step — now debounced 400ms. Two components memoized with `React.memo`. One missing dep array entry fixed. All 49 client tests pass. Bundle: 105 kB gzip.

## Issues Spotted

1. **`reorderPlaylist` debounce ref captures stale items snapshot**: The `reordered` variable is captured via closure inside `setPlaylists`. If `reorderPlaylist` is called again before the debounce fires, the ref is cleared and reset to the latest snapshot — correct behavior, no bug. But if `reorderedItems` is referenced after the `setPlaylists` call returns `undefined` (unlikely but possible if `playlistId` doesn't match), the sync is silently skipped. Not a functional regression.

2. **`PlayerBar` and `ProgressBar` memoized but their props aren't checked for referential stability**: `React.memo` shallow-compares props. If the parent passes inline object or function literals (e.g., `onSeek={() => ...}`) without `useCallback`, the memo optimization is bypassed. Verify that all callback props to `PlayerBar` in `App.tsx` are memoized.

3. **`useChat` `clearMessages` closes over nothing but `messagesRef` is still a ref** — the `useCallback` dep array is `[]`, which is correct since refs are stable. Confirmed no regression.

4. **Tooltip `visible` state still triggers one re-render on enter/leave** — this is acceptable (the card must mount/unmount from the VDOM). The 60fps setState on mousemove was the actual bottleneck, which is now fixed.

5. **`SearchBar` missing-dep fix is a behavioral change**: Previously `onSearching` was never re-read after mount — any new value was silently ignored. Adding it to deps means if `onSearching` is not memoized in the parent, the effect re-runs on every parent render. Not a bug, but parent callers should ensure `onSearching` is stable.

## Suggestions

- Audit `App.tsx` props passed to `PlayerBar` to confirm all function props are wrapped in `useCallback`. Otherwise the `React.memo` on `PlayerBar` fires on every App render regardless.
- Session 7B (backend audit: N+1 query in playlists, atomicity of `replacePlaylistTracks`, missing DB indexes) is the natural next step.
- Consider adding a `useChat.test.ts` to cover `extractAction` and the ref-based `sendMessage` path — no test currently exercises the rollup of `messagesRef` updates in the success and error paths.
