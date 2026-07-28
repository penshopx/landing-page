import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import { trackLead } from "@/lib/meta-pixel";
import { useContactNumbers } from "@/lib/contact";
import {
  Check, ArrowRight, ClipboardList, MessageCircle, FileText,
  RefreshCw, Zap, Star, ChevronRight, BarChart3, AlertCircle, Users,
} from "lucide-react";


const PAIN_POINTS = [
  {
    icon: FileText,
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/20",
    title: "Penyusunan SOP dan dokumen ISO terasa lama",
    desc: "Membuat Manual Mutu, Prosedur Terdokumentasi, dan Rekaman ISO 9001 dari nol memakan berminggu-minggu. Padahal strukturnya relatif standar dan bisa diotomasi.",
  },
  {
    icon: ClipboardList,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    title: "Checklist audit manual dan rentan terlewat",
    desc: "Audit internal ISO masih pakai spreadsheet. Temuan dicatat di notepad, ditindaklanjuti via email terpisah. Mudah hilang dan sulit dilacak status tindak lanjutnya.",
  },
  {
    icon: RefreshCw,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/20",
    title: "Klien selalu tanya hal yang sama",
    desc: "Persyaratan ISO 9001, perbedaan ISO 14001 dan SMK3, biaya sertifikasi, lama proses — pertanyaan yang sama datang dari setiap klien baru dan memakan waktu konsultasi awal.",
  },
  {
    icon: AlertCircle,
    color: "text-cyan-500",
    bg: "bg-cyan-50 dark:bg-cyan-950/20",
    title: "Gap analysis membutuhkan waktu yang tidak efisien",
    desc: "Menilai kesiapan klien sebelum implementasi ISO masih dilakukan manual dengan wawancara panjang. Belum ada cara cepat untuk mengidentifikasi gap sistematis.",
  },
];

const AI_SPECIALISTS = [
  {
    name: "ISOClaw 9001",
    emoji: "📐",
    desc: "SMM ISO 9001:2015 — gap analysis, panduan dokumentasi, checklist audit internal, dan persiapan sertifikasi",
    href: "/konsultan-iso-smm",
  },
  {
    name: "ISOClaw 14001",
    emoji: "🌿",
    desc: "SML ISO 14001:2015 — penilaian aspek lingkungan, rencana pengelolaan, dan persiapan audit eksternal",
    href: "/konsultan-iso-sml",
  },
  {
    name: "SMK3Claw",
    emoji: "🦺",
    desc: "Sistem Manajemen K3 PP 50/2012 dan ISO 45001 — assessment, dokumentasi, dan persiapan audit",
    href: "/store",
  },
  {
    name: "AuditClaw",
    emoji: "🔍",
    desc: "Asisten audit internal — checklist per klausul, temuan terstruktur, dan draft laporan audit",
    href: "/store",
  },
  {
    name: "SMAPClaw",
    emoji: "⚖️",
    desc: "ISO 37001 Anti-Penyuapan — panduan implementasi SMAP dan persiapan sertifikasi",
    href: "/konsultan-pancek-smap",
  },
  {
    name: "DokumenClaw",
    emoji: "✍️",
    desc: "Generate draft dokumen sistem manajemen — prosedur, instruksi kerja, rekaman — sesuai persyaratan standar",
    href: "/store",
  },
];

