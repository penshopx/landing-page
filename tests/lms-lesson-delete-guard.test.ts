/**
 * Integrasi DB nyata — memverifikasi guard DELETE /api/admin/lms/lessons/:id:
 *
 * 1. Lesson dengan progress siswa TIDAK bisa dihapus diam-diam: tanpa
 *    ?force=true route mengembalikan 409 dengan enrolledStudents > 0, dan
 *    lesson + baris progress tetap utuh.
 * 2. Dengan ?force=true route mengembalikan 200 dan baris progress benar-benar
 *    terhapus.
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

const RUN = `lms_del_guard_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

  // Auth shim: every request is authenticated as the test admin.
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
  const slug = `del-guard-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, is_public, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', true, true, 999, 0, 'beginner')
     RETURNING id`,
    [`Delete Guard Test Course ${slug}`, slug]
  );
  const id = row.id as number;
  createdCourseIds.push(id);
  return id;
}

async function seedLesson(courseId: number): Promise<number> {
  const slug = `lesson-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_lessons (course_id, title, slug, type, duration_minutes, sort_order, is_active)
     VALUES ($1, $2, $3, 'article', 5, 1, true)
     RETURNING id`,
    [courseId, `Lesson ${slug}`, slug]
  );
  return row.id as number;
}

async function seedStudentWithProgress(courseId: number, lessonId: number): Promise<string> {
  const studentId = `student-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  await queryDb(
    `INSERT INTO lms_enrollments (user_id, course_id, progress) VALUES ($1, $2, 50)`,
    [studentId, courseId]
  );
  await queryDb(
    `INSERT INTO lms_lesson_progress (user_id, course_id, lesson_id) VALUES ($1, $2, $3)`,
    [studentId, courseId, lessonId]
  );
  return studentId;
}

async function progressRowCount(lessonId: number): Promise<number> {
  const [row] = await queryDb(
    `SELECT COUNT(*)::int AS n FROM lms_lesson_progress WHERE lesson_id = $1`,
    [lessonId]
  );
  return Number(row.n);
}

async function lessonExists(lessonId: number): Promise<boolean> {
  const rows = await queryDb(`SELECT id FROM lms_lessons WHERE id = $1`, [lessonId]);
  return rows.length > 0;
}

function deleteLesson(lessonId: number, force: boolean) {
  const qs = force ? "?force=true" : "";
  return fetch(`${baseUrl}/api/admin/lms/lessons/${lessonId}${qs}`, { method: "DELETE" });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test("DELETE without ?force=true → 409 with affected-student count, nothing deleted", { skip: SKIP }, async () => {
  const courseId = await seedCourse();
  const lessonId = await seedLesson(courseId);
  await seedStudentWithProgress(courseId, lessonId);

  const res = await deleteLesson(lessonId, false);
  assert.equal(res.status, 409, `Expected 409 without force, got ${res.status}`);

  const body = (await res.json()) as any;
  assert.ok(
    Number(body.enrolledStudents) > 0,
    `409 body must report affected students > 0, got ${JSON.stringify(body)}`
  );
  assert.ok(typeof body.error === "string" && body.error.length > 0, "409 body must include an error message");

  // The guard must be non-destructive: lesson and progress row still intact.
  assert.equal(await lessonExists(lessonId), true, "lesson must NOT be deleted on 409");
  assert.equal(await progressRowCount(lessonId), 1, "progress row must NOT be deleted on 409");
});

test("DELETE with ?force=true → 200 and the progress row is gone", { skip: SKIP }, async () => {
  const courseId = await seedCourse();
  const lessonId = await seedLesson(courseId);
  await seedStudentWithProgress(courseId, lessonId);

  const res = await deleteLesson(lessonId, true);
  assert.equal(res.status, 200, `Expected 200 with force=true, got ${res.status}`);
  const body = (await res.json()) as any;
  assert.equal(body.ok, true, `Expected { ok: true }, got ${JSON.stringify(body)}`);

  assert.equal(await lessonExists(lessonId), false, "lesson must be deleted with force=true");
  assert.equal(await progressRowCount(lessonId), 0, "progress rows must be deleted with force=true");
});
