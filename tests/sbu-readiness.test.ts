import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { AddressInfo } from "node:net";
import {
  SBU_READINESS_QUESTIONS,
  SBU_READINESS_RUBRIC_VERSION,
  assessSbuReadiness,
  validateSbuReadinessAnswers,
  type SbuReadinessAnswers,
} from "../shared/sbu-readiness";
import {
  buildSbuReadinessAggregateKey,
  getTrustedClientIp,
  parseSbuReadinessAggregateEvent,
  recordSbuReadinessAggregateEvent,
  registerSbuReadinessEventIngress,
  registerSbuSkkFunnelRoutes,
} from "../server/sbu-skk-funnel";
import type { Request } from "express";

function answers(
  state: SbuReadinessAnswers["classification"],
): SbuReadinessAnswers {
  return {
    journey: "first",
    qualification: "small",
    classification: state,
    pjbu: state,
    pjtbu: state,
    pjskbu: state,
    skk: state,
    experience: state,
    finance: state,
    documents: state,
  };
}

test("rubric is versioned and weights total exactly 100", () => {
  assert.match(SBU_READINESS_RUBRIC_VERSION, /^\d{4}-\d{2}-\d{2}\.v\d+$/);
  assert.equal(
    SBU_READINESS_QUESTIONS.reduce((total, question) => total + question.weight, 0),
    100,
  );
});

test("all missing answers produce foundation band and mini ebook route", () => {
  const result = assessSbuReadiness(answers("none"));
  assert.equal(result.score, 0);
  assert.equal(result.band, "foundation");
  assert.equal(result.recommendedDestination, "mini-ebook");
  assert.equal(result.nextSteps.length, 3);
  assert.equal(result.breakdown.length, 8);
});

test("partial answers produce organize band and paid ebook route", () => {
  const result = assessSbuReadiness(answers("partial"));
  assert.equal(result.score, 50);
  assert.equal(result.band, "organize");
  assert.equal(result.recommendedDestination, "ebook");
  assert.equal(result.nextSteps.length, 3);
  assert.ok(result.strengths.length > 0);
});

test("ready answers produce validate band and AI Specialist route", () => {
  const result = assessSbuReadiness(answers("ready"));
  assert.equal(result.score, 100);
  assert.equal(result.band, "validate");
  assert.equal(result.recommendedDestination, "ai-specialist");
  assert.equal(result.nextSteps.length, 3);
  assert.match(result.gaps[0], /kanal resmi/i);
});

test("largest missing readiness dimension is prioritized as the first gap", () => {
  const input = answers("ready");
  input.documents = "none";
  input.classification = "partial";
  const result = assessSbuReadiness(input);
  assert.equal(result.score, 74);
  assert.match(result.gaps[0], /Dokumen badan usaha/i);
  assert.match(result.nextSteps[0], /daftar dokumen induk/i);
});

test("answer validation rejects malformed, incomplete, and extra personal fields", () => {
  assert.ok(validateSbuReadinessAnswers(null).length > 0);
  assert.ok(validateSbuReadinessAnswers({ journey: "first" }).length > 0);
  assert.deepEqual(validateSbuReadinessAnswers(answers("ready")), []);
  assert.match(
    validateSbuReadinessAnswers({
      ...answers("ready"),
      companyName: "PT Tidak Boleh Terkirim",
    })[0],
    /field yang tidak diizinkan/i,
  );
});

test("aggregate event schema accepts only anonymous result and CTA dimensions", () => {
  const resultEvent = parseSbuReadinessAggregateEvent({
    eventType: "result",
    band: "foundation",
    rubricVersion: SBU_READINESS_RUBRIC_VERSION,
  });
  assert.equal(resultEvent.band, "foundation");

  const ctaEvent = parseSbuReadinessAggregateEvent({
    eventType: "cta",
    band: "organize",
    destination: "ebook",
    rubricVersion: SBU_READINESS_RUBRIC_VERSION,
  });
  assert.equal(ctaEvent.destination, "ebook");

  assert.throws(() =>
    parseSbuReadinessAggregateEvent({
      eventType: "result",
      band: "foundation",
      rubricVersion: SBU_READINESS_RUBRIC_VERSION,
      answers: answers("none"),
    }),
  );
  assert.throws(() =>
    parseSbuReadinessAggregateEvent({
      eventType: "cta",
      band: "organize",
      rubricVersion: SBU_READINESS_RUBRIC_VERSION,
    }),
  );
  assert.throws(() =>
    parseSbuReadinessAggregateEvent({
      eventType: "result",
      band: "validate",
      destination: "ai-specialist",
      rubricVersion: SBU_READINESS_RUBRIC_VERSION,
    }),
  );
});

test("aggregate recorder increments only a static anonymous counter key", async () => {
  const calls: Array<{ sql: string; params?: unknown[] }> = [];
  const event = {
    eventType: "cta" as const,
    band: "validate" as const,
    destination: "ai-specialist" as const,
    rubricVersion: SBU_READINESS_RUBRIC_VERSION,
  };
  const expectedKey = [
    "sbu_readiness",
    SBU_READINESS_RUBRIC_VERSION,
    "cta",
    "validate",
    "ai-specialist",
  ].join(":");

  assert.equal(buildSbuReadinessAggregateKey(event), expectedKey);
  await recordSbuReadinessAggregateEvent(event, {
    async query(sql, params) {
      calls.push({ sql, params });
      return {};
    },
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].params, [expectedKey]);
  assert.match(calls[0].sql, /ON CONFLICT \(key\) DO UPDATE/i);
  assert.doesNotMatch(calls[0].sql, /email|phone|company|answer|session/i);
});

test("rate-limit identity uses Express trusted IP, never raw forwarded headers", () => {
  const request = {
    ip: "198.51.100.27",
    headers: { "x-forwarded-for": "203.0.113.10" },
    socket: { remoteAddress: "10.0.0.8" },
  } as unknown as Request;

  assert.equal(getTrustedClientIp(request), "198.51.100.27");
  request.headers["x-forwarded-for"] = "192.0.2.99";
  assert.equal(getTrustedClientIp(request), "198.51.100.27");
});

test("event ingress rate-limits before strict small-body parsing", async (context) => {
  const app = express();
  const seenIps: string[] = [];
  app.set("trust proxy", false);
  registerSbuReadinessEventIngress(app, {
    async checkRate(ip) {
      seenIps.push(ip);
      return true;
    },
  });
  registerSbuSkkFunnelRoutes(app);

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  context.after(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );
  const port = (server.address() as AddressInfo).port;
  const url = `http://127.0.0.1:${port}/api/sbu-skk/readiness/events`;
  const post = (body: string, forwardedFor: string) =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": forwardedFor,
      },
      body,
    });

  const extraField = await post(
    JSON.stringify({
      eventType: "result",
      band: "foundation",
      rubricVersion: SBU_READINESS_RUBRIC_VERSION,
      answers: answers("none"),
    }),
    "203.0.113.10",
  );
  assert.equal(extraField.status, 400);

  const malformed = await post("{", "192.0.2.99");
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: "JSON tidak valid." });

  const oversized = await post(
    JSON.stringify({ padding: "x".repeat(1_200) }),
    "198.51.100.41",
  );
  assert.equal(oversized.status, 413);
  assert.deepEqual(await oversized.json(), { error: "Payload terlalu besar." });

  assert.equal(seenIps.length, 3);
  assert.equal(new Set(seenIps).size, 1);
});