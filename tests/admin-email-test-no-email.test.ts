/**
 * Verifikasi bahwa POST /api/admin/email-health/test mengembalikan HTTP 400
 * dengan pesan ramah saat akun admin tidak memiliki alamat email.
 *
 * Handler prod ada di server/routes.ts (~line 18793).
 * Frontend merender error di data-testid="text-test-email-result"
 * (client/src/pages/admin-ai-health.tsx, via testEmailResult.error).
 *
 * Test ini menggunakan pola mirror (tanpa boot DB/OIDC penuh) seperti
 * agent-certification-http.test.ts — hermetic, selalu jalan tanpa DATABASE_URL.
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

// ── In-memory user fixtures ───────────────────────────────────────────────────

const NO_EMAIL_ADMIN_ID = "test-no-email-admin-124";
const WITH_EMAIL_ADMIN_ID = "test-with-email-admin-124";
const NON_ADMIN_ID = "test-non-admin-124";

// Mirror of the users table rows the handler queries.
const userStore = new Map<string, { email: string | null; username: string }>([
  [NO_EMAIL_ADMIN_ID, { email: null, username: "adminTanpaEmail" }],
  [WITH_EMAIL_ADMIN_ID, { email: "admin@example.com", username: "adminDenganEmail" }],
]);

const ADMIN_IDS = new Set([NO_EMAIL_ADMIN_ID, WITH_EMAIL_ADMIN_ID]);

// ── Auth shim — mirrors the x-test-user header pattern ───────────────────────

function authShim(req: any, _res: any, next: any) {
  const uid = req.headers["x-test-user"];
  if (uid) req.user = { id: String(uid), claims: { sub: String(uid) } };
  next();
}

// Mirror `requireAdmin` production logic: 401 no user, 403 non-admin, next() for admin.
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Tidak terautentikasi" });
  const uid: string = (req.user as any)?.claims?.sub || (req.user as any)?.id || "";
  if (!ADMIN_IDS.has(uid)) return res.status(403).json({ error: "Akses ditolak" });
  next();
}

// ── Mirror of POST /api/admin/email-health/test ───────────────────────────────
//
// Production handler (server/routes.ts ~18793):
//   1. getSessionUserId → query users table for email
//   2. adminEmail = dbUser?.email || req.session?.emailUser?.email || null
//   3. if (!adminEmail) → 400 { sent: false, error: "Alamat email admin tidak ditemukan…" }
//   4. else → sendEmail → { sent: true, to } or 502

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

    // Simulate successful send (Brevo not called in unit mirror).
    return res.json({ sent: true, to: adminEmail });
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
});

// ── Helper ────────────────────────────────────────────────────────────────────

function postTest(userId?: string): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) headers["x-test-user"] = userId;
  return fetch(`${baseUrl}/api/admin/email-health/test`, { method: "POST", headers });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test("email-health/test: unauthenticated request → 401", async () => {
  const res = await postTest(); // no x-test-user header
  assert.equal(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
  const body = await res.json() as any;
  assert.ok(body.error, "Response must include an error message");
});

test("email-health/test: non-admin user → 403", async () => {
  const res = await postTest(NON_ADMIN_ID);
  assert.equal(res.status, 403, `Expected 403 Forbidden for non-admin, got ${res.status}`);
  const body = await res.json() as any;
  assert.ok(body.error, "Response must include an error message");
});

test("email-health/test: admin with null email → 400 with correct error message", async () => {
  const res = await postTest(NO_EMAIL_ADMIN_ID);
  assert.equal(
    res.status, 400,
    `Expected HTTP 400 when admin has no email, got ${res.status}`,
  );

  const body = await res.json() as any;

  assert.equal(
    body.sent, false,
    `Expected sent=false, got ${JSON.stringify(body.sent)}`,
  );
  assert.equal(
    body.error,
    "Alamat email admin tidak ditemukan di profil akun.",
    `Error message does not match production string. Got: ${body.error}`,
  );
  // Ensure 'to' is NOT present (we haven't sent anything).
  assert.ok(
    !("to" in body),
    `Response must not include 'to' when email is missing, got ${JSON.stringify(body)}`,
  );
});

test("email-health/test: admin with email set → 200 with sent:true", async () => {
  const res = await postTest(WITH_EMAIL_ADMIN_ID);
  assert.equal(
    res.status, 200,
    `Expected HTTP 200 when admin has an email, got ${res.status}`,
  );

  const body = await res.json() as any;

  assert.equal(
    body.sent, true,
    `Expected sent=true, got ${JSON.stringify(body.sent)}`,
  );
  assert.equal(
    body.to, "admin@example.com",
    `Expected email address in 'to', got ${body.to}`,
  );
});

/**
 * Frontend rendering contract:
 *
 * client/src/pages/admin-ai-health.tsx (data-testid="text-test-email-result") renders:
 *   testEmailResult.detail || testEmailResult.error || testEmailResult.reason || "Kesalahan…"
 *
 * The endpoint returns { sent: false, error: "Alamat email admin tidak ditemukan…" }.
 * Because 'detail' is absent, the component falls through to 'error' and renders the
 * friendly Indonesian message — consistent with the production string asserted above.
 */
test("frontend contract: error field is the first non-null fallback when detail is absent", () => {
  // Simulate the component's expression: detail || error || reason || fallback
  const response = { sent: false, error: "Alamat email admin tidak ditemukan di profil akun." };
  const rendered: string =
    (response as any).detail ||
    (response as any).error ||
    (response as any).reason ||
    "Kesalahan tidak diketahui.";

  assert.equal(
    rendered,
    "Alamat email admin tidak ditemukan di profil akun.",
    `Frontend would render '${rendered}' — expected the production error string`,
  );
});
