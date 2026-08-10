/**
 * Task 206 — Verifikasi bahwa timestamp "terakhir diuji" SELAMAT dari reload
 * halaman:
 *   (a) POST /api/admin/email-health/test (sendEmail di-mock sukses) meng-upsert
 *       kunci system_config `email_test_last_sent_at` + `email_test_last_sent_to`
 *       ke DATABASE ASLI, dan
 *   (b) GET /api/admin/email-health pada request BERIKUTNYA mengembalikan
 *       lastTestedAt & lastTestedTo dari DB — bukan dari memori proses.
 *
 * Handler produksi ada di server/routes.ts:
 *   - POST ~line 18905: setelah result.sent → insert..onConflictDoUpdate dua kunci.
 *   - GET  ~line 18806: select kedua kunci dari system_config, sertakan di
 *     setiap cabang respons (not_configured / ok / ip_blocked / api_error /
 *     network_error).
 *
 * Pola test: mirror express app (auth shim x-test-user) dengan sendEmail
 * DI-MOCK sukses, tetapi persistensi memakai db + systemConfig NYATA — sehingga
 * round-trip upsert→select yang sebenarnya ikut teruji. GET mirror sengaja
 * memakai jalur "not_configured" (tanpa BREVO_API_KEY) karena cabang itu pun
 * wajib membawa lastTestedAt/lastTestedTo.
 *
 * DB safety: nilai kedua kunci di-snapshot di before() dan direstore/dihapus
 * di after(), sehingga data "last tested" milik admin tidak berubah permanen.
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { db } from "../server/db";
import { systemConfig } from "../shared/schema";
import { eq, inArray, sql as sqlExpr } from "drizzle-orm";

const __dirname = dirname(fileURLToPath(import.meta.url));

const KEY_AT = "email_test_last_sent_at";
const KEY_TO = "email_test_last_sent_to";

// ── Snapshot nilai asli agar test tidak mengubah data admin secara permanen ──
let snapshotAt: string | null | undefined; // undefined = row tidak ada
let snapshotTo: string | null | undefined;

async function readKeys(): Promise<{ at?: string | null; to?: string | null }> {
  const rows = await db
    .select({ key: systemConfig.key, value: systemConfig.value })
    .from(systemConfig)
    .where(inArray(systemConfig.key, [KEY_AT, KEY_TO]));
  const out: { at?: string | null; to?: string | null } = {};
  for (const r of rows) {
    if (r.key === KEY_AT) out.at = r.value as string | null;
    if (r.key === KEY_TO) out.to = r.value as string | null;
  }
  return out;
}

// ── Auth shim + admin fixture (pola x-test-user seperti test lain) ───────────

const ADMIN_ID = "test-admin-206";
const ADMIN_EMAIL = "admin-206@example.com";

function authShim(req: any, _res: any, next: any) {
  const uid = req.headers["x-test-user"];
  if (uid) req.user = { id: String(uid), claims: { sub: String(uid) } };
  next();
}
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Tidak terautentikasi" });
  const uid: string = (req.user as any)?.claims?.sub || (req.user as any)?.id || "";
  if (uid !== ADMIN_ID) return res.status(403).json({ error: "Akses ditolak" });
  next();
}

// ── sendEmail DI-MOCK sukses ─────────────────────────────────────────────────
let sendEmailCalls = 0;
async function sendEmailMock(_opts: any): Promise<{ sent: boolean }> {
  sendEmailCalls++;
  return { sent: true };
}

// ── Mirror POST /api/admin/email-health/test (server/routes.ts ~18905) ───────
// Persistence path identik dengan produksi: insert..onConflictDoUpdate ke DB asli.

const app = express();
app.use(express.json());
app.use(authShim);

app.post("/api/admin/email-health/test", requireAdmin, async (req: any, res: any) => {
  try {
    const adminEmail = ADMIN_EMAIL;
    const result = await sendEmailMock({ to: adminEmail });
    if (result.sent) {
      const now = new Date().toISOString();
      await db
        .insert(systemConfig)
        .values([
          { key: KEY_AT, value: now },
          { key: KEY_TO, value: adminEmail },
        ])
        .onConflictDoUpdate({
          target: systemConfig.key,
          set: { value: sqlExpr`excluded.value` },
        });
      return res.json({ sent: true, to: adminEmail });
    }
    return res.status(502).json({ sent: false });
  } catch (err: any) {
    return res.status(500).json({ sent: false, error: err?.message });
  }
});

// ── Mirror GET /api/admin/email-health (server/routes.ts ~18806) ─────────────
// Membaca kedua kunci dari system_config seperti produksi; jalur not_configured
// (tanpa API key) tetap menyertakan lastTestedAt/lastTestedTo.

app.get("/api/admin/email-health", requireAdmin, async (_req: any, res: any) => {
  let lastTestedAt: string | null = null;
  let lastTestedTo: string | null = null;
  try {
    const rows = await db
      .select({ key: systemConfig.key, value: systemConfig.value })
      .from(systemConfig)
      .where(inArray(systemConfig.key, [KEY_AT, KEY_TO]));
    for (const r of rows) {
      if (r.key === KEY_AT) lastTestedAt = r.value as string | null;
      if (r.key === KEY_TO) lastTestedTo = r.value as string | null;
    }
  } catch (_e) { /* non-fatal */ }
  return res.json({
    configured: false,
    status: "not_configured",
    lastTestedAt,
    lastTestedTo,
    timestamp: new Date().toISOString(),
  });
});

