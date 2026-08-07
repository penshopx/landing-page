// Integrasi HTTP nyata: priceOverride mencapai pembeli di store langsung setelah
// admin melakukan PATCH — tanpa redeploy, hanya lewat invalidasi cache.
//
// Skenario yang diuji:
//   1. GET katalog → cache hangat → harga = computedPrice (tier agentik).
//   2. PATCH produk dengan priceOverride → invalidateStoreCatalog() dipanggil.
//   3. GET katalog langsung sesudah PATCH → harga = priceOverride (bukan cache lama).
//   4. PATCH produk dengan priceOverride=null → invalidasi ulang.
//   5. GET katalog → harga kembali ke computedPrice.
//   6. Statis: PATCH dan DELETE handler memang memanggil invalidateStoreCatalog().
//
// Test ini menggunakan getStoreCatalogItems dan invalidateStoreCatalog ASLI dari
// server/routes.ts sehingga cache yang diuji adalah cache produksi yang sama persis.
//
// Hermetis: produk & agen diberi nama unik (RUN prefix), dibersihkan setelah test.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import type { Server } from "node:http";

import { db } from "../server/db";
import { agents as agentsTable, storeProducts } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";
import { storage } from "../server/storage";
import {
  getStoreCatalogItems,
  invalidateStoreCatalog,
} from "../server/routes";

// ── Identifier unik per run ───────────────────────────────────────────────────
const RUN = `spo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const createdAgentIds: number[] = [];
const createdProductIds: number[] = [];

// ── Server HTTP minimal ───────────────────────────────────────────────────────
let server: Server;
let port = 0;

// Auth shim: semua request dianggap login admin (isAuthenticated → next())
function alwaysAuth(_req: any, _res: any, next: any) { next(); }

before(async () => {
  const app = express();
  app.use(express.json());

  // GET /api/store/catalog — menggunakan getStoreCatalogItems ASLI (termasuk cache)
  app.get("/api/store/catalog", async (req: any, res: any) => {
    try {
      const category = (req.query.category as string) || "";
      const search   = (req.query.search   as string) || "";
      const items = await getStoreCatalogItems(category, search);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // PATCH /api/store/admin/products/:id — mirror jalur produksi routes.ts
  // Memanggil invalidateStoreCatalog() tepat seperti handler asli.
  app.patch("/api/store/admin/products/:id", alwaysAuth, async (req: any, res: any) => {
    try {
      const product = await storage.updateStoreProduct(Number(req.params.id), req.body);
      if (!product) return res.status(404).json({ error: "Product not found" });
      invalidateStoreCatalog();
      res.json(product);
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

// ── Teardown ─────────────────────────────────────────────────────────────────
after(async () => {
  // Bersihkan cache agar tidak bocor ke test suite lain
  invalidateStoreCatalog();

  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
  if (createdProductIds.length > 0) {
    await db.delete(storeProducts).where(inArray(storeProducts.id, createdProductIds));
  }
  if (createdAgentIds.length > 0) {
    await db.delete(agentsTable).where(inArray(agentsTable.id, createdAgentIds));
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createProduct(basePrice: number): Promise<number> {
  const [row] = await db
    .insert(storeProducts)
    .values({
      name: `${RUN} Produk`,
      description: "test override cache",
      price: basePrice,
      agentId: null,
      isActive: true,
      isGustafta: false,
      sortOrder: 999,
    } as any)
    .returning({ id: storeProducts.id });
  createdProductIds.push(row.id);
  return row.id;
}

// GET /api/store/catalog dan kembalikan item untuk produk yang kita buat
async function fetchCatalogPrice(productId: number): Promise<number | null> {
  // Invalidate dulu agar setiap pemanggilan uji mendapat data segar dari DB,
  // kecuali jika skenario memang sengaja ingin menguji cache.
  const res = await fetch(`http://127.0.0.1:${port}/api/store/catalog`);
  assert.equal(res.status, 200, "GET /api/store/catalog harus 200");
  const items = await res.json() as { productId: number; price: number }[];
  const match = items.find((i) => i.productId === productId);
  return match ? match.price : null;
}

