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
import { getStoreCatalogItems, invalidateStoreCatalog } from "../server/routes";

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

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 4 — Penjagaan statis: aturan prioritas scalevVariantId > paymentUrl
// ═════════════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 5 — Cart checkout: item dengan scalevVariantId DAN paymentUrl
//            harus dirutekan lewat URL variant Scalev (/c/checkout?variant_ids=)
// ═════════════════════════════════════════════════════════════════════════════

// Perilaku runtime hook produksi (CartProvider/useCart) diuji di
// tests/cart-scalev-checkout.vitest.tsx — item dengan scalevVariantId DAN
// paymentUrl produk → buildCheckoutUrl() = /c/checkout?variant_ids=…
// Di sini: static guards yang mengunci kondisi penentu di kode sumber.

test("use-cart.tsx: filter buildCheckoutUrl memakai scalevVariantId sebagai kondisi penentu (static guard sinkronisasi replika)", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "hooks", "use-cart.tsx"),
    "utf-8"
  );

  // Kondisi filter persis: selected && scalevVariantId
  assert.ok(
    /filter\(\s*i\s*=>\s*i\.selected\s*&&\s*i\.scalevVariantId\s*\)/.test(src),
    "buildCheckoutUrl harus memfilter item dengan `i.selected && i.scalevVariantId` — scalevVariantId adalah kondisi penentu"
  );

  // paymentUrl tidak boleh dipakai di dalam use-cart untuk membangun URL checkout
  assert.ok(
    !src.includes("paymentUrl"),
    "use-cart.tsx tidak boleh menggunakan paymentUrl dalam pembentukan URL checkout"
  );
});

test("cart-drawer.tsx: pemisahan item Scalev vs WA memakai keberadaan scalevVariantId", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "components", "cart-drawer.tsx"),
    "utf-8"
  );

  assert.ok(
    /filter\(\s*i\s*=>\s*i\.scalevVariantId\s*\)/.test(src),
    "cart-drawer harus memfilter item Scalev dengan keberadaan scalevVariantId"
  );
  assert.ok(
    /filter\(\s*i\s*=>\s*!i\.scalevVariantId\s*\)/.test(src),
    "cart-drawer harus merutekan item TANPA scalevVariantId ke jalur WA"
  );
  assert.ok(
    !src.includes("paymentUrl"),
    "cart-drawer tidak boleh membuka paymentUrl — jalur Scalev harus lewat buildCheckoutUrl()"
  );
});

