/**
 * Tests for superadmin phone-promotion logic.
 *
 * Covers the scenario where a user's phone is stored in a legacy format
 * (leading "0", "+62", or bare "8x") while SUPERADMIN_PHONE env is stored
 * in a different format. Both sides are normalised before comparison inside
 * `promoteSuperAdminIfMatch` via the production `phoneInAllowlist` predicate,
 * so promotion must fire regardless of which format either side uses.
 *
 * All tests against `promoteSuperAdminIfMatch` exercise the **phone branch**
 * (no email match) using the `phonesOverride` param to inject an allowlist
 * without requiring a module reload or a live database.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  normalizePhone,
  buildSuperAdminPhones,
  phoneInAllowlist,
  promoteSuperAdminIfMatch,
} from "../server/replit_integrations/auth/emailAuth";

// ── normalizePhone unit tests ──────────────────────────────────────────────

describe("normalizePhone", () => {
  test("leading 0 → replaced with 62", () => {
    assert.equal(normalizePhone("081234567890"), "6281234567890");
  });

  test("leading 62 → unchanged", () => {
    assert.equal(normalizePhone("6281234567890"), "6281234567890");
  });

  test("+62 prefix → strips + then unchanged", () => {
    assert.equal(normalizePhone("+6281234567890"), "6281234567890");
  });

  test("bare 8x (no country prefix) → prepended with 62", () => {
    assert.equal(normalizePhone("81234567890"), "6281234567890");
  });

  test("non-digit characters stripped before normalisation", () => {
    assert.equal(normalizePhone("+62 812-3456-7890"), "6281234567890");
    assert.equal(normalizePhone("0812 3456 7890"), "6281234567890");
  });
});

// ── phoneInAllowlist — production predicate used inside promoteSuperAdminIfMatch

describe("phoneInAllowlist (production predicate)", () => {
  const canonical = "6281234567890";

  test("DB stores leading-0 format, env has 62-prefix → match", () => {
    assert.ok(phoneInAllowlist("081234567890", buildSuperAdminPhones(canonical)));
  });

  test("DB stores 62-prefix, env has leading-0 format → match", () => {
    assert.ok(phoneInAllowlist(canonical, buildSuperAdminPhones("081234567890")));
  });

  test("DB stores +62 prefix, env has 62-prefix → match", () => {
    assert.ok(phoneInAllowlist("+6281234567890", buildSuperAdminPhones(canonical)));
  });

  test("DB stores bare 8x, env has 62-prefix → match", () => {
    assert.ok(phoneInAllowlist("81234567890", buildSuperAdminPhones(canonical)));
  });

  test("DB stores 62-prefix, env has +62 prefix → match", () => {
    assert.ok(phoneInAllowlist(canonical, buildSuperAdminPhones("+6281234567890")));
  });

  test("completely different number → no match", () => {
    assert.ok(!phoneInAllowlist("081299999999", buildSuperAdminPhones(canonical)));
  });

  test("null/undefined phone → no match", () => {
    const set = buildSuperAdminPhones(canonical);
    assert.ok(!phoneInAllowlist(null, set));
    assert.ok(!phoneInAllowlist(undefined, set));
  });

  test("multiple phones in env — only matching one hits", () => {
    const set = buildSuperAdminPhones("081111111111,6281234567890,62899999999");
    assert.ok(phoneInAllowlist("081234567890", set));
    assert.ok(phoneInAllowlist("0899999999", set));
    assert.ok(!phoneInAllowlist("081222222222", set));
  });
});

// ── promoteSuperAdminIfMatch — real function, phone branch, db spy ─────────
//
// Tests inject a phone allowlist via `phonesOverride` and a db spy via
// `dbOverride` so no live DB or module reload is needed.  The phone match path
// inside the real function is exercised exclusively (email is null / empty env).

function makeDbSpy() {
  let called = false;
  const spy = {
    update: (_table: unknown) => ({
      set: (_vals: unknown) => ({
        where: async (_cond: unknown) => {
          called = true;
          return [];
        },
      }),
    }),
    wasCalled: () => called,
    reset() { called = false; },
  };
  return spy;
}

describe("promoteSuperAdminIfMatch — phone branch with legacy DB formats", () => {
  const canonicalEnv = "6281234567890"; // env stores canonical 62-prefix

  test("DB phone leading-0 format → promotes and persists role", async () => {
    const spy = makeDbSpy();
    const result = await promoteSuperAdminIfMatch(
      "user-a",
      "081234567890",        // DB stored with leading 0
      "user",
      null,                  // no email — exercises phone branch only
      spy as any,
      buildSuperAdminPhones(canonicalEnv),
    );
    assert.equal(result, "superadmin");
    assert.ok(spy.wasCalled(), "db.update must be called to persist the role upgrade");
  });

  test("DB phone +62 prefix → promotes and persists role", async () => {
    const spy = makeDbSpy();
    const result = await promoteSuperAdminIfMatch(
      "user-b",
      "+6281234567890",      // DB stored with +62
      "user",
      null,
      spy as any,
      buildSuperAdminPhones(canonicalEnv),
    );
    assert.equal(result, "superadmin");
    assert.ok(spy.wasCalled());
  });

  test("DB phone bare-8x format → promotes and persists role", async () => {
    const spy = makeDbSpy();
    const result = await promoteSuperAdminIfMatch(
      "user-c",
      "81234567890",         // DB stored without country code
      "user",
      null,
      spy as any,
      buildSuperAdminPhones(canonicalEnv),
    );
    assert.equal(result, "superadmin");
    assert.ok(spy.wasCalled());
  });

  test("env stores leading-0, DB stores 62-prefix → promotes", async () => {
    const spy = makeDbSpy();
    const result = await promoteSuperAdminIfMatch(
      "user-d",
      "6281234567890",       // DB stores canonical
      "user",
      null,
      spy as any,
      buildSuperAdminPhones("081234567890"), // env stores with leading 0
    );
    assert.equal(result, "superadmin");
    assert.ok(spy.wasCalled());
  });

  test("non-matching phone → returns existing role, no db call", async () => {
    const spy = makeDbSpy();
    const result = await promoteSuperAdminIfMatch(
      "user-e",
      "081299999999",        // different number
      "user",
      null,
      spy as any,
      buildSuperAdminPhones(canonicalEnv),
    );
    assert.equal(result, "user");
    assert.ok(!spy.wasCalled(), "db.update must NOT be called for non-matching users");
  });

  test("null phone → returns existing role, no db call", async () => {
    const spy = makeDbSpy();
    const result = await promoteSuperAdminIfMatch(
      "user-f",
      null,
      "user",
      null,
      spy as any,
      buildSuperAdminPhones(canonicalEnv),
    );
    assert.equal(result, "user");
    assert.ok(!spy.wasCalled());
  });

  test("already superadmin → early return, no db call", async () => {
    const spy = makeDbSpy();
    const result = await promoteSuperAdminIfMatch(
      "user-g",
      "081234567890",
      "superadmin",
      null,
      spy as any,
      buildSuperAdminPhones(canonicalEnv),
    );
    assert.equal(result, "superadmin");
    assert.ok(!spy.wasCalled());
  });
});
