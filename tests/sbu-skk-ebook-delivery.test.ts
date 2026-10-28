import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { db, pool } from "../server/db";
import {
  digitalProductFiles,
  productRegistry,
  storeOrders,
  storeProducts,
} from "../shared/schema";
import { SBU_SKK_EBOOK } from "../shared/sbu-skk-ebook";
import { CONTRACTOR_L1_EBOOKS } from "../server/sales-ladder-blueprint";
import { inArray } from "drizzle-orm";

import { startCiIsolatedApp } from "./ci-isolated-app";
let SERVER_URL: string;
let isolatedApp: Awaited<ReturnType<typeof startCiIsolatedApp>> | undefined;
const RUN = `sbu_skk_${Date.now()}_${randomUUID().slice(0, 8)}`;
const createdOrderIds: number[] = [];
const createdProductIds: number[] = [];
const createdRegistryIds: string[] = [];
let storeProductId = 0;
// v2.1.0 canonical main PDF + retained toolkit hashes
const MAIN_EBOOK_SHA256 = "c9d3541026dc15f81a13600b5f574e1145562c9ffa6d0c4ca768b845aec01ffb";
const SUPPLEMENT_SHA256 = "3aa4d83eeed5a9d970b2655451a8fe3db9c402de0c5ed69b12dd55d1caaa4c66";
// expectedPdfSha256 is resolved from DB so the HTTP assertion follows the seeded bytes.
let expectedPdfSha256 = "";
let expectedPdfSize = 0;

function readSource(relativePath: string): string {
  return fs.readFileSync(
    path.isAbsolute(relativePath) ? relativePath : path.join(process.cwd(), relativePath),
    "utf8",
  );
}

