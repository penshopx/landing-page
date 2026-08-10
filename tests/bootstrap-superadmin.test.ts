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
import { makeBootstrapHandler, tokenWeaknessReason, type BootstrapDb } from "../server/lib/bootstrap-handler";

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
// Must satisfy the 32-char / 3-class / 8-unique-chars policy.
const TOKEN = "Bootstrap-Test-Token-2024!xZ9mQpR";

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

// ── tokenWeaknessReason unit tests ───────────────────────────────────────────
// Policy: ≥32 chars AND ≥12 unique distinct characters.

test("tokenWeaknessReason: null for a strong 32-char mixed token", () => {
  assert.equal(tokenWeaknessReason("Bootstrap-Test-Token-2024!xZ9mQpR"), null);
});

test("tokenWeaknessReason: null for a 64-char hex token (all 16 hex digits represented)", () => {
  // Simulate output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  // Use a representative value that exercises all 16 hex digits and has no periodic repetition.
  const hexToken = "4a7f3c1e9b2d0f8a6e5c4b3a2d1f0e9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e";
  assert.equal(new Set(hexToken).size, 16, "sanity: hex token should have 16 unique chars");
  assert.equal(tokenWeaknessReason(hexToken), null, "well-formed CSPRNG hex token must pass");
});

test("tokenWeaknessReason: rejects token shorter than 32 characters", () => {
  const reason = tokenWeaknessReason("Bootstrap-Admin-2024!");  // 21 chars
  assert.ok(reason !== null && reason.includes("32"), `expected '32' in: ${reason}`);
});

test("tokenWeaknessReason: rejects 'PasswordPassword' (16 chars — below 32-char minimum)", () => {
  const reason = tokenWeaknessReason("PasswordPassword");
  assert.ok(reason !== null, "'PasswordPassword' must be rejected");
  assert.ok(reason.includes("32"), `should cite 32-char requirement, got: ${reason}`);
});

test("tokenWeaknessReason: rejects all-digit 32-char token (only 10 unique chars — below 12)", () => {
  // Digits 0-9 = at most 10 unique chars, so any all-digit 32-char token fails rule 2.
  const reason = tokenWeaknessReason("12345678901234567890123456789012");
  assert.ok(reason !== null, "all-digit 32-char token must be rejected");
  assert.ok(!reason.includes("pendek"), "should not cite length — it is long enough");
});

test("tokenWeaknessReason: rejects repeated-pattern token with 8 unique chars (caught by uniqueness check)", () => {
  // "abcABC1!" repeated 4× = 32 chars, 8 unique chars < 12 → caught by rule 2.
  const repeated = "abcABC1!abcABC1!abcABC1!abcABC1!";
  assert.equal(new Set(repeated).size, 8, "sanity: token must have exactly 8 unique chars");
  const reason = tokenWeaknessReason(repeated);
  assert.ok(reason !== null, "repeated-pattern token with 8 unique chars must be rejected");
});

test("tokenWeaknessReason: rejects repeated-pattern token with 12 unique chars (caught by pattern check)", () => {
  // "abcdefghijkl" repeated 2.67× = 32 chars, 12 unique chars — passes rule 2 but is periodic.
  // This is the key bypass that unique-char count alone misses.
  const repeated = "abcdefghijklabcdefghijklabcdefgh";
  assert.equal(new Set(repeated).size, 12, "sanity: token must have exactly 12 unique chars");
  const reason = tokenWeaknessReason(repeated);
  assert.ok(reason !== null, "period-12 repeated token with 12 unique chars must be rejected by pattern check");
  assert.ok(
    reason.includes("berulang"),
    `expected 'berulang' (repeated pattern) message, got: ${reason}`,
  );
});

test("tokenWeaknessReason: rejects repeated-pattern token with 7 unique chars (caught by uniqueness check)", () => {
  // "abcABC1" repeated ~4.5× = 32 chars, 7 unique chars < 12.
  const repeated = "abcABC1abcABC1abcABC1abcABC1abcA";
  assert.equal(new Set(repeated).size, 7, "sanity: token must have exactly 7 unique chars");
  const reason = tokenWeaknessReason(repeated);
  assert.ok(reason !== null, "repeated-pattern token with 7 unique chars must be rejected");
});

