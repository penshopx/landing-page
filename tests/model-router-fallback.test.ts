/**
 * Tests for `callWithRouter` fallback behaviour in server/lib/model-router.ts.
 *
 * Strategy: the production module exports a `_testHooks` object whose `callOneProviderFn`
 * (undefined at runtime) that we assign to a mock function here.  This lets
 * us exercise the routing / fallback logic without touching a real API.
 *
 * Runner: node:test (built-in) via `npx tsx tests/model-router-fallback.test.ts`
 */
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// ── env helpers ──────────────────────────────────────────────────────────────

/** Ensure two providers (deepseek + openai) are visible so the chain has ≥2 entries. */
function setTwoProviderEnv() {
  process.env.DEEPSEEK_API_KEY = "sk-test-deepseek";
  process.env.OPENAI_API_KEY   = "sk-test-openai";
  // Suppress qwen so the chain is predictable (deepseek → openai)
  delete process.env.QWEN_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
}

/** Ensure three providers are visible (deepseek → qwen → openai). */
function setThreeProviderEnv() {
  process.env.DEEPSEEK_API_KEY = "sk-test-deepseek";
  process.env.QWEN_API_KEY     = "sk-test-qwen";
  process.env.OPENAI_API_KEY   = "sk-test-openai";
  delete process.env.GEMINI_API_KEY;
  delete process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
}

const SAVED_ENV: Record<string, string | undefined> = {};
const WATCHED_KEYS = [
  "OPENAI_API_KEY", "DEEPSEEK_API_KEY", "QWEN_API_KEY",
  "GEMINI_API_KEY", "AI_INTEGRATIONS_GEMINI_API_KEY",
];

function saveEnv() {
  for (const k of WATCHED_KEYS) SAVED_ENV[k] = process.env[k];
}
function restoreEnv() {
  for (const k of WATCHED_KEYS) {
    if (SAVED_ENV[k] === undefined) delete process.env[k];
    else process.env[k] = SAVED_ENV[k]!;
  }
}

// ── shared messages fixture ───────────────────────────────────────────────────

const MESSAGES: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
  { role: "system",  content: "You are a test assistant." },
  { role: "user",    content: "Say hello." },
];

// ── dynamic import (re-imports same cached module; override is module-level) ──

let router: typeof import("../server/lib/model-router.js");

beforeEach(async () => {
  saveEnv();
  // Load once; module cache is shared across all tests in this file.
  if (!router) {
    router = await import("../server/lib/model-router.js");
  }
  // Always clear the override before each test.
  router._testHooks.callOneProviderFn = undefined;
});

afterEach(() => {
  router._testHooks.callOneProviderFn = undefined;
  restoreEnv();
});

// ── isRetryableError ──────────────────────────────────────────────────────────

test("isRetryableError: returns false for HTTP 400", async () => {
  const { isRetryableError } = await import("../server/lib/model-router.js");
  const err = Object.assign(new Error("Bad request"), { status: 400 });
  assert.equal(isRetryableError(err), false);
});

test("isRetryableError: returns true for HTTP 429 (rate limit)", async () => {
  const { isRetryableError } = await import("../server/lib/model-router.js");
  const err = Object.assign(new Error("Too many requests"), { status: 429 });
  assert.equal(isRetryableError(err), true);
});

test("isRetryableError: returns true for HTTP 503", async () => {
  const { isRetryableError } = await import("../server/lib/model-router.js");
  const err = Object.assign(new Error("Service unavailable"), { status: 503 });
  assert.equal(isRetryableError(err), true);
});

test("isRetryableError: returns true for network error (no status)", async () => {
  const { isRetryableError } = await import("../server/lib/model-router.js");
  assert.equal(isRetryableError(new Error("ECONNRESET")), true);
});

test("isRetryableError: returns true for null (defensive)", async () => {
  const { isRetryableError } = await import("../server/lib/model-router.js");
  assert.equal(isRetryableError(null), true);
});

// ── callWithRouter: fallback on retryable error ───────────────────────────────

test("callWithRouter: first provider fails with 429 → second provider is called and its response is returned", async () => {
  setTwoProviderEnv();

  const callLog: string[] = [];

  router._testHooks.callOneProviderFn = async (choice) => {
    callLog.push(choice.provider);
    if (choice.provider === "deepseek") {
      // Simulate a 429 (retryable)
      const err = Object.assign(new Error("Rate limit exceeded"), { status: 429 });
      throw err;
    }
    // Second provider (openai) succeeds
    return "Hello from OpenAI!";
  };

  const result = await router.callWithRouter("orchestration", MESSAGES);

  assert.equal(result.text, "Hello from OpenAI!", "Expected fallback provider response");
  assert.equal(result.choice.provider, "openai",  "Expected choice to reflect the successful fallback provider");
  assert.ok(callLog.includes("deepseek"),          "Expected deepseek to have been tried first");
  assert.ok(callLog.includes("openai"),            "Expected openai to have been tried as fallback");
  assert.equal(callLog[0], "deepseek",             "Expected deepseek to be the first call");
  assert.equal(callLog[1], "openai",               "Expected openai to be the second call");
});

test("callWithRouter: first provider fails with 5xx → fallback is attempted and succeeds", async () => {
  setTwoProviderEnv();

  const callLog: string[] = [];

  router._testHooks.callOneProviderFn = async (choice) => {
    callLog.push(choice.provider);
    if (choice.provider === "deepseek") {
      const err = Object.assign(new Error("Internal server error"), { status: 500 });
      throw err;
    }
    return "Fallback response";
  };

  const result = await router.callWithRouter("orchestration", MESSAGES);

  assert.equal(result.text, "Fallback response");
  assert.equal(callLog.length, 2);
});

