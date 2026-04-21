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

### Deezer public API over Spotify
Spotify was attempted first but requires the developer app owner to hold an active Premium subscription (403 returned from `GET /v1/search` with valid Client Credentials token). Deezer's public search API (`https://api.deezer.com/search?q=`) requires no API key, no OAuth, and no account. It returns 30-second preview MP3 URLs for free, which are playable directly via Howler.js. The backend route is a thin proxy with no token logic or `.env` variables needed.

### .env removed from git tracking
`.env` was accidentally committed in early sessions. Removed with `git rm --cached .env`. The file is gitignored. No credentials are required for Deezer — `.env` now contains only `PORT=3001` for local development.

### Deezer preview URLs played via Howler
Deezer's 30-second preview URLs are direct MP3 links. A synthetic `Track` object is constructed from the preview URL and passed to the existing `usePlayer` hook — the same pattern used for local tracks. No new playback infrastructure needed.

---

## Phase 2 Polish Pass — "Wax" Design System

### Orange accent + Syne + JetBrains Mono
Replaced the default indigo Tailwind accent with a cohesive "Wax" design system: orange-500 (`#f97316`) as the sole accent color, `#0a0a0b` body, `#111113` card surfaces, `#1e1e21` borders. Syne (Google Fonts, weight 700/800) for the wordmark; JetBrains Mono for timestamps and metadata labels. Reasoning: avoids generic AI-generated aesthetics; orange provides high contrast on near-black backgrounds without the over-used purple/indigo gradient look.

### Search results as absolute overlay
`SearchResults` is now positioned `absolute top-full z-50` inside a `relative` wrapper, floating over the layout rather than pushing content down. This prevents the search dropdown from reflowing the playlist and track list panels beneath it.

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