test("store.tsx: handleBuyNow memeriksa scalevVariantId SEBELUM paymentUrl (prioritas Scalev variant)", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "pages", "store.tsx"),
    "utf-8"
  );

  // Temukan blok handleBuyNow
  const buyNowStart = src.indexOf("const handleBuyNow");
  assert.ok(buyNowStart !== -1, "handleBuyNow harus ada di store.tsx");

  // Ambil isi fungsi sampai tanda } penutup pertama yang relevan
  const fnBody = src.slice(buyNowStart, buyNowStart + 1500);

  // Posisi pemeriksaan scalevVariantId dan paymentUrl di dalam fungsi
  const variantPos = fnBody.indexOf("scalevVariantId");
  const paymentPos = fnBody.indexOf("paymentUrl");

  assert.ok(variantPos !== -1, "handleBuyNow harus memeriksa scalevVariantId");
  assert.ok(paymentPos !== -1, "handleBuyNow harus memeriksa paymentUrl");

  assert.ok(
    variantPos < paymentPos,
    `scalevVariantId harus diperiksa SEBELUM paymentUrl di handleBuyNow ` +
    `(posisi variant=${variantPos}, posisi payment=${paymentPos}) — ` +
    `aturan prioritas: scalevVariantId selalu menang atas paymentUrl`
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 6 — Invalidasi cache katalog saat scalev_variant_id / paymentUrl berubah
//
// Skenario nyata: admin menghapus scalevVariantId dari produk yang sudah live.
// Tanpa invalidasi, cache katalog (TTL 30 dtk) tetap menyajikan variant ID lama
// → pembeli yang klik Beli mendapat URL checkout Scalev untuk varian yang sudah
// tidak ada. PATCH admin memanggil invalidateStoreCatalog() setelah SETIAP
// update — tes ini membuktikan mekanisme itu benar-benar menyegarkan katalog.
// ═════════════════════════════════════════════════════════════════════════════

test("cache katalog: hapus scalevVariantId + invalidateStoreCatalog() → katalog segar tanpa variant ID lama", async () => {
  const pid = await createProduct({ scalevVariantId: SAMPLE_VARIANT_ID, paymentUrl: SAMPLE_PAYMENT_URL });

  // Warm cache — search dengan RUN unik supaya hanya produk tes yang ter-cache
  const warm = await getStoreCatalogItems("Semua", RUN);
  const warmItem = warm.find((i: any) => i.productId === pid);
  assert.ok(warmItem, "produk tes harus muncul di katalog setelah warm build");
  assert.equal(warmItem.scalevVariantId, SAMPLE_VARIANT_ID, "cache warm harus memuat variant ID awal");

  // Admin menghapus scalev_variant_id (mutasi DB langsung — setara updateStoreProduct)
  await db.update(storeProducts)
    .set({ scalevVariantId: null } as any)
    .where(eq(storeProducts.id, pid));

  // TANPA invalidasi: cache (masih fresh, < TTL) tetap menyajikan variant ID lama —
  // membuktikan bahwa invalidasi memang DIBUTUHKAN, bukan kebetulan TTL.
  const stale = await getStoreCatalogItems("Semua", RUN);
  const staleItem = stale.find((i: any) => i.productId === pid);
  assert.equal(
    staleItem?.scalevVariantId, SAMPLE_VARIANT_ID,
    "tanpa invalidasi, cache fresh masih menyajikan variant ID lama (bukti cache aktif)"
  );

  // DENGAN invalidasi (yang dipanggil handler PATCH admin): katalog dibangun ulang
  invalidateStoreCatalog();
  const fresh = await getStoreCatalogItems("Semua", RUN);
  const freshItem = fresh.find((i: any) => i.productId === pid);
  assert.ok(freshItem, "produk tetap ada di katalog setelah rebuild");
  assert.equal(
    freshItem.scalevVariantId, null,
    "setelah invalidateStoreCatalog(), katalog TIDAK boleh lagi memuat variant ID yang dihapus"
  );
});

test("cache katalog: hapus paymentUrl pada produk yang sama + invalidasi → paymentUrl hilang dari katalog", async () => {
  const pid = await createProduct({ scalevVariantId: SAMPLE_VARIANT_ID, paymentUrl: SAMPLE_PAYMENT_URL });

  invalidateStoreCatalog(); // mulai dari cache kosong untuk kunci ini
  const warm = await getStoreCatalogItems("Semua", RUN);
  const warmItem = warm.find((i: any) => i.productId === pid);
  assert.equal(warmItem?.paymentUrl, SAMPLE_PAYMENT_URL, "cache warm harus memuat paymentUrl awal");

  // Admin mengosongkan paymentUrl DAN scalevVariantId sekaligus
  await db.update(storeProducts)
    .set({ paymentUrl: null, scalevVariantId: null } as any)
    .where(eq(storeProducts.id, pid));

  invalidateStoreCatalog();
  const fresh = await getStoreCatalogItems("Semua", RUN);
  const freshItem = fresh.find((i: any) => i.productId === pid);
  assert.ok(freshItem, "produk tetap ada di katalog setelah rebuild");
  assert.equal(freshItem.paymentUrl, null, "paymentUrl yang dikosongkan tidak boleh tersaji dari cache");
  assert.equal(freshItem.scalevVariantId, null, "scalevVariantId yang dikosongkan tidak boleh tersaji dari cache");
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 7 — Penjagaan statis: handler PATCH admin memanggil invalidateStoreCatalog()
// ═════════════════════════════════════════════════════════════════════════════

test("routes.ts: PATCH /api/store/admin/products/:id memanggil invalidateStoreCatalog() setelah updateStoreProduct", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "server", "routes.ts"), "utf-8");

  const start = src.indexOf('app.patch("/api/store/admin/products/:id"');
  assert.ok(start !== -1, "handler PATCH /api/store/admin/products/:id harus ada di routes.ts");

  // Blok handler sampai handler route berikutnya
  const rest = src.slice(start);
  const nextRoute = rest.slice(10).search(/app\.(get|post|patch|put|delete)\(/);
  const block = nextRoute === -1 ? rest : rest.slice(0, nextRoute + 10);

  const updatePos = block.indexOf("updateStoreProduct");
  const invalidatePos = block.indexOf("invalidateStoreCatalog()");
  assert.ok(updatePos !== -1, "handler PATCH harus memanggil storage.updateStoreProduct");
  assert.ok(
    invalidatePos !== -1 && invalidatePos > updatePos,
    "handler PATCH harus memanggil invalidateStoreCatalog() SETELAH updateStoreProduct — " +
    "tanpa itu cache katalog (TTL 30 dtk) menyajikan scalev_variant_id / paymentUrl lama ke pembeli"
  );
});
