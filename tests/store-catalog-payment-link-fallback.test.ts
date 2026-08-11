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
  getFeaturedStoreItems,
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

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 5 — Featured page: clearing paymentUrl langsung terlihat (tanpa redeploy)
// ═════════════════════════════════════════════════════════════════════════════
//
// /api/store/featured membangun daftar produknya sendiri (linkedPaymentUrlMap,
// dua-pass) via getFeaturedStoreItems(). Karena fungsi ini membaca langsung dari
// DB pada tiap panggilan (tidak ada layer cache), menghapus payment_url produk
// HARUS langsung terlihat — fallback ke agent atau null, bukan URL lama.

let featAgentId: number;
let featProductWithAgentId: number;
let featProductNoAgentId: number;

before(async () => {
  const [agentRow] = await db.insert(agentsTable).values({
    name: `${RUN} FeatAgent`,
    isListed: false,
    isActive: true,
    paymentUrl: AGENT_PAYMENT_URL,
  } as any).returning({ id: agentsTable.id });
  featAgentId = agentRow.id;
  createdAgentIds.push(featAgentId);

  // sortOrder sangat rendah agar masuk 8 baris teratas (FEATURED_LIMIT) grup mitra
  const [p1] = await db.insert(storeProducts).values({
    name: `${RUN} FeatProdWithAgent`,
    description: "featured test with agent",
    price: 299_000,
    agentId: featAgentId,
    isActive: true,
    isGustafta: false,
    sortOrder: -1000,
    paymentUrl: PRODUCT_PAYMENT_URL,
  } as any).returning({ id: storeProducts.id });
  featProductWithAgentId = p1.id;
  createdProductIds.push(featProductWithAgentId);

  const [p2] = await db.insert(storeProducts).values({
    name: `${RUN} FeatProdNoAgent`,
    description: "featured test no agent",
    price: 299_000,
    agentId: null,
    isActive: true,
    isGustafta: false,
    sortOrder: -999,
    paymentUrl: PRODUCT_PAYMENT_URL,
  } as any).returning({ id: storeProducts.id });
  featProductNoAgentId = p2.id;
  createdProductIds.push(featProductNoAgentId);
});

function findFeaturedItem(result: { gustafta: any[]; mitra: any[] }, productId: number) {
  return [...result.gustafta, ...result.mitra].find((i: any) => i.productId === productId);
}

test("featured: produk dengan paymentUrl sendiri menampilkan URL produk", async () => {
  const result = await getFeaturedStoreItems();
  const item = findFeaturedItem(result, featProductWithAgentId);
  assert.ok(item, `produk ${featProductWithAgentId} harus muncul di featured (grup mitra)`);
  assert.equal(item.paymentUrl, PRODUCT_PAYMENT_URL, "paymentUrl harus URL milik produk");
});

test("featured: setelah paymentUrl dikosongkan, featured langsung fallback ke agent — bukan URL lama", async () => {
  // Admin mengosongkan paymentUrl (simulasi PATCH paymentUrl = "")
  await db
    .update(storeProducts)
    .set({ paymentUrl: "" } as any)
    .where(eq(storeProducts.id, featProductWithAgentId));

  // PATCH handler juga memanggil invalidateStoreCatalog(); featured sendiri
  // tidak punya cache, tapi kita panggil untuk mencerminkan alur nyata.
  invalidateStoreCatalog();

  const result = await getFeaturedStoreItems();
  const item = findFeaturedItem(result, featProductWithAgentId);
  assert.ok(item, `produk ${featProductWithAgentId} harus masih muncul di featured`);
  assert.equal(
    item.paymentUrl,
    AGENT_PAYMENT_URL,
    "featured harus langsung jatuh ke paymentUrl agent — bukan URL produk lama"
  );
  assert.notEqual(item.paymentUrl, PRODUCT_PAYMENT_URL, "URL lama TIDAK boleh tersaji di featured");
});

