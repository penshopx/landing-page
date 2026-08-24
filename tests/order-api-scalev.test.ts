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
import { SBU_SKK_EBOOK } from "../shared/sbu-skk-ebook";

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `oapi313_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_EMAIL = `${RUN}@example.test`;
const TEST_PRODUCT_ID = `GST-TST-${RUN.slice(-6).toUpperCase()}`;
// Produk uji TANPA mapping variant — item registry nyata kini semua termapping
// (provisioning #313B-1), jadi tes fallback butuh item uji sendiri.
const TEST_PRODUCT_ID_UNMAPPED = `GST-TSU-${RUN.slice(-6).toUpperCase()}`;
const TEST_PRODUCT_ID_LATE = `GST-TSL-${RUN.slice(-6).toUpperCase()}`;
const TEST_PACKAGE_ID = `PKG-TST-${RUN.slice(-6).toUpperCase()}`;
const API_KEY = "kunci-order-tes-313a";
const SCALEV_ORDER_ID = `TST${RUN.slice(-8).toUpperCase()}`;
const HOSTED_SCALEV_ORDER_ID = `HST${RUN.slice(-8).toUpperCase()}`;
const HOSTED_DEFERRED_ORDER_ID = `HSD${RUN.slice(-8).toUpperCase()}`;
const HOSTED_BACKFILL_ORDER_ID = `HSB${RUN.slice(-8).toUpperCase()}`;
const LEVEL_ONE_HOSTED_ORDER_ID = `HSL${RUN.slice(-8).toUpperCase()}`;

let orderServer: Server; let orderBase: string;
let routesServer: Server; let routesBase: string;
let db: any, storeOrders: any, productRegistry: any, productEntitlements: any;
let digitalProductFiles: any;
let packageRegistry: any, packageVersionSnapshots: any;
let solutionRegistry: any, sectorRegistry: any, tierRegistry: any, eq: any;

// ── Intersep fetch hanya untuk host Scalev ────────────────────────────────────
const realFetch = globalThis.fetch;
type ScalevMode = "ok" | "fail" | "off";
let scalevMode: ScalevMode = "off";
let scalevCalls: any[] = [];
let metaCalls: any[] = [];
let metaMode: "ok" | "fail" = "ok";

function installScalevMock() {
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === "string" ? input : input?.url ?? String(input);
    if (url.includes("api.brevo.com")) {
      return new Response(JSON.stringify({ messageId: `test-${RUN}` }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("graph.facebook.com")) {
      metaCalls.push({
        url,
        body: init?.body ? JSON.parse(init.body) : null,
      });
      if (metaMode === "fail") {
        return new Response(
          JSON.stringify({ error: { message: "simulated Meta failure" } }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ events_received: 1, fbtrace_id: `trace-${RUN}` }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.includes("api.scalev.com")) {
      scalevCalls.push({ url, body: init?.body ? JSON.parse(init.body) : null });
      if (scalevMode === "fail") {
        return new Response(JSON.stringify({ error: "simulated failure" }), { status: 500 });
      }
      if ((init?.method || "GET").toUpperCase() === "GET") {
        const providerOrderRef = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
        return new Response(JSON.stringify({
          data: {
            order_id: providerOrderRef,
            status: "completed",
            payment_status: "paid",
            gross_revenue: "123000",
            customer: { email: TEST_EMAIL, name: buyer.name, phone: "081111111" },
            variants: {
              [`Produk Tes 313A ${RUN}`]: {
                quantity: 1,
                variant_unique_id: `variant_TES_${RUN}`,
              },
            },
            final_variants: { [`Produk Tes 313A ${RUN}`]: 1 },
          },
        }), { status: 200, headers: { "Content-Type": "application/json" } });
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
  ({
    storeOrders,
    productRegistry,
    productEntitlements,
    digitalProductFiles,
    packageRegistry,
    packageVersionSnapshots,
    solutionRegistry,
    sectorRegistry,
    tierRegistry,
  } = await import("../shared/schema"));
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
  const [solution] = await db.select().from(solutionRegistry).limit(1);
  const [sector] = await db.select().from(sectorRegistry).limit(1);
  const [tier] = await db.select().from(tierRegistry).limit(1);
  assert.ok(solution && sector && tier, "Registry dasar paket harus tersedia");
  const [testPackage] = await db.insert(packageRegistry).values({
    packageId: TEST_PACKAGE_ID,
    solutionId: solution.id,
    sectorId: sector.id,
    tierId: tier.id,
    name: `Paket Tes Fulfillment ${RUN}`,
    slug: `paket-tes-fulfillment-${RUN}`,
    status: "ACTIVE",
    durationValue: 3,
    durationUnit: "MONTH",
    price: 168000,
    version: 1,
  } as any).returning();
  await db.insert(packageVersionSnapshots).values({
    packageDbId: testPackage.id,
    packageId: TEST_PACKAGE_ID,
    version: 1,
    name: testPackage.name,
    price: 168000,
    currency: "IDR",
    durationValue: 3,
    durationUnit: "MONTH",
    composition: [
      { productId: 0, productRegistryId: TEST_PRODUCT_ID, productName: "Komponen A", accessLevel: "FULL", usageLimit: 4, isRequired: true, sortOrder: 0 },
      { productId: 0, productRegistryId: TEST_PRODUCT_ID_UNMAPPED, productName: "Komponen B", accessLevel: "LIMITED", usageLimit: 2, isRequired: true, sortOrder: 1 },
    ],
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
    await db.delete(productEntitlements).where(eq(productEntitlements.email, TEST_EMAIL));
    await db.delete(storeOrders).where(eq(storeOrders.customerEmail, TEST_EMAIL));
    await db.delete(packageRegistry).where(eq(packageRegistry.packageId, TEST_PACKAGE_ID));
    await db.delete(productRegistry).where(eq(productRegistry.productId, TEST_PRODUCT_ID));
    await db.delete(productRegistry).where(eq(productRegistry.productId, TEST_PRODUCT_ID_UNMAPPED));
    await db.delete(productRegistry).where(eq(productRegistry.productId, TEST_PRODUCT_ID_LATE));
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
const waitForMetaCall = async (eventId: string) => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const call = metaCalls.find(
      (entry) => entry.body?.data?.[0]?.event_id === eventId,
    );
    if (call) return call;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Meta call ${eventId} tidak diterima`);
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
  assert.equal(row.productRegistryId, TEST_PRODUCT_ID);
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

