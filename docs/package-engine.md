# Solution Package Engine — Dokumentasi Internal (Phase 1)

Model komersial: **PACKAGE = SOLUTION × SECTOR × TIER × DURATION**.
Tidak ada generic unlimited subscription. Contoh: Gustafta SBU × Konstruksi × Professional × 6 Bulan.

## Tabel (shared/schema.ts, DDL boot di server/index.ts)
- `solution_registry` — seed awal: legalitas, oss, sbu, skk, tender, proyek, compliance, kompetensi, finance. Admin bisa menambah.
- `sector_registry` — seed awal: konstruksi, konsultan, perdagangan, manufaktur, teknologi, jasa, lainnya.
- `tier_registry` — seed awal: basic(1), professional(2), business(3). Jangan menambah tier berlebihan.
- `package_registry` — `package_id` PERMANEN (mis. `SBU-KONSTRUKSI-PROFESSIONAL-6M`), FK solution/sector/tier, durasi (1/3/6/12, MONTH/YEAR), harga, `version` integer, effective_from/until, `gaia_enabled`.
- `package_products` — m2m package↔product: `access_level` (FULL/LIMITED/VIEW_ONLY), `usage_limit`, `is_required`, `sort_order`. Unique (package_id, product_id). ON DELETE CASCADE dari package.

## Versioning (aturan penting)
- Package DRAFT: bebas diubah, versi tetap.
- Package ACTIVE/PAUSED: perubahan **komposisi produk, harga, atau durasi** otomatis menaikkan `version`.
- Order/subscription masa depan HARUS menyimpan `package_id + package_version` — package yang sudah dibeli tidak diubah retroaktif.

## Status package
DRAFT → ACTIVE (publish; wajib ≥1 produk & harga > 0) → PAUSED ↔ ACTIVE → ARCHIVED (soft). Tidak ada hard delete.

## API (admin-only) — `server/package-engine.ts`
- `GET/POST/PATCH /api/admin/registry/{solutions|sectors|tiers}[/:id]`
- `GET/POST/PATCH /api/admin/registry/packages[/:id]`
- `PUT /api/admin/registry/packages/:id/products` — replace komposisi (transaksi; bump versi jika live)
- `GET /api/admin/registry/access-matrix?solutionId&sectorId&tierId`

## Backward compatibility
Tidak menyentuh `subscriptions`, `store_products`, billing Scalev, atau auth existing. Compatibility layer provisioning menyusul (Phase 2+).
