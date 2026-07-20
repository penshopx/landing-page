import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, ShieldCheck, Award,
  Globe, FileText, Briefcase, Calculator, ClipboardList,
  Clock, Database, Bell, BarChart3, Zap, Building2, Users,
} from "lucide-react";
import { trackLead } from "@/lib/meta-pixel";

const WA_URL =
  "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20layanan%20pengurusan%20dokumen%20perusahaan";

function handleWaClick() {
  trackLead({ content_name: "Jasa Dokumen WA CTA" });
}

const LAYANAN = [
  {
    id: "perijinan",
    color: "blue",
    icon: <Globe className="h-6 w-6 text-blue-600" />,
    title: "Perijinan Usaha",
    sub: "NIB · OSS RBA · Izin Usaha · Perubahan Data · Penutupan Usaha",
    items: [
      "Pengurusan NIB baru & perubahan KBLI",
      "Perizinan Berusaha Berbasis Risiko (OSS RBA)",
      "Sertifikat Standar & Izin Usaha per sektor",
      "Perubahan data perusahaan di OSS",
      "Penutupan usaha & pencabutan izin",
    ],
  },
  {
    id: "sertifikasi",
    color: "amber",
    icon: <Award className="h-6 w-6 text-amber-600" />,
    title: "Sertifikasi Perusahaan",
    sub: "SBU · SKK · ISO 9001/14001/45001 · SMK3 · SMAP",
    items: [
      "Sertifikasi Badan Usaha Jasa Konstruksi (SBU)",
      "Sertifikat Kompetensi Kerja (SKK) tenaga ahli",
      "ISO 9001, ISO 14001, ISO 45001, ISO 37001",
      "SMK3 & SMAP (sistem manajemen K3 & anti-penyuapan)",
      "Sertifikasi produk & standar industri lainnya",
    ],
  },
  {
    id: "tender",
    color: "emerald",
    icon: <Briefcase className="h-6 w-6 text-emerald-600" />,
    title: "Persiapan Tender",
    sub: "Registrasi LPSE · Persiapan Dokumen · Review · Pendampingan",
    items: [
      "Registrasi & aktivasi akun LPSE",
      "Persiapan kelengkapan dokumen administrasi & teknis",
      "Review berkas sebelum submit ke LPSE",
      "Pendampingan proses tender dari awal hingga selesai",
      "Evaluasi & tindak lanjut setelah pengumuman",
    ],
  },
  {
    id: "legal",
    color: "violet",
    icon: <ShieldCheck className="h-6 w-6 text-violet-600" />,
    title: "Legal Perusahaan",
    sub: "Pendirian PT · CV · Yayasan · Perubahan Akta · HAKI · Merek",
    items: [
      "Pendirian PT, CV, Firma, dan Yayasan",
      "Perubahan akta perusahaan & persetujuan AHU",
      "Pendaftaran merek & kekayaan intelektual (HAKI)",
      "Penyusunan perjanjian & kontrak bisnis",
      "Pendampingan hukum usaha & compliance",
    ],
  },
  {
    id: "pajak",
    color: "rose",
    icon: <Calculator className="h-6 w-6 text-rose-600" />,
    title: "Administrasi Pajak",
    sub: "NPWP · PKP · EFIN · Coretax · SPT · Pelaporan",
    items: [
      "Pengurusan NPWP Badan & PKP baru",
      "Aktivasi EFIN & sertifikat elektronik Coretax",
      "Pelaporan SPT Tahunan Badan & SPT Masa",
      "Rekonsiliasi pajak & persiapan pemeriksaan",
      "Konsultasi kewajiban perpajakan per jenis usaha",
    ],
  },
];

const colorStyles: Record<
  string,
  { bg: string; border: string; icon: string; tag: string; accent: string }
> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/10",
    border: "border-blue-200 dark:border-blue-800",
    icon: "bg-blue-100 dark:bg-blue-900/30",
    tag: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    accent: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-900/10",
    border: "border-amber-200 dark:border-amber-800",
    icon: "bg-amber-100 dark:bg-amber-900/30",
    tag: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    accent: "text-amber-600 dark:text-amber-400",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-900/10",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "bg-emerald-100 dark:bg-emerald-900/30",
    tag: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-900/10",
    border: "border-violet-200 dark:border-violet-800",
    icon: "bg-violet-100 dark:bg-violet-900/30",
    tag: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    accent: "text-violet-600 dark:text-violet-400",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-900/10",
    border: "border-rose-200 dark:border-rose-800",
    icon: "bg-rose-100 dark:bg-rose-900/30",
    tag: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    accent: "text-rose-600 dark:text-rose-400",
  },
};

const MASALAH = [
  {
    icon: "📂",
    title: "Dokumen Tersebar",
    desc: "Akta ada di direktur. NPWP di bagian pajak. SBU di admin. SKK di tenaga ahli. Tidak ada satu tempat yang menyimpan semuanya.",
  },
  {
    icon: "⏰",
    title: "Masa Berlaku Lupa",
    desc: "SBU habis. ISO habis. SKK habis. NIB berubah. Ketika dibutuhkan mendadak baru panik dan ketinggalan tender.",
  },
  {
    icon: "🚨",
    title: "Tender Selalu Terburu-buru",
    desc: "Saat ada tender, tim baru mulai mencari Akta, NIB, Neraca, SKK — yang ternyata belum lengkap atau sudah kedaluwarsa.",
  },
  {
    icon: "🔍",
    title: "Pengetahuan Hilang",
    desc: "Tahun lalu pernah urus ISO. Tapi siapa konsultannya? Dokumen final di mana? Checklist apa saja? Tidak ada yang tahu.",
  },
];

const JOURNEY = [
  { step: "1", label: "Konsultasi AI", desc: "Ceritakan kebutuhan Anda. AI kami langsung menganalisis dokumen yang diperlukan dan estimasi waktu & biaya." },
  { step: "2", label: "Order & Upload", desc: "Pilih layanan, bayar, dan upload dokumen pendukung. Semua tersimpan rapi di Business Memory Anda." },
  { step: "3", label: "Tim Bekerja", desc: "Tim ahli kami mengurus seluruh proses. Anda bisa pantau progress real-time di dashboard." },
  { step: "4", label: "Selesai & Tersimpan", desc: "Dokumen jadi diserahkan dan tersimpan permanen di Business Memory — siap dipakai untuk kebutuhan berikutnya." },
];

