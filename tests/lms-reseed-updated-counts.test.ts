/**
 * Task #181 — Konfirmasi tombol Re-seed menampilkan jumlah "diperbarui" yang
 * akurat setelah judul/konten lesson berubah.
 *
 * Cakupan:
 * 1. [Integrasi] Mutasi langsung baris lesson di DB (simulasi hasil seed lama),
 *    lalu POST /api/admin/lms/reseed → respons { ok, added, updated } dengan
 *    updated > 0 dan added === 0 (kursus sudah ada, hanya diperbarui).
 * 2. [Integrasi] Setelah reseed, baris lesson di DB kembali sama persis dengan
 *    SEED_COURSES (judul & konten dipulihkan).
 * 3. [Integrasi] Pass kedua tanpa perubahan apa pun → added === 0 dan
 *    updated === 0 (idempoten; toast akan menampilkan "0 baru, 0 diperbarui").
 *
 * Catatan desain: registerLmsRoutes dipanggil TANPA override seed-fn sehingga
 * endpoint reseed menjalankan seedLmsData() asli — jalur upsert yang diuji di
 * sini. Tes memakai kursus seed "mulai-gustafta" / lesson "apa-itu-gustafta";
 * mutasi bersifat sementara karena reseed memulihkannya (idempoten & aman
 * untuk DB dev bersama).
 *
 * Tes integrasi dilewati otomatis bila DATABASE_URL tidak ada.
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

// ── Guards & env ──────────────────────────────────────────────────────────────

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `lms_reseed_counts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_ADMIN_ID = `test-admin-${RUN}`;

const COURSE_SLUG = "mulai-gustafta";
const LESSON_SLUG = "apa-itu-gustafta";

// ── Express test server ───────────────────────────────────────────────────────

let server: Server;
let baseUrl: string;
let db: any;
let lmsCourses: any;
let lmsLessons: any;
let eq: any;
let and: any;

before(async () => {
  if (!hasDb) return;

  const drizzle = await import("drizzle-orm");
  eq = drizzle.eq;
  and = drizzle.and;
  ({ db } = await import("../server/db"));
  ({ lmsCourses, lmsLessons } = await import("@shared/schema"));

  const { registerLmsRoutes } = await import("../server/routes-lms");

  const app = express();
  app.use(express.json());

  // Auth shim: x-test-user header simulates an authenticated session.
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

  // Register this test's admin via ADMIN_USER_IDS env var.
  const orig = process.env.ADMIN_USER_IDS ?? "";
  process.env.ADMIN_USER_IDS = orig ? `${orig},${TEST_ADMIN_ID}` : TEST_ADMIN_ID;

  // NO seed-fn override: the reseed endpoint must run the real seedLmsData()
  // so this test exercises the genuine upsert path.
  registerLmsRoutes(app);

  server = createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  if (!hasDb) return;
  await new Promise<void>((r, j) => server.close((e) => (e ? j(e) : r())));
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function adminHeaders() {
  return { "x-test-user": TEST_ADMIN_ID, "Content-Type": "application/json" };
}

/**
 * Poll health until seedStatus is no longer "pending" (registerLmsRoutes fires
 * the initial seed asynchronously).
 */
async function waitForSeedTerminal(timeoutMs = 30_000): Promise<any> {
  const TERMINAL = new Set(["done", "skipped", "error"]);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/api/admin/lms/health`, { headers: adminHeaders() });
      if (res.status === 200) {
        const body = (await res.json()) as any;
        if (TERMINAL.has(body.seedStatus)) return body;
      }
    } catch { /* ignore hiccups during boot */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`seedStatus still 'pending' after ${timeoutMs}ms`);
}

/** POST /api/admin/lms/reseed, retrying briefly on the 409 concurrent guard. */
async function reseed(): Promise<{ ok: boolean; added: number; updated: number }> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const res = await fetch(`${baseUrl}/api/admin/lms/reseed`, {
      method: "POST",
      headers: adminHeaders(),
    });
    if (res.status === 409) {
      await waitForSeedTerminal();
      continue;
    }
    assert.equal(res.status, 200, `Reseed must return 200; got ${res.status}`);
    return (await res.json()) as any;
  }
  throw new Error("Could not obtain a non-409 reseed response within 30s");
}

async function getSeededLesson() {
  const [course] = await db.select().from(lmsCourses)
    .where(eq(lmsCourses.slug, COURSE_SLUG)).limit(1);
  assert.ok(course, `Seed course '${COURSE_SLUG}' must exist after initial seed`);
  const [lesson] = await db.select().from(lmsLessons)
    .where(and(eq(lmsLessons.courseId, course.id), eq(lmsLessons.slug, LESSON_SLUG)))
    .limit(1);
  assert.ok(lesson, `Seed lesson '${LESSON_SLUG}' must exist in course '${COURSE_SLUG}'`);
  return lesson;
}

// ── Integration tests ─────────────────────────────────────────────────────────

test(
  "reseed: lesson yang dimutasi di DB terdeteksi → updated > 0, added === 0",
  { skip: SKIP },
  async () => {
    // Wait for the initial seed to settle, then flush any pre-existing drift so
    // our assertions measure ONLY the mutation this test makes.
    await waitForSeedTerminal();
    await reseed();

    // Capture the canonical (seeded) lesson row.
    const original = await getSeededLesson();

    // Simulate a previous seed with older content: mutate title + content
    // directly in the DB, exactly like an outdated seeded row would look.
    const mutatedTitle = `${original.title} (stale ${RUN})`;
    const mutatedContent = `# Konten lama\n\nBaris usang untuk ${RUN}.`;
    await db.update(lmsLessons)
      .set({ title: mutatedTitle, content: mutatedContent })
      .where(eq(lmsLessons.id, original.id));

    // Sanity: the mutation really landed.
    const mutated = await getSeededLesson();
    assert.equal(mutated.title, mutatedTitle, "DB mutation must have been applied");

    // Trigger the reseed — the upsert path must detect the drift.
    const result = await reseed();
    assert.equal(result.ok, true, "Reseed response must have ok: true");
    assert.ok(result.updated > 0,
      `updated must be > 0 after a lesson title/content change; got ${result.updated}`);
    assert.equal(result.added, 0,
      `added must be 0 — no new courses were introduced; got ${result.added}`);

    // The lesson row must be restored to match SEED_COURSES.
    const restored = await getSeededLesson();
    assert.equal(restored.title, original.title,
      "Lesson title must be restored to the seed value after reseed");
    assert.equal(restored.content, original.content,
      "Lesson content must be restored to the seed value after reseed");
  }
);

test(
  "reseed: pass kedua tanpa perubahan → added === 0 dan updated === 0",
  { skip: SKIP },
  async () => {
    await waitForSeedTerminal();

    // First pass flushes any drift (including from the previous test).
    await reseed();

    // Second pass with an unchanged DB must report nothing to do — the toast
    // would read "0 kursus baru, 0 kursus diperbarui".
    const second = await reseed();
    assert.equal(second.ok, true, "Second reseed must have ok: true");
    assert.equal(second.added, 0,
      `Second pass: added must be 0; got ${second.added}`);
    assert.equal(second.updated, 0,
      `Second pass: updated must be 0 (no drift); got ${second.updated}`);
  }
);
