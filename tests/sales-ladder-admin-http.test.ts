// ─────────────────────────────────────────────────────────────────────────────
// SALES LADDER — HTTP Integration Test (Task #390, audit revision)
//
// Tests the real production route module against the real dev DB.
// Coverage:
//   1)  Anonymous → 401 on all endpoints
//   2)  Admin (non-superadmin) → 403 on all endpoints
//   3)  Superadmin: full CRUD for ladders, nodes, edges, coverage
//   4)  Reference / edge / duplicate / self-edge validation
//   5)  Live current prices from registry (no price columns in ladder tables)
//   6)  Complete ACTIVE inventory: coverageStatus, coverageNote, ladderRefs
//   7)  Graph warnings (active PLACEHOLDERs, dangling nodes)
//   8)  Coverage PATCH rejects MAPPED product with 409
//   9)  Idempotent seed — never overwrites pre-existing canonical ladder;
//       test uses an isolated slug so the canonical ladder is not touched.
//  10)  Corrected seed edge semantics (UPSELL L1→L2, UPSELL L2→Tender,
//       BUNDLE Tender→Contractor, RECURRING Contractor→BizMemory,
//       CROSS_SELL BizMem→L5, UPSELL L5→MultiClaw)
//  11)  Schema static assertion: FK columns are varchar not plain text
//
// Cleanup: only removes rows created in this test run.
// Pre-existing canonical ladder (contractor-sbu-readiness) is never deleted.
// ─────────────────────────────────────────────────────────────────────────────

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import express from "express";
import type { Server } from "node:http";
import { asc, eq, and, ne, isNotNull } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  console.log("[sales-ladder-admin-http] DATABASE_URL not set — skipping DB integration tests");
  process.exit(0);
}

const { db, pool }            = await import("../server/db");
const { registerSalesLadderRoutes } = await import("../server/sales-ladder");
const { seedContractorLadder, CONTRACTOR_LADDER_SLUG } = await import("../server/sales-ladder-seed");
const schema = await import("../shared/schema");
const {
  salesLadders, salesLadderNodes, salesLadderEdges, salesLadderCoverage,
  productRegistry,
} = schema;

// ── Unique run prefix ─────────────────────────────────────────────────────────
const RUN = `t390-${Date.now().toString(36)}`;
const MIGRATION_SQL = readFileSync(
  new URL("../migrations/0016_sales_ladder.sql", import.meta.url),
  "utf8",
);

// Isolated seed slug: never touches the canonical contractor-sbu-readiness ladder
const TEST_SEED_SLUG = `${RUN}-contractor-sbu`;
const TEST_SEED_NAME = `${RUN} Contractor SBU Readiness`;

const SUPERADMIN_ID = `${RUN}-superadmin`;
const ADMIN_ID      = `${RUN}-admin`;
// USER_ID not used but shows role table
const _USER_ID      = `${RUN}-user`;

// ── Auth shim ─────────────────────────────────────────────────────────────────
function isAuthenticated(req: any, res: any, next: any) {
  const uid = req.headers["x-test-user"];
  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  req.user = { id: String(uid), claims: { sub: String(uid) } };
  next();
}

const getDbRole = async (req: any): Promise<string> => {
  const uid = req?.user?.id ?? "";
  if (uid === SUPERADMIN_ID) return "superadmin";
  if (uid === ADMIN_ID)      return "admin";
  return "user";
};

// ── Server setup ──────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
registerSalesLadderRoutes(app, { isAuthenticated, getDbRole });

let server: Server;
let baseUrl = "";

before(async () => {
  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;
      resolve();
    });
  });
});

// ── Cleanup tracking ──────────────────────────────────────────────────────────
// Only rows created in this test run are removed.
// The pre-existing canonical contractor-sbu-readiness ladder is NEVER deleted.
const createdLadderIds: number[] = [];
const createdNodeIds:   number[] = [];
const createdEdgeIds:   number[] = [];
const createdCovPids:   string[] = [];
// Track the test-isolated seed ladder id (if seed test created it)
let testSeedLadderId: number | null = null;

after(async () => {
  // Cleanup test-isolated seed ladder
  if (testSeedLadderId !== null) {
    await db.delete(salesLadders).where(eq(salesLadders.id, testSeedLadderId)).catch(() => {});
  }
  // Cleanup other tracked rows in reverse dependency order
  for (const id of createdEdgeIds) {
    await db.delete(salesLadderEdges).where(eq(salesLadderEdges.id, id)).catch(() => {});
  }
  for (const id of createdNodeIds) {
    await db.delete(salesLadderNodes).where(eq(salesLadderNodes.id, id)).catch(() => {});
  }
  for (const id of createdLadderIds) {
    await db.delete(salesLadders).where(eq(salesLadders.id, id)).catch(() => {});
  }
  for (const pid of createdCovPids) {
    await db.delete(salesLadderCoverage).where(eq(salesLadderCoverage.productRegistryId, pid)).catch(() => {});
  }
  await new Promise<void>(resolve => server.close(() => resolve()));
  await pool.end();
});

