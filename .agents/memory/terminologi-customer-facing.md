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