// ── callWithRouter: non-retryable 400 stops immediately ──────────────────────

test("callWithRouter: first provider throws 400 → no fallback, error propagates immediately", async () => {
  setTwoProviderEnv();

  const callLog: string[] = [];

  router._testHooks.callOneProviderFn = async (choice) => {
    callLog.push(choice.provider);
    // 400 Bad Request — non-retryable in all cases
    const err = Object.assign(new Error("Bad request — invalid prompt"), { status: 400 });
    throw err;
  };

  await assert.rejects(
    () => router.callWithRouter("orchestration", MESSAGES),
    (err: any) => {
      // Error message should contain the failure details
      assert.ok(
        typeof err.message === "string" && err.message.includes("All providers failed"),
        `Expected "All providers failed" in error but got: ${err.message}`
      );
      return true;
    }
  );

  // Only one provider should have been tried (no fallback after non-retryable)
  assert.equal(callLog.length, 1, "Expected only one provider to be tried after non-retryable 400");
  assert.equal(callLog[0], "deepseek");
});

// ── callWithRouter: all providers fail ───────────────────────────────────────

test("callWithRouter: all providers fail with retryable errors → single consolidated error is thrown", async () => {
  setThreeProviderEnv();

  const callLog: string[] = [];

  router._testHooks.callOneProviderFn = async (choice) => {
    callLog.push(choice.provider);
    const err = Object.assign(new Error(`${choice.provider} unavailable`), { status: 503 });
    throw err;
  };

  await assert.rejects(
    () => router.callWithRouter("orchestration", MESSAGES),
    (err: any) => {
      assert.ok(err instanceof Error, "Expected an Error to be thrown");
      assert.ok(
        err.message.includes("All providers failed"),
        `Expected "All providers failed" in message, got: ${err.message}`
      );
      // All three providers should appear in the error summary
      assert.ok(err.message.includes("deepseek"), "Expected deepseek in error summary");
      assert.ok(err.message.includes("openai"),   "Expected openai in error summary");
      return true;
    }
  );

  // All three providers should have been tried
  assert.equal(callLog.length, 3, "Expected all 3 providers to be tried");
});

test("callWithRouter: all providers fail → error is not swallowed (rejects, not resolves)", async () => {
  setTwoProviderEnv();

  router._testHooks.callOneProviderFn = async () => {
    throw Object.assign(new Error("Timeout"), { status: 503 });
  };

  // Must reject — never silently resolve with an empty string
  let resolved = false;
  await router.callWithRouter("orchestration", MESSAGES)
    .then(() => { resolved = true; })
    .catch(() => { /* expected */ });

  assert.equal(resolved, false, "callWithRouter must not silently resolve when all providers fail");
});

// ── callWithRouter: fallback logging ─────────────────────────────────────────

test("callWithRouter: fallback provider name is logged to stdout on success", async () => {
  setTwoProviderEnv();

  const warnMessages: string[] = [];
  const infoMessages: string[] = [];
  const originalWarn = console.warn;
  const originalInfo = console.info;

  console.warn = (...args: any[]) => warnMessages.push(args.join(" "));
  console.info = (...args: any[]) => infoMessages.push(args.join(" "));

  try {
    router._testHooks.callOneProviderFn = async (choice) => {
      if (choice.provider === "deepseek") {
        throw Object.assign(new Error("Rate limited"), { status: 429 });
      }
      return "OK";
    };

    await router.callWithRouter("orchestration", MESSAGES);
  } finally {
    console.warn = originalWarn;
    console.info = originalInfo;
  }

  // A fallback warning should have been emitted before trying the next provider
  const warnFallback = warnMessages.some(m => m.includes("Falling back") && m.includes("openai"));
  assert.ok(warnFallback, `Expected a "Falling back to openai" warn log; got: ${JSON.stringify(warnMessages)}`);

  // A success info log should confirm which provider succeeded
  const infoSuccess = infoMessages.some(m => m.includes("Fallback succeeded") && m.includes("openai"));
  assert.ok(infoSuccess, `Expected a "Fallback succeeded" info log; got: ${JSON.stringify(infoMessages)}`);
});

test("callWithRouter: first provider succeeds → no fallback log is emitted", async () => {
  setTwoProviderEnv();

  const warnMessages: string[] = [];
  const infoMessages: string[] = [];
  const originalWarn = console.warn;
  const originalInfo = console.info;

  console.warn = (...args: any[]) => warnMessages.push(args.join(" "));
  console.info = (...args: any[]) => infoMessages.push(args.join(" "));

  try {
    router._testHooks.callOneProviderFn = async () => "First provider worked";
    await router.callWithRouter("orchestration", MESSAGES);
  } finally {
    console.warn = originalWarn;
    console.info = originalInfo;
  }

  const fallbackWarns = warnMessages.filter(m => m.includes("Falling back"));
  assert.equal(fallbackWarns.length, 0, "Expected no fallback warn when first provider succeeds");

  const fallbackInfos = infoMessages.filter(m => m.includes("Fallback succeeded"));
  assert.equal(fallbackInfos.length, 0, "Expected no fallback success log when first provider succeeds");
});

// ── callWithRouter: response passthrough ─────────────────────────────────────

test("callWithRouter: response text and winning RouterChoice are returned correctly", async () => {
  setTwoProviderEnv();

  router._testHooks.callOneProviderFn = async (choice) => {
    if (choice.provider === "deepseek") return "DeepSeek answer";
    return "OpenAI answer";
  };

  const { text, choice } = await router.callWithRouter("orchestration", MESSAGES);

  assert.equal(text, "DeepSeek answer");
  assert.equal(choice.provider, "deepseek");
  assert.equal(choice.model, "deepseek-chat");
});
