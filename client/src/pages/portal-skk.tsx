import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import { trackLead } from "@/lib/meta-pixel";
import {
  Check, ArrowRight, GraduationCap, MessageCircle, Users, Building2,
  Zap, Star, ChevronRight, FileText, Award, ClipboardList, Search,
  BookOpen, ShieldCheck, Layers,
} from "lucide-react";

const WA_URL = "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20AI%20Specialist%20untuk%20ekosistem%20SKK";

type Segment = "asesi" | "asesor" | "lsp" | "tuk" | "perusahaan";

const SEGMENTS: Array<{
  id: Segment;
  label: string;
  emoji: string;
  desc: string;
  color: string;
  activeColor: string;
  headline: string;
  pain: string[];
  aiSpecialists: Array<{ name: string; emoji: string; desc: string; href: string }>;
  ctaLabel: string;
}> = [
  {
    id: "asesi",
    label: "Asesi",
    emoji: "👨‍🎓",
    desc: "Profesional yang akan atau sedang disertifikasi",
    color: "border-blue-200 dark:border-blue-800 hover:border-blue-400",
    activeColor: "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
    headline: "Persiapkan Sertifikasi SKK Lebih Percaya Diri",
    pain: [
      "Bingung syarat SKK untuk jabatan dan jenjang tertentu",
      "Tidak tahu portofolio apa yang harus disiapkan sebagai bukti pengalaman",
      "Gugup menghadapi wawancara dan asesmen teknis",
      "Tidak mengerti unit kompetensi yang akan diujikan",
    ],
    aiSpecialists: [
      { name: "SKKClaw", emoji: "🎓", desc: "Cek kelayakan, pemetaan jabatan kerja, checklist dokumen per skema KKNI", href: "/skk-coach" },
      { name: "SimulatorSKK", emoji: "🎯", desc: "Simulasi wawancara dan asesmen teknis sesuai skema kompetensi Anda", href: "/simulator-wawancara-skk" },
      { name: "PortofolioClaw", emoji: "📁", desc: "Panduan menyusun portofolio dan eviden pengalaman kerja yang kuat", href: "/generator-portofolio-skk" },
      { name: "MateriClaw", emoji: "📚", desc: "Materi belajar dan bank soal sesuai unit kompetensi SKKNI yang diujikan", href: "/materi-belajar-skk" },
    ],
    ctaLabel: "Mulai Persiapkan SKK",
  },
  {
    id: "asesor",
    label: "Asesor",
    emoji: "👨‍⚖️",
    desc: "Asesor kompetensi yang menilai asesi",
    color: "border-violet-200 dark:border-violet-800 hover:border-violet-400",
    activeColor: "border-violet-500 bg-violet-50 dark:bg-violet-950/30",
    headline: "Fokus Menilai Kompetensi, Bukan Administrasi",
    pain: [
      "Pengelolaan dokumen asesmen (FR, MUK, BAPAK) masih manual dan memakan waktu",
      "Rekaman eviden asesi sulit dilacak dan diverifikasi cepat",
      "Laporan asesmen harus ditulis ulang untuk setiap klien",
      "Update regulasi BNSP dan perubahan skema sering terlewat",
    ],
    aiSpecialists: [
      { name: "AssessmentClaw", emoji: "📋", desc: "Panduan proses asesmen — FR, MUK, BAPAK, dan rekaman eviden terstruktur", href: "/store" },
      { name: "SKKClaw", emoji: "🎓", desc: "Update regulasi terbaru BNSP, perubahan skema, dan persyaratan jabatan kerja", href: "/skk-coach" },
      { name: "EvidenceClaw", emoji: "🔍", desc: "Panduan verifikasi eviden pengalaman kerja asesi per unit kompetensi", href: "/store" },
      { name: "ReportClaw", emoji: "📄", desc: "Draft laporan asesmen terstruktur — tinggal lengkapi dengan temuan spesifik", href: "/store" },
    ],
    ctaLabel: "Lihat AI untuk Asesor",
  },
  {
    id: "lsp",
    label: "LSP",
    emoji: "🏢",
    desc: "Lembaga Sertifikasi Profesi",
    color: "border-amber-200 dark:border-amber-800 hover:border-amber-400",
    activeColor: "border-amber-500 bg-amber-50 dark:bg-amber-950/30",
    headline: "Layani Lebih Banyak Asesi Tanpa Menambah Banyak Admin",
    pain: [
      "Pertanyaan asesi tentang persyaratan, prosedur, dan jadwal mengalir tanpa henti",
      "Administrasi pendaftaran dan verifikasi dokumen memakan waktu staf",
      "Manajemen jadwal asesmen dengan banyak skema dan asesor berbeda",
      "Update informasi regulasi BNSP harus dikomunikasikan ke seluruh asesi",
    ],
    aiSpecialists: [
      { name: "SKKClaw", emoji: "🎓", desc: "Jawab pertanyaan asesi otomatis 24/7 — persyaratan, alur, checklist dokumen per skema", href: "/skk-coach" },
      { name: "RegulationClaw", emoji: "📜", desc: "Update regulasi BNSP, SK Dirjen, dan perubahan kebijakan sertifikasi terkini", href: "/skk-pedoman-bnsp" },
      { name: "AssessmentClaw", emoji: "📋", desc: "Panduan proses asesmen sesuai BNSP — untuk digunakan staf dan asesor LSP", href: "/store" },
      { name: "AdminClaw", emoji: "💼", desc: "Bantuan administrasi LSP — verifikasi kelengkapan dokumen, checklist pendaftaran", href: "/store" },
    ],
    ctaLabel: "Lihat AI untuk LSP",
  },
  {
    id: "tuk",
    label: "TUK",
    emoji: "🏫",
    desc: "Tempat Uji Kompetensi",
    color: "border-orange-200 dark:border-orange-800 hover:border-orange-400",
    activeColor: "border-orange-500 bg-orange-50 dark:bg-orange-950/30",
    headline: "Kelola Asesmen Lebih Terstruktur dan Efisien",
    pain: [
      "Koordinasi jadwal asesi, asesor, dan ruang uji yang kompleks",
      "Verifikasi kelengkapan dokumen asesi sebelum hari asesmen sering bermasalah",
      "Administrasi rekaman dan dokumentasi asesmen masih manual",
      "Komunikasi kepada asesi tentang persiapan teknis kurang standar",
    ],
    aiSpecialists: [
      { name: "AssessmentClaw", emoji: "📋", desc: "Checklist persiapan TUK — kelengkapan sarana, dokumen, dan prosedur operasional", href: "/store" },
      { name: "SKKClaw", emoji: "🎓", desc: "Informasi persyaratan per skema untuk dikomunikasikan ke asesi yang akan diuji", href: "/skk-coach" },
      { name: "DocumentClaw", emoji: "📄", desc: "Template dokumen TUK — panduan asesi, form rekaman, dan laporan pasca asesmen", href: "/store" },
      { name: "AdminClaw", emoji: "💼", desc: "Bantuan verifikasi dokumen dan checklist kesiapan asesmen harian", href: "/store" },
    ],
    ctaLabel: "Lihat AI untuk TUK",
  },
  {
    id: "perusahaan",
    label: "Perusahaan",
    emoji: "🏗️",
    desc: "BUJK dan perusahaan jasa konstruksi",
    color: "border-emerald-200 dark:border-emerald-800 hover:border-emerald-400",
    activeColor: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
    headline: "Kelola SKK Seluruh Tim Konstruksi dari Satu Tempat",
    pain: [
      "Sulit memantau status SKK ratusan tenaga kerja yang tersebar di proyek berbeda",
      "SKK tenaga teknis habis masa berlaku tanpa peringatan — berisiko kena audit",
      "Kekurangan SKK tertentu baru keterlihatan saat pengajuan tender sudah dekat",
      "Tidak ada roadmap pengembangan kompetensi tim yang terstruktur",
    ],
    aiSpecialists: [
      { name: "TrackerSKK", emoji: "📊", desc: "Pantau status SKK seluruh tim — yang aktif, akan habis, dan perlu diperpanjang", href: "/tracker-skk" },
      { name: "PlannerSKK", emoji: "🗓️", desc: "Rencanakan kebutuhan SKK per proyek dan jadwal sertifikasi tim secara sistematis", href: "/planner-skk-bujk" },
      { name: "SKKClaw", emoji: "🎓", desc: "Panduan persyaratan SKK per jabatan dan jenjang untuk seluruh anggota tim", href: "/skk-coach" },
      { name: "ManfaatSKK", emoji: "💰", desc: "Hitung manfaat finansial investasi SKK untuk BUJK — kualifikasi tender dan upah", href: "/kalkulator-manfaat-skk-bujk" },
    ],
    ctaLabel: "Kelola SKK Perusahaan",
  },
];

