/**
 * PRODUK — katalog pusat semua produk BERBAYAR Gustafta.
 * Aturan (keputusan Bos, Agu 2026):
 * - Hanya produk yang DIJUAL yang tampil di sini; yang gratis tidak.
 * - Kelompok mengikuti NAMA FITUR yang sudah dikenal konsumen,
 *   supaya dari katalog mereka tidak kehilangan jejak.
 * - Harga JANGAN hardcode — selalu dari client/src/data/pricing.ts.
 */
import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Bot, BookOpen, Stethoscope, Wallet, HardDrive,
  Wrench, Users, ExternalLink,
} from "lucide-react";
import {
  CASHFLOW_EBOOK, CASHFLOW_TIERS, KLINIK_DOKUMEN, RUANG_SIMPAN_PLANS,
  SERVICE_TIERS, formatIDR,
} from "@/data/pricing";

type Kelompok = {
  slug: string;
  nama: string;          // nama fitur yang dikenal konsumen
  icon: typeof Bot;
  warna: string;         // tailwind text-*
  bg: string;            // ikon bg
  ringkas: string;       // apa yang dijual di kelompok ini
  hargaMulai: string;
  href: string;
  cta: string;
  eksternal?: boolean;
  badge?: string;
};

const ruangSimpanBerbayar = RUANG_SIMPAN_PLANS.find((p) => p.amount > 0);

const KELOMPOK: Kelompok[] = [
  {
    slug: "produk-ai",
    nama: "Produk AI",
    icon: Bot,
    warna: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-600",
    ringkas: "AI Specialist siap pakai — asisten ahli SBU, SKK, tender, hukum, keuangan, dan puluhan bidang lain. Beli sekali lisensinya, langsung bekerja untuk Anda.",
    hargaMulai: "Lihat harga per produk di etalase",
    href: "/store",
    cta: "Buka Etalase Produk AI",
    badge: "Terlengkap",
  },
  {
    slug: "ebook",
    nama: "Ebook & Toolkit",
    icon: BookOpen,
    warna: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500",
    ringkas: `Ebook premium dari praktisi lapangan. Terbaru: ${CASHFLOW_EBOOK.judul} — ${CASHFLOW_EBOOK.subjudul.toLowerCase()}.`,
    hargaMulai: `Mulai ${CASHFLOW_EBOOK.hargaLabel}`,
    href: "/ebook-toolkit",
    cta: "Buka Rak Ebook & Toolkit",
    badge: "Baru",
  },
  {
    slug: "klinik",
    nama: "Klinik Konsultasi",
    icon: Stethoscope,
    warna: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-600",
    ringkas: "Konsultasi terarah + dokumen output siap pakai: sesi konsultasi, pembuatan dokumen teknis, dan paket tuntas (Tender, SBU & SKK, Legal, Proyek, Perizinan, ISO).",
    hargaMulai: `Mulai ${KLINIK_DOKUMEN[0].price}`,
    href: "/klinik-konsultasi",
    cta: "Lihat Layanan Klinik",
  },
  {
    slug: "cashflow-pbj",
    nama: "CASHFLOW-PBJ",
    icon: Wallet,
    warna: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-600",
    ringkas: "Paket langganan pengelolaan kas proyek pemerintah: toolkit lengkap + tim AI spesialis kas (SI KAS, SI BERKAS, dan kawan-kawan) yang mengawal termin Anda.",
    hargaMulai: `Mulai ${formatIDR(CASHFLOW_TIERS[0].perBulan)}/bulan`,
    href: "/cashflow-pbj",
    cta: "Lihat Paket CASHFLOW-PBJ",
  },
  {
    slug: "ruang-simpan",
    nama: "Ruang Simpan",
    icon: HardDrive,
    warna: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-600",
    ringkas: "Sewa lemari arsip digital yang bisa diajak bicara — dokumen perusahaan tersimpan aman, terbaca AI, dan siap jadi bahan di semua fitur Gustafta.",
    hargaMulai: ruangSimpanBerbayar ? `Mulai ${ruangSimpanBerbayar.perMonth}` : "Lihat paket",
    href: "/ruang-simpan",
    cta: "Lihat Paket Ruang Simpan",
  },
  {
    slug: "jasa-custom",
    nama: "Jasa Pembuatan AI Custom",
    icon: Wrench,
    warna: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-700",
    ringkas: "Tim Gustafta membangunkan asisten AI khusus untuk bisnis Anda — dari asisten FAQ sederhana sampai sistem agentic multi-domain, termasuk paket bisnis berlangganan.",
    hargaMulai: `Mulai ${SERVICE_TIERS[0].price}`,
    href: "/produk-builder",
    cta: "Lihat Paket & Jasa Custom",
  },
  {
    slug: "jasa-manusia",
    nama: "Jasa Layanan Manusia",
    icon: Users,
    warna: "text-teal-700 dark:text-teal-300",
    bg: "bg-teal-600",
    ringkas: "Pengurusan dokumen legal & keuangan yang dikerjakan tim manusia: NIB/OSS, SBU, SKK, ISO, dan perapian dokumen keuangan. Dilayani di situs saudara kami.",
    hargaMulai: "Konsultasi dulu — gratis",
    href: "https://dokumenproyek.com",
    cta: "Kunjungi dokumenproyek.com",
    eksternal: true,
  },
];

export default function KatalogProdukPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SharedHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">
            Katalog Resmi
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight" data-testid="text-produk-title">
            Semua Produk Gustafta
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Satu halaman untuk melihat seluruh yang bisa Anda beli — dikelompokkan
            sesuai nama fitur yang sudah Anda kenal, jadi Anda tidak kehilangan jejak.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 gap-6">
          {KELOMPOK.map((k) => {
            const Icon = k.icon;
            return (
              <div
                key={k.slug}
                className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:shadow-lg transition-shadow"
                data-testid={`card-produk-${k.slug}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 ${k.bg} rounded-2xl flex items-center justify-center shadow-md`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {k.badge && (
                    <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-0">
                      {k.badge}
                    </Badge>
                  )}
                </div>
                <h2 className={`text-lg font-black leading-snug mb-2 ${k.warna}`}>{k.nama}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-1">{k.ringkas}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-5">{k.hargaMulai}</p>
                {k.eksternal ? (
                  <Button asChild variant="outline" className="gap-2 w-fit">
                    <a href={k.href} target="_blank" rel="noopener noreferrer" data-testid={`link-produk-${k.slug}`}>
                      {k.cta} <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button asChild className="gap-2 w-fit">
                    <Link href={k.href} data-testid={`link-produk-${k.slug}`}>
                      {k.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-12 max-w-2xl mx-auto leading-relaxed">
          Produk gratis (mini-ebook, toolkit gratis, uji coba) tidak tampil di katalog ini —
          Anda akan menemukannya langsung di halaman fitur masing-masing.
        </p>
      </main>
    </div>
  );
}
