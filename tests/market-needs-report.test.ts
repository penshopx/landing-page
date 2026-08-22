import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractMarketEvidence,
  toPrivacySafeCountLabel,
  validateAndResolveMarketReport,
  type EligibleProduct,
  type MarketEvidence,
} from "../server/lib/market-needs-report";

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesSrc = readFileSync(resolve(__dirname, "../server/routes.ts"), "utf8");
const dashboardSrc = readFileSync(resolve(__dirname, "../client/src/pages/dashboard.tsx"), "utf8");
const reportModuleSrc = readFileSync(resolve(__dirname, "../server/lib/market-needs-report.ts"), "utf8");
const migrationSrc = readFileSync(resolve(__dirname, "../migrations/0018_market_needs_reports.sql"), "utf8");
const migrationJournal = readFileSync(resolve(__dirname, "../migrations/meta/_journal.json"), "utf8");

function routeBlock(registrationLiteral: string): string {
  const start = routesSrc.indexOf(registrationLiteral);
  assert.notEqual(start, -1, `Route tidak ditemukan: ${registrationLiteral}`);
  const next = routesSrc.indexOf("\n  app.", start + registrationLiteral.length);
  return routesSrc.slice(start, next === -1 ? start + 4000 : next);
}

const canonicalProduct: EligibleProduct = {
  id: "GST-AI-001",
  source: "registry",
  name: "AI Specialist Tender",
  productType: "AI_SPECIALIST",
  category: "Konstruksi",
  description: "Membantu persiapan dokumen tender.",
  targetUsers: "Kontraktor",
  officialUrl: "/tender",
  price: 99000,
};

const evidence: MarketEvidence[] = [
  {
    id: "M1",
    kind: "market",
    title: "Tender konstruksi meningkat",
    summary: "Sinyal berita publik.",
    publisher: "Media Uji",
    url: "https://example.com/tender",
  },
  {
    id: "I1",
    kind: "internal",
    title: "Penggunaan agregat",
    summary: "10 event agregat tanpa isi percakapan.",
  },
];

function validRawReport(overrides: Record<string, unknown> = {}) {
  return {
    executiveSummary: "Ada peluang yang perlu ditinjau superadmin.",
    marketSignals: [{
      title: "Tender",
      summary: "Sinyal awal.",
      evidenceIds: ["M1"],
    }],
    recommendations: [{
      decision: "promote",
      need: "Persiapan tender",
      segment: "Kontraktor",
      productId: canonicalProduct.id,
      rationale: "Produk resmi cocok dengan sinyal pasar.",
      confidence: "high",
      evidenceIds: ["M1", "I1"],
      suggestedMessage: "Coba chatbot tender untuk membantu persiapan.",
      suggestedChannels: ["WhatsApp"],
      durationDays: 7,
    }],
    caveats: [],
    ...overrides,
  };
}

test("semua endpoint monitoring dan sweep dibatasi requireSuperAdmin", () => {
  for (const literal of [
    'app.post("/api/research/sweep"',
    'app.get("/api/marketing-team/overview"',
    'app.get("/api/marketing-team/opportunity-reports"',
  ]) {
    assert.match(routeBlock(literal), /requireSuperAdmin/);
  }
  assert.match(
    dashboardSrc,
    /adminMe\?\.isSuperAdmin === true[\s\S]*?href="\/monitor-marketing"/,
    "Kartu dashboard monitoring hanya boleh terlihat untuk superadmin.",
  );
});

test("rekomendasi produk memakai data katalog kanonik dan istilah customer-facing", () => {
  const payload = validateAndResolveMarketReport(
    validRawReport(),
    [canonicalProduct],
    evidence,
    "2026-08-22T00:00:00.000Z",
  );
  const recommendation = payload.recommendations[0];
  assert.equal(recommendation.decision, "promote");
  assert.deepEqual(recommendation.product, canonicalProduct);
  assert.equal(recommendation.product?.officialUrl, "/tender");
  assert.doesNotMatch(recommendation.suggestedMessage, /chatbot/i);
  assert.match(recommendation.suggestedMessage, /AI Specialist/);
});

test("nama, harga, dan tautan produk dalam narasi model tidak pernah dipersistenkan", () => {
  const hallucinated = validRawReport({
    executiveSummary: "Gunakan Produk Tender Sakti seharga Rp 7.500.000 di https://palsu.example/checkout.",
    marketSignals: [{
      title: "Solusi Tender Sakti",
      summary: "Platform Tender Sakti ditawarkan dengan harga IDR 8.000.000.",
      evidenceIds: ["M1"],
    }],
    recommendations: [{
      decision: "promote",
      need: "Persiapan tender melalui Aplikasi Tender Sakti",
      segment: "Kontraktor",
      productId: canonicalProduct.id,
      rationale: "Pilih TenderBot Pro, tersedia hanya 100 ribu di evil.example/checkout.",
      confidence: "high",
      evidenceIds: ["M1"],
      suggestedMessage: "Coba TenderBot Pro seharga Rp 9.000.000 di https://palsu.example.",
      suggestedChannels: ["WhatsApp"],
      durationDays: 7,
    }],
    caveats: ["Biaya Rp 9.000.000 dapat berubah di /harga-palsu."],
  });

  const payload = validateAndResolveMarketReport(
    hallucinated,
    [canonicalProduct],
    evidence,
    "2026-08-22T00:00:00.000Z",
  );
  const serialized = JSON.stringify({
    executiveSummary: payload.executiveSummary,
    marketSignals: payload.marketSignals,
    recommendationNarrative: payload.recommendations.map(({ product: _product, ...item }) => item),
    caveats: payload.caveats,
  });

  assert.doesNotMatch(serialized, /Tender Sakti|Tender Palsu|TenderBot Pro/i);
  assert.doesNotMatch(serialized, /100|ribu|evil\.example|7\.500\.000|8\.000\.000|9\.000\.000|palsu\.example|harga-palsu/i);
  assert.match(payload.recommendations[0].suggestedMessage, /AI Specialist Tender/);
  assert.match(payload.recommendations[0].suggestedMessage, /Rp\s*99\.000/);
  assert.match(payload.recommendations[0].suggestedMessage, /\/tender/);
});