function collectClientSourceFiles(directory: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectClientSourceFiles(fullPath));
    } else if (/\.(?:ts|tsx|js|jsx|html|css)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

async function createOrder(status: "pending" | "paid", token: string): Promise<number> {
  const [order] = await db
    .insert(storeOrders)
    .values({
      productId: storeProductId,
      agentId: null,
      customerName: "Pembeli Test SBU-SKK",
      customerEmail: `${RUN}@example.com`,
      customerPhone: "",
      amount: SBU_SKK_EBOOK.amount,
      creatorUserId: null,
      creatorShare: 0,
      platformShare: SBU_SKK_EBOOK.amount,
      midtransOrderId: `${RUN}_${status}_${randomUUID()}`,
      accessToken: token,
      status,
    } as any)
    .returning({ id: storeOrders.id });
  createdOrderIds.push(order.id);
  return order.id;
}

before(async () => {
  isolatedApp = await startCiIsolatedApp();
  SERVER_URL = isolatedApp.url;
  const product = await pool.query<{ id: number }>(
    `SELECT id
       FROM store_products
      WHERE lower(name)=lower($1)
      ORDER BY id`,
    [SBU_SKK_EBOOK.title],
  );
  assert.equal(product.rowCount, 1, "Store harus memiliki tepat satu produk SBU-SKK");
  storeProductId = product.rows[0].id;

  let serverReady = false;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const response = await fetch(`${SERVER_URL}/api/store/catalog`);
      if (response.ok) {
        serverReady = true;
        break;
      }
    } catch {
      // Retry while the development workflow is starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(serverReady, `Server test tidak tersedia di ${SERVER_URL}`);

  // The server listens before asynchronous product reconciliation finishes.
  // Wait for the approved hash instead of racing the previous database row.
  for (let attempt = 0; attempt < 60; attempt++) {
    const dbFile = await pool.query<{ sha256: string; size_bytes: number }>(
      `SELECT sha256, size_bytes FROM digital_product_files
        WHERE product_registry_id=$1 AND role='main' ORDER BY sort_order LIMIT 1`,
      [SBU_SKK_EBOOK.registryProductId],
    );
    if (dbFile.rows[0]?.sha256 === MAIN_EBOOK_SHA256) {
      expectedPdfSha256 = dbFile.rows[0].sha256;
      expectedPdfSize = dbFile.rows[0].size_bytes;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.equal(
    expectedPdfSha256,
    MAIN_EBOOK_SHA256,
    "Seeder harus merekonsiliasi PDF utama v2.1.0 sebelum tes berjalan",
  );
});

after(async () => {
  if (createdOrderIds.length) {
    await db.delete(storeOrders).where(inArray(storeOrders.id, createdOrderIds)).catch(() => {});
  }
  if (createdProductIds.length) {
    await db.delete(storeProducts).where(inArray(storeProducts.id, createdProductIds)).catch(() => {});
  }
  if (createdRegistryIds.length) {
    await db
      .delete(productRegistry)
      .where(inArray(productRegistry.productId, createdRegistryIds))
      .catch(() => {});
  }
  if (isolatedApp) await isolatedApp.close();
});

test("metadata kanonik menetapkan identitas, harga, dan Scalev variant yang disetujui", () => {
  assert.equal(SBU_SKK_EBOOK.registryProductId, "GST-EBOOK-SBU-SKK-001");
  assert.equal(SBU_SKK_EBOOK.title, "SBU & SKK Tanpa Bingung");
  assert.equal(SBU_SKK_EBOOK.amount, 149_000);
  assert.equal(SBU_SKK_EBOOK.priceLabel, "Rp149.000");
  assert.equal(SBU_SKK_EBOOK.pages, 264);
  assert.equal(SBU_SKK_EBOOK.toolkitPages, 29);
  assert.match(SBU_SKK_EBOOK.subtitle, /Permen PU 06 Tahun 2025/);
  assert.doesNotMatch(SBU_SKK_EBOOK.subtitle, /06\/2021/);
  assert.equal(SBU_SKK_EBOOK.scalev.productId, 445696);
  assert.equal(SBU_SKK_EBOOK.scalev.variantId, 575747);
  assert.equal(
    SBU_SKK_EBOOK.scalev.variantUniqueId,
    "variant_z1bntA9UQICWphw-ikHv8ucN",
  );
  assert.ok(
    !("backendDownloadPath" in SBU_SKK_EBOOK),
    "Path fulfillment server tidak boleh ikut metadata publik",
  );
});

test("Registry, Store, dan file database menunjuk satu produk komersial yang sama", async () => {
  // Multi-file: query registry + store separately to avoid row-multiplication from JOIN
  const registryResult = await pool.query<{
    registry_count: string;
    registry_price: number;
    status: string;
    billing_type: string;
    access_type: string;
    visibility: string;
    variant_unique_id: string;
    store_count: string;
    store_price: number;
    price_override: number;
    scalev_variant_id: number;
    scalev_product_name: string;
    payment_url: string;
    download_path: string;
    file_count: string;
  }>(
    `SELECT
       (SELECT count(*)::text FROM product_registry WHERE product_id=$1) AS registry_count,
       pr.price AS registry_price,
       pr.status,
       pr.billing_type,
       pr.access_type,
       pr.visibility,
       pr.scalev_variant_unique_id AS variant_unique_id,
       (SELECT count(*)::text FROM store_products WHERE lower(name)=lower($2)) AS store_count,
       sp.price AS store_price,
       sp.price_override,
       sp.scalev_variant_id,
       sp.scalev_product_name,
       sp.payment_url,
       sp.download_path,
       (SELECT count(*)::text FROM digital_product_files WHERE product_registry_id=$1) AS file_count
     FROM product_registry pr
     JOIN store_products sp ON lower(sp.name)=lower(pr.name)
     WHERE pr.product_id=$1`,
    [SBU_SKK_EBOOK.registryProductId, SBU_SKK_EBOOK.title],
  );

  assert.equal(registryResult.rowCount, 1);
  const row = registryResult.rows[0];
  assert.equal(row.registry_count, "1");
  assert.equal(row.store_count, "1");
  assert.equal(row.file_count, "2");
  assert.equal(row.registry_price, 149_000);
  assert.equal(row.store_price, 149_000);
  assert.equal(row.price_override, 149_000);
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.billing_type, "ONE_TIME");
  assert.equal(row.access_type, "DOWNLOAD");
  assert.equal(row.visibility, "STANDALONE_ONLY");
  assert.equal(row.variant_unique_id, SBU_SKK_EBOOK.scalev.variantUniqueId);
  assert.equal(row.scalev_variant_id, SBU_SKK_EBOOK.scalev.variantId);
  assert.equal(row.scalev_product_name, SBU_SKK_EBOOK.title);
  assert.equal(
    row.payment_url,
    `https://bayar.dokumenproyek.com/c/checkout?variant_ids=${SBU_SKK_EBOOK.scalev.variantId}&qty=1`,
  );
  // download_path is the legacy PRIMARY (main file, v1 or v2 path accepted)
  assert.match(
    row.download_path,
    /^db-object:digital-products\/ebooks\/sbu-skk-tanpa-bingung\/v/,
    "download_path must be a db-object ebook path",
  );

  // Check main file bytes via separate query
  const fileRow = await pool.query<{ mime_type: string; size_bytes: number; stored_bytes: number; sha256: string }>(
    `SELECT mime_type, size_bytes, octet_length(content) AS stored_bytes, sha256
       FROM digital_product_files
      WHERE product_registry_id=$1 AND role='main'
      ORDER BY sort_order LIMIT 1`,
    [SBU_SKK_EBOOK.registryProductId],
  );
  assert.equal(fileRow.rowCount, 1, "Must have exactly one main file");
  assert.equal(fileRow.rows[0].mime_type, "application/pdf");
  assert.equal(fileRow.rows[0].size_bytes, expectedPdfSize);
  assert.equal(fileRow.rows[0].stored_bytes, expectedPdfSize);
  assert.equal(fileRow.rows[0].sha256, MAIN_EBOOK_SHA256);
  assert.equal(expectedPdfSha256, MAIN_EBOOK_SHA256);

  const supplement = await pool.query<{ sha256: string; size_bytes: number }>(
    `SELECT sha256, size_bytes
       FROM digital_product_files
      WHERE product_registry_id=$1 AND role='supplement'`,
    [SBU_SKK_EBOOK.registryProductId],
  );
  assert.equal(supplement.rowCount, 1);
  assert.equal(supplement.rows[0].sha256, SUPPLEMENT_SHA256);
});

test("Sales Ladder mengubah hanya L1 SBU-SKK dan mempertahankan empat placeholder + edge", async () => {
  const nodes = await pool.query<{
    sort_order: number;
    node_type: string;
    product_registry_id: string | null;
    package_registry_id: string | null;
    label: string;
  }>(
    `SELECT n.sort_order, n.node_type, n.product_registry_id, n.package_registry_id, n.label
       FROM sales_ladder_nodes n
       JOIN sales_ladders l ON l.id=n.ladder_id
      WHERE l.slug='contractor-sbu-readiness' AND n.stage='L1'
      ORDER BY n.sort_order`,
  );
  assert.equal(nodes.rowCount, 5);

  const linked = nodes.rows.filter(
    (node) =>
      node.node_type === "PRODUCT" &&
      node.product_registry_id === SBU_SKK_EBOOK.registryProductId,
  );
  assert.equal(linked.length, 1);
  assert.equal(linked[0].sort_order, 4);
  assert.equal(linked[0].label, CONTRACTOR_L1_EBOOKS[4].label);
  assert.equal(linked[0].package_registry_id, null);

  const placeholders = nodes.rows.filter((node) => node.node_type === "PLACEHOLDER");
  assert.equal(placeholders.length, 4);
  assert.deepEqual(
    placeholders.map((node) => node.label),
    CONTRACTOR_L1_EBOOKS.slice(0, 4).map((ebook) => ebook.label),
  );
  assert.ok(
    placeholders.every(
      (node) => node.product_registry_id === null && node.package_registry_id === null,
    ),
  );

  const edges = await pool.query<{
    next_step_count: string;
    sbu_upsell_count: string;
    l1_bonus_count: string;
  }>(
    `SELECT
       count(*) FILTER (
         WHERE e.relation_type='NEXT_STEP'
           AND source.stage='L0' AND target.stage='L1'
       )::text AS next_step_count,
       count(*) FILTER (
         WHERE e.relation_type='UPSELL'
           AND source.product_registry_id=$1
       )::text AS sbu_upsell_count,
       count(*) FILTER (
         WHERE e.relation_type='BONUS'
           AND (source.stage='L1' OR target.stage='L1')
       )::text AS l1_bonus_count
       FROM sales_ladder_edges e
       JOIN sales_ladders l ON l.id=e.ladder_id
       JOIN sales_ladder_nodes source ON source.id=e.from_node_id
       JOIN sales_ladder_nodes target ON target.id=e.to_node_id
      WHERE l.slug='contractor-sbu-readiness'`,
    [SBU_SKK_EBOOK.registryProductId],
  );
  assert.equal(edges.rows[0].next_step_count, "5");
  assert.equal(edges.rows[0].sbu_upsell_count, "1");
  assert.equal(edges.rows[0].l1_bonus_count, "0");
});

test("client tidak mengimpor PDF privat atau path db-object; build hanya menyalin ke private-assets", () => {
  const clientSource = collectClientSourceFiles(path.join(process.cwd(), "client")).map(readSource).join("\n");
  assert.ok(
    !clientSource.includes("0_Ebook_SBU-SKK-final_1787296226294.pdf"),
    "Nama aset PDF privat tidak boleh masuk source client",
  );
  assert.ok(
    !clientSource.includes("db-object:digital-products/ebooks/sbu-skk-tanpa-bingung"),
    "Path storage privat tidak boleh masuk bundle client",
  );

  const buildSource = readSource("script/build.ts");
  assert.ok(buildSource.includes("dist/private-assets"));
  assert.ok(
    buildSource.includes("sbu-skk-tanpa-bingung-v2.1.0.pdf"),
    "build.ts must reference the approved v2.1.0 main ebook PDF",
  );
  assert.ok(
    !/dist\/public[^;\n]*sbu-skk-tanpa-bingung-v[12]\.0\.0\.pdf/.test(buildSource),
    "Build tidak boleh menyalin PDF SBU-SKK ke dist/public",
  );

  const pageSource = readSource("client/src/pages/ebook-sbu-skk.tsx");
  assert.ok(pageSource.includes("${PAYMENT_BASE_URL}/c/checkout"));
  assert.ok(pageSource.includes("SBU_SKK_EBOOK.scalev.variantId"));
});

test("seluruh endpoint mutation dan listing admin Store memakai guard requireAdmin", () => {
  const routesSource = readSource("server/routes.ts");
  const guardedRoutes = [
    'app.get("/api/store/admin/products", isAuthenticated, requireAdmin,',
    'app.post("/api/store/admin/products", isAuthenticated, requireAdmin,',
    'app.patch("/api/store/admin/products/:id", isAuthenticated, requireAdmin,',
    'app.post("/api/store/admin/products/reorder", isAuthenticated, requireAdmin,',
    'app.delete("/api/store/admin/products/:id", isAuthenticated, requireAdmin,',
    'app.get("/api/store/admin/orders", isAuthenticated, requireAdmin,',
  ];
  for (const signature of guardedRoutes) {
    assert.ok(routesSource.includes(signature), `Guard admin hilang: ${signature}`);
  }
});

test("token order pending ditolak untuk metadata dan byte download", async () => {
  const token = randomUUID();
  await createOrder("pending", token);

  const metadata = await fetch(`${SERVER_URL}/api/store/access/${token}`);
  assert.equal(metadata.status, 403);
  assert.match((await metadata.json()).error, /belum dikonfirmasi/i);

  const download = await fetch(`${SERVER_URL}/api/store/access/${token}/download`);
  assert.equal(download.status, 403);
  assert.match((await download.json()).error, /belum dikonfirmasi/i);

  const diagnostic = await fetch(
    `${SERVER_URL}/api/store/access/${token}/level-one-diagnostic`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "sbu", answers: {} }),
    },
  );
  assert.equal(diagnostic.status, 403);
});