test("4b. webhook paid dengan data.order_id cocok → paid dan akses produk aktif", { skip: SKIP }, async () => {
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
  assert.equal(r.json.note, "api_v1 order paid and fulfilled");
  assert.equal(r.json.order_ref, scalevOrderRef);
  const paid = await getOrderRow(scalevOrderRef);
  assert.equal(paid.status, "paid");
  assert.equal(paid.fulfillmentStatus, "fulfilled");
  const grants = await db
    .select()
    .from(productEntitlements)
    .where(eq(productEntitlements.providerOrderRef, SCALEV_ORDER_ID));
  assert.equal(grants.length, 1);
  assert.equal(grants[0].productRegistryId, TEST_PRODUCT_ID);
  assert.equal(grants[0].email, TEST_EMAIL);
  // Idempoten juga saat webhook diulang bersamaan.
  const [r2, r3] = await Promise.all([
    postWebhook({ event: "payment_status_changed", data: { order_id: SCALEV_ORDER_ID, payment_status: "paid" } }),
    postWebhook({ event: "payment_status_changed", data: { order_id: SCALEV_ORDER_ID, payment_status: "paid" } }),
  ]);
  assert.equal(r2.status, 200);
  assert.equal(r3.status, 200);
  assert.equal((await getOrderRow(scalevOrderRef)).status, "paid");
  const grantsAfterReplay = await db
    .select()
    .from(productEntitlements)
    .where(eq(productEntitlements.providerOrderRef, SCALEV_ORDER_ID));
  assert.equal(grantsAfterReplay.length, 1);
});

