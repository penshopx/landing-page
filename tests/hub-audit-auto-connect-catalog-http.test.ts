// Integrasi HTTP NYATA untuk round-trip: hub-audit auto-connect → harga katalog store.
//
// Skenario yang diuji:
//   1. Sebelum auto-connect: store_product yang terhubung ke agen orkestrator
//      (0 sub-agen) menampilkan harga tier solo (299.000).
//   2. Admin memanggil POST /api/admin/hub-audit/:id/auto-connect dengan 3 ID
//      kandidat sub-agen — setelah ini invalidateStoreCatalog() harus dipanggil.
//   3. Setelah auto-connect: GET /api/store/catalog mengembalikan harga tier
//      yang baru (3 sub + 1 orkestrator = 4 anggota total → 799.000).
//
// Hermetis: membuat dan membersihkan agen + store_product miliknya sendiri.
// Memakai DB + registerRoutes yang sama persis dengan produksi.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";

// ── Ketersediaan DB ───────────────────────────────────────────────────────────
const HAS_DB = !!process.env.DATABASE_URL;

// ── Lazy imports (diisi di before()) ─────────────────────────────────────────
let db: any;
let pool: any;
let users: any;
let agents: any;
let storeProducts: any;
let inArray: any;
let eq: any;
let registerRoutes: any;

// ── Identifier unik per run ───────────────────────────────────────────────────
const RUN = `hac_${Date.now()}_${randomUUID().slice(0, 8)}`;
const adminId = `${RUN}-admin`;

// Baris yang dibuat agar bisa dibersihkan di after().
const createdAgentIds: number[] = [];
const createdProductIds: number[] = [];
const createdUserIds: string[] = [adminId];

let server: Server;
let baseUrl = "";

// Hub orchestrator agent (0 sub-agen awal).
let hubAgentId = 0;
// Kandidat sub-agen yang akan diwire via auto-connect.
let candidateIds: number[] = [];
// Store product yang terhubung ke hub agent.
let storeProductId = 0;