test("productId fiktif diturunkan menjadi product gap dan confidence rendah", () => {
  const raw = validRawReport({
    recommendations: [{
      decision: "promote",
      need: "Kebutuhan yang belum punya solusi",
      segment: "Kontraktor",
      productId: "PRODUK-FIKTIF",
      rationale: "Model mencoba merujuk produk yang tidak ada.",
      confidence: "high",
      evidenceIds: ["M1"],
      suggestedMessage: "",
      suggestedChannels: [],
      durationDays: 7,
    }],
  });
  const payload = validateAndResolveMarketReport(
    raw,
    [canonicalProduct],
    evidence,
    "2026-08-22T00:00:00.000Z",
  );
  assert.equal(payload.recommendations[0].decision, "product_gap");
  assert.equal(payload.recommendations[0].confidence, "low");
  assert.equal(payload.recommendations[0].product, null);
});

test("evidence ID yang tidak dikenal dibuang dan tidak boleh mendukung confidence tinggi", () => {
  const raw = validRawReport({
    recommendations: [{
      decision: "monitor",
      need: "Persiapan tender",
      segment: "Kontraktor",
      productId: canonicalProduct.id,
      rationale: "Bukti belum cukup.",
      confidence: "high",
      evidenceIds: ["M999"],
      suggestedMessage: "",
      suggestedChannels: [],
      durationDays: null,
    }],
  });
  const payload = validateAndResolveMarketReport(
    raw,
    [canonicalProduct],
    evidence,
    "2026-08-22T00:00:00.000Z",
  );
  assert.deepEqual(payload.recommendations[0].evidenceIds, []);
  assert.equal(payload.recommendations[0].confidence, "low");
});

test("durasi nol dari model dinormalisasi menjadi tanpa durasi kampanye", () => {
  const raw = validRawReport({
    recommendations: [{
      decision: "product_gap",
      need: "Kebutuhan baru",
      segment: "Lintas sektor",
      productId: null,
      rationale: "Belum ada produk resmi.",
      confidence: "medium",
      evidenceIds: ["M1"],
      suggestedMessage: "",
      suggestedChannels: [],
      durationDays: 0,
    }],
  });
  const payload = validateAndResolveMarketReport(
    raw,
    [canonicalProduct],
    evidence,
    "2026-08-22T00:00:00.000Z",
  );
  assert.equal(payload.recommendations[0].durationDays, null);
});

test("sinyal internal kecil disembunyikan dan hitungan lain dibucket", () => {
  assert.equal(toPrivacySafeCountLabel(0), null);
  assert.equal(toPrivacySafeCountLabel(1), null);
  assert.equal(toPrivacySafeCountLabel(2), null);
  assert.equal(toPrivacySafeCountLabel(3), "3–4");
  assert.equal(toPrivacySafeCountLabel(9), "5–9");
  assert.equal(toPrivacySafeCountLabel(42), "20–49");
  assert.equal(toPrivacySafeCountLabel(800), "500+");
});

test("parser bukti hanya mengambil metadata berita publik yang terstruktur", () => {
  const parsed = extractMarketEvidence({
    "riset-lokal": `FEED RISET — Lokal
## Topik: tender konstruksi
1. Aturan tender terbaru
   Sumber: Media Resmi | Sabtu, 22 Agustus 2026
   Ringkas: Pemerintah memperbarui pedoman tender.
   Tautan: https://example.com/aturan
`,
  });
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].kind, "market");
  assert.equal(parsed[0].publisher, "Media Resmi");
  assert.equal(parsed[0].url, "https://example.com/aturan");
  assert.equal(parsed[0].summary, "Pemerintah memperbarui pedoman tender.");
});

test("query agregat tidak membaca isi chat, metadata analytics, atau identitas pelanggan", () => {
  assert.doesNotMatch(reportModuleSrc, /FROM\s+agent_messages/i);
  assert.doesNotMatch(reportModuleSrc, /SELECT[\s\S]{0,200}\bmetadata\b/i);
  assert.doesNotMatch(reportModuleSrc, /customer_(?:email|phone|name)/i);
  assert.match(reportModuleSrc, /COUNT\(\*\)/);
  assert.match(reportModuleSrc, /tidak memuat identitas pelanggan/i);
});

test("setiap run laporan immutable dan migration terdaftar", () => {
  assert.doesNotMatch(reportModuleSrc, /ON\s+CONFLICT\s*\(\s*report_date\s*\)/i);
  assert.doesNotMatch(reportModuleSrc, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+market_needs_reports/i);
  assert.match(migrationSrc, /CREATE TABLE IF NOT EXISTS "market_needs_reports"/);
  assert.match(migrationSrc, /DROP CONSTRAINT IF EXISTS "market_needs_reports_report_date_key"/);
  assert.match(migrationSrc, /market_needs_reports_report_date_idx/);
  assert.match(migrationJournal, /"tag": "0018_market_needs_reports"/);
});
