// Integrasi HTTP NYATA untuk Product Registry + GAIA Publishing (Task #255:
// "Confirm only admins can create, publish, and export Registry products").
//
// Pola mengikuti tests/agent-access-guards-http.test.ts: boot Express + kirim
// request HTTP sungguhan ke port ephemeral. Bedanya, route yang dipasang di
// sini adalah route PRODUKSI yang asli (registerGaiaRegistryRoutes dari
// server/gaia-registry.ts) di atas DB Postgres NYATA — bukan tiruan — dengan
// dua dependency yang disuntik persis seperti di server/routes.ts:
//   - isAuthenticated : shim (header x-test-user → req.user), anonim = 401.
//   - getDbRole       : hanya adminId yang dipetakan ke "admin".
// Sehingga yang teruji adalah guard `requireAdmin` produksi + handler produksi.
//
// Cakupan (sesuai definisi selesai):
//   1) Anonim → 401 di semua endpoint registry.
//   2) User login NON-admin → 403 (create/list/publish/export-history).
//   3) Admin happy path: create (201, DRAFT dipaksa) → validate → lengkapi →
//      publish → response ZIP berisi product.json dengan product_id benar.
//   4) product_id PERMANEN: tidak berubah lewat PATCH maupun bump versi.
//   5) Publish produk DRAFT/incomplete → 422 + daftar `missing` yang jelas.
//
// Test ini menulis baris product_registry/gaia_export_history dengan kategori
// acak (prefix product_id unik per run) dan MEMBERSIHKANNYA di after().

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Server } from "node:http";
import JSZip from "jszip";
import { sql } from "drizzle-orm";
import { productRegistry, gaiaExportHistory } from "../shared/schema";

// ── Guard: skip cleanly when no real DB is available (konvensi suite) ────────
// server/db & server/gaia-registry di-import DINAMIS setelah guard ini supaya
// pipeline unit-only tanpa DATABASE_URL tidak gagal saat module load.
if (!process.env.DATABASE_URL) {
  console.log("[gaia-registry-admin-http] DATABASE_URL not set — skipping DB integration tests");
  process.exit(0);
}

const { db, pool } = await import("../server/db");
const { registerGaiaRegistryRoutes } = await import("../server/gaia-registry");

// Kategori acak → prefix product_id unik (GST-<4 huruf>-NNN) supaya test
// tidak bertabrakan dengan data lain dan mudah dibersihkan.
const RAND = Math.random().toString(36).replace(/[^a-z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "Q");
const CATEGORY = `Z${RAND}`; // categoryPrefix ambil 4 char alnum pertama
const ID_PREFIX = `GST-Z${RAND}-`;
const RUN = `t255-${Date.now().toString(36)}`;

const ADMIN_ID = `${RUN}-admin`;
const USER_ID = `${RUN}-user`;

// isAuthenticated shim: tanpa header = 401 (persis kontrak middleware asli).
function isAuthenticated(req: any, res: any, next: any) {
  const uid = req.headers["x-test-user"];
  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  req.user = { id: String(uid), claims: { sub: String(uid) } };
  next();
}

const getDbRole = async (req: any) => {
  const uid = req?.user?.id || "";
  return uid === ADMIN_ID ? "admin" : "user";
};

const app = express();
app.use(express.json());
registerGaiaRegistryRoutes(app, { isAuthenticated, getDbRole });

let server: Server;
let baseUrl = "";

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;
      resolve();
    });
  });
});

// Cleanup HANYA baris yang test ini ciptakan sendiri — dilacak per product_id
// PERSIS (bukan LIKE prefix kategori) supaya tidak pernah menyentuh data lain
// atau run paralel, bahkan bila prefix acak kebetulan bertabrakan.
const createdProductIds: string[] = [];

