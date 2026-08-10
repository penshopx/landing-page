---
name: Solution Package Engine
description: Model paket komersial Gustafta (Phase 1) — solution/sector/tier/package registries, access matrix, snapshot versioning
---

Model komersial: PACKAGE = SOLUTION × SECTOR × TIER × DURATION (tidak ada generic unlimited subscription).

- Tabel: solution_registry, sector_registry, tier_registry, package_registry (package_id permanen, mis. SBU-KONSTRUKSI-PROFESSIONAL-6M), package_products (m2m = access matrix: FULL/LIMITED/VIEW_ONLY + usage_limit), package_version_snapshots.
- Routes admin-only di server/package-engine.ts, di-register di routes.ts setelah gaia-registry (injeksi isAuthenticated+getDbRole, pola sama).
- **Aturan versioning (temuan review)**: menaikkan angka version tanpa menyimpan state lama = data loss. Setiap versi yang pernah live HARUS di-snapshot (harga+durasi+komposisi jsonb) dalam TRANSAKSI YANG SAMA dengan perubahannya; row package_registry mutable, resolusi historis selalu dari snapshot (package_id + version). Order/subscription masa depan wajib menyimpan package_id + version.
- Publish gate: ACTIVE hanya jika ≥1 produk & harga > 0.
- 14 capability existing di-seed sebagai produk registry GST-CAP-0xx, category CAPABILITY, visibility INCLUDED_ONLY — bukan produk standalone.
- GAIA sengaja BELUM diintegrasikan di Phase 1 (hanya flag gaia_enabled).
- Docs: docs/product-registry.md, docs/package-engine.md, docs/access-matrix.md.

Phase 2A — Catalog API publik (server/catalog-api.ts, /api/v1/catalog/*, read-only tanpa auth):
- Eligibility: product = ACTIVE + gaia_enabled + visibility≠INTERNAL_ONLY; package = ACTIVE + gaia_enabled + price>0 + ≥1 produk VISIBLE.
- **Temuan review**: komposisi package publik WAJIB difilter per-produk (ACTIVE & bukan INTERNAL_ONLY) — kalau tidak, package eligible membocorkan produk DRAFT/internal. gaia_enabled TIDAK disyaratkan untuk anggota komposisi (flag itu hanya untuk listing standalone; capability INCLUDED_ONLY memang tampil via package). Snapshot historis juga difilter terhadap product_registry SAAT INI.
- CORS via env CATALOG_ALLOWED_ORIGINS (tanpa env = tanpa header, bukan wildcard); cache in-memory 60s di-invalidate oleh middleware non-GET /api/admin/registry di routes.ts (didaftarkan SEBELUM route registry).
- Admin GAIA Preview (/api/admin/registry/gaia-preview + tab UI) harus pakai keputusan eligibility yang SAMA dengan catalog publik.

**Why:** spec ChatGPT Phase 1 + review architect (FAIL pertama karena versi tidak immutable).
**How to apply:** setiap perubahan material package live → bump version + snapshot dalam satu tx; Phase 2 (provisioning/order) resolve entitlement dari snapshot.
