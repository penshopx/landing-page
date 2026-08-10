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
  // Unit: confirms sortOrder auto-fill reads the correct (updated) orderedProducts
  // after a product is deleted, including when all products are deleted (→ 10).
  // Explicitly models the old guard bug vs the fix so regressions are caught.
  resolve(__dirname, "store-sort-order-autofill-after-delete.test.ts"),
  resolve(__dirname, "store-catalog-payment-link-clear.test.ts"),
  // Integration + cache: confirms clearing a product's paymentUrl falls back to
  // the agent URL (or null) immediately after invalidation — without a redeploy.
  resolve(__dirname, "store-catalog-payment-link-fallback.test.ts"),
  // DB integration: confirms superadmin bootstrap guard survives server restarts.
  // Skipped automatically (process.exit 0) when DATABASE_URL is absent.
  resolve(__dirname, "bootstrap-superadmin-db.test.ts"),
  // Unit: confirms normalizePhone + promoteSuperAdminIfMatch handle all phone
  // formats (leading 0, +62, bare 8x) so format mismatches never silently block
  // superadmin promotion. No DB or env required — pure logic test.
  resolve(__dirname, "superadmin-phone-promotion.test.ts"),
  // Static + logic: confirms handleBuyNow/handleBuy in store pages builds
  // PAYMENT_BASE_URL/c/checkout?variant_ids=<id>&qty=1 when paymentUrl is null.
  // Catches regressions where the field is dropped from the catalog response or
  // the handler falls back to the root payment domain instead of the checkout path.
  resolve(__dirname, "store-beli-scalev-checkout.test.ts"),
  // DB integration: confirms POST /api/admin/lms/courses/bulk-activate and
  // bulk-deactivate each return `activated`/`deactivated` = only the courses
  // that actually changed state, not the full selection. Also confirms empty-ids
  // → 400 and auth gates. Skipped when DATABASE_URL is absent.
  resolve(__dirname, "lms-bulk-activate-deactivate-mixed.test.ts"),
  // Static: confirms the certificate copy-link button (button-copy-verify-{id})
  // calls navigator.clipboard.writeText with a full absolute URL
  // (https://gustafta.my.id/lms/verify/<code>) — not a relative path — so
  // students never paste a broken link into email or chat.
  resolve(__dirname, "lms-certificate-copy-link.test.ts"),
  // Static + unit: confirms POST /api/store/order/manual calls
  // sendDigitalProductDeliveryEmail with the buyer's email and resolved
  // download URL, and surfaces emailSent in the JSON response. Also unit-tests
  // the real email helper and resolveDownloadUrl directly so signature
  // regressions are caught without booting a full server.
  resolve(__dirname, "store-manual-order-digital-email.test.ts"),
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
