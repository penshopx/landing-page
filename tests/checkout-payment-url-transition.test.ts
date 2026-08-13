// Integrasi + penjagaan statis: transisi checkout ketika sebuah produk yang
// sudah punya scalev_variant_id KEMUDIAN diberi payment_url oleh admin.
//
// Invariant yang dijaga:
//   1. Katalog (getStoreCatalogItems) menyajikan KEDUA field sekaligus —
//      paymentUrl tidak menghapus scalevVariantId, dan sebaliknya.
//   2. Transisi bersih: setelah admin menambahkan payment_url (dan cache
//      di-invalidate), katalog langsung menyajikan paymentUrl baru TANPA
//      kehilangan scalevVariantId.
//   3. Handler Beli mengambil TEPAT SATU jalur checkout (tidak ada
//      double-charge): setiap cabang di handler diakhiri `return` sebelum
//      cabang berikutnya bisa membuka window kedua.
//   4. Halaman featured (store-featured.tsx handleBuy): paymentUrl menang
//      EKSKLUSIF atas scalevVariantId — cek paymentUrl dilakukan SEBELUM
//      scalevVariantId, sehingga saat kedua field terisi hanya paymentUrl
//      yang dipakai (bukan URL variant).
//
// Catatan arsitektur: store.tsx (katalog utama) memakai prioritas SEBALIKNYA
// (variant menang, agar order Scalev + webhook fulfillment tetap terbentuk) —
// itu dijaga oleh tests/store-catalog-scalev-variant.test.ts. Tes ini TIDAK
// mengubah aturan itu; yang dijaga di sini adalah determinisme satu-jalur dan
// aturan paymentUrl-eksklusif pada handler featured.
//
// Hermetis: produk memakai nama unik per run (RUN prefix) dan dibersihkan
// pada teardown.

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { db } from "../server/db";
import { storeProducts } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";
import { getStoreCatalogItems, invalidateStoreCatalog } from "../server/routes";

