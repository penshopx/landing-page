import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pool } from "../db";
import { fetchGoogleNews, type NewsItem } from "./research-feed";
import {
  generateMarketNeedsReport,
  loadEligibleProducts,
  type EligibleProduct,
  type StoredMarketNeedsReport,
} from "./market-needs-report";

const MAX_ACTIVE_REQUESTS = 5;
const LEASE_MINUTES = 15;
const WORKER_INTERVAL_MS = 15_000;
const WORKER_LEADER_KEY = "market_research_worker_leader";
const WORKER_LEADER_TTL_SECONDS = 45;
const WORKER_INSTANCE_ID = randomUUID();

export const researchRequestInputSchema = z.object({
  topic: z.string().trim().min(3, "Topik minimal 3 karakter").max(240),
  productId: z.string().trim().max(160).nullable().optional(),
  objective: z.string().trim().min(10, "Tujuan riset minimal 10 karakter").max(1600),
  targetSegment: z.string().trim().max(300).default(""),
  marketScope: z.string().trim().min(2).max(160).default("Indonesia"),
});

export type ResearchRequestInput = z.infer<typeof researchRequestInputSchema>;
export type ResearchRequestStatus = "queued" | "running" | "completed" | "failed";

export interface StoredResearchRequest {
  id: number;
  requestedBy: string;
  topic: string;
  productId: string | null;
  productName: string | null;
  objective: string;
  targetSegment: string;
  marketScope: string;
  status: ResearchRequestStatus;
  attemptCount: number;
  retryOfId: number | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  report: StoredMarketNeedsReport | null;
}

interface ClaimedResearchRequest extends StoredResearchRequest {
  leaseToken: string;
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  const parsed = new Date(value as string | number | Date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function mapReportFromRow(row: any): StoredMarketNeedsReport | null {
  if (row.reportId == null) return null;
  return {
    id: Number(row.reportId),
    reportDate: String(row.reportDate),
    generatedBy: "request",
    reportKind: "requested",
    researchRequestId: Number(row.id),
    sourceCount: Number(row.reportSourceCount) || 0,
    internalSignalWindowDays: row.reportSignalWindowDays == null
      ? 0
      : Number(row.reportSignalWindowDays),
    payload: row.reportPayload,
    createdAt: toIso(row.reportCreatedAt) || new Date(0).toISOString(),
    updatedAt: toIso(row.reportUpdatedAt) || new Date(0).toISOString(),
  };
}

function mapRequestRow(row: any): StoredResearchRequest {
  const status: ResearchRequestStatus = ["queued", "running", "completed", "failed"].includes(row.status)
    ? row.status
    : "failed";
  return {
    id: Number(row.id),
    requestedBy: String(row.requestedBy || ""),
    topic: String(row.topic || ""),
    productId: row.productId == null ? null : String(row.productId),
    productName: row.productName == null ? null : String(row.productName),
    objective: String(row.objective || ""),
    targetSegment: String(row.targetSegment || ""),
    marketScope: String(row.marketScope || "Indonesia"),
    status,
    attemptCount: Number(row.attemptCount) || 0,
    retryOfId: row.retryOfId == null ? null : Number(row.retryOfId),
    lastError: row.lastError == null ? null : String(row.lastError),
    createdAt: toIso(row.createdAt) || new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) || new Date(0).toISOString(),
    startedAt: toIso(row.startedAt),
    completedAt: toIso(row.completedAt),
    report: mapReportFromRow(row),
  };
}

export function buildResearchQueries(input: ResearchRequestInput, productName: string | null): string[] {
  const base = [productName || input.topic, input.targetSegment, input.marketScope]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 260);
  return Array.from(new Set([
    base,
    `${input.topic} tren pasar ${input.marketScope}`.trim(),
    `${input.topic} kebutuhan masalah pelanggan ${input.targetSegment}`.trim(),
    `${productName || input.topic} solusi alternatif kompetitor ${input.marketScope}`.trim(),
  ].map((query) => query.replace(/\s+/g, " ").slice(0, 300)).filter((query) => query.length >= 3)));
}

