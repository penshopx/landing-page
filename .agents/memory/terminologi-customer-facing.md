---
name: Terminologi customer-facing
description: Aturan penggantian kata "chatbot" di semua halaman yang dilihat pelanggan
---

## Aturan

| Konteks | Kata lama | Kata baru |
|---|---|---|
| Asisten individual di landing/pricing | chatbot | Asisten AI |
| Produk di Store / Claw | chatbot | AI Specialist |
| Store footer/nav | Chatbot Store | AI Specialist Store |
| Add-on pricing | Chatbot Tambahan | Asisten AI Tambahan |
| Fitur "di dalam" asisten | di dalam chatbot | di dalam Asisten AI |
| FAQ teknis (menjelaskan arsitektur) | chatbot hub level 3 | boleh tetap (konteks teknis) |
| Kode internal (variabel, interface) | chatbotPackages, getChatbotTier | tetap (tidak customer-facing) |

## Halaman yang sudah diupdate
- `client/src/pages/landing.tsx` — 15 penggantian
- `client/src/pages/pricing.tsx` — 12 penggantian
- `client/src/pages/onboarding.tsx` — 1 penggantian (FEATURE_NAMES.chatbot)

## Halaman yang BELUM disentuh (perlu audit lanjutan)
- Halaman vertikal individual (claw pages, biro-jasa-sbu.tsx, dll.)
- component-level copy (store cards, agent-landing.tsx)

**Why:** Positioning Gustafta = "Platform AI Specialist" bukan "platform chatbot". Kata "chatbot" membawa konotasi mainan/customer service sederhana, tidak mencerminkan kedalaman domain konstruksi.

**How to apply:** Setiap kali menulis copy baru untuk halaman customer-facing, default ke "Asisten AI". Hanya gunakan "AI Specialist" ketika merujuk produk tertentu di Store atau Claw suite.

## Nama fitur harus unik (keputusan pemilik, Agu 2026)
- "Ekosistem Kompetensi" HANYA untuk domain publik sertifikasi SKK/BNSP & bimtek → /kompetensi-hub (route /ekosistem-kompetensi TIDAK ADA — jangan dipakai sebagai href).
- Panel dashboard ekspor produk belajar dari chatbot (eBook/eCourse/Generator/Chaesa) bernama "Studio Belajar" (id internal tetap `ekosistem`).
- **Why:** pemilik menolak dua fitur berbeda memakai nama sama ("jangan membuat fitur dengan nama berbeda tetapi sama" dan sebaliknya). Grid navigasi landing kini memberi 1 baris deskripsi pembeda per fitur + chip "Mini Apps" → /dashboard.

## Nama fitur (keputusan pemilik, Agu 2026 — lanjutan)
- "Ruang Kelola" → **"Radar Legalitas"** (route tetap /ruang-kelola). Jangan hidupkan lagi nama lama di copy pelanggan.
- Fitur "Executive Summary" → bernama **"PKB-PUB"** (route tetap /executive-summary); frasa "executive summary" boleh tetap sebagai istilah generik hasil dokumennya.
- **"Asisten AI"** = fitur unggulan tersendiri di halaman utama + landing /asisten-ai (2 bentuk: AI Spesialis vs AI Claw); tetap bagian katalog Produk.
- Keputusan arah: SEMUA fitur halaman utama berbayar (mini-ebook lead magnet satu-satunya gratis — alat iklan, bukan fitur).
