# Vibe Player — Project Instructions

This file serves as the foundational mandate for all AI agent interactions within the Vibe Player repository. It outlines the project's architecture, development conventions, and operational workflows.

## Project Overview
Vibe Player is a full-stack music player web application built with a focus on AI-agentic development. It features audio playback, Deezer search integration, user-uploaded file persistence via Vercel Blob, playlist management, and an integrated AI music assistant powered by Groq.

### Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Howler.js.
- **Backend:** Node.js, Express 4 (running as Vercel Serverless Functions).
- **Database:** Turso (libSQL/SQLite-compatible).
- **File Storage:** Vercel Blob (CDN for user uploads).
- **AI Inference:** Groq (`llama-3.3-70b-versatile`).
- **Auth:** JWT (httpOnly cookies) + bcrypt.
- **Testing:** Vitest (Frontend), Jest + Supertest (Backend).

---

## Core Mandates

### 1. Incremental Development
- **ALWAYS** work incrementally. Break down tasks into small, manageable, and shippable steps.
- Validate each increment with tests before proceeding to the next.
- Avoid large, monolithic changes.

### 2. Code Style & Simplicity
- **Simplicity First:** Do not overengineer. Prioritize readable, maintainable code over complex abstractions.
- **Identify Root Cause:** Before fixing any bug, reproduce it consistently and identify the root cause. Prove the failure with a test case first.
- **Clean Code:** Use short modules and functions. Name variables and functions clearly and descriptively.
- **No Emojis:** Never use emojis in code, print statements, or logging.
- **Standard APIs:** Use the latest stable library APIs.

### 3. Documentation
- **Decisions:** Update `docs/DECISIONS.md` whenever a library or architectural choice is made.
- **Progress:** Update `docs/PLANCHECKLIST.md` at the end of every significant task or session.
- **Reviews:** `docs/REVIEW.md` is reserved for automated code review summaries (e.g., from the `opencode` sub-agent). Do not write to it manually.

---

## Development Workflow

### Key Commands
| Action | Command |
| :--- | :--- |
| **Install** | `npm install` (run in root, client, and server) |
| **Development** | `npm run dev` (starts both client and server via concurrently) |
| **Test (All)** | `npm run test` |
| **Test (Client)** | `npm run test:client` |
| **Test (Server)** | `npm run test:server` |
| **Build** | `npm run build` (client/server) |
| **Deploy** | `vercel` (preview) or `vercel --prod` (production) |

### Environment Variables
The following variables are required in a root `.env` file (gitignored):
- `TURSO_URL`: LibSQL database connection URL.
- `TURSO_AUTH_TOKEN`: LibSQL authentication token.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token.
- `GROQ_API_KEY`: Groq LLM API key.
- `JWT_SECRET`: Secret for signing JWTs.
- `PORT`: Local backend port (default: 3001).

---

## Repository Structure

```text
/api             Vercel serverless entry point (wraps Express app)
/client          React/TS frontend (Vite)
/server          Express backend
  /db            libSQL helpers and SQL migrations
  /samples       Bundled royalty-free MP3s
/shared          Shared TypeScript types (Track, SearchTrack, etc.)
/docs            Comprehensive architecture, decision, and plan docs
```

---

## Testing Strategy

### Backend (Jest + Supertest)
- Every new Express endpoint **MUST** have a corresponding Supertest test.
- Use in-memory libSQL (`createClient({ url: ':memory:' })`) for all tests to ensure isolation and speed.
- Test files are located in `server/src/__tests__/`.

### Frontend (Vitest + RTL)
- Every new React component **MUST** have at least one Vitest test.
- Mock external dependencies (like Howler.js) in `client/src/test-setup.ts`.
- Test files are located in `client/src/__tests__/`.

---

## AI Assistant & Special Agents

### Chat Assistant
The in-app AI assistant (`client/src/hooks/useChat.ts`) uses Groq to process natural language commands. It parses "action tags" (e.g., `[PLAY_TRACK]`, `[SET_VOLUME]`) to interact with the player state.

### Specialized Sub-Agents
- **perf-optimizer:** Located in `.claude/agents/perf-optimizer.md`. Use this agent for performance audits and optimizations. It follows a two-stage "audit-then-implement" workflow.
- **opencode / commitReview:** Used for automated code reviews before merging PRs.