test("4b2. order api_v1 paid tetap meneruskan Purchase ke Meta", { skip: SKIP }, async () => {
  process.env.META_CAPI_ACCESS_TOKEN = "test-capi-token";
  process.env.META_PIXEL_ID = "1234567890";
  metaCalls = [];
  try {
    const response = await postWebhook({
      event: "payment_status_changed",
      data: {
        order_id: SCALEV_ORDER_ID,
        payment_status: "paid",
        gross_revenue: "123000",
        product_name: `Produk Tes 313A ${RUN}`,
        customer: {
          email: TEST_EMAIL,
          name: buyer.name,
          phone: "081111111",
        },
        metadata: {
          fbp: "fb.1.test.browser",
          fbc: "fb.1.test.click",
          esu: "https://gustafta.my.id/ebook-sbu-skk",
        },
      },
    });
    assert.equal(response.status, 200);
    const call = await waitForMetaCall(`scalev_${SCALEV_ORDER_ID}`);
    const event = call.body.data[0];
    assert.equal(event.event_name, "Purchase");
    assert.equal(event.custom_data.value, 123000);
    assert.equal(event.custom_data.currency, "IDR");
    assert.equal(event.custom_data.content_name, `Produk Tes 313A ${RUN}`);
    assert.equal(event.event_source_url, "https://gustafta.my.id/ebook-sbu-skk");
    assert.equal(event.user_data.fbp, "fb.1.test.browser");
    assert.equal(event.user_data.fbc, "fb.1.test.click");
    assert.ok(!JSON.stringify(call.body).includes(TEST_EMAIL));
  } finally {
    delete process.env.META_CAPI_ACCESS_TOKEN;
    delete process.env.META_PIXEL_ID;
  }
});

test("4b3. kegagalan Meta tidak menggagalkan webhook atau fulfillment", { skip: SKIP }, async () => {
  process.env.META_CAPI_ACCESS_TOKEN = "test-capi-token";
  process.env.META_PIXEL_ID = "1234567890";
  metaMode = "fail";
  metaCalls = [];
  try {
    const response = await postWebhook({
      event: "payment_status_changed",
      data: {
        order_id: SCALEV_ORDER_ID,
        payment_status: "paid",
        gross_revenue: "123000",
        customer: {
          email: TEST_EMAIL,
          name: buyer.name,
          phone: "081111111",
        },
      },
    });
    assert.equal(response.status, 200);
    assert.equal(response.json.note, "api_v1 order paid and fulfilled");
    await waitForMetaCall(`scalev_${SCALEV_ORDER_ID}`);
    const order = await getOrderRow(scalevOrderRef);
    assert.equal(order.status, "paid");
    assert.equal(order.fulfillmentStatus, "fulfilled");
  } finally {
    metaMode = "ok";
    delete process.env.META_CAPI_ACCESS_TOKEN;
    delete process.env.META_PIXEL_ID;
  }
});

test("4c. hosted Scalev paid membuat order kanonik + entitlement tepat sekali", { skip: SKIP }, async () => {
  const payload = {
    event: "payment_status_changed",
    data: {
      order_id: HOSTED_SCALEV_ORDER_ID,
      payment_status: "paid",
      gross_revenue: "123000",
      customer: { email: TEST_EMAIL, name: buyer.name, phone: "081111111" },
      variants: {
        [`Produk Tes 313A ${RUN}`]: {
          quantity: 1,
          variant_unique_id: `variant_TES_${RUN}`,
        },
      },
      final_variants: { [`Produk Tes 313A ${RUN}`]: 1 },
    },
  };
  const [first, replay] = await Promise.all([
    postWebhook(payload),
    postWebhook(payload),
  ]);
  assert.equal(first.status, 200);
  assert.equal(replay.status, 200);
  assert.equal(first.json.type, "canonical_hosted_fulfillment");
  assert.equal(replay.json.type, "canonical_hosted_fulfillment");

  const hostedRows = await db
    .select()
    .from(storeOrders)
    .where(eq(storeOrders.midtransOrderId, `scalev_hosted_${HOSTED_SCALEV_ORDER_ID}`));
  assert.equal(hostedRows.length, 1);
  assert.equal(hostedRows[0].source, "scalev_hosted");
  assert.equal(hostedRows[0].status, "paid");
  assert.equal(hostedRows[0].fulfillmentStatus, "fulfilled");
  assert.equal(hostedRows[0].productRegistryId, TEST_PRODUCT_ID);
  const grants = await db
    .select()
    .from(productEntitlements)
    .where(eq(productEntitlements.providerOrderRef, HOSTED_SCALEV_ORDER_ID));
  assert.equal(grants.length, 1);
  assert.equal(grants[0].productRegistryId, TEST_PRODUCT_ID);
});