// ── Server lifecycle ──────────────────────────────────────────────────────────

let server: Server;
let baseUrl: string;

before(async () => {
  const snap = await readKeys();
  snapshotAt = snap.at;
  snapshotTo = snap.to;
  await new Promise<void>((resolveFn) => {
    server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolveFn();
    });
  });
});

after(async () => {
  // Restore nilai asli (atau hapus bila sebelumnya tidak ada).
  try {
    if (snapshotAt !== undefined) {
      await db.insert(systemConfig).values({ key: KEY_AT, value: snapshotAt })
        .onConflictDoUpdate({ target: systemConfig.key, set: { value: snapshotAt } });
    } else {
      await db.delete(systemConfig).where(eq(systemConfig.key, KEY_AT));
    }
    if (snapshotTo !== undefined) {
      await db.insert(systemConfig).values({ key: KEY_TO, value: snapshotTo })
        .onConflictDoUpdate({ target: systemConfig.key, set: { value: snapshotTo } });
    } else {
      await db.delete(systemConfig).where(eq(systemConfig.key, KEY_TO));
    }
  } finally {
    await new Promise<void>((resolveFn) => server.close(() => resolveFn()));
  }
});

function req(method: string, path: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "x-test-user": ADMIN_ID },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test("POST test-email (sendEmail mocked sukses) → upsert kedua kunci system_config di DB", async () => {
  const beforeTs = Date.now();
  const res = await req("POST", "/api/admin/email-health/test");
  assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
  const body = await res.json() as any;
  assert.equal(body.sent, true);
  assert.equal(sendEmailCalls >= 1, true, "sendEmail mock harus dipanggil");

  // Verifikasi langsung di DB (bukan lewat memori proses).
  const rows = await readKeys();
  assert.ok(rows.at, `Kunci ${KEY_AT} harus ter-upsert di system_config`);
  assert.equal(rows.to, ADMIN_EMAIL, `Kunci ${KEY_TO} harus berisi email admin`);
  const at = Date.parse(rows.at as string);
  assert.ok(Number.isFinite(at), "lastTestedAt harus ISO timestamp valid");
  assert.ok(at >= beforeTs - 5_000, "lastTestedAt harus timestamp baru, bukan sisa lama");
});

test("GET email-health pada request berikutnya → lastTestedAt & lastTestedTo hadir (survive reload)", async () => {
  const res = await req("GET", "/api/admin/email-health");
  assert.equal(res.status, 200);
  const body = await res.json() as any;
  assert.ok(typeof body.lastTestedAt === "string" && body.lastTestedAt.length > 0,
    `lastTestedAt harus hadir di respons GET, got ${JSON.stringify(body.lastTestedAt)}`);
  assert.equal(body.lastTestedTo, ADMIN_EMAIL,
    "lastTestedTo harus mengembalikan email yang dipakai POST sebelumnya");
});

test("POST kedua meng-UPDATE (bukan duplikat) — upsert onConflictDoUpdate", async () => {
  const firstRows = await readKeys();
  await new Promise((r) => setTimeout(r, 20));
  const res = await req("POST", "/api/admin/email-health/test");
  assert.equal(res.status, 200);
  const secondRows = await readKeys();
  assert.ok(secondRows.at && firstRows.at && secondRows.at !== firstRows.at,
    "POST kedua harus memperbarui timestamp yang sama, bukan gagal karena duplikat kunci");
  // Tetap hanya satu row per kunci.
  const dupCheck = await db
    .select({ key: systemConfig.key })
    .from(systemConfig)
    .where(inArray(systemConfig.key, [KEY_AT, KEY_TO]));
  assert.equal(dupCheck.length, 2, "system_config harus tepat 1 row per kunci");
});

// ── Static checks agar mirror tidak drift dari handler produksi ──────────────

test("static: POST produksi meng-upsert kedua kunci setelah result.sent", () => {
  const src = readFileSync(resolve(__dirname, "../server/routes.ts"), "utf8");
  const idx = src.indexOf('"/api/admin/email-health/test"');
  assert.ok(idx > -1, "Route POST /api/admin/email-health/test harus ada");
  const handler = src.slice(idx, idx + 6000);
  assert.match(handler, /email_test_last_sent_at/, "POST harus menulis email_test_last_sent_at");
  assert.match(handler, /email_test_last_sent_to/, "POST harus menulis email_test_last_sent_to");
  assert.match(handler, /onConflictDoUpdate/, "Persistensi harus upsert (onConflictDoUpdate)");
});

test("static: GET produksi membaca kedua kunci dan mengembalikan lastTestedAt/lastTestedTo di semua cabang", () => {
  const src = readFileSync(resolve(__dirname, "../server/routes.ts"), "utf8");
  const idx = src.indexOf('"/api/admin/email-health"');
  assert.ok(idx > -1, "Route GET /api/admin/email-health harus ada");
  const handler = src.slice(idx, idx + 8000);
  assert.match(handler, /email_test_last_sent_at/, "GET harus membaca email_test_last_sent_at");
  assert.match(handler, /email_test_last_sent_to/, "GET harus membaca email_test_last_sent_to");
  const atCount = (handler.match(/lastTestedAt,/g) || []).length;
  const toCount = (handler.match(/lastTestedTo,/g) || []).length;
  assert.ok(atCount >= 5, `lastTestedAt harus disertakan di semua (≥5) cabang respons, found ${atCount}`);
  assert.ok(toCount >= 5, `lastTestedTo harus disertakan di semua (≥5) cabang respons, found ${toCount}`);
});
