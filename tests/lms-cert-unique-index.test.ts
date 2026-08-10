/**
 * Integrasi DB nyata — memverifikasi ensureCertificateUniqueIndex():
 * repair idempotent untuk unique index (user_id, course_id) yang menopang
 * klausa ON CONFLICT di INSERT sertifikat (routes-lms.ts).
 *
 * Skenario:
 *   1. DB fresh yang tabelnya dibuat TANPA constraint unik → tanpa repair,
 *      ON CONFLICT (user_id, course_id) melempar error (akar masalah 500).
 *   2. ensureCertificateUniqueIndex() men-dedupe baris ganda lalu membuat
 *      index; setelahnya ON CONFLICT DO NOTHING bekerja (dedup aman, no 500).
 *   3. Pemanggilan kedua idempotent (skip, tidak error).
 *   4. Tabel lms_certificates asli memang punya unique index/constraint
 *      pada (user_id, course_id) — jalur ON CONFLICT produksi valid.
 *
 * Dilewati otomatis bila DATABASE_URL tidak ada (CI tanpa DB).
 */

import { test, after } from "node:test";
import assert from "node:assert/strict";

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
// Nama tabel scratch: huruf kecil + underscore saja (lolos validasi helper).
const SCRATCH = `lms_certificates_test_${RUN}`.replace(/[^a-z0-9_]/g, "_");

async function queryDb(sql: string, params: any[] = []) {
  const { pool } = await import("../server/db");
  const r = await pool.query(sql, params);
  return r;
}

after(async () => {
  if (!hasDb) return;
  await queryDb(`DROP TABLE IF EXISTS ${SCRATCH}`).catch(() => {});
});

test(
  "fresh table without unique index: ON CONFLICT throws, repair fixes it (dedupe + index), idempotent on rerun",
  { skip: SKIP },
  async () => {
    const { pool } = await import("../server/db");
    const { ensureCertificateUniqueIndex } = await import("../server/lms-cert-schema");

    // ── 1. Tabel "fresh DB rusak": TANPA unique (user_id, course_id) ─────────
    await queryDb(`
      CREATE TABLE ${SCRATCH} (
        id               SERIAL PRIMARY KEY,
        user_id          VARCHAR(255) NOT NULL,
        course_id        INTEGER NOT NULL,
        certificate_code TEXT NOT NULL,
        issued_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Baris ganda yang harus di-dedupe oleh repair (id terkecil dipertahankan).
    await queryDb(
      `INSERT INTO ${SCRATCH} (user_id, course_id, certificate_code)
       VALUES ('u1', 1, 'CODE-FIRST'), ('u1', 1, 'CODE-DUP'), ('u2', 1, 'CODE-U2')`
    );

    // Tanpa index, ON CONFLICT (user_id, course_id) HARUS error — inilah 500-nya.
    await assert.rejects(
      queryDb(
        `INSERT INTO ${SCRATCH} (user_id, course_id, certificate_code)
         VALUES ('u1', 1, 'CODE-NEW')
         ON CONFLICT (user_id, course_id) DO NOTHING`
      ),
      /no unique or exclusion constraint/i,
      "Tanpa unique index, ON CONFLICT harus melempar error constraint",
    );

    // ── 2. Repair: dedupe + create index ─────────────────────────────────────
    const r1 = await ensureCertificateUniqueIndex(pool, SCRATCH);
    assert.equal(r1.created, true, "Repair pertama harus membuat index");
    assert.equal(r1.deduped, 1, `Harus menghapus tepat 1 baris duplikat, got ${r1.deduped}`);

    // Baris pertama (id terkecil) yang dipertahankan.
    const kept = await queryDb(
      `SELECT certificate_code FROM ${SCRATCH} WHERE user_id = 'u1' AND course_id = 1`
    );
    assert.equal(kept.rows.length, 1, "Hanya satu baris u1/1 tersisa setelah dedupe");
    assert.equal(kept.rows[0].certificate_code, "CODE-FIRST", "Sertifikat pertama terbit yang dipertahankan");

    // ON CONFLICT kini bekerja: tidak error, tidak menambah baris.
    const ins = await queryDb(
      `INSERT INTO ${SCRATCH} (user_id, course_id, certificate_code)
       VALUES ('u1', 1, 'CODE-AGAIN')
       ON CONFLICT (user_id, course_id) DO NOTHING`
    );
    assert.equal(ins.rowCount, 0, "ON CONFLICT DO NOTHING harus skip duplikat tanpa error");

    // Insert kombinasi baru tetap bisa.
    const ins2 = await queryDb(
      `INSERT INTO ${SCRATCH} (user_id, course_id, certificate_code)
       VALUES ('u1', 2, 'CODE-C2')
       ON CONFLICT (user_id, course_id) DO NOTHING`
    );
    assert.equal(ins2.rowCount, 1, "Kombinasi (user, course) baru harus tetap ter-insert");

    // ── 3. Idempotent: panggilan kedua skip tanpa error ──────────────────────
    const r2 = await ensureCertificateUniqueIndex(pool, SCRATCH);
    assert.equal(r2.created, false, "Repair kedua harus mendeteksi index sudah ada (skip)");
    assert.equal(r2.deduped, 0, "Repair kedua tidak boleh menghapus apa pun");
  }
);

test(
  "real lms_certificates table has a unique index/constraint on (user_id, course_id)",
  { skip: SKIP },
  async () => {
    const { pool } = await import("../server/db");
    const { ensureCertificateUniqueIndex } = await import("../server/lms-cert-schema");

    // Jalankan repair seperti startup — harus no-op & tanpa error di DB dev.
    await ensureCertificateUniqueIndex(pool);

    const r = await queryDb(
      `SELECT 1
         FROM pg_index i
         JOIN pg_class t ON t.oid = i.indrelid
        WHERE t.relname = 'lms_certificates'
          AND i.indisunique
          AND (
            SELECT array_agg(a.attname ORDER BY k.ord)
              FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
              JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
          ) = ARRAY['user_id','course_id']::name[]`
    );
    assert.ok(
      r.rows.length >= 1,
      "lms_certificates harus punya unique index pada tepat (user_id, course_id)"
    );

    // Jalur ON CONFLICT produksi valid (pakai user/course fiktif, DO NOTHING aman
    // karena course_id 0 tidak pernah ada — baris tidak akan ter-insert? Justru
    // ter-insert; maka pakai transaksi rollback agar DB tetap bersih).
    await queryDb("BEGIN");
    try {
      await queryDb(`ALTER TABLE lms_certificates DROP CONSTRAINT IF EXISTS lms_certificates_course_id_fkey`);
      const ins = await queryDb(
        `INSERT INTO lms_certificates (user_id, course_id, certificate_code)
         VALUES ('__uidx_test__', -1, 'TEST-${RUN}-A')
         ON CONFLICT (user_id, course_id) DO NOTHING`
      );
      assert.equal(ins.rowCount, 1);
      const dup = await queryDb(
        `INSERT INTO lms_certificates (user_id, course_id, certificate_code)
         VALUES ('__uidx_test__', -1, 'TEST-${RUN}-B')
         ON CONFLICT (user_id, course_id) DO NOTHING`
      );
      assert.equal(dup.rowCount, 0, "Duplikat harus di-skip tanpa 500");
    } finally {
      await queryDb("ROLLBACK");
    }
  }
);
