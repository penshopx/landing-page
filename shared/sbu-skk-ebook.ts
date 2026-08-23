/**
 * Canonical, non-secret commercial metadata for SBU & SKK Tanpa Bingung.
 * Server-only fulfillment paths deliberately do not belong in this module
 * because this object is also bundled by the public React application.
 */
export const SBU_SKK_EBOOK = {
  registryProductId: "GST-EBOOK-SBU-SKK-001",
  slug: "sbu-skk-tanpa-bingung",
  scalevCheckoutSlug: "sbu-skk-tanpa-bingung",
  title: "SBU & SKK Tanpa Bingung",
  subtitle: "Panduan Lengkap Pemenuhan Persyaratan Sertifikasi Konstruksi di Era Regulasi Baru PP 28/2025 dan Permen PU 06 Tahun 2025",
  priceLabel: "Rp149.000",
  amount: 149000,
  pages: 264,
  toolkitPages: 29,
  totalPackagePages: 293,
  audience: [
    "Pemilik dan manajemen BUJK",
    "Administrator SBU-SKK",
    "Profesional konstruksi",
    "Konsultan dan biro jasa",
  ],
  benefits: [
    "Memahami arah transisi regulasi dan dampaknya bagi pengelolaan SBU-SKK.",
    "Menata persyaratan serta dokumen agar proses kerja lebih terarah.",
    "Mengurangi langkah prosedural yang keliru sebelum pengajuan atau pembaruan.",
    "Menggunakan Lampiran Toolkit 29 halaman sebagai pendamping kerja praktis.",
    "Memilih satu bonus diagnosis Level 1: Cek Kesiapan SBU atau Cek Kesiapan SKK.",
  ],
  scalev: {
    productId: 445696,
    variantId: 575747,
    variantUniqueId: "variant_z1bntA9UQICWphw-ikHv8ucN",
  },
} as const;

export type SbuSkkEbook = typeof SBU_SKK_EBOOK;

/**
 * Canonical public links for the external tools used in the SBU/SKK renewal
 * journey. Keeping them here prevents landing-page copy and URLs from drifting.
 */
export const SBU_SKK_RENEWAL_HUB = {
  sbu: [
    {
      id: "lkut-readiness",
      step: "01",
      title: "Cek Kesiapan LKUT",
      description: "Nilai kesiapan profil, keuangan, organisasi, dan kinerja sebelum menyusun laporan.",
      href: "https://asset-linker-esterkristian26.replit.app/",
    },
    {
      id: "lkut-report",
      step: "02",
      title: "Susun & Laporkan LKUT",
      description: "Masuk ke aplikasi LKUT untuk membantu menyiapkan laporan kegiatan usaha tahunan.",
      href: "https://konstruksi-laporan-tahunan.replit.app/landing-page/",
    },
    {
      id: "smap-pub",
      step: "03",
      title: "Siapkan SMAP & PUB",
      description: "Gunakan Compliance Hub untuk membantu menata dokumen SMAP dan PUB yang relevan.",
      href: "https://compliance-document-creator-2-Esterkristian26.replit.app",
    },
  ],
  skk: {
    id: "executive-summary-skk",
    step: "01",
    title: "Executive Summary SKK",
    description: "Susun ringkasan eksekutif sebagai bahan kerja untuk proses pembaruan SKK.",
    href: "https://exum.dokumenproyek.com/",
  },
  annualOss: {
    id: "lkpm-oss",
    title: "Laporan LKPM",
    description: "Sampaikan Laporan Kegiatan Penanaman Modal sebagai bagian dari kewajiban pelaporan OSS tahunan.",
    href: "https://lkpm.dokumenproyek.com/",
  },
} as const;

export type SbuSkkRenewalHub = typeof SBU_SKK_RENEWAL_HUB;

/**
 * Canonical public metadata for the complete SBU-SKK funnel. Private asset
 * paths and provider credentials deliberately stay server-only.
 */
export const SBU_SKK_FUNNEL = {
  readiness: {
    title: "Cek Kesiapan SBU",
    landingPath: "/cek-kesiapan-sbu",
  },
  miniEbook: {
    assetSlug: "mini-ebook-sbu-skk",
    title: "Mini Ebook SBU-SKK Tanpa Bingung",
    subtitle: "Ringkasan 20 halaman untuk mengenali peta masalah sebelum masuk ke panduan lengkap.",
    pages: 20,
    priceLabel: "GRATIS",
    accessDays: 30,
    landingPath: "/mini-ebook-sbu-skk",
  },
  tutor: {
    registryProductId: "GST-AI-TUTOR-SBU-SKK-030",
    slug: "tutor-ai-sbu-skk-30-hari",
    entitlementKey: "sbu-skk-tutor-30d",
    agentSlug: "sbu-skk-tutor",
    title: "Tutor AI SBU-SKK 30 Hari",
    durationDays: 30,
    quotaTotal: 100,
    addOnAmount: 100000,
    addOnPriceLabel: "Rp100.000",
    landingPath: "/tutor-ai-sbu-skk",
  },
  bundle: {
    registryProductId: "GST-BUNDLE-SBU-SKK-001",
    slug: "ebook-toolkit-tutor-sbu-skk",
    title: "Ebook + Toolkit + Tutor AI 30 Hari",
    amount: 249000,
    priceLabel: "Rp249.000",
    landingPath: "/ebook-sbu-skk",
  },
  aiSpecialist: {
    registryProductId: "GST-AIS-SBU-SKK-001",
    slug: "ai-specialist-sbu-skk",
    entitlementKey: "sbu-skk-ai-specialist",
    agentSlug: "sbuclaw-orchestrator",
    title: "AI Specialist SBU-SKK",
    licenseAmount: 1299000,
    licensePriceLabel: "Rp1.299.000",
    hostingMonthlyAmount: 399000,
    hostingMonthlyLabel: "mulai Rp399.000/bulan",
    landingPath: "/sbu-claw",
  },
} as const;

export type SbuSkkFunnel = typeof SBU_SKK_FUNNEL;