// ─────────────────────────────────────────────────────────────────────────────
// SALES LADDER — Task #390
//
// Directed graph: Ladder → Nodes → Edges.
// Stages L0..L5. Node types TRIGGER | PRODUCT | PACKAGE | PLACEHOLDER.
// Relation types NEXT_STEP | BONUS | UPSELL | CROSS_SELL | BUNDLE | RECURRING.
// Ladder statuses DRAFT | ACTIVE | ARCHIVED.
//
// All endpoints: isAuthenticated + superadmin only (admin → 403).
// Product/package names and prices resolved LIVE — no price/name stored in ladder tables.
// FK RESTRICT on product/package references: registry rows cannot disappear under a ladder.
// ─────────────────────────────────────────────────────────────────────────────
import type { Express } from "express";
import { and, asc, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import {
  salesLadders, salesLadderNodes, salesLadderEdges, salesLadderCoverage,
  productRegistry, packageRegistry,
  LADDER_STATUSES, LADDER_STAGES, NODE_TYPES, RELATION_TYPES,
} from "@shared/schema";

// ── Utilities ─────────────────────────────────────────────────────────────────

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ── Zod schemas (exported for tests) ─────────────────────────────────────────

export const zCreateLadder = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
});

export const zPatchLadder = z.object({
  name:        z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status:      z.enum(LADDER_STATUSES).optional(),
}).refine(d => Object.keys(d).length > 0, { message: "No valid fields" });

export const zCreateNode = z.object({
  stage:             z.enum(LADDER_STAGES),
  nodeType:          z.enum(NODE_TYPES),
  productRegistryId: z.string().max(40).optional().nullable(),
  packageRegistryId: z.string().max(60).optional().nullable(),
  label:             z.string().max(300).optional().nullable(),
  description:       z.string().max(2000).optional().nullable(),
  sortOrder:         z.number().int().optional(),
  isActive:          z.boolean().optional(),
}).superRefine((d, ctx) => {
  if (d.nodeType === "PRODUCT") {
    if (!d.productRegistryId?.trim()) ctx.addIssue({ code: "custom", message: "productRegistryId required for PRODUCT node" });
    if (d.packageRegistryId?.trim())  ctx.addIssue({ code: "custom", message: "packageRegistryId must be absent for PRODUCT node" });
  } else if (d.nodeType === "PACKAGE") {
    if (!d.packageRegistryId?.trim()) ctx.addIssue({ code: "custom", message: "packageRegistryId required for PACKAGE node" });
    if (d.productRegistryId?.trim())  ctx.addIssue({ code: "custom", message: "productRegistryId must be absent for PACKAGE node" });
  } else {
    // TRIGGER | PLACEHOLDER
    if (d.productRegistryId?.trim())  ctx.addIssue({ code: "custom", message: "productRegistryId must be absent for TRIGGER/PLACEHOLDER node" });
    if (d.packageRegistryId?.trim())  ctx.addIssue({ code: "custom", message: "packageRegistryId must be absent for TRIGGER/PLACEHOLDER node" });
    if (!d.label?.trim())             ctx.addIssue({ code: "custom", message: "label required for TRIGGER/PLACEHOLDER node" });
  }
});

