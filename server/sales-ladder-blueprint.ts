export type ContractorL1Ebook = {
  label: string;
  description: string;
};

export const CONTRACTOR_L1_EBOOKS: readonly ContractorL1Ebook[] = [
  {
    label: "Panduan Praktis Sistem Manajemen Anti Penyuapan (SMAP) SNI ISO 37001:2016 dari Regulasi ke Implementasi",
    description: "Panduan implementasi Sistem Manajemen Anti Penyuapan berdasarkan SNI ISO 37001:2016",
  },
  {
    label: "Revolusi Penyusunan Dokumen SMAP, Memanfaatkan AI ChatGPT, Untuk Efisiensi dan Kemudahan",
    description: "Panduan efisiensi penyusunan dokumen SMAP dengan bantuan AI ChatGPT",
  },
  {
    label: "Kontraktor Anti Amnesia, BluePrint Membangun Business Memory Berbasis AI Untuk Industri Konstruksi",
    description: "Blueprint membangun Business Memory berbasis AI untuk industri konstruksi",
  },
  {
    label: "Trilogi Gustafta dari Dialog ke Monolog, Peluang Baru Membangun Tutor AI, Virtual Assistant, dan Tim Multi Agent, untuk Belajar, Bekerja, dan Berkarya",
    description: "Peluang membangun Tutor AI, Virtual Assistant, dan tim Multi Agent untuk belajar, bekerja, dan berkarya",
  },
  {
    label: "SBU & SKK Tanpa Bingung: Panduan Lengkap Pemenuhan Persyaratan Sertifikasi Konstruksi di Era Regulasi Baru PP 28/2025 dan Permen PU 06 Tahun 2025",
    description: "Panduan pemenuhan persyaratan SBU & SKK berdasarkan PP 28/2025 dan Permen PU 06 Tahun 2025",
  },
] as const;

export const CONTRACTOR_TRIGGER = {
  label: "Meta Ads Pain Touchpoint",
  description: "Calon kontraktor menemukan pain melalui iklan Meta Ads",
} as const;

export const CONTRACTOR_SBU_CLAW = {
  label: "SBU Claw",
  description: "AI specialist yang menganalisis kualifikasi SBU spesifik perusahaan kontraktor",
} as const;

export const LEGACY_CONTRACTOR_L1_NODES = [
  {
    label: "SBU & SKK Tanpa Bingung",
    description: "E-book panduan pengurus SBU & SKK untuk kontraktor pemula",
  },
  {
    label: "Bonus Produk Pendukung 1",
    description: "Produk bonus pelengkap bagi pembeli SBU & SKK ebook",
  },
  {
    label: "Bonus Produk Pendukung 2",
    description: "Produk bonus pelengkap bagi pembeli SBU & SKK ebook",
  },
  {
    label: "Bonus Produk Pendukung 3",
    description: "Produk bonus pelengkap bagi pembeli SBU & SKK ebook",
  },
] as const;

export const LEGACY_CONTRACTOR_BONUS_RULE =
  "Bonus gratis disertakan bersama pembelian SBU & SKK Tanpa Bingung";

export const CONTRACTOR_SBU_UPSELL_RULE =
  "Upgrade ke analisis AI spesifik SBU perusahaan Anda";