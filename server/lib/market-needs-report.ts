import OpenAI from "openai";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";

const INTERNAL_SIGNAL_WINDOW_DAYS = 30;
const MIN_INTERNAL_COHORT = 3;
const MAX_SOURCES_PER_STREAM = 20;
const MAX_PRODUCTS_IN_PROMPT = 120;
const MARKET_REPORT_MODEL = process.env.MARKET_REPORT_MODEL || "gpt-4o-mini";

export type MarketDecision = "promote" | "monitor" | "product_gap";
export type MarketConfidence = "low" | "medium" | "high";

export interface MarketEvidence {
  id: string;
  kind: "market" | "internal";
  title: string;
  summary: string;
  publisher?: string;
  publishedAt?: string;
  url?: string;
}

export interface EligibleProduct {
  id: string;
  source: "registry" | "store";
  name: string;
  productType: string;
  category: string;
  description: string;
  targetUsers: string;
  officialUrl: string | null;
  price: number | null;
}

export interface MarketRecommendation {
  rank: number;
  decision: MarketDecision;
  need: string;
  segment: string;
  product: EligibleProduct | null;
  rationale: string;
  confidence: MarketConfidence;
  evidenceIds: string[];
  suggestedMessage: string;
  suggestedChannels: string[];
  durationDays: number | null;
}

export interface MarketNeedsPayload {
  generatedAt: string;
  periodDays: number;
  executiveSummary: string;
  methodologyNotice: string;
  marketSignals: Array<{
    title: string;
    summary: string;
    evidenceIds: string[];
  }>;
  evidence: MarketEvidence[];
  recommendations: MarketRecommendation[];
  caveats: string[];
}

export interface StoredMarketNeedsReport {
  id: number;
  reportDate: string;
  generatedBy: "scheduler" | "manual";
  sourceCount: number;
  internalSignalWindowDays: number;
  payload: MarketNeedsPayload;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateMarketNeedsResult {
  generated: boolean;
  reportId?: number;
  recommendations?: number;
  sourceCount?: number;
  reason?: string;
}

const rawReportSchema = z.object({
  executiveSummary: z.string().min(1).max(2400),
  marketSignals: z.array(z.object({
    title: z.string().min(1).max(240),
    summary: z.string().min(1).max(1200),
    evidenceIds: z.array(z.string()).max(10).default([]),
  })).max(8).default([]),
  recommendations: z.array(z.object({
    decision: z.enum(["promote", "monitor", "product_gap"]),
    need: z.string().min(1).max(360),
    segment: z.string().min(1).max(240),
    productId: z.string().nullable().optional(),
    rationale: z.string().min(1).max(1600),
    confidence: z.enum(["low", "medium", "high"]),
    evidenceIds: z.array(z.string()).max(12).default([]),
    suggestedMessage: z.string().max(1600).default(""),
    suggestedChannels: z.array(z.string().max(80)).max(8).default([]),
    durationDays: z.number().int().nullable().optional(),
  })).min(1).max(8),
  caveats: z.array(z.string().max(600)).max(10).default([]),
});

let marketReportClient: OpenAI | null = null;

function getMarketReportClient(): OpenAI | null {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!marketReportClient) {
    marketReportClient = new OpenAI({
      apiKey,
      ...(process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
        ? { baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL }
        : {}),
    });
  }
  return marketReportClient;
}

function resultRows<T = Record<string, unknown>>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  const rows = (result as { rows?: unknown[] } | null)?.rows;
  return Array.isArray(rows) ? rows as T[] : [];
}

function trimText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeOfficialUrl(value: unknown): string | null {
  const url = trimText(value, 1200);
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (/^https:\/\/[^\s]+$/i.test(url)) return url;
  return null;
}

