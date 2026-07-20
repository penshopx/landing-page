/**
 * Tests that QWEN_MODEL env var is honoured by buildFallbackChain()
 * and that getQwenModel() falls back to "qwen-plus" when the var is absent.
 *
 * Uses Node's built-in test runner — no extra dependencies needed.
 */
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// ── helpers ─────────────────────────────────────────────────────────────────

/** Run a callback with a specific QWEN_API_KEY + QWEN_MODEL env state, then restore. */
function withQwenEnv(
  model: string | undefined,
  fn: () => void
): void {
  const originalKey   = process.env.QWEN_API_KEY;
  const originalModel = process.env.QWEN_MODEL;

  // Ensure the Qwen provider is "available" so the chain includes it
  process.env.QWEN_API_KEY = "sk-test-key";
  if (model === undefined) {
    delete process.env.QWEN_MODEL;
  } else {
    process.env.QWEN_MODEL = model;
  }

  try {
    fn();
  } finally {
    if (originalKey === undefined) delete process.env.QWEN_API_KEY;
    else process.env.QWEN_API_KEY = originalKey;

    if (originalModel === undefined) delete process.env.QWEN_MODEL;
    else process.env.QWEN_MODEL = originalModel;
  }
}

// ── getQwenModel ─────────────────────────────────────────────────────────────

test("getQwenModel: returns 'qwen-plus' when QWEN_MODEL is not set", async () => {
  const originalModel = process.env.QWEN_MODEL;
  delete process.env.QWEN_MODEL;

  // Dynamic import so the module picks up env at call-time (getQwenModel is a function)
  const { getQwenModel } = await import("../server/lib/model-router.js");
  try {
    assert.equal(getQwenModel(), "qwen-plus");
  } finally {
    if (originalModel === undefined) delete process.env.QWEN_MODEL;
    else process.env.QWEN_MODEL = originalModel;
  }
});

test("getQwenModel: returns custom value when QWEN_MODEL is set", async () => {
  const originalModel = process.env.QWEN_MODEL;
  process.env.QWEN_MODEL = "qwen-max";

  const { getQwenModel } = await import("../server/lib/model-router.js");
  try {
    assert.equal(getQwenModel(), "qwen-max");
  } finally {
    if (originalModel === undefined) delete process.env.QWEN_MODEL;
    else process.env.QWEN_MODEL = originalModel;
  }
});

test("getQwenModel: trims whitespace and falls back to 'qwen-plus' for blank value", async () => {
  const originalModel = process.env.QWEN_MODEL;
  process.env.QWEN_MODEL = "   ";

  const { getQwenModel } = await import("../server/lib/model-router.js");
  try {
    // "   ".trim() === "" which is falsy → fallback
    assert.equal(getQwenModel(), "qwen-plus");
  } finally {
    if (originalModel === undefined) delete process.env.QWEN_MODEL;
    else process.env.QWEN_MODEL = originalModel;
  }
});

// ── getDeepSeekModel ─────────────────────────────────────────────────────────

test("getDeepSeekModel: returns 'deepseek-chat' when DEEPSEEK_MODEL is not set", async () => {
  const original = process.env.DEEPSEEK_MODEL;
  delete process.env.DEEPSEEK_MODEL;

  const { getDeepSeekModel } = await import("../server/lib/model-router.js");
  try {
    assert.equal(getDeepSeekModel(), "deepseek-chat");
  } finally {
    if (original === undefined) delete process.env.DEEPSEEK_MODEL;
    else process.env.DEEPSEEK_MODEL = original;
  }
});

test("getDeepSeekModel: returns custom value when DEEPSEEK_MODEL is set", async () => {
  const original = process.env.DEEPSEEK_MODEL;
  process.env.DEEPSEEK_MODEL = "deepseek-reasoner";

  const { getDeepSeekModel } = await import("../server/lib/model-router.js");
  try {
    assert.equal(getDeepSeekModel(), "deepseek-reasoner");
  } finally {
    if (original === undefined) delete process.env.DEEPSEEK_MODEL;
    else process.env.DEEPSEEK_MODEL = original;
  }
});

test("getDeepSeekModel: trims whitespace and falls back to 'deepseek-chat' for blank value", async () => {
  const original = process.env.DEEPSEEK_MODEL;
  process.env.DEEPSEEK_MODEL = "   ";

  const { getDeepSeekModel } = await import("../server/lib/model-router.js");
  try {
    assert.equal(getDeepSeekModel(), "deepseek-chat");
  } finally {
    if (original === undefined) delete process.env.DEEPSEEK_MODEL;
    else process.env.DEEPSEEK_MODEL = original;
  }
});

// ── getGeminiModel ───────────────────────────────────────────────────────────

