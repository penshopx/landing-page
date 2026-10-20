/**
 * Task #208 — Webhook pembayaran Scalev tetap mengaktifkan langganan dengan
 * benar setelah rename kolom (scalev_order_id → order_id, scalev_payment_url
 * → payment_url) di tabel subscriptions_new.
 *
 * Integrasi end-to-end nyata (HTTP → route handler → DB):
 * 1. Seed user dengan email unik.
 * 2. POST payload webhook Scalev realistis (payment_status=paid, product_name
 *    "Gustafta Paket 1 Bulan") ke /api/webhooks/scalev.
 * 3. Baris subscriptions_new harus: status='active', order_id terisi
 *    `scalev_plan_<orderId>`, user_id benar, plan monthly_1, end_date ~30 hari.
 * 4. storage.getSubscriptionByOrderId menemukan baris via kolom order_id yang
 *    sudah di-rename (regresi rename tertangkap di sini).
 * 5. Negatif: payment_status != "paid" TIDAK membuat baris langganan.
 *
 * Dilewati otomatis bila DATABASE_URL tidak ada (CI tanpa DB).
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { validateCiDatabaseEnvironment } from "../scripts/ci-test-database-guard.mjs";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `scalev_sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_EMAIL = `${RUN}@example.test`;
const TEST_USER_ID = `test-user-${RUN}`;
const ORDER_ID = `ORD-${RUN}`;
const ORDER_ID_UNPAID = `ORD-unpaid-${RUN}`;
const EXPECTED_STORED_ORDER_ID = `scalev_plan_${ORDER_ID}`;

let server: Server;
let baseUrl: string;
let db: any, pool: any, users: any, subscriptionsTable: any, eq: any, like: any;
let storageDb: any;
let fixtureReady = false;

before(async () => {
  if (!hasDb) return;
  validateCiDatabaseEnvironment(process.env);
  // Synthetic, process-local credential: never uses a provider/workspace secret.
  process.env.SCALEV_WEBHOOK_SECRET = ["ci", "webhook", RUN].join("-");

  // Jangan pernah kirim event Purchase sungguhan ke Meta dari test.
  delete process.env.META_CAPI_ACCESS_TOKEN;
  delete process.env.META_PIXEL_ID;

  ({ db, pool } = await import("../server/db"));
  ({ users } = await import("../shared/models/auth"));
  ({ subscriptionsTable } = await import("../shared/schema"));
  ({ eq, like } = await import("drizzle-orm"));
  ({ storage: storageDb } = await import("../server/storage"));
  fixtureReady = true;
  const { registerRoutes } = await import("../server/routes");

  await db.insert(users).values({
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    firstName: "Scalev",
    lastName: "Tester",
    emailVerified: true,
  } as any);

  const app = express();
  // Tangkap raw body persis seperti server/index.ts supaya verifikasi
  // signature webhook menerima input yang sama dengan produksi.
  app.use(express.json({
    verify: (req: any, _res, buf) => { req.rawBody = buf; },
  }));

  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  server = httpServer;
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  if (!fixtureReady) return;
  try {
    await db.delete(subscriptionsTable).where(eq(subscriptionsTable.userId, TEST_USER_ID));
    await db.delete(users).where(eq(users.id, TEST_USER_ID));
  } finally {
    if (server) await new Promise<void>((r) => server.close(() => r()));
    await pool.end().catch(() => {});
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Payload webhook Scalev realistis (format payment_status_changed). */
function buildPayload(opts: { orderId: string; paymentStatus: string }): object {
  return {
    event: "payment_status_changed",
    data: {
      order_id: opts.orderId,
      payment_status: opts.paymentStatus,
      gross_revenue: "299000",
      product_name: "Gustafta Paket 1 Bulan",
      final_variants: { "Gustafta Paket 1 Bulan": 1 },
      customer: {
        email: TEST_EMAIL,
        name: "Scalev Tester",
        phone: "081234567890",
      },
    },
  };
}

/**
 * POST ke /api/webhooks/scalev. Auth lolos via shared secret
 * (SCALEV_WEBHOOK_SECRET → header x-scalev-secret); bila tidak dikonfigurasi,
 * fixture tetap mengirim secret sintetis; produksi tetap menolak auth kosong.
 */
async function postWebhook(payload: object): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.SCALEV_WEBHOOK_SECRET) {
    headers["x-scalev-secret"] = process.env.SCALEV_WEBHOOK_SECRET;
  }
  const res = await fetch(`${baseUrl}/api/webhooks/scalev`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  let body: any = null;
  try { body = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, body };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test("webhook tanpa secret tetap ditolak sebelum transaksi dibuat", { skip: SKIP }, async () => {
  const response = await fetch(`${baseUrl}/api/webhooks/scalev`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildPayload({ orderId: ORDER_ID, paymentStatus: "paid" })),
  });
  assert.equal(response.status, 401);
  const rows = await db.select().from(subscriptionsTable)
    .where(eq(subscriptionsTable.orderId, EXPECTED_STORED_ORDER_ID));
  assert.equal(rows.length, 0, "auth kosong tidak boleh mengaktifkan langganan");
});

test("webhook paid → subscriptions_new baris active dengan order_id benar", { skip: SKIP }, async () => {
  const { status, body } = await postWebhook(buildPayload({ orderId: ORDER_ID, paymentStatus: "paid" }));
  assert.equal(status, 200, `webhook harus 200, dapat ${status}: ${JSON.stringify(body)}`);
  assert.equal(body?.type, "platform_subscription", "harus diproses sebagai platform subscription");

  const rows = await db.select().from(subscriptionsTable)
    .where(eq(subscriptionsTable.orderId, EXPECTED_STORED_ORDER_ID));
  assert.equal(rows.length, 1, "harus ada tepat 1 baris subscriptions_new untuk order ini");
  const sub = rows[0];
  assert.equal(sub.status, "active", "status harus 'active'");
  assert.equal(sub.userId, TEST_USER_ID, "user_id harus milik pembeli");
  assert.equal(sub.plan, "monthly_1", "plan harus monthly_1 (Gustafta Paket 1 Bulan)");
  assert.ok(sub.orderId === EXPECTED_STORED_ORDER_ID, "order_id (kolom hasil rename) harus terisi");
  assert.ok(sub.startDate instanceof Date && sub.endDate instanceof Date, "start/end date harus terisi");
  const days = (sub.endDate.getTime() - sub.startDate.getTime()) / 86_400_000;
  assert.ok(days > 29 && days < 31, `durasi harus ~30 hari, dapat ${days}`);
});

test("storage.getSubscriptionByOrderId menemukan baris via kolom order_id", { skip: SKIP }, async () => {
  const sub = await storageDb.getSubscriptionByOrderId(EXPECTED_STORED_ORDER_ID);
  assert.ok(sub, "getSubscriptionByOrderId harus menemukan langganan");
  assert.equal(sub.status, "active");
  assert.equal(sub.orderId, EXPECTED_STORED_ORDER_ID);
  assert.equal(sub.userId, TEST_USER_ID);
});

test("webhook non-paid TIDAK membuat baris langganan", { skip: SKIP }, async () => {
  const { status } = await postWebhook(buildPayload({ orderId: ORDER_ID_UNPAID, paymentStatus: "pending" }));
  assert.equal(status, 200, "webhook non-paid tetap 200 (acknowledged)");
  const rows = await db.select().from(subscriptionsTable)
    .where(eq(subscriptionsTable.orderId, `scalev_plan_${ORDER_ID_UNPAID}`));
  assert.equal(rows.length, 0, "tidak boleh ada baris langganan untuk order non-paid");
});
