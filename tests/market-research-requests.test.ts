import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildResearchQueries,
  researchRequestInputSchema,
} from "../server/lib/market-research-requests";

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesSrc = readFileSync(resolve(__dirname, "../server/routes.ts"), "utf8");
const queueSrc = readFileSync(resolve(__dirname, "../server/lib/market-research-requests.ts"), "utf8");
const reportSrc = readFileSync(resolve(__dirname, "../server/lib/market-needs-report.ts"), "utf8");
const migrationSrc = readFileSync(resolve(__dirname, "../migrations/0019_market_research_requests.sql"), "utf8");
const migrationJournal = readFileSync(resolve(__dirname, "../migrations/meta/_journal.json"), "utf8");
const pageSrc = readFileSync(resolve(__dirname, "../client/src/pages/monitor-marketing.tsx"), "utf8");

function routeBlock(registrationLiteral: string): string {
  const start = routesSrc.indexOf(registrationLiteral);
  assert.notEqual(start, -1, `Route tidak ditemukan: ${registrationLiteral}`);
  const next = routesSrc.indexOf("\n  app.", start + registrationLiteral.length);
  return routesSrc.slice(start, next === -1 ? start + 5000 : next);
}

test("seluruh API riset khusus hanya dapat dipakai Super Admin", () => {
  for (const literal of [
    'app.get("/api/marketing-team/research-products"',
    'app.get("/api/marketing-team/research-requests"',
    'app.post("/api/marketing-team/research-requests"',
    'app.post("/api/marketing-team/research-requests/:id/retry"',
  ]) {
    const block = routeBlock(literal);
    assert.match(block, /isAuthenticated/);
    assert.match(block, /requireSuperAdmin/);
  }
});

test("brief divalidasi ketat dan query hanya dibangun untuk agregator berita publik", () => {
  const parsed = researchRequestInputSchema.safeParse({
    topic: "Tender konstruksi hijau",
    productId: "REG-1",
    objective: "Nilai apakah produk ini layak dipromosikan pada kontraktor kecil.",
    targetSegment: "Kontraktor kecil",
    marketScope: "Indonesia",
  });
  assert.equal(parsed.success, true);
  const invalid = researchRequestInputSchema.safeParse({
    topic: "x",
    objective: "pendek",
    targetSegment: "",
    marketScope: "I",
  });
  assert.equal(invalid.success, false);

  const queries = buildResearchQueries(parsed.success ? parsed.data : {
    topic: "", objective: "", targetSegment: "", marketScope: "",
  }, "AI Specialist Tender");
  assert.ok(queries.length >= 3);
  assert.ok(queries.every((query) => query.length <= 300));
  assert.match(queueSrc, /fetchGoogleNews/);
  assert.doesNotMatch(queueSrc, /agent_messages|conversation|customer_(?:email|phone|name)/i);
  assert.match(reportSrc, /input\.researchRequest[\s\S]{0,80}\? \[\][\s\S]{0,80}: await loadAggregateDemandEvidence/);
  assert.match(reportSrc, /Tidak ada isi chat, dokumen unggahan, identitas pelanggan, order, langganan/);
});

test("produk pilihan selalu divalidasi terhadap katalog kanonik server", () => {
  assert.match(queueSrc, /loadEligibleProducts\(\)/);
  assert.match(queueSrc, /PRODUCT_NOT_ELIGIBLE/);
  assert.match(reportSrc, /requested-product-not-evaluated/);
  assert.match(reportSrc, /payload\.recommendations\[0\]\?\.product\?\.id !== requestedProduct\.id/);
});

test("antrean persisten memakai lease atomik, pemulihan kedaluwarsa, dan final write bertoken", () => {
  assert.match(queueSrc, /FOR UPDATE SKIP LOCKED/);
  assert.match(queueSrc, /status = 'running' AND lease_expires_at < NOW\(\)/);
  assert.match(queueSrc, /randomUUID\(\)/);
  assert.match(queueSrc, /AND lease_token = \$2[\s\S]{0,100}AND lease_expires_at > NOW\(\)/);
  assert.match(queueSrc, /SET status = \$3::varchar/);
  assert.match(reportSrc, /r\.lease_expires_at > NOW\(\)/);
  assert.match(queueSrc, /reconcileCompletedRequests/);
  assert.match(queueSrc, /MAX_ACTIVE_REQUESTS/);
  assert.match(queueSrc, /market_research_worker_leader/);
  assert.match(queueSrc, /refreshWorkerLeadership\(\)/);
  assert.match(queueSrc, /NOT EXISTS \([\s\S]{0,160}active\.status = 'running'/);
});

test("retry menambah run baru dan laporan request disimpan immutable", () => {
  const retryBlock = routeBlock('app.post("/api/marketing-team/research-requests/:id/retry"');
  assert.match(retryBlock, /retryResearchRequest/);
  assert.match(queueSrc, /retryOfId/);
  assert.match(queueSrc, /INSERT INTO market_research_requests/);
  assert.doesNotMatch(queueSrc, /DELETE FROM market_(?:research_requests|needs_reports)/i);
  assert.doesNotMatch(reportSrc, /UPDATE\s+market_needs_reports/i);
  assert.match(reportSrc, /report_kind = 'daily'/);
  assert.match(reportSrc, /report_kind = 'requested'/);
});

test("migration durable terdaftar dan memiliki relasi laporan-permintaan", () => {
  assert.match(migrationSrc, /CREATE TABLE IF NOT EXISTS "market_research_requests"/);
  assert.match(migrationSrc, /CHECK \("status" IN \('queued', 'running', 'completed', 'failed'\)\)/);
  assert.match(migrationSrc, /ADD COLUMN IF NOT EXISTS "report_kind"/);
  assert.match(migrationSrc, /ADD COLUMN IF NOT EXISTS "research_request_id"/);
  assert.match(migrationSrc, /ON DELETE SET NULL/);
  assert.match(migrationSrc, /market_research_requests_status_created_idx/);
  assert.match(migrationJournal, /"tag": "0019_market_research_requests"/);
});

test("UI memakai seluruh endpoint tanpa jalur publikasi otomatis", () => {
  for (const endpoint of [
    "/api/marketing-team/research-products",
    "/api/marketing-team/research-requests",
    "/api/marketing-team/research-requests/${id}/retry",
  ]) {
    assert.ok(pageSrc.includes(endpoint), `UI belum memakai ${endpoint}`);
  }
  assert.match(pageSrc, /data-testid="research-request-form"/);
  assert.match(pageSrc, /data-testid=\{`research-request-row-\$\{request\.id\}`\}/);
  assert.match(pageSrc, /data-testid=\{`custom-report-\$\{request\.id\}`\}/);
  assert.match(pageSrc, /tidak pernah dipublikasikan otomatis/i);
  assert.doesNotMatch(pageSrc, /publishResearch|autoPublish/i);
});