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
  subtitle: "Dari Regulasi ke Aksi: Panduan Praktis Transisi SBU-SKK Setelah PP 28/2025 dan Perubahan Permen PU 06/2021",
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
  ],
  scalev: {
    productId: 445696,
    variantId: 575747,
    variantUniqueId: "variant_z1bntA9UQICWphw-ikHv8ucN",
  },
} as const;

export type SbuSkkEbook = typeof SBU_SKK_EBOOK;

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