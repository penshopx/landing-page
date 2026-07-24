import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import { trackLead } from "@/lib/meta-pixel";
import {
  Check, ArrowRight, Briefcase, MessageCircle, Users, Clock,
  Zap, Star, ChevronRight, FileText, Phone, RefreshCw, Building2,
} from "lucide-react";

const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20biro%20jasa%20dan%20ingin%20tahu%20lebih%20lanjut%20tentang%20AI%20Specialist%20untuk%20bisnis%20saya";

const PAIN_POINTS = [
  {
    icon: Phone,
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    title: "WA tidak pernah berhenti",
    desc: "Klien tanya persyaratan SBU, cara perpanjang SKK, biaya OSS — pertanyaan yang sama berulang-ulang. Staf Anda menghabiskan setengah hari hanya untuk menjawab chat.",
  },
  {
    icon: Users,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    title: "Satu staf harus melayani terlalu banyak klien",
    desc: "Semakin banyak klien masuk, semakin kewalahan tim Anda. Tambah staf berarti biaya naik — tapi tidak menambah staf berarti kualitas layanan turun.",
  },
  {
    icon: RefreshCw,
    color: "text-pink-500",
    bg: "bg-pink-50 dark:bg-pink-950/20",
    title: "Revisi dokumen terus tanpa ujung",
    desc: "Klien bolak-balik minta revisi karena persyaratan tidak lengkap dari awal. Waktu yang seharusnya untuk klien baru habis untuk iterasi klien lama.",
  },
  {
    icon: Clock,
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    title: "Konsultasi awal memakan terlalu banyak waktu",
    desc: "Setiap klien baru butuh sesi penjelasan panjang tentang alur, persyaratan, dan biaya. Padahal informasinya hampir selalu sama dari satu klien ke klien lain.",
  },
];

const AI_SPECIALISTS = [
  {
    name: "SBUClaw",
    emoji: "🏛️",
    desc: "Jawab pertanyaan SBU klien otomatis — persyaratan, alur, biaya, dokumen per sub-klasifikasi",
    href: "/sbu-claw",
  },
  {
    name: "SKKClaw",
    emoji: "🎓",
    desc: "Panduan SKK untuk klien Anda — cek kelayakan, checklist dokumen, jadwal asesmen",
    href: "/skk-coach",
  },
  {
    name: "OSSClaw",
    emoji: "💻",
    desc: "Panduan perizinan berusaha OSS-RBA — NIB, izin sektoral, KBLI, dan persyaratan OSS",
    href: "/store",
  },
  {
    name: "LPJKClaw",
    emoji: "📋",
    desc: "Tanya jawab regulasi LPJK, SBUJK, dan kebijakan lembaga pengembangan jasa konstruksi",
    href: "/store",
  },
  {
    name: "TenderClaw",
    emoji: "📄",
    desc: "Bantu klien kontraktor yang butuh panduan tender — analisis RKS dan persyaratan kualifikasi",
    href: "/store",
  },
  {
    name: "DokumenClaw",
    emoji: "✍️",
    desc: "Generate dan review dokumen perizinan klien secara otomatis — hemat waktu revisi berulang",
    href: "/store",
  },
];

const BENEFITS = [
  "AI menjawab pertanyaan klien 24/7 — Anda istirahat, bisnis tetap jalan",
  "Satu AI Specialist melayani ratusan klien sekaligus tanpa lelah",
  "Informasi persyaratan selalu akurat dan up-to-date sesuai regulasi",
  "Klien mendapat jawaban instan — kepercayaan meningkat, churn turun",
  "Staf Anda fokus pada kasus kompleks, bukan pertanyaan berulang",
  "Tambah kapasitas klien tanpa menambah biaya operasional proporsional",
];

const SCENARIOS = [
  {
    from: "Klien tanya: Apa saja syarat SBU Konstruksi kualifikasi Kecil?",
    to: "AI menjawab lengkap dalam 3 detik — dokumen, prosedur, estimasi waktu",
    color: "border-violet-200 dark:border-violet-800",
  },
  {
    from: "Klien tanya: Berapa biaya perpanjang SKK saya yang mau habis masa berlaku?",
    to: "AI cek jenis SKK, jelaskan biaya, dan berikan checklist dokumen yang dibutuhkan",
    color: "border-purple-200 dark:border-purple-800",
  },
  {
    from: "Klien tanya: Bagaimana cara daftar OSS untuk perusahaan konstruksi baru?",
    to: "AI panduan step-by-step dari KBLI, NIB, hingga izin sektoral BUJK",
    color: "border-pink-200 dark:border-pink-800",
  },
];

