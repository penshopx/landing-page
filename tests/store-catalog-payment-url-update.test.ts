// Task #239 — Confirm the store catalog returns the NEW payment URL immediately
// after an admin updates it — without waiting for cache expiry (TTL 30s).
//
// Skenario yang diuji:
//   1. GET katalog (cache jadi hangat dengan URL LAMA) → PATCH payment_url baru
//      lewat HTTP → GET katalog LANGSUNG → harus URL BARU, bukan URL lama.
//      Ini mereproduksi jalur end-to-end: PATCH memanggil invalidateStoreCatalog()
//      sehingga GET berikutnya cache-miss dan membangun ulang dari DB.
//   2. Kontrol negatif — bila invalidasi TIDAK dipanggil, cache hangat memang
//      menyajikan URL lama (membuktikan test #1 benar-benar menguji invalidasi,
//      bukan sekadar TTL yang kebetulan lewat).
//   3. Penjagaan statis — blok PATCH /api/store/admin/products/:id di routes.ts
//      memanggil invalidateStoreCatalog() SETELAH updateStoreProduct dan SEBELUM
//      mengirim respons.
//
// Hermetis: agen dan produk diberi nama unik (RUN prefix), dibersihkan setelah test.
// Handler HTTP adalah mirror pasti dari routes.ts (pola yang sama dengan
// store-price-override-nonpositive.test.ts) dan memakai fungsi produksi asli:
// storage.updateStoreProduct, invalidateStoreCatalog, getStoreCatalogItems.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import type { Server } from "node:http";

import { db } from "../server/db";
import { agents as agentsTable, storeProducts } from "../shared/schema";
import { inArray } from "drizzle-orm";
import { storage } from "../server/storage";
import { invalidateStoreCatalog, getStoreCatalogItems } from "../server/routes";

const RUN = `spu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const OLD_URL = `https://checkout.example.com/pay/${RUN}-old`;
const NEW_URL = `https://checkout.example.com/pay/${RUN}-new`;

const createdAgentIds: number[] = [];
const createdProductIds: number[] = [];

let server: Server;
let base = "";

function alwaysAuth(_req: any, _res: any, next: any) { next(); }

