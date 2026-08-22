import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import type { Agent } from "../shared/schema";
import { SBU_SKK_EBOOK, SBU_SKK_FUNNEL } from "../shared/sbu-skk-ebook";
import {
  buildHelpdeskStartupReconciliationPatch,
  getPublicHelpdeskRequestIssues,
  getPublicHelpdeskConfigurationIssues,
  GUSTAFTA_HELPDESK_SLUG,
  resolvePublicHelpdeskAgent,
  toPublicHelpdeskAgent,
} from "../server/helpdesk-agent";
import { gustaftaKnowledgeBaseAgent } from "../server/seed-knowledge-base";

function agent(overrides: Record<string, unknown> = {}): Agent {
  return {
    id: 1,
    name: "Gustafta Helpdesk",
    slug: GUSTAFTA_HELPDESK_SLUG,
    isPublic: true,
    isActive: true,
    isEnabled: true,
    archived: false,
    systemPrompt: "Prompt kanonik yang tidak kosong.",
    greetingMessage: "Salam pembuka yang tidak kosong.",
    conversationStarters: ["Saya sedang mengurus SBU. Mulai dari mana?"],
    ...overrides,
  } as unknown as Agent;
}

function storageWith(rows: Agent[]) {
  return {
    getAgentBySlug: async (slug: string) => rows.find((row) => row.slug === slug),
    getAgents: async () => rows,
  };
}

