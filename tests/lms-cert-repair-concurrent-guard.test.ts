/**
 * Task #271 — A second simultaneous cert-repair click is rejected with a
 * clear "already running" (409) message.
 *
 * Integrasi DB nyata:
 * 1. Seed beberapa enrollment progress=100 tanpa sertifikat agar run repair
 *    punya pekerjaan nyata (jendela overlap cukup lebar).
 * 2. Tembak DUA request POST /api/admin/lms/cert-repair bersamaan →
 *    tepat satu 200 dan satu 409 dengan pesan Indonesia.
 * 3. Setelah keduanya selesai, request KETIGA harus 200 lagi
 *    (flag certRepairInFlight direset di finally).
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

const RUN = `cert_guard_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_ADMIN_ID = `test-admin-${RUN}`;

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

  // Auth shim: x-test-user header simulates authenticated session.
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
    await queryDb(`DELETE FROM lms_certificates WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_enrollments  WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_courses      WHERE id        IN (${ids})`);
  }
  if (server) await new Promise<void>((r) => server.close(() => r()));
  const { pool } = await import("../server/db");
  await pool.end();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getHealth() {
  return fetch(`${baseUrl}/api/admin/lms/health`, {
    headers: { "x-test-user": TEST_ADMIN_ID },
  });
}

/** Wait until the background LMS seed (kicked off by registerLmsRoutes) reaches
 *  a terminal state, so closing the pool later can't race an in-flight seed. */
async function waitForSeedDone(timeoutMs = 15_000): Promise<void> {
  const TERMINAL = new Set(["done", "skipped", "error"]);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await getHealth();
    if (res.status === 200) {
      const body = (await res.json()) as any;
      if (TERMINAL.has(body.seedStatus)) return;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`seedStatus still 'pending' after ${timeoutMs}ms`);
}

function postCertRepair() {
  return fetch(`${baseUrl}/api/admin/lms/cert-repair`, {
    method: "POST",
    headers: { "x-test-user": TEST_ADMIN_ID },
  });
}

async function seedCourseWithPendingCerts(count: number) {
  const slug = `cert-guard-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, is_public, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', true, true, 999, 0, 'beginner')
     RETURNING id`,
    [`Cert Guard Course ${slug}`, slug]
  );
  const courseId = row.id as number;
  createdCourseIds.push(courseId);
  for (let i = 0; i < count; i++) {
    await queryDb(
      `INSERT INTO lms_enrollments (user_id, course_id, progress, completed_at)
       VALUES ($1, $2, 100, NOW())`,
      [`cert-guard-student-${i}-${RUN}`, courseId]
    );
  }
  return courseId;
}

// ── Core scenario ─────────────────────────────────────────────────────────────

test("cert-repair: two simultaneous requests → exactly one 200 and one 409 with Indonesian message; third request after completion → 200", { skip: SKIP }, async () => {
  // Let the background LMS seed finish first so pool shutdown can't race it.
  await waitForSeedDone();

  // Seed real pending work so the first run holds the in-flight flag while
  // the second request arrives.
  await seedCourseWithPendingCerts(5);

  // Fire two overlapping requests.
  const [resA, resB] = await Promise.all([postCertRepair(), postCertRepair()]);
  const statuses = [resA.status, resB.status].sort((a, b) => a - b);
  assert.deepEqual(
    statuses, [200, 409],
    `Expected exactly one 200 and one 409, got [${resA.status}, ${resB.status}]`
  );

  const okRes = resA.status === 200 ? resA : resB;
  const rejectedRes = resA.status === 409 ? resA : resB;

  const okBody = (await okRes.json()) as any;
  assert.equal(okBody.ok, true, "Winning request must return ok=true");

  const rejectedBody = (await rejectedRes.json()) as any;
  assert.equal(
    rejectedBody.error,
    "Perbaikan sertifikat sedang berjalan. Coba lagi sebentar.",
    `409 body must carry the Indonesian 'already running' message, got: ${JSON.stringify(rejectedBody)}`
  );

  // After both settle, the guard must be reset (finally) → third call succeeds.
  const resC = await postCertRepair();
  assert.equal(resC.status, 200, `Third request after completion must be 200, got ${resC.status}`);
  const bodyC = (await resC.json()) as any;
  assert.equal(bodyC.ok, true, "Third request must return ok=true");
});
