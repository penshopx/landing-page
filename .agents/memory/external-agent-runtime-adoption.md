---
name: External agent runtime adoption
description: Product decision for introducing OpenClaw, Hermes, or similar autonomous runtimes into Gustafta.
---

OpenClaw, Hermes, and comparable autonomous runtimes must be adopted gradually: begin with a narrow, isolated, read-only use case; expand only after safety, reliability, and useful outcomes have been demonstrated. They are optional workers, never a prerequisite for Gustafta’s core product.

**Why:** Autonomous tool use, memory, and self-improvement create a much larger security and operational surface than ordinary AI chat. A broad rollout before proving value would create dependency and risk without evidence that customers benefit.

**How to apply:** Keep Gustafta as the control plane for identity, permissions, business memory, human approval, audit, and billing. Run an external runtime behind limited, allowlisted capabilities; do not grant direct database, unrestricted filesystem/shell, or cross-tenant access. Use explicit stage gates before moving from an internal pilot to any customer-facing feature.