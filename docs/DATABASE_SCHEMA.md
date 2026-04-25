# Database Schema

> Written before any database code is implemented. This is the source of truth.
> All migrations and query helpers must match what is defined here.
> Update this file first whenever the schema changes — never the other way around.

---

## Overview

The database is a **Turso-hosted libSQL instance**, accessed via the `@libsql/client` npm package. libSQL is fully SQL-compatible with SQLite — all migrations and queries use standard SQLite syntax, but the connection goes to a remote server rather than a local file.

**This was not always the case.** Phase 3 originally used `better-sqlite3` writing to a local SQLite file at `/server/db/music.db`. That worked locally but broke on Vercel because each serverless invocation gets a fresh container with an empty `/tmp` — a user registered in one request could not log in on the next. Phase 3B (Session 5A) replaced the driver with `@libsql/client` and moved storage to Turso with no SQL changes.

| Environment | Connection |
|---|---|
| Production (Vercel) | `libsql://…turso.io` via `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` env vars |
| Local development | Falls back to `file:./music.db` (local SQLite file) if `TURSO_URL` is not set |
| Tests | `createClient({ url: ':memory:' })` — isolated in-memory DB, never touches production |

---

## Tables

### `users`

Stores registered user accounts.

```sql
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL
);
```

| Column | Type | Notes |
|---|---|---|
| id | TEXT (UUID) | Primary key, generated with `crypto.randomUUID()` server-side |
| email | TEXT | Unique; lowercase; validated on input |
| password_hash | TEXT | bcrypt hash, cost factor 12; plaintext is never stored |
| created_at | TEXT | ISO 8601 UTC string e.g. `2025-01-01T00:00:00.000Z` |

---

### `playlists`

A playlist belongs to one user. A user can have many playlists.

```sql
CREATE TABLE IF NOT EXISTS playlists (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

| Column | Type | Notes |
|---|---|---|
| id | TEXT (UUID) | Primary key |
| user_id | TEXT | Foreign key to `users`; cascades on user delete |
| name | TEXT | Not unique — a user can have multiple playlists with the same name |
| created_at | TEXT | ISO string |

---

### `playlist_tracks`

Tracks within a playlist. Each row is one track entry in one playlist.
Track data is stored as a JSON blob because tracks can come from different sources
(local file, Deezer) with different shapes.

```sql
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id          TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL,
  position    INTEGER NOT NULL,
  source      TEXT NOT NULL,
  track_data  TEXT NOT NULL,
  added_at    TEXT NOT NULL,
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
);
```

| Column | Type | Notes |
|---|---|---|
| id | TEXT (UUID) | Primary key |
| playlist_id | TEXT | Foreign key to `playlists`; cascades on playlist delete |
| position | INTEGER | 0-indexed sort order; re-numbered on reorder |
| source | TEXT | Enum-like: `'local'` or `'deezer'` |
| track_data | TEXT | JSON string — shape depends on source (see below) |
| added_at | TEXT | ISO string |

---

### `uploaded_tracks`

Metadata for audio files uploaded by users. The actual audio is stored on Vercel Blob CDN; this table stores the permanent blob URL and file info.

```sql
CREATE TABLE IF NOT EXISTS uploaded_tracks (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  filename      TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type     TEXT NOT NULL,
  size          INTEGER NOT NULL,
  blob_url      TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

| Column | Type | Notes |
|---|---|---|
| id | TEXT (UUID) | Primary key |
| user_id | TEXT | Foreign key to `users`; cascades on user delete |
| filename | TEXT | Unique storage name (UUID-based, e.g. `abc123.mp3`) |
| original_name | TEXT | User-facing display name e.g. `My Song.mp3` |
| mime_type | TEXT | e.g. `audio/mpeg` |
| size | INTEGER | File size in bytes; used for quota calculations |
| blob_url | TEXT | Permanent public CDN URL returned by `@vercel/blob.put()` |
| created_at | TEXT | ISO string |

---

## Track Data JSON Shapes

These are the expected shapes stored in `playlist_tracks.track_data`.
Parse with `JSON.parse()` server-side when reading.

### Local / uploaded track
```json
{
  "id": "abc123",
  "filename": "abc123.mp3",
  "originalName": "My Song.mp3",
  "durationSeconds": 214
}
```

### Deezer track
```json
{
  "id": "1234567890",
  "title": "Track Name",
  "artist": "Artist Name",
  "albumArt": "https://...",
  "previewUrl": "https://cdn-preview.deezer.com/...",
  "durationMs": 30000
}
```

---

## Relationships

```
users ──< playlists ──< playlist_tracks
users ──< uploaded_tracks
```

- One user has many playlists and many uploaded tracks
- One playlist has many playlist_tracks
- Deleting a user cascades to their playlists, playlist_tracks, and uploaded_tracks
- Deleting a playlist cascades to its playlist_tracks

---

## Indexes

libSQL (Turso) creates an index automatically for `UNIQUE` and `PRIMARY KEY` constraints.
Additional indexes to add if query performance becomes a concern:

```sql
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX idx_uploaded_tracks_user_id ON uploaded_tracks(user_id);
```

Not required at current scale but documented here for future reference.

---

## Migration Files

Migrations live in `/server/db/migrations/` as numbered SQL files, executed in order by `server/db/migrate.ts` on startup. The runner is idempotent — it tracks applied migrations in a `_migrations` table.

```
server/db/migrations/
  001_create_users.sql
  002_create_playlists.sql
  003_create_playlist_tracks.sql
  004_create_uploaded_tracks.sql
```

---

## What Is NOT in the Database

- **Audio file bytes** — stored on Vercel Blob CDN (uploaded tracks) or bundled in `server/samples/` (sample tracks)
- **Session tokens** — stored as signed JWTs in httpOnly cookies, not in the DB
- **Search results** — fetched live from Deezer, not cached
- **Deezer library tracks** — stored in browser `localStorage` under `deezer-library-tracks` (client-only persistence)
