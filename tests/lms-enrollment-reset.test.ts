/**
 * Integrasi DB nyata — memverifikasi bahwa reset enrollment oleh admin
 * (DELETE /api/admin/lms/courses/:courseId/enrollments/:userId) juga
 * menghapus baris lms_lesson_progress milik student untuk kursus itu,
 * sehingga re-enroll benar-benar mulai dari progress 0 — bukan langsung
 * 100% dari baris progress basi.
 *
 * Skenario:
 *   1. Enroll → selesaikan SEBAGIAN lesson (tanpa sertifikat).
 *   2. Admin reset enrollment via endpoint admin.
 *   3. Baris enrollment DAN lesson_progress hilang dari DB.
 *   4. Re-enroll → progress mulai dari 0.
 *   5. Menyelesaikan 1 dari 2 lesson menghasilkan 50 (bukan 100 dari baris basi).
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
const STUDENT_ID = `test-student-reset-${RUN}`;
const ADMIN_ID = `test-admin-reset-${RUN}`;

// Stub BREVO so fire-and-forget email calls don't hit the real API.
process.env.BREVO_API_KEY = "test-brevo-key-stub";

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

  await queryDb(
    `INSERT INTO users (id, email, first_name, role, is_active)
     VALUES ($1, $2, $3, 'user', true)
     ON CONFLICT (id) DO UPDATE SET role = 'user'`,
    [STUDENT_ID, `student-${RUN}@example.com`, `Student ${RUN}`]
  );
  await queryDb(
    `INSERT INTO users (id, email, first_name, role, is_active)
     VALUES ($1, $2, $3, 'admin', true)
     ON CONFLICT (id) DO UPDATE SET role = 'admin'`,
    [ADMIN_ID, `admin-${RUN}@example.com`, `Admin ${RUN}`]
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

  await queryDb(`DELETE FROM users WHERE id IN ($1, $2)`, [STUDENT_ID, ADMIN_ID]).catch(() => {});

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
    [`Enrollment Reset Test ${slug}`, slug]
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

async function enroll(userId: string, courseId: number): Promise<Response> {
  return fetch(`${baseUrl}/api/lms/enroll/${courseId}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-test-user": userId },
  });
}

async function markProgress(userId: string, lessonId: number, courseId: number): Promise<Response> {
  return fetch(`${baseUrl}/api/lms/progress`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-test-user": userId },
    body: JSON.stringify({ lessonId, courseId }),
  });
}

async function adminReset(adminId: string, courseId: number, studentId: string): Promise<Response> {
  return fetch(`${baseUrl}/api/admin/lms/courses/${courseId}/enrollments/${encodeURIComponent(studentId)}`, {
    method: "DELETE",
    headers: { "x-test-user": adminId },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test(
  "admin enrollment reset clears lesson progress and re-enroll starts at 0",
  { skip: SKIP },
  async () => {
    const courseId = await seedCourse();
    const lesson1 = await seedLesson(courseId, 1);
    const lesson2 = await seedLesson(courseId, 2);

    // 1. Enroll and complete only ONE of two lessons (50%, no certificate).
    const e1 = await enroll(STUDENT_ID, courseId);
    assert.equal(e1.status, 200, `Enroll must succeed, got ${e1.status}`);

    const p1 = await markProgress(STUDENT_ID, lesson1, courseId);
    assert.equal(p1.status, 200);
    const b1 = await p1.json() as any;
    assert.equal(b1.progress, 50, `Progress after lesson1 should be 50, got ${b1.progress}`);

    // Sanity: progress rows exist.
    const progBefore = await queryDb(
      `SELECT id FROM lms_lesson_progress WHERE user_id = $1 AND course_id = $2`,
      [STUDENT_ID, courseId]
    );
    assert.equal(progBefore.length, 1, "Exactly one progress row before reset");

    // 2. Admin resets the enrollment via the admin endpoint.
    const resetRes = await adminReset(ADMIN_ID, courseId, STUDENT_ID);
    assert.equal(resetRes.status, 200, `Admin reset must return 200, got ${resetRes.status}`);
    const resetBody = await resetRes.json() as any;
    assert.equal(resetBody.success, true);
    assert.equal(resetBody.enrollmentDeleted, 1, "One enrollment row must be deleted");
    assert.equal(resetBody.progressDeleted, 1, "The stale progress row must also be deleted");

    // 3. Both enrollment AND progress rows are gone from the DB.
    const enrollAfter = await queryDb(
      `SELECT id FROM lms_enrollments WHERE user_id = $1 AND course_id = $2`,
      [STUDENT_ID, courseId]
    );
    assert.equal(enrollAfter.length, 0, "Enrollment row must be gone after reset");
    const progAfter = await queryDb(
      `SELECT id FROM lms_lesson_progress WHERE user_id = $1 AND course_id = $2`,
      [STUDENT_ID, courseId]
    );
    assert.equal(progAfter.length, 0, "Lesson progress rows must be gone after reset");

    // 4. Re-enroll starts at progress 0 (no certificate exists).
    const e2 = await enroll(STUDENT_ID, courseId);
    assert.equal(e2.status, 200, `Re-enroll must succeed, got ${e2.status}`);
    const e2Body = await e2.json() as any;
    assert.equal(e2Body.progress, 0, `Re-enrollment must start at 0, got ${e2Body.progress}`);

    // 5. Completing one lesson yields 50 — proving the calculation is not
    //    inflated by stale rows (with a stale row it would jump to 100).
    const p2 = await markProgress(STUDENT_ID, lesson2, courseId);
    assert.equal(p2.status, 200);
    const b2 = await p2.json() as any;
    assert.equal(b2.progress, 50, `Fresh progress after one lesson must be 50, got ${b2.progress}`);
  }
);

test(
  "admin enrollment reset endpoint rejects non-admin and missing enrollment",
  { skip: SKIP },
  async () => {
    const courseId = await seedCourse();

    // Non-admin caller is rejected.
    const forbidden = await adminReset(STUDENT_ID, courseId, STUDENT_ID);
    assert.equal(forbidden.status, 403, `Non-admin must get 403, got ${forbidden.status}`);

    // Resetting a non-existent enrollment returns 404.
    const notFound = await adminReset(ADMIN_ID, courseId, `nobody-${RUN}`);
    assert.equal(notFound.status, 404, `Missing enrollment must 404, got ${notFound.status}`);
  }
);
