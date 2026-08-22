---
name: Manual fulfillment processing leases
description: Crash-safe pattern for reclaiming manual order fulfillment without concurrent workers overwriting each other.
---

**Rule:** A durable order claimed as `processing` must have a bounded lease. A stale claim may be reclaimed only when all fulfillment effects are idempotent, and every success/failure write must match the reclaimable claim's version token.

**Why:** Claiming an order before external fulfillment prevents duplicate workers, but a crash can strand it forever. Merely allowing stale retries creates a second race: the old worker can resume and overwrite the newer worker's status unless final/error writes prove they still own the claim.

**How to apply:** Stamp a precise claim version when entering `processing`; reclaim only after the lease expires; make outbox, entitlement, and pending-delivery writes idempotent; finalize or fail with `WHERE status='processing' AND claim_version=<owned version>`.