---
name: Dual public Help Desk identity
description: Durable identity boundary between construction consultation and Gustafta platform guidance.
---
Aturan: Help Desk Pekerjaan dan Panduan Gustafta adalah dua agen kanonik yang berbeda. Agen pekerjaan mempertahankan identitas lama untuk kompatibilitas; agen panduan tidak boleh memakai fallback nama lama.

ID publik hanya boleh dimiliki satu identitas. Klaim ID harus atomik dan dilakukan sebelum metadata/pesan dilayani atau konten agen direkonsiliasi. Semua jalur slug maupun numeric ID harus gagal tertutup bila registry bertentangan atau kesiapan agen tidak valid.

**Why:** label UI saja tidak membatasi prompt. ID historis atau request bersamaan dapat mencampur dua persona, membocorkan scope yang salah, atau menghidupkan kembali agen yang sengaja dinonaktifkan.

**How to apply:** pertahankan slug, namespace registry, metadata cache key, session ID, state stream, dan lifecycle pembatalan yang terpisah. Resolver publik harus memvalidasi identitas serta status terkini; jangan memilih agen berdasarkan nama mutable.