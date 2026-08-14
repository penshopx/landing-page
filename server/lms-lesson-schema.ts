import type { Pool } from "pg";

/**
 * Menjamin unique index komposit (course_id, slug) ADA pada tabel lms_lessons.
 *
 * Latar: rekonsiliasi seed di routes-lms.ts mengunci identitas lesson pada
 * slug per course. Tanpa unique index, `onConflictDoNothing` tidak punya
 * conflict target sehingga slug ganda tetap membuat baris kedua → lesson
 * dobel dan update rekonsiliasi jadi ambigu. (drizzle-kit push diblokir di
 * proyek ini, jadi index dibuat via DDL langsung yang idempotent saat boot.)
 *
 * PENTING — data siswa: lms_lesson_progress punya FK ON DELETE CASCADE ke
 * lms_lessons (dibuat oleh migrasi startup sebelumnya). Menghapus lesson
 * duplikat secara naif akan MENGHAPUS progress siswa yang menempel di baris
 * duplikat. Karena itu migrasi ini, dalam SATU transaksi:
 *   1. Skip bila unique index tepat (course_id, slug) sudah ada.
 *   2. Tentukan SURVIVOR per grup duplikat: baris aktif menang dulu, lalu
 *      id terbesar (paling baru).
 *   3. Pindahkan (repoint) progress siswa dari baris duplikat ke survivor;
 *      bila siswa sudah punya progress di survivor, baris duplikatnya
 *      dibuang (bukan double-count).
 *   4. Hapus baris lesson duplikat (progress sudah aman di survivor).
 *   5. Hitung ulang lms_enrollments.progress untuk course yang terdampak
 *      (rumus sama dgn runtime: completed aktif / total aktif * 100);
 *      completed_at hanya diisi maju (100% & masih NULL → NOW()), tidak
 *      pernah dicabut agar sertifikat yang sudah terbit tetap konsisten.
 *   6. CREATE UNIQUE INDEX IF NOT EXISTS (nama sinkron dgn shared/schema.ts).
 *
 * Nama-nama tabel bisa dioverride untuk pengujian terhadap tabel scratch.
 */
