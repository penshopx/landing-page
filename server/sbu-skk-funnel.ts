/**
 * SBU-SKK Funnel routes — Task #395
 *
 * Routes:
 *   POST /api/sbu-skk/lead                    — submit lead form, mint 30-day token
 *   GET  /api/sbu-skk/lead/access/:token       — verify lead token + mini ebook info
 *   GET  /api/sbu-skk/lead/access/:token/download — stream mini ebook bytes (private)
 *
 *   GET  /api/sbu-skk/tutor/status             — authenticated: entitlement status + auto-claim
 *   POST /api/sbu-skk/orders                   — create pending manual order (no Scalev variant)
 *   POST /api/sbu-skk/admin/orders/:id/confirm — admin: confirm order + grant entitlement
 *
 * GET  /api/store/access/:token      (existing) — extended to return downloads array
 * GET  /api/store/access/:token/download/:fileId (new) — download specific file by id
 *
 * Stream gate for sbu-skk-tutor is injected in server/routes.ts (small hook).
 */

import express, { type Express, type Request, type Response } from "express";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { pool } from "./db";
import { SBU_SKK_EBOOK, SBU_SKK_FUNNEL } from "@shared/sbu-skk-ebook";
import {
  SBU_READINESS_RUBRIC_VERSION,
  type SbuReadinessBand,
  type SbuReadinessDestination,
  type SbuReadinessEventType,
} from "@shared/sbu-readiness";
import {
  assessSbuSkkLevel1,
  type SbuSkkLevel1DiagnosticType,
  type SbuSkkLevel1Result,
} from "@shared/sbu-skk-level1";
import { sendEmail } from "./lib/email";
import { getWaContact } from "./lib/wa-contact";
import { PostgresRateLimitStore } from "./lib/rate-limiter";
import { authenticateRequest, isAuthenticated } from "./replit_integrations/auth";
import { storage } from "./storage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WA_RE = /^[+\d\s()-]{7,20}$/;
const MANUAL_ORDER_PROCESSING_LEASE_MINUTES = 10;

const leadRateStore = new PostgresRateLimitStore((text, params) =>
  pool.query(text, params),
);

async function checkLeadRate(ip: string): Promise<boolean> {
  const key = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const hit = await leadRateStore.hit(`sbu-skk-lead:${key}`, 60_000, Date.now());
  return hit.count <= 5;
}

async function checkReadinessEventRate(ip: string): Promise<boolean> {
  const key = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const hit = await leadRateStore.hit(
    `sbu-readiness-event:${key}`,
    60_000,
    Date.now(),
  );
  return hit.count <= 30;
}

export const SBU_READINESS_EVENT_PATH = "/api/sbu-skk/readiness/events";

