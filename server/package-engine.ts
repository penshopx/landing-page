// ─────────────────────────────────────────────────────────────────────────────
// SOLUTION PACKAGE ENGINE — Phase 1
//
// Model komersial: PACKAGE = SOLUTION × SECTOR × TIER × DURATION.
// Tidak ada "generic unlimited subscription".
//
// - Solution / Sector / Tier Registry: CRUD admin (soft archive, tanpa delete).
// - Package Registry: package_id permanen (mis. SBU-KONSTRUKSI-PRO), versioned.
// - Package Products (m2m) = ACCESS MATRIX source of truth
//   (access_level FULL/LIMITED/VIEW_ONLY + usage_limit).
// - Versioning: mengubah komposisi/harga package ACTIVE menaikkan version;
//   order/subscription masa depan mengacu (package_id + version) — package lama
//   yang sudah dibeli tidak diubah retroaktif.
// - GAIA BELUM diintegrasikan (hanya flag gaia_enabled untuk kesiapan).
// - Backward compatible: tidak menyentuh subscriptions/billing existing.
// ─────────────────────────────────────────────────────────────────────────────
import type { Express } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "./db";
import {
  solutionRegistry, sectorRegistry, tierRegistry,
  packageRegistry, packageProducts, productRegistry,
  packageVersionSnapshots,
} from "@shared/schema";

