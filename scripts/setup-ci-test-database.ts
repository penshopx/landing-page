/**
 * GitHub-only fixture. Never reads, copies or modifies an application database.
 * GitHub destroys this PostgreSQL service and its volume when the job ends.
 */
import pg from "pg";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import * as schema from "../shared/schema";
import { validateCiDatabaseEnvironment } from "./ci-test-database-guard.mjs";

let stage = "guard";
try {
  const name = validateCiDatabaseEnvironment(process.env);
  const pool = new pg.Pool({ connectionString: process.env.CI_TEST_DATABASE_URL, max: 1 });
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const identity = await client.query("SELECT current_database() AS name");
      if (identity.rows[0]?.name !== name) throw new Error("Identitas database berbeda.");
      const existing = await client.query(`
        SELECT 1 FROM pg_class WHERE relnamespace = 'public'::regnamespace
        UNION ALL SELECT 1 FROM pg_proc WHERE pronamespace = 'public'::regnamespace
        UNION ALL SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace
        UNION ALL SELECT 1 FROM pg_namespace
          WHERE nspname NOT IN ('public', 'information_schema') AND nspname !~ '^pg_'
        UNION ALL SELECT 1 FROM pg_extension WHERE extname <> 'plpgsql'`);
      if (existing.rowCount) throw new Error("Fixture wajib memakai database baru yang kosong.");
      stage = "schema";
      const statements = await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema));
      for (const statement of statements) await client.query(statement);
      await client.query("CREATE TABLE public.ci_disposable_guard (marker text PRIMARY KEY)");
      await client.query("INSERT INTO public.ci_disposable_guard VALUES ($1)", ["github-actions-disposable-only"]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }

  // Import database-backed application modules only after proving the fixture.
  stage = "product-seeds";
  const { pool: applicationPool } = await import("../server/db");
  try {
    const { seedDesainProyekClaw } = await import("../server/seed-desain-proyek-claw");
    const { seedRencanaProyekClaw } = await import("../server/seed-rencana-proyek-claw");
    const { seedStudiKelayakanClaw } = await import("../server/seed-studi-kelayakan-claw");
    const { seedPersiapanProyekMulticlaw } = await import("../server/seed-persiapan-proyek-multiclaw");
    await seedDesainProyekClaw();
    await seedRencanaProyekClaw();
    await seedStudiKelayakanClaw();
    await seedPersiapanProyekMulticlaw();
    const { seedStoreProducts } = await import("../server/seed-store-products");
    await seedStoreProducts();
    const { seedContractorLadder } = await import("../server/sales-ladder-seed");
    await seedContractorLadder();
    const { seedSbuSkkEbook } = await import("../server/seed-sbu-skk-ebook");
    await seedSbuSkkEbook();
    stage = "fixture-proof";
    for (const table of ["users", "store_orders", "subscriptions_new", "product_entitlements"]) {
      const result = await applicationPool.query(`SELECT count(*)::int AS n FROM "${table}"`);
      if (result.rows[0].n !== 0) throw new Error("Seed tidak boleh membuat data pelanggan/transaksi.");
    }
  } finally {
    await applicationPool.end();
  }
  console.log("Database disposable CI siap; tidak ada data aplikasi yang disalin.");
} catch (error) {
  const code = (error as { code?: string }).code;
  console.error(`Persiapan database CI gagal (${stage}${code && /^[0-9A-Z]{5}$/.test(code) ? `, SQLSTATE ${code}` : ""}); nilai koneksi tidak ditampilkan.`);
  process.exitCode = 1;
}
