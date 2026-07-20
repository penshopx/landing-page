/**
 * One-time script: buat semua produk Gustafta di Scalev, lalu simpan slugnya ke DB.
 * Jalankan: npx tsx scripts/scalev-register.ts
 */

import pg from "pg";

const { Pool } = pg;

const SCALEV_API_URL = "https://api.scalev.id/v2";
const apiKey = process.env.SCALEV_API_KEY;
const dbUrl  = process.env.DATABASE_URL;

if (!apiKey) { console.error("❌  SCALEV_API_KEY tidak ditemukan"); process.exit(1); }
if (!dbUrl)  { console.error("❌  DATABASE_URL tidak ditemukan");   process.exit(1); }

const pool = new Pool({ connectionString: dbUrl });

// ─── Daftar produk ────────────────────────────────────────────────────────────
const products = [
  { name: "Starter Kit Gustafta",     price: 245000,  dbName: "Starter Kit Gustafta",     type: "starter_kit",  meta: {} },
  { name: "Klinik Tender",            price: 999000,  dbName: "Klinik Tender",             type: "klinik",       meta: { key: "tender" } },
  { name: "Klinik SBU SKK",           price: 749000,  dbName: "Klinik SBU & SKK",          type: "klinik",       meta: { key: "sertifikasi" } },
  { name: "Klinik Legal",             price: 799000,  dbName: "Klinik Legal",              type: "klinik",       meta: { key: "hukum" } },
  { name: "Klinik Proyek",            price: 1499000, dbName: "Klinik Proyek",             type: "klinik",       meta: { key: "proyek" } },
  { name: "Klinik Perizinan",         price: 499000,  dbName: "Klinik Perizinan",          type: "klinik",       meta: { key: "perijinan" } },
  { name: "Klinik ISO",               price: 1299000, dbName: "Klinik ISO",                type: "klinik",       meta: { key: "iso" } },
  { name: "Ruang Simpan Esensial",    price: 29000,   dbName: "Ruang Simpan Esensial",     type: "storage_plan", meta: { plan: "esensial",    durationDays: 30 } },
  { name: "Ruang Simpan Profesional", price: 79000,   dbName: "Ruang Simpan Profesional",  type: "storage_plan", meta: { plan: "profesional", durationDays: 30 } },
  { name: "Kredit Pesan Pack S",      price: 49000,   dbName: "Kredit Pesan Pack S",       type: "credit",       meta: { credits: 500 } },
  { name: "Kredit Pesan Pack M",      price: 129000,  dbName: "Kredit Pesan Pack M",       type: "credit",       meta: { credits: 1500 } },
  { name: "Kredit Pesan Pack L",      price: 229000,  dbName: "Kredit Pesan Pack L",       type: "credit",       meta: { credits: 3000 } },
  { name: "Kredit Pesan Pack XL",     price: 349000,  dbName: "Kredit Pesan Pack XL",      type: "credit",       meta: { credits: 5000 } },
] as const;

async function createScalevProduct(name: string, price: number) {
  const body = {
    name,
    public_name: name,
    description: name,
    item_type: "digital",
    status: "active",
    variants: [{ name, price }],
  };
  const res = await fetch(`${SCALEV_API_URL}/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json() as any;
  if (!res.ok || json.code !== 200) {
    throw new Error(JSON.stringify(json?.error || json?.message || json));
  }
  return { slug: json.data?.slug as string, id: json.data?.id as number };
}

async function listScalevProducts(): Promise<Record<string, string>> {
  // Returns map of product name (lowercase) → slug
  const res = await fetch(`${SCALEV_API_URL}/products?limit=100`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const json = await res.json() as any;
  if (!res.ok || json.code !== 200) {
    console.warn("  ⚠️  Tidak bisa ambil daftar produk Scalev:", JSON.stringify(json));
    return {};
  }
  const map: Record<string, string> = {};
  for (const item of (json.data?.results ?? [])) {
    if (item?.name && item?.slug) {
      map[item.name.toLowerCase()] = item.slug;
    }
  }
  return map;
}

async function main() {
  console.log("🚀  Mengambil daftar produk yang sudah ada di Scalev...");
  const existing = await listScalevProducts();
  console.log(`   Ditemukan ${Object.keys(existing).length} produk di Scalev.\n`);

  for (const p of products) {
    process.stdout.write(`  • ${p.name.padEnd(34)}`);
    try {
      let slug: string;
      let scaId: number | undefined;

      const existingSlug = existing[p.name.toLowerCase()];
      if (existingSlug) {
        // Produk sudah ada — pakai slug yang lama
        slug = existingSlug;
        console.log(`🔄  SUDAH ADA  slug=${slug}`);
      } else {
        // Buat baru
        const result = await createScalevProduct(p.name, p.price);
        slug = result.slug;
        scaId = result.id;
        console.log(`✅  BARU  slug=${slug}  id=${scaId}`);
      }

      const checkoutUrl = `https://app.scalev.com/checkout/${slug}`;
      console.log(`          ↳ ${checkoutUrl}`);

      // Upsert ke DB (pakai scalev_product_name sebagai key unik)
      const { rowCount } = await pool.query(
        `UPDATE scalev_mappings
            SET scalev_slug = $1, meta = $2
          WHERE scalev_product_name = $3`,
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
        console.log(`          ↳ DB: UPDATE (${rowCount} baris)`);
      }

    } catch (err: any) {
      console.log(`❌  ERROR: ${err.message}`);
    }
  }

  await pool.end();
  console.log("\n✅  Selesai.");
}

main().catch(e => { console.error(e); process.exit(1); });
