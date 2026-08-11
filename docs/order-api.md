# Gustafta Unified Order API — Kontrak V1 (Fase B)

## URL

```
POST https://gustafta.my.id/api/v1/orders
```

Server-to-server saja. Jangan panggil dari browser — API key tidak boleh sampai ke client.

## Authentication

```
Authorization: Bearer <ORDER_API_KEY>
Content-Type: application/json
```

Fail-closed: tanpa env `ORDER_API_KEY` di Gustafta, endpoint membalas 503 `service_not_configured`.

## Request schema

```json
{
  "product_id": "GST-CAP-002",        // ATAU package_id — salah satu, tidak boleh keduanya/kosong
  "package_id": "SBU-KONSTRUKSI-PROFESSIONAL-6M",
  "buyer": { "name": "wajib ≤120", "email": "wajib, valid", "phone": "opsional" }
}
```

- Harga TIDAK boleh dikirim klien — field `amount`/`price`/`total` ditolak 400. Harga selalu server-side dari registry.
- `product_id` = `product_registry.product_id`; `package_id` = `package_registry.package_id`.
- Body maksimum 64KB (ditolak 413 sebelum parse).

## Validasi purchasable (server-side)

- Produk: status `ACTIVE`, `visibility ≠ INTERNAL_ONLY`, harga > 0, bukan FREE. Jika tidak → 409 `product_not_purchasable`.
- Paket: status `ACTIVE`, harga > 0, DAN snapshot versi aktif harus ada di `package_version_snapshots` (harga & identitas diambil dari snapshot immutable; versi dicatat di order untuk audit). Tanpa snapshot → 409 `package_snapshot_missing`.

## Response (201)

```json
{
  "order_ref": "ORD-1786416960115-FE9CC6B6",
  "package_id": "SBU-KONSTRUKSI-PROFESSIONAL-6M",
  "package_version": 1,
  "item_name": "Gustafta SBU — Konstruksi Professional 6 Bulan",
  "amount": 1999000,
  "currency": "IDR",
  "status": "pending",
  "payment_url": null,
  "payment_mode": "MANUAL_WA",
  "wa_order_url": "https://wa.me/6281287941900?text=...",
  "note": "...",
  "created_at": "2026-08-11T..."
}
```

`payment_mode`:
- `SCALEV_ORDER` (Task #313A) — order dibuat server-side di Scalev via `POST /v3/orders`; `payment_url` = URL order per-transaksi dari respons Scalev. Korelasi deterministik: `order_ref (ORD-*) ↔ store_orders.scalev_order_id (disimpan saat create) ↔ webhook data.order_id`. `metadata.order_ref` ikut dikirim hanya sebagai defense-in-depth, BUKAN dependency korelasi. Syarat: item punya `scalev_variant_unique_id` di registry + env `SCALEV_STORE_UNIQUE_ID` + `SCALEV_API_KEY`.
- `MANUAL_WA` — dipakai bila item belum diprovisikan di Scalev ATAU create order Scalev gagal (fallback; order lokal tetap pending, tidak berpura-pura siap dibayar). `wa_order_url` memuat `order_ref`, ID item, versi, harga.

**Catatan sejarah:** URL statis `/c/checkout?variant_ids=` TIDAK dipakai API ini — tidak bisa membawa `order_ref` sehingga korelasi webhook tidak aman (audit + review).

**Webhook:** `POST /api/webhooks/scalev` kini mencocokkan `data.order_id` ke `store_orders.scalev_order_id` SEBELUM cabang legacy; bila cocok, order `api_v1` di-update menjadi `paid` (idempoten) dan cabang legacy tidak tereksekusi. Cabang lama tidak diubah.

Order dicatat di `store_orders` dengan `source = "api_v1"`, `midtrans_order_id = order_ref`, plus kolom `package_id`/`package_version`/`item_name` (aditif, nullable — order lama tidak terpengaruh).

## Error codes

| HTTP | `error` |
|---|---|
| 400 | `invalid_request` |
| 401 | `unauthorized` |
| 404 | `product_not_found` / `package_not_found` |
| 409 | `product_not_purchasable` / `package_not_purchasable` / `package_snapshot_missing` |
| 413 | `payload_too_large` (>64KB) |
| 429 | `rate_limited` (default 30/menit; env `ORDER_API_RATE_LIMIT_PER_MIN`) |
| 503 | `service_not_configured` |
| 500 | `internal_error` |

## Blocker yang tersisa (dilaporkan, bukan di-workaround)

1. **Provisioning variant — SELESAI (#313B-1)** — 10 item sellable (4 produk + 6 paket) sudah diprovisikan di Scalev via `scripts/provision-scalev-variants.ts` (idempotent; mode `--apply`/`--verify`; SKU = registry id). Mapping `scalev_variant_unique_id` terisi di registry, produk juga DI-ATTACH ke store (v2 `POST /stores/{id}/products` — tanpa attach, create order gagal "Variant does not exist"). Jalur `SCALEV_ORDER` terverifikasi end-to-end di dev (create order nyata tanpa bayar + webhook correlation → paid; order uji dibatalkan). Catatan API: telepon harus digit tanpa `+` (dinormalisasi di `createScalevOrder`), respons v3 create order TIDAK dibungkus `data`. Sisa: #313B-2 = 1 transaksi nyata nominal kecil (butuh approval terpisah).
2. Rate limit V1 masih satu bucket global untuk semua pemanggil (satu klien sibuk bisa menghabiskan kuota klien lain) — diselesaikan di Fase C (API client registry, kuota per client_id).
