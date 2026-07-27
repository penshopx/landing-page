/**
 * bootstrap-handler.ts
 *
 * Extracted single-use bootstrap handler for POST /api/admin/bootstrap-superadmin.
 * Accepting the DB adapter as an argument makes the handler unit-testable without
 * spinning up the full server or touching a real Postgres instance.
 *
 * Usage in routes.ts:
 *   import { makeBootstrapHandler } from "./lib/bootstrap-handler";
 *   app.post("/api/admin/bootstrap-superadmin", makeBootstrapHandler(db));
 *
 * Usage in tests:
 *   import { makeBootstrapHandler } from "../server/lib/bootstrap-handler";
 *   app.post("/api/admin/bootstrap-superadmin", makeBootstrapHandler(fakeDb));
 */

export interface BootstrapDb {
  /** Return up to 1 existing superadmin row (just the id). */
  findSuperadmin(): Promise<Array<{ id: string | number }>>;
  /** Promote the user with the given lower-cased email. Returns promoted row or []. */
  promoteToSuperadmin(email: string): Promise<Array<{ id: string | number; email: string; role: string }>>;
}

export function makeBootstrapHandler(db: BootstrapDb) {
  return async function bootstrapSuperadminHandler(req: any, res: any): Promise<void> {
    try {
      const expectedRaw = process.env.BOOTSTRAP_ADMIN_TOKEN;
      if (!expectedRaw) {
        res.status(503).json({ error: "BOOTSTRAP_ADMIN_TOKEN belum dikonfigurasi di server" });
        return;
      }
      const expected = expectedRaw.trim();
      const providedRaw: string = req.header("x-bootstrap-token") || "";
      const provided = providedRaw.trim();
      if (!provided || provided !== expected) {
        res.status(401).json({ error: "Token tidak valid" });
        return;
      }

      // Guard: reject if a superadmin already exists — token must be single-use.
      const existingSuperadmins = await db.findSuperadmin();
      if (existingSuperadmins.length > 0) {
        console.warn(
          "[bootstrap-superadmin] Blocked reuse attempt — superadmin already exists (id=%s)",
          existingSuperadmins[0].id,
        );
        res.status(403).json({ error: "Superadmin sudah ada. Endpoint ini hanya boleh digunakan sekali." });
        return;
      }

      const email = String((req.body?.email || "")).trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: "Email tidak valid" });
        return;
      }

      const result = await db.promoteToSuperadmin(email);
      if (result.length === 0) {
        res.status(404).json({
          error: `User dengan email ${email} tidak ditemukan. Pastikan sudah registrasi terlebih dahulu.`,
        });
        return;
      }

      console.log(`[bootstrap-superadmin] Promoted ${email} to superadmin`);
      res.json({
        success: true,
        promoted: result[0],
        message: `${email} sekarang superadmin. Logout & login ulang.`,
      });
    } catch (err: any) {
      console.error("[bootstrap-superadmin] error:", err);
      res.status(500).json({ error: err.message });
    }
  };
}

/**
 * Drizzle adapter — the real production implementation used in routes.ts.
 * Kept here so the import stays co-located with the handler; routes.ts just
 * calls makeBootstrapHandler(makeBootstrapDrizzleDb(db)).
 */
export function makeBootstrapDrizzleDb(drizzleDb: any): BootstrapDb {
  return {
    async findSuperadmin() {
      const { users: usersTable } = await import("@shared/models/auth");
      const { eq } = await import("drizzle-orm");
      return drizzleDb
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.role, "superadmin"))
        .limit(1);
    },
    async promoteToSuperadmin(email: string) {
      const { users: usersTable } = await import("@shared/models/auth");
      const { eq, sql: sqlOp } = await import("drizzle-orm");
      return drizzleDb
        .update(usersTable)
        .set({ role: "superadmin" })
        .where(eq(sqlOp`LOWER(${usersTable.email})`, email))
        .returning({ id: usersTable.id, email: usersTable.email, role: usersTable.role });
    },
  };
}
