/**
 * Task 205 — Verifikasi bahwa POST /api/admin/email-health/test mengembalikan
 * HTTP 502 dengan { sent: false, reason: "not_configured" } saat Brevo tidak
 * dikonfigurasi (BREVO_API_KEY absen).
 *
 * Handler prod ada di server/routes.ts (~line 18905): saat sendEmail
 * mengembalikan { sent: false, reason }, handler membalas
 *   502 { sent: false, reason, detail: result.detail || null, to }.
 *
 * Berbeda dari mirror test companion (admin-email-test-no-email.test.ts),
 * test ini memakai sendEmail ASLI dari server/lib/email.ts dengan
 * BREVO_API_KEY dihapus dari env — sehingga jalur "not_configured" yang
 * sebenarnya ikut teruji, bukan sekadar simulasi.
 *
 * Frontend merender error di data-testid="text-test-email-result"
 * (client/src/pages/admin-ai-health.tsx) via rantai fallback:
 *   detail || error || reason || "Kesalahan tidak diketahui."
 * Karena respons 502 ini membawa detail: null dan tanpa error, komponen
 * jatuh ke fallback KETIGA (reason) → "not_configured".
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { sendEmail } from "../server/lib/email";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Pastikan Brevo TIDAK terkonfigurasi selama test ini ──────────────────────

const savedBrevoKey = process.env.BREVO_API_KEY;
delete process.env.BREVO_API_KEY;

// ── In-memory user fixtures ───────────────────────────────────────────────────

const ADMIN_ID = "test-admin-205";
const NO_EMAIL_ADMIN_ID = "test-no-email-admin-205";

const userStore = new Map<string, { email: string | null; username: string }>([
  [ADMIN_ID, { email: "admin@example.com", username: "adminBrevo" }],
  [NO_EMAIL_ADMIN_ID, { email: null, username: "adminTanpaEmail" }],
]);

const ADMIN_IDS = new Set([ADMIN_ID, NO_EMAIL_ADMIN_ID]);

// ── Auth shim — mirrors the x-test-user header pattern ───────────────────────

function authShim(req: any, _res: any, next: any) {
  const uid = req.headers["x-test-user"];
  if (uid) req.user = { id: String(uid), claims: { sub: String(uid) } };
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Tidak terautentikasi" });
  const uid: string = (req.user as any)?.claims?.sub || (req.user as any)?.id || "";
  if (!ADMIN_IDS.has(uid)) return res.status(403).json({ error: "Akses ditolak" });
  next();
}

// ── Mirror of POST /api/admin/email-health/test (server/routes.ts ~18905) ────
//
// The DB lookup is replaced with userStore; the sendEmail call is the REAL
// helper. With BREVO_API_KEY unset, it returns { sent:false, reason:"not_configured" }
// and the handler's else-branch answers 502 — identical to production.

const app = express();
app.use(express.json());
app.use(authShim);

app.post("/api/admin/email-health/test", requireAdmin, async (req: any, res: any) => {
  try {
    const userId: string = (req.user as any)?.claims?.sub || (req.user as any)?.id || "";
    const dbUser = userStore.get(userId) ?? null;
    const adminEmail: string | null = dbUser?.email || req.session?.emailUser?.email || null;

    if (!adminEmail) {
      return res.status(400).json({
        sent: false,
        error: "Alamat email admin tidak ditemukan di profil akun.",
      });
    }

    const result = await sendEmail({
      to: adminEmail,
      toName: dbUser?.username || "Admin",
      subject: "✅ Tes Pengiriman Email — Gustafta",
      htmlContent: "<p>test</p>",
      textContent: "test",
      tags: ["admin-test", "transactional"],
    });

    if (result.sent) {
      return res.json({ sent: true, to: adminEmail });
    } else {
      return res.status(502).json({
        sent: false,
        reason: result.reason,
        detail: result.detail || null,
        to: adminEmail,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ sent: false, error: err?.message || "Terjadi kesalahan." });
  }
});

// ── Server lifecycle ──────────────────────────────────────────────────────────

let server: Server;
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  // Restore env so other tests in the same process are unaffected.
  if (savedBrevoKey !== undefined) process.env.BREVO_API_KEY = savedBrevoKey;
});

// ── Helper ────────────────────────────────────────────────────────────────────

function postTest(userId?: string): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) headers["x-test-user"] = userId;
  return fetch(`${baseUrl}/api/admin/email-health/test`, { method: "POST", headers });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test("sendEmail (real helper) without BREVO_API_KEY → { sent:false, reason:'not_configured' }", async () => {
  const result = await sendEmail({
    to: "someone@example.com",
    subject: "unit",
    htmlContent: "<p>x</p>",
    textContent: "x",
  });
  assert.equal(result.sent, false, "sendEmail must not report sent=true without a key");
  assert.equal(
    (result as any).reason,
    "not_configured",
    `Expected reason 'not_configured', got ${JSON.stringify(result)}`,
  );
  assert.equal(
    (result as any).detail,
    undefined,
    "not_configured result must not carry a detail field",
  );
});

test("email-health/test: Brevo unconfigured → HTTP 502 { sent:false, reason:'not_configured' }", async () => {
  const res = await postTest(ADMIN_ID);
  assert.equal(res.status, 502, `Expected HTTP 502 when Brevo is unconfigured, got ${res.status}`);

  const body = await res.json() as any;
  assert.equal(body.sent, false, `Expected sent=false, got ${JSON.stringify(body.sent)}`);
  assert.equal(
    body.reason,
    "not_configured",
    `Expected reason 'not_configured', got ${JSON.stringify(body.reason)}`,
  );
  assert.equal(body.detail, null, "detail must be null on the not_configured path");
  assert.equal(body.to, "admin@example.com", "502 body still names the intended recipient");
});

test("email-health/test: missing-email guard still wins over Brevo check (400, not 502)", async () => {
  const res = await postTest(NO_EMAIL_ADMIN_ID);
  assert.equal(res.status, 400, `Expected 400 (no admin email) before any Brevo call, got ${res.status}`);
  const body = await res.json() as any;
  assert.equal(body.sent, false);
  assert.ok(!("reason" in body), "no-email path must not expose a Brevo reason");
});

/**
 * Frontend rendering contract (client/src/pages/admin-ai-health.tsx,
 * data-testid="text-test-email-result"):
 *
 *   Gagal mengirim email uji: {detail || error || reason || "Kesalahan tidak diketahui."}
 *
 * The 502 body is { sent:false, reason:'not_configured', detail:null, to }.
 * detail is null (falsy) and error is absent → the THIRD fallback (reason)
 * is rendered, so the admin sees "not_configured" instead of a blank banner.
 */
