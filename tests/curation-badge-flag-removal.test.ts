// Task #222 — Confirm the badge disappears instantly when an admin removes a
// product's curation flag — without a redeploy.
//
// Badge kurasi di halaman landing (product-landing.tsx) dirender dari flag
// isGustafta / isCertified / isCreatorMade yang dikembalikan GET /api/landing/:id.
// Test ini memastikan:
//   1. Penjagaan statis — PATCH /api/agents/:id memanggil invalidateStoreCatalog(),
//      dan GET /api/landing/:agentId menghitung flag LIVE (isCertified dari agent,
//      isGustafta dari query store_products) — bukan dari nilai build-time.
//   2. Integrasi HTTP + DB nyata — setelah admin PATCH menghapus isCertified,
//      GET /api/landing/:id langsung mengembalikan flag baru (tanpa redeploy).
//   3. Cache katalog Store — setelah PATCH + invalidateStoreCatalog(), item
//      katalog mencerminkan flag baru SEKETIKA (bukan menunggu jendela basi).
//
// Hermetis: agen & produk diberi nama unik (RUN prefix) dan dibersihkan di after().

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import type { Server } from "node:http";

import { db, pool } from "../server/db";
import { agents as agentsTable, storeProducts } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";
import { storage } from "../server/storage";
import { invalidateStoreCatalog, getStoreCatalogItems } from "../server/routes";

