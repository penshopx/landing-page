// Integration test: WA contact numbers update live without redeploying.
//
// Strategy:
//   - DB-level tests use the real Postgres database but SNAPSHOT existing
//     wa_contact_primary / wa_contact_secondary rows before writing and
//     RESTORE them exactly in teardown — even on partial failure.
//   - Handler-level tests boot a minimal Express app with a stub `save` callback
//     so they never write to the DB at all.
//   - The GET endpoint test mirrors the exact production wiring
//     (app.get("/api/config/contact") → getWaContact()) to verify cache integration.
//
// Hermetic guarantees:
//   - Original DB values are always restored, including when they were absent.
//   - In-process cache is restored to its pre-test state in teardown.
//   - Handler tests are fully in-memory; they do not touch Postgres.
//
// Covers:
//   1. GET /api/config/contact returns { primary, secondary } shape.
//   2. getWaContact() falls back to defaults before any DB save.
//   3. saveWaContactToDb() upserts and refreshes the in-process cache immediately.
//   4. loadWaContactFromDb() reads the correct config keys (simulates server restart).
//   5. Full rotation cycle: save → GET returns new numbers without restart.
//   6. saveWaContactToDb() is idempotent.
//   7. loadWaContactFromDb() returns null when no rows exist.
//   8. makeAdminContactHandler() normalises numbers (strips non-digits).
//   9. makeAdminContactHandler() returns 400 on missing fields.
//  10. makeAdminContactHandler() returns 400 on numbers shorter than 8 digits.
//  11. makeAdminContactHandler() returns 200 + cleaned numbers on valid input.
//  12. makeAdminContactHandler() returns 500 when the save callback throws.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";

import { db } from "../server/db";
import { systemConfig } from "../shared/schema";
import { eq } from "drizzle-orm";

import {
  loadWaContactFromDb,
  saveWaContactToDb,
  getWaContact,
  setWaContactCache,
  normalizeContactNumber,
  makeAdminContactHandler,
  WA_CONTACT_DEFAULTS,
} from "../server/lib/wa-contact";

// ── Test numbers (safe, non-production values) ────────────────────────────────
const NUM_A_PRIMARY   = "6281100000001";
const NUM_A_SECONDARY = "6282200000001";
const NUM_B_PRIMARY   = "6281100000002";
const NUM_B_SECONDARY = "6282200000002";

// ── Snapshot of pre-test DB state + in-process cache ─────────────────────────
let snapshotPrimary:   string | null = null;
let snapshotSecondary: string | null = null;
let snapshotCache:     { primary: string; secondary: string } | null = null;

// ── Express server for GET + POST handler tests ───────────────────────────────
let server: Server;
let port   = 0;

before(async () => {
  // ── 1. Snapshot existing DB rows so teardown can restore them exactly ──────
  const rows = await db.select().from(systemConfig)
    .where(eq(systemConfig.key, "wa_contact_primary"));
  snapshotPrimary = rows[0]?.value ?? null;

  const rows2 = await db.select().from(systemConfig)
    .where(eq(systemConfig.key, "wa_contact_secondary"));
  snapshotSecondary = rows2[0]?.value ?? null;

  // ── 2. Snapshot in-process cache ──────────────────────────────────────────
  snapshotCache = { ...getWaContact() }; // shallow copy is enough

  // ── 3. Boot minimal Express that mirrors production endpoint wiring ────────
  const app = express();
  app.use(express.json());

  // Mirrors: app.get("/api/config/contact", ...) in routes.ts
  app.get("/api/config/contact", (_req, res) => {
    res.set("Cache-Control", "no-store");
    return res.json(getWaContact());
  });

  // Mirrors: app.post("/api/admin/contact", isAuthenticated, requireAdmin, makeAdminContactHandler())
  // Auth middleware is omitted here because we test the handler logic, not the auth guard.
  app.post("/api/admin/contact", makeAdminContactHandler());

  await new Promise<void>((resolve) => {
    server = createServer(app).listen(0, "127.0.0.1", () => {
      port = (server.address() as any).port;
      resolve();
    });
  });
});