test("4c2. hosted Scalev paid tetap meneruskan Purchase ke Meta", { skip: SKIP }, async () => {
  process.env.META_CAPI_ACCESS_TOKEN = "test-capi-token";
  process.env.META_PIXEL_ID = "1234567890";
  metaCalls = [];
  try {
    const response = await postWebhook({
      event: "payment_status_changed",
      data: {
        order_id: HOSTED_SCALEV_ORDER_ID,
        payment_status: "paid",
        gross_revenue: "123000",
        customer: {
          email: TEST_EMAIL,
          name: buyer.name,
          phone: "081111111",
        },
        variants: {
          [`Produk Tes 313A ${RUN}`]: {
            quantity: 1,
            variant_unique_id: `variant_TES_${RUN}`,
          },
        },
        final_variants: { [`Produk Tes 313A ${RUN}`]: 1 },
      },
    });
    assert.equal(response.status, 200);
    assert.equal(response.json.type, "canonical_hosted_fulfillment");
    const call = await waitForMetaCall(`scalev_${HOSTED_SCALEV_ORDER_ID}`);
    const event = call.body.data[0];
    assert.equal(event.event_name, "Purchase");
    assert.equal(event.custom_data.value, 123000);
    assert.equal(event.custom_data.currency, "IDR");
    assert.equal(event.custom_data.content_name, `Produk Tes 313A ${RUN}`);
    assert.ok(!JSON.stringify(call.body).includes(TEST_EMAIL));
  } finally {
    delete process.env.META_CAPI_ACCESS_TOKEN;
    delete process.env.META_PIXEL_ID;
  }
});

test("4c3. hosted paid yang fulfillment-nya tertunda tetap mengirim Purchase", { skip: SKIP }, async () => {
  process.env.META_CAPI_ACCESS_TOKEN = "test-capi-token";
  process.env.META_PIXEL_ID = "1234567890";
  metaCalls = [];
  try {
    const response = await postWebhook({
      event: "payment_status_changed",
      data: {
        order_id: HOSTED_DEFERRED_ORDER_ID,
        payment_status: "paid",
        gross_revenue: "123000",
        customer: {
          name: buyer.name,
          phone: "081111111",
        },
        variants: {
          [`Produk Tes 313A ${RUN}`]: {
            quantity: 1,
            variant_unique_id: `variant_TES_${RUN}`,
          },
        },
        final_variants: { [`Produk Tes 313A ${RUN}`]: 1 },
      },
    });
    assert.equal(response.status, 200);
    assert.equal(response.json.type, "canonical_hosted_fulfillment");
    assert.equal(
      response.json.note,
      "hosted Scalev order paid; fulfillment pending retry",
    );
    const call = await waitForMetaCall(`scalev_${HOSTED_DEFERRED_ORDER_ID}`);
    assert.equal(call.body.data[0].event_name, "Purchase");
    assert.equal(call.body.data[0].custom_data.value, 123000);
  } finally {
    delete process.env.META_CAPI_ACCESS_TOKEN;
    delete process.env.META_PIXEL_ID;
  }
});

test("4d. hosted order historis dapat direkonsiliasi ulang dari API provider", { skip: SKIP }, async () => {
  scalevMode = "ok";
  const { reconcileHostedScalevOrderFromProvider } = await import(
    "../server/scalev-hosted-order"
  );
  const first = await reconcileHostedScalevOrderFromProvider({
    providerOrderRef: HOSTED_BACKFILL_ORDER_ID,
  });
  const replay = await reconcileHostedScalevOrderFromProvider({
    providerOrderRef: HOSTED_BACKFILL_ORDER_ID,
  });
  assert.equal(first.matched, true);
  assert.equal(replay.matched, true);
  assert.ok(["fulfilled", "existing"].includes(String(replay.fulfillment)));
  const rows = await db
    .select()
    .from(storeOrders)
    .where(eq(storeOrders.midtransOrderId, `scalev_hosted_${HOSTED_BACKFILL_ORDER_ID}`));
  assert.equal(rows.length, 1);
  const grants = await db
    .select()
    .from(productEntitlements)
    .where(eq(productEntitlements.providerOrderRef, HOSTED_BACKFILL_ORDER_ID));
  assert.equal(grants.length, 1);
});

