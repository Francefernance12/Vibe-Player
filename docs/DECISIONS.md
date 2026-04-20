# Architecture & Library Decisions

## Session 1A

### Express over Fastify
Chose Express for broad ecosystem compatibility and straightforward middleware model. Vercel's serverless adapter expects a standard Node.js request handler, which Express satisfies without extra config.

### multer 2.x for file uploads
Used multer for multipart/form-data parsing. Pinned to 2.x (not 1.x) because 1.x has publicly disclosed vulnerabilities (CVE-level). The 2.x API is backwards-compatible for `diskStorage` + `single()` usage.

### uuid for track IDs
Track IDs are generated at read-time (not stored), so uuid v4 is sufficient. No DB in Phase 1.

### ts-node-dev for development
Chosen over nodemon + ts-node for faster incremental rebuilds via transpile-only mode.

### Vercel serverless: /tmp for uploads, process.cwd() for samples
Vercel's Lambda-based runtime has a read-only filesystem except for `/tmp`. Uploaded files are written to `/tmp` in production (ephemeral — cleared between invocations). Sample MP3s are bundled with the function via `vercel.json` `includeFiles` and accessed via `process.cwd()/server/samples`. Local dev continues to use `__dirname`-relative paths. This is a Phase 1 limitation; persistent upload storage (S3/Cloudflare R2) is a Phase 4 backlog item.

### better-sqlite3 (deferred to Phase 3)
Will be added in Session 3A. Not needed for Phase 1.

---

## Session 2A

### Spotify Web API (Client Credentials) over a Spotify MCP server
No production-ready Spotify MCP server exists for Claude Code. The Spotify Web API's Client Credentials flow achieves the same result with less infrastructure: the server exchanges `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET` for a bearer token (cached in-memory, refreshed on expiry) and calls `GET /v1/search`. The endpoint returns 503 if credentials are absent, so the app degrades gracefully in development without `.env` values.

### .env removed from git tracking
`.env` was accidentally committed in early sessions. Removed with `git rm --cached .env`. The file is gitignored. Credentials (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`) must be set as environment variables in the Vercel dashboard for production and in local `.env` for development.

### Spotify preview URLs played via Howler
Spotify's 30-second preview URLs are direct MP3 links. Rather than building a separate audio path, a synthetic `Track` object is created from the preview URL and passed to the existing `usePlayer` hook. This reuses all existing playback infrastructure at zero cost.

---

## Session 1B

### Howler.js for audio playback
Chosen over the Web Audio API directly and over `<audio>` element because Howler abstracts cross-browser quirks, supports HTML5 streaming (`html5: true`), and provides a clean seek/volume/event API. The alternative (`<audio>` element via a ref) would have required manual event wiring for every browser edge case.

### useRef + requestAnimationFrame for ProgressBar ticks
The ProgressBar updates on every Howler seek tick. Using `useState` on every tick would cause a React re-render at ~60fps — unnecessary since only two DOM text nodes and one CSS width value change. Instead, a `requestAnimationFrame` loop writes directly to the DOM via `useRef`. This follows the `rerender-use-ref-transient-values` rule from the Vercel React best-practices skill.

### Vite over Create React App
CRA is deprecated. Vite provides faster HMR, native ESM, and first-class TypeScript support. Vite proxy (`/api → localhost:3001`) replaces the need for a separate CORS config during development.

### Vitest over Jest for the frontend
Vitest is natively integrated with Vite — same config file, same transform pipeline, faster startup. Jest requires a separate Babel/ts-jest transform setup and can't reuse the Vite config. Vitest globals (`test`, `vi`, `expect`) are enabled via `globals: true` in `vite.config.ts`.

### Tailwind CSS for styling
Utility-first approach keeps component files self-contained (no separate `.module.css` files). Tailwind's JIT compiler means only used classes are in the production bundle. Alternative (CSS Modules) would require context-switching between TSX and CSS files for every component.

---

## AI Workflow & Tooling

### Claude Code (claude CLI) as primary development agent
Used for all code generation, refactoring, and implementation. Runs in the project directory with access to file tools, bash, and MCP servers. Project instructions are in `CLAUDE.md` and enforced every session.

### OpenCode (opencode/big-pickle) as commit reviewer
A separate sub-agent invoked via the `/review` slash command at the end of each session. It reads git history, writes `docs/REVIEW.md`, and creates GitHub PRs. Kept separate from Claude Code so the reviewer has no bias toward the code it is reviewing.

### GitHub MCP server
Enables Claude Code to interact with the GitHub API directly (list PRs, create branches, read files) without shelling out to `gh`. Configured in Claude Code MCP settings. Used from Session 2A onward.

### Context7 MCP server
Provides up-to-date library documentation fetched at query time. Used when Claude Code needs current API references for Howler.js, Vite, Express, or Vercel — training data cutoffs can lag behind library releases.

### frontend-design plugin skill
Generates high-quality, production-grade UI code with a distinct visual style. Applied when building React components to avoid generic AI-default aesthetics.

### vercel-react-best-practices skill
A curated set of Vercel engineering rules (re-render avoidance, ref-based transient values, memoization, bundle hygiene). Consulted before writing any React component. The ProgressBar's ref-based tick update is a direct result of this skill's `rerender-use-ref-transient-values` rule.

### Vercel for deployment
Chosen for zero-config static + serverless hosting. The Vite build outputs to `client/dist/` served as static files; Express runs as a single Vercel serverless function at `api/index.ts`. Alternative (Railway, Render, Fly.io) would require a persistent server process, adding cost and complexity for Phase 1.