function formatRequestedResearchDocument(
  request: Pick<StoredResearchRequest, "topic" | "objective" | "targetSegment" | "marketScope">,
  groups: Array<{ query: string; items: NewsItem[] }>,
): string {
  const lines = [
    `FEED RISET KHUSUS — ${request.topic}`,
    `Tujuan: ${request.objective}`,
    `Segmen: ${request.targetSegment || "Belum ditentukan"}`,
    `Cakupan: ${request.marketScope}`,
    "Sumber: Google News RSS (agregasi berita publik). Bukan pemantauan media sosial real-time.",
    "",
  ];
  for (const group of groups) {
    lines.push(`## Topik: ${group.query}`);
    if (group.items.length === 0) {
      lines.push("(tidak ada hasil)", "");
      continue;
    }
    group.items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.title}`);
      const source = [item.source, item.pubDate].filter(Boolean).join(" | ");
      if (source) lines.push(`   Sumber: ${source}`);
      if (item.snippet) lines.push(`   Ringkas: ${item.snippet}`);
      if (item.link) lines.push(`   Tautan: ${item.link}`);
    });
    lines.push("");
  }
  return lines.join("\n");
}

async function fetchRequestedResearchDocument(
  request: StoredResearchRequest,
): Promise<string> {
  const parsed = researchRequestInputSchema.parse({
    topic: request.topic,
    productId: request.productId,
    objective: request.objective,
    targetSegment: request.targetSegment,
    marketScope: request.marketScope,
  });
  const queries = buildResearchQueries(parsed, request.productName);
  const settled = await Promise.allSettled(
    queries.map(async (query) => ({
      query,
      items: await fetchGoogleNews(query, { hl: "id", gl: "ID", limit: 6 }),
    })),
  );
  const groups = settled
    .filter((result): result is PromiseFulfilledResult<{ query: string; items: NewsItem[] }> =>
      result.status === "fulfilled")
    .map((result) => result.value);
  return formatRequestedResearchDocument(request, groups);
}

export async function listResearchProducts(): Promise<EligibleProduct[]> {
  return loadEligibleProducts();
}

export async function createResearchRequest(
  rawInput: ResearchRequestInput,
  requestedBy: string,
  retryOfId: number | null = null,
): Promise<StoredResearchRequest> {
  const input = researchRequestInputSchema.parse(rawInput);
  const products = await loadEligibleProducts();
  const product = input.productId
    ? products.find((candidate) => candidate.id === input.productId) || null
    : null;
  if (input.productId && !product) {
    throw Object.assign(new Error("Produk tidak aktif atau tidak ditemukan di katalog resmi."), { code: "PRODUCT_NOT_ELIGIBLE" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('market-research-request-queue'))");
    const active = await client.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM market_research_requests
       WHERE status IN ('queued', 'running')`,
    );
    if (Number(active.rows[0]?.count) >= MAX_ACTIVE_REQUESTS) {
      throw Object.assign(new Error("Antrean riset sedang penuh. Tunggu salah satu permintaan selesai."), { code: "QUEUE_FULL" });
    }
    const inserted = await client.query(
      `INSERT INTO market_research_requests (
         requested_by, topic, product_id, product_name, objective,
         target_segment, market_scope, retry_of_id, status, created_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'queued',NOW(),NOW())
       RETURNING
         id, requested_by AS "requestedBy", topic, product_id AS "productId",
         product_name AS "productName", objective, target_segment AS "targetSegment",
         market_scope AS "marketScope", status, attempt_count AS "attemptCount",
         retry_of_id AS "retryOfId", last_error AS "lastError",
         created_at AS "createdAt", updated_at AS "updatedAt",
         started_at AS "startedAt", completed_at AS "completedAt"`,
      [
        requestedBy,
        input.topic,
        product?.id || null,
        product?.name || null,
        input.objective,
        input.targetSegment,
        input.marketScope,
        retryOfId,
      ],
    );
    await client.query("COMMIT");
    return mapRequestRow(inserted.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function retryResearchRequest(id: number, requestedBy: string): Promise<StoredResearchRequest> {
  const original = await pool.query(
    `SELECT
       id, topic, product_id AS "productId", objective,
       target_segment AS "targetSegment", market_scope AS "marketScope", status
     FROM market_research_requests
     WHERE id = $1`,
    [id],
  );
  const row = original.rows[0];
  if (!row) throw Object.assign(new Error("Permintaan riset tidak ditemukan."), { code: "NOT_FOUND" });
  if (row.status === "queued" || row.status === "running") {
    throw Object.assign(new Error("Permintaan ini masih berada dalam antrean."), { code: "ALREADY_ACTIVE" });
  }
  return createResearchRequest({
    topic: row.topic,
    productId: row.productId,
    objective: row.objective,
    targetSegment: row.targetSegment,
    marketScope: row.marketScope,
  }, requestedBy, id);
}

export async function listResearchRequests(limit = 50): Promise<StoredResearchRequest[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.round(limit)));
  const result = await pool.query(
    `SELECT
       r.id, r.requested_by AS "requestedBy", r.topic, r.product_id AS "productId",
       r.product_name AS "productName", r.objective, r.target_segment AS "targetSegment",
       r.market_scope AS "marketScope", r.status, r.attempt_count AS "attemptCount",
       r.retry_of_id AS "retryOfId", r.last_error AS "lastError",
       r.created_at AS "createdAt", r.updated_at AS "updatedAt",
       r.started_at AS "startedAt", r.completed_at AS "completedAt",
       report.id AS "reportId", report.report_date::text AS "reportDate",
       report.source_count AS "reportSourceCount",
       report.internal_signal_window_days AS "reportSignalWindowDays",
       report.payload AS "reportPayload", report.created_at AS "reportCreatedAt",
       report.updated_at AS "reportUpdatedAt"
     FROM market_research_requests r
     LEFT JOIN LATERAL (
       SELECT mr.*
       FROM market_needs_reports mr
       WHERE mr.research_request_id = r.id AND mr.report_kind = 'requested'
       ORDER BY mr.created_at DESC, mr.id DESC
       LIMIT 1
     ) report ON TRUE
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT $1`,
    [safeLimit],
  );
  return result.rows.map(mapRequestRow);
}

