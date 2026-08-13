// Integrasi HTTP NYATA: /api/landing/:agentId harus menampilkan harga dari
// store_products.price_override (bukan agent.monthlyPrice) saat override diisi.
//
// Invariant yang dijaga (resolvedPrice di handler /api/landing/:agentId):
//   1. price_override terisi (Y ≠ monthlyPrice X) → resolvedPrice = Y.
//   2. price_override NULL tapi baris store_products ada → resolvedPrice =
//      computedPrice dari calcStorePrice(agenticSubAgents) — untuk agen solo
//      (0 sub-agen) = tier solo 299.000, BUKAN monthlyPrice agen.
//   3. Tidak ada baris store_products aktif → fallback resolvedPrice =
//      agent.monthlyPrice (X).
//
// Hermetis: membuat & membersihkan agen + store_products miliknya sendiri.
// Memakai DB + registerRoutes yang sama persis dengan produksi.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";

// ── Ketersediaan DB ───────────────────────────────────────────────────────────
const HAS_DB = !!process.env.DATABASE_URL;

// ── Lazy imports (diisi di before()) ─────────────────────────────────────────
let db: any;
let pool: any;
let agents: any;
let storeProducts: any;
let inArray: any;
let eq: any;
let registerRoutes: any;

// ── Konstanta harga uji ───────────────────────────────────────────────────────
const AGENT_PRICE_X = 150_000;      // agent.monthlyPrice
const OVERRIDE_PRICE_Y = 425_000;   // store_products.price_override (Y ≠ X)
const SOLO_TIER_PRICE = 299_000;    // calcStorePrice untuk 0 sub-agen (total=1)

// ── Identifier unik per run ───────────────────────────────────────────────────
const RUN = `lpo_${Date.now()}_${randomUUID().slice(0, 8)}`;

const createdAgentIds: number[] = [];
const createdProductIds: number[] = [];

let server: Server;
let baseUrl = "";

// Agen A: store_products dengan price_override = Y.
let agentWithOverrideId = 0;
// Agen B: store_products dengan price_override = NULL.
let agentNullOverrideId = 0;
// Agen C: tanpa baris store_products sama sekali.
let agentNoStoreRowId = 0;

