import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifySearchQuery,
  coerceSegment,
  hashSessionId,
  validateCampaignShape,
  scoreCandidate,
  safeOfficialUrl,
  matchProblemForCorpus,
  emptyFunnel,
  PROMOTION_PLACEMENTS,
  PROMOTION_PUBLIC_EVENT_TYPES,
  PROMOTION_EVENT_TYPES,
  PROMOTION_PROBLEMS,
  PROMOTION_SEGMENTS,
  PROMOTION_ITEM_ROLES,
  PAID_ORDER_STATUSES,
  zCreateCampaign,
  campaignWindowState,
  applyCampaignPublishTransition,
} from "../server/promotion-engine";

const __dirname = dirname(fileURLToPath(import.meta.url));
const engineSrc = readFileSync(resolve(__dirname, "../server/promotion-engine.ts"), "utf8");
const routesSrc = readFileSync(resolve(__dirname, "../server/routes.ts"), "utf8");
const orderApiSrc = readFileSync(resolve(__dirname, "../server/order-api.ts"), "utf8");
const schemaSrc = readFileSync(resolve(__dirname, "../shared/schema.ts"), "utf8");
const migrationSrc = readFileSync(resolve(__dirname, "../migrations/0020_promotion_engine.sql"), "utf8");
const journalSrc = readFileSync(resolve(__dirname, "../migrations/meta/_journal.json"), "utf8");
const publicUiSrc = readFileSync(resolve(__dirname, "../client/src/components/promotion-campaign.tsx"), "utf8");
const checkoutUiSrc = readFileSync(resolve(__dirname, "../client/src/pages/promotion-checkout.tsx"), "utf8");
const appUiSrc = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf8");
const adminUiSrc = readFileSync(resolve(__dirname, "../client/src/components/admin-promotion-engine.tsx"), "utf8");
const attributionUiSrc = readFileSync(resolve(__dirname, "../client/src/lib/promotion-attribution.ts"), "utf8");
const storeUiSrc = readFileSync(resolve(__dirname, "../client/src/pages/store.tsx"), "utf8");

// ── Migration + schema contract ────────────────────────────────────────────────
test("migration 0020 creates promotion tables + attribution columns and is registered", () => {
  assert.match(migrationSrc, /CREATE TABLE IF NOT EXISTS "promotion_campaigns"/);
  assert.match(migrationSrc, /CREATE TABLE IF NOT EXISTS "promotion_campaign_items"/);
  assert.match(migrationSrc, /CREATE TABLE IF NOT EXISTS "promotion_events"/);
  // placements is text[] NOT NULL with a bounded CHECK (1..2, subset of taxonomy).
  assert.match(migrationSrc, /"placements" text\[\] NOT NULL/);
  assert.match(migrationSrc, /"placements" <@ ARRAY\['homepage', 'store'\]/);
  // Deduped ledger: eventId is GLOBALLY unique (dedupe even when campaign_id NULL).
  assert.match(migrationSrc, /CREATE UNIQUE INDEX IF NOT EXISTS "uq_promotion_event_id"[\s\S]*?USING btree \("event_id"\)/);
  assert.doesNotMatch(migrationSrc, /uq_promotion_event_id[\s\S]*?"campaign_id", "event_id"/);
  // GIN index on placements for array overlap matching.
  assert.match(migrationSrc, /USING gin \("placements"\)/);
  // Exactly-one-primary partial unique index + unique canonical item per campaign.
  assert.match(migrationSrc, /uq_promotion_item_primary[\s\S]*?WHERE "role" = 'primary'/);
  assert.match(migrationSrc, /uq_promotion_item_canonical[\s\S]*?"campaign_id", "item_kind", "canonical_id"/);
  // item_role enum check on events.
  assert.match(migrationSrc, /promotion_events_item_role_check[\s\S]*?'primary', 'support'/);
  // Attribution columns on store_orders, additive + nullable.
  assert.match(migrationSrc, /ALTER TABLE "store_orders"[\s\S]*?ADD COLUMN IF NOT EXISTS "promotion_campaign_id"/);
  assert.match(migrationSrc, /ADD COLUMN IF NOT EXISTS "promotion_event_id"/);
  assert.match(journalSrc, /"tag": "0020_promotion_engine"/);
});

