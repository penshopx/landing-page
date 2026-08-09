// Task #144 — Confirm the price display in the admin list stays accurate after
// an admin edits a product's priceOverride.
//
// Skenario yang diuji:
//   1. GET /api/store/admin/products → baris produk memuat priceOverride dan
//      computedPrice yang sesuai dengan data di DB.
//   2. Admin PATCH priceOverride → GET admin list langsung mengembalikan nilai
//      baru (bukan data lama).
//   3. Admin PATCH priceOverride=null → GET admin list mengembalikan
//      priceOverride: null sehingga UI menampilkan computedPrice / price dasar.
//   4. Statis — admin.tsx: updateProductMutation.onSuccess memanggil
//      invalidateQueries(["/api/store/admin/products"]) agar React Query
//      otomatis refetch setelah simpan dialog.
//   5. Statis — admin.tsx: baris produk merender badge "override" (teks
//      "override") ketika priceOverride != null, dan menampilkan priceOverride
//      sebagai harga efektif.
//
// Hermetis: produk diberi nama unik (RUN prefix), dibersihkan setelah test.

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

// ── Identifier unik per run ───────────────────────────────────────────────────
const RUN = `aplo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const createdProductIds: number[] = [];

// ── Server HTTP minimal ───────────────────────────────────────────────────────
let server: Server;
let port = 0;

function alwaysAuth(_req: any, _res: any, next: any) { next(); }

// Mirror produksi /api/store/admin/products tanpa kalkulasi agentik (produk
// tanpa agentId) — cukup untuk verifikasi priceOverride dan computedPrice.
async function getAdminProducts(productId: number): Promise<any> {
  const res = await fetch(`http://127.0.0.1:${port}/api/store/admin/products`);
  assert.equal(res.status, 200, "GET /api/store/admin/products harus 200");
  const list = await res.json() as any[];
  return list.find((p) => p.id === productId) ?? null;
}