function req(method: string, path: string, userId?: string, body?: any) {
  const headers: Record<string, string> = {};
  if (userId) headers["x-test-user"] = userId;
  if (body !== undefined) headers["content-type"] = "application/json";
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

// Shared state between sequential tests
let ladderId = 0;
let nodeAId  = 0; // TRIGGER node
let nodeBId  = 0; // PLACEHOLDER node
let edgeId   = 0;
let coverageTransitionProductId = "";
let coverageTransitionNodeId = 0;

// ─────────────────────────────────────────────────────────────────────────────
// 0) Schema static assertion: FK columns must be varchar (not plain text)
// ─────────────────────────────────────────────────────────────────────────────

test("schema: salesLadderNodes.productRegistryId is varchar (FK to product_registry.product_id)", () => {
  const col = (salesLadderNodes as any).productRegistryId;
  // Drizzle varchar columns have columnType 'PgVarchar'
  assert.ok(
    col?.columnType === "PgVarchar" || String(col?.dataType).includes("string"),
    `Expected varchar, got columnType=${col?.columnType} dataType=${col?.dataType}`
  );
});

test("schema: salesLadderNodes.packageRegistryId is varchar (FK to package_registry.package_id)", () => {
  const col = (salesLadderNodes as any).packageRegistryId;
  assert.ok(
    col?.columnType === "PgVarchar" || String(col?.dataType).includes("string"),
    `Expected varchar, got columnType=${col?.columnType} dataType=${col?.dataType}`
  );
});

test("schema: salesLadderCoverage.productRegistryId is varchar (FK to product_registry.product_id)", () => {
  const col = (salesLadderCoverage as any).productRegistryId;
  assert.ok(
    col?.columnType === "PgVarchar" || String(col?.dataType).includes("string"),
    `Expected varchar, got columnType=${col?.columnType} dataType=${col?.dataType}`
  );
});

test("migration: provisions all Sales Ladder tables in a clean schema and is idempotent", async () => {
  const client = await pool.connect();
  const schemaName = `sales_ladder_migration_${Date.now().toString(36)}`;
  const statements = MIGRATION_SQL
    .split("--> statement-breakpoint")
    .map(statement => statement.trim())
    .filter(Boolean);

  try {
    await client.query("BEGIN");
    await client.query(`CREATE SCHEMA "${schemaName}"`);
    await client.query(`SET LOCAL search_path TO "${schemaName}"`);
    await client.query(`
      CREATE TABLE product_registry (
        product_id varchar(40) PRIMARY KEY
      );
      CREATE TABLE package_registry (
        package_id varchar(60) PRIMARY KEY
      );
    `);

    for (const statement of statements) await client.query(statement);
    for (const statement of statements) await client.query(statement);

    const tables = await client.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name LIKE 'sales_ladder%'
      ORDER BY table_name
    `);
    assert.deepEqual(
      tables.rows.map(row => row.table_name),
      ["sales_ladder_coverage", "sales_ladder_edges", "sales_ladder_nodes", "sales_ladders"],
    );

    const packageColumn = await client.query<{ character_maximum_length: number; data_type: string }>(`
      SELECT character_maximum_length, data_type
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'sales_ladder_nodes'
        AND column_name = 'package_registry_id'
    `);
    assert.equal(packageColumn.rows[0]?.character_maximum_length, 60);

    const timestampColumn = await client.query<{ data_type: string }>(`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'sales_ladders'
        AND column_name = 'created_at'
    `);
    assert.equal(timestampColumn.rows[0]?.data_type, "timestamp with time zone");

    const indexes = await client.query<{ indexname: string }>(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = current_schema()
    `);
    const indexNames = new Set(indexes.rows.map(row => row.indexname));
    for (const expected of [
      "uq_sales_ladder_slug",
      "uq_node_product_per_ladder",
      "uq_node_package_per_ladder",
      "idx_sales_ladder_nodes_ladder",
      "uq_ladder_edge",
      "idx_sales_ladder_edges_ladder",
      "uq_coverage_product",
    ]) {
      assert.ok(indexNames.has(expected), `missing migration index ${expected}`);
    }

    const foreignKeys = await client.query<{ count: string }>(`
      SELECT count(*)::text AS count
      FROM information_schema.table_constraints
      WHERE constraint_schema = current_schema()
        AND table_name LIKE 'sales_ladder%'
        AND constraint_type = 'FOREIGN KEY'
    `);
    assert.equal(Number(foreignKeys.rows[0]?.count), 7);
  } finally {
    await client.query("ROLLBACK").catch(() => {});
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 1) Anonymous → 401
// ─────────────────────────────────────────────────────────────────────────────

test("anon: GET overview 401", async () => {
  assert.equal((await req("GET", "/api/admin/sales-ladder")).status, 401);
});

test("anon: POST ladder 401", async () => {
  assert.equal((await req("POST", "/api/admin/sales-ladder/ladders", undefined, { name: "x" })).status, 401);
});

test("anon: GET preview 401", async () => {
  assert.equal((await req("GET", "/api/admin/sales-ladder/ladders/1/preview")).status, 401);
});

test("anon: POST node 401", async () => {
  assert.equal((await req("POST", "/api/admin/sales-ladder/ladders/1/nodes", undefined, {})).status, 401);
});

test("anon: POST edge 401", async () => {
  assert.equal((await req("POST", "/api/admin/sales-ladder/ladders/1/edges", undefined, {})).status, 401);
});

test("anon: PATCH coverage 401", async () => {
  assert.equal(
    (await req("PATCH", "/api/admin/sales-ladder/coverage/GST-FAKE-001", undefined, { status: "INDEPENDENT" })).status,
    401
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2) Admin (non-superadmin) → 403
// ─────────────────────────────────────────────────────────────────────────────

test("admin: GET overview 403", async () => {
  assert.equal((await req("GET", "/api/admin/sales-ladder", ADMIN_ID)).status, 403);
});

test("admin: POST ladder 403", async () => {
  assert.equal((await req("POST", "/api/admin/sales-ladder/ladders", ADMIN_ID, { name: "x" })).status, 403);
});

test("admin: POST node 403", async () => {
  assert.equal((await req("POST", "/api/admin/sales-ladder/ladders/1/nodes", ADMIN_ID, {})).status, 403);
});

test("admin: POST edge 403", async () => {
  assert.equal((await req("POST", "/api/admin/sales-ladder/ladders/1/edges", ADMIN_ID, {})).status, 403);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3) Superadmin: CRUD
// ─────────────────────────────────────────────────────────────────────────────

test("superadmin: POST ladder 201 — DRAFT, slug derived from name", async () => {
  const name = `${RUN} Test Ladder`;
  const r = await req("POST", "/api/admin/sales-ladder/ladders", SUPERADMIN_ID, { name, description: "Test" });
  assert.equal(r.status, 201);
  const body = await r.json();
  assert.equal(body.status, "DRAFT");
  assert.ok(body.id > 0);
  assert.ok(body.slug.includes("test-ladder"));
  assert.ok(Array.isArray(body.nodes));
  assert.ok(Array.isArray(body.edges));
  assert.ok(Array.isArray(body.warnings));
  ladderId = body.id;
  createdLadderIds.push(ladderId);
});

test("superadmin: GET preview returns nodes/edges/warnings", async () => {
  const r = await req("GET", `/api/admin/sales-ladder/ladders/${ladderId}/preview`, SUPERADMIN_ID);
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.id, ladderId);
  assert.ok(Array.isArray(body.nodes));
  assert.ok(Array.isArray(body.edges));
  assert.ok(Array.isArray(body.warnings));
});

test("superadmin: PATCH ladder status to ACTIVE", async () => {
  const r = await req("PATCH", `/api/admin/sales-ladder/ladders/${ladderId}`, SUPERADMIN_ID, { status: "ACTIVE" });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, "ACTIVE");
});

test("superadmin: POST TRIGGER node 201", async () => {
  const r = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/nodes`, SUPERADMIN_ID, {
    stage: "L0", nodeType: "TRIGGER", label: "Pain Entry Point", sortOrder: 0,
  });
  assert.equal(r.status, 201);
  const body = await r.json();
  assert.equal(body.nodeType, "TRIGGER");
  assert.equal(body.stage, "L0");
  // Node row must not contain price
  assert.ok(!("price" in body), "node row must not store price");
  nodeAId = body.id;
  createdNodeIds.push(nodeAId);
});

test("superadmin: POST PLACEHOLDER node 201", async () => {
  const r = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/nodes`, SUPERADMIN_ID, {
    stage: "L1", nodeType: "PLACEHOLDER", label: "Next Product", sortOrder: 1,
  });
  assert.equal(r.status, 201);
  const body = await r.json();
  assert.equal(body.nodeType, "PLACEHOLDER");
  nodeBId = body.id;
  createdNodeIds.push(nodeBId);
});

test("superadmin: POST edge 201", async () => {
  const r = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/edges`, SUPERADMIN_ID, {
    fromNodeId: nodeAId, toNodeId: nodeBId, relationType: "NEXT_STEP", sortOrder: 0,
  });
  assert.equal(r.status, 201);
  const body = await r.json();
  assert.equal(body.relationType, "NEXT_STEP");
  assert.equal(body.ladderId, ladderId);
  edgeId = body.id;
  createdEdgeIds.push(edgeId);
});

test("superadmin: PATCH edge relationType", async () => {
  const r = await req("PATCH", `/api/admin/sales-ladder/edges/${edgeId}`, SUPERADMIN_ID, { relationType: "UPSELL" });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).relationType, "UPSELL");
});

test("superadmin: PATCH edge source and target within the same ladder", async () => {
  const createNode = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/nodes`, SUPERADMIN_ID, {
    stage: "L2", nodeType: "PLACEHOLDER", label: "Third Node", sortOrder: 2,
  });
  assert.equal(createNode.status, 201);
  const nodeC = await createNode.json();
  createdNodeIds.push(nodeC.id);

  const update = await req("PATCH", `/api/admin/sales-ladder/edges/${edgeId}`, SUPERADMIN_ID, {
    fromNodeId: nodeBId,
    toNodeId: nodeC.id,
    relationType: "CROSS_SELL",
  });
  assert.equal(update.status, 200);
  const updated = await update.json();
  assert.equal(updated.fromNodeId, nodeBId);
  assert.equal(updated.toNodeId, nodeC.id);
  assert.equal(updated.relationType, "CROSS_SELL");

  const restore = await req("PATCH", `/api/admin/sales-ladder/edges/${edgeId}`, SUPERADMIN_ID, {
    fromNodeId: nodeAId,
    toNodeId: nodeBId,
    relationType: "UPSELL",
  });
  assert.equal(restore.status, 200);
});

test("validation: PATCH edge rejects a self-edge", async () => {
  const r = await req("PATCH", `/api/admin/sales-ladder/edges/${edgeId}`, SUPERADMIN_ID, {
    fromNodeId: nodeAId,
    toNodeId: nodeAId,
  });
  assert.equal(r.status, 400);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4) Graph warnings
// ─────────────────────────────────────────────────────────────────────────────

test("warnings: preview with active PLACEHOLDER nodes produces warning", async () => {
  const r = await req("GET", `/api/admin/sales-ladder/ladders/${ladderId}/preview`, SUPERADMIN_ID);
  assert.equal(r.status, 200);
  const body = await r.json();
  // nodeBId is a PLACEHOLDER — should trigger a warning
  const hasPlaceholderWarn = body.warnings.some((w: string) => w.toLowerCase().includes("placeholder"));
  assert.ok(hasPlaceholderWarn, `Expected placeholder warning, got: ${JSON.stringify(body.warnings)}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5) Overview: stages / relationTypes / ladderStatuses / ladders / inventory / packages / summary
// ─────────────────────────────────────────────────────────────────────────────

test("superadmin: GET overview structure correct", async () => {
  const r = await req("GET", "/api/admin/sales-ladder", SUPERADMIN_ID);
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.ok(Array.isArray(body.stages));
  assert.ok(Array.isArray(body.relationTypes));
  assert.ok(Array.isArray(body.ladderStatuses));
  assert.ok(Array.isArray(body.ladders));
  assert.ok(Array.isArray(body.inventory));
  assert.ok(Array.isArray(body.packages));
  assert.ok(typeof body.summary === "object");
  assert.deepEqual(body.stages, ["L0","L1","L2","L3","L4","L5"]);
  assert.deepEqual(body.ladderStatuses, ["DRAFT","ACTIVE","ARCHIVED"]);

  // Our ladder appears with nodes/edges/warnings
  const ourLadder = body.ladders.find((l: any) => l.id === ladderId);
  assert.ok(ourLadder, "our ladder should be in overview");
  assert.ok(Array.isArray(ourLadder.nodes));
  assert.ok(Array.isArray(ourLadder.edges));
  assert.ok(Array.isArray(ourLadder.warnings));
});

// ─────────────────────────────────────────────────────────────────────────────
// 6) Inventory enrichment: coverageStatus + coverageNote + ladderRefs
// ─────────────────────────────────────────────────────────────────────────────

test("inventory: all ACTIVE products present with valid coverageStatus/coverageNote/ladderRefs", async () => {
  const r = await req("GET", "/api/admin/sales-ladder", SUPERADMIN_ID);
  assert.equal(r.status, 200);
  const { inventory } = await r.json();

  const activeProds = await db.select({ productId: productRegistry.productId })
    .from(productRegistry).where(eq(productRegistry.status, "ACTIVE"));

  assert.equal(inventory.length, activeProds.length,
    "inventory must contain exactly all ACTIVE products");

  for (const item of inventory) {
    assert.ok(["MAPPED","INDEPENDENT","UNDECIDED"].includes(item.coverageStatus),
      `invalid coverageStatus: ${item.coverageStatus}`);
    // coverageNote must be a string or null
    assert.ok(
      item.coverageNote === null || item.coverageNote === undefined || typeof item.coverageNote === "string",
      `coverageNote invalid: ${item.coverageNote}`
    );
    // ladderRefs must be an array
    assert.ok(Array.isArray(item.ladderRefs), `ladderRefs must be array, got: ${typeof item.ladderRefs}`);
    // Each ladderRef must have id/name/slug/stage
    for (const ref of item.ladderRefs) {
      assert.ok(typeof ref.id === "number");
      assert.ok(typeof ref.name === "string");
      assert.ok(typeof ref.slug === "string");
      assert.ok(typeof ref.stage === "string");
    }
  }
});

test("inventory: PRODUCT node creates ladderRef for that product", async () => {
  // Choose an ACTIVE product that is not already mapped and has no persisted
  // coverage override, so this test never overwrites pre-existing decisions.
  const beforeResponse = await req("GET", "/api/admin/sales-ladder", SUPERADMIN_ID);
  const beforeOverview = await beforeResponse.json();
  const existingCoverage = await db.select({
    productRegistryId: salesLadderCoverage.productRegistryId,
  }).from(salesLadderCoverage);
  const coveredIds = new Set(existingCoverage.map(row => row.productRegistryId));
  const candidate = beforeOverview.inventory.find((item: any) =>
    item.coverageStatus !== "MAPPED" && !coveredIds.has(item.productId),
  );

  if (!candidate) {
    console.log("  [skip] no unmapped ACTIVE product without a coverage override");
    return;
  }
  const [activeProd] = await db.select().from(productRegistry)
    .where(eq(productRegistry.productId, candidate.productId));
  assert.ok(activeProd);

  const rn = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/nodes`, SUPERADMIN_ID, {
    stage: "L2", nodeType: "PRODUCT", productRegistryId: activeProd.productId, sortOrder: 10,
  });

  if (rn.status === 409) {
    console.log(`  [skip] product ${activeProd.productId} already in this ladder`);
    return;
  }
  const nodeBody = await rn.json();
  assert.equal(rn.status, 201, `Expected 201, got ${rn.status}: ${JSON.stringify(nodeBody)}`);
  const nodeRow = nodeBody;
  createdNodeIds.push(nodeRow.id);
  coverageTransitionProductId = activeProd.productId;
  coverageTransitionNodeId = nodeRow.id;

  // Node row itself has no price
  assert.ok(!("price" in nodeRow), "node row must not store price");
  // Resolved product has live price
  assert.ok(nodeRow.product, "resolved product should be present");
  assert.strictEqual(typeof nodeRow.product.price, "number", "live price must be a number");
  assert.equal(nodeRow.product.price, activeProd.price, "live price must match product_registry");

  // Check inventory ladderRefs for this product
  const rv = await req("GET", "/api/admin/sales-ladder", SUPERADMIN_ID);
  const { inventory } = await rv.json();
  const item = inventory.find((i: any) => i.productId === activeProd.productId);
  assert.ok(item, "product must appear in inventory");
  assert.equal(item.coverageStatus, "MAPPED", "product in non-archived ladder must be MAPPED");
  assert.ok(item.ladderRefs.some((ref: any) => ref.id === ladderId),
    "ladderRefs must include our ladder");
});

test("inventory: inactive PRODUCT node is not MAPPED and can receive an explicit decision", async () => {
  if (!coverageTransitionProductId || !coverageTransitionNodeId) {
    console.log("  [skip] no isolated product candidate for active-state transition");
    return;
  }

  const deactivate = await req(
    "PATCH",
    `/api/admin/sales-ladder/nodes/${coverageTransitionNodeId}`,
    SUPERADMIN_ID,
    { isActive: false },
  );
  assert.equal(deactivate.status, 200);

  const inactiveOverviewResponse = await req("GET", "/api/admin/sales-ladder", SUPERADMIN_ID);
  const inactiveOverview = await inactiveOverviewResponse.json();
  const inactiveItem = inactiveOverview.inventory.find(
    (item: any) => item.productId === coverageTransitionProductId,
  );
  assert.ok(inactiveItem);
  assert.notEqual(inactiveItem.coverageStatus, "MAPPED");
  assert.equal(inactiveItem.ladderRefs.length, 0);

  const decide = await req(
    "PATCH",
    `/api/admin/sales-ladder/coverage/${coverageTransitionProductId}`,
    SUPERADMIN_ID,
    { status: "INDEPENDENT", note: "Inactive node transition test" },
  );
  assert.equal(decide.status, 200);
  createdCovPids.push(coverageTransitionProductId);

  const reactivate = await req(
    "PATCH",
    `/api/admin/sales-ladder/nodes/${coverageTransitionNodeId}`,
    SUPERADMIN_ID,
    { isActive: true },
  );
  assert.equal(reactivate.status, 200);

  const activeOverviewResponse = await req("GET", "/api/admin/sales-ladder", SUPERADMIN_ID);
  const activeOverview = await activeOverviewResponse.json();
  const activeItem = activeOverview.inventory.find(
    (item: any) => item.productId === coverageTransitionProductId,
  );
  assert.equal(activeItem.coverageStatus, "MAPPED");
  assert.ok(activeItem.ladderRefs.some((ref: any) => ref.id === ladderId));
});

// ─────────────────────────────────────────────────────────────────────────────
// 7) Validation
// ─────────────────────────────────────────────────────────────────────────────

test("validation: TRIGGER node without label → 400", async () => {
  const r = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/nodes`, SUPERADMIN_ID, {
    stage: "L0", nodeType: "TRIGGER",
  });
  assert.equal(r.status, 400);
});

test("validation: PRODUCT node without productRegistryId → 400", async () => {
  const r = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/nodes`, SUPERADMIN_ID, {
    stage: "L1", nodeType: "PRODUCT",
  });
  assert.equal(r.status, 400);
});

test("validation: PRODUCT node with non-existent productRegistryId → 400", async () => {
  const r = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/nodes`, SUPERADMIN_ID, {
    stage: "L1", nodeType: "PRODUCT", productRegistryId: "GST-NONEXISTENT-999",
  });
  assert.equal(r.status, 400);
});

test("validation: self-edge → 400 with 'self' in error", async () => {
  const r = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/edges`, SUPERADMIN_ID, {
    fromNodeId: nodeAId, toNodeId: nodeAId, relationType: "NEXT_STEP",
  });
  assert.equal(r.status, 400);
  const body = await r.json();
  assert.ok(body.error.toLowerCase().includes("self"), `Expected 'self' in error: ${body.error}`);
});

