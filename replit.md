# Gustafta
Gustafta adalah **platform penyelesaian masalah berbasis AI** — bukan sekadar "AI chatbot builder". Termasuk sistem LexCom Legal AI terintegrasi.

Arsitektur dipisah menjadi 3 lapisan (jangan campur istilahnya):
1. **Layanan/Produk** (apa yang dipakai pengguna) — istilah membumi berbentuk "Ruang X" atau nama produk: Klinik Konsultasi, Akademi, Ruang Tender, Ruang Perizinan, Ruang Sertifikasi SKK, Ruang K3, dst. Lihat `client/src/lib/workroom-domains.ts` untuk daftar domain.
2. **Engine Gustafta** (bagaimana Gustafta bekerja, istilah teknis konsisten di semua produk): Dialog (memahami masalah) → Blueprint (cetak biru solusi) → Konfigurasi AI → Kolaborasi (tim AI/manusia menyempurnakan) → **Workroom** (eksekusi bertahap sampai tuntas, dengan gerbang persetujuan manusia ◆).
3. **Output** — dokumen, keputusan, AI, SOP, proposal, produk digital, pengetahuan baru.

Penting: **"Workroom" (istilah teknis engine) ≠ "Ruang X" (nama produk/domain)**. Jangan sebut tahap engine sebagai "Ruang Kerja" — itu bertabrakan makna dengan "Ruang Tender"/"Ruang Perizinan" dkk yang adalah produk, bukan tahapan proses.

Peta siklus 9 tahap jangka panjang (tidak semua tahap sudah diimplementasi): Masalah → Kesadaran → Dialog → Blueprint → Kolaborasi → Workroom → Produksi → Refleksi → Knowledge Baru.

