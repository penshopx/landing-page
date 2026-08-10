---
name: Production shares the dev database
description: gustafta.my.id deployment reads the SAME Postgres as development — data changes in dev are live in prod instantly; only CODE needs a republish.
---
Rule: the deployed app (gustafta.my.id) uses the same DATABASE_URL as development. There is NO separate Replit production database (executeSql environment:"production" errors "does not have a production database").

**Why:** Verified 2026-08-10: publishing 6 packages (SQL in dev DB) made them appear on the prod catalog immediately, while the new `order_cta` field (code) stayed absent until republish.

**How to apply:** "Promote to production" for registry/config data = no-op (already live). Only code changes require Publish. Treat dev-DB mutations as INSTANTLY customer-facing — no safety buffer. Older memory notes claiming a separate prod DB (e.g. claw-agent-model) predate this and are wrong for data; boot-time reconciles still matter only for code-coupled changes.
