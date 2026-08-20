import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { and, eq, like } from "drizzle-orm";
import { db } from "../server/db";
import { reconcileChatbotModules } from "../server/reconcile-chatbot-modules";
import { agents, bigIdeas, systemConfig, toolboxes } from "../shared/schema";

const RUN = `${Date.now()}-${process.pid}`;
const RECOVERY_PREFIX = "chatbot-module-test:recovery:";
const RECOVERY_KEY = `${RECOVERY_PREFIX}${RUN}`;
const AGENT_SLUG = `chatbot-module-test-agent-${RUN}`;
const MODULE_SLUG = `chatbot-module-test-module-${RUN}`;
const CONFLICT_MODULE_SLUG = `chatbot-module-test-conflict-${RUN}`;
const ORIGINAL_PROMPT = `PROMPT-UNCHANGED-${RUN}`;

interface RecoveryRecord {
  agentSlug: string;
  moduleSlugs: string[];
}

const moduleDefinition = {
  slug: MODULE_SLUG,
  name: `Test Module ${RUN}`,
  type: "solution",
  description: "Fixture pengujian rekonsiliasi modul.",
  targetAudience: "Pengujian",
  expectedOutcome: "Relasi stabil",
};

async function cleanupRecord(record: RecoveryRecord): Promise<void> {
  await db.delete(agents).where(eq(agents.slug, record.agentSlug));

  for (const moduleSlug of record.moduleSlugs) {
    const rows = await db
      .select({ id: bigIdeas.id })
      .from(bigIdeas)
      .where(eq(bigIdeas.slug, moduleSlug));
    for (const row of rows) {
      await db.delete(toolboxes).where(eq(toolboxes.bigIdeaId, row.id));
      await db.delete(bigIdeas).where(eq(bigIdeas.id, row.id));
    }
  }
}

async function sweepAbortedRuns(): Promise<void> {
  const stale = await db
    .select()
    .from(systemConfig)
    .where(like(systemConfig.key, `${RECOVERY_PREFIX}%`));

  for (const row of stale) {
    if (row.key === RECOVERY_KEY) continue;
    try {
      await cleanupRecord(JSON.parse(row.value) as RecoveryRecord);
      await db.delete(systemConfig).where(eq(systemConfig.key, row.key));
    } catch (error) {
      console.error(`[chatbot-module-test] recovery retained for ${row.key}:`, error);
    }
  }
}

before(async () => {
  await sweepAbortedRuns();

  const recovery: RecoveryRecord = {
    agentSlug: AGENT_SLUG,
    moduleSlugs: [MODULE_SLUG, CONFLICT_MODULE_SLUG],
  };
  await db
    .insert(systemConfig)
    .values({ key: RECOVERY_KEY, value: JSON.stringify(recovery) })
    .onConflictDoUpdate({
      target: systemConfig.key,
      set: { value: JSON.stringify(recovery), updatedAt: new Date() },
    });

  await cleanupRecord(recovery);
  await db.insert(agents).values({
    slug: AGENT_SLUG,
    name: `Test Agent ${RUN}`,
    description: "Fixture rekonsiliasi modul",
    tagline: "Fixture",
    category: "test",
    language: "id",
    systemPrompt: ORIGINAL_PROMPT,
    userId: "",
    isPublic: true,
    isActive: true,
    premiumClass: "private",
  });
});

after(async () => {
  const recovery: RecoveryRecord = {
    agentSlug: AGENT_SLUG,
    moduleSlugs: [MODULE_SLUG, CONFLICT_MODULE_SLUG],
  };
  await cleanupRecord(recovery);
  await db.delete(systemConfig).where(eq(systemConfig.key, RECOVERY_KEY));
});

test("reconciler assigns once without changing prompt or premium class", async () => {
  const first = await reconcileChatbotModules({
    assignments: [[AGENT_SLUG, MODULE_SLUG]],
    newModules: [moduleDefinition],
  });

  assert.equal(first.modulesCreated, 1);
  assert.equal(first.toolboxesCreated, 1);
  assert.equal(first.agentsAssigned, 1);
  assert.deepEqual(first.missingAgents, []);
  assert.deepEqual(first.missingModules, []);
  assert.deepEqual(first.conflicts, []);

  const [assigned] = await db
    .select({
      bigIdeaId: agents.bigIdeaId,
      toolboxId: agents.toolboxId,
      premiumClass: agents.premiumClass,
      systemPrompt: agents.systemPrompt,
    })
    .from(agents)
    .where(eq(agents.slug, AGENT_SLUG));

  assert.ok(assigned.bigIdeaId);
  assert.ok(assigned.toolboxId);
  assert.equal(assigned.premiumClass, "private");
  assert.equal(assigned.systemPrompt, ORIGINAL_PROMPT);

  const second = await reconcileChatbotModules({
    assignments: [[AGENT_SLUG, MODULE_SLUG]],
    newModules: [moduleDefinition],
  });
  assert.equal(second.modulesCreated, 0);
  assert.equal(second.toolboxesCreated, 0);
  assert.equal(second.agentsAssigned, 0);
  assert.equal(second.alreadyAssigned, 1);

  const moduleRows = await db
    .select()
    .from(bigIdeas)
    .where(eq(bigIdeas.slug, MODULE_SLUG));
  const toolboxRows = await db
    .select()
    .from(toolboxes)
    .where(and(
      eq(toolboxes.bigIdeaId, moduleRows[0].id),
      eq(toolboxes.slug, `${MODULE_SLUG}-ai-specialist`),
    ));
  assert.equal(moduleRows.length, 1);
  assert.equal(toolboxRows.length, 1);
});

test("reconciler reports a conflict instead of moving an already-mapped agent", async () => {
  const [conflictModule] = await db
    .insert(bigIdeas)
    .values({
      slug: CONFLICT_MODULE_SLUG,
      name: `Conflict Module ${RUN}`,
      type: "solution",
      description: "Fixture konflik",
      goals: [],
      targetAudience: "Pengujian",
      expectedOutcome: "Tidak dipindahkan",
      sortOrder: 0,
      monthlyPrice: 0,
      trialEnabled: true,
      trialDays: 7,
      requireRegistration: false,
      isActive: true,
    })
    .returning();

  await db
    .update(agents)
    .set({ bigIdeaId: conflictModule.id, toolboxId: null })
    .where(eq(agents.slug, AGENT_SLUG));

  const result = await reconcileChatbotModules({
    assignments: [[AGENT_SLUG, MODULE_SLUG]],
    newModules: [moduleDefinition],
  });
  assert.equal(result.agentsAssigned, 0);
  assert.equal(result.conflicts.length, 1);

  const [unchanged] = await db
    .select({
      bigIdeaId: agents.bigIdeaId,
      premiumClass: agents.premiumClass,
      systemPrompt: agents.systemPrompt,
    })
    .from(agents)
    .where(eq(agents.slug, AGENT_SLUG));
  assert.equal(unchanged.bigIdeaId, conflictModule.id);
  assert.equal(unchanged.premiumClass, "private");
  assert.equal(unchanged.systemPrompt, ORIGINAL_PROMPT);
});