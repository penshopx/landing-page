---
name: Feature-specific worker leases
description: Why newly introduced background queues need a dedicated DB leader during mixed-version rollouts.
---

New persistent background queues must not depend only on a global scheduler
leader when development and production share one database. Use a
feature-specific database leader lease plus claim-level serialization.

**Why:** During a mixed-version rollout, the older published process can keep
renewing the global scheduler lease even though it has no code for the new
worker. A development request then remains queued forever without ever being
claimed.

**How to apply:** For a new queue, give only versions that contain that worker a
dedicated leader key. Verify the live leader in the claim transaction, and also
prevent a second claim while an unexpired request lease is running.