/**
 * Task #277 — Konfirmasi pelajaran yang dihapus dari kurikulum (SEED_COURSES)
 * hilang untuk siswa: seedLmsData() menonaktifkannya secara otomatis.
 *
 * Cakupan:
 * 1. [Integrasi] Sisipkan lesson dengan slug yang TIDAK ada di SEED_COURSES pada
 *    kursus seed, jalankan seedLmsData() yang diekspor → isActive lesson itu
 *    menjadi false (siswa tidak melihatnya lagi — semua query publik memfilter
 *    isActive = true).
 * 2. [Integrasi] Lesson yang memang didefinisikan seed tetap isActive = true.
 * 3. [Integrasi] Counter `updated` bertambah (kursusnya dilaporkan diperbarui).
 *
 * Self-heal: lesson injeksi memakai prefix slug tetap; awal run menghapus sisa
 * dari run sebelumnya yang mati mendadak (after() tidak jalan saat SIGKILL).
 * Cleanup menghapus lesson injeksi, lalu reseed tidak diperlukan karena tidak
 * ada baris seed yang dimutasi.
 *
 * Tes dilewati otomatis bila DATABASE_URL tidak ada.
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const COURSE_SLUG = "mulai-gustafta";
const SEED_LESSON_SLUG = "apa-itu-gustafta";
const INJECT_PREFIX = "test-removed-lesson-";
const INJECT_SLUG = `${INJECT_PREFIX}${RUN}`;

let db: any;
let lmsCourses: any;
let lmsLessons: any;
let eq: any;
let and: any;
let like: any;
let seedLmsData: any;
let courseId: number;

before(async () => {
  if (!hasDb) return;
  const drizzle = await import("drizzle-orm");
  eq = drizzle.eq;
  and = drizzle.and;
  like = drizzle.like;
  ({ db } = await import("../server/db"));
  ({ lmsCourses, lmsLessons } = await import("@shared/schema"));
  ({ seedLmsData } = await import("../server/routes-lms"));

  // Pastikan kursus seed ada (jalankan seed jika DB masih kosong).
  let [course] = await db.select().from(lmsCourses)
    .where(eq(lmsCourses.slug, COURSE_SLUG)).limit(1);
  if (!course) {
    await seedLmsData();
    [course] = await db.select().from(lmsCourses)
      .where(eq(lmsCourses.slug, COURSE_SLUG)).limit(1);
  }
  assert.ok(course, `Kursus seed '${COURSE_SLUG}' harus ada`);
  courseId = course.id;

  // Self-heal: bersihkan lesson injeksi sisa run sebelumnya yang mati mendadak.
  await db.delete(lmsLessons)
    .where(and(eq(lmsLessons.courseId, courseId), like(lmsLessons.slug, `${INJECT_PREFIX}%`)));
});

after(async () => {
  if (!hasDb) return;
  // Cleanup: hapus lesson injeksi run ini.
  await db.delete(lmsLessons)
    .where(and(eq(lmsLessons.courseId, courseId), eq(lmsLessons.slug, INJECT_SLUG)));
});

test(
  "seedLmsData menonaktifkan lesson yang tak ada di SEED_COURSES, lesson seed tetap aktif, updated bertambah",
  { skip: SKIP },
  async () => {
    // Sinkronkan dulu agar drift lain tidak mengganggu pengukuran counter.
    await seedLmsData();

    // Injeksi: lesson aktif dengan slug yang tidak ada di SEED_COURSES —
    // mensimulasikan pelajaran yang sudah dihapus dari kurikulum.
    await db.insert(lmsLessons).values({
      courseId,
      title: `Pelajaran usang ${RUN}`,
      slug: INJECT_SLUG,
      content: "# Konten usang",
      type: "article",
      durationMinutes: 5,
      isPreview: false,
      sortOrder: 999,
      isActive: true,
    });

    const result = await seedLmsData();

    // 1) Lesson injeksi harus dinonaktifkan.
    const [injected] = await db.select().from(lmsLessons)
      .where(and(eq(lmsLessons.courseId, courseId), eq(lmsLessons.slug, INJECT_SLUG)))
      .limit(1);
    assert.ok(injected, "Lesson injeksi harus masih ada di DB (dinonaktifkan, bukan dihapus)");
    assert.equal(injected.isActive, false,
      "Lesson yang dihapus dari kurikulum harus isActive=false setelah seed");

    // 2) Lesson yang didefinisikan seed tetap aktif.
    const [seedLesson] = await db.select().from(lmsLessons)
      .where(and(eq(lmsLessons.courseId, courseId), eq(lmsLessons.slug, SEED_LESSON_SLUG)))
      .limit(1);
    assert.ok(seedLesson, `Lesson seed '${SEED_LESSON_SLUG}' harus ada`);
    assert.equal(seedLesson.isActive, true, "Lesson seed harus tetap isActive=true");

    // 3) Counter updated bertambah — kursus ini dilaporkan diperbarui.
    assert.ok(result.updated >= 1,
      `updated harus >= 1 karena ada lesson usang yang dinonaktifkan; got ${result.updated}`);
    assert.equal(result.added, 0, `added harus 0; got ${result.added}`);

    // 4) Idempoten: pass berikutnya tidak menghitung lesson yang SUDAH nonaktif.
    const second = await seedLmsData();
    assert.equal(second.updated, 0,
      `Pass kedua: updated harus 0 (lesson sudah nonaktif); got ${second.updated}`);
  }
);