function publicFailureReason(reason: string): string {
  if (reason === "no-openai-key") return "Layanan AI belum dikonfigurasi.";
  if (reason === "no-research-sources") return "Sumber publik yang relevan belum ditemukan.";
  if (reason === "requested-product-not-eligible") return "Produk sudah tidak aktif di katalog resmi.";
  if (reason === "requested-product-not-evaluated") {
    return "Hasil belum mengevaluasi produk yang dipilih secara eksplisit. Silakan proses ulang.";
  }
  if (reason.startsWith("invalid-model-output") || reason.includes("JSON")) {
    return "Format hasil riset belum valid. Silakan proses ulang.";
  }
  return "Riset gagal diproses. Silakan coba lagi.";
}

async function reconcileCompletedRequests(): Promise<void> {
  await pool.query(
    `UPDATE market_research_requests r
     SET status = 'completed',
         completed_at = COALESCE(
           r.completed_at,
           (
             SELECT mr.created_at
             FROM market_needs_reports mr
             WHERE mr.research_request_id = r.id AND mr.report_kind = 'requested'
             ORDER BY mr.created_at DESC, mr.id DESC
             LIMIT 1
           )
         ),
         lease_token = NULL,
         lease_expires_at = NULL,
         last_error = NULL,
         updated_at = NOW()
     WHERE r.status IN ('queued', 'running', 'failed')
       AND EXISTS (
       SELECT 1
       FROM market_needs_reports mr
       WHERE mr.research_request_id = r.id AND mr.report_kind = 'requested'
     )`,
  );
}

async function claimNextResearchRequest(): Promise<ClaimedResearchRequest | null> {
  const leaseToken = randomUUID();
  const result = await pool.query(
    `WITH worker_leader AS (
       SELECT 1
       FROM system_config
       WHERE key = $3
         AND value = $4
         AND updated_at > NOW() - ($5::text || ' seconds')::interval
     ),
     candidate AS (
       SELECT id
       FROM market_research_requests
       WHERE (
         status = 'queued'
         OR (status = 'running' AND lease_expires_at < NOW())
       )
         AND EXISTS (SELECT 1 FROM worker_leader)
         AND NOT EXISTS (
           SELECT 1
           FROM market_research_requests active
           WHERE active.status = 'running'
             AND active.lease_expires_at > NOW()
         )
       ORDER BY created_at ASC, id ASC
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     UPDATE market_research_requests r
     SET status = 'running',
         attempt_count = attempt_count + 1,
         lease_token = $1,
         lease_expires_at = NOW() + ($2::text || ' minutes')::interval,
         started_at = NOW(),
         last_error = NULL,
         updated_at = NOW()
     FROM candidate
     WHERE r.id = candidate.id
     RETURNING
       r.id, r.requested_by AS "requestedBy", r.topic, r.product_id AS "productId",
       r.product_name AS "productName", r.objective, r.target_segment AS "targetSegment",
       r.market_scope AS "marketScope", r.status, r.attempt_count AS "attemptCount",
       r.retry_of_id AS "retryOfId", r.last_error AS "lastError",
       r.created_at AS "createdAt", r.updated_at AS "updatedAt",
       r.started_at AS "startedAt", r.completed_at AS "completedAt",
       r.lease_token AS "leaseToken"`,
    [
      leaseToken,
      LEASE_MINUTES,
      WORKER_LEADER_KEY,
      WORKER_INSTANCE_ID,
      WORKER_LEADER_TTL_SECONDS,
    ],
  );
  if (!result.rows[0]) return null;
  return { ...mapRequestRow(result.rows[0]), leaseToken: String(result.rows[0].leaseToken) };
}

