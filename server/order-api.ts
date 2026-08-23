// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED ORDER API — Fase B (Gustafta sebagai transaction backbone)
//
//   POST /api/v1/orders
//   Authorization: Bearer <ORDER_API_KEY>
//   { product_id? | package_id?, buyer: { name, email, phone? } }
//
// Satu kontrak order kanonik untuk seluruh ekosistem (Gaia Store, DP-Store,
// dokumenproyek.com, Gaia SIAP) tanpa membongkar flow checkout/Scalev live.
//
// Prinsip (mengikuti pola keamanan /api/v1/ai/assist):
// - ADITIF: /api/store/order, webhook Scalev, Catalog API tidak disentuh.
// - FAIL-CLOSED: tanpa env ORDER_API_KEY semua request → 503.
// - SOURCE OF TRUTH: product_registry / package_registry + snapshot versi —
//   harga SELALU server-side; field harga dari klien DIABAIKAN.
// - Harga paket diambil dari package_version_snapshots (immutable) untuk versi
//   aktif — order menyimpan package_version agar dapat diaudit selamanya.
// - Payment link: HANYA mekanisme Scalev yang sudah terbukti live
//   (/c/checkout?variant_ids= via store_products.scalev_variant_id). Bila item
//   tidak punya korelasi Scalev yang aman, TIDAK mengarang URL — order tetap
//   tercatat (pending) dan respons memberi wa_order_url (jalur manual live).
// ─────────────────────────────────────────────────────────────────────────────
import type { Express, Request, Response } from "express";
import { timingSafeEqual, createHash, randomUUID } from "crypto";
import {
  PostgresRateLimitStore,
  InMemoryRateLimitStore,
  type RateLimitStore,
} from "./lib/rate-limiter";
import { getWaContact } from "./lib/wa-contact";

