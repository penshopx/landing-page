// Task #92 — Confirm clearing a product's payment link removes it from the
// Beli button without a redeploy.
//
// Skenario yang diuji:
//   1. Penjagaan statis — invalidateStoreCatalog() dipanggil di jalur POST dan PATCH.
//   2. Penjagaan statis — handleBuy di store-featured.tsx memeriksa paymentUrl
//      secara "falsy" sehingga string kosong maupun null keduanya melewati blok.
//   3. Integrasi — setelah admin mengosongkan paymentUrl lewat PATCH, cache dibatalkan
//      dan getStoreCatalogItems() mengembalikan null bukan URL lama.
//
// Hermetis: agen dan produk diberi nama unik (RUN prefix), dibersihkan setelah test.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { db } from "../server/db";
import { agents as agentsTable, storeProducts } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";
import {
  invalidateStoreCatalog,
  getStoreCatalogItems,
} from "../server/routes";

// ── Identifier unik per run ───────────────────────────────────────────────────
const RUN = `spc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const INITIAL_PAYMENT_URL = `https://checkout.example.com/pay/${RUN}`;

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

async function createAgent(): Promise<number> {
  const [row] = await db.insert(agentsTable).values({
    name: `${RUN} Agent`,
    isListed: false,
    isActive: true,
    paymentUrl: "",
  } as any).returning({ id: agentsTable.id });
  createdAgentIds.push(row.id);
  return row.id;
}

async function createProduct(agentId: number, paymentUrl: string): Promise<number> {
  const [row] = await db.insert(storeProducts).values({
    name: `${RUN} Product`,
    description: "test product for task-92",
    price: 299_000,
    agentId,
    isActive: true,
    isGustafta: false,
    sortOrder: 999,
    paymentUrl,
  } as any).returning({ id: storeProducts.id });
  createdProductIds.push(row.id);
  return row.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// BAGIAN 1 — Penjagaan statis: invalidateStoreCatalog() di jalur POST & PATCH
// ─────────────────────────────────────────────────────────────────────────────

test("routes.ts: invalidateStoreCatalog() dipanggil di jalur POST /api/store/admin/products", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  // Cari blok POST handler dan pastikan invalidateStoreCatalog() ada di sana
  // sebelum handler PATCH (yaitu POST ada sebelum PATCH dalam file)
  const postIdx = src.indexOf('app.post("/api/store/admin/products"');
  const patchIdx = src.indexOf('app.patch("/api/store/admin/products/:id"');
  assert.ok(postIdx !== -1, "handler POST /api/store/admin/products harus ada");
  assert.ok(patchIdx !== -1, "handler PATCH /api/store/admin/products/:id harus ada");

  // Blok POST handler berada SEBELUM PATCH handler
  assert.ok(postIdx < patchIdx, "POST handler harus ada sebelum PATCH handler dalam file");

  // Antara POST dan PATCH, harus ada panggilan invalidateStoreCatalog()
  const postBlock = src.slice(postIdx, patchIdx);
  assert.ok(
    postBlock.includes("invalidateStoreCatalog()"),
    "invalidateStoreCatalog() harus dipanggil di dalam blok POST handler"
  );
});

