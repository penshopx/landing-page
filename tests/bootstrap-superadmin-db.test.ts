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
const RUN = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_EMAIL = `bootstrap_db_test_${RUN}@example-test.invalid`;

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

// ── Lifecycle ─────────────────────────────────────────────────────────────────
before(async () => {
  process.env.BOOTSTRAP_ADMIN_TOKEN = TOKEN;

  const realDb = await getDb();
  const { users: usersTable } = await import("../shared/models/auth");
  const { eq } = await import("drizzle-orm");

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
