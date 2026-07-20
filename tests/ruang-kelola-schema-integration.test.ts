/**
 * Integrasi DB nyata — memverifikasi ruang_kelola_audit_log dan
 * ruang_kelola_biro_requests BENAR-BENAR ADA dan menerima tulisan setelah
 * migrasi schema dari boot-time DDL ke Drizzle.
 *
 * Tes ini MEMBOOT Express nyata + route /api/ruang-kelola/* sungguhan,
 * mengirim request HTTP ke port ephemeral, dan langsung meminta DB Postgres
 * untuk memastikan baris yang diharapkan tersimpan.
 *
 * Dilewati otomatis bila DATABASE_URL tidak ada (CI tanpa DB), agar unit test
 * lain tetap jalan.
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

// --- Guards & env -------------------------------------------------------

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

// Unik per-run agar tes sejajar tidak konflik dan cleanup terbatas.
const RUN = `rk_it_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
// Simulasi userId — gunakan string pendek deterministik (bukan UUID agar mudah
// di-WHERE saat cleanup); ruang_kelola_documents.user_id bertipe TEXT.
const TEST_USER_ID = `test-user-${RUN}`;

// --- Lazy DB pool -------------------------------------------------------

let poolPromise: Promise<import("pg").Pool> | null = null;
async function getPool(): Promise<import("pg").Pool> {
  if (!poolPromise) poolPromise = import("../server/db").then((m) => m.pool);
  return poolPromise;
}

// --- Express test server ------------------------------------------------

let server: Server;
let baseUrl: string;

// IDs yang diciptakan tes ini — dibersihkan di after().
const createdDocIds: string[] = [];

before(async () => {
  if (!hasDb) return;

  const { registerRuangKelolaRoutes } = await import(
    "../server/ruang-kelola-routes"
  );

  const app = express();
  app.use(express.json());

  // Tambahkan TEST_USER_ID ke ADMIN_USER_IDS agar checkUserIsActive()
  // mengembalikan true tanpa mengakses DB (menghindari lookup users table).
  const origAdminIds = process.env.ADMIN_USER_IDS ?? "";
  process.env.ADMIN_USER_IDS = origAdminIds
    ? `${origAdminIds},${TEST_USER_ID}`
    : TEST_USER_ID;

  // Auth shim: setiap request dianggap terautentikasi sebagai TEST_USER_ID.
  // req.isAuthenticated() disuntikkan agar isAuthenticated middleware (replitAuth)
  // tidak crash — middleware itu adalah guard produksi nyata yang dipakai routes ini.
  app.use((req: any, _res: any, next: any) => {
    req.user = { id: TEST_USER_ID, claims: { sub: TEST_USER_ID } };
    req.isAuthenticated = () => true;
    next();
  });

  await registerRuangKelolaRoutes(app);

  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  if (!hasDb) return;

  // Tutup server HTTP
  await new Promise<void>((resolve, reject) =>
    server.close((e) => (e ? reject(e) : resolve()))
  );

  // Bersihkan baris milik run ini dari DB
  const pool = await getPool();
  // Urutan: FK doc_id di biro_requests & audit_log → hapus documents terakhir
  await pool.query(
    `DELETE FROM ruang_kelola_biro_requests WHERE user_id = $1`,
    [TEST_USER_ID]
  );
  await pool.query(
    `DELETE FROM ruang_kelola_audit_log WHERE user_id = $1`,
    [TEST_USER_ID]
  );
  if (createdDocIds.length) {
    await pool.query(
      `DELETE FROM ruang_kelola_documents WHERE id = ANY($1::uuid[])`,
      [createdDocIds]
    );
  }
  await pool.query(
    `DELETE FROM ruang_kelola_profiles WHERE user_id = $1`,
    [TEST_USER_ID]
  );
});

// ========================================================================
// TES 1 — POST /api/ruang-kelola/documents → baris audit_log tersimpan
// ========================================================================

test(
  "POST /api/ruang-kelola/documents → menulis baris ke ruang_kelola_audit_log",
  { skip: SKIP },
  async () => {
    const pool = await getPool();

    // Hitung audit sebelum
    const { rows: before } = await pool.query<{ n: string }>(
      `SELECT count(*) AS n FROM ruang_kelola_audit_log WHERE user_id = $1`,
      [TEST_USER_ID]
    );
    const countBefore = Number(before[0].n);

    // POST dokumen baru
    const res = await fetch(`${baseUrl}/api/ruang-kelola/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "legalitas",
        doc_type: "Akte Pendirian Perusahaan",
        doc_name: `Akte Pendirian ${RUN}`,
        doc_number: "AKT-001",
        issued_by: "Notaris Test",
        issued_date: "2024-01-15",
        expired_date: "2029-01-15",
      }),
    });

    // Baca body sekali — tidak bisa dibaca dua kali
    const rawBody = await res.text();
    assert.equal(
      res.status,
      200,
      `Diharapkan 200, dapat ${res.status}: ${rawBody}`
    );

    const body = JSON.parse(rawBody) as { id: string };
    assert.ok(body.id, "Response harus mengandung id dokumen");
    createdDocIds.push(body.id);

    // Verifikasi baris di ruang_kelola_audit_log
    const { rows: after } = await pool.query<{ n: string }>(
      `SELECT count(*) AS n FROM ruang_kelola_audit_log WHERE user_id = $1`,
      [TEST_USER_ID]
    );
    const countAfter = Number(after[0].n);

    assert.ok(
      countAfter > countBefore,
      `Harus ada setidaknya 1 baris baru di ruang_kelola_audit_log (sebelum=${countBefore}, sesudah=${countAfter})`
    );

    // Periksa konten baris yang baru dibuat
    const { rows: auditRows } = await pool.query(
      `SELECT action, doc_id, detail
       FROM ruang_kelola_audit_log
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [TEST_USER_ID]
    );
    assert.equal(auditRows[0].action, "create", "action harus 'create'");
    assert.equal(
      auditRows[0].doc_id,
      body.id,
      "doc_id di audit_log harus cocok dengan id dokumen yang baru dibuat"
    );
    assert.ok(
      auditRows[0].detail,
      "kolom detail di audit_log tidak boleh null"
    );
  }
);

// ========================================================================
// TES 2 — POST /api/ruang-kelola/biro-request → baris tersimpan di tabel biro_requests
// ========================================================================

test(
  "POST /api/ruang-kelola/biro-request → menyimpan baris ke ruang_kelola_biro_requests",
  { skip: SKIP },
  async () => {
    const pool = await getPool();

    // Hitung sebelum
    const { rows: before } = await pool.query<{ n: string }>(
      `SELECT count(*) AS n FROM ruang_kelola_biro_requests WHERE user_id = $1`,
      [TEST_USER_ID]
    );
    const countBefore = Number(before[0].n);

    // POST biro-request tanpa doc_id (jalur paling sederhana)
    const res = await fetch(`${baseUrl}/api/ruang-kelola/biro-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_type: "Pengurusan SBU (Sertifikat Badan Usaha)",
        notes: `Test otomatis run ${RUN}`,
      }),
    });

    const rawBody2 = await res.text();
    assert.equal(
      res.status,
      200,
      `Diharapkan 200, dapat ${res.status}: ${rawBody2}`
    );

    const body = JSON.parse(rawBody2) as { ok: boolean; request: { id: string; status: string } };
    assert.equal(body.ok, true, "Response harus ok: true");
    assert.ok(body.request?.id, "Response harus mengandung request.id");
    assert.equal(body.request.status, "pending", "Status awal harus 'pending'");

    // Verifikasi baris di DB
    const { rows: after } = await pool.query<{ n: string }>(
      `SELECT count(*) AS n FROM ruang_kelola_biro_requests WHERE user_id = $1`,
      [TEST_USER_ID]
    );
    const countAfter = Number(after[0].n);

    assert.ok(
      countAfter > countBefore,
      `Harus ada setidaknya 1 baris baru di ruang_kelola_biro_requests (sebelum=${countBefore}, sesudah=${countAfter})`
    );

    // Periksa baris persisnya
    const { rows: reqRows } = await pool.query(
      `SELECT id, service_type, status, notes
       FROM ruang_kelola_biro_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [TEST_USER_ID]
    );
    assert.equal(reqRows[0].id, body.request.id, "id di DB harus cocok response");
    assert.equal(
      reqRows[0].service_type,
      "Pengurusan SBU (Sertifikat Badan Usaha)",
      "service_type harus tersimpan dengan benar"
    );
    assert.equal(reqRows[0].status, "pending", "status default harus 'pending'");
  }
);

// ========================================================================
// TES 3 — POST /api/ruang-kelola/biro-request dengan doc_id valid
//          → FK tersimpan dan baris biro_requests ter-link ke dokumen
// ========================================================================

test(
  "POST /api/ruang-kelola/biro-request dengan doc_id → baris tersimpan dengan FK yang benar",
  { skip: SKIP },
  async () => {
    // Pastikan ada setidaknya 1 dokumen (dari tes sebelumnya atau buat baru)
    let docId = createdDocIds[0];
    if (!docId) {
      const docRes = await fetch(`${baseUrl}/api/ruang-kelola/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "sbu",
          doc_type: "SBU (Sertifikat Badan Usaha)",
          doc_name: `SBU Test ${RUN}`,
          expired_date: "2028-12-31",
        }),
      });
      const rawDoc = await docRes.text();
      assert.equal(docRes.status, 200, `Gagal membuat dokumen: ${docRes.status} — ${rawDoc}`);
      const docBody = JSON.parse(rawDoc) as { id: string };
      docId = docBody.id;
      createdDocIds.push(docId);
    }

    const res = await fetch(`${baseUrl}/api/ruang-kelola/biro-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doc_id: docId,
        service_type: "Perpanjangan SBU / SKK yang Kedaluwarsa",
        notes: `Terkait dokumen ${docId} — run ${RUN}`,
      }),
    });

    const rawBody3 = await res.text();
    assert.equal(
      res.status,
      200,
      `Diharapkan 200, dapat ${res.status}: ${rawBody3}`
    );

    const body = JSON.parse(rawBody3) as { ok: boolean; request: { id: string } };
    assert.equal(body.ok, true);

    const pool = await getPool();
    const { rows } = await pool.query(
      `SELECT id, doc_id, service_type
       FROM ruang_kelola_biro_requests
       WHERE id = $1`,
      [body.request.id]
    );
    assert.equal(rows.length, 1, "Baris harus ada di DB");
    assert.equal(rows[0].doc_id, docId, "FK doc_id harus tersimpan dengan benar");
  }
);
