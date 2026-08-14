/**
 * Kontrak respons manual order digital saat email GAGAL terkirim:
 * respons JSON WAJIB menyertakan emailFailReason (dan emailFailDetail bila ada)
 * di samping emailSent:false — supaya admin tahu KENAPA email gagal, bukan
 * cuma bahwa ia gagal (admin.tsx menampilkan alasan ini di toast).
 *
 * Strategi dua lapis (hermetic — tanpa server/DB/kredensial), pola
 * tests/store-manual-order-digital-email.test.ts:
 *
 * LAPISAN 1 — Analisis statis handler POST /api/store/order/manual di routes.ts:
 *   a) hasil helper email ditangkap ke emailResult (termasuk cabang catch → exception)
 *   b) respons memuat emailSent: emailResult.sent
 *   c) respons menyebarkan emailFailReason: emailResult.reason dan
 *      emailFailDetail: emailResult.detail HANYA saat !sent
 *
 * LAPISAN 2 — Perilaku end-to-end kontrak field:
 *   Memanggil helper produksi sendDigitalProductDeliveryEmail dengan
 *   BREVO_API_KEY tidak diset (reason "not_configured"), lalu membangun body
 *   respons memakai POLA SPREAD YANG SAMA dengan handler, dan memastikan
 *   emailSent:false + emailFailReason muncul di JSON final — serta bahwa saat
 *   sent:true, field kegagalan TIDAK ikut terkirim.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesSrc = readFileSync(resolve(__dirname, "../server/routes.ts"), "utf8");

function handlerBlock(literal: string): string {
  const start = routesSrc.indexOf(literal);
  assert.ok(
    start !== -1,
    `Registrasi route tidak ditemukan: "${literal}". ` +
      "Perbarui test ini jika route dipindah — jangan hapus kontrak emailFailReason.",
  );
  const nextRoute = routesSrc.indexOf("\n  app.", start + literal.length);
  const end = nextRoute === -1 ? Math.min(routesSrc.length, start + 6000) : nextRoute;
  return routesSrc.slice(start, end);
}

const BLOCK = handlerBlock('app.post("/api/store/order/manual"');

// ══════════════════════════════════════════════════════════════════════════════
// LAPISAN 1 — Analisis statis
// ══════════════════════════════════════════════════════════════════════════════

test("routes.ts — hasil email ditangkap ke emailResult, termasuk saat helper THROW", () => {
  assert.match(
    BLOCK,
    /emailResult\s*=\s*await\s+sendDigitalProductDeliveryEmail/,
    "Handler harus menyimpan hasil sendDigitalProductDeliveryEmail ke emailResult.",
  );
  assert.match(
    BLOCK,
    /catch[\s\S]{0,120}emailResult\s*=\s*\{\s*sent:\s*false,\s*reason:/,
    "Cabang catch harus mengisi emailResult { sent:false, reason: ... } agar " +
      "throw dari helper tetap menghasilkan emailFailReason di respons.",
  );
});

test("routes.ts — respons digital memuat emailSent: emailResult.sent", () => {
  assert.match(
    BLOCK,
    /emailSent:\s*emailResult\.sent/,
    "Respons JSON harus memuat emailSent: emailResult.sent.",
  );
});

test("routes.ts — respons menyebarkan emailFailReason + emailFailDetail saat gagal", () => {
  assert.match(
    BLOCK,
    /emailResult\.sent\s*\?\s*\{\}\s*:\s*\{\s*emailFailReason:\s*emailResult\.reason,\s*emailFailDetail:\s*emailResult\.detail\s*\}/,
    "Respons harus menyebarkan { emailFailReason: emailResult.reason, emailFailDetail: emailResult.detail } " +
      "saat !emailResult.sent — admin.tsx menampilkan alasan ini di toast. " +
      "Jangan hapus field ini saat refactor.",
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// LAPISAN 2 — Kontrak field pada JSON final, dengan helper produksi asli
// ══════════════════════════════════════════════════════════════════════════════

/** Bangun body respons persis seperti pola spread di handler. */
function buildDigitalResponseBody(emailResult: {
  sent: boolean;
  reason?: string;
  detail?: string;
}) {
  return {
    success: true,
    accessUrl: "https://drive.google.com/uc?id=TEST&export=download",
    orderId: "MANUAL-TEST-1",
    agentName: "Produk Uji",
    type: "digital",
    emailSent: emailResult.sent,
    ...(emailResult.sent
      ? {}
      : { emailFailReason: emailResult.reason, emailFailDetail: emailResult.detail }),
  };
}

test(
  "BREVO_API_KEY unset → JSON respons: emailSent:false + emailFailReason:'not_configured'",
  async () => {
    const realKey = process.env.BREVO_API_KEY;
    delete process.env.BREVO_API_KEY;
    try {
      const { sendDigitalProductDeliveryEmail } = await import("../server/lib/email");
      const emailResult = await sendDigitalProductDeliveryEmail({
        to: "pembeli@test.gustafta.id",
        customerName: "Test",
        productName: "Produk Uji",
        downloadUrl: "https://drive.google.com/uc?id=TEST&export=download",
        expiryHours: 24,
      });

      // Serialisasi seperti res.json() untuk mengunci kontrak wire-level.
      const body = JSON.parse(JSON.stringify(buildDigitalResponseBody(emailResult)));

      assert.equal(body.emailSent, false, "emailSent harus false saat email gagal.");
      assert.equal(
        body.emailFailReason,
        "not_configured",
        "emailFailReason harus 'not_configured' saat BREVO_API_KEY tidak diset — " +
          "inilah alasan yang ditampilkan admin.tsx di toast.",
      );
      assert.ok(
        "emailFailReason" in body,
        "Field emailFailReason wajib ADA di JSON respons saat email gagal.",
      );
      assert.equal(body.success, true, "Order tetap sukses walau email gagal.");
      assert.equal(body.type, "digital");
    } finally {
      if (realKey !== undefined) process.env.BREVO_API_KEY = realKey;
    }
  },
);

test("saat email terkirim (sent:true), field kegagalan TIDAK ikut di JSON", () => {
  const body = JSON.parse(JSON.stringify(buildDigitalResponseBody({ sent: true })));
  assert.equal(body.emailSent, true);
  assert.ok(
    !("emailFailReason" in body) && !("emailFailDetail" in body),
    "emailFailReason/emailFailDetail tidak boleh muncul saat email sukses — " +
      "admin.tsx hanya menampilkan alasan bila ada.",
  );
});
