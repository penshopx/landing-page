/**
 * Seed: Store Products — Produk Unggulan Gustafta
 *
 * Seeder idempoten: tiap produk dicek berdasarkan `name` sebelum di-insert.
 * Aman dijalankan berulang kali tanpa duplikasi.
 *
 * Harga default: Rp 299.000 (lisensi hak pakai, sesuai model bisnis Gustafta).
 * Produk jasa premium / platform: Rp 999.000.
 */

import { db } from "./db";
import { storeProducts } from "@shared/schema";
import { eq } from "drizzle-orm";

function log(msg: string) {
  console.log(`${new Date().toLocaleTimeString()} [express] ${msg}`);
}

const LOG = "[Seed StoreProducts]";

interface ProductDef {
  name: string;
  description: string;
  category: string;
  price: number;
  features: string[];
  emoji: string;
  color: string;
  isGustafta: boolean;
  sortOrder: number;
}

const FLAGSHIP_PRODUCTS: ProductDef[] = [
  // ── 1. SBU Coach Pekerjaan Konstruksi ─────────────────────────────────────
  {
    name: "SBU Coach — Pekerjaan Konstruksi",
    description:
      "Panduan lengkap sertifikasi SBU Jasa Pekerjaan Konstruksi (Permen PU 6/2025). Cek subklasifikasi, persyaratan dokumen, PJBU/TKK, hingga perpanjangan — semua dalam satu AI coach.",
    category: "Konstruksi",
    price: 299_000,
    features: [
      "Klasifikasi SBU: BG, BS, IM, KO, KK, PL",
      "Panduan kualifikasi K1–K2–M1–M2–B",
      "Cek persyaratan PJBU, PJTBU, PJSKBU",
      "Analisis dokumen SMAP & peralatan",
      "Alur perpanjangan & perubahan SBU",
      "Berdasarkan Permen PU 6/2025 & SK Dirjen Binakon 37/2025",
    ],
    emoji: "🏗️",
    color: "#f59e0b",
    isGustafta: true,
    sortOrder: 1,
  },

  // ── 2. SBU Konsultan Coach ─────────────────────────────────────────────────
  {
    name: "SBU Coach — Jasa Konsultansi Konstruksi",
    description:
      "AI coach khusus SBU Jasa Konsultansi Konstruksi. Panduan klasifikasi KK001–KK007, analisis kualifikasi, dan proses perpanjangan berbasis regulasi terkini.",
    category: "Konstruksi",
    price: 299_000,
    features: [
      "Klasifikasi KK001–KK007 (perencanaan & pengawasan)",
      "Kualifikasi K–M–B konsultan konstruksi",
      "Persyaratan TKK & tenaga ahli",
      "Panduan LPJK & OSS sertifikasi",
      "Simulasi checklist dokumen",
      "Update regulasi otomatis",
    ],
    emoji: "📐",
    color: "#3b82f6",
    isGustafta: true,
    sortOrder: 2,
  },

  // ── 3. TENDERA ─────────────────────────────────────────────────────────────
  {
    name: "TENDERA — AI Tender Intelligence",
    description:
      "Tim AI untuk memenangkan tender pengadaan pemerintah. Analisis dokumen lelang, susun penawaran kompetitif, cek TKDN, dan pantau peluang tender baru setiap hari.",
    category: "Tender",
    price: 299_000,
    features: [
      "Analisis dokumen tender & RKS otomatis",
      "Kalkulasi harga satuan & RAB cerdas",
      "Cek TKDN & persyaratan preferensi",
      "Penyusunan draft penawaran teknis",
      "Pantau LPSE & portal SIRUP",
      "Tim spesialis: Analis, Estimator, Legal, TKDN",
    ],
    emoji: "📋",
    color: "#10b981",
    isGustafta: true,
    sortOrder: 3,
  },

  // ── 4. LexCom — AI Hukum Konstruksi ───────────────────────────────────────
  {
    name: "LexCom — AI Spesialis Hukum Konstruksi",
    description:
      "Tim ahli hukum AI untuk perusahaan jasa konstruksi. Analisis kontrak, regulasi perizinan berusaha, K3, sengketa proyek, dan kepatuhan BUJK.",
    category: "Legal",
    price: 299_000,
    features: [
      "Analisis kontrak & klausula risiko",
      "Panduan perizinan BUJK (OSS/NIB/SBU)",
      "Regulasi K3 & SMK3 Konstruksi",
      "Penyelesaian sengketa & klaim proyek",
      "Kepatuhan UU Jasa Konstruksi No. 2/2017",
      "Tim spesialis: Kontrak, Perizinan, K3, Sengketa",
    ],
    emoji: "⚖️",
    color: "#6366f1",
    isGustafta: true,
    sortOrder: 4,
  },

  // ── 5. ISO 9001 Suite ──────────────────────────────────────────────────────
  {
    name: "ISO Coach — Manajemen Sistem (9001/14001/37001)",
    description:
      "AI coach untuk implementasi, audit, dan sertifikasi sistem manajemen ISO. Mencakup ISO 9001 (Mutu), ISO 14001 (Lingkungan), dan ISO 37001 (Anti-Penyuapan).",
    category: "Manajemen",
    price: 299_000,
    features: [
      "Gap analysis vs persyaratan ISO",
      "Template dokumen SOP & prosedur",
      "Panduan audit internal & kesiapan sertifikasi",
      "ISO 9001:2015 — Sistem Manajemen Mutu",
      "ISO 14001:2015 — Sistem Manajemen Lingkungan",
      "ISO 37001:2016 — Sistem Anti-Penyuapan (SMAP)",
    ],
    emoji: "🎯",
    color: "#0ea5e9",
    isGustafta: true,
    sortOrder: 5,
  },

  // ── 6. ASKOM Coach — Asesor Kompetensi ────────────────────────────────────
  {
    name: "Asesor Kompetensi — SKK Konstruksi",
    description:
      "AI assistant untuk asesor dan peserta uji kompetensi SKK Konstruksi. Panduan skema kompetensi, FR-APL, portofolio, dan simulasi wawancara asesmen.",
    category: "Sertifikasi",
    price: 299_000,
    features: [
      "Panduan 100+ skema SKK Konstruksi",
      "Panduan FR-APL 01 & FR-APL 02",
      "Simulasi pertanyaan wawancara kompetensi",
      "Cek unit kompetensi & elemen",
      "Alur sertifikasi LSP & LPJK",
      "Update SKKNI & skema terbaru",
    ],
    emoji: "🎓",
    color: "#8b5cf6",
    isGustafta: true,
    sortOrder: 6,
  },

  // ── 7. CivIlPro — BUJK Management Suite ───────────────────────────────────
  {
    name: "CivIlPro — Suite Manajemen BUJK",
    description:
      "Platform AI lengkap untuk manajemen operasional BUJK. Dari perencanaan proyek, analisis keuangan, hingga pelaporan kinerja — semua dalam satu ekosistem cerdas.",
    category: "Konstruksi",
    price: 299_000,
    features: [
      "Manajemen proyek & monitoring progres",
      "Analisis keuangan & cash flow proyek",
      "Pelaporan kinerja BUJK otomatis",
      "Manajemen sub-kontraktor & vendor",
      "Kontrol kualitas & K3 lapangan",
      "Dashboard eksekutif real-time",
    ],
    emoji: "🏢",
    color: "#ef4444",
    isGustafta: true,
    sortOrder: 7,
  },

  // ── 8. SBUClaw — Konsultan Cerdas SBU ─────────────────────────────────────
  {
    name: "SBUClaw — Konsultan Cerdas Multi-Spesialis",
    description:
      "Tim 10 AI spesialis SBU Konstruksi: Mapper, Qualify, Dokumen, Tenaga Ahli, SMAP, Keuangan, Timeline, Perubahan, Surveilans, dan Pencabutan. Solusi end-to-end.",
    category: "Konstruksi",
    price: 299_000,
    features: [
      "10 sub-spesialis SBU terintegrasi",
      "Pemetaan subklasifikasi & kualifikasi",
      "Analisis dokumen & kelengkapan",
      "Panduan tenaga ahli & PJBU",
      "Monitoring timeline & surveilans",
      "Berdasarkan Permen PU 6/2025",
    ],
    emoji: "🤖",
    color: "#f97316",
    isGustafta: true,
    sortOrder: 8,
  },

  // ── 9. Gustafta Pro — Akses Platform Penuh ────────────────────────────────
  {
    name: "Gustafta Pro — Platform AI Konstruksi Indonesia",
    description:
      "Akses penuh ke seluruh ekosistem AI Gustafta: SBU Coach, TENDERA, LexCom, ISO Suite, ASKOM, dan semua produk premium. Satu lisensi untuk seluruh kebutuhan BUJK.",
    category: "Bisnis",
    price: 999_000,
    features: [
      "Akses semua produk Gustafta (SBU, Tender, Legal, ISO)",
      "Priority support via WhatsApp",
      "Update produk & fitur baru tanpa biaya tambahan",
      "Onboarding & setup oleh tim Gustafta",
      "Multi-pengguna dalam satu lisensi perusahaan",
      "Konsultasi regulasi 30 menit/bulan",
    ],
    emoji: "⭐",
    color: "#d946ef",
    isGustafta: true,
    sortOrder: 0,
  },

  // ── 10. AI Organization Builder — Tim AI Konstruksi ───────────────────────
  {
    name: "AI Organization Builder — Tim Kerja AI",
    description:
      "Bangun tim AI khusus sesuai struktur organisasi perusahaan Anda. Rancang hierarki agen, atur alur kerja, dan otomasi proses bisnis tanpa perlu keahlian teknis.",
    category: "Bisnis",
    price: 999_000,
    features: [
      "Rancang tim AI multi-level (hierarki)",
      "Agen spesialis sesuai divisi perusahaan",
      "Otomasi alur kerja antar departemen",
      "Integrasi WhatsApp & kanal komunikasi",
      "Dashboard monitoring tim AI",
      "Konsultasi setup oleh tim Gustafta",
    ],
    emoji: "🏛️",
    color: "#0284c7",
    isGustafta: true,
    sortOrder: 9,
  },
];

export async function seedStoreProducts(): Promise<void> {
  log(`${LOG} Checking existing store products...`);

  // Fetch existing product names for idempotency check
  const existing = await db.select({ name: storeProducts.name }).from(storeProducts);
  const existingNames = new Set(existing.map((r) => r.name));

  let inserted = 0;
  let skipped = 0;

  for (const product of FLAGSHIP_PRODUCTS) {
    if (existingNames.has(product.name)) {
      skipped++;
      continue;
    }

    await db.insert(storeProducts).values({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      features: product.features,
      emoji: product.emoji,
      color: product.color,
      isGustafta: product.isGustafta,
      isActive: true,
      sortOrder: product.sortOrder,
    });
    inserted++;
    log(`${LOG} ✅ Created: ${product.name}`);
  }

  log(
    `${LOG} Done — inserted ${inserted} new product(s), skipped ${skipped} already-existing product(s).`
  );
}
