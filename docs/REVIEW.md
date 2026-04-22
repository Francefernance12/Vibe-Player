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
