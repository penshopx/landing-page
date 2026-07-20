/**
 * Tambah 3 produk subscription bulanan Gustafta ke Scalev + simpan ke DB.
 * Jalankan: npx tsx scripts/scalev-register-subscription.ts
 */

import pg from "pg";
const { Pool } = pg;

const SCALEV_API_URL = "https://api.scalev.id/v2";
const apiKey = process.env.SCALEV_API_KEY;
const dbUrl  = process.env.DATABASE_URL;

if (!apiKey) { console.error("❌  SCALEV_API_KEY tidak ditemukan"); process.exit(1); }
if (!dbUrl)  { console.error("❌  DATABASE_URL tidak ditemukan");   process.exit(1); }

const pool = new Pool({ connectionString: dbUrl });

const products = [
  {
    name: "Gustafta Starter Bulanan",
    price: 199000,
    dbName: "Gustafta Starter Bulanan",
    type: "subscription",
    meta: { plan: "starter", durationDays: 30 },
  },
  {
    name: "Gustafta Profesional Bulanan",
    price: 499000,
    dbName: "Gustafta Profesional Bulanan",
    type: "subscription",
    meta: { plan: "profesional", durationDays: 30 },
  },
  {
    name: "Gustafta Bisnis Bulanan",
    price: 999000,
    dbName: "Gustafta Bisnis Bulanan",
    type: "subscription",
    meta: { plan: "bisnis", durationDays: 30 },
  },
] as const;

async function listScalevProducts(): Promise<Record<string, string>> {
  const res = await fetch(`${SCALEV_API_URL}/products?limit=100`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const json = await res.json() as any;
  if (!res.ok || json.code !== 200) return {};
  const map: Record<string, string> = {};
  for (const item of (json.data?.results ?? [])) {
    if (item?.name && item?.slug) map[item.name.toLowerCase()] = item.slug;
  }
  return map;
}

async function createScalevProduct(name: string, price: number) {
  const res = await fetch(`${SCALEV_API_URL}/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name, public_name: name, description: name,
      item_type: "digital", status: "active",
      variants: [{ name, price }],
    }),
  });
  const json = await res.json() as any;
  if (!res.ok || json.code !== 200)
    throw new Error(JSON.stringify(json?.error || json?.message || json));
  return { slug: json.data?.slug as string, id: json.data?.id as number };
}

async function main() {
  console.log("🚀  Mengambil produk yang sudah ada di Scalev...");
  const existing = await listScalevProducts();
  console.log(`   ${Object.keys(existing).length} produk ditemukan.\n`);

  for (const p of products) {
    process.stdout.write(`  • ${p.name.padEnd(34)}`);
    try {
      let slug: string;
      const existingSlug = existing[p.name.toLowerCase()];
      if (existingSlug) {
        slug = existingSlug;
        console.log(`🔄  SUDAH ADA  slug=${slug}`);
      } else {
        const result = await createScalevProduct(p.name, p.price);
        slug = result.slug;
        console.log(`✅  BARU  slug=${slug}  id=${result.id}`);
      }
      console.log(`          ↳ https://app.scalev.com/checkout/${slug}`);

      // Upsert ke DB
      const { rowCount } = await pool.query(
        `UPDATE scalev_mappings SET scalev_slug=$1, meta=$2 WHERE scalev_product_name=$3`,
        [slug, JSON.stringify(p.meta), p.dbName]
      );
      if ((rowCount ?? 0) === 0) {
        await pool.query(
          `INSERT INTO scalev_mappings (scalev_product_name, "type", scalev_slug, meta)
           VALUES ($1, $2, $3, $4)`,
          [p.dbName, p.type, slug, JSON.stringify(p.meta)]
        );
        console.log(`          ↳ DB: INSERT`);
      } else {
        console.log(`          ↳ DB: UPDATE`);
      }
    } catch (err: any) {
      console.log(`❌  ERROR: ${err.message}`);
    }
  }

  await pool.end();
  console.log("\n✅  Selesai.");
}

main().catch(e => { console.error(e); process.exit(1); });
