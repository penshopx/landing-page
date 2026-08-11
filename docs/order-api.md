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

`payment_mode` (V1): selalu `MANUAL_WA` — `payment_url` null; `wa_order_url` berisi pesan WA lengkap dengan `order_ref`, ID item, versi, dan harga. Order tercatat pending; admin memproses pembayaran lalu aktivasi manual.

**Keputusan V1 (hasil review keamanan):** checkout Scalev otomatis SENGAJA ditahan dari API ini. URL `/c/checkout?variant_ids=` tidak membawa `order_ref`, sehingga webhook tidak bisa mengaitkan pembayaran ke order `api_v1` secara pasti (korelasi nama produk + email tidak aman — nama tidak unik, order paralel bisa tertukar). `payment_mode: "SCALEV_CHECKOUT"` dicadangkan untuk V2 setelah korelasi kuat tersedia.

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

1. **Paket & produk registry belum diprovisikan di Scalev** — tidak ada variant Scalev milik registry, jadi semua order API = `MANUAL_WA`. Solusi aman berikutnya: provisikan produk/variant Scalev per item (API `createScalevProduct` sudah ada), simpan variant ID langsung di registry (bukan name-match ke store_products).
2. **`/c/checkout?variant_ids=` tidak membawa `order_ref`** — korelasi kuat order_ref↔transaksi Scalev↔webhook butuh konfirmasi dukungan custom field/metadata checkout Scalev. Jangan diasumsikan; sampai terkonfirmasi, checkout otomatis dari API ini ditahan.
3. Rate limit V1 masih satu bucket global untuk semua pemanggil (satu klien sibuk bisa menghabiskan kuota klien lain) — diselesaikan di Fase C (API client registry, kuota per client_id).
