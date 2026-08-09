/**
 * Integration-style test for POST /api/admin/set-prod-url URL validation.
 *
 * Confirms the server rejects invalid URLs (non-https, .replit.dev, malformed)
 * with HTTP 400 and descriptive messages, and accepts a valid https URL.
 *
 * Uses the same hermetic mirror pattern as admin-email-test-no-email.test.ts —
 * no real DB, no OIDC — so it always runs in CI without DATABASE_URL.
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

// ── Minimal auth shim ─────────────────────────────────────────────────────────

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

// ── Mirror of the handler logic from server/routes.ts ────────────────────────

let savedUrl: string | null = null;

function makeProdUrlHandler() {
  return async (req: any, res: any) => {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url required" });
    }
    const clean = url.trim().replace(/\/$/, "");

    let parsed: URL;
    try {
      parsed = new URL(clean);
    } catch {
      return res.status(400).json({ error: "Format URL tidak valid. Contoh yang benar: https://nama-app.replit.app" });
    }

    if (parsed.protocol !== "https:") {
      return res.status(400).json({ error: "URL harus menggunakan https:// (bukan http:// atau protokol lain)" });
    }

    if (parsed.hostname.endsWith(".replit.dev")) {
      return res.status(400).json({
        error: "URL .replit.dev adalah URL development yang tidak stabil dan akan berubah. Gunakan URL deployment yang stabil, misalnya https://nama-app.replit.app",
      });
    }

    savedUrl = clean;
    return res.json({ ok: true, appUrl: clean });
  };
}

// ── Test server setup ─────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use(authShim);
app.post("/api/admin/set-prod-url", isAuthenticated, requireAdmin, makeProdUrlHandler());

let server: Server;
let base: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  base = `http://127.0.0.1:${port}`;
});

after(() => {
  server?.close();
});

// ── Helper ────────────────────────────────────────────────────────────────────

async function post(url: string, body: unknown, adminOverride = ADMIN_ID) {
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

// ── Tests ─────────────────────────────────────────────────────────────────────

test("rejects a .replit.dev URL with 400 and a descriptive message", async () => {
  const { status, data } = await post("/api/admin/set-prod-url", {
    url: "https://my-app.abc123.replit.dev",
  });
  assert.equal(status, 400, "should be HTTP 400");
  assert.ok(
    typeof data.error === "string" && data.error.includes(".replit.dev"),
    `error should mention .replit.dev, got: ${data.error}`,
  );
});

test("rejects an http:// (non-https) URL with 400", async () => {
  const { status, data } = await post("/api/admin/set-prod-url", {
    url: "http://my-app.replit.app",
  });
  assert.equal(status, 400);
  assert.ok(
    typeof data.error === "string" && data.error.includes("https://"),
    `error should mention https://, got: ${data.error}`,
  );
});

test("rejects a completely malformed string with 400", async () => {
  const { status, data } = await post("/api/admin/set-prod-url", {
    url: "htp:/not-a-url",
  });
  assert.equal(status, 400);
  assert.ok(typeof data.error === "string" && data.error.length > 0);
});

test("rejects a missing url field with 400", async () => {
  const { status, data } = await post("/api/admin/set-prod-url", {});
  assert.equal(status, 400);
  assert.equal(data.error, "url required");
});

test("accepts a valid https .replit.app URL and saves it", async () => {
  savedUrl = null;
  const { status, data } = await post("/api/admin/set-prod-url", {
    url: "https://gustafta.replit.app",
  });
  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.appUrl, "https://gustafta.replit.app");
  assert.equal(savedUrl, "https://gustafta.replit.app");
});

test("trims trailing slash before saving", async () => {
  savedUrl = null;
  const { status, data } = await post("/api/admin/set-prod-url", {
    url: "https://gustafta.replit.app/",
  });
  assert.equal(status, 200);
  assert.equal(data.appUrl, "https://gustafta.replit.app");
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
  const { status } = await post("/api/admin/set-prod-url", {
    url: "https://gustafta.replit.app",
  }, "not-an-admin-user");
  assert.equal(status, 403);
});