after(async () => {
  // ── Restore DB rows to pre-test state ─────────────────────────────────────
  try {
    if (snapshotPrimary !== null) {
      await db.insert(systemConfig).values({ key: "wa_contact_primary", value: snapshotPrimary })
        .onConflictDoUpdate({ target: systemConfig.key, set: { value: snapshotPrimary, updatedAt: new Date() } });
    } else {
      await db.delete(systemConfig).where(eq(systemConfig.key, "wa_contact_primary"));
    }

    if (snapshotSecondary !== null) {
      await db.insert(systemConfig).values({ key: "wa_contact_secondary", value: snapshotSecondary })
        .onConflictDoUpdate({ target: systemConfig.key, set: { value: snapshotSecondary, updatedAt: new Date() } });
    } else {
      await db.delete(systemConfig).where(eq(systemConfig.key, "wa_contact_secondary"));
    }
  } catch (e) {
    console.error("[wa-contact test] teardown DB restore failed:", e);
  }

  // ── Restore in-process cache ──────────────────────────────────────────────
  setWaContactCache(snapshotCache);

  // ── Shut down HTTP server ─────────────────────────────────────────────────
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getContact(): Promise<{ primary: string; secondary: string }> {
  const res = await fetch(`http://127.0.0.1:${port}/api/config/contact`);
  assert.equal(res.status, 200);
  return res.json();
}

async function postContact(body: object): Promise<{ status: number; body: any }> {
  const res = await fetch(`http://127.0.0.1:${port}/api/admin/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test("GET /api/config/contact returns { primary, secondary } string shape", async () => {
  const body = await getContact();
  assert.ok(typeof body.primary   === "string", "primary must be string");
  assert.ok(typeof body.secondary === "string", "secondary must be string");
  assert.ok(body.primary.length   >= 8, "primary must be at least 8 chars");
  assert.ok(body.secondary.length >= 8, "secondary must be at least 8 chars");
});

test("GET /api/config/contact sets Cache-Control: no-store", async () => {
  const res = await fetch(`http://127.0.0.1:${port}/api/config/contact`);
  assert.equal(res.headers.get("cache-control"), "no-store");
});

test("getWaContact() returns defaults when cache is null", () => {
  setWaContactCache(null);
  const contact = getWaContact();
  assert.equal(contact.primary,   WA_CONTACT_DEFAULTS.primary);
  assert.equal(contact.secondary, WA_CONTACT_DEFAULTS.secondary);
});

test("saveWaContactToDb() upserts both config rows and refreshes in-process cache", async () => {
  await saveWaContactToDb(NUM_A_PRIMARY, NUM_A_SECONDARY);

  // In-process cache must be updated immediately — no reload needed.
  const cached = getWaContact();
  assert.equal(cached.primary,   NUM_A_PRIMARY);
  assert.equal(cached.secondary, NUM_A_SECONDARY);

  // Verify the rows actually landed in the DB.
  const [rowP] = await db.select().from(systemConfig).where(eq(systemConfig.key, "wa_contact_primary"));
  const [rowS] = await db.select().from(systemConfig).where(eq(systemConfig.key, "wa_contact_secondary"));
  assert.ok(rowP, "wa_contact_primary row must exist in system_config");
  assert.ok(rowS, "wa_contact_secondary row must exist in system_config");
  assert.equal(rowP.value, NUM_A_PRIMARY);
  assert.equal(rowS.value, NUM_A_SECONDARY);
});

test("loadWaContactFromDb() reads the same config keys (simulates server restart)", async () => {
  // Numbers were saved in the previous test; simulate a fresh process by clearing cache.
  setWaContactCache(null);

  const loaded = await loadWaContactFromDb();
  assert.ok(loaded !== null, "loadWaContactFromDb must return non-null when rows exist");
  assert.equal(loaded!.primary,   NUM_A_PRIMARY);
  assert.equal(loaded!.secondary, NUM_A_SECONDARY);

  // Apply — same as what the startup code does.
  setWaContactCache(loaded);
  assert.equal(getWaContact().primary, NUM_A_PRIMARY);
});

test("full rotation cycle: save new numbers → GET endpoint returns them without restart", async () => {
  await saveWaContactToDb(NUM_B_PRIMARY, NUM_B_SECONDARY);

  // The GET endpoint reads getWaContact() which now holds the updated cache.
  const body = await getContact();
  assert.equal(body.primary,   NUM_B_PRIMARY,   "GET must return updated primary");
  assert.equal(body.secondary, NUM_B_SECONDARY, "GET must return updated secondary");
});

test("saveWaContactToDb() is idempotent — same values again does not throw", async () => {
  await saveWaContactToDb(NUM_B_PRIMARY, NUM_B_SECONDARY);
  const contact = getWaContact();
  assert.equal(contact.primary,   NUM_B_PRIMARY);
  assert.equal(contact.secondary, NUM_B_SECONDARY);
});

test("loadWaContactFromDb() returns null when neither config row exists", async () => {
  // Temporarily delete both rows for this test, then restore.
  await db.delete(systemConfig).where(eq(systemConfig.key, "wa_contact_primary"));
  await db.delete(systemConfig).where(eq(systemConfig.key, "wa_contact_secondary"));

  setWaContactCache(null);
  const result = await loadWaContactFromDb();
  assert.equal(result, null, "loadWaContactFromDb must return null when config rows are absent");

  // Re-insert so subsequent tests that read the DB aren't affected.
  await saveWaContactToDb(NUM_B_PRIMARY, NUM_B_SECONDARY);
});

// ── Handler-level tests (in-memory stub, no DB writes) ────────────────────────

test("makeAdminContactHandler() normalises numbers with dashes / spaces / leading +", async () => {
  const saved: string[] = [];
  const stubSave = async (p: string, s: string) => { saved.push(p, s); };

  const app2 = express();
  app2.use(express.json());
  app2.post("/contact", makeAdminContactHandler(stubSave));

  const s2 = createServer(app2);
  const p2 = await new Promise<number>((resolve) => s2.listen(0, "127.0.0.1", () => resolve((s2.address() as any).port)));

  try {
    const res = await fetch(`http://127.0.0.1:${p2}/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ primary: "+62 812-1234-5678", secondary: "0282-2345-6789" }),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    // +62 812-1234-5678 → strip non-digits → 6281212345678
    assert.equal(body.primary, "6281212345678");
    // Verify digits-only for primary
    assert.ok(/^\d+$/.test(body.primary),   "primary in response must be digits-only");
    assert.ok(/^\d+$/.test(body.secondary), "secondary in response must be digits-only");
    // Verify the stub received the cleaned values
    assert.ok(saved.length === 2);
    assert.ok(/^\d+$/.test(saved[0]), "save callback received digits-only primary");
    assert.ok(/^\d+$/.test(saved[1]), "save callback received digits-only secondary");
  } finally {
    await new Promise<void>((r) => s2.close(() => r()));
  }
});

test("makeAdminContactHandler() returns 400 when primary or secondary is missing", async () => {
  const { status, body } = await postContact({ primary: "6281100000001" }); // no secondary
  assert.equal(status, 400);
  assert.ok(typeof body.error === "string");
});

test("makeAdminContactHandler() returns 400 when number is fewer than 8 digits", async () => {
  const { status, body } = await postContact({ primary: "123", secondary: "456" });
  assert.equal(status, 400);
  assert.ok(body.error.includes("8 digit"));
});

test("makeAdminContactHandler() returns 200 + cleaned numbers on valid input (in-memory stub)", async () => {
  const saved: Array<[string, string]> = [];
  const stubSave = async (p: string, s: string) => { saved.push([p, s]); };

  const app3 = express();
  app3.use(express.json());
  app3.post("/contact", makeAdminContactHandler(stubSave));

  const s3 = createServer(app3);
  const p3 = await new Promise<number>((resolve) => s3.listen(0, "127.0.0.1", () => resolve((s3.address() as any).port)));

  try {
    const res = await fetch(`http://127.0.0.1:${p3}/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ primary: "6281100000003", secondary: "6282200000003" }),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.primary,   "6281100000003");
    assert.equal(body.secondary, "6282200000003");
    assert.equal(saved.length, 1);
    assert.deepEqual(saved[0], ["6281100000003", "6282200000003"]);
  } finally {
    await new Promise<void>((r) => s3.close(() => r()));
  }
});

test("makeAdminContactHandler() returns 500 when save callback throws", async () => {
  const failSave = async () => { throw new Error("DB unavailable"); };

  const app4 = express();
  app4.use(express.json());
  app4.post("/contact", makeAdminContactHandler(failSave));

  const s4 = createServer(app4);
  const p4 = await new Promise<number>((resolve) => s4.listen(0, "127.0.0.1", () => resolve((s4.address() as any).port)));

  try {
    const res = await fetch(`http://127.0.0.1:${p4}/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ primary: "6281100000004", secondary: "6282200000004" }),
    });
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.ok(typeof body.error === "string");
  } finally {
    await new Promise<void>((r) => s4.close(() => r()));
  }
});

// ── normalizeContactNumber unit test ─────────────────────────────────────────
test("normalizeContactNumber strips all non-digit characters", () => {
  assert.equal(normalizeContactNumber("+62 812-1234-5678"), "6281212345678");
  assert.equal(normalizeContactNumber("0282 234 5678"),     "02822345678");
  assert.equal(normalizeContactNumber("6281234"),           "6281234");
  assert.equal(normalizeContactNumber(""),                  "");
});
