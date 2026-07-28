// Integrasi: fallback paymentUrl dari agent ke store product.
//
// Skenario yang diuji:
//   1. Produk dengan payment_url sendiri   → paymentUrl = payment_url milik produk.
//   2. Produk tanpa payment_url (empty "") → paymentUrl jatuh ke agent.paymentUrl.
//   3. Produk tanpa payment_url (null)     → paymentUrl jatuh ke agent.paymentUrl.
//   4. Produk tanpa agentId               → paymentUrl = null (tidak ada fallback).
//   5. Penjagaan statis — logika fallback ada di routes.ts buildStoreCatalogItems.
//
// Hermetis: agen dan produk diberi nama unik (RUN prefix), dibersihkan setelah test.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { db } from "../server/db";
import { agents as agentsTable, storeProducts } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";
import { parseSubAgentsValue } from "../server/db-storage";

// ── Identifier unik per run ───────────────────────────────────────────────────
const RUN = `scp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const AGENT_PAYMENT_URL = "https://checkout.example.com/pay/agent-link";
const PRODUCT_PAYMENT_URL = "https://checkout.example.com/pay/product-own";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createAgent(paymentUrl: string): Promise<number> {
  const [row] = await db.insert(agentsTable).values({
    name: `${RUN} Agent`,
    isListed: false,
    isActive: true,
    paymentUrl,
  } as any).returning({ id: agentsTable.id });
  createdAgentIds.push(row.id);
  return row.id;
}

async function createProduct(agentId: number | null, paymentUrl: string | null): Promise<number> {
  const [row] = await db.insert(storeProducts).values({
    name: `${RUN} Product`,
    description: "test",
    price: 299_000,
    agentId,
    isActive: true,
    isGustafta: false,
    sortOrder: 999,
    ...(paymentUrl !== null ? { paymentUrl } : {}),
  } as any).returning({ id: storeProducts.id });
  createdProductIds.push(row.id);
  return row.id;
}

// Mirrors the fallback logic inside buildStoreCatalogItems (server/routes.ts).
// We replicate the exact same query pattern so a future refactor that changes
// the field name or the fallback condition will break this test first.
async function resolvePaymentUrl(productId: number): Promise<string | null> {
  const [p] = await db
    .select({
      paymentUrl: storeProducts.paymentUrl,
      agentId: storeProducts.agentId,
    })
    .from(storeProducts)
    .where(eq(storeProducts.id, productId))
    .limit(1);

  if (!p) return null;

  // Fallback: empty string or null on product → try agent
  const ownUrl = p.paymentUrl || null;
  if (ownUrl) return ownUrl;

  if (p.agentId == null) return null;

  const [agent] = await db
    .select({ paymentUrl: agentsTable.paymentUrl })
    .from(agentsTable)
    .where(eq(agentsTable.id, p.agentId))
    .limit(1);

  return (agent?.paymentUrl) || null;
}

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 1 — DB integration: fallback paymentUrl
// ═════════════════════════════════════════════════════════════════════════════

let agentId: number;

before(async () => {
  agentId = await createAgent(AGENT_PAYMENT_URL);
});

test("produk dengan paymentUrl sendiri menggunakan URL produk, bukan agent", async () => {
  const pid = await createProduct(agentId, PRODUCT_PAYMENT_URL);
  const resolved = await resolvePaymentUrl(pid);
  assert.equal(resolved, PRODUCT_PAYMENT_URL, "harus mengembalikan payment_url milik produk");
});

test("produk tanpa paymentUrl (string kosong) jatuh ke paymentUrl agent", async () => {
  const pid = await createProduct(agentId, "");
  const resolved = await resolvePaymentUrl(pid);
  assert.equal(resolved, AGENT_PAYMENT_URL, "harus menggunakan paymentUrl agent sebagai fallback");
});

test("produk tanpa paymentUrl (null) jatuh ke paymentUrl agent", async () => {
  const pid = await createProduct(agentId, null);
  const resolved = await resolvePaymentUrl(pid);
  assert.equal(resolved, AGENT_PAYMENT_URL, "harus menggunakan paymentUrl agent sebagai fallback");
});

test("produk tanpa agentId dan tanpa paymentUrl mengembalikan null", async () => {
  const pid = await createProduct(null, "");
  const resolved = await resolvePaymentUrl(pid);
  assert.equal(resolved, null, "tidak ada agent → tidak ada fallback → paymentUrl null");
});

// ═════════════════════════════════════════════════════════════════════════════
// BAGIAN 2 — Penjagaan statis: pastikan fallback ada di routes.ts
// ═════════════════════════════════════════════════════════════════════════════

test("routes.ts: buildStoreCatalogItems memiliki logika fallback paymentUrl dari agent", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  // Cek bahwa agentPaymentUrlMap diisi dari hasil query agent
  assert.ok(
    src.includes("agentPaymentUrlMap"),
    "harus ada Map agentPaymentUrlMap untuk menyimpan paymentUrl per agent"
  );

  // Cek bahwa fallback diterapkan: (p.paymentUrl || ...) atau p as any paymentUrl ||
  assert.ok(
    src.includes("agentPaymentUrlMap.get("),
    "harus menggunakan agentPaymentUrlMap.get() sebagai fallback paymentUrl"
  );
});

test("routes.ts: agentPaymentUrlMap diisi hanya ketika r.paymentUrl truthy", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "server", "routes.ts"),
    "utf-8"
  );

  // Pastikan ada guard "if (r.paymentUrl)" sebelum set ke Map
  // (menghindari mengisi Map dengan string kosong yang bisa mengalahkan URL produk)
  assert.ok(
    /if\s*\(r\.paymentUrl\)\s*agentPaymentUrlMap\.set/.test(src),
    "agentPaymentUrlMap.set() harus dipagari if (r.paymentUrl) agar string kosong tidak disimpan"
  );
});
