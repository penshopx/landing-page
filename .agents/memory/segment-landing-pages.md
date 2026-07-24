---
name: Landing page segmen
description: 4 halaman solution-selling per segmen pasar + portal SKK interaktif
---

## Halaman yang ada

| Route | File | Segmen | Warna |
|---|---|---|---|
| /kontraktor | solusi-kontraktor.tsx | Kontraktor | amber/orange |
| /biro-jasa | solusi-biro-jasa.tsx | Biro Jasa | violet/purple |
| /konsultan-iso | solusi-konsultan-iso.tsx | Konsultan ISO/SMK3 | teal/emerald |
| /skk | portal-skk.tsx | Ekosistem SKK (5 sub-segmen) | emerald/green |

## Arsitektur portal-skk.tsx
- State `activeSegment` (useState): asesi | asesor | lsp | tuk | perusahaan
- Setiap segmen punya: headline, pain points, AI Specialist cards
- 8 tools SKK di bagian bawah (lintas segmen)
- CTA utama → /skk-coach-landing

## Nav header
- `navSolusi` array di shared-header.tsx: 4 link
- Desktop: baris ke-2 (antara navRow1 dan navRow2), background emerald-50, label "SOLUSI UNTUK:"
- Mobile: termasuk dalam allNavItems (prepend sebelum navRow1)

## Pola copywriting per halaman
- PAS (Problem → Agitate → Solution)
- Pain points spesifik per segmen (bukan generik)
- AI Specialist relevan ditampilkan, bukan semua AI
- CTA ganda: Store + WA Konsultasi

**Why:** Strategi dari diskusi: "ekosistem → masalah → AI Specialist → platform" bukan "produk → pasar".
SEO: setiap halaman punya URL, copy, dan pain point khusus segmen → Google menyukai pola ini.

**How to apply:** Tambah segmen baru? Buat file `solusi-<segmen>.tsx`, register route di App.tsx, tambah ke navSolusi di shared-header.tsx.
