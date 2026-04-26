---
name: Session-7C code quality findings
description: Dead code, type consolidation, accessibility, and error handling patterns found in session-7c quality pass
type: project
---

Code quality pass completed 2026-04-25. Key findings:

**Dead code patterns found:**
- `UPLOADS_DIR` in `server/src/tracks.ts` — lingered after Phase 5 Vercel Blob migration; the variable was declared but never read.
- `getPlaylistTrackById` in `server/db/index.ts` — exported but never imported by any route or test; superseded by `getPlaylistsWithTracks` JOIN query.
- `PlayerBarProps` (exported interface) in `PlayerBar.tsx` — exported but no consumer outside the file; renamed to `Props` (module-private).
- `PlayerState` and `PlayerControls` (exported interfaces) in `usePlayer.ts` — no import site; removed. Return type is now inferred.
- `SearchTrack` interface in `server/src/routes/search.ts` — local duplicate; consolidated into `shared/types.ts`.

**Type consolidation pattern:**
- When no path alias exists in `tsconfig.app.json`, keep `client/src/types.ts` as a thin re-export barrel rather than updating 14 import sites with deep relative paths. Barrel approach keeps diffs small and import sites unchanged.
- `shared/types.ts` is the canonical home for any type shared between client and server.

**Error handling gap:**
- `handleDeleteTrack` in `App.tsx` awaited a DELETE fetch with no try/catch. On failure the track was optimistically removed from UI state despite still existing on the server. Fixed: added try/catch, bail on failure, only remove from state on success.
- Pattern to watch: `async` callbacks that `await fetch(...)` for destructive operations (DELETE, state-mutating POST) must check `res.ok` and bail early.

**Accessibility gaps:**
- Mobile `⋮` menu button needs `aria-haspopup="menu"` and `aria-expanded={boolean}` — not just `aria-label`.
- Filter text inputs with only a `placeholder` need `aria-label` — placeholder is not a substitute for a label.
- Icon-only buttons (e.g., `×` clear button) need `aria-label`.

**Why:** Identified during session-7c code quality pass; all fixes verified against full 103-test suite.
**How to apply:** Check these patterns in future component and route additions.