before(async () => {
  const app = express();
  app.use(express.json());

  // PATCH /api/store/admin/products/:id — mirror pasti dari routes.ts:
  // updateStoreProduct → invalidateStoreCatalog() → respons.
  app.patch("/api/store/admin/products/:id", alwaysAuth, async (req: any, res: any) => {
    try {
      if (req.body && req.body.priceOverride != null) {
        const po = Number(req.body.priceOverride);
        if (!Number.isFinite(po) || po <= 0) {
          return res.status(400).json({ error: "Override harga harus lebih besar dari 0" });
        }
      }
      const product = await storage.updateStoreProduct(Number(req.params.id), req.body);
      if (!product) return res.status(404).json({ error: "Product not found" });
      invalidateStoreCatalog();
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // GET /api/store/catalog — mirror dari routes.ts, memakai cache produksi asli
  // (getStoreCatalogItems) sehingga perilaku TTL/invalidasi identik.
  app.get("/api/store/catalog", async (req: any, res: any) => {
    try {
      const search = String(req.query.search || "").trim().toLowerCase();
      const category = String(req.query.category || "").trim();
      const allItems = await getStoreCatalogItems(category, search);
      res.json({ items: allItems, total: allItems.length });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      base = `http://127.0.0.1:${(server.address() as any).port}`;
      resolve();
    });
  });

  // Seed: agen + produk store dengan URL LAMA
  const [agentRow] = await db.insert(agentsTable).values({
    name: `${RUN} Agent`,
    isListed: false,
    isActive: true,
    paymentUrl: "",
  } as any).returning({ id: agentsTable.id });
  createdAgentIds.push(agentRow.id);

  const [prodRow] = await db.insert(storeProducts).values({
    name: `${RUN} Product`,
    description: "test product for task-239",
    price: 299_000,
    agentId: agentRow.id,
    isActive: true,
    isGustafta: false,
    sortOrder: 999,
    paymentUrl: OLD_URL,
  } as any).returning({ id: storeProducts.id });
  createdProductIds.push(prodRow.id);
});

after(async () => {
  invalidateStoreCatalog(); // jangan tinggalkan cache berisi data test
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

async function getCatalogItem(): Promise<any | undefined> {
  const res = await fetch(`${base}/api/store/catalog`);
  assert.equal(res.status, 200, "GET /api/store/catalog harus 200");
  const body = await res.json();
  return body.items.find((i: any) => i.productId === createdProductIds[0]);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1) End-to-end: PATCH payment_url → GET langsung mengembalikan URL baru
// ─────────────────────────────────────────────────────────────────────────────

test("PATCH payment_url lalu GET katalog LANGSUNG mengembalikan URL baru — tanpa menunggu TTL", async () => {
  // Hangatkan cache dengan URL LAMA (cache produksi asli, TTL 30 detik)
  invalidateStoreCatalog();
  const beforeItem = await getCatalogItem();
  assert.ok(beforeItem, "produk harus ada di katalog sebelum update");
  assert.equal(beforeItem.paymentUrl, OLD_URL, "cache hangat harus berisi URL lama");

  // Admin menyimpan payment_url baru lewat PATCH (jalur HTTP nyata)
  const patchRes = await fetch(`${base}/api/store/admin/products/${createdProductIds[0]}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentUrl: NEW_URL }),
  });
  assert.equal(patchRes.status, 200, "PATCH harus 200");

  // GET LANGSUNG setelah PATCH — masih jauh di dalam TTL 30 detik
  const afterItem = await getCatalogItem();
  assert.ok(afterItem, "produk harus masih ada di katalog");
  assert.equal(
    afterItem.paymentUrl,
    NEW_URL,
    "katalog harus langsung mengembalikan URL BARU setelah PATCH — bukan URL lama dari cache"
  );
  assert.notEqual(afterItem.paymentUrl, OLD_URL, "URL lama tidak boleh muncul");
});

// ─────────────────────────────────────────────────────────────────────────────
// 2) Kontrol negatif: tanpa invalidasi, cache hangat memang menyajikan nilai lama
// ─────────────────────────────────────────────────────────────────────────────

test("kontrol negatif: tanpa invalidateStoreCatalog(), cache hangat menyajikan URL basi", async () => {
  // Hangatkan cache dengan NEW_URL (state dari test sebelumnya)
  invalidateStoreCatalog();
  const warm = await getCatalogItem();
  assert.equal(warm?.paymentUrl, NEW_URL);

  // Tulis langsung ke DB TANPA memanggil invalidasi (mem-bypass PATCH handler)
  const { eq } = await import("drizzle-orm");
  await db.update(storeProducts)
    .set({ paymentUrl: OLD_URL } as any)
    .where(eq(storeProducts.id, createdProductIds[0]));

  // Cache masih hangat → harus tetap URL sebelumnya (membuktikan test #1
  // benar-benar bergantung pada invalidasi, bukan TTL yang kadaluarsa)
  const stale = await getCatalogItem();
  assert.equal(
    stale?.paymentUrl,
    NEW_URL,
    "tanpa invalidasi, cache hangat harus masih menyajikan nilai sebelumnya"
  );

  // Setelah invalidasi, nilai DB terbaru muncul
  invalidateStoreCatalog();
  const fresh = await getCatalogItem();
  assert.equal(fresh?.paymentUrl, OLD_URL, "setelah invalidasi, nilai DB terbaru muncul");
});

// ─────────────────────────────────────────────────────────────────────────────
// 3) Penjagaan statis: PATCH handler di routes.ts memanggil invalidateStoreCatalog
//    SETELAH updateStoreProduct dan SEBELUM respons dikirim
// ─────────────────────────────────────────────────────────────────────────────

test("routes.ts: PATCH handler memanggil invalidateStoreCatalog() setelah updateStoreProduct, sebelum res.json", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "server", "routes.ts"), "utf-8");

  const patchIdx = src.indexOf('app.patch("/api/store/admin/products/:id"');
  assert.ok(patchIdx !== -1, "handler PATCH /api/store/admin/products/:id harus ada");
  const reorderIdx = src.indexOf('app.post("/api/store/admin/products/reorder"', patchIdx);
  const block = reorderIdx !== -1 ? src.slice(patchIdx, reorderIdx) : src.slice(patchIdx, patchIdx + 1200);

  const updIdx = block.indexOf("updateStoreProduct(");
  const invIdx = block.indexOf("invalidateStoreCatalog()");
  const jsonIdx = block.indexOf("res.json(product)");
  assert.ok(updIdx !== -1, "PATCH handler harus memanggil updateStoreProduct");
  assert.ok(invIdx !== -1, "PATCH handler harus memanggil invalidateStoreCatalog()");
  assert.ok(jsonIdx !== -1, "PATCH handler harus mengirim res.json(product)");
  assert.ok(updIdx < invIdx, "invalidateStoreCatalog() harus SETELAH updateStoreProduct");
  assert.ok(invIdx < jsonIdx, "invalidateStoreCatalog() harus SEBELUM respons dikirim");
});
