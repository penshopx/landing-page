---
name: Launch Packages (Solution Package Engine)
description: Konvensi & keputusan 6 Launch Package GAIA — harga, komposisi, satuan usage_limit, alur approval.
---

## 6 Launch Package (dibuat di DEV, semua DRAFT, gaia OFF, belum publish/promote)
1. SBU-KONSTRUKSI-PROFESSIONAL-6M — Rp1.999.000 (6 anggota, incl Jasa Dokumen 1)
2. SKK-KONSTRUKSI-BASIC-3M — Rp599.000 (5 anggota; exclude Jasa Dokumen & Ruang Kelola; disclaimer Bimtek wajib)
3. TENDER-KONSTRUKSI-PROFESSIONAL-6M — Rp2.499.000 (Brain Project CORE 2 proyek; exclude Jasa Dokumen)
4. LEGALITAS-KONSTRUKSI-BASIC-3M — Rp699.000 (nama override "Gustafta Legalitas & OSS — …"; OSS = cakupan materi, bukan anggota)
5. PROYEK-KONSTRUKSI-BUSINESS-12M — Rp5.999.000 (flagship 7 anggota; Brain 4, Jasa Dokumen 2, RS 25 GB)
6. FINANCE-KONSTRUKSI-PROFESSIONAL-6M — Rp1.999.000 (simetri harga dgn SBU Prof; Jasa Keuangan CORE 1 pekerjaan)

## Konvensi terkunci
- **usage_limit = angka murni; untuk Ruang Simpan angka = GB** (5=5GB, 1=1GB, 25=25GB), satuan ditegaskan di deskripsi paket. JANGAN konversi ke MB.
- Diferensiasi tier: Basic tanpa Jasa Dokumen/Ruang Kelola; Professional +tim/workspace; Business kuota 2× + Jasa 2 pekerjaan.
- Anggota jasa tanpa harga satuan (Bimtek, Jasa Keuangan) sah sebagai member paket — jangan mengarang harga eceran.
- Harga paket = keputusan ChatGPT/Bos, dasar nilai eceran komponen dari pricing.ts; tidak mengarang diskon.
- Alur wajib per paket: AUDIT read-only → APPROVE → CREATE DRAFT → READ-BACK → CROSS-CHECK (paket lain + 10 produk utuh) → LOCK.

**How to apply:** create dilakukan via SQL langsung yang mencerminkan logika engine (packageId auto `SOL-SEC-TIER-<n>M`, DRAFT tanpa snapshot — snapshot hanya saat publish ACTIVE). Publish butuh price>0 + ≥1 anggota; promote ke production ditahan (task #ada) sampai 6/6 lolos cross-check final.
