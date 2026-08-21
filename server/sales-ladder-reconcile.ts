import { eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import {
  salesLadders,
  salesLadderEdges,
  salesLadderNodes,
  productRegistry,
} from "@shared/schema";
import {
  CONTRACTOR_L1_EBOOKS,
  CONTRACTOR_SBU_CLAW,
  CONTRACTOR_SBU_UPSELL_RULE,
  CONTRACTOR_TRIGGER,
  LEGACY_CONTRACTOR_BONUS_RULE,
  LEGACY_CONTRACTOR_L1_NODES,
} from "./sales-ladder-blueprint";
import { CONTRACTOR_LADDER_SLUG } from "./sales-ladder-seed";

const RECONCILE_LOCK_KEY = 391_001;

type LadderNodeRow = typeof salesLadderNodes.$inferSelect;
type LadderEdgeRow = typeof salesLadderEdges.$inferSelect;

export type ContractorL1ReconcileStatus =
  | "UPDATED"
  | "ALREADY_CURRENT"
  | "SKIPPED_CUSTOMIZED"
  | "MISSING"
  | "LOCKED";

type ExpectedEdge = {
  fromNodeId: number;
  toNodeId: number;
  relationType: string;
  ruleText: string | null;
  sortOrder: number;
  isActive: boolean;
};

type ExpectedNode = {
  key: string;
  stage: string;
  nodeType: string;
  productRegistryId: string | null;
  packageRegistryId: string | null;
  label: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

function matchesPlaceholder(
  node: LadderNodeRow,
  spec: { label: string; description: string },
  stage: string,
  sortOrder: number,
): boolean {
  return node.stage === stage
    && node.nodeType === "PLACEHOLDER"
    && node.productRegistryId === null
    && node.packageRegistryId === null
    && node.label === spec.label
    && node.description === spec.description
    && node.sortOrder === sortOrder
    && node.isActive === true;
}

function matchesAnchor(
  node: LadderNodeRow,
  spec: { label: string; description: string },
  stage: string,
  nodeType: string,
): boolean {
  return node.stage === stage
    && node.nodeType === nodeType
    && node.productRegistryId === null
    && node.packageRegistryId === null
    && node.label === spec.label
    && node.description === spec.description
    && node.sortOrder === 0
    && node.isActive === true;
}

function findSingleAnchor(
  nodes: LadderNodeRow[],
  spec: { label: string; description: string },
  stage: string,
  nodeType: string,
): LadderNodeRow | null {
  const matches = nodes.filter(node => matchesAnchor(node, spec, stage, nodeType));
  return matches.length === 1 ? matches[0] : null;
}

function exactEdgeSet(actual: LadderEdgeRow[], expected: ExpectedEdge[]): boolean {
  if (actual.length !== expected.length) return false;
  return expected.every(spec => actual.some(edge =>
    edge.fromNodeId === spec.fromNodeId
    && edge.toNodeId === spec.toNodeId
    && edge.relationType === spec.relationType
    && edge.ruleText === spec.ruleText
    && edge.sortOrder === spec.sortOrder
    && edge.isActive === spec.isActive
  ));
}

function incidentEdges(edges: LadderEdgeRow[], nodes: LadderNodeRow[]): LadderEdgeRow[] {
  const nodeIds = new Set(nodes.map(node => node.id));
  return edges.filter(edge => nodeIds.has(edge.fromNodeId) || nodeIds.has(edge.toNodeId));
}

async function resolveAlias(tx: any, exactName: string): Promise<string | null> {
  const rows: Array<{ productId: string; name: string }> = await tx
    .select({ productId: productRegistry.productId, name: productRegistry.name })
    .from(productRegistry)
    .where(eq(productRegistry.status, "ACTIVE"));
  const target = exactName.trim().toLowerCase();
  const matches = rows.filter(row => row.name.trim().toLowerCase() === target);
  return matches.length === 1 ? matches[0].productId : null;
}

function expectedPlaceholder(
  key: string,
  stage: string,
  label: string,
  description: string,
  sortOrder: number,
): ExpectedNode {
  return {
    key,
    stage,
    nodeType: "PLACEHOLDER",
    productRegistryId: null,
    packageRegistryId: null,
    label,
    description,
    sortOrder,
    isActive: true,
  };
}

function expectedResolvedProduct(
  key: string,
  stage: string,
  productRegistryId: string | null,
  resolvedDescription: string,
  placeholderLabel: string,
  placeholderDescription: string,
  sortOrder: number,
): ExpectedNode {
  if (productRegistryId) {
    return {
      key,
      stage,
      nodeType: "PRODUCT",
      productRegistryId,
      packageRegistryId: null,
      label: null,
      description: resolvedDescription,
      sortOrder,
      isActive: true,
    };
  }
  return expectedPlaceholder(
    key,
    stage,
    placeholderLabel,
    placeholderDescription,
    sortOrder,
  );
}

async function expectedLegacyGraph(tx: any): Promise<{
  nodes: ExpectedNode[];
  edges: Array<Omit<ExpectedEdge, "fromNodeId" | "toNodeId"> & {
    fromKey: string;
    toKey: string;
  }>;
}> {
  const businessMemoryId = await resolveAlias(tx, "Ruang Simpan");
  const brainProjectId = await resolveAlias(tx, "Brain Project");
  const competencyEcoId = await resolveAlias(tx, "Ekosistem Kompetensi");

  const nodes: ExpectedNode[] = [
    {
      key: "L0:0",
      stage: "L0",
      nodeType: "TRIGGER",
      productRegistryId: null,
      packageRegistryId: null,
      label: CONTRACTOR_TRIGGER.label,
      description: CONTRACTOR_TRIGGER.description,
      sortOrder: 0,
      isActive: true,
    },
    ...LEGACY_CONTRACTOR_L1_NODES.map((node, sortOrder) =>
      expectedPlaceholder(`L1:${sortOrder}`, "L1", node.label, node.description, sortOrder)
    ),
    expectedPlaceholder(
      "L2:0",
      "L2",
      CONTRACTOR_SBU_CLAW.label,
      CONTRACTOR_SBU_CLAW.description,
      0,
    ),
    expectedPlaceholder(
      "L3:0",
      "L3",
      "Tender Claw",
      "Alat analisis kesesuaian dokumen tender dengan kapabilitas dan SBU perusahaan",
      0,
    ),
    expectedPlaceholder(
      "L3:1",
      "L3",
      "Contractor Readiness",
      "Suite opsional kesiapan bisnis kontraktor menuju tender korporat",
      1,
    ),
    expectedResolvedProduct(
      "L4:0",
      "L4",
      businessMemoryId,
      "Sistem memori operasional bisnis kontraktor yang berkelanjutan",
      "Gustafta Business Memory",
      "Sistem memori operasional bisnis kontraktor (Ruang Simpan)",
      0,
    ),
    expectedResolvedProduct(
      "L5:0",
      "L5",
      brainProjectId,
      "Platform manajemen proyek kontraktor berbasis AI",
      "Brain Project",
      "Platform manajemen proyek kontraktor berbasis AI",
      0,
    ),
    expectedPlaceholder(
      "L5:1",
      "L5",
      "Mini Apps",
      "Ekosistem mini aplikasi produktivitas khusus bisnis kontraktor",
      1,
    ),
    expectedResolvedProduct(
      "L5:2",
      "L5",
      competencyEcoId,
      "Ekosistem pengembangan kompetensi tim kontraktor",
      "Competency Ecosystem",
      "Ekosistem pengembangan kompetensi tim kontraktor (Ekosistem Kompetensi)",
      2,
    ),
    expectedPlaceholder(
      "L5:3",
      "L5",
      "MultiClaw",
      "Sistem manajemen ekspansi multi-tender lanjutan",
      3,
    ),
  ];

  const edge = (
    fromKey: string,
    toKey: string,
    relationType: string,
    sortOrder: number,
    ruleText: string | null,
  ) => ({ fromKey, toKey, relationType, sortOrder, ruleText, isActive: true });

  return {
    nodes,
    edges: [
      edge("L0:0", "L1:0", "NEXT_STEP", 0, null),
      edge("L1:0", "L1:1", "BONUS", 0, LEGACY_CONTRACTOR_BONUS_RULE),
      edge("L1:0", "L1:2", "BONUS", 1, LEGACY_CONTRACTOR_BONUS_RULE),
      edge("L1:0", "L1:3", "BONUS", 2, LEGACY_CONTRACTOR_BONUS_RULE),
      edge("L1:0", "L2:0", "UPSELL", 0, CONTRACTOR_SBU_UPSELL_RULE),
      edge(
        "L2:0",
        "L3:0",
        "UPSELL",
        0,
        "Analisis kesesuaian tender dengan SBU dan kapabilitas perusahaan",
      ),
      edge(
        "L3:0",
        "L3:1",
        "BUNDLE",
        0,
        "Suite kesiapan kontraktor sebagai paket bundel opsional",
      ),
      edge(
        "L3:1",
        "L4:0",
        "RECURRING",
        0,
        "Sistem memori bisnis yang digunakan secara berkelanjutan setelah readiness",
      ),
      edge(
        "L4:0",
        "L5:0",
        "CROSS_SELL",
        0,
        "Manajemen proyek AI untuk portofolio tender yang sedang berjalan",
      ),
      edge(
        "L4:0",
        "L5:1",
        "CROSS_SELL",
        1,
        "Mini Apps produktivitas operasional harian kontraktor",
      ),
      edge(
        "L4:0",
        "L5:2",
        "CROSS_SELL",
        2,
        "Pengembangan kompetensi tim untuk skala bisnis",
      ),
      edge(
        "L5:0",
        "L5:3",
        "UPSELL",
        0,
        "Ekspansi ke manajemen multi-tender skala besar",
      ),
      edge(
        "L5:1",
        "L5:3",
        "UPSELL",
        1,
        "Ekspansi dari Mini Apps ke orkestrasi MultiClaw",
      ),
      edge(
        "L5:2",
        "L5:3",
        "UPSELL",
        2,
        "Ekspansi tim kompeten ke orkestrasi MultiClaw",
      ),
    ],
  };
}

function exactLegacyGraphMatches(
  actualNodes: LadderNodeRow[],
  actualEdges: LadderEdgeRow[],
  expectedNodes: ExpectedNode[],
  expectedEdges: Array<Omit<ExpectedEdge, "fromNodeId" | "toNodeId"> & {
    fromKey: string;
    toKey: string;
  }>,
): boolean {
  if (actualNodes.length !== expectedNodes.length || actualEdges.length !== expectedEdges.length) {
    return false;
  }

  const actualByKey = new Map<string, LadderNodeRow>();
  for (const node of actualNodes) {
    const key = `${node.stage}:${node.sortOrder}`;
    if (actualByKey.has(key)) return false;
    actualByKey.set(key, node);
  }

  for (const expected of expectedNodes) {
    const actual = actualByKey.get(expected.key);
    if (!actual
      || actual.stage !== expected.stage
      || actual.nodeType !== expected.nodeType
      || actual.productRegistryId !== expected.productRegistryId
      || actual.packageRegistryId !== expected.packageRegistryId
      || actual.label !== expected.label
      || actual.description !== expected.description
      || actual.sortOrder !== expected.sortOrder
      || actual.isActive !== expected.isActive
    ) {
      return false;
    }
  }

  const concreteEdges: ExpectedEdge[] = [];
  for (const expected of expectedEdges) {
    const fromNode = actualByKey.get(expected.fromKey);
    const toNode = actualByKey.get(expected.toKey);
    if (!fromNode || !toNode) return false;
    concreteEdges.push({
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      relationType: expected.relationType,
      ruleText: expected.ruleText,
      sortOrder: expected.sortOrder,
      isActive: expected.isActive,
    });
  }
  return exactEdgeSet(actualEdges, concreteEdges);
}

function currentEdgeSpecs(
  triggerId: number,
  ebookNodeIds: number[],
  sbuClawId: number,
): ExpectedEdge[] {
  return [
    ...ebookNodeIds.map((toNodeId, sortOrder) => ({
      fromNodeId: triggerId,
      toNodeId,
      relationType: "NEXT_STEP",
      ruleText: null,
      sortOrder,
      isActive: true,
    })),
    {
      fromNodeId: ebookNodeIds[CONTRACTOR_L1_EBOOKS.length - 1],
      toNodeId: sbuClawId,
      relationType: "UPSELL",
      ruleText: CONTRACTOR_SBU_UPSELL_RULE,
      sortOrder: 0,
      isActive: true,
    },
  ];
}

export async function reconcileContractorL1Ebooks(
  options?: { slug?: string },
): Promise<ContractorL1ReconcileStatus> {
  const slug = options?.slug ?? CONTRACTOR_LADDER_SLUG;

  return db.transaction(async tx => {
    const lockResult = await tx.execute(
      sql`SELECT pg_try_advisory_xact_lock(${RECONCILE_LOCK_KEY}) AS acquired`,
    );
    const acquired = (lockResult as any)?.[0]?.acquired
      ?? (lockResult as any)?.rows?.[0]?.acquired;
    if (acquired === false) return "LOCKED";

    // Blocks all concurrent Sales Ladder inserts/updates/deletes until this
    // short transaction either commits or rolls back.
    await tx.execute(sql`
      LOCK TABLE sales_ladders, sales_ladder_nodes, sales_ladder_edges
      IN SHARE ROW EXCLUSIVE MODE
    `);

    const [ladder] = await tx
      .select({
        id: salesLadders.id,
        name: salesLadders.name,
        description: salesLadders.description,
        status: salesLadders.status,
      })
      .from(salesLadders)
      .where(eq(salesLadders.slug, slug));
    if (!ladder) return "MISSING";

    const nodes = await tx.select().from(salesLadderNodes)
      .where(eq(salesLadderNodes.ladderId, ladder.id));
    const edges = await tx.select().from(salesLadderEdges)
      .where(eq(salesLadderEdges.ladderId, ladder.id));

    const trigger = findSingleAnchor(nodes, CONTRACTOR_TRIGGER, "L0", "TRIGGER");
    const sbuClaw = findSingleAnchor(nodes, CONTRACTOR_SBU_CLAW, "L2", "PLACEHOLDER");
    if (!trigger || !sbuClaw) {
      console.log(`[SalesLadderReconcile] '${slug}' has customized anchors — skipping.`);
      return "SKIPPED_CUSTOMIZED";
    }

    const l1Nodes = nodes
      .filter(node => node.stage === "L1")
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

    const currentNodesMatch = l1Nodes.length === CONTRACTOR_L1_EBOOKS.length
      && l1Nodes.every((node, index) =>
        matchesPlaceholder(node, CONTRACTOR_L1_EBOOKS[index], "L1", index)
      );
    if (currentNodesMatch) {
      const expected = currentEdgeSpecs(
        trigger.id,
        l1Nodes.map(node => node.id),
        sbuClaw.id,
      );
      if (exactEdgeSet(incidentEdges(edges, l1Nodes), expected)) {
        return "ALREADY_CURRENT";
      }
      console.log(`[SalesLadderReconcile] '${slug}' has customized L1 relationships — skipping.`);
      return "SKIPPED_CUSTOMIZED";
    }

    if (ladder.status !== "DRAFT") {
      console.log(`[SalesLadderReconcile] '${slug}' is not DRAFT — skipping.`);
      return "SKIPPED_CUSTOMIZED";
    }

    if (ladder.name !== "Contractor SBU Readiness"
      || ladder.description !== "Jalur penjualan kontraktor — dari pain Meta Ads hingga ekosistem bisnis lengkap"
    ) {
      console.log(`[SalesLadderReconcile] '${slug}' has customized ladder metadata — skipping.`);
      return "SKIPPED_CUSTOMIZED";
    }

    const expectedLegacy = await expectedLegacyGraph(tx);
    if (!exactLegacyGraphMatches(
      nodes,
      edges,
      expectedLegacy.nodes,
      expectedLegacy.edges,
    )) {
      console.log(`[SalesLadderReconcile] '${slug}' differs from the complete legacy graph — skipping.`);
      return "SKIPPED_CUSTOMIZED";
    }

    const legacyIncidentEdges = incidentEdges(edges, l1Nodes);

    await tx.delete(salesLadderEdges)
      .where(inArray(salesLadderEdges.id, legacyIncidentEdges.map(edge => edge.id)));

    for (let index = 0; index < l1Nodes.length; index++) {
      const ebook = CONTRACTOR_L1_EBOOKS[index];
      await tx.update(salesLadderNodes)
        .set({
          label: ebook.label,
          description: ebook.description,
          sortOrder: index,
          updatedAt: new Date(),
        })
        .where(eq(salesLadderNodes.id, l1Nodes[index].id));
    }

    const fifthEbook = CONTRACTOR_L1_EBOOKS[CONTRACTOR_L1_EBOOKS.length - 1];
    const [createdFifthNode] = await tx.insert(salesLadderNodes).values({
      ladderId: ladder.id,
      stage: "L1",
      nodeType: "PLACEHOLDER",
      productRegistryId: null,
      packageRegistryId: null,
      label: fifthEbook.label,
      description: fifthEbook.description,
      sortOrder: CONTRACTOR_L1_EBOOKS.length - 1,
      isActive: true,
    }).returning();

    const ebookNodeIds = [
      ...l1Nodes.map(node => node.id),
      createdFifthNode.id,
    ];
    await tx.insert(salesLadderEdges).values(
      currentEdgeSpecs(trigger.id, ebookNodeIds, sbuClaw.id).map(edge => ({
        ladderId: ladder.id,
        ...edge,
      })),
    );

    console.log(`[SalesLadderReconcile] '${slug}' updated to five L1 ebook placeholders.`);
    return "UPDATED";
  });
}