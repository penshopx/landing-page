/**
 * Integrasi DB nyata — memverifikasi bahwa email sertifikat dikirim dengan
 * field yang benar ketika student menyelesaikan lesson terakhir.
 *
 * Strategi mock: global.fetch diintersep SEBELUM routes-lms di-import sehingga
 * semua panggilan ke api.brevo.com tertangkap tanpa perlu module mocking.
 *
 * Dilewati otomatis bila DATABASE_URL tidak ada (CI tanpa DB).
 */

import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

// ── Guards & env ──────────────────────────────────────────────────────────────

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `lms_cert_email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_USER_ID = `test-user-${RUN}`;
const TEST_USER_EMAIL = `student-${RUN}@example.com`;
const TEST_USER_NAME = `Student ${RUN}`;

// Null-name user: first_name and last_name are both NULL.
const NULL_USER_ID = `test-null-${RUN}`;
const NULL_USER_EMAIL = `null-name-${RUN}@example.com`;

// ── Brevo fetch intercept ─────────────────────────────────────────────────────
// Set a fake BREVO_API_KEY so sendEmail doesn't bail on "not_configured".
// Clear REPLIT_DEV_DOMAIN so the cert URL uses the production base.
process.env.BREVO_API_KEY = "test-brevo-key-fake";
delete process.env.REPLIT_DEV_DOMAIN;

interface CapturedBrevoCall {
  body: any;
  headers: Record<string, string>;
}

const capturedBrevoCalls: CapturedBrevoCall[] = [];
const originalFetch = globalThis.fetch;

// Replace fetch globally before routes-lms is imported.
(globalThis as any).fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
  const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : (url as Request).url;
  if (urlStr.includes("api.brevo.com")) {
    const body = init?.body ? JSON.parse(init.body as string) : {};
    const headers: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => { headers[k] = v; });
      } else {
        Object.assign(headers, init.headers);
      }
    }
    capturedBrevoCalls.push({ body, headers });
    // Return a successful 201 response (Brevo returns 201 on success)
    return new Response(JSON.stringify({ messageId: "test-message-id" }), { status: 201 });
  }
  // All other fetch calls pass through unchanged.
  return originalFetch(url as any, init);
};

// ── DB helper ─────────────────────────────────────────────────────────────────

async function queryDb(sql: string, params: any[] = []) {
  const { pool } = await import("../server/db");
  const r = await pool.query(sql, params);
  return r.rows;
}

// ── Express test server ───────────────────────────────────────────────────────

let server: Server;
let baseUrl: string;
let createdCourseIds: number[] = [];

before(async () => {
  if (!hasDb) return;

  // Seed a test user row so the email lookup in routes-lms finds first_name + email.
  await queryDb(
    `INSERT INTO users (id, email, first_name, role, is_active)
     VALUES ($1, $2, $3, 'user', true)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, first_name = EXCLUDED.first_name`,
    [TEST_USER_ID, TEST_USER_EMAIL, TEST_USER_NAME]
  );

  // Seed a null-name user: first_name and last_name intentionally omitted (NULL).
  await queryDb(
    `INSERT INTO users (id, email, role, is_active)
     VALUES ($1, $2, 'user', true)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
    [NULL_USER_ID, NULL_USER_EMAIL]
  );

  // Import routes AFTER fetch is patched.
  const { registerLmsRoutes } = await import("../server/routes-lms");

  const app = express();
  app.use(express.json());

  // Auth shim: x-test-user header sets req.user.
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

  // Restore original fetch.
  (globalThis as any).fetch = originalFetch;

  if (createdCourseIds.length > 0) {
    const ids = createdCourseIds.join(",");
    await queryDb(`DELETE FROM lms_lesson_progress WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_certificates    WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_enrollments     WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_lessons         WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_courses         WHERE id        IN (${ids})`);
  }

  // Clean up test users.
  await queryDb(`DELETE FROM users WHERE id = $1`, [TEST_USER_ID]).catch(() => {});
  await queryDb(`DELETE FROM users WHERE id = $1`, [NULL_USER_ID]).catch(() => {});

  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function seedCourse(title: string): Promise<number> {
  const slug = `cert-email-test-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_courses (title, slug, category, is_active, is_public, sort_order, price, level)
     VALUES ($1, $2, 'onboarding', true, true, 999, 0, 'beginner')
     RETURNING id`,
    [title, slug]
  );
  const id = row.id as number;
  createdCourseIds.push(id);
  return id;
}

