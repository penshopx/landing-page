import { pool } from "./db";

type PackageComponent = {
  productRegistryId: string;
  accessLevel?: string;
  usageLimit?: number | null;
};

type FulfillmentOrder = {
  id: number;
  source: string | null;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  amount: number;
  item_name: string | null;
  package_id: string | null;
  product_registry_id: string | null;
  package_version: number | null;
  scalev_order_id: string | null;
  fulfillment_status: string;
  fulfillment_attempts: number;
  fulfillment_attempted_at: Date | null;
};

export type CanonicalAccessItem = {
  productRegistryId: string;
  name: string;
  productType: string;
  accessType: string | null;
  accessUrl: string | null;
  expiresAt: string;
  quotaTotal: number;
  quotaUsed: number;
};

function normalizedEmail(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function packageDurationDays(value: number, unit: string): number {
  const safeValue = Math.max(1, Math.trunc(value || 1));
  return String(unit).toUpperCase() === "YEAR"
    ? safeValue * 365
    : safeValue * 30;
}

function normalizeComposition(value: unknown): PackageComponent[] {
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item: any) => ({
      productRegistryId: String(item?.productRegistryId || "").trim(),
      accessLevel: String(item?.accessLevel || "FULL").trim().toUpperCase(),
      usageLimit:
        item?.usageLimit == null ? null : Math.max(0, Number(item.usageLimit) || 0),
    }))
    .filter((item) => item.productRegistryId.length > 0);
}

async function loadOrder(orderId: number): Promise<FulfillmentOrder> {
  const result = await pool.query<FulfillmentOrder>(
    `SELECT id, source, status, customer_name, customer_email, customer_phone,
            amount, item_name, package_id, product_registry_id, package_version, scalev_order_id,
            fulfillment_status, fulfillment_attempts, fulfillment_attempted_at
       FROM store_orders
      WHERE id=$1
      LIMIT 1`,
    [orderId],
  );
  if (!result.rows[0]) throw new Error("Order kanonik tidak ditemukan.");
  return result.rows[0];
}

async function resolveComponents(order: FulfillmentOrder): Promise<{
  components: PackageComponent[];
  durationDays: number;
}> {
  if (order.package_id) {
    const snapshot = await pool.query<{
      composition: unknown;
      duration_value: number;
      duration_unit: string;
    }>(
      `SELECT composition, duration_value, duration_unit
         FROM package_version_snapshots
        WHERE package_id=$1 AND version=$2
        LIMIT 1`,
      [order.package_id, order.package_version],
    );
    if (!snapshot.rows[0]) {
      throw new Error(
        `Snapshot paket ${order.package_id} v${order.package_version} tidak ditemukan.`,
      );
    }
    const components = normalizeComposition(snapshot.rows[0].composition);
    if (components.length === 0) {
      throw new Error(`Komposisi paket ${order.package_id} kosong atau tidak valid.`);
    }
    return {
      components,
      durationDays: packageDurationDays(
        snapshot.rows[0].duration_value,
        snapshot.rows[0].duration_unit,
      ),
    };
  }

  const productRegistryId = order.product_registry_id;
  if (!productRegistryId) {
    throw new Error("Identitas produk kanonik tidak tersimpan pada order.");
  }
  const product = await pool.query<{ billing_type: string }>(
    `SELECT billing_type
       FROM product_registry
      WHERE product_id=$1
      LIMIT 1`,
    [productRegistryId],
  );
  if (!product.rows[0]) {
    throw new Error(`Produk ${productRegistryId} tidak ditemukan di registry.`);
  }
  return {
    components: [
      { productRegistryId, accessLevel: "FULL", usageLimit: null },
    ],
    durationDays:
      String(product.rows[0].billing_type).toUpperCase() === "MONTHLY" ? 30 : 3650,
  };
}