const RATE_LIMIT_PER_MIN = (() => {
  const n = parseInt(process.env.ORDER_API_RATE_LIMIT_PER_MIN ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
})();
const RATE_WINDOW_MS = 60_000;

const sharedStore: RateLimitStore = new PostgresRateLimitStore(async (text, params) => {
  const { pool } = await import("./db");
  return pool.query(text, params);
});
const memoryFallback = new InMemoryRateLimitStore();

const configuredKey = () => (process.env.ORDER_API_KEY || "").trim();

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function extractBearer(req: Request): string {
  const h = String(req.headers.authorization || "");
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 120;
const MAX_EMAIL = 200;
const MAX_PHONE = 30;
const MAX_ID = 60;

const formatIdr = (n: number) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
const logSafe = (s: unknown) =>
  (typeof s === "string" && s ? s : "-").replace(/[^\w.:\/-]/g, "_").slice(0, 80);

const MAX_EVENT_ID = 80;

export type CanonicalOrderInput = {
  productId?: string;
  packageId?: string;
  buyer: { name: string; email: string; phone: string };
  // Optional demand-led promotion attribution — validated server-side against the
  // exact canonical item; NEVER carries a price.
  campaignId?: number;
  promotionEventId?: string;
};

export function promotionAttributionPairError(
  campaignId?: number | null,
  promotionEventId?: string | null,
): string | null {
  const hasCampaign = campaignId !== undefined && campaignId !== null;
  const hasEvent = typeof promotionEventId === "string" && promotionEventId.trim().length > 0;
  if (hasCampaign !== hasEvent) {
    return "Field 'campaign_id' dan 'promotion_event_id' wajib dikirim bersama, atau keduanya tidak dikirim.";
  }
  if (hasCampaign && (!Number.isInteger(campaignId) || Number(campaignId) <= 0)) {
    return "Field 'campaign_id' harus berupa integer positif.";
  }
  if (hasEvent && promotionEventId!.trim().length > MAX_EVENT_ID) {
    return `Field 'promotion_event_id' harus string ≤ ${MAX_EVENT_ID} karakter.`;
  }
  return null;
}

function validateBody(body: any): { ok: true; data: CanonicalOrderInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Body harus berupa objek JSON." };
  }
  const productId = body.product_id;
  const packageId = body.package_id;
  if (productId !== undefined && typeof productId !== "string") {
    return { ok: false, error: "Field 'product_id' harus berupa string." };
  }
  if (packageId !== undefined && typeof packageId !== "string") {
    return { ok: false, error: "Field 'package_id' harus berupa string." };
  }
  const pid = (productId || "").trim();
  const kid = (packageId || "").trim();
  if (!pid && !kid) {
    return { ok: false, error: "Wajib mengisi 'product_id' ATAU 'package_id'." };
  }
  if (pid && kid) {
    return { ok: false, error: "Isi salah satu saja: 'product_id' ATAU 'package_id', bukan keduanya." };
  }
  if ((pid || kid).length > MAX_ID) {
    return { ok: false, error: `ID melebihi ${MAX_ID} karakter.` };
  }
  const buyer = body.buyer;
  if (!buyer || typeof buyer !== "object" || Array.isArray(buyer)) {
    return { ok: false, error: "Field 'buyer' (objek { name, email, phone? }) wajib diisi." };
  }
  const name = typeof buyer.name === "string" ? buyer.name.trim() : "";
  const email = typeof buyer.email === "string" ? buyer.email.trim() : "";
  const phone = typeof buyer.phone === "string" ? buyer.phone.trim() : "";
  if (!name || name.length > MAX_NAME) {
    return { ok: false, error: `Field 'buyer.name' wajib string 1..${MAX_NAME} karakter.` };
  }
  if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Field 'buyer.email' wajib berupa alamat email valid." };
  }
  if (phone && (phone.length > MAX_PHONE || !/^[+\d\s()-]+$/.test(phone))) {
    return { ok: false, error: "Field 'buyer.phone' tidak valid." };
  }
  // Harga TIDAK boleh dari klien — tolak eksplisit agar integrator tahu.
  for (const f of ["amount", "price", "total"]) {
    if (body[f] !== undefined) {
      return { ok: false, error: `Field '${f}' tidak diizinkan — harga ditentukan server dari registry.` };
    }
  }
  // Optional promotion attribution (validated later against the canonical item).
  let campaignId: number | undefined;
  if (body.campaign_id !== undefined && body.campaign_id !== null) {
    const n = Number(body.campaign_id);
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
      return { ok: false, error: "Field 'campaign_id' harus berupa integer positif." };
    }
    campaignId = n;
  }
  let promotionEventId: string | undefined;
  if (body.promotion_event_id !== undefined && body.promotion_event_id !== null) {
    if (typeof body.promotion_event_id !== "string" || body.promotion_event_id.length > MAX_EVENT_ID) {
      return { ok: false, error: `Field 'promotion_event_id' harus string ≤ ${MAX_EVENT_ID} karakter.` };
    }
    promotionEventId = body.promotion_event_id.trim() || undefined;
  }
  const attributionPairError = promotionAttributionPairError(campaignId, promotionEventId);
  if (attributionPairError) return { ok: false, error: attributionPairError };
  return {
    ok: true,
    data: {
      productId: pid || undefined, packageId: kid || undefined,
      buyer: { name, email, phone }, campaignId, promotionEventId,
    },
  };
}

/** Item yang siap di-order (sudah tervalidasi ACTIVE + purchasable, harga server-side). */
type ResolvedItem = {
  kind: "product" | "package";
  productId?: string;   // product_registry.product_id
  packageId?: string;   // package_registry.package_id
  packageVersion?: number;
  name: string;
  amount: number;
  currency: string;
  // Mapping variant Scalev v3 (bila item sudah diprovisikan) — untuk checkout otomatis.
  scalevVariantUniqueId?: string | null;
};

