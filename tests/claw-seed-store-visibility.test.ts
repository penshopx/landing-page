// DB integration (Task-style seed regression guard): keempat produk claw baru
// TETAP tampil di Store setelah seed dijalankan ulang — fresh maupun rekonsiliasi.
//
// Latar: storage.createAgent men-DROP isPublic/isListed/premiumClass, sehingga
// seed WAJIB melakukan post-create updateAgent. Regressi kecil di
// createAgent/updateAgent bisa membuat produk hilang diam-diam dari Store.
//
// Skenario:
//   1. FRESH  — hapus keempat orkestrator (sub-agent/alat bantu dibiarkan),
//      jalankan keempat seed → orkestrator dibuat ulang lewat jalur
//      createAgent + updateAgent → assert flags + wiring + katalog.
//   2. REKONSILIASI — jalankan keempat seed SEKALI LAGI (baris sudah ada) →
//      jalur updateAgent rekonsiliasi → assert flags + wiring + katalog lagi.
//
// Assert per orkestrator: is_public=t, is_listed=t, premium_class='private',
// agenticSubAgents = 3 anggota dengan role sesuai, dan muncul di katalog Store
// (getStoreCatalogItems ASLI — cache ~30s dilewati dengan invalidateStoreCatalog()).
// Wiring MultiClaw via slug lookup — TIDAK PERNAH assert ID numerik.
//
// ── Keamanan DB bersama (prod memakai DB yang sama dengan dev) ───────────────
// Test ini menghapus lalu MEMBUAT ULANG baris produksi. Ikuti pola
// db-test-abort-recovery (lihat bootstrap-superadmin-db.test.ts):
//   1. Recovery record durable ditulis ke system_config SEBELUM delete
//      (key: claw-seed-test:recovery:<RUN>). before() run BERIKUTNYA menyapu
//      record tertinggal dan self-heal dengan menjalankan ulang seed.
//   2. after() SELALU menjalankan ulang seed (idempotent) sehingga state akhir
//      = state produksi yang benar, apapun hasil assert.
//   3. Handler SIGINT/SIGTERM/uncaughtException best-effort menjalankan
//      restore yang sama pada abort yang bisa ditangkap.
// Known limitation: SIGKILL/OOM tidak bisa dicegat — recovery record membuat
// jendela itu self-correcting pada run berikutnya.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";

// ── Guard: skip when no real DB is available ─────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.log("[claw-seed-store-visibility] DATABASE_URL not set — skipping DB integration tests");
  process.exit(0);
}

import { db } from "../server/db";
import { agents as agentsTable, systemConfig } from "../shared/schema";
import { eq, like } from "drizzle-orm";
import { parseSubAgentsValue } from "../server/db-storage";
import { getStoreCatalogItems, invalidateStoreCatalog } from "../server/routes";

import { seedDesainProyekClaw } from "../server/seed-desain-proyek-claw";
import { seedRencanaProyekClaw } from "../server/seed-rencana-proyek-claw";
import { seedStudiKelayakanClaw } from "../server/seed-studi-kelayakan-claw";
import { seedPersiapanProyekMulticlaw } from "../server/seed-persiapan-proyek-multiclaw";

// ── Ekspektasi per orkestrator (role wiring, TANPA ID numerik) ───────────────
const EXPECTED: { slug: string; roles: string[] }[] = [
  { slug: "desain-proyek-claw",           roles: ["DP-DRAFTER", "DP-REGULASI", "DP-EVALUATOR"] },
  { slug: "rencana-proyek-claw",          roles: ["RP-JADWAL", "RP-SUMBERDAYA", "RP-EVALUATOR"] },
  { slug: "studi-kelayakan-claw",         roles: ["SK-TEKNIS", "SK-EKONOMI", "SK-EVALUATOR"] },
  { slug: "persiapan-proyek-multiclaw",   roles: ["STUDI-KELAYAKAN", "DESAIN-PROYEK", "RENCANA-PROYEK"] },
];
const ORCH_SLUGS = EXPECTED.map((e) => e.slug);

// ── Recovery record (durable, per-run) ───────────────────────────────────────
const RECOVERY_KEY_PREFIX = "claw-seed-test:recovery";
const RUN = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const RECOVERY_KEY = `${RECOVERY_KEY_PREFIX}:${RUN}`;

