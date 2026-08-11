// ─────────────────────────────────────────────────────────────────────────────
// GAIA SIAP EXTERNAL AI API — Task #306 (Opsi B dari AI API Discovery)
//
// SATU endpoint server-to-server resmi agar aplikasi eksternal Gaia SIAP bisa
// memakai mesin AI Gustafta tanpa menyamar sebagai agen publik:
//
//   POST /api/v1/ai/assist
//   Authorization: Bearer <GAIA_SIAP_API_KEY>
//   { prompt, context?, case_id?, system_instruction? }  →  { response, suggestions: [] }
//
// Prinsip:
// - ADITIF: tidak menyentuh /api/messages*, /api/dialog-gustafta*, catalog,
//   store, maupun package/order system.
// - FAIL-CLOSED: bila secret GAIA_SIAP_API_KEY belum terpasang di environment,
//   endpoint menolak semua request (503) — tidak ada key default/palsu.
// - Reuse infra existing: dialogChatCompletion (fallback lintas-provider,
//   timeout 25 dtk per provider) + runGuardedDialog (gerbang konkurensi) +
//   PostgresRateLimitStore (rate limit bersama lintas-instance autoscale).
// - JSON in/out, TANPA streaming (V1 sesuai keputusan).
// - Logging aman: tidak pernah menulis API key, provider secret, atau isi
//   prompt ke log — hanya metadata (case_id, status, latency).
// ─────────────────────────────────────────────────────────────────────────────
import type { Express, Request, Response } from "express";
import { timingSafeEqual, createHash } from "crypto";
import {
  runGuardedDialog,
  dialogChatCompletion,
  DialogBusyError,
} from "./lib/dialog-load-guard";
import {
  PostgresRateLimitStore,
  InMemoryRateLimitStore,
  type RateLimitStore,
} from "./lib/rate-limiter";

