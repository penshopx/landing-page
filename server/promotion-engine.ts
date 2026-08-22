// ─────────────────────────────────────────────────────────────────────────────
// DEMAND-LED PROMOTION ENGINE
//
// Human-approved promotion campaigns that surface ONE primary + ≤2 support offers
// on canonical placements (homepage and/or store). NOTHING is auto-published — an
// admin (admin/superadmin DB role) drafts, then explicitly publishes.
//
// Canonical inventory is read ONLY from product_registry + package_registry (no
// second catalog, no ML model). Eligibility is recomputed live for public reads,
// and a frozen snapshot is stored at campaign creation (kept for admin history).
//
// Privacy contract for promotion_events (public write route):
//   - NO name/email/phone/chat/document content/IP/user agent is ever stored.
//   - `search` events accept a raw query ONLY transiently; it is classified
//     server-side into a fixed problem/segment taxonomy and the raw text is
//     dropped immediately (never persisted).
//   - Session identity is a SHA-256 hash of a *validated opaque* session id.
//   - eventId is a GLOBALLY unique idempotency key (durable dedupe even when
//     campaignId is NULL for a general classified Store search).
//   - The public route may NEVER submit `order`/revenue — those are derived
//     server-side from attributed, paid/completed store_orders.
// ─────────────────────────────────────────────────────────────────────────────
import type { Express, Request, Response } from "express";
import { createHash } from "crypto";
import { z } from "zod";
import { and, asc, desc, eq, gte, inArray, isNotNull, lte, ne, sql } from "drizzle-orm";
import { db, pool } from "./db";
import {
  promotionCampaigns, promotionCampaignItems, promotionEvents,
  productRegistry, packageRegistry, packageProducts,
  storeOrders,
} from "@shared/schema";
import { getWaContact } from "./lib/wa-contact";
import { listMarketNeedsReports } from "./lib/market-needs-report";

// ── Fixed taxonomies ──────────────────────────────────────────────────────────
export const PROMOTION_PLACEMENTS = ["homepage", "store"] as const;
export type PromotionPlacement = (typeof PROMOTION_PLACEMENTS)[number];

// Public event types (accepted by POST /api/promotions/events).
export const PROMOTION_PUBLIC_EVENT_TYPES = [
  "impression", "click", "search", "trial", "lead", "return_visit",
] as const;
// Full set (server-only "order" derived from attributed store_orders).
export const PROMOTION_EVENT_TYPES = [
  ...PROMOTION_PUBLIC_EVENT_TYPES, "order",
] as const;
export type PromotionEventType = (typeof PROMOTION_EVENT_TYPES)[number];

// Fixed problem taxonomy keys the campaigns/search classifier map onto.
export const PROMOTION_PROBLEMS = [
  "tender_readiness",
  "certification_sbu_skk",
  "document_analysis",
  "knowledge_management",
  "productivity_automation",
  "hse_safety",
  "market_research",
  "general_discovery",
] as const;
export type PromotionProblem = (typeof PROMOTION_PROBLEMS)[number];

// Fixed audience segment taxonomy keys.
export const PROMOTION_SEGMENTS = [
  "contractor",
  "consultant",
  "sme_owner",
  "professional",
  "enterprise",
  "general",
] as const;
export type PromotionSegment = (typeof PROMOTION_SEGMENTS)[number];

export const PROMOTION_CAMPAIGN_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] as const;
export const PROMOTION_ITEM_ROLES = ["primary", "support"] as const;
export const PROMOTION_ITEM_KINDS = ["product", "package"] as const;

// Advisory lock namespace for publish revalidation (arbitrary, stable, unique).
const PUBLISH_ADVISORY_LOCK_KEY = 396_020;

// History retention floor (never delete; keep at least 30 days visible).
export const PROMOTION_HISTORY_MIN_DAYS = 30;

// Paid/completed order statuses that count as real business outcomes.
export const PAID_ORDER_STATUSES = ["paid", "completed", "settlement", "success", "capture"] as const;

// ── Strict field length bounds ─────────────────────────────────────────────────
const MAX_NAME = 160;
const MAX_HOOK = 400;
const MAX_CTA = 120;
const MAX_REASON = 2000;
const MAX_EVENT_ID = 80;
const MAX_SESSION_ID = 200;
const MAX_SEARCH_QUERY = 300;

// ── Pure helper: classify a raw search query into fixed taxonomies ─────────────
// Runs server-side only. The raw query is NEVER stored — only the classification.
// Deterministic keyword mapping; no ML model, no external call.
const PROBLEM_KEYWORDS: Record<PromotionProblem, string[]> = {
  tender_readiness: ["tender", "lelang", "lpse", "rup", "pengadaan", "bid", "proposal"],
  certification_sbu_skk: ["sbu", "skk", "sertifikat", "sertifikasi", "izin", "kualifikasi", "lisensi"],
  document_analysis: ["dokumen", "analisa dokumen", "analisis dokumen", "kontrak", "review dokumen", "pdf"],
  knowledge_management: ["knowledge", "pengetahuan", "arsip", "memory", "dokumentasi", "sop"],
  productivity_automation: ["otomasi", "automation", "produktivitas", "workflow", "mini app", "tool"],
  hse_safety: ["hse", "k3", "keselamatan", "safety", "smk3", "ak3"],
  market_research: ["riset", "research", "pasar", "market", "kompetitor", "tren"],
  general_discovery: [],
};

const SEGMENT_KEYWORDS: Record<PromotionSegment, string[]> = {
  contractor: ["kontraktor", "konstruksi", "contractor", "proyek"],
  consultant: ["konsultan", "consultant", "advisor"],
  sme_owner: ["umkm", "ukm", "sme", "usaha kecil", "pemilik usaha"],
  professional: ["profesional", "professional", "karyawan", "staff"],
  enterprise: ["enterprise", "perusahaan besar", "korporat", "corporate"],
  general: [],
};