// ── Identifier unik per run ───────────────────────────────────────────────────
const RUN = `payurl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const SAMPLE_VARIANT_ID = 99_002;
const SAMPLE_PAYMENT_URL = "https://checkout.example.com/pay/added-later";

const createdProductIds: number[] = [];

// ── Teardown ─────────────────────────────────────────────────────────────────
after(async () => {
  if (createdProductIds.length > 0) {
    await db.delete(storeProducts).where(inArray(storeProducts.id, createdProductIds));
  }
  invalidateStoreCatalog();
});

async function createProduct(opts: {
  scalevVariantId?: number | null;
  paymentUrl?: string | null;
}): Promise<number> {
  const [row] = await db
    .insert(storeProducts)
    .values({
      name: `${RUN} Product`,
      description: "test payment-url transition",
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

async function findCatalogItem(productId: number): Promise<any | undefined> {
  // Cari via search=RUN — hanya produk run ini yang cocok, dan key cache unik.
  const items = await getStoreCatalogItems("", RUN);
  return items.find((i: any) => i.productId === productId);
}

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 1 — Integrasi katalog: kedua field disajikan sekaligus
// ═════════════════════════════════════════════════════════════════════════════

test("katalog menyajikan paymentUrl DAN scalevVariantId sekaligus saat keduanya tersimpan", async () => {
  const pid = await createProduct({
    scalevVariantId: SAMPLE_VARIANT_ID,
    paymentUrl: SAMPLE_PAYMENT_URL,
  });
  invalidateStoreCatalog();

  const item = await findCatalogItem(pid);
  assert.ok(item, "produk harus muncul di katalog");
  assert.equal(item.paymentUrl, SAMPLE_PAYMENT_URL, "paymentUrl harus disajikan apa adanya");
  assert.equal(item.scalevVariantId, SAMPLE_VARIANT_ID, "scalevVariantId tidak boleh hilang saat paymentUrl juga terisi");
});

test("transisi: produk lama (hanya variant) yang KEMUDIAN diberi paymentUrl → katalog menyajikan keduanya", async () => {
  // Fase 1 — produk dibuat hanya dengan Scalev variant (kondisi awal di produksi)
  const pid = await createProduct({ scalevVariantId: SAMPLE_VARIANT_ID, paymentUrl: null });
  invalidateStoreCatalog();

  const before = await findCatalogItem(pid);
  assert.ok(before, "produk harus muncul di katalog sebelum transisi");
  assert.equal(before.scalevVariantId, SAMPLE_VARIANT_ID);
  assert.equal(before.paymentUrl, null, "paymentUrl harus null sebelum admin mengisinya");

  // Fase 2 — admin menambahkan payment_url belakangan
  await db.update(storeProducts)
    .set({ paymentUrl: SAMPLE_PAYMENT_URL } as any)
    .where(eq(storeProducts.id, pid));
  invalidateStoreCatalog(); // rute admin write memanggil ini di produksi

  const after2 = await findCatalogItem(pid);
  assert.ok(after2, "produk harus tetap muncul di katalog setelah transisi");
  assert.equal(after2.paymentUrl, SAMPLE_PAYMENT_URL, "paymentUrl baru harus langsung tersaji setelah invalidasi cache");
  assert.equal(after2.scalevVariantId, SAMPLE_VARIANT_ID, "scalevVariantId harus tetap utuh setelah paymentUrl ditambahkan");
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 2 — Penjagaan statis: featured handleBuy pakai paymentUrl EKSKLUSIF
// ═════════════════════════════════════════════════════════════════════════════

function extractFn(src: string, marker: string, span = 1500): string {
  const start = src.indexOf(marker);
  assert.ok(start !== -1, `${marker} harus ada di sumber`);
  return src.slice(start, start + span);
}

test("store-featured.tsx: handleBuy memeriksa paymentUrl SEBELUM scalevVariantId (paymentUrl eksklusif)", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "client", "src", "pages", "store-featured.tsx"),
    "utf-8"
  );
  const fnBody = extractFn(src, "const handleBuy = ");

  const paymentPos = fnBody.indexOf("paymentUrl");
  const variantPos = fnBody.indexOf("scalevVariantId");
  assert.ok(paymentPos !== -1, "handleBuy harus memeriksa paymentUrl");
  assert.ok(variantPos !== -1, "handleBuy harus memeriksa scalevVariantId");
  assert.ok(
    paymentPos < variantPos,
    `di halaman featured, paymentUrl harus diperiksa SEBELUM scalevVariantId ` +
    `(posisi payment=${paymentPos}, variant=${variantPos}) — saat keduanya terisi, ` +
    `hanya paymentUrl yang dipakai (bukan URL variant)`
  );

  // Cabang paymentUrl harus diakhiri return SEBELUM cabang variant dieksekusi —
  // jika tidak, dua window checkout bisa terbuka (risiko double-charge).
  const between = fnBody.slice(paymentPos, variantPos);
  assert.ok(
    /return/.test(between),
    "cabang paymentUrl di handleBuy harus `return` sebelum cabang scalevVariantId (satu jalur checkout saja)"
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 3 — Penjagaan statis: setiap handler Beli mengambil TEPAT SATU jalur
// ═════════════════════════════════════════════════════════════════════════════

function assertSinglePathHandler(file: string, marker: string) {
  const src = fs.readFileSync(path.join(process.cwd(), ...file.split("/")), "utf-8");
  const fnBody = extractFn(src, marker);

  // Ambil posisi setiap window.open dan pastikan ada `return` di antara
  // pasangan yang berurutan — artinya maksimal SATU window terbuka per klik.
  const opens: number[] = [];
  const re = /window\.open\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fnBody)) !== null) opens.push(m.index);
  assert.ok(opens.length >= 2, `${marker} harus punya beberapa cabang checkout (window.open)`);

  for (let i = 0; i < opens.length - 1; i++) {
    const between = fnBody.slice(opens[i], opens[i + 1]);
    // `return` = cabang selesai; `catch` = window.open berikutnya adalah
    // ALTERNATIF error-fallback dalam cabang yang sama (try/catch), bukan
    // jalur kedua yang ikut tereksekusi.
    assert.ok(
      /return/.test(between) || /catch\s*[({]/.test(between),
      `${file}: setiap cabang window.open di ${marker} harus diakhiri return sebelum cabang berikutnya — ` +
      `tanpa itu, produk dengan paymentUrl DAN scalevVariantId bisa membuka dua checkout (double-charge)`
    );
  }
}

test("store.tsx: handleBuyNow mengambil tepat satu jalur checkout (return di tiap cabang)", () => {
  assertSinglePathHandler("client/src/pages/store.tsx", "const handleBuyNow = ");
});

test("store-featured.tsx: handleBuy mengambil tepat satu jalur checkout (return di tiap cabang)", () => {
  assertSinglePathHandler("client/src/pages/store-featured.tsx", "const handleBuy = ");
});