export async function ensureLessonUniqueIndex(
  pool: Pool,
  lessonsTable = "lms_lessons",
  progressTable = "lms_lesson_progress",
  enrollmentsTable = "lms_enrollments",
): Promise<{
  created: boolean;
  deduped: number;
  progressRepointed: number;
  progressDropped: number;
  enrollmentsRecalced: number;
}> {
  for (const t of [lessonsTable, progressTable, enrollmentsTable]) {
    if (!/^[a-z_][a-z0-9_]*$/.test(t)) {
      throw new Error(`Nama tabel tidak valid: ${t}`);
    }
  }

  // 1. Sudah ada unique index/constraint pada tepat (course_id, slug)?
  const existing = await pool.query(
    `SELECT 1
       FROM pg_index i
       JOIN pg_class t ON t.oid = i.indrelid
      WHERE t.relname = $1
        AND i.indisunique
        AND i.indpred IS NULL
        AND (
          SELECT array_agg(a.attname ORDER BY k.ord)
            FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
        ) = ARRAY['course_id','slug']::name[]
      LIMIT 1`,
    [lessonsTable],
  );
  if (existing.rows.length > 0) {
    return { created: false, deduped: 0, progressRepointed: 0, progressDropped: 0, enrollmentsRecalced: 0 };
  }

  // Peta loser → survivor per grup (course_id, slug).
  const mapCte = `
    WITH survivors AS (
      SELECT DISTINCT ON (course_id, slug) id, course_id, slug
        FROM ${lessonsTable}
       ORDER BY course_id, slug, COALESCE(is_active, false) DESC, id DESC
    ),
    dup_map AS (
      SELECT l.id AS loser_id, s.id AS survivor_id, l.course_id
        FROM ${lessonsTable} l
        JOIN survivors s ON s.course_id = l.course_id AND s.slug = l.slug
       WHERE l.id <> s.id
    )`;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Course yang terdampak dedupe — dicatat SEBELUM baris duplikat dihapus.
    const affectedRes = await client.query(`
      ${mapCte}
      SELECT DISTINCT course_id FROM dup_map`);
    const affectedCourseIds: number[] = affectedRes.rows.map((r: any) => r.course_id);

    // 2+3. Sisakan TEPAT SATU baris progress per (user, grup lesson duplikat)
    //      — dinilai lintas survivor DAN semua loser sekaligus (window rank),
    //      bukan UPDATE bersyarat NOT EXISTS yang dievaluasi pada snapshot
    //      statement (dua loser tanpa survivor akan sama-sama lolos dan jadi
    //      dobel). Prioritas yang dipertahankan: baris yang sudah di survivor,
    //      lalu completed_at PALING AWAL (id serial bukan proxy andal untuk
    //      urutan waktu — import/backfill bisa non-monotonic), tie-break id.
    //      Buang eksplisit — jangan andalkan CASCADE; tabel scratch pengujian
    //      tidak punya FK.
    const dropped = await client.query(`
      ${mapCte},
      grouped AS (
        SELECT p.id,
               ROW_NUMBER() OVER (
                 PARTITION BY p.user_id, COALESCE(m.survivor_id, p.lesson_id)
                 ORDER BY (m.loser_id IS NULL) DESC,
                          p.completed_at ASC NULLS LAST,
                          p.id ASC
               ) AS rn
          FROM ${progressTable} p
          LEFT JOIN dup_map m ON m.loser_id = p.lesson_id
         WHERE m.loser_id IS NOT NULL
            OR p.lesson_id IN (SELECT survivor_id FROM dup_map)
      )
      DELETE FROM ${progressTable}
       WHERE id IN (SELECT id FROM grouped WHERE rn > 1)`);

    // Baris loser yang tersisa (satu-satunya milik user itu) → pindah ke survivor.
    const repointed = await client.query(`
      ${mapCte}
      UPDATE ${progressTable} p
         SET lesson_id = m.survivor_id
        FROM dup_map m
       WHERE p.lesson_id = m.loser_id`);

    // 4. Hapus baris lesson duplikat.
    const deduped = await client.query(`
      ${mapCte}
      DELETE FROM ${lessonsTable} l
       USING dup_map m
       WHERE l.id = m.loser_id`);

    // 5. Hitung ulang progress enrollment untuk course terdampak.
    let enrollmentsRecalced = 0;
    if (affectedCourseIds.length > 0) {
      const recalc = await client.query(
        `UPDATE ${enrollmentsTable} e
            SET progress = sub.pct,
                completed_at = CASE
                  WHEN sub.pct >= 100 AND e.completed_at IS NULL THEN NOW()
                  ELSE e.completed_at
                END
           FROM (
             SELECT e2.id,
                    LEAST(100, COALESCE(ROUND(
                      100.0 * (
                        SELECT COUNT(DISTINCT p.lesson_id)
                          FROM ${progressTable} p
                          JOIN ${lessonsTable} l
                            ON l.id = p.lesson_id
                           AND l.course_id = e2.course_id
                           AND COALESCE(l.is_active, false) = true
                         WHERE p.user_id = e2.user_id
                      ) / NULLIF((
                        SELECT COUNT(*) FROM ${lessonsTable} l
                         WHERE l.course_id = e2.course_id
                           AND COALESCE(l.is_active, false) = true
                      ), 0)
                    ), 0))::int AS pct
               FROM ${enrollmentsTable} e2
              WHERE e2.course_id = ANY($1)
           ) sub
          WHERE e.id = sub.id`,
        [affectedCourseIds],
      );
      enrollmentsRecalced = recalc.rowCount ?? 0;
    }

    // 6. Buat unique index (nama sinkron dgn shared/schema.ts).
    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS ${lessonsTable}_course_slug_unique
         ON ${lessonsTable} (course_id, slug)`,
    );

    await client.query("COMMIT");
    return {
      created: true,
      deduped: deduped.rowCount ?? 0,
      progressRepointed: repointed.rowCount ?? 0,
      progressDropped: dropped.rowCount ?? 0,
      enrollmentsRecalced,
    };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