after(async () => {
  for (const pid of createdProductIds) {
    await db.delete(gaiaExportHistory).where(sql`${gaiaExportHistory.productId} = ${pid}`);
    await db.delete(productRegistry).where(sql`${productRegistry.productId} = ${pid}`);
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
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

// State happy-path (test node:test berjalan berurutan dalam satu file).
let createdId = 0;
let createdProductId = "";

// ── 1) Anonim → 401 ───────────────────────────────────────────────────────────
test("anonim: GET list 401", async () => {
  const r = await req("GET", "/api/admin/registry/products");
  assert.equal(r.status, 401);
});
test("anonim: POST create 401", async () => {
  const r = await req("POST", "/api/admin/registry/products", undefined, { name: "x" });
  assert.equal(r.status, 401);
});
test("anonim: POST publish 401", async () => {
  const r = await req("POST", "/api/admin/registry/products/1/publish");
  assert.equal(r.status, 401);
});
test("anonim: GET export-history 401", async () => {
  const r = await req("GET", "/api/admin/registry/export-history");
  assert.equal(r.status, 401);
});

// ── 2) Login NON-admin → 403 ─────────────────────────────────────────────────
test("non-admin: GET list 403", async () => {
  const r = await req("GET", "/api/admin/registry/products", USER_ID);
  assert.equal(r.status, 403);
});
test("non-admin: POST create 403 (tidak ada baris tercipta)", async () => {
  const r = await req("POST", "/api/admin/registry/products", USER_ID, {
    name: `${RUN} sneak`, slug: `${RUN}-sneak`, productType: "MINI_APP", category: CATEGORY,
  });
  assert.equal(r.status, 403);
  const [row] = await db.select().from(productRegistry).where(sql`${productRegistry.slug} = ${`${RUN}-sneak`}`);
  assert.equal(row, undefined, "create oleh non-admin tidak boleh menulis DB");
});
test("non-admin: PATCH edit 403", async () => {
  const r = await req("PATCH", "/api/admin/registry/products/1", USER_ID, { name: "hack" });
  assert.equal(r.status, 403);
});
test("non-admin: POST publish 403", async () => {
  const r = await req("POST", "/api/admin/registry/products/1/publish", USER_ID);
  assert.equal(r.status, 403);
});
test("non-admin: GET export-history 403", async () => {
  const r = await req("GET", "/api/admin/registry/export-history", USER_ID);
  assert.equal(r.status, 403);
});

// ── 3) Admin happy path ──────────────────────────────────────────────────────
test("admin: create 201 — status dipaksa DRAFT, product_id sesuai pola", async () => {
  const r = await req("POST", "/api/admin/registry/products", ADMIN_ID, {
    name: `${RUN} Produk`, slug: `${RUN}-produk`, productType: "MINI_APP", category: CATEGORY,
    status: "ACTIVE", // harus DIABAIKAN — produk baru selalu DRAFT
  });
  assert.equal(r.status, 201);
  const row = await r.json();
  createdId = row.id;
  createdProductId = row.productId;
  createdProductIds.push(row.productId);
  assert.equal(row.status, "DRAFT");
  assert.match(row.productId, new RegExp(`^${ID_PREFIX}\\d{3}$`));
});

test("admin: publish DRAFT → 422 dengan daftar missing yang jelas", async () => {
  const r = await req("POST", `/api/admin/registry/products/${createdId}/publish`, ADMIN_ID);
  assert.equal(r.status, 422);
  const body = await r.json();
  assert.ok(Array.isArray(body.missing) && body.missing.length > 0);
  assert.ok(body.missing.some((m: string) => m.includes("status")), "missing harus menyebut status ACTIVE");
  assert.ok(body.missing.some((m: string) => m.includes("price")), "missing harus menyebut price/billing FREE");
  assert.ok(body.missing.some((m: string) => m.includes("description")), "missing harus menyebut description");
});

test("admin: validate mencerminkan kondisi belum lengkap", async () => {
  const r = await req("GET", `/api/admin/registry/products/${createdId}/validate`, ADMIN_ID);
  assert.equal(r.status, 200);
  const v = await r.json();
  assert.equal(v.valid, false);
  assert.equal(v.productId, createdProductId);
});

test("admin: PATCH melengkapi produk — product_id TIDAK berubah", async () => {
  const r = await req("PATCH", `/api/admin/registry/products/${createdId}`, ADMIN_ID, {
    shortDescription: "Produk uji otomatis",
    price: 100000,
    billingType: "ONE_TIME",
    status: "ACTIVE",
    productId: "GST-HACK-999", // bukan field editable — harus diabaikan
  });
  assert.equal(r.status, 200);
  const row = await r.json();
  assert.equal(row.productId, createdProductId, "product_id permanen lintas edit");
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.gaiaStatus, "READY");
});

test("admin: bump versi — versi naik, product_id tetap", async () => {
  const r = await req("POST", `/api/admin/registry/products/${createdId}/version`, ADMIN_ID, { level: "minor" });
  assert.equal(r.status, 200);
  const row = await r.json();
  assert.equal(row.version, "1.1.0");
  assert.equal(row.productId, createdProductId, "product_id permanen lintas versi");
});

test("admin: publish 200 → ZIP berisi product.json dengan product_id benar", async () => {
  const r = await req("POST", `/api/admin/registry/products/${createdId}/publish`, ADMIN_ID);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "application/zip");
  assert.match(r.headers.get("content-disposition") || "", /attachment/);
  const buf = Buffer.from(await r.arrayBuffer());
  const zip = await JSZip.loadAsync(buf);
  const product = JSON.parse(await zip.file("product.json")!.async("string"));
  assert.equal(product.product_id, createdProductId);
  assert.equal(product.product_version, "1.1.0");
  assert.equal(product.source, "GUSTAFTA");
  assert.ok(zip.file("manifest.json") && zip.file("pricing.json") && zip.file("access.json"));
});

test("admin: export-history mencatat FAILED (422) lalu SUCCESS", async () => {
  const r = await req("GET", "/api/admin/registry/export-history", ADMIN_ID);
  assert.equal(r.status, 200);
  const rows = (await r.json()).filter((h: any) => h.productId === createdProductId);
  assert.ok(rows.some((h: any) => h.exportStatus === "FAILED"));
  assert.ok(rows.some((h: any) => h.exportStatus === "SUCCESS" && h.checksum));
});

test("admin: status produk PUBLISHED setelah publish", async () => {
  const r = await req("GET", `/api/admin/registry/products?search=${createdProductId}`, ADMIN_ID);
  assert.equal(r.status, 200);
  const rows = await r.json();
  const row = rows.find((p: any) => p.productId === createdProductId);
  assert.ok(row);
  assert.equal(row.gaiaStatus, "PUBLISHED");
  assert.equal(row.lastPublishedVersion, "1.1.0");
});
