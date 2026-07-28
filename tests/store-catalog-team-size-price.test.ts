// Integrasi harga katalog store berdasarkan ukuran tim (agenticSubAgents).
//
// Skenario yang diuji:
//   1. calcStorePrice — 4 tier harga sesuai jumlah total anggota tim.
//   2. Katalog DB — setelah agenticSubAgents diubah via storage.updateAgent,
//      query yang sama dengan buildStoreCatalogItems mengembalikan harga baru
//      (membuktikan invalidasi cache cukup untuk memperbarui tampilan store).
//   3. Penjagaan statis — invalidateStoreCatalog() dipanggil di SETIAP jalur
//      yang dapat mengubah agenticSubAgents (PATCH agen, hub-audit auto-connect).
//
// Hermetis: agen dan produk diberi nama unik (RUN prefix), dibersihkan setelah test.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { db } from "../server/db";
import { agents as agentsTable, storeProducts } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";
import { storage } from "../server/storage";
import { parseSubAgentsValue } from "../server/db-storage";

// ── Tier harga (salinan dari routes.ts untuk pengujian unit murni) ────────────
const DEFAULT_LICENSE_PRICE = 299_000;

function calcStorePrice(agenticSubAgents: unknown[]): number {
  const subCount = Array.isArray(agenticSubAgents) ? agenticSubAgents.length : 0;
  const total = subCount + 1; // orchestrator + sub-agents
  if (total >= 7) return 1_299_000;
  if (total >= 4) return 799_000;
  if (total >= 2) return 499_000;
  return DEFAULT_LICENSE_PRICE;
}

