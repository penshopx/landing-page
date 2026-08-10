// DB-backed integration test for POST /api/admin/bootstrap-superadmin (Task #75).
//
// Strategy: uses the REAL Postgres database (via makeBootstrapDrizzleDb) to confirm
// that the single-use superadmin guard survives a server restart.
//
// A within-session test with an in-memory stub already exists
// (bootstrap-superadmin.test.ts). This companion test rules out any accidental
// in-memory short-circuit by:
//   1. Temporarily demoting any pre-existing superadmins so the DB starts from
//      a clean "no superadmin" state (restored in after()).
//   2. Promoting a test user via a first handler instance (200).
//   3. Creating a SECOND fresh handler instance (simulating a server restart).
//   4. Confirming the second instance returns 403 — because the superadmin row
//      it reads is now present in the real database, not in any in-memory state.
//
// The test resets every mutated row in after() regardless of outcome.
// Skipped automatically when DATABASE_URL is absent so unit-only CI pipelines
// are unaffected.
//
// ── Abnormal-exit robustness (Task #203) ─────────────────────────────────────
// If the process is killed mid-run (OOM, SIGKILL, CI timeout) after() never
// fires. Three layers keep the DB safe anyway:
//   1. A durable PER-RUN recovery record is written to system_config BEFORE
//      any superadmin is demoted (key: bootstrap-db-test:recovery:<RUN>). The
//      NEXT run's before() sweeps all leftover records from other runs and
//      restores the demoted rows + prunes stale test users before doing
//      anything else (self-healing). Per-run keys mean concurrent/overlapping
//      runs can never overwrite or delete each other's trail.
//   2. Test users always use the unique prefix "bootstrap_db_" at the
//      reserved domain "@example-test.invalid", so any external cleanup job
//      can identify and prune them: email LIKE 'bootstrap_db_%@example-test.invalid'.
//   3. Best-effort SIGINT/SIGTERM/uncaughtException handlers run the same
//      restore logic on catchable aborts.
// Known limitation: SIGKILL / OOM-kill cannot be intercepted — in that one
// case the rows stay mutated until the next test run (or a manual sweep)
// triggers layer 1. The recovery record makes this window self-correcting.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";

import {
  makeBootstrapHandler,
  makeBootstrapDrizzleDb,
} from "../server/lib/bootstrap-handler";

// ── Guard: skip when no real DB is available ─────────────────────────────────
const hasDb = !!process.env.DATABASE_URL;
if (!hasDb) {
  console.log(
    "[bootstrap-superadmin-db] DATABASE_URL not set — skipping DB integration tests"
  );
  process.exit(0);
}

// ── Token that satisfies the 32-char / 3-class / 8-unique-chars policy ───────
const TOKEN = "Bootstrap-DbInt-Test-2024!xZ9mQp";

// ── Unique test email to avoid collision with real accounts ──────────────────
// Prefix + reserved domain form a stable signature: any cleanup job can prune
// leftovers with  email LIKE 'bootstrap_db_%@example-test.invalid'.
const RUN = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_EMAIL = `bootstrap_db_test_${RUN}@example-test.invalid`;
const TEST_EMAIL_PATTERN = "bootstrap_db_%@example-test.invalid";

// Durable recovery records in system_config (survive process death).
// Keys are PER-RUN (`bootstrap-db-test:recovery:<RUN>`) so concurrent or
// overlapping test processes can never overwrite/delete each other's trail:
// each run writes and deletes ONLY its own key; self-heal sweeps every
// leftover key from OTHER runs (prefix scan, own key excluded).
const RECOVERY_KEY_PREFIX = "bootstrap-db-test:recovery";
const RECOVERY_KEY = `${RECOVERY_KEY_PREFIX}:${RUN}`;
const RECOVERY_KEY_PATTERN = `${RECOVERY_KEY_PREFIX}%`;

// ── Track state to restore in after() ────────────────────────────────────────
// IDs of pre-existing superadmins we temporarily demote; restored in after().
const demotedSuperadminIds: Array<string | number> = [];
// Test user ID to delete in after().
let testUserId: string | null = null;

// ── Lazily load real DB handle (shared pool) ─────────────────────────────────
let _db: any;
async function getDb() {
  if (!_db) _db = (await import("../server/db")).db;
  return _db;
}