// ── Static checks against production sources ─────────────────────────────────
// These read the real files so the mirror above cannot drift silently from
// the registered production handler or the rendered React component.

test("static: production handler returns 502 with reason/detail when sendEmail fails", () => {
  const src = readFileSync(resolve(__dirname, "../server/routes.ts"), "utf8");
  const idx = src.indexOf('"/api/admin/email-health/test"');
  assert.ok(idx > -1, "POST /api/admin/email-health/test route must exist in server/routes.ts");
  const handler = src.slice(idx, idx + 4000);
  assert.match(
    handler,
    /status\(502\)\.json\(\{\s*sent:\s*false,\s*reason:\s*result\.reason,\s*detail:\s*result\.detail\s*\|\|\s*null/,
    "Handler must answer 502 { sent:false, reason: result.reason, detail: result.detail || null } on send failure",
  );
  assert.match(
    handler,
    /Alamat email admin tidak ditemukan di profil akun\./,
    "Handler must keep the no-admin-email 400 guard before the Brevo call",
  );
});

test("static: production sendEmail returns reason 'not_configured' when BREVO_API_KEY is absent", () => {
  const src = readFileSync(resolve(__dirname, "../server/lib/email.ts"), "utf8");
  assert.match(
    src,
    /if\s*\(!brevoApiKey\)\s*\{[\s\S]{0,300}?return\s*\{\s*sent:\s*false,\s*reason:\s*"not_configured"\s*\}/,
    "sendEmail must short-circuit to { sent:false, reason:'not_configured' } without a key",
  );
});

test("static: admin-ai-health banner renders detail || error || reason fallback chain", () => {
  const src = readFileSync(resolve(__dirname, "../client/src/pages/admin-ai-health.tsx"), "utf8");
  assert.ok(
    src.includes('data-testid="text-test-email-result"'),
    "Banner element with data-testid='text-test-email-result' must exist",
  );
  assert.match(
    src,
    /testEmailResult\.detail\s*\|\|\s*testEmailResult\.error\s*\|\|\s*testEmailResult\.reason\s*\|\|/,
    "Banner must render the detail || error || reason fallback chain so 'not_configured' surfaces",
  );
});

test("frontend contract: reason is the rendered fallback for the not_configured 502 body", () => {
  const response = { sent: false, reason: "not_configured", detail: null, to: "admin@example.com" };
  const rendered: string =
    (response as any).detail ||
    (response as any).error ||
    (response as any).reason ||
    "Kesalahan tidak diketahui.";

  assert.equal(
    rendered,
    "not_configured",
    `Frontend would render '${rendered}' — expected the reason fallback 'not_configured'`,
  );
});
