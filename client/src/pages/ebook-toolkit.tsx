import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Download, Hammer, Lock } from "lucide-react";
import { DIGITAL_PRODUCTS, type DigitalProduct } from "@/data/digital-products";

function ProductCard({ p }: { p: DigitalProduct }) {
  const isEbook = p.jenis === "ebook";
  return (
    <div
      className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:shadow-lg transition-shadow"
      data-testid={`card-digital-${p.slug}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ${
            isEbook ? "bg-orange-500 shadow-orange-200 dark:shadow-orange-900/40" : "bg-slate-700 shadow-slate-300 dark:shadow-slate-900/40"
          }`}
        >
          {isEbook ? <BookOpen className="h-5 w-5 text-white" /> : <Hammer className="h-5 w-5 text-white" />}
        </div>
        <div className="flex items-center gap-2">
          {p.badge && <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-0">{p.badge}</Badge>}
          <Badge
            variant="outline"
            className={p.gratis ? "text-emerald-600 border-emerald-300 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"}
          >
            {p.hargaLabel}
          </Badge>
        </div>
      </div>

      {p.lini && (
        <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-1">{p.lini}</p>
      )}
      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug mb-1">{p.judul}</h3>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">{p.subjudul}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex-1">{p.deskripsi}</p>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant={p.gratis ? "outline" : "default"} className="gap-2">
          <Link href={p.href} data-testid={`link-digital-${p.slug}`}>
            {p.gratis ? "Buka" : "Lihat & Beli"} <ArrowRight className="h-4 w-4" />
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
  const toolkits = DIGITAL_PRODUCTS.filter((p) => p.jenis === "toolkit");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SharedHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">
            Rak Digital Gustafta
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight" data-testid="text-ebook-toolkit-title">
            Ebook & Toolkit
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Ilmu praktik lapangan yang dibukukan, dan alat kerja yang siap dipakai hari ini.
            Ditulis dari pengalaman proyek pemerintah yang sebenarnya — bukan teori kampus.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-14">
        {/* Ebook */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-5 w-5 text-orange-500" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Ebook</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {ebooks.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        </div>

        {/* Toolkit */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <Hammer className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Toolkit</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {toolkits.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        </div>

        {/* Catatan pembelian */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-start gap-4">
          <Lock className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Ebook berbayar dikirim sebagai PDF terkunci password ke WhatsApp/email Anda setelah pembayaran.
            Rak ini akan terus bertambah — ebook dan toolkit baru dari tim Gustafta dirilis bertahap.
          </p>
        </div>
      </main>
    </div>
  );
}
