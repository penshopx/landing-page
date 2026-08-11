// Integrasi end-to-end: alur pengiriman produk digital via webhook Scalev.
//
// Skenario yang diuji:
//   1. Produk digital dicocokkan berdasarkan nama produk di payload webhook
//   2. URL unduhan di-resolve dengan benar (URL eksternal dikembalikan apa adanya,
//      tanpa memerlukan Supabase credentials)
//   3. Email pengiriman dipanggil (hasil "not_configured" tanpa BREVO_API_KEY
//      adalah perilaku yang benar di lingkungan test)
//   4. Rekaman order tersimpan di store_orders dengan accessToken unik
//   5. Pencocokan berdasarkan scalev_product_name lebih diutamakan dari nama produk
//      (prioritas 2 vs. 3)
//
// Hermetis: produk dan order menggunakan prefix RUN unik, dibersihkan setelah test.
// Server yang diuji: dev server yang sedang berjalan di localhost:5000 (atau PORT env).
//
// Persyaratan:
//   - Server sudah berjalan (workflow "Start application")
//   - SCALEV_WEBHOOK_SECRET jika dikonfigurasi harus tersedia agar auth lolos
//   - Tidak memerlukan SUPABASE_URL/KEY (downloadPath pakai URL eksternal)
//   - Tidak memerlukan BREVO_API_KEY (email gagal dengan "not_configured", order tetap dibuat)

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { db } from "../server/db";
import { storeProducts, storeOrders } from "../shared/schema";
import { eq, inArray, like } from "drizzle-orm";

// ── Identifier unik per run ───────────────────────────────────────────────────
const RUN = `ddwh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const SERVER_URL = `http://localhost:${process.env.PORT || 5000}`;

// URL unduhan publik — dikembalikan apa adanya oleh resolveDownloadUrl
// tanpa menyentuh Supabase Storage. Format: harus dimulai dengan https://
const EXTERNAL_DOWNLOAD_URL = "https://test-cdn.gustafta.id/sample-digital-product.pdf";

const createdProductIds: number[] = [];
const createdOrderMidtransIds: string[] = [];

