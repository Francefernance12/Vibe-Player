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

### better-sqlite3 (deferred to Phase 3)
Will be added in Session 3A. Not needed for Phase 1.
