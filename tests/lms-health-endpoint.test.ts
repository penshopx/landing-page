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

// ── Certificate count tests ───────────────────────────────────────────────────

/**
 * Creates a completed enrollment (progress=100, completed_at set) for the given
 * user + course and inserts a certificate row.  Returns the certificate_code so
 * the caller can delete the cert to test the pendingCertificates path.
 */
async function seedCompletedEnrollmentWithCert(userId: string, courseId: number): Promise<string> {
  // Insert a 100%-complete enrollment (each test uses a fresh course so no conflict).
  await queryDb(
    `INSERT INTO lms_enrollments (user_id, course_id, progress, completed_at)
     VALUES ($1, $2, 100, NOW())`,
    [userId, courseId]
  );

  // Insert a certificate for this completion.
  const certCode = `TEST-CERT-${RUN}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  await queryDb(
    `INSERT INTO lms_certificates (user_id, course_id, certificate_code)
     VALUES ($1, $2, $3)`,
    [userId, courseId, certCode]
  );
  return certCode;
}

test("health: totalCertificates reflects a newly issued certificate", { skip: SKIP }, async () => {
  // Snapshot counts before inserting fixture data.
  const res0 = await getHealth(TEST_ADMIN_ID);
  assert.equal(res0.status, 200);
  const { counts: before } = await res0.json() as any;
  assert.equal(typeof before.totalCertificates, "number", "totalCertificates must be a number");
  assert.equal(typeof before.pendingCertificates, "number", "pendingCertificates must be a number");

  // Create a course, enrollment (100%), and certificate.
  const courseId  = await seedCourse();
  await seedLesson(courseId);
  const studentId = `cert-student-${RUN}`;
  await seedCompletedEnrollmentWithCert(studentId, courseId);

  // Health endpoint must reflect the new certificate immediately.
  const res1 = await getHealth(TEST_ADMIN_ID);
  assert.equal(res1.status, 200);
  const { counts: after } = await res1.json() as any;

  assert.equal(
    after.totalCertificates, before.totalCertificates + 1,
    `totalCertificates must increase by 1 (expected ${before.totalCertificates + 1}, got ${after.totalCertificates})`
  );

  // A completed enrollment that already has a certificate must NOT be counted as pending.
  assert.equal(
    after.pendingCertificates, before.pendingCertificates,
    `pendingCertificates must stay the same when a certificate exists (expected ${before.pendingCertificates}, got ${after.pendingCertificates})`
  );
});

test("health: pendingCertificates increments when cert row is deleted", { skip: SKIP }, async () => {
  // Create a course with a completed enrollment + certificate.
  const courseId  = await seedCourse();
  await seedLesson(courseId);
  const studentId = `cert-del-student-${RUN}`;
  const certCode  = await seedCompletedEnrollmentWithCert(studentId, courseId);

  // Snapshot counts with the certificate present.
  const res0 = await getHealth(TEST_ADMIN_ID);
  assert.equal(res0.status, 200);
  const { counts: withCert } = await res0.json() as any;

  // Remove the certificate row — the enrollment stays completed_at/progress=100.
  await queryDb(
    `DELETE FROM lms_certificates WHERE certificate_code = $1`,
    [certCode]
  );

  // Health endpoint must now report one more pendingCertificates.
  const res1 = await getHealth(TEST_ADMIN_ID);
  assert.equal(res1.status, 200);
  const { counts: withoutCert } = await res1.json() as any;

  assert.equal(
    withoutCert.totalCertificates, withCert.totalCertificates - 1,
    `totalCertificates must decrease by 1 after cert deletion (expected ${withCert.totalCertificates - 1}, got ${withoutCert.totalCertificates})`
  );
  assert.equal(
    withoutCert.pendingCertificates, withCert.pendingCertificates + 1,
    `pendingCertificates must increase by 1 after cert deletion (expected ${withCert.pendingCertificates + 1}, got ${withoutCert.pendingCertificates})`
  );
});

// ── Cert-repair round-trip: pendingCertificates back to 0 ────────────────────

/**
 * End-to-end: a completed enrollment with NO certificate row makes
 * pendingCertificates > 0; POST /api/admin/lms/cert-repair backfills the
 * missing certificate(s); health must then report pendingCertificates === 0
 * and totalCertificates incremented accordingly.
 */
test("cert-repair: clears pendingCertificates back to zero and increments totalCertificates", { skip: SKIP }, async () => {
  // 1. Create a completed enrollment WITHOUT a certificate row.
  const courseId  = await seedCourse();
  await seedLesson(courseId);
  const studentId = `cert-repair-student-${RUN}`;
  await queryDb(
    `INSERT INTO lms_enrollments (user_id, course_id, progress, completed_at)
     VALUES ($1, $2, 100, NOW())`,
    [studentId, courseId]
  );

  // 2. Health must now show at least one pending certificate.
  const res0 = await getHealth(TEST_ADMIN_ID);
  assert.equal(res0.status, 200);
  const { counts: before } = await res0.json() as any;
  assert.ok(
    before.pendingCertificates > 0,
    `pendingCertificates must be > 0 after creating a cert-less completion, got ${before.pendingCertificates}`
  );
  const expectedBackfill = before.pendingCertificates;

  // 3. Auth gates on the repair endpoint itself.
  const resNoAuth = await fetch(`${baseUrl}/api/admin/lms/cert-repair`, { method: "POST" });
  assert.equal(resNoAuth.status, 401, `cert-repair without auth expected 401, got ${resNoAuth.status}`);
  const resNonAdmin = await fetch(`${baseUrl}/api/admin/lms/cert-repair`, {
    method: "POST",
    headers: { "x-test-user": TEST_NON_ADMIN_ID },
  });
  assert.equal(resNonAdmin.status, 403, `cert-repair as non-admin expected 403, got ${resNonAdmin.status}`);

  // 4. Run the repair as admin.
  const repairRes = await fetch(`${baseUrl}/api/admin/lms/cert-repair`, {
    method: "POST",
    headers: { "x-test-user": TEST_ADMIN_ID },
  });
  assert.equal(repairRes.status, 200, `cert-repair expected 200, got ${repairRes.status}`);
  const repairBody = await repairRes.json() as any;
  assert.equal(repairBody.ok, true, `cert-repair body must have ok:true, got ${JSON.stringify(repairBody)}`);
  assert.equal(
    repairBody.total, expectedBackfill,
    `cert-repair must target every pending completion (expected ${expectedBackfill}, got ${repairBody.total})`
  );
  assert.equal(
    repairBody.backfilled, expectedBackfill,
    `cert-repair must backfill every gap (expected ${expectedBackfill}, got ${repairBody.backfilled})`
  );
  assert.equal(repairBody.stillPending, 0, `stillPending must be 0, got ${repairBody.stillPending}`);

  // 5. Health must now report pendingCertificates === 0 and the cert total up
  //    by exactly the number of backfilled gaps.
  const res1 = await getHealth(TEST_ADMIN_ID);
  assert.equal(res1.status, 200);
  const { counts: after } = await res1.json() as any;
  assert.equal(
    after.pendingCertificates, 0,
    `pendingCertificates must be 0 after cert-repair, got ${after.pendingCertificates}`
  );
  assert.equal(
    after.totalCertificates, before.totalCertificates + expectedBackfill,
    `totalCertificates must increase by ${expectedBackfill} (expected ${before.totalCertificates + expectedBackfill}, got ${after.totalCertificates})`
  );

  // 6. Verify the certificate row actually exists in the DB for our fixture.
  const certRows = await queryDb(
    `SELECT certificate_code FROM lms_certificates WHERE user_id = $1 AND course_id = $2`,
    [studentId, courseId]
  );
  assert.equal(certRows.length, 1, `Exactly one certificate must exist for the repaired completion, got ${certRows.length}`);
  assert.match(
    String(certRows[0].certificate_code), /^GUSTAFTA-\d{4}-[A-Z2-9]{8}$/,
    `Backfilled certificate_code must follow the GUSTAFTA-YYYY-XXXXXXXX format, got ${certRows[0].certificate_code}`
  );
});

// ── Reseed resets seedStatus to "done" ───────────────────────────────────────

/**
 * Verifies that POST /api/admin/lms/reseed synchronously updates lmsSeedStatus
 * so that a subsequent GET /api/admin/lms/health immediately reflects the new
 * terminal state ("done", seeding=false) — not the stale "pending" value.
 *
 * Uses an isolated Express app + seed-fn override (always adds 1 course) so the
 * status is guaranteed to be "done" rather than "skipped".
 */
test("reseed: POST reseed resets seedStatus to 'done' and seeding to false immediately", { skip: SKIP }, async () => {
  const { registerLmsRoutes } = await import("../server/routes-lms");

  // Seed override: always reports 1 added course so status flips to "done".
  const mockSeedFn = async () => ({ added: 1, updated: 0 });

  const reseedApp = express();
  reseedApp.use(express.json());

  // Auth shim reused from the main before() setup.
  reseedApp.use((req: any, _res: any, next: any) => {
    const uid = req.headers["x-test-user"];
    if (uid) {
      req.user = { id: String(uid), claims: { sub: String(uid) } };
      req.isAuthenticated = () => true;
    } else {
      req.isAuthenticated = () => false;
    }
    next();
  });

  // Register routes with the mock seed function.
  registerLmsRoutes(reseedApp, mockSeedFn);

  const reseedServer: Server = createServer(reseedApp);
  await new Promise<void>((resolve) => reseedServer.listen(0, "127.0.0.1", resolve));
  const { port } = reseedServer.address() as AddressInfo;
  const rsBase = `http://127.0.0.1:${port}`;

  try {
    // 1. Wait for the boot-time async seed to settle (it fires inside registerLmsRoutes).
    const TERMINAL = new Set(["done", "skipped", "error"]);
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      const r = await fetch(`${rsBase}/api/admin/lms/health`, {
        headers: { "x-test-user": TEST_ADMIN_ID },
      });
      if (r.status === 200) {
        const b = await r.json() as any;
        if (TERMINAL.has(b.seedStatus)) break;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    // 2. Call POST /api/admin/lms/reseed as admin and await it.
    const reseedRes = await fetch(`${rsBase}/api/admin/lms/reseed`, {
      method: "POST",
      headers: {
        "x-test-user": TEST_ADMIN_ID,
        "Content-Type": "application/json",
      },
    });
    assert.equal(
      reseedRes.status, 200,
      `POST /api/admin/lms/reseed expected 200, got ${reseedRes.status}`
    );
    const reseedBody = await reseedRes.json() as any;
    assert.equal(reseedBody.ok, true, `Reseed response must have ok:true, got ${JSON.stringify(reseedBody)}`);

    // 3. Immediately call GET /api/admin/lms/health — no poll needed because
    //    the reseed endpoint awaits the seed function before responding.
    const healthRes = await fetch(`${rsBase}/api/admin/lms/health`, {
      headers: { "x-test-user": TEST_ADMIN_ID },
    });
    assert.equal(
      healthRes.status, 200,
      `GET /api/admin/lms/health expected 200, got ${healthRes.status}`
    );
    const healthBody = await healthRes.json() as any;

    // 4. Assert seedStatus is "done" and seeding is false.
    assert.equal(
      healthBody.seedStatus, "done",
      `seedStatus must be "done" immediately after reseed, got "${healthBody.seedStatus}"`
    );
    assert.equal(
      healthBody.seeding, false,
      `seeding must be false immediately after reseed, got ${healthBody.seeding}`
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      reseedServer.close((err) => (err ? reject(err) : resolve()))
    );
  }
});

