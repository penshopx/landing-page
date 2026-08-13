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

export async function callClaude(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY belum diset");

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