const PKG_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] as const;
const ACCESS_LEVELS = ["FULL", "LIMITED", "VIEW_ONLY"] as const;
const DURATION_UNITS = ["MONTH", "YEAR"] as const;
const DURATION_VALUES = [1, 3, 6, 12];

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function registerPackageEngineRoutes(app: Express, deps: {
  isAuthenticated: any;
  getDbRole: (req: any) => Promise<string>;
}) {
  const { isAuthenticated, getDbRole } = deps;

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

  // ── CRUD generik untuk Solution / Sector / Tier ────────────────────────────
  const simpleRegistries = [
    { path: "solutions", table: solutionRegistry, hasLevel: false },
    { path: "sectors", table: sectorRegistry, hasLevel: false },
    { path: "tiers", table: tierRegistry, hasLevel: true },
  ] as const;

  for (const regDef of simpleRegistries) {
    const { path, table, hasLevel } = regDef as any;

    app.get(`/api/admin/registry/${path}`, ...guard, async (_req: any, res: any) => {
      try {
        const rows = await db.select().from(table).orderBy(hasLevel ? asc((table as any).level) : asc((table as any).name));
        res.json(rows);
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });

    app.post(`/api/admin/registry/${path}`, ...guard, async (req: any, res: any) => {
      try {
        const { name, description } = req.body || {};
        if (!name?.trim()) return res.status(400).json({ error: "Nama wajib diisi" });
        const values: any = { name: name.trim(), slug: slugify(req.body.slug || name), description: description || null };
        if (hasLevel) values.level = parseInt(req.body.level, 10) || 1;
        const [row] = await db.insert(table).values(values).returning();
        res.status(201).json(row);
      } catch (err: any) {
        if (String(err.code) === "23505") return res.status(409).json({ error: "Slug sudah dipakai." });
        res.status(500).json({ error: err.message });
      }
    });

    app.patch(`/api/admin/registry/${path}/:id`, ...guard, async (req: any, res: any) => {
      try {
        const patch: any = {};
        if (req.body.name?.trim()) patch.name = req.body.name.trim();
        if (req.body.description !== undefined) patch.description = req.body.description;
        if (["ACTIVE", "INACTIVE", "ARCHIVED"].includes(req.body.status)) patch.status = req.body.status;
        if (hasLevel && req.body.level !== undefined) patch.level = parseInt(req.body.level, 10) || 1;
        if (Object.keys(patch).length === 0) return res.status(400).json({ error: "Tidak ada field valid." });
        patch.updatedAt = new Date();
        const [row] = await db.update(table).set(patch).where(eq((table as any).id, parseInt(req.params.id))).returning();
        if (!row) return res.status(404).json({ error: "Tidak ditemukan" });
        res.json(row);
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });
  }

  // ── Package Registry ────────────────────────────────────────────────────────
  const loadPackage = async (id: number) => {
    const [pkg] = await db.select().from(packageRegistry).where(eq(packageRegistry.id, id));
    return pkg;
  };

  const packageWithComposition = async (pkg: any) => {
    const items = await db.select({
      id: packageProducts.id,
      productId: packageProducts.productId,
      accessLevel: packageProducts.accessLevel,
      usageLimit: packageProducts.usageLimit,
      isRequired: packageProducts.isRequired,
      sortOrder: packageProducts.sortOrder,
      productName: productRegistry.name,
      productSlug: productRegistry.slug,
      productType: productRegistry.productType,
      productRegistryId: productRegistry.productId,
    }).from(packageProducts)
      .innerJoin(productRegistry, eq(packageProducts.productId, productRegistry.id))
      .where(eq(packageProducts.packageId, pkg.id))
      .orderBy(asc(packageProducts.sortOrder));
    return { ...pkg, products: items };
  };

  // ── Versioning dengan snapshot immutable ──────────────────────────────────
  // Setiap versi yang pernah "live" disimpan utuh (harga+durasi+komposisi) di
  // package_version_snapshots. Order/subscription masa depan resolve dari
  // snapshot (package_id + version), BUKAN dari row mutable — customer lama
  // tidak terdampak perubahan package.
  const readComposition = async (tx: any, pkgDbId: number) => {
    const items = await tx.select({
      productId: packageProducts.productId,
      accessLevel: packageProducts.accessLevel,
      usageLimit: packageProducts.usageLimit,
      isRequired: packageProducts.isRequired,
      sortOrder: packageProducts.sortOrder,
      productName: productRegistry.name,
      productRegistryId: productRegistry.productId,
    }).from(packageProducts)
      .innerJoin(productRegistry, eq(packageProducts.productId, productRegistry.id))
      .where(eq(packageProducts.packageId, pkgDbId))
      .orderBy(asc(packageProducts.sortOrder));
    return items;
  };

  // Tulis snapshot untuk (pkg, version) — idempotent (unique index).
  const writeSnapshot = async (tx: any, pkg: any, version: number) => {
    const composition = await readComposition(tx, pkg.id);
    await tx.insert(packageVersionSnapshots).values({
      packageDbId: pkg.id, packageId: pkg.packageId, version,
      name: pkg.name, price: pkg.price, currency: pkg.currency,
      durationValue: pkg.durationValue, durationUnit: pkg.durationUnit,
      composition,
    }).onConflictDoNothing();
  };

  app.get("/api/admin/registry/packages", ...guard, async (_req: any, res) => {
    try {
      const pkgs = await db.select().from(packageRegistry).orderBy(desc(packageRegistry.createdAt));
      res.json(await Promise.all(pkgs.map(packageWithComposition)));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/admin/registry/packages", ...guard, async (req: any, res) => {
    try {
      const { solutionId, sectorId, tierId, name, description, durationValue, durationUnit, price } = req.body || {};
      const [sol] = await db.select().from(solutionRegistry).where(eq(solutionRegistry.id, parseInt(solutionId)));
      const [sec] = await db.select().from(sectorRegistry).where(eq(sectorRegistry.id, parseInt(sectorId)));
      const [tier] = await db.select().from(tierRegistry).where(eq(tierRegistry.id, parseInt(tierId)));
      if (!sol || !sec || !tier) return res.status(400).json({ error: "Solution, Sector, dan Tier wajib valid." });
      const dv = parseInt(durationValue, 10);
      if (!DURATION_VALUES.includes(dv)) return res.status(400).json({ error: "Durasi harus 1, 3, 6, atau 12." });
      const du = (DURATION_UNITS as readonly string[]).includes(durationUnit) ? durationUnit : "MONTH";
      const pkgIdBase = `${sol.slug}-${sec.slug}-${tier.slug}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
      const packageId = `${pkgIdBase}-${dv}${du === "YEAR" ? "Y" : "M"}`;
      const pkgName = name?.trim() || `Gustafta ${sol.name} — ${sec.name} ${tier.name} ${dv} ${du === "YEAR" ? "Tahun" : "Bulan"}`;
      const [row] = await db.insert(packageRegistry).values({
        packageId, solutionId: sol.id, sectorId: sec.id, tierId: tier.id,
        name: pkgName, slug: slugify(pkgName), description: description || null,
        status: "DRAFT", durationValue: dv, durationUnit: du,
        price: Math.max(0, parseInt(price, 10) || 0),
      }).returning();
      res.status(201).json(await packageWithComposition(row));
    } catch (err: any) {
      if (String(err.code) === "23505") return res.status(409).json({ error: "Package dengan kombinasi/slug ini sudah ada." });
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/admin/registry/packages/:id", ...guard, async (req: any, res) => {
    try {
      const pkg = await loadPackage(parseInt(req.params.id));
      if (!pkg) return res.status(404).json({ error: "Package tidak ditemukan" });
      const patch: any = {};
      if (req.body.name?.trim()) patch.name = req.body.name.trim();
      if (req.body.description !== undefined) patch.description = req.body.description;
      if ((PKG_STATUSES as readonly string[]).includes(req.body.status)) patch.status = req.body.status;
      if (req.body.price !== undefined) patch.price = Math.max(0, parseInt(req.body.price, 10) || 0);
      if (req.body.gaiaEnabled !== undefined) patch.gaiaEnabled = Boolean(req.body.gaiaEnabled);
      if (req.body.durationValue !== undefined) {
        const dv = parseInt(req.body.durationValue, 10);
        if (!DURATION_VALUES.includes(dv)) return res.status(400).json({ error: "Durasi harus 1, 3, 6, atau 12." });
        patch.durationValue = dv;
      }
      if (Object.keys(patch).length === 0) return res.status(400).json({ error: "Tidak ada field valid." });
      // Publish check: package hanya bisa ACTIVE jika punya minimal 1 produk & harga > 0
      if (patch.status === "ACTIVE") {
        const items = await db.select().from(packageProducts).where(eq(packageProducts.packageId, pkg.id));
        const price = patch.price ?? pkg.price;
        const missing: string[] = [];
        if (items.length === 0) missing.push("minimal 1 produk dalam package");
        if (!(price > 0)) missing.push("harga harus > 0");
        if (missing.length) return res.status(422).json({ error: "Package belum siap dipublish.", missing });
        if (!pkg.effectiveFrom) patch.effectiveFrom = new Date();
      }
      // Perubahan harga/durasi pada package live = versi baru (versi lama sudah ter-snapshot)
      const material = (patch.price !== undefined && patch.price !== pkg.price)
        || (patch.durationValue !== undefined && patch.durationValue !== pkg.durationValue);
      const isLive = pkg.status === "ACTIVE" || pkg.status === "PAUSED";
      if (material && isLive) patch.version = pkg.version + 1;
      patch.updatedAt = new Date();
      const row = await db.transaction(async (tx) => {
        const [updated] = await tx.update(packageRegistry).set(patch).where(eq(packageRegistry.id, pkg.id)).returning();
        // Snapshot state versi BARU (publish pertama atau versi hasil bump) — atomik.
        if (patch.status === "ACTIVE" || (material && isLive)) {
          await writeSnapshot(tx, updated, updated.version);
        }
        return updated;
      });
      res.json(await packageWithComposition(row));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // Komposisi: set/replace daftar produk package (Access Matrix)
  app.put("/api/admin/registry/packages/:id/products", ...guard, async (req: any, res) => {
    try {
      const pkg = await loadPackage(parseInt(req.params.id));
      if (!pkg) return res.status(404).json({ error: "Package tidak ditemukan" });
      const items = Array.isArray(req.body?.products) ? req.body.products : null;
      if (!items) return res.status(400).json({ error: "Body: { products: [{productId, accessLevel, usageLimit?, isRequired?, sortOrder?}] }" });
      const clean: any[] = [];
      for (const [i, it] of items.entries()) {
        const productId = parseInt(it.productId, 10);
        const [prod] = await db.select().from(productRegistry).where(eq(productRegistry.id, productId));
        if (!prod) return res.status(400).json({ error: `productId ${it.productId} tidak ada di Product Registry` });
        clean.push({
          packageId: pkg.id, productId,
          accessLevel: (ACCESS_LEVELS as readonly string[]).includes(it.accessLevel) ? it.accessLevel : "FULL",
          usageLimit: it.usageLimit != null ? Math.max(0, parseInt(it.usageLimit, 10) || 0) : null,
          isRequired: it.isRequired !== false,
          sortOrder: Number.isFinite(+it.sortOrder) ? +it.sortOrder : i,
        });
      }
      // Atomik: replace komposisi + bump versi + snapshot versi baru dalam SATU transaksi.
      const updated = await db.transaction(async (tx) => {
        await tx.delete(packageProducts).where(eq(packageProducts.packageId, pkg.id));
        if (clean.length) await tx.insert(packageProducts).values(clean);
        if (pkg.status === "ACTIVE" || pkg.status === "PAUSED") {
          const [bumped] = await tx.update(packageRegistry)
            .set({ version: pkg.version + 1, updatedAt: new Date() })
            .where(eq(packageRegistry.id, pkg.id)).returning();
          await writeSnapshot(tx, bumped, bumped.version);
          return bumped;
        }
        return pkg;
      });
      res.json(await packageWithComposition(updated));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // Riwayat versi (snapshot immutable) sebuah package
  app.get("/api/admin/registry/packages/:id/versions", ...guard, async (req: any, res) => {
    try {
      const pkg = await loadPackage(parseInt(req.params.id));
      if (!pkg) return res.status(404).json({ error: "Package tidak ditemukan" });
      const snaps = await db.select().from(packageVersionSnapshots)
        .where(eq(packageVersionSnapshots.packageDbId, pkg.id))
        .orderBy(desc(packageVersionSnapshots.version));
      res.json(snaps);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── ACCESS MATRIX — source of truth untuk provisioning masa depan ─────────
  // GET /api/admin/registry/access-matrix?solutionId=&sectorId=&tierId=
  app.get("/api/admin/registry/access-matrix", ...guard, async (req: any, res) => {
    try {
      const conds: any[] = [];
      const q = req.query as Record<string, string>;
      if (q.solutionId) conds.push(eq(packageRegistry.solutionId, parseInt(q.solutionId)));
      if (q.sectorId) conds.push(eq(packageRegistry.sectorId, parseInt(q.sectorId)));
      if (q.tierId) conds.push(eq(packageRegistry.tierId, parseInt(q.tierId)));
      const pkgs = conds.length
        ? await db.select().from(packageRegistry).where(and(...conds))
        : await db.select().from(packageRegistry);
      const [sols, secs, tiers] = await Promise.all([
        db.select().from(solutionRegistry), db.select().from(sectorRegistry), db.select().from(tierRegistry),
      ]);
      const nameOf = (rows: any[], id: number) => rows.find(r => r.id === id)?.name || `#${id}`;
      const matrix = await Promise.all(pkgs.map(async (pkg) => {
        const full = await packageWithComposition(pkg);
        return {
          packageId: pkg.packageId,
          version: pkg.version,
          status: pkg.status,
          solution: nameOf(sols, pkg.solutionId),
          sector: nameOf(secs, pkg.sectorId),
          tier: nameOf(tiers, pkg.tierId),
          duration: `${pkg.durationValue} ${pkg.durationUnit}`,
          price: pkg.price,
          access: full.products.map((p: any) => ({
            product: p.productName,
            productId: p.productRegistryId,
            level: p.accessLevel,
            usageLimit: p.usageLimit,
          })),
        };
      }));
      res.json(matrix);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });
}