async function patchProduct(productId: number, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`http://127.0.0.1:${port}/api/store/admin/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(res.status, 200, `PATCH produk ${productId} harus 200`);
  return res.json();
}

before(async () => {
  const app = express();
  app.use(express.json());

  // GET /api/store/admin/products — mirror produksi (tanpa kalkulasi agentik
  // untuk kesederhanaan: agentId null → computedPrice = price)
  app.get("/api/store/admin/products", alwaysAuth, async (_req: any, res: any) => {
    try {
      const rows = await db.select().from(storeProducts).orderBy(storeProducts.sortOrder, storeProducts.id);
      const enriched = rows.map((p: any) => ({
        ...p,
        computedPrice: p.price, // tanpa agentId, computedPrice = price
        teamSize: null,
      }));
      res.json(enriched);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // PATCH /api/store/admin/products/:id
  app.patch("/api/store/admin/products/:id", alwaysAuth, async (req: any, res: any) => {
    try {
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

// ── Helper: buat produk ───────────────────────────────────────────────────────
async function createProduct(basePrice: number): Promise<number> {
  const [row] = await db
    .insert(storeProducts)
    .values({
      name: `${RUN} Produk`,
      description: "tes admin price override",
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

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 1 — Integrasi HTTP: GET admin list mencerminkan perubahan setelah PATCH
// ═════════════════════════════════════════════════════════════════════════════

test("GET /api/store/admin/products mengembalikan priceOverride dan computedPrice dari DB", async () => {
  const BASE_PRICE = 299_000;
  const productId = await createProduct(BASE_PRICE);

  const row = await getAdminProducts(productId);
  assert.ok(row, "Produk harus ada di daftar admin");
  assert.equal(row.price, BASE_PRICE, "price harus sesuai nilai dasar");
  assert.equal(row.computedPrice, BASE_PRICE, "computedPrice tanpa agen harus sama dengan price");
  assert.equal(row.priceOverride, null, "priceOverride harus null sebelum diisi");
});

test("PATCH priceOverride → GET admin list langsung mengembalikan harga override", async () => {
  const BASE_PRICE = 499_000;
  const OVERRIDE   = 199_000;
  const productId = await createProduct(BASE_PRICE);

  // Sebelum PATCH
  const before = await getAdminProducts(productId);
  assert.equal(before?.priceOverride, null, "priceOverride harus null sebelum PATCH");

  // PATCH set override
  await patchProduct(productId, { priceOverride: OVERRIDE });

  // GET langsung sesudah PATCH — harus mencerminkan nilai baru
  const after = await getAdminProducts(productId);
  assert.ok(after, "Produk harus masih ada di daftar admin setelah PATCH");
  assert.equal(
    after.priceOverride,
    OVERRIDE,
    `priceOverride harus ${OVERRIDE} setelah PATCH, bukan nilai lama`
  );
  // price dasar dan computedPrice tidak berubah
  assert.equal(after.price, BASE_PRICE, "price dasar tidak boleh berubah karena PATCH priceOverride");
});

test("PATCH priceOverride=null → GET admin list mengembalikan priceOverride: null", async () => {
  const BASE_PRICE = 399_000;
  const OVERRIDE   = 149_000;
  const productId = await createProduct(BASE_PRICE);

  // Set override dulu
  await patchProduct(productId, { priceOverride: OVERRIDE });
  const withOverride = await getAdminProducts(productId);
  assert.equal(withOverride?.priceOverride, OVERRIDE, "Override harus aktif setelah PATCH pertama");

  // Hapus override
  await patchProduct(productId, { priceOverride: null });
  const cleared = await getAdminProducts(productId);
  assert.equal(
    cleared?.priceOverride,
    null,
    "priceOverride harus null setelah dihapus (pembeli melihat harga dasar)"
  );
  assert.equal(
    cleared?.price,
    BASE_PRICE,
    "price dasar harus tetap setelah override dihapus"
  );
});

test("siklus lengkap: set → hapus → set ulang override tercermin di admin list", async () => {
  const BASE_PRICE = 299_000;
  const OVERRIDE_1 = 199_000;
  const OVERRIDE_2 = 249_000;
  const productId = await createProduct(BASE_PRICE);

  // Langkah 1: priceOverride awal = null
  assert.equal((await getAdminProducts(productId))?.priceOverride, null, "Langkah 1: belum ada override");

  // Langkah 2: set override pertama
  await patchProduct(productId, { priceOverride: OVERRIDE_1 });
  assert.equal((await getAdminProducts(productId))?.priceOverride, OVERRIDE_1, "Langkah 2: override pertama aktif");

  // Langkah 3: hapus override
  await patchProduct(productId, { priceOverride: null });
  assert.equal((await getAdminProducts(productId))?.priceOverride, null, "Langkah 3: override dihapus");

  // Langkah 4: set override kedua
  await patchProduct(productId, { priceOverride: OVERRIDE_2 });
  assert.equal((await getAdminProducts(productId))?.priceOverride, OVERRIDE_2, "Langkah 4: override kedua aktif");
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 2 — Statis: React Query cache diinvalidasi oleh updateProductMutation
// ═════════════════════════════════════════════════════════════════════════════

test("admin.tsx: updateProductMutation.onSuccess memanggil invalidateQueries(['/api/store/admin/products'])", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "pages", "admin.tsx"),
    "utf-8"
  );

  // Cari blok updateProductMutation
  const mutationBlock = src.match(
    /const updateProductMutation\s*=\s*useMutation\(\{[\s\S]*?(?=\n  const )/
  );
  assert.ok(
    mutationBlock,
    "updateProductMutation harus didefinisikan di admin.tsx"
  );

  const block = mutationBlock[0];
  assert.ok(
    block.includes('invalidateQueries({ queryKey: ["/api/store/admin/products"] })'),
    "updateProductMutation.onSuccess harus memanggil invalidateQueries dengan key '/api/store/admin/products' — " +
    "tanpa ini, React Query tidak akan refetch daftar admin setelah dialog disimpan"
  );
});

test("admin.tsx: updateProductMutation.onSuccess juga memanggil invalidateQueries(['/api/store/catalog'])", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "pages", "admin.tsx"),
    "utf-8"
  );

  const mutationBlock = src.match(
    /const updateProductMutation\s*=\s*useMutation\(\{[\s\S]*?(?=\n  const )/
  );
  assert.ok(mutationBlock, "updateProductMutation harus didefinisikan");

  const block = mutationBlock[0];
  assert.ok(
    block.includes('invalidateQueries({ queryKey: ["/api/store/catalog"] })'),
    "updateProductMutation.onSuccess harus juga memanggil invalidateQueries dengan key '/api/store/catalog' " +
    "agar buyer catalog ikut diperbarui"
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 3 — Statis: UI admin merender badge "override" saat priceOverride aktif
// ═════════════════════════════════════════════════════════════════════════════

test("admin.tsx: baris produk menampilkan badge 'override' ketika priceOverride != null", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "pages", "admin.tsx"),
    "utf-8"
  );

  // Cari blok kondisi rendering priceOverride di baris produk
  assert.ok(
    src.includes("p.priceOverride != null"),
    "Baris produk admin harus memeriksa kondisi p.priceOverride != null"
  );
  assert.ok(
    src.includes(">override<"),
    "Baris produk admin harus menampilkan teks 'override' sebagai badge saat priceOverride aktif"
  );
});

test("admin.tsx: saat priceOverride aktif, nilai priceOverride ditampilkan sebagai harga efektif", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "pages", "admin.tsx"),
    "utf-8"
  );

  // Pastikan p.priceOverride dirender sebagai nilai harga dalam blok kondisi priceOverride
  assert.ok(
    src.includes("p.priceOverride.toLocaleString"),
    "Baris produk admin harus merender p.priceOverride.toLocaleString sebagai harga efektif"
  );

  // Pastikan harga lama (computedPrice atau price) dicoret ketika override aktif
  assert.ok(
    src.includes("line-through") && src.includes("p.computedPrice ?? p.price"),
    "Baris produk harus menampilkan harga dasar dengan garis coret saat override aktif"
  );
});

test("admin.tsx: saat priceOverride null, computedPrice (atau price) ditampilkan tanpa badge override", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "pages", "admin.tsx"),
    "utf-8"
  );

  // Blok else: tampilkan computedPrice ?? price
  assert.ok(
    src.includes("p.computedPrice ?? p.price"),
    "Baris produk harus menampilkan computedPrice ?? price sebagai fallback saat tidak ada override"
  );
});

test("admin.tsx: edit dialog mengirimkan priceOverride: null ketika kolom override dikosongkan", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "pages", "admin.tsx"),
    "utf-8"
  );

  // Pastikan save handler mengonversi string kosong ke null
  assert.ok(
    src.includes("priceOverride: editProductForm.priceOverride ? Number(editProductForm.priceOverride) : null"),
    "Save handler edit dialog harus mengirim null (bukan string kosong) ketika priceOverride tidak diisi — " +
    "tanpa ini, string kosong dikirim dan DB menyimpan nilai yang salah"
  );
});
