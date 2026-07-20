---
name: Ruang Simpan governance layer
description: Document lifecycle, Kuasa Digital (access grants), and audit trail added to Ruang Simpan — schema, API, and UI.
---

## What was built

Three new governance tables run DDL idempotently inside `registerRuangSimpanRoutes` (now async):
- `ruang_simpan_files.doc_status` — TEXT column with CHECK (draft/aktif/kadaluarsa/arsip), default aktif
- `ruang_simpan_access_grants` — time-limited access grants to external parties (biro jasa, konsultan)
- `ruang_simpan_access_log` — every download, grant creation, revocation, and status change logged

## API endpoints added

- `GET /api/ruang-simpan/files/:id/passport` — Document Passport: file info + access log + grants + stats
- `POST /api/ruang-simpan/files/:id/grants` — Beri Kuasa Digital (grantee_name, purpose, permissions, expires_days)
- `GET /api/ruang-simpan/files/:id/grants` — list grants for owner
- `DELETE /api/ruang-simpan/files/:id/grants/:grantId` — Cabut Kuasa
- `PATCH /api/ruang-simpan/files/:id` — updated to include doc_status field; logs status_change events

Download endpoint logs access to ruang_simpan_access_log (fire-and-forget).

## Frontend changes

- `RSFile` interface: added `doc_status` field
- New interfaces: `RSGrant`, `RSAccessLogEntry`, `RSPassport`
- `docStatusBadge()` helper: colored badge per status
- `FileCard`: shows doc_status badge next to kbBadge
- `FileDetailDialog`: two tabs — "Info" (existing) and "Paspor Dokumen" (new)
  - Paspor tab: stats (downloads, active grants, log count), active grants list with revoke, collapsed access log
  - Status lifecycle selector in Edit mode on Info tab
  - "Beri Kuasa Digital" button opens `GrantModal`
- `GrantModal`: new standalone component — name, email, purpose, permissions (view/download), expires_days selector

## Why
Design principle from ChatGPT discussion: "Gustafta tidak memiliki dokumen klien; klien memiliki, Gustafta mengatur akses." The kuasa digital model is the technical backbone of the biro jasa operator promise.

## How to apply
- All DDL is idempotent — safe to deploy; production will auto-migrate on restart
- For new governance features, add to `server/ruang-simpan-routes.ts` and update RSFile type in the tsx page
- Access log should be written fire-and-forget (never block the response path)