// ── Lesson delete decrements totalLessons ─────────────────────────────────────

test("health: totalLessons decrements by exactly 1 after a lesson is deleted mid-course", { skip: SKIP }, async () => {
  // 1. Seed a course with 2 lessons.
  const courseId = await seedCourse();
  const lessonIdA = await seedLesson(courseId);
  const lessonIdB = await seedLesson(courseId);

  // 2. Read health counts after seeding (both lessons present).
  const resWithTwo = await getHealth(TEST_ADMIN_ID);
  assert.equal(resWithTwo.status, 200);
  const { counts: withTwo } = await resWithTwo.json() as any;

  // Sanity: the two lessons must be reflected.
  assert.ok(
    withTwo.totalLessons >= 2,
    `totalLessons must be at least 2 after seeding 2 lessons, got ${withTwo.totalLessons}`
  );

  // 3. Delete one lesson via the admin HTTP endpoint.
  const delRes = await fetch(`${baseUrl}/api/admin/lms/lessons/${lessonIdA}`, {
    method: "DELETE",
    headers: { "x-test-user": TEST_ADMIN_ID },
  });
  assert.equal(delRes.status, 200, `DELETE lesson expected 200, got ${delRes.status}`);
  const delBody = await delRes.json() as any;
  assert.equal(delBody.ok, true, `DELETE lesson body must be { ok: true }, got ${JSON.stringify(delBody)}`);

  // 4. Read health counts again after deletion.
  const resWithOne = await getHealth(TEST_ADMIN_ID);
  assert.equal(resWithOne.status, 200);
  const { counts: withOne } = await resWithOne.json() as any;

  // 5. Assert totalLessons decremented by exactly 1.
  assert.equal(
    withOne.totalLessons, withTwo.totalLessons - 1,
    `totalLessons must decrease by exactly 1 after lesson deletion (expected ${withTwo.totalLessons - 1}, got ${withOne.totalLessons})`
  );

  // 6. Confirm the remaining lesson (lessonIdB) is still in the DB.
  const remaining = await queryDb(`SELECT id FROM lms_lessons WHERE id = $1`, [lessonIdB]);
  assert.equal(remaining.length, 1, `Lesson ${lessonIdB} must still exist after deleting lesson ${lessonIdA}`);

  // 7. Endpoint counts must also match the DB directly.
  const dbAfter = await dbCounts();
  assert.equal(
    withOne.totalLessons, dbAfter.totalLessons,
    `totalLessons endpoint (${withOne.totalLessons}) must match DB (${dbAfter.totalLessons}) after deletion`
  );
});
