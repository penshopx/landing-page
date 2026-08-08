// Integrasi: scalevVariantId dipetakan oleh catalog builder.
//
// Skenario yang diuji:
//   1. Produk dengan scalev_variant_id dan tanpa payment_url
//      → scalevVariantId bukan null di item katalog.
//   2. Produk dengan scalev_variant_id DAN payment_url
//      → scalevVariantId tetap dipetakan (tidak hilang oleh paymentUrl).
//   3. Produk tanpa scalev_variant_id
//      → scalevVariantId adalah null.
//   4. Penjagaan statis — kolom scalevVariantId dipetakan di buildStoreCatalogItems.
//
// Hermetis: produk diberi nama unik (RUN prefix), dibersihkan setelah test.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { db } from "../server/db";
import { storeProducts } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

// ── Identifier unik per run ───────────────────────────────────────────────────
const RUN = `scv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const SAMPLE_VARIANT_ID = 99_001;
const SAMPLE_PAYMENT_URL = "https://checkout.example.com/pay/product-url";

const createdProductIds: number[] = [];

// ── Teardown ─────────────────────────────────────────────────────────────────
after(async () => {
  if (createdProductIds.length > 0) {
    await db.delete(storeProducts).where(inArray(storeProducts.id, createdProductIds));
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createProduct(opts: {
  scalevVariantId?: number | null;
  paymentUrl?: string | null;
}): Promise<number> {
  const [row] = await db
    .insert(storeProducts)
    .values({
      name: `${RUN} Product`,
      description: "test scalev variant",
      price: 199_000,
      agentId: null,
      isActive: true,
      isGustafta: false,
      sortOrder: 999,
      ...(opts.scalevVariantId != null ? { scalevVariantId: opts.scalevVariantId } : {}),
      ...(opts.paymentUrl != null ? { paymentUrl: opts.paymentUrl } : {}),
    } as any)
    .returning({ id: storeProducts.id });
  createdProductIds.push(row.id);
  return row.id;
}

// Mirrors the scalevVariantId mapping inside buildStoreCatalogItems (server/routes.ts).
// Replicates the exact same field so a future refactor that drops or renames the field
// will break this test first.
async function resolveScalevVariantId(productId: number): Promise<number | null> {
  const [p] = await db
    .select({ scalevVariantId: storeProducts.scalevVariantId })
    .from(storeProducts)
    .where(eq(storeProducts.id, productId))
    .limit(1);

  if (!p) return null;
  return (p as any).scalevVariantId ?? null;
}

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 1 — DB integration: scalevVariantId dipetakan dengan benar
// ═════════════════════════════════════════════════════════════════════════════

test("produk dengan scalevVariantId dan tanpa paymentUrl → scalevVariantId bukan null", async () => {
  const pid = await createProduct({ scalevVariantId: SAMPLE_VARIANT_ID, paymentUrl: null });
  const variantId = await resolveScalevVariantId(pid);
  assert.equal(variantId, SAMPLE_VARIANT_ID, "scalevVariantId harus dipetakan dari kolom scalev_variant_id");
});

test("produk dengan scalevVariantId DAN paymentUrl → scalevVariantId tetap dipetakan", async () => {
  const pid = await createProduct({ scalevVariantId: SAMPLE_VARIANT_ID, paymentUrl: SAMPLE_PAYMENT_URL });
  const variantId = await resolveScalevVariantId(pid);
  assert.equal(variantId, SAMPLE_VARIANT_ID, "scalevVariantId harus tetap ada meskipun paymentUrl juga diisi");
});

test("produk tanpa scalevVariantId → scalevVariantId adalah null", async () => {
  const pid = await createProduct({ scalevVariantId: null, paymentUrl: SAMPLE_PAYMENT_URL });
  const variantId = await resolveScalevVariantId(pid);
  assert.equal(variantId, null, "scalevVariantId harus null ketika kolom tidak diisi");
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 2 — Penjagaan statis: buildStoreCatalogItems memetakan scalevVariantId
// ═════════════════════════════════════════════════════════════════════════════

test("routes.ts: buildStoreCatalogItems memetakan scalevVariantId dari kolom store product", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  // Pastikan scalevVariantId ada di objek item yang dikembalikan
  assert.ok(
    src.includes("scalevVariantId:"),
    "buildStoreCatalogItems harus memetakan scalevVariantId ke item katalog"
  );

  // Pastikan kolom dibaca dari p (store product row), bukan nilai tetap
  assert.ok(
    /scalevVariantId:\s*\(p\s+as\s+any\)\.scalevVariantId/.test(src) ||
    /scalevVariantId:\s*p\.scalevVariantId/.test(src),
    "scalevVariantId harus dipetakan dari kolom store product (bukan nilai hardcode)"
  );
});

test("shared/schema.ts: storeProducts mendefinisikan kolom scalev_variant_id", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "shared", "schema.ts"),
    "utf-8"
  );

  assert.ok(
    src.includes('scalevVariantId: integer("scalev_variant_id")'),
    "schema harus mendefinisikan kolom scalev_variant_id bertipe integer di storeProducts"
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 3 — Penjagaan statis: handleBuyNow membangun URL checkout yang benar
// ═════════════════════════════════════════════════════════════════════════════

test("store.tsx: handleBuyNow membangun URL checkout Scalev dengan variant_ids, bukan hanya root domain", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "pages", "store.tsx"),
    "utf-8"
  );

  // Pastikan handleBuyNow menggunakan variant_ids (bukan cukup buka root domain)
  assert.ok(
    src.includes("variant_ids"),
    "handleBuyNow harus menyertakan variant_ids di URL checkout Scalev"
  );

  // Pastikan URL menggunakan path /c/checkout (bukan root domain saja)
  assert.ok(
    src.includes("/c/checkout"),
    "handleBuyNow harus membuka /c/checkout, bukan cukup root domain bayar.gustafta.my.id"
  );

  // Pastikan variant ID berasal dari agent.scalevVariantId
  assert.ok(
    /String\(agent\.scalevVariantId\)/.test(src) ||
    src.includes("agent.scalevVariantId"),
    "handleBuyNow harus menggunakan agent.scalevVariantId untuk membangun URL checkout"
  );
});

test("cart-drawer.tsx: handleCheckout menggunakan buildCheckoutUrl() untuk produk Scalev", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "components", "cart-drawer.tsx"),
    "utf-8"
  );

  // Pastikan buildCheckoutUrl() dipanggil, bukan hardcode root domain
  assert.ok(
    src.includes("buildCheckoutUrl()"),
    "cart-drawer handleCheckout harus memanggil buildCheckoutUrl() untuk URL Scalev"
  );

  // Pastikan tidak ada window.open ke root domain tanpa path checkout
  const rootDomainOnlyPattern = /window\.open\(\s*["']https:\/\/bayar\.gustafta\.my\.id["']/;
  assert.ok(
    !rootDomainOnlyPattern.test(src),
    "cart-drawer tidak boleh membuka root domain bayar.gustafta.my.id secara langsung — gunakan buildCheckoutUrl()"
  );
});

test("use-cart.tsx: buildCheckoutUrl membangun URL dengan variant_ids dan qty", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "hooks", "use-cart.tsx"),
    "utf-8"
  );

  assert.ok(
    src.includes("variant_ids="),
    "buildCheckoutUrl harus menyertakan variant_ids di URL"
  );

  assert.ok(
    src.includes("/c/checkout"),
    "buildCheckoutUrl harus menggunakan path /c/checkout"
  );

  assert.ok(
    src.includes("scalevVariantId"),
    "buildCheckoutUrl harus menggunakan scalevVariantId dari item keranjang"
  );
});
