// ============================================================
// Anthropic (Claude) helper — KHUSUS untuk "membangun otak" agen:
// men-generate atau menyempurnakan system prompt. TIDAK dipakai
// untuk chat harian (chat tetap lewat model-router.ts).
// Sengaja memakai fetch langsung (tanpa SDK) agar tidak menambah
// dependency baru ke bundle produksi.
// ============================================================

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

export function anthropicAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// Fallback: Claude via OpenRouter (kunci sudah ada di proyek). Dipakai bila
// ANTHROPIC_API_KEY kosong/ditolak — atas permintaan eksplisit user (Aug 2026).
const OPENROUTER_CLAUDE_MODEL = process.env.OPENROUTER_CLAUDE_MODEL || "anthropic/claude-sonnet-4.5";

async function callClaudeViaOpenRouter(opts: {
  system: string; user: string; maxTokens?: number; temperature?: number;
}): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Tidak ada kunci yang bisa dipakai (ANTHROPIC_API_KEY dan OPENROUTER_API_KEY tidak tersedia/valid)");
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: OPENROUTER_CLAUDE_MODEL,
      max_tokens: opts.maxTokens ?? 2500,
      temperature: opts.temperature ?? 0.6,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`OpenRouter error ${resp.status}: ${t.slice(0, 300)}`);
  }
  const json: any = await resp.json();
  const text = String(json?.choices?.[0]?.message?.content || "").trim();
  if (!text) throw new Error("OpenRouter mengembalikan jawaban kosong");
  return text;
}

export async function callClaude(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.warn("[anthropic] ANTHROPIC_API_KEY kosong — pakai Claude via OpenRouter");
    return callClaudeViaOpenRouter(opts);
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: opts.maxTokens ?? 2500,
      temperature: opts.temperature ?? 0.6,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    if (resp.status === 401 || resp.status === 403) {
      // Kunci Anthropic ditolak — fallback ke Claude via OpenRouter (kunci proyek yang sudah ada).
      console.warn(`[anthropic] kunci ditolak (${resp.status}) — pakai Claude via OpenRouter`);
      return callClaudeViaOpenRouter(opts);
    }
    throw new Error(`Anthropic error ${resp.status}: ${t.slice(0, 300)}`);
  }
  const json: any = await resp.json();
  const text = (json?.content || [])
    .filter((b: any) => b?.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("Anthropic mengembalikan jawaban kosong");
  return text;
}
