---
name: Dedupe migrations must migrate dependents first
description: Rules for boot-time dedupe + unique-index migrations on tables with CASCADE children
---

Rule: when a dedupe-then-unique-index migration deletes duplicate parent rows, it must FIRST reconcile dependent rows, in the same transaction.

**Why:** lms_lesson_progress has ON DELETE CASCADE to lms_lessons — naive duplicate deletion silently destroys student completions; derived state (enrollment progress %) then goes stale. Caught by completion review three times.

**How to apply:**
- Map loser→survivor with `DISTINCT ON` (survivor = active first, newest id).
- Dedupe children with a window rank across survivor + ALL losers in one DELETE (a `NOT EXISTS` conditional UPDATE is snapshot-evaluated: two losers with no survivor both pass → duplicates survive).
- Rank by survivor-preference, then real timestamp (completed_at ASC), then id — serial id is not a reliable time proxy (imports/backfills).
- Recompute derived aggregates (enrollment progress) in the same tx; move completion timestamps forward only, never revoke.
- Test against scratch tables (fn takes table-name params) with fixtures covering: user with progress on multiple losers only, and non-monotonic id-vs-timestamp.

Reference implementation: `server/lms-lesson-schema.ts` (pattern mirrors `server/lms-cert-schema.ts`, wired idempotently at boot in server/index.ts).
