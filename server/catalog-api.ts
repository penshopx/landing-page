// ─────────────────────────────────────────────────────────────────────────────
// GUSTAFTA CATALOG API — Phase 2A (read-only, untuk GAIA sebagai consumer)
//
// Gustafta = SOURCE OF TRUTH. GAIA hanya membaca katalog dari sini.
//
// - PUBLIC:  /api/v1/catalog/*  — read-only, TANPA auth, hanya data eligible:
//     PRODUCT eligible : status ACTIVE + gaia_enabled + visibility ≠ INTERNAL_ONLY
//     PACKAGE eligible : status ACTIVE + gaia_enabled + price > 0 + ≥1 produk
//   Field yang diekspos = WHITELIST (tidak ada data internal/sensitif).
// - ADMIN:   /api/admin/registry/gaia-preview — guard admin existing, menampilkan
//   status eligibility per product/package (preview saja, bukan editor GAIA).
// - CORS: origin diatur via env CATALOG_ALLOWED_ORIGINS (comma separated).
//   Tanpa env → tidak ada header CORS (bukan wildcard permanen).
// - Cache: in-memory sederhana TTL 60 dtk (mudah dihapus/diganti nanti).
// ─────────────────────────────────────────────────────────────────────────────
import type { Express, Request, Response, NextFunction } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "./db";
import {
  productRegistry, solutionRegistry, sectorRegistry, tierRegistry,
  packageRegistry, packageProducts, packageVersionSnapshots,
} from "@shared/schema";
import { getWaContact } from "./lib/wa-contact";

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; data: any }>();
const cached = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;
  const data = await fn();
  cache.set(key, { at: Date.now(), data });
  return data;
};
export const clearCatalogCache = () => cache.clear();

// ── Eligibility (spec §17) ────────────────────────────────────────────────────
const productEligible = (p: any) =>
  p.status === "ACTIVE" && p.gaiaEnabled === true && p.visibility !== "INTERNAL_ONLY";

const packageEligible = (pkg: any, productCount: number) =>
  pkg.status === "ACTIVE" && pkg.gaiaEnabled === true && pkg.price > 0 && productCount > 0;

// Produk boleh tampil DI DALAM komposisi package publik hanya jika ACTIVE dan
// bukan INTERNAL_ONLY. (gaia_enabled TIDAK disyaratkan di sini — flag itu untuk
// listing standalone; capability INCLUDED_ONLY memang tampil via package.)
const compositionEntryVisible = (c: any) =>
  c.productStatus === "ACTIVE" && c.productVisibility !== "INTERNAL_ONLY";

// ── Public payload whitelists ────────────────────────────────────────────────
const publicProduct = (p: any) => ({
  product_id: p.productId,
  name: p.name,
  slug: p.slug,
  tagline: p.tagline ?? null,
  description: p.description ?? null,
  product_type: p.productType,
  category: p.category ?? null,
  status: p.status,
  visibility: p.visibility,
  standalone_enabled: !!p.standaloneEnabled,
  subscription_enabled: !!p.subscriptionEnabled,
  dp_enabled: !!p.dpEnabled,
  ai_enabled: !!p.aiEnabled,
  price: p.price ?? 0,
  currency: p.currency ?? "IDR",
  billing_type: p.billingType ?? null,
  version: p.version ?? null,
  features: Array.isArray(p.features) ? p.features : [],
  benefits: Array.isArray(p.benefits) ? p.benefits : [],
  thumbnail: p.thumbnail ?? null,
  demo_url: p.demoUrl ?? null,
  gaia_enabled: true,
  source: "GUSTAFTA",
});

const publicSimple = (r: any) => ({
  id: r.id, name: r.name, slug: r.slug, description: r.description ?? null,
  ...(r.level !== undefined ? { level: r.level } : {}),
});

// ── Order CTA (Opsi 1 — "Pesan Paket" via WA, tanpa checkout otomatis) ───────
// Pesan WA WAJIB membawa identitas paket: package_id, nama, versi, harga —
// admin tidak boleh menebak paket apa yang dipesan. Nomor WA diambil live dari
// rotasi runtime (system_config), BUKAN nilai build-time.
const formatIdr = (n: number) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
export const buildOrderCta = (pkg: any) => {
  const wa = getWaContact().primary;
  const message =
    `Halo Gustafta, saya ingin memesan paket berikut:\n` +
    `\u2022 Paket: ${pkg.name}\n` +
    `\u2022 ID Paket: ${pkg.packageId}\n` +
    `\u2022 Versi: v${pkg.version}\n` +
    `\u2022 Harga: ${formatIdr(pkg.price)} / ${pkg.durationValue} ${pkg.durationUnit === "MONTH" ? "bulan" : pkg.durationUnit}\n` +
    `Nama saya: ___\n` +
    `Mohon info cara pembayarannya. Terima kasih.`;
  return {
    type: "wa_order" as const,
    label: "Pesan Paket",
    wa_number: wa,
    url: `https://wa.me/${wa}?text=${encodeURIComponent(message)}`,
    message,
    note: "Checkout otomatis belum tersedia; order diproses manual oleh admin. Pesan harus tetap memuat ID Paket & versi.",
  };
};

