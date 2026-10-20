/**
 * Integrasi DB nyata — memverifikasi tombol Reset admin:
 * DELETE /api/admin/lms/courses/:courseId/enrollments/:userId
 *
 * Skenario:
 *   1. FULL reset (?purgeCertificate=true — dipakai dashboard admin):
 *      student yang sudah SELESAI kursus direset → enrollment, lesson
 *      progress, DAN sertifikat terhapus; re-enroll benar-benar mulai dari 0
 *      (tidak lompat ke 100% dari sertifikat lama).
 *   2. Default (tanpa flag): sertifikat DIPERTAHANKAN (semantik manual
 *      removal — task sertifikat tetap bisa diakses).
 *   3. 404 ketika tidak ada enrollment/progress untuk dihapus.
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

const RUN = `lms_reset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_ADMIN_ID = `test-admin-reset-${RUN}`;
const TEST_USER_ID = `test-user-reset-${RUN}`;

// Stub BREVO so fire-and-forget certificate emails don't hit the real API.
process.env.BREVO_API_KEY = ["test-brev", "o-key-stub"].join("");
const originalFetch = globalThis.fetch;
(globalThis as any).fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
  const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : (url as Request).url;
  if (urlStr.includes("api.brevo.com")) {
    return new Response(JSON.stringify({ messageId: "stub" }), { status: 201 });
  }
  return originalFetch(url as any, init);
};

async function queryDb(sql: string, params: any[] = []) {
  const { pool } = await import("../server/db");
  const r = await pool.query(sql, params);
  return r.rows;
}

let server: Server;
let baseUrl: string;
const createdCourseIds: number[] = [];

before(async () => {
  if (!hasDb) return;

  // Seed student user row (needed for enrollment listing join / cert name).
  await queryDb(
    `INSERT INTO users (id, email, first_name, role, is_active)
     VALUES ($1, $2, $3, 'user', true)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
    [TEST_USER_ID, `reset-${RUN}@example.com`, `Student ${RUN}`]
  );

  // Grant admin via ADMIN_USER_IDS (same trick as lms-force-delete-cascade).
  const origAdminIds = process.env.ADMIN_USER_IDS ?? "";
  process.env.ADMIN_USER_IDS = origAdminIds ? `${origAdminIds},${TEST_ADMIN_ID}` : TEST_ADMIN_ID;

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
  const slug = `reset-course-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, is_public, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', true, true, 999, 0, 'beginner')
     RETURNING id`,
    [`Reset Test Course ${slug}`, slug]
  );
  const id = row.id as number;
  createdCourseIds.push(id);
  return id;
}

async function seedLesson(courseId: number, sortOrder = 1): Promise<number> {
  const slug = `lesson-reset-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_lessons (course_id, title, slug, type, duration_minutes, sort_order, is_active)
     VALUES ($1, $2, $3, 'article', 5, $4, true)
     RETURNING id`,
    [courseId, `Lesson ${slug}`, slug, sortOrder]
  );
  return row.id as number;
}

async function enroll(userId: string, courseId: number) {
  return fetch(`${baseUrl}/api/lms/enroll/${courseId}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-test-user": userId },
  });
}

async function markProgress(userId: string, lessonId: number, courseId: number) {
  return fetch(`${baseUrl}/api/lms/progress`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-test-user": userId },
    body: JSON.stringify({ lessonId, courseId }),
  });
}

async function completeCourse(courseId: number, lessonIds: number[]) {
  const enrollRes = await enroll(TEST_USER_ID, courseId);
  assert.equal(enrollRes.status, 200, `enroll should succeed, got ${enrollRes.status}`);
  let last: any;
  for (const lid of lessonIds) {
    const r = await markProgress(TEST_USER_ID, lid, courseId);
    assert.equal(r.status, 200, `progress should succeed, got ${r.status}`);
    last = await r.json();
  }
  assert.equal(last.progress, 100, `course should be completed, got ${last.progress}`);
  return last;
}

function adminReset(courseId: number, userId: string, purge: boolean) {
  const qs = purge ? "?purgeCertificate=true" : "";
  return fetch(
    `${baseUrl}/api/admin/lms/courses/${courseId}/enrollments/${encodeURIComponent(userId)}${qs}`,
    { method: "DELETE", headers: { "x-test-user": TEST_ADMIN_ID } }
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test(
  "FULL reset (dashboard): completed student re-enrolls at zero, no completion, no stale certificate",
  { skip: SKIP },
  async () => {
    const courseId = await seedCourse();
    const l1 = await seedLesson(courseId, 1);
    const l2 = await seedLesson(courseId, 2);
    const done = await completeCourse(courseId, [l1, l2]);
    assert.ok(done.certificateCode, "completion must issue a certificate");

    // Admin resets with purgeCertificate=true (what the dashboard button sends).
    const res = await adminReset(courseId, TEST_USER_ID, true);
    assert.equal(res.status, 200, `reset should succeed, got ${res.status}`);
    const body = await res.json() as any;
    assert.equal(body.enrollmentDeleted, 1, "one enrollment row deleted");
    assert.equal(body.progressDeleted, 2, "both lesson progress rows deleted");
    assert.equal(body.certificatesDeleted, 1, "certificate deleted on full reset");

    // All three tables must be clean.
    for (const [table, label] of [
      ["lms_enrollments", "enrollment"],
      ["lms_lesson_progress", "lesson progress"],
      ["lms_certificates", "certificate"],
    ] as const) {
      const rows = await queryDb(
        `SELECT id FROM ${table} WHERE user_id = $1 AND course_id = $2`,
        [TEST_USER_ID, courseId]
      );
      assert.equal(rows.length, 0, `${label} rows must be gone after full reset`);
    }

    // Re-enroll must start from ZERO — not restored to 100% from a stale cert.
    const re = await enroll(TEST_USER_ID, courseId);
    assert.equal(re.status, 200);
    const reBody = await re.json() as any;
    assert.equal(reBody.progress, 0, `re-enroll must start at 0, got ${reBody.progress}`);
    assert.equal(reBody.completedAt ?? null, null, "re-enroll must have no completedAt");
  }
);

test(
  "default reset (no flag) preserves the certificate",
  { skip: SKIP },
  async () => {
    const courseId = await seedCourse();
    const l1 = await seedLesson(courseId, 1);
    const done = await completeCourse(courseId, [l1]);
    assert.ok(done.certificateCode, "completion must issue a certificate");

    const res = await adminReset(courseId, TEST_USER_ID, false);
    assert.equal(res.status, 200, `reset should succeed, got ${res.status}`);
    const body = await res.json() as any;
    assert.equal(body.enrollmentDeleted, 1);
    assert.equal(body.certificatesDeleted, 0, "certificate must NOT be deleted without the flag");

    const certRows = await queryDb(
      `SELECT id FROM lms_certificates WHERE user_id = $1 AND course_id = $2`,
      [TEST_USER_ID, courseId]
    );
    assert.equal(certRows.length, 1, "certificate row must still exist");
  }
);

test(
  "reset returns 404 when the student has no enrollment or progress",
  { skip: SKIP },
  async () => {
    const courseId = await seedCourse();
    const res = await adminReset(courseId, TEST_USER_ID, true);
    assert.equal(res.status, 404, `expected 404 for missing enrollment, got ${res.status}`);
  }
);
