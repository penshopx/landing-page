/**
 * Integration test for the REAL prod-URL handlers from server/lib/prod-url.ts —
 * the exact code server/routes.ts mounts at POST /api/admin/set-prod-url and
 * GET /api/config/app-url. No mirror: a regression in the production module
 * (validation, fallback ordering, cache update) fails these tests.
 *
 * Persistence is injected (in-memory store standing in for the system_config
 * DB upsert) so the suite is hermetic — no DATABASE_URL, no OIDC — and always
 * runs in CI. The in-memory prod-URL cache used by the config endpoint is the
 * real module-level cache from server/lib/prod-url.ts.
 */

import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import {
  makeAppUrlHandler,
  makeSetProdUrlHandler,
  setCachedProdUrl,
  resolveAppUrl,
  type EnvLike,
} from "../server/lib/prod-url";

// ── Minimal auth shim (route guards, not under test here) ────────────────────

const ADMIN_ID = "test-admin-141";

function authShim(req: any, _res: any, next: any) {
  const uid = req.headers["x-test-user"];
  if (uid) req.user = { id: String(uid), claims: { sub: String(uid) } };
  next();
}

function isAuthenticated(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Tidak terautentikasi" });
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Tidak terautentikasi" });
  if (req.user.id !== ADMIN_ID) return res.status(403).json({ error: "Akses ditolak" });
  next();
}

// ── Injected dependencies ─────────────────────────────────────────────────────

// In-memory stand-in for the system_config DB upsert done by saveProdUrlToDb.
let persistedUrl: string | null = null;
async function fakeSave(url: string): Promise<void> {
  persistedUrl = url;
}

// Injected env for the app-url handler. Default simulates the dev workspace:
// REPLIT_DOMAINS holds only an unstable .replit.dev domain, no PROD_URL.
let fakeEnv: EnvLike = {};

// ── Test server: REAL handlers from server/lib/prod-url.ts ──────────────────

const app = express();
app.use(express.json());
app.use(authShim);
app.post("/api/admin/set-prod-url", isAuthenticated, requireAdmin, makeSetProdUrlHandler(fakeSave));
// Wrapped so per-test fakeEnv changes take effect; the handler itself is real.
app.get("/api/config/app-url", (req, res) => makeAppUrlHandler(fakeEnv)(req, res));

let server: Server;
let base: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  base = `http://127.0.0.1:${port}`;
});

beforeEach(() => {
  // Reset the REAL module-level cache + fake persistence between tests.
  setCachedProdUrl(null);
  persistedUrl = null;
  fakeEnv = { REPLIT_DOMAINS: "abc-123-xyz.picard.replit.dev" };
});

after(() => {
  server?.close();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function post(body: unknown, adminOverride = ADMIN_ID) {
  const res = await fetch(`${base}/api/admin/set-prod-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-user": adminOverride,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json() as any;
  return { status: res.status, data };
}

async function getAppUrl() {
  const res = await fetch(`${base}/api/config/app-url`);
  const data = await res.json() as any;
  return { status: res.status, data };
}

// ── Validation tests (real handler) ──────────────────────────────────────────

test("rejects a .replit.dev URL with 400 and a descriptive message", async () => {
  const { status, data } = await post({ url: "https://my-app.abc123.replit.dev" });
  assert.equal(status, 400, "should be HTTP 400");
  assert.ok(
    typeof data.error === "string" && data.error.includes(".replit.dev"),
    `error should mention .replit.dev, got: ${data.error}`,
  );
  assert.equal(persistedUrl, null, "invalid URL must never be persisted");
});

test("rejects an http:// (non-https) URL with 400", async () => {
  const { status, data } = await post({ url: "http://my-app.replit.app" });
  assert.equal(status, 400);
  assert.ok(
    typeof data.error === "string" && data.error.includes("https://"),
    `error should mention https://, got: ${data.error}`,
  );
});

test("rejects a completely malformed string with 400", async () => {
  const { status, data } = await post({ url: "htp:/not-a-url" });
  assert.equal(status, 400);
  assert.ok(typeof data.error === "string" && data.error.length > 0);
});

test("rejects a missing url field with 400", async () => {
  const { status, data } = await post({});
  assert.equal(status, 400);
  assert.equal(data.error, "url required");
});

test("accepts a valid https .replit.app URL and persists it", async () => {
  const { status, data } = await post({ url: "https://gustafta.replit.app" });
  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.appUrl, "https://gustafta.replit.app");
  assert.equal(persistedUrl, "https://gustafta.replit.app");
});

