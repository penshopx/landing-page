---
name: Unified Order API (Fase B)
description: POST /api/v1/orders — kontrak order kanonik ekosistem; keputusan V1 MANUAL_WA saja & alasan korelasi Scalev
---

# Unified Order API

- `POST /api/v1/orders` (server/order-api.ts), Bearer `ORDER_API_KEY` fail-closed, pola keamanan identik ai/assist (sha256+timingSafeEqual, rate limit shared PG store `order-api:orders` 30/mnt env `ORDER_API_RATE_LIMIT_PER_MIN`, guard pra-parse 64KB di server/index.ts).
- Source of truth: `product_registry` (ACTIVE, ≠INTERNAL_ONLY, price>0, ≠FREE) dan `package_registry` + **harga dari `package_version_snapshots`** (snapshot wajib ada DAN price>0). Field harga dari klien ditolak 400 eksplisit.
- Order dicatat di `store_orders` (kolom aditif nullable: package_id, package_version, item_name, source="api_v1"; order_ref di `midtrans_order_id`, prefix `ORD-`).

**Keputusan V1 — payment_mode selalu MANUAL_WA.**
**Why:** URL Scalev `/c/checkout?variant_ids=` tidak membawa order_ref; webhook hanya bisa korelasi via nama produk+email (tidak unik, order paralel tertukar). Review architect menandai jalur SCALEV_CHECKOUT sebagai FAIL; ChatGPT (arsitek bisnis) eksplisit melarang mengarang korelasi.
**How to apply:** jangan tambahkan payment_url Scalev dari API ini sebelum (1) variant Scalev diprovisikan per item registry (variant ID disimpan DI registry, bukan name-match ke store_products — name-match rawan salah harga/produk), dan (2) terbukti order_ref bisa dibawa ke payload webhook. Kontrak & blocker: docs/order-api.md.
