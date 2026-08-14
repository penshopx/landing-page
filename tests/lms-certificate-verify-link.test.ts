import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Test statis — mendokumentasikan & mengunci kontrak href anchor "Verifikasi"
// pada CertificateCard (data-testid: link-verify-cert-{id}).
// Kontrak saat ini: href RELATIF `/lms/verify/${cert.certificateCode}` —
// cukup untuk navigasi dalam aplikasi. Jika suatu saat diubah menjadi URL
// absolut, perubahan itu harus disengaja dan test ini diperbarui.

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(
  resolve(__dirname, "../client/src/pages/lms-certificates.tsx"),
  "utf8",
);

// ── 1. data-testid tersedia ────────────────────────────────────────────────────
test("CertificateCard memiliki data-testid link-verify-cert-{id}", () => {
  assert.match(
    src,
    /data-testid=\{`link-verify-cert-\$\{cert\.id\}`\}/,
    "Anchor Verifikasi harus memiliki data-testid `link-verify-cert-{cert.id}` " +
      "agar dapat diidentifikasi dalam pengujian dan otomasi.",
  );
});

// Helper: ambil konteks anchor Verifikasi di sekitar data-testid-nya
function verifyAnchorContext(): string {
  const idx = src.indexOf("link-verify-cert-");
  assert.ok(idx !== -1, "data-testid link-verify-cert- tidak ditemukan.");
  return src.slice(Math.max(0, idx - 400), idx + 200);
}

// ── 2. Kontrak href saat ini: path relatif /lms/verify/<certificateCode> ─────
test("href anchor Verifikasi menggunakan path relatif /lms/verify/${cert.certificateCode}", () => {
  const context = verifyAnchorContext();
  assert.match(
    context,
    /href=\{`\/lms\/verify\/\$\{cert\.certificateCode\}`\}/,
    "Kontrak saat ini: anchor Verifikasi memakai href RELATIF " +
      "`/lms/verify/${cert.certificateCode}`. Jika diubah menjadi URL absolut " +
      "(mis. dengan window.location.origin), perbarui test ini secara sengaja.",
  );
});

// ── 3. certificateCode diinterpolasi, bukan hardcoded ─────────────────────────
test("cert.certificateCode diinterpolasi ke dalam href (tidak hardcoded)", () => {
  const context = verifyAnchorContext();
  assert.match(
    context,
    /\$\{cert\.certificateCode\}/,
    "href Verifikasi HARUS menginterpolasi cert.certificateCode — " +
      "kode sertifikat tidak boleh hardcoded.",
  );
  // Pastikan tidak ada kode sertifikat literal yang di-hardcode di anchor
  assert.doesNotMatch(
    context,
    /href=\{?["'`]\/lms\/verify\/[A-Za-z0-9-]+["'`]\}?/,
    "href Verifikasi tidak boleh berisi kode sertifikat literal yang hardcoded.",
  );
});

// ── 4. Anchor dibuka di tab baru dengan rel yang aman ─────────────────────────
test("anchor Verifikasi memakai target=_blank + rel noopener noreferrer", () => {
  const context = verifyAnchorContext();
  assert.match(context, /target="_blank"/, "Anchor Verifikasi harus dibuka di tab baru.");
  assert.match(
    context,
    /rel="noopener noreferrer"/,
    "Anchor dengan target=_blank wajib rel=noopener noreferrer.",
  );
});