// ── Helpers to start/stop a minimal HTTP server ──────────────────────────────
async function startServer(
  handler: express.RequestHandler
): Promise<{ server: Server; port: number }> {
  const app = express();
  app.use(express.json());
  app.post("/api/admin/bootstrap-superadmin", handler);
  return new Promise((resolve) => {
    const srv = createServer(app).listen(0, "127.0.0.1", () => {
      resolve({ server: srv, port: (srv.address() as any).port });
    });
  });
}

async function stopServer(server: Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

async function postTo(
  port: number,
  body: unknown,
  token?: string
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token !== undefined) headers["x-bootstrap-token"] = token;
  const res = await fetch(
    `http://127.0.0.1:${port}/api/admin/bootstrap-superadmin`,
    { method: "POST", headers, body: JSON.stringify(body) }
  );
  return { status: res.status, json: await res.json() };
}

// ── Durable recovery helpers ─────────────────────────────────────────────────
// The recovery record is written BEFORE any row is mutated so an abnormal
// exit can never lose the list of demoted superadmins.

// Ownership is structural: every helper below touches ONLY this run's own
// per-run key. A prior/concurrent run's record can never be cleared by this
// run's cleanup paths — only self-heal's prefix sweep (own key excluded)
// processes foreign records, and it restores their rows before deleting.

// ── Global run lock (serializes whole runs; auto-released on process death) ──
// A session-level Postgres advisory lock held on a DEDICATED client for the
// entire before()→after() lifecycle. Two properties make the sweep safe:
//   • LIVE runs are serialized — a second process blocks in before() until
//     the first finishes, so a live run's rows/record are never swept.
//   • DEAD runs release the lock automatically (connection drop on
//     SIGKILL/OOM), so the next run can proceed and any foreign record it
//     sees under the lock is PROVABLY stale.
const GLOBAL_RUN_LOCK_ID = 0x42007503; // arbitrary constant unique to this suite

let lockClient: any = null;
async function acquireRunLock() {
  if (lockClient) return;
  const { pool } = await import("../server/db");
  lockClient = await pool.connect();
  await lockClient.query("SELECT pg_advisory_lock($1)", [GLOBAL_RUN_LOCK_ID]);
}
async function releaseRunLock() {
  if (!lockClient) return;
  const c = lockClient;
  lockClient = null;
  try {
    await c.query("SELECT pg_advisory_unlock($1)", [GLOBAL_RUN_LOCK_ID]);
  } catch {}
  try {
    c.release();
  } catch {}
}

async function writeRecoveryRecord(ids: Array<string | number>) {
  const realDb = await getDb();
  const { systemConfig } = await import("../shared/schema");
  const value = JSON.stringify({ demotedSuperadminIds: ids, run: RUN, at: new Date().toISOString() });
  await realDb
    .insert(systemConfig)
    .values({ key: RECOVERY_KEY, value })
    .onConflictDoUpdate({
      target: systemConfig.key,
      set: { value, updatedAt: new Date() },
    });
}

async function clearRecoveryRecord(ownKey: string = RECOVERY_KEY) {
  const realDb = await getDb();
  const { systemConfig } = await import("../shared/schema");
  const { eq } = await import("drizzle-orm");
  await realDb.delete(systemConfig).where(eq(systemConfig.key, ownKey));
}

// Restore rows described by a recovery record left by a PREVIOUS aborted run,
// and prune any stale test users matching the unique email signature.
// MUST be called while holding the global run lock: only then are foreign
// records/users provably stale (their owner is dead or finished).
async function selfHealFromPreviousAbort() {
  const realDb = await getDb();
  const { systemConfig } = await import("../shared/schema");
  const { users: usersTable } = await import("../shared/models/auth");
  const { eq, inArray, like } = await import("drizzle-orm");

  // Sweep every leftover per-run record from OTHER runs (own key excluded —
  // it must survive until this run's own cleanup). Restore FIRST, delete the
  // record only after: an abort in between just re-runs the idempotent
  // restore next time.
  const { and, ne } = await import("drizzle-orm");
  const rows = await realDb
    .select({ key: systemConfig.key, value: systemConfig.value })
    .from(systemConfig)
    .where(
      and(
        like(systemConfig.key, RECOVERY_KEY_PATTERN),
        ne(systemConfig.key, RECOVERY_KEY)
      )
    );

  for (const row of rows) {
    console.log(
      `[bootstrap-superadmin-db] recovery record found from a previous aborted run (${row.key}) — restoring superadmins`
    );
    try {
      const parsed = JSON.parse(row.value);
      const ids: Array<string | number> = Array.isArray(parsed?.demotedSuperadminIds)
        ? parsed.demotedSuperadminIds
        : [];
      if (ids.length > 0) {
        await realDb
          .update(usersTable)
          .set({ role: "superadmin" })
          .where(inArray(usersTable.id, ids as string[]));
      }
    } catch (e) {
      // Do NOT delete an unparsable record — it may be the only recovery
      // trail. Retain it for manual inspection; log loudly instead.
      console.error(
        `[bootstrap-superadmin-db] UNPARSABLE recovery record retained for manual recovery (${row.key}):`,
        e
      );
      continue;
    }
    await realDb.delete(systemConfig).where(eq(systemConfig.key, row.key));
  }

  // Prune any stale test users left behind by aborted runs (unique signature,
  // can never match a real account: reserved .invalid TLD).
  await realDb
    .delete(usersTable)
    .where(like(usersTable.email, TEST_EMAIL_PATTERN));
}

