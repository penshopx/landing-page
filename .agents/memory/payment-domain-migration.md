---
name: Payment domain & PAYMENT_BASE_URL
description: Scalev storefront domain is env-driven; how to migrate payment domains without touching code
---
Storefront pembayaran (Scalev) sekarang: **https://bayar.dokumenproyek.com** (dulu bayar.gustafta.my.id, mati/404 sejak Aug 2026). Brand pembeli = dokumenproyek.com; gustafta.my.id tetap mesin internal/admin.

**Rule:** jangan pernah hardcode domain pembayaran. Server pakai `PAYMENT_BASE_URL` dari `server/lib/scalev.ts` (env PAYMENT_BASE_URL); client pakai `client/src/lib/payment-base.ts` (env VITE_PAYMENT_BASE_URL). Keduanya diset di shared env.

**Why:** migrasi domain sebelumnya menyentuh 22 titik kode + baris DB (store_products.payment_url, agents.payment_url). DB prod terpisah — kolom payment_url produk harus diganti manual/SQL di prod juga.

**How to apply:** migrasi berikutnya = ganti 2 env var + update kolom payment_url di DB dev & prod. Selesai.
