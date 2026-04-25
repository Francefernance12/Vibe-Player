# Vibe Player

A full-stack music player web app built incrementally across multiple sessions as part of an **AI agentic development course project**. Every feature — from the initial scaffold to the AI chat assistant — was designed and implemented through structured collaboration between a human developer and Claude Code, an AI coding agent. The project serves both as a working product and as a demonstration of what iterative, agent-driven software development looks like in practice.

**Live URL**: [https://vibe-player.vercel.app](https://vibe-player.vercel.app)

---

## Features

- **Audio playback** — Play, pause, seek, and adjust volume. Supports local sample tracks and user-uploaded files.
- **Deezer search** — Search any artist or track via the Deezer public API. 30-second previews play instantly, no account required.
- **File uploads** — Drag-and-drop or click to upload your own MP3s. Files are stored persistently on Vercel Blob CDN (not lost on server restart).
- **Shuffle & loop modes** — Shuffle the current queue, loop a single track, or loop the full queue. Cycled with a single button.
- **Playlists** — Create multiple named playlists, add tracks from the library or search results, drag-and-drop to reorder. Filter and sort per playlist.
- **User accounts** — Register, log in, and log out. Playlists and uploads are tied to your account and persist across devices.
- **Per-user storage quota** — Free tier is capped at 100 MB. A progress bar shows usage; uploads are rejected cleanly when the quota is full.
- **AI music assistant** — An in-app chat powered by Groq (`llama-3.3-70b-versatile`). Ask it to play a track, search for an artist, skip or pause, set volume, or add to a playlist — all via natural language.
- **Mobile support** — Fixed bottom player bar, swipe left/right for next/prev, 44px touch targets, and a `⋮` context menu replacing desktop action buttons on small screens.
- **Mouse-following track tooltip** — Hover any track on desktop to see full metadata in a card that follows the cursor.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript, Vite 5 |
| Styling | Tailwind CSS v3 |
| Audio engine | Howler.js |
| Backend | Node.js + Express 4 |
| Database | Turso (libSQL / SQLite-compatible) via `@libsql/client` |
| File storage | Vercel Blob |
| External search | Deezer public API (no key required) |
| AI inference | Groq API (`llama-3.3-70b-versatile`) |
| Auth | bcrypt + JWT stored in httpOnly cookies |
| Testing (backend) | Jest + Supertest |
| Testing (frontend) | Vitest + React Testing Library |
| Deployment | Vercel (static frontend + serverless API) |

---

## Major Decisions

**Deezer over Spotify** — Spotify's search endpoint requires the developer to hold an active Premium subscription. Deezer's public API requires no key, no OAuth, and no account, and returns direct 30-second preview MP3 URLs.

**Turso (libSQL) over SQLite file** — Vercel serverless functions share no filesystem between invocations. A SQLite file in `/tmp` would be empty on every cold start. Turso is a hosted libSQL instance with the same SQL interface and Vercel-compatible async driver.

**Vercel Blob for uploads** — Same problem as the database: files written to `/tmp` disappear between invocations. Vercel Blob stores files on a CDN and returns a permanent public URL that lives in Turso alongside the track metadata.

**`useRef` for Howler closures** — Howl's `onend` callback is captured in a closure at construction time. Shuffle mode, loop mode, and the current queue are stored in `useRef` so the closure always reads current values without re-creating the Howl object on every state change.

**Portal rendering for overlays** — Track tooltips, mobile context menus, the info bottom sheet, and the pricing page all render via `createPortal` to `document.body`. This sidesteps z-index and `overflow: hidden` clipping from the track list container.

**Groq 70B model for the chat assistant** — The smaller 8B model (`llama-3.1-8b-instant`) was unreliable at following structured action-tag instructions as the vocabulary grew. Upgrading to `llama-3.3-70b-versatile` (still on Groq's free tier) resolved parsing failures.

For the full decision log, see [DECISIONS.md](./DECISIONS.md).

---

## Future Plans

The project is currently in a maintenance phase. Potential next steps include:

- **Vercel Pro upgrade** — Removes the 4.5 MB request body cap, allowing uploads larger than 4.5 MB in production.
- **Waveform visualiser** — Draw a waveform using the Web Audio API alongside the seek bar.
- **Paid tiers** — The pricing mockup (`feature/pricing-mockup` branch) is a UI-only scaffold. Wiring in Stripe would be the next step.
- **Collaborative playlists** — Share a playlist link and let others add tracks.
- **Offline mode** — Service worker + Cache API for offline playback of previously loaded tracks.
- **Playlist sync debounce** — The current `PUT /api/playlists/:id/tracks` fires on every mutation. A debounce would reduce network calls during rapid reordering.

---

## Running Locally

### Prerequisites

- Node.js 18+
- A [Turso](https://turso.tech) account (free tier is sufficient)
- A [Groq](https://console.groq.com) API key (free tier)
- A [Vercel](https://vercel.com) account with a Blob store created (for upload persistence; optional for local dev)

### 1. Clone the repository

```bash
git clone https://github.com/Francefernance12/Vibe-Player.git
cd Vibe-Player
```

### 2. Install dependencies

```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 3. Set environment variables

Create a `.env` file in the project root:

```
PORT=3001
TURSO_DATABASE_URL=libsql://<your-db>.turso.io
TURSO_AUTH_TOKEN=<your-turso-token>
JWT_SECRET=<any-long-random-string>
GROQ_API_KEY=<your-groq-key>
BLOB_READ_WRITE_TOKEN=<your-vercel-blob-token>   # optional for local dev
```

To get the Turso values: install the [Turso CLI](https://docs.turso.tech/cli/introduction), run `turso db create vibe-player`, then `turso db tokens create vibe-player`.

### 4. Start the development server

```bash
npm run dev
```

This starts both the Express backend on `http://localhost:3001` and the Vite frontend on `http://localhost:5173`. The Vite dev proxy forwards `/api` requests to the backend automatically.

### 5. Run the tests

```bash
npm run test:server   # 52 Jest + Supertest tests
npm run test:client   # 49 Vitest + React Testing Library tests
```

---

## Project Structure

```
/
├── client/          React/TypeScript frontend (Vite)
├── server/          Node.js/Express backend + DB migrations
├── shared/          Shared TypeScript types
├── api/             Vercel serverless entry point
└── docs/            Architecture, decisions, plan, and this file
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a full annotated layout, component hierarchy, route table, data flows, and deployment topology.

---

## About This Project

Vibe Player was built as part of an AI agentic development course. The goal was to demonstrate how a complete, production-deployed web application can be built through structured human–AI collaboration — where the human sets direction, reviews decisions, and approves changes, while the AI agent handles implementation, testing, and documentation.

Each session had a defined scope (e.g. "add auth endpoints", "build the chat assistant"), ended with a full test run and a commit, and was reviewed by a separate sub-agent (OpenCode) before merging. The `docs/` folder tracks every architectural decision, session checkpoint, and code review in a way that makes the development process itself auditable.
