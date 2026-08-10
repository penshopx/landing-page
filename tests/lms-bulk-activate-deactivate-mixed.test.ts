/**
 * Integration test — verifies that POST /api/admin/lms/courses/bulk-activate
 * and POST /api/admin/lms/courses/bulk-deactivate each report the number of
 * courses that actually changed state, not the full selection size.
 *
 * Scenario: admin selects 3 courses where 2 are already active + 1 is inactive,
 * then clicks "Aktifkan semua" → only 1 should be counted as `activated`.
 * The reverse scenario applies for bulk-deactivate.
 *
 * Skipped automatically when DATABASE_URL is not set (CI without a DB).
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

// ── Guards & env ──────────────────────────────────────────────────────────────

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `lms_bulk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_ADMIN_ID = `test-admin-${RUN}`;
const TEST_NON_ADMIN_ID = `test-user-${RUN}`;

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

async function seedCourse(isActive: boolean): Promise<number> {
  const slug = `bulk-test-${RUN}-${Math.random().toString(36).slice(2, 8)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, is_public, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', $3, true, 999, 0, 'beginner')
     RETURNING id`,
    [`Bulk Test ${slug}`, slug, isActive]
  );
  const id = row.id as number;
  createdCourseIds.push(id);
  return id;
}

function bulkActivate(ids: number[], userId?: string): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) headers["x-test-user"] = userId;
  return fetch(`${baseUrl}/api/admin/lms/courses/bulk-activate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ids }),
  });
}

function bulkDeactivate(ids: number[], userId?: string): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) headers["x-test-user"] = userId;
  return fetch(`${baseUrl}/api/admin/lms/courses/bulk-deactivate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ids }),
  });
}

// ── Auth gate: bulk-activate ──────────────────────────────────────────────────

test("bulk-activate: unauthenticated → 401", { skip: SKIP }, async () => {
  const res = await bulkActivate([1]);
  assert.equal(res.status, 401, `Expected 401, got ${res.status}`);
});

test("bulk-activate: non-admin → 403", { skip: SKIP }, async () => {
  const res = await bulkActivate([1], TEST_NON_ADMIN_ID);
  assert.equal(res.status, 403, `Expected 403 for non-admin, got ${res.status}`);
});

// ── Auth gate: bulk-deactivate ────────────────────────────────────────────────

test("bulk-deactivate: unauthenticated → 401", { skip: SKIP }, async () => {
  const res = await bulkDeactivate([1]);
  assert.equal(res.status, 401, `Expected 401, got ${res.status}`);
});

test("bulk-deactivate: non-admin → 403", { skip: SKIP }, async () => {
  const res = await bulkDeactivate([1], TEST_NON_ADMIN_ID);
  assert.equal(res.status, 403, `Expected 403 for non-admin, got ${res.status}`);
});

// ── Input validation ──────────────────────────────────────────────────────────

test("bulk-activate: empty ids array → 400", { skip: SKIP }, async () => {
  const res = await bulkActivate([], TEST_ADMIN_ID);
  assert.equal(res.status, 400, `Expected 400 for empty ids, got ${res.status}`);
});

test("bulk-deactivate: empty ids array → 400", { skip: SKIP }, async () => {
  const res = await bulkDeactivate([], TEST_ADMIN_ID);
  assert.equal(res.status, 400, `Expected 400 for empty ids, got ${res.status}`);
});

// ── Core behaviour: bulk-activate with mixed selection ────────────────────────

test(
  "bulk-activate: activated count equals only the courses that were inactive",
  { skip: SKIP },
  async () => {
    // 2 already-active courses, 1 inactive course.
    const [activeA, activeB, inactive] = await Promise.all([
      seedCourse(true),
      seedCourse(true),
      seedCourse(false),
    ]);

    const ids = [activeA, activeB, inactive];
    const res = await bulkActivate(ids, TEST_ADMIN_ID);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);

    const body = await res.json() as any;
    assert.equal(body.ok, true, "Response must have ok: true");

    // Only the 1 inactive course should have changed.
    assert.equal(
      body.activated, 1,
      `activated must be 1 (only truly-inactive courses), got ${body.activated}`
    );

    // selected must reflect the full input.
    assert.equal(
      body.selected, 3,
      `selected must be 3 (full input), got ${body.selected}`
    );

    // Verify DB state: all 3 must now be active.
    const rows = await queryDb(
      `SELECT id, is_active FROM lms_courses WHERE id = ANY($1::int[])`,
      [ids]
    );
    for (const row of rows) {
      assert.equal(
        row.is_active, true,
        `Course ${row.id} must be active after bulk-activate`
      );
    }
  }
);

test(
  "bulk-activate: activated = 0 when all selected courses are already active",
  { skip: SKIP },
  async () => {
    const [activeA, activeB] = await Promise.all([
      seedCourse(true),
      seedCourse(true),
    ]);

    const res = await bulkActivate([activeA, activeB], TEST_ADMIN_ID);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);

    const body = await res.json() as any;
    assert.equal(body.ok, true, "Response must have ok: true");

    // Nothing changed — activated must be 0.
    assert.equal(
      body.activated, 0,
      `activated must be 0 when all courses are already active, got ${body.activated}`
    );
    assert.equal(
      body.selected, 2,
      `selected must be 2 (full input), got ${body.selected}`
    );
  }
);

test(
  "bulk-activate: activated equals selected when all courses are inactive",
  { skip: SKIP },
  async () => {
    const [inactiveA, inactiveB] = await Promise.all([
      seedCourse(false),
      seedCourse(false),
    ]);

    const res = await bulkActivate([inactiveA, inactiveB], TEST_ADMIN_ID);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);

    const body = await res.json() as any;
    assert.equal(body.ok, true, "Response must have ok: true");

    // All were inactive → activated must match selected.
    assert.equal(
      body.activated, 2,
      `activated must equal selected (2) when all courses are inactive, got ${body.activated}`
    );
    assert.equal(
      body.selected, 2,
      `selected must be 2, got ${body.selected}`
    );
  }
);

// ── Core behaviour: bulk-deactivate with mixed selection ──────────────────────

test(
  "bulk-deactivate: deactivated count equals only the courses that were active",
  { skip: SKIP },
  async () => {
    // 2 already-inactive courses, 1 active course.
    const [inactiveA, inactiveB, active] = await Promise.all([
      seedCourse(false),
      seedCourse(false),
      seedCourse(true),
    ]);

    const ids = [inactiveA, inactiveB, active];
    const res = await bulkDeactivate(ids, TEST_ADMIN_ID);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);

    const body = await res.json() as any;
    assert.equal(body.ok, true, "Response must have ok: true");

    // Only the 1 active course should have changed.
    assert.equal(
      body.deactivated, 1,
      `deactivated must be 1 (only truly-active courses), got ${body.deactivated}`
    );

    // selected must reflect the full input.
    assert.equal(
      body.selected, 3,
      `selected must be 3 (full input), got ${body.selected}`
    );

    // Verify DB state: all 3 must now be inactive.
    const rows = await queryDb(
      `SELECT id, is_active FROM lms_courses WHERE id = ANY($1::int[])`,
      [ids]
    );
    for (const row of rows) {
      assert.equal(
        row.is_active, false,
        `Course ${row.id} must be inactive after bulk-deactivate`
      );
    }
  }
);

test(
  "bulk-deactivate: deactivated = 0 when all selected courses are already inactive",
  { skip: SKIP },
  async () => {
    const [inactiveA, inactiveB] = await Promise.all([
      seedCourse(false),
      seedCourse(false),
    ]);

    const res = await bulkDeactivate([inactiveA, inactiveB], TEST_ADMIN_ID);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);

    const body = await res.json() as any;
    assert.equal(body.ok, true, "Response must have ok: true");

    // Nothing changed — deactivated must be 0.
    assert.equal(
      body.deactivated, 0,
      `deactivated must be 0 when all courses are already inactive, got ${body.deactivated}`
    );
    assert.equal(
      body.selected, 2,
      `selected must be 2 (full input), got ${body.selected}`
    );
  }
);

test(
  "bulk-deactivate: deactivated equals selected when all courses are active",
  { skip: SKIP },
  async () => {
    const [activeA, activeB] = await Promise.all([
      seedCourse(true),
      seedCourse(true),
    ]);

    const res = await bulkDeactivate([activeA, activeB], TEST_ADMIN_ID);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);

    const body = await res.json() as any;
    assert.equal(body.ok, true, "Response must have ok: true");

    // All were active → deactivated must match selected.
    assert.equal(
      body.deactivated, 2,
      `deactivated must equal selected (2) when all courses are active, got ${body.deactivated}`
    );
    assert.equal(
      body.selected, 2,
      `selected must be 2, got ${body.selected}`
    );
  }
);

// ── Static code-guard: client surfaces correct toast messages ─────────────────

test("static: bulkActivateMutation toast shows 'sudah aktif sebelumnya' when some were skipped", { skip: false }, async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { resolve, dirname } = await import("node:path");
  const __dir = dirname(fileURLToPath(import.meta.url));
  const src: string = readFileSync(
    resolve(__dir, "../client/src/pages/admin-academy.tsx"),
    "utf8"
  );

  // 1. The endpoint call must use POST and the correct path.
  assert.ok(
    src.includes('"POST", "/api/admin/lms/courses/bulk-activate"'),
    'Client must call POST /api/admin/lms/courses/bulk-activate'
  );

  // 2. The response field used is "activated".
  assert.ok(
    src.includes("data.activated"),
    'Client toast must read data.activated from the response'
  );

  // 3. The toast must surface a note when some courses were already active.
  assert.ok(
    src.includes("sudah aktif sebelumnya") &&
    src.includes("data.activated"),
    'Client toast must show "sudah aktif sebelumnya" note when activated < selected'
  );

  // 4. The UI toolbar must have a button wired to bulkActivateMutation.
  assert.ok(
    src.includes('data-testid="button-bulk-activate"'),
    'Toolbar must render a button with data-testid="button-bulk-activate"'
  );

  // 5. That button\'s onClick must invoke bulkActivateMutation.mutate.
  assert.ok(
    src.includes("bulkActivateMutation.mutate(Array.from(selectedCourseIds))"),
    'The bulk-activate button must call bulkActivateMutation.mutate with the selected ids'
  );
});

test("static: bulkDeactivateMutation toast shows 'sudah tidak aktif sebelumnya' when some were skipped", { skip: false }, async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { resolve, dirname } = await import("node:path");
  const __dir = dirname(fileURLToPath(import.meta.url));
  const src: string = readFileSync(
    resolve(__dir, "../client/src/pages/admin-academy.tsx"),
    "utf8"
  );

  // 1. The endpoint call must use POST and the correct path.
  assert.ok(
    src.includes('"POST", "/api/admin/lms/courses/bulk-deactivate"'),
    'Client must call POST /api/admin/lms/courses/bulk-deactivate'
  );

  // 2. The response field used is "deactivated".
  assert.ok(
    src.includes("data.deactivated"),
    'Client toast must read data.deactivated from the response'
  );

  // 3. The toast must surface a note when some courses were already inactive.
  assert.ok(
    src.includes("sudah tidak aktif sebelumnya") &&
    src.includes("data.deactivated"),
    'Client toast must show "sudah tidak aktif sebelumnya" note when deactivated < selected'
  );

  // 4. The UI toolbar must have a button wired to bulkDeactivateMutation.
  assert.ok(
    src.includes('data-testid="button-bulk-deactivate"'),
    'Toolbar must render a button with data-testid="button-bulk-deactivate"'
  );

  // 5. That button\'s onClick must invoke bulkDeactivateMutation.mutate.
  assert.ok(
    src.includes("bulkDeactivateMutation.mutate(Array.from(selectedCourseIds))"),
    'The bulk-deactivate button must call bulkDeactivateMutation.mutate with the selected ids'
  );
});
