---
name: External agent runtime adoption
description: Product decision for introducing OpenClaw, Hermes, or similar autonomous runtimes into Gustafta.
---

OpenClaw, Hermes, and comparable autonomous runtimes must be adopted gradually: begin with a narrow, isolated, read-only use case; expand only after safety, reliability, and useful outcomes have been demonstrated. They are optional workers, never a prerequisite for Gustafta’s core product.

Customer-facing AI Staff value should be built first through Gustafta-native guided work: an explicit assignment, authorized context, structured plan/checklist/draft, Workroom state, and a human gate. External runtimes may later strengthen only the steps that genuinely need tool execution.

**Why:** Autonomous tool use, memory, and self-improvement create a much larger security and operational surface than ordinary AI chat. A broad rollout before proving value would create dependency and risk without evidence that customers benefit.

**How to apply:** Keep Gustafta as the control plane for identity, permissions, business memory, human approval, audit, and billing. The first Hermes pilot is internal-only for the strengthened Research/Monitoring team, led by one dedicated specialist agent. Give it read-only, allowlisted research/monitoring work and require human review before anything is acted on. Build AI Staff workflows natively in Workroom before adding autonomy. Do not grant direct database, unrestricted filesystem/shell, or cross-tenant access. Use explicit stage gates before moving from an internal pilot to any customer-facing feature.