# Access Matrix — Dokumentasi Internal (Phase 1)

Access Matrix = **source of truth** untuk provisioning masa depan: capability apa yang didapat customer berdasarkan SOLUTION × SECTOR × TIER (via PACKAGE).

## Sumber data
Bukan tabel terpisah — matrix diturunkan dari `package_registry` + `package_products`:
setiap baris `package_products` menyatakan `product → access_level (+usage_limit)` untuk kombinasi solution/sector/tier package tersebut.

## Contoh
Package `SBU-KONSTRUKSI-PROFESSIONAL-6M`:
- Ruang Kelola = FULL
- Ruang Simpan = FULL
- Bedah Dokumen = FULL
- AI Specialist = FULL
- Toolkit = LIMITED (usage_limit 20)

## API
`GET /api/admin/registry/access-matrix?solutionId=&sectorId=&tierId=` (admin-only) →
```json
[{ "packageId": "SBU-KONSTRUKSI-PROFESSIONAL-6M", "version": 1, "status": "ACTIVE",
   "solution": "SBU", "sector": "Konstruksi", "tier": "Professional",
   "duration": "6 MONTH", "price": 3500000,
   "access": [{ "product": "Ruang Kelola", "productId": "GST-CAP-008", "level": "FULL", "usageLimit": null }] }]
```

## Alur provisioning masa depan (Phase 2+, belum diimplementasikan)
Customer → Purchase → Payment (Scalev) → Package (+version) → Access Matrix → Provisioning → Expiration.
Skema saat ini sudah menampung alur tersebut tanpa perubahan breaking.
