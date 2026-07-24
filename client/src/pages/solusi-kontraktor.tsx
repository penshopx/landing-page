import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import { trackLead } from "@/lib/meta-pixel";
import {
  Check, ArrowRight, HardHat, FileText, TrendingUp, ShieldCheck,
  Users, Zap, Star, MessageCircle, ChevronRight, Award, Building2,
} from "lucide-react";

const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20kontraktor%20dan%20ingin%20tahu%20lebih%20lanjut%20tentang%20AI%20Specialist%20untuk%20perusahaan%20saya";

const PAIN_POINTS = [
  {
    icon: FileText,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
    title: "Dokumen tender menumpuk, deadline mepet",
    desc: "RKS setebal ratusan halaman harus dibaca dan dianalisis dalam hitungan hari. Tim administrasi Anda habis tenaga sebelum dokumen penawaran selesai disusun.",
  },
  {
    icon: TrendingUp,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    title: "Kalah tender berulang tanpa tahu alasannya",
    desc: "Keputusan bid/no-bid masih berdasarkan 'feeling'. Tidak ada scorecard yang menghitung win probability secara sistematis sebelum Anda putuskan ikut atau tidak.",
  },
  {
    icon: Award,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    title: "Regulasi SBU & SKK terus berubah",
    desc: "Permen PUPR berganti, persyaratan BUJK diperbarui, SKK tenaga kerja diperpanjang. Tim Anda habis waktu membaca circular letter dan surat edaran yang saling bertentangan.",
  },
  {
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    title: "Perusahaan bergantung pada satu orang",
    desc: "Kalau admin tender sakit atau resign, semua berhenti. Pengetahuan tersimpan di kepala orang, bukan di sistem yang bisa diakses siapa saja kapan saja.",
  },
];

const AI_SPECIALISTS = [
  {
    name: "TenderClaw",
    emoji: "📋",
    desc: "Analisis RKS, BOQ, persyaratan teknis, dan hitung win probability dalam hitungan menit",
    href: "/tender-ai",
  },
  {
    name: "SBUClaw",
    emoji: "🏛️",
    desc: "Panduan lengkap persyaratan SBU 10 sub-klasifikasi, upgrade kualifikasi, dan perpanjangan",
    href: "/sbu-claw",
  },
  {
    name: "SKKClaw",
    emoji: "🎓",
    desc: "Cek kelayakan SKK, pemetaan jabatan kerja, checklist dokumen per skema kompetensi",
    href: "/skk-coach",
  },
  {
    name: "RABClaw",
    emoji: "🔢",
    desc: "Hitung estimasi RAB, validasi AHSP, breakdown harga satuan sesuai PermenPUPR",
    href: "/store",
  },
  {
    name: "KontrakClaw",
    emoji: "📑",
    desc: "Analisis kontrak FIDIC, identifikasi risiko klausul, panduan klaim EOT dan VO",
    href: "/store",
  },
  {
    name: "CSMSClaw",
    emoji: "🦺",
    desc: "Sistem Manajemen K3 Kontraktor — CSMS, SMK3, ISO 45001 dalam satu platform",
    href: "/store",
  },
];

const STATS = [
  { value: "50+", label: "AI Specialist Konstruksi" },
  { value: "24/7", label: "Aktif Tanpa Henti" },
  { value: "10x", label: "Lebih Cepat Analisis" },
  { value: "0", label: "Baris Kode Diperlukan" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pilih AI Specialist",
    desc: "Pilih AI yang sesuai kebutuhan — tender, SBU, SKK, K3, atau kontrak. Sudah terlatih khusus industri konstruksi Indonesia.",
    color: "bg-amber-500",
  },
  {
    step: "02",
    title: "Masukkan Konteks Anda",
    desc: "Ceritakan situasi, upload dokumen, atau tanyakan langsung. AI memahami regulasi PUPR, LPJK, dan standar konstruksi nasional.",
    color: "bg-orange-500",
  },
  {
    step: "03",
    title: "Dapat Jawaban Spesifik",
    desc: "Bukan jawaban generik. AI memberikan panduan, checklist, analisis, dan draft dokumen yang langsung bisa Anda gunakan.",
    color: "bg-red-500",
  },
];