test("token order paid menerima endpoint internal dan byte PDF yang hash-nya benar", async () => {
  const token = randomUUID();
  await createOrder("paid", token);

  const metadata = await fetch(`${SERVER_URL}/api/store/access/${token}`);
  assert.equal(metadata.status, 200);
  const body = await metadata.json();
  assert.equal(body.type, "digital");
  assert.equal(body.product.name, SBU_SKK_EBOOK.title);
  assert.equal(body.order.status, "paid");
  assert.equal(body.downloads.length, 2);
  assert.deepEqual(
    body.downloads.map((file: any) => file.role).sort(),
    ["main", "supplement"],
  );
  assert.equal(body.levelOneDiagnostic.eligible, true);
  assert.equal(body.levelOneDiagnostic.selectedType, null);
  assert.equal(body.levelOneDiagnostic.result, null);
  assert.deepEqual(
    body.levelOneDiagnostic.choices.map((choice: any) => choice.type),
    ["sbu", "skk"],
  );
  const downloadUrl = new URL(body.downloadUrl, SERVER_URL);
  assert.equal(
    downloadUrl.pathname,
    `/api/store/access/${token}/download/product/${SBU_SKK_EBOOK.registryProductId}/role/main`,
  );
  assert.ok(!JSON.stringify(body).includes("db-object:"));

  const download = await fetch(`${SERVER_URL}${downloadUrl.pathname}`);
  assert.equal(download.status, 200);
  assert.match(download.headers.get("content-type") || "", /^application\/pdf/i);
  assert.match(download.headers.get("content-disposition") || "", /^attachment;/i);
  assert.match(download.headers.get("cache-control") || "", /private/i);
  assert.match(download.headers.get("cache-control") || "", /no-store/i);

  const bytes = Buffer.from(await download.arrayBuffer());
  assert.equal(bytes.length, expectedPdfSize);
  assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-");
  assert.equal(createHash("sha256").update(bytes).digest("hex"), expectedPdfSha256);

  const staleMain = await fetch(
    `${SERVER_URL}/api/store/access/${token}/download/2147483647`,
  );
  assert.equal(staleMain.status, 200);
  assert.equal(
    createHash("sha256")
      .update(Buffer.from(await staleMain.arrayBuffer()))
      .digest("hex"),
    expectedPdfSha256,
    "URL ID file yang sudah basi harus jatuh ke PDF utama terbaru milik produk yang sama",
  );

  const supplementMeta = body.downloads.find(
    (file: any) => file.role === "supplement",
  );
  assert.equal(
    new URL(supplementMeta.downloadUrl, SERVER_URL).pathname,
    `/api/store/access/${token}/download/product/${SBU_SKK_EBOOK.registryProductId}/role/supplement`,
  );
  const supplement = await fetch(
    `${SERVER_URL}${new URL(supplementMeta.downloadUrl, SERVER_URL).pathname}${new URL(supplementMeta.downloadUrl, SERVER_URL).search}`,
  );
  assert.equal(supplement.status, 200);
  assert.equal(
    createHash("sha256")
      .update(Buffer.from(await supplement.arrayBuffer()))
      .digest("hex"),
    SUPPLEMENT_SHA256,
  );
});