// ── Before: setup DB rows + boot server ──────────────────────────────────────
before(async () => {
  if (!HAS_DB) return;

  // Tandai adminId lewat ADMIN_USER_IDS sehingga getDbRole mengembalikan "admin"
  // tanpa perlu menyentuh role DB (compatible dengan semua jalur checkIsAdmin).
  process.env.ADMIN_USER_IDS = [process.env.ADMIN_USER_IDS, adminId]
    .filter(Boolean)
    .join(",");

  ({ db, pool } = await import("../server/db"));
  ({ users } = await import("../shared/models/auth"));
  ({ agents, storeProducts } = await import("../shared/schema"));
  ({ inArray, eq } = await import("drizzle-orm"));
  ({ registerRoutes } = await import("../server/routes"));

  // Buat admin user di DB (wajib agar getDbRole bisa query row-nya).
  await db
    .insert(users)
    .values({ id: adminId, email: `${RUN}@example.test`, role: "user", isActive: true })
    .onConflictDoNothing();

  // Buat hub orchestrator agent (0 sub-agen = tier solo, harga 299.000).
  const [hubRow] = await db
    .insert(agents)
    .values({
      name: `${RUN} Hub Orkestrator`,
      isActive: true,
      isListed: true,
      agenticSubAgents: JSON.stringify([]),
    })
    .returning({ id: agents.id });
  hubAgentId = hubRow.id;
  createdAgentIds.push(hubAgentId);

  // Buat 3 kandidat sub-agen.
  for (let i = 0; i < 3; i++) {
    const [row] = await db
      .insert(agents)
      .values({ name: `${RUN} Sub ${i + 1}`, isActive: true, isListed: false })
      .returning({ id: agents.id });
    candidateIds.push(row.id);
    createdAgentIds.push(row.id);
  }

  // Buat store_product terhubung ke hub agent (tanpa priceOverride agar harga
  // dihitung dari agenticSubAgents hub agent melalui buildStoreCatalogItems).
  const [spRow] = await db
    .insert(storeProducts)
    .values({
      name: `${RUN} Produk Hub`,
      description: "Produk uji integrasi hub-audit auto-connect",
      category: "Konstruksi",
      price: 299_000,
      agentId: hubAgentId,
      isActive: true,
    })
    .returning({ id: storeProducts.id });
  storeProductId = spRow.id;
  createdProductIds.push(storeProductId);

  // Boot Express dengan registerRoutes NYATA.
  // Middleware shim ditaruh SEBELUM registerRoutes sehingga isAuthenticated +
  // getDbRole melihat req.user yang sudah terisi sebelum handler dipanggil.
  const app = express();
  app.use(express.json());
  app.use((reqAny: any, _res: any, next: any) => {
    const uid = reqAny.headers["x-test-user"];
    if (uid) {
      reqAny.user = { claims: { sub: uid }, id: uid };
      reqAny.isAuthenticated = () => true;
    } else {
      reqAny.isAuthenticated = () => false;
    }
    next();
  });

  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  await new Promise<void>((resolve) =>
    httpServer.listen(0, "127.0.0.1", resolve)
  );
  server = httpServer;
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

// ── After: bersihkan baris uji ────────────────────────────────────────────────
after(async () => {
  try {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  } catch {}
  if (!HAS_DB) return;
  try {
    if (createdProductIds.length)
      await db.delete(storeProducts).where(inArray(storeProducts.id, createdProductIds));
    if (createdAgentIds.length)
      await db.delete(agents).where(inArray(agents.id, createdAgentIds));
    await db.delete(users).where(inArray(users.id, createdUserIds));
  } catch {}
  if (pool) await pool.end().catch(() => {});

  // Bersihkan ADMIN_USER_IDS agar tidak bocor ke test lain.
  process.env.ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .filter((id) => id !== adminId)
    .join(",");
});

// ── Helper HTTP ───────────────────────────────────────────────────────────────
async function req(
  method: string,
  path: string,
  opts: { user?: string; body?: unknown } = {}
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.user) headers["x-test-user"] = opts.user;
  const r = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let json: any = null;
  const text = await r.text();
  if (text) { try { json = JSON.parse(text); } catch { json = text; } }
  return { status: r.status, json };
}

// ── Helper: cari store product di katalog berdasarkan productId ───────────────
async function findCatalogItem(productId: number): Promise<any | undefined> {
  // Ambil semua halaman jika ada banyak item (limit max 48 per halaman).
  let page = 1;
  while (true) {
    const { status, json } = await req("GET", `/api/store/catalog?limit=48&page=${page}`);
    assert.equal(status, 200, `GET /api/store/catalog gagal: ${JSON.stringify(json)}`);
    const items: any[] = json?.items ?? [];
    const found = items.find((it: any) => it.productId === productId);
    if (found) return found;
    if (page >= (json?.pages ?? 1)) return undefined;
    page++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Harga awal sebelum auto-connect adalah tier solo (299.000)
// ─────────────────────────────────────────────────────────────────────────────
test(
  "hub-audit HTTP: harga katalog sebelum auto-connect = tier solo (299.000)",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    const item = await findCatalogItem(storeProductId);
    assert.ok(
      item !== undefined,
      `Store product id=${storeProductId} tidak ditemukan di katalog sebelum auto-connect`
    );
    assert.equal(
      item.price,
      299_000,
      `Harga awal seharusnya 299.000 (0 sub-agen, total=1), dapat: ${item.price}`
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: auto-connect 401 tanpa auth
// ─────────────────────────────────────────────────────────────────────────────
test(
  "hub-audit HTTP: auto-connect tanpa auth → 401",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    const { status } = await req(
      "POST",
      `/api/admin/hub-audit/${hubAgentId}/auto-connect`,
      { body: { candidateIds } }
    );
    assert.equal(status, 401);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: auto-connect berhasil → agenticSubAgents terbaru dikembalikan
// ─────────────────────────────────────────────────────────────────────────────
test(
  "hub-audit HTTP: auto-connect admin → 200 + agenticSubAgents berisi 3 kandidat",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    const { status, json } = await req(
      "POST",
      `/api/admin/hub-audit/${hubAgentId}/auto-connect`,
      { user: adminId, body: { candidateIds } }
    );
    assert.equal(
      status, 200,
      `auto-connect harus 200, dapat ${status}: ${JSON.stringify(json)}`
    );
    assert.ok(json.ok === true, "Response harus { ok: true }");
    assert.ok(
      Array.isArray(json.agenticSubAgents) && json.agenticSubAgents.length === 3,
      `agenticSubAgents harus memiliki 3 entri, dapat: ${JSON.stringify(json.agenticSubAgents)}`
    );
    // Verifikasi setiap kandidat terwire dengan agentId yang benar.
    const wiredIds = json.agenticSubAgents.map((s: any) => s.agentId).sort();
    assert.deepEqual(wiredIds, [...candidateIds].sort());
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: GET /api/store/catalog setelah auto-connect menampilkan harga baru
//         3 sub-agen + 1 orkestrator = 4 total → tier 799.000
// ─────────────────────────────────────────────────────────────────────────────
test(
  "hub-audit HTTP: harga katalog setelah auto-connect (3 sub) = tier 799.000",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    const item = await findCatalogItem(storeProductId);
    assert.ok(
      item !== undefined,
      `Store product id=${storeProductId} tidak ditemukan di katalog setelah auto-connect`
    );
    assert.equal(
      item.price,
      799_000,
      `Harga setelah auto-connect (3 sub, total=4) seharusnya 799.000, dapat: ${item.price}`
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: auto-connect ulang dengan hanya 1 kandidat → 200 + agenticSubAgents
//         berisi 1 entri (tim diciutkan dari 3 → 1)
// ─────────────────────────────────────────────────────────────────────────────
test(
  "hub-audit HTTP: auto-connect ulang (1 kandidat) → 200 + agenticSubAgents berisi 1 entri",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    // Panggil ulang auto-connect hanya dengan 1 kandidat pertama.
    const { status, json } = await req(
      "POST",
      `/api/admin/hub-audit/${hubAgentId}/auto-connect`,
      { user: adminId, body: { candidateIds: [candidateIds[0]] } }
    );
    assert.equal(
      status, 200,
      `auto-connect ulang harus 200, dapat ${status}: ${JSON.stringify(json)}`
    );
    assert.ok(json.ok === true, "Response harus { ok: true }");
    assert.ok(
      Array.isArray(json.agenticSubAgents) && json.agenticSubAgents.length === 1,
      `agenticSubAgents setelah diciutkan harus berisi 1 entri, dapat: ${JSON.stringify(json.agenticSubAgents)}`
    );
    assert.equal(
      json.agenticSubAgents[0].agentId,
      candidateIds[0],
      `agenticSubAgents harus berisi kandidat pertama (id=${candidateIds[0]})`
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: GET /api/store/catalog setelah diciutkan menampilkan harga tier 2
//         1 sub-agen + 1 orkestrator = 2 total → tier 499.000
// ─────────────────────────────────────────────────────────────────────────────
test(
  "hub-audit HTTP: harga katalog setelah diciutkan (1 sub) = tier 499.000",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    const item = await findCatalogItem(storeProductId);
    assert.ok(
      item !== undefined,
      `Store product id=${storeProductId} tidak ditemukan di katalog setelah diciutkan`
    );
    assert.equal(
      item.price,
      499_000,
      `Harga setelah diciutkan (1 sub, total=2) seharusnya 499.000, dapat: ${item.price}`
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: auto-connect dengan ID campuran (valid + tidak ada) → 400 rejected
//         Seluruh request ditolak; agenticSubAgents hub TIDAK boleh berubah.
// ─────────────────────────────────────────────────────────────────────────────
test(
  "hub-audit HTTP: auto-connect ID campuran (valid + tidak ada) → 400 + wiring tidak berubah",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    // Snapshot wiring hub SEBELUM request (state dari TEST 5: 1 sub-agen).
    const [beforeRow] = await db
      .select({ agenticSubAgents: agents.agenticSubAgents })
      .from(agents)
      .where(eq(agents.id, hubAgentId));
    const wiringBefore = JSON.stringify(beforeRow.agenticSubAgents);

    // Gunakan 1 ID valid (kandidat pertama) dan 2 ID palsu yang pasti tidak ada.
    const FAKE_ID_1 = 999_999_991;
    const FAKE_ID_2 = 999_999_992;
    const mixedIds = [candidateIds[0], FAKE_ID_1, FAKE_ID_2];

    const { status, json } = await req(
      "POST",
      `/api/admin/hub-audit/${hubAgentId}/auto-connect`,
      { user: adminId, body: { candidateIds: mixedIds } }
    );

    // Harus 400 — ID tak dikenal tidak boleh diwire diam-diam.
    assert.equal(
      status, 400,
      `auto-connect ID campuran harus 400, dapat ${status}: ${JSON.stringify(json)}`
    );

    // error harus menyebut kedua ID palsu.
    assert.ok(
      typeof json.error === "string" && json.error.length > 0,
      `Response harus memiliki field 'error' non-kosong, dapat: ${JSON.stringify(json.error)}`
    );
    assert.ok(
      json.error.includes(String(FAKE_ID_1)) && json.error.includes(String(FAKE_ID_2)),
      `error harus menyebut ID palsu [${FAKE_ID_1}, ${FAKE_ID_2}], dapat: ${json.error}`
    );

    // missing harus berisi kedua ID palsu (dan BUKAN ID yang valid).
    assert.ok(
      Array.isArray(json.missing),
      `Response harus memiliki field 'missing' berupa array, dapat: ${JSON.stringify(json.missing)}`
    );
    const missingSorted = [...json.missing].sort((a: number, b: number) => a - b);
    assert.deepEqual(
      missingSorted,
      [FAKE_ID_1, FAKE_ID_2],
      `missing harus berisi [${FAKE_ID_1}, ${FAKE_ID_2}], dapat: ${JSON.stringify(missingSorted)}`
    );

    // agenticSubAgents hub TIDAK boleh berubah setelah penolakan.
    const [afterRow] = await db
      .select({ agenticSubAgents: agents.agenticSubAgents })
      .from(agents)
      .where(eq(agents.id, hubAgentId));
    assert.equal(
      JSON.stringify(afterRow.agenticSubAgents),
      wiringBefore,
      "agenticSubAgents hub harus tidak berubah setelah request ditolak"
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8: auto-connect dengan semua ID valid → 200 (bukan 207) + skipped kosong
// ─────────────────────────────────────────────────────────────────────────────
test(
  "hub-audit HTTP: auto-connect semua ID valid → 200 + skipped kosong",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    // Gunakan kembali semua candidateIds (semua valid).
    const { status, json } = await req(
      "POST",
      `/api/admin/hub-audit/${hubAgentId}/auto-connect`,
      { user: adminId, body: { candidateIds } }
    );
    assert.equal(
      status, 200,
      `auto-connect semua valid harus 200, dapat ${status}: ${JSON.stringify(json)}`
    );
    assert.ok(json.ok === true, "Response harus { ok: true }");
    assert.deepEqual(
      json.skipped,
      [],
      `skipped harus kosong ketika semua ID valid, dapat: ${JSON.stringify(json.skipped)}`
    );
    assert.ok(
      Array.isArray(json.agenticSubAgents) && json.agenticSubAgents.length === candidateIds.length,
      `agenticSubAgents harus berisi ${candidateIds.length} entri`
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9: auto-connect dengan candidateIds: [] → 200 + agenticSubAgents kosong
//         (semua sub-agen dilepas — hub kembali solo)
// ─────────────────────────────────────────────────────────────────────────────
test(
  "hub-audit HTTP: auto-connect candidateIds [] → 200 + agenticSubAgents kosong",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    const { status, json } = await req(
      "POST",
      `/api/admin/hub-audit/${hubAgentId}/auto-connect`,
      { user: adminId, body: { candidateIds: [] } }
    );
    assert.equal(
      status, 200,
      `auto-connect [] harus 200, dapat ${status}: ${JSON.stringify(json)}`
    );
    assert.ok(json.ok === true, "Response harus { ok: true }");
    assert.ok(
      Array.isArray(json.agenticSubAgents) && json.agenticSubAgents.length === 0,
      `agenticSubAgents harus kosong setelah reset, dapat: ${JSON.stringify(json.agenticSubAgents)}`
    );

    // Verifikasi DB juga benar-benar kosong (bukan hanya response).
    const [row] = await db
      .select({ agenticSubAgents: agents.agenticSubAgents })
      .from(agents)
      .where(eq(agents.id, hubAgentId));
    const stored = typeof row.agenticSubAgents === "string"
      ? JSON.parse(row.agenticSubAgents)
      : row.agenticSubAgents;
    assert.ok(
      Array.isArray(stored) && stored.length === 0,
      `agentic_sub_agents di DB harus [] setelah reset, dapat: ${JSON.stringify(row.agenticSubAgents)}`
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// TEST 10: GET /api/store/catalog setelah reset penuh → harga tier solo 299.000
// ─────────────────────────────────────────────────────────────────────────────
test(
  "hub-audit HTTP: harga katalog setelah reset penuh (0 sub) = tier solo (299.000)",
  { skip: !HAS_DB ? "DATABASE_URL tidak tersedia" : false },
  async () => {
    const item = await findCatalogItem(storeProductId);
    assert.ok(
      item !== undefined,
      `Store product id=${storeProductId} tidak ditemukan di katalog setelah reset penuh`
    );
    assert.equal(
      item.price,
      299_000,
      `Harga setelah reset penuh (0 sub, total=1) seharusnya 299.000, dapat: ${item.price}`
    );
  }
);
