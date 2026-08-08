/**
 * Integration tests — verify that GET /api/lms/certificate/:code returns the
 * correct studentName across the full fallback chain:
 *
 *   first_name+last_name  →  display_name (user_profiles)
 *   →  email prefix  →  "Peserta"
 *
 * The critical path is the "Peserta" fallback: a user who registered without
 * completing their profile (no user_profiles row, blank name fields) must still
 * produce a readable certificate verify page — not a blank name or an error.
 *
 * Skipped automatically when DATABASE_URL is not set.
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

// ── Guards ────────────────────────────────────────────────────────────────────

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `lms_verify_np_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ── DB helper ─────────────────────────────────────────────────────────────────

async function queryDb(sql: string, params: any[] = []) {
  const { pool } = await import("../server/db");
  const r = await pool.query(sql, params);
  return r.rows;
}

// ── Express test server ───────────────────────────────────────────────────────

let server: Server;
let baseUrl: string;
const createdCourseIds: number[] = [];
const createdUserIds: string[] = [];

before(async () => {
  if (!hasDb) return;

  const { registerLmsRoutes } = await import("../server/routes-lms");
  const app = express();
  app.use(express.json());

  // Auth shim (verify endpoint is public, but need the middleware present)
  app.use((req: any, _res: any, next: any) => {
    req.isAuthenticated = () => false;
    next();
  });

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
    await queryDb(`DELETE FROM lms_certificates WHERE course_id IN (${ids})`).catch(() => {});
    await queryDb(`DELETE FROM lms_courses      WHERE id        IN (${ids})`).catch(() => {});
  }
  for (const uid of createdUserIds) {
    await queryDb(`DELETE FROM user_profiles WHERE user_id = $1`, [uid]).catch(() => {});
    await queryDb(`DELETE FROM users          WHERE id      = $1`, [uid]).catch(() => {});
  }

  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Seed a minimal course and return its id. */
async function seedCourse(): Promise<number> {
  const slug = `verify-np-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, is_public, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', true, true, 999, 0, 'beginner')
     RETURNING id`,
    [`Verify No Profile ${slug}`, slug]
  );
  const id = row.id as number;
  createdCourseIds.push(id);
  return id;
}

/** Insert a certificate row for the given userId + courseId, return cert code. */
async function seedCert(userId: string, courseId: number): Promise<string> {
  const code = `GUSTAFTA-TEST-${RUN}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  await queryDb(
    `INSERT INTO lms_certificates (user_id, course_id, certificate_code)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [userId, courseId, code]
  );
  return code;
}

/** Call the public verify endpoint and return the parsed JSON (or throws). */
async function verifyCert(code: string): Promise<any> {
  const res = await fetch(`${baseUrl}/api/lms/certificate/${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test(
  'verify: studentName falls back to "Peserta" when user has no user_profiles row and blank name/email',
  { skip: SKIP },
  async () => {
    const uid = `test-np-blank-${RUN}`;
    createdUserIds.push(uid);

    // User row with completely blank name fields and NULL email — no user_profiles row.
    await queryDb(
      `INSERT INTO users (id, first_name, last_name, role, is_active)
       VALUES ($1, '', '', 'user', true)
       ON CONFLICT (id) DO UPDATE SET first_name='', last_name=''`,
      [uid]
    );

    const courseId = await seedCourse();
    const code = await seedCert(uid, courseId);

    const data = await verifyCert(code);

    assert.equal(
      data.studentName,
      "Peserta",
      `Expected "Peserta" for a user with no profile and blank fields, got "${data.studentName}"`
    );
    assert.ok(data.course?.title, "Response should include course title");
    assert.equal(data.certificateCode, code, "Response should echo back the certificate code");
  }
);

test(
  'verify: studentName falls back to "Peserta" when userId does not exist in users at all',
  { skip: SKIP },
  async () => {
    // Deliberately use a userId that has NO users row and NO user_profiles row.
    const uid = `test-np-ghost-${RUN}`;

    const courseId = await seedCourse();
    const code = await seedCert(uid, courseId);

    const data = await verifyCert(code);

    assert.equal(
      data.studentName,
      "Peserta",
      `Expected "Peserta" when userId has no users row, got "${data.studentName}"`
    );
  }
);

test(
  "verify: studentName uses email prefix when user has no name but has an email",
  { skip: SKIP },
  async () => {
    const uid = `test-np-email-${RUN}`;
    createdUserIds.push(uid);

    await queryDb(
      `INSERT INTO users (id, email, first_name, last_name, role, is_active)
       VALUES ($1, $2, '', '', 'user', true)
       ON CONFLICT (id) DO UPDATE SET email=$2, first_name='', last_name=''`,
      [uid, `john.doe.${RUN}@example.com`]
    );
    // Intentionally skip inserting a user_profiles row.

    const courseId = await seedCourse();
    const code = await seedCert(uid, courseId);

    const data = await verifyCert(code);

    assert.equal(
      data.studentName,
      `john.doe.${RUN}`,
      `Expected email prefix as fallback, got "${data.studentName}"`
    );
  }
);

test(
  "verify: studentName uses display_name from user_profiles when first_name is blank",
  { skip: SKIP },
  async () => {
    const uid = `test-np-display-${RUN}`;
    createdUserIds.push(uid);
    const displayName = `Display User ${RUN}`;

    await queryDb(
      `INSERT INTO users (id, first_name, last_name, role, is_active)
       VALUES ($1, '', '', 'user', true)
       ON CONFLICT (id) DO UPDATE SET first_name='', last_name=''`,
      [uid]
    );
    await queryDb(
      `INSERT INTO user_profiles (user_id, display_name)
       VALUES ($1, $2)`,
      [uid, displayName]
    );

    const courseId = await seedCourse();
    const code = await seedCert(uid, courseId);

    const data = await verifyCert(code);

    assert.equal(
      data.studentName,
      displayName,
      `Expected display_name "${displayName}", got "${data.studentName}"`
    );
  }
);

test(
  "verify: studentName uses first_name + last_name from users (highest priority)",
  { skip: SKIP },
  async () => {
    const uid = `test-np-fullname-${RUN}`;
    createdUserIds.push(uid);

    await queryDb(
      `INSERT INTO users (id, email, first_name, last_name, role, is_active)
       VALUES ($1, $2, 'Budi', 'Santoso', 'user', true)
       ON CONFLICT (id) DO UPDATE SET email=$2, first_name='Budi', last_name='Santoso'`,
      [uid, `budi.${RUN}@example.com`]
    );
    // No user_profiles row — first_name+last_name should still win.

    const courseId = await seedCourse();
    const code = await seedCert(uid, courseId);

    const data = await verifyCert(code);

    assert.equal(
      data.studentName,
      "Budi Santoso",
      `Expected "Budi Santoso" from users.first_name+last_name, got "${data.studentName}"`
    );
  }
);
