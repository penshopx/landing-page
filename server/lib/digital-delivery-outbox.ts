import { randomUUID } from "node:crypto";
import { pool } from "../db";
import {
  databaseDigitalProductExists,
  isDatabaseDigitalProductPath,
} from "./digital-product-storage";
import { sendDigitalProductDeliveryEmail } from "./email";
import { resolveAppUrl } from "./prod-url";
import { isExternalDownloadUrl, resolveDownloadUrl } from "./supabase-storage";

export type DigitalDeliveryState = "pending" | "sending" | "sent" | "failed";

export interface DigitalDeliveryOrderInput {
  productId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  midtransOrderId: string;
}

export interface DigitalDeliveryOrder {
  id: number;
  productId: number;
  accessToken: string;
  deliveryStatus: DigitalDeliveryState;
  created: boolean;
}

export interface DigitalDeliveryResult {
  orderId: number;
  accessToken: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  claimed: boolean;
  deliveryStatus: DigitalDeliveryState;
  deliveryUrl?: string;
  permanentLink?: boolean;
  emailSent?: boolean;
  error?: string;
}

const RETRY_AFTER_MINUTES = 5;
const STALE_CLAIM_MINUTES = 10;

function canonicalAppBaseUrl(): string {
  const resolved = resolveAppUrl().appUrl;
  const configured = (process.env.APP_URL || "").trim().replace(/\/$/, "");
  if (resolved) return resolved.replace(/\/$/, "");
  if (/^https:\/\//i.test(configured) && !configured.includes(".replit.dev")) return configured;
  return "https://gustafta.my.id";
}

/**
 * Atomically creates the one durable order row for a Scalev payment. Concurrent
 * webhook attempts all receive the same persisted access token.
 */
export async function ensureDigitalDeliveryOrder(
  input: DigitalDeliveryOrderInput,
): Promise<DigitalDeliveryOrder> {
  const proposedToken = randomUUID();
  const inserted = await pool.query<{
    id: number;
    product_id: number;
    access_token: string;
    delivery_status: DigitalDeliveryState;
  }>(
    `INSERT INTO store_orders (
       product_id, customer_name, customer_email, customer_phone, amount,
       midtrans_order_id, access_token, status, delivery_status
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending','pending')
     ON CONFLICT (midtrans_order_id) DO NOTHING
     RETURNING id, product_id, access_token, delivery_status`,
    [
      input.productId,
      input.customerName,
      input.customerEmail,
      input.customerPhone,
      input.amount,
      input.midtransOrderId,
      proposedToken,
    ],
  );
  if (inserted.rows[0]) {
    return {
      id: inserted.rows[0].id,
      productId: inserted.rows[0].product_id,
      accessToken: inserted.rows[0].access_token,
      deliveryStatus: inserted.rows[0].delivery_status,
      created: true,
    };
  }

  const existing = await pool.query<{
    id: number;
    product_id: number;
    access_token: string;
    delivery_status: DigitalDeliveryState;
  }>(
    `SELECT id, product_id, access_token, delivery_status
       FROM store_orders
      WHERE midtrans_order_id=$1
      LIMIT 1`,
    [input.midtransOrderId],
  );
  const row = existing.rows[0];
  if (!row) throw new Error("Order delivery tidak ditemukan setelah conflict.");
  if (row.product_id !== input.productId) {
    throw new Error(
      `Order ${input.midtransOrderId} sudah terikat ke product ${row.product_id}, bukan ${input.productId}.`,
    );
  }
  return {
    id: row.id,
    productId: row.product_id,
    accessToken: row.access_token,
    deliveryStatus: row.delivery_status,
    created: false,
  };
}

/**
 * Claims and processes one outbox row. The SQL claim is the concurrency gate:
 * only one process may send. Failed/stale claims remain retryable.
 */
export async function processDigitalDeliveryOrder(
  orderId: number,
  appBaseUrl = canonicalAppBaseUrl(),
): Promise<DigitalDeliveryResult> {
  const claim = await pool.query<{
    id: number;
    access_token: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    product_name: string;
    download_path: string;
  }>(
    `WITH claimed AS (
       UPDATE store_orders
          SET delivery_status='sending',
              delivery_attempts=delivery_attempts+1,
              delivery_claimed_at=now(),
              delivery_error=NULL
        WHERE id=$1
          AND (
            delivery_status='pending'
            OR (
              delivery_status='failed'
              AND (
                delivery_claimed_at IS NULL
                OR delivery_claimed_at < now() - ($2 * interval '1 minute')
              )
            )
            OR (
              delivery_status='sending'
              AND delivery_claimed_at < now() - ($3 * interval '1 minute')
            )
          )
        RETURNING *
     )
     SELECT
       claimed.id, claimed.access_token, claimed.customer_name,
       claimed.customer_email, claimed.customer_phone,
       sp.name AS product_name, sp.download_path
     FROM claimed
     JOIN store_products sp ON sp.id=claimed.product_id`,
    [orderId, RETRY_AFTER_MINUTES, STALE_CLAIM_MINUTES],
  );

  if (!claim.rows[0]) {
    const current = await pool.query<{
      id: number;
      access_token: string;
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      product_name: string;
      delivery_status: DigitalDeliveryState;
    }>(
      `SELECT so.id, so.access_token, so.customer_name, so.customer_email,
              so.customer_phone, sp.name AS product_name, so.delivery_status
         FROM store_orders so
         JOIN store_products sp ON sp.id=so.product_id
        WHERE so.id=$1`,
      [orderId],
    );
    const row = current.rows[0];
    if (!row) throw new Error(`Order delivery ${orderId} tidak ditemukan.`);
    return {
      orderId: row.id,
      accessToken: row.access_token,
      productName: row.product_name,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone || "",
      claimed: false,
      deliveryStatus: row.delivery_status,
    };
  }

  const row = claim.rows[0];
  const downloadPath = row.download_path;
  const isDatabaseObject = isDatabaseDigitalProductPath(downloadPath);
  const isPermanentLink = isDatabaseObject || isExternalDownloadUrl(downloadPath);
  let deliveryUrl: string;

  try {
    if (isDatabaseObject) {
      if (!(await databaseDigitalProductExists(downloadPath))) {
        throw new Error("[DigitalProductStorage] File privat tidak ditemukan.");
      }
      deliveryUrl =
        `${appBaseUrl.replace(/\/$/, "")}/store/access/${encodeURIComponent(row.access_token)}`;
    } else {
      deliveryUrl = await resolveDownloadUrl(downloadPath, 86_400);
    }
  } catch (error: any) {
    const detail = String(error?.message || error).slice(0, 1000);
    await pool.query(
      `UPDATE store_orders
          SET status='pending', delivery_status='failed', delivery_error=$2
        WHERE id=$1`,
      [row.id, detail],
    );
    return {
      orderId: row.id,
      accessToken: row.access_token,
      productName: row.product_name,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone || "",
      claimed: true,
      deliveryStatus: "failed",
      permanentLink: isPermanentLink,
      error: detail,
    };
  }

  // The paid gate opens only after a usable delivery destination exists.
  await pool.query(`UPDATE store_orders SET status='paid' WHERE id=$1`, [row.id]);
  const emailResult = await sendDigitalProductDeliveryEmail({
    to: row.customer_email,
    customerName: row.customer_name || null,
    productName: row.product_name,
    downloadUrl: deliveryUrl,
    expiryHours: isPermanentLink ? null : 24,
    orderCorrelationTag: `digital-delivery-${row.access_token}`,
  });

  if (emailResult.sent) {
    await pool.query(
      `UPDATE store_orders
          SET delivery_status='sent', delivery_sent_at=now(), delivery_error=NULL
        WHERE id=$1`,
      [row.id],
    );
  } else {
    const detail = `${emailResult.reason || "email_failed"}${
      emailResult.detail ? `: ${emailResult.detail}` : ""
    }`.slice(0, 1000);
    await pool.query(
      `UPDATE store_orders SET delivery_status='failed', delivery_error=$2 WHERE id=$1`,
      [row.id, detail],
    );
  }

  return {
    orderId: row.id,
    accessToken: row.access_token,
    productName: row.product_name,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone || "",
    claimed: true,
    deliveryStatus: emailResult.sent ? "sent" : "failed",
    deliveryUrl,
    permanentLink: isPermanentLink,
    emailSent: emailResult.sent,
    error: emailResult.sent
      ? undefined
      : `${emailResult.reason || "email_failed"}${emailResult.detail ? `: ${emailResult.detail}` : ""}`,
  };
}

export async function markDigitalDeliverySentByFallback(orderId: number): Promise<void> {
  await pool.query(
    `UPDATE store_orders
        SET delivery_status='sent', delivery_sent_at=now(), delivery_error=NULL
      WHERE id=$1`,
    [orderId],
  );
}

export async function processDigitalDeliveryOutbox(limit = 10): Promise<void> {
  const pending = await pool.query<{ id: number }>(
    `SELECT so.id
       FROM store_orders so
       JOIN store_products sp ON sp.id=so.product_id
      WHERE sp.download_path IS NOT NULL
        AND so.midtrans_order_id LIKE 'scalev_%'
        AND (
          so.delivery_status='pending'
          OR (
            so.delivery_status='failed'
            AND (
              so.delivery_claimed_at IS NULL
              OR so.delivery_claimed_at < now() - ($2 * interval '1 minute')
            )
          )
          OR (
            so.delivery_status='sending'
            AND so.delivery_claimed_at < now() - ($3 * interval '1 minute')
          )
        )
      ORDER BY so.created_at
      LIMIT $1`,
    [limit, RETRY_AFTER_MINUTES, STALE_CLAIM_MINUTES],
  );
  for (const row of pending.rows) {
    try {
      await processDigitalDeliveryOrder(row.id);
    } catch (error: any) {
      console.error(`[DigitalDeliveryOutbox] order=${row.id} error=${error?.message || error}`);
    }
  }
}

let workerStarted = false;

export function startDigitalDeliveryOutboxWorker(): void {
  if (workerStarted) return;
  workerStarted = true;
  void processDigitalDeliveryOutbox().catch((error) =>
    console.error("[DigitalDeliveryOutbox] boot sweep error:", error?.message || error),
  );
  const timer = setInterval(() => {
    void processDigitalDeliveryOutbox().catch((error) =>
      console.error("[DigitalDeliveryOutbox] sweep error:", error?.message || error),
    );
  }, 60_000);
  timer.unref();
}