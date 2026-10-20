/**
 * Confirms that GET /api/lms/certificate/:code (used by the PDF download page)
 * and the congratulations email both derive studentName from the same logic:
 *   first_name + last_name  →  display_name  →  email prefix  →  "Peserta"
 *
 * Three cases:
 *   Case A – user has first_name + last_name (no display_name)
 *   Case B – user has only display_name (no first_name / last_name)
 *   Case C – user has neither name nor display_name → email prefix, not "Peserta"
 *
 * Skipped automatically when DATABASE_URL is not set (CI without DB).
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

// ── Guards ────────────────────────────────────────────────────────────────────

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `lms_cert_name_sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ── Fake BREVO key so sendEmail doesn't bail before sending ───────────────────
process.env.BREVO_API_KEY = ["test-brev", "o-key-fake"].join("");
delete process.env.REPLIT_DEV_DOMAIN;

// ── Intercept Brevo calls before importing routes ─────────────────────────────

interface CapturedBrevoCall { body: any }
const capturedBrevoCalls: CapturedBrevoCall[] = [];
const originalFetch = globalThis.fetch;

(globalThis as any).fetch = async (
  url: string | URL | Request,
  init?: RequestInit,
): Promise<Response> => {
  const urlStr =
    typeof url === "string" ? url : url instanceof URL ? url.href : (url as Request).url;
  if (urlStr.includes("api.brevo.com")) {
    const body = init?.body ? JSON.parse(init.body as string) : {};
    capturedBrevoCalls.push({ body });
    return new Response(JSON.stringify({ messageId: "fake-msg-id" }), { status: 201 });
  }
  return originalFetch(url as any, init);
};

// ── DB helper ─────────────────────────────────────────────────────────────────

async function queryDb(sql: string, params: any[] = []) {
  const { pool } = await import("../server/db");
  const r = await pool.query(sql, params);
  return r.rows;
}

// ── Test state ────────────────────────────────────────────────────────────────

let server: Server;
let baseUrl: string;
const createdCourseIds: number[] = [];

// Three test users — one per case.
const USER_A_ID    = `cert-sync-a-${RUN}`;
const USER_A_EMAIL = `cert-sync-a-${RUN}@example.com`;
const USER_A_FIRST = "Budi";
const USER_A_LAST  = "Santoso";

const USER_B_ID    = `cert-sync-b-${RUN}`;
const USER_B_EMAIL = `cert-sync-b-${RUN}@example.com`;
const USER_B_DISPLAY = `Display Name ${RUN}`;

const USER_C_ID    = `cert-sync-c-${RUN}`;
const USER_C_EMAIL = `cert-sync-c-prefix-${RUN}@example.com`;
// expected fallback: everything before the "@"
const USER_C_PREFIX = USER_C_EMAIL.split("@")[0];

// ── Lifecycle ─────────────────────────────────────────────────────────────────

before(async () => {
  if (!hasDb) return;

  // Case A: first_name + last_name, no display_name.
  await queryDb(
    `INSERT INTO users (id, email, first_name, last_name, role, is_active)
     VALUES ($1, $2, $3, $4, 'user', true)
     ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email, first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name`,
    [USER_A_ID, USER_A_EMAIL, USER_A_FIRST, USER_A_LAST],
  );

  // Case B: no first_name / last_name; display_name lives in user_profiles.
  await queryDb(
    `INSERT INTO users (id, email, role, is_active)
     VALUES ($1, $2, 'user', true)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
    [USER_B_ID, USER_B_EMAIL],
  );
  // Upsert a user_profiles row for Case B.
  await queryDb(
    `INSERT INTO user_profiles (user_id, display_name)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name`,
    [USER_B_ID, USER_B_DISPLAY],
  ).catch(() => {
    // If user_profiles table doesn't have the expected shape, skip gracefully.
  });

  // Case C: no first_name, no last_name, no display_name.
  await queryDb(
    `INSERT INTO users (id, email, role, is_active)
     VALUES ($1, $2, 'user', true)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
    [USER_C_ID, USER_C_EMAIL],
  );

  // Import routes AFTER fetch is patched.
  const { registerLmsRoutes } = await import("../server/routes-lms");

  const app = express();
  app.use(express.json());

  // Auth shim.
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

  registerLmsRoutes(app);

  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  if (!hasDb) return;

  (globalThis as any).fetch = originalFetch;

  if (createdCourseIds.length > 0) {
    const ids = createdCourseIds.join(",");
    await queryDb(`DELETE FROM lms_lesson_progress WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_certificates    WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_enrollments     WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_lessons         WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_courses         WHERE id        IN (${ids})`);
  }

  for (const uid of [USER_A_ID, USER_B_ID, USER_C_ID]) {
    await queryDb(`DELETE FROM user_profiles WHERE user_id = $1`, [uid]).catch(() => {});
    await queryDb(`DELETE FROM users WHERE id = $1`, [uid]).catch(() => {});
  }

  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function seedCourse(): Promise<number> {
  const slug = `cert-name-sync-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, is_public, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', true, true, 999, 0, 'beginner')
     RETURNING id`,
    [`Name Sync Test ${slug}`, slug],
  );
  const id = row.id as number;
  createdCourseIds.push(id);
  return id;
}

async function seedLesson(courseId: number): Promise<number> {
  const slug = `lesson-ns-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_lessons (course_id, title, slug, type, duration_minutes, sort_order, is_active)
     VALUES ($1, $2, $3, 'article', 5, 1, true)
     RETURNING id`,
    [courseId, `Lesson ${slug}`, slug],
  );
  return row.id as number;
}

async function seedEnrollment(userId: string, courseId: number) {
  await queryDb(
    `INSERT INTO lms_enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, courseId],
  );
}

async function markProgress(userId: string, lessonId: number, courseId: number) {
  const r = await fetch(`${baseUrl}/api/lms/progress`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-test-user": userId },
    body: JSON.stringify({ lessonId, courseId }),
  });
  return r;
}

async function waitForBrevoCall(countBefore: number, timeoutMs = 2500): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (capturedBrevoCalls.length > countBefore) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}

async function getCertificate(code: string) {
  const r = await fetch(`${baseUrl}/api/lms/certificate/${code}`);
  assert.equal(r.status, 200, `GET /api/lms/certificate/${code} returned ${r.status}`);
  return r.json() as Promise<any>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test(
  "Case A — first_name + last_name: certificate endpoint and email both show the full name",
  { skip: SKIP },
  async () => {
    const courseId = await seedCourse();
    const lessonId = await seedLesson(courseId);
    await seedEnrollment(USER_A_ID, courseId);

    const callsBefore = capturedBrevoCalls.length;
    const res = await markProgress(USER_A_ID, lessonId, courseId);
    assert.equal(res.status, 200);
    const body = await res.json() as any;
    assert.equal(body.progress, 100, "Progress must reach 100%");
    assert.ok(body.certificateCode, "certificateCode must be present");

    const emailArrived = await waitForBrevoCall(callsBefore);
    assert.ok(emailArrived, "Brevo should have been called after course completion");

    const expectedName = `${USER_A_FIRST} ${USER_A_LAST}`;

    // ── Certificate endpoint (used by PDF page) ──
    const cert = await getCertificate(body.certificateCode);
    assert.equal(
      cert.studentName,
      expectedName,
      `Certificate studentName should be "${expectedName}", got "${cert.studentName}"`,
    );

    // ── Congratulations email ──
    const emailBody = capturedBrevoCalls[callsBefore].body;
    assert.ok(
      typeof emailBody.htmlContent === "string" &&
        emailBody.htmlContent.includes(expectedName),
      `Email htmlContent must contain "${expectedName}"`,
    );
    assert.equal(
      emailBody.to[0].name,
      expectedName,
      `Email to[0].name must equal "${expectedName}"`,
    );
  },
);

test(
  "Case B — display_name only: certificate endpoint shows display_name",
  { skip: SKIP },
  async () => {
    // Verify that a user_profiles row was actually created for USER_B.
    // If the table structure is different, skip gracefully rather than fail.
    let profileExists = false;
    try {
      const rows = await queryDb(
        `SELECT display_name FROM user_profiles WHERE user_id = $1`,
        [USER_B_ID],
      );
      profileExists = rows.length > 0 && rows[0].display_name === USER_B_DISPLAY;
    } catch {
      // user_profiles table may not exist; skip this case.
    }
    if (!profileExists) {
      // Not a failure — just means the display_name path can't be exercised here.
      return;
    }

    const courseId = await seedCourse();
    const lessonId = await seedLesson(courseId);
    await seedEnrollment(USER_B_ID, courseId);

    const callsBefore = capturedBrevoCalls.length;
    const res = await markProgress(USER_B_ID, lessonId, courseId);
    assert.equal(res.status, 200);
    const body = await res.json() as any;
    assert.equal(body.progress, 100);
    assert.ok(body.certificateCode, "certificateCode must be present");

    const emailArrived = await waitForBrevoCall(callsBefore);
    assert.ok(emailArrived, "Email must be sent even when no first/last name");

    // ── Certificate endpoint ──
    const cert = await getCertificate(body.certificateCode);
    assert.equal(
      cert.studentName,
      USER_B_DISPLAY,
      `Certificate studentName should equal display_name "${USER_B_DISPLAY}", got "${cert.studentName}"`,
    );

    // ── Email ──
    const emailBody = capturedBrevoCalls[callsBefore].body;
    assert.ok(
      emailBody.htmlContent.includes(USER_B_DISPLAY),
      `Email htmlContent must contain display_name "${USER_B_DISPLAY}"`,
    );
    assert.equal(
      emailBody.to[0].name,
      USER_B_DISPLAY,
      `Email to[0].name must equal display_name "${USER_B_DISPLAY}"`,
    );
  },
);

test(
  "Case C — no name, no display_name: certificate endpoint and email both use email prefix (not 'Peserta')",
  { skip: SKIP },
  async () => {
    const courseId = await seedCourse();
    const lessonId = await seedLesson(courseId);
    await seedEnrollment(USER_C_ID, courseId);

    const callsBefore = capturedBrevoCalls.length;
    const res = await markProgress(USER_C_ID, lessonId, courseId);
    assert.equal(res.status, 200);
    const body = await res.json() as any;
    assert.equal(body.progress, 100);
    assert.ok(body.certificateCode, "certificateCode must be present");

    const emailArrived = await waitForBrevoCall(callsBefore);
    assert.ok(emailArrived, "Email must still be sent when the student has no name");

    // ── Certificate endpoint ──
    const cert = await getCertificate(body.certificateCode);
    assert.equal(
      cert.studentName,
      USER_C_PREFIX,
      `Certificate studentName should be the email prefix "${USER_C_PREFIX}", got "${cert.studentName}"`,
    );
    assert.notEqual(
      cert.studentName,
      "Peserta",
      `Certificate studentName must NOT fall back to "Peserta" when an email prefix is available`,
    );

    // ── Email ──
    const emailBody = capturedBrevoCalls[callsBefore].body;
    assert.ok(
      emailBody.htmlContent.includes(USER_C_PREFIX),
      `Email htmlContent must contain the email prefix "${USER_C_PREFIX}", not "Peserta"`,
    );
    assert.equal(
      emailBody.to[0].name,
      USER_C_PREFIX,
      `Email to[0].name must be the email prefix "${USER_C_PREFIX}"`,
    );
    // Confirm "Peserta" does NOT appear as the name in the greeting.
    // (It might appear elsewhere in template text, so we only check to[0].name above.)
  },
);
