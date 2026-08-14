// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT REGISTRY + GAIA PUBLISHING SYSTEM (V1: Export Bundle → GAIA Import)
//
// Prinsip: GUSTAFTA = MASTER, GAIA = published commerce view.
// - Semua create/edit/version/archive dilakukan di sini (admin-only).
// - Product ID (GST-XXX-NNN) PERMANEN — tidak pernah berubah.
// - Publish V1 = download "GAIA PRODUCT BUNDLE v1" (zip: manifest.json,
//   product.json, pricing.json, access.json, assets/).
// - KEAMANAN: payload GAIA dibangun dari WHITELIST field (buildGaiaPayload) —
//   tidak pernah men-serialize object database utuh; tidak ada secret/prompt/
//   kredensial yang bisa ikut karena field-nya memang tidak pernah dibaca.
// - Arsitektur siap V2 (publish via API) tanpa perombakan: payload & validasi
//   sudah terpisah dari transport (export zip hanyalah salah satu transport).
// ─────────────────────────────────────────────────────────────────────────────
import type { Express } from "express";
import { createHash } from "crypto";
import JSZip from "jszip";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { productRegistry, gaiaExportHistory, type ProductRegistryRow } from "@shared/schema";

// ── Konstanta domain ─────────────────────────────────────────────────────────
export const PRODUCT_TYPES = [
  // Set awal (GAIA Publishing V1)
  "AI_SPECIALIST", "MINI_APP", "DOCUMENT_TOOL", "KNOWLEDGE", "BUSINESS_KIT", "PRODUCTIVITY_TOOL",
  // Phase 1: Solution Package Engine — tipe diperluas
  "AI_WORKSPACE", "DIGITAL_WORKSPACE", "DOCUMENT_AI", "DIGITAL_TOOL", "GENERATOR",
  "ASSESSMENT", "KNOWLEDGE_PRODUCT", "EBOOK", "MODULE", "TEMPLATE", "CHECKLIST",
  "E_COURSE", "DIGITAL_CONSULTATION", "OTHER_DIGITAL_PRODUCT",
] as const;

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED", "DEPRECATED"] as const;
export const PRODUCT_VISIBILITIES = [
  "INCLUDED_ONLY", "STANDALONE_ONLY", "INCLUDED_AND_STANDALONE", "INTERNAL_ONLY", "DP_ONLY",
] as const;
export const USAGE_PROFILE_KEYS = [
  "AI_CHAT", "DOCUMENT_ANALYSIS", "DOCUMENT_GENERATION", "KNOWLEDGE_PROCESSING", "AGENT_EXECUTION", "STORAGE",
] as const;
export const GAIA_STATUSES = ["NOT_READY", "READY", "PUBLISHED", "UPDATE_AVAILABLE"] as const;
export const BILLING_TYPES = ["FREE", "ONE_TIME", "MONTHLY", "LICENSE_PLUS_MONTHLY"] as const;

const BUNDLE_FORMAT = "GAIA PRODUCT BUNDLE v1";
const PAYLOAD_FORMAT = "GAIA PRODUCT PAYLOAD v1";

// Field yang boleh di-edit lewat PATCH. product_id & createdAt TIDAK ada di sini.
const EDITABLE_FIELDS = [
  "name", "slug", "productType", "category", "subcategory",
  "shortDescription", "longDescription", "targetUsers",
  "features", "benefits", "thumbnail", "gallery",
  "demoUrl", "productUrl",
  "price", "currency", "billingType",
  "status", "engineType", "accessType", "accessUrl",
  "gaiaEnabled", "gaiaFeatured",
  // Phase 1: Solution Package Engine
  "visibility", "standaloneEnabled", "subscriptionEnabled", "dpEnabled", "aiEnabled",
  "usageProfile", "storageProfile",
] as const;

// ── Product ID generator: GST-<PREFIX>-NNN, permanen ────────────────────────
function categoryPrefix(category: string): string {
  const clean = (category || "GEN").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (clean.slice(0, 4) || "GEN");
}

