#!/usr/bin/env node
/**
 * Smoke test: Scalev payment link creation + webhook HMAC validation.
 *
 * Run:  npx tsx scripts/smoke-test-payments.ts
 *
 * NOTE: Mayar has been fully removed (server/lib/mayar.ts → deleted,
 * /api/payments/create-link → removed). All payment links now go through Scalev.
 * MAYAR_API_KEY / MAYAR_WEBHOOK_SECRET in Replit Secrets are unused — safe to delete.
 */

import crypto from "crypto";
import { verifyScalevWebhookAuth } from "../server/lib/meta-capi.js";

const SCALEV_API_URL = "https://api.scalev.id/v2";

let failures = 0;
function pass(msg: string) { console.log(`✅  ${msg}`); }
function fail(msg: string) { console.error(`❌  ${msg}`); failures++; }
function info(msg: string) { console.log(`ℹ️   ${msg}`); }
function warn(msg: string) { console.log(`⚠️   ${msg}`); }

// ── 1. Scalev API key validity ────────────────────────────────────────────────
async function checkScalevApiKey(): Promise<void> {
  const apiKey = process.env.SCALEV_API_KEY;
  if (!apiKey) { fail("SCALEV_API_KEY not set"); return; }

  const res = await fetch(`${SCALEV_API_URL}/products`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (res.ok) pass(`SCALEV_API_KEY valid (GET /v2/products → ${res.status})`);
  else fail(`SCALEV_API_KEY invalid (GET /v2/products → ${res.status})`);
}

// ── 2. Payment link creation ──────────────────────────────────────────────────
async function checkPaymentLinkCreation(): Promise<void> {
  const apiKey = process.env.SCALEV_API_KEY;
  if (!apiKey) { fail("Skipping payment link creation — SCALEV_API_KEY not set"); return; }

  const body = JSON.stringify({
    name: `SMOKE_TEST_${Date.now()}`,
    public_name: "SMOKE TEST — delete me",
    description: "Automated smoke test — safe to delete",
    item_type: "digital",
    status: "active",
    variants: [{ name: "Test", price: 1000 }],
  });

  const res = await fetch(`${SCALEV_API_URL}/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body,
  });

  const json = await res.json() as any;
  if (res.ok && json.code === 200) {
    const product = json.data;
    const checkoutUrl = `https://bayar.gustafta.my.id/p/${product.slug}`;
    pass(`Payment link created: ${checkoutUrl}`);
    info(`(product id=${product.id} slug=${product.slug} — delete from Scalev dashboard)`);
  } else {
    fail(`Payment link creation failed: HTTP ${res.status} — ${JSON.stringify(json).slice(0, 200)}`);
  }
}

// ── 3. Webhook HMAC / shared-secret validation (real, non-tautological) ───────
//
// Uses verifyScalevWebhookAuth (the exact same function the live webhook uses)
// and runs it against a test payload with correct and incorrect inputs.
//
function checkWebhookAuth(): void {
  const sharedSecret = process.env.SCALEV_WEBHOOK_SECRET;
  const signingSecret = process.env.SCALEV_SIGNING_SECRET;

  const testBody = JSON.stringify({
    data: { order_id: "smoke-001", payment_status: "paid", gross_revenue: "150000" },
  });
  const rawBody = Buffer.from(testBody);

  if (!sharedSecret && !signingSecret) {
    warn("No webhook secrets configured — /api/webhooks/scalev accepts all in legacy mode");
    return;
  }

  // ── HMAC path ──────────────────────────────────────────────────────────────
  if (signingSecret) {
    // Compute the correct hex digest using the actual key
    const correctHex = crypto.createHmac("sha256", signingSecret).update(rawBody).digest("hex");

    // POSITIVE: header with correct sha256 hex
    const resOk = verifyScalevWebhookAuth(rawBody, { "x-scalev-signature": correctHex }, {});
    if (resOk.authorized && (resOk.method === "signature" || resOk.method === "observe")) {
      pass(`Webhook HMAC — POSITIVE test: authorized=true method=${resOk.method}`);
    } else {
      fail(`Webhook HMAC — POSITIVE test failed: authorized=${resOk.authorized} method=${resOk.method}`);
    }

    // NEGATIVE: header with wrong signature
    const wrongSig = "a".repeat(64);
    const resWrong = verifyScalevWebhookAuth(rawBody, { "x-scalev-signature": wrongSig }, {});
    // Expected: not authorized via signature (falls through to shared-secret or rejected)
    if (!resWrong.sigValid) {
      pass(`Webhook HMAC — NEGATIVE test: wrong signature correctly rejected (sigValid=false)`);
    } else {
      fail(`Webhook HMAC — NEGATIVE test failed: wrong signature was accepted as valid`);
    }
  }

  // ── Shared-secret path ─────────────────────────────────────────────────────
  if (sharedSecret) {
    // POSITIVE: correct secret in header
    const resOk = verifyScalevWebhookAuth(rawBody, { "x-scalev-secret": sharedSecret }, {});
    if (resOk.authorized && resOk.method === "shared-secret") {
      pass(`Webhook shared-secret — POSITIVE test: authorized=true`);
    } else {
      fail(`Webhook shared-secret — POSITIVE test failed: authorized=${resOk.authorized} method=${resOk.method}`);
    }

    // NEGATIVE: wrong shared secret
    const resWrong = verifyScalevWebhookAuth(rawBody, { "x-scalev-secret": "wrong-secret" }, {});
    if (!resWrong.authorized) {
      pass(`Webhook shared-secret — NEGATIVE test: wrong secret correctly rejected`);
    } else {
      fail(`Webhook shared-secret — NEGATIVE test failed: wrong secret was accepted`);
    }

    // NEGATIVE: missing secret entirely
    const resMissing = verifyScalevWebhookAuth(rawBody, {}, {});
    if (!resMissing.authorized) {
      pass(`Webhook shared-secret — NEGATIVE test: missing secret correctly rejected`);
    } else {
      fail(`Webhook shared-secret — NEGATIVE test failed: missing secret was accepted`);
    }
  }
}

// ── 4. Mayar status ───────────────────────────────────────────────────────────
async function checkMayarStatus(): Promise<void> {
  const mayarKey = process.env.MAYAR_API_KEY;
  if (!mayarKey) {
    info("MAYAR_API_KEY not set — Mayar fully removed (no action needed)");
    return;
  }

  const res = await fetch("https://api.mayar.id/hl/v1/payment", {
    headers: { Authorization: `Bearer ${mayarKey}` },
  }).catch(() => null);

  if (!res) {
    info("Mayar API unreachable — Mayar removed from code, key and secret can be deleted from Replit Secrets");
  } else if (res.status === 401) {
    info(`MAYAR_API_KEY → 401 (expired/invalid). Mayar removed from codebase — safe to delete secret.`);
  } else {
    info(`MAYAR_API_KEY → ${res.status}. Mayar removed from codebase — safe to delete secret.`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log("=== Gustafta Payment Smoke Tests ===\n");

  await checkScalevApiKey();
  await checkPaymentLinkCreation();
  checkWebhookAuth();
  await checkMayarStatus();

  console.log(`\nDone. ${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED — see above.`}`);
  if (failures > 0) process.exit(1);
})();
