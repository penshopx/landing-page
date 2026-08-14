// Unit test: kegagalan pengiriman WA (Fonnte) HARUS tercatat di log dengan
// prefix yang jelas — "[WA] Delivery failed for <context>: <reason>" — sehingga
// kegagalan order/notifikasi tidak lagi hilang tanpa jejak (silent failure).
//
// Menguji server/lib/wa-delivery.ts dengan fetch & logger yang diinjeksi:
//   1. Fonnte membalas status:false + reason  → log berisi reason Fonnte
//   2. Fonnte membalas HTTP 500               → log berisi "HTTP 500"
//   3. fetch melempar (network error)         → log berisi pesan error
//   4. Token tidak dikonfigurasi              → log kegagalan konfigurasi
//   5. Pengiriman sukses                      → TIDAK ada log kegagalan
//
// Hermetis: tidak menyentuh jaringan, DB, maupun env produksi.

import { test } from "node:test";
import assert from "node:assert/strict";

import { sendWaMessage, WA_FAILURE_LOG_PREFIX } from "../server/lib/wa-delivery";

function makeFetch(response: { ok: boolean; status: number; body: any }): typeof fetch {
  return (async () => ({
    ok: response.ok,
    status: response.status,
    json: async () => response.body,
  })) as unknown as typeof fetch;
}

test("Fonnte membalas error (status:false) → kegagalan dicatat dengan prefix [WA] + reason", async () => {
  const logs: string[] = [];
  const result = await sendWaMessage({
    target: "628123456789",
    message: "Link download Anda",
    token: "test-token",
    context: "order scalev_TEST-1",
    fetchImpl: makeFetch({ ok: true, status: 200, body: { status: false, reason: "token invalid" } }),
    logError: (m) => logs.push(m),
  });

  assert.equal(result.sent, false);
  assert.equal(result.reason, "token invalid");
  assert.equal(logs.length, 1, `Harus tepat 1 log kegagalan. Logs: ${JSON.stringify(logs)}`);
  assert.ok(
    logs[0].startsWith(`${WA_FAILURE_LOG_PREFIX} for order scalev_TEST-1:`),
    `Log harus berprefix "${WA_FAILURE_LOG_PREFIX} for order scalev_TEST-1:". Got: ${logs[0]}`,
  );
  assert.ok(logs[0].includes("token invalid"), `Log harus memuat reason Fonnte. Got: ${logs[0]}`);
});

test("Fonnte membalas HTTP 500 tanpa reason → log memuat kode HTTP", async () => {
  const logs: string[] = [];
  const result = await sendWaMessage({
    target: "628123456789",
    message: "x",
    token: "test-token",
    context: "order scalev_TEST-2",
    fetchImpl: makeFetch({ ok: false, status: 500, body: {} }),
    logError: (m) => logs.push(m),
  });

  assert.equal(result.sent, false);
  assert.equal(logs.length, 1);
  assert.ok(logs[0].includes("HTTP 500"), `Log harus memuat "HTTP 500". Got: ${logs[0]}`);
  assert.ok(logs[0].startsWith(WA_FAILURE_LOG_PREFIX), `Prefix salah: ${logs[0]}`);
});

test("fetch melempar (network error) → tidak throw, kegagalan tetap dicatat", async () => {
  const logs: string[] = [];
  const throwingFetch = (async () => {
    throw new Error("ECONNREFUSED api.fonnte.com");
  }) as unknown as typeof fetch;

  const result = await sendWaMessage({
    target: "628123456789",
    message: "x",
    token: "test-token",
    context: "order scalev_TEST-3",
    fetchImpl: throwingFetch,
    logError: (m) => logs.push(m),
  });

  assert.equal(result.sent, false);
  assert.equal(logs.length, 1);
  assert.ok(logs[0].includes("ECONNREFUSED"), `Log harus memuat pesan error jaringan. Got: ${logs[0]}`);
  assert.ok(logs[0].startsWith(`${WA_FAILURE_LOG_PREFIX} for order scalev_TEST-3:`), logs[0]);
});

test("token tidak dikonfigurasi → kegagalan konfigurasi dicatat, fetch tidak dipanggil", async () => {
  // Deterministik: kosongkan env token Fonnte selama test, lalu pulihkan.
  const savedToken = process.env.FONNTE_API_TOKEN;
  const savedKey = process.env.FONNTE_API_KEY;
  delete process.env.FONNTE_API_TOKEN;
  delete process.env.FONNTE_API_KEY;
  try {
    const logs: string[] = [];
    let fetchCalled = false;
    const spyFetch = (async () => {
      fetchCalled = true;
      return { ok: true, status: 200, json: async () => ({ status: true }) };
    }) as unknown as typeof fetch;

    const result = await sendWaMessage({
      target: "628123456789",
      message: "x",
      context: "order scalev_TEST-4",
      fetchImpl: spyFetch,
      logError: (m) => logs.push(m),
    });

    assert.equal(fetchCalled, false, "fetch tidak boleh dipanggil tanpa token");
    assert.equal(result.sent, false);
    assert.equal(logs.length, 1);
    assert.ok(logs[0].startsWith(`${WA_FAILURE_LOG_PREFIX} for order scalev_TEST-4:`), logs[0]);
    assert.ok(/FONNTE/.test(logs[0]), `Log harus menyebut token Fonnte yang hilang. Got: ${logs[0]}`);
  } finally {
    if (savedToken !== undefined) process.env.FONNTE_API_TOKEN = savedToken;
    if (savedKey !== undefined) process.env.FONNTE_API_KEY = savedKey;
  }
});

test("pengiriman sukses → tidak ada log kegagalan", async () => {
  const logs: string[] = [];
  const result = await sendWaMessage({
    target: "628123456789",
    message: "Link download Anda",
    token: "test-token",
    context: "order scalev_TEST-5",
    fetchImpl: makeFetch({ ok: true, status: 200, body: { status: true } }),
    logError: (m) => logs.push(m),
  });

  assert.equal(result.sent, true);
  assert.equal(logs.length, 0, `Sukses tidak boleh menghasilkan log kegagalan: ${JSON.stringify(logs)}`);
});