async function generateProductId(category: string): Promise<string> {
  const prefix = `GST-${categoryPrefix(category)}-`;
  const rows = await db.select({ productId: productRegistry.productId })
    .from(productRegistry)
    .where(sql`${productRegistry.productId} LIKE ${prefix + "%"}`);
  let max = 0;
  for (const r of rows) {
    const n = parseInt(r.productId.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

// ── Validasi sebelum publish/export ─────────────────────────────────────────
export function validateForPublish(p: ProductRegistryRow): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!p.productId) missing.push("product_id");
  if (!p.name?.trim()) missing.push("name");
  if (!p.slug?.trim()) missing.push("slug");
  if (!(PRODUCT_TYPES as readonly string[]).includes(p.productType)) missing.push("product_type");
  if (!p.category?.trim()) missing.push("category");
  if (!p.shortDescription?.trim() && !p.longDescription?.trim()) missing.push("description");
  // price: 0 sah HANYA jika billing FREE
  if (p.billingType !== "FREE" && (!Number.isFinite(p.price) || p.price <= 0)) missing.push("price (atau set billing_type FREE)");
  if (!(BILLING_TYPES as readonly string[]).includes(p.billingType)) missing.push("billing_type");
  if (p.status !== "ACTIVE") missing.push("status (harus ACTIVE untuk publish)");
  if (!/^\d+\.\d+\.\d+$/.test(p.version || "")) missing.push("version (semver x.y.z)");
  return { ok: missing.length === 0, missing };
}

// ── GAIA PRODUCT PAYLOAD v1 — WHITELIST ONLY ────────────────────────────────
export function buildGaiaPayload(p: ProductRegistryRow) {
  return {
    payload_format: PAYLOAD_FORMAT,
    product_id: p.productId,
    product_version: p.version,
    name: p.name,
    slug: p.slug,
    product_type: p.productType,
    category: p.category,
    subcategory: p.subcategory || null,
    short_description: p.shortDescription || null,
    long_description: p.longDescription || null,
    target_users: p.targetUsers || null,
    features: Array.isArray(p.features) ? p.features : [],
    benefits: Array.isArray(p.benefits) ? p.benefits : [],
    thumbnail: p.thumbnail || null,
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    demo_url: p.demoUrl || null,
    price: p.price,
    currency: p.currency,
    billing_type: p.billingType,
    status: p.status,
    access_type: p.accessType || null,
    access_url: p.accessUrl || null,
    engine_type: p.engineType || null,
    source: "GUSTAFTA" as const,
  };
}

export async function buildBundleZip(p: ProductRegistryRow): Promise<{ buffer: Buffer; checksum: string }> {
  const payload = buildGaiaPayload(p);
  const zip = new JSZip();
  const now = new Date().toISOString();
  zip.file("manifest.json", JSON.stringify({
    bundle_format: BUNDLE_FORMAT,
    product_id: p.productId,
    product_version: p.version,
    exported_at: now,
    source: "GUSTAFTA",
    files: ["product.json", "pricing.json", "access.json", "assets/assets.json"],
  }, null, 2));
  zip.file("product.json", JSON.stringify(payload, null, 2));
  zip.file("pricing.json", JSON.stringify({
    product_id: p.productId,
    price: p.price,
    currency: p.currency,
    billing_type: p.billingType,
  }, null, 2));
  zip.file("access.json", JSON.stringify({
    product_id: p.productId,
    access_type: p.accessType || null,
    access_url: p.accessUrl || null,
    demo_url: p.demoUrl || null,
    engine_type: p.engineType || null,
    note: "Engine tetap di Gustafta. GAIA hanya menerima access reference.",
  }, null, 2));
  // Assets sebagai reference URL (V1) — bukan copy binary.
  zip.folder("assets")!.file("assets.json", JSON.stringify({
    thumbnail: p.thumbnail || null,
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
  }, null, 2));
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const checksum = createHash("sha256").update(buffer).digest("hex");
  return { buffer, checksum };
}

function bumpVersion(v: string, level: "major" | "minor" | "patch"): string {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v || "1.0.0");
  const [maj, min, pat] = m ? [+m[1], +m[2], +m[3]] : [1, 0, 0];
  if (level === "major") return `${maj + 1}.0.0`;
  if (level === "minor") return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

function sanitizePatch(body: any): Partial<ProductRegistryRow> {
  const out: any = {};
  for (const k of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body || {}, k)) out[k] = body[k];
  }
  if (out.productType && !(PRODUCT_TYPES as readonly string[]).includes(out.productType)) delete out.productType;
  if (out.status && !(PRODUCT_STATUSES as readonly string[]).includes(out.status)) delete out.status;
  if (out.billingType && !(BILLING_TYPES as readonly string[]).includes(out.billingType)) delete out.billingType;
  if (out.price !== undefined) out.price = Math.max(0, parseInt(out.price, 10) || 0);
  for (const k of ["features", "benefits", "gallery", "usageProfile"]) {
    if (out[k] !== undefined && !Array.isArray(out[k])) delete out[k];
  }
  if (out.visibility && !(PRODUCT_VISIBILITIES as readonly string[]).includes(out.visibility)) delete out.visibility;
  if (Array.isArray(out.usageProfile)) {
    out.usageProfile = out.usageProfile.filter((u: string) => (USAGE_PROFILE_KEYS as readonly string[]).includes(u));
  }
  for (const k of ["standaloneEnabled", "subscriptionEnabled", "dpEnabled", "aiEnabled", "gaiaEnabled", "gaiaFeatured"]) {
    if (out[k] !== undefined) out[k] = Boolean(out[k]);
  }
  return out;
}

