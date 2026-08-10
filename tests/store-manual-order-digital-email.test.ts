/**
 * Verifikasi pengiriman email produk digital pada alur manual order.
 *
 * Strategi dua lapis (hermetic — tidak perlu server, DB, atau kredensial):
 *
 * LAPISAN 1 — Analisis statis routes.ts (pola tests/routes-helper-usage.test.ts):
 *   Membaca source kode produksi dan memverifikasi bahwa handler
 *   POST /api/store/order/manual:
 *     a) Mengimpor & memanggil sendDigitalProductDeliveryEmail dari lib/email
 *     b) Meneruskan to: email, downloadUrl: signedUrl, productName: sp.name
 *     c) Merespons dengan { type: "digital", emailSent: emailResult.sent }
 *     d) Mengembalikan 400 jika downloadPath kosong
 *   → Lapisan ini gagal keras bila handler direfaktor tanpa menjaga perilaku.
 *
 * LAPISAN 2 — Unit test helper email produksi dengan scoped transport stub:
 *   Memanggil langsung sendDigitalProductDeliveryEmail dan resolveDownloadUrl
 *   dari server/lib/ yang sama dipakai handler. Setiap test mengganti
 *   global.fetch HANYA untuk durasi satu panggilan async dan selalu restore
 *   di finally{} — tidak ada side effect yang merembes ke test lain.
 *   → Lapisan ini memverifikasi bahwa saat Brevo API mengembalikan 200,
 *     helper mengembalikan { sent: true } dengan recipient yang benar —
 *     yaitu kondisi yang menghasilkan emailSent: true di respons JSON handler.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesSrc = readFileSync(
  resolve(__dirname, "../server/routes.ts"),
  "utf8",
);

// ── Lokasi handler di source ──────────────────────────────────────────────────

function handlerBlock(literal: string): string {
  const start = routesSrc.indexOf(literal);
  assert.ok(
    start !== -1,
    `Registrasi route tidak ditemukan: "${literal}". ` +
      "Perbarui test ini jika route dipindah — jangan hapus guard pengiriman email.",
  );
  const nextRoute = routesSrc.indexOf("\n  app.", start + literal.length);
  const end =
    nextRoute === -1 ? Math.min(routesSrc.length, start + 4000) : nextRoute;
  return routesSrc.slice(start, end);
}

const BLOCK = handlerBlock('app.post("/api/store/order/manual"');

// ══════════════════════════════════════════════════════════════════════════════
// LAPISAN 1: Analisis statis handler produksi
// ══════════════════════════════════════════════════════════════════════════════

test(
  "routes.ts — handler mengimpor & memanggil sendDigitalProductDeliveryEmail dari lib/email",
  () => {
    assert.match(
      BLOCK,
      /sendDigitalProductDeliveryEmail.*import.*["']\.\/lib\/email["']/s,
      "Handler harus mengimpor sendDigitalProductDeliveryEmail dari './lib/email'. " +
        "Jika helper dipindah, perbarui handler sekaligus.",
    );
  },
);

test(
  "routes.ts — handler meneruskan to: email ke sendDigitalProductDeliveryEmail",
  () => {
    assert.match(
      BLOCK,
      /sendDigitalProductDeliveryEmail\s*\(\s*\{[^}]*\bto\s*:\s*email\b/s,
      "Handler harus meneruskan 'to: email' agar email dikirim ke pembeli yang benar.",
    );
  },
);

test(
  "routes.ts — handler meneruskan downloadUrl: signedUrl ke helper email",
  () => {
    assert.match(
      BLOCK,
      /sendDigitalProductDeliveryEmail\s*\(\s*\{[^}]*\bdownloadUrl\s*:\s*signedUrl\b/s,
      "Handler harus meneruskan 'downloadUrl: signedUrl' agar pembeli mendapat link unduhan.",
    );
  },
);

test(
  "routes.ts — handler meneruskan productName: sp.name ke helper email",
  () => {
    assert.match(
      BLOCK,
      /sendDigitalProductDeliveryEmail\s*\(\s*\{[^}]*\bproductName\s*:\s*sp\.name\b/s,
      "Handler harus meneruskan 'productName: sp.name'.",
    );
  },
);

test(
  "routes.ts — handler mengembalikan { type:'digital', emailSent:emailResult.sent }",
  () => {
    assert.match(
      BLOCK,
      /type\s*:\s*["']digital["']/,
      "Respons JSON harus menyertakan type: 'digital'.",
    );
    assert.match(
      BLOCK,
      /emailSent\s*:\s*emailResult\.sent/,
      "Respons JSON harus menyertakan emailSent: emailResult.sent.",
    );
  },
);

test(
  "routes.ts — handler menolak 400 bila downloadPath kosong (tidak silent skip)",
  () => {
    assert.match(
      BLOCK,
      /sp\.downloadPath.*status\s*\(\s*400\s*\)/s,
      "Handler harus mengembalikan HTTP 400 saat downloadPath kosong.",
    );
  },
);

test(
  "routes.ts — resolveDownloadUrl dipanggil sebelum sendDigitalProductDeliveryEmail",
  () => {
    const resolveIdx = BLOCK.indexOf("resolveDownloadUrl(");
    const sendIdx = BLOCK.indexOf("sendDigitalProductDeliveryEmail(");
    assert.ok(resolveIdx !== -1, "resolveDownloadUrl harus dipanggil.");
    assert.ok(sendIdx !== -1, "sendDigitalProductDeliveryEmail harus dipanggil.");
    assert.ok(
      resolveIdx < sendIdx,
      "resolveDownloadUrl harus dipanggil sebelum sendDigitalProductDeliveryEmail.",
    );
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// LAPISAN 2: Unit test helper email produksi dengan scoped transport stub
// ══════════════════════════════════════════════════════════════════════════════
//
// Setiap test mengganti global.fetch HANYA untuk durasi satu fungsi async dan
// selalu restore di finally{} — bahkan jika helper throw. Ini hermetic: tidak
// ada global state yang bocor ke test lain, tidak ada DB writes, tidak ada
// server yang harus berjalan.

/**
 * Intercept satu panggilan ke Brevo API.
 * Mengembalikan fungsi restore yang HARUS dipanggil di finally.
 */