async function writeRecoveryRecord(): Promise<void> {
  await db
    .insert(systemConfig)
    .values({ key: RECOVERY_KEY, value: JSON.stringify({ slugs: ORCH_SLUGS, run: RUN }) })
    .onConflictDoUpdate({
      target: systemConfig.key,
      set: { value: JSON.stringify({ slugs: ORCH_SLUGS, run: RUN }) },
    });
}

async function clearRecoveryRecord(): Promise<void> {
  await db.delete(systemConfig).where(eq(systemConfig.key, RECOVERY_KEY));
}

// Urutan penting: spesialis dulu, MultiClaw terakhir (wiring via slug lookup).
async function runAllSeeds(): Promise<void> {
  await seedDesainProyekClaw();
  await seedRencanaProyekClaw();
  await seedStudiKelayakanClaw();
  await seedPersiapanProyekMulticlaw();
}

// Self-heal + restore: jalankan ulang seed (idempotent) sehingga keempat
// produk pasti kembali utuh, lalu bersihkan cache katalog.
let restored = false;
async function restoreProducts(): Promise<void> {
  if (restored) return;
  restored = true;
  try {
    await runAllSeeds();
    invalidateStoreCatalog();
  } catch (err) {
    console.error("[claw-seed-store-visibility] restore failed:", err);
  }
}

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.once(sig, () => {
    restoreProducts().finally(() => process.exit(1));
  });
}
process.once("uncaughtException", (err) => {
  console.error(err);
  restoreProducts().finally(() => process.exit(1));
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getOrchRow(slug: string) {
  const rows = await db
    .select({
      id: agentsTable.id,
      slug: agentsTable.slug,
      isPublic: agentsTable.isPublic,
      isListed: agentsTable.isListed,
      isActive: agentsTable.isActive,
      premiumClass: agentsTable.premiumClass,
      agenticSubAgents: agentsTable.agenticSubAgents,
    })
    .from(agentsTable)
    .where(eq(agentsTable.slug, slug))
    .limit(1);
  return rows[0];
}

async function assertOrchestratorSellable(slug: string, roles: string[], phase: string) {
  const row = await getOrchRow(slug);
  assert.ok(row, `[${phase}] orkestrator '${slug}' harus ada di DB setelah seed`);
  assert.equal(row.isPublic, true, `[${phase}] ${slug}: is_public harus true (createAgent men-drop-nya; post-create updateAgent wajib memperbaiki)`);
  assert.equal(row.isListed, true, `[${phase}] ${slug}: is_listed harus true agar tampil di Store`);
  assert.equal(row.isActive, true, `[${phase}] ${slug}: is_active harus true`);
  assert.equal(row.premiumClass, "private", `[${phase}] ${slug}: premium_class harus 'private' (jalur clone-per-pembeli)`);

  // Wiring: 3 anggota, role sesuai — via parseSubAgentsValue (jsonb bisa
  // tersimpan sebagai string; normalisasi sama dengan runtime katalog).
  const members = parseSubAgentsValue(row.agenticSubAgents);
  assert.equal(members.length, 3, `[${phase}] ${slug}: agenticSubAgents harus berisi tepat 3 anggota, dapat ${members.length}`);
  const actualRoles = members.map((m: any) => m?.role).sort();
  assert.deepEqual(actualRoles, [...roles].sort(), `[${phase}] ${slug}: role anggota harus ${roles.join(", ")}`);
  for (const m of members) {
    assert.ok(Number.isFinite(Number(m?.agentId)) && Number(m.agentId) > 0,
      `[${phase}] ${slug}: setiap anggota harus punya agentId numerik valid (role ${m?.role})`);
  }
  return row;
}

// Katalog Store ASLI (builder + cache produksi). invalidateStoreCatalog()
// dipanggil dulu agar TTL ~30s tidak menyajikan snapshot lama.
async function assertVisibleInCatalog(slug: string, agentId: number, phase: string) {
  const items = await getStoreCatalogItems("", "");
  const match = items.find((i: any) => Number(i.agentId) === Number(agentId));
  assert.ok(match, `[${phase}] ${slug} (agentId ${agentId}) harus muncul di GET /api/store/catalog`);
  // Bundel 2+ komponen: bila tampil sebagai item agent, agentCount >= 4 (1+3).
  if (match.type === "agent") {
    assert.ok(match.agentCount >= 4, `[${phase}] ${slug}: agentCount harus >= 4 (orkestrator + 3 anggota), dapat ${match.agentCount}`);
  }
}

// ── Setup: sweep recovery record tertinggal dari run sebelumnya (self-heal) ──
before(async () => {
  const leftovers = await db
    .select({ key: systemConfig.key })
    .from(systemConfig)
    .where(like(systemConfig.key, `${RECOVERY_KEY_PREFIX}%`));
  if (leftovers.length > 0) {
    console.log(`[claw-seed-store-visibility] ${leftovers.length} recovery record tertinggal — self-heal via re-seed`);
    await runAllSeeds();
    invalidateStoreCatalog();
    for (const r of leftovers) {
      await db.delete(systemConfig).where(eq(systemConfig.key, r.key));
    }
  }
});

after(async () => {
  // Restore idempotent: state akhir DB = hasil seed produksi yang benar.
  restored = false;
  await restoreProducts();
  await clearRecoveryRecord();
  invalidateStoreCatalog();
});

// ═════════════════════════════════════════════════════════════════════════════
// FASE 1 — FRESH: orkestrator dihapus → seed membuatnya ulang lewat jalur
// createAgent (yang men-drop isListed/premiumClass) + post-create updateAgent.
// ═════════════════════════════════════════════════════════════════════════════

test("FRESH: seed run pertama membuat ulang keempat orkestrator — listed, private, wiring 3 anggota, tampil di katalog", async () => {
  // Recovery record durable SEBELUM mutasi apa pun.
  await writeRecoveryRecord();

  // Hapus HANYA orkestrator (sub-agent/alat bantu dibiarkan agar wiring slug
  // lookup diuji terhadap anggota yang sudah ada — sama seperti boot nyata).
  for (const slug of ORCH_SLUGS) {
    await db.delete(agentsTable).where(eq(agentsTable.slug, slug));
  }
  invalidateStoreCatalog();

  // Sanity: benar-benar fresh.
  for (const slug of ORCH_SLUGS) {
    assert.equal(await getOrchRow(slug), undefined, `pre-fresh: '${slug}' harus sudah terhapus`);
  }

  await runAllSeeds();
  invalidateStoreCatalog();

  for (const { slug, roles } of EXPECTED) {
    const row = await assertOrchestratorSellable(slug, roles, "FRESH");
    await assertVisibleInCatalog(slug, row.id, "FRESH");
  }

  // Wiring MultiClaw menunjuk anggota via slug lookup — verifikasi silang:
  // agentId anggota MultiClaw harus = ID aktual claw anggota (BUKAN konstanta).
  const mc = await getOrchRow("persiapan-proyek-multiclaw");
  const mcMembers = parseSubAgentsValue(mc!.agenticSubAgents);
  const roleToSlug: Record<string, string> = {
    "STUDI-KELAYAKAN": "studi-kelayakan-claw",
    "DESAIN-PROYEK": "desain-proyek-claw",
    "RENCANA-PROYEK": "rencana-proyek-claw",
  };
  for (const m of mcMembers) {
    const memberRow = await getOrchRow(roleToSlug[m.role]);
    assert.ok(memberRow, `anggota '${roleToSlug[m.role]}' harus ada`);
    assert.equal(Number(m.agentId), Number(memberRow!.id),
      `MultiClaw wiring role ${m.role} harus menunjuk ID aktual '${roleToSlug[m.role]}' (slug lookup, bukan ID lama)`);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// FASE 2 — REKONSILIASI: seed run kedua (baris sudah ada) → jalur updateAgent.
// Produk TIDAK boleh hilang / kehilangan flag sellability.
// ═════════════════════════════════════════════════════════════════════════════

test("REKONSILIASI: seed run kedua tidak menghilangkan produk — flags, wiring, dan katalog tetap utuh", async () => {
  // ID sebelum run kedua — rekonsiliasi TIDAK boleh membuat baris baru.
  const idsBefore = new Map<string, number>();
  for (const slug of ORCH_SLUGS) {
    const row = await getOrchRow(slug);
    assert.ok(row, `pre-rekonsiliasi: '${slug}' harus ada (hasil fase FRESH)`);
    idsBefore.set(slug, row!.id);
  }

  await runAllSeeds();
  invalidateStoreCatalog();

  for (const { slug, roles } of EXPECTED) {
    const row = await assertOrchestratorSellable(slug, roles, "REKONSILIASI");
    assert.equal(row.id, idsBefore.get(slug),
      `REKONSILIASI: '${slug}' harus baris yang SAMA (ID tetap), bukan duplikat baru`);
    await assertVisibleInCatalog(slug, row.id, "REKONSILIASI");
  }

  // Kedua run selesai bersih — recovery record boleh dihapus.
  await clearRecoveryRecord();
});