export default function JasaDokumenPage() {
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div
      className="min-h-screen bg-white dark:bg-background"
      data-testid="page-jasa-dokumen"
    >
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-indigo-400 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <ShieldCheck className="h-3.5 w-3.5" />
                Platform Digital Business Compliance
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Perijinan, Sertifikasi &<br />
                <span className="text-blue-300">Tender Perusahaan Anda</span>
                <br />dalam Satu Platform
              </h1>
              <p className="text-base text-blue-100 mb-4 leading-relaxed">
                Dari pengurusan NIB, SBU, ISO, hingga persiapan tender — semua
                ditangani tim ahli Gustafta. Setelah selesai, seluruh dokumen
                tersimpan di{" "}
                <span className="font-bold text-white">Business Memory</span>{" "}
                perusahaan Anda selamanya.
              </p>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-6 text-sm text-blue-100">
                Bukan sekadar jasa pengurusan — dokumen selesai menjadi{" "}
                <span className="font-bold text-white">aset digital perusahaan</span>{" "}
                yang bisa dipakai ulang untuk tender dan sertifikasi berikutnya.
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={WA_URL}
                  onClick={handleWaClick}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    className="bg-white text-blue-900 hover:bg-blue-50 font-bold gap-2 px-8 h-12"
                    data-testid="btn-hero-konsultasi"
                  >
                    <MessageCircle className="h-5 w-5" /> Konsultasi Gratis
                  </Button>
                </a>
                <a
                  href={WA_URL}
                  onClick={handleWaClick}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12"
                    data-testid="btn-hero-cek"
                  >
                    Cek Persyaratan <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "5", label: "Domain Layanan", sub: "Perijinan · Sertifikasi · Tender · Legal · Pajak" },
                { num: "AI", label: "Klinik Dokumen", sub: "Cek syarat & estimasi instan" },
                { num: "100%", label: "Business Memory", sub: "Dokumen tersimpan selamanya" },
                { num: "24/7", label: "Progress Tracking", sub: "Pantau real-time via dashboard" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center"
                >
                  <div className="text-2xl md:text-3xl font-extrabold">
                    {stat.num}
                  </div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-blue-200 mt-0.5">
                    {stat.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MASALAH ── */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">
              Masalah yang Hampir Semua Perusahaan Rasakan
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Dokumen Perusahaan Anda Dikelola seperti Ini?
            </h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
              Hampir semua UMKM dan perusahaan menengah menghadapi masalah yang sama persis.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mb-10">
            {MASALAH.map((m, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-5 flex gap-4"
              >
                <div className="text-3xl flex-shrink-0">{m.icon}</div>
                <div>
                  <h3 className="font-bold text-sm mb-1">{m.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 text-center">
            <p className="text-blue-200 font-bold mb-2">
              Solusi Gustafta: Business Memory
            </p>
            <p className="text-gray-300 text-sm max-w-2xl mx-auto leading-relaxed">
              Setelah pekerjaan selesai, data tidak dihapus — melainkan menjadi{" "}
              <span className="text-white font-bold">Aset Digital Perusahaan</span>.
              Tahun depan saat perlu perpanjang SBU atau ikut tender, semua dokumen
              sudah tersedia. Proses jadi 3× lebih cepat.
            </p>
          </div>
        </div>
      </section>

      {/* ── LAYANAN ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest text-center mb-2">
            5 Domain Layanan
          </p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">
            Semua Kebutuhan Dokumen Perusahaan dalam Satu Tempat
          </h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground text-sm mb-10 max-w-lg mx-auto">
            Kami menangani seluruh siklus dokumen — dari permohonan hingga
            penyimpanan permanen di Business Memory perusahaan Anda.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {LAYANAN.map((lay) => {
              const c = colorStyles[lay.color];
              return (
                <div
                  key={lay.id}
                  className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`}
                  data-testid={`card-layanan-${lay.id}`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${c.icon}`}
                  >
                    {lay.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    {lay.title}
                  </h3>
                  <p className={`text-[10px] font-semibold mb-3 ${c.accent}`}>
                    {lay.sub}
                  </p>
                  <ul className="space-y-1.5">
                    {lay.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2 text-xs text-gray-700 dark:text-muted-foreground"
                      >
                        <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {/* Business Memory card */}
            <div className="rounded-2xl border-2 bg-gradient-to-br from-slate-700 to-blue-900 border-blue-700 p-6 text-white">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 bg-blue-500/30">
                <Database className="h-6 w-6 text-blue-300" />
              </div>
              <h3 className="font-bold mb-1">Business Memory</h3>
              <p className="text-[10px] font-semibold mb-3 text-blue-300">
                Pembeda Utama Gustafta
              </p>
              <ul className="space-y-1.5">
                {[
                  "Semua dokumen tersimpan permanen & terindeks",
                  "Pengingat otomatis masa berlaku via WA & Email",
                  "Akses cepat saat butuh dokumen untuk tender",
                  "Riwayat pengurusan lengkap per proyek",
                  "AI siap analisis kelengkapan kapan saja",
                ].map((item, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-xs text-blue-100"
                  >
                    <Check className="h-3.5 w-3.5 text-blue-300 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI KLINIK DIFFERENTIATOR ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                Pembeda dari Kompetitor
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Klinik AI: Konsultasi Instan Sebelum Order
              </h2>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mb-6 leading-relaxed">
                Sebelum memutuskan layanan apa yang dibutuhkan, Anda bisa tanya
                AI kami dulu — gratis, tanpa daftar.
              </p>
              <div className="space-y-3">
                {[
                  { q: "Saya ingin membuat SBU", a: "AI langsung menjawab: persyaratan, dokumen, estimasi waktu & biaya, checklist lengkap" },
                  { q: "Apakah NIB saya masih berlaku?", a: "AI membantu cek & identifikasi langkah perbaruan yang diperlukan" },
                  { q: "Dokumen apa yang kurang untuk tender X?", a: "AI menganalisis gap dokumen vs persyaratan tender secara spesifik" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 dark:bg-muted/30 rounded-xl p-4 border border-gray-100 dark:border-border"
                  >
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
                      💬 "{item.q}"
                    </p>
                    <p className="text-xs text-gray-600 dark:text-muted-foreground">
                      → {item.a}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/klinik-konsultasi">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    data-testid="btn-klinik-ai"
                  >
                    Coba Klinik AI Sekarang <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                Cara Kerja
              </p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Dari Order hingga Dokumen Jadi
              </h2>
              <div className="space-y-4">
                {JOURNEY.map((j, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {j.step}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                        {j.label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground leading-relaxed">
                        {j.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PERBANDINGAN ── */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest text-center mb-2">
            Kenapa Gustafta
          </p>
          <h2 className="text-2xl font-bold text-center mb-10">
            Biro Jasa Biasa vs Platform Gustafta
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-gray-400 font-normal">
                    Aspek
                  </th>
                  <th className="py-3 px-4 text-gray-400 font-normal text-center">
                    Biro Jasa Tradisional
                  </th>
                  <th className="py-3 px-4 text-blue-300 font-bold text-center">
                    Gustafta Platform
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Hubungan setelah proyek", "Selesai, tidak ada kelanjutan", "Business Memory aktif selamanya"],
                  ["Penyimpanan dokumen", "Email/WhatsApp, tidak terorganisir", "Business Memory terpusat & mudah dicari"],
                  ["Cek persyaratan", "Tanya staf, tunggu balasan", "AI jawab instan 24/7"],
                  ["Reminder masa berlaku", "Manual, sering lupa", "Otomatis via WA & Email"],
                  ["Kesiapan tender", "Kumpulkan dokumen dari nol tiap kali", "Semua tersedia di Business Memory"],
                  ["Transparansi progress", "Update manual via WA", "Dashboard real-time"],
                ].map(([aspek, lama, baru], i) => (
                  <tr
                    key={i}
                    className={
                      i % 2 === 0 ? "bg-white/5" : "bg-transparent"
                    }
                  >
                    <td className="py-3 px-4 text-gray-300 text-xs font-medium">
                      {aspek}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-red-300">
                      ✗ {lama}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-blue-200 font-medium">
                      ✓ {baru}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── MODEL BISNIS / HARGA ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest text-center mb-2">
            Model Layanan
          </p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Pilih yang Sesuai Kebutuhan
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: <Zap className="h-6 w-6 text-blue-600" />,
                title: "Jasa Pengurusan",
                sub: "Per Proyek",
                desc: "Pengurusan dokumen satuan — NIB, SBU, ISO, akta, atau LPSE. Cocok untuk kebutuhan spesifik.",
                items: ["Pengurusan satu jenis dokumen", "AI checklist kelengkapan", "Progress tracking real-time", "Dokumen tersimpan di Business Memory"],
                cta: "Konsultasi Harga",
                color: "blue",
              },
              {
                icon: <Database className="h-6 w-6 text-indigo-600" />,
                title: "Business Memory",
                sub: "Berlangganan Bulanan",
                desc: "Platform penyimpanan & manajemen dokumen perusahaan dengan AI compliance assistant.",
                items: ["Semua dokumen terpusat", "Reminder otomatis masa berlaku", "AI cek kelengkapan kapan saja", "Dashboard compliance perusahaan"],
                cta: "Mulai Berlangganan",
                color: "indigo",
                highlight: true,
              },
              {
                icon: <Users className="h-6 w-6 text-emerald-600" />,
                title: "Paket Lengkap",
                sub: "Jasa + Platform",
                desc: "Pengurusan dokumen PLUS akses platform selamanya. Solusi paling efisien jangka panjang.",
                items: ["Semua layanan jasa pengurusan", "Business Memory seumur hidup proyek", "Prioritas penanganan", "Dedicated account manager"],
                cta: "Konsultasi Paket",
                color: "emerald",
              },
            ].map((pkg, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 border-2 ${
                  pkg.highlight
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-white dark:bg-card border-gray-200 dark:border-border"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${
                    pkg.highlight ? "bg-white/20" : "bg-gray-100 dark:bg-muted"
                  }`}
                >
                  {pkg.icon}
                </div>
                <h3
                  className={`font-bold mb-0.5 ${
                    pkg.highlight ? "text-white" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {pkg.title}
                </h3>
                <p
                  className={`text-[10px] font-bold mb-3 ${
                    pkg.highlight ? "text-blue-200" : "text-gray-400"
                  }`}
                >
                  {pkg.sub}
                </p>
                <p
                  className={`text-xs mb-4 leading-relaxed ${
                    pkg.highlight ? "text-blue-100" : "text-gray-500 dark:text-muted-foreground"
                  }`}
                >
                  {pkg.desc}
                </p>
                <ul className="space-y-1.5 mb-5">
                  {pkg.items.map((item, j) => (
                    <li
                      key={j}
                      className={`flex items-start gap-2 text-xs ${
                        pkg.highlight ? "text-blue-100" : "text-gray-700 dark:text-muted-foreground"
                      }`}
                    >
                      <Check
                        className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${
                          pkg.highlight ? "text-blue-200" : "text-green-500"
                        }`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={WA_URL}
                  onClick={handleWaClick}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    className={`w-full text-sm ${
                      pkg.highlight
                        ? "bg-white text-blue-700 hover:bg-blue-50"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                    data-testid={`btn-pkg-${i}`}
                  >
                    {pkg.cta} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA AKHIR ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Urus Dokumen Sekali, Tersimpan Selamanya
          </h2>
          <p className="text-blue-100 mb-2">
            Jadikan setiap pengurusan dokumen sebagai investasi jangka panjang
            untuk perusahaan Anda.
          </p>
          <p className="text-blue-200 text-sm mb-8">
            Konsultasi gratis · Estimasi instan · Tim ahli berpengalaman
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={WA_URL}
              onClick={handleWaClick}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="bg-white text-blue-900 hover:bg-blue-50 font-bold gap-2 px-8 h-12"
                data-testid="btn-final-cta"
              >
                <MessageCircle className="h-5 w-5" /> Konsultasi Gratis via WA
              </Button>
            </a>
            <Link href="/klinik-konsultasi">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12"
                data-testid="btn-final-klinik"
              >
                Coba Klinik AI <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-blue-200 mt-5">
            Lihat juga:{" "}
            <Link href="/jasa-keuangan">
              <span className="underline font-semibold cursor-pointer">
                Finance & Tax Center →
              </span>
            </Link>
            {" · "}
            <Link href="/mitra-biro-jasa">
              <span className="underline font-semibold cursor-pointer">
                Mitra Business Memory untuk Biro Jasa →
              </span>
            </Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Platform Compliance Digital Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/">
            <span className="hover:text-white cursor-pointer">Beranda</span>
          </Link>
          <Link href="/jasa-keuangan">
            <span className="hover:text-white cursor-pointer">Finance & Tax</span>
          </Link>
          <Link href="/klinik-konsultasi">
            <span className="hover:text-white cursor-pointer">Klinik AI</span>
          </Link>
          <Link href="/ruang-simpan">
            <span className="hover:text-white cursor-pointer">Ruang Simpan</span>
          </Link>
          <a
            href={WA_URL}
            onClick={handleWaClick}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            WhatsApp
          </a>
        </div>
      </footer>
    </div>
  );
}
