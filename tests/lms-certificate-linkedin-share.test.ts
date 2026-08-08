import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Test statis — membaca source CertificateCard dan memverifikasi href tombol LinkedIn
// sudah menggunakan format share-offsite yang benar serta mengarah ke halaman
// verifikasi yang tepat (/lms/verify/<certificateCode>), sehingga siswa tidak
// membagikan tautan yang rusak.

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(
  resolve(__dirname, "../client/src/pages/lms-certificates.tsx"),
  "utf8",
);

// ── 1. data-testid tersedia ────────────────────────────────────────────────────
test("CertificateCard memiliki data-testid link-linkedin-share-{id}", () => {
  assert.match(
    src,
    /data-testid=\{`link-linkedin-share-\$\{cert\.id\}`\}/,
    "Tombol LinkedIn harus memiliki data-testid `link-linkedin-share-{cert.id}` " +
      "agar dapat diidentifikasi dalam pengujian dan otomasi.",
  );
});

// ── 2. Format share-offsite LinkedIn ──────────────────────────────────────────
test("href tombol LinkedIn menggunakan format share-offsite LinkedIn yang benar", () => {
  assert.match(
    src,
    /linkedin\.com\/sharing\/share-offsite\/\?url=/,
    "Tombol LinkedIn HARUS menggunakan URL " +
      "https://www.linkedin.com/sharing/share-offsite/?url=... " +
      "agar posting LinkedIn terbuka dengan benar di browser.",
  );
});

// ── 3. URL yang di-encode mengarah ke halaman verifikasi ──────────────────────
test("URL yang di-encode dalam href LinkedIn mengarah ke /lms/verify/<certificateCode>", () => {
  // Ekstrak bagian href LinkedIn dari source
  const linkedinIdx = src.indexOf("linkedin.com/sharing/share-offsite");
  assert.ok(linkedinIdx !== -1, "Href LinkedIn tidak ditemukan dalam source.");

  // Ambil konteks sekitar href (200 karakter sebelumnya untuk mendapat encodeURIComponent)
  const context = src.slice(Math.max(0, linkedinIdx - 200), linkedinIdx + 200);

  assert.match(
    context,
    /encodeURIComponent\s*\(/,
    "URL yang dibagikan harus di-wrap dengan encodeURIComponent() " +
      "agar karakter khusus tidak merusak parameter query string LinkedIn.",
  );

  assert.match(
    context,
    /\/lms\/verify\/\$\{cert\.certificateCode\}/,
    "URL yang di-encode HARUS mengandung /lms/verify/${cert.certificateCode} " +
      "agar employer/penerima dapat memverifikasi sertifikat yang asli.",
  );
});

// ── 4. Domain produksi digunakan (bukan localhost / path relatif) ──────────────
test("URL verifikasi yang dibagikan ke LinkedIn menggunakan domain produksi gustafta.my.id", () => {
  const linkedinIdx = src.indexOf("linkedin.com/sharing/share-offsite");
  assert.ok(linkedinIdx !== -1, "Href LinkedIn tidak ditemukan dalam source.");

  const context = src.slice(Math.max(0, linkedinIdx - 200), linkedinIdx + 200);

  assert.match(
    context,
    /gustafta\.my\.id\/lms\/verify\//,
    "URL yang dibagikan ke LinkedIn HARUS menggunakan domain penuh " +
      "https://gustafta.my.id/lms/verify/... — bukan path relatif atau localhost — " +
      "karena LinkedIn memerlukan URL absolut yang dapat diakses publik.",
  );
});

// ── 5. Konsistensi: tombol copy dan teks PDF juga memakai URL yang sama ────────
test("Tombol salin URL dan teks PDF sertifikat menggunakan URL verifikasi yang sama", () => {
  const verifyUrlPattern = /gustafta\.my\.id\/lms\/verify\/\$\{cert\.certificateCode\}/g;
  const matches = src.match(verifyUrlPattern) ?? [];

  assert.ok(
    matches.length >= 2,
    `URL gustafta.my.id/lms/verify/\${cert.certificateCode} harus muncul minimal 2 kali ` +
      `(tombol LinkedIn + tombol salin), tetapi hanya ditemukan ${matches.length} kali. ` +
      "Pastikan semua permukaan berbagi sertifikat menggunakan URL yang konsisten.",
  );
});