const publicPackage = (pkg: any, names: { solution: string; sector: string; tier: string }) => ({
  package_id: pkg.packageId,
  name: pkg.name,
  slug: pkg.slug,
  description: pkg.description ?? null,
  solution: names.solution,
  sector: names.sector,
  tier: names.tier,
  duration: pkg.durationValue,
  duration_unit: pkg.durationUnit,
  price: pkg.price,
  currency: pkg.currency,
  status: pkg.status,
  version: pkg.version,
  effective_from: pkg.effectiveFrom ?? null,
  effective_until: pkg.effectiveUntil ?? null,
  gaia_enabled: true,
  source: "GUSTAFTA",
  order_cta: buildOrderCta(pkg),
});

const publicPackageProduct = (pp: any) => ({
  product_id: pp.productRegistryId,
  product_name: pp.productName,
  product_type: pp.productType,
  access_level: pp.accessLevel,
  usage_limit: pp.usageLimit ?? null,
  is_required: !!pp.isRequired,
  sort_order: pp.sortOrder,
});

// ── Shared loaders ───────────────────────────────────────────────────────────
async function loadLookups() {
  return cached("lookups", async () => {
    const [sols, secs, tiers] = await Promise.all([
      db.select().from(solutionRegistry),
      db.select().from(sectorRegistry),
      db.select().from(tierRegistry),
    ]);
    return { sols, secs, tiers };
  });
}