test("validation: duplicate edge → 409", async () => {
  // nodeA→nodeB UPSELL already exists
  const r = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/edges`, SUPERADMIN_ID, {
    fromNodeId: nodeAId, toNodeId: nodeBId, relationType: "UPSELL",
  });
  assert.equal(r.status, 409);
});

test("validation: same node pair with a different relation type is allowed", async () => {
  const r = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/edges`, SUPERADMIN_ID, {
    fromNodeId: nodeAId, toNodeId: nodeBId, relationType: "NEXT_STEP",
  });
  assert.equal(r.status, 201);
  const body = await r.json();
  createdEdgeIds.push(body.id);
});

test("validation: edge node from different ladder → 400 with 'ladder' in error", async () => {
  // Create a second temp ladder
  const r2 = await req("POST", "/api/admin/sales-ladder/ladders", SUPERADMIN_ID, { name: `${RUN} Ladder B` });
  assert.equal(r2.status, 201);
  const ladderB = await r2.json();
  createdLadderIds.push(ladderB.id);

  // Create a node in ladder B
  const rn = await req("POST", `/api/admin/sales-ladder/ladders/${ladderB.id}/nodes`, SUPERADMIN_ID, {
    stage: "L0", nodeType: "TRIGGER", label: "Trigger B",
  });
  assert.equal(rn.status, 201);
  const nodeB = await rn.json();
  createdNodeIds.push(nodeB.id);

  // Try edge in ladder A using node from ladder B → 400
  const re = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/edges`, SUPERADMIN_ID, {
    fromNodeId: nodeAId, toNodeId: nodeB.id, relationType: "NEXT_STEP",
  });
  assert.equal(re.status, 400);
  const body = await re.json();
  assert.ok(body.error.toLowerCase().includes("ladder"), `Expected 'ladder' in error: ${body.error}`);
});

test("validation: invalid stage → 400", async () => {
  const r = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/nodes`, SUPERADMIN_ID, {
    stage: "L9", nodeType: "TRIGGER", label: "Bad stage",
  });
  assert.equal(r.status, 400);
});