async function seedLesson(courseId: number, sortOrder = 1): Promise<number> {
  const slug = `lesson-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await queryDb(
    `INSERT INTO lms_lessons (course_id, title, slug, type, duration_minutes, sort_order, is_active)
     VALUES ($1, $2, $3, 'article', 5, $4, true)
     RETURNING id`,
    [courseId, `Lesson ${slug}`, slug, sortOrder]
  );
  return row.id as number;
}

async function seedEnrollment(userId: string, courseId: number) {
  await queryDb(
    `INSERT INTO lms_enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, courseId]
  );
}

/** Mark a lesson complete via HTTP POST /api/lms/progress. */
async function markProgress(userId: string, lessonId: number, courseId: number): Promise<Response> {
  return fetch(`${baseUrl}/api/lms/progress`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-test-user": userId,
    },
    body: JSON.stringify({ lessonId, courseId }),
  });
}

/**
 * Wait up to `timeoutMs` for capturedBrevoCalls to grow beyond `currentCount`.
 * The certificate email is fire-and-forget, so we need to poll briefly.
 */
async function waitForNewBrevoCall(currentCount: number, timeoutMs = 2000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (capturedBrevoCalls.length > currentCount) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test(
  "certificate email: sent once with correct fields on final lesson completion",
  { skip: SKIP },
  async () => {
    const courseTitle = `Test Course ${RUN}`;
    const courseId = await seedCourse(courseTitle);

    // Two lessons: mark the first directly via DB, trigger the second via HTTP.
    const lesson1 = await seedLesson(courseId, 1);
    const lesson2 = await seedLesson(courseId, 2);
    await seedEnrollment(TEST_USER_ID, courseId);

    // Mark lesson 1 complete via DB so only lesson 2 remains.
    await queryDb(
      `INSERT INTO lms_lesson_progress (user_id, course_id, lesson_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [TEST_USER_ID, courseId, lesson1]
    );

    const callsBefore = capturedBrevoCalls.length;

    // Trigger the final lesson via HTTP — this should issue the cert + send email.
    const res = await markProgress(TEST_USER_ID, lesson2, courseId);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);

    const body = await res.json() as any;
    assert.equal(body.progress, 100, "Progress should be 100 after final lesson");
    assert.ok(body.certificateCode, "Response should contain certificateCode");

    // Wait for the fire-and-forget email dispatch.
    const emailArrived = await waitForNewBrevoCall(callsBefore);
    assert.ok(emailArrived, "Brevo fetch should have been called after final lesson completion");

    // Inspect the captured email payload.
    const emailCall = capturedBrevoCalls[callsBefore];
    const emailBody = emailCall.body;

    // Recipient.
    assert.ok(
      Array.isArray(emailBody.to) && emailBody.to.length === 1,
      "Email must have exactly one recipient"
    );
    assert.equal(
      emailBody.to[0].email,
      TEST_USER_EMAIL,
      "Email must be sent to the student's email address"
    );

    // Subject contains course title.
    assert.ok(
      typeof emailBody.subject === "string" && emailBody.subject.includes(courseTitle),
      `Subject "${emailBody.subject}" must include course title "${courseTitle}"`
    );

    // htmlContent contains certificate code.
    assert.ok(
      typeof emailBody.htmlContent === "string" &&
        emailBody.htmlContent.includes(body.certificateCode),
      "htmlContent must contain the certificate code"
    );

    // htmlContent contains course title.
    assert.ok(
      emailBody.htmlContent.includes(courseTitle),
      "htmlContent must include the course title"
    );

    // htmlContent contains /lms/certificates link.
    assert.ok(
      emailBody.htmlContent.includes("/lms/certificates"),
      "htmlContent must include the /lms/certificates URL"
    );

    // textContent is present and contains expected fields.
    assert.ok(
      typeof emailBody.textContent === "string" && emailBody.textContent.length > 0,
      "textContent must be a non-empty string"
    );
    assert.ok(
      emailBody.textContent.includes(body.certificateCode),
      "textContent must contain the certificate code"
    );
    assert.ok(
      emailBody.textContent.includes(courseTitle),
      "textContent must include the course title"
    );
    assert.ok(
      emailBody.textContent.includes("/lms/certificates"),
      "textContent must include the /lms/certificates URL"
    );

    // Tags must include "certificate".
    assert.ok(
      Array.isArray(emailBody.tags) && emailBody.tags.includes("certificate"),
      `Email tags must include "certificate", got ${JSON.stringify(emailBody.tags)}`
    );
  }
);

test(
  "certificate email: NOT re-sent on duplicate progress call for already-certified student",
  { skip: SKIP },
  async () => {
    const courseTitle = `No Re-Send Course ${RUN}`;
    const courseId = await seedCourse(courseTitle);

    const lesson1 = await seedLesson(courseId, 1);
    await seedEnrollment(TEST_USER_ID, courseId);

    const callsBefore = capturedBrevoCalls.length;

    // First call → completes the course, issues cert, sends email.
    const res1 = await markProgress(TEST_USER_ID, lesson1, courseId);
    assert.equal(res1.status, 200);
    const body1 = await res1.json() as any;
    assert.equal(body1.progress, 100, "First call should reach 100%");

    // Wait for the first email to arrive.
    const firstEmailSent = await waitForNewBrevoCall(callsBefore);
    assert.ok(firstEmailSent, "First completion should trigger a Brevo call");

    const callsAfterFirst = capturedBrevoCalls.length;

    // Second call with the same lesson → already certified, no new email.
    const res2 = await markProgress(TEST_USER_ID, lesson1, courseId);
    assert.equal(res2.status, 200);
    const body2 = await res2.json() as any;
    assert.equal(body2.progress, 100, "Second call should still show 100%");

    // Wait long enough for any spurious async email to arrive.
    await new Promise((r) => setTimeout(r, 500));

    assert.equal(
      capturedBrevoCalls.length,
      callsAfterFirst,
      "No additional Brevo call should occur for an already-certified student"
    );
  }
);

test(
  "certificate email: contains student name in greeting",
  { skip: SKIP },
  async () => {
    const courseTitle = `Greeting Test Course ${RUN}`;
    const courseId = await seedCourse(courseTitle);

    const lesson1 = await seedLesson(courseId, 1);
    await seedEnrollment(TEST_USER_ID, courseId);

    const callsBefore = capturedBrevoCalls.length;

    const res = await markProgress(TEST_USER_ID, lesson1, courseId);
    assert.equal(res.status, 200);

    const emailArrived = await waitForNewBrevoCall(callsBefore);
    assert.ok(emailArrived, "Email should arrive after completing the only lesson");

    const emailBody = capturedBrevoCalls[callsBefore].body;

    // The htmlContent greeting should mention the student's name.
    assert.ok(
      emailBody.htmlContent.includes(TEST_USER_NAME),
      `htmlContent must greet the student by name "${TEST_USER_NAME}"`
    );

    // toName should be set on the recipient.
    assert.equal(
      emailBody.to[0].name,
      TEST_USER_NAME,
      "to[0].name must be the student's full name"
    );
  }
);

test(
  "certificate email: logs console.error when sendEmail returns sent:false",
  { skip: SKIP },
  async () => {
    const courseTitle = `Email Fail Course ${RUN}`;
    const courseId = await seedCourse(courseTitle);

    const lesson1 = await seedLesson(courseId, 1);
    await seedEnrollment(TEST_USER_ID, courseId);

    // Temporarily override global fetch so Brevo returns a 500 error.
    const failFetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : (url as Request).url;
      if (urlStr.includes("api.brevo.com")) {
        return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
      }
      return originalFetch(url as any, init);
    };
    (globalThis as any).fetch = failFetch;

    // Capture console.error calls.
    const errorMessages: string[] = [];
    const origConsoleError = console.error;
    console.error = (...args: any[]) => {
      errorMessages.push(args.map(String).join(" "));
    };

    try {
      const res = await markProgress(TEST_USER_ID, lesson1, courseId);
      assert.equal(res.status, 200, `Expected 200, got ${res.status}`);

      const body = await res.json() as any;
      assert.equal(body.progress, 100, "Progress should be 100 after the only lesson");
      assert.ok(body.certificateCode, "Response should contain certificateCode");

      // Wait long enough for the fire-and-forget email attempt to complete.
      await new Promise((r) => setTimeout(r, 1500));

      // At least one [LMS] certificate error log must have been emitted.
      const lmsErrors = errorMessages.filter((m) => m.includes("[LMS] Certificate email failed"));
      assert.ok(
        lmsErrors.length > 0,
        `Expected a console.error with "[LMS] Certificate email failed" prefix but got: ${JSON.stringify(errorMessages)}`
      );

      // The log must mention the userId and courseId.
      assert.ok(
        lmsErrors.some((m) => m.includes(TEST_USER_ID)),
        `Error log must include userId "${TEST_USER_ID}", got: ${JSON.stringify(lmsErrors)}`
      );
      assert.ok(
        lmsErrors.some((m) => m.includes(String(courseId))),
        `Error log must include courseId "${courseId}", got: ${JSON.stringify(lmsErrors)}`
      );
    } finally {
      // Restore fetch and console.error regardless of outcome.
      console.error = origConsoleError;
      (globalThis as any).fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : (url as Request).url;
        if (urlStr.includes("api.brevo.com")) {
          const body2 = init?.body ? JSON.parse(init.body as string) : {};
          const headers: Record<string, string> = {};
          if (init?.headers) {
            if (init.headers instanceof Headers) {
              init.headers.forEach((v, k) => { headers[k] = v; });
            } else {
              Object.assign(headers, init.headers);
            }
          }
          capturedBrevoCalls.push({ body: body2, headers });
          return new Response(JSON.stringify({ messageId: "test-message-id" }), { status: 201 });
        }
        return originalFetch(url as any, init);
      };
    }
  }
);

test(
  "certificate email: fallback to 'Peserta' when student has no first_name or last_name",
  { skip: SKIP },
  async () => {
    const courseTitle = `Null Name Course ${RUN}`;
    const courseId = await seedCourse(courseTitle);

    const lesson1 = await seedLesson(courseId, 1);
    await seedEnrollment(NULL_USER_ID, courseId);

    const callsBefore = capturedBrevoCalls.length;

    // Trigger course completion for the null-name user.
    const res = await markProgress(NULL_USER_ID, lesson1, courseId);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);

    const body = await res.json() as any;
    assert.equal(body.progress, 100, "Progress should be 100 after the only lesson");
    assert.ok(body.certificateCode, "Response should contain certificateCode");

    // Wait for the fire-and-forget email.
    const emailArrived = await waitForNewBrevoCall(callsBefore);
    assert.ok(emailArrived, "Email must still be sent even when the student has no name");

    const emailBody = capturedBrevoCalls[callsBefore].body;

    // Exactly one recipient.
    assert.ok(
      Array.isArray(emailBody.to) && emailBody.to.length === 1,
      "Email must have exactly one recipient"
    );
    assert.equal(
      emailBody.to[0].email,
      NULL_USER_EMAIL,
      "Email must be sent to the null-name student's address"
    );

    // htmlContent must use the "Peserta" fallback, not an empty string.
    assert.ok(
      typeof emailBody.htmlContent === "string" &&
        emailBody.htmlContent.includes("Peserta"),
      `htmlContent must contain the fallback greeting "Peserta" when name is NULL`
    );

    // to[0].name must be a non-empty fallback (not undefined, null, or "").
    assert.ok(
      typeof emailBody.to[0].name === "string" && emailBody.to[0].name.length > 0,
      `to[0].name must be a non-empty fallback, got: ${JSON.stringify(emailBody.to[0].name)}`
    );
    assert.equal(
      emailBody.to[0].name,
      "Peserta",
      "to[0].name must equal the 'Peserta' fallback when student has no name"
    );
  }
);
