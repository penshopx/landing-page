// Tes endpoint external AI API Gaia SIAP — POST /api/v1/ai/assist (Task #306).
//
// Cakupan: fail-closed tanpa secret, Bearer auth, validasi input (termasuk
// penolakan field tak dikenal), guard ukuran body pra-parse, dan jaminan tidak
// ada kebocoran key di response. Jalur 200 (panggilan LLM nyata) TIDAK diuji di
// sini agar tes tidak tergantung provider eksternal — dicakup smoke test manual.
//
// Jalankan: npx tsx --test tests/gaia-siap-assist.test.ts

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Server } from "http";

let server: Server;
let base: string;

before(async () => {
  delete process.env.GAIA_SIAP_API_KEY;
  const { registerGaiaSiapAiRoutes } = await import("../server/gaia-siap-api");
  const app = express();
  // Cermin guard pra-parse di server/index.ts (256KB untuk /api/v1/ai/assist).
  app.use("/api/v1/ai/assist", (req, res, next) => {
    const len = Number(req.headers["content-length"] || 0);
    if (len > 256 * 1024) {
      return res.status(413).json({ error: "payload_too_large" });
    }
    next();
  });
  app.use(express.json({ limit: "50mb" }));
  registerGaiaSiapAiRoutes(app);
  // Error handler JSON rusak — versi aman (tanpa menulis body ke log).
  app.use((err: any, _req: any, res: any, next: any) => {
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ error: "bad_request" });
  });
  await new Promise<void>((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${(server.address() as any).port}/api/v1/ai/assist`;
});

after(() => server?.close());

const call = (opts: { key?: string; body?: any; raw?: string; headers?: Record<string, string> }) =>
  fetch(base, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(opts.key ? { Authorization: `Bearer ${opts.key}` } : {}),
      ...(opts.headers || {}),
    },
    body: opts.raw ?? JSON.stringify(opts.body ?? {}),
  });

test("fail-closed: tanpa GAIA_SIAP_API_KEY semua request ditolak 503", async () => {
  delete process.env.GAIA_SIAP_API_KEY;
  const r = await call({ key: "apapun", body: { prompt: "hi" } });
  assert.equal(r.status, 503);
  assert.equal((await r.json()).error, "service_not_configured");
});

test("401 bila Authorization hilang atau key salah", async () => {
  process.env.GAIA_SIAP_API_KEY = "kunci-tes";
  for (const opts of [{ body: { prompt: "hi" } }, { key: "salah", body: { prompt: "hi" } }]) {
    const r = await call(opts as any);
    assert.equal(r.status, 401);
    const j = await r.json();
    assert.equal(j.error, "unauthorized");
    assert.ok(!JSON.stringify(j).includes("kunci-tes"), "key tidak boleh bocor di response");
  }
});

test("400 untuk input tidak valid", async () => {
  process.env.GAIA_SIAP_API_KEY = "kunci-tes";
  const cases: any[] = [
    {}, // prompt hilang
    { prompt: "" }, // kosong
    { prompt: 123 }, // tipe salah
    { prompt: "x".repeat(8001) }, // kebesaran
    { prompt: "hi", case_id: 99 }, // case_id non-string
    { prompt: "hi", context: "x".repeat(24001) }, // context kebesaran
    { prompt: "hi", junk: "tidak dikenal" }, // field asing ditolak
  ];
  for (const body of cases) {
    const r = await call({ key: "kunci-tes", body });
    assert.equal(r.status, 400, JSON.stringify(body).slice(0, 60));
    assert.equal((await r.json()).error, "invalid_request");
  }
});

test("413 untuk body melebihi 256KB (pra-parse guard)", async () => {
  process.env.GAIA_SIAP_API_KEY = "kunci-tes";
  const big = JSON.stringify({ prompt: "hi", context: "x".repeat(300 * 1024) });
  const r = await call({ key: "kunci-tes", raw: big });
  assert.equal(r.status, 413);
});

test("JSON rusak → 4xx terkontrol (tanpa crash)", async () => {
  process.env.GAIA_SIAP_API_KEY = "kunci-tes";
  const r = await call({ key: "kunci-tes", raw: "{rusak" });
  assert.ok(r.status >= 400 && r.status < 500);
});