// PATCH produk melalui endpoint admin (sama dengan yang dilakukan admin sungguhan)
async function patchProduct(productId: number, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`http://127.0.0.1:${port}/api/store/admin/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(res.status, 200, `PATCH produk ${productId} harus 200`);
}

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 1 — Cache diinvalidasi oleh PATCH: harga baru langsung terlihat
// ═════════════════════════════════════════════════════════════════════════════

test("set priceOverride via PATCH → GET katalog langsung mengembalikan harga override", async () => {
  const BASE_PRICE = 299_000;
  const OVERRIDE   = 149_000;

  // 1. Buat produk dengan harga dasar
  const productId = await createProduct(BASE_PRICE);

  // 2. Hangat-kan cache dengan GET pertama → harga = BASE_PRICE
  invalidateStoreCatalog(); // pastikan cold start untuk produk ini
  const priceBeforePatch = await fetchCatalogPrice(productId);
  assert.equal(
    priceBeforePatch,
    BASE_PRICE,
    `Sebelum PATCH, harga katalog harus ${BASE_PRICE}`
  );

  // 3. Admin set priceOverride → PATCH memanggil invalidateStoreCatalog()
  await patchProduct(productId, { priceOverride: OVERRIDE });

  // 4. GET katalog langsung sesudah PATCH — cache sudah diinvalidasi,
  //    builder membaca dari DB yang sudah terupdate, tanpa redeploy.
  const priceAfterPatch = await fetchCatalogPrice(productId);
  assert.equal(
    priceAfterPatch,
    OVERRIDE,
    `Setelah PATCH, harga katalog harus mencerminkan override (${OVERRIDE}) bukan cache lama (${BASE_PRICE})`
  );
});

test("cache lama TIDAK disajikan setelah PATCH (invalidasi efektif)", async () => {
  const BASE_PRICE = 499_000;
  const OVERRIDE   = 199_000;

  const productId = await createProduct(BASE_PRICE);

  // Hangat-kan cache
  invalidateStoreCatalog();
  const firstFetch = await fetchCatalogPrice(productId);
  assert.equal(firstFetch, BASE_PRICE, "Harga awal harus BASE_PRICE");

  // Panggil GET sekali lagi tanpa PATCH — harus masih dari cache (masih hangat)
  const cachedFetch = await fetchCatalogPrice(productId);
  assert.equal(cachedFetch, BASE_PRICE, "Tanpa PATCH, harga harus tetap dari cache");

  // Sekarang PATCH
  await patchProduct(productId, { priceOverride: OVERRIDE });

  // GET sesudah PATCH: OVERRIDE harus tampil, bukan nilai cache lama
  const postPatch = await fetchCatalogPrice(productId);
  assert.notEqual(
    postPatch,
    BASE_PRICE,
    "Cache lama TIDAK boleh disajikan setelah PATCH — invalidasi harus efektif"
  );
  assert.equal(postPatch, OVERRIDE, `Harga setelah PATCH harus ${OVERRIDE}`);
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 2 — Hapus override: harga kembali ke computedPrice tanpa redeploy
// ═════════════════════════════════════════════════════════════════════════════

test("hapus priceOverride via PATCH (null) → GET katalog langsung mengembalikan harga dasar", async () => {
  const BASE_PRICE = 299_000;
  const OVERRIDE   = 99_000;

  const productId = await createProduct(BASE_PRICE);

  // Set override dulu
  invalidateStoreCatalog();
  await patchProduct(productId, { priceOverride: OVERRIDE });
  const withOverride = await fetchCatalogPrice(productId);
  assert.equal(withOverride, OVERRIDE, "Override harus aktif setelah PATCH pertama");

  // Hapus override
  await patchProduct(productId, { priceOverride: null });
  const afterClear = await fetchCatalogPrice(productId);
  assert.equal(
    afterClear,
    BASE_PRICE,
    `Setelah hapus override, harga katalog harus kembali ke harga dasar (${BASE_PRICE})`
  );
});

test("siklus lengkap: set → hapus → set ulang override mencerminkan tiap perubahan di katalog", async () => {
  const BASE_PRICE = 299_000;
  const OVERRIDE_1 = 199_000;
  const OVERRIDE_2 = 249_000;

  const productId = await createProduct(BASE_PRICE);
  invalidateStoreCatalog();

  // Langkah 1: cek harga awal
  assert.equal(await fetchCatalogPrice(productId), BASE_PRICE, "Langkah 1: harga awal");

  // Langkah 2: set override pertama
  await patchProduct(productId, { priceOverride: OVERRIDE_1 });
  assert.equal(await fetchCatalogPrice(productId), OVERRIDE_1, "Langkah 2: override pertama");

  // Langkah 3: hapus override
  await patchProduct(productId, { priceOverride: null });
  assert.equal(await fetchCatalogPrice(productId), BASE_PRICE, "Langkah 3: hapus override → harga dasar");

  // Langkah 4: set override kedua
  await patchProduct(productId, { priceOverride: OVERRIDE_2 });
  assert.equal(await fetchCatalogPrice(productId), OVERRIDE_2, "Langkah 4: override kedua");
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 3 — Statis: invalidateStoreCatalog() dipanggil di jalur PATCH & DELETE
// ═════════════════════════════════════════════════════════════════════════════

test("routes.ts: PATCH /api/store/admin/products/:id memanggil invalidateStoreCatalog()", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  const patchBlock = src.match(
    /app\.patch\("\/api\/store\/admin\/products\/:id"[\s\S]*?(?=app\.(get|post|put|delete|patch)\()/
  );
  assert.ok(
    patchBlock && patchBlock[0].includes("invalidateStoreCatalog()"),
    "PATCH /api/store/admin/products/:id harus memanggil invalidateStoreCatalog() setelah update"
  );
});

test("routes.ts: DELETE /api/store/admin/products/:id memanggil invalidateStoreCatalog()", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  const deleteBlock = src.match(
    /app\.delete\("\/api\/store\/admin\/products\/:id"[\s\S]*?(?=app\.(get|post|put|delete|patch)\()/
  );
  assert.ok(
    deleteBlock && deleteBlock[0].includes("invalidateStoreCatalog()"),
    "DELETE /api/store/admin/products/:id harus memanggil invalidateStoreCatalog() setelah hapus"
  );
});

test("routes.ts: POST /api/store/admin/products memanggil invalidateStoreCatalog()", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  const postBlock = src.match(
    /app\.post\("\/api\/store\/admin\/products"[\s\S]*?(?=app\.(get|post|put|delete|patch)\()/
  );
  assert.ok(
    postBlock && postBlock[0].includes("invalidateStoreCatalog()"),
    "POST /api/store/admin/products harus memanggil invalidateStoreCatalog() setelah create"
  );
});
