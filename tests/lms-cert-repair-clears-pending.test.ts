/**
 * Task #176 — Repair button clears the red alert after all missing
 * certificates are issued.
 *
 * Integrasi DB nyata:
 * 1. Seed enrollment progress=100 + completed_at TANPA baris sertifikat.
 * 2. GET /api/admin/lms/health → pendingCertificates naik (kondisi merah).
 * 3. POST /api/admin/lms/cert-repair → sertifikat diterbitkan.
 * 4. GET health lagi → pendingCertificates kembali 0 (alert merah hilang,
 *    karena UI menampilkan merah + tombol Perbaiki hanya jika > 0).
 *
 * Dilewati otomatis bila DATABASE_URL tidak ada (CI tanpa DB).
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `cert_repair_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_ADMIN_ID = `test-admin-${RUN}`;
const TEST_NON_ADMIN_ID = `test-user-${RUN}`;

let server: Server;
let baseUrl: string;
const createdCourseIds: number[] = [];

async function queryDb(sql: string, params: any[] = []) {
  const { pool } = await import("../server/db");
  const r = await pool.query(sql, params);
  return r.rows;
}

before(async () => {
  if (!hasDb) return;
  const { registerLmsRoutes } = await import("../server/routes-lms");

  const app = express();
  app.use(express.json());

  // Auth shim: x-test-user header simulates authenticated session.
  app.use((req: any, _res: any, next: any) => {
    const uid = req.headers["x-test-user"];
    if (uid) {
      req.user = { id: String(uid), claims: { sub: String(uid) } };
      req.isAuthenticated = () => true;
    } else {
      req.isAuthenticated = () => false;
    }
    next();
  });

  const origAdminIds = process.env.ADMIN_USER_IDS ?? "";
  process.env.ADMIN_USER_IDS = origAdminIds
    ? `${origAdminIds},${TEST_ADMIN_ID}`
    : TEST_ADMIN_ID;

  registerLmsRoutes(app);

  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  if (!hasDb) return;
  if (createdCourseIds.length > 0) {
    const ids = createdCourseIds.join(",");
    await queryDb(`DELETE FROM lms_lesson_progress WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_certificates    WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_enrollments     WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_lessons         WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_courses         WHERE id        IN (${ids})`);
  }
  if (server) await new Promise<void>((r) => server.close(() => r()));
  const { pool } = await import("../server/db");
  await pool.end();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getHealth(userId?: string) {
  return fetch(`${baseUrl}/api/admin/lms/health`, {
    headers: userId ? { "x-test-user": userId } : {},
  });
}

function postCertRepair(userId?: string) {
  return fetch(`${baseUrl}/api/admin/lms/cert-repair`, {
    method: "POST",
    headers: userId ? { "x-test-user": userId } : {},
  });
}

async function seedCourse(): Promise<number> {
  const slug = `cert-repair-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, is_public, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', true, true, 999, 0, 'beginner')
     RETURNING id`,
    [`Cert Repair Course ${slug}`, slug]
  );
  const id = row.id as number;
  createdCourseIds.push(id);
  return id;
}

/** Completed enrollment (progress=100, completed_at set) with NO certificate row. */
async function seedCompletedEnrollmentWithoutCert(userId: string, courseId: number) {
  await queryDb(
    `INSERT INTO lms_enrollments (user_id, course_id, progress, completed_at)
     VALUES ($1, $2, 100, NOW())`,
    [userId, courseId]
  );
}

async function waitForSeedDone(timeoutMs = 15_000): Promise<any> {
  const TERMINAL = new Set(["done", "skipped", "error"]);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await getHealth(TEST_ADMIN_ID);
    if (res.status === 200) {
      const body = (await res.json()) as any;
      if (TERMINAL.has(body.seedStatus)) return body;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`seedStatus still 'pending' after ${timeoutMs}ms`);
}

// ── Auth gates ────────────────────────────────────────────────────────────────

test("cert-repair: unauthenticated → 401", { skip: SKIP }, async () => {
  const res = await postCertRepair();
  assert.equal(res.status, 401, `Expected 401, got ${res.status}`);
});

