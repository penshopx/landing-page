// Regression test: sortOrder auto-fill setelah produk dihapus.
//
// Test ini mengimpor LANGSUNG dari modul produksi client/src/lib/store-sort-order.ts
// sehingga jika guard lama (`if (storeProducts.length > 0)`) diperkenalkan
// kembali di syncOrderedProducts, atau logika computeNextSortOrder berubah,
// test ini GAGAL — bukan lolos dengan tiruan lokal.
//
// Konteks (admin.tsx):
//   useEffect(() => {
//     setOrderedProducts(syncOrderedProducts(storeProducts));   // ← production call
//   }, [storeProducts]);
//
//   onClick (Tambah Produk):
//     setProductForm(f => ({ ...f, sortOrder: String(computeNextSortOrder(orderedProducts)) }));
//
// Bug lama: syncOrderedProducts memiliki guard `if (storeProducts.length > 0)`,
// sehingga ketika semua produk dihapus → orderedProducts TIDAK di-clear →
// computeNextSortOrder mengembalikan nilai lama, bukan 10.

import { test } from "node:test";
import assert from "node:assert/strict";
// Impor langsung dari kode produksi — coupling nyata ke implementasi.
import {
  syncOrderedProducts,
  computeNextSortOrder,
} from "../client/src/lib/store-sort-order.js";

// ─────────────────────────────────────────────────────────────────────────────
// SKENARIO 1: Hapus produk dengan sortOrder tertinggi — 2 produk tersisa
// ─────────────────────────────────────────────────────────────────────────────

test("setelah hapus produk tertinggi, nextSortOrder = (baru_max)+10", () => {
  // Kondisi awal: 3 produk sortOrder [10, 20, 30]
  const initial = [
    { id: 1, sortOrder: 10 },
    { id: 2, sortOrder: 20 },
    { id: 3, sortOrder: 30 },
  ];
  let ordered = syncOrderedProducts(initial);
  assert.equal(computeNextSortOrder(ordered), 40, "awal: max=30 → 30+10=40");

  // Hapus produk id=3 (sortOrder=30) → storeProducts tinggal 2 item
  const afterDelete = [
    { id: 1, sortOrder: 10 },
    { id: 2, sortOrder: 20 },
  ];
  ordered = syncOrderedProducts(afterDelete);

  assert.equal(computeNextSortOrder(ordered), 30,
    "setelah hapus sortOrder-30, nextSortOrder harus 20+10=30");
});

// ─────────────────────────────────────────────────────────────────────────────
// SKENARIO 2 (inti bug): Hapus SEMUA produk → nextSortOrder harus 10
// syncOrderedProducts lama (dengan guard) mengembalikan state lama → gagal.
// syncOrderedProducts baru (tanpa guard) mengembalikan [] → lulus.
// ─────────────────────────────────────────────────────────────────────────────

test("setelah hapus semua produk, syncOrderedProducts mengembalikan array kosong", () => {
  const initial = [{ id: 1, sortOrder: 30 }];
  let ordered = syncOrderedProducts(initial);
  assert.equal(ordered.length, 1);

  // Hapus satu-satunya produk → server mengirim []
  ordered = syncOrderedProducts([]);

  assert.equal(ordered.length, 0,
    "syncOrderedProducts([]) harus mengembalikan [] (bukan state lama)");
});

test("setelah hapus semua produk, nextSortOrder = 10 (bukan nilai stale)", () => {
  // Simulasi urutan state yang terjadi di admin.tsx:
  //   1. storeProducts = [{sortOrder: 30}] → syncOrderedProducts → orderedProducts = [{sortOrder:30}]
  //   2. Produk dihapus → storeProducts = [] → syncOrderedProducts → orderedProducts = []
  //   3. Toggle "Tambah Produk" → computeNextSortOrder([]) → harus 10
  let ordered = syncOrderedProducts([{ id: 1, sortOrder: 30 }]);
  ordered = syncOrderedProducts([]); // ← titik kritis: tidak boleh menjaga state lama

  assert.equal(computeNextSortOrder(ordered), 10,
    "nextSortOrder harus 0+10=10 ketika tidak ada produk");
});

// ─────────────────────────────────────────────────────────────────────────────
// SKENARIO 3: Hapus semua lalu tambah produk baru — state konsisten
// ─────────────────────────────────────────────────────────────────────────────

test("setelah hapus-semua lalu tambah produk baru, nextSortOrder benar", () => {
  let ordered = syncOrderedProducts([
    { id: 1, sortOrder: 10 },
    { id: 2, sortOrder: 20 },
  ]);

  // Hapus semua
  ordered = syncOrderedProducts([]);
  assert.equal(ordered.length, 0, "orderedProducts kosong setelah hapus semua");

  // Produk baru ditambah dengan sortOrder=10 (sesuai auto-fill yang benar)
  ordered = syncOrderedProducts([{ id: 3, sortOrder: 10 }]);
  assert.equal(ordered.length, 1);
  assert.equal(computeNextSortOrder(ordered), 20,
    "setelah tambah produk sortOrder=10, nextSortOrder harus 10+10=20");
});

// ─────────────────────────────────────────────────────────────────────────────
// SKENARIO 4: syncOrderedProducts mengurutkan dengan benar by sortOrder asc
// ─────────────────────────────────────────────────────────────────────────────

test("syncOrderedProducts mengurutkan produk by sortOrder ascending", () => {
  const unsorted = [
    { id: 3, sortOrder: 30 },
    { id: 1, sortOrder: 10 },
    { id: 2, sortOrder: 20 },
  ];
  const ordered = syncOrderedProducts(unsorted);
  assert.deepEqual(
    ordered.map((p) => p.id),
    [1, 2, 3],
    "harus diurutkan id-1(10) → id-2(20) → id-3(30)"
  );
});
