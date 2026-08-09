/**
 * Integrasi DB nyata — memverifikasi bahwa DELETE /api/admin/lms/lessons/:id
 * BENAR-BENAR menghapus baris lms_lesson_progress yang mereferensikan lesson
 * tersebut sebelum menghapus lesson itu sendiri (mencegah orphaned rows).
 *
 * Juga memverifikasi bahwa FK constraint ON DELETE CASCADE sudah terpasang di
 * level DB, sehingga race condition pun tidak dapat meninggalkan orphaned rows.
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

const RUN = `lms_ldc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_ADMIN_ID = `test-admin-${RUN}`;

// --- Express test server ------------------------------------------------

let server: Server;
let baseUrl: string;

// Track created resources for cleanup.
let createdCourseIds: number[] = [];

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

  // Promote the test user to admin via ADMIN_USER_IDS.
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

  // Belt-and-suspenders cleanup.
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

// ── Helper ────────────────────────────────────────────────────────────────

async function seedCourseWithProgress(): Promise<{
  courseId: number;
  lessonId: number;
  studentUserId: string;
}> {
  const seqSuffix = Math.random().toString(36).slice(2, 8);
  const studentUserId = `student-${RUN}-${seqSuffix}`;

  const [course] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', true, 999, 0, 'beginner')
     RETURNING id`,
    [`Test Course ${RUN}-${seqSuffix}`, `test-course-${RUN}-${seqSuffix}`]
  );
  const cId = course.id as number;
  createdCourseIds.push(cId);

  const [lesson] = await queryDb(
    `INSERT INTO lms_lessons (course_id, title, slug, type, duration_minutes, sort_order, is_active)
     VALUES ($1, $2, $3, 'article', 5, 1, true)
     RETURNING id`,
    [cId, `Lesson ${RUN}-${seqSuffix}`, `lesson-${RUN}-${seqSuffix}`]
  );
  const lId = lesson.id as number;

  await queryDb(
    `INSERT INTO lms_lesson_progress (user_id, course_id, lesson_id)
     VALUES ($1, $2, $3)`,
    [studentUserId, cId, lId]
  );

  return { courseId: cId, lessonId: lId, studentUserId };
}

// ── Tests ─────────────────────────────────────────────────────────────────

test(
  "DB constraint: lms_lesson_progress has ON DELETE CASCADE FK on lesson_id",
  { skip: SKIP },
  async () => {
    const rows = await queryDb(`
      SELECT rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.referential_constraints rc
        ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'lms_lesson_progress'
        AND tc.constraint_name = 'lms_lesson_progress_lesson_id_fkey'
    `);
    assert.equal(
      rows.length,
      1,
      "FK constraint lms_lesson_progress_lesson_id_fkey must exist on lms_lesson_progress"
    );
    assert.equal(
      rows[0].delete_rule,
      "CASCADE",
      "FK delete_rule must be CASCADE so deleting a lesson atomically removes its progress rows"
    );
  }
);

test(
  "DB cascade: deleting a lesson row directly removes lms_lesson_progress rows",
  { skip: SKIP },
  async () => {
    // Seed: progress row pointing to a lesson.
    const { courseId: cId, lessonId: lId } = await seedCourseWithProgress();

    // Pre-condition.
    const [{ cnt: before }] = await queryDb(
      `SELECT COUNT(*) AS cnt FROM lms_lesson_progress WHERE lesson_id = $1`,
      [lId]
    );
    assert.equal(Number(before), 1, "progress row should exist before lesson deletion");

    // Delete the lesson directly at the DB level (bypassing the route) to
    // prove the FK cascade fires independently of application logic.
    await queryDb(`DELETE FROM lms_lessons WHERE id = $1`, [lId]);

    // The FK ON DELETE CASCADE must have removed the progress row.
    const [{ cnt: after }] = await queryDb(
      `SELECT COUNT(*) AS cnt FROM lms_lesson_progress WHERE lesson_id = $1`,
      [lId]
    );
    assert.equal(
      Number(after),
      0,
      "DB-level lesson delete must cascade-remove lms_lesson_progress rows via FK"
    );

    // Cleanup.
    createdCourseIds = createdCourseIds.filter((id) => id !== cId);
    await queryDb(`DELETE FROM lms_courses WHERE id = $1`, [cId]);
  }
);

test(
  "route cascade: lms_lesson_progress row is removed when lesson is deleted via API",
  { skip: SKIP },
  async () => {
    const { courseId: cId, lessonId: lId } = await seedCourseWithProgress();

    // Pre-condition: progress row exists.
    const [{ cnt: progressBefore }] = await queryDb(
      `SELECT COUNT(*) AS cnt FROM lms_lesson_progress WHERE lesson_id = $1`,
      [lId]
    );
    assert.equal(
      Number(progressBefore),
      1,
      "lms_lesson_progress row should exist before lesson delete"
    );

    // Act: delete the lesson via the route.
    const res = await fetch(`${baseUrl}/api/admin/lms/lessons/${lId}`, {
      method: "DELETE",
    });
    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const body = (await res.json()) as any;
    assert.equal(body.ok, true, "Response body should be { ok: true }");

    // Post-condition: no orphaned progress rows remain.
    const [{ cnt: progressAfter }] = await queryDb(
      `SELECT COUNT(*) AS cnt FROM lms_lesson_progress WHERE lesson_id = $1`,
      [lId]
    );
    assert.equal(
      Number(progressAfter),
      0,
      "lms_lesson_progress must be empty after lesson delete (no orphans)"
    );

    // The lesson itself must also be gone.
    const lessonRows = await queryDb(
      `SELECT id FROM lms_lessons WHERE id = $1`,
      [lId]
    );
    assert.equal(lessonRows.length, 0, "lms_lessons row must be removed");

    // The course should still exist.
    const courseRows = await queryDb(
      `SELECT id FROM lms_courses WHERE id = $1`,
      [cId]
    );
    assert.equal(courseRows.length, 1, "lms_courses row must survive a single-lesson delete");

    // Cleanup.
    createdCourseIds = createdCourseIds.filter((id) => id !== cId);
    await queryDb(`DELETE FROM lms_courses WHERE id = $1`, [cId]);
  }
);

test(
  "route: returns 404 when lesson does not exist",
  { skip: SKIP },
  async () => {
    const res = await fetch(`${baseUrl}/api/admin/lms/lessons/99999999`, {
      method: "DELETE",
    });
    assert.equal(res.status, 404, "Should return 404 for non-existent lesson");
  }
);

test(
  "enrollment guard: returns 409 with enrolledStudents when course has active enrollments",
  { skip: SKIP },
  async () => {
    const seqSuffix = Math.random().toString(36).slice(2, 8);
    const studentUserId = `student-guard-${RUN}-${seqSuffix}`;

    // Create course + lesson.
    const [course] = await queryDb(
      `INSERT INTO lms_courses (title, slug, category, is_active, sort_order, price, level)
       VALUES ($1, $2, 'onboarding', true, 999, 0, 'beginner')
       RETURNING id`,
      [`Guard Test Course ${RUN}-${seqSuffix}`, `guard-course-${RUN}-${seqSuffix}`]
    );
    const cId = course.id as number;
    createdCourseIds.push(cId);

    const [lesson] = await queryDb(
      `INSERT INTO lms_lessons (course_id, title, slug, type, duration_minutes, sort_order, is_active)
       VALUES ($1, $2, $3, 'article', 5, 1, true)
       RETURNING id`,
      [cId, `Guard Lesson ${RUN}-${seqSuffix}`, `guard-lesson-${RUN}-${seqSuffix}`]
    );
    const lId = lesson.id as number;

    // Enroll a student (no progress yet — guard must still fire).
    await queryDb(
      `INSERT INTO lms_enrollments (user_id, course_id) VALUES ($1, $2)`,
      [studentUserId, cId]
    );

    // Act: attempt delete without ?force=true.
    const res = await fetch(`${baseUrl}/api/admin/lms/lessons/${lId}`, {
      method: "DELETE",
    });
    assert.equal(res.status, 409, "Should return 409 when enrolled students exist and force is absent");
    const body = (await res.json()) as any;
    assert.ok(
      typeof body.enrolledStudents === "number" && body.enrolledStudents > 0,
      `Response must include enrolledStudents > 0, got: ${JSON.stringify(body)}`
    );

    // Lesson must still exist — guard must not have deleted it.
    const lessonRows = await queryDb(`SELECT id FROM lms_lessons WHERE id = $1`, [lId]);
    assert.equal(lessonRows.length, 1, "Lesson must survive a blocked delete attempt");
  }
);

test(
  "enrollment guard: force=true bypasses guard and deletes lesson with enrolled students",
  { skip: SKIP },
  async () => {
    const seqSuffix = Math.random().toString(36).slice(2, 8);
    const studentUserId = `student-force-${RUN}-${seqSuffix}`;

    const [course] = await queryDb(
      `INSERT INTO lms_courses (title, slug, category, is_active, sort_order, price, level)
       VALUES ($1, $2, 'onboarding', true, 999, 0, 'beginner')
       RETURNING id`,
      [`Force Test Course ${RUN}-${seqSuffix}`, `force-course-${RUN}-${seqSuffix}`]
    );
    const cId = course.id as number;
    createdCourseIds.push(cId);

    const [lesson] = await queryDb(
      `INSERT INTO lms_lessons (course_id, title, slug, type, duration_minutes, sort_order, is_active)
       VALUES ($1, $2, $3, 'article', 5, 1, true)
       RETURNING id`,
      [cId, `Force Lesson ${RUN}-${seqSuffix}`, `force-lesson-${RUN}-${seqSuffix}`]
    );
    const lId = lesson.id as number;

    // Enroll a student and mark the lesson as completed.
    await queryDb(
      `INSERT INTO lms_enrollments (user_id, course_id) VALUES ($1, $2)`,
      [studentUserId, cId]
    );
    await queryDb(
      `INSERT INTO lms_lesson_progress (user_id, course_id, lesson_id) VALUES ($1, $2, $3)`,
      [studentUserId, cId, lId]
    );

    // Act: delete with ?force=true — must succeed.
    const res = await fetch(`${baseUrl}/api/admin/lms/lessons/${lId}?force=true`, {
      method: "DELETE",
    });
    assert.equal(res.status, 200, `Expected 200 OK with force=true, got ${res.status}`);
    const body = (await res.json()) as any;
    assert.equal(body.ok, true, "Response body must be { ok: true }");

    // Lesson must be gone.
    const lessonRows = await queryDb(`SELECT id FROM lms_lessons WHERE id = $1`, [lId]);
    assert.equal(lessonRows.length, 0, "Lesson must be deleted when force=true");

    // Progress row must also be gone.
    const progressRows = await queryDb(
      `SELECT id FROM lms_lesson_progress WHERE lesson_id = $1`,
      [lId]
    );
    assert.equal(progressRows.length, 0, "Progress rows must be cascade-deleted with the lesson");
  }
);

test(
  "static: DELETE lesson route uses a transaction wrapping both progress and lesson deletes",
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

    // Extract the DELETE /api/admin/lms/lessons/:id handler body.
    const handlerStart = src.indexOf(
      "DELETE /api/admin/lms/lessons/:id — delete a lesson"
    );
    assert.ok(handlerStart !== -1, "DELETE lesson route comment must exist in source");

    const handlerSlice = src.slice(handlerStart, handlerStart + 2500);

    // Must use a transaction.
    assert.ok(
      handlerSlice.includes("db.transaction"),
      "DELETE lesson handler must wrap deletes in db.transaction"
    );

    // Progress delete must be inside the transaction.
    assert.ok(
      handlerSlice.includes("tx.delete(lmsLessonProgress)"),
      "DELETE lesson handler must delete lmsLessonProgress inside the transaction"
    );

    // Lesson delete must also be inside the transaction.
    assert.ok(
      handlerSlice.includes("tx.delete(lmsLessons)"),
      "DELETE lesson handler must delete lmsLessons inside the transaction"
    );

    // Progress delete must appear before lesson delete.
    const progressIdx = handlerSlice.indexOf("tx.delete(lmsLessonProgress)");
    const lessonIdx = handlerSlice.indexOf("tx.delete(lmsLessons)");
    assert.ok(
      progressIdx < lessonIdx,
      "lmsLessonProgress delete must come before lmsLessons delete inside the transaction"
    );
  }
);
