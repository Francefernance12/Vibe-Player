# Agent Memory Index

- [Session-7a frontend optimizations](project_session7a_frontend.md) — fixes applied in session-7a: debounce reorder PUT, useChat ref stabilisation, React.memo on PlayerBar/ProgressBar, Tooltip DOM mutation, SearchBar dep fix
- [Recurring frontend bottleneck patterns](feedback_optimization_patterns.md) — four anti-patterns confirmed across sessions: setState in mousemove, missing useEffect deps, useCallback capturing state, API call per drag event
- [Recurring backend bottleneck patterns (session 7B)](feedback_backend_patterns.md) — five patterns: N+1 JOIN fix, missing FK indexes, libsql batch atomicity, executeMultiple for multi-statement migrations, MemoryStore cold-start caveat
- [Session-7C code quality findings](project_session7c_quality.md) — dead code patterns, type consolidation approach, async fetch error handling gap, accessibility gaps (aria-haspopup, aria-expanded, aria-label on inputs)
