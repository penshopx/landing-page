import type { Agent } from "@shared/schema";
import type { IStorage } from "./storage";

export const GUSTAFTA_HELPDESK_SLUG = "gustafta-helpdesk" as const;
export const GUSTAFTA_PLATFORM_GUIDE_SLUG = "gustafta-platform-guide" as const;
export const GUSTAFTA_HELPDESK_LEGACY_NAMES = [
  "Gustafta Helpdesk",
  "Gustafta Assistant",
] as const;

type HelpdeskStorage = Pick<IStorage, "getAgentBySlug" | "getAgents">;

export type HelpdeskUnavailableReason =
  | "not_found"
  | "ambiguous_legacy_identity"
  | "invalid_configuration";

export interface PublicHelpdeskAgent {
  id: string;
  name: string;
  slug:
    | typeof GUSTAFTA_HELPDESK_SLUG
    | typeof GUSTAFTA_PLATFORM_GUIDE_SLUG;
  availability: "ready";
  greetingMessage: string;
  conversationStarters: string[];
}

export type PublicHelpdeskResolution =
  | {
      ok: true;
      agent: Agent;
      source: "canonical_slug" | "single_legacy_name";
    }
  | {
      ok: false;
      reason: HelpdeskUnavailableReason;
      issues: string[];
    };

type HelpdeskIdentityResolution =
  | {
      ok: true;
      agent: Agent;
      source: "canonical_slug" | "single_legacy_name";
    }
  | {
      ok: false;
      reason: "not_found" | "ambiguous_legacy_identity";
      issues: string[];
    };

function normalizedText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isLegacyHelpdeskName(name: unknown): boolean {
  return GUSTAFTA_HELPDESK_LEGACY_NAMES.includes(
    normalizedText(name) as (typeof GUSTAFTA_HELPDESK_LEGACY_NAMES)[number],
  );
}

function isHelpdeskIdentityCandidate(agent: Agent): boolean {
  return agent.slug === GUSTAFTA_HELPDESK_SLUG
    || isLegacyHelpdeskName(agent.name);
}

function isPlatformGuideIdentityCandidate(agent: Agent): boolean {
  return agent.slug === GUSTAFTA_PLATFORM_GUIDE_SLUG;
}

async function resolveHelpdeskIdentity(
  storage: HelpdeskStorage,
): Promise<HelpdeskIdentityResolution> {
  const canonical = await storage.getAgentBySlug(GUSTAFTA_HELPDESK_SLUG);
  if (canonical) {
    return { ok: true, agent: canonical, source: "canonical_slug" };
  }

  const legacyMatches = (await storage.getAgents()).filter((agent) =>
    isLegacyHelpdeskName(agent.name),
  );
  if (legacyMatches.length === 0) {
    return { ok: false, reason: "not_found", issues: ["canonical_agent_missing"] };
  }
  if (legacyMatches.length > 1) {
    return {
      ok: false,
      reason: "ambiguous_legacy_identity",
      issues: ["multiple_legacy_name_matches"],
    };
  }
  return {
    ok: true,
    agent: legacyMatches[0],
    source: "single_legacy_name",
  };
}

async function resolvePlatformGuideIdentity(
  storage: HelpdeskStorage,
): Promise<HelpdeskIdentityResolution> {
  const canonical = await storage.getAgentBySlug(GUSTAFTA_PLATFORM_GUIDE_SLUG);
  if (!canonical) {
    return { ok: false, reason: "not_found", issues: ["canonical_agent_missing"] };
  }
  return { ok: true, agent: canonical, source: "canonical_slug" };
}

function getResolvedHelpdeskConfigurationIssues(
  resolution: Extract<HelpdeskIdentityResolution, { ok: true }>,
): string[] {
  const issues = getPublicHelpdeskConfigurationIssues(resolution.agent);
  return resolution.source === "single_legacy_name"
    ? issues.filter((issue) => issue !== "canonical_slug_missing")
    : issues;
}