test("trims trailing slash before saving", async () => {
  const { status, data } = await post({ url: "https://gustafta.replit.app/" });
  assert.equal(status, 200);
  assert.equal(data.appUrl, "https://gustafta.replit.app");
  assert.equal(persistedUrl, "https://gustafta.replit.app");
});

test("returns 401 for unauthenticated requests", async () => {
  const res = await fetch(`${base}/api/admin/set-prod-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://gustafta.replit.app" }),
  });
  assert.equal(res.status, 401);
});

test("returns 403 for non-admin users", async () => {
  const { status } = await post({ url: "https://gustafta.replit.app" }, "not-an-admin-user");
  assert.equal(status, 403);
});

// ── set-prod-url → config/app-url integration (real handlers, real cache) ────

test("config endpoint returns the saved URL after a successful set-prod-url", async () => {
  // Dev environment: REPLIT_DOMAINS only holds an unstable .replit.dev domain
  const saved = await post({ url: "https://gustafta.my.id" });
  assert.equal(saved.status, 200);

  const { status, data } = await getAppUrl();
  assert.equal(status, 200);
  assert.equal(data.appUrl, "https://gustafta.my.id", "config must reflect the saved URL");
  assert.equal(data.source, "db");
});

test("config endpoint NEVER falls back to a .replit.dev URL when a valid saved URL exists", async () => {
  fakeEnv = { REPLIT_DOMAINS: "abc-123-xyz.picard.replit.dev,another.replit.dev" };

  await post({ url: "https://gustafta.replit.app" });

  const { data } = await getAppUrl();
  assert.ok(typeof data.appUrl === "string" && data.appUrl.length > 0, "should return a URL");
  assert.ok(!data.appUrl.includes(".replit.dev"), `must not be a .replit.dev URL, got: ${data.appUrl}`);
  assert.equal(data.appUrl, "https://gustafta.replit.app");
});

test("config endpoint never leaks .replit.dev even with no saved URL (returns null instead)", async () => {
  const { data } = await getAppUrl();
  assert.equal(data.appUrl, null, ".replit.dev must never be served as the app URL");
  assert.equal(data.source, "none");
});

test("a rejected .replit.dev save leaves the previously saved URL intact", async () => {
  await post({ url: "https://gustafta.my.id" });
  const rejected = await post({ url: "https://sneaky.replit.dev" });
  assert.equal(rejected.status, 400);

  const { data } = await getAppUrl();
  assert.equal(data.appUrl, "https://gustafta.my.id");
  assert.equal(persistedUrl, "https://gustafta.my.id");
});

test("PROD_URL env override still beats the saved DB value (documented ordering)", async () => {
  fakeEnv = { REPLIT_DOMAINS: "abc.replit.dev", PROD_URL: "https://env-override.example.com" };

  await post({ url: "https://gustafta.my.id" });

  const { data } = await getAppUrl();
  assert.equal(data.appUrl, "https://env-override.example.com");
  assert.equal(data.source, "env");
});

// ── resolveAppUrl unit sanity (same function the handler calls) ──────────────

test("resolveAppUrl prefers a custom domain from REPLIT_DOMAINS over everything", () => {
  const r = resolveAppUrl(
    { REPLIT_DOMAINS: "gustafta.my.id,app.replit.app,dev.replit.dev", PROD_URL: "https://x.example.com" },
    "https://saved.example.com",
  );
  assert.deepEqual(r, { appUrl: "https://gustafta.my.id", source: "replit_domains_custom" });
});

test("resolveAppUrl never returns a .replit.dev domain from REPLIT_DOMAINS", () => {
  const r = resolveAppUrl({ REPLIT_DOMAINS: "only-dev.picard.replit.dev" }, null);
  assert.deepEqual(r, { appUrl: null, source: "none" });
});
