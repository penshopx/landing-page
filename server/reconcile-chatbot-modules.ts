import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { agents, bigIdeas, toolboxes } from "@shared/schema";
import {
  CHATBOT_MODULE_ASSIGNMENTS,
  NEW_PROMOTIONAL_MODULES,
  type PromotionalModuleDefinition,
} from "./chatbot-module-map";

export type ChatbotModuleAssignment = readonly [
  agentSlug: string,
  moduleSlug: string,
  preferredExistingToolboxName?: string,
];

export interface ChatbotModuleReconcileResult {
  modulesCreated: number;
  toolboxesCreated: number;
  toolboxesBackfilled: number;
  agentsAssigned: number;
  alreadyAssigned: number;
  missingAgents: string[];
  missingModules: string[];
  duplicateAgentSlugs: string[];
  duplicateModuleSlugs: string[];
  conflicts: Array<{ agentSlug: string; currentModuleId: number; targetModuleId: number }>;
}

export function assertChatbotModuleReconcileHealthy(
  result: ChatbotModuleReconcileResult,
): void {
  const issues = [
    result.missingAgents.length > 0
      ? `${result.missingAgents.length} agent tidak ditemukan`
      : "",
    result.missingModules.length > 0
      ? `${result.missingModules.length} Modul tidak ditemukan`
      : "",
    result.duplicateAgentSlugs.length > 0
      ? `${result.duplicateAgentSlugs.length} slug agent duplikat`
      : "",
    result.duplicateModuleSlugs.length > 0
      ? `${result.duplicateModuleSlugs.length} slug Modul duplikat`
      : "",
    result.conflicts.length > 0
      ? `${result.conflicts.length} konflik kepemilikan Modul`
      : "",
  ].filter(Boolean);

  if (issues.length > 0) {
    throw new Error(`Cakupan pemetaan chatbot per Modul tidak lengkap: ${issues.join(", ")}`);
  }
}

