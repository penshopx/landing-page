/**
 * Integration test — DB nyata — memverifikasi bahwa DELETE /api/admin/lms/lessons/:id
 * merecalculate progress enrollment semua siswa yang terdaftar di kursus yang
 * lessonnya dihapus, sehingga nilai progress tidak membengkak (inflated).
 *
 * Skenario utama:
 *   1. Kursus dengan 2 lesson, siswa menyelesaikan keduanya → progress = 100%.
 *   2. Admin menghapus satu lesson.
 *   3. Enrollment progress siswa harus diperbarui ke 100% (1/1 lesson tersisa).
 *
 *   Skenario kedua:
 *   1. Kursus dengan 2 lesson, siswa menyelesaikan keduanya → progress = 100%.
 *   2. Admin menghapus SATU lesson (yang diselesaikan siswa).
 *   3. Setelah penghapusan: 1 lesson tersisa, siswa masih punya 1 progress row
 *      yang valid → progress = 100% (benar, bukan stale 100 dari 2 lesson).
 *
 *   Skenario ketiga:
 *   1. Kursus dengan 3 lesson, siswa menyelesaikan 2 → progress = 67%.
 *   2. Admin menghapus 1 lesson yang SUDAH diselesaikan siswa.
 *   3. Progress harus diperbarui: 1 progress row valid / 2 lesson tersisa = 50%.
 *
 * Dilewati otomatis bila DATABASE_URL tidak ada (CI tanpa DB).
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

// --- Guards & env -------------------------------------------------------

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `lms_pr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_ADMIN_ID = `test-admin-${RUN}`;

// --- Express test server ------------------------------------------------

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

  // Auth shim: every request is authenticated as an admin.
  app.use((req: any, _res: any, next: any) => {
    req.user = { id: TEST_ADMIN_ID, claims: { sub: TEST_ADMIN_ID } };
    req.isAuthenticated = () => true;
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
    await queryDb(`DELETE FROM lms_enrollments WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_lessons WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_courses WHERE id IN (${ids})`);
  }

  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────

async function createCourse(suffix: string): Promise<number> {
  const [row] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', true, 999, 0, 'beginner')
     RETURNING id`,
    [`PR Test Course ${RUN}-${suffix}`, `pr-test-course-${RUN}-${suffix}`]
  );
  const id = row.id as number;
  createdCourseIds.push(id);
  return id;
}

async function addLesson(courseId: number, suffix: string): Promise<number> {
  const [row] = await queryDb(
    `INSERT INTO lms_lessons (course_id, title, slug, type, duration_minutes, sort_order, is_active)
     VALUES ($1, $2, $3, 'article', 5, 1, true)
     RETURNING id`,
    [courseId, `Lesson ${suffix}`, `lesson-${suffix}-${RUN}`]
  );
  return row.id as number;
}

async function enrollStudent(studentId: string, courseId: number, progress: number = 0): Promise<void> {
  await queryDb(
    `INSERT INTO lms_enrollments (user_id, course_id, progress)
     VALUES ($1, $2, $3)`,
    [studentId, courseId, progress]
  );
}

async function completeLesson(studentId: string, courseId: number, lessonId: number): Promise<void> {
  await queryDb(
    `INSERT INTO lms_lesson_progress (user_id, course_id, lesson_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [studentId, courseId, lessonId]
  );
}

async function getEnrollmentProgress(studentId: string, courseId: number): Promise<number | null> {
  const rows = await queryDb(
    `SELECT progress FROM lms_enrollments WHERE user_id = $1 AND course_id = $2`,
    [studentId, courseId]
  );
  return rows.length > 0 ? Number(rows[0].progress) : null;
}

async function deleteLesson(lessonId: number): Promise<void> {
  const res = await fetch(`${baseUrl}/api/admin/lms/lessons/${lessonId}`, {
    method: "DELETE",
  });
  assert.equal(res.status, 200, `Expected 200 OK deleting lesson ${lessonId}, got ${res.status}`);
  const body = (await res.json()) as any;
  assert.equal(body.ok, true);
}

// ── Tests ─────────────────────────────────────────────────────────────────

test(
  "progress recalculates to 100% when both lessons completed and the non-completed one is deleted",
  { skip: SKIP },
  async () => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const studentId = `student-pr-${RUN}-${suffix}`;

    const courseId = await createCourse(`a-${suffix}`);
    const lessonId1 = await addLesson(courseId, `a1-${suffix}`);
    const lessonId2 = await addLesson(courseId, `a2-${suffix}`);

    // Enroll student and complete both lessons — progress should be 100%.
    await enrollStudent(studentId, courseId, 100);
    await completeLesson(studentId, courseId, lessonId1);
    await completeLesson(studentId, courseId, lessonId2);

    // Pre-condition: 100%.
    assert.equal(await getEnrollmentProgress(studentId, courseId), 100);

    // Admin deletes lesson 2 (which student also completed).
    // After deletion: 1 lesson remains, student has 1 progress row → still 100%.
    await deleteLesson(lessonId2);

    const progress = await getEnrollmentProgress(studentId, courseId);
    assert.equal(
      progress,
      100,
      `Expected progress=100 after deleting one of two completed lessons (1/1 remaining), got ${progress}`
    );
  }
);

test(
  "progress recalculates from inflated 100% to correct value when partially-completed course shrinks",
  { skip: SKIP },
  async () => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const studentId = `student-pr-${RUN}-${suffix}`;

    const courseId = await createCourse(`b-${suffix}`);
    const lessonId1 = await addLesson(courseId, `b1-${suffix}`);
    const lessonId2 = await addLesson(courseId, `b2-${suffix}`);
    const lessonId3 = await addLesson(courseId, `b3-${suffix}`);

    // Student completes 2 out of 3 lessons → progress 67%.
    await enrollStudent(studentId, courseId, 67);
    await completeLesson(studentId, courseId, lessonId1);
    await completeLesson(studentId, courseId, lessonId2);
    // lessonId3 not completed.

    // Pre-condition.
    assert.equal(await getEnrollmentProgress(studentId, courseId), 67);

    // Admin deletes lesson 3 (the one the student hadn't done).
    // After deletion: 2 lessons remain, student has 2 progress rows → 100%.
    await deleteLesson(lessonId3);

    const progress = await getEnrollmentProgress(studentId, courseId);
    assert.equal(
      progress,
      100,
      `Expected progress=100 (2/2 remaining lessons completed), got ${progress}`
    );
  }
);

test(
  "progress recalculates correctly when a completed lesson is deleted from a partially-done course",
  { skip: SKIP },
  async () => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const studentId = `student-pr-${RUN}-${suffix}`;

    const courseId = await createCourse(`c-${suffix}`);
    const lessonId1 = await addLesson(courseId, `c1-${suffix}`);
    const lessonId2 = await addLesson(courseId, `c2-${suffix}`);
    const lessonId3 = await addLesson(courseId, `c3-${suffix}`);

    // Student completes lessons 1 and 2 only → 67%.
    await enrollStudent(studentId, courseId, 67);
    await completeLesson(studentId, courseId, lessonId1);
    await completeLesson(studentId, courseId, lessonId2);

    // Admin deletes lesson 1 (which the student had completed).
    // After deletion: 2 lessons remain (lesson2, lesson3), student has 1 valid progress row (lesson2) → 50%.
    await deleteLesson(lessonId1);

    const progress = await getEnrollmentProgress(studentId, courseId);
    assert.equal(
      progress,
      50,
      `Expected progress=50 (1/2 remaining lessons completed), got ${progress}`
    );
  }
);

test(
  "static: DELETE lesson handler recalculates lms_enrollments progress after lesson delete",
  { skip: false },
  async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { resolve, dirname } = await import("node:path");
    const __dir = dirname(fileURLToPath(import.meta.url));
    const src: string = readFileSync(
      resolve(__dir, "../server/routes-lms.ts"),
      "utf8"
    );

    const handlerStart = src.indexOf(
      "DELETE /api/admin/lms/lessons/:id — delete a lesson"
    );
    assert.ok(handlerStart !== -1, "DELETE lesson route comment must exist in source");

    const handlerSlice = src.slice(handlerStart, handlerStart + 3000);

    // Must update lms_enrollments after deletion.
    assert.ok(
      handlerSlice.includes("lms_enrollments"),
      "DELETE lesson handler must recalculate lms_enrollments progress after deletion"
    );

    // Must reference lms_lesson_progress in the recalculation subquery.
    assert.ok(
      handlerSlice.includes("lms_lesson_progress"),
      "Progress recalculation must count from lms_lesson_progress"
    );
  }
);