async function grantComponent(
  order: FulfillmentOrder,
  component: PackageComponent,
  durationDays: number,
  providerOrderRef: string,
  appBaseUrl?: string,
): Promise<string[]> {
  const product = await pool.query<{
    product_id: string;
    slug: string;
    name: string;
  }>(
    `SELECT product_id, slug, name
       FROM product_registry
      WHERE product_id=$1
      LIMIT 1`,
    [component.productRegistryId],
  );
  if (!product.rows[0]) {
    throw new Error(
      `Komponen ${component.productRegistryId} tidak ditemukan di registry.`,
    );
  }

  const results: string[] = [];
  const { getSbuSkkOfferKeyByProductId, fulfillSbuSkkOffer, grantEntitlement } =
    await import("./sbu-skk-funnel");
  const offerKey = getSbuSkkOfferKeyByProductId(component.productRegistryId);
  if (offerKey) {
    const fulfilled = await fulfillSbuSkkOffer({
      offerKey,
      buyerName: order.customer_name,
      buyerEmail: order.customer_email,
      buyerWhatsapp: order.customer_phone,
      amount: order.amount,
      source: "scalev",
      providerOrderRef,
      appBaseUrl,
      durationDays,
      quotaTotal:
        component.usageLimit == null
          ? undefined
          : Math.max(1, Math.trunc(component.usageLimit)),
    });
    results.push(...fulfilled.results);
    if (offerKey !== "ai-specialist") return results;
  }

  const user = await pool.query<{ id: string }>(
    `SELECT id
       FROM users
      WHERE lower(email)=lower($1)
      LIMIT 1`,
    [normalizedEmail(order.customer_email)],
  );
  const quota =
    component.usageLimit == null
      ? 1_000_000
      : Math.max(1, Math.trunc(component.usageLimit));
  const granted = await grantEntitlement({
    entitlementKey: `registry:${component.productRegistryId}`,
    email: order.customer_email,
    userId: user.rows[0]?.id || null,
    productRegistryId: component.productRegistryId,
    agentSlug: product.rows[0].slug.slice(0, 80),
    durationDays,
    quotaTotal: quota,
    source: "scalev_api",
    providerOrderRef,
  });
  results.push(
    granted.isNew
      ? `access_granted:${component.productRegistryId}`
      : `access_existing:${component.productRegistryId}`,
  );
  return results;
}

/**
 * Fulfill one paid canonical order. The provider order reference and entitlement
 * unique indexes make retries safe. Payment state is never rolled back when a
 * component fails; the order remains paid and fulfillment is marked failed.
 */
export async function fulfillCanonicalOrder(params: {
  orderId: number;
  providerOrderRef: string;
  appBaseUrl?: string;
}): Promise<{ status: "fulfilled" | "existing" | "deferred"; results: string[] }> {
  const lockClient = await pool.connect();
  try {
    await lockClient.query("SELECT pg_advisory_lock($1)", [params.orderId]);
    const order = await loadOrder(params.orderId);
    if (order.source !== "api_v1") {
      throw new Error("Order bukan berasal dari Unified Order API.");
    }
    if (order.status !== "paid") {
      throw new Error("Fulfillment hanya dapat dijalankan untuk order paid.");
    }
    if (order.fulfillment_status === "fulfilled") {
      return { status: "existing", results: [] };
    }
    const attemptedAt = order.fulfillment_attempted_at
      ? new Date(order.fulfillment_attempted_at).getTime()
      : 0;
    const now = Date.now();
    if (
      order.fulfillment_status === "processing" &&
      attemptedAt > now - 10 * 60_000
    ) {
      return { status: "deferred", results: [] };
    }
    if (order.fulfillment_status === "failed" && attemptedAt > 0) {
      const backoffMinutes = Math.min(
        60,
        Math.max(1, 2 ** Math.min(order.fulfillment_attempts, 5)),
      );
      if (attemptedAt > now - backoffMinutes * 60_000) {
        return { status: "deferred", results: [] };
      }
    }

    await pool.query(
      `UPDATE store_orders
          SET fulfillment_status='processing',
              fulfillment_attempts=fulfillment_attempts+1,
              fulfillment_error=NULL,
              fulfillment_attempted_at=now()
        WHERE id=$1`,
      [params.orderId],
    );

    try {
      const { components, durationDays } = await resolveComponents(order);
      const results: string[] = [];
      for (const component of components) {
        results.push(
          ...(await grantComponent(
            order,
            component,
            durationDays,
            params.providerOrderRef,
            params.appBaseUrl,
          )),
        );
      }
      await pool.query(
        `UPDATE store_orders
            SET fulfillment_status='fulfilled',
                fulfillment_error=NULL,
                fulfilled_at=COALESCE(fulfilled_at, now()),
                fulfillment_attempted_at=now()
          WHERE id=$1`,
        [params.orderId],
      );
      return { status: "fulfilled", results };
    } catch (error) {
      const message = String((error as Error)?.message || "fulfillment_failed").slice(
        0,
        2000,
      );
      await pool.query(
        `UPDATE store_orders
            SET fulfillment_status='failed',
                fulfillment_error=$2,
                fulfillment_attempted_at=now()
          WHERE id=$1`,
        [params.orderId, message],
      );
      throw error;
    }
  } finally {
    await lockClient
      .query("SELECT pg_advisory_unlock($1)", [params.orderId])
      .catch(() => undefined);
    lockClient.release();
  }
}

