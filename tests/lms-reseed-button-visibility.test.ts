/**
 * Task #111 — Konfirmasi tombol Re-seed muncul kembali setelah reseed gagal
 *
 * Cakupan:
 * 1. [Integrasi] POST /api/admin/lms/reseed yang gagal → seedStatus === "error"
 *    di endpoint health.
 * 2. [Integrasi] Setelah gagal, reseed ulang yang juga gagal → seedStatus tetap
 *    "error" (tombol harus tetap muncul setelah retry kedua).
 * 3. [Integrasi] Guard 409: reseed baru ditolak saat seed lain sedang berjalan.
 * 4. [Unit] Logika visibilitas tombol Re-seed: muncul saat "error" atau "skipped",
 *    tersembunyi saat "pending" atau "done".
 * 5. [Unit] Siklus transisi lengkap: tombol muncul di setiap langkah "error".
 *
 * Catatan desain: `lmsSeedStatus` adalah variabel module-level yang dibagi
 * antar semua Express-app dalam satu proses.  Oleh sebab itu tes ini hanya
 * mendaftarkan SATU server dan menginjeksikan seedFn via referensi yang bisa
 * diganti antar-tes.
 *
 * Tes integrasi dilewati otomatis bila DATABASE_URL tidak ada.
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

// ── Guards & env ──────────────────────────────────────────────────────────────

const hasDb = !!process.env.DATABASE_URL;
const SKIP = hasDb ? false : "DATABASE_URL tidak diset — lewati tes integrasi DB";

const RUN = `lms_reseed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const TEST_ADMIN_ID = `test-admin-${RUN}`;

// ── Mutable seed function reference ──────────────────────────────────────────
// We register ONE server whose seed implementation is delegated through this
// reference.  Tests can swap it out to control success vs failure behaviour
// without creating multiple servers (which would race on the shared module-level
// `lmsSeedStatus` variable).

let seedFnRef: () => Promise<{ added: number; updated: number }> =
  async () => { throw new Error("Injected seed failure (default)"); };

let seedCallCount = 0;

// ── Express test server ───────────────────────────────────────────────────────

let server: Server;
let baseUrl: string;

before(async () => {
  if (!hasDb) return;

  const { registerLmsRoutes } = await import("../server/routes-lms");

  const app = express();
  app.use(express.json());

  // Auth shim: x-test-user header simulates an authenticated session.
  app.use((req: any, _res: any, next: any) => {
    const uid = req.headers["x-test-user"];
    if (uid) {
      req.user = { id: String(uid), claims: { sub: String(uid) } };
      req.isAuthenticated = () => true;
    } else {
      req.isAuthenticated = () => false;
    }
    next();
  });

  // Register this test's admin via ADMIN_USER_IDS env var.
  const orig = process.env.ADMIN_USER_IDS ?? "";
  process.env.ADMIN_USER_IDS = orig ? `${orig},${TEST_ADMIN_ID}` : TEST_ADMIN_ID;

  // Register routes with an indirection through seedFnRef so tests can control
  // what the seed does without restarting the server.
  registerLmsRoutes(app, async () => {
    seedCallCount++;
    return seedFnRef();
  });

  server = createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  if (!hasDb) return;
  await new Promise<void>((r, j) => server.close((e) => (e ? j(e) : r())));
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function adminHeaders() {
  return { "x-test-user": TEST_ADMIN_ID, "Content-Type": "application/json" };
}

async function getHealth() {
  const res = await fetch(`${baseUrl}/api/admin/lms/health`, { headers: adminHeaders() });
  assert.equal(res.status, 200, `Health must return 200; got ${res.status}`);
  return res.json() as Promise<any>;
}

/**
 * Poll health until seedStatus is no longer "pending".
 * Needed because `registerLmsRoutes` fires the initial seed asynchronously.
 */
