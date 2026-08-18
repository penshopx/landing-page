---
name: Floating chatbot single owner
description: Global floating help chat is ChaesaWidget in App.tsx; never mount per-page floating chats.
---
Aturan: satu-satunya floating chatbot publik adalah `ChaesaWidget`, dirender global di `AppContent` (App.tsx) untuk semua path non-partner kecuali `WIDGET_EXCLUDED_PATHS`.
**Why:** per-page `ChatPopup`/`DialogGustaftaWidget` menumpuk dengan Chaesa di pojok kanan bawah (dua tombol chat bertindih) — ditemukan di pricing/documentation/subscription/sector-landing dan sudah dibersihkan (Agu 2026).
**How to apply:** butuh chat di halaman baru? Tidak perlu apa-apa — Chaesa sudah global. Dialog Gustafta tetap produk terpisah dengan halamannya sendiri, jangan dijadikan widget lagi.