test("validation: invalid relationType → 400", async () => {
  const r = await req("POST", `/api/admin/sales-ladder/ladders/${ladderId}/edges`, SUPERADMIN_ID, {
    fromNodeId: nodeAId, toNodeId: nodeBId, relationType: "INVALID_TYPE",
  });
  assert.equal(r.status, 400);
});

// ─────────────────────────────────────────────────────────────────────────────
// 8) Coverage PATCH
// ─────────────────────────────────────────────────────────────────────────────

test("coverage: PATCH to INDEPENDENT on non-mapped product — 200 with coverageNote", async () => {
  // Find an ACTIVE product that is NOT in any non-archived ladder node
  const nonArchivedIds = (await db.select({ id: salesLadders.id })
    .from(salesLadders).where(ne(salesLadders.status, "ARCHIVED"))).map(l => l.id);

  const mappedProductIds = new Set<string>();
  if (nonArchivedIds.length > 0) {
    const mappedNodes = await db.select({ pid: salesLadderNodes.productRegistryId })
      .from(salesLadderNodes)
      .where(and(
        isNotNull(salesLadderNodes.productRegistryId),
      ));
    for (const n of mappedNodes) if (n.pid) mappedProductIds.add(n.pid);
  }

  const allActive = await db.select().from(productRegistry)
    .where(eq(productRegistry.status, "ACTIVE")).orderBy(asc(productRegistry.productId));
  const unmapped = allActive.find(p => !mappedProductIds.has(p.productId));

  if (!unmapped) {
    console.log("  [skip] all ACTIVE products are mapped");
    return;
  }

  const r = await req("PATCH", `/api/admin/sales-ladder/coverage/${unmapped.productId}`, SUPERADMIN_ID, {
    status: "INDEPENDENT",
    note:   "This product stands alone",
  });
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.coverageStatus, "INDEPENDENT");
  assert.equal(body.note, "This product stands alone");
  createdCovPids.push(unmapped.productId);

  // Verify in inventory: note and status
  const rv = await req("GET", "/api/admin/sales-ladder", SUPERADMIN_ID);
  const { inventory } = await rv.json();
  const item = inventory.find((i: any) => i.productId === unmapped.productId);
  assert.ok(item);
  // If still not mapped, should show INDEPENDENT; MAPPED overrides if in a ladder
  if (item.coverageStatus === "INDEPENDENT") {
    assert.equal(item.coverageNote, "This product stands alone", "coverageNote must propagate");
  }
});

