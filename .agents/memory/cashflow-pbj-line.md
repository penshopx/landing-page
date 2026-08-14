---
name: CASHFLOW-PBJ product line
description: Lini produk arus kas kontraktor UKM proyek pemerintah (buku "Kas Merah, RAB Hijau") — di mana tiap bagian hidup dan aturan kontennya.
---

Lini produk 4-level dari buku "Kas Merah, RAB Hijau" (vision Bos, Agustus 2026):

- **Level 3 AI**: 7 spesialis (si-kas/si-pasal/si-lapangan/si-berkas/si-strategi/si-pajak/si-darurat-claw) + orchestrator `cashflow-pbj-multiclaw` (persona **Pak Arga / Ir. Arga Winata**) — semua entri di `server/claw-catalog.ts` batch CASHFLOW-PBJ, pola claw-factory standar.
- **Toolkit 7 alat** (client-only, localStorage): `/toolkit-cashflow` + data statis `client/src/data/cashflow-toolkit.ts` (Triage, Tracker 7-Titik, Buffer, 12 surat, Zero-Defect, Friday Review, Red Flags).
- **Harga simulasi** `CASHFLOW_TIERS` di `client/src/data/pricing.ts`: T1 MANDOR 200rb / T2 KONTRAKTOR 500rb / T3 DIREKTUR 1jt per bulan; durasi 6 bln −10%, 12 bln −20%. CTA masih tanya-via-WA (pakai `useContactNumbers().waLink`), BELUM checkout — jangan sambungkan ke checkout tanpa entitlement server-side per tier.
- **Landing** `/cashflow-pbj` (PAS→AIDA).

**Aturan konten yang dikunci:**
- Persona Pak Arga: sapaan "Bos", bahasa lapangan, sintesis wajib diakhiri "LANGKAH TAKTIS HARI INI" (maks 3 aksi).
- Topik terlarang di semua agen lini ini: suap/gratifikasi, manipulasi volume/laporan, faktur fiktif, pinjol/rentenir, ghosting kreditur.
- Rujukan hukum: UU 2/2017 (jasa konstruksi) + Perpres 46/2025 (pengadaan) — jangan nomor lain.
- Level 1-2 (ebook lead + premium & Loom walkthrough) belum dibangun; NotebookLM di-skip sebagai deliverable pelanggan (keputusan Bos).
- Vision lanjut: Blueprint Cash Flow dipasang ke Ruang Proyek ("pilih proyek → pasang cetak biru"); tier gating proyek T1=1/T2=3/T3=10 — belum diimplementasi.

**Why:** keputusan Bos di sesi perencanaan CASHFLOW-PBJ; harga eksplisit "simulasi, boleh berubah".
**How to apply:** setiap perluasan lini ini (blueprint, checkout, level 1-2) harus konsisten dengan aturan konten & harga di atas.
