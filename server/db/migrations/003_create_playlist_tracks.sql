CREATE TABLE IF NOT EXISTS playlist_tracks (
  id          TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL,
  position    INTEGER NOT NULL,
  source      TEXT NOT NULL,
  track_data  TEXT NOT NULL,
  added_at    TEXT NOT NULL,
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
);
