import Database from 'better-sqlite3'
import {
  createMemoryDb,
  createUser,
  getUserByEmail,
  getUserById,
  createPlaylist,
  getPlaylistsByUser,
  getPlaylistById,
  deletePlaylist,
  addTrackToPlaylist,
  getTracksByPlaylist,
  removeTrackFromPlaylist,
  replacePlaylistTracks,
} from '../../db'

let db: Database.Database

beforeEach(() => {
  db = createMemoryDb()
})

afterEach(() => {
  db.close()
})

// --- Users ---

test('createUser inserts and returns user', () => {
  const user = createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  expect(user.id).toBe('u1')
  expect(user.email).toBe('a@test.com')
  expect(user.created_at).toBeTruthy()
})

test('getUserByEmail returns user when found', () => {
  createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  const found = getUserByEmail(db, 'a@test.com')
  expect(found?.id).toBe('u1')
})

test('getUserByEmail returns null when not found', () => {
  expect(getUserByEmail(db, 'nobody@test.com')).toBeNull()
})

test('getUserById returns user when found', () => {
  createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  expect(getUserById(db, 'u1')?.email).toBe('a@test.com')
})

test('getUserById returns null when not found', () => {
  expect(getUserById(db, 'missing')).toBeNull()
})

test('duplicate email throws', () => {
  createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  expect(() => createUser(db, { id: 'u2', email: 'a@test.com', password_hash: 'hash' })).toThrow()
})

// --- Playlists ---

test('createPlaylist inserts and returns playlist', () => {
  createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  const pl = createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Favorites' })
  expect(pl.id).toBe('p1')
  expect(pl.name).toBe('Favorites')
})

test('getPlaylistsByUser returns only that user playlists', () => {
  createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  createUser(db, { id: 'u2', email: 'b@test.com', password_hash: 'hash' })
  createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Mine' })
  createPlaylist(db, { id: 'p2', user_id: 'u2', name: 'Theirs' })
  const list = getPlaylistsByUser(db, 'u1')
  expect(list).toHaveLength(1)
  expect(list[0].id).toBe('p1')
})

test('deletePlaylist cascades to tracks', () => {
  createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Test' })
  addTrackToPlaylist(db, { id: 't1', playlist_id: 'p1', position: 0, source: 'local', track_data: '{}' })
  deletePlaylist(db, 'p1')
  expect(getPlaylistById(db, 'p1')).toBeNull()
  expect(getTracksByPlaylist(db, 'p1')).toHaveLength(0)
})

// --- Playlist tracks ---

test('addTrackToPlaylist inserts track', () => {
  createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Test' })
  addTrackToPlaylist(db, { id: 't1', playlist_id: 'p1', position: 0, source: 'local', track_data: '{"filename":"a.mp3"}' })
  const tracks = getTracksByPlaylist(db, 'p1')
  expect(tracks).toHaveLength(1)
  expect(tracks[0].source).toBe('local')
})

test('getTracksByPlaylist returns tracks ordered by position', () => {
  createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Test' })
  addTrackToPlaylist(db, { id: 't2', playlist_id: 'p1', position: 1, source: 'local', track_data: '{}' })
  addTrackToPlaylist(db, { id: 't1', playlist_id: 'p1', position: 0, source: 'deezer', track_data: '{}' })
  const tracks = getTracksByPlaylist(db, 'p1')
  expect(tracks[0].id).toBe('t1')
  expect(tracks[1].id).toBe('t2')
})

test('removeTrackFromPlaylist deletes track', () => {
  createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Test' })
  addTrackToPlaylist(db, { id: 't1', playlist_id: 'p1', position: 0, source: 'local', track_data: '{}' })
  removeTrackFromPlaylist(db, 't1')
  expect(getTracksByPlaylist(db, 'p1')).toHaveLength(0)
})

test('replacePlaylistTracks atomically replaces all tracks', () => {
  createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Test' })
  addTrackToPlaylist(db, { id: 'old', playlist_id: 'p1', position: 0, source: 'local', track_data: '{}' })
  replacePlaylistTracks(db, 'p1', [
    { id: 'new1', playlist_id: 'p1', position: 0, source: 'deezer', track_data: '{"id":"d1"}' },
    { id: 'new2', playlist_id: 'p1', position: 1, source: 'local', track_data: '{"filename":"b.mp3"}' },
  ])
  const tracks = getTracksByPlaylist(db, 'p1')
  expect(tracks).toHaveLength(2)
  expect(tracks[0].id).toBe('new1')
})

test('migrations run idempotently', () => {
  // Running again on the same db should not throw
  const { runMigrations } = require('../../db/migrate')
  expect(() => runMigrations(db)).not.toThrow()
})
