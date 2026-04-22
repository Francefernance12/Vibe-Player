# Code Review

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