async function resolveProduct(productId: string): Promise<{ item?: ResolvedItem; error?: { status: number; code: string; message: string } }> {
  const { db } = await import("./db");
  const { productRegistry } = await import("@shared/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(productRegistry).where(eq(productRegistry.productId, productId)).limit(1);
  const p = rows[0];
  if (!p) return { error: { status: 404, code: "product_not_found", message: `Produk '${productId}' tidak ditemukan di registry.` } };
  if (p.status !== "ACTIVE") {
    return { error: { status: 409, code: "product_not_purchasable", message: `Produk '${productId}' berstatus ${p.status} (bukan ACTIVE).` } };
  }
  if (p.visibility === "INTERNAL_ONLY") {
    return { error: { status: 409, code: "product_not_purchasable", message: `Produk '${productId}' hanya untuk internal (visibility INTERNAL_ONLY).` } };
  }
  if (!(p.price > 0) || p.billingType === "FREE") {
    return { error: { status: 409, code: "product_not_purchasable", message: `Produk '${productId}' bukan produk berbayar.` } };
  }
  return {
    item: {
      kind: "product",
      productId: p.productId,
      name: p.name,
      amount: p.price,
      currency: p.currency || "IDR",
      scalevVariantUniqueId: p.scalevVariantUniqueId ?? null,
    },
  };
}

async function resolvePackage(packageId: string): Promise<{ item?: ResolvedItem; error?: { status: number; code: string; message: string } }> {
  const { db } = await import("./db");
  const { packageRegistry, packageVersionSnapshots } = await import("@shared/schema");
  const { eq, and } = await import("drizzle-orm");
  const rows = await db.select().from(packageRegistry).where(eq(packageRegistry.packageId, packageId)).limit(1);
  const pkg = rows[0];
  if (!pkg) return { error: { status: 404, code: "package_not_found", message: `Paket '${packageId}' tidak ditemukan di registry.` } };
  if (pkg.status !== "ACTIVE") {
    return { error: { status: 409, code: "package_not_purchasable", message: `Paket '${packageId}' berstatus ${pkg.status} (bukan ACTIVE).` } };
  }
  if (!(pkg.price > 0)) {
    return { error: { status: 409, code: "package_not_purchasable", message: `Paket '${packageId}' belum punya harga valid.` } };
  }
  // Harga & identitas versi WAJIB dari snapshot immutable — bukan row mutable.
  const snapRows = await db
    .select()
    .from(packageVersionSnapshots)
    .where(and(eq(packageVersionSnapshots.packageDbId, pkg.id), eq(packageVersionSnapshots.version, pkg.version)))
    .limit(1);
  const snap = snapRows[0];
  if (!snap) {
    return { error: { status: 409, code: "package_snapshot_missing", message: `Paket '${packageId}' v${pkg.version} belum punya snapshot versi — tidak dapat di-order (traceability).` } };
  }
  if (!(snap.price > 0)) {
    return { error: { status: 409, code: "package_not_purchasable", message: `Snapshot v${snap.version} paket '${packageId}' berharga tidak valid (${snap.price}).` } };
  }
  return {
    item: {
      kind: "package",
      packageId: pkg.packageId,
      packageVersion: snap.version,
      name: snap.name,
      amount: snap.price,
      currency: snap.currency || "IDR",
      scalevVariantUniqueId: pkg.scalevVariantUniqueId ?? null,
    },
  };
}

// Jalur otomatis (Task #313A): buat order DI Scalev via POST /v3/orders.
// Korelasi deterministik ORD-* ↔ scalev_order_id ↔ webhook data.order_id.
// Syarat: item punya mapping scalev_variant_unique_id di registry + env
// SCALEV_STORE_UNIQUE_ID + SCALEV_API_KEY. Gagal apa pun → fallback MANUAL_WA
// (order lokal tetap pending, TIDAK berpura-pura siap dibayar).
async function tryScalevOrder(item: ResolvedItem, buyer: CanonicalOrderInput["buyer"], orderRef: string) {
  const storeUniqueId = (process.env.SCALEV_STORE_UNIQUE_ID || "").trim();
  if (!item.scalevVariantUniqueId || !storeUniqueId || !process.env.SCALEV_API_KEY) return null;
  try {
    const { createScalevOrder } = await import("./lib/scalev");
    const result = await createScalevOrder({
      storeUniqueId,
      variantUniqueId: item.scalevVariantUniqueId,
      customerName: buyer.name,
      customerEmail: buyer.email,
      customerPhone: buyer.phone || undefined,
      orderRef,
    });
    return result;
  } catch (err) {
    console.warn(`[order-api] scalev_create_failed ref=${logSafe(orderRef)} — fallback MANUAL_WA. ${logSafe((err as Error)?.message)}`);
    return null;
  }
}

function buildPayment(item: ResolvedItem, buyer: CanonicalOrderInput["buyer"], orderRef: string) {
  // Jalur manual WA (terbukti live) — dipakai bila item belum diprovisikan di
  // Scalev atau create order Scalev gagal. order_ref selalu terbawa di pesan.
  const wa = getWaContact().primary;
  const lines = [
    `Halo Gustafta, saya ingin memesan:`,
    `\u2022 ${item.kind === "package" ? "Paket" : "Produk"}: ${item.name}`,
    item.packageId ? `\u2022 ID Paket: ${item.packageId} (v${item.packageVersion})` : `\u2022 ID Produk: ${item.productId}`,
    `\u2022 Order Ref: ${orderRef}`,
    `\u2022 Harga: ${formatIdr(item.amount)}`,
    `Nama: ${buyer.name}`,
    `Email: ${buyer.email}`,
    `Mohon info cara pembayarannya. Terima kasih.`,
  ];
  return {
    payment_url: null as string | null,
    payment_mode: "MANUAL_WA" as const,
    wa_order_url: `https://wa.me/${wa}?text=${encodeURIComponent(lines.join("\n"))}`,
    note: "Item ini belum punya variant Scalev — pembayaran diproses manual admin via WA (order tetap tercatat pending dengan order_ref).",
  };
}

export async function createCanonicalOrder(input: CanonicalOrderInput): Promise<{
  status: number;
  payload: Record<string, unknown>;
  orderRef?: string;
}> {
  const { productId, packageId, buyer, campaignId, promotionEventId } = input;
  const attributionPairError = promotionAttributionPairError(campaignId, promotionEventId);
  if (attributionPairError) {
    return {
      status: 409,
      payload: { error: "promotion_attribution_invalid", message: attributionPairError },
    };
  }
  const resolved = productId ? await resolveProduct(productId) : await resolvePackage(packageId!);
  if (resolved.error) {
    const e = resolved.error;
    return { status: e.status, payload: { error: e.code, message: e.message } };
  }
  const item = resolved.item!;

  // Demand-led promotion attribution — validated against the EXACT canonical
  // item that was resolved (never the raw client id, never a price).
  const { resolveOrderAttribution } = await import("./promotion-engine");
  const attribution = await resolveOrderAttribution({
    campaignId: campaignId ?? null,
    promotionEventId: promotionEventId ?? null,
    productId: item.productId ?? null,
    packageId: item.packageId ?? null,
  });
  if (campaignId && (!attribution.promotionCampaignId || !attribution.promotionEventId)) {
    return {
      status: 409,
      payload: {
        error: "promotion_attribution_invalid",
        message: "Atribusi promosi tidak cocok dengan kampanye, event, atau item kanonik.",
      },
    };
  }

  const orderRef = `ORD-${Date.now()}-${randomUUID().split("-")[0].toUpperCase()}`;
  const accessToken = randomUUID();

  const { db } = await import("./db");
  const { storeOrders } = await import("@shared/schema");
  const inserted = await db
    .insert(storeOrders)
    .values({
      productId: 0,
      productRegistryId: item.productId || null,
      agentId: null,
      customerName: buyer.name,
      customerEmail: buyer.email,
      customerPhone: buyer.phone,
      amount: item.amount,
      creatorUserId: null,
      creatorShare: 0,
      platformShare: item.amount,
      midtransOrderId: orderRef,
      accessToken,
      status: "pending",
      packageId: item.packageId ?? null,
      packageVersion: item.packageVersion ?? null,
      itemName: `${item.productId ? `[${item.productId}] ` : ""}${item.name}`,
      source: "api_v1",
      fulfillmentStatus: "pending",
      promotionCampaignId: attribution.promotionCampaignId,
      promotionEventId: attribution.promotionEventId,
    })
    .returning({ id: storeOrders.id, createdAt: storeOrders.createdAt });

  const scalev = await tryScalevOrder(item, buyer, orderRef);
  let payment: { payment_url: string | null; payment_mode: string; wa_order_url: string | null; note: string };
  if (scalev) {
    const { eq } = await import("drizzle-orm");
    await db
      .update(storeOrders)
      .set({ scalevOrderId: scalev.scalevOrderId })
      .where(eq(storeOrders.id, inserted[0].id));
    payment = {
      payment_url: scalev.checkoutUrl,
      payment_mode: "SCALEV_ORDER",
      wa_order_url: null,
      note: "Bayar melalui payment_url. Status order akan otomatis menjadi paid setelah pembayaran terkonfirmasi Scalev.",
    };
  } else {
    payment = buildPayment(item, buyer, orderRef);
  }

  return {
    status: 201,
    orderRef,
    payload: {
      order_ref: orderRef,
      ...(item.productId ? { product_id: item.productId } : {}),
      ...(item.packageId ? { package_id: item.packageId, package_version: item.packageVersion } : {}),
      item_name: item.name,
      amount: item.amount,
      currency: item.currency,
      status: "pending",
      access_url: `/store/access/${accessToken}`,
      payment_url: payment.payment_url,
      payment_mode: payment.payment_mode,
      wa_order_url: payment.wa_order_url,
      note: payment.note,
      created_at: inserted[0]?.createdAt ?? new Date(),
    },
  };
}

export function registerOrderApiRoutes(app: Express) {
  if (!configuredKey()) {
    console.warn(
      "[order-api] ORDER_API_KEY belum terpasang — /api/v1/orders FAIL-CLOSED (503) sampai secret dipasang via environment.",
    );
  }

  app.post("/api/v1/orders", async (req: Request, res: Response) => {
    const startedAt = Date.now();
    const done = (status: number, payload: any, ref?: string) => {
      console.log(
        `[order-api] orders status=${status} ref=${logSafe(ref)} latency_ms=${Date.now() - startedAt}`,
      );
      return res.status(status).json(payload);
    };

    try {
      const key = configuredKey();
      if (!key) {
        return done(503, {
          error: "service_not_configured",
          message: "Endpoint belum aktif: ORDER_API_KEY belum dipasang di environment server.",
        });
      }
      const presented = extractBearer(req);
      if (!presented || !safeEqual(presented, key)) {
        return done(401, { error: "unauthorized", message: "API key tidak valid." });
      }

      const now = Date.now();
      let hit;
      try {
        hit = await sharedStore.hit("order-api:orders", RATE_WINDOW_MS, now);
      } catch {
        hit = await memoryFallback.hit("order-api:orders", RATE_WINDOW_MS, now);
      }
      if (hit.count > RATE_LIMIT_PER_MIN) {
        const retryAfterSec = Math.max(1, Math.ceil((hit.resetAt - now) / 1000));
        res.setHeader("Retry-After", String(retryAfterSec));
        return done(429, { error: "rate_limited", message: "Batas permintaan per menit tercapai.", retryAfter: retryAfterSec });
      }

      const v = validateBody(req.body);
      if (!v.ok) return done(400, { error: "invalid_request", message: v.error });
      const result = await createCanonicalOrder(v.data);
      return done(result.status, result.payload, result.orderRef);
    } catch (err) {
      console.error(`[order-api] unexpected_error=${(err as Error)?.name || "unknown"}`);
      return done(500, { error: "internal_error", message: "Terjadi kesalahan internal." });
    }
  });
}
