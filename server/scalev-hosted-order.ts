import { randomUUID } from "node:crypto";
import { pool } from "./db";
import { fulfillCanonicalOrder } from "./order-fulfillment";
import { getScalevOrder } from "./lib/scalev";

export const SCALEV_HOSTED_ORDER_SOURCE = "scalev_hosted";

export type HostedScalevReconciliation = {
  matched: boolean;
  orderId?: number;
  productRegistryId?: string;
  fulfillment?: "fulfilled" | "existing" | "deferred";
  results?: string[];
};

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export function collectScalevVariantUniqueIds(...values: unknown[]): string[] {
  const found = new Set<string>();
  const seen = new Set<object>();
  const visit = (value: unknown): void => {
    if (value == null) return;
    if (typeof value === "string") {
      if (value.startsWith("variant_")) found.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object") {
      if (seen.has(value)) return;
      seen.add(value);
      Object.values(value as Record<string, unknown>).forEach(visit);
    }
  };
  values.forEach(visit);
  return Array.from(found);
}

/**
 * Convert a paid order created directly in the hosted Scalev storefront into a
 * canonical local order. A stable provider-reference lock and deterministic
 * midtrans_order_id make webhook replay/concurrency safe before an order ID
 * exists; canonical fulfillment then applies its own per-order lock.
 */
export async function reconcileHostedScalevOrder(input: {
  providerOrderRef: string;
  variantSources: unknown[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  amount?: number;
  itemName?: string;
  appBaseUrl?: string;
}): Promise<HostedScalevReconciliation> {
  const providerOrderRef = String(input.providerOrderRef || "").trim();
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(providerOrderRef)) {
    throw new Error("Referensi order hosted Scalev tidak valid.");
  }
  const variantUniqueIds = collectScalevVariantUniqueIds(...input.variantSources);
  if (variantUniqueIds.length === 0) return { matched: false };

  const products = await pool.query<{
    product_id: string;
    name: string;
  }>(
    `SELECT product_id, name
       FROM product_registry
      WHERE status='ACTIVE'
        AND scalev_variant_unique_id = ANY($1::text[])
      ORDER BY product_id`,
    [variantUniqueIds],
  );
  if ((products.rowCount || 0) === 0) return { matched: false };
  if ((products.rowCount || 0) > 1) {
    throw new Error(
      `Variant Scalev cocok ke ${products.rowCount} produk registry; fulfillment dihentikan.`,
    );
  }

  const product = products.rows[0];
  const email = normalizeEmail(input.customerEmail);
  if (!email || !email.includes("@")) {
    throw new Error("Email pembeli tidak tersedia pada order hosted Scalev.");
  }
  const stableOrderRef = `scalev_hosted_${providerOrderRef}`;
  const amount = Math.max(0, Math.round(Number(input.amount) || 0));
  const client = await pool.connect();
  let orderId = 0;
  try {
    await client.query(
      "SELECT pg_advisory_lock(hashtextextended($1, 0))",
      [stableOrderRef],
    );
    const order = await client.query<{
      id: number;
      product_registry_id: string | null;
    }>(
      `INSERT INTO store_orders (
         product_id, customer_name, customer_email, customer_phone, amount,
         midtrans_order_id, access_token, status, source, item_name,
         product_registry_id, scalev_order_id, fulfillment_status
       ) VALUES (
         0, $1, $2, $3, $4,
         $5, $6, 'paid', $7, $8,
         $9, $10, 'pending'
       )
       ON CONFLICT (midtrans_order_id) DO UPDATE
         SET status='paid',
             scalev_order_id=EXCLUDED.scalev_order_id,
             customer_name=EXCLUDED.customer_name,
             customer_email=EXCLUDED.customer_email,
             customer_phone=EXCLUDED.customer_phone,
             amount=CASE
               WHEN EXCLUDED.amount > 0 THEN EXCLUDED.amount
               ELSE store_orders.amount
             END,
             item_name=EXCLUDED.item_name,
             product_registry_id=EXCLUDED.product_registry_id,
             source=EXCLUDED.source,
             fulfillment_status=CASE
               WHEN store_orders.fulfillment_status='not_applicable' THEN 'pending'
               ELSE store_orders.fulfillment_status
             END
       RETURNING id, product_registry_id`,
      [
        String(input.customerName || "Customer").trim() || "Customer",
        email,
        String(input.customerPhone || "").trim(),
        amount,
        stableOrderRef,
        randomUUID(),
        SCALEV_HOSTED_ORDER_SOURCE,
        String(input.itemName || product.name).trim() || product.name,
        product.product_id,
        providerOrderRef,
      ],
    );
    if (order.rows[0]?.product_registry_id !== product.product_id) {
      throw new Error("Order hosted Scalev sudah terikat ke produk registry lain.");
    }
    orderId = order.rows[0].id;
  } finally {
    await client
      .query("SELECT pg_advisory_unlock(hashtextextended($1, 0))", [
        stableOrderRef,
      ])
      .catch(() => undefined);
    client.release();
  }

  const fulfilled = await fulfillCanonicalOrder({
    orderId,
    providerOrderRef,
    appBaseUrl: input.appBaseUrl,
  });
  return {
    matched: true,
    orderId,
    productRegistryId: product.product_id,
    fulfillment: fulfilled.status,
    results: fulfilled.results,
  };
}

/**
 * Reconcile one historical paid hosted-store order from Scalev's API. This is
 * deliberately a server-only function rather than a public/admin HTTP route.
 */
export async function reconcileHostedScalevOrderFromProvider(input: {
  providerOrderRef: string;
  appBaseUrl?: string;
}): Promise<HostedScalevReconciliation> {
  const data = await getScalevOrder(input.providerOrderRef);
  if (String(data.payment_status || "").toLowerCase() !== "paid") {
    throw new Error(
      `Order Scalev belum paid (status=${String(data.payment_status || "unknown")}).`,
    );
  }
  const customer = data.customer || data.destination_address || {};
  const itemNames = Object.keys(data.final_variants || data.variants || {});
  return reconcileHostedScalevOrder({
    providerOrderRef: String(data.order_id),
    variantSources: [
      data.variant_id,
      data.variantId,
      data.variant,
      data.variants,
      data.items,
      data.line_items,
      data.order_items,
    ],
    customerName: customer.name || data.payment_account_holder || "",
    customerEmail: customer.email || "",
    customerPhone: customer.phone || "",
    amount: Number(data.gross_revenue || data.net_revenue || 0),
    itemName: data.product_name || data.name || itemNames[0] || "",
    appBaseUrl: input.appBaseUrl,
  });
}