function reportDateWIB(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

export function toPrivacySafeCountLabel(value: number): string | null {
  const count = Math.max(0, Math.floor(Number(value) || 0));
  if (count < MIN_INTERNAL_COHORT) return null;
  if (count < 5) return "3–4";
  if (count < 10) return "5–9";
  if (count < 20) return "10–19";
  if (count < 50) return "20–49";
  if (count < 100) return "50–99";
  if (count < 250) return "100–249";
  if (count < 500) return "250–499";
  return "500+";
}

/**
 * Mengubah dokumen feed harian menjadi katalog bukti terstruktur. Hanya judul,
 * ringkasan, penerbit, tanggal, dan tautan publik yang diambil; tidak ada chat
 * atau dokumen privat pengguna yang dibaca.
 */
export function extractMarketEvidence(
  researchDocuments: Record<string, string>,
): MarketEvidence[] {
  const evidence: MarketEvidence[] = [];
  const seen = new Set<string>();

  for (const [streamSlug, doc] of Object.entries(researchDocuments)) {
    if (!doc.trim()) continue;
    const lines = doc.split(/\r?\n/);
    let currentTopic = "";
    let streamCount = 0;

    for (let i = 0; i < lines.length && streamCount < MAX_SOURCES_PER_STREAM; i += 1) {
      const topicMatch = lines[i].match(/^## Topik:\s*(.+)$/);
      if (topicMatch) {
        currentTopic = topicMatch[1].trim();
        continue;
      }

      const itemMatch = lines[i].match(/^\d+\.\s+(.+)$/);
      if (!itemMatch) continue;

      const title = itemMatch[1].trim();
      let publisher = "";
      let publishedAt = "";
      let summary = "";
      let url = "";

      for (let j = i + 1; j < lines.length; j += 1) {
        if (/^(?:\d+\.\s+|## Topik:)/.test(lines[j])) break;
        const sourceMatch = lines[j].match(/^\s+Sumber:\s*(.+)$/);
        if (sourceMatch) {
          const [sourceName, ...dateParts] = sourceMatch[1].split("|").map((part) => part.trim());
          publisher = sourceName || "";
          publishedAt = dateParts.join(" | ");
        }
        const summaryMatch = lines[j].match(/^\s+Ringkas:\s*(.+)$/);
        if (summaryMatch) summary = summaryMatch[1].trim();
        const urlMatch = lines[j].match(/^\s+Tautan:\s*(.+)$/);
        if (urlMatch) url = safeOfficialUrl(urlMatch[1]) || "";
      }

      const dedupeKey = (url || `${streamSlug}:${title}`).toLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      streamCount += 1;
      evidence.push({
        id: `M${evidence.length + 1}`,
        kind: "market",
        title: trimText(title, 360),
        summary: trimText(summary || `Topik riset: ${currentTopic}`, 900),
        publisher: trimText(publisher, 180) || undefined,
        publishedAt: trimText(publishedAt, 180) || undefined,
        url: url || undefined,
      });
    }
  }

  return evidence;
}

async function loadEligibleProducts(): Promise<EligibleProduct[]> {
  const registryResult = await db.execute(sql`
    SELECT
      product_id AS "id",
      name,
      product_type AS "productType",
      category,
      COALESCE(short_description, '') AS "description",
      COALESCE(target_users, '') AS "targetUsers",
      COALESCE(NULLIF(product_url, ''), NULLIF(access_url, '')) AS "officialUrl",
      price
    FROM product_registry
    WHERE status = 'ACTIVE'
      AND (
        standalone_enabled IS TRUE
        OR dp_enabled IS TRUE
        OR gaia_enabled IS TRUE
        OR visibility IN ('STANDALONE_ONLY', 'INCLUDED_AND_STANDALONE', 'DP_ONLY')
      )
    ORDER BY gaia_featured DESC, updated_at DESC, name ASC
    LIMIT ${MAX_PRODUCTS_IN_PROMPT}
  `);

  const registryProducts = resultRows<any>(registryResult).map((row) => ({
    id: String(row.id),
    source: "registry" as const,
    name: trimText(row.name, 240),
    productType: trimText(row.productType, 100) || "PRODUCT",
    category: trimText(row.category, 120),
    description: trimText(row.description, 700),
    targetUsers: trimText(row.targetUsers, 500),
    officialUrl: safeOfficialUrl(row.officialUrl),
    price: Number.isFinite(Number(row.price)) ? Number(row.price) : null,
  }));

  const remaining = Math.max(0, MAX_PRODUCTS_IN_PROMPT - registryProducts.length);
  if (remaining === 0) return registryProducts;

  const storeResult = await db.execute(sql`
    SELECT
      id,
      name,
      COALESCE(category, '') AS category,
      COALESCE(description, '') AS description,
      NULLIF(payment_url, '') AS "officialUrl",
      COALESCE(price_override, price) AS price,
      agent_id AS "agentId"
    FROM store_products
    WHERE is_active IS TRUE AND is_gustafta IS TRUE
    ORDER BY sort_order ASC, created_at DESC
    LIMIT ${remaining}
  `);

  const seenNames = new Set(registryProducts.map((product) => product.name.toLowerCase()));
  const storeProducts = resultRows<any>(storeResult)
    .filter((row) => !seenNames.has(trimText(row.name, 240).toLowerCase()))
    .map((row) => ({
      id: `STORE-${String(row.id)}`,
      source: "store" as const,
      name: trimText(row.name, 240),
      productType: row.agentId ? "AI_SPECIALIST" : "STORE_PRODUCT",
      category: trimText(row.category, 120),
      description: trimText(row.description, 700),
      targetUsers: "",
      officialUrl: safeOfficialUrl(row.officialUrl),
      price: Number.isFinite(Number(row.price)) ? Number(row.price) : null,
    }));

  return [...registryProducts, ...storeProducts].slice(0, MAX_PRODUCTS_IN_PROMPT);
}

async function loadAggregateDemandEvidence(): Promise<MarketEvidence[]> {
  const evidence: MarketEvidence[] = [];

  const analyticsResult = await db.execute(sql`
    SELECT
      a.id AS "agentId",
      a.name,
      COALESCE(a.slug, '') AS slug,
      an.event_type AS "eventType",
      COUNT(*)::int AS count
    FROM analytics an
    JOIN agents a ON a.id = an.agent_id
    WHERE an.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY a.id, a.name, a.slug, an.event_type
    ORDER BY COUNT(*) DESC
    LIMIT 100
  `);

  const agentUsage = new Map<string, {
    name: string;
    slug: string;
    total: number;
    events: Array<{ type: string; count: number }>;
  }>();
  for (const row of resultRows<any>(analyticsResult)) {
    const key = String(row.agentId);
    const current = agentUsage.get(key) || {
      name: trimText(row.name, 200),
      slug: trimText(row.slug, 160),
      total: 0,
      events: [],
    };
    const count = Number(row.count) || 0;
    current.total += count;
    current.events.push({ type: trimText(row.eventType, 100), count });
    agentUsage.set(key, current);
  }

  for (const usage of [...agentUsage.values()].sort((a, b) => b.total - a.total).slice(0, 20)) {
    const totalLabel = toPrivacySafeCountLabel(usage.total);
    if (!totalLabel) continue;
    const safeEvents = usage.events
      .map((event) => ({ ...event, label: toPrivacySafeCountLabel(event.count) }))
      .filter((event): event is { type: string; count: number; label: string } => Boolean(event.label))
      .slice(0, 5);
    evidence.push({
      id: `I${evidence.length + 1}`,
      kind: "internal",
      title: `Penggunaan agregat AI Specialist: ${usage.name}`,
      summary: `${totalLabel} event agregat dalam ${INTERNAL_SIGNAL_WINDOW_DAYS} hari${
        safeEvents.length > 0
          ? ` (${safeEvents.map((event) => `${event.type}: ${event.label}`).join(", ")})`
          : ""
      }. Angka dibucket dan kelompok di bawah ${MIN_INTERNAL_COHORT} disembunyikan. Ini sinyal penggunaan, bukan data pencarian Store dan bukan isi percakapan.`,
    });
  }

  const orderResult = await db.execute(sql`
    SELECT
      sp.id,
      sp.name,
      COUNT(*)::int AS count
    FROM store_orders so
    JOIN store_products sp ON sp.id = so.product_id
    WHERE so.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY sp.id, sp.name
    ORDER BY COUNT(*) DESC
    LIMIT 15
  `);
  for (const row of resultRows<any>(orderResult)) {
    const countLabel = toPrivacySafeCountLabel(Number(row.count));
    if (!countLabel) continue;
    evidence.push({
      id: `I${evidence.length + 1}`,
      kind: "internal",
      title: `Order Store agregat: ${trimText(row.name, 200)}`,
      summary: `${countLabel} order tercatat dalam ${INTERNAL_SIGNAL_WINDOW_DAYS} hari. Angka dibucket dan kelompok di bawah ${MIN_INTERNAL_COHORT} disembunyikan; tidak memuat identitas pelanggan.`,
    });
  }

  const subscriptionResult = await db.execute(sql`
    SELECT
      a.id,
      a.name,
      COUNT(*)::int AS count
    FROM client_subscriptions cs
    JOIN agents a ON a.id = cs.agent_id
    WHERE cs.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY a.id, a.name
    ORDER BY COUNT(*) DESC
    LIMIT 15
  `);
  for (const row of resultRows<any>(subscriptionResult)) {
    const countLabel = toPrivacySafeCountLabel(Number(row.count));
    if (!countLabel) continue;
    evidence.push({
      id: `I${evidence.length + 1}`,
      kind: "internal",
      title: `Langganan baru agregat: ${trimText(row.name, 200)}`,
      summary: `${countLabel} langganan tercatat dalam ${INTERNAL_SIGNAL_WINDOW_DAYS} hari. Angka dibucket dan kelompok di bawah ${MIN_INTERNAL_COHORT} disembunyikan; tidak memuat identitas pelanggan.`,
    });
  }

  return evidence;
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(trimmed.slice(first, last + 1));
    throw new Error("Model tidak mengembalikan JSON yang valid");
  }
}

export function validateAndResolveMarketReport(
  rawInput: unknown,
  products: EligibleProduct[],
  evidence: MarketEvidence[],
  generatedAt: string,
): MarketNeedsPayload {
  const raw = rawReportSchema.parse(rawInput);
  const productsById = new Map(products.map((product) => [product.id, product]));
  const evidenceIds = new Set(evidence.map((item) => item.id));

  const recommendations = raw.recommendations.map((item, index): MarketRecommendation => {
    const requestedProduct = item.productId ? productsById.get(item.productId) || null : null;
    let decision = item.decision;
    let confidence = item.confidence;
    let rationale = trimText(item.rationale, 1600);

    if (decision !== "product_gap" && !requestedProduct) {
      decision = "product_gap";
      confidence = "low";
      rationale = `${rationale} Produk yang dirujuk model tidak ada dalam katalog resmi, sehingga rekomendasi ini diturunkan menjadi product gap.`;
    }

    const verifiedEvidenceIds = item.evidenceIds.filter((id) => evidenceIds.has(id));
    if (verifiedEvidenceIds.length === 0) confidence = "low";

    return {
      rank: index + 1,
      decision,
      need: trimText(item.need, 360),
      segment: trimText(item.segment, 240),
      product: decision === "product_gap" ? null : requestedProduct,
      rationale,
      confidence,
      evidenceIds: verifiedEvidenceIds,
      suggestedMessage: trimText(item.suggestedMessage, 1600)
        .replace(/\bchatbot\b/gi, "AI Specialist"),
      suggestedChannels: item.suggestedChannels.map((channel) => trimText(channel, 80)).filter(Boolean),
      durationDays: typeof item.durationDays === "number" && item.durationDays > 0
        ? Math.max(1, Math.min(30, Math.round(item.durationDays)))
        : null,
    };
  });

  return {
    generatedAt,
    periodDays: INTERNAL_SIGNAL_WINDOW_DAYS,
    executiveSummary: trimText(raw.executiveSummary, 2400),
    methodologyNotice:
      "Laporan ini memakai berita publik dan sinyal penggunaan internal yang sudah diagregasi. " +
      `Kelompok internal di bawah ${MIN_INTERNAL_COHORT} disembunyikan dan hitungan yang tampil dibucket. ` +
      "Belum ada telemetry Store untuk impression, pencarian, dan klik, sehingga laporan tidak boleh " +
      "diklaim sebagai daftar produk yang paling dicari. Semua promosi tetap memerlukan persetujuan superadmin.",
    marketSignals: raw.marketSignals.map((signal) => ({
      title: trimText(signal.title, 240),
      summary: trimText(signal.summary, 1200),
      evidenceIds: signal.evidenceIds.filter((id) => evidenceIds.has(id)),
    })),
    evidence,
    recommendations,
    caveats: [
      ...raw.caveats.map((caveat) => trimText(caveat, 600)).filter(Boolean),
      "Tidak ada publikasi, perubahan featured product, pengiriman pesan, atau belanja iklan yang dilakukan otomatis.",
    ],
  };
}

export async function generateMarketNeedsReport(input: {
  researchDocuments: Record<string, string>;
  generatedBy: "scheduler" | "manual";
}): Promise<GenerateMarketNeedsResult> {
  const client = getMarketReportClient();
  if (!client) return { generated: false, reason: "no-openai-key" };

  const marketEvidence = extractMarketEvidence(input.researchDocuments);
  if (marketEvidence.length === 0) {
    return { generated: false, reason: "no-research-sources", sourceCount: 0 };
  }

  const [products, internalEvidence] = await Promise.all([
    loadEligibleProducts(),
    loadAggregateDemandEvidence(),
  ]);
  if (products.length === 0) {
    return { generated: false, reason: "no-eligible-products", sourceCount: marketEvidence.length };
  }

  const evidence = [...marketEvidence, ...internalEvidence];
  const compactProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    type: product.productType,
    category: product.category,
    description: product.description,
    targetUsers: product.targetUsers,
    hasOfficialUrl: Boolean(product.officialUrl),
  }));
  const compactEvidence = evidence.map((item) => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
    summary: item.summary,
    publisher: item.publisher,
    publishedAt: item.publishedAt,
  }));

  const systemPrompt = `Kamu adalah Divisi Rekomendasi Produk & Kebutuhan Pasar internal Gustafta.
Tugasmu: mengubah bukti pasar publik dan sinyal internal AGREGAT menjadi rekomendasi yang dapat
ditinjau superadmin. Kamu tidak pernah mempublikasikan apa pun.

ATURAN KERAS:
1. Hanya rekomendasikan productId yang ADA persis di KATALOG RESMI. Jangan mengarang produk,
   harga, fitur, tautan, popularitas, atau kemampuan.
2. Jika kebutuhan nyata tetapi tidak ada produk yang cocok, decision wajib "product_gap" dan
   productId wajib null.
3. "promote" hanya jika ada bukti relevan dan produk resmi siap. "monitor" untuk bukti sedang/
   belum cukup. Confidence harus turun bila bukti hanya berita atau hanya satu sinyal.
4. Sinyal internal adalah agregat penggunaan/order/langganan, BUKAN isi chat dan BUKAN bukti
   "paling dicari". Telemetry Store impression/search/click belum tersedia.
5. evidenceIds hanya boleh memakai ID yang tersedia. Setiap rekomendasi wajib berusaha menyertakan
   bukti pasar dan/atau internal yang relevan.
6. Gunakan bahasa pelanggan "AI Specialist" atau "Asisten AI", jangan gunakan "chatbot".
7. Pesan promosi harus jujur, tanpa klaim hasil pasti. Keputusan publikasi adalah gerbang manusia.

Kembalikan SATU objek JSON dengan bentuk:
{
  "executiveSummary": "ringkasan keputusan",
  "marketSignals": [{"title":"", "summary":"", "evidenceIds":["M1"]}],
  "recommendations": [{
    "decision":"promote|monitor|product_gap",
    "need":"",
    "segment":"",
    "productId":"ID katalog atau null",
    "rationale":"",
    "confidence":"low|medium|high",
    "evidenceIds":["M1","I1"],
    "suggestedMessage":"",
    "suggestedChannels":["WhatsApp","Meta Ads"],
    "durationDays":7
  }],
  "caveats":[""]
}
Buat 3-6 rekomendasi, diurutkan dari yang paling layak ditindaklanjuti.`;

  const userPrompt = `Tanggal laporan WIB: ${reportDateWIB()}

BUKTI PASAR DAN SINYAL INTERNAL:
${JSON.stringify(compactEvidence)}

KATALOG RESMI YANG BOLEH DIREKOMENDASIKAN:
${JSON.stringify(compactProducts)}

Buat Peta Kebutuhan & Rekomendasi Solusi untuk superadmin.`;

  let rawText = "";
  try {
    const response = await client.chat.completions.create(
      {
        model: MARKET_REPORT_MODEL,
        temperature: 0.2,
        max_tokens: 5000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      },
      { timeout: 90_000 },
    );
    rawText = response.choices?.[0]?.message?.content?.trim() || "";
  } catch (error) {
    return { generated: false, reason: (error as Error).message, sourceCount: marketEvidence.length };
  }
  if (!rawText) {
    return { generated: false, reason: "empty-model-output", sourceCount: marketEvidence.length };
  }

  let parsed: z.infer<typeof rawReportSchema>;
  try {
    const validated = rawReportSchema.safeParse(parseJsonObject(rawText));
    if (!validated.success) {
      return {
        generated: false,
        reason: `invalid-model-output: ${validated.error.issues[0]?.message || "schema"}`,
        sourceCount: marketEvidence.length,
      };
    }
    parsed = validated.data;
  } catch (error) {
    return { generated: false, reason: (error as Error).message, sourceCount: marketEvidence.length };
  }

  const generatedAt = new Date().toISOString();
  const payload = validateAndResolveMarketReport(parsed, products, evidence, generatedAt);
  const reportDate = reportDateWIB();
  const inserted = await db.execute(sql`
    INSERT INTO market_needs_reports (
      report_date,
      generated_by,
      source_count,
      internal_signal_window_days,
      payload,
      created_at,
      updated_at
    )
    VALUES (
      ${reportDate}::date,
      ${input.generatedBy},
      ${marketEvidence.length},
      ${INTERNAL_SIGNAL_WINDOW_DAYS},
      ${JSON.stringify(payload)}::jsonb,
      NOW(),
      NOW()
    )
    RETURNING id
  `);
  const [row] = resultRows<{ id: number }>(inserted);

  return {
    generated: true,
    reportId: Number(row?.id),
    recommendations: payload.recommendations.length,
    sourceCount: marketEvidence.length,
  };
}

export async function listMarketNeedsReports(limit = 30): Promise<StoredMarketNeedsReport[]> {
  const safeLimit = Math.max(1, Math.min(90, Math.round(limit)));
  const result = await db.execute(sql`
    SELECT
      id,
      report_date::text AS "reportDate",
      generated_by AS "generatedBy",
      source_count AS "sourceCount",
      internal_signal_window_days AS "internalSignalWindowDays",
      payload,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM market_needs_reports
    ORDER BY created_at DESC, id DESC
    LIMIT ${safeLimit}
  `);

  return resultRows<any>(result).map((row) => ({
    id: Number(row.id),
    reportDate: String(row.reportDate),
    generatedBy: row.generatedBy === "manual" ? "manual" : "scheduler",
    sourceCount: Number(row.sourceCount) || 0,
    internalSignalWindowDays: Number(row.internalSignalWindowDays) || INTERNAL_SIGNAL_WINDOW_DAYS,
    payload: row.payload as MarketNeedsPayload,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  }));
}
