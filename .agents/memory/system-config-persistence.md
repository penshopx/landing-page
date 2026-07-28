---
name: system_config as lightweight persistence
description: Pattern for persisting in-memory counters/stats to system_config so they survive server restarts, without adding new tables.
---

## Rule
For simple counters or stats that accumulate in memory (e.g. `_brevoStats`), use `system_config` with a JSONB value instead of a new DB table.

**Why:** New tables need DDL (drizzle-kit push is blocked in this project), but system_config already exists. Upsert is one line.

**How to apply:**
1. Load from system_config at module/route init (async IIFE, non-fatal).
2. After any mutation to the in-memory object, fire-and-forget `_persistBrevoStats()` → upsert into system_config.
3. The GET stats endpoint reads from the in-memory object (fast); the DB copy is the restart-safe snapshot.

**Limitation:** Not suitable for high-frequency writes (every request) — only for low-frequency events like email webhooks.
