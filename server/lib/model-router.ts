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

// ─── Per-provider health tracking ────────────────────────────────────────────

export type ProviderHealthEntry = {
  /** ISO timestamp of last successful call, or null if none yet. */
  lastSuccess: string | null;
  /** ISO timestamp of last error, or null if none yet. */
  lastError: string | null;
  /** Last error message string. */
  lastErrorMsg: string | null;
  /** Total successful calls since server start. */
  successCount: number;
  /** Total failed calls since server start. */
  errorCount: number;
};

const _providerHealth: Record<string, ProviderHealthEntry> = {
  openai:   { lastSuccess: null, lastError: null, lastErrorMsg: null, successCount: 0, errorCount: 0 },
  deepseek: { lastSuccess: null, lastError: null, lastErrorMsg: null, successCount: 0, errorCount: 0 },
  qwen:     { lastSuccess: null, lastError: null, lastErrorMsg: null, successCount: 0, errorCount: 0 },
  gemini:   { lastSuccess: null, lastError: null, lastErrorMsg: null, successCount: 0, errorCount: 0 },
};

/** Returns a snapshot of per-provider health state. Safe to call from any route. */
export function getProviderHealth(): Record<string, ProviderHealthEntry> {
  return JSON.parse(JSON.stringify(_providerHealth));
}

function _recordSuccess(provider: string): void {
  const h = _providerHealth[provider];
  if (!h) return;
  h.lastSuccess = new Date().toISOString();
  h.successCount += 1;
}

function _recordError(provider: string, errMsg: string): void {
  const h = _providerHealth[provider];
  if (!h) return;
  h.lastError = new Date().toISOString();
  h.lastErrorMsg = errMsg;
  h.errorCount += 1;
}

export interface RouterChoice {
  provider: "openai" | "gemini" | "deepseek" | "qwen";
  model: string;
  reason: string;
}

const hasOpenAI   = () => !!process.env.OPENAI_API_KEY;
const hasQwen     = () => !!process.env.QWEN_API_KEY;
const hasDeepSeek = () => !!process.env.DEEPSEEK_API_KEY;
const hasGemini   = () => !!(process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY);

/** Qwen model name — overrideable via QWEN_MODEL env var, defaults to "qwen-plus". */
export const getQwenModel     = () => process.env.QWEN_MODEL?.trim()     || "qwen-plus";

/** DeepSeek model name — overrideable via DEEPSEEK_MODEL env var, defaults to "deepseek-chat". */
export const getDeepSeekModel = () => process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";

/** Gemini model name — overrideable via GEMINI_MODEL env var, defaults to "gemini-2.5-pro". */
export const getGeminiModel   = () => process.env.GEMINI_MODEL?.trim()   || "gemini-2.5-pro";

/** OpenAI model name — overrideable via OPENAI_MODEL env var, defaults to "gpt-4o". */
export const getOpenAIModel   = () => process.env.OPENAI_MODEL?.trim()   || "gpt-4o";