const SKK_STATS = [
  { value: "200+", label: "Jabatan Kerja Konstruksi" },
  { value: "KKNI L1-9", label: "Semua Jenjang" },
  { value: "24/7", label: "AI Aktif Menjawab" },
  { value: "Permen PUPR 9/2023", label: "Regulasi Terkini" },
];

const SKK_TOOLS = [
  { name: "Cek Kelayakan SKK", href: "/cek-kelayakan-skk", emoji: "✅", desc: "Apakah Anda memenuhi syarat jabatan yang dituju?" },
  { name: "Perpanjangan SKK", href: "/perpanjangan-skk", emoji: "🔄", desc: "Panduan surveillance dan re-sertifikasi 3 tahunan" },
  { name: "Simulator Wawancara", href: "/simulator-wawancara-skk", emoji: "🎯", desc: "Latihan menghadapi asesor dengan pertanyaan realistis" },
  { name: "Generator Portofolio", href: "/generator-portofolio-skk", emoji: "📁", desc: "Susun portofolio dan eviden pengalaman kerja" },
  { name: "Tracker SKK BUJK", href: "/tracker-skk", emoji: "📊", desc: "Pantau status SKK seluruh tenaga kerja perusahaan" },
  { name: "Materi Belajar SKK", href: "/materi-belajar-skk", emoji: "📚", desc: "Bank soal dan materi per unit kompetensi SKKNI" },
  { name: "Planner SKK BUJK", href: "/planner-skk-bujk", emoji: "🗓️", desc: "Rencanakan kebutuhan SKK tim per proyek" },
  { name: "Analisis SKKNI", href: "/analisis-skkni", emoji: "🔬", desc: "Bedah unit kompetensi dan elemen SKKNI per jabatan" },
];

