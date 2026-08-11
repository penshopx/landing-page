// Tes Unified Order API — POST /api/v1/orders (Fase B).
//
// Cakupan: fail-closed, Bearer auth, dan seluruh jalur validasi 4xx yang TIDAK
// menyentuh database. Jalur 201 (order nyata) sengaja tidak dites otomatis di
// sini karena menulis ke store_orders pada DB bersama (dev = prod) — dicakup
// smoke test manual dengan cleanup eksplisit.
//
// Jalankan: npx tsx --test tests/order-api.test.ts

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Server } from "http";

let server: Server;
let base: string;

before(async () => {
  delete process.env.ORDER_API_KEY;
  const { registerOrderApiRoutes } = await import("../server/order-api");
  const app = express();
  // Cermin guard pra-parse di server/index.ts (64KB untuk /api/v1/orders).
  app.use("/api/v1/orders", (req, res, next) => {
    const len = Number(req.headers["content-length"] || 0);
    if (len > 64 * 1024) return res.status(413).json({ error: "payload_too_large" });
    next();
  });
  app.use(express.json({ limit: "50mb" }));
  registerOrderApiRoutes(app);
  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${(server.address() as any).port}/api/v1/orders`;
});

after(() => server?.close());

const buyer = { name: "Tes", email: "tes@contoh.id" };
const call = (opts: { key?: string; body?: any; raw?: string }) =>
  fetch(base, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(opts.key ? { Authorization: `Bearer ${opts.key}` } : {}),
    },
    body: opts.raw ?? JSON.stringify(opts.body ?? {}),
  });

test("fail-closed: tanpa ORDER_API_KEY semua request → 503", async () => {
  delete process.env.ORDER_API_KEY;
  const r = await call({ key: "apapun", body: { product_id: "X", buyer } });
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error, "service_not_configured");
});

test("401 bila Authorization hilang atau key salah", async () => {
  process.env.ORDER_API_KEY = "kunci-tes";
  for (const opts of [{ body: { product_id: "X", buyer } }, { key: "salah", body: { product_id: "X", buyer } }]) {
    const r = await call(opts as any);
    assert.equal(r.status, 401);
    assert.ok(!JSON.stringify(await r.json()).includes("kunci-tes"));
  }
});

test("400 untuk input tidak valid (tanpa menyentuh DB)", async () => {
  process.env.ORDER_API_KEY = "kunci-tes";
  const cases: any[] = [
    { buyer },                                        // C: keduanya kosong
    { product_id: "A", package_id: "B", buyer },      // keduanya diisi
    { product_id: 5, buyer },                         // tipe salah
    { product_id: "A" },                              // buyer hilang
    { product_id: "A", buyer: { name: "x" } },        // email hilang
    { product_id: "A", buyer: { name: "x", email: "bukan-email" } },
    { product_id: "A", buyer: { ...buyer, phone: "abc!!" } },
    { product_id: "A", buyer, amount: 1 },            // F: harga dari klien ditolak
    { product_id: "A", buyer, price: 5 },
    { product_id: "x".repeat(61), buyer },            // ID kepanjangan
  ];
  for (const body of cases) {
    const r = await call({ key: "kunci-tes", body });
    assert.equal(r.status, 400, JSON.stringify(body).slice(0, 80));
    assert.equal((await r.json()).error, "invalid_request");
  }
});

test("413 untuk body melebihi 64KB (pra-parse guard)", async () => {
  process.env.ORDER_API_KEY = "kunci-tes";
  const r = await call({ key: "kunci-tes", raw: JSON.stringify({ product_id: "A", buyer, x: "y".repeat(70 * 1024) }) });
  assert.equal(r.status, 413);
});
