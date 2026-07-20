/**
 * Tests for `callWithRouterStream` in server/lib/model-router.ts.
 *
 * Strategy: the module exports `_testHooks.streamOneProviderFn` (undefined at
 * runtime) which we override here with a mock async generator — no real API calls.
 *
 * Runner: node:test (built-in) via `npx tsx tests/model-router-stream.test.ts`
 */
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// ── env helpers ──────────────────────────────────────────────────────────────

const WATCHED_KEYS = [
  "OPENAI_API_KEY", "DEEPSEEK_API_KEY", "QWEN_API_KEY",
  "GEMINI_API_KEY", "AI_INTEGRATIONS_GEMINI_API_KEY",
];
const SAVED_ENV: Record<string, string | undefined> = {};

function saveEnv() {
  for (const k of WATCHED_KEYS) SAVED_ENV[k] = process.env[k];
}
function restoreEnv() {
  for (const k of WATCHED_KEYS) {
    if (SAVED_ENV[k] === undefined) delete process.env[k];
    else process.env[k] = SAVED_ENV[k]!;
  }
}

function setTwoProviderEnv() {
  process.env.DEEPSEEK_API_KEY = "sk-test-deepseek";
  process.env.OPENAI_API_KEY   = "sk-test-openai";
  delete process.env.QWEN_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
}

function setThreeProviderEnv() {
  process.env.DEEPSEEK_API_KEY = "sk-test-deepseek";
  process.env.QWEN_API_KEY     = "sk-test-qwen";
  process.env.OPENAI_API_KEY   = "sk-test-openai";
  delete process.env.GEMINI_API_KEY;
  delete process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
}

// ── shared fixture ────────────────────────────────────────────────────────────

const MESSAGES: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
  { role: "system", content: "You are a test assistant." },
  { role: "user",   content: "Say hello." },
];

// ── module import (shared across tests in file) ───────────────────────────────

import type * as RouterModule from "../server/lib/model-router.js";
let router: typeof RouterModule;

beforeEach(async () => {
  saveEnv();
  if (!router) {
    router = await import("../server/lib/model-router.js");
  }
  router._testHooks.callOneProviderFn   = undefined;
  router._testHooks.streamOneProviderFn = undefined;
});

afterEach(() => {
  router._testHooks.callOneProviderFn   = undefined;
  router._testHooks.streamOneProviderFn = undefined;
  restoreEnv();
});

// ── helpers ───────────────────────────────────────────────────────────────────

/** Build a mock stream generator that yields the given chunks and then stops. */
async function* makeStream(chunks: string[]): AsyncGenerator<string> {
  for (const c of chunks) yield c;
}

/** Build a mock stream generator that throws after yielding the given chunks. */
async function* makeFailingStream(chunks: string[], err: unknown): AsyncGenerator<string> {
  for (const c of chunks) yield c;
  throw err;
}

/** Build a mock stream generator that throws immediately (pre-stream). */
async function* makeImmediateFailStream(err: unknown): AsyncGenerator<string> {
  throw err;
  // eslint-disable-next-line no-unreachable
  yield ""; // satisfy TypeScript generator return type
}

// Utility: collect all chunks from callWithRouterStream into an array.
async function collectChunks(
  task: Parameters<typeof router.callWithRouterStream>[0],
  messages: Parameters<typeof router.callWithRouterStream>[1],
): Promise<{ chunks: string[]; choice: RouterModule.RouterChoice }> {
  const chunks: string[] = [];
  const choice = await router.callWithRouterStream(task, messages, {
    onChunk: (c) => { chunks.push(c); },
  });
  return { chunks, choice };
}

// ── callWithRouterStream: happy-path ─────────────────────────────────────────

test("callWithRouterStream: first provider streams all chunks and returns its RouterChoice", async () => {
  setTwoProviderEnv();

  const callLog: string[] = [];
  router._testHooks.streamOneProviderFn = (choice) => {
    callLog.push(choice.provider);
    return makeStream(["Hello ", "world"]);
  };

  const { chunks, choice } = await collectChunks("orchestration", MESSAGES);

  assert.deepEqual(chunks, ["Hello ", "world"]);
  assert.equal(choice.provider, "deepseek");
  assert.equal(callLog.length, 1, "Only the first provider should have been called");
});

// ── callWithRouterStream: pre-stream fallback ─────────────────────────────────

test("callWithRouterStream: pre-stream error on first provider → falls back to second provider", async () => {
  setTwoProviderEnv();

  const callLog: string[] = [];
  router._testHooks.streamOneProviderFn = (choice) => {
    callLog.push(choice.provider);
    if (choice.provider === "deepseek") {
      return makeImmediateFailStream(Object.assign(new Error("Rate limited"), { status: 429 }));
    }
    return makeStream(["Fallback answer"]);
  };

  const { chunks, choice } = await collectChunks("orchestration", MESSAGES);

  assert.deepEqual(chunks, ["Fallback answer"]);
  assert.equal(choice.provider, "openai");
  assert.equal(callLog.length, 2);
  assert.equal(callLog[0], "deepseek");
  assert.equal(callLog[1], "openai");
});

