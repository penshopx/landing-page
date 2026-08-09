/**
 * Lightweight test runner untuk Kebijakan Agen.
 *
 * Project belum punya test framework (vitest/jest), jadi kita pakai
 * `node:test` builtin lewat tsx. Jalankan dengan:
 *
 *     npx tsx tests/run.ts
 *
 * Exit code akan non-zero kalau ada test yang gagal, sehingga aman
 * dipakai di CI / pre-merge check.
 */
import { run } from "node:test";
import { spec as SpecReporter } from "node:test/reporters";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const files = [
  resolve(__dirname, "build-final-system-prompt.test.ts"),
  resolve(__dirname, "routes-helper-usage.test.ts"),
  resolve(__dirname, "wa-cta-integrity.test.ts"),
  resolve(__dirname, "store-product-reorder-persistence.test.ts"),
  resolve(__dirname, "store-catalog-payment-link-clear.test.ts"),
  // DB integration: confirms superadmin bootstrap guard survives server restarts.
  // Skipped automatically (process.exit 0) when DATABASE_URL is absent.
  resolve(__dirname, "bootstrap-superadmin-db.test.ts"),
  // Unit: confirms normalizePhone + promoteSuperAdminIfMatch handle all phone
  // formats (leading 0, +62, bare 8x) so format mismatches never silently block
  // superadmin promotion. No DB or env required — pure logic test.
  resolve(__dirname, "superadmin-phone-promotion.test.ts"),
];

let hadFailure = false;

const stream = run({ files, concurrency: false });

stream.on("test:fail", (event) => {
  // node:test menandai suite-level events juga; abaikan event tanpa nama testfile.
  if (event && event.details && event.details.error) {
    hadFailure = true;
  }
});

// Pipe TAP/spec output ke stdout
stream.compose(new SpecReporter()).pipe(process.stdout);

stream.on("end", () => {
  if (hadFailure) {
    process.exitCode = 1;
  }
});
