# Codebase Guide for New Developers

This document walks you through how Vibe Player is structured, how its major pieces connect, and the non-obvious things you need to know before making changes. Read this before diving into the code.

---

## Table of Contents

1. [Project at a Glance](#1-project-at-a-glance)
2. [Repo Layout](#2-repo-layout)
3. [How to Run It Locally](#3-how-to-run-it-locally)
4. [The Backend (Express)](#4-the-backend-express)
5. [The Database (Turso / libSQL)](#5-the-database-turso--libsql)
6. [The Frontend (React)](#6-the-frontend-react)
7. [Audio Playback — The Tricky Part](#7-audio-playback--the-tricky-part)
8. [Authentication Flow](#8-authentication-flow)
9. [Playlists — How State Stays in Sync](#9-playlists--how-state-stays-in-sync)
10. [The AI Chat Assistant](#10-the-ai-chat-assistant)
11. [Testing](#11-testing)
12. [Common Gotchas](#12-common-gotchas)

---

## 1. Project at a Glance

Vibe Player is a web-based music player. Users can:
- Play bundled sample tracks or search Deezer for 30-second previews
- Upload their own MP3s (stored persistently on Vercel Blob CDN)
- Organize tracks into playlists
- Control playback via an AI chat assistant

The frontend is a React SPA (single-page app). The backend is an Express API. Both are deployed on Vercel — the frontend as static files, the backend as a serverless function. The database is hosted on Turso (remote SQLite).

---

## 2. Repo Layout

```
/
├── client/          ← React frontend (Vite + TypeScript)
├── server/          ← Express backend (TypeScript)
│   ├── db/          ← Database helpers and SQL migrations
│   ├── samples/     ← Bundled royalty-free MP3s
│   └── src/         ← Routes, middleware, app entry
├── shared/          ← TypeScript types shared by both sides
├── api/             ← Vercel serverless entry point
└── docs/            ← Architecture, decisions, this file
```

There is a root `package.json` with `npm run dev` (starts both sides together) and `npm test` (runs both test suites). Each sub-project (`client/` and `server/`) has its own `package.json` with its own dependencies.

---

## 3. How to Run It Locally

### Install everything

```bash
npm install
npm install --prefix client
npm install --prefix server
```

### Create a `.env` file in the project root

```
PORT=3001
TURSO_DATABASE_URL=libsql://<your-db>.turso.io
TURSO_AUTH_TOKEN=<your-token>
JWT_SECRET=any-long-random-string
GROQ_API_KEY=<your-groq-key>
BLOB_READ_WRITE_TOKEN=<your-blob-token>   # optional locally
```

See [README.md](./README.md) for how to get each value.

### Start the dev server

```bash
npm run dev
```

This runs both `npm run dev:server` (Express on port 3001) and `npm run dev:client` (Vite on port 5173) in parallel via `concurrently`. Vite is configured to proxy all `/api/*` requests to `localhost:3001`, so the frontend talks to your local backend.

---

## 4. The Backend (Express)

### Entry points

There are two entry points depending on environment:

- **`server/src/index.ts`** — used for local development. Calls `initDb()` (runs migrations), then starts `app.listen(PORT)`.
- **`api/index.ts`** — used by Vercel. Exports the Express app as a serverless function. `initDb()` is called once at module load and stored as a promise that the handler awaits.

Both import the same `app` from `server/src/app.ts`.

### `server/src/app.ts`

This is where the Express app is assembled. It registers:
1. Global middleware: `cors`, `express.json()`, `cookieParser`
2. All routers: `/api/health`, `/api/tracks`, `/api/search`, `/api/auth`, `/api/playlists`, `/api/chat`, `/api/user/quota`
3. A 4-argument error handler at the bottom (catches multer size errors and all other thrown errors)

```
src/routes/
  health.ts     ← GET /api/health
  tracks.ts     ← GET /tracks, POST /upload, DELETE /:id, GET /:filename/stream
  search.ts     ← GET /search?q= (Deezer proxy)
  auth.ts       ← POST /register, /login, /logout, GET /me
  playlists.ts  ← CRUD + PUT /:id/tracks
  quota.ts      ← GET /api/user/quota
  chat.ts       ← POST /api/chat (Groq)
```

### Auth middleware

`server/src/middleware/auth.ts` exports `authMiddleware`. It reads the `token` cookie, verifies the JWT against `JWT_SECRET`, and attaches `req.user = { userId, email }`. Routes that need auth call `router.use(authMiddleware)` at the top of their file. Routes that are optionally auth-aware (like `GET /api/tracks`) call `authMiddleware` manually and check `req.user` without failing if it's absent.

### Adding a new route

1. Create `server/src/routes/myroute.ts`
2. Register it in `app.ts`: `app.use('/api/myroute', myrouteRouter)`
3. Add a Supertest test in `server/src/__tests__/myroute.test.ts`

---

## 5. The Database (Turso / libSQL)

### What it is

Turso is a hosted SQLite service. The SQL dialect is identical to SQLite. The driver (`@libsql/client`) is async (Promise-based), unlike the original `better-sqlite3` which was synchronous.

### `server/db/index.ts` — the only place DB calls live

All SQL is written in this file. Route handlers never import `createClient` or write raw SQL — they import named helper functions like `createUser`, `getPlaylistsByUser`, or `replacePlaylistTracks`.

**Pattern every helper follows:**

```typescript
export async function createUser(db: Client, user: Omit<DbUser, 'created_at'>): Promise<DbUser> {
  const created_at = new Date().toISOString()
  await db.execute({
    sql: 'INSERT INTO users (id, email, ...) VALUES (?, ?, ...)',
    args: [user.id, user.email, ...],
  })
  return { ...user, created_at }
}
```

Always use parameterized queries (`?` placeholders with `args`). Never interpolate values into SQL strings — that's a SQL injection vulnerability.

### `getDb()` vs `initDb()`

- `getDb()` — returns the singleton `Client` instance. Cheap to call. Creates the client on first call.
- `initDb(db?)` — async. Runs `PRAGMA foreign_keys = ON` and all pending migrations. Must be called once at startup before any requests.
- `createMemoryDb()` — used in tests. Returns a fresh in-memory client. Call `await initDb(db)` after it.

### Migrations

SQL files in `server/db/migrations/` are numbered. The runner (`server/db/migrate.ts`) reads them in order and runs any that haven't been recorded in the `_migrations` table. To add a table: create `005_create_whatever.sql`, write the `CREATE TABLE IF NOT EXISTS` statement, and restart the server. The migration runs automatically.

### Tables summary

| Table | Purpose |
|---|---|
| `users` | Registered accounts |
| `playlists` | Named playlists per user |
| `playlist_tracks` | Tracks within a playlist (JSON blob per row) |
| `uploaded_tracks` | Metadata for user-uploaded files (blob URL stored here) |

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for full column definitions and relationships.

---

## 6. The Frontend (React)

### Entry point

`client/src/main.tsx` renders `<App />` into `#root`. `App.tsx` is the root component — it owns the top-level state and wires everything together.

### Context providers

Two React contexts wrap the app:

```
<AuthProvider>              ← manages user session
  <AuthGate>                ← shows login/register if not logged in
    <PlaylistProvider>      ← manages all playlist state
      [player UI]
    </PlaylistProvider>
  </AuthGate>
</AuthProvider>
```

- **`AuthContext`** (`client/src/contexts/AuthContext.tsx`) — exposes `user`, `loading`, `login`, `register`, `logout`. Calls `GET /api/auth/me` on mount to restore session from cookie.
- **`PlaylistContext`** (`client/src/contexts/PlaylistContext.tsx`) — exposes `playlists`, `createPlaylist`, `addLocal`, `addDeezer`, `remove`, `reorder`, `isInPlaylist`, `removeTrackFromAllPlaylists`. Syncs to the API when logged in, falls back to `localStorage` when not.

### How to use a context in a component

```typescript
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, logout } = useAuth()
  // ...
}
```

Both contexts throw an error if used outside their provider, so the hook usage is always safe.

### Component overview

| Component | What it does |
|---|---|
| `PlayerBar` | Fixed bottom bar. Always visible. Contains controls, progress, shuffle, loop, volume |
| `PlayerControls` | Prev / play / pause / next buttons |
| `ProgressBar` | Seek bar. Uses `useRef` + `requestAnimationFrame` — does NOT call `setState` on every tick |
| `TrackList` | The library list. Desktop shows `+` and trash buttons; mobile shows `⋮` menu |
| `SearchBar` + `SearchResults` | Deezer search. Results are an absolute-positioned overlay |
| `PlaylistPanel` | Accordion per playlist. Drag-and-drop reorder via `@dnd-kit`. Filter/sort per playlist |
| `FileUpload` | Drag-and-drop upload. Calls `POST /api/tracks/upload` |
| `StorageBar` | Quota progress bar. Shows used / 100MB |
| `Tooltip` | Mouse-following info card on desktop hover. Disabled on touch devices |
| `ChatBubble` + `ChatWindow` | FAB button + slide-in chat panel for the AI assistant |
| `LoginPage` + `RegisterPage` | Auth forms rendered by `AuthGate` |
| `PricingPage` | Mockup-only tier page (portal overlay) |

### The `Track` type

Most of the app passes `Track` objects around. The shape is defined in `client/src/types.ts`:

```typescript
interface Track {
  id: string
  filename: string         // used as the key for stream URL + deduplication
  originalName: string     // display name
  mimeType: string
  size: number             // bytes
  source: 'sample' | 'upload' | 'deezer'
  externalUrl?: string     // set for Deezer previews and Blob uploads
}
```

When `externalUrl` is set, the player uses it directly instead of calling `/api/tracks/:filename/stream`.

---

## 7. Audio Playback — The Tricky Part

Audio is handled by Howler.js, wrapped in the `usePlayer` hook (`client/src/hooks/usePlayer.ts`).

### Why `useRef` instead of `useState` for playback state

Howl's `onend` callback is defined when the `Howl` object is created (`new Howl({ …, onend: () => { … } })`). That callback captures variables in a closure. If those variables were `useState` values, the closure would always see the values from the render cycle when `new Howl(…)` was called — i.e., stale state.

The solution: store shuffle mode, loop mode, and the current queue in `useRef` values. Refs are mutable and live outside the render cycle, so the `onend` closure always reads current values. A parallel `useState` mirrors each ref solely so React re-renders the UI when they change.

```
shuffleRef.current = true   ← the closure reads this
setShuffle(true)            ← this triggers a re-render
```

### How `play(track, context?)` works

```typescript
player.play(track)                   // uses existing queue (or full library as fallback)
player.play(track, playlistTracks)   // sets queue to that playlist's tracks
player.play(track, visibleTracks)    // sets queue to filtered library view
```

On every `play()` call:
1. If `context` is provided, `queueRef.current` is updated. Otherwise the existing queue is kept (or falls back to `libraryTracks` on first play).
2. Any existing Howl is unloaded.
3. A new `Howl` is created and started.

### `onend` auto-advance logic

When a track ends:
- `loopMode === 'track'` → seek to 0, play again
- `shuffle === true` → pick a random track from the queue (excluding current)
- `loopMode === 'queue'` → advance; wrap from last to first
- `loopMode === 'none'` → advance; stop at end

---

## 8. Authentication Flow

### Registration

1. User fills in `RegisterPage` and submits
2. `AuthContext.register()` calls `POST /api/auth/register`
3. Server hashes the password with bcrypt, inserts a `users` row, auto-creates a "Favorites" playlist, signs a JWT, and sets an `httpOnly` cookie
4. `AuthContext.user` is set → `AuthGate` renders the player

### Login

Same flow but calls `POST /api/auth/login`. Server looks up the user by email, compares the bcrypt hash, and issues the cookie.

### Session persistence

On every page load, `AuthContext` calls `GET /api/auth/me`. The browser automatically sends the `httpOnly` cookie. The server verifies the JWT and returns the user object. This is how the logged-in state survives a page refresh.

### Where auth is enforced

- Routes that require auth: `app.use(authMiddleware)` at the top of the router
- Routes that are auth-aware: `authMiddleware` is called inline and the route checks `req.user` without hard-failing
- JWTs expire after 7 days. Logout clears the cookie but does not invalidate the token server-side (accepted trade-off at this scale)

---

## 9. Playlists — How State Stays in Sync

### Client state

`PlaylistContext` holds `playlists: Playlist[]` in `useState`. Every mutation (add, remove, reorder) updates this state immediately (optimistic update) and then calls the API in the background.

### API sync

Every mutation fires `PUT /api/playlists/:id/tracks` with the full updated track list. The server does a DELETE + batch INSERT atomically via `replacePlaylistTracks`. This "full replace" approach is simple — no diff, no conflict resolution.

### localStorage fallback

When not logged in, mutations write to `localStorage` under `playlists:v2`. On login, `PlaylistContext` switches from localStorage to API mode and loads the server's playlists.

### Cascade delete

When a track is deleted from the library (`handleDeleteTrack` in `App.tsx`), `PlaylistContext.removeTrackFromAllPlaylists(trackId)` is called. This filters the track out of every playlist and syncs each affected playlist to the API.

---

## 10. The AI Chat Assistant

### Components

- `ChatBubble.tsx` — the fixed orange FAB (floating action button) in the bottom-right corner. Clicking it toggles the chat panel.
- `ChatWindow.tsx` — the slide-in panel. Renders message history and the input box.
- `useChat.ts` — the hook that manages message state, calls the API, and parses actions from the response.

### How it works

1. User types a message and hits Enter
2. `useChat` appends the message to history and calls `POST /api/chat` with the last 20 messages
3. The server forwards the conversation to Groq with a system prompt that instructs the model to include structured action tags in its response (e.g. `<action>{"type":"play","trackName":"Bohemian Rhapsody"}</action>`)
4. `extractAction(text)` in `useChat.ts` parses any action tag from the response
5. `App.tsx` receives the action via `onAction` callback and dispatches it to the player

### Supported chat actions

| Action type | What happens |
|---|---|
| `play` | Searches the library for a matching track name and plays it |
| `search` | Calls `GET /api/search?q=` and displays results |
| `search_and_play` | Searches Deezer and plays the first result |
| `add_to_playlist` | Adds the current track to a named playlist |
| `pause` / `resume` | Calls `player.pause()` / `player.resume()` |
| `skip` / `prev` | Calls `player.next()` / `player.prev()` |
| `set_volume` | Calls `player.setVolume(level)` |

### Rate limiting

The chat endpoint is limited to 5 requests per minute per user (`express-rate-limit` keyed on `req.user.userId`). This prevents accidental Groq API abuse.

---

## 11. Testing

### Running tests

```bash
npm run test:server   # Jest + Supertest — tests the Express API
npm run test:client   # Vitest + React Testing Library — tests React components
npm test              # runs both
```

### Backend tests (`server/src/__tests__/`)

Each test file sets up an in-memory database:

```typescript
let db: Client

beforeAll(async () => {
  db = createMemoryDb()
  await initDb(db)
  app.locals.db = db  // or via jest.mock, depending on the file
})
```

Tests make HTTP requests through Supertest against the real Express app. No route handlers are mocked — only external services (Groq, Vercel Blob) are mocked where needed.

### Frontend tests (`client/src/__tests__/`)

Components are rendered with React Testing Library. Howler.js is mocked globally in `client/src/test-setup.ts` (since there is no real audio in jsdom). Components that use `PlaylistContext` or `AuthContext` are wrapped in their respective providers.

Example pattern:

```typescript
import { render, screen } from '@testing-library/react'
import { PlaylistProvider } from '../contexts/PlaylistContext'

test('renders track name', () => {
  render(
    <PlaylistProvider>
      <TrackList tracks={mockTracks} ... />
    </PlaylistProvider>
  )
  expect(screen.getByText('My Song')).toBeInTheDocument()
})
```

### What to test when adding a feature

- New Express endpoint → add a Supertest test in `server/src/__tests__/`
- New React component → add at least one Vitest test in `client/src/__tests__/`
- New DB helper → add a test in `db.test.ts` using `createMemoryDb()`

---

## 12. Common Gotchas

**"My state change isn't reflected in the Howl onend callback"**
This is the stale closure problem. Playback-related state (`loopMode`, `shuffle`, `queue`, `currentTrack`) must be stored as `useRef` values. See [Section 7](#7-audio-playback--the-tricky-part).

**"My component doesn't update after I mutate state"**
If you're mutating a ref, React won't re-render. Refs are for values that need to be read by closures; you still need a mirrored `useState` if the UI depends on the value.

**"CSS animation is fighting my inline style"**
`@keyframes` in `index.css` can set `transform`, which overrides inline `transform` styles during the animation frame. If you need a fixed position via `transform`, use a different property for positioning (e.g., `top`/`bottom`/`left`) so there's no conflict. This was the bug that caused the tooltip to not appear above the cursor — see `Tooltip.tsx`.

**"My overlay is clipped or behind other elements"**
Use `createPortal(content, document.body)`. The tooltip, mobile menu, info bottom sheet, and pricing page all do this. Overflow clipping and z-index stacking contexts from parent containers won't affect portal content.

**"The playlist picker dropdown gets clipped"**
The inline accordion uses `grid-rows-[0fr]/[1fr]` rather than a floating dropdown. If you add a new picker-style component, use the same CSS grid pattern instead of `max-height` or `position: absolute`.

**"My Vercel upload returns 413 on Hobby plan"**
Vercel Hobby caps request bodies at 4.5 MB at the edge, regardless of multer config. Files over 4.5 MB will always fail in production on Hobby. This is a known constraint — document it, don't try to work around it.

**"I added a new env var but it's not available in the API on Vercel"**
Vercel env vars must be added in the Vercel dashboard under Project → Settings → Environment Variables. They do not get picked up from `.env` in production.

**"Tests are passing but the app crashes on Vercel"**
Check that `client/src/types.ts` is in sync with `shared/types.ts`. These are two separate `Track` definitions (a known divergence). Any new field added to the shared type must also be added to the client copy, or the TypeScript build will fail.
