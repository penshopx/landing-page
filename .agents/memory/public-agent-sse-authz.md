---
name: Public-agent SSE endpoint authz gate
description: Correct unauthenticated-access gate for endpoints serving public agents (docgen/preview/widget-style)
---

Rule: on any endpoint that allows unauthenticated access to "public" agents, the deny condition must be `!auth.ok && agent.isPublic !== true`. Never gate on `agent.userId && !agent.isPublic`.

**Why:** many system-seeded/legacy agents have NO `userId` but are private (`isPublic` false/null). A `userId`-based gate silently lets unauthenticated callers use those agents (KB exposure + unauthorized LLM spend). Caught by architect review on the DocGen generate endpoint (July 2026).

**How to apply:** whenever adding a public-facing agent endpoint (generate/preview/widget/export), copy the `isPublic !== true` deny gate, keep the `isEnabled === false → 503` check, and for SSE streams add `req.on("close", () => abortController.abort())` and pass the signal to the OpenAI call so dropped clients don't leak generations.

Rule: a public widget with a fixed platform role must submit a canonical alias and resolve that alias again on every send. Persist every numeric agent ID previously issued for that role so stale tabs remain fail-closed after the row is renamed, replaced, disabled, or loses its slug.

**Why:** client cache plus a mutable legacy-name fallback can outlive the identity that was originally validated. Checking only the row's current name/slug lets a formerly issued numeric ID fall through as an ordinary public agent.

**How to apply:** resolve the canonical alias before both streaming and non-streaming sends; revalidate the complete readiness contract; keep a durable historical-ID registry for old clients. Startup may synchronize identity/content, but must not overwrite admin-controlled public/active/enabled/archive state on an existing row.
