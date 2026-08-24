---
name: Stable paid-download identifiers
description: Authorization and URL identity rules for paid digital files, including multi-product orders and stale links.
---

# Stable paid-download identifiers

Paid digital-download URLs must identify both the entitled product and the file's semantic role. Numeric database row IDs are compatibility-only and must not be the canonical buyer-facing identity.

**Why:** Reconcilers can replace file rows, making saved numeric links stale. A role without product identity is also ambiguous for packages containing several products that each have a `main` file.

**How to apply:** Authorize the token first, require the requested product to belong to its entitlement, then resolve the role only within that product. A missing legacy numeric ID may fall back only when exactly one entitled product is unambiguous; an existing foreign ID must always be denied.