/**
 * Recover paid orders that were never attempted, failed transiently, or were
 * abandoned in processing by a stopped process. Advisory locks in
 * fulfillCanonicalOrder make this safe when multiple app instances sweep.
 */
export async function reconcileCanonicalOrderFulfillment(
  limit = 25,
): Promise<{ attempted: number; fulfilled: number; failed: number }> {
  const candidates = await pool.query<{
    id: number;
    scalev_order_id: string | null;
  }>(
    `SELECT id, scalev_order_id
       FROM store_orders
      WHERE source='api_v1'
        AND status='paid'
        AND (
          fulfillment_status='pending'
          OR (
            fulfillment_status='processing'
            AND fulfillment_attempted_at < now() - interval '10 minutes'
          )
          OR (
            fulfillment_status='failed'
            AND fulfillment_attempted_at <= now() - make_interval(
              mins => LEAST(60, GREATEST(1, power(2, LEAST(fulfillment_attempts, 5))::integer))
            )
          )
        )
      ORDER BY id
      LIMIT $1`,
    [Math.max(1, Math.min(100, Math.trunc(limit)))],
  );
  let fulfilled = 0;
  let failed = 0;
  for (const candidate of candidates.rows) {
    const providerOrderRef = String(candidate.scalev_order_id || "").trim();
    if (!providerOrderRef) {
      failed++;
      await pool.query(
        `UPDATE store_orders
            SET fulfillment_status='failed',
                fulfillment_attempts=fulfillment_attempts+1,
                fulfillment_error='Referensi order provider belum tersedia.',
                fulfillment_attempted_at=now()
          WHERE id=$1`,
        [candidate.id],
      );
      continue;
    }
    try {
      const result = await fulfillCanonicalOrder({
        orderId: candidate.id,
        providerOrderRef,
      });
      if (result.status === "fulfilled" || result.status === "existing") {
        fulfilled++;
      }
    } catch (error) {
      failed++;
      console.error(
        `[OrderFulfillment] Retry order ${candidate.id} gagal:`,
        (error as Error).message,
      );
    }
  }
  return { attempted: candidates.rowCount || 0, fulfilled, failed };
}

export async function getCanonicalOrderAccess(orderId: number): Promise<{
  items: CanonicalAccessItem[];
  productRegistryIds: string[];
}> {
  const order = await loadOrder(orderId);
  if (order.source !== "api_v1" || order.status !== "paid") {
    return { items: [], productRegistryIds: [] };
  }
  const providerRef = String(order.scalev_order_id || "").trim();
  if (!providerRef) return { items: [], productRegistryIds: [] };
  const result = await pool.query<{
    product_registry_id: string;
    name: string;
    product_type: string;
    access_type: string | null;
    access_url: string | null;
    expires_at: Date;
    quota_total: number;
    quota_used: number;
  }>(
    `SELECT DISTINCT ON (pe.product_registry_id)
            pe.product_registry_id, pr.name, pr.product_type, pr.access_type,
            pr.access_url, pe.expires_at, pe.quota_total, pe.quota_used
       FROM product_entitlements pe
       JOIN product_registry pr ON pr.product_id=pe.product_registry_id
      WHERE pe.provider_order_ref=$1
        AND pe.email=$2
        AND pe.status IN ('pending','active')
      ORDER BY pe.product_registry_id, pe.id`,
    [providerRef, normalizedEmail(order.customer_email)],
  );
  return {
    productRegistryIds: result.rows.map((row) => row.product_registry_id),
    items: result.rows.map((row) => ({
      productRegistryId: row.product_registry_id,
      name: row.name,
      productType: row.product_type,
      accessType: row.access_type,
      accessUrl: row.access_url,
      expiresAt: row.expires_at.toISOString(),
      quotaTotal: row.quota_total,
      quotaUsed: row.quota_used,
    })),
  };
}