export default function PortalSKKPage() {
  const [activeSegment, setActiveSegment] = useState<Segment>("asesi");
  const segment = SEGMENTS.find((s) => s.id === activeSegment)!;

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 py-20 px-4 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: (i % 3 + 1) * 3 + "px",
                height: (i % 3 + 1) * 3 + "px",
                left: (i * 5.3) % 100 + "%",
                top: (i * 7.1) % 100 + "%",
                background: i % 2 === 0 ? "#6ee7b7" : "#10b981",
                opacity: 0.3,
              }}
            />
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <GraduationCap className="h-6 w-6 text-emerald-200" />
            <Badge className="bg-white/20 text-white border-white/30 text-xs font-semibold">Portal Ekosistem SKK</Badge>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            Seluruh Kebutuhan SKK<br />
            <span className="text-emerald-200">Dalam Satu AI Specialist Platform</span>
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-8 leading-relaxed">
            Untuk LSP, TUK, Asesor, Asesi, dan Perusahaan Jasa Konstruksi.
            AI Specialist yang sudah dilatih regulasi SKK terbaru — Permen PUPR 9/2023 dan SK Dirjen 114.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {SEGMENTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSegment(s.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeSegment === s.id
                    ? "bg-white text-emerald-700 shadow-lg"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-green-200">Pilih segmen Anda untuk melihat solusi yang relevan ↓</p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-10 px-4 bg-emerald-50 dark:bg-emerald-950/10 border-b">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {SKK_STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SEGMENT SELECTOR INTERAKTIF ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Segment Tabs */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {SEGMENTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSegment(s.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  activeSegment === s.id ? s.activeColor + " shadow-sm" : s.color + " bg-white dark:bg-muted/10"
                }`}
              >
                <span className="text-base">{s.emoji}</span>
                <span className="text-gray-800 dark:text-gray-200">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Active Segment Content */}
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left: Headline + Pain Points */}
            <div>
              <div className="mb-6">
                <Badge className="mb-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {segment.emoji} {segment.label}
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {segment.headline}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{segment.desc}</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Tantangan yang sering dihadapi:</p>
                {segment.pain.map((p) => (
                  <div key={p} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 block" />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{p}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: AI Specialists */}
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-4">AI Specialist untuk {segment.label}:</p>
              <div className="space-y-3">
                {segment.aiSpecialists.map((ai) => (
                  <Link key={ai.name} href={ai.href}>
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/10 p-4 hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer group flex items-start gap-3">
                      <span className="text-xl shrink-0">{ai.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm">{ai.name}</h3>
                          <ChevronRight className="h-3 w-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{ai.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/skk-coach">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    {segment.ctaLabel} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOOLS SKK ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Semua Alat SKK</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Ekosistem Lengkap di Satu Portal
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto">
              Dari cek kelayakan hingga tracker perusahaan — semua kebutuhan SKK ekosistem konstruksi tersedia di sini.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SKK_TOOLS.map((tool) => (
              <Link key={tool.name} href={tool.href}>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-muted/20 p-5 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col">
                  <div className="text-2xl mb-3">{tool.emoji}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-1">
                    {tool.name}
                    <ChevronRight className="h-3 w-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed flex-1">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-emerald-700 to-teal-800 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Bergabung dengan Ekosistem SKK Digital
          </h2>
          <p className="text-emerald-100 mb-8">
            AI Specialist SKK sudah digunakan oleh LSP, TUK, asesor, dan ribuan profesional konstruksi Indonesia.
            Mulai hari ini, gratis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/skk-coach">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold gap-2">
                <Star className="h-4 w-4" />
                Mulai dengan SKKClaw
              </Button>
            </Link>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackLead({ content_name: "WA CTA SKK Portal" })}>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2">
                <MessageCircle className="h-4 w-4" />
                Konsultasi via WhatsApp
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
            <Link href="/konsultan-iso" className="hover:text-gray-900 dark:hover:text-white">Untuk Konsultan ISO</Link>
            <Link href="/pricing" className="hover:text-gray-900 dark:hover:text-white">Harga</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