async function waitForSeedTerminal(timeoutMs = 15_000): Promise<any> {
  const TERMINAL = new Set(["done", "skipped", "error"]);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/api/admin/lms/health`, { headers: adminHeaders() });
      if (res.status === 200) {
        const body = await res.json() as any;
        if (TERMINAL.has(body.seedStatus)) return body;
      }
    } catch { /* ignore network hiccups during boot */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`seedStatus still 'pending' after ${timeoutMs}ms`);
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Integration tests ─────────────────────────────────────────────────────────

test(
  "reseed: POST /api/admin/lms/reseed yang gagal menetapkan seedStatus ke 'error' di health",
  { skip: SKIP },
  async () => {
    // Step 1: Ensure we start in a stable "error" state (initial seed always fails).
    const initial = await waitForSeedTerminal();
    assert.equal(initial.seedStatus, "error",
      `Initial seed should be 'error' because seedFnRef always throws; got '${initial.seedStatus}'`);

    // Step 2: Trigger a manual reseed — the injected seed fn still throws.
    const reseedRes = await fetch(`${baseUrl}/api/admin/lms/reseed`, {
      method: "POST",
      headers: adminHeaders(),
    });

    if (reseedRes.status === 409) {
      // A prior seed is still in flight; wait and verify status afterwards.
      const settled = await waitForSeedTerminal();
      assert.equal(settled.seedStatus, "error",
        `After 409, seedStatus must eventually be 'error'; got '${settled.seedStatus}'`);
      return;
    }

    assert.equal(reseedRes.status, 500,
      `Reseed with always-failing seed must return 500; got ${reseedRes.status}`);

    // Step 3: Health must reflect seedStatus === "error" immediately after.
    const health = await getHealth();
    assert.equal(health.seedStatus, "error",
      `seedStatus must be 'error' after a failed reseed; got '${health.seedStatus}'`);
    assert.equal(health.seeding, false,
      "seeding flag must be false when seedStatus is 'error' (seed has stopped)");
  }
);

test(
  "reseed: seedStatus 'error' bertahan setelah reseed ulang yang juga gagal",
  { skip: SKIP },
  async () => {
    // Ensure we start from a stable "error" state.
    await waitForSeedTerminal();

    for (let attempt = 1; attempt <= 2; attempt++) {
      await waitForSeedTerminal(10_000);

      const res = await fetch(`${baseUrl}/api/admin/lms/reseed`, {
        method: "POST",
        headers: adminHeaders(),
      });

      if (res.status === 409) {
        // Concurrent guard fired; wait for the in-flight seed to finish.
        await waitForSeedTerminal(10_000);
      } else {
        assert.equal(res.status, 500,
          `Attempt ${attempt}: expected 500 from always-failing seed; got ${res.status}`);
      }

      const health = await getHealth();
      assert.equal(health.seedStatus, "error",
        `Attempt ${attempt}: seedStatus must remain 'error'; got '${health.seedStatus}'`);

      // Key assertion: the button visibility predicate must be true after each failed attempt.
      const buttonVisible = !!(health && (health.seedStatus === "error" || health.seedStatus === "skipped"));
      assert.equal(buttonVisible, true,
        `Attempt ${attempt}: Re-seed button must be visible when seedStatus='error'`);
    }
  }
);

test(
  "reseed: endpoint mengembalikan 409 saat seed lain sedang berjalan",
  { skip: SKIP },
  async () => {
    // Use a slow seed fn so the second call definitely lands while the first is pending.
    const prev = seedFnRef;
    let slowResolveFn: (() => void) | null = null;
    seedFnRef = async () => {
      await new Promise<void>((r) => { slowResolveFn = r; });
      throw new Error("Slow seed failure");
    };

    try {
      // Ensure we're in a terminal state before starting.
      await waitForSeedTerminal();

      // Fire the first reseed — it will hang until we release slowResolveFn.
      const firstPromise = fetch(`${baseUrl}/api/admin/lms/reseed`, {
        method: "POST",
        headers: adminHeaders(),
      });

      // Give the first request time to set lmsSeedStatus = "pending".
      await sleep(150);

      // Fire a second reseed while the first is still pending.
      const secondRes = await fetch(`${baseUrl}/api/admin/lms/reseed`, {
        method: "POST",
        headers: adminHeaders(),
      });

      // Release the first request's slow seed so the server can clean up.
      slowResolveFn?.();
      const firstRes = await firstPromise;

      // The second call must have been rejected (409 = concurrent guard).
      assert.equal(secondRes.status, 409,
        `Second concurrent reseed must get 409; got ${secondRes.status}`);

      // The first call must have settled (500 because seed throws after resolve).
      assert.equal(firstRes.status, 500,
        `First reseed must return 500 (slow seed throws); got ${firstRes.status}`);

      // Verify status settled back to "error".
      const health = await waitForSeedTerminal();
      assert.equal(health.seedStatus, "error",
        `seedStatus must be 'error' after slow failing seed; got '${health.seedStatus}'`);
    } finally {
      // Always restore the original seed fn.
      seedFnRef = prev;
      // Ensure any hanging seed gets released.
      slowResolveFn?.();
      await waitForSeedTerminal().catch(() => {});
    }
  }
);

// ── Unit tests — button visibility logic ─────────────────────────────────────
//
// These mirror the conditional in LmsHealthCard (admin-academy.tsx ~line 1016):
//
//   {health && (health.seedStatus === "error" || health.seedStatus === "skipped") && (
//     <Button ... disabled={reseedMut.isPending || health.seeding} ...>
//   )}

function reseedButtonVisible(
  health: { seedStatus: string; seeding: boolean } | undefined
): boolean {
  return !!(health && (health.seedStatus === "error" || health.seedStatus === "skipped"));
}

function reseedButtonDisabled(
  health: { seeding: boolean },
  reseedIsPending: boolean
): boolean {
  return reseedIsPending || health.seeding;
}

test("button: MUNCUL saat seedStatus === 'error'", () => {
  assert.equal(reseedButtonVisible({ seedStatus: "error", seeding: false }), true,
    "Re-seed button must be visible when seedStatus is 'error'");
});

test("button: MUNCUL saat seedStatus === 'skipped'", () => {
  assert.equal(reseedButtonVisible({ seedStatus: "skipped", seeding: false }), true,
    "Re-seed button must be visible when seedStatus is 'skipped'");
});

test("button: TERSEMBUNYI saat seedStatus === 'pending'", () => {
  assert.equal(reseedButtonVisible({ seedStatus: "pending", seeding: true }), false,
    "Re-seed button must be hidden when seedStatus is 'pending'");
});

test("button: TERSEMBUNYI saat seedStatus === 'done'", () => {
  assert.equal(reseedButtonVisible({ seedStatus: "done", seeding: false }), false,
    "Re-seed button must be hidden when seedStatus is 'done'");
});

test("button: TERSEMBUNYI saat health undefined (masih loading)", () => {
  assert.equal(reseedButtonVisible(undefined), false,
    "Re-seed button must be hidden when health data is not yet loaded");
});

test("button: DISABLED saat reseedMut.isPending === true", () => {
  assert.equal(
    reseedButtonDisabled({ seedStatus: "error", seeding: false }, true),
    true,
    "Re-seed button must be disabled while a mutation is in flight"
  );
});

test("button: DISABLED saat health.seeding === true", () => {
  assert.equal(
    reseedButtonDisabled({ seedStatus: "error", seeding: true }, false),
    true,
    "Re-seed button must be disabled while seeding is already running"
  );
});

test("button: AKTIF saat seedStatus 'error' dan tidak ada operasi berjalan", () => {
  assert.equal(
    reseedButtonDisabled({ seedStatus: "error", seeding: false }, false),
    false,
    "Re-seed button must be enabled when status is 'error' and nothing is pending"
  );
});

// ── Transition sequence ───────────────────────────────────────────────────────
//
// Simulate the full lifecycle:
//   pending → error → (retry 1) → pending → error → (retry 2) → pending → done
//
// The button must appear at every "error" step.

test("button: muncul kembali di setiap langkah 'error' dalam siklus retry", () => {
  const transitions: Array<{
    seedStatus: string;
    seeding: boolean;
    expectVisible: boolean;
    label: string;
  }> = [
    { seedStatus: "pending", seeding: true,  expectVisible: false, label: "initial seed running"        },
    { seedStatus: "error",   seeding: false, expectVisible: true,  label: "first failure"               },
    { seedStatus: "pending", seeding: true,  expectVisible: false, label: "auto-retry countdown running" },
    { seedStatus: "error",   seeding: false, expectVisible: true,  label: "retry also failed — button must reappear" },
    { seedStatus: "pending", seeding: true,  expectVisible: false, label: "manual retry running"         },
    { seedStatus: "done",    seeding: false, expectVisible: false, label: "eventually succeeds"           },
  ];

  for (const { seedStatus, seeding, expectVisible, label } of transitions) {
    const visible = reseedButtonVisible({ seedStatus, seeding });
    assert.equal(
      visible,
      expectVisible,
      `[${label}] seedStatus='${seedStatus}' seeding=${seeding}: expected visible=${expectVisible}, got ${visible}`
    );
  }
});
