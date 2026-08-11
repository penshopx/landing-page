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
  // Unit: closing "Tambah Produk" without saving resets sortOrder to "0";
  // second open recomputes fresh max+10 from the current list.
  resolve(__dirname, "store-sort-order-form-close-reset.test.ts"),
  resolve(__dirname, "store-catalog-payment-link-clear.test.ts"),
  // Integration + cache: confirms clearing a product's paymentUrl falls back to
  // the agent URL (or null) immediately after invalidation — without a redeploy.
  resolve(__dirname, "store-catalog-payment-link-fallback.test.ts"),
  // DB integration: confirms superadmin bootstrap guard survives server restarts.
  // Skipped automatically (process.exit 0) when DATABASE_URL is absent.
  resolve(__dirname, "bootstrap-superadmin-db.test.ts"),
  // Concurrency regression: spawns two child processes of the test above at
  // the same time; the global advisory run-lock must serialize them so
  // neither clobbers the other's rows/recovery record. Skipped without DB.
  resolve(__dirname, "bootstrap-superadmin-db-concurrent.test.ts"),
  // DB integration: 4 produk claw baru (desain/rencana/studi-kelayakan +
  // persiapan-proyek-multiclaw) tetap Store-visible setelah seed dijalankan
  // dua kali (fresh + rekonsiliasi) — flags sellability, wiring 3 anggota via
  // slug lookup, dan kehadiran di katalog. Skipped tanpa DATABASE_URL.
  resolve(__dirname, "claw-seed-store-visibility.test.ts"),
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
  // DB integration: confirms POST /api/admin/lms/cert-repair backfills every
  // completed enrollment without a certificate and GET /api/admin/lms/health
  // returns pendingCertificates=0 afterwards (the UI condition that hides the
  // red alert + Perbaiki button). Skipped when DATABASE_URL is absent.
  resolve(__dirname, "lms-cert-repair-clears-pending.test.ts"),
  // DB integration: confirms POST /api/admin/lms/reseed reports accurate
  // counts — a lesson row mutated directly in the DB yields updated > 0 with
  // added = 0 and gets restored to seed content; an unchanged second pass
  // yields added = 0 and updated = 0. Skipped when DATABASE_URL is absent.
  resolve(__dirname, "lms-reseed-updated-counts.test.ts"),
  // DB integration: confirms DELETE /api/admin/lms/lessons/:id?force=true
  // removes the deleted lesson's lms_lesson_progress rows and recalculates
  // enrollment progress/completed_at so a student's completion percentage
  // never stays inflated after a lesson is deleted. Also checks the 409
  // enrollment guard and 401 without auth. Skipped when DATABASE_URL is absent.
  resolve(__dirname, "lms-lesson-delete-progress.test.ts"),
  // HTTP mirror + unit + static: confirms the email-health test endpoint's
  // no-admin-email guard returns 400 with the friendly message the UI renders.
  resolve(__dirname, "admin-email-test-no-email.test.ts"),
  // Real sendEmail (no BREVO_API_KEY) → not_configured; endpoint 502 contract;
  // static checks against server/routes.ts + admin-ai-health.tsx fallback chain.
  resolve(__dirname, "admin-email-test-brevo-not-configured.test.ts"),
  // DB integration end-to-end: POST /api/webhooks/scalev (payment_status=paid,
  // produk "Gustafta Paket 1 Bulan") → baris subscriptions_new berstatus
  // 'active' dengan kolom order_id (hasil rename dari scalev_order_id) terisi
  // scalev_plan_<orderId>. Juga cek getSubscriptionByOrderId + jalur non-paid.
  // Skipped when DATABASE_URL is absent.
  resolve(__dirname, "scalev-webhook-subscription-activation.test.ts"),
  // Integration (real handlers from server/lib/prod-url.ts): POST
  // /api/admin/set-prod-url validation (https-only, no .replit.dev) and
  // GET /api/config/app-url reflecting the saved URL — never a .replit.dev
  // fallback — so delivery links can't break after an admin saves a valid URL.
  resolve(__dirname, "prod-url-validation.test.ts"),
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