test("token produk A tidak dapat mengunduh file nyata milik produk B", async () => {
  const token = randomUUID();
  await createOrder("paid", token);
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  const foreignRegistryId = `GST-TST-${suffix}`;
  createdRegistryIds.push(foreignRegistryId);
  await db.insert(productRegistry).values({
    productId: foreignRegistryId,
    name: `Produk Asing ${suffix}`,
    slug: `produk-asing-${suffix.toLowerCase()}`,
    productType: "KNOWLEDGE",
    category: "TEST",
    status: "ACTIVE",
  });
  const foreignBytes = Buffer.from("%PDF-1.4\nforeign-test-file\n%%EOF");
  const [foreignFile] = await db
    .insert(digitalProductFiles)
    .values({
      productRegistryId: foreignRegistryId,
      storageKey: `tests/${RUN}/${suffix}.pdf`,
      fileName: "foreign.pdf",
      mimeType: "application/pdf",
      sizeBytes: foreignBytes.length,
      sha256: createHash("sha256").update(foreignBytes).digest("hex"),
      content: foreignBytes,
      sortOrder: 0,
      role: "main",
      label: "Foreign",
    })
    .returning({ id: digitalProductFiles.id });

  const byId = await fetch(
    `${SERVER_URL}/api/store/access/${token}/download/${foreignFile.id}`,
  );
  assert.equal(byId.status, 403);

  const byProductRole = await fetch(
    `${SERVER_URL}/api/store/access/${token}/download/product/${foreignRegistryId}/role/main`,
  );
  assert.equal(byProductRole.status, 403);
});

