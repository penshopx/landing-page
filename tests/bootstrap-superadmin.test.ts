// Integration HTTP test for POST /api/admin/bootstrap-superadmin (Task #41).
//
// Strategy: boot a minimal Express app that mounts the REAL production handler
// (makeBootstrapHandler from server/lib/bootstrap-handler.ts) with an injected
// in-memory BootstrapDb stub. This exercises the actual handler code path —
// token validation, single-use superadmin guard, promote path, blocked-reuse
// path — without touching a real Postgres instance or booting the full server.
//
// If the handler logic in bootstrap-handler.ts regresses, these tests break.
// If the handler is accidentally left inline in routes.ts instead of wired
// through makeBootstrapHandler, a companion grep in routes-helper-usage.test.ts
// (already present) will catch the import drift.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { makeBootstrapHandler, type BootstrapDb } from "../server/lib/bootstrap-handler";

// ── In-memory BootstrapDb stub ────────────────────────────────────────────────
type FakeUser = { id: string; email: string; role: string };
const fakeUsers: FakeUser[] = [];
let nextId = 1;

function addFakeUser(email: string, role = "user"): FakeUser {
  const u: FakeUser = { id: String(nextId++), email, role };
  fakeUsers.push(u);
  return u;
}

function resetFakeUsers(): void {
  fakeUsers.length = 0;
  nextId = 1;
}

function makeFakeDb(): BootstrapDb {
  return {
    async findSuperadmin() {
      return fakeUsers.filter((u) => u.role === "superadmin");
    },
    async promoteToSuperadmin(email: string) {
      const u = fakeUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (!u) return [];
      u.role = "superadmin";
      return [{ id: u.id, email: u.email, role: u.role }];
    },
  };
}

// ── Token ─────────────────────────────────────────────────────────────────────
const TOKEN =
  "bootstrap-test-token-" + Math.random().toString(36).slice(2, 10);

// ── Express app using the REAL production handler ─────────────────────────────
const app = express();
app.use(express.json());

// makeBootstrapHandler is the production export — same code path as routes.ts.
// We inject makeFakeDb() so each test run uses the current fakeUsers state.
// The handler is stateless (reads from the injected db on every call), so
// resetting fakeUsers between sub-scenarios is sufficient for isolation.
app.post(
  "/api/admin/bootstrap-superadmin",
  makeBootstrapHandler(makeFakeDb())
);

// ── Server lifecycle ──────────────────────────────────────────────────────────
let server: Server;
let port = 0;

before(async () => {
  process.env.BOOTSTRAP_ADMIN_TOKEN = TOKEN;

  await new Promise<void>((resolve) => {
    server = createServer(app).listen(0, "127.0.0.1", () => {
      port = (server.address() as any).port;
      resolve();
    });
  });
});

after(() => {
  server.close();
  delete process.env.BOOTSTRAP_ADMIN_TOKEN;
  resetFakeUsers();
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function post(
  body: unknown,
  token?: string
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined) headers["x-bootstrap-token"] = token;
  const res = await fetch(
    `http://127.0.0.1:${port}/api/admin/bootstrap-superadmin`,
    { method: "POST", headers, body: JSON.stringify(body) }
  );
  return { status: res.status, json: await res.json() };
}

// ── Tests — ordered so state builds up deterministically ─────────────────────

test("503 when BOOTSTRAP_ADMIN_TOKEN env var is not set", async () => {
  const saved = process.env.BOOTSTRAP_ADMIN_TOKEN;
  delete process.env.BOOTSTRAP_ADMIN_TOKEN;
  const { status, json } = await post({ email: "anyone@example.com" }, TOKEN);
  assert.equal(status, 503);
  assert.ok(json.error, "should return an error message");
  process.env.BOOTSTRAP_ADMIN_TOKEN = saved;
});

test("401 when x-bootstrap-token header is absent", async () => {
  const { status } = await post({ email: "anyone@example.com" });
  assert.equal(status, 401);
});

test("401 when x-bootstrap-token header has wrong value", async () => {
  const { status } = await post({ email: "anyone@example.com" }, "wrong-token");
  assert.equal(status, 401);
});

test("400 when email is missing from body", async () => {
  const { status } = await post({}, TOKEN);
  assert.equal(status, 400);
});

test("400 when email is malformed", async () => {
  const { status } = await post({ email: "not-an-email" }, TOKEN);
  assert.equal(status, 400);
});

test("404 when email does not match any user in the store", async () => {
  resetFakeUsers(); // no users present
  const { status } = await post({ email: "ghost@example.com" }, TOKEN);
  assert.equal(status, 404);
});

test("200 — first valid call promotes the user to superadmin", async () => {
  resetFakeUsers();
  addFakeUser("founder@example.com", "user");

  const { status, json } = await post({ email: "founder@example.com" }, TOKEN);
  assert.equal(status, 200);
  assert.equal(json.success, true, "body.success should be true");
  assert.equal(json.promoted?.role, "superadmin");
  assert.equal(
    json.promoted?.email?.toLowerCase(),
    "founder@example.com"
  );

  // Confirm the in-memory store was actually mutated.
  assert.equal(
    fakeUsers.find((u) => u.email === "founder@example.com")?.role,
    "superadmin"
  );
});

test("403 — second call with the same valid token is blocked (superadmin already exists)", async () => {
  // fakeUsers still contains the superadmin from the previous test.
  const { status, json } = await post({ email: "founder@example.com" }, TOKEN);
  assert.equal(
    status,
    403,
    "should be 403 Forbidden when a superadmin already exists"
  );
  assert.ok(
    typeof json.error === "string" && json.error.includes("Superadmin sudah ada"),
    `error message should say 'Superadmin sudah ada', got: ${json.error}`
  );
});

test("403 — second call with a DIFFERENT email is also blocked (guard is global, not per-email)", async () => {
  // Guard must fire before the email lookup — even a fresh target must be rejected.
  addFakeUser("other-admin@example.com", "user");
  const { status } = await post({ email: "other-admin@example.com" }, TOKEN);
  assert.equal(
    status,
    403,
    "global superadmin guard must block even when targeting a different user"
  );
});
