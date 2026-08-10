# Product Registry — Dokumentasi Internal

Gustafta = MASTER product database (source of truth). GAIA nantinya hanya DISPLAY/DISCOVER/SELL/ORDER.

## Tabel: `product_registry` (shared/schema.ts)
- `product_id` (GST-XXX-NNN) — PERMANEN, tidak pernah berubah walau nama/versi berganti.
  - `GST-CAP-0xx` = capability existing Gustafta (di-seed idempotent saat boot di `server/index.ts`).
- `product_type` — 20 tipe: AI_SPECIALIST, AI_WORKSPACE, DIGITAL_WORKSPACE, DOCUMENT_AI, DIGITAL_TOOL, MINI_APP, GENERATOR, ASSESSMENT, KNOWLEDGE_PRODUCT, EBOOK, MODULE, TEMPLATE, CHECKLIST, BUSINESS_KIT, E_COURSE, DIGITAL_CONSULTATION, DOCUMENT_TOOL, KNOWLEDGE, PRODUCTIVITY_TOOL, OTHER_DIGITAL_PRODUCT.
- `status` — DRAFT | ACTIVE | PAUSED | ARCHIVED | DEPRECATED (soft, tanpa hard delete).
- `visibility` — INCLUDED_ONLY | STANDALONE_ONLY | INCLUDED_AND_STANDALONE | INTERNAL_ONLY | DP_ONLY.
- Flags: `standalone_enabled`, `subscription_enabled`, `gaia_enabled`, `dp_enabled`, `ai_enabled`.
- `usage_profile` (jsonb) — subset dari: AI_CHAT, DOCUMENT_ANALYSIS, DOCUMENT_GENERATION, KNOWLEDGE_PROCESSING, AGENT_EXECUTION, STORAGE. Phase 1 = konfigurasi saja, belum billing token.
- `version` — semver produk; naik via endpoint version (product_id tetap).

## API (admin-only: role admin/superadmin) — `server/gaia-registry.ts`
- `GET/POST /api/admin/registry/products`, `PATCH /:id`
- `POST /:id/duplicate | /archive | /restore | /version | /publish`
- `GET /:id/validate | /payload`, `GET /export-history`

## Capability existing yang terpetakan (visibility INCLUDED_ONLY)
Peta Jalan Mulai, Klinik Konsultasi, Bedah Dokumen, Brain Project, Ekosistem Kompetensi,
Toolkit, Mitra, Ruang Kelola, Ruang Simpan, Jasa Dokumen, Jasa Keuangan, Bimtek SKK,
Executive Summary, Produk AI/AI Specialist. Tidak otomatis jadi produk standalone.

## UI Admin
`/admin/registry` (`client/src/pages/admin-registry.tsx`) — tab Products, Solutions, Sectors, Tiers, Packages, Access Matrix, GAIA Publishing.
