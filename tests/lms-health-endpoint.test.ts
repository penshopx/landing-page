/**
 * Integrasi DB nyata — memverifikasi bahwa GET /api/admin/lms/health
 * mengembalikan response shape yang benar, hanya bisa diakses admin, dan
 * hitungan counts sesuai dengan data sebenarnya di database.
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

const RUN = `lms_health_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_ADMIN_ID = `test-admin-${RUN}`;
const TEST_NON_ADMIN_ID = `test-user-${RUN}`;

// ── Express test server ───────────────────────────────────────────────────────

let server: Server;
let baseUrl: string;

// Track courses created by this test so cleanup is exhaustive.
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

  // Admin user is recognised via ADMIN_USER_IDS env var, same trick used by
  // lms-force-delete-cascade.test.ts.
  const origAdminIds = process.env.ADMIN_USER_IDS ?? "";
  process.env.ADMIN_USER_IDS = origAdminIds
    ? `${origAdminIds},${TEST_ADMIN_ID}`
    : TEST_ADMIN_ID;
  // Non-admin intentionally NOT added.

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

function getHealth(userId?: string): Promise<Response> {
  const headers: Record<string, string> = {};
  if (userId) headers["x-test-user"] = userId;
  return fetch(`${baseUrl}/api/admin/lms/health`, { headers });
}

async function seedCourse(): Promise<number> {
  const slug = `health-test-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, is_public, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', true, true, 999, 0, 'beginner')
     RETURNING id`,
    [`Health Test Course ${slug}`, slug]
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

async function seedEnrollment(userId: string, courseId: number) {
  await queryDb(
    `INSERT INTO lms_enrollments (user_id, course_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userId, courseId]
  );
}

/**
 * Poll the health endpoint until seedStatus is no longer 'pending' (i.e. seed
 * finished or errored), with a 15-second ceiling. This is needed because
 * registerLmsRoutes kicks off seeding asynchronously; in a fresh test process
 * the endpoint can still report 'pending' on the first request.
 */
async function waitForSeedDone(timeoutMs = 15_000): Promise<any> {
  const TERMINAL = new Set(["done", "skipped", "error"]);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await getHealth(TEST_ADMIN_ID);
    if (res.status !== 200) {
      await new Promise((r) => setTimeout(r, 300));
      continue;
    }
    const body = await res.json() as any;
    if (TERMINAL.has(body.seedStatus)) return body;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`seedStatus still 'pending' after ${timeoutMs}ms`);
}

/** Direct DB counts — used as the source of truth to validate endpoint counts. */
async function dbCounts() {
  const [[tc], [ac], [tl], [te]] = await Promise.all([
    queryDb(`SELECT COUNT(*)::int AS n FROM lms_courses`),
    queryDb(`SELECT COUNT(*)::int AS n FROM lms_courses WHERE is_active = true AND is_public = true`),
    queryDb(`SELECT COUNT(*)::int AS n FROM lms_lessons`),
    queryDb(`SELECT COUNT(*)::int AS n FROM lms_enrollments`),
  ]);
  return {
    totalCourses:     Number(tc.n),
    activeCourses:    Number(ac.n),
    totalLessons:     Number(tl.n),
    totalEnrollments: Number(te.n),
  };
}

// ── Auth gate tests ───────────────────────────────────────────────────────────