function stubBrevo(
  brevoStatusCode: number,
  onCall: (body: any) => void,
): () => void {
  const realFetch = globalThis.fetch;
  (globalThis as any).fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    const url =
      typeof input === "string"
        ? input
        : (input as URL).href ?? (input as Request).url;
    if (String(url).includes("brevo.com")) {
      try {
        onCall(JSON.parse((init?.body as string) ?? "{}"));
      } catch { /* ignore parse errors */ }
      return new Response(
        JSON.stringify(
          brevoStatusCode === 200
            ? { messageId: "stub-ok" }
            : { message: "Unauthorized" },
        ),
        {
          status: brevoStatusCode,
          headers: { "content-type": "application/json" },
        },
      );
    }
    return realFetch(input as any, init);
  };
  return () => {
    (globalThis as any).fetch = realFetch;
  };
}

test(
  "sendDigitalProductDeliveryEmail: Brevo mengembalikan 200 → { sent: true }",
  async () => {
    const realKey = process.env.BREVO_API_KEY;
    process.env.BREVO_API_KEY = "test-brevo-key-stub";

    let captured: any = null;
    const restoreFetch = stubBrevo(200, (body) => { captured = body; });

    try {
      const { sendDigitalProductDeliveryEmail } = await import(
        "../server/lib/email"
      );
      const result = await sendDigitalProductDeliveryEmail({
        to: "pembeli@test.gustafta.id",
        customerName: "Pembeli Test",
        productName: "Template OSS Manual Test",
        downloadUrl:
          "https://drive.google.com/uc?id=TEST_MANUAL_172&export=download",
        expiryHours: 24,
      });

      assert.equal(
        result.sent,
        true,
        "Helper harus mengembalikan sent:true ketika Brevo API mengembalikan HTTP 200. " +
          "Ini adalah nilai yang mengisi emailSent di respons handler manual order.",
      );
    } finally {
      restoreFetch();
      if (realKey === undefined) delete process.env.BREVO_API_KEY;
      else process.env.BREVO_API_KEY = realKey;
    }
  },
);

test(
  "sendDigitalProductDeliveryEmail: Brevo dipanggil dengan email pembeli yang benar (to.email === buyer address)",
  async () => {
    const realKey = process.env.BREVO_API_KEY;
    process.env.BREVO_API_KEY = "test-brevo-key-stub";

    let captured: any = null;
    const restoreFetch = stubBrevo(200, (body) => { captured = body; });

    try {
      const { sendDigitalProductDeliveryEmail } = await import(
        "../server/lib/email"
      );
      await sendDigitalProductDeliveryEmail({
        to: "budi@konstruksi.id",
        customerName: "Budi Santoso",
        productName: "Template RAB Konstruksi",
        downloadUrl: "https://drive.google.com/uc?id=RAB_FILE&export=download",
        expiryHours: 24,
      });

      assert.ok(
        captured !== null,
        "Brevo API harus dipanggil — sendDigitalProductDeliveryEmail tidak pernah " +
          "memanggil fetch. Jika ini gagal, helper mungkin short-circuit sebelum mengirim.",
      );
      const recipient = (captured?.to as any[])?.[0]?.email ?? "";
      assert.equal(
        recipient,
        "budi@konstruksi.id",
        `Brevo API harus dipanggil dengan email pembeli. Dapat: "${recipient}"`,
      );
    } finally {
      restoreFetch();
      if (realKey === undefined) delete process.env.BREVO_API_KEY;
      else process.env.BREVO_API_KEY = realKey;
    }
  },
);