// ── Identifier unik per run ───────────────────────────────────────────────────
const RUN = `tsp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const createdAgentIds: number[] = [];
const createdProductIds: number[] = [];

// ── Teardown ─────────────────────────────────────────────────────────────────
after(async () => {
  if (createdProductIds.length > 0) {
    await db.delete(storeProducts).where(inArray(storeProducts.id, createdProductIds));
  }
  if (createdAgentIds.length > 0) {
    await db.delete(agentsTable).where(inArray(agentsTable.id, createdAgentIds));
  }
});

// ── Helper: buat agen orkestrator ringan di DB ────────────────────────────────
async function createOrchestrator(subCount: number): Promise<number> {
  const subAgents = Array.from({ length: subCount }, (_, i) => ({
    agentId: 9000 + i, // dummy IDs — hanya jumlah yang dihitung
    role: `sub-${i}`,
    description: `Sub-agen ${i}`,
  }));
  const agent = await storage.createAgent({
    name: `${RUN} Orkestrator`,
    isListed: true,
    isActive: true,
    agenticSubAgents: subAgents,
  } as any);
  createdAgentIds.push(agent.id);
  return agent.id;
}

// ── Helper: ambil agenticSubAgents dari DB (simulasi buildStoreCatalogItems) ──
async function fetchSubAgentsFromDb(agentId: number): Promise<unknown[]> {
  const rows = await db
    .select({ agenticSubAgents: agentsTable.agenticSubAgents })
    .from(agentsTable)
    .where(eq(agentsTable.id, agentId))
    .limit(1);
  return rows.length > 0 ? parseSubAgentsValue(rows[0].agenticSubAgents) : [];
}

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 1 — Unit: tier harga calcStorePrice
// ═════════════════════════════════════════════════════════════════════════════

test("tier solo (0 sub-agen, total=1) → 299.000", () => {
  assert.equal(calcStorePrice([]), DEFAULT_LICENSE_PRICE);
});

test("tier tim kecil (1 sub-agen, total=2) → 499.000", () => {
  assert.equal(calcStorePrice([{}]), 499_000);
});

test("tier tim kecil (2 sub-agen, total=3) → 499.000", () => {
  assert.equal(calcStorePrice([{}, {}]), 499_000);
});

test("tier tim sedang (3 sub-agen, total=4) → 799.000", () => {
  assert.equal(calcStorePrice([{}, {}, {}]), 799_000);
});

test("tier tim sedang (5 sub-agen, total=6) → 799.000", () => {
  assert.equal(calcStorePrice([{}, {}, {}, {}, {}]), 799_000);
});

test("tier tim besar (6 sub-agen, total=7) → 1.299.000", () => {
  assert.equal(calcStorePrice([{}, {}, {}, {}, {}, {}]), 1_299_000);
});

test("tier tim besar (9 sub-agen, total=10) → 1.299.000", () => {
  assert.equal(calcStorePrice(Array(9).fill({})), 1_299_000);
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 2 — Integrasi DB: perubahan agenticSubAgents tercermin di harga
// ═════════════════════════════════════════════════════════════════════════════
//
// Membuktikan alur lengkap:
//   updateAgent (agenticSubAgents baru) → DB diperbarui → query katalog membaca
//   agenticSubAgents terkini → calcStorePrice menghasilkan tier baru.
// Ini adalah MEKANISME yang diandalkan setelah invalidateStoreCatalog() membuat
// permintaan berikutnya membangun ulang dari DB.

test("harga katalog mencerminkan tim kecil (1 sub-agen) segera setelah updateAgent", async () => {
  // 1. Buat agen solo (0 sub-agen)
  const agentId = await createOrchestrator(0);

  // Verifikasi harga awal = tier solo
  const initSubs = await fetchSubAgentsFromDb(agentId);
  assert.equal(
    calcStorePrice(initSubs),
    DEFAULT_LICENSE_PRICE,
    "Harga awal harus tier solo (299.000)"
  );

  // 2. Tambah 1 sub-agen via storage.updateAgent
  await storage.updateAgent(String(agentId), {
    agenticSubAgents: [{ agentId: 9001, role: "sub-1", description: "Sub pertama" }],
  } as any);

  // 3. Query DB — persis seperti yang dilakukan buildStoreCatalogItems
  const updatedSubs = await fetchSubAgentsFromDb(agentId);
  const newPrice = calcStorePrice(updatedSubs);

  assert.equal(
    newPrice,
    499_000,
    "Setelah menambah 1 sub-agen (total=2), harga harus tier tim kecil (499.000)"
  );
});

test("harga katalog naik ke tier sedang (3 sub-agen) setelah updateAgent", async () => {
  const agentId = await createOrchestrator(1); // mulai dengan tim kecil

  const before = await fetchSubAgentsFromDb(agentId);
  assert.equal(calcStorePrice(before), 499_000, "Awal harus tim kecil (499.000)");

  // Tambah hingga 3 sub-agen
  await storage.updateAgent(String(agentId), {
    agenticSubAgents: [
      { agentId: 9001, role: "sub-1", description: "A" },
      { agentId: 9002, role: "sub-2", description: "B" },
      { agentId: 9003, role: "sub-3", description: "C" },
    ],
  } as any);

  const after = await fetchSubAgentsFromDb(agentId);
  assert.equal(
    calcStorePrice(after),
    799_000,
    "Setelah menambah 3 sub-agen (total=4), harga harus tier sedang (799.000)"
  );
});

test("harga katalog naik ke tier besar (6 sub-agen) setelah updateAgent", async () => {
  const agentId = await createOrchestrator(3);

  const before = await fetchSubAgentsFromDb(agentId);
  assert.equal(calcStorePrice(before), 799_000, "Awal harus tim sedang (799.000)");

  await storage.updateAgent(String(agentId), {
    agenticSubAgents: Array.from({ length: 6 }, (_, i) => ({
      agentId: 9000 + i, role: `sub-${i}`, description: `Sub ${i}`,
    })),
  } as any);

  const after = await fetchSubAgentsFromDb(agentId);
  assert.equal(
    calcStorePrice(after),
    1_299_000,
    "Setelah menambah 6 sub-agen (total=7), harga harus tier besar (1.299.000)"
  );
});

test("harga katalog turun saat sub-agen dikurangi (downgrade tier)", async () => {
  const agentId = await createOrchestrator(6); // tim besar

  const before = await fetchSubAgentsFromDb(agentId);
  assert.equal(calcStorePrice(before), 1_299_000, "Awal harus tim besar (1.299.000)");

  // Kurangi ke 1 sub-agen
  await storage.updateAgent(String(agentId), {
    agenticSubAgents: [{ agentId: 9001, role: "sub-1", description: "Sisa" }],
  } as any);

  const after = await fetchSubAgentsFromDb(agentId);
  assert.equal(
    calcStorePrice(after),
    499_000,
    "Setelah dikurangi ke 1 sub-agen (total=2), harga harus turun ke tim kecil (499.000)"
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 3 — Statis: invalidateStoreCatalog() dipanggil di setiap jalur mutasi
// ═════════════════════════════════════════════════════════════════════════════

test("routes.ts: invalidateStoreCatalog() dipanggil setelah PATCH /api/agents/:id", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  // Cari handler PATCH /api/agents/:id dan pastikan invalidateStoreCatalog ada
  // di blok yang sama sebelum handler berikutnya (PUT/DELETE/POST).
  const patchBlock = src.match(
    /app\.patch\("\/api\/agents\/:id"[\s\S]*?(?=app\.(get|post|put|delete|patch)\()/
  );
  assert.ok(
    patchBlock && patchBlock[0].includes("invalidateStoreCatalog()"),
    "PATCH /api/agents/:id harus memanggil invalidateStoreCatalog() setelah update"
  );
});

test("routes.ts: invalidateStoreCatalog() dipanggil setelah hub-audit auto-connect", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  // Cari handler auto-connect dan pastikan invalidateStoreCatalog ada di sana
  const autoConnectBlock = src.match(
    /app\.post\("\/api\/admin\/hub-audit\/:id\/auto-connect"[\s\S]*?(?=app\.(get|post|put|delete|patch)\()/
  );
  assert.ok(
    autoConnectBlock && autoConnectBlock[0].includes("invalidateStoreCatalog()"),
    "hub-audit auto-connect harus memanggil invalidateStoreCatalog() setelah UPDATE agentic_sub_agents"
  );
});

test("routes.ts: setiap SET agentic_sub_agents via raw SQL memanggil invalidateStoreCatalog() dalam blok yang sama", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  // Temukan semua blok route yang berisi SET agentic_sub_agents
  // (raw SQL UPDATE SET agentic_sub_agents) dan periksa apakah
  // invalidateStoreCatalog() ada dalam radius 20 baris.
  const lines = src.split("\n");
  const rawUpdateLines: number[] = [];
  lines.forEach((line, idx) => {
    if (line.includes("agentic_sub_agents") && line.includes("UPDATE")) {
      rawUpdateLines.push(idx);
    }
  });

  for (const lineIdx of rawUpdateLines) {
    const window = lines.slice(lineIdx, lineIdx + 20).join("\n");
    assert.ok(
      window.includes("invalidateStoreCatalog()"),
      `Baris ${lineIdx + 1}: UPDATE agentic_sub_agents tidak diikuti invalidateStoreCatalog() dalam 20 baris berikutnya`
    );
  }
});
