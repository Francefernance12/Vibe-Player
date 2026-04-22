import Database from 'better-sqlite3'
import path from 'path'
import { runMigrations } from './migrate'
import type { DbTrackSource } from '../../shared/types'

// --- Types ---

export interface DbUser {
  id: string
  email: string
  password_hash: string
  created_at: string
}

export interface DbPlaylist {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface DbPlaylistTrack {
  id: string
  playlist_id: string
  position: number
  source: DbTrackSource
  track_data: string  // JSON string
  added_at: string
}

// --- Singleton ---

let _db: Database.Database | null = null

function resolveDbPath(): string {
  // Vercel serverless: filesystem is read-only except /tmp
  if (process.env.VERCEL) return '/tmp/music.db'
  // Works for both ts-node (server/db/) and tsc output (server/dist/db/)
  return path.join(__dirname, '..', 'music.db')
}

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(resolveDbPath())
  // Must be set on every new connection (not just during migrations)
  _db.pragma('foreign_keys = ON')
  runMigrations(_db)
  return _db
}

/** For tests: create an isolated in-memory database */
export function createMemoryDb(): Database.Database {
  const db = new Database(':memory:')
  runMigrations(db)
  return db
}

// --- Users ---

export function createUser(db: Database.Database, user: Omit<DbUser, 'created_at'>): DbUser {
  const created_at = new Date().toISOString()
  db.prepare(
    'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)'
  ).run(user.id, user.email, user.password_hash, created_at)
  return { ...user, created_at }
}

export function getUserByEmail(db: Database.Database, email: string): DbUser | null {
  return (db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUser | undefined) ?? null
}

export function getUserById(db: Database.Database, id: string): DbUser | null {
  return (db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined) ?? null
}

// --- Playlists ---

export function createPlaylist(db: Database.Database, playlist: Omit<DbPlaylist, 'created_at'>): DbPlaylist {
  const created_at = new Date().toISOString()
  db.prepare(
    'INSERT INTO playlists (id, user_id, name, created_at) VALUES (?, ?, ?, ?)'
  ).run(playlist.id, playlist.user_id, playlist.name, created_at)
  return { ...playlist, created_at }
}

export function getPlaylistsByUser(db: Database.Database, userId: string): DbPlaylist[] {
  return db.prepare('SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at ASC').all(userId) as DbPlaylist[]
}

export function getPlaylistById(db: Database.Database, id: string): DbPlaylist | null {
  return (db.prepare('SELECT * FROM playlists WHERE id = ?').get(id) as DbPlaylist | undefined) ?? null
}

export function deletePlaylist(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM playlists WHERE id = ?').run(id)
}

// --- Playlist tracks ---

export function getTracksByPlaylist(db: Database.Database, playlistId: string): DbPlaylistTrack[] {
  return db.prepare(
    'SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC'
  ).all(playlistId) as DbPlaylistTrack[]
}

export function getPlaylistTrackById(db: Database.Database, id: string): DbPlaylistTrack | null {
  return (db.prepare('SELECT * FROM playlist_tracks WHERE id = ?').get(id) as DbPlaylistTrack | undefined) ?? null
}

export function addTrackToPlaylist(
  db: Database.Database,
  track: Omit<DbPlaylistTrack, 'added_at'>
): DbPlaylistTrack {
  const added_at = new Date().toISOString()
  db.prepare(
    'INSERT INTO playlist_tracks (id, playlist_id, position, source, track_data, added_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(track.id, track.playlist_id, track.position, track.source, track.track_data, added_at)
  return { ...track, added_at }
}

export function removeTrackFromPlaylist(db: Database.Database, trackId: string): void {
  db.prepare('DELETE FROM playlist_tracks WHERE id = ?').run(trackId)
}

/** Replace all tracks for a playlist (used for full reorder/sync). Runs in a transaction. */
export function replacePlaylistTracks(
  db: Database.Database,
  playlistId: string,
  tracks: Omit<DbPlaylistTrack, 'added_at'>[]
): void {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ?').run(playlistId)
    const insert = db.prepare(
      'INSERT INTO playlist_tracks (id, playlist_id, position, source, track_data, added_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    const now = new Date().toISOString()
    for (const t of tracks) {
      insert.run(t.id, t.playlist_id, t.position, t.source, t.track_data, now)
    }
  })
  tx()
}