// ── Identifier unik per run ───────────────────────────────────────────────────
const RUN = `cbf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const ADMIN_ID = `admin_${RUN}`;
const CREATOR_ID = `creator_${RUN}`;

const createdAgentIds: number[] = [];
const createdProductIds: number[] = [];

let agentId = 0;
let soloCatalogAgentId = 0; // agen kedua tanpa store_products link — tampil sebagai item "agent"
let productId = 0;
let baseUrl = "";
let server: Server;

// ── Teardown ─────────────────────────────────────────────────────────────────
after(async () => {
  invalidateStoreCatalog();
  if (createdProductIds.length > 0) {
    await db.delete(storeProducts).where(inArray(storeProducts.id, createdProductIds));
  }
  if (createdAgentIds.length > 0) {
    await db.delete(agentsTable).where(inArray(agentsTable.id, createdAgentIds));
  }
  if (server) await new Promise<void>((r) => server.close(() => r()));
});

// ─────────────────────────────────────────────────────────────────────────────
// BAGIAN 1 — Penjagaan statis pada server/routes.ts & product-landing.tsx
// ─────────────────────────────────────────────────────────────────────────────

const routesSrc = fs.readFileSync(path.join(process.cwd(), "server", "routes.ts"), "utf-8");

function handlerBlock(startMarker: string): string {
  const idx = routesSrc.indexOf(startMarker);
  assert.ok(idx !== -1, `handler ${startMarker} harus ada di routes.ts`);
  // Ambil blok sampai deklarasi route berikutnya — cukup untuk memeriksa isi handler.
  const rest = routesSrc.slice(idx + startMarker.length);
  const next = rest.search(/\n\s*app\.(get|post|patch|put|delete)\(/);
  return rest.slice(0, next === -1 ? undefined : next);
}

test("statis: PATCH /api/agents/:id memanggil invalidateStoreCatalog()", () => {
  const block = handlerBlock('app.patch("/api/agents/:id"');
  assert.ok(
    block.includes("invalidateStoreCatalog()"),
    "PATCH /api/agents/:id harus memanggil invalidateStoreCatalog() agar katalog tidak basi"
  );
});

test("statis: GET /api/landing/:agentId menghitung flag kurasi live, bukan build-time", () => {
  const block = handlerBlock('app.get("/api/landing/:agentId"');
  assert.ok(
    /isCertified:\s*\(agent as any\)\.isCertified === true/.test(block),
    "landing harus membaca isCertified langsung dari row agent"
  );
  assert.ok(
    block.includes("is_gustafta") && block.includes("store_products"),
    "landing harus meng-query store_products.is_gustafta per request (live)"
  );
  assert.ok(
    /isCreatorMade:\s*\(\(agent as any\)\.userId \?\? ""\)\.trim\(\) !== ""/.test(block),
    "landing harus menurunkan isCreatorMade dari userId agent"
  );
});

test("statis: badge Beli di product-landing.tsx dirender dari flag API", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "pages", "product-landing.tsx"),
    "utf-8"
  );
  assert.ok(
    src.includes("agent.isGustafta || agent.isCertified || agent.isCreatorMade"),
    "kondisi badge harus memakai flag dari respons /api/landing"
  );
  assert.ok(src.includes("badge-beli-gustafta-official-"), "badge Gustafta Official harus ada");
  assert.ok(src.includes("badge-beli-bersertifikat-"), "badge Bersertifikat harus ada");
});

// ─────────────────────────────────────────────────────────────────────────────
// BAGIAN 2 — Setup HTTP app (mirror handler produksi, storage & DB NYATA)
// ─────────────────────────────────────────────────────────────────────────────

before(async () => {
  // Agen kreator: isCertified=true (badge hijau), listed, tim ≥2 agar tampil
  // sebagai item "agent" di katalog Store.
  const [agentRow] = await db.insert(agentsTable).values({
    name: `${RUN} Agent`,
    description: "test agent task-222",
    userId: CREATOR_ID,
    isActive: true,
    isListed: true,
    isCertified: true,
    agenticSubAgents: [{ name: "sub-1" }, { name: "sub-2" }],
  } as any).returning({ id: agentsTable.id });
  agentId = agentRow.id;
  createdAgentIds.push(agentId);

  // Agen kedua TANPA store_products link — katalog men-dedup agen yang punya
  // produk store, jadi cek isCertified pada item "agent" butuh agen terpisah.
  const [soloRow] = await db.insert(agentsTable).values({
    name: `${RUN} SoloCatalog Agent`,
    description: "test catalog agent task-222",
    userId: CREATOR_ID,
    isActive: true,
    isListed: true,
    isCertified: true,
    agenticSubAgents: [{ name: "sub-1" }, { name: "sub-2" }],
  } as any).returning({ id: agentsTable.id });
  soloCatalogAgentId = soloRow.id;
  createdAgentIds.push(soloCatalogAgentId);

  // Produk store terkait dengan is_gustafta=true (badge violet di landing).
  const [spRow] = await db.insert(storeProducts).values({
    name: `${RUN} Product`,
    description: "test product task-222",
    price: 299_000,
    agentId,
    isActive: true,
    isGustafta: true,
    sortOrder: 999,
  } as any).returning({ id: storeProducts.id });
  productId = spRow.id;
  createdProductIds.push(productId);

  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    const uid = req.headers["x-test-user"];
    if (uid) req.user = { id: String(uid) };
    next();
  });

  // Mirror PATCH /api/agents/:id (bagian yang relevan flag): admin boleh set
  // isCertified; non-admin di-strip; lalu updateAgent + invalidateStoreCatalog().
  app.patch("/api/agents/:id", async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const existing = await storage.getAgent(req.params.id);
    if (!existing) return res.status(404).json({ error: "Agent not found" });
    const isAdminUpdate = req.user.id === ADMIN_ID;
    if (!isAdminUpdate && Object.prototype.hasOwnProperty.call(req.body, "isCertified")) {
      delete req.body.isCertified;
    }
    const agent = await storage.updateAgent(req.params.id, req.body);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    invalidateStoreCatalog();
    res.json(agent);
  });

  // Mirror GET /api/landing/:agentId (bagian flag): baca agent via storage,
  // is_gustafta via SQL live ke store_products — persis pola produksi.
  app.get("/api/landing/:agentId", async (req, res) => {
    const agent = await storage.getAgent(req.params.agentId);
    if (!agent) return res.status(404).json({ error: "Landing page not found" });
    const spRes = await pool.query<{ is_gustafta: boolean }>(
      `SELECT is_gustafta FROM store_products WHERE agent_id = $1 AND is_active = true LIMIT 1`,
      [agent.id]
    );
    res.json({
      id: agent.id,
      isGustafta: spRes.rows[0]?.is_gustafta === true,
      isCertified: (agent as any).isCertified === true,
      isCreatorMade: ((agent as any).userId ?? "").trim() !== "",
    });
  });

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const addr = server.address();
  if (typeof addr === "object" && addr) baseUrl = `http://127.0.0.1:${addr.port}`;
});

