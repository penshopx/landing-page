// Penjagaan statis: endpoint Brain Builder (Claude/Anthropic) tidak boleh
// menjadi jalur penguras kredit API berbayar.
//
// Invariant:
//   1. POST /api/agents/generate-brain — isAuthenticated + brainBuilderRateLimiter.
//   2. POST /api/agents/:id/improve-brain — isAuthenticated + brainBuilderRateLimiter
//      + assertCanMutateAgent (hanya pemilik/otorisasi yang boleh, bukan semua login).
//   3. Semua field input teks di-cap ukurannya sebelum masuk prompt LLM.
//   4. Limiter memakai store BERSAMA (SharedRateLimitStoreAdapter) dengan limit
//      per-menit yang kecil — bukan MemoryStore per-proses yang bisa ditembus
//      lintas instance autoscale.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSrc(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), ...rel.split("/")), "utf-8");
}

test("routes.ts: generate-brain digated isAuthenticated + brainBuilderRateLimiter", () => {
  const src = readSrc("server/routes.ts");
  assert.match(
    src,
    /app\.post\(\s*"\/api\/agents\/generate-brain",\s*isAuthenticated,\s*brainBuilderRateLimiter,/,
    "generate-brain harus melewati isAuthenticated DAN brainBuilderRateLimiter"
  );
});

test("routes.ts: improve-brain digated isAuthenticated + brainBuilderRateLimiter + assertCanMutateAgent", () => {
  const src = readSrc("server/routes.ts");
  assert.match(
    src,
    /app\.post\(\s*"\/api\/agents\/:id\/improve-brain",\s*isAuthenticated,\s*brainBuilderRateLimiter,/,
    "improve-brain harus melewati isAuthenticated DAN brainBuilderRateLimiter"
  );
  const start = src.indexOf('"/api/agents/:id/improve-brain"');
  const body = src.slice(start, start + 2500);
  assert.ok(
    body.includes("assertCanMutateAgent"),
    "improve-brain harus memanggil assertCanMutateAgent (ownership), bukan sekadar login"
  );
});

test("routes.ts: input generate-brain di-cap ukurannya sebelum masuk prompt LLM", () => {
  const src = readSrc("server/routes.ts");
  const start = src.indexOf('"/api/agents/generate-brain"');
  const body = src.slice(start, start + 2500);
  assert.ok(
    /\.slice\(0,\s*max\)/.test(body) || /slice\(0,\s*\d+\)/.test(body),
    "field input generate-brain harus dipotong (cap) agar payload raksasa tidak membengkakkan biaya token"
  );
});

test("routes.ts: instruction improve-brain di-cap ukurannya", () => {
  const src = readSrc("server/routes.ts");
  const start = src.indexOf('"/api/agents/:id/improve-brain"');
  const body = src.slice(start, start + 2500);
  assert.ok(
    /instruction[\s\S]{0,120}slice\(0,\s*\d+\)/.test(body),
    "instruction improve-brain harus dipotong (cap) sebelum masuk prompt LLM"
  );
});

test("rate-limiter.ts: brainBuilderRateLimiter memakai store bersama + limit per-menit kecil", () => {
  const src = readSrc("server/lib/rate-limiter.ts");
  assert.ok(src.includes("export const brainBuilderRateLimiter"), "brainBuilderRateLimiter harus diekspor");

  const start = src.indexOf("const brainMinuteStore");
  assert.ok(start !== -1, "harus ada brainMinuteStore (store bersama untuk Brain Builder)");
  const block = src.slice(start, src.indexOf("export const chatIpRateLimiter"));
  assert.ok(
    block.includes("SharedRateLimitStoreAdapter"),
    "limiter Brain Builder harus memakai SharedRateLimitStoreAdapter (Postgres bersama, lintas instance)"
  );

  const limitMatch = src.match(/BRAIN_BUILDER_LIMIT_PER_MINUTE\s*=\s*(\d+)/);
  assert.ok(limitMatch, "BRAIN_BUILDER_LIMIT_PER_MINUTE harus didefinisikan");
  const limit = Number(limitMatch![1]);
  assert.ok(
    limit > 0 && limit <= 10,
    `limit Brain Builder harus kecil (1..10 per menit), didapat ${limit} — setiap panggilan = biaya API nyata`
  );
});