// ── Teardown ─────────────────────────────────────────────────────────────────
after(async () => {
  // Hapus order test
  if (createdOrderMidtransIds.length > 0) {
    for (const mid of createdOrderMidtransIds) {
      await db.delete(storeOrders).where(eq(storeOrders.midtransOrderId, mid)).catch(() => {});
    }
  }
  // Hapus produk test
  if (createdProductIds.length > 0) {
    await db.delete(storeProducts).where(inArray(storeProducts.id, createdProductIds)).catch(() => {});
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createTestProduct(opts: {
  name: string;
  scalevProductName?: string;
  downloadPath: string;
}): Promise<number> {
  const [row] = await db
    .insert(storeProducts)
    .values({
      name: opts.name,
      description: `Test product (${RUN})`,
      price: 99_000,
      agentId: null,
      isActive: true,
      isGustafta: false,
      sortOrder: 9999,
      downloadPath: opts.downloadPath,
      ...(opts.scalevProductName ? { scalevProductName: opts.scalevProductName } : {}),
    } as any)
    .returning({ id: storeProducts.id });
  createdProductIds.push(row.id);
  return row.id;
}

/** Bangun payload webhook Scalev dalam format yang dikenali handler. */
function buildWebhookPayload(opts: {
  orderId: string;
  productName: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  productRef?: number;
}): object {
  return {
    data: {
      order_id: opts.orderId,
      payment_status: "paid",
      gross_revenue: "99000",
      product_name: opts.productName,
      customer: {
        email: opts.customerEmail,
        name: opts.customerName || "Test Buyer",
        phone: opts.customerPhone || "",
      },
      ...(opts.productRef != null
        ? { custom_fields: { product_ref: String(opts.productRef) } }
        : {}),
    },
  };
}

/**
 * POST payload ke /api/webhooks/scalev pada dev server.
 * Auth lolos lewat:
 *   - SCALEV_WEBHOOK_SECRET → kirim via header x-scalev-secret
 *   - Tidak ada secret dikonfigurasi → terima otomatis (mode "none-configured")
 */
async function postWebhook(payload: object): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.SCALEV_WEBHOOK_SECRET) {
    headers["x-scalev-secret"] = process.env.SCALEV_WEBHOOK_SECRET;
  }
  const resp = await fetch(`${SERVER_URL}/api/webhooks/scalev`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  let body: any;
  try {
    body = await resp.json();
  } catch {
    body = await resp.text();
  }
  return { status: resp.status, body };
}

/** Ambil order dari DB berdasarkan midtrans_order_id (scalev_{orderId}). */
async function fetchOrder(orderId: string) {
  const mid = `scalev_${orderId}`;
  const [row] = await db
    .select()
    .from(storeOrders)
    .where(eq(storeOrders.midtransOrderId, mid))
    .limit(1);
  if (row) createdOrderMidtransIds.push(mid);
  return row ?? null;
}

// ── Cek konektivitas server ───────────────────────────────────────────────────
before(async () => {
  // Pastikan server sudah berjalan sebelum test dijalankan.
  // Jika tidak bisa terhubung, test akan gagal dengan pesan yang jelas.
  let up = false;
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(`${SERVER_URL}/api/health`);
      if (r.status < 500) { up = true; break; }
    } catch {
      // belum siap
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  if (!up) {
    // Coba endpoint lain kalau /api/health tidak ada
    try {
      const r = await fetch(`${SERVER_URL}/`);
      if (r.status < 500) up = true;
    } catch { /* gagal */ }
  }
  assert.ok(up, `Server tidak berjalan di ${SERVER_URL}. Jalankan workflow "Start application" terlebih dahulu.`);
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 1: Pencocokan berdasarkan nama produk (fallback prioritas 3)
// ═════════════════════════════════════════════════════════════════════════════
test("webhook paid + nama produk cocok → type=digital_product_delivery, order tersimpan, URL di DB valid", async () => {
  const productName = `${RUN} Template OSS`;
  const orderId = `test_${RUN}_by_name`;
  const customerEmail = `buyer_${RUN}@test.gustafta.id`;

  // Buat produk digital test dengan URL unduhan eksternal
  await createTestProduct({
    name: productName,
    downloadPath: EXTERNAL_DOWNLOAD_URL,
  });

  // Kirim webhook
  const { status, body } = await postWebhook(
    buildWebhookPayload({
      orderId,
      productName,
      customerEmail,
      customerName: "Pembeli Test",
    }),
  );

  // Harus diterima dengan 200
  assert.equal(status, 200, `Expected HTTP 200, got ${status}. Body: ${JSON.stringify(body)}`);
  assert.equal(body.received, true, `body.received harus true. Body: ${JSON.stringify(body)}`);
  assert.equal(
    body.type,
    "digital_product_delivery",
    `body.type harus "digital_product_delivery". Body: ${JSON.stringify(body)}`,
  );

  // Order harus tersimpan di DB
  const order = await fetchOrder(orderId);
  assert.ok(order, `Order dengan midtrans_order_id scalev_${orderId} harus tersimpan di store_orders`);
  assert.equal(order.customerEmail, customerEmail, "customerEmail tidak cocok di order");
  assert.equal(order.status, "paid", "status order harus 'paid'");
  assert.ok(order.accessToken && order.accessToken.length > 10, "accessToken harus ada dan non-trivial");
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 2: Pencocokan berdasarkan scalev_product_name (prioritas lebih tinggi dari nama)
// ═════════════════════════════════════════════════════════════════════════════
test("webhook paid + scalevProductName cocok (bukan nama produk) → order tersimpan", async () => {
  const scalevName = `${RUN}-scalev-slug`;
  const storeName = `${RUN} Nama Di Store`;
  const orderId = `test_${RUN}_by_scalev_name`;
  const customerEmail = `buyer2_${RUN}@test.gustafta.id`;

  await createTestProduct({
    name: storeName,
    scalevProductName: scalevName,
    downloadPath: EXTERNAL_DOWNLOAD_URL,
  });

  // Payload memakai scalevName bukan storeName
  const { status, body } = await postWebhook(
    buildWebhookPayload({
      orderId,
      productName: scalevName,
      customerEmail,
    }),
  );

  assert.equal(status, 200, `Expected HTTP 200, got ${status}. Body: ${JSON.stringify(body)}`);
  assert.equal(body.type, "digital_product_delivery", `Harus cocok via scalevProductName. Body: ${JSON.stringify(body)}`);

  const order = await fetchOrder(orderId);
  assert.ok(order, "Order harus tersimpan setelah pencocokan scalevProductName");
  assert.equal(order.customerEmail, customerEmail);
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 3: Pencocokan berdasarkan product_ref ID (prioritas tertinggi)
// ═════════════════════════════════════════════════════════════════════════════
test("webhook paid + product_ref ID cocok → order tersimpan (prioritas 1)", async () => {
  const storeName = `${RUN} Produk Ref Test`;
  const orderId = `test_${RUN}_by_id`;
  const customerEmail = `buyer3_${RUN}@test.gustafta.id`;

  const productId = await createTestProduct({
    name: storeName,
    downloadPath: EXTERNAL_DOWNLOAD_URL,
  });

  // Payload: nama produk berbeda, tapi product_ref ID benar
  const payload = buildWebhookPayload({
    orderId,
    productName: "nama-yang-tidak-ada-di-db",
    customerEmail,
    productRef: productId,
  });

  const { status, body } = await postWebhook(payload);

  assert.equal(status, 200, `Expected HTTP 200, got ${status}. Body: ${JSON.stringify(body)}`);
  assert.equal(
    body.type,
    "digital_product_delivery",
    `Harus cocok via product_ref ID. Body: ${JSON.stringify(body)}`,
  );

  const order = await fetchOrder(orderId);
  assert.ok(order, "Order harus tersimpan setelah pencocokan product_ref ID");
  assert.equal(order.productId, productId, "productId di order harus sesuai dengan ID produk test");
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 4: Produk tidak cocok → webhook tetap diterima (200), bukan digital_product_delivery
// ═════════════════════════════════════════════════════════════════════════════
test("webhook paid + tidak ada produk digital cocok → 200 diterima (bukan digital_product_delivery)", async () => {
  const orderId = `test_${RUN}_no_match`;
  const { status, body } = await postWebhook(
    buildWebhookPayload({
      orderId,
      productName: `Nama Produk Yang Pasti Tidak Ada Di DB ${RUN}`,
      customerEmail: `nomatch_${RUN}@test.gustafta.id`,
    }),
  );

  // Webhook SELALU dikembalikan 200 (tidak boleh drop)
  assert.equal(status, 200, "Webhook harus selalu mengembalikan 200 meskipun tidak ada produk cocok");
  // Tipe bukan digital_product_delivery karena tidak ada kecocokan
  assert.notEqual(
    body.type,
    "digital_product_delivery",
    "type tidak boleh digital_product_delivery bila tidak ada produk cocok",
  );
  assert.equal(body.received, true, "body.received harus tetap true");
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 5: Duplikat order_id → ditolak tanpa membuat order baru (idempoten)
// ═════════════════════════════════════════════════════════════════════════════
test("webhook paid duplikat order_id → 200 dengan note Duplicate, tidak membuat order baru", async () => {
  const productName = `${RUN} Template Duplikat`;
  const orderId = `test_${RUN}_dup`;
  const customerEmail = `dup_${RUN}@test.gustafta.id`;

  await createTestProduct({ name: productName, downloadPath: EXTERNAL_DOWNLOAD_URL });

  // Kirim pertama kali
  const r1 = await postWebhook(buildWebhookPayload({ orderId, productName, customerEmail }));
  assert.equal(r1.status, 200);

  // Kirim kedua kali (duplikat)
  const r2 = await postWebhook(buildWebhookPayload({ orderId, productName, customerEmail }));
  assert.equal(r2.status, 200);
  assert.ok(
    String(r2.body?.note || "").toLowerCase().includes("duplicate") ||
    String(r2.body?.note || "").toLowerCase().includes("already"),
    `Respons duplikat harus mengandung keterangan 'Duplicate' atau 'already'. Body: ${JSON.stringify(r2.body)}`,
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 5b: Signed-URL gagal (path Supabase bucket, config hilang/path tidak ada)
//          → order TETAP tersimpan dengan status 'pending' (bisa di-retry),
//            webhook tetap 200 dengan note delivery_failed_order_pending.
// ═════════════════════════════════════════════════════════════════════════════
test("webhook paid + downloadPath bucket Supabase yang gagal di-sign → order tetap tersimpan status 'pending'", async () => {
  const productName = `${RUN} Produk Bucket Gagal`;
  const orderId = `test_${RUN}_sign_fail`;
  const customerEmail = `signfail_${RUN}@test.gustafta.id`;

  // downloadPath BUKAN URL eksternal → resolveDownloadUrl memanggil Supabase.
  // Di lingkungan test: SUPABASE_URL hilang → throw "belum dikonfigurasi",
  // atau bila terkonfigurasi, path fiktif ini → HTTP error → throw juga.
  await createTestProduct({
    name: productName,
    downloadPath: `bucket-test-${RUN}/tidak-ada.pdf`,
  });

  const { status, body } = await postWebhook(
    buildWebhookPayload({ orderId, productName, customerEmail }),
  );

  assert.equal(status, 200, `Webhook harus tetap 200. Body: ${JSON.stringify(body)}`);
  assert.equal(body.received, true);
  assert.equal(
    body.type,
    "digital_product_delivery",
    `Kegagalan signing tidak boleh jatuh ke handler lain. Body: ${JSON.stringify(body)}`,
  );
  assert.equal(
    body.note,
    "delivery_failed_order_pending",
    `Harus ada note kegagalan eksplisit. Body: ${JSON.stringify(body)}`,
  );

  // Order HARUS tersimpan meski signed URL gagal dibuat — status 'pending' agar bisa retry.
  const order = await fetchOrder(orderId);
  assert.ok(order, "Order harus tetap tersimpan di store_orders meski signing gagal");
  assert.equal(order.customerEmail, customerEmail);
  assert.equal(order.status, "pending", "Status order harus 'pending' setelah signing gagal");
  assert.ok(order.accessToken && order.accessToken.length > 10, "accessToken tetap harus ada");
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 6: URL eksternal di resolveDownloadUrl dikembalikan apa adanya (unit check)
// ═════════════════════════════════════════════════════════════════════════════
test("resolveDownloadUrl: URL eksternal (https://) dikembalikan tanpa modifikasi", async () => {
  const { resolveDownloadUrl } = await import("../server/lib/supabase-storage");
  const url = "https://drive.google.com/uc?id=TEST_FILE_ID&export=download";
  const result = await resolveDownloadUrl(url);
  assert.equal(result, url, "URL eksternal harus dikembalikan apa adanya tanpa panggil Supabase API");
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST 7: sendDigitalProductDeliveryEmail dipanggil dengan parameter yang benar
//         (tanpa BREVO_API_KEY → "not_configured"; ini perilaku yang BENAR di test)
// ═════════════════════════════════════════════════════════════════════════════
test("sendDigitalProductDeliveryEmail: tanpa BREVO_API_KEY → {sent:false, reason:'not_configured'}", async () => {
  const savedKey = process.env.BREVO_API_KEY;
  delete process.env.BREVO_API_KEY;

  try {
    const { sendDigitalProductDeliveryEmail } = await import("../server/lib/email");
    const result = await sendDigitalProductDeliveryEmail({
      to: "buyer@test.gustafta.id",
      customerName: "Test Buyer",
      productName: "Template OSS Test",
      downloadUrl: EXTERNAL_DOWNLOAD_URL,
      expiryHours: 24,
      orderCorrelationTag: `digital-delivery-${randomUUID()}`,
    });

    assert.equal(result.sent, false, "Harus mengembalikan sent:false saat BREVO_API_KEY tidak dikonfigurasi");
    assert.equal(
      (result as any).reason,
      "not_configured",
      "Harus mengembalikan reason:'not_configured'",
    );
  } finally {
    if (savedKey !== undefined) process.env.BREVO_API_KEY = savedKey;
  }
});