test("diagnosis paid menyimpan satu pilihan serta hanya mengembalikan skor dan status", async () => {
  const token = randomUUID();
  const orderId = await createOrder("paid", token);
  const answers = {
    journey: "first",
    qualification: "small",
    classification: "ready",
    pjbu: "ready",
    pjtbu: "ready",
    pjskbu: "ready",
    skk: "ready",
    experience: "ready",
    finance: "ready",
    documents: "ready",
  };

  const first = await fetch(
    `${SERVER_URL}/api/store/access/${token}/level-one-diagnostic`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "sbu", answers }),
    },
  );
  assert.equal(first.status, 201);
  const firstBody = await first.json();
  assert.deepEqual(Object.keys(firstBody.result).sort(), [
    "rubricVersion",
    "score",
    "statusKey",
    "statusLabel",
    "type",
  ]);
  assert.equal(firstBody.result.type, "sbu");
  assert.equal(firstBody.result.score, 100);
  assert.equal(firstBody.result.statusKey, "validate");
  assert.doesNotMatch(JSON.stringify(firstBody), /gap|answer|nextStep|strength/i);

  const stored = await pool.query(
    `SELECT diagnostic_type, score, status_key, status_label, rubric_version
       FROM sbu_skk_level1_diagnostics
      WHERE order_id=$1`,
    [orderId],
  );
  assert.equal(stored.rowCount, 1);
  assert.equal(stored.rows[0].diagnostic_type, "sbu");
  assert.equal(stored.rows[0].score, 100);

  const repeat = await fetch(
    `${SERVER_URL}/api/store/access/${token}/level-one-diagnostic`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "sbu", answers }),
    },
  );
  assert.equal(repeat.status, 200);
  assert.equal((await repeat.json()).alreadyCompleted, true);

  const switchAttempt = await fetch(
    `${SERVER_URL}/api/store/access/${token}/level-one-diagnostic`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "skk", answers }),
    },
  );
  assert.equal(switchAttempt.status, 409);

  const metadata = await fetch(`${SERVER_URL}/api/store/access/${token}`);
  const metadataBody = await metadata.json();
  assert.equal(metadataBody.levelOneDiagnostic.selectedType, "sbu");
  assert.equal(metadataBody.levelOneDiagnostic.result.score, 100);
  assert.doesNotMatch(
    JSON.stringify(metadataBody.levelOneDiagnostic),
    /gap|answer|nextStep|strength/i,
  );
});

