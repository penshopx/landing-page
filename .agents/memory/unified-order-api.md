---
name: Unified Order API (Fase B)
description: POST /api/v1/orders — kontrak order kanonik ekosistem; keputusan V1 MANUAL_WA saja & alasan korelasi Scalev
---

# Unified Order API

- `POST /api/v1/orders` (server/order-api.ts), Bearer `ORDER_API_KEY` fail-closed, pola keamanan identik ai/assist (sha256+timingSafeEqual, rate limit shared PG store `order-api:orders` 30/mnt env `ORDER_API_RATE_LIMIT_PER_MIN`, guard pra-parse 64KB di server/index.ts).
- Source of truth: `product_registry` (ACTIVE, ≠INTERNAL_ONLY, price>0, ≠FREE) dan `package_registry` + **harga dari `package_version_snapshots`** (snapshot wajib ada DAN price>0). Field harga dari klien ditolak 400 eksplisit.
- Order dicatat di `store_orders` (kolom aditif nullable: package_id, package_version, item_name, source="api_v1"; order_ref di `midtrans_order_id`, prefix `ORD-`).

**Korelasi Scalev — keputusan final (audit + #313A):**
**Why:** URL statis `/c/checkout?variant_ids=` TIDAK bisa membawa order_ref (korelasi nama+email tidak aman — tidak unik, order paralel tertukar). Jalur benar = **Scalev v3 `POST /v3/orders`** (api.scalev.com — dokumen publik hanya v3; kode legacy pakai api.scalev.id/v2 tanpa docs): create order server-side → respons `order_id` + `public_order_url` per-order → simpan `store_orders.scalev_order_id` → webhook cocokkan `data.order_id` SEBELUM dedup/cabang legacy (posisi di atas dedup penting: race webhook-sebelum-persist bisa pulih via retry; fallback kedua `metadata.order_ref` + backfill).
**How to apply:** jalur `SCALEV_ORDER` aktif per-item hanya bila `scalev_variant_unique_id` terisi di registry + env `SCALEV_STORE_UNIQUE_ID`; create gagal → fallback MANUAL_WA (jangan pernah mengarang payment_url). Provisioning variant + transaksi uji live = #313B, WAJIB approval dulu. `metadata.order_ref` = defense-in-depth, BUKAN dependency. Kontrak: docs/order-api.md; tes: tests/order-api-scalev.test.ts (fetch di-mock per-host).
