import assert from "node:assert/strict";
import test from "node:test";

import { sendMetaPurchaseEvent } from "../server/lib/meta-capi";

process.env.META_CAPI_ACCESS_TOKEN = "fake-capi-token";
process.env.META_PIXEL_ID = "1234567890";
process.env.META_TEST_EVENT_CODE = "ENV_TEST_CODE_MUST_NOT_LEAK";

const originalFetch = globalThis.fetch;
const bodies: any[] = [];

globalThis.fetch = (async (_input: any, init?: RequestInit) => {
  bodies.push(JSON.parse(String(init?.body || "{}")));
  return new Response(JSON.stringify({ events_received: 1 }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}) as typeof fetch;

test.after(() => {
  globalThis.fetch = originalFetch;
});

const basePurchase = {
  orderId: "test-meta-order",
  value: 149000,
  currency: "IDR",
  email: "buyer@example.test",
  name: "Test Buyer",
};

test("webhook-style Purchase never inherits META_TEST_EVENT_CODE", async () => {
  bodies.length = 0;
  const result = await sendMetaPurchaseEvent(basePurchase);
  assert.equal(result.sent, true);
  assert.equal(bodies.length, 1);
  assert.equal("test_event_code" in bodies[0], false);
});

test("explicit admin test code is forwarded to Meta", async () => {
  bodies.length = 0;
  const result = await sendMetaPurchaseEvent({
    ...basePurchase,
    orderId: "test-meta-order-explicit",
    testEventCode: "EXPLICIT_TEST_CODE",
  });
  assert.equal(result.sent, true);
  assert.equal(bodies.length, 1);
  assert.equal(bodies[0].test_event_code, "EXPLICIT_TEST_CODE");
});