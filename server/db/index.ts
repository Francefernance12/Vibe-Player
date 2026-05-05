import { createClient, Client, Row } from '@libsql/client'
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

// --- Row converters ---

function toDbUser(r: Row): DbUser {
  return { id: String(r.id), email: String(r.email), password_hash: String(r.password_hash), created_at: String(r.created_at) }
}

function toDbPlaylist(r: Row): DbPlaylist {
  return { id: String(r.id), user_id: String(r.user_id), name: String(r.name), created_at: String(r.created_at) }
}

function toDbPlaylistTrack(r: Row): DbPlaylistTrack {
  return {
    id: String(r.id),
    playlist_id: String(r.playlist_id),
    position: Number(r.position),
    source: String(r.source) as DbTrackSource,
    track_data: String(r.track_data),
    added_at: String(r.added_at),
  }
}

// --- Singleton ---

let _db: Client | null = null

function resolveDbUrl(): string {
  if (process.env.TURSO_URL) return process.env.TURSO_URL
  return 'file:./music.db'
}

export function getDb(): Client {
  if (_db) return _db
  _db = createClient({ url: resolveDbUrl(), authToken: process.env.TURSO_AUTH_TOKEN })
  return _db
}

/** Run PRAGMA + migrations. Call once at server startup. */
export async function initDb(db?: Client): Promise<void> {
  const client = db ?? getDb()
  await client.execute('PRAGMA foreign_keys = ON')
  await runMigrations(client)
}

/** For tests: isolated in-memory database. Call initDb(db) before use. */
export function createMemoryDb(): Client {
  return createClient({ url: ':memory:' })
}

// --- Users ---

export async function createUser(db: Client, user: Omit<DbUser, 'created_at'>): Promise<DbUser> {
  const created_at = new Date().toISOString()
  await db.execute({
    sql: 'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
    args: [user.id, user.email, user.password_hash, created_at],
  })
  return { ...user, created_at }
}

export async function getUserByEmail(db: Client, email: string): Promise<DbUser | null> {
  const { rows } = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] })
  return rows.length ? toDbUser(rows[0]) : null
}

export async function getUserById(db: Client, id: string): Promise<DbUser | null> {
  const { rows } = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] })
  return rows.length ? toDbUser(rows[0]) : null
}

// --- Playlists ---

export async function createPlaylist(db: Client, playlist: Omit<DbPlaylist, 'created_at'>): Promise<DbPlaylist> {
  const created_at = new Date().toISOString()
  await db.execute({
    sql: 'INSERT INTO playlists (id, user_id, name, created_at) VALUES (?, ?, ?, ?)',
    args: [playlist.id, playlist.user_id, playlist.name, created_at],
  })
  return { ...playlist, created_at }
}

export async function getPlaylistsByUser(db: Client, userId: string): Promise<DbPlaylist[]> {
  const { rows } = await db.execute({
    sql: 'SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at ASC',
    args: [userId],
  })
  return rows.map(toDbPlaylist)
}

export async function getPlaylistById(db: Client, id: string): Promise<DbPlaylist | null> {
  const { rows } = await db.execute({ sql: 'SELECT * FROM playlists WHERE id = ?', args: [id] })
  return rows.length ? toDbPlaylist(rows[0]) : null
}

export async function deletePlaylist(db: Client, id: string): Promise<void> {
  await db.execute({ sql: 'DELETE FROM playlists WHERE id = ?', args: [id] })
}

export interface PlaylistWithTracks {
  id: string
  name: string
  items: unknown[]
}

/**
 * Fetch all playlists with their tracks for a user in a single JOIN query,
 * eliminating the N+1 pattern of fetching tracks per playlist separately.
 */
export async function getPlaylistsWithTracks(db: Client, userId: string): Promise<PlaylistWithTracks[]> {
  const { rows } = await db.execute({
    sql: `SELECT p.id AS playlist_id, p.name, p.created_at,
                 pt.track_data, pt.position
          FROM playlists p
          LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
          WHERE p.user_id = ?
          ORDER BY p.created_at ASC, pt.position ASC`,
    args: [userId],
  })

  // Reconstruct grouped shape from flat JOIN rows
  const map = new Map<string, PlaylistWithTracks>()
  for (const r of rows) {
    const pid = String(r.playlist_id)
    if (!map.has(pid)) {
      map.set(pid, { id: pid, name: String(r.name), items: [] })
    }
    if (r.track_data !== null) {
      map.get(pid)!.items.push(JSON.parse(String(r.track_data)))
    }
  }
  return Array.from(map.values())
}