export default function SolusiBiroJasaPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-pink-700 py-20 px-4 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Briefcase className="h-6 w-6 text-violet-200" />
            <Badge className="bg-white/20 text-white border-white/30 text-xs font-semibold">Untuk Biro Jasa</Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            Layani Lebih Banyak Klien<br />
            <span className="text-violet-200">Tanpa Menambah Banyak Staf</span>
          </h1>
          <p className="text-lg md:text-xl text-purple-100 max-w-2xl mx-auto mb-8 leading-relaxed">
            AI Specialist yang menjawab pertanyaan klien Anda 24/7 — persyaratan SBU, SKK, OSS, dan perizinan konstruksi —
            sehingga tim Anda bisa fokus pada pekerjaan yang benar-benar butuh keahlian manusia.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/store">
              <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold gap-2 px-8">
                <Zap className="h-4 w-4" />
                Lihat AI untuk Biro Jasa
              </Button>
            </Link>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackLead({ content_name: "WA CTA Biro Jasa Hero" })}
            >
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-bold gap-2 px-8">
                <MessageCircle className="h-4 w-4" />
                Konsultasi Gratis
              </Button>
            </a>
          </div>
          <p className="mt-4 text-sm text-purple-200">Aktif dalam 1 hari · Tanpa kode · Mulai dari Rp 199.000/bulan</p>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Masalah Nyata Biro Jasa</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Apakah Ini Terasa Familiar?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {PAIN_POINTS.map((p) => (
              <div key={p.title} className={`rounded-2xl border p-6 flex gap-4 ${p.bg} border-gray-200 dark:border-gray-700`}>
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-black/20">
                  <p.icon className={`h-5 w-5 ${p.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-sm">{p.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SKENARIO NYATA ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Lihat Cara Kerjanya</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dari Pertanyaan Klien ke Jawaban Instan
            </h2>
          </div>
          <div className="space-y-4">
            {SCENARIOS.map((s, i) => (
              <div key={i} className={`rounded-2xl border ${s.color} bg-white dark:bg-muted/20 p-6`}>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Pertanyaan klien</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{s.from}"</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-violet-400 shrink-0 hidden md:block" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-1">AI menjawab</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{s.to}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SPECIALISTS ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">AI Specialist untuk Anda</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Layanan Otomatis yang Tidak Pernah Lelah
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AI_SPECIALISTS.map((ai) => (
              <Link key={ai.name} href={ai.href}>
                <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-muted/20 p-5 hover:border-violet-400 hover:shadow-md transition-all cursor-pointer group">
                  <div className="text-2xl mb-3">{ai.emoji}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{ai.name}</h3>
                    <ChevronRight className="h-3 w-3 text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{ai.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── MANFAAT ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-violet-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-violet-200 uppercase tracking-widest mb-2">Yang Anda Dapatkan</p>
            <h2 className="text-2xl md:text-3xl font-bold">Biro Jasa yang Berjalan Lebih Efisien</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                <p className="text-sm text-violet-100">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Mulai Layani Lebih Banyak Klien Hari Ini
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            AI Specialist aktif dalam 1 hari. Tidak perlu tim IT, tidak perlu konfigurasi teknis yang rumit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/store">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white font-bold gap-2">
                <Star className="h-4 w-4" />
                Mulai Gratis Sekarang
              </Button>
            </Link>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackLead({ content_name: "WA CTA Biro Jasa Footer" })}>
              <Button size="lg" variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Tanya via WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER MINI ── */}
      <footer className="border-t py-8 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <Link href="/">
            <span className="font-black text-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-900 bg-clip-text text-transparent">GUSTAFTA</span>
          </Link>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/kontraktor" className="hover:text-gray-900 dark:hover:text-white">Untuk Kontraktor</Link>
            <Link href="/konsultan-iso" className="hover:text-gray-900 dark:hover:text-white">Untuk Konsultan ISO</Link>
            <Link href="/skk" className="hover:text-gray-900 dark:hover:text-white">Portal SKK</Link>
            <Link href="/pricing" className="hover:text-gray-900 dark:hover:text-white">Harga</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
