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

// ── buildFallbackChain ───────────────────────────────────────────────────────

const TASK_TYPES = [
  "orchestration",
  "math_rab",
  "data_extraction",
  "large_doc",
  "general",
] as const;

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
