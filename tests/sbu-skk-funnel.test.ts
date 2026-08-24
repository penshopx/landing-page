/**
 * SBU-SKK Funnel — Backend Tests (Task #395)
 *
 * Covers:
 * - Two paid files (main + supplement) per product, exact hashes, no public assets
 * - Lead/paid token separation (lead token rejected by paid store endpoints)
 * - Lead token expiry enforcement
 * - 30-day entitlement, atomic quota, duplicate grant idempotency
 * - Pending entitlement → email claim
 * - Stream gate (unauthenticated / no entitlement rejected)
 * - Trusted manual order server-side pricing (no fabricated Scalev URL)
 * - Product registry entries (tutor, bundle, ai-specialist)
 * - Unchanged Ladder invariant and SBUClaw slug/marker
 * - Cross-product file access denied
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { pool, db } from "../server/db";
import { storeOrders } from "../shared/schema";
import { SBU_SKK_EBOOK, SBU_SKK_FUNNEL } from "../shared/sbu-skk-ebook";
import { CONTRACTOR_L1_EBOOKS, CONTRACTOR_SBU_CLAW } from "../server/sales-ladder-blueprint";
import {
  buildTutorSourceContext,
  checkTutorEntitlement,
  claimPendingEntitlements,
  consumeEntitlementQuota,
  consumeTutorMessageQuota,
  fulfillSbuSkkOffer,
  getActiveEntitlement,
  getOrCreateLeadSubmission,
  grantEntitlement,
  registerSbuSkkFunnelRoutes,
} from "../server/sbu-skk-funnel";
import { ensureSbuSkkFunnelSchema } from "../server/sbu-skk-funnel-schema";
import { inArray } from "drizzle-orm";

const SERVER_URL = `http://localhost:${process.env.PORT || 5000}`;
const RUN = `funnel_${Date.now()}_${randomUUID().slice(0, 8)}`;
const createdOrderIds: number[] = [];

const MAIN_PDF_SHA256 = "3df699f2d540e868081e8c23e904ce516b642e72b83a8989207ff6b5a84c2048";
const SUPPLEMENT_PDF_SHA256 = "3aa4d83eeed5a9d970b2655451a8fe3db9c402de0c5ed69b12dd55d1caaa4c66";
const MINI_EBOOK_SHA256 = "4bfe4b8c2b815afb4e8ecb62c10aa0b64462d781a9c2444ec9df1fb36df248ba";

let storeProductId = 0;
let serverReady = false;

before(async () => {
  // Wait for server
  for (let i = 0; i < 15; i++) {
    try {
      const r = await fetch(`${SERVER_URL}/api/store/catalog`);
      if (r.ok) { serverReady = true; break; }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  const product = await pool.query<{ id: number }>(
    `SELECT id FROM store_products WHERE lower(name)=lower($1) ORDER BY id`,
    [SBU_SKK_EBOOK.title],
  );
  if (product.rowCount === 1) storeProductId = product.rows[0].id;
});

after(async () => {
  if (createdOrderIds.length) {
    await db.delete(storeOrders).where(inArray(storeOrders.id, createdOrderIds)).catch(() => {});
  }
  // Cleanup test entitlements
  await pool.query(
    `DELETE FROM product_entitlements WHERE email LIKE $1`,
    [`%${RUN}%`],
  ).catch(() => {});
  await pool.query(
    `DELETE FROM lead_submissions WHERE email LIKE $1`,
    [`%${RUN}%`],
  ).catch(() => {});
  await pool.query(
    `DELETE FROM sbu_skk_orders WHERE buyer_email LIKE $1`,
    [`%${RUN}%`],
  ).catch(() => {});
});

test("clean SBU-SKK schema supports lead upsert and manual orders, and upgrades the legacy shape", async () => {
  const client = await pool.connect();
  const schemaName = `sbu_skk_clean_${Date.now()}_${randomUUID().replaceAll("-", "").slice(0, 8)}`;
  try {
    await client.query("BEGIN");
    await client.query(`CREATE SCHEMA "${schemaName}"`);
    await client.query(`SET LOCAL search_path TO "${schemaName}"`);

    await ensureSbuSkkFunnelSchema(client);

    const leadEmail = `${RUN}_clean_schema@example.com`;
    const leadAsset = "clean-schema-mini";
    await client.query(
      `INSERT INTO lead_submissions (
         asset_slug, name, email, access_token, expires_at
       ) VALUES ($1,'Clean Schema',$2,$3,now() + interval '1 day')
       ON CONFLICT (email, asset_slug) DO UPDATE
         SET access_token=EXCLUDED.access_token`,
      [leadAsset, leadEmail, randomUUID()],
    );
    await client.query(
      `INSERT INTO sbu_skk_orders (
         offer_key, product_id, amount, buyer_name, buyer_email,
         buyer_whatsapp, whatsapp_consent, order_ref
       ) VALUES ('tutor','GST-TUTOR-CLEAN',100000,'Clean Buyer',$1,$2,true,$3)`,
      [leadEmail, "628111111111", `clean_${randomUUID()}`],
    );

    // Reproduce the older seed shape: a non-unique lead index with duplicate
    // rows and no whatsapp_consent column on manual orders.
    await client.query(`DROP INDEX uq_lead_submissions_email_slug`);
    await client.query(`
      CREATE INDEX idx_lead_submissions_email_slug
      ON lead_submissions (email, asset_slug)
    `);
    await client.query(
      `INSERT INTO lead_submissions (
         asset_slug, name, email, access_token, expires_at
       ) VALUES
         ($1,'Legacy Duplicate 1',$2,$3,now() + interval '1 day'),
         ($1,'Legacy Duplicate 2',$2,$4,now() + interval '1 day')`,
      [leadAsset, leadEmail, randomUUID(), randomUUID()],
    );
    await client.query(
      `ALTER TABLE sbu_skk_orders DROP COLUMN whatsapp_consent`,
    );

    await ensureSbuSkkFunnelSchema(client);

    const deduped = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count
         FROM lead_submissions
        WHERE email=$1 AND asset_slug=$2`,
      [leadEmail, leadAsset],
    );
    assert.equal(Number(deduped.rows[0].count), 1);

    await client.query(
      `INSERT INTO lead_submissions (
         asset_slug, name, email, access_token, expires_at
       ) VALUES ($1,'Recovered Upsert',$2,$3,now() + interval '1 day')
       ON CONFLICT (email, asset_slug) DO UPDATE
         SET name=EXCLUDED.name`,
      [leadAsset, leadEmail, randomUUID()],
    );
    const order = await client.query<{ whatsapp_consent: boolean }>(
      `INSERT INTO sbu_skk_orders (
         offer_key, product_id, amount, buyer_name, buyer_email,
         buyer_whatsapp, whatsapp_consent, order_ref
       ) VALUES ('bundle','GST-BUNDLE-CLEAN',249000,'Recovered Buyer',$1,$2,true,$3)
       RETURNING whatsapp_consent`,
      [leadEmail, "628122222222", `recovered_${randomUUID()}`],
    );
    assert.equal(order.rows[0].whatsapp_consent, true);
  } finally {
    await client.query("ROLLBACK").catch(() => {});
    client.release();
  }
});

// ── 1. Two paid files per product with exact hashes ──────────────────────────
test("digital_product_files has exactly two rows for GST-EBOOK-SBU-SKK-001 with correct hashes", async () => {
  const rows = await pool.query<{
    storage_key: string;
    sha256: string;
    sort_order: number;
    role: string;
    size_bytes: number;
  }>(
    `SELECT storage_key, sha256, sort_order, role, size_bytes
       FROM digital_product_files
      WHERE product_registry_id = $1
      ORDER BY sort_order`,
    [SBU_SKK_EBOOK.registryProductId],
  );
  assert.equal(rows.rowCount, 2, "Must have exactly 2 files for the ebook product");

  const main = rows.rows[0];
  const supplement = rows.rows[1];

  assert.equal(main.sort_order, 0);
  assert.equal(main.role, "main");
  assert.equal(main.sha256, MAIN_PDF_SHA256, "Main ebook SHA256 must match approved hash");

  assert.equal(supplement.sort_order, 1);
  assert.equal(supplement.role, "supplement");
  assert.equal(supplement.sha256, SUPPLEMENT_PDF_SHA256, "Supplement SHA256 must match approved hash");
});

// ── 2. No paid PDF in public assets ──────────────────────────────────────────
test("paid PDFs are not accessible from public file paths", () => {
  const publicDirs = [
    path.join(process.cwd(), "dist/public"),
    path.join(process.cwd(), "public"),
  ];
  for (const dir of publicDirs) {
    if (!fs.existsSync(dir)) continue;
    const allFiles = collectFiles(dir);
    for (const f of allFiles) {
      if (f.endsWith(".pdf")) {
        const bytes = fs.readFileSync(f);
        const sha = createHash("sha256").update(bytes).digest("hex");
        assert.notEqual(sha, MAIN_PDF_SHA256, `Main ebook PDF must not be in ${f}`);
        assert.notEqual(sha, SUPPLEMENT_PDF_SHA256, `Supplement PDF must not be in ${f}`);
        assert.notEqual(sha, MINI_EBOOK_SHA256, `Mini ebook PDF must not be in ${f}`);
      }
    }
  }
});

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectFiles(full));
    else results.push(full);
  }
  return results;
}

// ── 3. Paid access: downloads array returned ─────────────────────────────────
test("GET /api/store/access/:token returns downloads array for paid order", async () => {
  if (!serverReady || !storeProductId) {
    console.log("skip: server or product not ready");
    return;
  }
  const token = randomUUID();
  const [order] = await db.insert(storeOrders).values({
    productId: storeProductId,
    agentId: null,
    customerName: "Test Buyer",
    customerEmail: `${RUN}@example.com`,
    customerPhone: "",
    amount: SBU_SKK_EBOOK.amount,
    creatorUserId: null,
    creatorShare: 0,
    platformShare: SBU_SKK_EBOOK.amount,
    midtransOrderId: `${RUN}_paid_${randomUUID()}`,
    accessToken: token,
    status: "paid",
  } as any).returning({ id: storeOrders.id });
  createdOrderIds.push(order.id);

  const res = await fetch(`${SERVER_URL}/api/store/access/${token}`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.type, "digital");
  assert.ok(Array.isArray(body.downloads), "downloads must be an array");
  assert.equal(body.downloads.length, 2, "Must have 2 downloads");

  const mainDl = body.downloads.find((d: any) => d.role === "main");
  const suppDl = body.downloads.find((d: any) => d.role === "supplement");
  assert.ok(mainDl, "Must have main file");
  assert.ok(suppDl, "Must have supplement file");
  assert.match(
    mainDl.downloadUrl,
    new RegExp(`/download/product/${SBU_SKK_EBOOK.registryProductId}/role/main$`),
  );
  assert.match(
    suppDl.downloadUrl,
    new RegExp(`/download/product/${SBU_SKK_EBOOK.registryProductId}/role/supplement$`),
  );
});

// ── 4. Stale numeric download links remain usable ────────────────────────────
test("GET /api/store/access/:token/download/:fileId falls back to the current main file when the old ID is gone", async () => {
  if (!serverReady || !storeProductId) return;
  const token = randomUUID();
  const [order] = await db.insert(storeOrders).values({
    productId: storeProductId,
    agentId: null,
    customerName: "Test",
    customerEmail: `${RUN}@example.com`,
    customerPhone: "",
    amount: SBU_SKK_EBOOK.amount,
    creatorUserId: null,
    creatorShare: 0,
    platformShare: SBU_SKK_EBOOK.amount,
    midtransOrderId: `${RUN}_cross_${randomUUID()}`,
    accessToken: token,
    status: "paid",
  } as any).returning({ id: storeOrders.id });
  createdOrderIds.push(order.id);

  const res = await fetch(
    `${SERVER_URL}/api/store/access/${token}/download/2147483647`,
  );
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") || "", /^application\/pdf/i);
});

// ── 5. Pending order rejected ─────────────────────────────────────────────────
test("GET /api/store/access/:token rejects pending orders", async () => {
  if (!serverReady || !storeProductId) return;
  const token = randomUUID();
  const [order] = await db.insert(storeOrders).values({
    productId: storeProductId,
    agentId: null,
    customerName: "Pending Test",
    customerEmail: `${RUN}@example.com`,
    customerPhone: "",
    amount: SBU_SKK_EBOOK.amount,
    creatorUserId: null,
    creatorShare: 0,
    platformShare: SBU_SKK_EBOOK.amount,
    midtransOrderId: `${RUN}_pending_${randomUUID()}`,
    accessToken: token,
    status: "pending",
  } as any).returning({ id: storeOrders.id });
  createdOrderIds.push(order.id);

  const meta = await fetch(`${SERVER_URL}/api/store/access/${token}`);
  assert.equal(meta.status, 403);
  const dl = await fetch(`${SERVER_URL}/api/store/access/${token}/download`);
  assert.equal(dl.status, 403);
});

// ── 6. Lead token separation — lead token must NOT work on paid store endpoints
test("lead token is rejected by paid store access endpoint", async () => {
  if (!serverReady) return;
  // Mint a lead token directly
  const leadToken = "leadtest" + randomUUID().replace(/-/g, "").slice(0, 52);
  await pool.query(
    `INSERT INTO lead_submissions (asset_slug, name, email, whatsapp_consent, access_token, expires_at)
     VALUES ($1,$2,$3,false,$4, now() + interval '30 days')`,
    [SBU_SKK_FUNNEL.miniEbook.assetSlug, "Test Lead", `${RUN}_lead@example.com`, leadToken],
  );

  // Lead token must NOT work on paid store endpoint
  const res = await fetch(`${SERVER_URL}/api/store/access/${leadToken}`);
  // 404 or 403 — NOT 200 with paid data
  assert.ok([404, 403].includes(res.status), `Lead token must not give paid access (status=${res.status})`);

  // Lead token SHOULD work on lead access endpoint
  const leadRes = await fetch(`${SERVER_URL}/api/sbu-skk/lead/access/${leadToken}`);
  assert.equal(leadRes.status, 200, "Lead token should work on lead endpoint");
  const body = await leadRes.json();
  assert.equal(body.valid, true);
});

// ── 7. Lead token expiry ──────────────────────────────────────────────────────
test("expired lead token returns 403", async () => {
  if (!serverReady) return;
  const expiredToken = "expired" + randomUUID().replace(/-/g, "").slice(0, 53);
  await pool.query(
    `INSERT INTO lead_submissions (asset_slug, name, email, whatsapp_consent, access_token, expires_at)
     VALUES ($1,$2,$3,false,$4, now() - interval '1 day')`,
    [SBU_SKK_FUNNEL.miniEbook.assetSlug, "Expired Lead", `${RUN}_exp@example.com`, expiredToken],
  );

  const res = await fetch(`${SERVER_URL}/api/sbu-skk/lead/access/${expiredToken}`);
  assert.equal(res.status, 403, "Expired lead token must return 403");
  const body = await res.json();
  assert.match(body.error, /kedaluwarsa/i);
});

test("lead API rejects WhatsApp without explicit consent", async () => {
  if (!serverReady) return;
  const res = await fetch(`${SERVER_URL}/api/sbu-skk/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Lead Consent Test",
      email: `${RUN}_lead_consent@example.com`,
      whatsapp: "081234567890",
      whatsappConsent: false,
    }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /Persetujuan WhatsApp/i);
});

test("lead dedupe is atomic and reuses one active token", async () => {
  const email = `${RUN}_lead_dedupe@example.com`;
  const input = {
    assetSlug: SBU_SKK_FUNNEL.miniEbook.assetSlug,
    name: "Lead Dedupe Test",
    email,
    accessDays: SBU_SKK_FUNNEL.miniEbook.accessDays,
    utmSource: "automated-test",
  };
  const submissions = await Promise.all(
    Array.from({ length: 5 }, () => getOrCreateLeadSubmission(input)),
  );
  assert.equal(new Set(submissions.map((submission) => submission.token)).size, 1);

  const rows = await pool.query<{ count: string }>(
    `SELECT count(*)::text AS count
       FROM lead_submissions
      WHERE email=$1 AND asset_slug=$2`,
    [email, SBU_SKK_FUNNEL.miniEbook.assetSlug],
  );
  assert.equal(Number(rows.rows[0].count), 1);
});

// ── 8. 30-day entitlement, atomic quota, duplicate grant idempotency ─────────
test("grantEntitlement creates 30-day entitlement and consumeEntitlementQuota decrements", async () => {
  const testEmail = `${RUN}_ent@example.com`;
  const testUserId = `user_${RUN}`;

  const { id: entId, isNew } = await grantEntitlement({
    entitlementKey: SBU_SKK_FUNNEL.tutor.entitlementKey,
    email: testEmail,
    userId: testUserId,
    productRegistryId: SBU_SKK_FUNNEL.tutor.registryProductId,
    agentSlug: SBU_SKK_FUNNEL.tutor.agentSlug,
    durationDays: 30,
    quotaTotal: 100,
    source: "test",
    manualOrderRef: `test_${RUN}`,
    grantedBy: "test",
  });
  assert.ok(entId > 0);
  assert.equal(isNew, true);

  // Check active entitlement
  const ent = await getActiveEntitlement(testUserId, SBU_SKK_FUNNEL.tutor.entitlementKey);
  assert.ok(ent, "Entitlement must be active");
  assert.equal(ent.quotaUsed, 0);
  assert.equal(ent.quotaTotal, 100);

  // Verify 30-day expiry
  const nowMs = Date.now();
  const expiryMs = new Date(ent.expiresAt).getTime();
  const diffDays = (expiryMs - nowMs) / 86400_000;
  assert.ok(diffDays > 29 && diffDays < 31, `Expiry must be ~30 days (got ${diffDays.toFixed(1)})`);

  // Consume quota atomically
  const consumed = await consumeEntitlementQuota(testUserId, SBU_SKK_FUNNEL.tutor.entitlementKey);
  assert.ok(consumed, "Quota consume must succeed");
  assert.equal(consumed.quotaUsed, 1);

  // Check updated
  const ent2 = await getActiveEntitlement(testUserId, SBU_SKK_FUNNEL.tutor.entitlementKey);
  assert.equal(ent2?.quotaUsed, 1);
});

test("concurrent quota consumption never exceeds the entitlement limit", async () => {
  const userId = `user_${RUN}_quota_race`;
  await grantEntitlement({
    entitlementKey: SBU_SKK_FUNNEL.tutor.entitlementKey,
    email: `${RUN}_quota_race@example.com`,
    userId,
    productRegistryId: SBU_SKK_FUNNEL.tutor.registryProductId,
    agentSlug: SBU_SKK_FUNNEL.tutor.agentSlug,
    durationDays: 30,
    quotaTotal: 1,
    source: "test",
    manualOrderRef: `quota_race_${RUN}`,
  });
  const attempts = await Promise.all(
    Array.from({ length: 4 }, () =>
      consumeEntitlementQuota(userId, SBU_SKK_FUNNEL.tutor.entitlementKey),
    ),
  );
  assert.equal(attempts.filter(Boolean).length, 1);
  const active = await getActiveEntitlement(
    userId,
    SBU_SKK_FUNNEL.tutor.entitlementKey,
  );
  assert.equal(active?.quotaUsed, 1);
});

test("duplicate grant with same providerOrderRef is idempotent (no extension or quota increase)", async () => {
  const testEmail = `${RUN}_dedup@example.com`;
  const orderRef = `order_${RUN}_001`;

  const { id: id1, isNew: new1 } = await grantEntitlement({
    entitlementKey: SBU_SKK_FUNNEL.tutor.entitlementKey,
    email: testEmail,
    productRegistryId: SBU_SKK_FUNNEL.tutor.registryProductId,
    agentSlug: SBU_SKK_FUNNEL.tutor.agentSlug,
    durationDays: 30,
    quotaTotal: 100,
    source: "test",
    providerOrderRef: orderRef,
  });
  assert.equal(new1, true);

  const { id: id2, isNew: new2 } = await grantEntitlement({
    entitlementKey: SBU_SKK_FUNNEL.tutor.entitlementKey,
    email: testEmail,
    productRegistryId: SBU_SKK_FUNNEL.tutor.registryProductId,
    agentSlug: SBU_SKK_FUNNEL.tutor.agentSlug,
    durationDays: 30,
    quotaTotal: 100,
    source: "test",
    providerOrderRef: orderRef,
  });
  assert.equal(new2, false, "Duplicate providerOrderRef must be idempotent");
  assert.equal(id1, id2, "Must return same entitlement id");
});

// ── 9. Pending email claim ────────────────────────────────────────────────────
test("claimPendingEntitlements activates pending entitlement when userId is assigned", async () => {
  const testEmail = `${RUN}_claim@example.com`;

  // Grant without userId (pending)
  const { id: entId } = await grantEntitlement({
    entitlementKey: SBU_SKK_FUNNEL.tutor.entitlementKey,
    email: testEmail,
    userId: null,
    productRegistryId: SBU_SKK_FUNNEL.tutor.registryProductId,
    agentSlug: SBU_SKK_FUNNEL.tutor.agentSlug,
    durationDays: 30,
    quotaTotal: 100,
    source: "test",
    manualOrderRef: `pending_${RUN}`,
  });

  // Verify it's pending (no userId)
  const pending = await pool.query<{ status: string; user_id: string | null }>(
    `SELECT status, user_id FROM product_entitlements WHERE id=$1`,
    [entId],
  );
  assert.equal(pending.rows[0].status, "pending");
  assert.equal(pending.rows[0].user_id, null);

  // Claim with user
  const claimedCount = await claimPendingEntitlements(`user_${RUN}_claim`, testEmail);
  assert.ok(claimedCount > 0, "Must claim at least one entitlement");

  // Verify now active
  const active = await pool.query<{ status: string; user_id: string }>(
    `SELECT status, user_id FROM product_entitlements WHERE id=$1`,
    [entId],
  );
  assert.equal(active.rows[0].status, "active");
  assert.equal(active.rows[0].user_id, `user_${RUN}_claim`);
});

test("email-session supports Tutor/admin flows and denies inactive or blocked accounts", async () => {
  const userId = `email_user_${RUN}`;
  const userEmail = `${RUN}_email_session@example.com`;
  const adminId = `email_admin_${RUN}`;
  const adminEmail = `${RUN}_email_admin@example.com`;
  const inactiveId = `email_inactive_${RUN}`;
  const inactiveEmail = `${RUN}_email_inactive@example.com`;
  const blockedId = `email_blocked_${RUN}`;
  const blockedEmail = `${RUN}_email_blocked@example.com`;
  const buyerEmail = `${RUN}_email_admin_buyer@example.com`;
  const orderRef = `email_admin_order_${RUN}`;
  const staleTutorEmail = `${RUN}_stale_tutor@example.com`;
  const staleTutorRef = `stale_tutor_${RUN}`;
  const staleBundleEmail = `${RUN}_stale_bundle@example.com`;
  const staleBundleRef = `stale_bundle_${RUN}`;
  let orderId = 0;
  let staleTutorOrderId = 0;
  let staleBundleOrderId = 0;

  await pool.query(
    `INSERT INTO users (id, email, role, is_active, email_verified, auth_provider)
     VALUES ($1,$2,'user',true,true,'email'),
            ($3,$4,'admin',true,true,'email'),
            ($5,$6,'user',false,true,'email'),
            ($7,$8,'blocked',true,true,'email')`,
    [
      userId,
      userEmail,
      adminId,
      adminEmail,
      inactiveId,
      inactiveEmail,
      blockedId,
      blockedEmail,
    ],
  );

  await grantEntitlement({
    entitlementKey: SBU_SKK_FUNNEL.tutor.entitlementKey,
    email: userEmail,
    userId: null,
    productRegistryId: SBU_SKK_FUNNEL.tutor.registryProductId,
    agentSlug: SBU_SKK_FUNNEL.tutor.agentSlug,
    durationDays: 30,
    quotaTotal: 100,
    source: "test",
    manualOrderRef: `email_session_claim_${RUN}`,
  });
  for (const [id, email, ref] of [
    [inactiveId, inactiveEmail, "inactive"],
    [blockedId, blockedEmail, "blocked"],
  ]) {
    await grantEntitlement({
      entitlementKey: SBU_SKK_FUNNEL.tutor.entitlementKey,
      email,
      userId: id,
      productRegistryId: SBU_SKK_FUNNEL.tutor.registryProductId,
      agentSlug: SBU_SKK_FUNNEL.tutor.agentSlug,
      durationDays: 30,
      quotaTotal: 5,
      source: "test",
      manualOrderRef: `${ref}_${RUN}`,
    });
  }

  const order = await pool.query<{ id: number }>(
    `INSERT INTO sbu_skk_orders (
       offer_key, product_id, amount, buyer_name, buyer_email, order_ref, status
     ) VALUES ('tutor',$1,$2,'Email Session Buyer',$3,$4,'pending')
     RETURNING id`,
    [
      SBU_SKK_FUNNEL.tutor.registryProductId,
      SBU_SKK_FUNNEL.tutor.addOnAmount,
      buyerEmail,
      orderRef,
    ],
  );
  orderId = order.rows[0].id;

  const staleOrders = await pool.query<{ id: number; offer_key: string }>(
    `INSERT INTO sbu_skk_orders (
       offer_key, product_id, amount, buyer_name, buyer_email,
       order_ref, status, updated_at
     ) VALUES
       ('tutor',$1,$2,'Stale Tutor Buyer',$3,$4,'processing',now() - interval '11 minutes'),
       ('bundle',$5,$6,'Stale Bundle Buyer',$7,$8,'processing',now() - interval '11 minutes')
     RETURNING id, offer_key`,
    [
      SBU_SKK_FUNNEL.tutor.registryProductId,
      SBU_SKK_FUNNEL.tutor.addOnAmount,
      staleTutorEmail,
      staleTutorRef,
      SBU_SKK_FUNNEL.bundle.registryProductId,
      SBU_SKK_FUNNEL.bundle.amount,
      staleBundleEmail,
      staleBundleRef,
    ],
  );
  staleTutorOrderId = staleOrders.rows.find(
    (row) => row.offer_key === "tutor",
  )!.id;
  staleBundleOrderId = staleOrders.rows.find(
    (row) => row.offer_key === "bundle",
  )!.id;

  assert.ok(storeProductId > 0, "Seeded SBU-SKK store product must exist");
  const bundleDelivery = await pool.query<{ id: number }>(
    `INSERT INTO store_orders (
       product_id, customer_name, customer_email, customer_phone, amount,
       midtrans_order_id, access_token, status, delivery_status, delivery_sent_at
     ) VALUES ($1,'Stale Bundle Buyer',$2,'',$3,$4,$5,'paid','sent',now())
     RETURNING id`,
    [
      storeProductId,
      staleBundleEmail,
      SBU_SKK_FUNNEL.bundle.amount,
      `bundle_${staleBundleRef}`,
      randomUUID(),
    ],
  );
  createdOrderIds.push(bundleDelivery.rows[0].id);

  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    const actor = req.header("x-test-email-actor");
    if (actor === "user") {
      req.session = { emailUser: { id: userId, email: userEmail } };
    } else if (actor === "admin") {
      req.session = { emailUser: { id: adminId, email: adminEmail } };
    } else if (actor === "inactive") {
      req.session = { emailUser: { id: inactiveId, email: inactiveEmail } };
    } else if (actor === "blocked") {
      req.session = { emailUser: { id: blockedId, email: blockedEmail } };
    }
    req.isAuthenticated = () => false;
    next();
  });
  registerSbuSkkFunnelRoutes(app);
  app.post("/api/messages/stream", async (req: any, res) => {
    const gate = await checkTutorEntitlement(req);
    if (!gate.ok) return res.status(gate.status).json({ error: gate.error });
    const quota = await consumeTutorMessageQuota(gate.userId);
    if (!quota.ok) return res.status(quota.status).json({ error: quota.error });
    return res.json({ ok: true });
  });

  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const status = await fetch(`${baseUrl}/api/sbu-skk/tutor/status`, {
      headers: { "x-test-email-actor": "user" },
    });
    assert.equal(status.status, 200);
    const statusBody = await status.json();
    assert.equal(statusBody.entitled, true);
    assert.equal(statusBody.quotaUsed, 0);

    const stream = await fetch(`${baseUrl}/api/messages/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-email-actor": "user",
      },
      body: JSON.stringify({ content: "Apa itu SBU?" }),
    });
    assert.equal(stream.status, 200);
    const active = await getActiveEntitlement(
      userId,
      SBU_SKK_FUNNEL.tutor.entitlementKey,
    );
    assert.equal(active?.quotaUsed, 1);

    const confirmation = await fetch(
      `${baseUrl}/api/sbu-skk/admin/orders/${orderId}/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-email-actor": "admin",
        },
        body: JSON.stringify({ evidence: "Bukti transfer test email-session" }),
      },
    );
    assert.equal(confirmation.status, 200);
    const confirmed = await pool.query<{
      status: string;
      confirmed_by: string;
    }>(
      `SELECT status, confirmed_by FROM sbu_skk_orders WHERE id=$1`,
      [orderId],
    );
    assert.equal(confirmed.rows[0].status, "confirmed");
    assert.equal(confirmed.rows[0].confirmed_by, adminId);

    for (const staleOrderId of [staleTutorOrderId, staleBundleOrderId]) {
      const recovered = await fetch(
        `${baseUrl}/api/sbu-skk/admin/orders/${staleOrderId}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-test-email-actor": "admin",
          },
          body: JSON.stringify({
            evidence: "Pemulihan claim processing lama",
          }),
        },
      );
      assert.equal(recovered.status, 200);
    }
    const recoveredOrders = await pool.query<{
      offer_key: string;
      status: string;
    }>(
      `SELECT offer_key, status
         FROM sbu_skk_orders
        WHERE id = ANY($1::int[])
        ORDER BY offer_key`,
      [[staleTutorOrderId, staleBundleOrderId]],
    );
    assert.equal(recoveredOrders.rowCount, 2);
    assert.ok(recoveredOrders.rows.every((row) => row.status === "confirmed"));

    const recoveredEntitlements = await pool.query<{
      manual_order_ref: string;
      count: string;
    }>(
      `SELECT manual_order_ref, count(*)::text AS count
         FROM product_entitlements
        WHERE manual_order_ref = ANY($1::text[])
        GROUP BY manual_order_ref`,
      [[staleTutorRef, staleBundleRef]],
    );
    assert.equal(recoveredEntitlements.rowCount, 2);
    assert.ok(
      recoveredEntitlements.rows.every((row) => Number(row.count) === 1),
    );

    for (const [actor, id] of [
      ["inactive", inactiveId],
      ["blocked", blockedId],
    ]) {
      const deniedStatus = await fetch(`${baseUrl}/api/sbu-skk/tutor/status`, {
        headers: { "x-test-email-actor": actor },
      });
      assert.equal(deniedStatus.status, 403);

      const deniedStream = await fetch(`${baseUrl}/api/messages/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-email-actor": actor,
        },
        body: JSON.stringify({ content: "Jangan kurangi kuota." }),
      });
      assert.equal(deniedStream.status, 403);
      const deniedEntitlement = await getActiveEntitlement(
        id,
        SBU_SKK_FUNNEL.tutor.entitlementKey,
      );
      assert.equal(deniedEntitlement?.quotaUsed, 0);
    }
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await pool.query(
      `DELETE FROM sbu_skk_orders WHERE id = ANY($1::int[])`,
      [[orderId, staleTutorOrderId, staleBundleOrderId].filter(Boolean)],
    ).catch(() => {});
    await pool.query(
      `DELETE FROM product_entitlements WHERE email IN ($1,$2,$3,$4,$5,$6)`,
      [
        userEmail,
        buyerEmail,
        inactiveEmail,
        blockedEmail,
        staleTutorEmail,
        staleBundleEmail,
      ],
    ).catch(() => {});
    await pool.query(
      `DELETE FROM users WHERE id IN ($1,$2,$3,$4)`,
      [userId, adminId, inactiveId, blockedId],
    ).catch(() => {});
  }
});

// ── 10. Stream gate: unauthenticated rejected ─────────────────────────────────
test("POST /api/messages/stream rejects unauthenticated request for sbu-skk-tutor agent", async () => {
  if (!serverReady) return;

  // Find tutor agent id
  const agentRow = await pool.query<{ id: number }>(
    `SELECT id FROM agents WHERE slug='sbu-skk-tutor' LIMIT 1`,
  );
  if (!agentRow.rows[0]) {
    console.log("skip: sbu-skk-tutor agent not found");
    return;
  }
  const agentId = String(agentRow.rows[0].id);

  const res = await fetch(`${SERVER_URL}/api/messages/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, role: "user", content: "Apa itu SBU?" }),
  });
  // Must be 401 (not logged in) or 403 (no entitlement)
  assert.ok([401, 403].includes(res.status), `Expected 401/403 for unauthenticated tutor access, got ${res.status}`);
  const body = await res.json();
  assert.ok(body.error || body.reason, "Must return error message");
});

// ── 11. Manual order server-side pricing ─────────────────────────────────────
test("POST /api/sbu-skk/orders uses server-side pricing (no Scalev URL)", async () => {
  if (!serverReady) return;

  const res = await fetch(`${SERVER_URL}/api/sbu-skk/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      offerKey: "tutor",
      buyer: {
        name: "Test Buyer Funnel",
        email: `${RUN}_order@example.com`,
      },
    }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.offerKey, "tutor");
  assert.equal(body.amount, SBU_SKK_FUNNEL.tutor.addOnAmount, "Amount must come from SBU_SKK_FUNNEL (server-side)");
  assert.equal(body.productId, SBU_SKK_FUNNEL.tutor.registryProductId);
  assert.equal(body.paymentMode, "MANUAL_WA", "No Scalev variant → MANUAL_WA");
  assert.ok(!body.paymentUrl, "No Scalev URL should be returned");
  assert.ok(body.waOrderUrl?.includes("wa.me"), "WA order URL must be present");
  assert.ok(body.orderRef?.startsWith("SBU-"), "Order ref must start with SBU-");
});

test("POST /api/sbu-skk/orders rejects invalid offerKey", async () => {
  if (!serverReady) return;
  const res = await fetch(`${SERVER_URL}/api/sbu-skk/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      offerKey: "fake-offer",
      buyer: {
        name: "Test",
        email: "test@example.com",
      },
    }),
  });
  assert.equal(res.status, 400);
});

test("manual order rejects a phone without consent and persists consent when supplied", async () => {
  if (!serverReady) return;
  const email = `${RUN}_order_consent@example.com`;
  const rejected = await fetch(`${SERVER_URL}/api/sbu-skk/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      offerKey: "tutor",
      buyer: {
        name: "Order Consent Test",
        email,
        phone: "081234567890",
        whatsappConsent: false,
      },
    }),
  });
  assert.equal(rejected.status, 400);

  const accepted = await fetch(`${SERVER_URL}/api/sbu-skk/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      offerKey: "tutor",
      buyer: {
        name: "Order Consent Test",
        email,
        phone: "081234567890",
        whatsappConsent: true,
      },
    }),
  });
  assert.equal(accepted.status, 201);
  const persisted = await pool.query<{
    buyer_whatsapp: string | null;
    whatsapp_consent: boolean;
  }>(
    `SELECT buyer_whatsapp, whatsapp_consent
       FROM sbu_skk_orders
      WHERE buyer_email=$1
      ORDER BY id DESC
      LIMIT 1`,
    [email],
  );
  assert.ok(persisted.rows[0]?.buyer_whatsapp);
  assert.equal(persisted.rows[0]?.whatsapp_consent, true);
});

test("bundle fulfillment resolves the canonical ebook and grants Tutor idempotently", async () => {
  assert.ok(storeProductId > 0, "Seeded SBU-SKK store product must exist");
  const email = `${RUN}_bundle_fulfillment@example.com`;
  const manualOrderRef = `bundle_fulfillment_${RUN}`;
  const existingDelivery = await pool.query<{ id: number }>(
    `INSERT INTO store_orders (
       product_id, customer_name, customer_email, customer_phone, amount,
       midtrans_order_id, access_token, status, delivery_status, delivery_sent_at
     ) VALUES ($1,$2,$3,'',$4,$5,$6,'paid','sent',now())
     RETURNING id`,
    [
      storeProductId,
      "Bundle Fulfillment Test",
      email,
      SBU_SKK_FUNNEL.bundle.amount,
      `bundle_${manualOrderRef}`,
      randomUUID(),
    ],
  );
  createdOrderIds.push(existingDelivery.rows[0].id);

  const first = await fulfillSbuSkkOffer({
    offerKey: "bundle",
    buyerName: "Bundle Fulfillment Test",
    buyerEmail: email,
    amount: SBU_SKK_FUNNEL.bundle.amount,
    source: "manual",
    manualOrderRef,
    grantedBy: "automated-test",
  });
  const second = await fulfillSbuSkkOffer({
    offerKey: "bundle",
    buyerName: "Bundle Fulfillment Test",
    buyerEmail: email,
    amount: SBU_SKK_FUNNEL.bundle.amount,
    source: "manual",
    manualOrderRef,
    grantedBy: "automated-test",
  });
  assert.ok(first.entitlementId);
  assert.equal(second.entitlementId, first.entitlementId);
  assert.ok(
    first.results.some((item) => item.startsWith("digital_delivery_sent:")),
  );

  const entitlements = await pool.query<{ count: string }>(
    `SELECT count(*)::text AS count
       FROM product_entitlements
      WHERE entitlement_key=$1 AND manual_order_ref=$2`,
    [SBU_SKK_FUNNEL.tutor.entitlementKey, manualOrderRef],
  );
  assert.equal(Number(entitlements.rows[0].count), 1);
});

// ── 12. Product registry entries ──────────────────────────────────────────────
test("product_registry has all required SBU-SKK funnel products", async () => {
  const ids = [
    SBU_SKK_EBOOK.registryProductId,
    SBU_SKK_FUNNEL.tutor.registryProductId,
    SBU_SKK_FUNNEL.bundle.registryProductId,
    SBU_SKK_FUNNEL.aiSpecialist.registryProductId,
  ];
  const result = await pool.query<{ product_id: string; price: number; status: string }>(
    `SELECT product_id, price, status FROM product_registry WHERE product_id = ANY($1)`,
    [ids],
  );
  assert.equal(result.rowCount, 4, "Must have 4 SBU-SKK registry products");

  const byId = new Map(result.rows.map((r) => [r.product_id, r]));

  assert.equal(byId.get(SBU_SKK_FUNNEL.tutor.registryProductId)?.price, SBU_SKK_FUNNEL.tutor.addOnAmount);
  assert.equal(byId.get(SBU_SKK_FUNNEL.bundle.registryProductId)?.price, SBU_SKK_FUNNEL.bundle.amount);
  assert.equal(byId.get(SBU_SKK_FUNNEL.aiSpecialist.registryProductId)?.price, SBU_SKK_FUNNEL.aiSpecialist.licenseAmount);

  for (const [, row] of byId) {
    assert.equal(row.status, "ACTIVE", `Product ${row.product_id} must be ACTIVE`);
  }
});

test("product_registry Tutor and AI Specialist have no Scalev variant (no fabricated URL)", async () => {
  const result = await pool.query<{ product_id: string; scalev_variant_unique_id: string | null }>(
    `SELECT product_id, scalev_variant_unique_id FROM product_registry
      WHERE product_id IN ($1,$2,$3)`,
    [
      SBU_SKK_FUNNEL.tutor.registryProductId,
      SBU_SKK_FUNNEL.bundle.registryProductId,
      SBU_SKK_FUNNEL.aiSpecialist.registryProductId,
    ],
  );
  for (const row of result.rows) {
    assert.equal(
      row.scalev_variant_unique_id,
      null,
      `${row.product_id} must not have a Scalev variant (no fabricated checkout URL)`,
    );
  }
});

// ── 13. Sales Ladder invariant ────────────────────────────────────────────────
test("Sales Ladder contractor-sbu-readiness still has exactly 5 L1 nodes, 1 linked, 4 placeholders", async () => {
  const state = await pool.query<{
    l1_count: string;
    linked_count: string;
    placeholder_count: string;
  }>(
    `SELECT
       count(*) FILTER (WHERE n.stage='L1')::text AS l1_count,
       count(*) FILTER (
         WHERE n.stage='L1' AND n.node_type='PRODUCT' AND n.product_registry_id=$1
       )::text AS linked_count,
       count(*) FILTER (
         WHERE n.stage='L1' AND n.node_type='PLACEHOLDER'
           AND n.product_registry_id IS NULL AND n.package_registry_id IS NULL
       )::text AS placeholder_count
     FROM sales_ladder_nodes n
     JOIN sales_ladders l ON l.id=n.ladder_id
     WHERE l.slug='contractor-sbu-readiness'`,
    [SBU_SKK_EBOOK.registryProductId],
  );
  const row = state.rows[0];
  assert.equal(row.l1_count, "5", "Must have exactly 5 L1 nodes");
  assert.equal(row.linked_count, "1", "Must have exactly 1 linked L1 node");
  assert.equal(row.placeholder_count, "4", "Must have exactly 4 placeholders");
});

// ── 14. SBUClaw slug/marker invariant ─────────────────────────────────────────
test("sbuclaw-orchestrator agent exists and is not cloned or renamed", async () => {
  const row = await pool.query<{
    id: number;
    slug: string;
    system_prompt: string;
    cloned_from_agent_id: number | null;
  }>(
    `SELECT id, slug, system_prompt, cloned_from_agent_id
       FROM agents WHERE slug='sbuclaw-orchestrator' LIMIT 1`,
  );
  assert.ok(row.rows[0], "sbuclaw-orchestrator must exist");
  assert.equal(row.rows[0].slug, "sbuclaw-orchestrator");
  assert.equal(row.rows[0].cloned_from_agent_id, null, "Must not be a clone");
  assert.match(row.rows[0].system_prompt, /SBUCLAW-ORCHESTRATOR/i, "Must contain SBUCLAW-ORCHESTRATOR marker");
  // Must have 10 sub-agents
  assert.match(row.rows[0].system_prompt, /10 SPESIALIS|10 spesialis|SUB-AGEN PARALEL/i);
});

test("sbu-skk-tutor agent has correct slug and educational prompt", async () => {
  const row = await pool.query<{
    slug: string;
    system_prompt: string;
    is_public: boolean;
  }>(
    `SELECT slug, system_prompt, is_public FROM agents WHERE slug='sbu-skk-tutor' LIMIT 1`,
  );
  assert.ok(row.rows[0], "sbu-skk-tutor agent must exist");
  assert.equal(row.rows[0].slug, "sbu-skk-tutor");
  assert.equal(row.rows[0].is_public, false, "Tutor must not be publicly accessible without entitlement");
  assert.match(row.rows[0].system_prompt, /SBU-SKK-TUTOR/, "Must contain SBU-SKK-TUTOR marker");
  assert.match(row.rows[0].system_prompt, /bab|halaman|disclaimer/i, "Must have educational/citation rules");
});

test("Tutor source store contains only real page chunks and returns page citations", async () => {
  const stats = await pool.query<{
    source_count: string;
    chunk_count: string;
    min_page: number;
    max_page: number;
  }>(
    `SELECT count(DISTINCT source_title)::text AS source_count,
            count(*)::text AS chunk_count,
            min(page_number)::int AS min_page,
            max(page_number)::int AS max_page
       FROM sbu_skk_tutor_sources`,
  );
  assert.equal(Number(stats.rows[0].source_count), 2);
  assert.ok(Number(stats.rows[0].chunk_count) >= 290);
  assert.ok(stats.rows[0].min_page >= 1);
  assert.equal(stats.rows[0].max_page, SBU_SKK_EBOOK.pages);

  const grounded = await buildTutorSourceContext(
    "persyaratan sertifikat badan usaha dan SKK tenaga kerja",
  );
  assert.ok(grounded.citations.length > 0);
  assert.match(grounded.context, /\[SUMBER: .+, Halaman \d+\]/);
  assert.ok(
    grounded.citations.every(
      (citation) =>
        citation.page >= 1 && citation.page <= SBU_SKK_EBOOK.pages,
    ),
  );
});

// ── 15. Lead asset stored privately (not in digital_product_files) ────────────
test("mini ebook is stored in lead_assets, NOT in digital_product_files", async () => {
  const leadAsset = await pool.query<{ id: number; sha256: string }>(
    `SELECT id, sha256 FROM lead_assets WHERE asset_slug=$1 LIMIT 1`,
    [SBU_SKK_FUNNEL.miniEbook.assetSlug],
  );
  assert.ok(leadAsset.rows[0], "Mini ebook must be in lead_assets");
  assert.equal(leadAsset.rows[0].sha256, MINI_EBOOK_SHA256, "Mini ebook hash must match");

  // Must NOT be in digital_product_files
  const dpf = await pool.query<{ id: number }>(
    `SELECT id FROM digital_product_files WHERE sha256=$1 LIMIT 1`,
    [MINI_EBOOK_SHA256],
  );
  assert.equal(dpf.rowCount, 0, "Mini ebook must NOT be in digital_product_files (paid access table)");
});