test(
  "sendDigitalProductDeliveryEmail: Brevo body menyertakan downloadUrl sebagai link unduhan",
  async () => {
    const realKey = process.env.BREVO_API_KEY;
    process.env.BREVO_API_KEY = "test-brevo-key-stub";

    const DOWNLOAD_URL =
      "https://drive.google.com/uc?id=VERIFY_LINK_PRESENCE&export=download";
    let captured: any = null;
    const restoreFetch = stubBrevo(200, (body) => { captured = body; });

    try {
      const { sendDigitalProductDeliveryEmail } = await import(
        "../server/lib/email"
      );
      await sendDigitalProductDeliveryEmail({
        to: "siti@test.gustafta.id",
        customerName: "Siti",
        productName: "Template SPTJM OSS",
        downloadUrl: DOWNLOAD_URL,
        expiryHours: 24,
      });

      assert.ok(captured !== null, "Brevo API harus dipanggil");
      const html: string = captured?.htmlContent ?? "";
      const text: string = captured?.textContent ?? "";
      assert.ok(
        html.includes(DOWNLOAD_URL) || text.includes(DOWNLOAD_URL),
        "Email body (HTML atau teks) harus menyertakan downloadUrl agar pembeli bisa mengunduh. " +
          `URL yang diharapkan: ${DOWNLOAD_URL}`,
      );
    } finally {
      restoreFetch();
      if (realKey === undefined) delete process.env.BREVO_API_KEY;
      else process.env.BREVO_API_KEY = realKey;
    }
  },
);

test(
  "sendDigitalProductDeliveryEmail: tanpa BREVO_API_KEY → { sent:false, reason:'not_configured' }",
  async () => {
    const realKey = process.env.BREVO_API_KEY;
    delete process.env.BREVO_API_KEY;
    try {
      const { sendDigitalProductDeliveryEmail } = await import(
        "../server/lib/email"
      );
      const result = await sendDigitalProductDeliveryEmail({
        to: "pembeli@test.gustafta.id",
        customerName: "Test",
        productName: "Test Product",
        downloadUrl: "https://drive.google.com/test",
        expiryHours: 24,
      });

      assert.equal(
        result.sent,
        false,
        "Harus mengembalikan sent:false saat BREVO_API_KEY tidak dikonfigurasi.",
      );
      assert.equal(
        (result as any).reason,
        "not_configured",
        "reason harus 'not_configured' — bukan 'api_error'.",
      );
    } finally {
      if (realKey !== undefined) process.env.BREVO_API_KEY = realKey;
    }
  },
);

test(
  "sendDigitalProductDeliveryEmail: Brevo mengembalikan error (4xx) → { sent:false, reason:'api_error' }",
  async () => {
    const realKey = process.env.BREVO_API_KEY;
    process.env.BREVO_API_KEY = "test-brevo-key-stub";

    const restoreFetch = stubBrevo(401, () => {});
    try {
      const { sendDigitalProductDeliveryEmail } = await import(
        "../server/lib/email"
      );
      const result = await sendDigitalProductDeliveryEmail({
        to: "error@test.gustafta.id",
        customerName: "Test Error",
        productName: "Test Product",
        downloadUrl: "https://drive.google.com/test",
        expiryHours: 24,
      });

      assert.equal(
        result.sent,
        false,
        "Harus mengembalikan sent:false saat Brevo API menolak request (401).",
      );
      assert.equal(
        (result as any).reason,
        "api_error",
        "reason harus 'api_error' saat Brevo mengembalikan non-OK status.",
      );
    } finally {
      restoreFetch();
      if (realKey === undefined) delete process.env.BREVO_API_KEY;
      else process.env.BREVO_API_KEY = realKey;
    }
  },
);

test(
  "resolveDownloadUrl: URL eksternal https:// dikembalikan tanpa modifikasi (tanpa Supabase)",
  async () => {
    const { resolveDownloadUrl } = await import("../server/lib/supabase-storage");
    const externalUrl =
      "https://drive.google.com/uc?id=DOCTEST_OSS_001&export=download";
    const result = await resolveDownloadUrl(externalUrl);
    assert.equal(
      result,
      externalUrl,
      "resolveDownloadUrl harus mengembalikan URL eksternal apa adanya tanpa " +
        "memanggil Supabase Storage API. Ini memungkinkan Google Drive / Dropbox " +
        "sebagai delivery channel tanpa butuh Supabase credentials.",
    );
  },
);