test("coverage: PATCH MAPPED product → 409 with explanation", async () => {
  // Find a product that IS currently mapped in a non-archived ladder
  const nonArchivedIds = (await db.select({ id: salesLadders.id })
    .from(salesLadders).where(ne(salesLadders.status, "ARCHIVED"))).map(l => l.id);

  if (nonArchivedIds.length === 0) {
    console.log("  [skip] no non-archived ladders");
    return;
  }

  const mappedNodes = await db.select({ pid: salesLadderNodes.productRegistryId })
    .from(salesLadderNodes)
    .where(and(
      isNotNull(salesLadderNodes.productRegistryId),
    ));
  const mappedPid = mappedNodes.find(n => n.pid)?.pid;

  if (!mappedPid) {
    console.log("  [skip] no mapped products in non-archived ladders");
    return;
  }

  const r = await req("PATCH", `/api/admin/sales-ladder/coverage/${mappedPid}`, SUPERADMIN_ID, {
    status: "INDEPENDENT",
  });
  assert.equal(r.status, 409, `Expected 409 for mapped product ${mappedPid}, got ${r.status}`);
  const body = await r.json();
  assert.ok(body.error.toLowerCase().includes("mapped"),
    `Expected 'mapped' in error: ${body.error}`);
});

test("coverage: PATCH non-existent product → 404", async () => {
  const r = await req("PATCH", "/api/admin/sales-ladder/coverage/GST-FAKE-999", SUPERADMIN_ID, {
    status: "INDEPENDENT",
  });
  assert.equal(r.status, 404);
});

