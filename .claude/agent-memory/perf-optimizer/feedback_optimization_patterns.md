---
name: recurring frontend bottleneck patterns
description: Common performance anti-patterns found in this codebase across audit sessions
type: feedback
---

Recurring patterns to watch for in client/src:

1. useCallback deps include state that is read but could be replaced by a ref — causes the callback to be recreated on every state change (found in useChat.ts sendMessage).

2. mousemove handlers calling setState — fires React re-renders at 60+ fps. Replace with ref + direct DOM style mutation for positional/transient values (found in Tooltip.tsx).

3. API sync called inside setPlaylists updater without debounce — causes one network request per drag event (found in PlaylistContext reorderPlaylist).

4. Missing deps in useEffect with debounced fetch — stale callback reference silently used (found in SearchBar.tsx onSearching).

**Why:** These were all confirmed by the session-7a audit as real production issues, not theoretical.

**How to apply:** When reviewing any new hook or component in client/src, check for these four patterns before suggesting other optimizations.
