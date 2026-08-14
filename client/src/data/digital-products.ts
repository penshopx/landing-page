// ============================================================
// RAK DIGITAL — Ebook & Toolkit
// Satu-satunya sumber data untuk halaman /ebook-toolkit.
// Produk digital baru cukup ditambahkan di sini — kartunya
// otomatis muncul di rak. Harga JANGAN di-hardcode di halaman;
// ambil dari client/src/data/pricing.ts bila berbayar.
// ============================================================
import { CASHFLOW_EBOOK } from "@/data/pricing";

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
};

export const DIGITAL_PRODUCTS: DigitalProduct[] = [
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
  },
  {
    slug: "mini-ebook-kas-merah",
    jenis: "ebook",
    judul: "Mini-Ebook: 3 Kesalahan Kas Kontraktor",
    subjudul: "Versi ringkas 14 halaman — pengantar sistem KAS MERAH, RAB HIJAU",
    deskripsi:
      "Kenali 3 kesalahan pengelolaan kas yang paling sering mematikan kontraktor pemerintah — dan gambaran besar sistem 3 lapis untuk mencegahnya. Bisa langsung diunduh.",
    hargaLabel: "GRATIS",
    gratis: true,
    tier: "lead",
    href: "/ebook-kas-merah",
    downloadHref: "/ebooks/kas-merah-mini-ebook.pdf",
    lini: "CASHFLOW-PBJ",
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
