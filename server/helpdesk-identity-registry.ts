import { eq } from "drizzle-orm";
import { systemConfig } from "@shared/schema";
import { db } from "./db";

const KEY_PREFIX = "gustafta_helpdesk_agent_id:";
const knownIds = new Set<string>();

function registryKey(agentId: string): string {
  return `${KEY_PREFIX}${agentId}`;
}

/**
 * Persist every agent id ever issued as the public Help Desk. One key per id
 * avoids read-modify-write races between autoscale instances and lets stale
 * browser tabs remain fail-closed even after the row loses its mutable name or
 * slug.
 */
export async function rememberHelpdeskAgentId(agentId: string | number): Promise<void> {
  const normalizedId = String(agentId).trim();
  if (!normalizedId || knownIds.has(normalizedId)) return;

  await db
    .insert(systemConfig)
    .values({ key: registryKey(normalizedId), value: "1" })
    .onConflictDoNothing({ target: systemConfig.key });
  knownIds.add(normalizedId);
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