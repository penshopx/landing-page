// ─────────────────────────────────────────────────────────────────────────────
// SALES LADDER SEED — Task #390
//
// Seeds ONE draft ladder: contractor-sbu-readiness
// Idempotent: advisory xact lock + slug check → never overwrites existing ladder.
// All reads/writes share ONE transaction (including alias resolution).
// Never creates or modifies product_registry / package_registry rows.
//
// Alias matching: case-insensitive EXACT trimmed name equality (no LIKE/ILIKE).
// Only resolves if exactly ONE ACTIVE product matches; otherwise PLACEHOLDER.
//
// Allowed aliases:
//   "Ruang Simpan"         → Business Memory
//   "Ekosistem Kompetensi" → Competency Ecosystem
//   "Brain Project"        → exact name
//
// Edge semantics (locked discussion):
//   L0 trigger → L1 ebook         NEXT_STEP
//   L1 ebook → L1 bonus(x3)       BONUS
//   L1 ebook → L2 SBU Claw        UPSELL        (company-specific AI specialist analysis)
//   L2 SBU Claw → L3 Tender Claw  UPSELL        (tender doc analysis vs company readiness)
//   L3 Tender → L3 Contractor     BUNDLE        (optional suite/bundle)
//   L3 Contractor → L4 Biz Memory RECURRING     (ongoing operational tool)
//   L4 Biz Memory → L5 nodes      CROSS_SELL    (brain/mini apps/competency)
//   L5 expansion → L5 MultiClaw   UPSELL        (expansion)
// ─────────────────────────────────────────────────────────────────────────────
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import {
  salesLadders, salesLadderNodes, salesLadderEdges, productRegistry,
} from "@shared/schema";

export const CONTRACTOR_LADDER_SLUG = "contractor-sbu-readiness";

// Advisory lock key (arbitrary, stable, unique to this seed)
const ADVISORY_LOCK_KEY = 390_001;

type NodeSpec = {
  stage:             string;
  nodeType:          string;
  productRegistryId?: string | null;
  packageRegistryId?: string | null;
  label?:            string | null;
  description?:      string | null;
  sortOrder:         number;
  isActive:          boolean;
};

type EdgeSpec = {
  fromIdx:      number;
  toIdx:        number;
  relationType: string;
  ruleText?:    string | null;
  sortOrder:    number;
};

// ── Alias resolver: runs INSIDE the transaction ───────────────────────────────
// Exact trimmed case-insensitive name match. Returns productId only if exactly
// ONE ACTIVE product has that exact name (case-insensitive). Never uses LIKE/ILIKE.

