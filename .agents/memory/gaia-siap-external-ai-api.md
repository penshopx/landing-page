---
name: Gaia SIAP external AI API
description: Kontrak & keputusan desain POST /api/v1/ai/assist (server-to-server, Bearer GAIA_SIAP_API_KEY)
---

- Satu-satunya external AI endpoint resmi: `POST /api/v1/ai/assist` (server/gaia-siap-api.ts), kontrak di docs/gaia-siap-ai-api.md. JSON in/out, TANPA SSE (V1).
- **Fail-closed by design:** tanpa env `GAIA_SIAP_API_KEY` semua request → 503 `service_not_configured`. Jangan pernah membuat key default/dummy.
- Auth: Bearer, dibandingkan constant-time (sha256 + timingSafeEqual). Cek secret DULU, baru auth → tanpa secret, 503 selalu menang atas 401/400.
- Reuse infra existing, bukan jalur chat: `runGuardedDialog` + `dialogChatCompletion` (fallback lintas-provider). JANGAN pernah routing lewat /api/messages atau /api/dialog-gustafta.
- **Why:** ChatGPT (arsitek bisnis) menetapkan Gaia SIAP = client resmi, bukan user menyamar agen publik; endpoint harus stabil & terpisah dari chat engine.
- Guard ukuran body harus PRA-PARSE di server/index.ts (256KB, pola sama dengan /api/tender-ingest) — parser global 50mb, validasi field saja tidak cukup (review menemukan DoS via field asing raksasa). Validasi juga MENOLAK field di luar 4 field kontrak.
- Error handler global tidak boleh log err.body (body-parser menaruh RAW BODY di err.body pada JSON rusak → bocor prompt ke log). Sudah disanitasi di server/index.ts.
- Rate limit: shared Postgres store key `gaia-siap:assist`, default 60/menit (env GAIA_SIAP_RATE_LIMIT_PER_MIN), fallback in-memory.
- Tes regresi: tests/gaia-siap-assist.test.ts (semua jalur 4xx/503; jalur 200 sengaja tidak dites otomatis agar bebas provider eksternal).
- Setelah key terpasang: JANGAN langsung integrasi ke Gaia SIAP — kirim kontrak ke ChatGPT dulu untuk dicocokkan dengan callAiService() (Phase 1B).
