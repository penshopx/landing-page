import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { db, pool } from "../server/db";
import { storeOrders } from "../shared/schema";
import { SBU_SKK_EBOOK } from "../shared/sbu-skk-ebook";
import { CONTRACTOR_L1_EBOOKS } from "../server/sales-ladder-blueprint";
import { inArray } from "drizzle-orm";

const SERVER_URL = `http://localhost:${process.env.PORT || 5000}`;
const RUN = `sbu_skk_${Date.now()}_${randomUUID().slice(0, 8)}`;
const createdOrderIds: number[] = [];
let storeProductId = 0;
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
  const product = await pool.query<{ id: number }>(
    `SELECT id
       FROM store_products
      WHERE lower(name)=lower($1)
      ORDER BY id`,
    [SBU_SKK_EBOOK.title],
  );
  assert.equal(product.rowCount, 1, "Store harus memiliki tepat satu produk SBU-SKK");
  storeProductId = product.rows[0].id;

  const localPdf = fs.readFileSync(
    path.join(process.cwd(), "attached_assets/0_Ebook_SBU-SKK-final_1787296226294.pdf"),
  );
  expectedPdfSha256 = createHash("sha256").update(localPdf).digest("hex");
  expectedPdfSize = localPdf.length;

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
});

after(async () => {
  if (createdOrderIds.length) {
    await db.delete(storeOrders).where(inArray(storeOrders.id, createdOrderIds)).catch(() => {});
  }
});

test("metadata kanonik menetapkan identitas, harga, dan Scalev variant yang disetujui", () => {
  assert.equal(SBU_SKK_EBOOK.registryProductId, "GST-EBOOK-SBU-SKK-001");
  assert.equal(SBU_SKK_EBOOK.title, "SBU & SKK Tanpa Bingung");
  assert.equal(SBU_SKK_EBOOK.amount, 149_000);
  assert.equal(SBU_SKK_EBOOK.priceLabel, "Rp149.000");
  assert.equal(SBU_SKK_EBOOK.pages, 265);
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
  const result = await pool.query<{
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
    mime_type: string;
    size_bytes: number;
    stored_bytes: number;
    sha256: string;
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
       (SELECT count(*)::text FROM digital_product_files WHERE product_registry_id=$1) AS file_count,
       df.mime_type,
       df.size_bytes,
       octet_length(df.content) AS stored_bytes,
       df.sha256
     FROM product_registry pr
     JOIN store_products sp ON lower(sp.name)=lower(pr.name)
     JOIN digital_product_files df ON df.product_registry_id=pr.product_id
     WHERE pr.product_id=$1`,
    [SBU_SKK_EBOOK.registryProductId, SBU_SKK_EBOOK.title],
  );

  assert.equal(result.rowCount, 1);
  const row = result.rows[0];
  assert.equal(row.registry_count, "1");
  assert.equal(row.store_count, "1");
  assert.equal(row.file_count, "1");
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
  assert.equal(
    row.download_path,
    "db-object:digital-products/ebooks/sbu-skk-tanpa-bingung/v1.0.0/sbu-skk-tanpa-bingung.pdf",
  );
  assert.equal(row.mime_type, "application/pdf");
  assert.equal(row.size_bytes, expectedPdfSize);
  assert.equal(row.stored_bytes, expectedPdfSize);
  assert.equal(row.sha256, expectedPdfSha256);
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
  assert.ok(buildSource.includes("sbu-skk-tanpa-bingung-v1.0.0.pdf"));
  assert.ok(
    !/dist\/public[^;\n]*sbu-skk-tanpa-bingung-v1\.0\.0\.pdf/.test(buildSource),
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
  const downloadUrl = new URL(body.downloadUrl, SERVER_URL);
  assert.equal(downloadUrl.pathname, `/api/store/access/${token}/download`);
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
});