// ── Before: setup DB rows + boot server ──────────────────────────────────────
before(async () => {
  if (!HAS_DB) return;

  ({ db, pool } = await import("../server/db"));
  ({ agents, storeProducts } = await import("../shared/schema"));
  ({ inArray, eq } = await import("drizzle-orm"));
  ({ registerRoutes } = await import("../server/routes"));

  async function createAgentRow(suffix: string): Promise<number> {
    const [row] = await db
      .insert(agents)
      .values({
        name: `${RUN} Agent ${suffix}`,
        isActive: true,
        monthlyPrice: AGENT_PRICE_X,
        landingPageEnabled: true,
        agenticSubAgents: JSON.stringify([]), // solo → computedPrice = 299.000
      })
      .returning({ id: agents.id });
    createdAgentIds.push(row.id);
    return row.id;
  }

  agentWithOverrideId = await createAgentRow("Override");
  agentNullOverrideId = await createAgentRow("NullOverride");
  agentNoStoreRowId = await createAgentRow("NoStoreRow");

  async function createStoreRow(agentId: number, priceOverride: number | null) {
    const [row] = await db
      .insert(storeProducts)
      .values({
        name: `${RUN} Produk ${agentId}`,
        description: "Produk uji landing price override",
        category: "Konstruksi",
        price: 199_000,
        agentId,
        isActive: true,
        ...(priceOverride != null ? { priceOverride } : {}),
      } as any)
      .returning({ id: storeProducts.id });
    createdProductIds.push(row.id);
  }

  await createStoreRow(agentWithOverrideId, OVERRIDE_PRICE_Y);
  await createStoreRow(agentNullOverrideId, null);
  // agentNoStoreRowId: sengaja TANPA baris store_products.

  // Boot Express dengan registerRoutes NYATA (endpoint landing publik, tanpa auth).
  const app = express();
  app.use(express.json());
  app.use((reqAny: any, _res: any, next: any) => {
    reqAny.isAuthenticated = () => false;
    next();
  });

  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  await new Promise<void>((resolve) =>
    httpServer.listen(0, "127.0.0.1", resolve)
  );
  server = httpServer;
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

// ── After: bersihkan baris uji ────────────────────────────────────────────────
after(async () => {
  try {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  } catch {}
  if (!HAS_DB) return;
  // Tunggu seed LMS boot-time (fire-and-forget di registerLmsRoutes) selesai
  // SEBELUM menutup pool — jika tidak, seed masih memakai pool yang sudah ditutup.
  try {
    const { lmsSeedSettled } = await import("../server/routes-lms");
    await lmsSeedSettled;
  } catch {}
  try {
    if (createdProductIds.length)
      await db.delete(storeProducts).where(inArray(storeProducts.id, createdProductIds));
    if (createdAgentIds.length)
      await db.delete(agents).where(inArray(agents.id, createdAgentIds));
  } catch {}
  if (pool) await pool.end().catch(() => {});
});

// ── Helper HTTP ───────────────────────────────────────────────────────────────
async function getLanding(agentId: number): Promise<{ status: number; json: any }> {
  const r = await fetch(`${baseUrl}/api/landing/${agentId}`);
  let json: any = null;
  const text = await r.text();
  if (text) { try { json = JSON.parse(text); } catch { json = text; } }
  return { status: r.status, json };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: price_override = Y → resolvedPrice = Y (bukan monthlyPrice X)
// ─────────────────────────────────────────────────────────────────────────────
test(
  "landing: price_override menang atas monthlyPrice (resolvedPrice = Y)",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    const { status, json } = await getLanding(agentWithOverrideId);
    assert.equal(status, 200, `GET /api/landing gagal: ${JSON.stringify(json)}`);
    assert.equal(json.monthlyPrice, AGENT_PRICE_X, "sanity: monthlyPrice agen harus X");
    assert.equal(
      json.resolvedPrice,
      OVERRIDE_PRICE_Y,
      `resolvedPrice harus dari price_override (${OVERRIDE_PRICE_Y}), bukan monthlyPrice (${AGENT_PRICE_X}); dapat: ${json.resolvedPrice}`
    );
    assert.notEqual(json.resolvedPrice, AGENT_PRICE_X, "resolvedPrice TIDAK boleh sama dengan monthlyPrice agen");
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: price_override NULL (baris store_products ada) → computedPrice tier
// ─────────────────────────────────────────────────────────────────────────────
test(
  "landing: price_override NULL → resolvedPrice = computedPrice tier solo (299.000)",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    const { status, json } = await getLanding(agentNullOverrideId);
    assert.equal(status, 200, `GET /api/landing gagal: ${JSON.stringify(json)}`);
    assert.equal(
      json.resolvedPrice,
      SOLO_TIER_PRICE,
      `dengan baris store_products tanpa override, resolvedPrice harus computedPrice tier solo (${SOLO_TIER_PRICE}); dapat: ${json.resolvedPrice}`
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: tanpa baris store_products → fallback resolvedPrice = monthlyPrice X
// ─────────────────────────────────────────────────────────────────────────────
test(
  "landing: tanpa store_products → fallback resolvedPrice = agent.monthlyPrice (X)",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    const { status, json } = await getLanding(agentNoStoreRowId);
    assert.equal(status, 200, `GET /api/landing gagal: ${JSON.stringify(json)}`);
    assert.equal(
      json.resolvedPrice,
      AGENT_PRICE_X,
      `tanpa baris store_products aktif, resolvedPrice harus fallback ke monthlyPrice (${AGENT_PRICE_X}); dapat: ${json.resolvedPrice}`
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: override juga menang saat diubah belakangan (transisi admin)
// ─────────────────────────────────────────────────────────────────────────────
test(
  "landing: mengisi price_override belakangan langsung mengubah resolvedPrice",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    // Agen B awalnya NULL override → tier solo. Admin lalu mengisi override.
    const NEW_OVERRIDE = 555_000;
    await db.update(storeProducts)
      .set({ priceOverride: NEW_OVERRIDE } as any)
      .where(eq(storeProducts.agentId, agentNullOverrideId));

    const { status, json } = await getLanding(agentNullOverrideId);
    assert.equal(status, 200);
    assert.equal(
      json.resolvedPrice,
      NEW_OVERRIDE,
      `setelah admin mengisi override, resolvedPrice harus langsung ${NEW_OVERRIDE}; dapat: ${json.resolvedPrice}`
    );
  }
);