test("routes.ts: invalidateStoreCatalog() dipanggil di jalur PATCH /api/store/admin/products/:id", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  const patchIdx = src.indexOf('app.patch("/api/store/admin/products/:id"');
  // Temukan handler berikutnya setelah PATCH (reorder) untuk membatasi blok
  const reorderIdx = src.indexOf('app.post("/api/store/admin/products/reorder"');
  assert.ok(patchIdx !== -1, "handler PATCH /api/store/admin/products/:id harus ada");

  const patchBlock = reorderIdx !== -1
    ? src.slice(patchIdx, reorderIdx)
    : src.slice(patchIdx, patchIdx + 400);

  assert.ok(
    patchBlock.includes("invalidateStoreCatalog()"),
    "invalidateStoreCatalog() harus dipanggil di dalam blok PATCH handler"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// BAGIAN 2 — Penjagaan statis: handleBuy memeriksa paymentUrl secara "falsy"
// ─────────────────────────────────────────────────────────────────────────────

test("store-featured.tsx: handleBuy memeriksa agent.paymentUrl secara falsy (if (agent.paymentUrl))", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "pages", "store-featured.tsx"),
    "utf-8"
  );

  // handleBuy harus menggunakan `if (agent.paymentUrl)` atau serupa (bukan ===)
  // agar string kosong ("") maupun null keduanya terlewat
  assert.ok(
    /if\s*\(\s*agent\.paymentUrl\s*\)/.test(src),
    "handleBuy harus memeriksa if (agent.paymentUrl) agar string kosong dan null keduanya terlewat"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// BAGIAN 3 — Integrasi: mengosongkan paymentUrl langsung terlihat di katalog
// ─────────────────────────────────────────────────────────────────────────────

let agentId: number;
let productId: number;

before(async () => {
  agentId = await createAgent();
  productId = await createProduct(agentId, INITIAL_PAYMENT_URL);
});

test("setelah produk dibuat dengan paymentUrl, katalog mengembalikan URL tersebut", async () => {
  // Pastikan cache bersih terlebih dahulu (simulasi POST yang memanggil invalidate)
  invalidateStoreCatalog();

  const items = await getStoreCatalogItems("", "");
  const item = items.find((i: any) => i.productId === productId);
  assert.ok(item, `produk ${productId} harus ada di katalog`);
  assert.equal(
    item.paymentUrl,
    INITIAL_PAYMENT_URL,
    "paymentUrl harus sama dengan yang disimpan"
  );
});

test("setelah paymentUrl dikosongkan dan cache dibatalkan, katalog mengembalikan null — bukan URL lama", async () => {
  // Simulasi admin mengosongkan paymentUrl (seperti PATCH handler)
  await db.update(storeProducts)
    .set({ paymentUrl: "" } as any)
    .where(eq(storeProducts.id, productId));

  // Simulasi invalidateStoreCatalog() yang dipanggil PATCH handler
  invalidateStoreCatalog();

  // getStoreCatalogItems() harus membangun ulang dari DB (cache sudah dibatalkan)
  const items = await getStoreCatalogItems("", "");
  const item = items.find((i: any) => i.productId === productId);
  assert.ok(item, `produk ${productId} harus masih ada di katalog`);
  assert.equal(
    item.paymentUrl,
    null,
    "setelah paymentUrl dikosongkan dan cache dibatalkan, paymentUrl harus null — bukan URL lama"
  );
});

test("cache tidak menyajikan URL lama setelah invalidasi (tidak ada jendela basi)", async () => {
  // Kembalikan paymentUrl ke nilai awal untuk kontrol awal
  await db.update(storeProducts)
    .set({ paymentUrl: INITIAL_PAYMENT_URL } as any)
    .where(eq(storeProducts.id, productId));
  invalidateStoreCatalog();

  // Pastikan URL awal muncul
  let items = await getStoreCatalogItems("", "");
  let item = items.find((i: any) => i.productId === productId);
  assert.equal(item?.paymentUrl, INITIAL_PAYMENT_URL, "URL awal harus muncul setelah rebuild");

  // Sekarang kosongkan dan invalidasi — cache tidak boleh menyajikan URL lama
  await db.update(storeProducts)
    .set({ paymentUrl: "" } as any)
    .where(eq(storeProducts.id, productId));
  invalidateStoreCatalog();

  items = await getStoreCatalogItems("", "");
  item = items.find((i: any) => i.productId === productId);
  assert.equal(
    item?.paymentUrl ?? null,
    null,
    "URL lama tidak boleh muncul setelah invalidasi — tidak ada jendela cache basi"
  );
});