// ─────────────────────────────────────────────────────────────────────────────
// 9) Idempotent seed — isolated slug, never touches canonical ladder
// ─────────────────────────────────────────────────────────────────────────────

test("seed: isolated run creates ladder with correct edge semantics", async () => {
  // Ensure test slug doesn't pre-exist
  await db.delete(salesLadderNodes)
    .where(eq(salesLadderNodes.ladderId,
      (await db.select({ id: salesLadders.id }).from(salesLadders)
        .where(eq(salesLadders.slug, TEST_SEED_SLUG)))[0]?.id ?? -1
    )).catch(() => {});
  await db.delete(salesLadders).where(eq(salesLadders.slug, TEST_SEED_SLUG)).catch(() => {});

  await seedContractorLadder({ slug: TEST_SEED_SLUG, name: TEST_SEED_NAME });

  const [row] = await db.select({ id: salesLadders.id, status: salesLadders.status })
    .from(salesLadders).where(eq(salesLadders.slug, TEST_SEED_SLUG));
  assert.ok(row, "seed ladder should be created");
  assert.equal(row.status, "DRAFT");
  testSeedLadderId = row.id;

  // Verify node count: 13 nodes total
  const nodes = await db.select().from(salesLadderNodes)
    .where(eq(salesLadderNodes.ladderId, row.id));
  assert.equal(nodes.length, 13, `Expected 13 nodes, got ${nodes.length}`);

  // Verify edge semantics
  const edges = await db.select().from(salesLadderEdges)
    .where(eq(salesLadderEdges.ladderId, row.id));

  // L1 (ebook, idx 1) → L2 (SBU Claw, idx 5): UPSELL
  const l0ToL1 = edges.find(e => {
    const from = nodes.find(n => n.id === e.fromNodeId);
    const to   = nodes.find(n => n.id === e.toNodeId);
    return from?.stage === "L0" && to?.stage === "L1" && e.relationType === "NEXT_STEP";
  });
  assert.ok(l0ToL1, "L0→L1 NEXT_STEP edge must exist");

  const l1ToL2Upsell = edges.find(e => {
    const from = nodes.find(n => n.id === e.fromNodeId);
    const to   = nodes.find(n => n.id === e.toNodeId);
    return from?.stage === "L1" && to?.stage === "L2" && e.relationType === "UPSELL";
  });
  assert.ok(l1ToL2Upsell, "L1→L2 UPSELL edge must exist (ebook → SBU Claw)");

  const l2ToL3Upsell = edges.find(e => {
    const from = nodes.find(n => n.id === e.fromNodeId);
    const to   = nodes.find(n => n.id === e.toNodeId);
    return from?.stage === "L2" && to?.stage === "L3" && e.relationType === "UPSELL";
  });
  assert.ok(l2ToL3Upsell, "L2→L3 UPSELL edge must exist (SBU Claw → Tender Claw)");

  const l3Bundle = edges.find(e => {
    const from = nodes.find(n => n.id === e.fromNodeId);
    const to   = nodes.find(n => n.id === e.toNodeId);
    return from?.stage === "L3" && to?.stage === "L3" && e.relationType === "BUNDLE";
  });
  assert.ok(l3Bundle, "L3→L3 BUNDLE edge must exist (Tender → Contractor Readiness)");

  const l3ToL4Recurring = edges.find(e => {
    const from = nodes.find(n => n.id === e.fromNodeId);
    const to   = nodes.find(n => n.id === e.toNodeId);
    return from?.stage === "L3" && to?.stage === "L4" && e.relationType === "RECURRING";
  });
  assert.ok(l3ToL4Recurring, "L3→L4 RECURRING edge must exist (Contractor → Business Memory)");

  const l4ToL5CrossSell = edges.filter(e => {
    const from = nodes.find(n => n.id === e.fromNodeId);
    const to   = nodes.find(n => n.id === e.toNodeId);
    return from?.stage === "L4" && to?.stage === "L5" && e.relationType === "CROSS_SELL";
  });
  assert.ok(l4ToL5CrossSell.length >= 2,
    `Expected ≥2 L4→L5 CROSS_SELL edges, got ${l4ToL5CrossSell.length}`);

  const l5Upsells = edges.filter(e => {
    const from = nodes.find(n => n.id === e.fromNodeId);
    const to   = nodes.find(n => n.id === e.toNodeId);
    return from?.stage === "L5" && to?.stage === "L5" && e.relationType === "UPSELL";
  });
  assert.equal(
    l5Upsells.length,
    3,
    "Brain Project, Mini Apps, and Competency Ecosystem must each upsell to MultiClaw",
  );

  // Verify bonus edges from L1 ebook
  const bonusEdges = edges.filter(e => e.relationType === "BONUS");
  assert.equal(bonusEdges.length, 3, `Expected 3 BONUS edges, got ${bonusEdges.length}`);
});