test("getGeminiModel: returns 'gemini-2.5-pro' when GEMINI_MODEL is not set", async () => {
  const original = process.env.GEMINI_MODEL;
  delete process.env.GEMINI_MODEL;

  const { getGeminiModel } = await import("../server/lib/model-router.js");
  try {
    assert.equal(getGeminiModel(), "gemini-2.5-pro");
  } finally {
    if (original === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = original;
  }
});

test("getGeminiModel: returns custom value when GEMINI_MODEL is set", async () => {
  const original = process.env.GEMINI_MODEL;
  process.env.GEMINI_MODEL = "gemini-2.5-flash";

  const { getGeminiModel } = await import("../server/lib/model-router.js");
  try {
    assert.equal(getGeminiModel(), "gemini-2.5-flash");
  } finally {
    if (original === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = original;
  }
});

test("getGeminiModel: trims whitespace and falls back to 'gemini-2.5-pro' for blank value", async () => {
  const original = process.env.GEMINI_MODEL;
  process.env.GEMINI_MODEL = "   ";

  const { getGeminiModel } = await import("../server/lib/model-router.js");
  try {
    assert.equal(getGeminiModel(), "gemini-2.5-pro");
  } finally {
    if (original === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = original;
  }
});

// ── getOpenAIModel ───────────────────────────────────────────────────────────

test("getOpenAIModel: returns 'gpt-4o' when OPENAI_MODEL is not set", async () => {
  const original = process.env.OPENAI_MODEL;
  delete process.env.OPENAI_MODEL;

  const { getOpenAIModel } = await import("../server/lib/model-router.js");
  try {
    assert.equal(getOpenAIModel(), "gpt-4o");
  } finally {
    if (original === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = original;
  }
});

test("getOpenAIModel: returns custom value when OPENAI_MODEL is set", async () => {
  const original = process.env.OPENAI_MODEL;
  process.env.OPENAI_MODEL = "gpt-4o-mini";

  const { getOpenAIModel } = await import("../server/lib/model-router.js");
  try {
    assert.equal(getOpenAIModel(), "gpt-4o-mini");
  } finally {
    if (original === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = original;
  }
});

test("getOpenAIModel: trims whitespace and falls back to 'gpt-4o' for blank value", async () => {
  const original = process.env.OPENAI_MODEL;
  process.env.OPENAI_MODEL = "   ";

  const { getOpenAIModel } = await import("../server/lib/model-router.js");
  try {
    assert.equal(getOpenAIModel(), "gpt-4o");
  } finally {
    if (original === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = original;
  }
});

// ── buildFallbackChain ───────────────────────────────────────────────────────

const TASK_TYPES = [
  "orchestration",
  "math_rab",
  "data_extraction",
  "large_doc",
  "general",
] as const;

// ── buildFallbackChain: helpers ──────────────────────────────────────────────

function withDeepSeekEnv(model: string | undefined, fn: () => void): void {
  const originalKey   = process.env.DEEPSEEK_API_KEY;
  const originalModel = process.env.DEEPSEEK_MODEL;
  process.env.DEEPSEEK_API_KEY = "sk-test-deepseek";
  if (model === undefined) delete process.env.DEEPSEEK_MODEL;
  else process.env.DEEPSEEK_MODEL = model;
  try { fn(); } finally {
    if (originalKey   === undefined) delete process.env.DEEPSEEK_API_KEY;  else process.env.DEEPSEEK_API_KEY  = originalKey;
    if (originalModel === undefined) delete process.env.DEEPSEEK_MODEL;    else process.env.DEEPSEEK_MODEL    = originalModel;
  }
}

function withGeminiEnv(model: string | undefined, fn: () => void): void {
  const originalKey   = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = "AIza-test-gemini";
  if (model === undefined) delete process.env.GEMINI_MODEL;
  else process.env.GEMINI_MODEL = model;
  try { fn(); } finally {
    if (originalKey   === undefined) delete process.env.GEMINI_API_KEY;  else process.env.GEMINI_API_KEY  = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;    else process.env.GEMINI_MODEL    = originalModel;
  }
}

function withOpenAIEnv(model: string | undefined, fn: () => void): void {
  const originalKey   = process.env.OPENAI_API_KEY;
  const originalModel = process.env.OPENAI_MODEL;
  process.env.OPENAI_API_KEY = "sk-test-openai";
  if (model === undefined) delete process.env.OPENAI_MODEL;
  else process.env.OPENAI_MODEL = model;
  try { fn(); } finally {
    if (originalKey   === undefined) delete process.env.OPENAI_API_KEY;  else process.env.OPENAI_API_KEY  = originalKey;
    if (originalModel === undefined) delete process.env.OPENAI_MODEL;    else process.env.OPENAI_MODEL    = originalModel;
  }
}

// ── buildFallbackChain: Qwen ─────────────────────────────────────────────────

for (const task of TASK_TYPES) {
  test(`buildFallbackChain("${task}"): Qwen entry uses QWEN_MODEL env var when set`, async () => {
    const { buildFallbackChain } = await import("../server/lib/model-router.js");
    withQwenEnv("qwen-max", () => {
      const chain = buildFallbackChain(task as any);
      const qwenEntry = chain.find((c) => c.provider === "qwen");
      assert.ok(qwenEntry, `Expected Qwen entry in chain for task="${task}"`);
      assert.equal(
        qwenEntry!.model,
        "qwen-max",
        `Expected model "qwen-max" but got "${qwenEntry!.model}" for task="${task}"`
      );
    });
  });

  test(`buildFallbackChain("${task}"): Qwen entry defaults to "qwen-plus" when QWEN_MODEL unset`, async () => {
    const { buildFallbackChain } = await import("../server/lib/model-router.js");
    withQwenEnv(undefined, () => {
      const chain = buildFallbackChain(task as any);
      const qwenEntry = chain.find((c) => c.provider === "qwen");
      assert.ok(qwenEntry, `Expected Qwen entry in chain for task="${task}"`);
      assert.equal(
        qwenEntry!.model,
        "qwen-plus",
        `Expected fallback "qwen-plus" but got "${qwenEntry!.model}" for task="${task}"`
      );
    });
  });
}

// ── buildFallbackChain: DeepSeek ─────────────────────────────────────────────

const DEEPSEEK_TASKS = ["orchestration", "math_rab", "data_extraction", "general"] as const;

for (const task of DEEPSEEK_TASKS) {
  test(`buildFallbackChain("${task}"): DeepSeek entry uses DEEPSEEK_MODEL env var when set`, async () => {
    const { buildFallbackChain } = await import("../server/lib/model-router.js");
    withDeepSeekEnv("deepseek-reasoner", () => {
      const chain = buildFallbackChain(task as any);
      const entry = chain.find((c) => c.provider === "deepseek");
      assert.ok(entry, `Expected DeepSeek entry in chain for task="${task}"`);
      assert.equal(entry!.model, "deepseek-reasoner",
        `Expected "deepseek-reasoner" but got "${entry!.model}" for task="${task}"`);
    });
  });

  test(`buildFallbackChain("${task}"): DeepSeek entry defaults to "deepseek-chat" when DEEPSEEK_MODEL unset`, async () => {
    const { buildFallbackChain } = await import("../server/lib/model-router.js");
    withDeepSeekEnv(undefined, () => {
      const chain = buildFallbackChain(task as any);
      const entry = chain.find((c) => c.provider === "deepseek");
      assert.ok(entry, `Expected DeepSeek entry in chain for task="${task}"`);
      assert.equal(entry!.model, "deepseek-chat",
        `Expected "deepseek-chat" but got "${entry!.model}" for task="${task}"`);
    });
  });
}

// ── buildFallbackChain: Gemini ───────────────────────────────────────────────

test(`buildFallbackChain("large_doc"): Gemini entry uses GEMINI_MODEL env var when set`, async () => {
  const { buildFallbackChain } = await import("../server/lib/model-router.js");
  withGeminiEnv("gemini-2.5-flash", () => {
    const chain = buildFallbackChain("large_doc");
    const entry = chain.find((c) => c.provider === "gemini");
    assert.ok(entry, `Expected Gemini entry in large_doc chain`);
    assert.equal(entry!.model, "gemini-2.5-flash");
  });
});

test(`buildFallbackChain("large_doc"): Gemini entry defaults to "gemini-2.5-pro" when GEMINI_MODEL unset`, async () => {
  const { buildFallbackChain } = await import("../server/lib/model-router.js");
  withGeminiEnv(undefined, () => {
    const chain = buildFallbackChain("large_doc");
    const entry = chain.find((c) => c.provider === "gemini");
    assert.ok(entry, `Expected Gemini entry in large_doc chain`);
    assert.equal(entry!.model, "gemini-2.5-pro");
  });
});

// ── buildFallbackChain: OpenAI ───────────────────────────────────────────────

const OPENAI_TASKS = ["orchestration", "math_rab", "data_extraction", "large_doc", "general", "vision"] as const;

for (const task of OPENAI_TASKS) {
  test(`buildFallbackChain("${task}"): OpenAI entry uses OPENAI_MODEL env var when set`, async () => {
    const { buildFallbackChain } = await import("../server/lib/model-router.js");
    withOpenAIEnv("gpt-4o-mini", () => {
      const chain = buildFallbackChain(task as any);
      const entry = chain.find((c) => c.provider === "openai");
      assert.ok(entry, `Expected OpenAI entry in chain for task="${task}"`);
      assert.equal(entry!.model, "gpt-4o-mini",
        `Expected "gpt-4o-mini" but got "${entry!.model}" for task="${task}"`);
    });
  });

  test(`buildFallbackChain("${task}"): OpenAI entry defaults to "gpt-4o" when OPENAI_MODEL unset`, async () => {
    const { buildFallbackChain } = await import("../server/lib/model-router.js");
    withOpenAIEnv(undefined, () => {
      const chain = buildFallbackChain(task as any);
      const entry = chain.find((c) => c.provider === "openai");
      assert.ok(entry, `Expected OpenAI entry in chain for task="${task}"`);
      assert.equal(entry!.model, "gpt-4o",
        `Expected "gpt-4o" but got "${entry!.model}" for task="${task}"`);
    });
  });
}
