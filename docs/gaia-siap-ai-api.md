# Gustafta External AI API — Kontrak untuk Gaia SIAP (V1)

## URL

```
POST https://gustafta.my.id/api/v1/ai/assist
```

Server-to-server saja (backend Gaia SIAP → Gustafta). JANGAN dipanggil dari browser/frontend — API key tidak boleh sampai ke client. Tidak ada CORS yang dibuka untuk endpoint ini.

## Authentication

```
Authorization: Bearer <GAIA_SIAP_API_KEY>
Content-Type: application/json
```

- Secret di sisi Gustafta: env `GAIA_SIAP_API_KEY` (fail-closed: tanpa secret, endpoint membalas 503 `service_not_configured`).
- Secret di sisi Gaia SIAP: simpan sebagai env server (mis. `GUSTAFTA_API_KEY`), nilainya sama.

## Request schema

| Field | Tipe | Wajib | Batas | Keterangan |
|---|---|---|---|---|
| `prompt` | string | ya | ≤ 8.000 char | Pertanyaan/instruksi utama |
| `context` | string | tidak | ≤ 24.000 char | Konteks kasus (digabung di depan prompt) |
| `case_id` | string | tidak | ≤ 120 char | ID kasus Gaia SIAP — ikut dicatat di log Gustafta |
| `system_instruction` | string | tidak | ≤ 8.000 char | Instruksi sistem/persona |

## Response schema (200)

```json
{ "response": "string", "suggestions": [] }
```

`suggestions` selalu array (V1 selalu kosong; disediakan untuk kompatibilitas maju).

## Error codes

| HTTP | `error` | Arti |
|---|---|---|
| 400 | `invalid_request` | Field hilang/tipe salah/melebihi batas (pesan menjelaskan field-nya) |
| 401 | `unauthorized` | Bearer hilang atau salah |
| 400 | `invalid_request` | Field di luar `prompt`, `context`, `case_id`, `system_instruction` ditolak |
| 413 | `payload_too_large` | Body > 256KB (ditolak sebelum JSON di-parse) |
| 429 | `rate_limited` | > 60 request/menit (override: env `GAIA_SIAP_RATE_LIMIT_PER_MIN`); header `Retry-After` |
| 502 | `ai_unavailable` | Semua provider AI gagal/timeout |
| 503 | `service_not_configured` | Secret belum dipasang di Gustafta |
| 503 | `busy` | Gerbang konkurensi penuh; header `Retry-After: 5` |
| 500 | `internal_error` | Kesalahan tak terduga (tanpa detail internal) |

## Contoh

Request:

```bash
curl -X POST https://gustafta.my.id/api/v1/ai/assist \
  -H "Authorization: Bearer $GUSTAFTA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Sebutkan dokumen utama tender konstruksi.",
    "context": "User adalah kontraktor kecil yang baru pertama ikut tender.",
    "case_id": "case-2026-0001",
    "system_instruction": "Jawab singkat dalam bahasa Indonesia."
  }'
```

Response:

```json
{ "response": "Dokumen utama tender konstruksi meliputi ...", "suggestions": [] }
```

## Catatan implementasi (sisi Gustafta)

- Kode: `server/gaia-siap-api.ts` (didaftarkan di `server/routes.ts`). ADITIF — tidak menyentuh `/api/messages*`, `/api/dialog-gustafta*`, Catalog API, Store, atau package/order.
- AI routing memakai infra existing: fallback lintas-provider (OpenAI → DeepSeek → Qwen → OpenRouter → Nvidia → Gemini), timeout 25 dtk per provider, gerbang konkurensi bersama.
- Rate limit dihitung di store bersama PostgreSQL (aman untuk deployment autoscale), fallback in-memory bila DB bermasalah.
- Logging aman: hanya `case_id` (disanitasi), status, dan latency. API key, provider secret, dan isi prompt tidak pernah ditulis ke log.
- V1 tanpa streaming (JSON in/out). SSE = kandidat V2 bila dibutuhkan.
