---
name: Paid-order retry locks
description: Preventing parallel workers from bypassing fulfillment retry backoff.
---

For durable payment fulfillment, selecting a due retry before taking an
advisory/claim lock is not enough. Reload the order and re-check pending,
processing-stale, and failed-backoff eligibility after the lock is held; return
without side effects when another worker has already refreshed the attempt.

**Why:** Locks serialize work, but without the second check every worker that
selected the same formerly-due row waits its turn and then retries it
immediately. That turns a single transient failure into sequential duplicate
attempts despite an intended exponential backoff.

**How to apply:** Use a stable lock per provider order, record an attempt
timestamp in the same state update, and test two concurrent sweepers against
one failing order. The assertion should prove exactly one attempt occurs per
backoff window.