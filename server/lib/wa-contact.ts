/**
 * WA Contact number persistence — load/save/get helpers + admin handler factory.
 *
 * Extracted from routes.ts so they can be unit/integration tested independently.
 *
 * Runtime flow:
 *   1. At startup, `loadWaContactFromDb()` is called and the result is stored in
 *      `_cachedWaContact` (an in-process cache).
 *   2. GET /api/config/contact calls `getWaContact()` — returns the cache or fallbacks.
 *   3. POST /api/admin/contact uses `makeAdminContactHandler()` — normalises digits,
 *      validates length, calls `saveWaContactToDb()`, and refreshes the in-process cache
 *      so the very next GET sees the new values without a redeploy.
 *
 * The DB keys are:  system_config.key = "wa_contact_primary" | "wa_contact_secondary"
 */

import { db } from "../db";
import { systemConfig } from "../../shared/schema";
import { inArray } from "drizzle-orm";
import type { RequestHandler } from "express";

export const WA_CONTACT_DEFAULTS = {
  primary: process.env.WA_CONTACT_PRIMARY || "6281287941900",
  secondary: process.env.WA_CONTACT_SECONDARY || "6282299417818",
};

// Module-level in-process cache — null until first load or first admin save.
let _cachedWaContact: { primary: string; secondary: string } | null = null;

/** Read both config rows from the DB. Returns null if neither key exists yet. */
export async function loadWaContactFromDb(): Promise<{ primary: string; secondary: string } | null> {
  try {
    const rows = await db.select().from(systemConfig)
      .where(inArray(systemConfig.key, ["wa_contact_primary", "wa_contact_secondary"]));
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const primary = map["wa_contact_primary"];
    const secondary = map["wa_contact_secondary"];
    if (!primary && !secondary) return null;
    return {
      primary: primary || WA_CONTACT_DEFAULTS.primary,
      secondary: secondary || WA_CONTACT_DEFAULTS.secondary,
    };
  } catch { return null; }
}

/**
 * Upsert both numbers into system_config AND refresh the in-process cache.
 * Errors propagate — the caller must return non-2xx on failure.
 */
export async function saveWaContactToDb(primary: string, secondary: string): Promise<void> {
  await db.insert(systemConfig).values({ key: "wa_contact_primary", value: primary })
    .onConflictDoUpdate({ target: systemConfig.key, set: { value: primary, updatedAt: new Date() } });
  await db.insert(systemConfig).values({ key: "wa_contact_secondary", value: secondary })
    .onConflictDoUpdate({ target: systemConfig.key, set: { value: secondary, updatedAt: new Date() } });
  _cachedWaContact = { primary, secondary };
}

/** Return current cached numbers or module-level defaults. Never throws. */
export function getWaContact(): { primary: string; secondary: string } {
  return _cachedWaContact || WA_CONTACT_DEFAULTS;
}

/** Seed the in-process cache (called at startup after `loadWaContactFromDb`). */
export function setWaContactCache(value: { primary: string; secondary: string } | null): void {
  _cachedWaContact = value;
}

/**
 * Strip all non-digit characters from a phone-number string.
 * Allows the admin to paste numbers with dashes, spaces, or a leading "+".
 */
export function normalizeContactNumber(raw: string): string {
  return String(raw).replace(/\D/g, "");
}

/**
 * Factory for the POST /api/admin/contact Express handler.
 *
 * Accepts a `save` callback so tests can inject a stub without hitting the DB.
 * Production code passes `saveWaContactToDb`.
 */
export function makeAdminContactHandler(
  save: (primary: string, secondary: string) => Promise<void> = saveWaContactToDb,
): RequestHandler {
  return async (req: any, res: any) => {
    const { primary, secondary } = req.body as { primary?: string; secondary?: string };
    if (!primary || !secondary) {
      return res.status(400).json({ error: "primary and secondary required" });
    }
    const cleanPrimary = normalizeContactNumber(primary);
    const cleanSecondary = normalizeContactNumber(secondary);
    if (cleanPrimary.length < 8 || cleanSecondary.length < 8) {
      return res.status(400).json({ error: "Nomor tidak valid (minimal 8 digit)" });
    }
    try {
      await save(cleanPrimary, cleanSecondary);
    } catch (err: any) {
      console.error("[admin/contact] DB write failed:", err);
      return res.status(500).json({ error: "Gagal menyimpan nomor ke database. Coba lagi." });
    }
    return res.json({ ok: true, primary: cleanPrimary, secondary: cleanSecondary });
  };
}
