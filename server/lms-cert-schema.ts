import type { Pool } from "pg";

/**
 * Menjamin unique index komposit (user_id, course_id) ADA pada tabel sertifikat.
 *
 * Latar: klausa `ON CONFLICT (user_id, course_id)` di INSERT sertifikat
 * (routes-lms.ts & backfill startup) melempar error Postgres
 * "there is no unique or exclusion constraint matching the ON CONFLICT
 * specification" → 500 — bila index/constraint uniknya tidak ada.
 * `CREATE TABLE IF NOT EXISTS` di startup TIDAK memperbaiki tabel lama yang
 * dibuat sebelum constraint ditambahkan (mis. via drizzle push skema lama).
 *
 * Idempotent & aman dipanggil setiap boot:
 * 1. Skip bila sudah ada unique index/constraint pada tepat (user_id, course_id).
 * 2. Dedupe baris ganda (pertahankan id terkecil = sertifikat pertama terbit).
 * 3. CREATE UNIQUE INDEX IF NOT EXISTS.
 *
 * `tableName` bisa dioverride untuk pengujian terhadap tabel scratch.
 */
export async function ensureCertificateUniqueIndex(
  pool: Pool,
  tableName = "lms_certificates",
): Promise<{ created: boolean; deduped: number }> {
  if (!/^[a-z_][a-z0-9_]*$/.test(tableName)) {
    throw new Error(`Nama tabel tidak valid: ${tableName}`);
  }

  // 1. Sudah ada unique index/constraint pada tepat (user_id, course_id)?
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
        ) = ARRAY['user_id','course_id']::name[]
      LIMIT 1`,
    [tableName],
  );
  if (existing.rows.length > 0) {
    return { created: false, deduped: 0 };
  }

  // 2. Dedupe: pertahankan baris dengan id terkecil per (user_id, course_id).
  const deduped = await pool.query(
    `DELETE FROM ${tableName} a
      USING ${tableName} b
      WHERE a.user_id = b.user_id
        AND a.course_id = b.course_id
        AND a.id > b.id`,
  );

  // 3. Buat unique index (nama sinkron dgn shared/schema.ts).
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS ${tableName}_user_course_uidx
       ON ${tableName} (user_id, course_id)`,
  );

  return { created: true, deduped: deduped.rowCount ?? 0 };
}
