/**
 * Integrasi DB nyata — memverifikasi bahwa PATCH /api/admin/lms/courses/bulk-reactivate
 * hanya menghitung kursus yang benar-benar berubah status (isActive: false → true),
 * bukan keseluruhan seleksi yang dikirim admin.
 *
 * Dilewati otomatis bila DATABASE_URL tidak diset (CI tanpa DB).
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

// ── Guards & env ──────────────────────────────────────────────────────────────

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `lms_reactivate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
  const slug = `reactivate-test-${RUN}-${Math.random().toString(36).slice(2, 8)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, is_public, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', $3, true, 999, 0, 'beginner')
     RETURNING id`,
    [`Reactivate Test ${slug}`, slug, isActive]
  );
  const id = row.id as number;
  createdCourseIds.push(id);
  return id;
}

function bulkReactivate(ids: number[], userId?: string): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) headers["x-test-user"] = userId;
  return fetch(`${baseUrl}/api/admin/lms/courses/bulk-reactivate`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ ids }),
  });
}

// ── Auth gate tests ───────────────────────────────────────────────────────────

test("bulk-reactivate: unauthenticated → 401", { skip: SKIP }, async () => {
  const res = await bulkReactivate([1]);
  assert.equal(res.status, 401, `Expected 401, got ${res.status}`);
});

test("bulk-reactivate: non-admin → 403", { skip: SKIP }, async () => {
  const res = await bulkReactivate([1], TEST_NON_ADMIN_ID);
  assert.equal(res.status, 403, `Expected 403 for non-admin, got ${res.status}`);
});

// ── Input validation ──────────────────────────────────────────────────────────

test("bulk-reactivate: empty ids array → 400", { skip: SKIP }, async () => {
  const res = await bulkReactivate([], TEST_ADMIN_ID);
  assert.equal(res.status, 400, `Expected 400 for empty ids, got ${res.status}`);
});

// ── Core behaviour: changed count is accurate ─────────────────────────────────

test(
  "bulk-reactivate: reactivated count equals only the courses that were inactive",
  { skip: SKIP },
  async () => {
    // 2 inactive courses, 1 already-active course.
    const [inactiveA, inactiveB, alreadyActive] = await Promise.all([
      seedCourse(false),
      seedCourse(false),
      seedCourse(true),
    ]);

    const ids = [inactiveA, inactiveB, alreadyActive];
    const res = await bulkReactivate(ids, TEST_ADMIN_ID);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);

    const body = await res.json() as any;
    assert.equal(body.ok, true, "Response must have ok: true");

    // Only the 2 inactive ones should have changed.
    assert.equal(
      body.reactivated, 2,
      `reactivated must be 2 (only truly-inactive courses), got ${body.reactivated}`
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
        `Course ${row.id} must be active after bulk-reactivate`
      );
    }
  }
);

test(
  "bulk-reactivate: reactivated = 0 when all selected courses are already active",
  { skip: SKIP },
  async () => {
    // Both courses are already active.
    const [activeA, activeB] = await Promise.all([
      seedCourse(true),
      seedCourse(true),
    ]);

    const res = await bulkReactivate([activeA, activeB], TEST_ADMIN_ID);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);

    const body = await res.json() as any;
    assert.equal(body.ok, true, "Response must have ok: true");

    // Nothing changed — reactivated must be 0.
    assert.equal(
      body.reactivated, 0,
      `reactivated must be 0 when all courses are already active, got ${body.reactivated}`
    );
    assert.equal(
      body.selected, 2,
      `selected must be 2 (full input), got ${body.selected}`
    );
  }
);

test(
  "bulk-reactivate: reactivated equals selected when all courses are inactive",
  { skip: SKIP },
  async () => {
    const [inactiveA, inactiveB] = await Promise.all([
      seedCourse(false),
      seedCourse(false),
    ]);

    const res = await bulkReactivate([inactiveA, inactiveB], TEST_ADMIN_ID);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);

    const body = await res.json() as any;
    assert.equal(body.ok, true, "Response must have ok: true");

    // All courses were inactive → reactivated must match selected.
    assert.equal(
      body.reactivated, 2,
      `reactivated must equal selected (2) when all courses are inactive, got ${body.reactivated}`
    );
    assert.equal(
      body.selected, 2,
      `selected must be 2, got ${body.selected}`
    );
  }
);

// ── Static code-guard: client toast surfaces the "already active" note ────────

test("static: bulkReactivateMutation toast mentions already-active courses when skipped > 0", { skip: false }, async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { resolve, dirname } = await import("node:path");
  const __dir = dirname(fileURLToPath(import.meta.url));
  const src: string = readFileSync(
    resolve(__dir, "../client/src/pages/admin-academy.tsx"),
    "utf8"
  );

  // 1. The endpoint call must use PATCH (not POST) and the correct path.
  assert.ok(
    src.includes('"PATCH", "/api/admin/lms/courses/bulk-reactivate"'),
    'Client must call PATCH /api/admin/lms/courses/bulk-reactivate'
  );

  // 2. The response field used is "reactivated" (not "activated").
  assert.ok(
    src.includes("data.reactivated"),
    'Client toast must read data.reactivated from the response'
  );

  // 3. The toast must surface a note when some courses were already active.
  assert.ok(
    src.includes("sudah aktif sebelumnya") &&
    src.includes("data.reactivated"),
    'Client toast must show "sudah aktif sebelumnya" note when reactivated < selected'
  );

  // 4. The UI toolbar must have a button wired to bulkReactivateMutation.
  assert.ok(
    src.includes('data-testid="button-bulk-reactivate"'),
    'Toolbar must render a button with data-testid="button-bulk-reactivate"'
  );

  // 5. That button's onClick must invoke bulkReactivateMutation.mutate.
  assert.ok(
    src.includes("bulkReactivateMutation.mutate(Array.from(selectedCourseIds))"),
    'The bulk-reactivate button must call bulkReactivateMutation.mutate with the selected ids'
  );
});
