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

**Why:** spec ChatGPT Phase 1 + review architect (FAIL pertama karena versi tidak immutable).
**How to apply:** setiap perubahan material package live → bump version + snapshot dalam satu tx; Phase 2 (provisioning/order) resolve entitlement dari snapshot.