test("schema declares promotion tables, placements[], global-unique eventId, DB primary constraint", () => {
  assert.match(schemaSrc, /export const promotionCampaigns = pgTable\("promotion_campaigns"/);
  assert.match(schemaSrc, /export const promotionCampaignItems = pgTable\("promotion_campaign_items"/);
  assert.match(schemaSrc, /export const promotionEvents = pgTable\("promotion_events"/);
  assert.match(schemaSrc, /placements:\s+text\("placements"\)\.array\(\)\.notNull\(\)/);
  // eventId unique index is on eventId alone (global).
  assert.match(schemaSrc, /uniqueIndex\("uq_promotion_event_id"\)\.on\(table\.eventId\)/);
  // exactly-one-primary partial unique index.
  assert.match(schemaSrc, /uniqueIndex\("uq_promotion_item_primary"\)[\s\S]*?role = 'primary'/);
  assert.match(schemaSrc, /uniqueIndex\("uq_promotion_item_canonical"\)/);
  assert.match(schemaSrc, /canonicalId:\s+varchar\("canonical_id"/);
  assert.match(schemaSrc, /promotionCampaignId: integer\("promotion_campaign_id"\)/);
  assert.match(schemaSrc, /promotionEventId: varchar\("promotion_event_id"/);
});

// ── Route registration + guards ─────────────────────────────────────────────────
test("engine is registered from routes.ts with injected isAuthenticated/getDbRole", () => {
  assert.match(routesSrc, /import \{ registerPromotionEngineRoutes[^}]*\} from "\.\/promotion-engine"/);
  assert.match(routesSrc, /registerPromotionEngineRoutes\(app, \{ isAuthenticated, getDbRole \}\)/);
});

test("public routes are unguarded, admin routes require admin/superadmin", () => {
  assert.match(engineSrc, /app\.get\("\/api\/promotions\/active"/);
  assert.match(engineSrc, /app\.post\("\/api\/promotions\/events"/);
  assert.match(engineSrc, /role !== "admin" && role !== "superadmin"/);
  for (const literal of [
    'app.get("/api/admin/promotions/catalog", ...adminGuard',
    'app.get("/api/admin/promotions/recommendations", ...adminGuard',
    'app.get("/api/admin/promotions/overview", ...adminGuard',
    'app.get("/api/admin/promotions/campaigns", ...adminGuard',
    'app.post("/api/admin/promotions/campaigns", ...adminGuard',
    'app.post("/api/admin/promotions/campaigns/:id/publish", ...adminGuard',
    'app.post("/api/admin/promotions/campaigns/:id/pause", ...adminGuard',
  ]) {
    assert.ok(engineSrc.includes(literal), `Missing guarded route: ${literal}`);
  }
});

test("no delete route exists (history retained ≥30 days)", () => {
  assert.doesNotMatch(engineSrc, /app\.delete\(/);
  assert.match(engineSrc, /PROMOTION_HISTORY_MIN_DAYS/);
});

// ── Fixed taxonomies ─────────────────────────────────────────────────────────────
test("fixed taxonomies match the spec", () => {
  assert.deepEqual([...PROMOTION_PLACEMENTS], ["homepage", "store"]);
  assert.deepEqual([...PROMOTION_PUBLIC_EVENT_TYPES],
    ["impression", "click", "search", "trial", "lead", "return_visit"]);
  assert.ok(PROMOTION_EVENT_TYPES.includes("order"));
  assert.ok(!(PROMOTION_PUBLIC_EVENT_TYPES as readonly string[]).includes("order"));
  assert.deepEqual([...PROMOTION_ITEM_ROLES], ["primary", "support"]);
  assert.ok(PROMOTION_PROBLEMS.length >= 3);
  assert.ok(PROMOTION_SEGMENTS.includes("general"));
  // Paid outcome statuses used for revenue/funnel.
  assert.ok(PAID_ORDER_STATUSES.includes("paid"));
  assert.ok(PAID_ORDER_STATUSES.includes("completed"));
});

// ── Placements array contract ────────────────────────────────────────────────────
test("public active resolves by placement membership (= ANY) and payload includes placements", () => {
  const start = engineSrc.indexOf('app.get("/api/promotions/active"');
  const block = engineSrc.slice(start, start + 2400);
  assert.match(block, /= ANY\(\$\{promotionCampaigns\.placements\}\)/);
  // Public payload carries placements.
  assert.match(engineSrc, /placements: campaign\.placements/);
});

test("publish serializes activation and pauses only campaigns serving now", () => {
  const pubStart = engineSrc.indexOf('app.post("/api/admin/promotions/campaigns/:id/publish"');
  const pubBlock = engineSrc.slice(pubStart, pubStart + 4400);
  const transitionStart = engineSrc.indexOf("export async function applyCampaignPublishTransition");
  const transitionBlock = engineSrc.slice(transitionStart, transitionStart + 2400);
  assert.match(pubBlock, /pg_advisory_xact_lock/);
  assert.match(pubBlock, /applyCampaignPublishTransition/);
  assert.match(transitionBlock, /\$\{promotionCampaigns\.placements\} && \$\{campaign\.placements\}/);
  assert.match(transitionBlock, /if \(windowState === "CURRENT"\)/);
  assert.match(transitionBlock, /lte\(promotionCampaigns\.startsAt, publishNow\)/);
  assert.match(transitionBlock, /gte\(promotionCampaigns\.endsAt, publishNow\)/);
  assert.match(transitionBlock, /status: "PAUSED"/);
  assert.match(transitionBlock, /status: "ACTIVE"/);
});

test("future publication preserves today's campaign; expired publication is rejected", () => {
  const now = new Date("2026-08-22T09:00:00.000Z");
  assert.equal(campaignWindowState({
    startsAt: "2026-08-22T08:00:00.000Z",
    endsAt: "2026-08-22T10:00:00.000Z",
  }, now), "CURRENT");
  assert.equal(campaignWindowState({
    startsAt: "2026-08-23T08:00:00.000Z",
    endsAt: "2026-08-23T10:00:00.000Z",
  }, now), "FUTURE");
  assert.equal(campaignWindowState({
    startsAt: "2026-08-21T08:00:00.000Z",
    endsAt: "2026-08-21T10:00:00.000Z",
  }, now), "EXPIRED");

  const pubStart = engineSrc.indexOf('app.post("/api/admin/promotions/campaigns/:id/publish"');
  const pubBlock = engineSrc.slice(pubStart, pubStart + 4400);
  assert.match(pubBlock, /windowState === "EXPIRED"/);
  assert.match(pubBlock, /Jadwal kampanye sudah berakhir/);
  const activeStart = engineSrc.indexOf('app.get("/api/promotions/active"');
  const activeBlock = engineSrc.slice(activeStart, activeStart + 2400);
  assert.match(activeBlock, /desc\(promotionCampaigns\.startsAt\)/);
});

test("DB integration: a future overlapping publish keeps today's campaign, then takes over at its start", async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip("requires DATABASE_URL");
    return;
  }
  const [{ db }, schema, drizzle] = await Promise.all([
    import("../server/db"),
    import("../shared/schema"),
    import("drizzle-orm"),
  ]);
  const { promotionCampaigns } = schema;
  const { and, desc, eq, gte, inArray, lte, sql } = drizzle;
  const now = new Date("2026-08-22T09:00:00.000Z");
  const futureAt = new Date("2026-08-23T09:00:00.000Z");
  const nonce = `${process.pid}-${Date.now()}`;

  await db.transaction(async (tx) => {
    const rows = await tx.insert(promotionCampaigns).values([
      {
        name: `Current schedule test ${nonce}`,
        slug: `promotion-current-${nonce}`,
        placements: ["store"],
        segment: "general",
        problem: "general_discovery",
        hook: "Current",
        cta: "Current",
        reason: "Integration test",
        status: "ACTIVE",
        startsAt: new Date("2026-08-22T08:00:00.000Z"),
        endsAt: new Date("2026-08-24T10:00:00.000Z"),
        createdBy: "integration-test",
        publishedBy: "integration-test",
        publishedAt: new Date("2026-08-22T08:00:00.000Z"),
      },
      {
        name: `Future schedule test ${nonce}`,
        slug: `promotion-future-${nonce}`,
        placements: ["store"],
        segment: "general",
        problem: "general_discovery",
        hook: "Future",
        cta: "Future",
        reason: "Integration test",
        status: "DRAFT",
        startsAt: new Date("2026-08-23T08:00:00.000Z"),
        endsAt: new Date("2026-08-23T10:00:00.000Z"),
        createdBy: "integration-test",
      },
    ]).returning();
    const current = rows.find((row) => row.status === "ACTIVE")!;
    const future = rows.find((row) => row.status === "DRAFT")!;

    const transition = await applyCampaignPublishTransition(
      tx,
      future,
      "integration-test",
      now,
    );
    assert.equal(transition.windowState, "FUTURE");

    const statusRows = await tx.select({
      id: promotionCampaigns.id,
      status: promotionCampaigns.status,
    }).from(promotionCampaigns).where(inArray(promotionCampaigns.id, [current.id, future.id]));
    assert.deepEqual(new Map(statusRows.map((row) => [row.id, row.status])),
      new Map([[current.id, "ACTIVE"], [future.id, "ACTIVE"]]));

    const selectAt = async (at: Date) => {
      const [selected] = await tx.select().from(promotionCampaigns).where(and(
        eq(promotionCampaigns.status, "ACTIVE"),
        sql`${"store"} = ANY(${promotionCampaigns.placements})`,
        lte(promotionCampaigns.startsAt, at),
        gte(promotionCampaigns.endsAt, at),
      )).orderBy(
        desc(promotionCampaigns.startsAt),
        desc(promotionCampaigns.publishedAt),
        desc(promotionCampaigns.id),
      ).limit(1);
      return selected;
    };

    assert.equal((await selectAt(now)).id, current.id);
    assert.equal((await selectAt(futureAt)).id, future.id);
    await tx.delete(promotionCampaigns)
      .where(inArray(promotionCampaigns.id, [current.id, future.id]));
  });
});

// ── Event privacy + dedupe contract ──────────────────────────────────────────────
test("promotion_events rows carry no PII columns and dedupe on eventId", () => {
  const start = schemaSrc.indexOf('export const promotionEvents = pgTable("promotion_events"');
  const block = schemaSrc.slice(start, start + 2200);
  for (const forbidden of [/email/i, /phone/i, /"name"/i, /ip_address/i, /user_agent/i, /chat/i, /"query"/i, /raw_query/i]) {
    assert.doesNotMatch(block, forbidden, `promotion_events must not store ${forbidden}`);
  }
  assert.match(block, /sessionHash/);
});

test("IP is used transiently for rate limiting only and never stored", () => {
  assert.match(engineSrc, /never stored/i);
  assert.match(engineSrc, /rateLimitPublic\(hashSessionId\(ip\)\)/);
  // The event insert values block must not reference any ip variable.
  const insertStart = engineSrc.indexOf("await db.insert(promotionEvents).values({");
  const insertBlock = engineSrc.slice(insertStart, insertStart + 700);
  assert.doesNotMatch(insertBlock, /\bip\b/);
});

test("public event insert never persists amount/order and dedupes on unique violation", () => {
  assert.match(engineSrc, /amount: null/);
  assert.match(engineSrc, /23505[\s\S]*?deduped: true/);
  assert.match(engineSrc, /eventType: z\.enum\(PROMOTION_PUBLIC_EVENT_TYPES\)/);
});

test("public event schema accepts canonicalKind/canonicalId OR productId/packageId, campaignId optional", () => {
  // Accepts frontend-normalized canonical identity.
  assert.match(engineSrc, /canonicalKind: z\.enum\(PROMOTION_ITEM_KINDS\)/);
  assert.match(engineSrc, /canonicalId: z\.union/);
  // Translates to productId/packageId server-side.
  assert.match(engineSrc, /if \(d\.canonicalKind === "product" && d\.canonicalId\)[\s\S]*?productId = d\.canonicalId/);
  assert.match(engineSrc, /if \(d\.canonicalKind === "package" && d\.canonicalId\)[\s\S]*?packageId = d\.canonicalId/);
  // campaignId optional (general classified search recorded with null campaign).
  assert.match(engineSrc, /campaignId: z\.union\(\[z\.number\(\)\.int\(\)\.positive\(\), z\.string\(\)\]\)\.optional\(\)\.nullable\(\)/);
});

test("event with campaignId validates ACTIVE + schedule + placement + item membership", () => {
  const start = engineSrc.indexOf('app.post("/api/promotions/events"');
  const block = engineSrc.slice(start, start + 3200);
  assert.match(block, /campaign\.status !== "ACTIVE"/);
  assert.match(block, /campaign\.startsAt > now \|\| campaign\.endsAt < now/);
  assert.match(block, /!\(campaign\.placements as string\[\]\)\.includes\(d\.placement\)/);
  // Item id must belong to the campaign.
  assert.match(block, /Item tidak termasuk dalam kampanye/);
});

test("raw search query is classified but never stored", () => {
  assert.match(engineSrc, /classifySearchQuery\(d\.searchQuery/);
  assert.match(engineSrc, /NEVER persist the raw query/i);
  const insertStart = engineSrc.indexOf("await db.insert(promotionEvents).values({");
  const insertBlock = engineSrc.slice(insertStart, insertStart + 700);
  assert.doesNotMatch(insertBlock, /searchQuery/);
});

// ── classifySearchQuery (pure) ────────────────────────────────────────────────────
test("classifySearchQuery maps keywords to fixed taxonomies", () => {
  const tender = classifySearchQuery("cara ikut tender lpse untuk kontraktor");
  assert.equal(tender.problem, "tender_readiness");
  assert.equal(tender.segment, "contractor");

  const sbu = classifySearchQuery("urus sertifikat SBU SKK");
  assert.equal(sbu.problem, "certification_sbu_skk");

  const unknown = classifySearchQuery("halo apa kabar");
  assert.equal(unknown.problem, "general_discovery");
  assert.equal(unknown.segment, "general");

  const empty = classifySearchQuery("");
  assert.ok(PROMOTION_PROBLEMS.includes(empty.problem));
  assert.ok(PROMOTION_SEGMENTS.includes(empty.segment));
});

test("coerceSegment normalizes free-text segment to a fixed taxonomy key", () => {
  assert.equal(coerceSegment("contractor"), "contractor");
  assert.equal(coerceSegment("Kontraktor konstruksi"), "contractor");
  assert.equal(coerceSegment("random text"), "general");
  assert.ok(PROMOTION_SEGMENTS.includes(coerceSegment("")));
});

test("matchProblemForCorpus maps a canonical corpus to a fixed problem or null", () => {
  assert.equal(matchProblemForCorpus("solusi analisa tender dan lelang lpse"), "tender_readiness");
  assert.equal(matchProblemForCorpus("layanan sbu skk sertifikasi"), "certification_sbu_skk");
  assert.equal(matchProblemForCorpus("sesuatu yang tidak berkaitan"), null);
});

test("hashSessionId is a stable opaque sha256, not the raw id", () => {
  const h1 = hashSessionId("session-abc-123");
  const h2 = hashSessionId("session-abc-123");
  assert.equal(h1, h2);
  assert.match(h1, /^[0-9a-f]{64}$/);
  assert.notEqual(h1, "session-abc-123");
});

// ── validateCampaignShape (pure): max 3 / exactly 1 primary / no dup ─────────────
test("validateCampaignShape enforces exactly 1 primary, ≤2 supports, no dup canonical", () => {
  const base = { startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2026-02-01T00:00:00.000Z" };
  const item = (role: string, kind: string, id: string) => ({ role, canonicalKind: kind, canonicalId: id });

  assert.equal(validateCampaignShape({ ...base, items: [item("primary", "product", "A")] }).ok, true);
  assert.equal(validateCampaignShape({
    ...base, items: [item("primary", "product", "A"), item("support", "product", "B"), item("support", "package", "C")],
  }).ok, true);

  // Zero primary → invalid.
  assert.equal(validateCampaignShape({ ...base, items: [item("support", "product", "A")] }).ok, false);
  // Two primaries → invalid.
  assert.equal(validateCampaignShape({ ...base, items: [item("primary", "product", "A"), item("primary", "product", "B")] }).ok, false);
  // 4 items → invalid.
  assert.equal(validateCampaignShape({
    ...base, items: [item("primary", "product", "A"), item("support", "product", "B"), item("support", "product", "C"), item("support", "product", "D")],
  }).ok, false);
  // Duplicate canonical item → invalid.
  assert.equal(validateCampaignShape({
    ...base, items: [item("primary", "product", "A"), item("support", "product", "A")],
  }).ok, false);
  // Bad schedule → invalid.
  assert.equal(validateCampaignShape({
    startsAt: "2026-02-01T00:00:00.000Z", endsAt: "2026-01-01T00:00:00.000Z", items: [item("primary", "product", "A")],
  }).ok, false);
});

test("zCreateCampaign enforces placements[] (unique, 1..2), ctaLabel/selectionReason, ≤3 items", () => {
  const good = zCreateCampaign.safeParse({
    name: "Promo Tender",
    placements: ["homepage", "store"],
    segment: "contractor",
    problem: "tender_readiness",
    hook: "Siap tender lebih cepat",
    ctaLabel: "Coba sekarang",
    selectionReason: "Permintaan tender naik menurut sinyal agregat.",
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: "2026-02-01T00:00:00.000Z",
    items: [{ role: "primary", canonicalKind: "product", canonicalId: "GST-AI-001" }],
  });
  assert.equal(good.success, true);

  // Invalid enum placement value.
  assert.equal(zCreateCampaign.safeParse({
    name: "x", placements: ["sidebar"], hook: "h", ctaLabel: "c", selectionReason: "r",
    startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2026-02-01T00:00:00.000Z",
    items: [{ role: "primary", canonicalKind: "product", canonicalId: "P" }],
  }).success, false);

  // Duplicate placements → invalid.
  assert.equal(zCreateCampaign.safeParse({
    name: "x", placements: ["store", "store"], hook: "h", ctaLabel: "c", selectionReason: "r",
    startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2026-02-01T00:00:00.000Z",
    items: [{ role: "primary", canonicalKind: "product", canonicalId: "P" }],
  }).success, false);

  // Missing ctaLabel AND cta → invalid.
  assert.equal(zCreateCampaign.safeParse({
    name: "x", placements: ["store"], hook: "h", selectionReason: "r",
    startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2026-02-01T00:00:00.000Z",
    items: [{ role: "primary", canonicalKind: "product", canonicalId: "P" }],
  }).success, false);

  // Too many items (>3).
  assert.equal(zCreateCampaign.safeParse({
    name: "x", placements: ["store"], hook: "h", ctaLabel: "c", selectionReason: "r",
    startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2026-02-01T00:00:00.000Z",
    items: Array.from({ length: 4 }, () => ({ role: "support", canonicalKind: "product", canonicalId: "P" })),
  }).success, false);
});

// ── Eligibility contract (static — reads only registries) ────────────────────────
test("eligibility reads only product_registry + package_registry (no second catalog)", () => {
  assert.match(engineSrc, /resolveEligibleProduct/);
  assert.match(engineSrc, /resolveEligiblePackage/);
  assert.match(engineSrc, /p\.status !== "ACTIVE"/);
  assert.match(engineSrc, /INTERNAL_ONLY/);
  assert.match(engineSrc, /safeOfficialUrl/);
  assert.match(engineSrc, /pkg\.gaiaEnabled !== true/);
  assert.match(engineSrc, /pkg\.price \?\? 0\) > 0/);
  assert.match(engineSrc, /getWaContact\(\)\.primary/);
  assert.doesNotMatch(engineSrc, /from\(storeProducts\)/);
});

test("safeOfficialUrl accepts only https or root-relative paths", () => {
  assert.equal(safeOfficialUrl("https://example.com/x"), "https://example.com/x");
  assert.equal(safeOfficialUrl("/tender"), "/tender");
  assert.equal(safeOfficialUrl("http://insecure.com"), null);
  assert.equal(safeOfficialUrl("//protocol-relative"), null);
  assert.equal(safeOfficialUrl(""), null);
  assert.equal(safeOfficialUrl(null), null);
});

// ── Schedule + fallback contract ─────────────────────────────────────────────────
test("active endpoint filters schedule/status and fails safely to {campaign:null}", () => {
  const start = engineSrc.indexOf('app.get("/api/promotions/active"');
  const block = engineSrc.slice(start, start + 2400);
  assert.match(block, /eq\(promotionCampaigns\.status, "ACTIVE"\)/);
  assert.match(block, /lte\(promotionCampaigns\.startsAt, now\)/);
  assert.match(block, /gte\(promotionCampaigns\.endsAt, now\)/);
  assert.match(block, /if \(!primary \|\| !primary\.fact\) continue/);
  assert.match(block, /return res\.json\(\{ campaign: null \}\)/);
});

// ── Public campaign contract shape ───────────────────────────────────────────────
test("public campaign payload is normalized from CURRENT canonical facts", () => {
  // publicCampaign shape includes id/name/hook/ctaLabel/selectionReason/placements/items.
  assert.match(engineSrc, /function publicCampaign[\s\S]*?ctaLabel: campaign\.cta[\s\S]*?selectionReason: campaign\.reason[\s\S]*?placements: campaign\.placements[\s\S]*?items:/);
  // publicItem exposes the normalized item fields.
  assert.match(engineSrc, /function publicItem[\s\S]*?canonicalKind[\s\S]*?canonicalId[\s\S]*?role[\s\S]*?ctaUrl[\s\S]*?ctaLabel/);
  // Snapshots kept only for admin history (campaigns route), not the public payload.
  const pubStart = engineSrc.indexOf("function publicItem");
  const pubBlock = engineSrc.slice(pubStart, pubStart + 500);
  assert.doesNotMatch(pubBlock, /snapshot/);
});

// ── Human approval / publish contract ────────────────────────────────────────────
test("no auto-publish: create makes DRAFT, publish is a separate guarded transaction", () => {
  const createStart = engineSrc.indexOf('app.post("/api/admin/promotions/campaigns", ...adminGuard');
  const createBlock = engineSrc.slice(createStart, createStart + 3200);
  assert.match(createBlock, /status: "DRAFT"/);
  assert.doesNotMatch(createBlock, /status: "ACTIVE"/);
  // Create resolves + snapshots each item; rejects non-eligible.
  assert.match(createBlock, /tidak eligible saat ini/);

  const pubStart = engineSrc.indexOf('app.post("/api/admin/promotions/campaigns/:id/publish"');
  const pubBlock = engineSrc.slice(pubStart, pubStart + 3200);
  const transitionStart = engineSrc.indexOf("export async function applyCampaignPublishTransition");
  const transitionBlock = engineSrc.slice(transitionStart, transitionStart + 2400);
  assert.match(pubBlock, /pg_advisory_xact_lock/);
  assert.match(pubBlock, /tidak lagi eligible/);
  assert.match(pubBlock, /applyCampaignPublishTransition/);
  assert.match(transitionBlock, /status: "PAUSED"/);
  assert.match(transitionBlock, /status: "ACTIVE"/);
});

// ── Recommendations endpoint contract ────────────────────────────────────────────
test("recommendations endpoint returns ready canonical solutions with score/confidence/reasons/breakdown", () => {
  assert.match(engineSrc, /app\.get\("\/api\/admin\/promotions\/recommendations", \.\.\.adminGuard/);
  assert.match(engineSrc, /res\.json\(\{ recommendations, methodology: RECOMMENDATION_METHODOLOGY \}\)/);
  // buildRecommendations returns canonical SOLUTIONS (top 3), never needs, never non-eligible.
  const bStart = engineSrc.indexOf("async function buildRecommendations");
  const bBlock = engineSrc.slice(bStart, bStart + 4000);
  assert.match(bBlock, /loadEligibleFacts\(\)/); // candidates come from eligible canonical inventory
  assert.match(bBlock, /canonicalKind: fact\.canonicalKind/);
  assert.match(bBlock, /canonicalId: fact\.canonicalId/);
  assert.match(bBlock, /ctaUrl: fact\.ctaUrl/);
  assert.match(bBlock, /score: finalScore/);
  assert.match(bBlock, /confidence: scored\.confidence/);
  assert.match(bBlock, /breakdown:/);
  assert.match(bBlock, /reasons/);
  assert.match(bBlock, /problem,/);
  assert.match(bBlock, /segment:/);
  assert.match(bBlock, /\.slice\(0, 3\)/);
  // Maps aggregate demand to candidates + uses latest daily report ids as evidence.
  assert.match(bBlock, /demandByProblem/);
  assert.match(bBlock, /reportProductIds/);
});

// ── Attribution contract (static) ────────────────────────────────────────────────
test("legacy store order does NOT stamp campaign attribution (cannot map to registry)", () => {
  assert.match(routesSrc, /resolveOrderAttribution\(\{/);
  // Legacy route passes null productId/packageId → resolveOrderAttribution returns none.
  const start = routesSrc.indexOf("Legacy store_products/agent orders do NOT map");
  assert.ok(start > -1, "legacy route must document no-canonical-mapping behavior");
  // Server-computed price, never client amount.
  assert.match(routesSrc, /amount: itemPrice/);

  // resolveOrderAttribution requires a canonical item id AND an active, in-schedule campaign.
  assert.match(engineSrc, /if \(!input\.productId && !input\.packageId\) return noAttribution/);
  assert.match(engineSrc, /campaign\.status !== "ACTIVE"\) return noAttribution/);
  assert.match(engineSrc, /campaign\.startsAt > now \|\| campaign\.endsAt < now\) return noAttribution/);
  // Ordered item must be one of the campaign's items.
  assert.match(engineSrc, /const matchedItem = items\.find/);
  assert.match(engineSrc, /eq\(promotionEvents\.campaignId, campaign\.id\)/);
  assert.match(engineSrc, /eq\(promotionEvents\.eventId, persistedEventId\)/);
});

test("canonical /api/v1/orders accepts optional campaign_id/promotion_event_id, never a price", () => {
  // Body validation accepts the two optional attribution fields.
  assert.match(orderApiSrc, /body\.campaign_id/);
  assert.match(orderApiSrc, /body\.promotion_event_id/);
  // Never accepts a price from the client (explicit rejection remains).
  assert.match(orderApiSrc, /Field '\$\{f\}' tidak diizinkan/);
  // Attribution validated against the EXACT resolved canonical item + stamped on insert.
  assert.match(orderApiSrc, /resolveOrderAttribution\(\{[\s\S]*?productId: item\.productId \?\? null[\s\S]*?packageId: item\.packageId \?\? null/);
  assert.match(orderApiSrc, /promotionCampaignId: attribution\.promotionCampaignId/);
  assert.match(orderApiSrc, /promotionEventId: attribution\.promotionEventId/);
});

test("campaign attribution fields are an all-or-nothing pair before canonical lookup or insert", () => {
  assert.match(orderApiSrc, /promotionAttributionPairError/);
  assert.match(orderApiSrc, /campaign_id' dan 'promotion_event_id' wajib dikirim bersama/);
  const helperStart = orderApiSrc.indexOf("export async function createCanonicalOrder");
  const guard = orderApiSrc.indexOf(
    "const attributionPairError = promotionAttributionPairError(campaignId, promotionEventId);",
    helperStart,
  );
  const resolve = orderApiSrc.indexOf("const resolved = productId ? await resolveProduct", guard);
  const insert = orderApiSrc.indexOf(".insert(storeOrders)", resolve);
  assert.ok(helperStart > -1 && guard > helperStart && resolve > guard && insert > resolve,
    "pair guard must run before canonical lookup and DB insert");
});

test("HTTP order API rejects campaign_id without promotion_event_id before product lookup", async (t) => {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  const key = process.env.ORDER_API_KEY;
  if (!domain || !key) {
    t.skip("requires the running Replit workflow and ORDER_API_KEY");
    return;
  }
  const response = await fetch(`https://${domain}/api/v1/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: "PROMO-PAIR-GUARD-NOT-A-REAL-PRODUCT",
      campaign_id: 1,
      buyer: { name: "Promotion integration test", email: "promotion-test@example.invalid" },
    }),
  });
  const payload = await response.json() as { error?: string; message?: string };
  assert.equal(response.status, 400);
  assert.equal(payload.error, "invalid_request");
  assert.match(payload.message ?? "", /promotion_event_id/);
});

test("order/revenue funnel counts only PAID/COMPLETED attributed store_orders, not events", () => {
  assert.match(engineSrc, /storeOrders\.promotionCampaignId/);
  // Global funnel + campaign revenue filter on PAID_ORDER_STATUSES.
  assert.match(engineSrc, /inArray\(storeOrders\.status, PAID_ORDER_STATUSES/);
  assert.match(engineSrc, /funnel\.order = Number\(orderRow\?\.count\)/);
  // Campaign funnel order count comes from campaignRevenue (paid), not raw events.
  assert.match(engineSrc, /funnel\.order = rev\.orders/);
});

// ── Transparent 7/30 scoring (pure) ──────────────────────────────────────────────
test("scoreCandidate is a transparent weighted sum with inspectable breakdown", () => {
  const strong = scoreCandidate({
    demand7d: 40, demand30d: 120, ready: true,
    clicks30d: 50, impressions30d: 100, orders30d: 20,
  });
  const weak = scoreCandidate({
    demand7d: 0, demand30d: 0, ready: false,
    clicks30d: 0, impressions30d: 0, orders30d: 0,
  });
  assert.ok(strong.score > weak.score);
  assert.deepEqual(Object.keys(strong.breakdown).sort(), ["demand", "performance", "readiness"]);
  assert.equal(strong.breakdown.readiness, 30);
  assert.equal(weak.breakdown.readiness, 0);
  assert.ok(strong.score <= 100 && strong.score >= 0);
  // Confidence reflects evidence volume.
  assert.equal(weak.confidence, "low");
});

test("overview exposes 7/30-day signals, funnel, transparent recommendations + external evidence", () => {
  const start = engineSrc.indexOf('app.get("/api/admin/promotions/overview"');
  const block = engineSrc.slice(start, start + 1800);
  assert.match(block, /aggregateSignals\(7\)/);
  assert.match(block, /aggregateSignals\(30\)/);
  assert.match(block, /buildRecommendations/);
  assert.match(block, /funnel/);
  assert.match(block, /recommendations/);
  assert.match(engineSrc, /listMarketNeedsReports/);
  assert.match(engineSrc, /externalEvidence/);
});

test("emptyFunnel has all fixed funnel stages at zero", () => {
  const f = emptyFunnel();
  assert.deepEqual(f, { impression: 0, click: 0, search: 0, trial: 0, lead: 0, return_visit: 0, order: 0 });
});

// ── Public/admin UI contract ─────────────────────────────────────────────────────
test("public campaign UI has a visually empty fallback and privacy-safe attributed events", () => {
  assert.match(publicUiSrc, /promotion-fallback-\$\{placement\}/);
  assert.match(publicUiSrc, /className="hidden"/);
  assert.match(publicUiSrc, /eventType: "impression"/);
  assert.match(publicUiSrc, /eventType: "return_visit"/);
  assert.match(publicUiSrc, /eventType: "click"/);
  assert.match(publicUiSrc, /primary\.ctaEvent/);
  assert.match(attributionUiSrc, /canonicalKind: input\.item\?\.canonicalKind/);
  assert.match(attributionUiSrc, /canonicalId: input\.item\?\.canonicalId/);
  assert.match(attributionUiSrc, /sessionId: getPromotionSessionId\(\)/);
  assert.doesNotMatch(attributionUiSrc, /email|phone|customerName|chatContent|documentContent/);
});

test("campaign click carries the same opaque event id through first-party canonical checkout", () => {
  assert.match(publicUiSrc, /createPromotionEventId\(\)/);
  assert.match(publicUiSrc, /promotion_event_id: checkoutEventId/);
  assert.match(publicUiSrc, /eventId: checkoutEventId/);
  assert.match(publicUiSrc, /\/promotion-checkout\?/);
  assert.match(publicUiSrc, /Lihat detail resmi/);
  assert.match(appUiSrc, /path="\/promotion-checkout"/);
  assert.match(checkoutUiSrc, /fetch\("\/api\/promotions\/checkout"/);
  assert.match(checkoutUiSrc, /promotionEventId/);
  assert.match(checkoutUiSrc, /canonicalKind/);
  assert.match(checkoutUiSrc, /canonicalId/);
  assert.match(engineSrc, /app\.post\("\/api\/promotions\/checkout"/);
  assert.match(engineSrc, /createCanonicalOrder\(\{/);
  assert.match(orderApiSrc, /promotion_attribution_invalid/);
});

test("campaign return visits inherit fixed campaign problem/segment and feed demand scoring", () => {
  assert.match(engineSrc, /campaignProblem = campaign\.problem/);
  assert.match(engineSrc, /campaignSegment = campaign\.segment/);
  assert.match(engineSrc, /d\.eventType === "return_visit"[\s\S]*?problem = campaignProblem[\s\S]*?segment = campaignSegment/);
  assert.match(engineSrc, /inArray\(promotionEvents\.eventType, \["search", "return_visit"\]\)/);
});

test("Store search is sent only to server-side classification, never a client ledger", () => {
  assert.match(storeUiSrc, /trackStoreSearch\(searchInput\)/);
  assert.match(attributionUiSrc, /searchQuery: query\.slice\(0, 300\)/);
  assert.match(engineSrc, /classifySearchQuery\(d\.searchQuery/);
  const insertStart = engineSrc.indexOf("await db.insert(promotionEvents).values({");
  assert.doesNotMatch(engineSrc.slice(insertStart, insertStart + 800), /searchQuery/);
});

test("admin UI sends ISO schedules, explicit primary/support roles, uppercase lifecycle actions, and 30-day outcomes", () => {
  assert.match(adminUiSrc, /new Date\(form\.startsAt\)\.toISOString\(\)/);
  assert.match(adminUiSrc, /new Date\(form\.endsAt\)\.toISOString\(\)/);
  assert.match(adminUiSrc, /role: .*primary.*support/);
  assert.match(adminUiSrc, /c\.status === "ACTIVE"/);
  assert.match(adminUiSrc, /c\.status === "DRAFT" \|\| c\.status === "PAUSED"/);
  assert.match(adminUiSrc, /promotion-campaign-history/);
  for (const metric of ["impression", "click", "trial", "return_visit", "lead", "order", "revenue30d"]) {
    assert.match(adminUiSrc, new RegExp(metric));
  }
  assert.match(adminUiSrc, /grid-cols-1 sm:grid-cols-2/);
});