export function getTrustedClientIp(req: Request): string {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function registerSbuReadinessEventIngress(
  app: Express,
  options: {
    checkRate?: (ip: string) => Promise<boolean>;
  } = {},
): void {
  const parseSmallJson = express.json({ limit: "1kb", strict: true });
  const checkRate = options.checkRate || checkReadinessEventRate;

  // This middleware is registered before the global 50 MB parser. It both
  // rate-limits malformed/oversized attempts and enforces the actual byte cap,
  // including chunked requests without Content-Length.
  app.use(SBU_READINESS_EVENT_PATH, async (req, res, next) => {
    if (req.method !== "POST") return next();
    res.setHeader("Cache-Control", "no-store");

    try {
      if (!(await checkRate(getTrustedClientIp(req)))) {
        return res.status(429).json({
          error: "Terlalu banyak event. Coba lagi dalam 1 menit.",
        });
      }
    } catch (error) {
      console.error(
        "[SBU Readiness] Ingress rate limit failed:",
        (error as Error).message,
      );
      return res.status(503).json({ error: "Pengukuran sementara tidak tersedia." });
    }

    if (!req.is("application/json")) {
      return res.status(415).json({ error: "Content-Type harus application/json." });
    }

    parseSmallJson(req, res, (error?: unknown) => {
      if (error) {
        const parserError = error as { type?: string };
        if (parserError.type === "entity.too.large") {
          return res.status(413).json({ error: "Payload terlalu besar." });
        }
        return res.status(400).json({ error: "JSON tidak valid." });
      }
      res.locals.sbuReadinessIngressChecked = true;
      next();
    });
  });
}

const readinessEventSchema = z.object({
  eventType: z.enum(["result", "cta"]),
  band: z.enum(["foundation", "organize", "validate"]),
  destination: z.enum(["mini-ebook", "ebook", "ai-specialist"]).optional(),
  rubricVersion: z.literal(SBU_READINESS_RUBRIC_VERSION),
}).strict().superRefine((event, context) => {
  if (event.eventType === "cta" && !event.destination) {
    context.addIssue({
      code: "custom",
      path: ["destination"],
      message: "Tujuan CTA wajib diisi.",
    });
  }
  if (event.eventType === "result" && event.destination) {
    context.addIssue({
      code: "custom",
      path: ["destination"],
      message: "Event hasil tidak menerima tujuan CTA.",
    });
  }
});

export interface SbuReadinessAggregateEvent {
  eventType: SbuReadinessEventType;
  band: SbuReadinessBand;
  destination?: SbuReadinessDestination;
  rubricVersion: typeof SBU_READINESS_RUBRIC_VERSION;
}

export function parseSbuReadinessAggregateEvent(
  input: unknown,
): SbuReadinessAggregateEvent {
  return readinessEventSchema.parse(input);
}

export function buildSbuReadinessAggregateKey(
  input: SbuReadinessAggregateEvent,
): string {
  const parsed = parseSbuReadinessAggregateEvent(input);
  return [
    "sbu_readiness",
    parsed.rubricVersion,
    parsed.eventType,
    parsed.band,
    parsed.destination || "none",
  ].join(":");
}

/**
 * Persist only an anonymous aggregate counter. No answer, session, user, IP,
 * referrer, or company field is accepted or written.
 */
export async function recordSbuReadinessAggregateEvent(
  input: SbuReadinessAggregateEvent,
  executor: {
    query: (text: string, params?: unknown[]) => Promise<unknown>;
  } = pool,
): Promise<void> {
  const key = buildSbuReadinessAggregateKey(input);
  await executor.query(
    `INSERT INTO system_config (key, value, updated_at)
     VALUES ($1, '1', now())
     ON CONFLICT (key) DO UPDATE SET
       value = (
         CASE
           WHEN system_config.value ~ '^[0-9]+$' THEN system_config.value::bigint
           ELSE 0
         END + 1
       )::text,
       updated_at = now()`,
    [key],
  );
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeWhatsapp(wa: string | undefined): string | null {
  if (!wa || !wa.trim()) return null;
  return wa.trim().replace(/\s+/g, "").replace(/^0/, "+62");
}

function getSessionUserId(req: Request): string {
  return String(
    (req as any).user?.claims?.sub ||
      (req as any).user?.id ||
      (req as any).session?.emailUser?.id ||
      "",
  );
}

async function getSessionEmail(req: Request, userId: string): Promise<string> {
  const sessionEmail =
    (req as any).user?.claims?.email ||
    (req as any).user?.emailUser?.email ||
    (req as any).session?.emailUser?.email;
  if (typeof sessionEmail === "string" && EMAIL_RE.test(sessionEmail)) {
    return normalizeEmail(sessionEmail);
  }
  if (!userId) return "";
  const row = await pool.query<{ email: string | null }>(
    `SELECT email FROM users WHERE id=$1 LIMIT 1`,
    [userId],
  );
  return row.rows[0]?.email ? normalizeEmail(row.rows[0].email) : "";
}

function publicBaseUrl(req: Request): string {
  for (const candidate of [
    process.env.PROD_URL,
    process.env.PUBLIC_BASE_URL,
    ...(process.env.REPLIT_DOMAINS || "").split(","),
  ]) {
    const value = String(candidate || "").trim();
    if (!value) continue;
    try {
      const parsed = new URL(value.includes("://") ? value : `https://${value}`);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return parsed.origin;
      }
    } catch {
      // Ignore malformed configuration and continue to the request host.
    }
  }
  const host = String(req.headers.host || "").trim();
  if (/^[a-z0-9.-]+(?::\d+)?$/i.test(host)) {
    const proto = String(req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http"))
      .split(",")[0]
      .trim();
    return `${proto === "http" ? "http" : "https"}://${host}`;
  }
  return "https://gustafta.my.id";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

// ─── Lead token generation ─────────────────────────────────────────────────────
function mintLeadToken(): string {
  return randomBytes(30).toString("hex"); // 60-char hex
}

export interface LeadSubmissionInput {
  assetSlug: string;
  name: string;
  email: string;
  whatsapp?: string;
  whatsappConsent?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPath?: string;
  accessDays: number;
}

/**
 * Atomically keeps one lead row per email + asset. An active token is reused;
 * an expired token is rotated without creating a duplicate row.
 */
export async function getOrCreateLeadSubmission(
  input: LeadSubmissionInput,
): Promise<{ token: string; expiresAt: Date }> {
  const proposedToken = mintLeadToken();
  const proposedExpiry = new Date(Date.now() + input.accessDays * 86400_000);
  const row = await pool.query<{ access_token: string; expires_at: Date }>(
    `INSERT INTO lead_submissions (
       asset_slug, name, email, whatsapp, whatsapp_consent,
       utm_source, utm_medium, utm_campaign, utm_content, utm_term,
       referrer, landing_path, access_token, expires_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (email, asset_slug) DO UPDATE SET
       name = EXCLUDED.name,
       whatsapp = EXCLUDED.whatsapp,
       whatsapp_consent = EXCLUDED.whatsapp_consent,
       utm_source = EXCLUDED.utm_source,
       utm_medium = EXCLUDED.utm_medium,
       utm_campaign = EXCLUDED.utm_campaign,
       utm_content = EXCLUDED.utm_content,
       utm_term = EXCLUDED.utm_term,
       referrer = EXCLUDED.referrer,
       landing_path = EXCLUDED.landing_path,
       access_token = CASE
         WHEN lead_submissions.expires_at <= now() THEN EXCLUDED.access_token
         ELSE lead_submissions.access_token
       END,
       expires_at = CASE
         WHEN lead_submissions.expires_at <= now() THEN EXCLUDED.expires_at
         ELSE lead_submissions.expires_at
       END,
       email_sent = CASE
         WHEN lead_submissions.expires_at <= now() THEN false
         ELSE lead_submissions.email_sent
       END,
       email_sent_at = CASE
         WHEN lead_submissions.expires_at <= now() THEN NULL
         ELSE lead_submissions.email_sent_at
       END
     RETURNING access_token, expires_at`,
    [
      input.assetSlug,
      input.name.trim(),
      normalizeEmail(input.email),
      normalizeWhatsapp(input.whatsapp),
      !!input.whatsapp && input.whatsappConsent === true,
      (input.utmSource || "").slice(0, 100),
      (input.utmMedium || "").slice(0, 100),
      (input.utmCampaign || "").slice(0, 100),
      (input.utmContent || "").slice(0, 100),
      (input.utmTerm || "").slice(0, 100),
      (input.referrer || "").slice(0, 500),
      (input.landingPath || "").slice(0, 500),
      proposedToken,
      proposedExpiry,
    ],
  );
  if (!row.rows[0]) throw new Error("Submission lead tidak tersimpan.");
  return {
    token: row.rows[0].access_token,
    expiresAt: new Date(row.rows[0].expires_at),
  };
}

// ─── Lexical retrieval for tutor ──────────────────────────────────────────────
async function retrieveTutorSources(query: string, topK = 5): Promise<
  Array<{ source_title: string; page_number: number; content: string }>
> {
  const stopWords = new Set([
    "apa",
    "yang",
    "dan",
    "atau",
    "untuk",
    "dengan",
    "dari",
    "saya",
    "kami",
    "bagaimana",
    "adalah",
    "dalam",
    "pada",
  ]);
  const words = Array.from(
    new Set(
      query
    .toLowerCase()
        .split(/[^a-z0-9À-ÿ]+/i)
        .filter((word) => word.length >= 3 && !stopWords.has(word)),
    ),
  ).slice(0, 10);
  if (words.length === 0) return [];

  const clauses = words.map((_, i) => `search_terms ILIKE $${i + 1} OR content ILIKE $${i + 1}`);
  const params = words.map((w) => `%${w}%`);

  const result = await pool.query<{
    source_title: string;
    page_number: number;
    content: string;
    hit_count: string;
  }>(
    `SELECT source_title, page_number, content,
            (${words.map((_, i) => `(CASE WHEN search_terms ILIKE $${i + 1} OR content ILIKE $${i + 1} THEN 1 ELSE 0 END)`).join(" + ")}) AS hit_count
       FROM sbu_skk_tutor_sources
      WHERE ${clauses.join(" OR ")}
      ORDER BY hit_count DESC, page_number ASC
      LIMIT $${params.length + 1}`,
    [...params, topK],
  );
  return result.rows;
}

// ─── Entitlement service ───────────────────────────────────────────────────────
export async function grantEntitlement(params: {
  entitlementKey: string;
  email: string;
  userId?: string | null;
  productRegistryId: string;
  agentSlug: string;
  durationDays: number;
  quotaTotal: number;
  source: string;
  providerOrderRef?: string | null;
  manualOrderRef?: string | null;
  grantedBy?: string | null;
}): Promise<{ id: number; isNew: boolean }> {
  const email = normalizeEmail(params.email);
  const expiresAt = new Date(Date.now() + params.durationDays * 86400_000);

  const result = await pool.query<{ id: number }>(
    `INSERT INTO product_entitlements (
       entitlement_key, email, user_id, product_registry_id, agent_slug,
       starts_at, expires_at, quota_total, quota_used, status,
       source, provider_order_ref, manual_order_ref, granted_by, updated_at
     ) VALUES ($1,$2,$3,$4,$5,now(),$6,$7,0,$8,$9,$10,$11,$12,now())
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [
      params.entitlementKey,
      email,
      params.userId || null,
      params.productRegistryId,
      params.agentSlug,
      expiresAt,
      params.quotaTotal,
      params.userId ? "active" : "pending",
      params.source,
      params.providerOrderRef || null,
      params.manualOrderRef || null,
      params.grantedBy || null,
    ],
  );
  if (result.rows[0]) return { id: result.rows[0].id, isNew: true };

  const existing = await pool.query<{ id: number }>(
    `SELECT id
       FROM product_entitlements
      WHERE entitlement_key=$1
        AND email=$2
        AND (
          ($3::text IS NOT NULL AND provider_order_ref=$3)
          OR ($4::text IS NOT NULL AND manual_order_ref=$4)
        )
      ORDER BY id
      LIMIT 1`,
    [
      params.entitlementKey,
      email,
      params.providerOrderRef || null,
      params.manualOrderRef || null,
    ],
  );
  if (!existing.rows[0]) {
    throw new Error("Entitlement conflict tidak dapat direkonsiliasi.");
  }
  return { id: existing.rows[0].id, isNew: false };
}

/** Claim pending entitlements for a user who just logged in (email match). */
export async function claimPendingEntitlements(
  userId: string,
  email: string,
): Promise<number> {
  const normalized = normalizeEmail(email);
  const result = await pool.query<{ id: number }>(
    `UPDATE product_entitlements
        SET user_id=$1, status='active', updated_at=now()
      WHERE email=$2
        AND user_id IS NULL
        AND status='pending'
        AND expires_at > now()
      RETURNING id`,
    [userId, normalized],
  );
  return result.rowCount || 0;
}

/** Atomically consume one quota unit. Returns null if not entitled. */
export async function consumeEntitlementQuota(
  userId: string,
  entitlementKey: string,
): Promise<{ id: number; quotaUsed: number; quotaTotal: number } | null> {
  const result = await pool.query<{ id: number; quota_used: number; quota_total: number }>(
    `WITH selected AS (
       SELECT id
         FROM product_entitlements
        WHERE user_id = $1
          AND entitlement_key = $2
          AND status = 'active'
          AND expires_at > now()
          AND quota_used < quota_total
        ORDER BY expires_at DESC, id DESC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
     )
     UPDATE product_entitlements AS entitlement
        SET quota_used = entitlement.quota_used + 1, updated_at = now()
       FROM selected
      WHERE entitlement.id = selected.id
      RETURNING entitlement.id, entitlement.quota_used, entitlement.quota_total`,
    [userId, entitlementKey],
  );
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return { id: row.id, quotaUsed: row.quota_used, quotaTotal: row.quota_total };
}

export async function getActiveEntitlement(
  userId: string,
  entitlementKey: string,
): Promise<{
  id: number;
  expiresAt: Date;
  quotaUsed: number;
  quotaTotal: number;
  agentSlug: string;
  status: string;
} | null> {
  const result = await pool.query<{
    id: number;
    expires_at: Date;
    quota_used: number;
    quota_total: number;
    agent_slug: string;
    status: string;
  }>(
    `SELECT id, expires_at, quota_used, quota_total, agent_slug, status
       FROM product_entitlements
      WHERE user_id=$1 AND entitlement_key=$2
        AND status='active' AND expires_at > now()
      ORDER BY expires_at DESC
      LIMIT 1`,
    [userId, entitlementKey],
  );
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    expiresAt: row.expires_at,
    quotaUsed: row.quota_used,
    quotaTotal: row.quota_total,
    agentSlug: row.agent_slug,
    status: row.status,
  };
}

// ─── Private headers helper ───────────────────────────────────────────────────
function setPrivateHeaders(res: Response): void {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Pragma", "no-cache");
}

// ─── Paid multi-file download list ───────────────────────────────────────────
export async function getPaidDownloads(
  productRegistryId: string,
  accessToken: string,
  baseUrl: string,
): Promise<Array<{
  id: number;
  fileName: string;
  label: string;
  role: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
}>> {
  const rows = await pool.query<{
    id: number;
    file_name: string;
    label: string;
    role: string;
    mime_type: string;
    size_bytes: number;
    sort_order: number;
  }>(
    `SELECT id, file_name, label, role, mime_type, size_bytes, sort_order
       FROM digital_product_files
      WHERE product_registry_id=$1
      ORDER BY sort_order ASC`,
    [productRegistryId],
  );
  return rows.rows.map((row) => ({
    id: row.id,
    fileName: row.file_name,
    label: row.label || row.file_name,
    role: row.role,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    downloadUrl: `${baseUrl}/api/store/access/${encodeURIComponent(accessToken)}/download/${row.id}`,
  }));
}

export interface SbuSkkLevel1DiagnosticAccess {
  eligible: true;
  choices: Array<{
    type: SbuSkkLevel1DiagnosticType;
    title: string;
    description: string;
  }>;
  selectedType: SbuSkkLevel1DiagnosticType | null;
  result: SbuSkkLevel1Result | null;
}

const LEVEL1_DIAGNOSTIC_CHOICES: SbuSkkLevel1DiagnosticAccess["choices"] = [
  {
    type: "sbu",
    title: "Cek Kesiapan SBU",
    description: "Nilai kesiapan awal badan usaha, personel, pengalaman, keuangan, dan dokumen.",
  },
  {
    type: "skk",
    title: "Cek Kesiapan SKK",
    description: "Nilai kesiapan awal target jabatan, pengalaman, portofolio, dan persiapan uji.",
  },
];

interface PaidLevelOneOrder {
  id: number;
  status: string;
}

async function getLevelOneOrderByAccessToken(
  accessToken: string,
  executor: {
    query: (text: string, params?: unknown[]) => Promise<{ rows: PaidLevelOneOrder[] }>;
  } = pool,
  lock = false,
): Promise<PaidLevelOneOrder | null> {
  const row = await executor.query(
    `SELECT so.id, so.status
       FROM store_orders so
       JOIN store_products sp ON sp.id=so.product_id
      WHERE so.access_token=$1
        AND sp.scalev_variant_id=$2
      LIMIT 1
      ${lock ? "FOR UPDATE OF so" : ""}`,
    [
      accessToken,
      SBU_SKK_EBOOK.scalev.variantId,
    ],
  );
  return row.rows[0] || null;
}

function mapStoredLevelOneResult(row: {
  diagnostic_type: SbuSkkLevel1DiagnosticType;
  score: number;
  status_key: SbuSkkLevel1Result["statusKey"];
  status_label: string;
  rubric_version: string;
}): SbuSkkLevel1Result {
  return {
    type: row.diagnostic_type,
    score: row.score,
    statusKey: row.status_key,
    statusLabel: row.status_label,
    rubricVersion: row.rubric_version,
  };
}

export async function getLevelOneDiagnosticAccess(
  accessToken: string,
): Promise<SbuSkkLevel1DiagnosticAccess | null> {
  const order = await getLevelOneOrderByAccessToken(accessToken);
  if (!order || String(order.status).toLowerCase() !== "paid") return null;
  const existing = await pool.query<{
    diagnostic_type: SbuSkkLevel1DiagnosticType;
    score: number;
    status_key: SbuSkkLevel1Result["statusKey"];
    status_label: string;
    rubric_version: string;
  }>(
    `SELECT diagnostic_type, score, status_key, status_label, rubric_version
       FROM sbu_skk_level1_diagnostics
      WHERE order_id=$1
      LIMIT 1`,
    [order.id],
  );
  const result = existing.rows[0]
    ? mapStoredLevelOneResult(existing.rows[0])
    : null;
  return {
    eligible: true,
    choices: LEVEL1_DIAGNOSTIC_CHOICES,
    selectedType: result?.type || null,
    result,
  };
}

export type SbuSkkOfferKey = "tutor" | "bundle" | "ai-specialist";

const SBU_SKK_PRODUCT_TO_OFFER = new Map<string, SbuSkkOfferKey>([
  [SBU_SKK_FUNNEL.tutor.registryProductId, "tutor"],
  [SBU_SKK_FUNNEL.bundle.registryProductId, "bundle"],
  [SBU_SKK_FUNNEL.aiSpecialist.registryProductId, "ai-specialist"],
]);

export function getSbuSkkOfferKeyByProductId(
  productRegistryId: string,
): SbuSkkOfferKey | null {
  return SBU_SKK_PRODUCT_TO_OFFER.get(productRegistryId) || null;
}

export interface FulfillSbuSkkOfferInput {
  offerKey: SbuSkkOfferKey;
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp?: string | null;
  amount: number;
  source: "manual" | "scalev";
  providerOrderRef?: string;
  manualOrderRef?: string;
  grantedBy?: string;
  appBaseUrl?: string;
  durationDays?: number;
  quotaTotal?: number;
}

/**
 * Provider-independent, idempotent fulfillment used by both manual admin
 * confirmation and future Scalev variants.
 */
export async function fulfillSbuSkkOffer(
  input: FulfillSbuSkkOfferInput,
): Promise<{ entitlementId: number | null; results: string[] }> {
  const results: string[] = [];
  let entitlementId: number | null = null;
  let durableBundleOrderId: number | null = null;

  if (input.offerKey === "bundle") {
    const storeProduct = await pool.query<{ id: number }>(
      `SELECT DISTINCT sp.id
         FROM digital_product_files dpf
         JOIN store_products sp
           ON sp.download_path = ('db-object:' || dpf.storage_key)
        WHERE dpf.product_registry_id=$1
          AND dpf.role='main'
          AND sp.is_active=true
        LIMIT 1`,
      [SBU_SKK_EBOOK.registryProductId],
    );
    if (!storeProduct.rows[0]) {
      throw new Error("Produk ebook untuk fulfillment bundle tidak ditemukan.");
    }
    const fulfillmentRef = input.providerOrderRef || input.manualOrderRef;
    if (!fulfillmentRef) {
      throw new Error("Referensi order wajib ada untuk fulfillment bundle.");
    }
    const stableOrderRef = input.providerOrderRef
      ? `scalev_${fulfillmentRef}`
      : `bundle_${fulfillmentRef}`;
    const { ensureDigitalDeliveryOrder } = await import(
      "./lib/digital-delivery-outbox"
    );
    const durableOrder = await ensureDigitalDeliveryOrder({
      productId: storeProduct.rows[0].id,
      customerName: input.buyerName,
      customerEmail: normalizeEmail(input.buyerEmail),
      customerPhone: input.buyerWhatsapp || "",
      amount: input.amount,
      midtransOrderId: stableOrderRef,
    });
    durableBundleOrderId = durableOrder.id;
    results.push(
      durableOrder.created
        ? `digital_delivery_created:${durableOrder.id}`
        : `digital_delivery_existing:${durableOrder.id}`,
    );
  }

  if (input.offerKey === "tutor" || input.offerKey === "bundle") {
    const productRegistryId =
      input.offerKey === "bundle"
        ? SBU_SKK_FUNNEL.bundle.registryProductId
        : SBU_SKK_FUNNEL.tutor.registryProductId;
    const granted = await grantEntitlement({
      entitlementKey: SBU_SKK_FUNNEL.tutor.entitlementKey,
      email: input.buyerEmail,
      productRegistryId,
      agentSlug: SBU_SKK_FUNNEL.tutor.agentSlug,
      durationDays: input.durationDays ?? SBU_SKK_FUNNEL.tutor.durationDays,
      quotaTotal: input.quotaTotal ?? SBU_SKK_FUNNEL.tutor.quotaTotal,
      source: input.source,
      providerOrderRef: input.providerOrderRef,
      manualOrderRef: input.manualOrderRef,
      grantedBy: input.grantedBy,
    });
    entitlementId = granted.id;
    results.push(
      granted.isNew
        ? `entitlement_granted:${granted.id}`
        : `entitlement_existing:${granted.id}`,
    );
  }

  if (durableBundleOrderId) {
    const { processDigitalDeliveryOrder } = await import(
      "./lib/digital-delivery-outbox"
    );
    const delivery = await processDigitalDeliveryOrder(
      durableBundleOrderId,
      input.appBaseUrl,
    );
    if (delivery.deliveryStatus === "failed") {
      throw new Error(
        `Pengiriman ebook bundle gagal: ${delivery.error || "delivery_failed"}`,
      );
    }
    results.push(
      delivery.claimed
        ? `digital_delivery_processed:${durableBundleOrderId}`
        : `digital_delivery_${delivery.deliveryStatus}:${durableBundleOrderId}`,
    );
  }

  if (input.offerKey === "ai-specialist") {
    const agent = await pool.query<{ id: number }>(
      `SELECT id FROM agents WHERE slug=$1 LIMIT 1`,
      [SBU_SKK_FUNNEL.aiSpecialist.agentSlug],
    );
    if (!agent.rows[0]) {
      throw new Error("Master AI Specialist SBU-SKK tidak ditemukan.");
    }
    await storage.addPendingPremiumDelivery({
      masterAgentId: agent.rows[0].id,
      email: normalizeEmail(input.buyerEmail),
      source: input.source === "scalev" ? "scalev" : "manual_sbu_skk",
    });
    results.push(`pending_premium_delivery:${agent.rows[0].id}`);
  }

  return { entitlementId, results };
}

// ─── Route registration ────────────────────────────────────────────────────────
export function registerSbuSkkFunnelRoutes(app: Express): void {
  app.post(
    "/api/store/access/:token/level-one-diagnostic",
    async (req: Request, res: Response) => {
      setPrivateHeaders(res);
      const parsed = z.object({
        type: z.enum(["sbu", "skk"]),
        answers: z.record(z.string()).refine(
          (answers) =>
            Object.keys(answers).length <= 12
            && Object.values(answers).every((value) => value.length <= 40),
          "Jawaban assessment tidak valid.",
        ),
      }).strict().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Jawaban assessment tidak valid." });
      }

      const token = String(req.params.token || "");
      if (token.length < 20 || token.length > 128) {
        return res.status(400).json({ error: "Access token tidak valid." });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const order = await getLevelOneOrderByAccessToken(token, client, true);
        if (!order) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: "Paket Level 1 tidak ditemukan." });
        }
        if (String(order.status).toLowerCase() !== "paid") {
          await client.query("ROLLBACK");
          return res.status(403).json({ error: "Pembayaran belum dikonfirmasi." });
        }

        const existing = await client.query<{
          diagnostic_type: SbuSkkLevel1DiagnosticType;
          score: number;
          status_key: SbuSkkLevel1Result["statusKey"];
          status_label: string;
          rubric_version: string;
        }>(
          `SELECT diagnostic_type, score, status_key, status_label, rubric_version
             FROM sbu_skk_level1_diagnostics
            WHERE order_id=$1
            LIMIT 1`,
          [order.id],
        );
        if (existing.rows[0]) {
          await client.query("COMMIT");
          const result = mapStoredLevelOneResult(existing.rows[0]);
          if (result.type !== parsed.data.type) {
            return res.status(409).json({
              error: `Pilihan ${result.type.toUpperCase()} sudah dikunci untuk pesanan ini.`,
              result,
            });
          }
          return res.json({ result, alreadyCompleted: true });
        }

        let assessed: SbuSkkLevel1Result;
        try {
          assessed = assessSbuSkkLevel1(
            parsed.data.type,
            parsed.data.answers,
          );
        } catch (error) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: error instanceof Error
              ? error.message
              : "Jawaban assessment tidak valid.",
          });
        }

        await client.query(
          `INSERT INTO sbu_skk_level1_diagnostics (
             order_id, diagnostic_type, score, status_key, status_label,
             rubric_version, updated_at
           ) VALUES ($1,$2,$3,$4,$5,$6,now())`,
          [
            order.id,
            assessed.type,
            assessed.score,
            assessed.statusKey,
            assessed.statusLabel,
            assessed.rubricVersion,
          ],
        );
        await client.query("COMMIT");
        return res.status(201).json({ result: assessed, alreadyCompleted: false });
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        console.error(
          "[SBU-SKK Level 1] Diagnostic failed:",
          (error as Error).message,
        );
        return res.status(500).json({ error: "Diagnosis belum dapat diproses." });
      } finally {
        client.release();
      }
    },
  );

  // ── POST /api/sbu-skk/readiness/events ───────────────────────────────────
  // Anonymous aggregate measurement only. The readiness answers never leave
  // the browser and any extra field is rejected by the strict schema.
  app.post(SBU_READINESS_EVENT_PATH, async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (res.locals.sbuReadinessIngressChecked !== true) {
      return res.status(503).json({ error: "Pengukuran belum dikonfigurasi." });
    }

    const parsed = readinessEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Event assessment tidak valid." });
    }

    try {
      await recordSbuReadinessAggregateEvent(parsed.data);
      return res.status(204).end();
    } catch (error) {
      console.error(
        "[SBU Readiness] Aggregate event failed:",
        (error as Error).message,
      );
      return res.status(503).json({ error: "Pengukuran sementara tidak tersedia." });
    }
  });

  // ── POST /api/sbu-skk/lead ────────────────────────────────────────────────
  app.post("/api/sbu-skk/lead", async (req: Request, res: Response) => {
    const ip = getTrustedClientIp(req);
    try {
      if (!(await checkLeadRate(ip))) {
        return res.status(429).json({ error: "Terlalu banyak permintaan. Coba lagi dalam 1 menit." });
      }
    } catch (error) {
      console.error("[SBU-SKK Lead] Rate limiter unavailable:", (error as Error).message);
      return res.status(503).json({ error: "Layanan sedang sibuk. Coba beberapa saat lagi." });
    }

    const { name, email, whatsapp, whatsappConsent, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, referrer, landingPath } = req.body || {};

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Nama wajib diisi (minimal 2 karakter)." });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Email tidak valid." });
    }
    if (whatsapp && !WA_RE.test(whatsapp)) {
      return res.status(400).json({ error: "Nomor WhatsApp tidak valid." });
    }
    if (whatsapp && !whatsappConsent) {
      return res.status(400).json({ error: "Persetujuan WhatsApp diperlukan jika mengisi nomor WA." });
    }

    const normalEmail = normalizeEmail(email);
    const normalWa = normalizeWhatsapp(whatsapp);
    const assetSlug = SBU_SKK_FUNNEL.miniEbook.assetSlug;
    const accessDays = SBU_SKK_FUNNEL.miniEbook.accessDays;
    try {
      // Check if asset exists
      const assetCheck = await pool.query<{ id: number }>(
        `SELECT id FROM lead_assets WHERE asset_slug=$1 LIMIT 1`,
        [assetSlug],
      );
      if (!assetCheck.rows[0]) {
        return res.status(503).json({ error: "Aset lead belum tersedia. Coba beberapa saat lagi." });
      }

      const { token, expiresAt: effectiveExpiresAt } =
        await getOrCreateLeadSubmission({
          assetSlug,
          name,
          email: normalEmail,
          whatsapp: normalWa || undefined,
          whatsappConsent: !!whatsappConsent,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm,
          referrer,
          landingPath,
          accessDays,
        });

      const baseUrl = publicBaseUrl(req);
      const accessPath = `/mini-ebook-sbu-skk/access/${token}`;
      const accessUrl = `${baseUrl}${accessPath}`;
      const safeName = escapeHtml(name.trim());

      // Send transactional email (fire-and-forget)
      sendEmail({
        to: normalEmail,
        toName: name.trim(),
        subject: "Mini Ebook SBU-SKK Anda Siap Dibaca",
        htmlContent: `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;padding:20px">
<h2>Halo ${safeName},</h2>
<p>Mini ebook <strong>${SBU_SKK_FUNNEL.miniEbook.title}</strong> Anda sudah siap.</p>
<p><a href="${accessUrl}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Akses Mini Ebook</a></p>
<p style="font-size:12px;color:#666">Link aktif selama ${accessDays} hari sejak email ini dikirim.</p>
<p style="font-size:12px;color:#666">Ingin bimbingan lebih lengkap? <a href="${baseUrl}/ebook-sbu-skk">Lihat Ebook Lengkap + Toolkit</a></p>
</body></html>`,
        textContent: `Halo ${name.trim()},\n\nMini ebook Anda siap:\n${accessUrl}\n\nLink aktif ${accessDays} hari.\n\n— Gustafta`,
        tags: ["lead-magnet", "sbu-skk-mini-ebook"],
      }).then((result) => {
        if (result.sent) {
          pool.query(
            `UPDATE lead_submissions SET email_sent=true, email_sent_at=now() WHERE access_token=$1`,
            [token],
          ).catch(() => {});
        }
      }).catch(() => {});

      return res.json({
        success: true,
        message: "Mini ebook Anda sudah dikirim ke email.",
        accessUrl: accessPath,
        deliverySent: false,
        expiresAt: effectiveExpiresAt.toISOString(),
      });
    } catch (err: any) {
      console.error("[SBU-SKK Lead] Error:", err?.message);
      return res.status(500).json({ error: "Gagal memproses permintaan." });
    }
  });

  // ── GET /api/sbu-skk/lead/access/:token ──────────────────────────────────
  app.get("/api/sbu-skk/lead/access/:token", async (req: Request, res: Response) => {
    const { token } = req.params;
    if (!token || token.length < 20) {
      return res.status(400).json({ error: "Token tidak valid." });
    }
    try {
      const row = await pool.query<{
        id: number;
        name: string;
        email: string;
        asset_slug: string;
        expires_at: Date;
      }>(
        `SELECT id, name, email, asset_slug, expires_at
           FROM lead_submissions
          WHERE access_token=$1 LIMIT 1`,
        [token],
      );
      if (!row.rows[0]) return res.status(404).json({ error: "Token tidak ditemukan." });
      const sub = row.rows[0];
      if (new Date(sub.expires_at) < new Date()) {
        return res.status(403).json({ error: "Token sudah kedaluwarsa." });
      }
      const asset = await pool.query<{ title: string; pages: number; size_bytes: number }>(
        `SELECT title, pages, size_bytes FROM lead_assets WHERE asset_slug=$1 LIMIT 1`,
        [sub.asset_slug],
      );
      const assetInfo = asset.rows[0];
      return res.json({
        valid: true,
        name: sub.name,
        expiresAt: sub.expires_at,
        asset: assetInfo
          ? { slug: sub.asset_slug, title: assetInfo.title, pages: assetInfo.pages, sizeBytes: assetInfo.size_bytes }
          : null,
        downloadUrl: `/api/sbu-skk/lead/access/${token}/download`,
      });
    } catch (err: any) {
      console.error("[SBU-SKK Lead Access] Error:", err?.message);
      return res.status(500).json({ error: "Gagal memeriksa token." });
    }
  });

  // ── GET /api/sbu-skk/lead/access/:token/download ─────────────────────────
  app.get("/api/sbu-skk/lead/access/:token/download", async (req: Request, res: Response) => {
    const { token } = req.params;
    if (!token || token.length < 20) {
      return res.status(400).json({ error: "Token tidak valid." });
    }
    try {
      const row = await pool.query<{ asset_slug: string; expires_at: Date }>(
        `SELECT asset_slug, expires_at FROM lead_submissions WHERE access_token=$1 LIMIT 1`,
        [token],
      );
      if (!row.rows[0]) return res.status(404).json({ error: "Token tidak ditemukan." });
      if (new Date(row.rows[0].expires_at) < new Date()) {
        return res.status(403).json({ error: "Token sudah kedaluwarsa." });
      }
      const asset = await pool.query<{
        title: string;
        mime_type: string;
        size_bytes: number;
        content: Buffer;
      }>(
        `SELECT title, mime_type, size_bytes, content
           FROM lead_assets WHERE asset_slug=$1 LIMIT 1`,
        [row.rows[0].asset_slug],
      );
      if (!asset.rows[0]) return res.status(404).json({ error: "Aset tidak tersedia." });
      const a = asset.rows[0];
      const buf = Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content);
      const safeName = a.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") + ".pdf";
      setPrivateHeaders(res);
      res.setHeader("Content-Type", a.mime_type);
      res.setHeader("Content-Length", String(buf.length));
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
      );
      return res.send(buf);
    } catch (err: any) {
      console.error("[SBU-SKK Lead Download] Error:", err?.message);
      return res.status(500).json({ error: "Gagal mengunduh file." });
    }
  });

  // ── GET /api/sbu-skk/tutor/status (authenticated) ─────────────────────────
  app.get("/api/sbu-skk/tutor/status", isAuthenticated, async (req: Request, res: Response) => {
    const userId = getSessionUserId(req);
    if (!userId) return res.status(401).json({ error: "Identitas sesi tidak ditemukan." });

    try {
      // Auto-claim pending entitlements for this user's email
      const email = await getSessionEmail(req, userId);
      if (email) {
        await claimPendingEntitlements(userId, email);
      }

      const entKey = SBU_SKK_FUNNEL.tutor.entitlementKey;
      const ent = await getActiveEntitlement(userId, entKey);

      // Look up tutor agent id
      const agentRow = await pool.query<{ id: number }>(
        `SELECT id FROM agents WHERE slug=$1 LIMIT 1`,
        [SBU_SKK_FUNNEL.tutor.agentSlug],
      );

      return res.json({
        entitled: !!ent,
        status: ent?.status ?? "none",
        expiresAt: ent?.expiresAt ?? null,
        quotaUsed: ent?.quotaUsed ?? 0,
        quotaTotal: ent?.quotaTotal ?? 0,
        agentId: agentRow.rows[0]?.id ?? null,
      });
    } catch (err: any) {
      console.error("[SBU-SKK Tutor Status] Error:", err?.message);
      return res.status(500).json({ error: "Gagal memeriksa status entitlement." });
    }
  });

  // ── POST /api/sbu-skk/orders ──────────────────────────────────────────────
  // Creates a pending manual order (no Scalev variant for Tutor/Bundle/AI Specialist).
  // Prices come ONLY from SBU_SKK_FUNNEL canonical metadata.
  app.post("/api/sbu-skk/orders", async (req: Request, res: Response) => {
    const { offerKey, buyer } = req.body || {};
    const buyerName = buyer?.name;
    const buyerEmail = buyer?.email;
    const buyerWhatsapp = buyer?.phone;
    const buyerWhatsappConsent = buyer?.whatsappConsent === true;

    // Map offerKey to canonical product info (server-side, not client-supplied)
    const OFFER_MAP: Record<string, { productId: string; amount: number; title: string }> = {
      tutor: {
        productId: SBU_SKK_FUNNEL.tutor.registryProductId,
        amount: SBU_SKK_FUNNEL.tutor.addOnAmount,
        title: SBU_SKK_FUNNEL.tutor.title,
      },
      bundle: {
        productId: SBU_SKK_FUNNEL.bundle.registryProductId,
        amount: SBU_SKK_FUNNEL.bundle.amount,
        title: SBU_SKK_FUNNEL.bundle.title,
      },
      "ai-specialist": {
        productId: SBU_SKK_FUNNEL.aiSpecialist.registryProductId,
        amount: SBU_SKK_FUNNEL.aiSpecialist.licenseAmount,
        title: SBU_SKK_FUNNEL.aiSpecialist.title,
      },
    };

    if (!offerKey || !OFFER_MAP[offerKey]) {
      return res.status(400).json({
        error: "offerKey tidak valid. Gunakan: tutor | bundle | ai-specialist",
      });
    }
    if (!buyerName || typeof buyerName !== "string" || buyerName.trim().length < 2) {
      return res.status(400).json({ error: "buyerName wajib diisi (min 2 karakter)." });
    }
    if (!buyerEmail || !EMAIL_RE.test(buyerEmail)) {
      return res.status(400).json({ error: "Email pembeli tidak valid." });
    }
    if (buyerWhatsapp && !WA_RE.test(buyerWhatsapp)) {
      return res.status(400).json({ error: "Nomor WhatsApp pembeli tidak valid." });
    }
    if (buyerWhatsapp && !buyerWhatsappConsent) {
      return res.status(400).json({
        error: "Persetujuan WhatsApp diperlukan jika mengisi nomor WhatsApp.",
      });
    }

    const offer = OFFER_MAP[offerKey];
    const orderRef = `SBU-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const wa = getWaContact().primary;

    try {
      await pool.query(
        `INSERT INTO sbu_skk_orders (
           offer_key, product_id, amount, buyer_name, buyer_email,
           buyer_whatsapp, whatsapp_consent, order_ref
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          offerKey,
          offer.productId,
          offer.amount,
          buyerName.trim(),
          normalizeEmail(buyerEmail),
          buyerWhatsapp ? normalizeWhatsapp(buyerWhatsapp) : null,
          !!buyerWhatsapp && buyerWhatsappConsent,
          orderRef,
        ],
      );

      const lines = [
        `Halo Gustafta, saya ingin memesan:`,
        `• ${offer.title}`,
        `• Order Ref: ${orderRef}`,
        `• Harga: Rp ${offer.amount.toLocaleString("id-ID")}`,
        `Nama: ${buyerName.trim()}`,
        `Email: ${buyerEmail.trim()}`,
        `Mohon info cara pembayarannya.`,
      ];
      const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent(lines.join("\n"))}`;

      return res.status(201).json({
        orderRef,
        offerKey,
        productId: offer.productId,
        itemName: offer.title,
        amount: offer.amount,
        status: "pending",
        paymentMode: "MANUAL_WA",
        waOrderUrl: waUrl,
        note: "Produk ini belum memiliki variant Scalev — pembayaran diproses manual admin via WA. Order tercatat dengan order_ref.",
      });
    } catch (err: any) {
      console.error("[SBU-SKK Orders] Error:", err?.message);
      return res.status(500).json({ error: "Gagal membuat order." });
    }
  });

  // ── POST /api/sbu-skk/admin/orders/:id/confirm ───────────────────────────
  // Admin-only: confirm a pending sbu_skk_order and grant entitlement / digital delivery.
  app.post("/api/sbu-skk/admin/orders/:id/confirm", isAuthenticated, async (req: Request, res: Response) => {
    const adminId = getSessionUserId(req);
    if (!adminId) return res.status(401).json({ error: "Identitas sesi tidak ditemukan." });
    const orderId = parseInt(String(req.params.id), 10);
    if (!orderId || isNaN(orderId)) return res.status(400).json({ error: "ID order tidak valid." });
    let processingStartedAt: Date | null = null;

    const { evidence } = req.body || {};
    if (typeof evidence !== "string" || evidence.trim().length < 3) {
      return res.status(400).json({ error: "Bukti konfirmasi pembayaran wajib diisi." });
    }

    try {
      const adminRow = await pool.query<{ role: string }>(
        `SELECT role FROM users WHERE id=$1 LIMIT 1`,
        [adminId],
      );
      if (!adminRow.rows[0] || !["admin", "superadmin"].includes(adminRow.rows[0].role)) {
        return res.status(403).json({ error: "Akses admin diperlukan." });
      }

      const orderRow = await pool.query<{
        id: number;
        offer_key: string;
        product_id: string;
        amount: number;
        buyer_email: string;
        buyer_name: string;
        buyer_whatsapp: string | null;
        order_ref: string;
        status: string;
        entitlement_id: number | null;
        updated_at: Date;
      }>(
        `UPDATE sbu_skk_orders
            SET status='processing',
                confirmed_by=$2,
                confirm_evidence=$3,
                fulfillment_error='',
                updated_at=date_trunc('milliseconds', clock_timestamp())
          WHERE id=$1
            AND (
              status IN ('pending', 'fulfillment_failed')
              OR (
                status='processing'
                AND updated_at < now() - ($4 * interval '1 minute')
              )
            )
        RETURNING id, offer_key, product_id, amount, buyer_email, buyer_name,
                  buyer_whatsapp, order_ref, status, entitlement_id, updated_at`,
        [
          orderId,
          adminId,
          evidence.trim(),
          MANUAL_ORDER_PROCESSING_LEASE_MINUTES,
        ],
      );
      let order = orderRow.rows[0];
      if (!order) {
        const existing = await pool.query<{ id: number; status: string }>(
          `SELECT id, status FROM sbu_skk_orders WHERE id=$1 LIMIT 1`,
          [orderId],
        );
        if (!existing.rows[0]) return res.status(404).json({ error: "Order tidak ditemukan." });
        if (existing.rows[0].status === "confirmed") {
          return res.json({ success: true, alreadyConfirmed: true, orderId });
        }
        return res.status(409).json({
          error: "Order sedang diproses oleh admin lain.",
          status: existing.rows[0].status,
        });
      }
      processingStartedAt = order.updated_at;

      const { entitlementId, results } = await fulfillSbuSkkOffer({
        offerKey: order.offer_key as SbuSkkOfferKey,
        buyerName: order.buyer_name,
        buyerEmail: order.buyer_email,
        buyerWhatsapp: order.buyer_whatsapp,
        amount: order.amount,
        source: "manual",
        manualOrderRef: order.order_ref,
        grantedBy: adminId,
      });

      // Mark order confirmed
      const finalized = await pool.query(
        `UPDATE sbu_skk_orders SET
           status='confirmed', confirmed_by=$1, confirmed_at=now(),
           confirm_evidence=$2, entitlement_id=$3, fulfillment_error='', updated_at=now()
         WHERE id=$4 AND status='processing' AND updated_at=$5
         RETURNING id`,
        [adminId, evidence.trim(), entitlementId, orderId, processingStartedAt],
      );
      if (finalized.rowCount !== 1) {
        return res.status(409).json({
          error: "Claim pemrosesan order sudah diambil ulang. Periksa status order sebelum mencoba lagi.",
          status: "processing",
        });
      }

      return res.json({ success: true, orderId, results });
    } catch (err: any) {
      console.error("[SBU-SKK Admin Confirm] Error:", err?.message);
      if (processingStartedAt) {
        await pool.query(
          `UPDATE sbu_skk_orders
              SET status='fulfillment_failed',
                  fulfillment_error=$1,
                  updated_at=now()
            WHERE id=$2 AND status='processing' AND updated_at=$3`,
          [
            String(err?.message || "Fulfillment gagal").slice(0, 500),
            orderId,
            processingStartedAt,
          ],
        ).catch(() => {});
      }
      return res.status(500).json({ error: "Gagal mengonfirmasi order." });
    }
  });
}

// ─── Tutor stream gate (called from routes.ts before stream begins) ────────────
export async function checkTutorEntitlement(req: Request): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  const auth = await authenticateRequest(req);
  if (!auth.ok) {
    return {
      ok: false,
      status: auth.status,
      error:
        auth.status === 401
          ? "Login diperlukan untuk Tutor AI SBU-SKK."
          : auth.message,
    };
  }
  const userId = auth.userId || getSessionUserId(req);

  const email = await getSessionEmail(req, userId);
  if (email) {
    await claimPendingEntitlements(userId, email);
  }

  const ent = await getActiveEntitlement(userId, SBU_SKK_FUNNEL.tutor.entitlementKey);
  if (!ent) {
    return { ok: false, status: 403, error: "Entitlement Tutor AI SBU-SKK tidak aktif atau sudah kedaluwarsa." };
  }
  if (ent.quotaUsed >= ent.quotaTotal) {
    return { ok: false, status: 429, error: `Kuota Tutor AI habis (${ent.quotaUsed}/${ent.quotaTotal} pesan). Entitlement baru diperlukan.` };
  }

  return { ok: true, userId };
}

export async function consumeTutorMessageQuota(
  userId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const consumed = await consumeEntitlementQuota(
    userId,
    SBU_SKK_FUNNEL.tutor.entitlementKey,
  );
  if (!consumed) {
    return { ok: false, status: 429, error: "Kuota Tutor AI habis atau entitlement tidak aktif." };
  }
  return { ok: true };
}

// ─── Tutor source injection for prompts ─────────────────────────────────────
export async function buildTutorSourceContext(query: string): Promise<{
  context: string;
  citations: Array<{ source: string; page: number }>;
}> {
  try {
    const chunks = await retrieveTutorSources(query, 5);
    if (chunks.length === 0) {
      return {
        context:
          "[TIDAK ADA KUTIPAN SUMBER YANG COCOK]\nJawab bahwa topik tidak ditemukan dalam materi yang tersedia dan arahkan pengguna untuk memeriksa sumber atau otoritas resmi. Jangan menebak.",
        citations: [],
      };
    }
    const context = chunks
      .map(
        (c) =>
          `[SUMBER: ${c.source_title}, Halaman ${c.page_number}]\n${c.content}`,
      )
      .join("\n\n---\n\n");
    const citations = chunks.map((c) => ({
      source: c.source_title,
      page: c.page_number,
    }));
    return { context, citations };
  } catch (error) {
    console.error("[SBU-SKK Tutor] Source retrieval failed:", (error as Error).message);
    throw error;
  }
}

// ─── Extend GET /api/store/access/:token to return downloads array ────────────
// Called from routes.ts (additive, injects `downloads` into the digital product response)
export async function augmentStoreAccessResponse(
  productRegistryId: string,
  accessToken: string,
  baseUrl: string,
): Promise<{
  downloads: Awaited<ReturnType<typeof getPaidDownloads>>;
  levelOneDiagnostic: SbuSkkLevel1DiagnosticAccess | null;
}> {
  const downloads = await getPaidDownloads(
    productRegistryId,
    accessToken,
    baseUrl,
  );
  const levelOneDiagnostic =
    productRegistryId === SBU_SKK_EBOOK.registryProductId
      ? await getLevelOneDiagnosticAccess(accessToken)
      : null;
  return { downloads, levelOneDiagnostic };
}
