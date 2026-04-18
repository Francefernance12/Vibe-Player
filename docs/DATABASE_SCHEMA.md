# Database Schema

> Written before any database code is implemented. This is the source of truth.
> All migrations and query helpers must match what is defined here.
> Update this file first whenever the schema changes — never the other way around.

---

## Overview

The database is SQLite, managed via `better-sqlite3`. It is introduced in Phase 3.
Phases 1 and 2 use the filesystem as a lightweight substitute (no DB file).

Database file location: `/server/db/music.db`
Test database: in-memory (`:memory:`) — never touch the real file in tests.

---

## Tables

### `users`

Stores registered user accounts.

```sql
CREATE TABLE users (
  id          TEXT PRIMARY KEY,        -- UUID v4, generated server-side
  email       TEXT NOT NULL UNIQUE,    -- lowercase, validated on input
  password_hash TEXT NOT NULL,         -- bcrypt hash, never store plaintext
  created_at  TEXT NOT NULL            -- ISO 8601 UTC string
);
```

| Column | Type | Notes |
|---|---|---|
| id | TEXT (UUID) | Primary key, generated with `crypto.randomUUID()` |
| email | TEXT | Unique, indexed automatically by UNIQUE constraint |
| password_hash | TEXT | bcrypt with cost factor 12 |
| created_at | TEXT | Stored as ISO string e.g. `2025-01-01T00:00:00.000Z` |

---

### `playlists`

A playlist belongs to one user. A user can have many playlists.

```sql
CREATE TABLE playlists (
  id          TEXT PRIMARY KEY,        -- UUID v4
  user_id     TEXT NOT NULL,           -- FK → users.id
  name        TEXT NOT NULL,           -- user-defined label
  created_at  TEXT NOT NULL,           -- ISO 8601 UTC string
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

| Column | Type | Notes |
|---|---|---|
| id | TEXT (UUID) | Primary key |
| user_id | TEXT | Foreign key to `users`, cascades on user delete |
| name | TEXT | Not unique — users can have multiple playlists with the same name |
| created_at | TEXT | ISO string |

---

### `playlist_tracks`

Tracks within a playlist. Each row is one track entry in one playlist.
Track data is stored as JSON because tracks can come from different sources
(local file, Spotify, YouTube) with different shapes.

```sql
CREATE TABLE playlist_tracks (
  id          TEXT PRIMARY KEY,        -- UUID v4
  playlist_id TEXT NOT NULL,           -- FK → playlists.id
  position    INTEGER NOT NULL,        -- 0-indexed sort order
  source      TEXT NOT NULL,           -- 'local' | 'spotify' | 'youtube'
  track_data  TEXT NOT NULL,           -- JSON blob, shape depends on source
  added_at    TEXT NOT NULL,           -- ISO 8601 UTC string
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
);
```

| Column | Type | Notes |
|---|---|---|
| id | TEXT (UUID) | Primary key |
| playlist_id | TEXT | Foreign key to `playlists`, cascades on playlist delete |
| position | INTEGER | Used to order tracks in the playlist. Re-number on reorder. |
| source | TEXT | Enum-like: `'local'`, `'spotify'`, `'youtube'` |
| track_data | TEXT | JSON string. See track shapes below. |
| added_at | TEXT | ISO string |

---

## Track Data JSON Shapes

These are the expected shapes stored in `playlist_tracks.track_data`.
Parse with `JSON.parse()` server-side when reading.

### Local track
```json
{
  "id": "abc123",
  "filename": "song.mp3",
  "originalName": "My Song.mp3",
  "durationSeconds": 214
}
```

### Spotify track (Phase 2+)
```json
{
  "spotifyId": "4uLU6hMCjMI75M1A2tKUQC",
  "name": "Track Name",
  "artist": "Artist Name",
  "albumArt": "https://...",
  "durationMs": 214000,
  "previewUrl": "https://..."
}
```

### YouTube track (Phase 2+)
```json
{
  "youtubeUrl": "https://youtube.com/watch?v=...",
  "title": "Video Title",
  "channelName": "Channel",
  "thumbnailUrl": "https://..."
}
```

---

## Relationships

```
users ──< playlists ──< playlist_tracks
```

- One user has many playlists
- One playlist has many playlist_tracks
- Deleting a user cascades to their playlists and all tracks within them
- Deleting a playlist cascades to its tracks

---

## Indexes

SQLite creates an index automatically for `UNIQUE` and `PRIMARY KEY` constraints.
Additional indexes to add if query performance becomes a concern:

```sql
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
```

These are not required at project start but are documented here for Phase 4.

---

## Migration Strategy

Migrations live in `/server/db/migrations/` as numbered SQL files:

```
/server/db/migrations/
  001_create_users.sql
  002_create_playlists.sql
  003_create_playlist_tracks.sql
```

A simple migration runner in `/server/db/migrate.ts` reads and executes these
in order on startup if they haven't been run yet. No ORM needed at this scale.

---

## What is NOT in the database (Phase 1–2)

- Audio files — stored on disk in `/server/uploads/` and `/server/samples/`
- Session tokens — stored as signed JWTs in httpOnly cookies, not in DB
- Search results — fetched live from Spotify/YouTube, not cached