async function finishResearchRequest(
  request: ClaimedResearchRequest,
  status: "completed" | "failed",
  lastError: string | null,
): Promise<void> {
  await pool.query(
    `UPDATE market_research_requests
     SET status = $3::varchar,
         completed_at = CASE WHEN $3::varchar = 'completed' THEN NOW() ELSE completed_at END,
         last_error = $4,
         lease_token = NULL,
         lease_expires_at = NULL,
         updated_at = NOW()
     WHERE id = $1
       AND status = 'running'
       AND lease_token = $2
       AND lease_expires_at > NOW()`,
    [request.id, request.leaseToken, status, lastError],
  );
}

export async function processNextResearchRequest(): Promise<boolean> {
  await reconcileCompletedRequests();
  const request = await claimNextResearchRequest();
  if (!request) return false;

  try {
    const document = await fetchRequestedResearchDocument(request);
    const result = await generateMarketNeedsReport({
      researchDocuments: { [`request-${request.id}`]: document },
      generatedBy: "request",
      researchRequest: {
        id: request.id,
        leaseToken: request.leaseToken,
        topic: request.topic,
        objective: request.objective,
        targetSegment: request.targetSegment,
        marketScope: request.marketScope,
        productId: request.productId,
        productName: request.productName,
      },
    });
    if (!result.generated) {
      if (result.reason !== "research-request-lease-lost") {
        console.error(`[MarketResearchRequest ${request.id}] ${result.reason || "unknown failure"}`);
        await finishResearchRequest(request, "failed", publicFailureReason(result.reason || ""));
      }
      return true;
    }
    await finishResearchRequest(request, "completed", null);
    return true;
  } catch (error) {
    console.error(`[MarketResearchRequest ${request.id}]`, error);
    await finishResearchRequest(request, "failed", "Riset gagal diproses. Silakan coba lagi.");
    return true;
  }
}

let workerStarted = false;
let workerBusy = false;
let workerLeader = false;

async function refreshWorkerLeadership(): Promise<boolean> {
  try {
    const result = await pool.query<{ value: string }>(
      `INSERT INTO system_config (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE
         SET value = $2, updated_at = NOW()
         WHERE system_config.value = $2
            OR system_config.updated_at < NOW() - ($3::text || ' seconds')::interval
       RETURNING value`,
      [WORKER_LEADER_KEY, WORKER_INSTANCE_ID, WORKER_LEADER_TTL_SECONDS],
    );
    workerLeader = result.rows[0]?.value === WORKER_INSTANCE_ID;
  } catch (error) {
    workerLeader = false;
    console.error("[MarketResearchWorker] leader heartbeat gagal:", error);
  }
  return workerLeader;
}

export async function drainMarketResearchQueue(): Promise<void> {
  if (workerBusy) return;
  workerBusy = true;
  try {
    while (workerLeader && await processNextResearchRequest()) {
      // Drain serially to cap external calls and AI spend at one request at a time.
      if (!await refreshWorkerLeadership()) break;
    }
  } finally {
    workerBusy = false;
  }
}

export function startMarketResearchRequestWorker(): void {
  if (workerStarted) return;
  workerStarted = true;
  const run = async () => {
    if (!await refreshWorkerLeadership()) return;
    await drainMarketResearchQueue();
  };
  setTimeout(() => {
    void run().catch((error) => console.error("[MarketResearchWorker] tick gagal:", error));
  }, 1_000);
  const timer = setInterval(() => {
    void run().catch((error) => console.error("[MarketResearchWorker] tick gagal:", error));
  }, WORKER_INTERVAL_MS);
  timer.unref?.();
}