test("4e. hosted Level 1 mengirim akses digital yang membuka satu diagnosis", { skip: SKIP }, async () => {
  const webhook = await postWebhook({
    event: "payment_status_changed",
    data: {
      order_id: LEVEL_ONE_HOSTED_ORDER_ID,
      payment_status: "paid",
      gross_revenue: String(SBU_SKK_EBOOK.amount),
      customer: { email: TEST_EMAIL, name: buyer.name, phone: "081111111" },
      variants: {
        [SBU_SKK_EBOOK.title]: {
          quantity: 1,
          variant_unique_id: SBU_SKK_EBOOK.scalev.variantUniqueId,
        },
      },
      final_variants: { [SBU_SKK_EBOOK.title]: 1 },
    },
  });
  assert.equal(webhook.status, 200);
  assert.equal(webhook.json.type, "canonical_hosted_fulfillment");
  assert.equal(webhook.json.fulfillment, "fulfilled");

  const canonical = await getOrderRow(
    `scalev_hosted_${LEVEL_ONE_HOSTED_ORDER_ID}`,
  );
  assert.equal(canonical.source, "scalev_hosted");
  assert.equal(canonical.productRegistryId, SBU_SKK_EBOOK.registryProductId);
  assert.equal(canonical.fulfillmentStatus, "fulfilled");

  const digital = await getOrderRow(`scalev_${LEVEL_ONE_HOSTED_ORDER_ID}`);
  assert.equal(digital.status, "paid");
  assert.equal(digital.deliveryStatus, "sent");
  const access = await fetch(
    `${routesBase}/api/store/access/${digital.accessToken}`,
  );
  assert.equal(access.status, 200);
  const accessBody = await access.json();
  assert.equal(accessBody.type, "digital");
  assert.equal(accessBody.product.name, SBU_SKK_EBOOK.title);
  assert.equal(accessBody.levelOneDiagnostic.eligible, true);
  assert.deepEqual(
    accessBody.levelOneDiagnostic.choices.map((choice: any) => choice.type),
    ["sbu", "skk"],
  );
});

test("4f. RACE: webhook tiba sebelum scalev_order_id tersimpan → fallback metadata.order_ref menandai paid + backfill", { skip: SKIP }, async () => {
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
  assert.equal(w.json.note, "api_v1 order paid and fulfilled");
  const row = await getOrderRow(ref);
  assert.equal(row.status, "paid");
  assert.equal(row.scalevOrderId, raceScalevId); // backfill → retry berikutnya match via order_id
  assert.equal(row.fulfillmentStatus, "fulfilled");
});

test("4g. paket paid memberi seluruh komponen snapshot tepat sekali", { skip: SKIP }, async () => {
  scalevMode = "off";
  const componentABytes = Buffer.from("%PDF-1.4\ncomponent-a\n%%EOF");
  const componentBBytes = Buffer.from("%PDF-1.4\ncomponent-b\n%%EOF");
  await db.insert(digitalProductFiles).values([
    {
      productRegistryId: TEST_PRODUCT_ID,
      storageKey: `tests/${RUN}/component-a.pdf`,
      fileName: "component-a.pdf",
      mimeType: "application/pdf",
      sizeBytes: componentABytes.length,
      sha256: "a".repeat(64),
      content: componentABytes,
      sortOrder: 0,
      role: "main",
      label: "Komponen A",
    },
    {
      productRegistryId: TEST_PRODUCT_ID_UNMAPPED,
      storageKey: `tests/${RUN}/component-b.pdf`,
      fileName: "component-b.pdf",
      mimeType: "application/pdf",
      sizeBytes: componentBBytes.length,
      sha256: "b".repeat(64),
      content: componentBBytes,
      sortOrder: 0,
      role: "main",
      label: "Komponen B",
    },
  ]);
  const created = await createOrder({ package_id: TEST_PACKAGE_ID, buyer });
  assert.equal(created.status, 201);
  assert.equal(created.json.payment_mode, "MANUAL_WA");
  const packageScalevId = `PKG${RUN.slice(-7).toUpperCase()}`;
  const webhook = await postWebhook({
    event: "payment_status_changed",
    data: {
      order_id: packageScalevId,
      payment_status: "paid",
      metadata: { order_ref: created.json.order_ref },
      customer: { email: TEST_EMAIL, name: buyer.name },
    },
  });
  assert.equal(webhook.status, 200);
  assert.equal(webhook.json.note, "api_v1 order paid and fulfilled");
  const row = await getOrderRow(created.json.order_ref);
  assert.equal(row.fulfillmentStatus, "fulfilled");
  const grants = await db
    .select()
    .from(productEntitlements)
    .where(eq(productEntitlements.providerOrderRef, packageScalevId));
  assert.deepEqual(
    grants.map((grant: any) => grant.productRegistryId).sort(),
    [TEST_PRODUCT_ID, TEST_PRODUCT_ID_UNMAPPED].sort(),
  );
  assert.deepEqual(
    grants.map((grant: any) => grant.quotaTotal).sort((a: number, b: number) => a - b),
    [2, 4],
  );

  const accessResponse = await fetch(
    `${routesBase}/api/store/access/${row.accessToken}`,
  );
  assert.equal(accessResponse.status, 200);
  const accessBody = await accessResponse.json();
  assert.equal(accessBody.type, "canonical");
  assert.equal(accessBody.downloads.length, 2);
  const componentA = accessBody.downloads.find(
    (file: any) => file.downloadUrl.includes(`/product/${TEST_PRODUCT_ID}/`),
  );
  const componentB = accessBody.downloads.find(
    (file: any) =>
      file.downloadUrl.includes(`/product/${TEST_PRODUCT_ID_UNMAPPED}/`),
  );
  assert.ok(componentA && componentB);
  assert.notEqual(componentA.downloadUrl, componentB.downloadUrl);
  const componentAPath = new URL(componentA.downloadUrl).pathname;
  const componentBPath = new URL(componentB.downloadUrl).pathname;
  const [downloadA, downloadB] = await Promise.all([
    fetch(`${routesBase}${componentAPath}`),
    fetch(`${routesBase}${componentBPath}`),
  ]);
  assert.equal(downloadA.status, 200);
  assert.equal(downloadB.status, 200);
  assert.deepEqual(
    Buffer.from(await downloadA.arrayBuffer()),
    componentABytes,
  );
  assert.deepEqual(
    Buffer.from(await downloadB.arrayBuffer()),
    componentBBytes,
  );
  const ambiguousStale = await fetch(
    `${routesBase}/api/store/access/${row.accessToken}/download/2147483647`,
  );
  assert.equal(
    ambiguousStale.status,
    403,
    "fallback ID basi tidak boleh memilih file secara ambigu pada paket multi-produk",
  );
});