// ── Best-effort restore on catchable aborts (SIGINT/SIGTERM/crash) ──────────
// Restores this run's rows and deletes ONLY this run's per-run recovery key.
// Foreign records (from prior/concurrent runs) are structurally untouchable
// here — the next run's self-heal sweep processes them.
async function performEmergencyRestore(state: {
  testUserId: string | null;
  demotedIds: Array<string | number>;
  // The per-run key of the process performing the restore. Defaults to this
  // process's own key; the regression test passes a different one to model a
  // separate fresh process (whose RUN — and therefore key — would differ).
  ownKey?: string;
}) {
  const realDb = await getDb();
  const { users: usersTable } = await import("../shared/models/auth");
  const { eq, inArray } = await import("drizzle-orm");
  if (state.testUserId) {
    await realDb.delete(usersTable).where(eq(usersTable.id, state.testUserId));
  }
  if (state.demotedIds.length > 0) {
    await realDb
      .update(usersTable)
      .set({ role: "superadmin" })
      .where(inArray(usersTable.id, state.demotedIds as string[]));
  }
  // Restore happened above — only now is it safe to drop our own trail.
  await clearRecoveryRecord(state.ownKey ?? RECOVERY_KEY);
}

let restoredByAbortHandler = false;
async function emergencyRestore() {
  if (restoredByAbortHandler) return;
  restoredByAbortHandler = true;
  try {
    await performEmergencyRestore({
      testUserId,
      demotedIds: demotedSuperadminIds,
    });
    console.log("[bootstrap-superadmin-db] emergency restore completed");
  } catch (e) {
    console.error("[bootstrap-superadmin-db] emergency restore FAILED (next run will self-heal):", e);
  } finally {
    await releaseRunLock();
  }
}

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.once(sig, async () => {
    await emergencyRestore();
    process.exit(1);
  });
}
process.once("uncaughtException", async (err) => {
  console.error("[bootstrap-superadmin-db] uncaughtException:", err);
  await emergencyRestore();
  process.exit(1);
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────
before(async () => {
  process.env.BOOTSTRAP_ADMIN_TOKEN = TOKEN;

  const realDb = await getDb();
  const { users: usersTable } = await import("../shared/models/auth");
  const { eq } = await import("drizzle-orm");

  // Layer 0: serialize whole runs. Blocks until any live run finishes; a
  // dead run's lock is auto-released by its dropped connection.
  await acquireRunLock();

  // Layer 1: repair anything a previous aborted run left behind. Safe now:
  // under the lock, every foreign record is provably stale.
  await selfHealFromPreviousAbort();

  // Temporarily demote any existing superadmins so the DB starts from a
  // "no superadmin" baseline for this test sequence.
  const existing = await realDb
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.role, "superadmin"));

  for (const row of existing) {
    demotedSuperadminIds.push(row.id);
  }
  if (demotedSuperadminIds.length > 0) {
    // Write the durable recovery record BEFORE demoting anyone, so even a
    // SIGKILL between these two statements leaves a self-healing trail.
    await writeRecoveryRecord(demotedSuperadminIds);
    const { inArray } = await import("drizzle-orm");
    await realDb
      .update(usersTable)
      .set({ role: "user" })
      .where(inArray(usersTable.id, demotedSuperadminIds as string[]));
  }

  // Insert the test user with role "user".
  const inserted = await realDb
    .insert(usersTable)
    .values({ email: TEST_EMAIL, role: "user" })
    .onConflictDoNothing()
    .returning({ id: usersTable.id });
  if (inserted.length > 0) {
    testUserId = inserted[0].id;
  } else {
    // User already existed (conflict) — look up the ID.
    const found = await realDb
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, TEST_EMAIL))
      .limit(1);
    if (found.length > 0) testUserId = found[0].id;
  }
});