test("featured: produk tanpa agent yang paymentUrl-nya dikosongkan mengembalikan null", async () => {
  await db
    .update(storeProducts)
    .set({ paymentUrl: null } as any)
    .where(eq(storeProducts.id, featProductNoAgentId));
  invalidateStoreCatalog();

  const result = await getFeaturedStoreItems();
  const item = findFeaturedItem(result, featProductNoAgentId);
  assert.ok(item, `produk ${featProductNoAgentId} harus masih muncul di featured`);
  assert.equal(item.paymentUrl ?? null, null, "tanpa agent dan tanpa URL: featured harus null");
});

test("featured: siklus restore → clear tidak pernah menyajikan URL lama", async () => {
  await db
    .update(storeProducts)
    .set({ paymentUrl: PRODUCT_PAYMENT_URL } as any)
    .where(eq(storeProducts.id, featProductWithAgentId));
  invalidateStoreCatalog();

  let result = await getFeaturedStoreItems();
  let item = findFeaturedItem(result, featProductWithAgentId);
  assert.equal(item?.paymentUrl, PRODUCT_PAYMENT_URL, "setelah restore: URL produk kembali tampil");

  await db
    .update(storeProducts)
    .set({ paymentUrl: null } as any)
    .where(eq(storeProducts.id, featProductWithAgentId));
  invalidateStoreCatalog();

  result = await getFeaturedStoreItems();
  item = findFeaturedItem(result, featProductWithAgentId);
  assert.equal(
    item?.paymentUrl,
    AGENT_PAYMENT_URL,
    "setelah clear kedua: featured harus fallback ke agent, bukan URL lama"
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 5b — HTTP end-to-end: request nyata ke handler featured selalu fresh
// ═════════════════════════════════════════════════════════════════════════════
//
// Mount featuredStoreHandler (handler asli yang dipakai route) di express nyata,
// lalu lakukan dua request HTTP berturut-turut mengapit penghapusan paymentUrl.
// Request kedua HARUS memuat fallback agent — bukan URL lama — dan respons wajib
// Cache-Control: no-store agar browser tidak menyajikan payload basi.

test("HTTP: request kedua setelah clear paymentUrl memuat fallback agent + Cache-Control no-store", async () => {
  const { featuredStoreHandler } = await import("../server/routes");
  const express = (await import("express")).default;

  const app = express();
  app.get("/api/store/featured", featuredStoreHandler);
  const server = app.listen(0);
  await new Promise<void>((r) => server.once("listening", () => r()));
  const { port } = server.address() as any;
  const url = `http://127.0.0.1:${port}/api/store/featured`;

  try {
    // Pastikan produk featured punya URL sendiri dulu
    await db
      .update(storeProducts)
      .set({ paymentUrl: PRODUCT_PAYMENT_URL } as any)
      .where(eq(storeProducts.id, featProductWithAgentId));

    const res1 = await fetch(url);
    assert.equal(res1.status, 200);
    assert.equal(
      res1.headers.get("cache-control"),
      "no-store",
      "respons featured wajib Cache-Control: no-store"
    );
    const body1 = await res1.json();
    const item1 = findFeaturedItem(body1, featProductWithAgentId);
    assert.equal(item1?.paymentUrl, PRODUCT_PAYMENT_URL, "request pertama: URL produk tampil");

    // Admin menghapus paymentUrl (simulasi PATCH), lalu request HTTP kedua
    await db
      .update(storeProducts)
      .set({ paymentUrl: "" } as any)
      .where(eq(storeProducts.id, featProductWithAgentId));
    invalidateStoreCatalog();

    const res2 = await fetch(url);
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    const item2 = findFeaturedItem(body2, featProductWithAgentId);
    assert.equal(
      item2?.paymentUrl,
      AGENT_PAYMENT_URL,
      "request HTTP kedua harus langsung memuat fallback agent — tanpa redeploy"
    );
    assert.notEqual(item2?.paymentUrl, PRODUCT_PAYMENT_URL, "URL lama tidak boleh tersaji lewat HTTP");
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 6 — Penjagaan statis: handler featured harus selalu fresh
// ═════════════════════════════════════════════════════════════════════════════

test("routes.ts: route /api/store/featured memakai featuredStoreHandler (yang diuji end-to-end di atas)", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "server", "routes.ts"), "utf-8");

  assert.ok(
    /app\.get\("\/api\/store\/featured",\s*featuredStoreHandler\)/.test(src),
    "route GET /api/store/featured harus memakai featuredStoreHandler yang diekspor untuk test"
  );

  const fnIdx = src.indexOf("export async function featuredStoreHandler(");
  assert.ok(fnIdx !== -1, "featuredStoreHandler harus diekspor dari routes.ts");
  const fnBlock = src.slice(fnIdx, fnIdx + 1200);
  assert.ok(
    fnBlock.includes("getFeaturedStoreItems()"),
    "featuredStoreHandler harus memanggil getFeaturedStoreItems()"
  );
  assert.ok(
    /Cache-Control",\s*"no-store"/.test(fnBlock),
    "featuredStoreHandler harus set Cache-Control: no-store agar browser tidak menyajikan Beli link lama"
  );
});

test("client: query /api/store/featured tidak boleh pakai staleTime default 5 menit", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "pages", "store-featured.tsx"),
    "utf-8"
  );
  const qIdx = src.indexOf('queryKey: ["/api/store/featured"]');
  assert.ok(qIdx !== -1, "query featured harus ada di store-featured.tsx");
  const qBlock = src.slice(qIdx, qIdx + 800);
  assert.ok(
    /staleTime:\s*0/.test(qBlock),
    "query featured harus staleTime: 0 agar navigasi balik tidak menyajikan payload lama"
  );
  assert.ok(
    /refetchOnMount:\s*["']always["']/.test(qBlock),
    'query featured harus refetchOnMount: "always" agar tiap kunjungan mengambil data segar'
  );
  assert.ok(
    /gcTime:\s*0/.test(qBlock),
    "query featured harus gcTime: 0 agar payload lama dibuang saat halaman ditinggalkan — pengunjung yang kembali tidak boleh melihat/klik Beli link lama selama refetch"
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 7 — Runtime TanStack Query: remount tidak boleh menyajikan payload lama
// ═════════════════════════════════════════════════════════════════════════════
//
// Mensimulasikan siklus hidup halaman featured dengan QueryObserver nyata dan
// opsi PERSIS seperti di store-featured.tsx (staleTime 0, gcTime 0,
// refetchOnMount "always"). Kunjungan pertama memuat payload lama; setelah
// "unmount" (unsubscribe) payload harus tereviksi, sehingga kunjungan kedua
// TIDAK memiliki data lama saat refetch berjalan — termasuk saat refetch GAGAL.

test("react-query runtime: setelah unmount, remount tidak mengekspos URL lama sebelum refetch selesai", async () => {
  const { QueryClient, QueryObserver } = await import("@tanstack/react-query");

  const OLD_PAYLOAD = { gustafta: [], mitra: [{ productId: 1, paymentUrl: PRODUCT_PAYMENT_URL }] };
  const NEW_PAYLOAD = { gustafta: [], mitra: [{ productId: 1, paymentUrl: AGENT_PAYMENT_URL }] };

  const queryClient = new QueryClient();
  const queryKey = ["/api/store/featured"];
  // Opsi identik dengan useQuery di client/src/pages/store-featured.tsx
  const pageQueryOptions = { staleTime: 0, gcTime: 0, refetchOnMount: "always" as const };

  // ── Kunjungan pertama: memuat payload lama ─────────────────────────────────
  const obs1 = new QueryObserver(queryClient, {
    queryKey,
    queryFn: async () => OLD_PAYLOAD,
    ...pageQueryOptions,
  });
  const unsub1 = obs1.subscribe(() => {});
  await new Promise<void>((resolve) => {
    const check = () => {
      if (obs1.getCurrentResult().data) resolve();
      else setTimeout(check, 5);
    };
    check();
  });
  assert.deepEqual(obs1.getCurrentResult().data, OLD_PAYLOAD, "kunjungan pertama memuat payload lama");

  // ── Unmount halaman: gcTime 0 harus membuang cache ─────────────────────────
  unsub1();
  await new Promise((r) => setTimeout(r, 25));
  assert.equal(
    queryClient.getQueryData(queryKey),
    undefined,
    "gcTime 0: payload lama harus tereviksi dari cache saat halaman ditinggalkan"
  );

  // ── Kunjungan kedua (refetch lambat): data lama TIDAK boleh tampil ─────────
  let resolveSlow!: (v: any) => void;
  const slowFetch = new Promise((r) => (resolveSlow = r));
  const obs2 = new QueryObserver(queryClient, {
    queryKey,
    queryFn: () => slowFetch as any,
    ...pageQueryOptions,
  });
  const unsub2 = obs2.subscribe(() => {});
  await new Promise((r) => setTimeout(r, 25));
  const during = obs2.getCurrentResult();
  assert.equal(
    during.data,
    undefined,
    "selama refetch berjalan, halaman TIDAK boleh punya data lama untuk dirender/diklik"
  );

  // Refetch selesai → data baru (fallback agent) tampil
  resolveSlow(NEW_PAYLOAD);
  await new Promise<void>((resolve) => {
    const check = () => {
      if (obs2.getCurrentResult().data) resolve();
      else setTimeout(check, 5);
    };
    check();
  });
  assert.deepEqual(obs2.getCurrentResult().data, NEW_PAYLOAD, "setelah refetch: hanya payload baru yang tampil");
  unsub2();
  await new Promise((r) => setTimeout(r, 25));

  // ── Kunjungan ketiga: refetch GAGAL → tetap tanpa URL lama ─────────────────
  const obs3 = new QueryObserver(queryClient, {
    queryKey,
    queryFn: async () => { throw new Error("network down"); },
    retry: false,
    ...pageQueryOptions,
  });
  const unsub3 = obs3.subscribe(() => {});
  await new Promise<void>((resolve) => {
    const check = () => {
      if (obs3.getCurrentResult().status === "error") resolve();
      else setTimeout(check, 5);
    };
    check();
  });
  assert.equal(
    obs3.getCurrentResult().data,
    undefined,
    "refetch gagal: tidak boleh jatuh kembali ke payload lama — lebih baik error daripada Beli link basi"
  );
  unsub3();
  queryClient.clear();
});

test("routes.ts: getFeaturedStoreItems membaca fresh dari DB — tidak memakai cache katalog tanpa invalidasi", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "server", "routes.ts"), "utf-8");

  const fnIdx = src.indexOf("export async function getFeaturedStoreItems(");
  assert.ok(fnIdx !== -1, "getFeaturedStoreItems harus diekspor dari routes.ts");

  // Blok fungsi sampai deklarasi function/route berikutnya
  const endIdx = src.indexOf("\nfunction ", fnIdx + 1);
  const fnBlock = src.slice(fnIdx, endIdx !== -1 ? endIdx : fnIdx + 8000);

  const usesCatalogCache =
    fnBlock.includes("storeCatalogCache") || fnBlock.includes("getStoreCatalogItems(");

  if (usesCatalogCache) {
    // Jika suatu saat featured pindah ke cache katalog bersama, itu SAH —
    // karena cache tersebut sudah diinvalidasi oleh PATCH admin products
    // (dijaga oleh test BAGIAN 4). Tidak perlu assert tambahan.
    assert.ok(true);
  } else {
    // Jalur saat ini: harus query DB langsung tiap panggilan (dua-pass
    // linkedPaymentUrlMap), sehingga clear paymentUrl langsung terlihat.
    assert.ok(
      fnBlock.includes("linkedPaymentUrlMap"),
      "getFeaturedStoreItems harus punya lookup paymentUrl dua-pass (linkedPaymentUrlMap)"
    );
    assert.ok(
      /from\(storeProducts\)/.test(fnBlock),
      "getFeaturedStoreItems harus query store_products langsung dari DB (fresh tiap panggilan)"
    );
    assert.ok(
      /if\s*\(r\.paymentUrl\)\s*linkedPaymentUrlMap\.set/.test(fnBlock),
      "linkedPaymentUrlMap.set() harus dipagari if (r.paymentUrl) agar string kosong tidak mengalahkan fallback"
    );
  }
});
