/**
 * Integration tests — verify the certificate email verify link honors APP_URL:
 *  (a) built from APP_URL when set,
 *  (b) falls back to https://gustafta.my.id when APP_URL is absent,
 *  (c) trailing slashes on APP_URL are stripped (no double-slash),
 *  (d) the /lms/verify/:code path in the link resolves the certificate via
 *      the public GET /api/lms/certificate/:code endpoint.
 *
 * Strategy mirrors lms-certificate-email.test.ts: global.fetch is intercepted
 * BEFORE routes-lms is imported so all api.brevo.com calls are captured.
 * APP_URL is read at email-build time, so we mutate process.env.APP_URL
 * between course completions.
 *
 * Skipped automatically when DATABASE_URL is missing (CI without DB).
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `lms_verify_link_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_USER_ID = `test-user-${RUN}`;
const TEST_USER_EMAIL = `student-${RUN}@example.com`;

const FALLBACK_BASE = "https://gustafta.my.id";

// Fake key so sendEmail doesn't bail on "not_configured".
process.env.BREVO_API_KEY = "test-brevo-key-fake";
delete process.env.REPLIT_DEV_DOMAIN;
delete process.env.APP_URL;

interface CapturedBrevoCall { body: any }

const capturedBrevoCalls: CapturedBrevoCall[] = [];
const originalFetch = globalThis.fetch;

(globalThis as any).fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
  const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : (url as Request).url;
  if (urlStr.includes("api.brevo.com")) {
    const body = init?.body ? JSON.parse(init.body as string) : {};
    capturedBrevoCalls.push({ body });
    return new Response(JSON.stringify({ messageId: "test-message-id" }), { status: 201 });
  }
  return originalFetch(url as any, init);
};

async function queryDb(sqlText: string, params: any[] = []) {
  const { pool } = await import("../server/db");
  const r = await pool.query(sqlText, params);
  return r.rows;
}

let server: Server;
let baseUrl: string;
const createdCourseIds: number[] = [];
const savedAppUrl = process.env.APP_URL;

before(async () => {
  if (!hasDb) return;

  await queryDb(
    `INSERT INTO users (id, email, first_name, role, is_active)
     VALUES ($1, $2, $3, 'user', true)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, first_name = EXCLUDED.first_name`,
    [TEST_USER_ID, TEST_USER_EMAIL, `Student ${RUN}`]
  );

  // Import routes AFTER fetch is patched.
  const { registerLmsRoutes } = await import("../server/routes-lms");

  const app = express();
  app.use(express.json());
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
  if (savedAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = savedAppUrl;

  if (createdCourseIds.length > 0) {
    const ids = createdCourseIds.join(",");
    await queryDb(`DELETE FROM lms_lesson_progress WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_certificates    WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_enrollments     WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_lessons         WHERE course_id IN (${ids})`);
    await queryDb(`DELETE FROM lms_courses         WHERE id        IN (${ids})`);
  }
  await queryDb(`DELETE FROM users WHERE id = $1`, [TEST_USER_ID]).catch(() => {});

  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function seedCourse(title: string): Promise<number> {
  const slug = `verify-link-${RUN}-${Math.random().toString(36).slice(2, 6)}`;
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

/**
 * Seed a one-lesson course, enroll the user, complete it via HTTP, and return
 * the certificate code plus the email body Brevo received.
 */
async function completeCourseAndCaptureEmail(): Promise<{ certificateCode: string; emailBody: any }> {
  const courseId = await seedCourse(`Verify Link Course ${RUN}`);
  const lessonId = await seedLesson(courseId);
  await queryDb(
    `INSERT INTO lms_enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [TEST_USER_ID, courseId]
  );

  const callsBefore = capturedBrevoCalls.length;
  const res = await fetch(`${baseUrl}/api/lms/progress`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-test-user": TEST_USER_ID },
    body: JSON.stringify({ lessonId, courseId }),
  });
  assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
  const body = (await res.json()) as any;
  assert.equal(body.progress, 100, "Progress should be 100 after final lesson");
  assert.ok(body.certificateCode, "Response should contain certificateCode");

  // Wait for the fire-and-forget email dispatch.
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline && capturedBrevoCalls.length <= callsBefore) {
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.ok(capturedBrevoCalls.length > callsBefore, "Brevo fetch should have been called");

  return { certificateCode: body.certificateCode as string, emailBody: capturedBrevoCalls[callsBefore].body };
}

/** Extract the verify URL from the email HTML (the /lms/verify/ anchor href). */
function extractVerifyUrl(html: string): string {
  const m = html.match(/href="([^"]*\/lms\/verify\/[^"]*)"/);
  assert.ok(m, "Email HTML must contain an /lms/verify/ link");
  return m![1];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test(
  "verify link is built from APP_URL when set, and the code resolves via the verify endpoint",
  { skip: SKIP },
  async () => {
    process.env.APP_URL = "https://custom.example.com";
    try {
      const { certificateCode, emailBody } = await completeCourseAndCaptureEmail();

      const verifyUrl = extractVerifyUrl(emailBody.htmlContent as string);
      assert.equal(
        verifyUrl,
        `https://custom.example.com/lms/verify/${certificateCode}`,
        "verifyUrl must be built from APP_URL"
      );
      // Plaintext version must match too.
      assert.ok(
        (emailBody.textContent as string).includes(verifyUrl),
        "Plaintext email must contain the same verify URL"
      );

      // The path in the link must resolve the certificate on the API.
      const path = new URL(verifyUrl).pathname; // /lms/verify/:code
      const code = path.split("/").pop()!;
      assert.equal(code, certificateCode, "Link path must end with the certificate code");
      const apiRes = await fetch(`${baseUrl}/api/lms/certificate/${code}`);
      assert.equal(apiRes.status, 200, "Public verify endpoint must resolve the code from the link");
      const cert = (await apiRes.json()) as any;
      assert.equal(cert.certificateCode, certificateCode);
      assert.ok(cert.course?.title, "Verify response must include the course");
      assert.ok(cert.studentName, "Verify response must include the student name");
    } finally {
      delete process.env.APP_URL;
    }
  }
);

test(
  "verify link falls back to https://gustafta.my.id when APP_URL is absent",
  { skip: SKIP },
  async () => {
    delete process.env.APP_URL;
    const { certificateCode, emailBody } = await completeCourseAndCaptureEmail();
    const verifyUrl = extractVerifyUrl(emailBody.htmlContent as string);
    assert.equal(
      verifyUrl,
      `${FALLBACK_BASE}/lms/verify/${certificateCode}`,
      "verifyUrl must fall back to the hardcoded production domain"
    );
  }
);

test(
  "trailing slash on APP_URL is stripped — no double-slash in the verify link",
  { skip: SKIP },
  async () => {
    process.env.APP_URL = "https://custom.example.com/";
    try {
      const { certificateCode, emailBody } = await completeCourseAndCaptureEmail();
      const verifyUrl = extractVerifyUrl(emailBody.htmlContent as string);
      assert.equal(
        verifyUrl,
        `https://custom.example.com/lms/verify/${certificateCode}`,
        "Trailing slash on APP_URL must be stripped"
      );
      assert.ok(
        !verifyUrl.includes("com//"),
        "verifyUrl must not contain a double slash after the domain"
      );
    } finally {
      delete process.env.APP_URL;
    }
  }
);
