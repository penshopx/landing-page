// store-beli-scalev-checkout.test.ts
//
// Verifies that the Beli/Beli-button handler in store.tsx and store-featured.tsx
// builds the correct Scalev checkout URL (PAYMENT_BASE_URL/c/checkout?variant_ids=<id>&qty=1)
// when a product has a scalevVariantId but no paymentUrl.
//
// "Done looks like":
//   - handler reads scalevVariantId and constructs the correct URL when paymentUrl is null
//   - the checkout URL format (?variant_ids=<id>&qty=1) is asserted explicitly
//   - paymentUrl takes priority over scalevVariantId (tested via source inspection)
//   - both store.tsx and store-featured.tsx follow the same pattern

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// ── Helper: read a client source file ────────────────────────────────────────
function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf-8");
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAGIAN 1 — store.tsx: handleBuyNow
// ═══════════════════════════════════════════════════════════════════════════════

test("store.tsx: handleBuyNow — paymentUrl diperiksa LEBIH DULU sebelum scalevVariantId", () => {
  const src = readSrc("client/src/pages/store.tsx");

  // Extract the handleBuyNow function body
  const fnStart = src.indexOf("const handleBuyNow = (agent: AgentProduct)");
  assert.ok(fnStart !== -1, "handleBuyNow harus ada di store.tsx");

  // paymentUrl branch must appear before scalevVariantId branch
  const paymentUrlIdx = src.indexOf("agent.paymentUrl", fnStart);
  const scalevVariantIdx = src.indexOf("agent.scalevVariantId", fnStart);
  assert.ok(paymentUrlIdx !== -1, "handleBuyNow harus menggunakan agent.paymentUrl");
  assert.ok(scalevVariantIdx !== -1, "handleBuyNow harus menggunakan agent.scalevVariantId");
  assert.ok(
    paymentUrlIdx < scalevVariantIdx,
    "agent.paymentUrl harus diperiksa SEBELUM agent.scalevVariantId (prioritas)"
  );
});

test("store.tsx: handleBuyNow — membangun URL checkout Scalev dengan /c/checkout", () => {
  const src = readSrc("client/src/pages/store.tsx");

  assert.ok(
    src.includes("/c/checkout"),
    "handleBuyNow harus menyertakan path /c/checkout di URL Scalev"
  );
});

test("store.tsx: handleBuyNow — menyertakan query param variant_ids yang diisi dari scalevVariantId", () => {
  const src = readSrc("client/src/pages/store.tsx");

  // variant_ids param is set
  assert.ok(
    src.includes(`qs.set("variant_ids", String(agent.scalevVariantId))`),
    'handleBuyNow harus memanggil qs.set("variant_ids", String(agent.scalevVariantId))'
  );
});

test("store.tsx: handleBuyNow — menyertakan query param qty=1", () => {
  const src = readSrc("client/src/pages/store.tsx");

  assert.ok(
    src.includes(`qs.set("qty", "1")`),
    'handleBuyNow harus memanggil qs.set("qty", "1")'
  );
});