interface ReconcileOptions {
  assignments?: readonly ChatbotModuleAssignment[];
  newModules?: readonly PromotionalModuleDefinition[];
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export async function reconcileChatbotModules(
  options: ReconcileOptions = {},
): Promise<ChatbotModuleReconcileResult> {
  const assignments = options.assignments ?? CHATBOT_MODULE_ASSIGNMENTS;
  const moduleDefinitions = options.newModules ?? NEW_PROMOTIONAL_MODULES;
  const definitionsBySlug = new Map(moduleDefinitions.map((module) => [module.slug, module]));

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('gustafta-chatbot-module-reconcile-v1'))`);

    const result: ChatbotModuleReconcileResult = {
      modulesCreated: 0,
      toolboxesCreated: 0,
      toolboxesBackfilled: 0,
      agentsAssigned: 0,
      alreadyAssigned: 0,
      missingAgents: [],
      missingModules: [],
      duplicateAgentSlugs: [],
      duplicateModuleSlugs: [],
      conflicts: [],
    };

    const targetModuleSlugs = [...new Set(assignments.map(([, moduleSlug]) => moduleSlug))];
    const modulesBySlug = new Map<string, typeof bigIdeas.$inferSelect>();

    for (const moduleSlug of targetModuleSlugs) {
      const moduleRows = await tx
        .select()
        .from(bigIdeas)
        .where(eq(bigIdeas.slug, moduleSlug))
        .limit(2);
      if (moduleRows.length > 1) {
        result.duplicateModuleSlugs.push(moduleSlug);
        continue;
      }
      let [module] = moduleRows;

      if (!module) {
        const definition = definitionsBySlug.get(moduleSlug);
        if (!definition) {
          result.missingModules.push(moduleSlug);
          continue;
        }

        [module] = await tx
          .insert(bigIdeas)
          .values({
            slug: definition.slug,
            name: definition.name,
            type: definition.type,
            description: definition.description,
            goals: [],
            targetAudience: definition.targetAudience,
            expectedOutcome: definition.expectedOutcome,
            sortOrder: 0,
            monthlyPrice: 0,
            trialEnabled: true,
            trialDays: 7,
            requireRegistration: false,
            isActive: true,
          })
          .returning();
        result.modulesCreated += 1;
      }

      modulesBySlug.set(moduleSlug, module);
    }

    const toolboxCache = new Map<string, typeof toolboxes.$inferSelect>();

    const resolveToolbox = async (
      module: typeof bigIdeas.$inferSelect,
      moduleSlug: string,
      preferredName?: string,
    ) => {
      const cacheKey = `${module.id}:${preferredName || "__default__"}`;
      const cached = toolboxCache.get(cacheKey);
      if (cached) return cached;

      if (preferredName) {
        const [preferred] = await tx
          .select()
          .from(toolboxes)
          .where(and(eq(toolboxes.bigIdeaId, module.id), eq(toolboxes.name, preferredName)))
          .limit(1);

        if (preferred) {
          if (!preferred.slug) {
            const preferredSlug = `${moduleSlug}-${slugify(preferredName)}`;
            const [backfilled] = await tx
              .update(toolboxes)
              .set({ slug: preferredSlug })
              .where(eq(toolboxes.id, preferred.id))
              .returning();
            result.toolboxesBackfilled += 1;
            toolboxCache.set(cacheKey, backfilled);
            return backfilled;
          }

          toolboxCache.set(cacheKey, preferred);
          return preferred;
        }
      }

      const defaultSlug = `${moduleSlug}-ai-specialist`;
      const defaultKey = `${module.id}:__default__`;
      const defaultCached = toolboxCache.get(defaultKey);
      if (defaultCached) {
        toolboxCache.set(cacheKey, defaultCached);
        return defaultCached;
      }

      let [toolbox] = await tx
        .select()
        .from(toolboxes)
        .where(and(eq(toolboxes.bigIdeaId, module.id), eq(toolboxes.slug, defaultSlug)))
        .limit(1);

      if (!toolbox) {
        [toolbox] = await tx
          .insert(toolboxes)
          .values({
            bigIdeaId: module.id,
            seriesId: module.seriesId,
            slug: defaultSlug,
            isOrchestrator: false,
            name: "AI Specialist Utama",
            description: `Koleksi AI Specialist existing untuk modul ${module.name}.`,
            purpose: `Mengelompokkan layanan berdasarkan fungsi utama modul ${module.name}.`,
            capabilities: [],
            limitations: [],
            sortOrder: 999,
            isActive: true,
          })
          .returning();
        result.toolboxesCreated += 1;
      }

      toolboxCache.set(defaultKey, toolbox);
      toolboxCache.set(cacheKey, toolbox);
      return toolbox;
    };

    for (const [agentSlug, moduleSlug, preferredToolboxName] of assignments) {
      const module = modulesBySlug.get(moduleSlug);
      if (!module) continue;

      const rows = await tx
        .select({
          agent: agents,
          toolboxModuleId: toolboxes.bigIdeaId,
        })
        .from(agents)
        .leftJoin(toolboxes, eq(agents.toolboxId, toolboxes.id))
        .where(eq(agents.slug, agentSlug))
        .limit(2);
      if (rows.length > 1) {
        result.duplicateAgentSlugs.push(agentSlug);
        continue;
      }
      const [row] = rows;

      if (!row) {
        result.missingAgents.push(agentSlug);
        continue;
      }

      const directModuleId = row.agent.bigIdeaId;
      const toolboxModuleId = row.toolboxModuleId;

      // Dua pointer ke Modul berbeda adalah kepemilikan ambigu walaupun aturan
      // baca memilih bigIdeaId langsung. Jangan menutupinya sebagai "already
      // assigned": laporkan konflik agar audit otomatis gagal dan data dapat
      // diperbaiki tanpa memindahkan agent secara diam-diam.
      if (
        directModuleId !== null
        && toolboxModuleId !== null
        && directModuleId !== toolboxModuleId
      ) {
        result.conflicts.push({
          agentSlug,
          currentModuleId: directModuleId === module.id ? toolboxModuleId : directModuleId,
          targetModuleId: module.id,
        });
        continue;
      }

      const currentModuleId = directModuleId ?? toolboxModuleId;
      if (currentModuleId !== null && currentModuleId !== module.id) {
        result.conflicts.push({
          agentSlug,
          currentModuleId,
          targetModuleId: module.id,
        });
        continue;
      }

      if (currentModuleId === module.id && row.agent.toolboxId !== null) {
        result.alreadyAssigned += 1;
        continue;
      }

      const toolbox = await resolveToolbox(module, moduleSlug, preferredToolboxName);
      await tx
        .update(agents)
        .set({
          bigIdeaId: module.id,
          toolboxId: toolbox.id,
        })
        .where(eq(agents.id, row.agent.id));
      result.agentsAssigned += 1;
    }

    return result;
  });
}