function normalizeText(s: string): string {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Classify a raw search query → { problem, segment } using fixed taxonomies. */
export function classifySearchQuery(rawQuery: string): {
  problem: PromotionProblem;
  segment: PromotionSegment;
} {
  const text = normalizeText(rawQuery).slice(0, MAX_SEARCH_QUERY);
  return { problem: classifyProblem(text), segment: classifySegment(text) };
}

function classifyProblem(text: string): PromotionProblem {
  for (const key of PROMOTION_PROBLEMS) {
    if (key === "general_discovery") continue;
    if (PROBLEM_KEYWORDS[key].some((kw) => text.includes(kw))) return key;
  }
  return "general_discovery";
}

function classifySegment(text: string): PromotionSegment {
  for (const key of PROMOTION_SEGMENTS) {
    if (key === "general") continue;
    if (SEGMENT_KEYWORDS[key].some((kw) => text.includes(kw))) return key;
  }
  return "general";
}

/** Coerce free-text segment input into a fixed taxonomy key. */
export function coerceSegment(raw: string): PromotionSegment {
  const t = normalizeText(raw);
  if ((PROMOTION_SEGMENTS as readonly string[]).includes(t)) return t as PromotionSegment;
  return classifySegment(t);
}

/** SHA-256 hash of a validated opaque session id (never store the raw id). */
export function hashSessionId(rawSessionId: string): string {
  return createHash("sha256").update(String(rawSessionId)).digest("hex");
}

// ── Canonical text corpus for a candidate (registry fields only) ───────────────
function productCorpus(p: any): string {
  return normalizeText([
    p.name, p.category, p.subcategory, p.shortDescription, p.longDescription,
    p.targetUsers, p.productType,
    ...(Array.isArray(p.features) ? p.features : []),
    ...(Array.isArray(p.benefits) ? p.benefits : []),
  ].filter(Boolean).join(" "));
}

function packageCorpus(pkg: any, compositionNames: string[]): string {
  return normalizeText([
    pkg.name, pkg.description, ...compositionNames,
  ].filter(Boolean).join(" "));
}

/** Which fixed problem best matches a canonical corpus, or null. */
export function matchProblemForCorpus(corpus: string): PromotionProblem | null {
  for (const key of PROMOTION_PROBLEMS) {
    if (key === "general_discovery") continue;
    if (PROBLEM_KEYWORDS[key].some((kw) => corpus.includes(kw))) return key;
  }
  return null;
}

// ── Pure helper: campaign draft validation ─────────────────────────────────────
export const zPromotionItem = z.object({
  role: z.enum(PROMOTION_ITEM_ROLES),
  canonicalKind: z.enum(PROMOTION_ITEM_KINDS),
  canonicalId: z.union([z.string(), z.number()]).transform((v) => String(v)),
});
export type PromotionItemInput = z.infer<typeof zPromotionItem>;

export const zCreateCampaign = z.object({
  name: z.string().min(1).max(MAX_NAME),
  placements: z.array(z.enum(PROMOTION_PLACEMENTS)).min(1).max(2),
  segment: z.string().min(0).max(60).optional().default("general"),
  problem: z.enum(PROMOTION_PROBLEMS).optional(),
  hook: z.string().min(1).max(MAX_HOOK),
  // Frontend sends ctaLabel + selectionReason; accept legacy cta/reason too.
  ctaLabel: z.string().min(1).max(MAX_CTA).optional(),
  cta: z.string().min(1).max(MAX_CTA).optional(),
  selectionReason: z.string().min(1).max(MAX_REASON).optional(),
  reason: z.string().min(1).max(MAX_REASON).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  items: z.array(zPromotionItem).min(1).max(3),
}).superRefine((d, ctx) => {
  if (!d.ctaLabel && !d.cta) {
    ctx.addIssue({ code: "custom", path: ["ctaLabel"], message: "ctaLabel wajib diisi." });
  }
  if (!d.selectionReason && !d.reason) {
    ctx.addIssue({ code: "custom", path: ["selectionReason"], message: "selectionReason wajib diisi." });
  }
  const uniquePlacements = new Set(d.placements);
  if (uniquePlacements.size !== d.placements.length) {
    ctx.addIssue({ code: "custom", path: ["placements"], message: "placements harus unik." });
  }
});
export type CreateCampaignInput = z.infer<typeof zCreateCampaign>;

/**
 * Pure structural validation of a campaign draft's items:
 *   - exactly ONE primary
 *   - at most 2 support (≤3 items total)
 *   - no duplicate canonical item
 *   - valid schedule (startsAt < endsAt)
 * Returns { ok } or { ok:false, error }. Does NOT touch the DB.
 */
export function validateCampaignShape(input: {
  items: Array<{ role: string; canonicalKind?: string; canonicalId?: string }>;
  startsAt: string;
  endsAt: string;
}): { ok: true } | { ok: false; error: string } {
  const items = input.items || [];
  if (items.length < 1) return { ok: false, error: "Kampanye butuh minimal 1 item." };
  if (items.length > 3) return { ok: false, error: "Maksimal 3 item per kampanye (1 primary + ≤2 support)." };
  const primaries = items.filter((i) => i.role === "primary").length;
  const supports = items.filter((i) => i.role === "support").length;
  if (primaries !== 1) return { ok: false, error: "Harus tepat 1 item primary." };
  if (supports > 2) return { ok: false, error: "Maksimal 2 item support." };
  if (primaries + supports !== items.length) {
    return { ok: false, error: "Setiap item harus berperan primary atau support." };
  }
  // No duplicate canonical item.
  const keys = items.map((i) => `${i.canonicalKind}:${i.canonicalId}`);
  if (new Set(keys).size !== keys.length) {
    return { ok: false, error: "Item kanonik duplikat tidak diizinkan." };
  }
  const start = Date.parse(input.startsAt);
  const end = Date.parse(input.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return { ok: false, error: "Jadwal tidak valid." };
  }
  if (start >= end) return { ok: false, error: "startsAt harus lebih awal dari endsAt." };
  return { ok: true };
}

// ── Pure helper: safe official URL ─────────────────────────────────────────────
export function safeOfficialUrl(value: unknown): string | null {
  const url = String(value ?? "").trim().slice(0, 1200);
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (/^https:\/\/[^\s]+$/i.test(url)) return url;
  return null;
}

export function campaignWindowState(
  campaign: { startsAt: Date | string; endsAt: Date | string },
  at: Date = new Date(),
): "CURRENT" | "FUTURE" | "EXPIRED" {
  const startsAt = new Date(campaign.startsAt);
  const endsAt = new Date(campaign.endsAt);
  if (endsAt < at) return "EXPIRED";
  if (startsAt > at) return "FUTURE";
  return "CURRENT";
}

export async function applyCampaignPublishTransition(
  tx: any,
  campaign: typeof promotionCampaigns.$inferSelect,
  publishedBy: string,
  publishNow: Date = new Date(),
): Promise<{
  windowState: "CURRENT" | "FUTURE" | "EXPIRED";
  published: typeof promotionCampaigns.$inferSelect | null;
}> {
  const windowState = campaignWindowState(campaign, publishNow);
  if (windowState === "EXPIRED") return { windowState, published: null };

  if (windowState === "CURRENT") {
    await tx.update(promotionCampaigns).set({
      status: "PAUSED",
      pausedBy: publishedBy,
      pausedAt: publishNow,
      updatedAt: publishNow,
    }).where(and(
      eq(promotionCampaigns.status, "ACTIVE"),
      sql`${promotionCampaigns.placements} && ${campaign.placements}`,
      lte(promotionCampaigns.startsAt, publishNow),
      gte(promotionCampaigns.endsAt, publishNow),
      ne(promotionCampaigns.id, campaign.id),
    ));
  }

  const [published] = await tx.update(promotionCampaigns).set({
    status: "ACTIVE",
    publishedBy,
    publishedAt: publishNow,
    updatedAt: publishNow,
  }).where(eq(promotionCampaigns.id, campaign.id)).returning();
  return { windowState, published: published ?? null };
}

// ── Pure helper: transparent scoring over 7/30-day aggregate signals ───────────
export interface FunnelCounts {
  impression: number;
  click: number;
  search: number;
  trial: number;
  lead: number;
  return_visit: number;
  order: number;
}

export function emptyFunnel(): FunnelCounts {
  return { impression: 0, click: 0, search: 0, trial: 0, lead: 0, return_visit: 0, order: 0 };
}

/**
 * Transparent, rule-based score for a candidate offer. No ML — a weighted sum of
 * demand (matched search/return-visit interest), readiness (eligibility flag),
 * and prior performance (this candidate's own CTR + conversion). Every component
 * is inspectable via the returned breakdown.
 */
export function scoreCandidate(input: {
  demand7d: number;     // matched search + return_visit signals last 7d
  demand30d: number;    // same, last 30d
  ready: boolean;       // currently eligible in canonical inventory
  clicks30d: number;    // this candidate's prior campaign clicks
  impressions30d: number;
  orders30d: number;
}): { score: number; confidence: "low" | "medium" | "high"; breakdown: Record<string, number> } {
  const demandScore =
    Math.min(1, input.demand7d / 20) * 0.6 + Math.min(1, input.demand30d / 60) * 0.4;
  const readinessScore = input.ready ? 1 : 0;
  const ctr = input.impressions30d > 0 ? input.clicks30d / input.impressions30d : 0;
  const cvr = input.clicks30d > 0 ? input.orders30d / input.clicks30d : 0;
  const performanceScore = Math.min(1, ctr * 2) * 0.5 + Math.min(1, cvr * 4) * 0.5;

  const breakdown = {
    demand: Number((demandScore * 50).toFixed(2)),
    readiness: Number((readinessScore * 30).toFixed(2)),
    performance: Number((performanceScore * 20).toFixed(2)),
  };
  const score = Number((breakdown.demand + breakdown.readiness + breakdown.performance).toFixed(2));
  // Confidence reflects evidence volume, not just score.
  const evidence = input.demand30d + input.impressions30d;
  const confidence: "low" | "medium" | "high" =
    score >= 60 && evidence >= 20 ? "high" : score >= 35 && evidence >= 5 ? "medium" : "low";
  return { score, confidence, breakdown };
}

// ── Canonical eligibility (single source: registries) ──────────────────────────
type EligibleProductFact = {
  canonicalKind: "product";
  canonicalId: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  productType: string;
  price: number;
  currency: string;
  billingType: string;
  ctaUrl: string;
  ctaLabel: string;
  ctaEvent: "trial" | null;
  corpus: string;
};

type EligiblePackageFact = {
  canonicalKind: "package";
  canonicalId: string;
  packageVersion: number;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  durationValue: number;
  durationUnit: string;
  ctaUrl: string;
  ctaLabel: string;
  ctaEvent: "lead";
  compositionCount: number;
  corpus: string;
};

export type EligibleFact = EligibleProductFact | EligiblePackageFact;

/**
 * Resolve a single ACTIVE, public/standalone-ready product with a safe official
 * URL. Free products allowed (as configured via billingType FREE / price 0).
 */
async function resolveEligibleProduct(productId: string): Promise<EligibleProductFact | null> {
  const [p] = await db.select().from(productRegistry)
    .where(eq(productRegistry.productId, productId)).limit(1);
  return p ? productFact(p) : null;
}

function productFact(p: any): EligibleProductFact | null {
  if (p.status !== "ACTIVE") return null;
  const publicReady =
    p.visibility !== "INTERNAL_ONLY" &&
    (p.standaloneEnabled === true || p.gaiaEnabled === true);
  if (!publicReady) return null;
  const isFree = p.billingType === "FREE" || (p.price ?? 0) === 0;
  if (!isFree && !((p.price ?? 0) > 0)) return null;
  const ctaUrl = safeOfficialUrl(p.productUrl) || safeOfficialUrl(p.accessUrl) || safeOfficialUrl(p.demoUrl);
  if (!ctaUrl) return null;
  return {
    canonicalKind: "product",
    canonicalId: p.productId,
    name: p.name,
    slug: p.slug,
    description: p.shortDescription || p.longDescription || null,
    category: p.category ?? null,
    productType: p.productType || "PRODUCT",
    price: p.price ?? 0,
    currency: p.currency || "IDR",
    billingType: p.billingType || (isFree ? "FREE" : "ONE_TIME"),
    ctaUrl,
    ctaLabel: isFree ? "Coba sekarang" : "Lihat solusi",
    ctaEvent: isFree ? "trial" : null,
    corpus: productCorpus(p),
  };
}

/**
 * Resolve a single ACTIVE, gaia_enabled package with price>0, a visible ACTIVE
 * composition, and a live WhatsApp order CTA using the CURRENT rotated contact.
 */
async function resolveEligiblePackage(packageId: string): Promise<EligiblePackageFact | null> {
  const [pkg] = await db.select().from(packageRegistry)
    .where(eq(packageRegistry.packageId, packageId)).limit(1);
  if (!pkg) return null;
  return packageFact(pkg, await visibleCompositionNames(pkg.id));
}

async function visibleCompositionNames(packageDbId: number): Promise<string[]> {
  const comps = await db.select({
    name: productRegistry.name,
    productStatus: productRegistry.status,
    productVisibility: productRegistry.visibility,
  }).from(packageProducts)
    .innerJoin(productRegistry, eq(packageProducts.productId, productRegistry.id))
    .where(eq(packageProducts.packageId, packageDbId));
  return comps
    .filter((c) => c.productStatus === "ACTIVE" && c.productVisibility !== "INTERNAL_ONLY")
    .map((c) => c.name);
}

function packageFact(pkg: any, visibleCompositionNames: string[]): EligiblePackageFact | null {
  if (pkg.status !== "ACTIVE") return null;
  if (pkg.gaiaEnabled !== true) return null;
  if (!((pkg.price ?? 0) > 0)) return null;
  if (visibleCompositionNames.length === 0) return null;

  // Live WA order CTA using CURRENT rotated contact (never a build-time value).
  const wa = getWaContact().primary;
  const message =
    `Halo Gustafta, saya ingin memesan paket berikut:\n` +
    `\u2022 Paket: ${pkg.name}\n` +
    `\u2022 ID Paket: ${pkg.packageId}\n` +
    `\u2022 Versi: v${pkg.version}\n` +
    `\u2022 Harga: Rp ${Number(pkg.price || 0).toLocaleString("id-ID")} / ${pkg.durationValue} ${pkg.durationUnit === "MONTH" ? "bulan" : pkg.durationUnit}\n` +
    `Nama saya: ___\nMohon info cara pembayarannya. Terima kasih.`;

  return {
    canonicalKind: "package",
    canonicalId: pkg.packageId,
    packageVersion: pkg.version,
    name: pkg.name,
    slug: pkg.slug,
    description: pkg.description ?? null,
    category: null,
    price: pkg.price ?? 0,
    currency: pkg.currency || "IDR",
    durationValue: pkg.durationValue,
    durationUnit: pkg.durationUnit,
    ctaUrl: `https://wa.me/${wa}?text=${encodeURIComponent(message)}`,
    ctaLabel: "Pesan Paket",
    ctaEvent: "lead",
    compositionCount: visibleCompositionNames.length,
    corpus: packageCorpus(pkg, visibleCompositionNames),
  };
}

/** Resolve current canonical fact for a campaign item, or null if not eligible. */
async function resolveItemFact(item: {
  itemKind: string; canonicalId: string;
}): Promise<EligibleFact | null> {
  if (item.itemKind === "product") return resolveEligibleProduct(item.canonicalId);
  if (item.itemKind === "package") return resolveEligiblePackage(item.canonicalId);
  return null;
}

// ── Public payload shaping (built from CURRENT canonical facts) ────────────────
function publicItem(role: string, fact: EligibleFact) {
  return {
    canonicalKind: fact.canonicalKind,
    canonicalId: fact.canonicalId,
    role,
    name: fact.name,
    description: fact.description ?? undefined,
    category: fact.category ?? undefined,
    price: fact.price,
    currency: fact.currency,
    ctaUrl: fact.ctaUrl,
    ctaLabel: fact.ctaLabel,
    ctaEvent: fact.ctaEvent ?? undefined,
  };
}

function publicCampaign(campaign: any, resolved: Array<{ role: string; fact: EligibleFact }>) {
  return {
    id: campaign.id,
    name: campaign.name,
    hook: campaign.hook,
    ctaLabel: campaign.cta,
    selectionReason: campaign.reason,
    placements: campaign.placements,
    items: resolved.map((r) => publicItem(r.role, r.fact)),
  };
}

// ── Aggregate signals + funnel ─────────────────────────────────────────────────
async function funnelForCampaign(campaignId: number, days: number): Promise<FunnelCounts> {
  const rows = await db.select({
    eventType: promotionEvents.eventType,
    count: sql<number>`count(*)::int`,
  }).from(promotionEvents)
    .where(and(
      eq(promotionEvents.campaignId, campaignId),
      gte(promotionEvents.createdAt, sql`now() - (${days} || ' days')::interval`),
    ))
    .groupBy(promotionEvents.eventType);
  const funnel = emptyFunnel();
  for (const r of rows) {
    if (r.eventType in funnel && r.eventType !== "order") (funnel as any)[r.eventType] = Number(r.count) || 0;
  }
  // Order count derived from attributed PAID/COMPLETED store_orders only.
  const rev = await campaignRevenue(campaignId, days);
  funnel.order = rev.orders;
  return funnel;
}

// ── Zod for public event write ─────────────────────────────────────────────────
const zPublicEvent = z.object({
  eventId: z.string().min(1).max(MAX_EVENT_ID),
  campaignId: z.union([z.number().int().positive(), z.string()]).optional().nullable()
    .transform((v) => (v == null || v === "" ? null : Number(v)))
    .refine((v) => v == null || (Number.isFinite(v) && v > 0), "campaignId tidak valid"),
  eventType: z.enum(PROMOTION_PUBLIC_EVENT_TYPES),
  placement: z.enum(PROMOTION_PLACEMENTS),
  itemRole: z.enum(PROMOTION_ITEM_ROLES).optional().nullable(),
  // Frontend-normalized canonical identity OR legacy productId/packageId.
  canonicalKind: z.enum(PROMOTION_ITEM_KINDS).optional().nullable(),
  canonicalId: z.union([z.string(), z.number()]).optional().nullable()
    .transform((v) => (v == null ? null : String(v))),
  productId: z.string().max(40).optional().nullable(),
  packageId: z.string().max(60).optional().nullable(),
  sessionId: z.string().min(1).max(MAX_SESSION_ID).optional().nullable(),
  // Raw search query is accepted ONLY transiently for classification.
  searchQuery: z.string().max(MAX_SEARCH_QUERY).optional().nullable(),
}).strip();

const zPromotionCheckout = z.object({
  campaignId: z.union([z.number().int().positive(), z.string()])
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0, "campaignId tidak valid"),
  promotionEventId: z.string().min(1).max(MAX_EVENT_ID),
  placement: z.enum(PROMOTION_PLACEMENTS),
  canonicalKind: z.enum(PROMOTION_ITEM_KINDS),
  canonicalId: z.union([z.string(), z.number()]).transform((v) => String(v)),
  buyer: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(30).default(""),
  }),
}).strip();

