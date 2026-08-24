const SCALEV_API_URL = "https://api.scalev.id/v2";
const SCALEV_V3_API_URL = "https://api.scalev.com/v3";

// Base URL toko pembayaran (Scalev storefront). Ganti via env PAYMENT_BASE_URL
// tanpa perlu sentuh kode saat migrasi domain berikutnya.
export const PAYMENT_BASE_URL = process.env.PAYMENT_BASE_URL || "https://bayar.dokumenproyek.com";

// ── Subscription plan definitions (moved from mayar.ts, provider-agnostic) ──
export const subscriptionPlans = {
  free_trial: {
    name: "Free Trial",
    duration: 7,
    price: 0,
    chatbotLimit: 1,
    description: "7 hari gratis, 75 pesan, 1 chatbot — via Dialog Gustafta",
  },
  monthly_1: {
    name: "1 Bulan",
    duration: 30,
    price: 199000,
    chatbotLimit: 3,
    description: "Langganan bulanan dengan akses penuh",
  },
  monthly_3: {
    name: "3 Bulan",
    duration: 90,
    price: 499000,
    chatbotLimit: 5,
    description: "Hemat 16% dibanding bulanan",
  },
  monthly_6: {
    name: "6 Bulan",
    duration: 180,
    price: 999000,
    chatbotLimit: 10,
    description: "Hemat 17% dibanding bulanan",
  },
  monthly_12: {
    name: "12 Bulan",
    duration: 365,
    price: 1999000,
    chatbotLimit: 25,
    description: "Hemat 16% dibanding bulanan",
  },
};

export type SubscriptionPlanKey = keyof typeof subscriptionPlans;

export interface ScalevProductResult {
  id: number;
  slug: string;
  name: string;
  checkoutUrl: string;
}

export async function createScalevProduct(params: {
  name: string;
  description?: string;
  price: number;
  variantName?: string;
}): Promise<ScalevProductResult> {
  const apiKey = process.env.SCALEV_API_KEY;
  if (!apiKey) throw new Error("SCALEV_API_KEY tidak ditemukan di environment.");

  const body = {
    name: params.name,
    public_name: params.name,
    description: params.description || params.name,
    item_type: "digital",
    status: "active",
    variants: [{ name: params.variantName || params.name, price: params.price }],
  };

  const res = await fetch(`${SCALEV_API_URL}/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json() as any;
  if (!res.ok || json.code !== 200) {
    const errMsg = JSON.stringify(json?.error || json?.status || json);
    throw new Error(`Scalev API error: ${errMsg}`);
  }

  const product = json.data;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    checkoutUrl: `${PAYMENT_BASE_URL}/p/${product.slug}`,
  };
}

// ── Scalev v3: create order server-side (Task #313A) ────────────────────────
// Korelasi deterministik: kita membuat order DI Scalev dan menyimpan order_id
// yang dikembalikan — webhook nanti mencocokkan data.order_id ke kolom
// store_orders.scalev_order_id. TIDAK bergantung pada echo custom field.
export interface ScalevOrderResult {
  scalevOrderId: string;   // data.order_id (mis. "250130JQHFZG") — kunci korelasi webhook
  scalevUuid: string | null; // data.id (UUID) — untuk lookup GET /v3/orders/{id}
  checkoutUrl: string;     // URL yang diberikan ke pembeli untuk membayar
}

export async function createScalevOrder(params: {
  storeUniqueId: string;
  variantUniqueId: string;
  quantity?: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderRef: string; // ORD-* Gustafta — dikirim sebagai metadata (defense-in-depth saja)
}): Promise<ScalevOrderResult> {
  const apiKey = process.env.SCALEV_API_KEY;
  if (!apiKey) throw new Error("SCALEV_API_KEY tidak ditemukan di environment.");

  // Scalev menolak "+62..." ("has invalid format") — normalisasi ke digit saja
  // (buang non-digit; "08xx" → "628xx").
  const rawPhone = (params.customerPhone || "").replace(/\D/g, "");
  const phone = rawPhone.startsWith("0") ? `62${rawPhone.slice(1)}` : rawPhone;

  const body: Record<string, unknown> = {
    store_unique_id: params.storeUniqueId,
    customer_name: params.customerName,
    customer_email: params.customerEmail,
    ...(phone ? { customer_phone: phone } : {}),
    ordervariants: [
      { variant_unique_id: params.variantUniqueId, quantity: params.quantity ?? 1 },
    ],
    // Defense-in-depth: BUKAN dependency korelasi (korelasi utama = order_id).
    metadata: { order_ref: params.orderRef },
    notes: `Gustafta order_ref: ${params.orderRef}`,
  };

  const res = await fetch(`${SCALEV_V3_API_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as any;
  // Respons v3 TIDAK dibungkus {data:...} (terverifikasi live) — tapi terima keduanya.
  const d = json?.data ?? json;
  if (!res.ok || !d) {
    throw new Error(`Scalev v3 create order gagal: HTTP ${res.status} ${JSON.stringify(json?.errors || json?.error || json?.message || "").slice(0, 300)}`);
  }
  const scalevOrderId = String(d.order_id || "");
  const checkoutUrl = String(d.public_order_url || d.payment_url || "");
  if (!scalevOrderId || !checkoutUrl) {
    throw new Error(`Scalev v3 create order: respons tanpa order_id/URL (order_id='${scalevOrderId}').`);
  }
  return { scalevOrderId, scalevUuid: d.id ? String(d.id) : null, checkoutUrl };
}

/**
 * Fetch one existing Scalev order for a tightly-scoped reconciliation/backfill.
 * The API key stays server-side; callers receive only the provider payload.
 */
export async function getScalevOrder(orderId: string): Promise<any> {
  const apiKey = process.env.SCALEV_API_KEY;
  if (!apiKey) throw new Error("SCALEV_API_KEY tidak ditemukan di environment.");
  const safeOrderId = String(orderId || "").trim();
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(safeOrderId)) {
    throw new Error("Referensi order Scalev tidak valid.");
  }

  const res = await fetch(
    `${SCALEV_V3_API_URL}/orders/${encodeURIComponent(safeOrderId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    },
  );
  const json = (await res.json().catch(() => null)) as any;
  const data = json?.data ?? json;
  if (!res.ok || !data) {
    throw new Error(
      `Scalev v3 get order gagal: HTTP ${res.status} ${JSON.stringify(
        json?.errors || json?.error || json?.message || "",
      ).slice(0, 300)}`,
    );
  }
  if (String(data.order_id || "") !== safeOrderId) {
    throw new Error("Respons Scalev tidak cocok dengan referensi order.");
  }
  return data;
}
