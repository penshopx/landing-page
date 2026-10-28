/**
 * Integrasi DB nyata — memverifikasi bahwa sertifikat tetap utuh setelah
 * student re-enroll ke kursus yang sudah diselesaikan (enrollment dihapus
 * oleh admin, lalu student mendaftar ulang dan menyelesaikan lagi).
 *
 * Skenario yang diuji:
 *   1. Enroll → selesaikan semua lesson → sertifikat diterbitkan.
 *   2. Admin menghapus baris enrollment (reset).
 *   3. Re-enroll → selesaikan semua lesson lagi.
 *   4. Sertifikat sama (kode tidak berubah), tidak ada 500.
 *
 * Dilewati otomatis bila DATABASE_URL tidak ada (CI tanpa DB).
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

// ── Guards & env ──────────────────────────────────────────────────────────────

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `lms_reenroll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_USER_ID = `test-user-reenroll-${RUN}`;

// Stub BREVO so fire-and-forget email calls don't hit the real API.
process.env.BREVO_API_KEY = ["test-brev", "o-key-stub"].join("");

const originalFetch = globalThis.fetch;
(globalThis as any).fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
  const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : (url as Request).url;
  if (urlStr.includes("api.brevo.com")) {
    return new Response(JSON.stringify({ messageId: "stub" }), { status: 201 });
  }
  return originalFetch(url as any, init);
};

// ── DB helper ─────────────────────────────────────────────────────────────────

async function queryDb(sql: string, params: any[] = []) {
  const { pool } = await import("../server/db");
  const r = await pool.query(sql, params);
  return r.rows;
}

// ── Express test server ───────────────────────────────────────────────────────

let server: Server;
let baseUrl: string;
const createdCourseIds: number[] = [];

before(async () => {
  if (!hasDb) return;

  // Seed the test user row.
  await queryDb(
    `INSERT INTO users (id, email, first_name, role, is_active)
     VALUES ($1, $2, $3, 'user', true)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, first_name = EXCLUDED.first_name`,
    [TEST_USER_ID, `reenroll-${RUN}@example.com`, `Student ${RUN}`]
  );

  const { registerLmsRoutes } = await import("../server/routes-lms");

  const app = express();
  app.use(express.json());

  // Auth shim: x-test-user header sets req.user.
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

  registerLmsRoutes(app);

  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  if (!hasDb) return;

  (globalThis as any).fetch = originalFetch;

  if (createdCourseIds.length > 0) {
    const ids = createdCourseIds.join(",");
    await queryDb(`DELETE FROM lms_lesson_progress WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_certificates    WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_enrollments     WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_lessons         WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_courses         WHERE id        IN (${ids})`);
  }

  await queryDb(`DELETE FROM users WHERE id = $1`, [TEST_USER_ID]).catch(() => {});

  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function seedCourse(): Promise<number> {
  const slug = `reenroll-course-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, is_public, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', true, true, 999, 0, 'beginner')
     RETURNING id`,
    [`Re-enroll Test Course ${slug}`, slug]
  );
  const id = row.id as number;
  createdCourseIds.push(id);
  return id;
}

async function seedLesson(courseId: number, sortOrder = 1): Promise<number> {
  const slug = `lesson-reenroll-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_lessons (course_id, title, slug, type, duration_minutes, sort_order, is_active)
     VALUES ($1, $2, $3, 'article', 5, $4, true)
     RETURNING id`,
    [courseId, `Lesson ${slug}`, slug, sortOrder]
  );
  return row.id as number;
}

/** POST /api/lms/enroll/:courseId */
async function enroll(userId: string, courseId: number): Promise<Response> {
  return fetch(`${baseUrl}/api/lms/enroll/${courseId}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-test-user": userId },
  });
}

/** POST /api/lms/progress */
async function markProgress(userId: string, lessonId: number, courseId: number): Promise<Response> {
  return fetch(`${baseUrl}/api/lms/progress`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-test-user": userId },
    body: JSON.stringify({ lessonId, courseId }),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test(
  "re-enroll: existing certificate is preserved after admin wipes enrollment and student completes again",
  { skip: SKIP },
  async () => {
    // ── 1. Set up a course with two lessons ──────────────────────────────────
    const courseId = await seedCourse();
    const lesson1 = await seedLesson(courseId, 1);
    const lesson2 = await seedLesson(courseId, 2);

    // ── 2. First enrollment ──────────────────────────────────────────────────
    const enrollRes1 = await enroll(TEST_USER_ID, courseId);
    assert.equal(enrollRes1.status, 200, `First enroll should succeed, got ${enrollRes1.status}`);

    // ── 3. Complete all lessons → certificate issued ─────────────────────────
    const prog1 = await markProgress(TEST_USER_ID, lesson1, courseId);
    assert.equal(prog1.status, 200, `Marking lesson1 complete should succeed, got ${prog1.status}`);
    const body1 = await prog1.json() as any;
    assert.equal(body1.progress, 50, `Progress after lesson1 should be 50, got ${body1.progress}`);

    const prog2 = await markProgress(TEST_USER_ID, lesson2, courseId);
    assert.equal(prog2.status, 200, `Marking lesson2 complete should succeed, got ${prog2.status}`);
    const body2 = await prog2.json() as any;
    assert.equal(body2.progress, 100, `Progress after lesson2 should be 100, got ${body2.progress}`);
    assert.ok(body2.certificateCode, "First completion must return a certificateCode");

    const originalCertCode = body2.certificateCode as string;

    // Verify the cert row exists in DB.
    const [certRow] = await queryDb(
      `SELECT certificate_code FROM lms_certificates WHERE user_id = $1 AND course_id = $2`,
      [TEST_USER_ID, courseId]
    );
    assert.ok(certRow, "Certificate row must exist in DB after first completion");
    assert.equal(certRow.certificate_code, originalCertCode, "DB cert code must match response code");

    // ── 4. Admin deletes the enrollment (but NOT the certificate) ────────────
    await queryDb(
      `DELETE FROM lms_enrollments WHERE user_id = $1 AND course_id = $2`,
      [TEST_USER_ID, courseId]
    );
    // Also clear lesson progress so the student appears to start fresh.
    await queryDb(
      `DELETE FROM lms_lesson_progress WHERE user_id = $1 AND course_id = $2`,
      [TEST_USER_ID, courseId]
    );

    // Confirm enrollment is gone.
    const [enrollCheck] = await queryDb(
      `SELECT id FROM lms_enrollments WHERE user_id = $1 AND course_id = $2`,
      [TEST_USER_ID, courseId]
    );
    assert.equal(enrollCheck, undefined, "Enrollment row must be deleted before re-enroll");

    // ── 5. Re-enroll ─────────────────────────────────────────────────────────
    const enrollRes2 = await enroll(TEST_USER_ID, courseId);
    assert.equal(enrollRes2.status, 200, `Re-enroll should succeed with 200, got ${enrollRes2.status}`);
    const enrollBody2 = await enrollRes2.json() as any;
    // Because a cert already exists, re-enrollment must start at progress=100.
    assert.equal(
      enrollBody2.progress, 100,
      `Re-enrollment progress should start at 100 (cert exists), got ${enrollBody2.progress}`
    );

    // ── 6. Complete all lessons again ────────────────────────────────────────
    // Re-insert progress rows (simulating student clicking through lessons again).
    const reprog1 = await markProgress(TEST_USER_ID, lesson1, courseId);
    assert.equal(reprog1.status, 200, `Re-marking lesson1 should succeed, got ${reprog1.status}`);

    const reprog2 = await markProgress(TEST_USER_ID, lesson2, courseId);
    assert.equal(reprog2.status, 200, `Re-marking lesson2 should succeed (no 500), got ${reprog2.status}`);
    const reprogBody2 = await reprog2.json() as any;
    assert.equal(
      reprogBody2.progress, 100,
      `Re-completion progress must be 100, got ${reprogBody2.progress}`
    );

    // ── 7. Certificate code must be unchanged ────────────────────────────────
    assert.ok(reprogBody2.certificateCode, "Re-completion must return a certificateCode");
    assert.equal(
      reprogBody2.certificateCode,
      originalCertCode,
      `Certificate code must be unchanged after re-enroll (expected ${originalCertCode}, got ${reprogBody2.certificateCode})`
    );

    // Double-check: only one cert row exists for this (user, course).
    const certRows = await queryDb(
      `SELECT certificate_code FROM lms_certificates WHERE user_id = $1 AND course_id = $2`,
      [TEST_USER_ID, courseId]
    );
    assert.equal(
      certRows.length, 1,
      `Exactly one certificate row must exist after re-enroll (found ${certRows.length})`
    );
    assert.equal(
      certRows[0].certificate_code,
      originalCertCode,
      "Cert row code must still match the original code"
    );
  }
);

test(
  "re-enroll: GET /api/lms/certificates still returns the cert after re-enroll",
  { skip: SKIP },
  async () => {
    // ── Set up course + 1 lesson ─────────────────────────────────────────────
    const courseId = await seedCourse();
    const lesson1  = await seedLesson(courseId, 1);

    // ── First pass: enroll → complete → cert issued ──────────────────────────
    const e1 = await enroll(TEST_USER_ID, courseId);
    assert.equal(e1.status, 200);

    const p1 = await markProgress(TEST_USER_ID, lesson1, courseId);
    assert.equal(p1.status, 200);
    const b1 = await p1.json() as any;
    assert.equal(b1.progress, 100);
    const originalCode = b1.certificateCode as string;
    assert.ok(originalCode, "First completion must yield a certificateCode");

    // ── Admin wipes enrollment + progress ────────────────────────────────────
    await queryDb(
      `DELETE FROM lms_enrollments     WHERE user_id = $1 AND course_id = $2`,
      [TEST_USER_ID, courseId]
    );
    await queryDb(
      `DELETE FROM lms_lesson_progress WHERE user_id = $1 AND course_id = $2`,
      [TEST_USER_ID, courseId]
    );

    // ── Re-enroll + complete again ───────────────────────────────────────────
    const e2 = await enroll(TEST_USER_ID, courseId);
    assert.equal(e2.status, 200, `Re-enroll must succeed, got ${e2.status}`);

    const p2 = await markProgress(TEST_USER_ID, lesson1, courseId);
    assert.equal(p2.status, 200, `Re-completion must succeed (no 500), got ${p2.status}`);
    const b2 = await p2.json() as any;
    assert.equal(b2.progress, 100);
    assert.equal(
      b2.certificateCode,
      originalCode,
      `Progress response must carry the original cert code, got ${b2.certificateCode}`
    );

    // ── Verify via GET /api/lms/certificates ─────────────────────────────────
    const certsRes = await fetch(`${baseUrl}/api/lms/certificates`, {
      headers: { "x-test-user": TEST_USER_ID },
    });
    assert.equal(certsRes.status, 200, `GET /api/lms/certificates must return 200, got ${certsRes.status}`);
    const certs = await certsRes.json() as any[];
    assert.ok(Array.isArray(certs), "Response must be an array");

    const myCert = certs.find((c: any) => c.courseId === courseId || c.course_id === courseId);
    assert.ok(myCert, "Student's certificate must appear in GET /api/lms/certificates");

    const code = myCert.certificateCode ?? myCert.certificate_code;
    assert.equal(
      code,
      originalCode,
      `Certificate in list must still be the original code (expected ${originalCode}, got ${code})`
    );
  }
);