test("cert-repair: non-admin → 403", { skip: SKIP }, async () => {
  const res = await postCertRepair(TEST_NON_ADMIN_ID);
  assert.equal(res.status, 403, `Expected 403, got ${res.status}`);
});

// ── Core scenario: repair clears pendingCertificates back to 0 ────────────────

test("cert-repair: issues certs for all pending completions and health returns pendingCertificates=0", { skip: SKIP }, async () => {
  await waitForSeedDone();

  // 0. Precondition: make sure any pre-existing pending completions are repaired
  //    first, so the final assertion of 0 is entirely about OUR fixtures.
  const preRepair = await postCertRepair(TEST_ADMIN_ID);
  assert.equal(preRepair.status, 200, "Pre-repair must succeed");

  const res0 = await getHealth(TEST_ADMIN_ID);
  assert.equal(res0.status, 200);
  const { counts: baseline } = (await res0.json()) as any;
  assert.equal(
    baseline.pendingCertificates, 0,
    `Baseline pendingCertificates must be 0 after pre-repair, got ${baseline.pendingCertificates}`
  );

  // 1. Seed TWO completed enrollments with no certificate rows.
  const courseId = await seedCourse();
  const studentA = `cert-repair-a-${RUN}`;
  const studentB = `cert-repair-b-${RUN}`;
  await seedCompletedEnrollmentWithoutCert(studentA, courseId);
  await seedCompletedEnrollmentWithoutCert(studentB, courseId);

  // 2. Health must now report pendingCertificates = 2 (red alert condition).
  const res1 = await getHealth(TEST_ADMIN_ID);
  assert.equal(res1.status, 200);
  const { counts: withGap } = (await res1.json()) as any;
  assert.equal(
    withGap.pendingCertificates, 2,
    `pendingCertificates must be 2 after seeding gaps, got ${withGap.pendingCertificates}`
  );

  // 3. POST cert-repair — must backfill both.
  const repairRes = await postCertRepair(TEST_ADMIN_ID);
  assert.equal(repairRes.status, 200, `cert-repair must return 200, got ${repairRes.status}`);
  const repairBody = (await repairRes.json()) as any;
  assert.equal(repairBody.ok, true, "cert-repair response must have ok=true");
  assert.equal(repairBody.total, 2, `repair total must be 2, got ${repairBody.total}`);
  assert.equal(repairBody.backfilled, 2, `backfilled must be 2, got ${repairBody.backfilled}`);
  assert.equal(repairBody.stillPending, 0, `stillPending must be 0, got ${repairBody.stillPending}`);

  // 4. Certificates really exist in DB with valid codes.
  const certs = await queryDb(
    `SELECT user_id, certificate_code FROM lms_certificates WHERE course_id = $1`,
    [courseId]
  );
  assert.equal(certs.length, 2, `Exactly 2 certificate rows expected, got ${certs.length}`);
  for (const c of certs) {
    assert.match(
      String(c.certificate_code), /^GUSTAFTA-\d{4}-[A-Z2-9]{8}$/,
      `Certificate code format invalid: ${c.certificate_code}`
    );
  }

  // 5. Re-fetch health — pendingCertificates back to 0 (the UI condition that
  //    hides the red highlight and the Perbaiki button).
  const res2 = await getHealth(TEST_ADMIN_ID);
  assert.equal(res2.status, 200);
  const body2 = (await res2.json()) as any;
  assert.equal(
    body2.counts.pendingCertificates, 0,
    `pendingCertificates must be 0 after repair, got ${body2.counts.pendingCertificates}`
  );

  // 6. lastBackfill metadata reflects this repair run.
  assert.ok(body2.lastBackfill, "lastBackfill must be present after repair");
  assert.equal(body2.lastBackfill.backfilled, 2, "lastBackfill.backfilled must be 2");
  assert.equal(body2.lastBackfill.total, 2, "lastBackfill.total must be 2");

  // 7. Idempotent: a second repair finds nothing to do.
  const repair2 = await postCertRepair(TEST_ADMIN_ID);
  assert.equal(repair2.status, 200);
  const repair2Body = (await repair2.json()) as any;
  assert.equal(repair2Body.total, 0, `Second repair total must be 0, got ${repair2Body.total}`);
});