function getResolvedPlatformGuideConfigurationIssues(
  resolution: Extract<HelpdeskIdentityResolution, { ok: true }>,
): string[] {
  return getPublicPlatformGuideConfigurationIssues(resolution.agent);
}

export function getPublicHelpdeskConfigurationIssues(agent: Agent): string[] {
  const issues: string[] = [];
  const starters = Array.isArray(agent.conversationStarters)
    ? agent.conversationStarters.filter((item) => normalizedText(item))
    : [];

  if (agent.slug !== GUSTAFTA_HELPDESK_SLUG) issues.push("canonical_slug_missing");
  if (agent.isPublic !== true) issues.push("not_public");
  if (agent.isActive !== true) issues.push("not_active");
  if ((agent as any).isEnabled === false) issues.push("disabled");
  if ((agent as any).archived === true) issues.push("archived");
  if (!normalizedText(agent.systemPrompt)) issues.push("system_prompt_empty");
  if (!normalizedText(agent.greetingMessage)) issues.push("greeting_message_empty");
  if (starters.length === 0) issues.push("conversation_starters_empty");

  return issues;
}

export function getPublicPlatformGuideConfigurationIssues(agent: Agent): string[] {
  const issues: string[] = [];
  const starters = Array.isArray(agent.conversationStarters)
    ? agent.conversationStarters.filter((item) => normalizedText(item))
    : [];

  if (agent.slug !== GUSTAFTA_PLATFORM_GUIDE_SLUG) {
    issues.push("canonical_slug_missing");
  }
  if (agent.isPublic !== true) issues.push("not_public");
  if (agent.isActive !== true) issues.push("not_active");
  if ((agent as any).isEnabled === false) issues.push("disabled");
  if ((agent as any).archived === true) issues.push("archived");
  if (!normalizedText(agent.systemPrompt)) issues.push("system_prompt_empty");
  if (!normalizedText(agent.greetingMessage)) issues.push("greeting_message_empty");
  if (starters.length === 0) issues.push("conversation_starters_empty");

  return issues;
}

/**
 * Resolve the public Help Desk without trusting mutable names or list ordering.
 * A single legacy-name row is accepted only as a migration bridge; duplicate
 * legacy rows fail closed instead of selecting whichever row happens to be first.
 */
export async function resolvePublicHelpdeskAgent(
  storage: HelpdeskStorage,
): Promise<PublicHelpdeskResolution> {
  const identity = await resolveHelpdeskIdentity(storage);
  if (!identity.ok) return identity;

  const issues = getResolvedHelpdeskConfigurationIssues(identity);
  return issues.length === 0
    ? identity
    : { ok: false, reason: "invalid_configuration", issues };
}

/**
 * The platform guide has no mutable-name migration bridge. It can only be
 * claimed by its canonical slug, so it can never absorb the construction Help
 * Desk or one of that identity's historic aliases.
 */
export async function resolvePublicPlatformGuideAgent(
  storage: HelpdeskStorage,
): Promise<PublicHelpdeskResolution> {
  const identity = await resolvePlatformGuideIdentity(storage);
  if (!identity.ok) return identity;

  const issues = getResolvedPlatformGuideConfigurationIssues(identity);
  return issues.length === 0
    ? identity
    : { ok: false, reason: "invalid_configuration", issues };
}

export async function resolveHelpdeskSeedTarget(
  storage: HelpdeskStorage,
): Promise<Agent | undefined> {
  const identity = await resolveHelpdeskIdentity(storage);
  return identity.ok ? identity.agent : undefined;
}

export async function resolvePlatformGuideSeedTarget(
  storage: HelpdeskStorage,
): Promise<Agent | undefined> {
  const identity = await resolvePlatformGuideIdentity(storage);
  return identity.ok ? identity.agent : undefined;
}

