import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Test statis — membaca source CertificateCard dan memverifikasi tombol salin URL
// memanggil navigator.clipboard.writeText dengan URL absolut yang benar, sehingga
// siswa tidak menempel tautan rusak ke email atau chat.

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(
  resolve(__dirname, "../client/src/pages/lms-certificates.tsx"),
  "utf8",
);

// ── 1. data-testid tombol salin tersedia ──────────────────────────────────────
test("CertificateCard memiliki data-testid button-copy-verify-{id}", () => {
  assert.match(
    src,
    /data-testid=\{`button-copy-verify-\$\{cert\.id\}`\}/,
    "Tombol salin URL harus memiliki data-testid `button-copy-verify-{cert.id}` " +
      "agar dapat diidentifikasi dalam pengujian dan otomasi.",
  );
});

// ── 2. navigator.clipboard.writeText dipanggil di onClick tombol salin ────────
test("Tombol salin memanggil navigator.clipboard.writeText di onClick", () => {
  assert.match(
    src,
    /navigator\.clipboard\.writeText/,
    "Tombol salin HARUS memanggil navigator.clipboard.writeText() " +
      "agar URL masuk ke clipboard pengguna.",
  );
});

// ── 3. URL clipboard absolut mengikuti origin aplikasi yang sedang dibuka ─────
test("navigator.clipboard.writeText menggunakan origin aplikasi, bukan domain hardcoded", () => {
  const writeTextIdx = src.indexOf("navigator.clipboard.writeText");
  assert.ok(
    writeTextIdx !== -1,
    "navigator.clipboard.writeText tidak ditemukan dalam source.",
  );

  // Ambil konteks sekitar writeText untuk inspeksi argumennya
  const context = src.slice(writeTextIdx, writeTextIdx + 200);

  assert.match(
    context,
    /\$\{window\.location\.origin\}\/lms\/verify\//,
    "Argumen writeText harus memakai origin aplikasi dan path verifikasi agar " +
      "tautan absolut tetap benar pada domain aplikasi yang sedang dibuka.",
  );
});

// ── 4. Kode sertifikat diinterpolasi (bukan path statis) ──────────────────────
test("navigator.clipboard.writeText menginterpolasi cert.certificateCode", () => {
  const writeTextIdx = src.indexOf("navigator.clipboard.writeText");
  assert.ok(
    writeTextIdx !== -1,
    "navigator.clipboard.writeText tidak ditemukan dalam source.",
  );

  const context = src.slice(writeTextIdx, writeTextIdx + 200);

  assert.match(
    context,
    /\$\{cert\.certificateCode\}/,
    "Argumen writeText HARUS mengandung interpolasi \${cert.certificateCode} " +
      "agar setiap sertifikat menghasilkan URL unik yang mengarah ke sertifikat " +
      "yang tepat, bukan URL statis yang sama untuk semua sertifikat.",
  );
});

// ── 5. Konsistensi prefix URL di seluruh argumen writeText ────────────────────
test("URL clipboard diawali origin browser, bukan path relatif", () => {
  // Pastikan tidak ada writeText yang menerima path relatif seperti /lms/verify/
  const writeTextIdx = src.indexOf("navigator.clipboard.writeText");
  assert.ok(
    writeTextIdx !== -1,
    "navigator.clipboard.writeText tidak ditemukan dalam source.",
  );

  const context = src.slice(writeTextIdx, writeTextIdx + 200);

  // Harus ada https:// sebelum domain
  assert.match(
    context,
    /writeText\s*\(\s*`\$\{window\.location\.origin\}\/lms\/verify\//,
    "Argumen writeText harus diawali origin browser; path relatif tidak dapat " +
      "dipakai ketika siswa menempel tautan di email atau aplikasi chat.",
  );
});
