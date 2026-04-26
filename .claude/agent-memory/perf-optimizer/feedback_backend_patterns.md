---
name: recurring backend bottleneck patterns (session 7B)
description: Backend performance and correctness patterns confirmed in server/src/routes/ and server/db/ during session 7B
type: feedback
---

Recurring patterns to watch for in server/:

1. N+1 queries in route handlers that call a list-then-per-item DB helper pattern.
   Found in GET /api/playlists: getPlaylistsByUser + getTracksByPlaylist per playlist.
   Fix: single LEFT JOIN helper (getPlaylistsWithTracks). Each Turso round-trip is
   50-200ms in production — N+1 hurts more here than in local SQLite.

2. Missing indexes on FK and user_id filter columns.
   Found: playlists(user_id), playlist_tracks(playlist_id), uploaded_tracks(user_id)
   all lacked indexes. Always check every WHERE clause for an index after adding a table.

3. @libsql/client batch() atomicity: db.batch(stmts, 'write') IS atomic on both the
   Turso remote client and the local sqlite3 client (the driver wraps it in a transaction
   automatically). Do NOT add explicit BEGIN/COMMIT inside the batch array — the sqlite3
   driver throws "cannot start a transaction within a transaction".

4. Migration runner db.execute(sql) only runs one statement — use db.executeMultiple(sql)
   for migration files that contain more than one SQL statement (e.g. multi-index files).
   executeMultiple is available on both sqlite3 and hrana/http backends in @libsql/client 0.17+.

5. Vercel serverless + MemoryStore rate limiting: express-rate-limit default MemoryStore
   resets on cold start. The chat rate limit is per-process-instance, not globally enforced.
   Document this in code. For a hard global cap, use Redis/Upstash store.

**Why:** All five confirmed in session-7B audit and fixed. Tests validated correctness.

**How to apply:** Run through this list when auditing any new backend route or DB helper.
