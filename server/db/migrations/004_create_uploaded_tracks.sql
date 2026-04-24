CREATE TABLE IF NOT EXISTS uploaded_tracks (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size         INTEGER NOT NULL,
  blob_url     TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