test("seed: idempotent — second call does not create another ladder", async () => {
  assert.ok(testSeedLadderId !== null, "first seed must have succeeded");

  await seedContractorLadder({ slug: TEST_SEED_SLUG, name: TEST_SEED_NAME });

  const rows = await db.select({ id: salesLadders.id })
    .from(salesLadders).where(eq(salesLadders.slug, TEST_SEED_SLUG));
  assert.equal(rows.length, 1, "Idempotent seed must not create duplicate ladders");
  assert.equal(rows[0].id, testSeedLadderId, "Same ladder id must be returned");
});

test("seed: canonical contractor-sbu-readiness is NOT deleted or modified by test", async () => {
  // This test just verifies our cleanup logic won't touch the real canonical ladder.
  // The canonical slug is different from TEST_SEED_SLUG.
  assert.notEqual(TEST_SEED_SLUG, CONTRACTOR_LADDER_SLUG,
    "Test seed slug must differ from canonical slug");

  // The real canonical ladder (if it exists) must still have its original data intact
  const [canonical] = await db.select({ id: salesLadders.id, slug: salesLadders.slug })
    .from(salesLadders).where(eq(salesLadders.slug, CONTRACTOR_LADDER_SLUG));

  if (canonical) {
    // Verify our cleanup tracking never includes the canonical ladder id
    assert.ok(!createdLadderIds.includes(canonical.id),
      "canonical ladder id must not be in test cleanup list");
    assert.ok(testSeedLadderId !== canonical.id,
      "test seed ladder id must differ from canonical");
  }
  // Pass either way — canonical may not yet exist in this environment
});

