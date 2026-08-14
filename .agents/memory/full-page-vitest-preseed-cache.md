---
name: Happy-dom full-page render livelock
description: Component tests that mount a full data-fetching page can hard-hang during the loading phase; pre-seed the query cache.
---

Rule: when a component test mounts a whole page whose query data defaults to a fresh `[]` and a sync effect copies it into local state, pre-seed the query cache with fixtures before rendering (and use infinite staleTime).

**Why:** during the loading phase the default `[]` gets a new identity every render, so the sync effect re-fires forever; in happy-dom this livelock starves the event loop — the test runner hangs with zero output and no timeout ever fires.

**How to apply:** if a vitest run of a page-mount test produces no output at all (not even a failure), suspect this loop; seed every query the page mounts before `render()` instead of letting the mocked fetch resolve it.