test("4h. gagal sebagian tetap paid lalu recovery melanjutkan komponen tertunda", { skip: SKIP }, async () => {
  const [pkg] = await db
    .select()
    .from(packageRegistry)
    .where(eq(packageRegistry.packageId, TEST_PACKAGE_ID))
    .limit(1);
  await db.update(packageRegistry).set({ version: 2 }).where(eq(packageRegistry.id, pkg.id));
  await db.insert(packageVersionSnapshots).values({
    packageDbId: pkg.id,
    packageId: TEST_PACKAGE_ID,
    version: 2,
    name: pkg.name,
    price: 168000,
    currency: "IDR",
    durationValue: 3,
    durationUnit: "MONTH",
    composition: [
      { productId: 0, productRegistryId: TEST_PRODUCT_ID, productName: "Komponen Ada", accessLevel: "FULL", usageLimit: 3, isRequired: true, sortOrder: 0 },
      { productId: 0, productRegistryId: TEST_PRODUCT_ID_LATE, productName: "Komponen Terlambat", accessLevel: "FULL", usageLimit: 7, isRequired: true, sortOrder: 1 },
    ],
  } as any);
  const created = await createOrder({ package_id: TEST_PACKAGE_ID, buyer });
  const providerRef = `RETRY${RUN.slice(-6).toUpperCase()}`;
  const webhook = await postWebhook({
    event: "payment_status_changed",
    data: {
      order_id: providerRef,
      payment_status: "paid",
      metadata: { order_ref: created.json.order_ref },
    },
  });
  assert.equal(webhook.status, 200);
  assert.equal(webhook.json.note, "api_v1 order paid; fulfillment pending retry");
  const failed = await getOrderRow(created.json.order_ref);
  assert.equal(failed.status, "paid");
  assert.equal(failed.fulfillmentStatus, "failed");

  await db
    .update(storeOrders)
    .set({ fulfillmentAttemptedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) })
    .where(eq(storeOrders.id, failed.id));
  const { reconcileCanonicalOrderFulfillment } = await import("../server/order-fulfillment");
  await Promise.all([
    reconcileCanonicalOrderFulfillment(100),
    reconcileCanonicalOrderFulfillment(100),
  ]);
  const failedAgain = await getOrderRow(created.json.order_ref);
  assert.equal(failedAgain.fulfillmentStatus, "failed");
  assert.equal(
    failedAgain.fulfillmentAttempts,
    failed.fulfillmentAttempts + 1,
    "dua reconciler paralel hanya boleh memulai satu retry dalam satu jendela backoff",
  );

  await db.insert(productRegistry).values({
    productId: TEST_PRODUCT_ID_LATE,
    name: `Produk Datang Belakangan ${RUN}`,
    slug: `produk-datang-belakangan-${RUN}`,
    productType: "DOCUMENT_TOOL",
    category: "TEST",
    price: 1000,
    billingType: "ONE_TIME",
    status: "ACTIVE",
    visibility: "STANDALONE_ONLY",
  } as any);
  await db
    .update(storeOrders)
    .set({ fulfillmentAttemptedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) })
    .where(eq(storeOrders.id, failed.id));
  const recovered = await reconcileCanonicalOrderFulfillment(100);
  assert.ok(recovered.fulfilled >= 1);
  const finalOrder = await getOrderRow(created.json.order_ref);
  assert.equal(finalOrder.status, "paid");
  assert.equal(finalOrder.fulfillmentStatus, "fulfilled");
  const grants = await db
    .select()
    .from(productEntitlements)
    .where(eq(productEntitlements.providerOrderRef, providerRef));
  assert.deepEqual(
    grants.map((grant: any) => grant.productRegistryId).sort(),
    [TEST_PRODUCT_ID, TEST_PRODUCT_ID_LATE].sort(),
  );
});

