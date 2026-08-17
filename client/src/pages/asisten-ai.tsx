import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Bot, Brain, Check, Crown, Network, ShoppingBag, Sparkles, Store, Users } from "lucide-react";
import { HOSTING, HOSTING_PREMIUM } from "@/data/pricing";
import { DEFAULT_LICENSE_PRICE } from "@shared/premium-classes";

const LICENSE_LABEL = `Rp ${DEFAULT_LICENSE_PRICE.toLocaleString("id-ID")}`;

export default function AsistenAiPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SharedHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-widest mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Produk Andalan Gustafta
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-5 leading-tight" data-testid="text-asisten-ai-title">
            Asisten AI —<br />
            <span className="text-cyan-300">Tenaga Ahli Digital yang Bekerja 24 Jam untuk Anda</span>
          </h1>
          <p className="text-blue-100 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Bukan chatbot biasa. Setiap Asisten AI Gustafta dibekali pengetahuan bidang yang spesifik —
            SKK, SBU, tender, kontrak, K3, keuangan proyek — dan siap menjawab, menganalisis,
            serta menyusun dokumen kapan pun Anda butuh.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold gap-2 px-8">
              <Link href="/store" data-testid="link-asisten-ai-store">
                <Store className="h-5 w-5" /> Lihat Semua Asisten di Store
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 gap-2 px-8">
              <Link href="/produk" data-testid="link-asisten-ai-produk">
                Katalog Produk <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-16">
        {/* Dua bentuk */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">Dua Bentuk, Satu Tujuan</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm">
            Pilih sesuai skala kebutuhan Anda — mulai dari satu spesialis, sampai satu tim lengkap dalam satu komando.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* AI Spesialis */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col" data-testid="card-ai-spesialis">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <Badge className="w-fit mb-3 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-0">AI Spesialis</Badge>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Satu Ahli, Satu Bidang</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5 flex-1">
              Satu agen AI yang menguasai satu bidang secara dalam — misalnya spesialis SKK, spesialis tender,
              atau spesialis kontrak. Cocok untuk kebutuhan yang fokus dan anggaran efisien.
            </p>
            <ul className="space-y-2 mb-6">
              {["1 agen ahli di 1 bidang", "Bisa diisi pengetahuan perusahaan Anda", "Siap pakai dari Store atau dirakit sendiri"].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-sm">
              <p className="text-slate-500 dark:text-slate-400">Lisensi mulai <strong className="text-slate-900 dark:text-white">{LICENSE_LABEL}</strong> (sekali bayar)</p>
              <p className="text-slate-500 dark:text-slate-400">+ hosting <strong className="text-slate-900 dark:text-white">{HOSTING.monthly}</strong></p>
            </div>
          </div>

          {/* AI Claw */}
          <div className="bg-white dark:bg-slate-900 border border-violet-300 dark:border-violet-700 ring-2 ring-violet-400/50 rounded-3xl p-8 flex flex-col shadow-lg shadow-violet-100 dark:shadow-violet-950/30" data-testid="card-ai-claw">
            <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-violet-200 dark:shadow-violet-900/40">
              <Network className="h-6 w-6 text-white" />
            </div>
            <Badge className="w-fit mb-3 bg-violet-600 text-white border-0 gap-1"><Crown className="h-3 w-3" /> AI Claw — Premium</Badge>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Satu Tim, Satu Komando</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5 flex-1">
              Beberapa AI Spesialis bekerja serentak di bawah satu orchestrator — seperti punya divisi lengkap:
              satu pertanyaan Anda dipecah, dikerjakan para spesialis, lalu dirangkum jadi satu jawaban utuh.
            </p>
            <ul className="space-y-2 mb-6">
              {["Tim agen dalam satu komando", "Analisis lintas bidang dalam satu jawaban", "Model AI kelas premium"].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Check className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-sm">
              <p className="text-slate-500 dark:text-slate-400">Lisensi premium sesuai kelas produk</p>
              <p className="text-slate-500 dark:text-slate-400">+ hosting premium <strong className="text-slate-900 dark:text-white">{HOSTING_PREMIUM.monthly}</strong></p>
            </div>
          </div>
        </div>

        {/* Cara mendapatkan */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Tiga Jalur Mendapatkannya</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 mb-16">
          {[
            { icon: ShoppingBag, title: "Beli Jadi di Store", desc: "Ratusan Asisten AI siap pakai — pilih, bayar, langsung bekerja.", href: "/store", cta: "Buka Store" },
            { icon: Brain, title: "Rakit Sendiri", desc: "Mulai dari agen kosong, isi dengan pengetahuan perusahaan Anda sendiri.", href: "/dashboard", cta: "Mulai Merakit" },
            { icon: Users, title: "Dirakitkan Tim Gustafta", desc: "Ceritakan kebutuhan Anda — tim kami merakit asisten atau tim Claw khusus untuk Anda.", href: "/dialog-gustafta", cta: "Konsultasi Dulu" },
          ].map((j) => (
            <div key={j.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col">
              <j.icon className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-1.5">{j.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4 flex-1">{j.desc}</p>
              <Button asChild variant="outline" size="sm" className="gap-1.5 w-fit">
                <Link href={j.href} data-testid={`link-jalur-${j.href.replace(/\//g, "")}`}>{j.cta} <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          ))}
        </div>

        {/* CTA penutup */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-black mb-3">Aset Terbesar Gustafta, Kini untuk Perusahaan Anda</h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto mb-6">
            Setiap Asisten AI adalah hasil rakitan pengetahuan praktik lapangan yang sesungguhnya.
            Mulai dari satu spesialis — berkembang menjadi satu organisasi AI.
          </p>
          <Button asChild size="lg" className="bg-white text-blue-800 hover:bg-blue-50 font-bold gap-2 px-8">
            <Link href="/store" data-testid="link-asisten-ai-cta-store">
              Jelajahi Asisten AI <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
