import type { Client } from '@libsql/client'
import {
  createMemoryDb,
  initDb,
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

let db: Client

beforeEach(async () => {
  db = createMemoryDb()
  await initDb(db)
})

afterEach(() => {
  db.close()
})

// --- Users ---

test('createUser inserts and returns user', async () => {
  const user = await createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  expect(user.id).toBe('u1')
  expect(user.email).toBe('a@test.com')
  expect(user.created_at).toBeTruthy()
})

test('getUserByEmail returns user when found', async () => {
  await createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  const found = await getUserByEmail(db, 'a@test.com')
  expect(found?.id).toBe('u1')
})

test('getUserByEmail returns null when not found', async () => {
  expect(await getUserByEmail(db, 'nobody@test.com')).toBeNull()
})

test('getUserById returns user when found', async () => {
  await createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  expect((await getUserById(db, 'u1'))?.email).toBe('a@test.com')
})

test('getUserById returns null when not found', async () => {
  expect(await getUserById(db, 'missing')).toBeNull()
})

test('duplicate email throws', async () => {
  await createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  await expect(createUser(db, { id: 'u2', email: 'a@test.com', password_hash: 'hash' })).rejects.toThrow()
})

// --- Playlists ---

test('createPlaylist inserts and returns playlist', async () => {
  await createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  const pl = await createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Favorites' })
  expect(pl.id).toBe('p1')
  expect(pl.name).toBe('Favorites')
})

test('getPlaylistsByUser returns only that user playlists', async () => {
  await createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  await createUser(db, { id: 'u2', email: 'b@test.com', password_hash: 'hash' })
  await createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Mine' })
  await createPlaylist(db, { id: 'p2', user_id: 'u2', name: 'Theirs' })
  const list = await getPlaylistsByUser(db, 'u1')
  expect(list).toHaveLength(1)
  expect(list[0].id).toBe('p1')
})

test('deletePlaylist cascades to tracks', async () => {
  await createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  await createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Test' })
  await addTrackToPlaylist(db, { id: 't1', playlist_id: 'p1', position: 0, source: 'local', track_data: '{}' })
  await deletePlaylist(db, 'p1')
  expect(await getPlaylistById(db, 'p1')).toBeNull()
  expect(await getTracksByPlaylist(db, 'p1')).toHaveLength(0)
})

// --- Playlist tracks ---

test('addTrackToPlaylist inserts track', async () => {
  await createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  await createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Test' })
  await addTrackToPlaylist(db, { id: 't1', playlist_id: 'p1', position: 0, source: 'local', track_data: '{"filename":"a.mp3"}' })
  const tracks = await getTracksByPlaylist(db, 'p1')
  expect(tracks).toHaveLength(1)
  expect(tracks[0].source).toBe('local')
})

test('getTracksByPlaylist returns tracks ordered by position', async () => {
  await createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  await createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Test' })
  await addTrackToPlaylist(db, { id: 't2', playlist_id: 'p1', position: 1, source: 'local', track_data: '{}' })
  await addTrackToPlaylist(db, { id: 't1', playlist_id: 'p1', position: 0, source: 'deezer', track_data: '{}' })
  const tracks = await getTracksByPlaylist(db, 'p1')
  expect(tracks[0].id).toBe('t1')
  expect(tracks[1].id).toBe('t2')
})

test('removeTrackFromPlaylist deletes track', async () => {
  await createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  await createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Test' })
  await addTrackToPlaylist(db, { id: 't1', playlist_id: 'p1', position: 0, source: 'local', track_data: '{}' })
  await removeTrackFromPlaylist(db, 't1')
  expect(await getTracksByPlaylist(db, 'p1')).toHaveLength(0)
})

test('replacePlaylistTracks atomically replaces all tracks', async () => {
  await createUser(db, { id: 'u1', email: 'a@test.com', password_hash: 'hash' })
  await createPlaylist(db, { id: 'p1', user_id: 'u1', name: 'Test' })
  await addTrackToPlaylist(db, { id: 'old', playlist_id: 'p1', position: 0, source: 'local', track_data: '{}' })
  await replacePlaylistTracks(db, 'p1', [
    { id: 'new1', playlist_id: 'p1', position: 0, source: 'deezer', track_data: '{"id":"d1"}' },
    { id: 'new2', playlist_id: 'p1', position: 1, source: 'local', track_data: '{"filename":"b.mp3"}' },
  ])
  const tracks = await getTracksByPlaylist(db, 'p1')
  expect(tracks).toHaveLength(2)
  expect(tracks[0].id).toBe('new1')
})

test('migrations run idempotently', async () => {
  const { runMigrations } = require('../../db/migrate')
  await expect(runMigrations(db)).resolves.not.toThrow()
})
