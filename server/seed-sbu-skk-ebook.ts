import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./db";
import { PAYMENT_BASE_URL } from "./lib/scalev";
import { databaseStorageKey } from "./lib/digital-product-storage";
import { CONTRACTOR_L1_EBOOKS } from "./sales-ladder-blueprint";
import { SBU_SKK_EBOOK } from "@shared/sbu-skk-ebook";

const PRIVATE_FILE_NAME = "SBU-SKK-Tanpa-Bingung.pdf";
const APPROVED_PDF_SHA256 = "b4e52689e568e1112ef9ad2b04c8ae3e59ac375ee32e2d77d36a2346e80f75f3";
const PRIVATE_DOWNLOAD_PATH =
  "db-object:digital-products/ebooks/sbu-skk-tanpa-bingung/v1.0.0/sbu-skk-tanpa-bingung.pdf";
const PRIVATE_ASSET_CANDIDATES = [
  path.resolve(process.cwd(), "dist/private-assets/sbu-skk-tanpa-bingung-v1.0.0.pdf"),
  path.resolve(process.cwd(), "attached_assets/0_Ebook_SBU-SKK-final_1787296226294.pdf"),
];

async function loadPrivatePdf(): Promise<Buffer> {
  for (const candidate of PRIVATE_ASSET_CANDIDATES) {
    try {
      const bytes = await readFile(candidate);
      if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
        throw new Error("File tidak memiliki signature PDF.");
      }
      if (bytes.length < 1_000_000) {
        throw new Error(`Ukuran PDF tidak wajar (${bytes.length} byte).`);
      }
      return bytes;
    } catch (error: any) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new Error("Aset PDF privat SBU-SKK tidak ditemukan di source maupun bundle server.");
}

/**
 * Reconciles one commercial identity across Registry, Store fulfillment, the
 * private binary, and the already-approved Contractor Sales Ladder L1 node.
 */
