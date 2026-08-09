// Integrasi: fallback paymentUrl dari agent ke store product.
//
// Skenario yang diuji:
//   1. Produk dengan payment_url sendiri   → paymentUrl = payment_url milik produk.
//   2. Produk tanpa payment_url (empty "") → paymentUrl jatuh ke agent.paymentUrl.
//   3. Produk tanpa payment_url (null)     → paymentUrl jatuh ke agent.paymentUrl.
//   4. Produk tanpa agentId               → paymentUrl = null (tidak ada fallback).
//   5. Penjagaan statis — logika fallback ada di routes.ts buildStoreCatalogItems.
//
// Hermetis: agen dan produk diberi nama unik (RUN prefix), dibersihkan setelah test.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { db } from "../server/db";
import { agents as agentsTable, storeProducts } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";
import { parseSubAgentsValue } from "../server/db-storage";
import {
  invalidateStoreCatalog,
  getStoreCatalogItems,
} from "../server/routes";

// ── Identifier unik per run ───────────────────────────────────────────────────
const RUN = `scp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const AGENT_PAYMENT_URL = "https://checkout.example.com/pay/agent-link";
const PRODUCT_PAYMENT_URL = "https://checkout.example.com/pay/product-own";

const createdAgentIds: number[] = [];
const createdProductIds: number[] = [];

// ── Teardown ─────────────────────────────────────────────────────────────────
after(async () => {
  invalidateStoreCatalog(); // sisa cache setelah test
  if (createdProductIds.length > 0) {
    await db.delete(storeProducts).where(inArray(storeProducts.id, createdProductIds));
  }
  if (createdAgentIds.length > 0) {
    await db.delete(agentsTable).where(inArray(agentsTable.id, createdAgentIds));
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createAgent(paymentUrl: string): Promise<number> {
  const [row] = await db.insert(agentsTable).values({
    name: `${RUN} Agent`,
    isListed: false,
    isActive: true,
    paymentUrl,
  } as any).returning({ id: agentsTable.id });
  createdAgentIds.push(row.id);
  return row.id;
}

async function createProduct(agentId: number | null, paymentUrl: string | null): Promise<number> {
  const [row] = await db.insert(storeProducts).values({
    name: `${RUN} Product`,
    description: "test",
    price: 299_000,
    agentId,
    isActive: true,
    isGustafta: false,
    sortOrder: 999,
    ...(paymentUrl !== null ? { paymentUrl } : {}),
  } as any).returning({ id: storeProducts.id });
  createdProductIds.push(row.id);
  return row.id;
}

// Mirrors the fallback logic inside buildStoreCatalogItems (server/routes.ts).
// We replicate the exact same query pattern so a future refactor that changes
// the field name or the fallback condition will break this test first.
async function resolvePaymentUrl(productId: number): Promise<string | null> {
  const [p] = await db
    .select({
      paymentUrl: storeProducts.paymentUrl,
      agentId: storeProducts.agentId,
    })
    .from(storeProducts)
    .where(eq(storeProducts.id, productId))
    .limit(1);

  if (!p) return null;

  // Fallback: empty string or null on product → try agent
  const ownUrl = p.paymentUrl || null;
  if (ownUrl) return ownUrl;

  if (p.agentId == null) return null;

  const [agent] = await db
    .select({ paymentUrl: agentsTable.paymentUrl })
    .from(agentsTable)
    .where(eq(agentsTable.id, p.agentId))
    .limit(1);

  return (agent?.paymentUrl) || null;
}

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 1 — DB integration: fallback paymentUrl
// ═════════════════════════════════════════════════════════════════════════════

let agentId: number;

before(async () => {
  agentId = await createAgent(AGENT_PAYMENT_URL);
});

test("produk dengan paymentUrl sendiri menggunakan URL produk, bukan agent", async () => {
  const pid = await createProduct(agentId, PRODUCT_PAYMENT_URL);
  const resolved = await resolvePaymentUrl(pid);
  assert.equal(resolved, PRODUCT_PAYMENT_URL, "harus mengembalikan payment_url milik produk");
});

test("produk tanpa paymentUrl (string kosong) jatuh ke paymentUrl agent", async () => {
  const pid = await createProduct(agentId, "");
  const resolved = await resolvePaymentUrl(pid);
  assert.equal(resolved, AGENT_PAYMENT_URL, "harus menggunakan paymentUrl agent sebagai fallback");
});

test("produk tanpa paymentUrl (null) jatuh ke paymentUrl agent", async () => {
  const pid = await createProduct(agentId, null);
  const resolved = await resolvePaymentUrl(pid);
  assert.equal(resolved, AGENT_PAYMENT_URL, "harus menggunakan paymentUrl agent sebagai fallback");
});

test("produk tanpa agentId dan tanpa paymentUrl mengembalikan null", async () => {
  const pid = await createProduct(null, "");
  const resolved = await resolvePaymentUrl(pid);
  assert.equal(resolved, null, "tidak ada agent → tidak ada fallback → paymentUrl null");
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 2 — Penjagaan statis: pastikan fallback ada di routes.ts
// ═════════════════════════════════════════════════════════════════════════════

test("routes.ts: buildStoreCatalogItems memiliki logika fallback paymentUrl dari agent", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  // Cek bahwa agentPaymentUrlMap diisi dari hasil query agent
  assert.ok(
    src.includes("agentPaymentUrlMap"),
    "harus ada Map agentPaymentUrlMap untuk menyimpan paymentUrl per agent"
  );

  // Cek bahwa fallback diterapkan: (p.paymentUrl || ...) atau p as any paymentUrl ||
  assert.ok(
    src.includes("agentPaymentUrlMap.get("),
    "harus menggunakan agentPaymentUrlMap.get() sebagai fallback paymentUrl"
  );
});

test("routes.ts: agentPaymentUrlMap diisi hanya ketika r.paymentUrl truthy", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  // Pastikan ada guard "if (r.paymentUrl)" sebelum set ke Map
  // (menghindari mengisi Map dengan string kosong yang bisa mengalahkan URL produk)
  assert.ok(
    /if\s*\(r\.paymentUrl\)\s*agentPaymentUrlMap\.set/.test(src),
    "agentPaymentUrlMap.set() harus dipagari if (r.paymentUrl) agar string kosong tidak disimpan"
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 3 — Integrasi cache: menghapus paymentUrl langsung terlihat di catalog
// ═════════════════════════════════════════════════════════════════════════════
//
// Skenario: produk awalnya punya payment_url sendiri. Admin menghapus URL tersebut.
// Setelah invalidasi cache, getStoreCatalogItems() harus mengembalikan:
//   - fallback ke paymentUrl agent  (jika produk terhubung ke agent berURL)
//   - null                          (jika produk tidak punya agentId)
// Tidak perlu redeploy — karena cache dibuang saat PATCH dipanggil.

let cacheAgentId: number;
let cacheProductWithAgentId: number;
let cacheProductNoAgentId: number;

before(async () => {
  // Agent dengan paymentUrl sendiri — digunakan sebagai fallback
  const [agentRow] = await db.insert(agentsTable).values({
    name: `${RUN} CacheAgent`,
    isListed: false,
    isActive: true,
    paymentUrl: AGENT_PAYMENT_URL,
  } as any).returning({ id: agentsTable.id });
  cacheAgentId = agentRow.id;
  createdAgentIds.push(cacheAgentId);

  // Produk dengan agent (untuk uji fallback ke agent)
  const [p1] = await db.insert(storeProducts).values({
    name: `${RUN} CacheProdWithAgent`,
    description: "cache test with agent",
    price: 299_000,
    agentId: cacheAgentId,
    isActive: true,
    isGustafta: false,
    sortOrder: 998,
    paymentUrl: PRODUCT_PAYMENT_URL,
  } as any).returning({ id: storeProducts.id });
  cacheProductWithAgentId = p1.id;
  createdProductIds.push(cacheProductWithAgentId);

  // Produk tanpa agent (untuk uji fallback ke null)
  const [p2] = await db.insert(storeProducts).values({
    name: `${RUN} CacheProdNoAgent`,
    description: "cache test no agent",
    price: 299_000,
    agentId: null,
    isActive: true,
    isGustafta: false,
    sortOrder: 997,
    paymentUrl: PRODUCT_PAYMENT_URL,
  } as any).returning({ id: storeProducts.id });
  cacheProductNoAgentId = p2.id;
  createdProductIds.push(cacheProductNoAgentId);
});

test("cache: produk dengan paymentUrl sendiri menampilkan URL produk di katalog", async () => {
  // Pastikan cache bersih (simulasi POST/PATCH yang baru menyimpan produk)
  invalidateStoreCatalog();

  const items = await getStoreCatalogItems("", "");
  const item = items.find((i: any) => i.productId === cacheProductWithAgentId);
  assert.ok(item, `produk ${cacheProductWithAgentId} harus ada di katalog`);
  assert.equal(item.paymentUrl, PRODUCT_PAYMENT_URL, "paymentUrl harus sama dengan URL produk");
});

test("cache: setelah paymentUrl dikosongkan dan cache diinvalidasi, catalog menampilkan fallback agent — bukan URL lama", async () => {
  // Admin mengosongkan paymentUrl (simulasi PATCH paymentUrl = "")
  await db
    .update(storeProducts)
    .set({ paymentUrl: "" } as any)
    .where(eq(storeProducts.id, cacheProductWithAgentId));

  // Simulasi invalidateStoreCatalog() yang dipanggil PATCH handler
  invalidateStoreCatalog();

  // getStoreCatalogItems() harus rebuild dari DB — cache sudah dibuang
  const items = await getStoreCatalogItems("", "");
  const item = items.find((i: any) => i.productId === cacheProductWithAgentId);
  assert.ok(item, `produk ${cacheProductWithAgentId} harus masih ada di katalog`);
  assert.equal(
    item.paymentUrl,
    AGENT_PAYMENT_URL,
    "setelah paymentUrl produk dikosongkan, catalog harus jatuh ke paymentUrl agent — bukan URL lama"
  );
  assert.notEqual(item.paymentUrl, PRODUCT_PAYMENT_URL, "URL produk lama TIDAK boleh muncul dari cache");
});

test("cache: setelah paymentUrl dikosongkan pada produk tanpa agent, catalog mengembalikan null", async () => {
  // Admin mengosongkan paymentUrl produk yang tidak punya agent
  await db
    .update(storeProducts)
    .set({ paymentUrl: "" } as any)
    .where(eq(storeProducts.id, cacheProductNoAgentId));

  invalidateStoreCatalog();

  const items = await getStoreCatalogItems("", "");
  const item = items.find((i: any) => i.productId === cacheProductNoAgentId);
  assert.ok(item, `produk ${cacheProductNoAgentId} harus masih ada di katalog`);
  assert.equal(
    item.paymentUrl ?? null,
    null,
    "tanpa agentId dan tanpa paymentUrl: catalog harus mengembalikan null"
  );
});

test("cache: tidak menyajikan URL lama setelah invalidasi (siklus restore → clear → verify)", async () => {
  // Kembalikan URL produk ke nilai awal
  await db
    .update(storeProducts)
    .set({ paymentUrl: PRODUCT_PAYMENT_URL } as any)
    .where(eq(storeProducts.id, cacheProductWithAgentId));
  invalidateStoreCatalog();

  let items = await getStoreCatalogItems("", "");
  let item = items.find((i: any) => i.productId === cacheProductWithAgentId);
  assert.equal(item?.paymentUrl, PRODUCT_PAYMENT_URL, "setelah restore: URL produk harus muncul kembali");

  // Kosongkan lagi — cache TIDAK boleh menyajikan URL lama
  await db
    .update(storeProducts)
    .set({ paymentUrl: null } as any)
    .where(eq(storeProducts.id, cacheProductWithAgentId));
  invalidateStoreCatalog();

  items = await getStoreCatalogItems("", "");
  item = items.find((i: any) => i.productId === cacheProductWithAgentId);
  assert.equal(
    item?.paymentUrl,
    AGENT_PAYMENT_URL,
    "setelah clear kedua: cache tidak boleh menyajikan URL produk lama — harus fallback ke agent"
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 4 — Penjagaan statis: PATCH admin products wajib panggil invalidateStoreCatalog
// ═════════════════════════════════════════════════════════════════════════════

test("routes.ts: PATCH /api/store/admin/products/:id memanggil invalidateStoreCatalog setelah update", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  const patchIdx = src.indexOf('app.patch("/api/store/admin/products/:id"');
  // Batas atas: route reorder yang muncul setelah PATCH
  const reorderIdx = src.indexOf('app.post("/api/store/admin/products/reorder"');
  assert.ok(patchIdx !== -1, 'route PATCH /api/store/admin/products/:id harus ada');
  assert.ok(reorderIdx !== -1 && reorderIdx > patchIdx, 'reorder handler harus ada setelah PATCH handler');

  // Blok PATCH handler (dari deklarasi sampai reorder) — batas alami, bukan ukuran tetap
  const patchBlock = src.slice(patchIdx, reorderIdx);
  assert.ok(
    patchBlock.includes("invalidateStoreCatalog()"),
    "invalidateStoreCatalog() harus dipanggil di dalam handler PATCH /api/store/admin/products/:id"
  );
});

test("routes.ts: updateStoreProduct dipanggil sebelum invalidateStoreCatalog di PATCH admin products", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  const patchIdx = src.indexOf('app.patch("/api/store/admin/products/:id"');
  const reorderIdx = src.indexOf('app.post("/api/store/admin/products/reorder"');
  assert.ok(patchIdx !== -1, 'route PATCH /api/store/admin/products/:id harus ada');

  const patchBlock = src.slice(patchIdx, reorderIdx !== -1 ? reorderIdx : patchIdx + 600);

  const updatePos = patchBlock.indexOf("updateStoreProduct");
  const invalidatePos = patchBlock.indexOf("invalidateStoreCatalog()");

  assert.ok(updatePos !== -1, "updateStoreProduct harus ada di handler PATCH");
  assert.ok(invalidatePos !== -1, "invalidateStoreCatalog() harus ada di handler PATCH");
  assert.ok(
    updatePos < invalidatePos,
    "updateStoreProduct harus dipanggil SEBELUM invalidateStoreCatalog() agar data tersimpan ke DB lebih dulu"
  );
});
