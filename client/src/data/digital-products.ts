// ============================================================
// RAK DIGITAL — Ebook & Toolkit
// Satu-satunya sumber data untuk halaman /ebook-toolkit.
// Produk digital baru cukup ditambahkan di sini — kartunya
// otomatis muncul di rak. Harga JANGAN di-hardcode di halaman;
// ambil dari client/src/data/pricing.ts bila berbayar.
// ============================================================
import { CASHFLOW_EBOOK } from "@/data/pricing";
import { SBU_SKK_EBOOK, SBU_SKK_FUNNEL } from "@/data/pricing";
import sbuSkkCover from "@assets/0_cover_Ebook_SBU-SKK_1787296306789.png";

export type DigitalProduct = {
  slug: string;
  jenis: "ebook" | "toolkit";
  /** Jenjang ebook: "lead" = pancingan gratis, "premium" = berbayar */
  tier?: "lead" | "premium";
  judul: string;
  subjudul: string;
  deskripsi: string;
  /** Label harga; "GRATIS" untuk produk gratis */
  hargaLabel: string;
  gratis: boolean;
  /** Halaman tujuan (halaman jual / halaman toolkit) */
  href: string;
  /** Bila gratis dan berupa file langsung, tautan unduh */
  downloadHref?: string;
  /** Lini produk, mis. "CASHFLOW-PBJ" */
  lini?: string;
  badge?: string;
  /** Baris bonus (ditampilkan menonjol di kartu), mis. bonus mini ebook */
  bonus?: string;
  /** Label tombol utama; default "Beli & Akses" (berbayar) / "Buka" (gratis) */
  ctaLabel?: string;
  /** Kalimat pengantar di atas judul (mis. "Belum siap membeli?") */
  preNote?: string;
  /** Official cover artwork, when a product has one. */
  cover?: string;
};

export const DIGITAL_PRODUCTS: DigitalProduct[] = [
  {
    slug: SBU_SKK_EBOOK.slug,
    jenis: "ebook",
    judul: SBU_SKK_EBOOK.title,
    subjudul: SBU_SKK_EBOOK.subtitle,
    deskripsi: "Panduan praktis 264 halaman + toolkit 29 halaman untuk membaca perubahan, menata persyaratan, dan bekerja lebih tertib dalam transisi SBU-SKK.",
    hargaLabel: SBU_SKK_EBOOK.priceLabel,
    gratis: false,
    tier: "premium",
    href: "/ebook-sbu-skk",
    lini: "REGULASI KONSTRUKSI",
    badge: "Panduan terbaru",
    ctaLabel: "Lihat panduan",
    cover: sbuSkkCover,
  },
  {
    slug: SBU_SKK_FUNNEL.miniEbook.assetSlug,
    jenis: "ebook",
    judul: SBU_SKK_FUNNEL.miniEbook.title,
    subjudul: SBU_SKK_FUNNEL.miniEbook.subtitle,
    deskripsi: "Ringkasan 20 halaman untuk mengenali peta masalah SBU-SKK sebelum masuk ke panduan lengkap.",
    hargaLabel: SBU_SKK_FUNNEL.miniEbook.priceLabel,
    gratis: true,
    tier: "lead",
    href: "/mini-ebook-sbu-skk",
    lini: "REGULASI KONSTRUKSI",
    badge: "Form akses",
    ctaLabel: "Isi formulir",
    preNote: "Mulai dari sini",
  },
  {
    slug: "ebook-kas-merah",
    jenis: "ebook",
    judul: CASHFLOW_EBOOK.judul,
    subjudul: CASHFLOW_EBOOK.subjudul,
    deskripsi:
      "Ebook lengkap 9 bab + 6 lampiran: Cash Triage Matrix, Termin Tracker 7-Titik, Buffer Protocol, 12 template surat & WhatsApp, checklist Zero-Defect, dan payung hukum pembayaran proyek pemerintah.",
    hargaLabel: CASHFLOW_EBOOK.hargaLabel,
    gratis: false,
    tier: "premium",
    href: "/ebook-kas-merah",
    lini: "CASHFLOW-PBJ",
    badge: "Terbaru",
    bonus: "BONUS: Mini-Ebook \u201c3 Kesalahan Kas Kontraktor\u201d GRATIS",
    ctaLabel: "Beli & Akses Ebook",
  },
  {
    slug: "mini-ebook-kas-merah",
    jenis: "ebook",
    judul: "Mini-Ebook: 3 Kesalahan Kas Kontraktor",
    subjudul: "PDF 14 halaman — kenali masalah cashflow sebelum kas benar-benar merah",
    deskripsi:
      "Kenali 3 kesalahan pengelolaan kas yang paling sering mematikan kontraktor pemerintah — dan gambaran besar sistem 3 lapis untuk mencegahnya. Bisa langsung diunduh.",
    hargaLabel: "GRATIS",
    gratis: true,
    tier: "lead",
    href: "/ebook-kas-merah",
    downloadHref: "/ebooks/kas-merah-mini-ebook.pdf",
    lini: "CASHFLOW-PBJ",
    preNote: "Belum siap membeli?",
  },
  {
    slug: "toolkit-cashflow",
    jenis: "toolkit",
    judul: "Toolkit CASHFLOW-PBJ",
    subjudul: "Template surat, tracker termin, dan kalkulator buffer — siap pakai",
    deskripsi:
      "Kumpulan alat kerja digital pendamping sistem CASHFLOW-PBJ: template surat resmi yang bisa langsung dicetak, tracker pembayaran, dan kalkulator penyangga kas.",
    hargaLabel: "GRATIS",
    gratis: true,
    href: "/toolkit-cashflow",
    lini: "CASHFLOW-PBJ",
  },
  {
    slug: "toolkit-utama",
    jenis: "toolkit",
    judul: "Toolkit Kontraktor Gustafta",
    subjudul: "Alat bantu harian: checklist, template dokumen, dan kalkulator",
    deskripsi:
      "Rak alat kerja umum untuk kontraktor dan biro jasa — checklist kelengkapan tender, template administrasi, dan alat hitung praktis.",
    hargaLabel: "GRATIS",
    gratis: true,
    href: "/toolkit",
  },
];