async function resolveAlias(tx: any, exactName: string): Promise<string | null> {
  // Load all ACTIVE products — we do this inside the transaction to stay consistent.
  const rows: Array<{ productId: string; name: string }> = await tx
    .select({ productId: productRegistry.productId, name: productRegistry.name })
    .from(productRegistry)
    .where(eq(productRegistry.status, "ACTIVE"));

  const lower = exactName.trim().toLowerCase();
  const matches = rows.filter(r => r.name.trim().toLowerCase() === lower);
  return matches.length === 1 ? matches[0].productId : null;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function seedContractorLadder(
  options?: { slug?: string; name?: string },
): Promise<void> {
  const SEED_SLUG = options?.slug ?? CONTRACTOR_LADDER_SLUG;
  const SEED_NAME = options?.name ?? "Contractor SBU Readiness";

  await db.transaction(async (tx) => {
    // 1. Acquire advisory lock (transaction-scoped, non-blocking)
    const lockResult = await tx.execute(
      sql`SELECT pg_try_advisory_xact_lock(${ADVISORY_LOCK_KEY}) AS acquired`,
    );
    const acquired = (lockResult as any)?.[0]?.acquired
      ?? (lockResult as any)?.rows?.[0]?.acquired;
    if (acquired === false) {
      console.log("[SalesLadderSeed] advisory lock not acquired — concurrent seed running, skipping.");
      return;
    }

    // 2. Idempotency check: never overwrite an existing ladder
    const [existing] = await tx
      .select({ id: salesLadders.id })
      .from(salesLadders)
      .where(eq(salesLadders.slug, SEED_SLUG));
    if (existing) {
      console.log(`[SalesLadderSeed] Ladder '${SEED_SLUG}' already exists (id=${existing.id}) — skipping.`);
      return;
    }

    console.log(`[SalesLadderSeed] Seeding ladder '${SEED_SLUG}'...`);

    // 3. Resolve product aliases INSIDE transaction
    const businessMemoryId  = await resolveAlias(tx, "Ruang Simpan");
    const brainProjectId    = await resolveAlias(tx, "Brain Project");
    const competencyEcoId   = await resolveAlias(tx, "Ekosistem Kompetensi");

    console.log(`[SalesLadderSeed] Alias resolved — businessMemory=${businessMemoryId ?? "PLACEHOLDER"}, brainProject=${brainProjectId ?? "PLACEHOLDER"}, competencyEco=${competencyEcoId ?? "PLACEHOLDER"}`);

    // 4. Build node list
    // Node index mapping (used to wire edges):
    //  0 = L0 Trigger (Meta Ads)
    //  1 = L1 SBU & SKK Tanpa Bingung (ebook)
    //  2 = L1 Bonus placeholder 1
    //  3 = L1 Bonus placeholder 2
    //  4 = L1 Bonus placeholder 3
    //  5 = L2 SBU Claw          (AI specialist analysis — company-specific)
    //  6 = L3 Tender Claw       (tender doc analysis vs company readiness)
    //  7 = L3 Contractor Readiness (optional bundle/suite)
    //  8 = L4 Business Memory   (alias Ruang Simpan → recurring operational)
    //  9 = L5 Brain Project     (exact name)
    // 10 = L5 Mini Apps
    // 11 = L5 Competency Ecosystem (alias Ekosistem Kompetensi)
    // 12 = L5 MultiClaw

    const nodeSpecs: NodeSpec[] = [
      // 0: L0 Trigger
      {
        stage: "L0", nodeType: "TRIGGER",
        label:       "Meta Ads Pain Touchpoint",
        description: "Calon kontraktor menemukan pain melalui iklan Meta Ads",
        sortOrder: 0, isActive: true,
      },
      // 1: L1 SBU & SKK ebook
      {
        stage: "L1", nodeType: "PLACEHOLDER",
        label:       "SBU & SKK Tanpa Bingung",
        description: "E-book panduan pengurus SBU & SKK untuk kontraktor pemula",
        sortOrder: 0, isActive: true,
      },
      // 2–4: L1 Bonus placeholders
      {
        stage: "L1", nodeType: "PLACEHOLDER",
        label:       "Bonus Produk Pendukung 1",
        description: "Produk bonus pelengkap bagi pembeli SBU & SKK ebook",
        sortOrder: 1, isActive: true,
      },
      {
        stage: "L1", nodeType: "PLACEHOLDER",
        label:       "Bonus Produk Pendukung 2",
        description: "Produk bonus pelengkap bagi pembeli SBU & SKK ebook",
        sortOrder: 2, isActive: true,
      },
      {
        stage: "L1", nodeType: "PLACEHOLDER",
        label:       "Bonus Produk Pendukung 3",
        description: "Produk bonus pelengkap bagi pembeli SBU & SKK ebook",
        sortOrder: 3, isActive: true,
      },
      // 5: L2 SBU Claw — AI specialist analysis tool for company SBU classification
      {
        stage: "L2", nodeType: "PLACEHOLDER",
        label:       "SBU Claw",
        description: "AI specialist yang menganalisis kualifikasi SBU spesifik perusahaan kontraktor",
        sortOrder: 0, isActive: true,
      },
      // 6: L3 Tender Claw — analyzes tender documents vs company readiness
      {
        stage: "L3", nodeType: "PLACEHOLDER",
        label:       "Tender Claw",
        description: "Alat analisis kesesuaian dokumen tender dengan kapabilitas dan SBU perusahaan",
        sortOrder: 0, isActive: true,
      },
      // 7: L3 Contractor Readiness — optional suite/bundle
      {
        stage: "L3", nodeType: "PLACEHOLDER",
        label:       "Contractor Readiness",
        description: "Suite opsional kesiapan bisnis kontraktor menuju tender korporat",
        sortOrder: 1, isActive: true,
      },
      // 8: L4 Business Memory — alias Ruang Simpan (recurring operational memory)
      ...(businessMemoryId
        ? [{
            stage: "L4" as const, nodeType: "PRODUCT" as const,
            productRegistryId: businessMemoryId,
            description: "Sistem memori operasional bisnis kontraktor yang berkelanjutan",
            sortOrder: 0, isActive: true,
          }]
        : [{
            stage: "L4" as const, nodeType: "PLACEHOLDER" as const,
            label:       "Gustafta Business Memory",
            description: "Sistem memori operasional bisnis kontraktor (Ruang Simpan)",
            sortOrder: 0, isActive: true,
          }]
      ),
      // 9: L5 Brain Project
      ...(brainProjectId
        ? [{
            stage: "L5" as const, nodeType: "PRODUCT" as const,
            productRegistryId: brainProjectId,
            description: "Platform manajemen proyek kontraktor berbasis AI",
            sortOrder: 0, isActive: true,
          }]
        : [{
            stage: "L5" as const, nodeType: "PLACEHOLDER" as const,
            label:       "Brain Project",
            description: "Platform manajemen proyek kontraktor berbasis AI",
            sortOrder: 0, isActive: true,
          }]
      ),
      // 10: L5 Mini Apps
      {
        stage: "L5", nodeType: "PLACEHOLDER",
        label:       "Mini Apps",
        description: "Ekosistem mini aplikasi produktivitas khusus bisnis kontraktor",
        sortOrder: 1, isActive: true,
      },
      // 11: L5 Competency Ecosystem
      ...(competencyEcoId
        ? [{
            stage: "L5" as const, nodeType: "PRODUCT" as const,
            productRegistryId: competencyEcoId,
            description: "Ekosistem pengembangan kompetensi tim kontraktor",
            sortOrder: 2, isActive: true,
          }]
        : [{
            stage: "L5" as const, nodeType: "PLACEHOLDER" as const,
            label:       "Competency Ecosystem",
            description: "Ekosistem pengembangan kompetensi tim kontraktor (Ekosistem Kompetensi)",
            sortOrder: 2, isActive: true,
          }]
      ),
      // 12: L5 MultiClaw
      {
        stage: "L5", nodeType: "PLACEHOLDER",
        label:       "MultiClaw",
        description: "Sistem manajemen ekspansi multi-tender lanjutan",
        sortOrder: 3, isActive: true,
      },
    ];

    // 5. Create ladder row
    const [ladder] = await tx.insert(salesLadders).values({
      slug:        SEED_SLUG,
      name:        SEED_NAME,
      description: "Jalur penjualan kontraktor — dari pain Meta Ads hingga ekosistem bisnis lengkap",
      status:      "DRAFT",
    }).returning();

    // 6. Insert nodes sequentially (preserves index mapping)
    const createdNodes: Array<{ id: number }> = [];
    for (const spec of nodeSpecs) {
      const [node] = await tx.insert(salesLadderNodes).values({
        ladderId:          ladder.id,
        stage:             spec.stage,
        nodeType:          spec.nodeType,
        productRegistryId: (spec as any).productRegistryId ?? null,
        packageRegistryId: null,
        label:             spec.label ?? null,
        description:       spec.description ?? null,
        sortOrder:         spec.sortOrder,
        isActive:          spec.isActive,
      }).returning();
      createdNodes.push(node);
    }

    // 7. Wire edges per locked discussion semantics
    const edgeSpecs: EdgeSpec[] = [
      // L0 → L1 (trigger → entry product)
      { fromIdx:  0, toIdx:  1, relationType: "NEXT_STEP",  sortOrder: 0 },

      // L1 → L1 bonus (3 bonus items alongside ebook)
      { fromIdx:  1, toIdx:  2, relationType: "BONUS",      sortOrder: 0,
        ruleText: "Bonus gratis disertakan bersama pembelian SBU & SKK Tanpa Bingung" },
      { fromIdx:  1, toIdx:  3, relationType: "BONUS",      sortOrder: 1,
        ruleText: "Bonus gratis disertakan bersama pembelian SBU & SKK Tanpa Bingung" },
      { fromIdx:  1, toIdx:  4, relationType: "BONUS",      sortOrder: 2,
        ruleText: "Bonus gratis disertakan bersama pembelian SBU & SKK Tanpa Bingung" },

      // L1 → L2 UPSELL (ebook → SBU Claw AI analysis)
      { fromIdx:  1, toIdx:  5, relationType: "UPSELL",     sortOrder: 0,
        ruleText: "Upgrade ke analisis AI spesifik SBU perusahaan Anda" },

      // L2 → L3 UPSELL (SBU Claw → Tender Claw)
      { fromIdx:  5, toIdx:  6, relationType: "UPSELL",     sortOrder: 0,
        ruleText: "Analisis kesesuaian tender dengan SBU dan kapabilitas perusahaan" },

      // L3 Tender → L3 Contractor Readiness BUNDLE (optional parallel suite)
      { fromIdx:  6, toIdx:  7, relationType: "BUNDLE",     sortOrder: 0,
        ruleText: "Suite kesiapan kontraktor sebagai paket bundel opsional" },

      // L3 Contractor Readiness → L4 Business Memory RECURRING (ongoing operational tool)
      { fromIdx:  7, toIdx:  8, relationType: "RECURRING",  sortOrder: 0,
        ruleText: "Sistem memori bisnis yang digunakan secara berkelanjutan setelah readiness" },

      // L4 Business Memory → L5 nodes CROSS_SELL
      { fromIdx:  8, toIdx:  9, relationType: "CROSS_SELL", sortOrder: 0,
        ruleText: "Manajemen proyek AI untuk portofolio tender yang sedang berjalan" },
      { fromIdx:  8, toIdx: 10, relationType: "CROSS_SELL", sortOrder: 1,
        ruleText: "Mini Apps produktivitas operasional harian kontraktor" },
      { fromIdx:  8, toIdx: 11, relationType: "CROSS_SELL", sortOrder: 2,
        ruleText: "Pengembangan kompetensi tim untuk skala bisnis" },

      // L5 expansion → MultiClaw UPSELL
      { fromIdx:  9, toIdx: 12, relationType: "UPSELL",     sortOrder: 0,
        ruleText: "Ekspansi ke manajemen multi-tender skala besar" },
      { fromIdx: 10, toIdx: 12, relationType: "UPSELL",     sortOrder: 1,
        ruleText: "Ekspansi dari Mini Apps ke orkestrasi MultiClaw" },
      { fromIdx: 11, toIdx: 12, relationType: "UPSELL",     sortOrder: 2,
        ruleText: "Ekspansi tim kompeten ke orkestrasi MultiClaw" },
    ];

    for (const es of edgeSpecs) {
      const fromNode = createdNodes[es.fromIdx];
      const toNode   = createdNodes[es.toIdx];
      if (!fromNode || !toNode) {
        console.warn(`[SalesLadderSeed] Skipping edge ${es.fromIdx}→${es.toIdx}: node not found`);
        continue;
      }
      await tx.insert(salesLadderEdges).values({
        ladderId:     ladder.id,
        fromNodeId:   fromNode.id,
        toNodeId:     toNode.id,
        relationType: es.relationType,
        ruleText:     es.ruleText ?? null,
        sortOrder:    es.sortOrder,
        isActive:     true,
      }).onConflictDoNothing();
    }

    console.log(
      `[SalesLadderSeed] Done: ladder id=${ladder.id}, ` +
      `${createdNodes.length} nodes, ${edgeSpecs.length} edge specs.`,
    );
  });
}