// ── Batas & konfigurasi (env-overridable, tanpa redeploy logika) ─────────────
const MAX_PROMPT_CHARS = 8_000;
const MAX_CONTEXT_CHARS = 24_000;
const MAX_SYSTEM_CHARS = 8_000;
const MAX_CASE_ID_CHARS = 120;
const RATE_LIMIT_PER_MIN = (() => {
  const n = parseInt(process.env.GAIA_SIAP_RATE_LIMIT_PER_MIN ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 60;
})();
const RATE_WINDOW_MS = 60_000;

// Rate limit dihitung di store BERSAMA (PostgreSQL) supaya konsisten di
// deployment autoscale; fallback in-memory bila DB bermasalah (proteksi
// terdegradasi per-instance tapi endpoint tetap hidup).
const sharedStore: RateLimitStore = new PostgresRateLimitStore(async (text, params) => {
  const { pool } = await import("./db");
  return pool.query(text, params);
});
const memoryFallback = new InMemoryRateLimitStore();

// ── Auth helpers ─────────────────────────────────────────────────────────────
const configuredKey = () => (process.env.GAIA_SIAP_API_KEY || "").trim();

/** Perbandingan constant-time; hash dulu agar panjang selalu sama. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function extractBearer(req: Request): string {
  const h = String(req.headers.authorization || "");
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

// ── Validation ───────────────────────────────────────────────────────────────
type AssistBody = {
  prompt: string;
  context?: string;
  case_id?: string;
  system_instruction?: string;
};

function validateBody(body: any): { ok: true; data: AssistBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Body harus berupa objek JSON." };
  }
  const ALLOWED = ["prompt", "context", "case_id", "system_instruction"];
  const unknown = Object.keys(body).filter((k) => !ALLOWED.includes(k));
  if (unknown.length) {
    return { ok: false, error: `Field tidak dikenal: ${unknown.slice(0, 5).join(", ")}. Hanya: ${ALLOWED.join(", ")}.` };
  }
  const { prompt, context, case_id, system_instruction } = body;
  if (typeof prompt !== "string" || !prompt.trim()) {
    return { ok: false, error: "Field 'prompt' wajib berupa string tidak kosong." };
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return { ok: false, error: `Field 'prompt' melebihi ${MAX_PROMPT_CHARS} karakter.` };
  }
  for (const [name, val, max] of [
    ["context", context, MAX_CONTEXT_CHARS],
    ["case_id", case_id, MAX_CASE_ID_CHARS],
    ["system_instruction", system_instruction, MAX_SYSTEM_CHARS],
  ] as const) {
    if (val !== undefined && typeof val !== "string") {
      return { ok: false, error: `Field '${name}' harus berupa string.` };
    }
    if (typeof val === "string" && val.length > max) {
      return { ok: false, error: `Field '${name}' melebihi ${max} karakter.` };
    }
  }
  return { ok: true, data: { prompt, context, case_id, system_instruction } };
}

// case_id boleh muncul di log — bersihkan agar tak bisa menyuntik newline/kontrol.
const logSafe = (s: unknown) =>
  (typeof s === "string" && s ? s : "-").replace(/[^\w.:\/-]/g, "_").slice(0, MAX_CASE_ID_CHARS);

// ── Route registration ───────────────────────────────────────────────────────
export function registerGaiaSiapAiRoutes(app: Express) {
  if (!configuredKey()) {
    console.warn(
      "[gaia-siap-api] GAIA_SIAP_API_KEY belum terpasang — /api/v1/ai/assist FAIL-CLOSED (503) sampai secret dipasang via environment.",
    );
  }

  app.post("/api/v1/ai/assist", async (req: Request, res: Response) => {
    const startedAt = Date.now();
    const caseIdForLog = logSafe(req.body?.case_id);
    const done = (status: number, payload: any) => {
      console.log(
        `[gaia-siap-api] assist case_id=${caseIdForLog} status=${status} latency_ms=${Date.now() - startedAt}`,
      );
      return res.status(status).json(payload);
    };

    try {
      // 1. FAIL-CLOSED bila secret belum dipasang.
      const key = configuredKey();
      if (!key) {
        return done(503, {
          error: "service_not_configured",
          message: "Endpoint belum aktif: GAIA_SIAP_API_KEY belum dipasang di environment server.",
        });
      }

      // 2. Bearer auth (constant-time compare).
      const presented = extractBearer(req);
      if (!presented || !safeEqual(presented, key)) {
        return done(401, { error: "unauthorized", message: "API key tidak valid." });
      }

      // 3. Rate limit per klien (shared store, fallback in-memory).
      const now = Date.now();
      let hit;
      try {
        hit = await sharedStore.hit("gaia-siap:assist", RATE_WINDOW_MS, now);
      } catch {
        hit = await memoryFallback.hit("gaia-siap:assist", RATE_WINDOW_MS, now);
      }
      if (hit.count > RATE_LIMIT_PER_MIN) {
        const retryAfterSec = Math.max(1, Math.ceil((hit.resetAt - now) / 1000));
        res.setHeader("Retry-After", String(retryAfterSec));
        return done(429, {
          error: "rate_limited",
          message: "Batas permintaan per menit tercapai. Coba lagi sebentar lagi.",
          retryAfter: retryAfterSec,
        });
      }

      // 4. Validasi input.
      const v = validateBody(req.body);
      if (!v.ok) return done(400, { error: "invalid_request", message: v.error });
      const { prompt, context, system_instruction } = v.data;

      // 5. Panggil AI router existing di bawah gerbang konkurensi.
      const userContent = context ? `${context.trim()}\n\n---\n\n${prompt.trim()}` : prompt.trim();
      let answer: string;
      try {
        answer = await runGuardedDialog(() =>
          dialogChatCompletion({
            system: system_instruction?.trim() || undefined,
            messages: [{ role: "user", content: userContent }],
            maxTokens: 1200,
            temperature: 0.4,
          }),
        );
      } catch (err) {
        if (err instanceof DialogBusyError) {
          res.setHeader("Retry-After", "5");
          return done(503, {
            error: "busy",
            message: "Layanan AI sedang penuh. Coba lagi sebentar lagi.",
          });
        }
        // Semua provider gagal / timeout — JANGAN bocorkan detail internal.
        console.error(
          `[gaia-siap-api] assist case_id=${caseIdForLog} provider_error=${(err as Error)?.name || "unknown"}`,
        );
        return done(502, {
          error: "ai_unavailable",
          message: "Layanan AI sedang tidak dapat memproses permintaan. Coba lagi nanti.",
        });
      }

      // 6. Kontrak respons V1 (suggestions disediakan untuk kompatibilitas maju).
      return done(200, { response: answer, suggestions: [] });
    } catch (err) {
      console.error(
        `[gaia-siap-api] assist case_id=${caseIdForLog} unexpected_error=${(err as Error)?.name || "unknown"}`,
      );
      return done(500, { error: "internal_error", message: "Terjadi kesalahan internal." });
    }
  });
}