/** Returns the ordered fallback chain for a task. First entry = preferred provider. */
export function buildFallbackChain(task: TaskType): RouterChoice[] {
  switch (task) {

    case "vision":
      // Only GPT-4o supports vision; no meaningful fallback.
      return [
        { provider: "openai", model: getOpenAIModel(), reason: "GPT-4o Vision — satu-satunya yang handal untuk analisis gambar" },
      ];

    case "orchestration": {
      const chain: RouterChoice[] = [];
      if (hasDeepSeek()) chain.push({ provider: "deepseek", model: getDeepSeekModel(), reason: "DeepSeek Chat — reasoning kuat untuk orkestrasi" });
      if (hasQwen())     chain.push({ provider: "qwen",     model: getQwenModel(),     reason: "Qwen Plus — orkestrasi multi-step yang solid" });
      chain.push(          { provider: "openai",   model: getOpenAIModel(),   reason: "GPT-4o — orkestrasi cerdas" });
      return chain;
    }

    case "math_rab": {
      const chain: RouterChoice[] = [];
      if (hasDeepSeek()) chain.push({ provider: "deepseek", model: getDeepSeekModel(), reason: "DeepSeek — chain-of-thought terbaik untuk perhitungan RAB & numerik" });
      if (hasQwen())     chain.push({ provider: "qwen",     model: getQwenModel(),     reason: "Qwen Plus — perhitungan solid" });
      chain.push(          { provider: "openai",   model: getOpenAIModel(),   reason: "GPT-4o — perhitungan cerdas" });
      return chain;
    }

    case "data_extraction": {
      const chain: RouterChoice[] = [];
      if (hasDeepSeek()) chain.push({ provider: "deepseek", model: getDeepSeekModel(), reason: "DeepSeek Chat — ekstraksi terstruktur akurat" });
      if (hasQwen())     chain.push({ provider: "qwen",     model: getQwenModel(),     reason: "Qwen Plus — ekstraksi solid" });
      chain.push(          { provider: "openai",   model: getOpenAIModel(),   reason: "GPT-4o — ekstraksi cerdas" });
      return chain;
    }

    case "large_doc": {
      const chain: RouterChoice[] = [];
      if (hasGemini())   chain.push({ provider: "gemini",   model: getGeminiModel(),   reason: "Gemini 2.5 Pro — context besar & cerdas untuk dokumen panjang" });
      if (hasQwen())     chain.push({ provider: "qwen",     model: getQwenModel(),     reason: "Qwen Plus — dokumen panjang" });
      chain.push(          { provider: "openai",   model: getOpenAIModel(),   reason: "GPT-4o — dokumen panjang cerdas" });
      return chain;
    }

    case "general":
    default: {
      const chain: RouterChoice[] = [];
      if (hasOpenAI())   chain.push({ provider: "openai",   model: getOpenAIModel(),   reason: "GPT-4o — general cerdas" });
      if (hasDeepSeek()) chain.push({ provider: "deepseek", model: getDeepSeekModel(), reason: "DeepSeek Chat — general cerdas" });
      if (hasQwen())     chain.push({ provider: "qwen",     model: getQwenModel(),     reason: "Qwen Plus — general cerdas" });
      // Always have at least one entry even if no keys are set (will fail at runtime with a clear error)
      if (chain.length === 0) chain.push({ provider: "openai", model: getOpenAIModel(), reason: "GPT-4o — general cerdas (no key configured)" });
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
 *
 * Exported so it can be unit-tested without hitting a real API.
 */
export function isRetryableError(err: unknown): boolean {
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

/**
 * Test-only seam: assign `.fn` to intercept `callOneProvider` without hitting
 * a real API.  Must be a mutable-property object (not `export let`) so ESM
 * live-binding read-only restrictions don't prevent reassignment from tests.
 *
 * @internal — do not use outside of tests.
 */
export const _testHooks: {
  callOneProviderFn:
    | ((
        choice: RouterChoice,
        messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
        options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
      ) => Promise<string>)
    | undefined;
  /** Streaming seam: override the per-provider async generator used by callWithRouterStream. */
  streamOneProviderFn:
    | ((
        choice: RouterChoice,
        messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
        options?: { temperature?: number; maxTokens?: number; signal?: AbortSignal }
      ) => AsyncGenerator<string>)
    | undefined;
} = { callOneProviderFn: undefined, streamOneProviderFn: undefined };

/**
 * Opens a streaming completion for one provider and yields text chunks.
 * Throws synchronously (before the first yield) if the stream cannot be opened,
 * which lets the caller fall back to the next provider with zero chunks emitted.
 * Throws during iteration for mid-stream drops.
 */
async function* streamOneProvider(
  choice: RouterChoice,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: { temperature?: number; maxTokens?: number; signal?: AbortSignal }
): AsyncGenerator<string> {
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

    // stream creation can throw here (pre-stream error) — caller catches this
    const stream = await client.chat.completions.create({
      model: choice.model,
      messages: messages as any,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      if (options?.signal?.aborted) return;
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) yield content;
    }
    return;
  }

  if (choice.provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    const genai  = new GoogleGenAI({ apiKey: apiKey! });
    const systemMsg  = messages.find(m => m.role === "system")?.content ?? "";
    const otherMsgs  = messages.filter(m => m.role !== "system");
    const geminiContents = otherMsgs.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const stream = await genai.models.generateContentStream({
      model: choice.model,
      contents: geminiContents as any,
      config: {
        ...(systemMsg ? { systemInstruction: systemMsg } : {}),
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    for await (const chunk of stream) {
      if (options?.signal?.aborted) return;
      const content = (chunk as any).text || "";
      if (content) yield content;
    }
    return;
  }

  throw new Error(`Unknown provider: ${choice.provider}`);
}

/**
 * Streaming variant of callWithRouter.
 *
 * Walks the fallback chain and streams from each provider in order:
 *
 * - Pre-stream errors (thrown before the first chunk): caught silently,
 *   next provider tried immediately.
 * - Mid-stream errors (thrown after ≥1 chunks already emitted): logged with
 *   the number of chunks already delivered, then the next provider is tried
 *   so the client receives a complete response rather than a truncated one.
 *   The partial output from the failed provider has already been delivered
 *   via `onChunk`; the next provider's output is appended to it.
 * - Non-retryable errors (HTTP 400): stop immediately, no further fallback.
 * - The chosen provider is logged on every pre/mid-stream fallback.
 *
 * @param task       Task type — selects the fallback chain.
 * @param messages   Chat messages to send.
 * @param options    Streaming options including the per-chunk callback.
 * @returns          The RouterChoice of the provider that completed the stream.
 */
export async function callWithRouterStream(
  task: TaskType,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: {
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
    /** Called for each text chunk as it arrives from the provider. */
    onChunk: (content: string, choice: RouterChoice) => void;
  }
): Promise<RouterChoice> {
  const chain   = buildFallbackChain(task);
  const errors: Array<{ provider: string; model: string; error: string }> = [];
  const streamFn = _testHooks.streamOneProviderFn ?? streamOneProvider;

  for (let i = 0; i < chain.length; i++) {
    const choice  = chain[i];
    const isFirst = i === 0;

    if (!isFirst) {
      console.warn(
        `[ModelRouter] Stream falling back to ${choice.provider}/${choice.model} for task="${task}" ` +
        `after ${errors.map(e => `${e.provider}/${e.model}: ${e.error}`).join("; ")}`
      );
    }

    let chunksEmitted = 0;
    try {
      const gen = streamFn(choice, messages, options);
      for await (const content of gen) {
        if (options.signal?.aborted) {
          return choice; // client disconnected — stop cleanly
        }
        chunksEmitted++;
        options.onChunk(content, choice);
      }

      _recordSuccess(choice.provider);
      if (!isFirst) {
        console.info(
          `[ModelRouter] Stream fallback succeeded: task="${task}" provider=${choice.provider} model=${choice.model}`
        );
      } else {
        console.info(
          `[ModelRouter] Stream succeeded: task="${task}" provider=${choice.provider} model=${choice.model}`
        );
      }
      return choice;

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      _recordError(choice.provider, errMsg);

      if (chunksEmitted > 0) {
        // Mid-stream drop: partial content was already delivered. Log the drop
        // with a chunk count and fall through to the next provider so the client
        // receives a complete response rather than being truncated.
        console.warn(
          `[ModelRouter] Stream dropped mid-response from ${choice.provider}/${choice.model} ` +
          `after ${chunksEmitted} chunk(s) — trying next provider: ${errMsg}`
        );
      }

      errors.push({
        provider: choice.provider,
        model: choice.model,
        error: chunksEmitted > 0 ? `mid-stream drop after ${chunksEmitted} chunk(s): ${errMsg}` : errMsg,
      });

      if (!isRetryableError(err)) {
        console.error(
          `[ModelRouter] Non-retryable stream error from ${choice.provider}/${choice.model}: ${errMsg}`
        );
        break;
      }

      if (chunksEmitted === 0) {
        console.warn(
          `[ModelRouter] Stream provider ${choice.provider}/${choice.model} failed pre-stream (retryable): ${errMsg}`
        );
      }
      // continue to next provider
    }
  }

  const summary = errors.map(e => `${e.provider}/${e.model}: ${e.error}`).join("; ");
  throw new Error(`[ModelRouter] All stream providers failed for task="${task}". Errors: ${summary}`);
}

export async function callWithRouter(
  task: TaskType,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<{ text: string; choice: RouterChoice }> {
  const chain = buildFallbackChain(task);
  const errors: Array<{ provider: string; model: string; error: string }> = [];
  const invoke = _testHooks.callOneProviderFn ?? callOneProvider;

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
      const text = await invoke(choice, messages, options);
      _recordSuccess(choice.provider);
      if (!isFirst) {
        console.info(
          `[ModelRouter] Fallback succeeded: task="${task}" provider=${choice.provider} model=${choice.model}`
        );
      }
      return { text, choice };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      _recordError(choice.provider, errMsg);
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

/**
 * Checks each provider for misconfiguration and logs a WARN for each issue found.
 * Two cases are flagged:
 *   1. MODEL var is set but the matching API_KEY is absent → provider will be silently excluded.
 *   2. API_KEY is set but the resolved model name is blank/whitespace → calls will fail at runtime.
 *
 * Does NOT throw — warn only, so the fallback chain continues to work normally.
 * Call once at server startup.
 */
export function warnMisconfiguredProviders(): void {
  const providers: Array<{
    name: string;
    modelVar: string;
    modelValue: string | undefined;
    resolvedModel: string;
    keyPresent: boolean;
  }> = [
    {
      name: "OpenAI",
      modelVar: "OPENAI_MODEL",
      modelValue: process.env.OPENAI_MODEL,
      resolvedModel: getOpenAIModel(),
      keyPresent: hasOpenAI(),
    },
    {
      name: "DeepSeek",
      modelVar: "DEEPSEEK_MODEL",
      modelValue: process.env.DEEPSEEK_MODEL,
      resolvedModel: getDeepSeekModel(),
      keyPresent: hasDeepSeek(),
    },
    {
      name: "Qwen",
      modelVar: "QWEN_MODEL",
      modelValue: process.env.QWEN_MODEL,
      resolvedModel: getQwenModel(),
      keyPresent: hasQwen(),
    },
    {
      name: "Gemini",
      modelVar: "GEMINI_MODEL",
      modelValue: process.env.GEMINI_MODEL,
      resolvedModel: getGeminiModel(),
      keyPresent: hasGemini(),
    },
  ];

  const apiKeyVars: Record<string, string> = {
    OpenAI:   "OPENAI_API_KEY",
    DeepSeek: "DEEPSEEK_API_KEY",
    Qwen:     "QWEN_API_KEY",
    Gemini:   "GEMINI_API_KEY",
  };

  for (const p of providers) {
    // Case 1: MODEL var explicitly set but API key is missing
    if (p.modelValue !== undefined && p.modelValue.trim() !== "" && !p.keyPresent) {
      console.warn(
        `[ModelRouter] WARN: ${p.modelVar} is set ("${p.modelValue.trim()}") ` +
        `but ${apiKeyVars[p.name]} is missing — ${p.name} will not be used.`
      );
    }

    // Case 2: API key is present but resolved model name is blank/whitespace
    if (p.keyPresent && !p.resolvedModel.trim()) {
      console.warn(
        `[ModelRouter] WARN: ${apiKeyVars[p.name]} is set but ${p.modelVar} ` +
        `resolves to an empty string — ${p.name} calls will fail at runtime.`
      );
    }
  }
}