export default function SolusiKontraktorPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 py-20 px-4 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <HardHat className="h-6 w-6 text-amber-200" />
            <Badge className="bg-white/20 text-white border-white/30 text-xs font-semibold">Untuk Kontraktor</Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            Menangkan Tender Lebih Cepat<br />
            <span className="text-amber-200">dengan Tim AI Specialist Konstruksi</span>
          </h1>
          <p className="text-lg md:text-xl text-orange-100 max-w-2xl mx-auto mb-8 leading-relaxed">
            AI yang sudah dilatih khusus regulasi PUPR, SBU, SKK, dan tender konstruksi Indonesia —
            siap membantu tim Anda kerja lebih cepat, lebih akurat, dan tidak bergantung pada satu orang.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/store">
              <Button size="lg" className="bg-white text-orange-700 hover:bg-amber-50 font-bold gap-2 px-8">
                <Zap className="h-4 w-4" />
                Lihat AI untuk Kontraktor
              </Button>
            </Link>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackLead({ content_name: "WA CTA Kontraktor Hero" })}
            >
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-bold gap-2 px-8">
                <MessageCircle className="h-4 w-4" />
                Konsultasi Gratis
              </Button>
            </a>
          </div>
          <p className="mt-4 text-sm text-orange-200">Tidak perlu coding · Aktivasi Rp 99.000 (sekali) · Hosting mulai Rp 199.000/bln</p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-10 px-4 bg-amber-50 dark:bg-amber-950/10 border-b">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">Masalah yang Kami Dengar Setiap Hari</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Apakah Tim Anda Masih Menghadapi Ini?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {PAIN_POINTS.map((p) => (
              <div key={p.title} className={`rounded-2xl border p-6 flex gap-4 ${p.bg} border-gray-200 dark:border-gray-700`}>
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-black/20`}>
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

      {/* ── AI SPECIALISTS ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Tim AI Anda</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              AI Specialist Khusus untuk Kontraktor
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto">
              Bukan AI generik. Setiap AI Specialist sudah dilatih dengan regulasi, standar, dan praktik terbaik industri konstruksi Indonesia.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AI_SPECIALISTS.map((ai) => (
              <Link key={ai.name} href={ai.href}>
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-muted/20 p-5 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition-all cursor-pointer group">
                  <div className="text-2xl mb-3">{ai.emoji}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{ai.name}</h3>
                    <ChevronRight className="h-3 w-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{ai.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/store">
              <Button variant="outline" className="gap-2 border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20">
                Lihat Semua AI Specialist <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CARA KERJA ── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Mulai dalam 5 Menit</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Cara Kerjanya Sederhana</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((h) => (
              <div key={h.step} className="text-center">
                <div className={`w-12 h-12 rounded-2xl ${h.color} text-white font-black text-lg flex items-center justify-center mx-auto mb-4`}>
                  {h.step}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{h.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAKET ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-600 to-orange-700 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-amber-200 uppercase tracking-widest mb-2">Pilih Paket</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Mulai Sesuai Kebutuhan Anda</h2>
            <p className="text-amber-100 text-sm">Semua paket bisa diupgrade kapan saja. Tidak ada kontrak jangka panjang.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                name: "Starter",
                price: "Rp 199.000",
                period: "/bulan",
                desc: "Untuk kontraktor yang baru mulai memanfaatkan AI",
                features: ["1 Asisten AI aktif", "5.000 pesan/bulan", "KB 20 dokumen", "Semua AI Specialist dasar"],
                cta: "Mulai Starter",
                href: "/pricing",
                highlight: false,
              },
              {
                name: "Profesional",
                price: "Rp 499.000",
                period: "/bulan",
                desc: "Untuk tim tender dan administrasi BUJK",
                features: ["3 Asisten AI aktif", "15.000 pesan/bulan", "KB 30 dokumen", "TenderClaw + SBUClaw + SKKClaw", "Orchestrator Multi-Agent"],
                cta: "Pilih Profesional",
                href: "/pricing",
                highlight: true,
              },
              {
                name: "Bisnis",
                price: "Rp 999.000",
                period: "/bulan",
                desc: "Untuk perusahaan konstruksi dengan banyak proyek",
                features: ["10 Asisten AI aktif", "Pesan tak terbatas", "KB 50 dokumen", "Semua AI Specialist premium", "Priority support WA"],
                cta: "Pilih Bisnis",
                href: "/pricing",
                highlight: false,
              },
            ].map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-2xl p-6 flex flex-col gap-4 ${
                  pkg.highlight
                    ? "bg-white text-gray-900 shadow-2xl scale-105"
                    : "bg-white/10 border border-white/20"
                }`}
              >
                {pkg.highlight && (
                  <Badge className="bg-amber-500 text-white text-[10px] w-fit">Paling Populer</Badge>
                )}
                <div>
                  <h3 className={`font-bold text-lg ${pkg.highlight ? "text-gray-900" : "text-white"}`}>{pkg.name}</h3>
                  <p className={`text-xs mt-1 ${pkg.highlight ? "text-gray-500" : "text-amber-200"}`}>{pkg.desc}</p>
                </div>
                <div className={`text-3xl font-black ${pkg.highlight ? "text-amber-600" : "text-white"}`}>
                  {pkg.price}<span className={`text-sm font-normal ${pkg.highlight ? "text-gray-400" : "text-amber-200"}`}>{pkg.period}</span>
                </div>
                <ul className="space-y-2 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-xs ${pkg.highlight ? "text-gray-700" : "text-amber-100"}`}>
                      <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${pkg.highlight ? "text-green-500" : "text-green-400"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={pkg.href}>
                  <Button
                    className={`w-full ${pkg.highlight ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-white/20 hover:bg-white/30 text-white border border-white/30"}`}
                    size="sm"
                  >
                    {pkg.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Siap Memulai?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Bergabung dengan kontraktor yang sudah menggunakan Gustafta untuk memenangkan tender dan mengelola SBU/SKK dengan lebih efisien.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/store">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2">
                <Star className="h-4 w-4" />
                Mulai Gratis Sekarang
              </Button>
            </Link>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackLead({ content_name: "WA CTA Kontraktor Footer" })}>
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
            <Link href="/biro-jasa" className="hover:text-gray-900 dark:hover:text-white">Untuk Biro Jasa</Link>
            <Link href="/konsultan-iso" className="hover:text-gray-900 dark:hover:text-white">Untuk Konsultan ISO</Link>
            <Link href="/skk" className="hover:text-gray-900 dark:hover:text-white">Portal SKK</Link>
            <Link href="/pricing" className="hover:text-gray-900 dark:hover:text-white">Harga</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