after(async () => {
  const realDb = await getDb();
  const { users: usersTable } = await import("../shared/models/auth");
  const { eq, inArray } = await import("drizzle-orm");

  // 1. Delete the test user inserted by this run.
  if (testUserId) {
    await realDb
      .delete(usersTable)
      .where(eq(usersTable.id, testUserId));
  }

  // 2. Restore the temporarily demoted superadmins.
  if (demotedSuperadminIds.length > 0) {
    await realDb
      .update(usersTable)
      .set({ role: "superadmin" })
      .where(inArray(usersTable.id, demotedSuperadminIds as string[]));
  }

  // 3. Cleanup succeeded — drop the recovery record and release the run lock.
  await clearRecoveryRecord();
  await releaseRunLock();

  delete process.env.BOOTSTRAP_ADMIN_TOKEN;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

test("DB integration — first handler instance promotes test user to superadmin (200)", async () => {
  const realDb = await getDb();

  // Handler instance #1 — represents a freshly started server process.
  const handler1 = makeBootstrapHandler(makeBootstrapDrizzleDb(realDb));
  const { server: srv1, port: port1 } = await startServer(handler1);

  try {
    const { status, json } = await postTo(
      port1,
      { email: TEST_EMAIL },
      TOKEN
    );
    assert.equal(
      status,
      200,
      `expected 200 promote, got ${status}: ${JSON.stringify(json)}`
    );
    assert.equal(json.success, true, "body.success should be true");
    assert.equal(
      json.promoted?.role,
      "superadmin",
      "promoted row must have role=superadmin"
    );
    assert.equal(
      json.promoted?.email?.toLowerCase(),
      TEST_EMAIL.toLowerCase(),
      "promoted email must match test user"
    );
  } finally {
    await stopServer(srv1);
  }
});

test("DB integration — second handler instance (simulated restart) returns 403 — superadmin persists in DB across restarts", async () => {
  const realDb = await getDb();

  // Handler instance #2 — a brand-new closure, no shared in-memory state with
  // instance #1. The only way it can know a superadmin exists is by reading the DB.
  const handler2 = makeBootstrapHandler(makeBootstrapDrizzleDb(realDb));
  const { server: srv2, port: port2 } = await startServer(handler2);

  try {
    const { status, json } = await postTo(
      port2,
      { email: TEST_EMAIL },
      TOKEN
    );
    assert.equal(
      status,
      403,
      `expected 403 on fresh handler after restart, got ${status}: ${JSON.stringify(json)}`
    );
    assert.ok(
      typeof json.error === "string" && json.error.includes("Superadmin sudah ada"),
      `error should include 'Superadmin sudah ada', got: ${json.error}`
    );
  } finally {
    await stopServer(srv2);
  }
});

test("DB integration — fresh handler also blocks a different email (global guard, not per-email)", async () => {
  const realDb = await getDb();
  const { users: usersTable } = await import("../shared/models/auth");
  const { eq, sql: sqlOp } = await import("drizzle-orm");

  const OTHER_EMAIL = `bootstrap_db_other_${RUN}@example-test.invalid`;

  // Insert a second user so the endpoint could reach the email-lookup step
  // (the superadmin guard fires before the lookup, so 403 should still win).
  const otherInserted = await realDb
    .insert(usersTable)
    .values({ email: OTHER_EMAIL, role: "user" })
    .onConflictDoNothing()
    .returning({ id: usersTable.id });

  const otherUserId: string | null =
    otherInserted.length > 0 ? otherInserted[0].id : null;

  try {
    const handler3 = makeBootstrapHandler(makeBootstrapDrizzleDb(realDb));
    const { server: srv3, port: port3 } = await startServer(handler3);

    try {
      const { status, json } = await postTo(
        port3,
        { email: OTHER_EMAIL },
        TOKEN
      );
      assert.equal(
        status,
        403,
        `global guard must block even with a different target email — got ${status}: ${JSON.stringify(json)}`
      );
      assert.ok(
        typeof json.error === "string" && json.error.includes("Superadmin sudah ada"),
        `error should include 'Superadmin sudah ada', got: ${json.error}`
      );
    } finally {
      await stopServer(srv3);
    }
  } finally {
    // Clean up the extra test user.
    if (otherUserId) {
      await realDb
        .delete(usersTable)
        .where(eq(usersTable.id, otherUserId));
    }
  }
});

// ── Regression: emergency cleanup must never clear another run's recovery
// record (per-run keys make this structural), and the self-heal sweep must
// restore foreign records — while this run's own record stays untouched
// throughout, so there is no abort window without a durable trail.
test("DB regression — emergency restore leaves a foreign recovery record intact; self-heal sweep restores it without touching this run's record", async () => {
  const realDb = await getDb();
  const { systemConfig } = await import("../shared/schema");
  const { users: usersTable } = await import("../shared/models/auth");
  const { eq } = await import("drizzle-orm");

  // Simulated "victim" superadmin demoted by a PREVIOUS aborted run.
  // Email deliberately does NOT match the bootstrap_db_% prune signature so
  // the self-heal prune step doesn't delete it before we can assert its role.
  const VICTIM_EMAIL = `bootstrap_recovery_check_${RUN}@example-test.invalid`;
  const [victim] = await realDb
    .insert(usersTable)
    .values({ email: VICTIM_EMAIL, role: "user" })
    .returning({ id: usersTable.id });

  // FOREIGN per-run key — never collides with this run's own RECOVERY_KEY,
  // so the active run's durable trail is untouched for the whole test.
  const FOREIGN_KEY = `${RECOVERY_KEY_PREFIX}:prior_aborted_${RUN}`;

  // Snapshot this run's own record so we can assert it survives unmodified.
  const ownBefore = await realDb
    .select({ value: systemConfig.value })
    .from(systemConfig)
    .where(eq(systemConfig.key, RECOVERY_KEY));

  try {
    // Seed the prior run's recovery record under ITS OWN key (as if that run
    // died right after demoting the victim).
    const priorValue = JSON.stringify({
      demotedSuperadminIds: [victim.id],
      run: `prior_aborted_${RUN}`,
      at: new Date(0).toISOString(),
    });
    await realDb
      .insert(systemConfig)
      .values({ key: FOREIGN_KEY, value: priorValue });

    // Abort arrives in a fresh process before its before() ran: emergency
    // restore fires with that process's own state. The foreign record must
    // survive — cleanup only ever deletes the caller's own per-run key.
    await performEmergencyRestore({
      testUserId: null,
      demotedIds: [],
      // A real fresh process has its own RUN → its own key, distinct from
      // both the foreign record and this run's record.
      ownKey: `${RECOVERY_KEY_PREFIX}:fresh_process_${RUN}`,
    });

    const stillThere = await realDb
      .select({ value: systemConfig.value })
      .from(systemConfig)
      .where(eq(systemConfig.key, FOREIGN_KEY));
    assert.equal(
      stillThere.length,
      1,
      "foreign recovery record must NOT be cleared by emergency restore"
    );
    assert.equal(stillThere[0].value, priorValue, "record content must be untouched");

    // The next run's self-heal sweep must then restore the victim…
    await selfHealFromPreviousAbort();

    const [restored] = await realDb
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, victim.id));
    assert.equal(
      restored?.role,
      "superadmin",
      "self-heal must restore the prior run's demoted superadmin"
    );
    const gone = await realDb
      .select({ key: systemConfig.key })
      .from(systemConfig)
      .where(eq(systemConfig.key, FOREIGN_KEY));
    assert.equal(gone.length, 0, "foreign recovery record must be cleared after self-heal");

    // …while this run's OWN record is exactly as before (sweep excludes it).
    const ownAfter = await realDb
      .select({ value: systemConfig.value })
      .from(systemConfig)
      .where(eq(systemConfig.key, RECOVERY_KEY));
    assert.equal(
      ownAfter.length,
      ownBefore.length,
      "this run's own recovery record must not be created/deleted by the sweep"
    );
    if (ownBefore.length > 0) {
      assert.equal(
        ownAfter[0].value,
        ownBefore[0].value,
        "this run's own recovery record must be unmodified"
      );
    }
  } finally {
    // Remove the simulated victim (it now has role superadmin — delete it so
    // it can never linger as a fake superadmin) and the foreign record if an
    // assertion failed before self-heal consumed it.
    await realDb.delete(usersTable).where(eq(usersTable.id, victim.id));
    await realDb.delete(systemConfig).where(eq(systemConfig.key, FOREIGN_KEY));
    // Note: self-heal's prune step deletes bootstrap_db_% rows, including
    // this run's TEST_EMAIL user — after()'s delete-by-id is a tolerant no-op.
  }
});
