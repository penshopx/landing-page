// Task #225 — Prevent an admin from accidentally saving a zero or negative
// price override to the store.
//
// Skenario yang diuji:
//   1. PATCH priceOverride=0  → 400 dengan pesan jelas, DB tidak berubah.
//   2. PATCH priceOverride=-1 → 400 dengan pesan jelas, DB tidak berubah.
//   3. PATCH priceOverride=NaN/string non-angka → 400.
//   4. PATCH priceOverride positif → 200 dan tersimpan.
//   5. PATCH priceOverride=null → 200 (hapus override, tetap diizinkan).
//   6. Statis — routes.ts: handler PATCH /api/store/admin/products/:id
//      memblokir priceOverride <= 0 SEBELUM memanggil updateStoreProduct.
//   7. Statis — admin.tsx: input Override Harga menampilkan error inline dan
//      tombol simpan dinonaktifkan saat nilai non-positif.
//
// Hermetis: produk diberi nama unik (RUN prefix), dibersihkan setelah test.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import type { Server } from "node:http";

import { db } from "../server/db";
import { storeProducts } from "../shared/schema";
import { inArray, eq } from "drizzle-orm";
import { storage } from "../server/storage";

const RUN = `povr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const createdProductIds: number[] = [];

let server: Server;
let port = 0;

function alwaysAuth(_req: any, _res: any, next: any) { next(); }

before(async () => {
  const app = express();
  app.use(express.json());

  // PATCH /api/store/admin/products/:id — mirror pasti dari routes.ts
  // TERMASUK validasi priceOverride <= 0 yang ditambahkan Task #225.
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

after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
  if (createdProductIds.length > 0) {
    await db.delete(storeProducts).where(inArray(storeProducts.id, createdProductIds));
  }
});

async function createProduct(): Promise<number> {
  const [row] = await db
    .insert(storeProducts)
    .values({
      name: `${RUN} Produk`,
      description: "tes validasi price override non-positif",
      price: 299_000,
      agentId: null,
      isActive: true,
      isGustafta: false,
      sortOrder: 999,
    } as any)
    .returning({ id: storeProducts.id });
  createdProductIds.push(row.id);
  return row.id;
}

async function patchProduct(productId: number, body: Record<string, unknown>) {
  const res = await fetch(`http://127.0.0.1:${port}/api/store/admin/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() as any };
}

async function dbOverride(productId: number): Promise<number | null> {
  const rows = await db.select({ priceOverride: storeProducts.priceOverride })
    .from(storeProducts).where(eq(storeProducts.id, productId)).limit(1);
  return rows[0]?.priceOverride ?? null;
}

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 1 — Integrasi HTTP
// ═════════════════════════════════════════════════════════════════════════════

test("PATCH priceOverride=0 → 400 dan DB tidak berubah", async () => {
  const productId = await createProduct();
  const { status, json } = await patchProduct(productId, { priceOverride: 0 });
  assert.equal(status, 400, "priceOverride=0 harus ditolak dengan 400");
  assert.match(String(json.error), /lebih besar dari 0/i, "pesan error harus jelas");
  assert.equal(await dbOverride(productId), null, "DB tidak boleh menyimpan override 0");
});

test("PATCH priceOverride=-1 → 400 dan DB tidak berubah", async () => {
  const productId = await createProduct();
  const { status, json } = await patchProduct(productId, { priceOverride: -1 });
  assert.equal(status, 400, "priceOverride=-1 harus ditolak dengan 400");
  assert.match(String(json.error), /lebih besar dari 0/i, "pesan error harus jelas");
  assert.equal(await dbOverride(productId), null, "DB tidak boleh menyimpan override negatif");
});

test("PATCH priceOverride non-angka → 400", async () => {
  const productId = await createProduct();
  const { status } = await patchProduct(productId, { priceOverride: "abc" });
  assert.equal(status, 400, "priceOverride non-angka harus ditolak dengan 400");
});

test("PATCH priceOverride positif → 200 dan tersimpan", async () => {
  const productId = await createProduct();
  const { status } = await patchProduct(productId, { priceOverride: 199_000 });
  assert.equal(status, 200, "override positif harus diterima");
  assert.equal(await dbOverride(productId), 199_000);
});

test("PATCH priceOverride=null → 200 (hapus override tetap diizinkan)", async () => {
  const productId = await createProduct();
  await patchProduct(productId, { priceOverride: 149_000 });
  const { status } = await patchProduct(productId, { priceOverride: null });
  assert.equal(status, 200, "menghapus override (null) harus tetap diizinkan");
  assert.equal(await dbOverride(productId), null);
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 2 — Statis: guard ada di kode produksi
// ═════════════════════════════════════════════════════════════════════════════

test("Statis: routes.ts memvalidasi priceOverride <= 0 di PATCH admin products", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "server", "routes.ts"), "utf8");
  const idx = src.indexOf('app.patch("/api/store/admin/products/:id"');
  assert.ok(idx >= 0, "handler PATCH /api/store/admin/products/:id harus ada");
  const handler = src.slice(idx, idx + 1200);
  assert.match(handler, /priceOverride/, "handler harus memeriksa priceOverride");
  assert.match(handler, /po <= 0|<=\s*0/, "handler harus menolak nilai <= 0");
  assert.match(handler, /status\(400\)/, "handler harus mengembalikan 400");
  assert.ok(
    handler.indexOf("status(400)") < handler.indexOf("updateStoreProduct"),
    "validasi harus terjadi SEBELUM updateStoreProduct dipanggil"
  );
});

test("Statis: admin.tsx menampilkan error inline & menonaktifkan simpan untuk override non-positif", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "client", "src", "pages", "admin.tsx"), "utf8");
  assert.match(src, /error-edit-product-price-override/, "harus ada elemen error inline untuk Override Harga");
  assert.match(src, /Override harga harus lebih besar dari 0/, "pesan error inline harus jelas");
  assert.match(
    src,
    /editProductForm\.priceOverride !== "" && Number\(editProductForm\.priceOverride\) <= 0/,
    "validasi non-positif harus memeriksa nilai form"
  );
  const disabledIdx = src.indexOf('data-testid="button-save-edit-product"');
  assert.ok(disabledIdx >= 0);
  const around = src.slice(Math.max(0, disabledIdx - 3000), disabledIdx);
  assert.match(
    around,
    /disabled=\{[^}]*priceOverride[^}]*<= 0[^}]*\}/s,
    "tombol simpan harus dinonaktifkan saat override non-positif"
  );
});
