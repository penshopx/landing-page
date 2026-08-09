---
name: Claw Factory
description: Mass production pipeline for premium OpenClaw/MultiClaw store products from aiforwork prompts
---
New claw products are NO LONGER one seed file each. Pipeline:
- `server/lib/claw-factory.ts` — builds orchestrator + tool prompts from Gustafta standard template (wawancara→penyusunan→evaluasi→opsi→CHANGE LOG, [ASUMSI], ◆ human gate, no third-party), auto-generates the rubric evaluator per claw, seeds with the safe pattern (reconcile idempotent, slug lookup, post-create update for isPublic/isListed/premiumClass).
- `server/claw-catalog.ts` — `CLAW_CATALOG: CatalogEntry[]`; one ~40-line data entry per product. Seeded at boot via `seedClawCatalog` in server/index.ts AFTER the 4 hand-written claw seeds (multiclaw members resolve by slug).

**Why:** user plans hundreds of products converted from aiforwork prompt JSONs; per-product seed files don't scale and drift from the standard rules.

**How to apply:** when the user pastes an aiforwork prompt JSON: translate to Indonesian, strip ALL aiforwork links/branding, split into orchestrator mission + 2–3 specific tools, map criteria → evaluatorCriteria (skip the evaluator tool — auto-generated), add ONE entry to CLAW_CATALOG. Pricing convention: OpenClaw = K2/2.5jt/199rb, MultiClaw = K3/5jt/299rb. Tool slugs must be globally unique (prefix with claw abbreviation). The first 4 products (desain-proyek, rencana-proyek, studi-kelayakan, persiapan-proyek-multiclaw) stay in their legacy seed files.
User workflow (novice): they only paste raw prompts and test chat quality — never ask them to split/translate prompts.
