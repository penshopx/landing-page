/**
 * Integrasi DB nyata — memverifikasi bahwa DELETE /api/admin/lms/lessons/:id
 * juga menghapus baris lms_lesson_progress milik lesson tersebut, dan bahwa
 * persentase progress enrollment dihitung ulang sehingga tidak pernah
 * membengkak (stale/inflated) setelah lesson dihapus.
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

const RUN = `lms_del_prog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_ADMIN_ID = `test-admin-${RUN}`;

// ── Express test server ───────────────────────────────────────────────────────

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

  // Auth shim: x-test-user header sets req.user (simulates authenticated session).
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

  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function seedCourse(): Promise<number> {
  const slug = `del-prog-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, is_public, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', true, true, 999, 0, 'beginner')
     RETURNING id`,
    [`Delete Progress Test Course ${slug}`, slug]
  );
  const id = row.id as number;
  createdCourseIds.push(id);
  return id;
}

async function seedLesson(courseId: number, sortOrder: number): Promise<number> {
  const slug = `lesson-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_lessons (course_id, title, slug, type, duration_minutes, sort_order, is_active)
     VALUES ($1, $2, $3, 'article', 5, $4, true)
     RETURNING id`,
    [courseId, `Lesson ${slug}`, slug, sortOrder]
  );
  return row.id as number;
}

async function seedEnrollment(userId: string, courseId: number, progress: number, completed: boolean) {
  await queryDb(
    `INSERT INTO lms_enrollments (user_id, course_id, progress${completed ? ", completed_at" : ""})
     VALUES ($1, $2, $3${completed ? ", NOW()" : ""})`,
    [userId, courseId, progress]
  );
}

async function seedProgress(userId: string, courseId: number, lessonId: number) {
  await queryDb(
    `INSERT INTO lms_lesson_progress (user_id, course_id, lesson_id)
     VALUES ($1, $2, $3)`,
    [userId, courseId, lessonId]
  );
}

async function progressRowCount(lessonId: number): Promise<number> {
  const [row] = await queryDb(
    `SELECT COUNT(*)::int AS n FROM lms_lesson_progress WHERE lesson_id = $1`,
    [lessonId]
  );
  return Number(row.n);
}

async function getEnrollment(userId: string, courseId: number) {
  const [row] = await queryDb(
    `SELECT progress, completed_at FROM lms_enrollments WHERE user_id = $1 AND course_id = $2`,
    [userId, courseId]
  );
  return row;
}

function deleteLesson(lessonId: number, opts: { force?: boolean; asAdmin?: boolean } = {}) {
  const { force = true, asAdmin = true } = opts;
  const headers: Record<string, string> = {};
  if (asAdmin) headers["x-test-user"] = TEST_ADMIN_ID;
  const qs = force ? "?force=true" : "";
  return fetch(`${baseUrl}/api/admin/lms/lessons/${lessonId}${qs}`, {
    method: "DELETE",
    headers,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test("delete lesson: removes the deleted lesson's progress rows, keeps the other lesson's", { skip: SKIP }, async () => {
  // Seed course + 2 lessons, enroll a student, mark progress on BOTH lessons.
  const courseId = await seedCourse();
  const lessonA = await seedLesson(courseId, 1);
  const lessonB = await seedLesson(courseId, 2);
  const studentId = `student-${RUN}-a`;
  await seedEnrollment(studentId, courseId, 100, true); // 2/2 done → 100%, completed
  await seedProgress(studentId, courseId, lessonA);
  await seedProgress(studentId, courseId, lessonB);

  // Enrolled course + no ?force → 409 guard (sanity check on the guard path).
  const resGuard = await deleteLesson(lessonA, { force: false });
  assert.equal(resGuard.status, 409, `Expected 409 without force when students enrolled, got ${resGuard.status}`);
  assert.equal(await progressRowCount(lessonA), 1, "guard 409 must not delete anything");

  // Delete lesson A with ?force=true.
  const res = await deleteLesson(lessonA);
  assert.equal(res.status, 200, `Expected 200 from force delete, got ${res.status}`);
  const body = await res.json() as any;
  assert.equal(body.ok, true, `Expected { ok: true }, got ${JSON.stringify(body)}`);

  // The deleted lesson's progress row must be GONE…
  assert.equal(
    await progressRowCount(lessonA), 0,
    "lms_lesson_progress rows for the deleted lesson must be removed"
  );
  // …while the surviving lesson's progress row is untouched.
  assert.equal(
    await progressRowCount(lessonB), 1,
    "progress row for the remaining lesson must NOT be deleted"
  );

  // Recalc: 1 completed of 1 remaining lesson → still a correct 100% (not
  // inflated — it genuinely completed everything that still exists).
  const enr = await getEnrollment(studentId, courseId);
  assert.equal(Number(enr.progress), 100, `progress must recalc to 100 (1/1 remaining), got ${enr.progress}`);
  assert.ok(enr.completed_at, "completed_at must be kept when recalculated progress is still 100%");
});

test("delete lesson: enrollment progress deflates and completed_at clears when only the deleted lesson was done", { skip: SKIP }, async () => {
  // 2 lessons; student only completed the lesson that gets deleted.
  const courseId = await seedCourse();
  const lessonA = await seedLesson(courseId, 1);
  const lessonB = await seedLesson(courseId, 2);
  const studentId = `student-${RUN}-b`;
  // Simulate a stale-inflated state: enrollment says 100% + completed even
  // though only lesson A has a progress row.
  await seedEnrollment(studentId, courseId, 100, true);
  await seedProgress(studentId, courseId, lessonA);

  const res = await deleteLesson(lessonA);
  assert.equal(res.status, 200, `Expected 200, got ${res.status}`);

  // Progress row for the deleted lesson is gone.
  assert.equal(await progressRowCount(lessonA), 0, "deleted lesson's progress row must be removed");

  // Recalc: 0 completed of 1 remaining lesson → 0%, and completed_at cleared.
  const enr = await getEnrollment(studentId, courseId);
  assert.equal(
    Number(enr.progress), 0,
    `progress must recalc to 0 (0/1 remaining lessons completed), got ${enr.progress}`
  );
  assert.equal(
    enr.completed_at, null,
    "completed_at must be cleared when recalculated progress is below 100%"
  );

  // The remaining lesson still exists.
  const lessons = await queryDb(`SELECT id FROM lms_lessons WHERE course_id = $1`, [courseId]);
  assert.equal(lessons.length, 1, "only the targeted lesson must be deleted");
  assert.equal(Number(lessons[0].id), lessonB, "remaining lesson must be lesson B");
});

test("delete lesson: unauthenticated → 401", { skip: SKIP }, async () => {
  const courseId = await seedCourse();
  const lessonA = await seedLesson(courseId, 1);
  const res = await deleteLesson(lessonA, { asAdmin: false });
  assert.equal(res.status, 401, `Expected 401 without auth, got ${res.status}`);
  const rows = await queryDb(`SELECT id FROM lms_lessons WHERE id = $1`, [lessonA]);
  assert.equal(rows.length, 1, "lesson must survive an unauthenticated delete attempt");
});
