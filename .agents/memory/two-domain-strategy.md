---
name: Strategi dua domain Gustafta × dokumenproyek
description: Pembagian peran gustafta.my.id vs dokumenproyek.com yang sudah disepakati Bos (Agustus 2026)
---

# Strategi dua domain (KEPUTUSAN BOS — final)

- **gustafta.my.id = platform/rumah besar.** Semua produk AI, ebook, toolkit, ruang-ruang, akun pelanggan, database. Terus dilengkapi di sini.
- **dokumenproyek.com = etalase Gustafta + produk unik sendiri**: jasa pengurusan dokumen yang dikerjakan MANUSIA (SBU, NIB, SKK, ISO). Jasa manusia TIDAK dijual di Gustafta; produk digital/AI TIDAK di-host di dokumenproyek.

**Why:** transfer produk antar app berisiko konflik data (2 database, nama fitur beda); satu database = satu login = satu kebenaran.

**How to apply:**
- dokumenproyek TIDAK boleh punya database pelanggan/login sendiri — hanya halaman marketing + tombol WA; semua link produk menunjuk langsung ke gustafta.my.id.
- Pembayaran jasa tetap via bayar.dokumenproyek.com (Scalev) — lihat payment-domain-migration.md.
- Halaman jasa manusia di Gustafta (/jasa-dokumen, /jasa-keuangan) menaut ke dokumenproyek.com (ada task antrean untuk ini).
- Ganti nama domain = keputusan merek, ditunda; JANGAN pasang 2 domain untuk 1 app yang sama (SEO kembar + cookie).

# Rak digital "Ebook & Toolkit"

- Halaman /ebook-toolkit; sumber data tunggal client/src/data/digital-products.ts (harga tetap dari pricing.ts).
- Ebook selalu 2 jenjang: tier "lead" (pancingan gratis, unduh langsung) + "premium" (berbayar, PDF terkunci password, dikirim ke pembeli — bukan file publik). Bos akan terus produksi ebook baru: cukup tambah entri data.
