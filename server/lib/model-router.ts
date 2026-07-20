import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

/**
 * MODEL ROUTER — Smart-Standard Multi-Provider LLM Routing
 *
 * Kualitas diutamakan: setiap task memilih model CERDAS, dengan diversifikasi
 * provider agar beban token tersebar (bila OpenAI habis, ada DeepSeek/Qwen/Gemini).
 *   general       → gpt-4o → DeepSeek Chat → Qwen Plus
 *   orchestration → DeepSeek Chat → Qwen Plus → gpt-4o
 *   math_rab      → DeepSeek Chat → Qwen Plus → gpt-4o
 *   data_extract  → DeepSeek Chat → Qwen Plus → gpt-4o
 *   large_doc     → Gemini 2.5 Pro → Qwen Plus → gpt-4o
 *   vision        → gpt-4o
 *
 * SEMUA tier "cerdas" — TIDAK ada gpt-4o-mini / qwen-turbo / gemini-flash.
 *
 * FALLBACK: bila provider pertama gagal (rate-limit, 5xx, timeout), otomatis
 * mencoba provider berikutnya dalam rantai. Pengguna tidak melihat error —
 * mereka tetap mendapat respons. Provider yang dipakai di-log untuk observabilitas.
 */

export type TaskType =
  | "orchestration"
  | "vision"
  | "math_rab"
  | "data_extraction"
  | "large_doc"
  | "general";

export interface RouterChoice {
  provider: "openai" | "gemini" | "deepseek" | "qwen";
  model: string;
  reason: string;
}

const hasOpenAI   = () => !!process.env.OPENAI_API_KEY;
const hasQwen     = () => !!process.env.QWEN_API_KEY;
const hasDeepSeek = () => !!process.env.DEEPSEEK_API_KEY;
const hasGemini   = () => !!(process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY);

/** Returns the ordered fallback chain for a task. First entry = preferred provider. */
export function buildFallbackChain(task: TaskType): RouterChoice[] {
  switch (task) {

    case "vision":
      // Only GPT-4o supports vision; no meaningful fallback.
      return [
        { provider: "openai", model: "gpt-4o", reason: "GPT-4o Vision — satu-satunya yang handal untuk analisis gambar" },
      ];

    case "orchestration": {
      const chain: RouterChoice[] = [];
      if (hasDeepSeek()) chain.push({ provider: "deepseek", model: "deepseek-chat", reason: "DeepSeek Chat — reasoning kuat untuk orkestrasi" });
      if (hasQwen())     chain.push({ provider: "qwen",     model: "qwen-plus",     reason: "Qwen Plus — orkestrasi multi-step yang solid" });
      chain.push(          { provider: "openai",   model: "gpt-4o",         reason: "GPT-4o — orkestrasi cerdas" });
      return chain;
    }

    case "math_rab": {
      const chain: RouterChoice[] = [];
      if (hasDeepSeek()) chain.push({ provider: "deepseek", model: "deepseek-chat", reason: "DeepSeek — chain-of-thought terbaik untuk perhitungan RAB & numerik" });
      if (hasQwen())     chain.push({ provider: "qwen",     model: "qwen-plus",     reason: "Qwen Plus — perhitungan solid" });
      chain.push(          { provider: "openai",   model: "gpt-4o",         reason: "GPT-4o — perhitungan cerdas" });
      return chain;
    }

    case "data_extraction": {
      const chain: RouterChoice[] = [];
      if (hasDeepSeek()) chain.push({ provider: "deepseek", model: "deepseek-chat", reason: "DeepSeek Chat — ekstraksi terstruktur akurat" });
      if (hasQwen())     chain.push({ provider: "qwen",     model: "qwen-plus",     reason: "Qwen Plus — ekstraksi solid" });
      chain.push(          { provider: "openai",   model: "gpt-4o",         reason: "GPT-4o — ekstraksi cerdas" });
      return chain;
    }

    case "large_doc": {
      const chain: RouterChoice[] = [];
      if (hasGemini())   chain.push({ provider: "gemini",   model: "gemini-2.5-pro", reason: "Gemini 2.5 Pro — context besar & cerdas untuk dokumen panjang" });
      if (hasQwen())     chain.push({ provider: "qwen",     model: "qwen-plus",       reason: "Qwen Plus — dokumen panjang" });
      chain.push(          { provider: "openai",   model: "gpt-4o",           reason: "GPT-4o — dokumen panjang cerdas" });
      return chain;
    }

    case "general":
    default: {
      const chain: RouterChoice[] = [];
      if (hasOpenAI())   chain.push({ provider: "openai",   model: "gpt-4o",         reason: "GPT-4o — general cerdas" });
      if (hasDeepSeek()) chain.push({ provider: "deepseek", model: "deepseek-chat",   reason: "DeepSeek Chat — general cerdas" });
      if (hasQwen())     chain.push({ provider: "qwen",     model: "qwen-plus",       reason: "Qwen Plus — general cerdas" });
      // Always have at least one entry even if no keys are set (will fail at runtime with a clear error)
      if (chain.length === 0) chain.push({ provider: "openai", model: "gpt-4o", reason: "GPT-4o — general cerdas (no key configured)" });
      return chain;
    }
  }
}