test("store.tsx: handleBuyNow — URL checkout menggunakan PAYMENT_BASE_URL sebagai base", () => {
  const src = readSrc("client/src/pages/store.tsx");

  assert.ok(
    src.includes(`\${PAYMENT_BASE_URL}/c/checkout`),
    "handleBuyNow harus menggunakan PAYMENT_BASE_URL sebagai base URL checkout Scalev"
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// BAGIAN 2 — store-featured.tsx: handleBuy
// ═══════════════════════════════════════════════════════════════════════════════

test("store-featured.tsx: handleBuy — paymentUrl diperiksa LEBIH DULU sebelum scalevVariantId", () => {
  const src = readSrc("client/src/pages/store-featured.tsx");

  const fnStart = src.indexOf("const handleBuy = (agent: AgentProduct)");
  assert.ok(fnStart !== -1, "handleBuy harus ada di store-featured.tsx");

  const paymentUrlIdx = src.indexOf("agent.paymentUrl", fnStart);
  const scalevVariantIdx = src.indexOf("agent.scalevVariantId", fnStart);
  assert.ok(paymentUrlIdx !== -1, "handleBuy harus menggunakan agent.paymentUrl");
  assert.ok(scalevVariantIdx !== -1, "handleBuy harus menggunakan agent.scalevVariantId");
  assert.ok(
    paymentUrlIdx < scalevVariantIdx,
    "agent.paymentUrl harus diperiksa SEBELUM agent.scalevVariantId (prioritas)"
  );
});

test("store-featured.tsx: handleBuy — membangun URL checkout Scalev dengan /c/checkout (bukan hanya root domain)", () => {
  const src = readSrc("client/src/pages/store-featured.tsx");

  assert.ok(
    src.includes("/c/checkout"),
    "handleBuy harus menyertakan path /c/checkout di URL Scalev — bukan hanya root domain"
  );

  // Root-domain-only pattern must NOT be present inside the scalevVariantId branch
  // (i.e. window.open(`${PAYMENT_BASE_URL}`, "_blank") is not acceptable)
  const fnStart = src.indexOf("const handleBuy = (agent: AgentProduct)");
  const fnEnd = src.indexOf("const handleDemo", fnStart);
  const fnBody = fnEnd !== -1 ? src.slice(fnStart, fnEnd) : src.slice(fnStart, fnStart + 2000);

  const rootOnlyPattern = /window\.open\(\s*`\$\{PAYMENT_BASE_URL\}`\s*,\s*"_blank"\)/;
  assert.ok(
    !rootOnlyPattern.test(fnBody),
    "handleBuy tidak boleh membuka hanya PAYMENT_BASE_URL tanpa path /c/checkout ketika scalevVariantId digunakan"
  );
});

test("store-featured.tsx: handleBuy — menyertakan query param variant_ids dari scalevVariantId", () => {
  const src = readSrc("client/src/pages/store-featured.tsx");

  assert.ok(
    src.includes(`qs.set("variant_ids", String(agent.scalevVariantId))`),
    'handleBuy harus memanggil qs.set("variant_ids", String(agent.scalevVariantId))'
  );
});

test("store-featured.tsx: handleBuy — menyertakan query param qty=1", () => {
  const src = readSrc("client/src/pages/store-featured.tsx");

  assert.ok(
    src.includes(`qs.set("qty", "1")`),
    'handleBuy harus memanggil qs.set("qty", "1")'
  );
});

test("store-featured.tsx: handleBuy — URL checkout menggunakan PAYMENT_BASE_URL/c/checkout sebagai base", () => {
  const src = readSrc("client/src/pages/store-featured.tsx");

  assert.ok(
    src.includes(`\${PAYMENT_BASE_URL}/c/checkout`),
    "handleBuy harus menggunakan PAYMENT_BASE_URL/c/checkout sebagai base URL checkout Scalev"
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// BAGIAN 3 — Konsistensi antara store.tsx dan store-featured.tsx
// ═══════════════════════════════════════════════════════════════════════════════

test("konsistensi: store.tsx dan store-featured.tsx keduanya menggunakan pola URLSearchParams yang sama", () => {
  const storeSrc = readSrc("client/src/pages/store.tsx");
  const featuredSrc = readSrc("client/src/pages/store-featured.tsx");

  // Both must use URLSearchParams
  assert.ok(
    storeSrc.includes("new URLSearchParams()"),
    "store.tsx harus menggunakan URLSearchParams untuk membangun URL checkout Scalev"
  );
  assert.ok(
    featuredSrc.includes("new URLSearchParams()"),
    "store-featured.tsx harus menggunakan URLSearchParams untuk membangun URL checkout Scalev"
  );

  // Both must produce a URL with the same path
  assert.ok(
    storeSrc.includes("/c/checkout"),
    "store.tsx harus menggunakan /c/checkout"
  );
  assert.ok(
    featuredSrc.includes("/c/checkout"),
    "store-featured.tsx harus menggunakan /c/checkout"
  );
});