/**
 * Startup may keep canonical identity/content in sync, but it must never undo
 * an administrator's availability decision on an existing Help Desk.
 * Creation uses the full seed; this patch is only for an existing row.
 */
export function buildHelpdeskStartupReconciliationPatch(
  seed: Record<string, any>,
): Record<string, unknown> {
  return {
    name: seed.name,
    slug: GUSTAFTA_HELPDESK_SLUG,
    systemPrompt: seed.systemPrompt,
    greetingMessage: seed.greetingMessage,
    conversationStarters: seed.conversationStarters,
    personality: seed.personality,
    tagline: seed.tagline,
    description: seed.description,
  };
}

export function buildPlatformGuideStartupReconciliationPatch(
  seed: Record<string, any>,
): Record<string, unknown> {
  return {
    name: seed.name,
    slug: GUSTAFTA_PLATFORM_GUIDE_SLUG,
    systemPrompt: seed.systemPrompt,
    greetingMessage: seed.greetingMessage,
    conversationStarters: seed.conversationStarters,
    personality: seed.personality,
    tagline: seed.tagline,
    description: seed.description,
  };
}

/**
 * Return null for ordinary agents. For any canonical/legacy Help Desk
 * candidate, return the issues that must block a numeric-id message send.
 * Identity is re-resolved on every call so a once-valid legacy ID fails closed
 * after deactivation, duplication, or replacement by the canonical row.
 */
export async function getPublicHelpdeskRequestIssues(
  storage: HelpdeskStorage,
  requestedAgent: Agent,
  options: { knownHelpdeskIdentity?: boolean } = {},
): Promise<string[] | null> {
  if (
    options.knownHelpdeskIdentity !== true
    && !isHelpdeskIdentityCandidate(requestedAgent)
  ) {
    return null;
  }

  const identity = await resolveHelpdeskIdentity(storage);
  if (!identity.ok) return identity.issues;
  if (String(identity.agent.id) !== String(requestedAgent.id)) {
    return ["resolved_helpdesk_identity_mismatch"];
  }
  return getResolvedHelpdeskConfigurationIssues(identity);
}

export async function getPublicPlatformGuideRequestIssues(
  storage: HelpdeskStorage,
  requestedAgent: Agent,
  options: { knownPlatformGuideIdentity?: boolean } = {},
): Promise<string[] | null> {
  if (
    options.knownPlatformGuideIdentity !== true
    && !isPlatformGuideIdentityCandidate(requestedAgent)
  ) {
    return null;
  }

  const identity = await resolvePlatformGuideIdentity(storage);
  if (!identity.ok) return identity.issues;
  if (String(identity.agent.id) !== String(requestedAgent.id)) {
    return ["resolved_platform_guide_identity_mismatch"];
  }
  return getResolvedPlatformGuideConfigurationIssues(identity);
}

export function toPublicHelpdeskAgent(agent: Agent): PublicHelpdeskAgent {
  return {
    id: String(agent.id),
    name: normalizedText(agent.name) || "Gustafta Helpdesk",
    slug: GUSTAFTA_HELPDESK_SLUG,
    availability: "ready",
    greetingMessage: normalizedText(agent.greetingMessage),
    conversationStarters: Array.isArray(agent.conversationStarters)
      ? agent.conversationStarters
        .map((item) => normalizedText(item))
        .filter(Boolean)
      : [],
  };
}

export function toPublicPlatformGuideAgent(agent: Agent): PublicHelpdeskAgent {
  return {
    id: String(agent.id),
    name: normalizedText(agent.name) || "Panduan Gustafta",
    slug: GUSTAFTA_PLATFORM_GUIDE_SLUG,
    availability: "ready",
    greetingMessage: normalizedText(agent.greetingMessage),
    conversationStarters: Array.isArray(agent.conversationStarters)
      ? agent.conversationStarters
        .map((item) => normalizedText(item))
        .filter(Boolean)
      : [],
  };
}