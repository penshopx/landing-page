/**
 * Tes migrasi unique index (course_id, slug) untuk lms_lessons.
 *
 * Menjalankan ensureLessonUniqueIndex terhadap TABEL SCRATCH (bukan tabel
 * produksi) yang sengaja diisi duplikat + progress siswa + enrollment, lalu
 * memastikan:
 *  1. Duplikat dibersihkan — baris "paling baru yang aktif" dipertahankan.
 *  2. Progress siswa yang menempel di baris duplikat DIPINDAH ke survivor
 *     (tidak hilang), dan tidak double-count bila siswa punya keduanya.
 *  3. lms_enrollments.progress dihitung ulang; completed_at hanya maju.
 *  4. Unique index tercipta dan MENOLAK insert duplikat berikutnya.
 *  5. Pemanggilan ulang idempotent (skip, tidak error).
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { ensureLessonUniqueIndex } from "../server/lms-lesson-schema";

const LESSONS = "lms_lessons_uidx_test_scratch";
const PROGRESS = "lms_progress_uidx_test_scratch";
const ENROLL = "lms_enroll_uidx_test_scratch";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function dropAll() {
  await pool.query(`DROP TABLE IF EXISTS ${PROGRESS}`);
  await pool.query(`DROP TABLE IF EXISTS ${ENROLL}`);
  await pool.query(`DROP TABLE IF EXISTS ${LESSONS}`);
}

before(async () => {
  await dropAll();
  await pool.query(`
    CREATE TABLE ${LESSONS} (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL,
      slug TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE
    )`);
  await pool.query(`
    CREATE TABLE ${PROGRESS} (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      course_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL REFERENCES ${LESSONS}(id) ON DELETE CASCADE,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  await pool.query(`
    CREATE TABLE ${ENROLL} (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      course_id INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      completed_at TIMESTAMPTZ
    )`);
  // Course 1: slug 'a' duplikat 3x (id1 aktif, id2 aktif TERBARU = survivor,
  //           id3 non-aktif), slug 'b' tunggal (id4). Course 2: id5 (bukan dup).
  await pool.query(`
    INSERT INTO ${LESSONS} (course_id, slug, is_active) VALUES
      (1, 'a', true), (1, 'a', true), (1, 'a', false),
      (1, 'b', true),
      (2, 'a', true)`);
  // u1: menyelesaikan 'a' HANYA lewat baris duplikat lama (id1) + 'b' (id4)
  //     → setelah migrasi harus tetap 2/2 = 100%.
  // u2: punya progress di id1 DAN id2 (dua salinan 'a') → harus jadi satu, 50%.
  //     Baris survivor (id2) sengaja diberi timestamp LEBIH BARU dari baris
  //     loser — preferensi survivor tetap harus menang atas timestamp.
  // u3: progress di DUA loser (id1 & id3), TIDAK di survivor → harus jadi
  //     tepat satu baris di survivor (id2), bukan dua (kasus snapshot bug).
  //     Timestamp sengaja NON-MONOTONIC vs id: baris ber-id LEBIH BESAR (id3)
  //     punya completed_at LEBIH AWAL dan itulah yang harus dipertahankan.
  await pool.query(`
    INSERT INTO ${PROGRESS} (user_id, course_id, lesson_id, completed_at) VALUES
      ('u1', 1, 1, '2026-01-05T00:00:00Z'), ('u1', 1, 4, '2026-01-06T00:00:00Z'),
      ('u2', 1, 1, '2026-01-01T00:00:00Z'), ('u2', 1, 2, '2026-01-09T00:00:00Z'),
      ('u3', 1, 1, '2026-01-08T00:00:00Z'), ('u3', 1, 3, '2026-01-02T00:00:00Z')`);
  await pool.query(`
    INSERT INTO ${ENROLL} (user_id, course_id, progress) VALUES
      ('u1', 1, 67), ('u2', 1, 67), ('u3', 1, 67)`);
});

after(async () => {
  await dropAll();
  await pool.end();
});

test("dedupes lessons keeping the most recent active row, preserving student progress", async () => {
  const r = await ensureLessonUniqueIndex(pool, LESSONS, PROGRESS, ENROLL);
  assert.equal(r.created, true);
  assert.equal(r.deduped, 2); // id1 & id3 dihapus, id2 survivor
  assert.equal(r.progressRepointed, 2); // u1: id1 → id2; u3: id1 → id2
  assert.equal(r.progressDropped, 2); // u2: id1 dibuang (sudah punya id2); u3: id3 dibuang
  assert.equal(r.enrollmentsRecalced, 3);

  const lessons = await pool.query(`SELECT id FROM ${LESSONS} ORDER BY id`);
  assert.deepEqual(lessons.rows.map((x) => x.id), [2, 4, 5]);

  // Tidak ada progress yang hilang atau menunjuk lesson mati.
  const prog = await pool.query(
    `SELECT user_id, lesson_id, completed_at FROM ${PROGRESS} ORDER BY user_id, lesson_id`,
  );
  assert.deepEqual(
    prog.rows.map((x) => ({ user_id: x.user_id, lesson_id: x.lesson_id })),
    [
      { user_id: "u1", lesson_id: 2 },
      { user_id: "u1", lesson_id: 4 },
      { user_id: "u2", lesson_id: 2 },
      { user_id: "u3", lesson_id: 2 },
    ],
  );
  // u2: preferensi survivor menang meski timestamp-nya lebih baru.
  const u2Row = prog.rows.find((x) => x.user_id === "u2")!;
  assert.equal(new Date(u2Row.completed_at).toISOString(), "2026-01-09T00:00:00.000Z");
  // u3: dari dua loser, yang dipertahankan adalah completion PALING AWAL
  // (id lebih besar tapi timestamp lebih awal — non-monotonic vs id).
  const u3Row = prog.rows.find((x) => x.user_id === "u3")!;
  assert.equal(new Date(u3Row.completed_at).toISOString(), "2026-01-02T00:00:00.000Z");

  // Kompatibel dgn endpoint runtime yang menghitung BARIS (bukan DISTINCT):
  // tidak boleh ada user dengan >1 baris untuk lesson yang sama.
  const dup = await pool.query(
    `SELECT user_id, lesson_id, COUNT(*) c FROM ${PROGRESS}
      GROUP BY user_id, lesson_id HAVING COUNT(*) > 1`,
  );
  assert.equal(dup.rows.length, 0);
});

test("enrollment progress is recalculated; completed_at only moves forward", async () => {
  const rows = await pool.query(
    `SELECT user_id, progress, completed_at FROM ${ENROLL} ORDER BY user_id`,
  );
  const [u1, u2, u3] = rows.rows;
  assert.equal(u1.progress, 100); // 2/2 lesson aktif selesai
  assert.ok(u1.completed_at !== null); // 100% & sebelumnya NULL → diisi
  assert.equal(u2.progress, 50); // 1/2 lesson aktif
  assert.equal(u2.completed_at, null);
  assert.equal(u3.progress, 50); // dua loser → satu survivor = 1/2, bukan 2/2
  assert.equal(u3.completed_at, null);
});

test("index rejects a subsequent duplicate insert", async () => {
  await assert.rejects(
    pool.query(`INSERT INTO ${LESSONS} (course_id, slug) VALUES (1, 'a')`),
    (e: any) => e.code === "23505",
  );
  // Slug sama di course berbeda tetap boleh.
  await pool.query(`INSERT INTO ${LESSONS} (course_id, slug) VALUES (3, 'a')`);
});

test("re-run is idempotent and skips", async () => {
  const r = await ensureLessonUniqueIndex(pool, LESSONS, PROGRESS, ENROLL);
  assert.equal(r.created, false);
  assert.equal(r.deduped, 0);
});