describe("public Help Desk identity and readiness", () => {
  test("prefers the canonical slug and exposes only the widget contract", async () => {
    const canonical = agent({ id: 41 });
    const duplicateName = agent({ id: 42, slug: "other-helpdesk" });
    const resolution = await resolvePublicHelpdeskAgent(
      storageWith([duplicateName, canonical]) as any,
    );

    assert.equal(resolution.ok, true);
    if (!resolution.ok) return;
    assert.equal(resolution.agent.id, 41);
    assert.equal(resolution.source, "canonical_slug");
    assert.deepEqual(toPublicHelpdeskAgent(resolution.agent), {
      id: "41",
      name: "Gustafta Helpdesk",
      slug: GUSTAFTA_HELPDESK_SLUG,
      availability: "ready",
      greetingMessage: "Salam pembuka yang tidak kosong.",
      conversationStarters: ["Saya sedang mengurus SBU. Mulai dari mana?"],
    });
    assert.equal("systemPrompt" in toPublicHelpdeskAgent(resolution.agent), false);
  });

  test("fails closed instead of choosing one of several mutable-name rows", async () => {
    const first = agent({ id: 1, slug: null });
    const second = agent({ id: 2, slug: null, name: "Gustafta Assistant" });
    const resolution = await resolvePublicHelpdeskAgent(
      storageWith([first, second]) as any,
    );

    assert.deepEqual(resolution, {
      ok: false,
      reason: "ambiguous_legacy_identity",
      issues: ["multiple_legacy_name_matches"],
    });
  });

  test("rejects a canonical agent whose public configuration is incomplete", async () => {
    const incomplete = agent({
      isActive: false,
      greetingMessage: " ",
      conversationStarters: [],
    });
    assert.deepEqual(getPublicHelpdeskConfigurationIssues(incomplete), [
      "not_active",
      "greeting_message_empty",
      "conversation_starters_empty",
    ]);

    const resolution = await resolvePublicHelpdeskAgent(
      storageWith([incomplete]) as any,
    );
    assert.equal(resolution.ok, false);
    if (resolution.ok) return;
    assert.equal(resolution.reason, "invalid_configuration");
  });

  test("rejects a previously issued single-legacy ID after it becomes inactive", async () => {
    const legacy = agent({ id: 71, slug: null });
    const rows = [legacy];
    const fakeStorage = storageWith(rows);
    const initial = await resolvePublicHelpdeskAgent(fakeStorage as any);
    assert.equal(initial.ok, true);
    if (!initial.ok) return;
    assert.equal(initial.source, "single_legacy_name");
    assert.deepEqual(
      await getPublicHelpdeskRequestIssues(fakeStorage as any, legacy),
      [],
    );

    (legacy as any).isActive = false;
    assert.deepEqual(
      await getPublicHelpdeskRequestIssues(fakeStorage as any, legacy),
      ["not_active"],
    );
  });

  test("rejects a remembered legacy ID after its mutable identity is removed", async () => {
    const legacy = agent({ id: 72, slug: null });
    const rows = [legacy];
    const fakeStorage = storageWith(rows);
    const initial = await resolvePublicHelpdeskAgent(fakeStorage as any);
    assert.equal(initial.ok, true);

    (legacy as any).name = "Renamed public agent";
    (legacy as any).isActive = false;
    const issues = await getPublicHelpdeskRequestIssues(
      fakeStorage as any,
      legacy,
      { knownHelpdeskIdentity: true },
    );
    assert.deepEqual(issues, ["canonical_agent_missing"]);
  });

  test("startup content reconciliation preserves an admin-disabled state", () => {
    const existing = agent({
      isPublic: false,
      isActive: false,
      isEnabled: false,
      archived: true,
    });
    const patch = buildHelpdeskStartupReconciliationPatch(
      gustaftaKnowledgeBaseAgent as any,
    );
    const reconciled = { ...existing, ...patch };

    assert.equal("isPublic" in patch, false);
    assert.equal("isActive" in patch, false);
    assert.equal("isEnabled" in patch, false);
    assert.equal("archived" in patch, false);
    assert.equal(reconciled.isPublic, false);
    assert.equal(reconciled.isActive, false);
    assert.equal((reconciled as any).isEnabled, false);
    assert.equal((reconciled as any).archived, true);
    assert.equal(reconciled.slug, GUSTAFTA_HELPDESK_SLUG);
  });

  test("routes the public widget alias through the canonical fail-closed resolver", async () => {
    const routesSource = await readFile(
      new URL("../server/routes.ts", import.meta.url),
      "utf8",
    );
    const resolverStart = routesSource.indexOf("async function resolveAgent(agentId: string)");
    const resolverEnd = routesSource.indexOf("// Webhook notifikasi WA internal", resolverStart);
    assert.ok(resolverStart > 0 && resolverEnd > resolverStart);
    const resolverSource = routesSource.slice(resolverStart, resolverEnd);

    assert.match(
      resolverSource,
      /agentId === "gustafta-helpdesk"[\s\S]*resolvePublicHelpdeskAgent\(storage\)/,
    );
    assert.doesNotMatch(resolverSource, /Gustafta Helpdesk|Gustafta Assistant/);
  });

  test("revalidates canonical Help Desk readiness at message-send time", async () => {
    const routesSource = await readFile(
      new URL("../server/routes.ts", import.meta.url),
      "utf8",
    );
    const resolverStart = routesSource.indexOf(
      "async function resolveMessageAgentTarget(",
    );
    const resolverEnd = routesSource.indexOf(
      "// Send message and get AI response",
      resolverStart,
    );
    assert.ok(resolverStart > 0 && resolverEnd > resolverStart);
    const messageResolverSource = routesSource.slice(resolverStart, resolverEnd);
    assert.match(messageResolverSource, /GUSTAFTA_HELPDESK_SLUG/);
    assert.match(messageResolverSource, /isRememberedHelpdeskAgentId\(agent\.id\)/);
    assert.match(
      messageResolverSource,
      /getPublicHelpdeskRequestIssues\(storage, agent,/,
    );
    assert.match(messageResolverSource, /status: 503/);

    const nonStreamStart = routesSource.indexOf('app.post("/api/messages"');
    const nonStreamEnd = routesSource.indexOf(
      "// Streaming message endpoint",
      nonStreamStart,
    );
    const nonStreamSource = routesSource.slice(nonStreamStart, nonStreamEnd);
    assert.match(nonStreamSource, /resolveMessageAgentTarget\(parsed\.data\.agentId\)/);

    const streamStart = routesSource.indexOf('app.post("/api/messages/stream"');
    const streamEnd = routesSource.indexOf("// ── SBU-SKK Tutor", streamStart);
    assert.ok(streamStart > 0 && streamEnd > streamStart);
    const streamGuardSource = routesSource.slice(streamStart, streamEnd);
    assert.match(
      streamGuardSource,
      /resolveMessageAgentTarget\(parsed\.data\.agentId\)/,
    );
  });
});

describe("canonical public funnel content", () => {
  test("keeps every public funnel step non-empty and uniquely routable", () => {
    const destinations = [
      SBU_SKK_FUNNEL.readiness,
      SBU_SKK_FUNNEL.miniEbook,
      SBU_SKK_FUNNEL.bundle,
      SBU_SKK_FUNNEL.aiSpecialist,
    ];
    const routes = destinations.map((destination) => destination.landingPath);

    assert.equal(new Set(routes).size, routes.length);
    for (const destination of destinations) {
      assert.ok(destination.title.trim().length > 0);
      assert.match(destination.landingPath, /^\//);
    }
    assert.ok(SBU_SKK_EBOOK.title.trim().length > 0);
    assert.ok(SBU_SKK_EBOOK.amount > 0);
    assert.ok(SBU_SKK_EBOOK.totalPackagePages > 0);
  });

  test("seeds a ready canonical Help Desk grounded in the same funnel metadata", () => {
    const seed = gustaftaKnowledgeBaseAgent as Record<string, any>;
    assert.equal(seed.slug, GUSTAFTA_HELPDESK_SLUG);
    assert.equal(seed.isPublic, true);
    assert.equal(seed.isActive, true);
    assert.equal(seed.isEnabled, true);
    assert.ok(String(seed.greetingMessage).trim().length > 0);
    assert.ok(Array.isArray(seed.conversationStarters));
    assert.ok(seed.conversationStarters.length > 0);

    for (const text of [
      SBU_SKK_FUNNEL.readiness.landingPath,
      SBU_SKK_FUNNEL.miniEbook.landingPath,
      SBU_SKK_FUNNEL.bundle.landingPath,
      SBU_SKK_FUNNEL.aiSpecialist.landingPath,
      SBU_SKK_FUNNEL.bundle.priceLabel,
    ]) {
      assert.ok(
        String(seed.systemPrompt).includes(text),
        `Help Desk seed must contain canonical funnel value: ${text}`,
      );
    }
  });
});

test(
  "live development backend has a ready Help Desk and non-empty public catalog",
  { skip: !process.env.DATABASE_URL },
  async () => {
    const [{ DatabaseStorage }, { getStoreCatalogItems, invalidateStoreCatalog }] =
      await Promise.all([
        import("../server/db-storage"),
        import("../server/routes"),
      ]);
    const liveStorage = new DatabaseStorage();
    const resolution = await resolvePublicHelpdeskAgent(liveStorage);
    assert.equal(
      resolution.ok,
      true,
      resolution.ok
        ? undefined
        : `Help Desk unavailable: ${resolution.reason} (${resolution.issues.join(",")})`,
    );

    invalidateStoreCatalog();
    const catalog = await getStoreCatalogItems("", "");
    assert.ok(catalog.length > 0, "Public catalog must not silently become empty");
    for (const item of catalog) {
      assert.ok(String(item.name ?? "").trim().length > 0);
      assert.ok(item.type === "agent" || item.type === "product");
    }
  },
);