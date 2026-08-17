import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Download, Gift, Hammer, Lock, TrendingUp } from "lucide-react";
import { DIGITAL_PRODUCTS, type DigitalProduct } from "@/data/digital-products";

function ProductCard({ p }: { p: DigitalProduct }) {
  const isHero = p.tier === "premium";
  return (
    <div
      className={`flex flex-col bg-white dark:bg-slate-900 border rounded-3xl p-7 hover:shadow-lg transition-shadow ${
        isHero
          ? "border-orange-400 dark:border-orange-600 ring-2 ring-orange-400/60 shadow-lg shadow-orange-100 dark:shadow-orange-950/30"
          : "border-slate-200 dark:border-slate-800"
      }`}
      data-testid={`card-digital-${p.slug}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md bg-orange-500 shadow-orange-200 dark:shadow-orange-900/40">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div className="flex items-center gap-2">
          {p.tier === "lead" && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0">Ebook Gratis</Badge>
          )}
          {p.tier === "premium" && (
            <Badge className="bg-slate-900 text-amber-300 dark:bg-amber-950 dark:text-amber-300 border-0">Premium</Badge>
          )}
          {p.badge && <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-0">{p.badge}</Badge>}
          <Badge
            variant="outline"
            className={p.gratis ? "text-emerald-600 border-emerald-300 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"}
          >
            {p.hargaLabel}
          </Badge>
        </div>
      </div>

      {p.preNote && (
        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">{p.preNote}</p>
      )}
      {p.lini && (
        <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-1">{p.lini}</p>
      )}
      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug mb-1">{p.judul}</h3>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">{p.subjudul}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-1">{p.deskripsi}</p>

      {p.bonus && (
        <div
          className="flex items-start gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5 mb-5"
          data-testid={`text-bonus-${p.slug}`}
        >
          <Gift className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{p.bonus}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant={p.gratis ? "outline" : "default"} className={`gap-2 ${isHero ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}`}>
          <Link href={p.href} data-testid={`link-digital-${p.slug}`}>
            {p.ctaLabel ?? (p.gratis ? "Buka" : "Beli & Akses")} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        {p.downloadHref && (
          <Button asChild variant="default" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <a href={p.downloadHref} download data-testid={`link-download-${p.slug}`}>
              <Download className="h-4 w-4" /> Unduh Gratis
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function EbookToolkitPage() {
  const ebooks = DIGITAL_PRODUCTS.filter((p) => p.jenis === "ebook");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SharedHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">
            Rak Ebook Gustafta
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight" data-testid="text-ebook-toolkit-title">
            Ebook
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Ilmu praktik lapangan yang dibukukan — ditulis dari pengalaman proyek pemerintah
            yang sebenarnya, bukan teori kampus. Rak ini akan terus bertambah.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-14">
        {/* Rak Ebook */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-5 w-5 text-orange-500" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Terbit Saat Ini</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {ebooks.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        </div>

        {/* Arah rak — sumber pengetahuan yang terus tumbuh */}
        <div className="grid sm:grid-cols-2 gap-5 mb-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <BookOpen className="h-5 w-5 text-orange-500 mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white mb-1.5">Turunan dari Fitur Gustafta</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Setiap fitur — Radar Legalitas, Ruang Proyek, Bedah Dokumen, Ekosistem Kompetensi —
              melahirkan ebook panduannya sendiri: cara kerja, studi kasus, dan praktik terbaiknya.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <TrendingUp className="h-5 w-5 text-orange-500 mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white mb-1.5">Tren, Regulasi & Solusi Terkini</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Ebook tematik yang mengikuti perkembangan: problem lapangan yang sedang hangat,
              perubahan regulasi, dan solusi praktisnya — ditulis begitu perubahan terjadi.
            </p>
          </div>
        </div>

        {/* Rujukan ke Toolkit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-start gap-4 mb-6">
          <Hammer className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold mb-1">Mencari alat kerja, bukan bacaan?</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Kalkulator, template dokumen, dan checklist siap pakai kini punya rak sendiri.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/toolkit" data-testid="link-ke-toolkit">Buka Toolkit <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>

        {/* Catatan pembelian */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-start gap-4">
          <Lock className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Ebook berbayar dikirim sebagai PDF terkunci password ke WhatsApp/email Anda setelah pembayaran.
            Ebook baru dari tim Gustafta dirilis bertahap — pantau rak ini secara berkala.
          </p>
        </div>
      </main>
    </div>
  );
}