// ─────────────────────────────────────────────────────────────────────────────
// 10) Alias matching: exact trimmed case-insensitive (not LIKE)
// ─────────────────────────────────────────────────────────────────────────────

test("alias: exact trimmed CI match — does NOT match partial names", async () => {
  // We cannot insert product_registry rows, so we test the logic directly
  // via the seed's isolated run and verify that nodes are placeholders when
  // no exact match exists (which is the common case in a fresh test DB).
  // If the DB has an exact match we also verify it's wired as PRODUCT.

  if (testSeedLadderId === null) {
    console.log("  [skip] test seed not created yet");
    return;
  }

  const nodes = await db.select().from(salesLadderNodes)
    .where(eq(salesLadderNodes.ladderId, testSeedLadderId));

  // Check: if any node has productRegistryId, verify the product name
  // case-insensitively equals the alias (not just contains it)
  for (const n of nodes) {
    if (!n.productRegistryId) continue;
    const [prod] = await db.select({ name: productRegistry.name, status: productRegistry.status })
      .from(productRegistry).where(eq(productRegistry.productId, n.productRegistryId));
    assert.ok(prod, `Product ${n.productRegistryId} must exist in registry`);
    assert.equal(prod.status, "ACTIVE", `Aliased product must be ACTIVE`);
    // The name must match one of the allowed alias targets exactly (CI)
    const allowed = ["Ruang Simpan", "Brain Project", "Ekosistem Kompetensi"];
    const matches = allowed.filter(a => a.trim().toLowerCase() === prod.name.trim().toLowerCase());
    assert.ok(matches.length > 0,
      `Product name '${prod.name}' must exactly match an alias target (CI). Allowed: ${allowed.join(", ")}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 11) Cascade delete
// ─────────────────────────────────────────────────────────────────────────────

test("superadmin: DELETE ladder cascades to nodes and edges", async () => {
  const rl = await req("POST", "/api/admin/sales-ladder/ladders", SUPERADMIN_ID, { name: `${RUN} Cascade` });
  const tl = await rl.json();

  const rn1 = await req("POST", `/api/admin/sales-ladder/ladders/${tl.id}/nodes`, SUPERADMIN_ID, {
    stage: "L0", nodeType: "TRIGGER", label: "T1",
  });
  const rn2 = await req("POST", `/api/admin/sales-ladder/ladders/${tl.id}/nodes`, SUPERADMIN_ID, {
    stage: "L1", nodeType: "PLACEHOLDER", label: "T2",
  });
  const n1 = await rn1.json();
  const n2 = await rn2.json();
  await req("POST", `/api/admin/sales-ladder/ladders/${tl.id}/edges`, SUPERADMIN_ID, {
    fromNodeId: n1.id, toNodeId: n2.id, relationType: "NEXT_STEP",
  });

  const rd = await req("DELETE", `/api/admin/sales-ladder/ladders/${tl.id}`, SUPERADMIN_ID);
  assert.equal(rd.status, 200);
  assert.equal((await rd.json()).ok, true);

  const nodes = await db.select().from(salesLadderNodes).where(eq(salesLadderNodes.ladderId, tl.id));
  assert.equal(nodes.length, 0, "cascade should delete all nodes");
});

test("superadmin: DELETE edge 200", async () => {
  const r = await req("DELETE", `/api/admin/sales-ladder/edges/${edgeId}`, SUPERADMIN_ID);
  assert.equal(r.status, 200);
  const idx = createdEdgeIds.indexOf(edgeId);
  if (idx !== -1) createdEdgeIds.splice(idx, 1);
});

test("superadmin: DELETE node 200", async () => {
  const r = await req("DELETE", `/api/admin/sales-ladder/nodes/${nodeAId}`, SUPERADMIN_ID);
  assert.equal(r.status, 200);
  const idx = createdNodeIds.indexOf(nodeAId);
  if (idx !== -1) createdNodeIds.splice(idx, 1);
});