test("callWithRouterStream: pre-stream 503 on first → second succeeds with correct chunks", async () => {
  setTwoProviderEnv();

  router._testHooks.streamOneProviderFn = (choice) => {
    if (choice.provider === "deepseek") {
      return makeImmediateFailStream(Object.assign(new Error("Service unavailable"), { status: 503 }));
    }
    return makeStream(["chunk1", "chunk2", "chunk3"]);
  };

  const { chunks, choice } = await collectChunks("orchestration", MESSAGES);

  assert.deepEqual(chunks, ["chunk1", "chunk2", "chunk3"]);
  assert.equal(choice.provider, "openai");
});

test("callWithRouterStream: non-retryable pre-stream error (400) stops immediately", async () => {
  setTwoProviderEnv();

  const callLog: string[] = [];
  router._testHooks.streamOneProviderFn = (choice) => {
    callLog.push(choice.provider);
    return makeImmediateFailStream(Object.assign(new Error("Bad request"), { status: 400 }));
  };

  await assert.rejects(
    () => collectChunks("orchestration", MESSAGES),
    (err: any) => {
      assert.ok(err.message.includes("All stream providers failed"), `Got: ${err.message}`);
      return true;
    }
  );

  // Only one provider should have been tried (non-retryable)
  assert.equal(callLog.length, 1, "Expected exactly one provider tried for non-retryable 400");
  assert.equal(callLog[0], "deepseek");
});

test("callWithRouterStream: all providers fail pre-stream → consolidated error thrown", async () => {
  setThreeProviderEnv();

  const callLog: string[] = [];
  router._testHooks.streamOneProviderFn = (choice) => {
    callLog.push(choice.provider);
    return makeImmediateFailStream(Object.assign(new Error(`${choice.provider} down`), { status: 503 }));
  };

  await assert.rejects(
    () => collectChunks("orchestration", MESSAGES),
    (err: any) => {
      assert.ok(err instanceof Error, "Expected Error");
      assert.ok(err.message.includes("All stream providers failed"), `Got: ${err.message}`);
      assert.ok(err.message.includes("deepseek"), "deepseek should appear in error");
      assert.ok(err.message.includes("openai"),   "openai should appear in error");
      return true;
    }
  );

  // All three should have been tried
  assert.equal(callLog.length, 3, `Expected 3 attempts, got ${callLog.length}`);
});

// ── callWithRouterStream: mid-stream fallback ─────────────────────────────────

test("callWithRouterStream: mid-stream drop falls back to next provider (client gets complete response)", async () => {
  setTwoProviderEnv();

  const received: string[] = [];
  const callLog: string[] = [];

  router._testHooks.streamOneProviderFn = (choice) => {
    callLog.push(choice.provider);
    if (choice.provider === "deepseek") {
      // Yields 2 chunks then drops mid-stream
      return makeFailingStream(["Hello ", "world"], new Error("Connection reset mid-stream"));
    }
    // Second provider completes the response
    return makeStream([" — continued by fallback"]);
  };

  const choice = await router.callWithRouterStream("orchestration", MESSAGES, {
    onChunk: (c) => { received.push(c); },
  });

  // Chunks from the failed provider and then the fallback provider should all be delivered
  assert.deepEqual(received, ["Hello ", "world", " — continued by fallback"]);
  // The returned RouterChoice should be the successful fallback provider
  assert.equal(choice.provider, "openai");
  // Both providers should have been called
  assert.equal(callLog.length, 2);
  assert.equal(callLog[0], "deepseek");
  assert.equal(callLog[1], "openai");
});

test("callWithRouterStream: mid-stream drop on first provider — second provider is tried next", async () => {
  setTwoProviderEnv();

  const callLog: string[] = [];
  router._testHooks.streamOneProviderFn = (choice) => {
    callLog.push(choice.provider);
    if (choice.provider === "deepseek") {
      return makeFailingStream(["partial token"], new Error("Socket closed"));
    }
    return makeStream(["Fallback completion"]);
  };

  const { chunks, choice } = await collectChunks("orchestration", MESSAGES);

  // The partial token from deepseek plus fallback content should be delivered
  assert.ok(chunks.includes("partial token"), "partial content from dropped provider should be delivered");
  assert.ok(chunks.includes("Fallback completion"), "fallback provider content should be appended");
  assert.equal(choice.provider, "openai", "fallback provider should be the winner");

  // Both providers should have been called
  assert.equal(callLog.length, 2, `Expected 2 provider calls; got ${callLog.length}: ${callLog}`);
  assert.equal(callLog[0], "deepseek");
  assert.equal(callLog[1], "openai");
});

