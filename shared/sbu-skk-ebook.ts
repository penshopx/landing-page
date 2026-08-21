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
  pages: 265,
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
  ],
  scalev: {
    productId: 445696,
    variantId: 575747,
    variantUniqueId: "variant_z1bntA9UQICWphw-ikHv8ucN",
  },
} as const;

export type SbuSkkEbook = typeof SBU_SKK_EBOOK;