test("health: unauthenticated → 401", { skip: SKIP }, async () => {
  const res = await getHealth();  // no x-test-user header
  assert.equal(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
});

test("health: non-admin user → 403", { skip: SKIP }, async () => {
  const res = await getHealth(TEST_NON_ADMIN_ID);
  assert.equal(res.status, 403, `Expected 403 Forbidden for non-admin, got ${res.status}`);
});

// ── Shape & terminal seedStatus test (admin) ─────────────────────────────────

test("health: admin → 200 with correct response shape and successful seedStatus", { skip: SKIP }, async () => {
  // Wait for the async seed (kicked off by registerLmsRoutes) to reach a
  // terminal state before asserting — avoids a race where seedStatus is still
  // 'pending' on the first poll.
  const body = await waitForSeedDone();

  // Top-level keys must be present.
  assert.ok("seedStatus" in body, "Response must contain 'seedStatus'");
  assert.ok("seeding"    in body, "Response must contain 'seeding'");
  assert.ok("counts"     in body, "Response must contain 'counts'");

  // seedStatus must be a successful terminal state (catalog seeded or already present).
  const TERMINAL_OK = ["done", "skipped"];
  assert.ok(
    TERMINAL_OK.includes(body.seedStatus),
    `seedStatus must be one of ${JSON.stringify(TERMINAL_OK)}, got '${body.seedStatus}'`
  );

  // seeding is a boolean derived from seedStatus.
  assert.equal(typeof body.seeding, "boolean", "'seeding' must be a boolean");
  // When seedStatus is terminal (done/skipped), seeding must be false.
  assert.equal(body.seeding, false, "'seeding' must be false when seedStatus is terminal");

  // counts sub-object with all required fields.
  const { counts } = body;
  assert.ok(counts && typeof counts === "object", "'counts' must be an object");

  for (const key of ["totalCourses", "activeCourses", "totalLessons", "totalEnrollments"]) {
    assert.ok(key in counts, `counts must contain '${key}'`);
    assert.equal(typeof counts[key], "number", `counts.${key} must be a number`);
    assert.ok(Number.isSafeInteger(counts[key]), `counts.${key} must be a safe integer`);
    assert.ok(counts[key] >= 0, `counts.${key} must be non-negative, got ${counts[key]}`);
  }
});

// ── Exact delta test: counts match DB and reflect new fixtures ────────────────

test("health: counts match DB counts exactly, and reflect new course/lesson/enrollment", { skip: SKIP }, async () => {
  // 1. Snapshot DB totals and endpoint response BEFORE inserting fixtures.
  const before = await dbCounts();
  const resBefore = await getHealth(TEST_ADMIN_ID);
  assert.equal(resBefore.status, 200);
  const { counts: endpointBefore } = await resBefore.json() as any;

  // Endpoint counts must agree with direct DB counts BEFORE insertion.
  assert.equal(
    endpointBefore.totalCourses, before.totalCourses,
    `totalCourses endpoint (${endpointBefore.totalCourses}) ≠ DB (${before.totalCourses}) before fixture`
  );
  assert.equal(
    endpointBefore.activeCourses, before.activeCourses,
    `activeCourses endpoint (${endpointBefore.activeCourses}) ≠ DB (${before.activeCourses}) before fixture`
  );
  assert.equal(
    endpointBefore.totalLessons, before.totalLessons,
    `totalLessons endpoint (${endpointBefore.totalLessons}) ≠ DB (${before.totalLessons}) before fixture`
  );
  assert.equal(
    endpointBefore.totalEnrollments, before.totalEnrollments,
    `totalEnrollments endpoint (${endpointBefore.totalEnrollments}) ≠ DB (${before.totalEnrollments}) before fixture`
  );

  // 2. Insert exactly 1 course (active+public), 1 lesson, 1 enrollment.
  const courseId  = await seedCourse();
  await seedLesson(courseId);
  const studentId = `student-health-${RUN}`;
  await seedEnrollment(studentId, courseId);

  // 3. Read endpoint again.
  const resAfter = await getHealth(TEST_ADMIN_ID);
  assert.equal(resAfter.status, 200);
  const { counts: endpointAfter } = await resAfter.json() as any;

  // 4. Assert exact +1 deltas from the pre-fixture snapshot.
  assert.equal(
    endpointAfter.totalCourses, before.totalCourses + 1,
    `totalCourses must increase by exactly 1 (expected ${before.totalCourses + 1}, got ${endpointAfter.totalCourses})`
  );
  assert.equal(
    endpointAfter.activeCourses, before.activeCourses + 1,
    `activeCourses must increase by exactly 1 (expected ${before.activeCourses + 1}, got ${endpointAfter.activeCourses})`
  );
  assert.equal(
    endpointAfter.totalLessons, before.totalLessons + 1,
    `totalLessons must increase by exactly 1 (expected ${before.totalLessons + 1}, got ${endpointAfter.totalLessons})`
  );
  assert.equal(
    endpointAfter.totalEnrollments, before.totalEnrollments + 1,
    `totalEnrollments must increase by exactly 1 (expected ${before.totalEnrollments + 1}, got ${endpointAfter.totalEnrollments})`
  );

  // 5. Also verify endpoint matches direct DB counts AFTER insertion.
  const after = await dbCounts();
  assert.equal(endpointAfter.totalCourses,     after.totalCourses,     "totalCourses must match DB after insertion");
  assert.equal(endpointAfter.activeCourses,    after.activeCourses,    "activeCourses must match DB after insertion");
  assert.equal(endpointAfter.totalLessons,     after.totalLessons,     "totalLessons must match DB after insertion");
  assert.equal(endpointAfter.totalEnrollments, after.totalEnrollments, "totalEnrollments must match DB after insertion");
});

// ── Invariant test ────────────────────────────────────────────────────────────

test("health: activeCourses ≤ totalCourses invariant holds", { skip: SKIP }, async () => {
  const res = await getHealth(TEST_ADMIN_ID);
  assert.equal(res.status, 200);
  const { counts } = await res.json() as any;

  assert.ok(
    counts.activeCourses <= counts.totalCourses,
    `activeCourses (${counts.activeCourses}) must be ≤ totalCourses (${counts.totalCourses})`
  );
});