/** Returns the first (preferred) choice — same behaviour as the old chooseModel(). */
export function chooseModel(task: TaskType): RouterChoice {
  return buildFallbackChain(task)[0];
}

/**
 * Invoke a single RouterChoice and return the text response.
 * Throws on any provider error so the caller can fall back to the next entry.
 */
async function callOneProvider(
  choice: RouterChoice,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<string> {
  const temperature = options?.temperature ?? 0.3;
  const maxTokens   = options?.maxTokens   ?? 2000;

  if (choice.provider === "openai" || choice.provider === "deepseek" || choice.provider === "qwen") {
    let client: OpenAI;
    if (choice.provider === "deepseek") {
      client = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY!,
        baseURL: "https://api.deepseek.com",
      });
    } else if (choice.provider === "qwen") {
      client = new OpenAI({
        apiKey: process.env.QWEN_API_KEY!,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      });
    } else {
      client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    }

    const resp = await client.chat.completions.create({
      model: choice.model,
      messages: messages as any,
      temperature,
      max_tokens: maxTokens,
      ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
    });
    return resp.choices[0]?.message?.content ?? "";
  }

  if (choice.provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    const genai  = new GoogleGenAI({ apiKey: apiKey! });
    const systemMsg = messages.find(m => m.role === "system")?.content ?? "";
    const userMsg   = messages.filter(m => m.role !== "system").map(m => m.content).join("\n");
    const result = await genai.models.generateContent({
      model: choice.model,
      contents: `${systemMsg}\n\n${userMsg}`,
    });
    return result.text ?? "";
  }

  throw new Error(`Unknown provider: ${choice.provider}`);
}

/**
 * Determines whether an error from a provider should trigger a fallback attempt.
 * Rate-limits (429), server errors (5xx), timeouts, and network failures all qualify.
 * Auth errors (401/403) also qualify because the key may be invalid/exhausted.
 */
function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return true;
  const e = err as any;

  // OpenAI SDK exposes status on the error object
  if (typeof e.status === "number") {
    // 400 Bad Request is usually a prompt/parameter problem — don't retry
    if (e.status === 400) return false;
    // Everything else (401, 403, 429, 5xx) → try next provider
    return true;
  }

  // Network / timeout errors (no status property)
  return true;
}

export async function callWithRouter(
  task: TaskType,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<{ text: string; choice: RouterChoice }> {
  const chain = buildFallbackChain(task);
  const errors: Array<{ provider: string; model: string; error: string }> = [];

  for (let i = 0; i < chain.length; i++) {
    const choice = chain[i];
    const isFirst = i === 0;

    if (!isFirst) {
      console.warn(
        `[ModelRouter] Falling back to ${choice.provider}/${choice.model} for task="${task}" ` +
        `after ${errors.map(e => `${e.provider}/${e.model}: ${e.error}`).join("; ")}`
      );
    }

    try {
      const text = await callOneProvider(choice, messages, options);
      if (!isFirst) {
        console.info(
          `[ModelRouter] Fallback succeeded: task="${task}" provider=${choice.provider} model=${choice.model}`
        );
      }
      return { text, choice };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push({ provider: choice.provider, model: choice.model, error: errMsg });

      if (!isRetryableError(err)) {
        // Non-retryable (e.g. bad request) — fail fast; further providers won't help
        console.error(
          `[ModelRouter] Non-retryable error from ${choice.provider}/${choice.model}: ${errMsg}`
        );
        break;
      }

      console.warn(
        `[ModelRouter] Provider ${choice.provider}/${choice.model} failed (retryable): ${errMsg}`
      );
      // Continue to next provider in chain
    }
  }

  // All providers exhausted
  const summary = errors.map(e => `${e.provider}/${e.model}: ${e.error}`).join("; ");
  throw new Error(`[ModelRouter] All providers failed for task="${task}". Errors: ${summary}`);
}

/**
 * Ringkasan provider yang aktif — untuk logging / debug
 */
export function getActiveProviders(): Record<string, boolean> {
  return {
    openai:   hasOpenAI(),
    deepseek: hasDeepSeek(),
    qwen:     hasQwen(),
    gemini:   hasGemini(),
  };
}
