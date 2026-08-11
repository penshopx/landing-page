/**
 * Task #313B-1 — Provisioning variant Scalev untuk item registry yang dijual.
 *
 * Idempotent RECONCILE (aman diulang):
 *   1. Ambil item sellable dari registry (product ACTIVE non-internal price>0;
 *      package ACTIVE dengan snapshot price>0).
 *   2. Cari produk Scalev existing via GET /v3/products?search=<nama> dan cocokkan
 *      variant.sku == registry id (SKU = kunci idempotensi, bukan nama).
 *   3. Bila belum ada → POST /v3/products (item_type digital, 1 variant,
 *      price dari registry/snapshot, sku = registry id).
 *   4. Simpan variant unique_id ke kolom scalev_variant_unique_id registry.
 *   5. Attach produk ke store (v2 POST /stores/{storeId}/products — TIDAK ada
 *      endpoint v3 untuk ini; tanpa attach, create order → "Variant does not exist").
 *   6. Verifikasi: GET /v3/stores/{store}/products memuat SKU tsb + harga cocok.
 *
 * TIDAK membuat order, TIDAK ada transaksi. Jalankan:
 *   npx tsx scripts/provision-scalev-variants.ts            (dry-run, baca saja)
 *   npx tsx scripts/provision-scalev-variants.ts --apply    (provision + simpan mapping)
 *   npx tsx scripts/provision-scalev-variants.ts --verify   (cek mapping vs store)
 */
import { db } from "../server/db";
import { productRegistry, packageRegistry, packageVersionSnapshots } from "../shared/schema";
import { eq, and } from "drizzle-orm";

const API = "https://api.scalev.com/v3";
const KEY = process.env.SCALEV_API_KEY;
const STORE = process.env.SCALEV_STORE_UNIQUE_ID;
if (!KEY || !STORE) { console.error("SCALEV_API_KEY / SCALEV_STORE_UNIQUE_ID belum diset."); process.exit(1); }

const MODE = process.argv.includes("--apply") ? "apply" : process.argv.includes("--verify") ? "verify" : "dry-run";

async function api(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${init?.method || "GET"} ${path} → HTTP ${res.status}: ${JSON.stringify(json)?.slice(0, 400)}`);
  return json;
}
// Respons v3 kadang dibungkus {data:...}, kadang langsung objek/array — normalisasi.
const unwrap = (j: any) => j?.data ?? j;
const asList = (j: any): any[] => { const d = unwrap(j); return Array.isArray(d) ? d : []; };

type Item = { kind: "product" | "package"; id: string; name: string; price: number; dbId: number; mapped: string | null };

/** Attach produk ke store via v2 (idempotent; wajib agar variant orderable). */
async function attachToStore(scalevProductId: number) {
  const stores = await api(`/stores/simplified?search=`); // v3 list utk dapatkan id numerik store
  const store = (asList(stores)).find((s: any) => s.unique_id === STORE);
  if (!store?.id) throw new Error(`Store ${STORE} tidak ditemukan di /v3/stores/simplified.`);
  const res = await fetch(`https://api.scalev.id/v2/stores/${store.id}/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ product_ids: [scalevProductId] }),
  });
  const json = await res.json().catch(() => null) as any;
  if (!res.ok || json?.code !== 200) throw new Error(`Attach product ${scalevProductId} ke store gagal: HTTP ${res.status} ${JSON.stringify(json)?.slice(0, 200)}`);
}

async function loadItems(): Promise<Item[]> {
  const items: Item[] = [];
  const prods = await db.select().from(productRegistry).where(eq(productRegistry.status, "ACTIVE"));
  for (const p of prods) {
    if (p.visibility === "INTERNAL_ONLY" || !p.price || p.price <= 0) continue;
    items.push({ kind: "product", id: p.productId, name: p.name, price: p.price, dbId: p.id, mapped: (p as any).scalevVariantUniqueId ?? null });
  }
  const pkgs = await db.select().from(packageRegistry).where(eq(packageRegistry.status, "ACTIVE"));
  for (const pkg of pkgs) {
    // Snapshot pada versi AKTIF (pkg.version) — sama persis dengan yang dijual
    // Order API (resolvePackage), BUKAN versi tertinggi.
    const snaps = await db.select().from(packageVersionSnapshots)
      .where(and(eq(packageVersionSnapshots.packageDbId, pkg.id), eq(packageVersionSnapshots.version, pkg.version)))
      .limit(1);
    const price = snaps[0]?.price ?? 0;
    if (!price || price <= 0) continue;
    items.push({ kind: "package", id: pkg.packageId, name: pkg.name, price, dbId: pkg.id, mapped: (pkg as any).scalevVariantUniqueId ?? null });
  }
  return items;
}

/** Cari variant Scalev existing by SKU (kunci idempotensi). */
async function findVariantBySku(sku: string, nameHint: string): Promise<{ variantUniqueId: string; price: number } | null> {
  for (const search of [sku, nameHint]) {
    const json = await api(`/products?search=${encodeURIComponent(search)}&page_size=25`);
    for (const prod of asList(json)) {
      const detail = unwrap(await api(`/products/${prod.id}`));
      for (const v of detail?.variants || []) {
        if (v.sku === sku && v.unique_id) return { variantUniqueId: String(v.unique_id), price: Number(v.price) };
      }
    }
  }
  return null;
}

