/**
 * Integrasi DB nyata — memverifikasi bahwa DELETE /api/admin/lms/courses/:id?force=true
 * BENAR-BENAR menghapus semua baris terkait dari empat tabel:
 *   lms_lesson_progress, lms_certificates, lms_lessons, lms_enrollments
 * sebelum menghapus kursus itu sendiri.
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

const RUN = `lms_fdt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_ADMIN_ID = `test-admin-${RUN}`;

// --- Express test server ------------------------------------------------

let server: Server;
let baseUrl: string;
let courseId: number;

// Track what we create so cleanup is exhaustive even if the route fails.
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

  // Make the test user an admin via ADMIN_USER_IDS env var (same trick as
  // ruang-kelola-schema-integration.test.ts).
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

  // Belt-and-suspenders cleanup: delete any leftover rows the test may have
  // created (guards against test failure before the force-delete fires).
  if (createdCourseIds.length > 0) {
    const ids = createdCourseIds.join(",");
    await queryDb(`DELETE FROM lms_lesson_progress WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_certificates WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_enrollments WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_lessons WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_courses WHERE id IN (${ids})`);
  }

  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
});

// ── Helpers ──────────────────────────────────────────────────────────────

async function seedCourseWithStudentData(): Promise<{
  courseId: number;
  lessonId: number;
  studentUserId: string;
}> {
  const seqSuffix = Math.random().toString(36).slice(2, 8);
  const studentUserId = `student-${RUN}-${seqSuffix}`;

  // Insert course
  const [course] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', true, 999, 0, 'beginner')
     RETURNING id`,
    [`Test Course ${RUN}`, `test-course-${RUN}`]
  );
  const cId = course.id as number;
  createdCourseIds.push(cId);

  // Insert a lesson
  const [lesson] = await queryDb(
    `INSERT INTO lms_lessons (course_id, title, slug, type, duration_minutes, sort_order, is_active)
     VALUES ($1, $2, $3, 'article', 5, 1, true)
     RETURNING id`,
    [cId, `Lesson ${RUN}`, `lesson-${RUN}`]
  );
  const lId = lesson.id as number;

  // Enroll student
  await queryDb(
    `INSERT INTO lms_enrollments (user_id, course_id) VALUES ($1, $2)`,
    [studentUserId, cId]
  );

  // Mark lesson progress (completed_at defaults to now)
  await queryDb(
    `INSERT INTO lms_lesson_progress (user_id, course_id, lesson_id)
     VALUES ($1, $2, $3)`,
    [studentUserId, cId, lId]
  );

  // Issue a certificate
  await queryDb(
    `INSERT INTO lms_certificates (user_id, course_id, certificate_code)
     VALUES ($1, $2, $3)`,
    [studentUserId, cId, `CERT-${RUN}-${seqSuffix}`]
  );

  return { courseId: cId, lessonId: lId, studentUserId };
}

// ── Tests ─────────────────────────────────────────────────────────────────

test("force-delete cascade: all four dependent tables are empty after DELETE ?force=true", { skip: SKIP }, async () => {
  const { courseId: cId } = await seedCourseWithStudentData();
  courseId = cId;

  // Pre-condition: verify rows exist in every dependent table.
  const [{ ep }] = await queryDb(
    `SELECT COUNT(*) AS ep FROM lms_enrollments WHERE course_id = $1`,
    [cId]
  );
  assert.equal(Number(ep), 1, "enrollment should exist before delete");

  const [{ pp }] = await queryDb(
    `SELECT COUNT(*) AS pp FROM lms_lesson_progress WHERE course_id = $1`,
    [cId]
  );
  assert.equal(Number(pp), 1, "lesson_progress should exist before delete");

  const [{ cp }] = await queryDb(
    `SELECT COUNT(*) AS cp FROM lms_certificates WHERE course_id = $1`,
    [cId]
  );
  assert.equal(Number(cp), 1, "certificate should exist before delete");

  const [{ lp }] = await queryDb(
    `SELECT COUNT(*) AS lp FROM lms_lessons WHERE course_id = $1`,
    [cId]
  );
  assert.equal(Number(lp), 1, "lesson should exist before delete");

  // Act: fire DELETE with ?force=true.
  const res = await fetch(`${baseUrl}/api/admin/lms/courses/${cId}?force=true`, {
    method: "DELETE",
  });
  assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
  const body = await res.json() as any;
  assert.equal(body.ok, true, "Response body should be { ok: true }");

  // Mark as gone so after() cleanup is a no-op for this id.
  createdCourseIds = createdCourseIds.filter((id) => id !== cId);

  // Post-condition: every dependent table must have zero rows for this courseId.
  const [{ ep2 }] = await queryDb(
    `SELECT COUNT(*) AS ep2 FROM lms_enrollments WHERE course_id = $1`,
    [cId]
  );
  assert.equal(Number(ep2), 0, "lms_enrollments must be empty after force-delete");

  const [{ pp2 }] = await queryDb(
    `SELECT COUNT(*) AS pp2 FROM lms_lesson_progress WHERE course_id = $1`,
    [cId]
  );
  assert.equal(Number(pp2), 0, "lms_lesson_progress must be empty after force-delete");

  const [{ cp2 }] = await queryDb(
    `SELECT COUNT(*) AS cp2 FROM lms_certificates WHERE course_id = $1`,
    [cId]
  );
  assert.equal(Number(cp2), 0, "lms_certificates must be empty after force-delete");

  const [{ lp2 }] = await queryDb(
    `SELECT COUNT(*) AS lp2 FROM lms_lessons WHERE course_id = $1`,
    [cId]
  );
  assert.equal(Number(lp2), 0, "lms_lessons must be empty after force-delete");

  // The course row itself must also be gone.
  const courseRows = await queryDb(
    `SELECT id FROM lms_courses WHERE id = $1`,
    [cId]
  );
  assert.equal(courseRows.length, 0, "lms_courses row must be removed after force-delete");
});

test("force-delete: returns 409 (not force) when enrolled students exist and force flag is absent", { skip: SKIP }, async () => {
  const { courseId: cId } = await seedCourseWithStudentData();

  const res = await fetch(`${baseUrl}/api/admin/lms/courses/${cId}`, {
    method: "DELETE",
  });
  assert.equal(res.status, 409, "Should block delete without force=true when enrollments exist");
  const body = await res.json() as any;
  assert.ok(body.enrollmentCount > 0, "Response should include enrollmentCount > 0");
});

test("UI network request: DELETE URL includes ?force=true only after force-confirm step", { skip: false }, async () => {
  // Static assertion: verify the admin-academy.tsx mutation constructs the URL correctly.
  // We read the source file and confirm the URL construction logic is sound.
  // This catches any future refactor that accidentally hard-codes force=true or drops it.
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { resolve, dirname } = await import("node:path");
  const __dir = dirname(fileURLToPath(import.meta.url));
  const src: string = readFileSync(
    resolve(__dir, "../client/src/pages/admin-academy.tsx"),
    "utf8"
  );

  // 1. The mutation must append ?force=true only when force is truthy.
  assert.ok(
    src.includes('force ? "?force=true" : ""'),
    'URL construction must use ternary: force ? "?force=true" : ""'
  );

  // 2. The force flag must come exclusively from forceDeleteConfirm state —
  //    preventing accidental force-delete without the two-step confirmation.
  assert.ok(
    src.includes("force: forceDeleteConfirm"),
    "force prop passed to mutate must read from forceDeleteConfirm state"
  );

  // 3. The "Hapus paksa" button must only set forceDeleteConfirm, never directly delete.
  assert.ok(
    src.includes("setForceDeleteConfirm(true)"),
    '"Hapus paksa" button must set forceDeleteConfirm=true (two-step guard)'
  );
});

// ── Re-enrollment certificate-survival tests ──────────────────────────────

test(
  "re-enroll: certificate survives when student calls enroll again on an already-enrolled completed course",
  { skip: SKIP },
  async () => {
    // Seed: completed enrollment + certificate.
    const { courseId: cId, studentUserId } = await seedCourseWithStudentData();

    // Mark enrollment as completed (progress = 100).
    await queryDb(
      `UPDATE lms_enrollments SET progress = 100, completed_at = NOW()
       WHERE user_id = $1 AND course_id = $2`,
      [studentUserId, cId]
    );

    // Act: call POST /api/lms/enroll/:courseId again as the same student.
    // The test server authenticates every request as TEST_ADMIN_ID, so we
    // need a second mini-server that impersonates the student instead.
    const { registerLmsRoutes } = await import("../server/routes-lms");
    const appStudent = (await import("express")).default();
    appStudent.use((await import("express")).default.json());
    appStudent.use((req: any, _res: any, next: any) => {
      req.user = { id: studentUserId, claims: { sub: studentUserId } };
      req.isAuthenticated = () => true;
      next();
    });
    registerLmsRoutes(appStudent);

    const { createServer: createSrv } = await import("node:http");
    const studentSrv = createSrv(appStudent);
    await new Promise<void>((resolve) => studentSrv.listen(0, "127.0.0.1", resolve));
    const { port: sPort } = studentSrv.address() as import("node:net").AddressInfo;
    const studentBase = `http://127.0.0.1:${sPort}`;

    try {
      const res = await fetch(`${studentBase}/api/lms/enroll/${cId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      // Should succeed (200) — route returns the existing enrollment idempotently.
      assert.ok(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);

      // Certificate must still exist — re-enrollment must not touch lms_certificates.
      const [{ certCount }] = await queryDb(
        `SELECT COUNT(*) AS "certCount" FROM lms_certificates
         WHERE user_id = $1 AND course_id = $2`,
        [studentUserId, cId]
      );
      assert.equal(Number(certCount), 1, "Certificate must survive re-enrollment when enrollment already exists");

      // The returned enrollment must still reflect completed state (progress = 100).
      const enrollment = await res.json() as any;
      assert.equal(Number(enrollment.progress), 100, "Re-enrollment response must preserve progress = 100");
    } finally {
      await new Promise<void>((resolve, reject) =>
        studentSrv.close((err) => (err ? reject(err) : resolve()))
      );
    }
  }
);

test(
  "re-enroll: certificate survives when enrollment row was deleted and student re-enrolls fresh",
  { skip: SKIP },
  async () => {
    // Seed: certificate exists but enrollment row is deleted (admin-cleared scenario).
    const { courseId: cId, studentUserId } = await seedCourseWithStudentData();

    // Mark the enrollment completed first, then delete it to simulate admin cleanup.
    await queryDb(
      `UPDATE lms_enrollments SET progress = 100, completed_at = NOW()
       WHERE user_id = $1 AND course_id = $2`,
      [studentUserId, cId]
    );
    await queryDb(
      `DELETE FROM lms_enrollments WHERE user_id = $1 AND course_id = $2`,
      [studentUserId, cId]
    );

    // Confirm enrollment is gone but certificate remains.
    const [{ eCount }] = await queryDb(
      `SELECT COUNT(*) AS "eCount" FROM lms_enrollments
       WHERE user_id = $1 AND course_id = $2`,
      [studentUserId, cId]
    );
    assert.equal(Number(eCount), 0, "Enrollment should be absent before re-enrollment");

    const [{ cBefore }] = await queryDb(
      `SELECT COUNT(*) AS "cBefore" FROM lms_certificates
       WHERE user_id = $1 AND course_id = $2`,
      [studentUserId, cId]
    );
    assert.equal(Number(cBefore), 1, "Certificate should exist before re-enrollment");

    // Act: re-enroll via the route.
    const { registerLmsRoutes } = await import("../server/routes-lms");
    const appStudent = (await import("express")).default();
    appStudent.use((await import("express")).default.json());
    appStudent.use((req: any, _res: any, next: any) => {
      req.user = { id: studentUserId, claims: { sub: studentUserId } };
      req.isAuthenticated = () => true;
      next();
    });
    registerLmsRoutes(appStudent);

    const { createServer: createSrv } = await import("node:http");
    const studentSrv = createSrv(appStudent);
    await new Promise<void>((resolve) => studentSrv.listen(0, "127.0.0.1", resolve));
    const { port: sPort } = studentSrv.address() as import("node:net").AddressInfo;
    const studentBase = `http://127.0.0.1:${sPort}`;

    try {
      const res = await fetch(`${studentBase}/api/lms/enroll/${cId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      assert.ok(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);

      // Certificate must still exist after the fresh INSERT of a new enrollment row.
      const [{ cAfter }] = await queryDb(
        `SELECT COUNT(*) AS "cAfter" FROM lms_certificates
         WHERE user_id = $1 AND course_id = $2`,
        [studentUserId, cId]
      );
      assert.equal(Number(cAfter), 1, "Certificate must survive fresh re-enrollment after enrollment row was deleted");

      // The new enrollment row must reflect prior completion (progress = 100).
      const enrollment = await res.json() as any;
      assert.equal(
        Number(enrollment.progress),
        100,
        "New enrollment row must start at progress = 100 when a prior certificate exists"
      );
    } finally {
      await new Promise<void>((resolve, reject) =>
        studentSrv.close((err) => (err ? reject(err) : resolve()))
      );
    }
  }
);

// ── Static code-guard: enrollment INSERT cannot silently clobber completedAt ─

test("static: enroll route checks existing enrollment before INSERT (no blind overwrite)", { skip: false }, async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { resolve, dirname } = await import("node:path");
  const __dir = dirname(fileURLToPath(import.meta.url));
  const src: string = readFileSync(resolve(__dir, "../server/routes-lms.ts"), "utf8");

  // 1. The enroll handler must guard with an existing-enrollment check.
  assert.ok(
    src.includes("if (existing) return res.json(existing)"),
    "Enroll route must short-circuit and return existing enrollment (no overwrite)"
  );

  // 2. When a prior certificate exists the route must honour it — it must
  //    NOT unconditionally insert with progress = 0.
  assert.ok(
    src.includes("existingCert") && src.includes("initialProgress"),
    "Enroll route must detect prior certificate and preserve progress / completedAt on fresh INSERT"
  );
});