async function loadPackagesWithComposition() {
  return cached("packages", async () => {
    const pkgs = await db.select().from(packageRegistry).orderBy(desc(packageRegistry.createdAt));
    const comps = await db.select({
      packageId: packageProducts.packageId,
      accessLevel: packageProducts.accessLevel,
      usageLimit: packageProducts.usageLimit,
      isRequired: packageProducts.isRequired,
      sortOrder: packageProducts.sortOrder,
      productName: productRegistry.name,
      productType: productRegistry.productType,
      productRegistryId: productRegistry.productId,
      productStatus: productRegistry.status,
      productVisibility: productRegistry.visibility,
    }).from(packageProducts)
      .innerJoin(productRegistry, eq(packageProducts.productId, productRegistry.id))
      .orderBy(asc(packageProducts.sortOrder));
    const byPkg = new Map<number, any[]>();
    for (const c of comps) {
      if (!byPkg.has(c.packageId)) byPkg.set(c.packageId, []);
      byPkg.get(c.packageId)!.push(c);
    }
    return pkgs.map(pkg => ({ pkg, composition: byPkg.get(pkg.id) || [] }));
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const paginate = (rows: any[], req: Request) => {
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  return {
    data: rows.slice((page - 1) * limit, page * limit),
    meta: { page, limit, total: rows.length },
  };
};
const ok = (res: Response, data: any, meta?: any) =>
  res.json(meta ? { success: true, data, meta } : { success: true, data });
const notFound = (res: Response, what = "Resource") =>
  res.status(404).json({ success: false, error: `${what} tidak ditemukan` });
const matchQ = (q: string, ...fields: (string | null | undefined)[]) =>
  fields.some(f => (f || "").toLowerCase().includes(q));

export function registerCatalogApiRoutes(app: Express, deps: {
  isAuthenticated: any;
  getDbRole: (req: any) => Promise<string>;
}) {
  // ── CORS untuk /api/v1/catalog — origins dari env, bukan wildcard permanen ─
  const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const allowed = (process.env.CATALOG_ALLOWED_ORIGINS || "")
      .split(",").map(s => s.trim()).filter(Boolean);
    const origin = req.headers.origin;
    if (origin && allowed.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    if (req.method === "OPTIONS") return res.status(204).end();
    next();
  };
  app.use("/api/v1/catalog", corsMiddleware);

  // ── PRODUCTS ────────────────────────────────────────────────────────────────
  app.get("/api/v1/catalog/products", async (req, res) => {
    try {
      const all = await cached("products", () => db.select().from(productRegistry).orderBy(asc(productRegistry.name)));
      let rows = all.filter(productEligible);
      const q = String(req.query.q || req.query.search || "").trim().toLowerCase();
      if (q) rows = rows.filter(p => matchQ(q, p.name, p.description, p.tagline));
      if (req.query.product_type) rows = rows.filter(p => p.productType === req.query.product_type);
      const { data, meta } = paginate(rows.map(publicProduct), req);
      ok(res, data, meta);
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  app.get("/api/v1/catalog/products/:id", async (req, res) => {
    try {
      const all = await cached("products", () => db.select().from(productRegistry).orderBy(asc(productRegistry.name)));
      const p = all.find(x => x.productId === req.params.id || x.slug === req.params.id);
      if (!p || !productEligible(p)) return notFound(res, "Product");
      ok(res, publicProduct(p));
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  // ── SOLUTIONS / SECTORS / TIERS (hanya ACTIVE) ─────────────────────────────
  app.get("/api/v1/catalog/solutions", async (req, res) => {
    try {
      const { sols } = await loadLookups();
      const { data, meta } = paginate(sols.filter(s => s.status === "ACTIVE").map(publicSimple), req);
      ok(res, data, meta);
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.get("/api/v1/catalog/solutions/:id", async (req, res) => {
    try {
      const { sols } = await loadLookups();
      const s = sols.find(x => String(x.id) === req.params.id || x.slug === req.params.id);
      if (!s || s.status !== "ACTIVE") return notFound(res, "Solution");
      ok(res, publicSimple(s));
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.get("/api/v1/catalog/sectors", async (req, res) => {
    try {
      const { secs } = await loadLookups();
      const { data, meta } = paginate(secs.filter(s => s.status === "ACTIVE").map(publicSimple), req);
      ok(res, data, meta);
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.get("/api/v1/catalog/tiers", async (req, res) => {
    try {
      const { tiers } = await loadLookups();
      const rows = tiers.filter(s => s.status === "ACTIVE")
        .sort((a: any, b: any) => (a.level || 0) - (b.level || 0)).map(publicSimple);
      const { data, meta } = paginate(rows, req);
      ok(res, data, meta);
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  // ── PACKAGES ────────────────────────────────────────────────────────────────
  const eligiblePackages = async () => {
    const [list, { sols, secs, tiers }] = await Promise.all([loadPackagesWithComposition(), loadLookups()]);
    const nameOf = (rows: any[], id: number) => rows.find(r => r.id === id)?.name || "";
    return list
      // Komposisi publik = hanya produk yang boleh terlihat; package yang
      // komposisi visible-nya kosong TIDAK eligible (tidak bocor sama sekali).
      .map(({ pkg, composition }) => ({ pkg, composition: composition.filter(compositionEntryVisible) }))
      .filter(({ pkg, composition }) => packageEligible(pkg, composition.length))
      .map(({ pkg, composition }) => ({
        pkg, composition,
        names: { solution: nameOf(sols, pkg.solutionId), sector: nameOf(secs, pkg.sectorId), tier: nameOf(tiers, pkg.tierId) },
      }));
  };

  app.get("/api/v1/catalog/packages", async (req, res) => {
    try {
      let rows = await eligiblePackages();
      const fEq = (v: any, s: string) => String(v).toLowerCase() === s.toLowerCase();
      const q = req.query as Record<string, string>;
      if (q.solution) rows = rows.filter(r => fEq(r.names.solution, q.solution));
      if (q.sector) rows = rows.filter(r => fEq(r.names.sector, q.sector));
      if (q.tier) rows = rows.filter(r => fEq(r.names.tier, q.tier));
      if (q.duration) rows = rows.filter(r => r.pkg.durationValue === parseInt(q.duration, 10));
      const search = (q.q || q.search || "").trim().toLowerCase();
      if (search) rows = rows.filter(r => matchQ(search, r.pkg.name, r.pkg.description, r.names.solution, r.names.sector));
      const { data, meta } = paginate(rows.map(r => publicPackage(r.pkg, r.names)), req);
      ok(res, data, meta);
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  const findEligiblePackage = async (idOrSlug: string) => {
    const rows = await eligiblePackages();
    return rows.find(r => r.pkg.packageId === idOrSlug || r.pkg.slug === idOrSlug);
  };

  app.get("/api/v1/catalog/packages/:id", async (req, res) => {
    try {
      const r = await findEligiblePackage(req.params.id);
      if (!r) return notFound(res, "Package");
      ok(res, { ...publicPackage(r.pkg, r.names), products: r.composition.map(publicPackageProduct) });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  app.get("/api/v1/catalog/packages/:id/products", async (req, res) => {
    try {
      const r = await findEligiblePackage(req.params.id);
      if (!r) return notFound(res, "Package");
      ok(res, r.composition.map(publicPackageProduct));
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  // Versi ACTIVE yang berlaku — konsisten dengan snapshot (order lama pegang versinya sendiri).
  app.get("/api/v1/catalog/packages/:id/version", async (req, res) => {
    try {
      const r = await findEligiblePackage(req.params.id);
      if (!r) return notFound(res, "Package");
      const [snap] = await db.select().from(packageVersionSnapshots)
        .where(eq(packageVersionSnapshots.packageDbId, r.pkg.id))
        .orderBy(desc(packageVersionSnapshots.version)).limit(1);
      ok(res, {
        package_id: r.pkg.packageId,
        current_version: r.pkg.version,
        snapshot_version: snap?.version ?? null,
        snapshot_created_at: snap?.createdAt ?? null,
        price: snap?.price ?? r.pkg.price,
        duration: snap?.durationValue ?? r.pkg.durationValue,
        duration_unit: snap?.durationUnit ?? r.pkg.durationUnit,
        products: snap
          ? await (async () => {
              // Snapshot tidak menyimpan status/visibility produk — filter
              // terhadap product_registry SAAT INI agar aturan visibilitas
              // publik tetap berlaku pada komposisi historis.
              const all = await cached("products", () => db.select().from(productRegistry).orderBy(asc(productRegistry.name)));
              return (snap.composition as any[])
                .filter((c: any) => {
                  const p = all.find(x => x.productId === c.productRegistryId);
                  return p && p.status === "ACTIVE" && p.visibility !== "INTERNAL_ONLY";
                })
                .map((c: any) => ({
                  product_id: c.productRegistryId, product_name: c.productName,
                  access_level: c.accessLevel, usage_limit: c.usageLimit ?? null,
                  is_required: !!c.isRequired, sort_order: c.sortOrder,
                }));
            })()
          : r.composition.map(publicPackageProduct),
      });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  // ── ADMIN: GAIA PREVIEW (guard admin existing; preview, bukan editor) ──────
  const { isAuthenticated, getDbRole } = deps;
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || "";
      const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map((s: string) => s.trim()).filter(Boolean);
      const role = await getDbRole(req);
      if (role === "admin" || role === "superadmin" || adminIds.includes(String(userId))) return next();
      return res.status(403).json({ error: "Akses ditolak. Hanya admin." });
    } catch { return res.status(403).json({ error: "Akses ditolak." }); }
  };

  app.get("/api/admin/registry/gaia-preview", isAuthenticated, requireAdmin, async (_req: any, res) => {
    try {
      const [products, list, { sols, secs, tiers }] = await Promise.all([
        db.select().from(productRegistry).orderBy(asc(productRegistry.name)),
        loadPackagesWithComposition(), loadLookups(),
      ]);
      const nameOf = (rows: any[], id: number) => rows.find(r => r.id === id)?.name || "";
      ok(res, {
        products: products.map(p => ({
          productId: p.productId, name: p.name, status: p.status,
          gaiaEnabled: !!p.gaiaEnabled, visibility: p.visibility,
          eligible: productEligible(p),
          reasons: [
            p.status !== "ACTIVE" && `status ${p.status}`,
            !p.gaiaEnabled && "gaia_enabled = false",
            p.visibility === "INTERNAL_ONLY" && "visibility INTERNAL_ONLY",
          ].filter(Boolean),
        })),
        packages: list.map(({ pkg, composition }) => {
          // Parity dengan public catalog: eligibility dihitung dari komposisi
          // yang boleh tampil publik, bukan komposisi mentah.
          const visible = composition.filter(compositionEntryVisible);
          const hidden = composition.length - visible.length;
          return {
            packageId: pkg.packageId, name: pkg.name, status: pkg.status,
            gaiaEnabled: !!pkg.gaiaEnabled, version: pkg.version,
            solution: nameOf(sols, pkg.solutionId), sector: nameOf(secs, pkg.sectorId), tier: nameOf(tiers, pkg.tierId),
            duration: `${pkg.durationValue} ${pkg.durationUnit}`, price: pkg.price,
            includedProducts: visible.map(publicPackageProduct),
            orderCta: buildOrderCta(pkg),
            eligible: packageEligible(pkg, visible.length),
            reasons: [
              pkg.status !== "ACTIVE" && `status ${pkg.status}`,
              !pkg.gaiaEnabled && "gaia_enabled = false",
              !(pkg.price > 0) && "harga 0",
              composition.length === 0 && "belum ada produk",
              composition.length > 0 && visible.length === 0 && "semua produk tersembunyi (non-ACTIVE / INTERNAL_ONLY)",
              hidden > 0 && visible.length > 0 && `${hidden} produk disembunyikan dari publik`,
            ].filter(Boolean),
          };
        }),
      });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });
}
