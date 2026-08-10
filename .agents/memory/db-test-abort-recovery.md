---
name: DB-mutating test abort recovery
description: Pattern so integration tests that temporarily mutate real rows never leave the DB corrupted when the process is killed.
---
Rule: a test that temporarily mutates real DB rows must (1) persist a durable recovery record BEFORE mutating, (2) self-heal from any leftover record at the start of the next run, (3) tag inserted rows with a unique prunable signature on a reserved domain, and (4) never let emergency/signal cleanup delete a recovery record the current run did not write or claim — an unclaimed record may be the only trail from a previous aborted run.

**Why:** after()/teardown never runs on SIGKILL/OOM/CI timeout, and signal handlers are only best-effort; without a durable trail, temporarily-demoted privileged rows stay corrupted forever.

**How to apply:** whenever writing or reviewing DB-integration tests that demote/rename/delete real rows; verify by seeding the aborted state directly in the DB and re-running the test.