export async function seedSbuSkkEbook(): Promise<void> {
  const pdf = await loadPrivatePdf();
  const sha256 = createHash("sha256").update(pdf).digest("hex");
  if (sha256 !== APPROVED_PDF_SHA256) {
    throw new Error(`Hash PDF privat SBU-SKK tidak cocok dengan aset final yang disetujui (${sha256}).`);
  }
  const storageKey = databaseStorageKey(PRIVATE_DOWNLOAD_PATH);
  // The newly-provisioned /p/:slug page is not attached to the payment store
  // yet (Scalev returns 404), while the account's canonical variant checkout is
  // live. Keep the Store URL on the proven variant flow used by the main catalog.
  const checkoutUrl =
    `${PAYMENT_BASE_URL}/c/checkout?variant_ids=${SBU_SKK_EBOOK.scalev.variantId}&qty=1`;
  const ladderEbook = CONTRACTOR_L1_EBOOKS.find((ebook) =>
    ebook.label.startsWith("SBU & SKK Tanpa Bingung:"),
  );
  if (!ladderEbook) {
    throw new Error("Blueprint Sales Ladder tidak memiliki node L1 SBU-SKK yang disetujui.");
  }
  const l1Label = ladderEbook.label;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('seed-sbu-skk-ebook-v1'))");

    await client.query(
      `INSERT INTO product_registry (
         product_id, name, slug, product_type, category, subcategory,
         short_description, long_description, target_users, features, benefits,
         product_url, price, currency, billing_type, status, version,
         engine_type, access_type, gaia_enabled, gaia_featured, gaia_status,
         visibility, standalone_enabled, subscription_enabled, dp_enabled,
         ai_enabled, usage_profile, storage_profile, scalev_variant_unique_id,
         updated_at
       ) VALUES (
         $1,$2,$3,'EBOOK','EBOOK','SBU_SKK',
         $4,$5,$6,$7::jsonb,$8::jsonb,
         '/ebook-sbu-skk',$9,'IDR','ONE_TIME','ACTIVE','1.0.0',
         'STATIC_ASSET','DOWNLOAD',false,false,'READY',
         'STANDALONE_ONLY',true,false,false,
         false,'[]'::jsonb,'PRIVATE_DATABASE_OBJECT',$10,
         now()
       )
       ON CONFLICT (product_id) DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         product_type = EXCLUDED.product_type,
         category = EXCLUDED.category,
         subcategory = EXCLUDED.subcategory,
         short_description = EXCLUDED.short_description,
         long_description = EXCLUDED.long_description,
         target_users = EXCLUDED.target_users,
         features = EXCLUDED.features,
         benefits = EXCLUDED.benefits,
         product_url = EXCLUDED.product_url,
         price = EXCLUDED.price,
         currency = EXCLUDED.currency,
         billing_type = EXCLUDED.billing_type,
         status = EXCLUDED.status,
         version = EXCLUDED.version,
         engine_type = EXCLUDED.engine_type,
         access_type = EXCLUDED.access_type,
         visibility = EXCLUDED.visibility,
         standalone_enabled = EXCLUDED.standalone_enabled,
         subscription_enabled = EXCLUDED.subscription_enabled,
         dp_enabled = EXCLUDED.dp_enabled,
         ai_enabled = EXCLUDED.ai_enabled,
         usage_profile = EXCLUDED.usage_profile,
         storage_profile = EXCLUDED.storage_profile,
         scalev_variant_unique_id = EXCLUDED.scalev_variant_unique_id,
         updated_at = now()`,
      [
        SBU_SKK_EBOOK.registryProductId,
        SBU_SKK_EBOOK.title,
        SBU_SKK_EBOOK.slug,
        SBU_SKK_EBOOK.subtitle,
        `${SBU_SKK_EBOOK.pages} halaman panduan praktis untuk memahami transisi regulasi dan menata pemenuhan persyaratan SBU-SKK.`,
        SBU_SKK_EBOOK.audience.join("; "),
        JSON.stringify([
          `${SBU_SKK_EBOOK.pages} halaman PDF`,
          "Akses otomatis setelah pembayaran terkonfirmasi",
          "Tautan akses aman berbasis token order",
        ]),
        JSON.stringify(SBU_SKK_EBOOK.benefits),
        SBU_SKK_EBOOK.amount,
        SBU_SKK_EBOOK.scalev.variantUniqueId,
      ],
    );

    const existingStore = await client.query<{ id: number }>(
      `SELECT id
         FROM store_products
        WHERE lower(name) = lower($1) OR scalev_variant_id = $2
        ORDER BY id
        FOR UPDATE`,
      [SBU_SKK_EBOOK.title, SBU_SKK_EBOOK.scalev.variantId],
    );
    if (existingStore.rowCount && existingStore.rowCount > 1) {
      throw new Error(`Ditemukan ${existingStore.rowCount} store product dengan nama SBU-SKK yang sama.`);
    }

    const storeValues = [
      SBU_SKK_EBOOK.title,
      `${SBU_SKK_EBOOK.subtitle}. PDF ${SBU_SKK_EBOOK.pages} halaman, dikirim otomatis setelah pembayaran terkonfirmasi.`,
      SBU_SKK_EBOOK.amount,
      JSON.stringify(SBU_SKK_EBOOK.benefits),
      checkoutUrl,
      SBU_SKK_EBOOK.scalev.variantId,
      SBU_SKK_EBOOK.title,
      PRIVATE_DOWNLOAD_PATH,
    ];

    if (existingStore.rows[0]) {
      await client.query(
        `UPDATE store_products SET
           name=$1, description=$2, category='Ebook', price=$3, features=$4::jsonb,
           emoji='📕', color='#c2410c', is_active=true, is_gustafta=true,
           sort_order=10, payment_url=$5, scalev_variant_id=$6,
           scalev_product_name=$7, price_override=$3, download_path=$8
         WHERE id=$9`,
        [...storeValues, existingStore.rows[0].id],
      );
    } else {
      await client.query(
        `INSERT INTO store_products (
           name, description, category, price, features, emoji, color,
           is_active, is_gustafta, sort_order, payment_url, scalev_variant_id,
           scalev_product_name, price_override, download_path
         ) VALUES (
           $1,$2,'Ebook',$3,$4::jsonb,'📕','#c2410c',
           true,true,10,$5,$6,$7,$3,$8
         )`,
        storeValues,
      );
    }

    await client.query(
      `INSERT INTO digital_product_files (
         product_registry_id, storage_key, file_name, mime_type,
         size_bytes, sha256, content, updated_at
       ) VALUES ($1,$2,$3,'application/pdf',$4,$5,$6,now())
       ON CONFLICT (product_registry_id) DO UPDATE SET
         storage_key=EXCLUDED.storage_key,
         file_name=EXCLUDED.file_name,
         mime_type=EXCLUDED.mime_type,
         size_bytes=EXCLUDED.size_bytes,
         sha256=EXCLUDED.sha256,
         content=CASE
           WHEN digital_product_files.sha256 IS DISTINCT FROM EXCLUDED.sha256
             THEN EXCLUDED.content
           ELSE digital_product_files.content
         END,
         updated_at=now()`,
      [
        SBU_SKK_EBOOK.registryProductId,
        storageKey,
        PRIVATE_FILE_NAME,
        pdf.length,
        sha256,
        pdf,
      ],
    );

    await client.query(
      `LOCK TABLE sales_ladders, sales_ladder_nodes, sales_ladder_edges
       IN SHARE ROW EXCLUSIVE MODE`,
    );
    const targetNodes = await client.query<{ id: number; node_type: string; product_registry_id: string | null }>(
      `SELECT n.id, n.node_type, n.product_registry_id
         FROM sales_ladder_nodes n
         JOIN sales_ladders l ON l.id = n.ladder_id
        WHERE l.slug = 'contractor-sbu-readiness'
          AND n.stage = 'L1'
          AND (
            n.product_registry_id = $1
            OR (n.node_type = 'PLACEHOLDER' AND n.label = $2)
          )
        ORDER BY n.id
        FOR UPDATE OF n`,
      [SBU_SKK_EBOOK.registryProductId, l1Label],
    );
    if (targetNodes.rowCount !== 1) {
      throw new Error(`Node L1 SBU-SKK harus tepat satu; ditemukan ${targetNodes.rowCount}.`);
    }
    await client.query(
      `UPDATE sales_ladder_nodes
          SET node_type='PRODUCT',
              product_registry_id=$1,
              package_registry_id=NULL,
              label=$2,
              description=$3,
              updated_at=now()
        WHERE id=$4`,
      [
        SBU_SKK_EBOOK.registryProductId,
        l1Label,
        ladderEbook.description,
        targetNodes.rows[0].id,
      ],
    );

    const ladderState = await client.query<{
      l1_count: string;
      linked_count: string;
      placeholder_count: string;
    }>(
      `SELECT
         count(*) FILTER (WHERE n.stage='L1')::text AS l1_count,
         count(*) FILTER (
           WHERE n.stage='L1' AND n.node_type='PRODUCT' AND n.product_registry_id=$1
         )::text AS linked_count,
         count(*) FILTER (
           WHERE n.stage='L1' AND n.node_type='PLACEHOLDER'
             AND n.product_registry_id IS NULL AND n.package_registry_id IS NULL
         )::text AS placeholder_count
       FROM sales_ladder_nodes n
       JOIN sales_ladders l ON l.id=n.ladder_id
       WHERE l.slug='contractor-sbu-readiness'`,
      [SBU_SKK_EBOOK.registryProductId],
    );
    const state = ladderState.rows[0];
    if (state.l1_count !== "5" || state.linked_count !== "1" || state.placeholder_count !== "4") {
      throw new Error(
        `Sales Ladder tidak sesuai setelah mapping (L1=${state.l1_count}, linked=${state.linked_count}, placeholder=${state.placeholder_count}).`,
      );
    }

    await client.query("COMMIT");
    console.log(
      `${new Date().toLocaleTimeString()} [Seed SBU-SKK Ebook] ready — Registry, Store, private PDF, and Sales Ladder linked`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}