async function createDigitalProduct(item: Item): Promise<{ variantUniqueId: string }> {
  const body = {
    name: item.name,
    public_name: item.name,
    item_type: "digital",
    is_multiple: false,
    description: `Gustafta ${item.kind === "package" ? "Paket Solusi" : "Produk"} — ${item.id}`,
    variants: [{ price: item.price, weight: 0, sku: item.id, is_checked: true }],
  };
  const json = await api(`/products`, { method: "POST", body: JSON.stringify(body) });
  const v = unwrap(json)?.variants?.[0];
  if (!v?.unique_id) throw new Error(`Create product '${item.id}': respons tanpa variant unique_id: ${JSON.stringify(json)?.slice(0, 300)}`);
  return { variantUniqueId: String(v.unique_id) };
}

async function saveMapping(item: Item, variantUniqueId: string) {
  if (item.kind === "product") {
    await db.update(productRegistry).set({ scalevVariantUniqueId: variantUniqueId } as any).where(eq(productRegistry.id, item.dbId));
  } else {
    await db.update(packageRegistry).set({ scalevVariantUniqueId: variantUniqueId } as any).where(eq(packageRegistry.id, item.dbId));
  }
}

async function verifyAgainstStore(items: Item[]) {
  // Kumpulkan semua produk yang terlihat store (paginate cursor sederhana).
  const bySku = new Map<string, { variantUniqueId: string; price: number; productName: string }>();
  let cursor: string | null = null;
  for (let page = 0; page < 20; page++) {
    const qs = cursor ? `?page_size=25&cursor=${encodeURIComponent(cursor)}` : `?page_size=25`;
    const json = await api(`/stores/${STORE}/products${qs}`);
    const list = asList(json);
    for (const prod of list) {
      const detail = unwrap(await api(`/products/${prod.id}`));
      for (const v of detail?.variants || []) {
        if (v.sku) bySku.set(String(v.sku), { variantUniqueId: String(v.unique_id), price: Number(v.price), productName: String(detail?.name || "") });
      }
    }
    cursor = json?.meta?.next_cursor || json?.next_cursor || null;
    if (!cursor || !list.length) break;
  }
  let ok = 0, fail = 0;
  for (const item of items) {
    const s = bySku.get(item.id);
    const good = !!s && !!item.mapped && s.variantUniqueId === item.mapped && s.price === item.price;
    console.log(`${good ? "✅" : "❌"} ${item.id} | registry=${item.mapped || "-"} | store=${s ? `${s.variantUniqueId} Rp${s.price}` : "TIDAK TERLIHAT DI STORE"} | harga registry=Rp${item.price}`);
    good ? ok++ : fail++;
  }
  console.log(`\nVerifikasi store: ${ok} OK, ${fail} gagal.`);
  if (fail > 0) process.exitCode = 1;
}

(async () => {
  const items = await loadItems();
  console.log(`Mode: ${MODE} — ${items.length} item sellable.\n`);

  if (MODE === "verify") { await verifyAgainstStore(items); process.exit(process.exitCode || 0); }

  for (const item of items) {
    if (!item.mapped) {
      const existing = await findVariantBySku(item.id, item.name);
      if (existing) {
        // FAIL-CLOSED: jangan pernah simpan mapping bila harga Scalev ≠ registry —
        // buyer bisa checkout dengan nominal salah (createScalevOrder tidak kirim harga).
        if (existing.price !== item.price) {
          throw new Error(`${item.id}: harga variant existing Rp${existing.price} ≠ registry Rp${item.price} — mapping TIDAK disimpan. Samakan harga di Scalev/registry dulu.`);
        }
        console.log(`~ ${item.id} sudah ada di Scalev (variant ${existing.variantUniqueId}, Rp${existing.price})${MODE === "apply" ? " → simpan mapping" : ""}`);
        if (MODE === "apply") { await saveMapping(item, existing.variantUniqueId); item.mapped = existing.variantUniqueId; }
      } else if (MODE === "apply") {
        const created = await createDigitalProduct(item);
        await saveMapping(item, created.variantUniqueId);
        item.mapped = created.variantUniqueId;
        console.log(`+ ${item.id} DIBUAT di Scalev → variant ${created.variantUniqueId} (Rp${item.price})`);
      } else {
        console.log(`+ ${item.id} AKAN dibuat (digital, Rp${item.price}, sku=${item.id})`);
        continue;
      }
    } else {
      console.log(`= ${item.id} sudah termapping: ${item.mapped}`);
    }
    // Pastikan produk ter-attach ke store (idempotent) — syarat create order.
    if (MODE === "apply" && item.mapped) {
      const v = unwrap(await api(`/variants/${item.mapped}`));
      if (!v?.product_id) throw new Error(`${item.id}: variant ${item.mapped} tidak resolve ke product_id.`);
      // FAIL-CLOSED juga untuk item yang SUDAH termapping: harga wajib cocok.
      if (Number(v.price) !== item.price) {
        throw new Error(`${item.id}: harga variant termapping Rp${v.price} ≠ registry Rp${item.price} — STOP sebelum attach. Rekonsiliasi harga dulu.`);
      }
      await attachToStore(Number(v.product_id));
      console.log(`  ↳ attached ke store (product ${v.product_id}, harga cocok Rp${item.price})`);
    }
  }
  console.log("\nSelesai.");
  process.exit(0);
})().catch((e) => { console.error("GAGAL:", e.message); process.exit(1); });
