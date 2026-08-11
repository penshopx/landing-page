---
name: apiRequest returns parsed JSON
description: client apiRequest() contract — no .json()/.ok on its result
---
`apiRequest()` in client/src/lib/queryClient.ts returns ALREADY-PARSED JSON when the response content-type is application/json (raw Response only otherwise), and throws on non-OK status.

**Why:** dozens of call sites written in the old `res.json()` / `if (!res.ok)` style crash at runtime with "(intermediate value).json is not a function", or silently mis-branch on `res.ok === undefined`. A 2026-08 sweep fixed ~60 such sites.

**How to apply:** never call `.json()` or check `.ok` on an apiRequest result — use the returned value directly and rely on the thrown error for HTTP failures. Raw `fetch()` call sites still need `.json()`; check the variable's origin before "fixing".
