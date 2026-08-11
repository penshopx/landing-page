/**
 * Task #313A — Jalur checkout Scalev v3 untuk Unified Order API.
 *
 * TANPA transaksi nyata: panggilan ke api.scalev.com di-mock dengan
 * meng-intersep global fetch KHUSUS host Scalev (request lain tetap asli).
 *
 * Cakupan:
 * 1. Item dengan mapping scalev_variant_unique_id → 201 payment_mode
 *    SCALEV_ORDER, payment_url dari respons Scalev, scalev_order_id tersimpan.
 * 2. Create order Scalev GAGAL → fallback MANUAL_WA, order tetap pending,
 *    scalev_order_id kosong (tidak berpura-pura siap dibayar).
 * 3. Item tanpa mapping → MANUAL_WA (tidak ada panggilan Scalev sama sekali).
 * 4. Webhook /api/webhooks/scalev dengan data.order_id yang cocok ke
 *    store_orders.scalev_order_id → order api_v1 jadi paid (korelasi
 *    deterministik), webhook non-paid tidak mengubah status, dan order_id
 *    asing tetap jatuh ke cabang legacy (200, tanpa efek pada order kita).
 *
 * DB-backed (DB dev = DB prod!): semua baris uji memakai email khusus dan
 * dihapus di after(); registry TIDAK dimutasi — mapping variant disuntik via
 * produk registry uji sendiri yang juga dibersihkan.
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `oapi313_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_EMAIL = `${RUN}@example.test`;
const TEST_PRODUCT_ID = `GST-TST-${RUN.slice(-6).toUpperCase()}`;
// Produk uji TANPA mapping variant — item registry nyata kini semua termapping
// (provisioning #313B-1), jadi tes fallback butuh item uji sendiri.
const TEST_PRODUCT_ID_UNMAPPED = `GST-TSU-${RUN.slice(-6).toUpperCase()}`;
const API_KEY = "kunci-order-tes-313a";
const SCALEV_ORDER_ID = `TST${RUN.slice(-8).toUpperCase()}`;

let orderServer: Server; let orderBase: string;
let routesServer: Server; let routesBase: string;
let db: any, storeOrders: any, productRegistry: any, eq: any;

// ── Intersep fetch hanya untuk host Scalev ────────────────────────────────────
const realFetch = globalThis.fetch;
type ScalevMode = "ok" | "fail" | "off";
let scalevMode: ScalevMode = "off";
let scalevCalls: any[] = [];

function installScalevMock() {
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === "string" ? input : input?.url ?? String(input);
    if (url.includes("api.scalev.com")) {
      scalevCalls.push({ url, body: init?.body ? JSON.parse(init.body) : null });
      if (scalevMode === "fail") {
        return new Response(JSON.stringify({ error: "simulated failure" }), { status: 500 });
      }
      return new Response(JSON.stringify({
        data: {
          id: "01948092-9b80-7f91-b23d-1a8686278331",
          order_id: SCALEV_ORDER_ID,
          public_order_url: `https://bayar.dokumenproyek.com/o/secret-${RUN}`,
          payment_url: `https://bayar.dokumenproyek.com/o/secret-${RUN}/success`,
        },
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return realFetch(input, init);
  }) as any;
}

before(async () => {
  if (!hasDb) return;
  process.env.ORDER_API_KEY = API_KEY;
  process.env.SCALEV_STORE_UNIQUE_ID = "store_TESTONLY";
  process.env.SCALEV_API_KEY = process.env.SCALEV_API_KEY || "dummy-key-tes";
  delete process.env.META_CAPI_ACCESS_TOKEN;
  delete process.env.META_PIXEL_ID;
  installScalevMock();

  ({ db } = await import("../server/db"));
  ({ storeOrders, productRegistry } = await import("../shared/schema"));
  ({ eq } = await import("drizzle-orm"));

  // Produk registry uji dengan mapping variant Scalev (dibersihkan di after).
  await db.insert(productRegistry).values({
    productId: TEST_PRODUCT_ID,
    name: `Produk Tes 313A ${RUN}`,
    slug: `produk-tes-313a-${RUN}`,
    productType: "DOCUMENT_TOOL",
    category: "TEST",
    price: 123000,
    billingType: "ONE_TIME",
    status: "ACTIVE",
    visibility: "STANDALONE_ONLY",
    scalevVariantUniqueId: `variant_TES_${RUN}`,
  } as any);
  await db.insert(productRegistry).values({
    productId: TEST_PRODUCT_ID_UNMAPPED,
    name: `Produk Tes 313A tanpa mapping ${RUN}`,
    slug: `produk-tes-313a-unmapped-${RUN}`,
    productType: "DOCUMENT_TOOL",
    category: "TEST",
    price: 45000,
    billingType: "ONE_TIME",
    status: "ACTIVE",
    visibility: "STANDALONE_ONLY",
  } as any);

  // App 1: hanya Order API (ringan).
  {
    const { registerOrderApiRoutes } = await import("../server/order-api");
    const app = express();
    app.use(express.json());
    registerOrderApiRoutes(app);
    orderServer = app.listen(0);
    orderBase = `http://127.0.0.1:${(orderServer.address() as AddressInfo).port}`;
  }
  // App 2: routes penuh untuk webhook Scalev (pola tes webhook existing).
  {
    const app = express();
    app.use(express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
    const httpServer = createServer(app);
    const { registerRoutes } = await import("../server/routes");
    await registerRoutes(httpServer, app);
    await new Promise<void>((r) => httpServer.listen(0, "127.0.0.1", r));
    routesServer = httpServer;
    routesBase = `http://127.0.0.1:${(routesServer.address() as AddressInfo).port}`;
  }
});

after(async () => {
  globalThis.fetch = realFetch;
  if (!hasDb) return;
  try {
    await db.delete(storeOrders).where(eq(storeOrders.customerEmail, TEST_EMAIL));
    await db.delete(productRegistry).where(eq(productRegistry.productId, TEST_PRODUCT_ID));
    await db.delete(productRegistry).where(eq(productRegistry.productId, TEST_PRODUCT_ID_UNMAPPED));
  } finally {
    orderServer?.close();
    routesServer?.close();
  }
});

const buyer = { name: "Tes 313A", email: TEST_EMAIL, phone: "+62811111111" };
const createOrder = async (body: any) => {
  const r = await fetch(`${orderBase}/api/v1/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  return { status: r.status, json: await r.json() };
};
const postWebhook = async (payload: any) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.SCALEV_WEBHOOK_SECRET) headers["x-scalev-secret"] = process.env.SCALEV_WEBHOOK_SECRET;
  const r = await fetch(`${routesBase}/api/webhooks/scalev`, { method: "POST", headers, body: JSON.stringify(payload) });
  return { status: r.status, json: await r.json() };
};
const getOrderRow = async (orderRef: string) => {
  const rows = await db.select().from(storeOrders).where(eq(storeOrders.midtransOrderId, orderRef)).limit(1);
  return rows[0];
};

let scalevOrderRef = "";

test("1. mapping variant → SCALEV_ORDER: payment_url Scalev + scalev_order_id tersimpan", { skip: SKIP }, async () => {
  scalevMode = "ok"; scalevCalls = [];
  const r = await createOrder({ product_id: TEST_PRODUCT_ID, buyer });
  assert.equal(r.status, 201);
  assert.equal(r.json.payment_mode, "SCALEV_ORDER");
  assert.equal(r.json.payment_url, `https://bayar.dokumenproyek.com/o/secret-${RUN}`);
  assert.equal(r.json.wa_order_url, null);
  scalevOrderRef = r.json.order_ref;
  // Payload final ke Scalev: field wajib + metadata defense-in-depth.
  assert.equal(scalevCalls.length, 1);
  const sent = scalevCalls[0].body;
  assert.equal(sent.store_unique_id, "store_TESTONLY");
  assert.equal(sent.ordervariants[0].variant_unique_id, `variant_TES_${RUN}`);
  assert.equal(sent.customer_name, buyer.name);
  assert.equal(sent.metadata.order_ref, scalevOrderRef);
  // DB: scalev_order_id tersimpan, status pending, harga server-side.
  const row = await getOrderRow(scalevOrderRef);
  assert.equal(row.scalevOrderId, SCALEV_ORDER_ID);
  assert.equal(row.status, "pending");
  assert.equal(row.amount, 123000);
  assert.equal(row.source, "api_v1");
});

test("2. create Scalev gagal → fallback MANUAL_WA, order tetap pending tanpa scalev_order_id", { skip: SKIP }, async () => {
  scalevMode = "fail"; scalevCalls = [];
  const r = await createOrder({ product_id: TEST_PRODUCT_ID, buyer });
  assert.equal(r.status, 201);
  assert.equal(r.json.payment_mode, "MANUAL_WA");
  assert.equal(r.json.payment_url, null);
  assert.ok(r.json.wa_order_url.includes(encodeURIComponent(r.json.order_ref)));
  const row = await getOrderRow(r.json.order_ref);
  assert.equal(row.scalevOrderId, null);
  assert.equal(row.status, "pending");
});

test("3. tanpa mapping variant → MANUAL_WA tanpa panggilan Scalev", { skip: SKIP }, async () => {
  scalevMode = "ok"; scalevCalls = [];
  const r = await createOrder({ product_id: TEST_PRODUCT_ID_UNMAPPED, buyer });
  assert.equal(r.status, 201);
  assert.equal(r.json.payment_mode, "MANUAL_WA");
  assert.equal(scalevCalls.length, 0);
});

test("4a. webhook non-paid TIDAK mengubah status order api_v1", { skip: SKIP }, async () => {
  const r = await postWebhook({ event: "payment_status_changed", data: { order_id: SCALEV_ORDER_ID, payment_status: "pending" } });
  assert.equal(r.status, 200);
  assert.equal((await getOrderRow(scalevOrderRef)).status, "pending");
});

test("4b. webhook paid dengan data.order_id cocok → order api_v1 jadi paid (deterministik)", { skip: SKIP }, async () => {
  const r = await postWebhook({
    event: "payment_status_changed",
    data: {
      order_id: SCALEV_ORDER_ID,
      payment_status: "paid",
      gross_revenue: "123000",
      customer: { email: TEST_EMAIL, name: buyer.name, phone: "081111111" },
    },
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.note, "api_v1 order marked paid");
  assert.equal(r.json.order_ref, scalevOrderRef);
  assert.equal((await getOrderRow(scalevOrderRef)).status, "paid");
  // Idempoten: webhook diulang → tetap 200, tetap paid, tanpa duplikasi.
  const r2 = await postWebhook({ event: "payment_status_changed", data: { order_id: SCALEV_ORDER_ID, payment_status: "paid" } });
  assert.equal(r2.status, 200);
  assert.equal((await getOrderRow(scalevOrderRef)).status, "paid");
});

test("4d. RACE: webhook tiba sebelum scalev_order_id tersimpan → fallback metadata.order_ref menandai paid + backfill", { skip: SKIP }, async () => {
  // Simulasikan race: order api_v1 pending TANPA scalev_order_id (persist belum sempat).
  scalevMode = "fail"; // create Scalev "gagal" → order MANUAL_WA tanpa scalev_order_id
  const r = await createOrder({ product_id: TEST_PRODUCT_ID, buyer });
  assert.equal(r.status, 201);
  const ref = r.json.order_ref;
  assert.equal((await getOrderRow(ref)).scalevOrderId, null);
  // Webhook paid membawa metadata.order_ref (defense-in-depth yang kita kirim saat create).
  const raceScalevId = `RACE${RUN.slice(-6).toUpperCase()}`;
  const w = await postWebhook({
    event: "payment_status_changed",
    data: { order_id: raceScalevId, payment_status: "paid", metadata: { order_ref: ref } },
  });
  assert.equal(w.status, 200);
  assert.equal(w.json.note, "api_v1 order marked paid");
  const row = await getOrderRow(ref);
  assert.equal(row.status, "paid");
  assert.equal(row.scalevOrderId, raceScalevId); // backfill → retry berikutnya match via order_id
});

test("4c. order_id asing → jatuh ke cabang legacy (200), order kita tak tersentuh", { skip: SKIP }, async () => {
  const r = await postWebhook({
    event: "payment_status_changed",
    data: { order_id: `LEGACY-${RUN}`, payment_status: "paid", product_name: `Produk Tak Dikenal ${RUN}`, customer: { email: TEST_EMAIL, name: "X" } },
  });
  assert.equal(r.status, 200);
  assert.notEqual(r.json.note, "api_v1 order marked paid");
  assert.equal((await getOrderRow(scalevOrderRef)).status, "paid");
});