// gaiaStatus turunan setelah perubahan data
function deriveGaiaStatus(p: ProductRegistryRow): string {
  const valid = validateForPublish(p).ok;
  if (p.lastPublishedVersion) {
    return p.lastPublishedVersion === p.version && valid ? "PUBLISHED" : "UPDATE_AVAILABLE";
  }
  return valid ? "READY" : "NOT_READY";
}

// ── Routes ───────────────────────────────────────────────────────────────────
export function registerGaiaRegistryRoutes(app: Express, deps: {
  isAuthenticated: any;
  getDbRole: (req: any) => Promise<string>;
}) {
  const { isAuthenticated, getDbRole } = deps;

  // Admin-only guard (role DB admin/superadmin atau ADMIN_USER_IDS)
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || "";
      const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map((s: string) => s.trim()).filter(Boolean);
      const role = await getDbRole(req);
      if (role === "admin" || role === "superadmin" || adminIds.includes(String(userId))) return next();
      return res.status(403).json({ error: "Akses ditolak. Hanya admin." });
    } catch {
      return res.status(403).json({ error: "Akses ditolak." });
    }
  };

  const guard = [isAuthenticated, requireAdmin];

  const getById = async (id: number) => {
    const [row] = await db.select().from(productRegistry).where(eq(productRegistry.id, id));
    return row;
  };

  const refreshGaiaStatus = async (row: ProductRegistryRow) => {
    const next = deriveGaiaStatus(row);
    if (next !== row.gaiaStatus) {
      const [updated] = await db.update(productRegistry)
        .set({ gaiaStatus: next, updatedAt: new Date() })
        .where(eq(productRegistry.id, row.id)).returning();
      return updated;
    }
    return row;
  };

  // LIST (filter: type, status, search)
  app.get("/api/admin/registry/products", ...guard, async (req: any, res) => {
    try {
      let rows = await db.select().from(productRegistry).orderBy(desc(productRegistry.createdAt));
      const { type, status, search } = req.query as Record<string, string>;
      if (type) rows = rows.filter(r => r.productType === type);
      if (status) rows = rows.filter(r => r.status === status);
      if (search) {
        const q = search.toLowerCase();
        rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.productId.toLowerCase().includes(q) || r.slug.includes(q));
      }
      res.json(rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // CREATE — product_id digenerate otomatis dan PERMANEN
  app.post("/api/admin/registry/products", ...guard, async (req: any, res) => {
    try {
      const patch = sanitizePatch(req.body);
      if (!patch.name || !patch.slug || !patch.productType || !patch.category) {
        return res.status(400).json({ error: "Wajib: name, slug, productType, category" });
      }
      delete (patch as any).status; // produk baru selalu DRAFT
      const productId = typeof req.body.productId === "string" && /^GST-[A-Z0-9]{2,6}-\d{3,}$/.test(req.body.productId)
        ? req.body.productId
        : await generateProductId(patch.category as string);
      const [row] = await db.insert(productRegistry)
        .values({ ...(patch as any), productId, status: "DRAFT", gaiaStatus: "NOT_READY" })
        .returning();
      res.status(201).json(row);
    } catch (err: any) {
      if (String(err.message).includes("unique") || String(err.code) === "23505") {
        return res.status(409).json({ error: "Slug atau Product ID sudah dipakai produk lain." });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // EDIT — product_id & version TIDAK bisa diubah dari sini
  app.patch("/api/admin/registry/products/:id", ...guard, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const patch = sanitizePatch(req.body);
      if (Object.keys(patch).length === 0) return res.status(400).json({ error: "Tidak ada field valid untuk diubah." });
      const [row] = await db.update(productRegistry)
        .set({ ...(patch as any), updatedAt: new Date() })
        .where(eq(productRegistry.id, id)).returning();
      if (!row) return res.status(404).json({ error: "Produk tidak ditemukan" });
      res.json(await refreshGaiaStatus(row));
    } catch (err: any) {
      if (String(err.code) === "23505") return res.status(409).json({ error: "Slug sudah dipakai produk lain." });
      res.status(500).json({ error: err.message });
    }
  });

  // DUPLICATE — product_id BARU, status DRAFT
  app.post("/api/admin/registry/products/:id/duplicate", ...guard, async (req: any, res) => {
    try {
      const src = await getById(parseInt(req.params.id));
      if (!src) return res.status(404).json({ error: "Produk tidak ditemukan" });
      const productId = await generateProductId(src.category);
      const { id, createdAt, updatedAt, lastPublishedAt, lastPublishedVersion, ...rest } = src as any;
      const [row] = await db.insert(productRegistry).values({
        ...rest,
        productId,
        name: `${src.name} (Copy)`,
        slug: `${src.slug}-copy-${Date.now().toString(36)}`,
        status: "DRAFT",
        version: "1.0.0",
        gaiaStatus: "NOT_READY",
        lastPublishedAt: null,
        lastPublishedVersion: null,
      }).returning();
      res.status(201).json(row);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ARCHIVE / RESTORE
  app.post("/api/admin/registry/products/:id/archive", ...guard, async (req: any, res) => {
    try {
      const [row] = await db.update(productRegistry)
        .set({ status: "ARCHIVED", gaiaEnabled: false, updatedAt: new Date() })
        .where(eq(productRegistry.id, parseInt(req.params.id))).returning();
      if (!row) return res.status(404).json({ error: "Produk tidak ditemukan" });
      res.json(await refreshGaiaStatus(row));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/admin/registry/products/:id/restore", ...guard, async (req: any, res) => {
    try {
      const [row] = await db.update(productRegistry)
        .set({ status: "DRAFT", updatedAt: new Date() })
        .where(and(eq(productRegistry.id, parseInt(req.params.id)), eq(productRegistry.status, "ARCHIVED"))).returning();
      if (!row) return res.status(404).json({ error: "Produk tidak ditemukan / bukan ARCHIVED" });
      res.json(await refreshGaiaStatus(row));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // CREATE NEW VERSION — product_id tetap, versi naik semver
  app.post("/api/admin/registry/products/:id/version", ...guard, async (req: any, res) => {
    try {
      const level = ["major", "minor", "patch"].includes(req.body?.level) ? req.body.level : "minor";
      const src = await getById(parseInt(req.params.id));
      if (!src) return res.status(404).json({ error: "Produk tidak ditemukan" });
      const [row] = await db.update(productRegistry)
        .set({ version: bumpVersion(src.version, level), updatedAt: new Date() })
        .where(eq(productRegistry.id, src.id)).returning();
      res.json(await refreshGaiaStatus(row));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // VALIDATE
  app.get("/api/admin/registry/products/:id/validate", ...guard, async (req: any, res) => {
    try {
      const row = await getById(parseInt(req.params.id));
      if (!row) return res.status(404).json({ error: "Produk tidak ditemukan" });
      const v = validateForPublish(row);
      res.json({ productId: row.productId, version: row.version, valid: v.ok, missing: v.missing });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // PREVIEW payload (whitelist) tanpa publish
  app.get("/api/admin/registry/products/:id/payload", ...guard, async (req: any, res) => {
    try {
      const row = await getById(parseInt(req.params.id));
      if (!row) return res.status(404).json({ error: "Produk tidak ditemukan" });
      res.json(buildGaiaPayload(row));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // PUBLISH TO GAIA (V1) — validasi → bundle zip → history → download
  app.post("/api/admin/registry/products/:id/publish", ...guard, async (req: any, res) => {
    try {
      const row = await getById(parseInt(req.params.id));
      if (!row) return res.status(404).json({ error: "Produk tidak ditemukan" });
      const v = validateForPublish(row);
      if (!v.ok) {
        await db.insert(gaiaExportHistory).values({
          productId: row.productId, productVersion: row.version,
          bundleVersion: BUNDLE_FORMAT, exportStatus: "FAILED",
          detail: { missing: v.missing },
        });
        return res.status(422).json({ error: "Produk belum lengkap untuk publish.", missing: v.missing });
      }
      const { buffer, checksum } = await buildBundleZip(row);
      await db.insert(gaiaExportHistory).values({
        productId: row.productId, productVersion: row.version,
        bundleVersion: BUNDLE_FORMAT, exportStatus: "SUCCESS", checksum,
      });
      await db.update(productRegistry).set({
        gaiaStatus: "PUBLISHED", gaiaEnabled: true,
        lastPublishedAt: new Date(), lastPublishedVersion: row.version,
        updatedAt: new Date(),
      }).where(eq(productRegistry.id, row.id));
      const fname = `${row.slug || row.productId}-${row.version}-gaia-bundle.zip`;
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
      res.send(buffer);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── IMPORT FROM STORE ──────────────────────────────────────────────────────
  // Whitelist mapping dari item katalog Store → draft Registry. TIDAK pernah
  // membaca prompt/secret/kredensial — sumber datanya adalah item katalog publik
  // (buildStoreCatalogItems) yang memang sudah whitelist-only.
  const STORE_IMPORT_TYPE = "AI_SPECIALIST";

  function slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "produk";
  }

  function mapStoreItemToDraft(item: any) {
    const price = Math.max(0, parseInt(item.price, 10) || 0);
    const shortDescription = (item.tagline || item.description || "").slice(0, 300) || null;
    return {
      name: String(item.name || "").trim(),
      slug: slugify(String(item.name || "")),
      productType: STORE_IMPORT_TYPE,
      category: String(item.category || "GENERAL"),
      shortDescription,
      longDescription: item.productSummary || item.description || null,
      features: Array.isArray(item.productFeatures) ? item.productFeatures.filter((f: any) => typeof f === "string") : [],
      price,
      currency: "IDR",
      billingType: price > 0 ? "ONE_TIME" : "FREE",
      engineType: item.agentId != null ? "GUSTAFTA_AGENT" : null,
      accessType: "LOGIN_GUSTAFTA",
      accessUrl: item.agentId != null ? `/chat/${item.agentId}` : "/store",
      productUrl: item.paymentUrl || null,
      status: "DRAFT",
      gaiaStatus: "NOT_READY",
    };
  }

  // Daftar item katalog Store untuk picker (metadata whitelist saja)
  app.get("/api/admin/registry/store-catalog", ...guard, async (req: any, res) => {
    try {
      const { getStoreCatalogItems } = await import("./routes");
      const search = typeof req.query.search === "string" ? req.query.search : "";
      const items = await getStoreCatalogItems("Semua", search);
      res.json(items.map((it: any) => ({
        id: it.id,
        agentId: it.agentId ?? null,
        name: it.name,
        category: it.category,
        tagline: it.tagline || "",
        price: it.price,
        type: it.type,
        emoji: it.emoji || "🤖",
      })));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // Buat DRAFT Registry product dari item katalog Store (satu klik)
  app.post("/api/admin/registry/products/import-from-store", ...guard, async (req: any, res) => {
    try {
      const sourceId = String(req.body?.sourceId || "");
      if (!sourceId) return res.status(400).json({ error: "sourceId wajib diisi." });
      const { getStoreCatalogItems } = await import("./routes");
      const items = await getStoreCatalogItems("Semua", "");
      const item = items.find((it: any) => it.id === sourceId);
      if (!item) return res.status(404).json({ error: "Item katalog Store tidak ditemukan." });
      const draft = mapStoreItemToDraft(item);
      if (!draft.name) return res.status(422).json({ error: "Item katalog tidak punya nama." });

      // Slug unik: kalau tabrakan, tambahkan suffix pendek alih-alih gagal.
      const [existing] = await db.select({ id: productRegistry.id })
        .from(productRegistry).where(eq(productRegistry.slug, draft.slug));
      if (existing) draft.slug = `${draft.slug}-${Date.now().toString(36)}`.slice(0, 90);

      const productId = await generateProductId(draft.category);
      const [row] = await db.insert(productRegistry)
        .values({ ...(draft as any), productId })
        .returning();
      res.status(201).json(row);
    } catch (err: any) {
      if (String(err.code) === "23505") return res.status(409).json({ error: "Slug atau Product ID sudah dipakai produk lain." });
      res.status(500).json({ error: err.message });
    }
  });

  // EXPORT HISTORY
  app.get("/api/admin/registry/export-history", ...guard, async (req: any, res) => {
    try {
      const rows = await db.select().from(gaiaExportHistory).orderBy(desc(gaiaExportHistory.exportedAt)).limit(200);
      res.json(rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });
}