export const zPatchNode = z.object({
  stage:             z.enum(LADDER_STAGES).optional(),
  nodeType:          z.enum(NODE_TYPES).optional(),
  productRegistryId: z.string().max(40).optional().nullable(),
  packageRegistryId: z.string().max(60).optional().nullable(),
  label:             z.string().max(300).optional().nullable(),
  description:       z.string().max(2000).optional().nullable(),
  sortOrder:         z.number().int().optional(),
  isActive:          z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, { message: "No valid fields" });

export const zCreateEdge = z.object({
  fromNodeId:   z.number().int().positive(),
  toNodeId:     z.number().int().positive(),
  relationType: z.enum(RELATION_TYPES),
  ruleText:     z.string().max(1000).optional().nullable(),
  sortOrder:    z.number().int().optional(),
  isActive:     z.boolean().optional(),
}).refine(d => d.fromNodeId !== d.toNodeId, { message: "Self-edges are not allowed" });

export const zPatchEdge = z.object({
  fromNodeId:   z.number().int().positive().optional(),
  toNodeId:     z.number().int().positive().optional(),
  relationType: z.enum(RELATION_TYPES).optional(),
  ruleText:     z.string().max(1000).optional().nullable(),
  sortOrder:    z.number().int().optional(),
  isActive:     z.boolean().optional(),
}).superRefine((d, ctx) => {
  if (d.fromNodeId !== undefined && d.toNodeId !== undefined && d.fromNodeId === d.toNodeId) {
    ctx.addIssue({ code: "custom", message: "Self-edges are not allowed" });
  }
}).refine(d => Object.keys(d).length > 0, { message: "No valid fields" });

export const zCoveragePatch = z.object({
  status: z.enum(["INDEPENDENT", "UNDECIDED"] as const),
  note:   z.string().max(2000).optional().nullable(),
});

// ── Allowed fields in live-resolved registry data ─────────────────────────────
// No price/name columns stored in ladder tables — resolved on every read.

const PRODUCT_ALLOW = [
  "id", "productId", "name", "slug", "productType", "category", "status",
  "price", "currency", "billingType", "visibility", "standaloneEnabled",
  "subscriptionEnabled", "gaiaEnabled", "shortDescription",
] as const;

const PACKAGE_ALLOW = [
  "id", "packageId", "name", "slug", "status", "price", "currency",
  "durationValue", "durationUnit", "description",
] as const;

function pickProduct(row: any) {
  return Object.fromEntries(PRODUCT_ALLOW.map(k => [k, row[k]]));
}

function pickPackage(row: any) {
  return Object.fromEntries(PACKAGE_ALLOW.map(k => [k, row[k]]));
}

async function resolveProduct(productRegistryId: string) {
  const [row] = await db.select().from(productRegistry)
    .where(eq(productRegistry.productId, productRegistryId));
  return row ? pickProduct(row) : null;
}

async function resolvePackage(packageRegistryId: string) {
  const [row] = await db.select().from(packageRegistry)
    .where(eq(packageRegistry.packageId, packageRegistryId));
  return row ? pickPackage(row) : null;
}

async function resolveNodes(nodes: any[]) {
  return Promise.all(nodes.map(async (n) => {
    const out: any = { ...n };
    if (n.nodeType === "PRODUCT" && n.productRegistryId) {
      out.product = await resolveProduct(n.productRegistryId);
    } else if (n.nodeType === "PACKAGE" && n.packageRegistryId) {
      out.package = await resolvePackage(n.packageRegistryId);
    }
    return out;
  }));
}

// ── Graph warnings ─────────────────────────────────────────────────────────────
// UI can be validation-aware: active PLACEHOLDER nodes, dangling nodes,
// no active outgoing relationships.

function computeWarnings(nodes: any[], edges: any[]): string[] {
  const warnings: string[] = [];

  const activeNodes = nodes.filter(n => n.isActive);
  const activeEdges = edges.filter(e => e.isActive);
  const connectedFromIds = new Set(activeEdges.map(e => e.fromNodeId));
  const connectedToIds   = new Set(activeEdges.map(e => e.toNodeId));

  // Active PLACEHOLDERs warn UI they need to be replaced
  const activePlaceholders = activeNodes.filter(n => n.nodeType === "PLACEHOLDER");
  if (activePlaceholders.length > 0) {
    warnings.push(`${activePlaceholders.length} node PLACEHOLDER aktif perlu dipetakan ke produk atau package Registry`);
  }

  // Dangling nodes: active nodes with no active incoming OR outgoing edges
  // (excluding lone trigger which intentionally has no incoming)
  const danglingNodes = activeNodes.filter(n => {
    const hasOut = connectedFromIds.has(n.id);
    const hasIn  = connectedToIds.has(n.id);
    const isTrigger = n.nodeType === "TRIGGER";
    return !hasOut && !hasIn && !isTrigger;
  });
  if (danglingNodes.length > 0) {
    warnings.push(`${danglingNodes.length} node aktif belum terhubung ke relasi mana pun`);
  }

  // A ladder with multiple active nodes but no relationship cannot express a journey.
  // Individual terminal nodes are valid and must not be treated as errors.
  if (activeNodes.length > 1 && activeEdges.length === 0) {
    warnings.push("Ladder belum memiliki relasi aktif");
  }

  return warnings;
}

// ── Ladder graph loader with warnings ─────────────────────────────────────────

async function getLadderWithGraph(ladderId: number) {
  const [ladder] = await db.select().from(salesLadders)
    .where(eq(salesLadders.id, ladderId));
  if (!ladder) return null;

  const [nodes, edges] = await Promise.all([
    db.select().from(salesLadderNodes)
      .where(eq(salesLadderNodes.ladderId, ladderId))
      .orderBy(asc(salesLadderNodes.sortOrder), asc(salesLadderNodes.id)),
    db.select().from(salesLadderEdges)
      .where(eq(salesLadderEdges.ladderId, ladderId))
      .orderBy(asc(salesLadderEdges.sortOrder), asc(salesLadderEdges.id)),
  ]);

  const resolvedNodes = await resolveNodes(nodes);
  const warnings = computeWarnings(resolvedNodes, edges);

  return { ...ladder, nodes: resolvedNodes, edges, warnings };
}

// ── Inventory builder: ACTIVE products + coverage + ladderRefs ────────────────

async function buildInventory() {
  // All ACTIVE products, sorted by productId
  const products = await db.select().from(productRegistry)
    .where(eq(productRegistry.status, "ACTIVE"))
    .orderBy(asc(productRegistry.productId));

  // Non-ARCHIVED ladders: compute which product_ids are MAPPED
  const nonArchivedLadders = await db.select({
    id:   salesLadders.id,
    name: salesLadders.name,
    slug: salesLadders.slug,
  }).from(salesLadders).where(ne(salesLadders.status, "ARCHIVED"));

  const ladderIds = nonArchivedLadders.map(l => l.id);

  // Map: productId -> list of ladder refs (id, name, slug, stage)
  const ladderRefMap = new Map<string, Array<{ id: number; name: string; slug: string; stage: string }>>();

  if (ladderIds.length > 0) {
    const mappedNodes = await db.select({
      productRegistryId: salesLadderNodes.productRegistryId,
      ladderId:          salesLadderNodes.ladderId,
      stage:             salesLadderNodes.stage,
    }).from(salesLadderNodes).where(
      and(
        inArray(salesLadderNodes.ladderId, ladderIds),
        isNotNull(salesLadderNodes.productRegistryId),
        eq(salesLadderNodes.isActive, true),
      )
    );

    const ladderById = new Map(nonArchivedLadders.map(l => [l.id, l]));
    for (const n of mappedNodes) {
      if (!n.productRegistryId) continue;
      const ldr = ladderById.get(n.ladderId);
      if (!ldr) continue;
      if (!ladderRefMap.has(n.productRegistryId)) ladderRefMap.set(n.productRegistryId, []);
      ladderRefMap.get(n.productRegistryId)!.push({
        id:    ldr.id,
        name:  ldr.name,
        slug:  ldr.slug,
        stage: n.stage,
      });
    }
  }

  // Load explicit coverage overrides (INDEPENDENT | UNDECIDED)
  const coverageRows = await db.select().from(salesLadderCoverage);
  const coverageMap = new Map(coverageRows.map(c => [c.productRegistryId, c]));

  return products.map(p => {
    const pf = pickProduct(p);
    const refs = ladderRefMap.get(p.productId) ?? [];
    const isMapped = refs.length > 0;

    let coverageStatus: string;
    let coverageNote: string | null = null;

    if (isMapped) {
      coverageStatus = "MAPPED";
    } else {
      const override = coverageMap.get(p.productId);
      coverageStatus = override?.coverageStatus ?? "UNDECIDED";
      coverageNote   = override?.note ?? null;
    }

    return { ...pf, coverageStatus, coverageNote, ladderRefs: refs };
  });
}

// ── Summary ───────────────────────────────────────────────────────────────────

async function buildSummary(inventory: ReturnType<typeof buildInventory> extends Promise<infer T> ? T : never) {
  const [ladderRows, nodeRows, edgeRows] = await Promise.all([
    db.select({ status: salesLadders.status }).from(salesLadders),
    db.select({ id: salesLadderNodes.id }).from(salesLadderNodes),
    db.select({ id: salesLadderEdges.id }).from(salesLadderEdges),
  ]);
  return {
    totalLadders:        ladderRows.length,
    activeLadders:       ladderRows.filter(l => l.status === "ACTIVE").length,
    draftLadders:        ladderRows.filter(l => l.status === "DRAFT").length,
    archivedLadders:     ladderRows.filter(l => l.status === "ARCHIVED").length,
    totalNodes:          nodeRows.length,
    totalEdges:          edgeRows.length,
    totalActiveProducts: inventory.length,
    mappedProducts:      inventory.filter(i => i.coverageStatus === "MAPPED").length,
    independentProducts: inventory.filter(i => i.coverageStatus === "INDEPENDENT").length,
    undecidedProducts:   inventory.filter(i => i.coverageStatus === "UNDECIDED").length,
  };
}

// ── Route registration ────────────────────────────────────────────────────────

export function registerSalesLadderRoutes(app: Express, deps: {
  isAuthenticated: any;
  getDbRole: (req: any) => Promise<string>;
}) {
  const { isAuthenticated, getDbRole } = deps;

  // Guard: superadmin only (admin → 403, anon → 401 from isAuthenticated)
  const requireSuperAdmin = async (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ error: "Tidak terautentikasi" });
    try {
      const role = await getDbRole(req);
      if (role !== "superadmin") return res.status(403).json({ error: "Akses ditolak. Hanya Super Admin." });
      next();
    } catch {
      return res.status(403).json({ error: "Akses ditolak." });
    }
  };

  const guard = [isAuthenticated, requireSuperAdmin];

  // ── GET /api/admin/sales-ladder ───────────────────────────────────────────
  app.get("/api/admin/sales-ladder", ...guard, async (_req: any, res: any) => {
    try {
      const inventory = await buildInventory();

      const [ladderRows, pkgRows, summary] = await Promise.all([
        db.select().from(salesLadders).orderBy(asc(salesLadders.id)),
        db.select().from(packageRegistry).orderBy(asc(packageRegistry.id)),
        buildSummary(inventory),
      ]);

      const ladders = await Promise.all(ladderRows.map(l => getLadderWithGraph(l.id)));
      const packages = pkgRows.map(p => pickPackage(p));

      res.json({
        stages:         LADDER_STAGES,
        relationTypes:  RELATION_TYPES,
        ladderStatuses: LADDER_STATUSES,
        ladders,
        inventory,
        packages,
        summary,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/admin/sales-ladder/ladders ──────────────────────────────────
  app.post("/api/admin/sales-ladder/ladders", ...guard, async (req: any, res: any) => {
    try {
      const parsed = zCreateLadder.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join("; ") });
      const { name, description } = parsed.data;
      const slug = slugify(name);
      const [row] = await db.insert(salesLadders)
        .values({ name, slug, description: description ?? null, status: "DRAFT" })
        .returning();
      res.status(201).json(await getLadderWithGraph(row.id));
    } catch (err: any) {
      if (String(err.code) === "23505") return res.status(409).json({ error: "Ladder dengan slug ini sudah ada." });
      res.status(500).json({ error: err.message });
    }
  });

  // ── PATCH /api/admin/sales-ladder/ladders/:id ─────────────────────────────
  app.patch("/api/admin/sales-ladder/ladders/:id", ...guard, async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      const [existing] = await db.select().from(salesLadders).where(eq(salesLadders.id, id));
      if (!existing) return res.status(404).json({ error: "Ladder tidak ditemukan" });

      const parsed = zPatchLadder.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join("; ") });

      const patch: any = { updatedAt: new Date() };
      if (parsed.data.name      !== undefined) patch.name      = parsed.data.name;
      if (parsed.data.description !== undefined) patch.description = parsed.data.description;
      if (parsed.data.status    !== undefined) patch.status    = parsed.data.status;

      const [updated] = await db.update(salesLadders).set(patch).where(eq(salesLadders.id, id)).returning();
      res.json(await getLadderWithGraph(updated.id));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── DELETE /api/admin/sales-ladder/ladders/:id ────────────────────────────
  app.delete("/api/admin/sales-ladder/ladders/:id", ...guard, async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      const [existing] = await db.select().from(salesLadders).where(eq(salesLadders.id, id));
      if (!existing) return res.status(404).json({ error: "Ladder tidak ditemukan" });
      await db.delete(salesLadders).where(eq(salesLadders.id, id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/admin/sales-ladder/ladders/:id/preview ──────────────────────
  app.get("/api/admin/sales-ladder/ladders/:id/preview", ...guard, async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await getLadderWithGraph(id);
      if (!result) return res.status(404).json({ error: "Ladder tidak ditemukan" });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/admin/sales-ladder/ladders/:id/nodes ───────────────────────
  app.post("/api/admin/sales-ladder/ladders/:id/nodes", ...guard, async (req: any, res: any) => {
    try {
      const ladderId = parseInt(req.params.id, 10);
      const [ladder] = await db.select().from(salesLadders).where(eq(salesLadders.id, ladderId));
      if (!ladder) return res.status(404).json({ error: "Ladder tidak ditemukan" });

      const parsed = zCreateNode.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join("; ") });
      const d = parsed.data;

      // Validate registry references exist
      if (d.productRegistryId) {
        const [prod] = await db.select({ id: productRegistry.id }).from(productRegistry)
          .where(eq(productRegistry.productId, d.productRegistryId));
        if (!prod) return res.status(400).json({ error: `Product '${d.productRegistryId}' tidak ditemukan di registry` });
      }
      if (d.packageRegistryId) {
        const [pkg] = await db.select({ id: packageRegistry.id }).from(packageRegistry)
          .where(eq(packageRegistry.packageId, d.packageRegistryId));
        if (!pkg) return res.status(400).json({ error: `Package '${d.packageRegistryId}' tidak ditemukan di registry` });
      }

      const [node] = await db.insert(salesLadderNodes).values({
        ladderId,
        stage:             d.stage,
        nodeType:          d.nodeType,
        productRegistryId: d.productRegistryId ?? null,
        packageRegistryId: d.packageRegistryId ?? null,
        label:             d.label ?? null,
        description:       d.description ?? null,
        sortOrder:         d.sortOrder ?? 0,
        isActive:          d.isActive ?? true,
      }).returning();

      const [resolved] = await resolveNodes([node]);
      res.status(201).json(resolved);
    } catch (err: any) {
      if (String(err.code) === "23505") return res.status(409).json({ error: "Product/Package sudah ada di ladder ini." });
      res.status(500).json({ error: err.message });
    }
  });

  // ── PATCH /api/admin/sales-ladder/nodes/:id ───────────────────────────────
  app.patch("/api/admin/sales-ladder/nodes/:id", ...guard, async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      const [existing] = await db.select().from(salesLadderNodes).where(eq(salesLadderNodes.id, id));
      if (!existing) return res.status(404).json({ error: "Node tidak ditemukan" });

      const parsed = zPatchNode.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join("; ") });
      const d = parsed.data;

      // Compute effective values after patch
      const effectiveType  = d.nodeType          ?? existing.nodeType;
      const effectiveProd  = d.productRegistryId !== undefined ? d.productRegistryId  : existing.productRegistryId;
      const effectivePkg   = d.packageRegistryId !== undefined ? d.packageRegistryId  : existing.packageRegistryId;
      const effectiveLabel = d.label             !== undefined ? d.label               : existing.label;

      // Re-validate cross-field constraints
      if (effectiveType === "PRODUCT") {
        if (!effectiveProd) return res.status(400).json({ error: "productRegistryId required for PRODUCT node" });
        if (effectivePkg)   return res.status(400).json({ error: "packageRegistryId must be absent for PRODUCT node" });
      } else if (effectiveType === "PACKAGE") {
        if (!effectivePkg)  return res.status(400).json({ error: "packageRegistryId required for PACKAGE node" });
        if (effectiveProd)  return res.status(400).json({ error: "productRegistryId must be absent for PACKAGE node" });
      } else {
        if (effectiveProd)  return res.status(400).json({ error: "productRegistryId must be absent for TRIGGER/PLACEHOLDER node" });
        if (effectivePkg)   return res.status(400).json({ error: "packageRegistryId must be absent for TRIGGER/PLACEHOLDER node" });
        if (!effectiveLabel?.trim()) return res.status(400).json({ error: "label required for TRIGGER/PLACEHOLDER node" });
      }

      // Validate new registry references exist
      if (d.productRegistryId) {
        const [prod] = await db.select({ id: productRegistry.id }).from(productRegistry)
          .where(eq(productRegistry.productId, d.productRegistryId));
        if (!prod) return res.status(400).json({ error: `Product '${d.productRegistryId}' tidak ditemukan di registry` });
      }
      if (d.packageRegistryId) {
        const [pkg] = await db.select({ id: packageRegistry.id }).from(packageRegistry)
          .where(eq(packageRegistry.packageId, d.packageRegistryId));
        if (!pkg) return res.status(400).json({ error: `Package '${d.packageRegistryId}' tidak ditemukan di registry` });
      }

      const patch: any = { updatedAt: new Date() };
      if (d.stage             !== undefined) patch.stage             = d.stage;
      if (d.nodeType          !== undefined) patch.nodeType          = d.nodeType;
      if (d.productRegistryId !== undefined) patch.productRegistryId = d.productRegistryId;
      if (d.packageRegistryId !== undefined) patch.packageRegistryId = d.packageRegistryId;
      if (d.label             !== undefined) patch.label             = d.label;
      if (d.description       !== undefined) patch.description       = d.description;
      if (d.sortOrder         !== undefined) patch.sortOrder         = d.sortOrder;
      if (d.isActive          !== undefined) patch.isActive          = d.isActive;

      const [updated] = await db.update(salesLadderNodes).set(patch).where(eq(salesLadderNodes.id, id)).returning();
      const [resolved] = await resolveNodes([updated]);
      res.json(resolved);
    } catch (err: any) {
      if (String(err.code) === "23505") return res.status(409).json({ error: "Product/Package sudah ada di ladder ini." });
      res.status(500).json({ error: err.message });
    }
  });

  // ── DELETE /api/admin/sales-ladder/nodes/:id ─────────────────────────────
  app.delete("/api/admin/sales-ladder/nodes/:id", ...guard, async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      const [existing] = await db.select().from(salesLadderNodes).where(eq(salesLadderNodes.id, id));
      if (!existing) return res.status(404).json({ error: "Node tidak ditemukan" });
      await db.delete(salesLadderNodes).where(eq(salesLadderNodes.id, id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/admin/sales-ladder/ladders/:id/edges ───────────────────────
  app.post("/api/admin/sales-ladder/ladders/:id/edges", ...guard, async (req: any, res: any) => {
    try {
      const ladderId = parseInt(req.params.id, 10);
      const [ladder] = await db.select().from(salesLadders).where(eq(salesLadders.id, ladderId));
      if (!ladder) return res.status(404).json({ error: "Ladder tidak ditemukan" });

      const parsed = zCreateEdge.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join("; ") });
      const d = parsed.data;

      // Both nodes must belong to this exact ladder
      const [fromNode] = await db.select().from(salesLadderNodes)
        .where(and(eq(salesLadderNodes.id, d.fromNodeId), eq(salesLadderNodes.ladderId, ladderId)));
      if (!fromNode) return res.status(400).json({ error: "fromNodeId tidak ditemukan di ladder ini" });

      const [toNode] = await db.select().from(salesLadderNodes)
        .where(and(eq(salesLadderNodes.id, d.toNodeId), eq(salesLadderNodes.ladderId, ladderId)));
      if (!toNode) return res.status(400).json({ error: "toNodeId tidak ditemukan di ladder ini" });

      const [edge] = await db.insert(salesLadderEdges).values({
        ladderId,
        fromNodeId:   d.fromNodeId,
        toNodeId:     d.toNodeId,
        relationType: d.relationType,
        ruleText:     d.ruleText ?? null,
        sortOrder:    d.sortOrder ?? 0,
        isActive:     d.isActive ?? true,
      }).returning();

      res.status(201).json(edge);
    } catch (err: any) {
      if (String(err.code) === "23505") return res.status(409).json({ error: "Edge duplikat: koneksi ini sudah ada." });
      res.status(500).json({ error: err.message });
    }
  });

  // ── PATCH /api/admin/sales-ladder/edges/:id ───────────────────────────────
  app.patch("/api/admin/sales-ladder/edges/:id", ...guard, async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      const [existing] = await db.select().from(salesLadderEdges).where(eq(salesLadderEdges.id, id));
      if (!existing) return res.status(404).json({ error: "Edge tidak ditemukan" });

      const parsed = zPatchEdge.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join("; ") });
      const d = parsed.data;

      const effectiveFromNodeId = d.fromNodeId ?? existing.fromNodeId;
      const effectiveToNodeId = d.toNodeId ?? existing.toNodeId;
      if (effectiveFromNodeId === effectiveToNodeId) {
        return res.status(400).json({ error: "Self-edges are not allowed" });
      }

      const [fromNode] = await db.select({ id: salesLadderNodes.id }).from(salesLadderNodes)
        .where(and(
          eq(salesLadderNodes.id, effectiveFromNodeId),
          eq(salesLadderNodes.ladderId, existing.ladderId),
        ));
      if (!fromNode) return res.status(400).json({ error: "fromNodeId tidak ditemukan di ladder ini" });

      const [toNode] = await db.select({ id: salesLadderNodes.id }).from(salesLadderNodes)
        .where(and(
          eq(salesLadderNodes.id, effectiveToNodeId),
          eq(salesLadderNodes.ladderId, existing.ladderId),
        ));
      if (!toNode) return res.status(400).json({ error: "toNodeId tidak ditemukan di ladder ini" });

      const patch: any = { updatedAt: new Date() };
      if (d.fromNodeId   !== undefined) patch.fromNodeId   = d.fromNodeId;
      if (d.toNodeId     !== undefined) patch.toNodeId     = d.toNodeId;
      if (d.relationType !== undefined) patch.relationType = d.relationType;
      if (d.ruleText     !== undefined) patch.ruleText     = d.ruleText;
      if (d.sortOrder    !== undefined) patch.sortOrder    = d.sortOrder;
      if (d.isActive     !== undefined) patch.isActive     = d.isActive;

      const [updated] = await db.update(salesLadderEdges).set(patch).where(eq(salesLadderEdges.id, id)).returning();
      res.json(updated);
    } catch (err: any) {
      if (String(err.code) === "23505") return res.status(409).json({ error: "Edge duplikat: koneksi ini sudah ada." });
      res.status(500).json({ error: err.message });
    }
  });

  // ── DELETE /api/admin/sales-ladder/edges/:id ──────────────────────────────
  app.delete("/api/admin/sales-ladder/edges/:id", ...guard, async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      const [existing] = await db.select().from(salesLadderEdges).where(eq(salesLadderEdges.id, id));
      if (!existing) return res.status(404).json({ error: "Edge tidak ditemukan" });
      await db.delete(salesLadderEdges).where(eq(salesLadderEdges.id, id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── PATCH /api/admin/sales-ladder/coverage/:productRegistryId ────────────
  // Accepts only INDEPENDENT | UNDECIDED. MAPPED is computed — reject with 409.
  app.patch("/api/admin/sales-ladder/coverage/:productRegistryId", ...guard, async (req: any, res: any) => {
    try {
      const { productRegistryId } = req.params;

      // Validate product exists in registry
      const [prod] = await db.select({ id: productRegistry.id, productId: productRegistry.productId })
        .from(productRegistry).where(eq(productRegistry.productId, productRegistryId));
      if (!prod) return res.status(404).json({ error: "Product tidak ditemukan di registry" });

      const parsed = zCoveragePatch.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join("; ") });
      const { status, note } = parsed.data;

      // MAPPED is computed: check if product currently appears in a non-ARCHIVED ladder node
      const nonArchivedLadders = await db.select({ id: salesLadders.id })
        .from(salesLadders).where(ne(salesLadders.status, "ARCHIVED"));
      const ladderIds = nonArchivedLadders.map(l => l.id);
      if (ladderIds.length > 0) {
        const [mappedNode] = await db.select({ id: salesLadderNodes.id })
          .from(salesLadderNodes)
          .where(and(
            inArray(salesLadderNodes.ladderId, ladderIds),
            eq(salesLadderNodes.productRegistryId, productRegistryId),
            eq(salesLadderNodes.isActive, true),
          ));
        if (mappedNode) {
          return res.status(409).json({
            error: "Product ini sudah MAPPED (tercakup oleh ladder aktif). Status MAPPED adalah computed dan tidak dapat diganti secara eksplisit. Hapus node ladder terkait terlebih dahulu.",
            coverageStatus: "MAPPED",
          });
        }
      }

      // Upsert explicit override
      const [existingRow] = await db.select().from(salesLadderCoverage)
        .where(eq(salesLadderCoverage.productRegistryId, productRegistryId));

      let row;
      if (existingRow) {
        [row] = await db.update(salesLadderCoverage)
          .set({ coverageStatus: status, note: note ?? null, updatedAt: new Date() })
          .where(eq(salesLadderCoverage.productRegistryId, productRegistryId))
          .returning();
      } else {
        [row] = await db.insert(salesLadderCoverage)
          .values({ productRegistryId, coverageStatus: status, note: note ?? null })
          .returning();
      }

      res.json(row);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