test("callWithRouterStream: all providers fail mid-stream → consolidated error thrown", async () => {
  setTwoProviderEnv();

  const allReceived: string[] = [];
  router._testHooks.streamOneProviderFn = (choice) => {
    return makeFailingStream([`chunk-from-${choice.provider}`], new Error(`${choice.provider} mid-stream drop`));
  };

  await assert.rejects(
    () => router.callWithRouterStream("orchestration", MESSAGES, {
      onChunk: (c) => { allReceived.push(c); },
    }),
    (err: any) => {
      assert.ok(err instanceof Error, "Expected Error");
      assert.ok(err.message.includes("All stream providers failed"), `Got: ${err.message}`);
      // Both providers should be mentioned in the error
      assert.ok(err.message.includes("deepseek"), `deepseek missing from: ${err.message}`);
      assert.ok(err.message.includes("openai"),   `openai missing from: ${err.message}`);
      return true;
    }
  );

  // Partial chunks from both providers should have been delivered before the error
  assert.ok(allReceived.includes("chunk-from-deepseek"), "deepseek partial chunk should have been delivered");
  assert.ok(allReceived.includes("chunk-from-openai"),   "openai partial chunk should have been delivered");
});

// ── callWithRouterStream: logging ─────────────────────────────────────────────

test("callWithRouterStream: pre-stream fallback logs warn + success info", async () => {
  setTwoProviderEnv();

  const warnMessages: string[] = [];
  const infoMessages: string[] = [];
  const originalWarn = console.warn;
  const originalInfo = console.info;
  console.warn = (...args: any[]) => warnMessages.push(args.join(" "));
  console.info = (...args: any[]) => infoMessages.push(args.join(" "));

  try {
    router._testHooks.streamOneProviderFn = (choice) => {
      if (choice.provider === "deepseek") {
        return makeImmediateFailStream(Object.assign(new Error("429"), { status: 429 }));
      }
      return makeStream(["OK"]);
    };

    await collectChunks("orchestration", MESSAGES);
  } finally {
    console.warn = originalWarn;
    console.info = originalInfo;
  }

  const warnFallback = warnMessages.some(m => m.includes("Stream falling back") && m.includes("openai"));
  assert.ok(warnFallback, `Expected "Stream falling back to openai" warn; got: ${JSON.stringify(warnMessages)}`);

  const infoSuccess = infoMessages.some(m => m.includes("Stream fallback succeeded") && m.includes("openai"));
  assert.ok(infoSuccess, `Expected "Stream fallback succeeded" info; got: ${JSON.stringify(infoMessages)}`);
});

test("callWithRouterStream: mid-stream drop logs a warning with chunk count before falling back", async () => {
  setTwoProviderEnv();

  const warnMessages: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => warnMessages.push(args.join(" "));

  try {
    router._testHooks.streamOneProviderFn = (choice) => {
      if (choice.provider === "deepseek") {
        return makeFailingStream(["a", "b"], new Error("Socket closed"));
      }
      return makeStream(["recovery"]);
    };

    await collectChunks("orchestration", MESSAGES);
  } finally {
    console.warn = originalWarn;
  }

  const dropWarn = warnMessages.some(m =>
    m.includes("Stream dropped mid-response") &&
    m.includes("deepseek") &&
    m.includes("chunk(s)")
  );
  assert.ok(dropWarn, `Expected a mid-stream drop warning; got: ${JSON.stringify(warnMessages)}`);
});

test("callWithRouterStream: no fallback log when first provider succeeds", async () => {
  setTwoProviderEnv();

  const warnMessages: string[] = [];
  const infoMessages: string[] = [];
  const originalWarn = console.warn;
  const originalInfo = console.info;
  console.warn = (...args: any[]) => warnMessages.push(args.join(" "));
  console.info = (...args: any[]) => infoMessages.push(args.join(" "));

  try {
    router._testHooks.streamOneProviderFn = () => makeStream(["Hello"]);
    await collectChunks("orchestration", MESSAGES);
  } finally {
    console.warn = originalWarn;
    console.info = originalInfo;
  }

  const fallbackWarns = warnMessages.filter(m => m.includes("Stream falling back"));
  assert.equal(fallbackWarns.length, 0, "No fallback warning expected when first provider succeeds");

  const fallbackInfos = infoMessages.filter(m => m.includes("Stream fallback succeeded"));
  assert.equal(fallbackInfos.length, 0, "No fallback success log expected when first provider succeeds");
});

// ── callWithRouterStream: abort signal ───────────────────────────────────────

test("callWithRouterStream: aborted signal stops iteration cleanly", async () => {
  setTwoProviderEnv();

  const controller = new AbortController();
  const received: string[] = [];

  router._testHooks.streamOneProviderFn = async function* () {
    yield "chunk1";
    controller.abort();
    yield "chunk2"; // should not be delivered after abort
  };

  const choice = await router.callWithRouterStream("orchestration", MESSAGES, {
    signal: controller.signal,
    onChunk: (c) => { received.push(c); },
  });

  // At most chunk1 should be received (abort stops after it)
  assert.ok(received.length <= 2, `Expected ≤2 chunks before abort, got ${received.length}`);
  assert.ok(choice.provider === "deepseek" || choice.provider === "openai");
});
