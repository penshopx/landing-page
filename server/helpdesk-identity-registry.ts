import { eq } from "drizzle-orm";
import { systemConfig } from "@shared/schema";
import { db } from "./db";

const KEY_PREFIX = "gustafta_helpdesk_agent_id:";
const knownIds = new Set<string>();
const PLATFORM_GUIDE_KEY_PREFIX = "gustafta_platform_guide_agent_id:";
const knownPlatformGuideIds = new Set<string>();
const EXCLUSIVE_IDENTITY_KEY_PREFIX = "gustafta_public_helpdesk_identity:";

export type PublicHelpdeskIdentityKind = "helpdesk" | "platform-guide";

export type PublicHelpdeskIdentityClaim =
  | { ok: true }
  | { ok: false; reason: "identity_conflict" };

function registryKey(agentId: string): string {
  return `${KEY_PREFIX}${agentId}`;
}

function platformGuideRegistryKey(agentId: string): string {
  return `${PLATFORM_GUIDE_KEY_PREFIX}${agentId}`;
}

function exclusiveIdentityRegistryKey(agentId: string): string {
  return `${EXCLUSIVE_IDENTITY_KEY_PREFIX}${agentId}`;
}

async function claimPublicHelpdeskIdentity(
  identity: PublicHelpdeskIdentityKind,
  agentId: string | number,
): Promise<PublicHelpdeskIdentityClaim> {
  const normalizedId = String(agentId).trim();
  if (!normalizedId) return { ok: false, reason: "identity_conflict" };

  const ownKey = identity === "helpdesk"
    ? registryKey(normalizedId)
    : platformGuideRegistryKey(normalizedId);
  const otherKey = identity === "helpdesk"
    ? platformGuideRegistryKey(normalizedId)
    : registryKey(normalizedId);
  const exclusiveKey = exclusiveIdentityRegistryKey(normalizedId);

  const claimed = await db.transaction(async (tx) => {
    const conflictingRows = await tx
      .select({ key: systemConfig.key })
      .from(systemConfig)
      .where(eq(systemConfig.key, otherKey))
      .limit(1);
    if (conflictingRows.length > 0) return false;

    await tx
      .insert(systemConfig)
      .values({ key: exclusiveKey, value: identity })
      .onConflictDoNothing({ target: systemConfig.key });

    const [exclusiveIdentity] = await tx
      .select({ value: systemConfig.value })
      .from(systemConfig)
      .where(eq(systemConfig.key, exclusiveKey))
      .limit(1);
    if (!exclusiveIdentity || exclusiveIdentity.value !== identity) {
      return false;
    }

    const conflictsAfterClaim = await tx
      .select({ key: systemConfig.key })
      .from(systemConfig)
      .where(eq(systemConfig.key, otherKey))
      .limit(1);
    if (conflictsAfterClaim.length > 0) return false;

    await tx
      .insert(systemConfig)
      .values({ key: ownKey, value: "1" })
      .onConflictDoNothing({ target: systemConfig.key });
    return true;
  });

  if (!claimed) return { ok: false, reason: "identity_conflict" };
  if (identity === "helpdesk") knownIds.add(normalizedId);
  else knownPlatformGuideIds.add(normalizedId);
  return { ok: true };
}

export function claimHelpdeskAgentId(
  agentId: string | number,
): Promise<PublicHelpdeskIdentityClaim> {
  return claimPublicHelpdeskIdentity("helpdesk", agentId);
}

export function claimPlatformGuideAgentId(
  agentId: string | number,
): Promise<PublicHelpdeskIdentityClaim> {
  return claimPublicHelpdeskIdentity("platform-guide", agentId);
}

/**
 * Persist every agent id ever issued as the public Help Desk. One key per id
 * avoids read-modify-write races between autoscale instances and lets stale
 * browser tabs remain fail-closed even after the row loses its mutable name or
 * slug.
 */
export async function rememberHelpdeskAgentId(agentId: string | number): Promise<void> {
  const claim = await claimHelpdeskAgentId(agentId);
  if (!claim.ok) {
    throw new Error("Help Desk agent ID is already claimed by another identity");
  }
}

export async function isRememberedHelpdeskAgentId(
  agentId: string | number,
): Promise<boolean> {
  const normalizedId = String(agentId).trim();
  if (!normalizedId) return false;
  if (knownIds.has(normalizedId)) return true;

  const rows = await db
    .select({ key: systemConfig.key })
    .from(systemConfig)
    .where(eq(systemConfig.key, registryKey(normalizedId)))
    .limit(1);
  if (rows.length === 0) return false;

  knownIds.add(normalizedId);
  return true;
}

/**
 * The platform guide intentionally uses a different durable namespace. An ID
 * issued by one public Help Desk must never make it eligible for the other.
 */
export async function rememberPlatformGuideAgentId(
  agentId: string | number,
): Promise<void> {
  const claim = await claimPlatformGuideAgentId(agentId);
  if (!claim.ok) {
    throw new Error("Platform Guide agent ID is already claimed by another identity");
  }
}

export async function isRememberedPlatformGuideAgentId(
  agentId: string | number,
): Promise<boolean> {
  const normalizedId = String(agentId).trim();
  if (!normalizedId) return false;
  if (knownPlatformGuideIds.has(normalizedId)) return true;

  const rows = await db
    .select({ key: systemConfig.key })
    .from(systemConfig)
    .where(eq(systemConfig.key, platformGuideRegistryKey(normalizedId)))
    .limit(1);
  if (rows.length === 0) return false;

  knownPlatformGuideIds.add(normalizedId);
  return true;
}