test("4i. order_id asing → jatuh ke cabang legacy (200), order kita tak tersentuh", { skip: SKIP }, async () => {
  const r = await postWebhook({
    event: "payment_status_changed",
    data: { order_id: `LEGACY-${RUN}`, payment_status: "paid", product_name: `Produk Tak Dikenal ${RUN}`, customer: { email: TEST_EMAIL, name: "X" } },
  });
  assert.equal(r.status, 200);
  assert.notEqual(r.json.note, "api_v1 order marked paid");
  assert.equal((await getOrderRow(scalevOrderRef)).status, "paid");
});

test("4j. row legacy dengan scalev_order_id tidak dicegat korelasi api_v1", { skip: SKIP }, async () => {
  const providerRef = `LCY${RUN.slice(-8).toUpperCase()}`;
  const legacyRef = `legacy_probe_${RUN}`;
  await db.insert(storeOrders).values({
    productId: 0,
    customerName: buyer.name,
    customerEmail: TEST_EMAIL,
    customerPhone: "",
    amount: 1,
    midtransOrderId: legacyRef,
    accessToken: `legacy-token-${RUN}`,
    status: "pending",
    source: null,
    scalevOrderId: providerRef,
  } as any);
  const response = await postWebhook({
    event: "payment_status_changed",
    data: {
      order_id: providerRef,
      payment_status: "paid",
      product_name: `Produk Legacy Tak Dikenal ${RUN}`,
      customer: { email: TEST_EMAIL, name: buyer.name },
    },
  });
  assert.equal(response.status, 200);
  assert.notEqual(response.json.type, "canonical_hosted_fulfillment");
  assert.notEqual(response.json.note, "api_v1 order paid and fulfilled");
  assert.equal((await getOrderRow(legacyRef)).status, "pending");
});

test("4k. row legacy tidak memotong handler subscription Scalev", { skip: SKIP }, async () => {
  const providerRef = `SUB${RUN.slice(-8).toUpperCase()}`;
  const legacyRef = `subscription_probe_${RUN}`;
  await db.insert(storeOrders).values({
    productId: 0,
    customerName: buyer.name,
    customerEmail: TEST_EMAIL,
    customerPhone: "",
    amount: 199000,
    midtransOrderId: legacyRef,
    accessToken: `subscription-token-${RUN}`,
    status: "pending",
    source: null,
    scalevOrderId: providerRef,
  } as any);
  const response = await postWebhook({
    event: "payment_status_changed",
    data: {
      order_id: providerRef,
      payment_status: "paid",
      gross_revenue: "199000",
      product_slug: "gustafta-paket-1-bulan",
      customer: { email: TEST_EMAIL, name: buyer.name },
    },
  });
  assert.equal(response.status, 200);
  assert.equal(response.json.type, "platform_subscription");
  assert.equal((await getOrderRow(legacyRef)).status, "pending");
});
