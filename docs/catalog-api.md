# Gustafta Catalog API — Phase 2A (untuk GAIA)

Gustafta = SOURCE OF TRUTH. GAIA = catalog consumer (display & sell). API ini **read-only**.

## Base URL & Versioning
- Public: `/api/v1/catalog/*` — TANPA autentikasi, hanya GET.
- Admin preview: `/api/admin/registry/gaia-preview` — auth admin existing (session + role admin/superadmin).

## Aturan eligibility (apa yang muncul di katalog publik)
- **Product**: `status = ACTIVE` AND `gaia_enabled = true` AND `visibility ≠ INTERNAL_ONLY`.
- **Package**: `status = ACTIVE` AND `gaia_enabled = true` AND `price > 0` AND punya ≥1 produk.
- DRAFT/PAUSED/ARCHIVED, gaia_enabled=false, package kosong/harga 0 → 404 / tidak masuk list.
- Semua field respons = whitelist. Tidak ada prompt internal, kredensial, cost, data customer.

## Endpoint

| Endpoint | Keterangan |
|---|---|
| `GET /api/v1/catalog/products` | List produk eligible. Query: `q` (search name/desc/tagline), `product_type`, `page`, `limit` |
| `GET /api/v1/catalog/products/:id` | Detail by `product_id` (GST-…) atau slug |
| `GET /api/v1/catalog/solutions` / `/:id` | Solutions ACTIVE |
| `GET /api/v1/catalog/sectors` | Sectors ACTIVE |
| `GET /api/v1/catalog/tiers` | Tiers ACTIVE (urut level) |
| `GET /api/v1/catalog/packages` | List package eligible. Filter: `solution`, `sector`, `tier` (by name, case-insensitive), `duration` (angka), `q` (search). Pagination `page`,`limit` |
| `GET /api/v1/catalog/packages/:id` | Detail by `package_id` atau slug, termasuk `products[]` |
| `GET /api/v1/catalog/packages/:id/products` | Komposisi produk saja |
| `GET /api/v1/catalog/packages/:id/version` | Versi ACTIVE yang berlaku + komposisi dari snapshot terbaru (order lama tetap pegang versinya sendiri) |

## Format respons
List:
```json
{ "success": true, "data": [ ... ], "meta": { "page": 1, "limit": 20, "total": 1 } }
```
Detail: `{ "success": true, "data": { ... } }` — error: `{ "success": false, "error": "..." }` (404/500).

### Product (whitelist)
`product_id, name, slug, tagline, description, product_type, category, status, visibility, standalone_enabled, subscription_enabled, dp_enabled, ai_enabled, price, currency, billing_type, version, features, benefits, thumbnail, demo_url, gaia_enabled, source:"GUSTAFTA"`

### Package
`package_id, name, slug, description, solution, sector, tier, duration, duration_unit, price, currency, status, version, effective_from, effective_until, gaia_enabled, source` — detail menambahkan `products[]`:
`product_id, product_name, product_type, access_level (FULL|LIMITED|VIEW_ONLY), usage_limit, is_required, sort_order`.

## Pagination
`page` (default 1), `limit` (default 20, max 100). `meta.total` = total setelah filter.

## CORS
Origin diizinkan lewat env **`CATALOG_ALLOWED_ORIGINS`** (comma separated, mis. `https://gaia.example.com,https://www.gaia.example.com`). Tanpa env → tidak ada header CORS (default aman, bukan wildcard). Preflight OPTIONS dijawab 204. Method hanya GET.

## Cache
In-memory TTL 60 detik per resource (products/lookups/packages); otomatis di-invalidate saat ada mutasi admin di `/api/admin/registry/*`. Implementasi di `server/catalog-api.ts` (`clearCatalogCache`) — mudah diganti bila perlu.

## Versi package (penting untuk GAIA)
- `version` pada package = versi live saat ini. Setiap versi yang pernah live tersimpan immutable di `package_version_snapshots`.
- Order Phase 2B WAJIB menyimpan `package_id + version` saat pembelian; resolusi historis dari snapshot, bukan dari katalog live.

## Instruksi integrasi GAIA (Phase 2B)
1. Minta admin Gustafta set `CATALOG_ALLOWED_ORIGINS` berisi domain GAIA.
2. Konsumsi endpoint di atas apa adanya — jangan menyimpan salinan katalog sebagai source of truth (boleh cache display).
3. Untuk menampilkan produk/paket: cukup `GET /packages` + `GET /packages/:id`.
4. Saat membuat order (Phase 2B): kirim `package_id` + `version` dari respons katalog saat itu.
5. Eligibility dikontrol penuh dari admin Gustafta (`/admin/registry`, tab GAIA Preview memperlihatkan apa yang tampil & alasannya).