// ── HTTP-level enforcement ────────────────────────────────────────────────────

test("503 when BOOTSTRAP_ADMIN_TOKEN is shorter than 32 characters", async () => {
  const saved = process.env.BOOTSTRAP_ADMIN_TOKEN;
  process.env.BOOTSTRAP_ADMIN_TOKEN = "tooshort";   // 8 chars
  const { status, json } = await post({ email: "anyone@example.com" }, "tooshort");
  assert.equal(status, 503, "short configured token must yield 503");
  assert.ok(
    typeof json.error === "string" && json.error.includes("32"),
    `error should mention 32-character minimum, got: ${json.error}`,
  );
  process.env.BOOTSTRAP_ADMIN_TOKEN = saved;
});

test("503 when BOOTSTRAP_ADMIN_TOKEN is all-digits (only 10 unique chars — below 12)", async () => {
  const saved = process.env.BOOTSTRAP_ADMIN_TOKEN;
  process.env.BOOTSTRAP_ADMIN_TOKEN = "12345678901234567890123456789012"; // 32 digits, ≤10 unique
  const { status, json } = await post({ email: "anyone@example.com" }, "12345678901234567890123456789012");
  assert.equal(status, 503, "all-digit configured token must yield 503");
  assert.ok(typeof json.error === "string" && json.error.length > 0, "should return error message");
  process.env.BOOTSTRAP_ADMIN_TOKEN = saved;
});

test("503 when BOOTSTRAP_ADMIN_TOKEN is 'PasswordPassword' (too short — 16 chars)", async () => {
  const saved = process.env.BOOTSTRAP_ADMIN_TOKEN;
  process.env.BOOTSTRAP_ADMIN_TOKEN = "PasswordPassword"; // 16 chars — below 32
  const { status, json } = await post({ email: "anyone@example.com" }, "PasswordPassword");
  assert.equal(status, 503, "'PasswordPassword' configured token must yield 503");
  assert.ok(typeof json.error === "string" && json.error.length > 0, "should return error message");
  process.env.BOOTSTRAP_ADMIN_TOKEN = saved;
});

test("503 when BOOTSTRAP_ADMIN_TOKEN is a repeated-pattern token (8 unique chars — below 12)", async () => {
  const saved = process.env.BOOTSTRAP_ADMIN_TOKEN;
  const repeated = "abcABC1!abcABC1!abcABC1!abcABC1!"; // 32 chars, 8 unique < 12
  process.env.BOOTSTRAP_ADMIN_TOKEN = repeated;
  const { status, json } = await post({ email: "anyone@example.com" }, repeated);
  assert.equal(status, 503, "repeated-pattern configured token must yield 503");
  assert.ok(typeof json.error === "string" && json.error.length > 0, "should return error message");
  process.env.BOOTSTRAP_ADMIN_TOKEN = saved;
});

test("503 when BOOTSTRAP_ADMIN_TOKEN is a period-12 repeated-pattern token (12 unique chars)", async () => {
  // This is the key bypass: 32 chars, 12 unique chars passes the uniqueness check,
  // but periodic structure makes it trivially guessable — caught by pattern detection.
  const saved = process.env.BOOTSTRAP_ADMIN_TOKEN;
  const repeated = "abcdefghijklabcdefghijklabcdefgh"; // period 12, 12 unique chars
  process.env.BOOTSTRAP_ADMIN_TOKEN = repeated;
  const { status, json } = await post({ email: "anyone@example.com" }, repeated);
  assert.equal(status, 503, "period-12 repeated configured token must yield 503");
  assert.ok(typeof json.error === "string" && json.error.length > 0, "should return error message");
  process.env.BOOTSTRAP_ADMIN_TOKEN = saved;
});

test("401 when x-bootstrap-token header is shorter than 32 characters", async () => {
  const { status, json } = await post({ email: "anyone@example.com" }, "tooshort");
  assert.equal(status, 401, "short provided token must yield 401");
  assert.ok(
    typeof json.error === "string" && json.error.includes("32"),
    `error should mention 32-character minimum, got: ${json.error}`,
  );
});