// Rate limiter (public event writes) — lazy shared/postgres with memory fallback.
let _rateStore: any = null;
let _memStore: any = null;
async function rateLimitPublic(key: string): Promise<boolean> {
  const WINDOW_MS = 60_000;
  const LIMIT = (() => {
    const n = parseInt(process.env.PROMOTION_EVENT_RATE_LIMIT_PER_MIN ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : 120;
  })();
  const now = Date.now();
  try {
    if (!_rateStore) {
      const { PostgresRateLimitStore } = await import("./lib/rate-limiter");
      _rateStore = new PostgresRateLimitStore(async (text: string, params: any[]) => pool.query(text, params));
    }
    const hit = await _rateStore.hit(`promo-events:${key}`, WINDOW_MS, now);
    return hit.count <= LIMIT;
  } catch {
    if (!_memStore) {
      const { InMemoryRateLimitStore } = await import("./lib/rate-limiter");
      _memStore = new InMemoryRateLimitStore();
    }
    const hit = await _memStore.hit(`promo-events:${key}`, WINDOW_MS, now);
    return hit.count <= LIMIT;
  }
}

function slugify(name: string): string {
  return String(name).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80)
    || `campaign-${Date.now()}`;
}

// ── Route registration ─────────────────────────────────────────────────────────
export function registerPromotionEngineRoutes(app: Express, deps: {
  isAuthenticated: any;
  getDbRole: (req: any) => Promise<string>;
}) {
  const { isAuthenticated, getDbRole } = deps;

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ error: "Tidak terautentikasi" });
    try {
      const role = await getDbRole(req);
      if (role !== "admin" && role !== "superadmin") {
        return res.status(403).json({ error: "Akses ditolak. Hanya admin." });
      }
      next();
    } catch {
      return res.status(403).json({ error: "Akses ditolak." });
    }
  };

  const adminGuard = [isAuthenticated, requireAdmin];
  const actor = (req: any): string =>
    req.user?.claims?.sub || req.user?.id || "unknown";

  // ─── PUBLIC: GET /api/promotions/active?placement=homepage|store ────────────
  app.get("/api/promotions/active", async (req: Request, res: Response) => {
    try {
      const placement = String(req.query.placement || "");
      if (!PROMOTION_PLACEMENTS.includes(placement as PromotionPlacement)) {
        return res.status(400).json({ error: "placement harus homepage atau store" });
      }
      const now = new Date();
      const candidates = await db.select().from(promotionCampaigns)
        .where(and(
          eq(promotionCampaigns.status, "ACTIVE"),
          sql`${placement} = ANY(${promotionCampaigns.placements})`,
          lte(promotionCampaigns.startsAt, now),
          gte(promotionCampaigns.endsAt, now),
        ))
        .orderBy(
          desc(promotionCampaigns.startsAt),
          desc(promotionCampaigns.publishedAt),
          desc(promotionCampaigns.id),
        )
        .limit(5);

      res.set("Cache-Control", "public, max-age=15");

      for (const campaign of candidates) {
        const items = await db.select().from(promotionCampaignItems)
          .where(eq(promotionCampaignItems.campaignId, campaign.id))
          .orderBy(asc(promotionCampaignItems.sortOrder));
        const resolved = await Promise.all(items.map(async (it) => ({
          role: it.role,
          fact: await resolveItemFact(it),
        })));
        const primary = resolved.find((r) => r.role === "primary");
        // Fail safely: primary MUST still be eligible.
        if (!primary || !primary.fact) continue;
        const supports = resolved.filter((r) => r.role === "support" && r.fact);
        const ordered = [primary, ...supports] as Array<{ role: string; fact: EligibleFact }>;
        return res.json({ campaign: publicCampaign(campaign, ordered) });
      }
      return res.json({ campaign: null });
    } catch {
      // Fail safe — never surface an error page to a public placement.
      return res.json({ campaign: null });
    }
  });

  // ─── PUBLIC: POST /api/promotions/events ────────────────────────────────────
  app.post("/api/promotions/events", async (req: Request, res: Response) => {
    try {
      // IP used transiently for rate limiting ONLY — never stored.
      const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
        || req.socket?.remoteAddress || "unknown";
      // The shared limiter persists its key, so hash the transient IP first.
      // This preserves abuse protection without retaining the raw address.
      const allowed = await rateLimitPublic(hashSessionId(ip));
      if (!allowed) return res.status(429).json({ error: "Terlalu banyak permintaan." });

      const parsed = zPublicEvent.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
      }
      const d = parsed.data;

      // Normalize to exactly one canonical identity. A caller may not smuggle a
      // second arbitrary identity alongside a valid campaign item.
      let productId = d.productId ?? null;
      let packageId = d.packageId ?? null;
      if (d.canonicalKind === "product" && d.canonicalId) {
        if (productId && productId !== d.canonicalId) {
          return res.status(400).json({ error: "Identitas produk bertentangan." });
        }
        productId = d.canonicalId;
      }
      if (d.canonicalKind === "package" && d.canonicalId) {
        if (packageId && packageId !== d.canonicalId) {
          return res.status(400).json({ error: "Identitas paket bertentangan." });
        }
        packageId = d.canonicalId;
      }
      if (productId && packageId) {
        return res.status(400).json({ error: "Event hanya boleh merujuk satu item kanonik." });
      }

      // Validate a provided campaign: must be ACTIVE, in schedule, include placement.
      let itemRole: string | null = d.itemRole ?? null;
      let campaignProblem: string | null = null;
      let campaignSegment: string | null = null;
      if (d.campaignId != null) {
        const now = new Date();
        const [campaign] = await db.select().from(promotionCampaigns)
          .where(eq(promotionCampaigns.id, d.campaignId));
        if (!campaign || campaign.status !== "ACTIVE"
          || campaign.startsAt > now || campaign.endsAt < now
          || !(campaign.placements as string[]).includes(d.placement)) {
          return res.status(409).json({ error: "Kampanye tidak aktif untuk placement ini." });
        }
        campaignProblem = campaign.problem;
        campaignSegment = campaign.segment;
        if (!productId && !packageId) {
          return res.status(400).json({ error: "Event kampanye wajib merujuk satu item kanonik." });
        }
        const items = await db.select().from(promotionCampaignItems)
          .where(eq(promotionCampaignItems.campaignId, d.campaignId));
        const match = items.find((it) => productId
          ? it.itemKind === "product" && it.productId === productId
          : it.itemKind === "package" && it.packageId === packageId);
        if (!match) return res.status(409).json({ error: "Item tidak termasuk dalam kampanye." });
        productId = match.itemKind === "product" ? match.productId : null;
        packageId = match.itemKind === "package" ? match.packageId : null;
        itemRole = match.role;
      } else {
        // No campaign → only accept a classified general search/return_visit.
        if (d.eventType !== "search" && d.eventType !== "return_visit") {
          return res.status(400).json({ error: "Event tanpa kampanye hanya untuk search/return_visit." });
        }
        productId = null;
        packageId = null;
        itemRole = null;
      }

      // Classify search transiently; NEVER persist the raw query text.
      let problem: string | null = null;
      let segment: string | null = null;
      if (d.eventType === "search") {
        const c = classifySearchQuery(d.searchQuery || "");
        problem = c.problem;
        segment = c.segment;
      } else if (d.eventType === "return_visit" && d.campaignId != null) {
        problem = campaignProblem;
        segment = campaignSegment;
      }

      const sessionHash = d.sessionId ? hashSessionId(d.sessionId) : null;
      // The caller's idempotency key is transient input. Persist only its stable
      // digest so a malicious client cannot put raw search text/PII in the ledger.
      const persistedEventId = hashSessionId(`promotion-event:${d.eventId}`);

      // Append-only insert; globally-unique eventId dedupes retries.
      // amount/order are impossible here (public enum excludes "order").
      try {
        await db.insert(promotionEvents).values({
          eventId: persistedEventId,
          campaignId: d.campaignId ?? null,
          eventType: d.eventType,
          placement: d.placement,
          problem,
          segment,
          itemRole,
          productId,
          packageId,
          sessionHash,
          amount: null,
        });
      } catch (e: any) {
        if (String(e?.code) === "23505") return res.json({ ok: true, deduped: true });
        throw e;
      }
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ error: "Gagal mencatat event" });
    }
  });

  // ─── PUBLIC: POST /api/promotions/checkout ─────────────────────────────────
  // First-party adapter for an attributed campaign click. It never exposes the
  // server-to-server ORDER_API_KEY; the canonical order helper still validates
  // the live registry item and exact campaign/event/item relationship.
  app.post("/api/promotions/checkout", async (req: Request, res: Response) => {
    try {
      const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
        || req.socket?.remoteAddress || "unknown";
      const allowed = await rateLimitPublic(hashSessionId(`checkout:${ip}`));
      if (!allowed) return res.status(429).json({ error: "Terlalu banyak permintaan." });

      const parsed = zPromotionCheckout.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
      }
      const d = parsed.data;
      const { createCanonicalOrder } = await import("./order-api");
      const result = await createCanonicalOrder({
        campaignId: d.campaignId,
        promotionEventId: d.promotionEventId,
        productId: d.canonicalKind === "product" ? d.canonicalId : undefined,
        packageId: d.canonicalKind === "package" ? d.canonicalId : undefined,
        buyer: d.buyer,
      });
      return res.status(result.status).json(result.payload);
    } catch {
      return res.status(500).json({ error: "Gagal membuat pesanan promosi." });
    }
  });

  // ─── ADMIN: GET /api/admin/promotions/catalog ───────────────────────────────
  app.get("/api/admin/promotions/catalog", ...adminGuard, async (_req: any, res: any) => {
    try {
      const facts = await loadEligibleFacts();
      const products = facts.filter((f) => f.canonicalKind === "product");
      const packages = facts.filter((f) => f.canonicalKind === "package");
      res.json({
        placements: PROMOTION_PLACEMENTS,
        segments: PROMOTION_SEGMENTS,
        problems: PROMOTION_PROBLEMS,
        items: facts.map(catalogItem),
        products: products.map(catalogItem),
        packages: packages.map(catalogItem),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── ADMIN: GET /api/admin/promotions/recommendations ───────────────────────
  app.get("/api/admin/promotions/recommendations", ...adminGuard, async (_req: any, res: any) => {
    try {
      const recommendations = await buildRecommendations();
      res.json({ recommendations, methodology: RECOMMENDATION_METHODOLOGY });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── ADMIN: GET /api/admin/promotions/overview ──────────────────────────────
  app.get("/api/admin/promotions/overview", ...adminGuard, async (_req: any, res: any) => {
    try {
      const [signals7, signals30, funnel7, funnel30, recommendations] = await Promise.all([
        aggregateSignals(7),
        aggregateSignals(30),
        globalFunnel(7),
        globalFunnel(30),
        buildRecommendations(),
      ]);
      res.json({
        windowDays: [7, 30],
        windows: { 7: funnel7, 30: funnel30 },
        signals: { last7d: signals7, last30d: signals30 },
        funnel: { last7d: funnel7, last30d: funnel30 },
        recommendations,
        methodology: RECOMMENDATION_METHODOLOGY,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── ADMIN: GET /api/admin/promotions/campaigns ─────────────────────────────
  app.get("/api/admin/promotions/campaigns", ...adminGuard, async (_req: any, res: any) => {
    try {
      const rows = await db.select().from(promotionCampaigns).orderBy(desc(promotionCampaigns.id));
      const campaigns = await Promise.all(rows.map(async (c) => {
        const items = await db.select().from(promotionCampaignItems)
          .where(eq(promotionCampaignItems.campaignId, c.id))
          .orderBy(asc(promotionCampaignItems.sortOrder));
        const [f7, f30, revenue30] = await Promise.all([
          funnelForCampaign(c.id, 7),
          funnelForCampaign(c.id, 30),
          campaignRevenue(c.id, 30),
        ]);
        const resolved = await Promise.all(items.map(async (it) => ({ it, fact: await resolveItemFact(it) })));
        return {
          ...c,
          // Normalized item shape from CURRENT facts, plus retained snapshot for history.
          items: resolved.map(({ it, fact }) => ({
            ...(fact ? publicItem(it.role, fact) : {
              canonicalKind: it.itemKind, canonicalId: it.canonicalId, role: it.role,
            }),
            eligibility: fact ? "eligible" : "no_longer_eligible",
            snapshot: it.snapshot,
          })),
          performance: { funnel7d: f7, funnel30d: f30, revenue30d: revenue30 },
        };
      }));
      res.json({ campaigns, historyMinDays: PROMOTION_HISTORY_MIN_DAYS });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── ADMIN: POST /api/admin/promotions/campaigns (create DRAFT only) ─────────
  app.post("/api/admin/promotions/campaigns", ...adminGuard, async (req: any, res: any) => {
    try {
      const parsed = zCreateCampaign.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
      }
      const input = parsed.data;
      const shape = validateCampaignShape(input);
      if (!shape.ok) return res.status(400).json({ error: shape.error });

      const ctaLabel = input.ctaLabel || input.cta!;
      const reason = input.selectionReason || input.reason!;
      const segment = coerceSegment(input.segment || "general");

      // Resolve + snapshot each item's canonical fact at creation.
      const snapshots: Array<{
        role: string; itemKind: string; productId: string | null;
        packageId: string | null; packageVersion: number | null; canonicalId: string; snapshot: any;
      }> = [];
      let campaignProblem: PromotionProblem | undefined = input.problem;
      for (const it of input.items) {
        const fact = await resolveItemFact({ itemKind: it.canonicalKind, canonicalId: it.canonicalId });
        if (!fact) {
          return res.status(409).json({
            error: `Item ${it.canonicalKind} ${it.canonicalId} tidak eligible saat ini — tidak dapat dijadikan snapshot.`,
          });
        }
        // Derive problem from the primary item's corpus if not explicitly set.
        if (!campaignProblem && it.role === "primary") {
          campaignProblem = matchProblemForCorpus(fact.corpus) || "general_discovery";
        }
        snapshots.push({
          role: it.role,
          itemKind: it.canonicalKind,
          productId: fact.canonicalKind === "product" ? fact.canonicalId : null,
          packageId: fact.canonicalKind === "package" ? fact.canonicalId : null,
          packageVersion: fact.canonicalKind === "package" ? fact.packageVersion : null,
          canonicalId: fact.canonicalId,
          snapshot: fact,
        });
      }

      const slug = `${slugify(input.name)}-${Date.now().toString(36)}`;
      const created = await db.transaction(async (tx) => {
        const [campaign] = await tx.insert(promotionCampaigns).values({
          name: input.name,
          slug,
          placements: input.placements,
          segment,
          problem: campaignProblem || "general_discovery",
          hook: input.hook,
          cta: ctaLabel,
          reason,
          status: "DRAFT", // NEVER auto-publish.
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          createdBy: actor(req),
        }).returning();
        await tx.insert(promotionCampaignItems).values(snapshots.map((s, idx) => ({
          campaignId: campaign.id,
          role: s.role,
          itemKind: s.itemKind,
          productId: s.productId,
          packageId: s.packageId,
          packageVersion: s.packageVersion,
          canonicalId: s.canonicalId,
          snapshot: s.snapshot,
          sortOrder: idx,
        })));
        return campaign;
      });
      res.status(201).json({ campaign: created, status: "DRAFT", note: "Draft dibuat; publish manual diperlukan." });
    } catch (err: any) {
      if (String(err.code) === "23505") {
        return res.status(409).json({ error: "Item duplikat atau lebih dari satu primary." });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // ─── ADMIN: POST /api/admin/promotions/campaigns/:id/publish ────────────────
  app.post("/api/admin/promotions/campaigns/:id/publish", ...adminGuard, async (req: any, res: any) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "id tidak valid" });
    try {
      const result = await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(${PUBLISH_ADVISORY_LOCK_KEY})`);
        const [campaign] = await tx.select().from(promotionCampaigns)
          .where(eq(promotionCampaigns.id, id));
        if (!campaign) return { httpStatus: 404, body: { error: "Kampanye tidak ditemukan" } };
        if (campaign.status === "ACTIVE") {
          return { httpStatus: 409, body: { error: "Kampanye sudah aktif." } };
        }
        if (campaign.status === "ARCHIVED") {
          return { httpStatus: 409, body: { error: "Kampanye arsip tidak dapat dipublish." } };
        }
        const publishNow = new Date();
        const windowState = campaignWindowState(campaign, publishNow);
        if (windowState === "EXPIRED") {
          return { httpStatus: 409, body: { error: "Jadwal kampanye sudah berakhir — perbarui jadwal sebelum publish." } };
        }

        const items = await tx.select().from(promotionCampaignItems)
          .where(eq(promotionCampaignItems.campaignId, id));
        for (const it of items) {
          const fact = await resolveItemFact(it);
          if (!fact) {
            return {
              httpStatus: 409,
              body: { error: `Item ${it.itemKind} ${it.canonicalId} tidak lagi eligible — publish dibatalkan.` },
            };
          }
        }
        const primaries = items.filter((i) => i.role === "primary").length;
        if (primaries !== 1) {
          return { httpStatus: 409, body: { error: "Kampanye harus punya tepat 1 primary." } };
        }

        // A future campaign becomes ACTIVE as a scheduled candidate but must not
        // pause the campaign serving users today. Once its start arrives, the
        // public resolver picks it because it orders eligible windows by the
        // latest startsAt. Only a campaign that is CURRENT at publish time
        // replaces other campaigns currently serving the same placement.
        const transition = await applyCampaignPublishTransition(
          tx,
          campaign,
          actor(req),
          publishNow,
        );
        const published = transition.published!;
        return { httpStatus: 200, body: { campaign: published } };
      });
      return res.status(result.httpStatus).json(result.body);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── ADMIN: POST /api/admin/promotions/campaigns/:id/pause ──────────────────
  app.post("/api/admin/promotions/campaigns/:id/pause", ...adminGuard, async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      const [campaign] = await db.select().from(promotionCampaigns).where(eq(promotionCampaigns.id, id));
      if (!campaign) return res.status(404).json({ error: "Kampanye tidak ditemukan" });
      if (campaign.status !== "ACTIVE") {
        return res.status(409).json({ error: "Hanya kampanye aktif yang dapat dijeda." });
      }
      const [paused] = await db.update(promotionCampaigns).set({
        status: "PAUSED",
        pausedBy: actor(req),
        pausedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(promotionCampaigns.id, id)).returning();
      res.json({ campaign: paused });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // NOTE: intentionally NO delete route — history is retained (≥30 days).
}

// ── Catalog item shape ──────────────────────────────────────────────────────────
function catalogItem(f: EligibleFact) {
  return {
    canonicalKind: f.canonicalKind,
    canonicalId: f.canonicalId,
    name: f.name,
    description: f.description ?? undefined,
    category: f.category ?? undefined,
    type: f.canonicalKind === "product" ? f.productType : "package",
    price: f.price,
    currency: f.currency,
    ctaUrl: f.ctaUrl,
    ctaLabel: f.ctaLabel,
    ctaEvent: f.ctaEvent ?? undefined,
    eligibility: "eligible",
  };
}

// ── Load all currently-eligible canonical facts (products + packages) ──────────
async function loadEligibleFacts(): Promise<EligibleFact[]> {
  const [products, packages] = await Promise.all([
    db.select().from(productRegistry).where(eq(productRegistry.status, "ACTIVE")).orderBy(asc(productRegistry.name)),
    db.select().from(packageRegistry).where(eq(packageRegistry.status, "ACTIVE")).orderBy(asc(packageRegistry.name)),
  ]);
  const facts: EligibleFact[] = [];
  for (const p of products) {
    const f = productFact(p);
    if (f) facts.push(f);
  }
  for (const pkg of packages) {
    const f = packageFact(pkg, await visibleCompositionNames(pkg.id));
    if (f) facts.push(f);
  }
  return facts;
}

// ── Aggregate signal helpers ─────────────────────────────────────────────────
async function aggregateSignals(days: number): Promise<Array<{
  problem: string; segment: string; demand: number;
}>> {
  const rows = await db.select({
    problem: promotionEvents.problem,
    segment: promotionEvents.segment,
    count: sql<number>`count(*)::int`,
  }).from(promotionEvents)
    .where(and(
      inArray(promotionEvents.eventType, ["search", "return_visit"]),
      isNotNull(promotionEvents.problem),
      gte(promotionEvents.createdAt, sql`now() - (${days} || ' days')::interval`),
    ))
    .groupBy(promotionEvents.problem, promotionEvents.segment)
    .orderBy(desc(sql`count(*)`));
  return rows.map((r) => ({
    problem: r.problem || "general_discovery",
    segment: r.segment || "general",
    demand: Number(r.count) || 0,
  }));
}

async function globalFunnel(days: number): Promise<FunnelCounts> {
  const rows = await db.select({
    eventType: promotionEvents.eventType,
    count: sql<number>`count(*)::int`,
  }).from(promotionEvents)
    .where(gte(promotionEvents.createdAt, sql`now() - (${days} || ' days')::interval`))
    .groupBy(promotionEvents.eventType);
  const funnel = emptyFunnel();
  for (const r of rows) {
    if (r.eventType in funnel && r.eventType !== "order") (funnel as any)[r.eventType] = Number(r.count) || 0;
  }
  // Order count derived from attributed PAID/COMPLETED store_orders (not events).
  const [orderRow] = await db.select({ count: sql<number>`count(*)::int` })
    .from(storeOrders)
    .where(and(
      isNotNull(storeOrders.promotionCampaignId),
      inArray(storeOrders.status, PAID_ORDER_STATUSES as unknown as string[]),
      gte(storeOrders.createdAt, sql`now() - (${days} || ' days')::interval`),
    ));
  funnel.order = Number(orderRow?.count) || 0;
  return funnel;
}

/** Paid/completed orders + revenue attributed to a campaign (business outcomes only). */
async function campaignRevenue(campaignId: number, days: number): Promise<{ orders: number; revenue: number }> {
  const [row] = await db.select({
    orders: sql<number>`count(*)::int`,
    revenue: sql<number>`coalesce(sum(${storeOrders.amount}), 0)::int`,
  }).from(storeOrders)
    .where(and(
      eq(storeOrders.promotionCampaignId, campaignId),
      inArray(storeOrders.status, PAID_ORDER_STATUSES as unknown as string[]),
      gte(storeOrders.createdAt, sql`now() - (${days} || ' days')::interval`),
    ));
  return { orders: Number(row?.orders) || 0, revenue: Number(row?.revenue) || 0 };
}

// Prior per-item performance (impressions/clicks + attributed paid orders), 30d.
async function itemPerformance30d(): Promise<Map<string, { impressions: number; clicks: number; orders: number }>> {
  const map = new Map<string, { impressions: number; clicks: number; orders: number }>();
  const rows = await db.select({
    productId: promotionEvents.productId,
    packageId: promotionEvents.packageId,
    eventType: promotionEvents.eventType,
    count: sql<number>`count(*)::int`,
  }).from(promotionEvents)
    .where(and(
      inArray(promotionEvents.eventType, ["impression", "click"]),
      gte(promotionEvents.createdAt, sql`now() - '30 days'::interval`),
    ))
    .groupBy(promotionEvents.productId, promotionEvents.packageId, promotionEvents.eventType);
  for (const r of rows) {
    const key = r.productId ? `product:${r.productId}` : r.packageId ? `package:${r.packageId}` : null;
    if (!key) continue;
    const e = map.get(key) || { impressions: 0, clicks: 0, orders: 0 };
    if (r.eventType === "impression") e.impressions += Number(r.count) || 0;
    if (r.eventType === "click") e.clicks += Number(r.count) || 0;
    map.set(key, e);
  }
  // An order only contributes to an item's conversion score when its
  // promotion_event_id was verified and linked to that exact canonical item.
  const orderRows = await db.select({
    productId: promotionEvents.productId,
    packageId: promotionEvents.packageId,
    count: sql<number>`count(*)::int`,
  }).from(storeOrders)
    .innerJoin(promotionEvents, eq(storeOrders.promotionEventId, promotionEvents.eventId))
    .where(and(
      isNotNull(storeOrders.promotionCampaignId),
      inArray(storeOrders.status, PAID_ORDER_STATUSES as unknown as string[]),
      gte(storeOrders.createdAt, sql`now() - '30 days'::interval`),
    ))
    .groupBy(promotionEvents.productId, promotionEvents.packageId);
  for (const r of orderRows) {
    const key = r.productId ? `product:${r.productId}` : r.packageId ? `package:${r.packageId}` : null;
    if (!key) continue;
    const e = map.get(key) || { impressions: 0, clicks: 0, orders: 0 };
    e.orders += Number(r.count) || 0;
    map.set(key, e);
  }
  return map;
}

const RECOMMENDATION_METHODOLOGY =
  "Skor transparan berbasis aturan (tanpa ML): demand cocok (search + return_visit " +
  "7 & 30 hari) 50%, readiness (eligibilitas kanonik) 30%, prior performance " +
  "(CTR + konversi kampanye sebelumnya milik item ini) 20%. Kandidat hanya produk/paket " +
  "kanonik yang siap. Laporan kebutuhan pasar harian terbaru hanya dipakai sebagai bukti " +
  "pendukung untuk product_id kanonik yang direkomendasikan — tidak menyuntik fakta komersial eksternal.";

/**
 * Transparent, rule-based recommendations that return READY canonical SOLUTIONS
 * (never needs, never non-eligible items). Aggregate problem/segment demand is
 * matched to eligible candidates using ONLY registry fields, then each candidate
 * is scored from matched 7/30d demand, readiness, its own prior campaign
 * performance, and — when available — the latest daily report's canonical
 * recommended product IDs (as a small evidence boost, no fabricated facts).
 */
async function buildRecommendations(): Promise<Array<Record<string, unknown>>> {
  const [facts, signals7, signals30, perf] = await Promise.all([
    loadEligibleFacts(),
    aggregateSignals(7),
    aggregateSignals(30),
    itemPerformance30d(),
  ]);

  // Demand per problem (with dominant segment) over each window.
  const demand7 = demandByProblem(signals7);
  const demand30 = demandByProblem(signals30);

  // Latest daily report → set of canonical recommended product IDs (evidence).
  const reportProductIds = new Set<string>();
  let reportDate: string | null = null;
  try {
    const [report] = await listMarketNeedsReports(1);
    if (report) {
      reportDate = report.reportDate;
      for (const rec of report.payload?.recommendations ?? []) {
        const pid = (rec as any)?.product?.id;
        if (typeof pid === "string" && pid) reportProductIds.add(pid);
      }
    }
  } catch { /* report is optional evidence */ }

  const candidates = facts.map((fact) => {
    const problem = matchProblemForCorpus(fact.corpus) || "general_discovery";
    const seg7 = demand7.get(problem);
    const seg30 = demand30.get(problem);
    const key = `${fact.canonicalKind}:${fact.canonicalId}`;
    const p = perf.get(key) || { impressions: 0, clicks: 0, orders: 0 };
    // Attributed paid orders for this canonical item are counted separately below.
    const scored = scoreCandidate({
      demand7d: seg7?.demand || 0,
      demand30d: seg30?.demand || 0,
      ready: true, // only eligible facts reach here
      clicks30d: p.clicks,
      impressions30d: p.impressions,
      orders30d: p.orders,
    });
    const reasons: string[] = [];
    if ((seg7?.demand || 0) > 0) reasons.push(`Permintaan tercocokkan ${seg7!.demand} sinyal (7 hari) untuk ${problem}.`);
    if ((seg30?.demand || 0) > 0) reasons.push(`Permintaan ${seg30!.demand} sinyal (30 hari) untuk ${problem}.`);
    if (p.impressions > 0) reasons.push(`Prior performance: ${p.clicks}/${p.impressions} klik/impresi (30 hari).`);
    reasons.push("Produk/paket kanonik ini saat ini eligible (siap dipromosikan).");
    let evidenceBoost = 0;
    if (fact.canonicalKind === "product" && reportProductIds.has(fact.canonicalId)) {
      evidenceBoost = 5;
      reasons.push(`Didukung laporan kebutuhan pasar harian (${reportDate}).`);
    }
    const finalScore = Number(Math.min(100, scored.score + evidenceBoost).toFixed(2));
    return {
      canonicalKind: fact.canonicalKind,
      canonicalId: fact.canonicalId,
      name: fact.name,
      description: fact.description ?? undefined,
      category: fact.category ?? undefined,
      price: fact.price,
      currency: fact.currency,
      ctaUrl: fact.ctaUrl,
      ctaLabel: fact.ctaLabel,
      problem,
      segment: seg30?.segment || seg7?.segment || "general",
      score: finalScore,
      confidence: scored.confidence,
      breakdown: { ...scored.breakdown, externalEvidence: evidenceBoost },
      reasons,
    };
  });

  candidates.sort((a, b) => Number(b.score) - Number(a.score));
  return candidates.slice(0, 3);
}

function demandByProblem(signals: Array<{ problem: string; segment: string; demand: number }>):
  Map<string, { demand: number; segment: string }> {
  const map = new Map<string, { demand: number; segment: string }>();
  for (const s of signals) {
    const cur = map.get(s.problem);
    if (!cur) map.set(s.problem, { demand: s.demand, segment: s.segment });
    else {
      cur.demand += s.demand;
      // Track dominant segment (first is highest by count due to ORDER BY).
    }
  }
  return map;
}

// ── Order attribution (called from order routes) ────────────────────────────────
/**
 * Validate an optional promotion campaign + canonical item server-side and return
 * the attribution to stamp on an order. Never trusts any client amount.
 *
 * Attribution is ONLY stamped when the ordered item can be mapped to a canonical
 * product_registry/package_registry id that is one of the campaign's items. A
 * legacy store_products/agent order that cannot map to the registry receives NO
 * campaign attribution, even if the campaign id is active.
 */
export async function resolveOrderAttribution(input: {
  campaignId?: number | null;
  promotionEventId?: string | null;
  productId?: string | null;   // product_registry.product_id
  packageId?: string | null;   // package_registry.package_id
}): Promise<{ promotionCampaignId: number | null; promotionEventId: string | null }> {
  const noAttribution = { promotionCampaignId: null, promotionEventId: null };
  const campaignId = input.campaignId;
  if (!campaignId || !Number.isFinite(campaignId)) return noAttribution;
  // Must be able to identify the ordered canonical item.
  if (!input.productId && !input.packageId) return noAttribution;
  if (input.productId && input.packageId) return noAttribution;

  const now = new Date();
  const [campaign] = await db.select().from(promotionCampaigns).where(eq(promotionCampaigns.id, campaignId));
  if (!campaign) return noAttribution;
  if (campaign.status !== "ACTIVE") return noAttribution;
  if (campaign.startsAt > now || campaign.endsAt < now) return noAttribution;

  // The ordered canonical item must be one of the campaign's items.
  const items = await db.select().from(promotionCampaignItems)
    .where(eq(promotionCampaignItems.campaignId, campaignId));
  const matchedItem = items.find((it) => input.productId
    ? it.itemKind === "product" && it.productId === input.productId
    : it.itemKind === "package" && it.packageId === input.packageId);
  if (!matchedItem) return noAttribution;

  let eventId: string | null = null;
  if (input.promotionEventId) {
    const rawEventId = String(input.promotionEventId).slice(0, MAX_EVENT_ID);
    const persistedEventId = hashSessionId(`promotion-event:${rawEventId}`);
    const [event] = await db.select({ eventId: promotionEvents.eventId })
      .from(promotionEvents)
      .where(and(
        eq(promotionEvents.eventId, persistedEventId),
        eq(promotionEvents.campaignId, campaign.id),
        matchedItem.itemKind === "product"
          ? eq(promotionEvents.productId, matchedItem.productId!)
          : eq(promotionEvents.packageId, matchedItem.packageId!),
        inArray(promotionEvents.eventType, ["click", "trial", "lead"]),
      ))
      .limit(1);
    if (!event) return noAttribution;
    eventId = event.eventId;
  }
  return { promotionCampaignId: campaign.id, promotionEventId: eventId };
}
