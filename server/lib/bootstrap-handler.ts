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

/**
 * Returns true when `token` is built by repeating a shorter prefix.
 * Works by trying every period length from 1 to floor(len/2): if every
 * character at position i equals the character at position (i % period),
 * the token is periodic and therefore trivially guessable.
 *
 * Examples that return true:
 *   "abcABC1!abcABC1!abcABC1!abcABC1!"  (period 8)
 *   "abcdefghijklabcdefghijklabcdefgh"  (period 12, partial final repeat)
 *   "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"  (period 1)
 */
function isRepeatedPattern(token: string): boolean {
  const len = token.length;
  for (let period = 1; period <= Math.floor(len / 2); period++) {
    let periodic = true;
    for (let i = period; i < len; i++) {
      if (token[i] !== token[i % period]) {
        periodic = false;
        break;
      }
    }
    if (periodic) return true;
  }
  return false;
}

/**
 * Returns a human-readable weakness description when a token is too weak, or
 * null when the token is acceptable.  Rules (applied to both the configured
 * env token and the caller-supplied header token):
 *
 *   1. Minimum 32 characters — appropriate for a randomly generated secret.
 *      Short tokens are trivially brute-forced.
 *   2. At least 12 unique distinct characters.
 *      Rejects all-digit tokens (0–9 = max 10 unique), all-same-character
 *      tokens, and many simple repeated patterns.
 *   3. Must not be a repeated-pattern string.
 *      Detects any token whose characters repeat with a fixed period, e.g.
 *      "abcABC1!abcABC1!..." (period 8) or "abcdefghijklabcdefghijkl..."
 *      (period 12), regardless of how many unique characters they contain.
 *
 * Recommended generation:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *   (64 random hex chars — satisfies all three rules in practice)
 *
 * Examples that PASS:  any securely generated 32+-char random token
 * Examples that FAIL:
 *   "PasswordPassword"                   (16 chars — rule 1)
 *   "12345678901234567890123456789012"   (10 unique — rule 2)
 *   "abcABC1!abcABC1!abcABC1!abcABC1!" (repeated period-8 — rule 3)
 *   "abcdefghijklabcdefghijklabcdefgh" (repeated period-12 — rule 3)
 */
export function tokenWeaknessReason(token: string): string | null {
  if (token.length < 32) {
    return (
      "terlalu pendek — minimal 32 karakter " +
      "(gunakan token acak, contoh: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
    );
  }

  const uniqueChars = new Set(token).size;
  if (uniqueChars < 12) {
    return (
      "terlalu seragam atau mudah ditebak — gunakan token acak dengan minimal 12 karakter unik " +
      "(hindari pola berulang dan token yang hanya terdiri dari digit atau huruf yang sama)"
    );
  }

  if (isRepeatedPattern(token)) {
    return (
      "mengandung pola berulang — hindari token yang merupakan pengulangan karakter atau frasa pendek"
    );
  }

  return null;
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

      // Tolak jika token di env terlalu pendek atau trivial — hindari "123", "aaaa...", dsb.
      const configWeakness = tokenWeaknessReason(expected);
      if (configWeakness) {
        res.status(503).json({
          error: `BOOTSTRAP_ADMIN_TOKEN ${configWeakness}. Perbarui nilai di environment variable.`,
        });
        return;
      }

      const providedRaw: string = req.header("x-bootstrap-token") || "";
      const provided = providedRaw.trim();
      if (!provided) {
        res.status(401).json({ error: "Header x-bootstrap-token wajib disertakan" });
        return;
      }
      const providedWeakness = tokenWeaknessReason(provided);
      if (providedWeakness) {
        res.status(401).json({ error: `Token ${providedWeakness}` });
        return;
      }
      if (provided !== expected) {
        res.status(401).json({ error: "Token tidak valid" });
        return;
      }

      // Guard: reject if a superadmin already exists — token must be single-use.
      // If the DB is unreachable at this point, return 503 rather than a
      // confusing 500, and never fall through to the promotion path.
      let existingSuperadmins: Array<{ id: string | number }>;
      try {
        existingSuperadmins = await db.findSuperadmin();
      } catch (dbErr: any) {
        console.error("[bootstrap-superadmin] DB unavailable during guard read:", dbErr);
        res.status(503).json({
          error: "Database tidak dapat dijangkau saat ini. Coba lagi dalam beberapa saat.",
        });
        return;
      }
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