const ISO_STANDARDS = [
  { code: "ISO 9001:2015", name: "Sistem Manajemen Mutu", color: "border-teal-300 dark:border-teal-700", badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  { code: "ISO 14001:2015", name: "Sistem Manajemen Lingkungan", color: "border-emerald-300 dark:border-emerald-700", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { code: "ISO 45001:2018", name: "Sistem Manajemen K3", color: "border-green-300 dark:border-green-700", badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { code: "ISO 37001:2016", name: "Sistem Manajemen Anti Penyuapan", color: "border-cyan-300 dark:border-cyan-700", badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  { code: "SMK3 PP 50/2012", name: "K3 Nasional Indonesia", color: "border-blue-300 dark:border-blue-700", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { code: "IMS Terintegrasi", name: "Sistem Manajemen Terpadu", color: "border-indigo-300 dark:border-indigo-700", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
];

const WORKFLOW = [
  {
    step: "01",
    title: "Gap Analysis Cepat",
    desc: "AI menilai kesiapan klien berdasarkan kondisi aktual terhadap persyaratan standar ISO — tanpa wawancara panjang.",
    color: "bg-teal-500",
  },
  {
    step: "02",
    title: "Generate Dokumen Draft",
    desc: "AI menyusun draft prosedur, instruksi kerja, dan rekaman sesuai konteks bisnis klien — tinggal Anda sempurnakan.",
    color: "bg-emerald-500",
  },
  {
    step: "03",
    title: "Siapkan Audit",
    desc: "Checklist audit internal per klausul, template laporan temuan, dan panduan closing corrective action.",
    color: "bg-green-500",
  },
];

export default function SolusiKonsultanISOPage() {
  const contact = useContactNumbers();
  const WA_URL = `https://wa.me/${contact.secondary}?text=Halo%20Gustafta%2C%20saya%20konsultan%20ISO%20dan%20ingin%20tahu%20lebih%20lanjut%20tentang%20AI%20Specialist%20untuk%20bisnis%20saya`;
  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700 py-20 px-4 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <ClipboardList className="h-6 w-6 text-teal-200" />
            <Badge className="bg-white/20 text-white border-white/30 text-xs font-semibold">Untuk Konsultan ISO & SMK3</Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            Percepat Penyusunan Dokumen ISO<br />
            <span className="text-teal-200">dengan AI Specialist</span>
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto mb-8 leading-relaxed">
            AI yang sudah dilatih ISO 9001, ISO 14001, ISO 45001, ISO 37001, dan SMK3 —
            membantu Anda menyusun dokumen lebih cepat, menyiapkan audit lebih terstruktur,
            dan menjawab klien lebih efisien.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/store">
              <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50 font-bold gap-2 px-8">
                <Zap className="h-4 w-4" />
                Lihat AI untuk Konsultan ISO
              </Button>
            </Link>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackLead({ content_name: "WA CTA Konsultan ISO Hero" })}
            >
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-bold gap-2 px-8">
                <MessageCircle className="h-4 w-4" />
                Konsultasi Gratis
              </Button>
            </a>
          </div>
          <p className="mt-4 text-sm text-teal-200">ISO 9001 · ISO 14001 · ISO 45001 · ISO 37001 · SMK3 PP 50/2012</p>
        </div>
      </section>

      {/* ── STANDAR ISO ── */}
      <section className="py-10 px-4 bg-gray-50 dark:bg-muted/10 border-b">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Standar yang Kami Dukung</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {ISO_STANDARDS.map((s) => (
              <div key={s.code} className={`rounded-xl border ${s.color} p-3 text-center`}>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{s.code}</span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-tight">{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Tantangan Sehari-hari</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Apakah Ini Menghambat Pekerjaan Anda?
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

      {/* ── AI SPECIALISTS ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">AI Specialist Anda</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Asisten AI Khusus Sistem Manajemen
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto">
              Setiap AI Specialist terlatih dengan persyaratan standar spesifik, bukan pengetahuan generik.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AI_SPECIALISTS.map((ai) => (
              <Link key={ai.name} href={ai.href}>
                <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-muted/20 p-5 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group">
                  <div className="text-2xl mb-3">{ai.emoji}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{ai.name}</h3>
                    <ChevronRight className="h-3 w-3 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{ai.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/store">
              <Button variant="outline" className="gap-2 border-teal-300 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20">
                Lihat Semua AI Specialist <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── ALUR KERJA ── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Alur Kerja Lebih Efisien</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dari Gap Analysis hingga Siap Audit
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {WORKFLOW.map((w) => (
              <div key={w.step} className="text-center">
                <div className={`w-12 h-12 rounded-2xl ${w.color} text-white font-black text-lg flex items-center justify-center mx-auto mb-4`}>
                  {w.step}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{w.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-teal-600 to-emerald-700 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Selesaikan Proyek ISO Lebih Cepat
          </h2>
          <p className="text-teal-100 mb-8">
            AI Specialist sudah terlatih regulasi Indonesia. Aktif hari ini, langsung bisa digunakan untuk klien Anda besok.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/store">
              <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50 font-bold gap-2">
                <Star className="h-4 w-4" />
                Mulai Gratis Sekarang
              </Button>
            </Link>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackLead({ content_name: "WA CTA ISO Footer" })}>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2">
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
            <Link href="/biro-jasa" className="hover:text-gray-900 dark:hover:text-white">Untuk Biro Jasa</Link>
            <Link href="/skk" className="hover:text-gray-900 dark:hover:text-white">Portal SKK</Link>
            <Link href="/pricing" className="hover:text-gray-900 dark:hover:text-white">Harga</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