async function api(method: string, p: string, body?: any, user?: string) {
  const res = await fetch(`${baseUrl}${p}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(user ? { "x-test-user": user } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

// ─────────────────────────────────────────────────────────────────────────────
// BAGIAN 3 — Integrasi: PATCH hapus flag → landing langsung berubah
// ─────────────────────────────────────────────────────────────────────────────

test("landing awal: isCertified=true (badge Bersertifikat tampil)", async () => {
  const r = await api("GET", `/api/landing/${agentId}`);
  assert.equal(r.status, 200);
  assert.equal(r.json.isCertified, true);
  assert.equal(r.json.isGustafta, true);
  assert.equal(r.json.isCreatorMade, true);
});

test("setelah admin PATCH isCertified=false, GET /api/landing langsung mengembalikan flag baru", async () => {
  const patch = await api("PATCH", `/api/agents/${agentId}`, { isCertified: false }, ADMIN_ID);
  assert.equal(patch.status, 200);
  const r = await api("GET", `/api/landing/${agentId}`);
  assert.equal(r.status, 200);
  assert.equal(
    r.json.isCertified, false,
    "badge Bersertifikat harus hilang seketika pada page load berikutnya — tanpa redeploy"
  );
  // isCreatorMade tetap true → landing kini menampilkan badge Pra-Sertifikasi (amber)
  assert.equal(r.json.isCreatorMade, true);
});

test("non-admin TIDAK bisa mengembalikan isCertified via PATCH (field di-strip)", async () => {
  // Sertakan field lain agar body tidak kosong setelah strip (produksi juga
  // gagal pada body kosong; edit panel nyata selalu membawa field lain).
  const patch = await api("PATCH", `/api/agents/${agentId}`, { isCertified: true, tagline: "coba" }, CREATOR_ID);
  assert.equal(patch.status, 200);
  const r = await api("GET", `/api/landing/${agentId}`);
  assert.equal(r.json.isCertified, false, "kreator tidak boleh menyertifikasi agennya sendiri");
});

test("menghapus is_gustafta pada store_products langsung terlihat di landing (query live)", async () => {
  await db.update(storeProducts).set({ isGustafta: false } as any).where(eq(storeProducts.id, productId));
  invalidateStoreCatalog(); // seperti yang dilakukan PATCH /api/store/admin/products/:id
  const r = await api("GET", `/api/landing/${agentId}`);
  assert.equal(r.json.isGustafta, false, "badge Gustafta Official harus hilang tanpa redeploy");
});

// ─────────────────────────────────────────────────────────────────────────────
// BAGIAN 4 — Cache katalog Store mencerminkan perubahan flag seketika
// ─────────────────────────────────────────────────────────────────────────────

test("cache katalog: item mencerminkan flag baru langsung setelah PATCH + invalidasi", async () => {
  // Reset flag ke keadaan awal lalu hangatkan cache (kunci search unik per run).
  await api("PATCH", `/api/agents/${agentId}`, { isCertified: true }, ADMIN_ID);
  await db.update(storeProducts).set({ isGustafta: true } as any).where(eq(storeProducts.id, productId));
  invalidateStoreCatalog();

  let items = await getStoreCatalogItems("", RUN);
  const spItem = items.find((i: any) => i.productId === productId);
  const agItem = items.find((i: any) => i.agentId === soloCatalogAgentId && i.type === "agent");
  assert.ok(spItem, "produk store harus ada di katalog");
  assert.equal(spItem.isGustafta, true, "cache hangat harus menampilkan isGustafta=true");
  assert.ok(agItem, "item agent harus ada di katalog (tim ≥2, listed)");
  assert.equal(agItem.isCertified, true, "cache hangat harus menampilkan isCertified=true");

  // Admin menghapus kedua flag — PATCH handler memanggil invalidateStoreCatalog().
  await api("PATCH", `/api/agents/${soloCatalogAgentId}`, { isCertified: false }, ADMIN_ID);
  await db.update(storeProducts).set({ isGustafta: false } as any).where(eq(storeProducts.id, productId));
  invalidateStoreCatalog();

  // Cache dibaca ULANG segera (masih di dalam TTL 30s bila tidak diinvalidasi) —
  // karena invalidasi, hasilnya harus flag BARU, bukan salinan basi.
  items = await getStoreCatalogItems("", RUN);
  const spAfter = items.find((i: any) => i.productId === productId);
  const agAfter = items.find((i: any) => i.agentId === soloCatalogAgentId && i.type === "agent");
  assert.equal(spAfter?.isGustafta, false, "katalog tidak boleh menyajikan isGustafta basi");
  assert.equal(agAfter?.isCertified, false, "katalog tidak boleh menyajikan isCertified basi");
});