test("token asing tidak dapat membuka atau menyimpan diagnosis", async () => {
  const token = randomUUID();
  const metadata = await fetch(`${SERVER_URL}/api/store/access/${token}`);
  assert.equal(metadata.status, 404);

  const diagnostic = await fetch(
    `${SERVER_URL}/api/store/access/${token}/level-one-diagnostic`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "skk", answers: {} }),
    },
  );
  assert.equal(diagnostic.status, 404);
});

test("produk lain dengan nama sama tidak mewarisi diagnosis Paket Level 1", async () => {
  const [spoof] = await db
    .insert(storeProducts)
    .values({
      name: SBU_SKK_EBOOK.title,
      description: "Produk penguji identitas immutable",
      category: "Test",
      price: SBU_SKK_EBOOK.amount,
      scalevVariantId: SBU_SKK_EBOOK.scalev.variantId + 999,
      downloadPath: "db-object:test/wrong-product.pdf",
      isActive: false,
    })
    .returning({ id: storeProducts.id });
  createdProductIds.push(spoof.id);

  const previousProductId = storeProductId;
  storeProductId = spoof.id;
  const token = randomUUID();
  await createOrder("paid", token);
  storeProductId = previousProductId;

  const metadata = await fetch(`${SERVER_URL}/api/store/access/${token}`);
  assert.equal(metadata.status, 200);
  const metadataBody = await metadata.json();
  assert.equal(metadataBody.levelOneDiagnostic, null);
  assert.deepEqual(metadataBody.downloads, []);

  const diagnostic = await fetch(
    `${SERVER_URL}/api/store/access/${token}/level-one-diagnostic`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "sbu", answers: {} }),
    },
  );
  assert.equal(diagnostic.status, 404);
});

test("submit SBU dan SKK bersamaan tetap menghasilkan tepat satu pilihan", async () => {
  const token = randomUUID();
  const orderId = await createOrder("paid", token);
  const readySbu = {
    journey: "first",
    qualification: "small",
    classification: "ready",
    pjbu: "ready",
    pjtbu: "ready",
    pjskbu: "ready",
    skk: "ready",
    experience: "ready",
    finance: "ready",
    documents: "ready",
  };
  const readySkk = {
    journey: "first",
    targetLevel: "technician",
    target: "ready",
    education: "ready",
    experience: "ready",
    competency: "ready",
    portfolio: "ready",
    employment: "ready",
    assessment: "ready",
    documents: "ready",
  };

  const responses = await Promise.all([
    fetch(`${SERVER_URL}/api/store/access/${token}/level-one-diagnostic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "sbu", answers: readySbu }),
    }),
    fetch(`${SERVER_URL}/api/store/access/${token}/level-one-diagnostic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "skk", answers: readySkk }),
    }),
  ]);
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [201, 409],
  );

  const stored = await pool.query<{
    count: string;
    types: string[];
  }>(
    `SELECT count(*)::text AS count,
            array_agg(diagnostic_type ORDER BY diagnostic_type) AS types
       FROM sbu_skk_level1_diagnostics
      WHERE order_id=$1`,
    [orderId],
  );
  assert.equal(stored.rows[0].count, "1");
  assert.equal(stored.rows[0].types.length, 1);
});