## Run & Operate
- **Run Development Server**: `npm run dev`
- **Build**: `npm run build`
- **Typecheck**: `npm run check`
- **Run Tests**: `npx tsx --test tests/*.test.ts` (Node built-in `node:test`; tidak ada script `npm test`). Contoh regresi authz: `npx tsx --test tests/agent-authz-guard.test.ts`
- **Codegen (Drizzle)**: `npx drizzle-kit generate` · **DB Push**: `npx drizzle-kit push`
- **Environment Variables**: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY` (Midtrans, legacy)

## Stack
- **Frontend**: React 18 + TypeScript, Tailwind CSS, shadcn/ui, TanStack React Query, Vite, wouter
- **Backend**: Express 5 + TypeScript, Node.js (`tsx`), Drizzle ORM + Zod, PostgreSQL
- **Payment**: Scalev.id (menggantikan Midtrans)
- **AI Models**: OpenAI (gpt-4o-mini/gpt-4o/gpt-4-turbo/gpt-3.5-turbo), DeepSeek, Qwen, Google Gemini, Anthropic via proxy (claude-3-*), Custom

## Build & Deploy gotcha
- Build = `npx tsx script/build.ts` (vite client + esbuild server → `dist/index.cjs`, format cjs, minify). Start prod = `node dist/index.cjs`.
- **Dependensi ESM-murni (`"type":"module"`) yang di-import server WAJIB masuk `allowlist` di `script/build.ts`** agar di-inline esbuild. Kalau di-externalize, `require(ESM)` di bundle CJS produksi crash saat boot (`(0,x.default) is not a function`). Dev (tsx) tidak menunjukkan bug ini. Detail: `.agents/memory/esm-dep-prod-bundle-allowlist.md`.

## Where things live
Peta ringkas (rute → file → fungsi + endpoint utama). Detail mendalam ada di `docs/` dan `.agents/memory/` yang dirujuk tiap entri.

**Inti**
- **DB Schema**: `shared/schema.ts` (source of truth; `db/schema.ts` symlink)
- **API Routes**: `server/routes.ts` — Inter-Agent orchestration block ~line 2806, `callAgentInternal` v2 ~line 3926
- **Model Router**: `server/lib/model-router.ts` — `chooseModel(task)`/`callWithRouter()` (GPT-4o orchestration/vision, DeepSeek math/RAB, Gemini large docs, Qwen extraction)

**Legal (LexCom)**
- Config `server/lib/legal-agents.ts`; landing `legal-landing.tsx` (`/legal`), chat `legal-chat.tsx` (`/legal/chat`); widget `chaesa-widget.tsx`

**Builder & Blueprint**
- **Rakit Tim Agen (Trilogi)**: `tutor-builder.tsx` (`/tutor-builder`); chat `trilogi-chat.tsx` (`/trilogi-chat/:orchestratorId`)
- **Blueprint Engine**: engine `server/services/blueprint-engine/*`, skema `shared/blueprint/blueprint-schema.ts`, API `server/blueprint-engine-routes.ts` → `POST /api/blueprint/{start,answer,state,analyze,configure}` (stateless, `isAuthenticated`). `/configure` = satu-satunya jalur tulis, **safe-by-default `dryRun`** (tulis hanya bila `dryRun:false`); `create` men-stamp `ownerUserId`, `update` wajib pemilik/admin. UI `blueprint-builder.tsx` (`/blueprint-builder`). Detail: `docs/blueprint-engine/00-roadmap.md`, `.agents/memory/blueprint-engine-api.md`.
- **MultiClaw Planner**: `agentic-ai-panel.tsx`

**AI Tools standalone** (directory: `ai-tools-hub.tsx` `/ai-tools`)
- RAB Kalkulator: `rab-kalkulator.tsx` (`/rab-kalkulator`) → `POST /api/tools/rab-kalkulator`
- K3 Vision: `k3-vision.tsx` (`/k3-vision`) → `POST /api/tools/k3-vision` (GPT-4o Vision)
- Proposal Jasa: `proposal-jasa.tsx` (`/proposal-jasa`) → `POST /api/tools/proposal-jasa` (public, on-demand). Grounded via `buildSalesPlaybookDoc`+`buildGustaftaFoundationDoc` + harga kanonik; claw-aware (field `claw_rekomendasi` divalidasi ke katalog via `resolveClawPackageName()`). Tes: `tests/claw-packages.test.ts`.

**Marketing**
- **Pipeline harian**: `server/lib/research-feed.ts` → `runResearchSweep()` (terjadwal 06:30 WIB di `server/index.ts`). 4 tahap fire-and-forget: RISET → MATERI IKLAN → SEQUENCE RETENSI → AMUNISI JUALAN. Orkestrator "Kepala Tim Marketing". Semua draf, ◆ gerbang manusia. Detail: `docs/marketing-pipeline.md`.
- **MarketIntelligenceClaw (Sellable Premium)**: `market-intelligence-claw.tsx` (`/market-intelligence-claw`) → `GET /api/market-intelligence-claw/orchestrator`. Orkestrator gpt-4o (slug `market-intelligence-claw-orchestrator`) + 8 divisi paralel per fungsi (`server/seed-market-intelligence-claw.ts`). Hybrid: native claw + produk Premium siap jual (clone-per-pembeli, zero setup). **Seed gotcha**: `createAgent` mengabaikan `isListed`/`premiumClass` & pakai `aiModel` (bukan `model`) → seed pakai `aiModel` + `updateAgent` pasca-create, REKONSILIASI (bukan early-return). Detail: `.agents/memory/sellable-claw-seed.md`.

**Event Indobuildtech 2026**
- Landing `indobuildtech.tsx` (`/indobuildtech`, publik, co-branded ASDAMKINDO)
- **Jalur Bonus**: `bonus-indobuildtech.tsx` (`/bonus-indobuildtech`) — stepper 4 langkah (aktif kode akses → Dialog → Blueprint PDF + buat chatbot → testimoni). Progres UX di localStorage `gustafta_bonus_journey_v1` (langkah 1 & 4 diverifikasi server). Handoff Dialog→Blueprint via localStorage `gustafta_blueprint_prefill_v1`.
- **Testimoni**: tabel `event_testimonials` (`user_id` unique; `source` diturunkan server via `getUserEventSource`). Routes `POST /api/testimonials` (upsert, agentId hanya bila agen milik user — cegah IDOR), `GET /api/testimonials/{mine,featured}`, admin `GET/PATCH /api/admin/testimonials` + `export.csv` (sanitasi formula-injection).
- **Kode Akses (voucher)**: tabel `access_codes` + `access_code_redemptions` (unique `(code_id,user_id)`). Peserta `kode-akses.tsx` (`/kode-akses`) → `POST /api/access-codes/redeem`; admin `admin-access-codes.tsx` (`/admin/access-codes`). Redeem ATOMIK di `db-storage.ts` `redeemAccessCode()`, **TIDAK menyentuh `users.isActive`**. Kode ter-seed idempotent (`server/seed-event-access-codes.ts`): `INDOBUILDTECH-HADIR`/`INDOBUILDTECH-ONLINE`. Detail: `.agents/memory/access-code-voucher.md`.
- **Paket/Preset Konstruksi**: `paket-konstruksi.tsx` (`/paket-konstruksi`, kurasi claw); preset `?preset=konstruksi` di blueprint-builder (pre-fill saja).

**Klinik Konsultasi** (nama generik/pintu masuk umbrella; landing page & CTA navigasi antar-halaman tetap pakai "Klinik Konsultasi". Begitu masuk ke halaman domain spesifik, namanya jadi "Klinik + Domain" tanpa kata "Konsultasi" — mis. **Klinik Konstruksi** untuk `klinik-konsultasi.tsx`, dan pola sama untuk domain lain: Klinik Sertifikasi, Klinik Perijinan, dst.)
- Etalase loket: `klinik-konsultasi.tsx` (`/klinik-konsultasi`) — domain konstruksi, tampil sebagai "Klinik Konstruksi".
- **Loket Klinik Uji Kompetensi (jalur lengkap pertama)**: `klinik-uji-kompetensi.tsx` (`/klinik-uji-kompetensi`) — pipeline Dialog → Blueprint kesiapan (`POST /api/tools/klinik-ujikom/asesmen`, publik) → Chatbot teman belajar (handoff `gustafta_blueprint_prefill_v1` → blueprint-builder) → Ruang Ujian (reuse `/api/tools/simulator-uji-kompetensi/{soal,evaluasi}`) → skor kesiapan gabungan + ◆ keputusan manusia. Progres di localStorage `gustafta_klinik_ujikom_v1` (termasuk jawaban ujian), tanpa tabel baru.

**Tracker**: `test-tracker.tsx` (`/test-tracker`) — 6 tab (Tender/Federation/Pilot/KONSTRA/AI Tutor/SBUClaw)

## Architecture decisions
- **5-Level Modular Hierarchy**: Master → Series HUB → Sub-HUB → Specialist → Deep Specialist.
- **Two-Panel Dashboard Layout**: navigasi global terpisah dari konten terpilih.
- **Multi-Provider LLM Fallback**: OpenAI → DeepSeek → Qwen → Gemini.
- **Inter-Agent API v2 (L2.5)**: orkestrator memanggil sub-agen paralel via `callAgentInternal()` (timeout 25s, min 1500 maxTokens, history diteruskan). Hasil di-inject sebagai `LAPORAN SUB-AGEN`. SSE: `orchestrating_start`/`sub_agent_start`/`sub_agent_done`/`aggregating`. Config di jsonb `agenticSubAgents`.
- **FEDERATION_MODE v2 Guard**: seed cek marker `FEDERATION_MODE v2` agar tak menimpa prompt orkestrator yang sudah di-upgrade.

## Product
**Kerangka Produk (acuan resmi — 3 sumbu terpisah, jangan dicampur)**. Detail: `.agents/memory/gustafta-pricing-model.md`.
1. **Cara dapat chatbot (3 jalur)**: (a) **Biasa** (kosongan, user merakit) = lisensi standar + bulanan · (b) **Premium** (siap pakai, dibuat Gustafta/Creator) = lisensi premium + bulanan · (c) **Jasa Order** (custom) = setup sekali (termasuk lisensi) + bulanan. **Bulanan (hosting+token) untuk SEMUA produk, 100% ke Gustafta.** Beda biasa vs premium HANYA di lisensi. **Creator marketplace**: bagi hasil 80/20 dari LISENSI saja (bulanan tetap 100% Gustafta). Konstanta `MARKETPLACE`/`MARKETPLACE_INFO` di `pricing.ts`.
2. **Tier langganan platform (4)**: Starter → Profesional → Bisnis → Enterprise. Angka di `client/src/data/pricing.ts`, gating di `shared/feature-plans.ts`.
3. **Starter Kit = onboarding sekali bayar (Rp 245rb), BUKAN tier** (lisensi + panduan + trial 7 hari). Di jalur Jasa dibundel gratis (enablement, bukan lisensi kedua).

**Kelas Premium 1–4 (band harga LISENSI)**: sumber tunggal `shared/premium-classes.ts` (`resolveLicensePrice`, `DEFAULT_LICENSE_PRICE`=299rb). Band K1=1jt/K2=2,5jt/K3=5jt/K4=10jt. Harga lisensi = kolom `agents.licensePrice` (TERPISAH dari `agents.monthlyPrice`); harga efektif SELALU via `resolveLicensePrice()`. Enforcement berlapis (create route + PATCH + storage backstop). `mapAgentRow` WAJIB expose licenseClass+licensePrice. Marketplace 80/20 tercatat di `storeOrders`. UI `product-settings-panel.tsx`, badge `store.tsx`.

**Lainnya**
- **LexCom Legal AI**: 12 agen legal + widget "Chaesa Lexbot".
- **Federation Layer (131 hubs — COMPLETE)**: orkestrator + `agenticSubAgents`, SYNTHESIS/SCORECARD/T5-HANDOVER/F3-FALLBACK, MASTER STANDAR v2.0.
- **ABD v1.1 Upgrade (934/944 — COMPLETE)**: SBU(339)+SKK(53)+ASKOM/LSP(52)+Universal(609). Marker per kategori (`*_ABD_v1.1_UPGRADED`).
- **Mini Apps (43 types — COMPLETE)**: di `schema.ts` (`miniAppTypeSchema`) & `mini-apps-panel.tsx` (sinkron). 26 AI-powered (`/api/mini-app/:id/run`), 17 "basic" (template tanpa AI-run, by design).
- **Feature Access System**: plan-gated. Tiers `free`(0) `starter`(1) `profesional`(2) `bisnis`(3) `enterprise`(4). Source `shared/feature-plans.ts`, hook `use-feature-access.ts`, gate `feature-gate.tsx`. Admin aktivasi `POST /api/subscriptions/activate/:id`.
- **Dynamic Knowledge Base**, **Chatbot Templates & Gustafta Store** (marketplace publik + payment).

## MultiClaw Suite (85 halaman)
Semua pakai `PremiumPageGuard` feature="advanced_ai_tools" requiredPlan="profesional". SSE streaming, sub-agent dots, legend strip, 6 sample prompts. Endpoint tiap claw: `GET /api/{nama}-claw/orchestrator` → `{ id, name, tagline, avatar }`, primary lookup via `getAgentBySlug` (JANGAN hardcoded ID).
- **Paket Bidang (Kombinasi)**: `shared/claw-packages.ts` = 10 paket bidang (72 route) + `BASE_CLAW_ROUTES` (13 dasar Starter) = 85. Profesional pilih 2 paket (`PRO_PACKAGE_SLOTS`, terkunci setelah simpan, reset via `POST /api/admin/claw-packages/reset/:userId`); Bisnis/Enterprise buka semua. Gating di `PremiumPageGuard` via `packageForRoute()` (tanpa edit 85 halaman). API `GET /api/claw-packages/my`, `POST /api/claw-packages/select`. Kolom `users.selected_claw_packages`. UI `paket-bidang.tsx` (`/paket-bidang`), hook `use-claw-packages.ts`.
- **Tabel lengkap 85 route**: `docs/multiclaw-routes.md` (update di sana saat menambah/ubah claw).

## Whitelabel Partner Mode
- **Deteksi per host**: `use-partner-branding.ts` → `GET /api/partner/by-host?host=`. Pratinjau `?preview=<slug>` (paksa branding, abaikan host). Tabel `partners` (`host` unique, branding + kontak + `default_agent_id` + `hide_platform_branding`). Admin `admin-partners.tsx`.
- **Self-service partner-admin**: pengurus (email di `partners.admin_emails`) → `/partner` (`partner-dashboard.tsx`): kuota/kursi, top-up, atur branding sendiri via `PATCH /api/partner/me` (allowlist ketat — host/slug/kuota/kursi/model/defaultAgentId/adminEmails tetap admin Gustafta). String kosong = null; warna wajib hex.
- **Halaman partner-aware**: `partner-landing.tsx`, `shared-header.tsx`, `dialog-gustafta.tsx`, `dashboard.tsx`.
- **Aturan**: SEMUA halaman baru di host mitra WAJIB cek `usePartnerBranding()` sebelum menampilkan branding/upsell Gustafta. Uji lokal: insert row `partners` `host='localhost'`, hapus setelah selesai.

## Tender Data Relay (SIRUP)
- `sirup.lkpp.go.id` terblokir dari hosting ini (geo/IP); `isb.lkpp.go.id` reachable (butuh akun/token LKPP — jangka panjang).
- Sementara: **relay eksternal** `scripts/tender-relay.mjs` (dijalankan di server Indonesia) → `POST /api/tender-ingest` (header `x-tender-ingest-key` = secret `TENDER_INGEST_KEY`, timing-safe, batch maks 500, dedup per `tenderId`). Alert harian 08:00 WIB (`runTenderAlertNotification`) memakai tabel `tenders`.

## Gotchas
- **FEDERATION_MODE v2 marker**: tertanam di prompt DB orkestrator; seed mengeceknya. NEVER remove.
- **Agent Cache 5 min TTL**: restart server setelah bulk SQL update prompt/agenticSubAgents.
- **Dev server = plain `tsx` (tanpa watch)**: restart workflow "Start application" setelah ubah file server, atau route baru 404 ke SPA.
- **LexCom Admin Key**: upload KB admin butuh header `x-legal-admin-key`.
- **Disabled Agents**: `/api/chat/config/:agentId` & `/api/widget/config/:agentId` → 503 bila disabled.
- **callAgentInternal signature**: `(agentId, userMessage, conversationHistory?, timeoutMs=25000)` — v2.
- **Sub-agent maxTokens**: `Math.max(1500, Math.min(3000, subAgent.maxTokens ?? 1500))`.
- **FALLBACK template**: `[ASUMSI: {nilai} | basis: {regulasi/heuristik} | verifikasi-ke: {pihak}]`
- **agenticSubAgents JSON**: `[{"role":"KODE","agentId":123,"description":"..."}]`
- **Orchestrator routes**: SELALU `getAgentBySlug(slug)` primary lookup, JANGAN hardcoded ID (drift setelah re-seed → agen salah tanpa error).
- **Test Tracker localStorage**: `gustafta_test_tracker_v1` (Tender) · `gustafta_fed_tracker_v1` (Federation) · `gustafta_pilot_tracker_v1` (Pilot) · `gustafta_konstra_tracker_v1` (KONSTRA) · `gustafta_konstra_signoff_v1` (Sign-Off)

## User preferences
- Preferred communication style: Simple, everyday language.
- Bahasa komunikasi: Bahasa Indonesia (balas ke pengguna dalam Bahasa Indonesia).

## Replit setup (2026-07-09)
- Re-imported from GitHub `penshopx/Gustafta-V021` (initial import came in empty; content pulled from `main`).
- Workflow "Start application" runs `npm run dev`, serving on port 5000.
- Database: using Replit's built-in PostgreSQL; schema pushed via `npx drizzle-kit push`.
- Not yet configured: `OPENAI_API_KEY`/other AI provider keys, Scalev/Midtrans payment keys — app runs but AI chat and payment features need these.

## Replit setup (2026-07-11)
- Re-imported again; `node_modules` was missing (`tsx: not found`) — ran `npm install`, re-pushed DB schema, restarted workflow. Confirmed landing page renders.
- **Security fix**: `.replit` `[userenv.shared]` had `BREVO_API_KEY` and `SCALEV_API_KEY` stored as plaintext env vars (committed to git, exposed in repo history). Removed them from `.replit` and had the user re-enter them as proper Replit Secrets — **user was told to rotate both keys** on Brevo/Scalev dashboards since the old values leaked into git history.
- Secrets now configured: `SESSION_SECRET`, `BREVO_API_KEY`, `SCALEV_API_KEY`, `OPENAI_API_KEY`.

## Replit setup (2026-07-14)
- Re-imported again; `node_modules` missing (`tsx: not found`) — ran `npm install`, ran `npx drizzle-kit push` (fresh empty Postgres DB, all seed tables missing), restarted workflow. Landing page confirmed rendering.
- **Same plaintext-secret leak recurred**: `.replit` `[userenv.shared]` again had `BREVO_API_KEY` and `SCALEV_API_KEY` as plaintext values (re-introduced by a prior commit/import). Removed them from `.replit` again — they remain set as proper Replit Secrets. **User should rotate both keys** on Brevo/Scalev if not already done after the previous incident.
- `OPENAI_API_KEY` is not set in this environment — AI chat features won't work until it's added.

## Replit setup (2026-07-19)
- `node_modules` missing again (`tsx: not found`) — ran `npm install` (tsx v4.23.1 restored), ran `npx drizzle-kit push` (schema applied to fresh Replit PostgreSQL), restarted "Start application" workflow. Landing page confirmed rendering on port 5000.
- **Secrets currently set**: `SESSION_SECRET`, `BREVO_API_KEY`, `SCALEV_API_KEY`. Env vars (shared): `ADMIN_EMAILS`, `ADMIN_USER_IDS`, `BREVO_SENDER_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SUPERADMIN_EMAILS`.
- **Not yet set**: `OPENAI_API_KEY` (AI chat/embeddings won't work), `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `MIDTRANS_SERVER_KEY`/`MIDTRANS_CLIENT_KEY`, `TENDER_INGEST_KEY`.
- After any re-import: run `npm install`, then `npx drizzle-kit push`, then restart the "Start application" workflow.

## ⚠️ Secrets checklist — WAJIB setelah setiap re-import
**JANGAN pernah tempel API key ke `.replit` atau file apapun yang masuk git.**
Setelah re-import dari GitHub, atur ulang secrets berikut via **Replit Secrets** (bukan `[userenv.shared]`):

| Secret | Keterangan |
|--------|-----------|
| `BREVO_API_KEY` | Email OTP & notifikasi (Brevo dashboard) |
| `SCALEV_API_KEY` | Payment gateway (Scalev dashboard) |
| `SESSION_SECRET` | Cookie signing — buat string acak baru |
| `OPENAI_API_KEY` | AI chat & embeddings |
| `GEMINI_API_KEY` | Gemini model fallback |
| `DEEPSEEK_API_KEY` | DeepSeek model fallback |
| `TENDER_INGEST_KEY` | Relay SIRUP tender data |

**Jika key pernah masuk git history** (pernah ada di `.replit [userenv.shared]`): rotate key tersebut di dashboard masing-masing — BREVO (`xkeysib-...`) dan Scalev (`sk_...`) — agar nilai lama di history git tidak bisa dipakai lagi.
