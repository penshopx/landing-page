---
name: Public anonymous chat needs sessionId
description: Any public-agent chat page MUST send a per-visitor sessionId to /api/messages/stream or cross-visitor history leaks.
---
Rule: every chat surface for a PUBLIC agent (anonymous visitors) must generate a per-visitor session ID (crypto.randomUUID, persisted in sessionStorage) and send it as `sessionId` in the /api/messages/stream body.

**Why:** when `sessionId` is absent, the server falls back to `getMessages(agentId)` and injects the last ~10 messages of the ENTIRE agent into the model context — visitor A's content (possibly PII) leaks into visitor B's replies. Client-side `conversationHistory` is NOT used server-side. Caught by architect review on the EDUCOUNSEL concierge page.

**How to apply:** copy the `getSessionId()` helper from client/src/pages/educounsel-concierge.tsx pattern for any new public bot page. Login-gated private-agent demo pages are lower risk but should still scope sessions. Residual known gaps: anonymous rate limit is agent-global (100/h) not per-IP; KB reconcile deletes before rebuild (not atomic).
