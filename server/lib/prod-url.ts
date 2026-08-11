/**
 * Production URL resolution — single source of truth for delivery links.
 *
 * All external-facing links (chatbot URLs, embed codes, WA welcome messages)
 * are built from the URL this module resolves. The critical invariant:
 * a .replit.dev development URL must NEVER be served as the app URL —
 * those domains are unstable and would break buyer links.
 *
 * Extracted from server/routes.ts so the exact production handlers can be
 * exercised by tests (tests/prod-url-validation.test.ts) with injected
 * env + persistence — no mirror drift.
 */

// In-memory cache for the production URL — loaded at startup from DB or env.
let _cachedProdUrl: string | null = null;

export function getCachedProdUrl(): string | null {
  return _cachedProdUrl;
}

export function setCachedProdUrl(url: string | null): void {
  _cachedProdUrl = url;
}

export type EnvLike = { REPLIT_DOMAINS?: string; PROD_URL?: string };

export interface AppUrlResolution {
  appUrl: string | null;
  source: "replit_domains_custom" | "env" | "replit_domains" | "db" | "none";
}

/**
 * Resolve the canonical app URL for external-facing links.
 * Priority: custom domain in REPLIT_DOMAINS → PROD_URL env → .replit.app
 * domain → cached/saved prod URL (DB) → null. `.replit.dev` / `.repl.co`
 * domains are excluded at every step and can never be returned.
 */
export function resolveAppUrl(
  env: EnvLike = process.env as EnvLike,
  cachedUrl: string | null = _cachedProdUrl,
): AppUrlResolution {
  const domains = (env.REPLIT_DOMAINS || "").split(",").map((d) => d.trim()).filter(Boolean);
  // Prefer CUSTOM domain (e.g. gustafta.my.id) over .replit.app
  const customDomain = domains.find(
    (d) => !d.endsWith(".replit.app") && !d.endsWith(".replit.dev") && !d.endsWith(".repl.co"),
  );
  if (customDomain) return { appUrl: `https://${customDomain}`, source: "replit_domains_custom" };
  // PROD_URL (custom domain set by admin) beats the generic .replit.app domain
  if (env.PROD_URL) return { appUrl: env.PROD_URL, source: "env" };
  const prodDomain = domains.find((d) => d.endsWith(".replit.app"));
  if (prodDomain) return { appUrl: `https://${prodDomain}`, source: "replit_domains" };
  if (cachedUrl) return { appUrl: cachedUrl, source: "db" };
  return { appUrl: null, source: "none" };
}

/** Express handler for GET /api/config/app-url. `env` injectable for tests. */
export function makeAppUrlHandler(env?: EnvLike) {
  return (_req: any, res: any) => {
    res.json(resolveAppUrl(env ?? (process.env as EnvLike)));
  };
}

/**
 * Express handler factory for POST /api/admin/set-prod-url.
 * Validates (https-only, no .replit.dev, well-formed), then updates the
 * in-memory cache AND persists via `save` (DB upsert in production, an
 * in-memory store in tests). Cache is updated first so the config endpoint
 * reflects the new value even if persistence is slow.
 */
export function makeSetProdUrlHandler(save: (url: string) => Promise<void>) {
  return async (req: any, res: any) => {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== "string") return res.status(400).json({ error: "url required" });
    const clean = url.trim().replace(/\/$/, "");

    // Must be a valid URL
    let parsed: URL;
    try {
      parsed = new URL(clean);
    } catch {
      return res.status(400).json({ error: "Format URL tidak valid. Contoh yang benar: https://nama-app.replit.app" });
    }

    // Must use https
    if (parsed.protocol !== "https:") {
      return res.status(400).json({ error: "URL harus menggunakan https:// (bukan http:// atau protokol lain)" });
    }

    // Must not be a .replit.dev URL (development/unstable)
    if (parsed.hostname.endsWith(".replit.dev")) {
      return res.status(400).json({ error: "URL .replit.dev adalah URL development yang tidak stabil dan akan berubah. Gunakan URL deployment yang stabil, misalnya https://nama-app.replit.app" });
    }

    setCachedProdUrl(clean);
    await save(clean);
    return res.json({ ok: true, appUrl: clean });
  };
}