// --- Uploaded tracks ---

export interface DbUploadedTrack {
  id: string
  user_id: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  blob_url: string
  created_at: string
}

function toDbUploadedTrack(r: Row): DbUploadedTrack {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    filename: String(r.filename),
    original_name: String(r.original_name),
    mime_type: String(r.mime_type),
    size: Number(r.size),
    blob_url: String(r.blob_url),
    created_at: String(r.created_at),
  }
}

export async function createUploadedTrack(db: Client, track: Omit<DbUploadedTrack, 'created_at'>): Promise<DbUploadedTrack> {
  const created_at = new Date().toISOString()
  await db.execute({
    sql: 'INSERT INTO uploaded_tracks (id, user_id, filename, original_name, mime_type, size, blob_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [track.id, track.user_id, track.filename, track.original_name, track.mime_type, track.size, track.blob_url, created_at],
  })
  return { ...track, created_at }
}

export async function getUploadedTracksByUser(db: Client, userId: string): Promise<DbUploadedTrack[]> {
  const { rows } = await db.execute({
    sql: 'SELECT * FROM uploaded_tracks WHERE user_id = ? ORDER BY created_at ASC',
    args: [userId],
  })
  return rows.map(toDbUploadedTrack)
}

export async function getUploadedTrackById(db: Client, id: string): Promise<DbUploadedTrack | null> {
  const { rows } = await db.execute({ sql: 'SELECT * FROM uploaded_tracks WHERE id = ?', args: [id] })
  return rows.length ? toDbUploadedTrack(rows[0]) : null
}

export async function deleteUploadedTrack(db: Client, id: string): Promise<void> {
  await db.execute({ sql: 'DELETE FROM uploaded_tracks WHERE id = ?', args: [id] })
}

export async function getUserUploadedBytes(db: Client, userId: string): Promise<number> {
  const { rows } = await db.execute({
    sql: 'SELECT COALESCE(SUM(size), 0) AS total FROM uploaded_tracks WHERE user_id = ?',
    args: [userId],
  })
  return Number(rows[0].total)
}

// --- Playlist tracks ---

export async function getTracksByPlaylist(db: Client, playlistId: string): Promise<DbPlaylistTrack[]> {
  const { rows } = await db.execute({
    sql: 'SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC',
    args: [playlistId],
  })
  return rows.map(toDbPlaylistTrack)
}

export async function addTrackToPlaylist(db: Client, track: Omit<DbPlaylistTrack, 'added_at'>): Promise<DbPlaylistTrack> {
  const added_at = new Date().toISOString()
  await db.execute({
    sql: 'INSERT INTO playlist_tracks (id, playlist_id, position, source, track_data, added_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [track.id, track.playlist_id, track.position, track.source, track.track_data, added_at],
  })
  return { ...track, added_at }
}

export async function removeTrackFromPlaylist(db: Client, trackId: string): Promise<void> {
  await db.execute({ sql: 'DELETE FROM playlist_tracks WHERE id = ?', args: [trackId] })
}

/**
 * Replace all tracks for a playlist atomically.
 *
 * db.batch() with mode 'write' is atomic on both the Turso remote client
 * (executed as a server-side batch transaction) and the local sqlite3 client
 * (wrapped automatically in a transaction by the driver). Do NOT add explicit
 * BEGIN/COMMIT — the driver already wraps the batch, and a nested BEGIN throws.
 */
export async function replacePlaylistTracks(
  db: Client,
  playlistId: string,
  tracks: Omit<DbPlaylistTrack, 'added_at'>[]
): Promise<void> {
  const now = new Date().toISOString()
  await db.batch([
    { sql: 'DELETE FROM playlist_tracks WHERE playlist_id = ?', args: [playlistId] },
    ...tracks.map(t => ({
      sql: 'INSERT INTO playlist_tracks (id, playlist_id, position, source, track_data, added_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [t.id, t.playlist_id, t.position, t.source, t.track_data, now],
    })),
  ], 'write')
}