test("401 when x-bootstrap-token header is all-digits (only 10 unique chars — below 12)", async () => {
  const { status, json } = await post({ email: "anyone@example.com" }, "12345678901234567890123456789012");
  assert.equal(status, 401, "all-digit provided token must yield 401");
  assert.ok(typeof json.error === "string" && json.error.length > 0, "should return error message");
});

test("401 when x-bootstrap-token header is a repeated-pattern token (8 unique chars)", async () => {
  // "abcABC1!" repeated 4× = 32 chars, only 8 unique chars < 12 required.
  const { status, json } = await post({ email: "anyone@example.com" }, "abcABC1!abcABC1!abcABC1!abcABC1!");
  assert.equal(status, 401, "repeated-pattern provided token must yield 401");
  assert.ok(typeof json.error === "string" && json.error.length > 0, "should return error message");
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

// ── DB-unavailable path ───────────────────────────────────────────────────────

test("503 when promoteToSuperadmin() throws (DB drops mid-promotion after guard passes) — never a 500 or silent 200", async () => {
  // Guard passes (no superadmin), but the DB dies before promotion completes.
  const midFailDb: BootstrapDb = {
    async findSuperadmin() {
      return []; // guard passes
    },
    async promoteToSuperadmin(_email: string) {
      throw new Error("connect ECONNREFUSED 127.0.0.1:5432");
    },
  };

  const midFailApp = express();
  midFailApp.use(express.json());
  midFailApp.post("/api/admin/bootstrap-superadmin", makeBootstrapHandler(midFailDb));

  const midFailServer = await new Promise<ReturnType<typeof createServer>>((resolve) => {
    const s = createServer(midFailApp).listen(0, "127.0.0.1", () => resolve(s));
  });
  const midFailPort = (midFailServer.address() as any).port;

  try {
    const res = await fetch(
      `http://127.0.0.1:${midFailPort}/api/admin/bootstrap-superadmin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bootstrap-token": TOKEN,
        },
        body: JSON.stringify({ email: "founder@example.com" }),
      }
    );
    const json = await res.json();

    assert.equal(
      res.status,
      503,
      `expected 503 when DB dies mid-promotion, got ${res.status}: ${JSON.stringify(json)}`
    );
    assert.notEqual(res.status, 200, "must never silently return 200 when promotion failed");
    assert.ok(
      typeof json.error === "string" && json.error.length > 0,
      "response body must contain a clear error message"
    );
    assert.notEqual(json.success, true, "body must not claim success");
  } finally {
    await new Promise<void>((resolve) => midFailServer.close(() => resolve()));
  }
});

test("503 when findSuperadmin() throws (DB unreachable) — user must NOT be promoted", async () => {
  // Build a fresh app with a db stub that always throws on findSuperadmin.
  const throwingDb: BootstrapDb = {
    async findSuperadmin() {
      throw new Error("connect ECONNREFUSED 127.0.0.1:5432");
    },
    async promoteToSuperadmin(_email: string) {
      // This must never be called when the guard read fails.
      throw new Error("promoteToSuperadmin must not be called when DB guard fails");
    },
  };

  // Mount a separate minimal server so it doesn't share state with the main app.
  const throwingApp = express();
  throwingApp.use(express.json());
  throwingApp.post(
    "/api/admin/bootstrap-superadmin",
    makeBootstrapHandler(throwingDb)
  );

  const throwingServer = await new Promise<ReturnType<typeof createServer>>(
    (resolve) => {
      const s = createServer(throwingApp).listen(0, "127.0.0.1", () =>
        resolve(s)
      );
    }
  );
  const throwingPort = (throwingServer.address() as any).port;

  try {
    const res = await fetch(
      `http://127.0.0.1:${throwingPort}/api/admin/bootstrap-superadmin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bootstrap-token": TOKEN,
        },
        body: JSON.stringify({ email: "founder@example.com" }),
      }
    );
    const json = await res.json();

    assert.equal(
      res.status,
      503,
      `expected 503 when DB is unreachable, got ${res.status}: ${JSON.stringify(json)}`
    );
    assert.ok(
      typeof json.error === "string" && json.error.length > 0,
      "response body must contain an error message"
    );
  } finally {
    await new Promise<void>((resolve) => throwingServer.close(() => resolve()));
  }
});
