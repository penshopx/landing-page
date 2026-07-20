import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useTrialCTA } from "@/hooks/use-trial-cta";
import {
  Check, ArrowRight, MessageCircle, TrendingUp, BarChart3,
  FileText, Calculator, Database, Bell, Calendar, Shield,
  Building2, Wallet, Receipt, ClipboardList, Zap, Users,
} from "lucide-react";
import { trackLead } from "@/lib/meta-pixel";

const WA_URL =
  "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20ingin%20konsultasi%20layanan%20Finance%20%26%20Tax%20Center";

function handleWaClick() {
  trackLead({ content_name: "Jasa Keuangan WA CTA" });
}

const MODUL = [
  {
    id: "finance-vault",
    color: "blue",
    icon: <Database className="h-6 w-6 text-blue-600" />,
    title: "Financial Document Vault",
    sub: "Neraca · Laba Rugi · Cash Flow · Invoice · PO · Kontrak",
    items: [
      "Penyimpanan laporan keuangan (Neraca, L/R, Arus Kas)",
      "Arsip Invoice, PO, DO, Kwitansi & Bukti Transfer",
      "Rekening koran & mutasi bank terorganisir",
      "Working paper & laporan audit",
      "Versi dokumen & riwayat lengkap per tahun buku",
    ],
  },
  {
    id: "tax-center",
    color: "amber",
    icon: <Receipt className="h-6 w-6 text-amber-600" />,
    title: "Tax Center",
    sub: "NPWP · PKP · EFIN · Coretax · SPT · e-Faktur · e-Bupot",
    items: [
      "Master data pajak: NPWP, PKP, EFIN, Sertifikat Elektronik",
      "Arsip SPT Tahunan Badan & SPT Masa (PPN, PPh)",
      "Manajemen e-Faktur, e-Bupot & Bukti Potong",
      "Arsip Surat Ketetapan, STP & Surat Tagihan Pajak",
      "Panduan kewajiban pajak per jenis usaha",
    ],
  },
  {
    id: "financial-calendar",
    color: "emerald",
    icon: <Calendar className="h-6 w-6 text-emerald-600" />,
    title: "Financial Calendar",
    sub: "Reminder otomatis jatuh tempo pajak & keuangan",
    items: [
      "Kalender jatuh tempo PPN, PPh 21/23/25, SPT",
      "Jadwal tutup buku, audit & rekonsiliasi",
      "Reminder pembayaran vendor & pelunasan piutang",
      "Notifikasi otomatis via WhatsApp & Email",
      "Integrasi jadwal tender dengan dokumen keuangan",
    ],
  },
  {
    id: "invoice-center",
    color: "violet",
    icon: <Receipt className="h-6 w-6 text-violet-600" />,
    title: "Invoice & Receivable Center",
    sub: "Quotation → Invoice → Pembayaran → Arsip",
    items: [
      "Siklus lengkap: Quotation → SO → Invoice → Pelunasan",
      "Tracking piutang & hutang usaha real-time",
      "Reminder invoice jatuh tempo otomatis",
      "Laporan aging piutang & hutang",
      "Rekap per klien, proyek & periode",
    ],
  },
  {
    id: "asset-center",
    color: "rose",
    icon: <Building2 className="h-6 w-6 text-rose-600" />,
    title: "Asset & Contract Center",
    sub: "Gedung · Kendaraan · Peralatan · Kontrak · Leasing",
    items: [
      "Daftar aset: gedung, kendaraan, mesin, inventaris",
      "Jadwal pemeliharaan & perhitungan penyusutan",
      "Manajemen kontrak vendor, customer & bank",
      "Reminder masa berlaku kontrak & leasing",
      "Dokumen pembelian & foto aset tersimpan",
    ],
  },
  {
    id: "ai-assistant",
    color: "indigo",
    icon: <Zap className="h-6 w-6 text-indigo-600" />,
    title: "AI Financial & Tax Assistant",
    sub: "CFO AI · Tax AI · Financial Health Score",
    items: [
      "AI Tax: \"Pajak apa yang jatuh tempo minggu ini?\"",
      "AI Finance: \"Berapa invoice yang belum dibayar?\"",
      "Financial Health Score: Likuiditas, Profitabilitas, Solvabilitas",
      "Analisis tren biaya & proyeksi arus kas",
      "Checklist kelengkapan dokumen perpajakan otomatis",
    ],
  },
];

const colorStyles: Record<
  string,
  { bg: string; border: string; icon: string; tag: string; accent: string }
> = {
  blue:   { bg: "bg-blue-50 dark:bg-blue-900/10",   border: "border-blue-200 dark:border-blue-800",   icon: "bg-blue-100 dark:bg-blue-900/30",   tag: "bg-blue-100 text-blue-700",   accent: "text-blue-600 dark:text-blue-400" },
  amber:  { bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-800", icon: "bg-amber-100 dark:bg-amber-900/30", tag: "bg-amber-100 text-amber-700", accent: "text-amber-600 dark:text-amber-400" },
  emerald:{ bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800", icon: "bg-emerald-100 dark:bg-emerald-900/30", tag: "bg-emerald-100 text-emerald-700", accent: "text-emerald-600 dark:text-emerald-400" },
  violet: { bg: "bg-violet-50 dark:bg-violet-900/10", border: "border-violet-200 dark:border-violet-800", icon: "bg-violet-100 dark:bg-violet-900/30", tag: "bg-violet-100 text-violet-700", accent: "text-violet-600 dark:text-violet-400" },
  rose:   { bg: "bg-rose-50 dark:bg-rose-900/10",   border: "border-rose-200 dark:border-rose-800",   icon: "bg-rose-100 dark:bg-rose-900/30",   tag: "bg-rose-100 text-rose-700",   accent: "text-rose-600 dark:text-rose-400" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/10", border: "border-indigo-200 dark:border-indigo-800", icon: "bg-indigo-100 dark:bg-indigo-900/30", tag: "bg-indigo-100 text-indigo-700", accent: "text-indigo-600 dark:text-indigo-400" },
};

const MASALAH = [
  {
    icon: "📊",
    title: "Laporan Keuangan Tersebar",
    desc: "Neraca ada di akuntan, SPT di konsultan pajak, Invoice di staf admin, rekening koran di direktur. Tidak ada satu tempat yang terintegrasi.",
  },
  {
    icon: "⏰",
    title: "Jatuh Tempo Pajak Sering Lupa",
    desc: "PPN tanggal 31, PPh 21 tanggal 20, SPT Tahunan April. Satu kali telat → denda & bunga yang merugikan perusahaan.",
  },
  {
    icon: "📋",
    title: "Tender Butuh Dokumen Keuangan",
    desc: "Setiap tender membutuhkan Neraca, SPT, Rekening Koran, e-Faktur. Setiap kali tender, tim harus kumpulkan dari nol.",
  },
  {
    icon: "🔍",
    title: "Tidak Ada Analisis Real-time",
    desc: "Direktur baru tahu kondisi keuangan saat laporan bulanan sudah terlambat. Tidak ada visibility harian atas kas, piutang, atau hutang.",
  },
];

const HEALTH_SCORES = [
  { label: "Profitability", value: "★★★★☆", sub: "Margin laba & efisiensi biaya" },
  { label: "Liquidity", value: "★★★☆☆", sub: "Kas, piutang & hutang lancar" },
  { label: "Solvency", value: "★★★★★", sub: "Rasio hutang & ekuitas" },
  { label: "Compliance", value: "★★★★☆", sub: "Kelengkapan & ketepatan pajak" },
];

export default function JasaKeuanganPage() {
  const { ctaUrl: builderUrl } = useTrialCTA();

  return (
    <div
      className="min-h-screen bg-white dark:bg-background"
      data-testid="page-jasa-keuangan"
    >
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-emerald-400 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-400 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-6">
                <TrendingUp className="h-3.5 w-3.5" />
                Finance & Tax Center untuk Perusahaan
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Satu Tempat untuk Seluruh<br />
                <span className="text-emerald-300">Keuangan & Perpajakan</span>
                <br />Perusahaan Anda
              </h1>
              <p className="text-base text-emerald-100 mb-4 leading-relaxed">
                Dari laporan keuangan, SPT, invoice, hingga analisis kesehatan
                finansial — semua dikelola dalam satu platform terintegrasi dengan
                AI assistant yang memahami konteks bisnis Anda.
              </p>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-6 text-sm text-emerald-100">
                <span className="font-bold text-white">Bukan sekadar cloud storage</span> —
                AI kami menganalisis kondisi keuangan, mengingatkan kewajiban pajak,
                dan menyiapkan dokumen untuk tender secara otomatis.
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
                    className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold gap-2 px-8 h-12"
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
                    data-testid="btn-hero-demo"
                  >
                    Mulai Finance Center <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "6", label: "Modul Terintegrasi", sub: "Vault · Tax · Calendar · Invoice · Asset · AI" },
                { num: "AI", label: "CFO Assistant", sub: "Tanya kondisi keuangan kapan saja" },
                { num: "Auto", label: "Reminder Pajak", sub: "Tidak ada lagi jatuh tempo terlewat" },
                { num: "1×", label: "Upload Dokumen", sub: "Dipakai ulang untuk tender & sertifikasi" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-center"
                >
                  <div className="text-2xl md:text-3xl font-extrabold">
                    {stat.num}
                  </div>
                  <div className="text-xs font-bold mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-emerald-200 mt-0.5">
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
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
              Realita Keuangan Perusahaan
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Masalah yang Dialami Hampir Semua Perusahaan
            </h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
              Keuangan dan perpajakan bukan modul pendukung — keduanya adalah inti
              operasional perusahaan yang sering tidak dikelola dengan baik.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
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
          <div className="mt-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
            <p className="text-center text-emerald-200 font-bold mb-2">
              Filosofi Gustafta Finance Center
            </p>
            <p className="text-center text-gray-300 text-sm max-w-2xl mx-auto leading-relaxed">
              Kalau Legal adalah <span className="text-white font-bold">identitas perusahaan</span>,
              maka Keuangan & Perpajakan adalah{" "}
              <span className="text-white font-bold">kesehatan perusahaan</span>.
              Gustafta menyatukan keduanya dalam Business Memory — sehingga AI dapat
              memahami hubungan antar dokumen dan memberikan rekomendasi yang tepat.
            </p>
          </div>
        </div>
      </section>

      {/* ── MODUL ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest text-center mb-2">
            6 Modul Terintegrasi
          </p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">
            Arsitektur Finance & Tax Center
          </h2>
          <p className="text-center text-gray-500 dark:text-muted-foreground text-sm mb-10 max-w-lg mx-auto">
            Setiap modul berdiri sendiri namun terhubung — data dari satu modul
            otomatis tersedia di modul lainnya melalui Business Memory.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODUL.map((mod) => {
              const c = colorStyles[mod.color];
              return (
                <div
                  key={mod.id}
                  className={`rounded-2xl border-2 ${c.bg} ${c.border} p-6`}
                  data-testid={`card-modul-${mod.id}`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${c.icon}`}
                  >
                    {mod.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    {mod.title}
                  </h3>
                  <p className={`text-[10px] font-semibold mb-3 ${c.accent}`}>
                    {mod.sub}
                  </p>
                  <ul className="space-y-1.5">
                    {mod.items.map((item, j) => (
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
          </div>
        </div>
      </section>

      {/* ── AI CFO DEMO ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                AI CFO Assistant
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Tanya Kondisi Keuangan Kapan Saja
              </h2>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mb-6 leading-relaxed">
                AI kami memahami seluruh data keuangan perusahaan Anda —
                cukup bertanya dalam bahasa sehari-hari.
              </p>
              <div className="space-y-3">
                {[
                  { q: "Berapa invoice yang belum dibayar?", a: "AI menampilkan daftar piutang terbuka per klien & jatuh tempo" },
                  { q: "Pajak apa yang harus dilaporkan minggu ini?", a: "AI menjawab: PPN Masa Juli, PPh 21, PPh Final — deadline 31 Juli" },
                  { q: "Bagaimana tren biaya operasional 3 bulan terakhir?", a: "AI menganalisis tren & memberi rekomendasi efisiensi biaya" },
                  { q: "Apakah arus kas cukup untuk bayar vendor bulan depan?", a: "AI memproyeksikan cash flow & mengidentifikasi potensi shortage" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30"
                  >
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      💬 "{item.q}"
                    </p>
                    <p className="text-xs text-gray-600 dark:text-muted-foreground">
                      → {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                Financial Health Score
              </p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Dashboard Kesehatan Keuangan
              </h2>
              <div className="space-y-3 mb-6">
                {HEALTH_SCORES.map((score, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-50 dark:bg-muted/30 rounded-xl p-4 border border-gray-100 dark:border-border"
                  >
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {score.label}
                      </p>
                      <p className="text-[10px] text-gray-500">{score.sub}</p>
                    </div>
                    <div className="text-lg text-amber-500">{score.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  Compliance Score
                </p>
                <p className="text-xs text-gray-600 dark:text-muted-foreground">
                  AI secara proaktif memantau kelengkapan dokumen pajak & ketepatan
                  waktu pelaporan — memberi skor dan rekomendasi perbaikan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRASI DENGAN TENDER ── */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest text-center mb-2">
            Integrasi dengan Layanan Lain
          </p>
          <h2 className="text-2xl font-bold text-center mb-4">
            Dokumen Keuangan Anda Siap untuk Tender
          </h2>
          <p className="text-gray-400 text-center text-sm mb-10 max-w-xl mx-auto">
            Saat ada tender, sistem tinggal mengambil data dari seluruh Business
            Memory — tidak perlu upload ulang.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-emerald-300 mb-4">
                📁 Dokumen yang Diambil Otomatis saat Tender
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Neraca Keuangan",
                  "Laporan Laba Rugi",
                  "SPT Tahunan",
                  "Bukti Setor Pajak",
                  "Rekening Koran",
                  "e-Faktur",
                  "Cash Flow",
                  "Surat Keterangan Fiskal",
                ].map((doc, i) => (
                  <div
                    key={i}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2"
                  >
                    <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs text-gray-300">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-emerald-300 mb-4">
                ✓ Manfaat Integrasi Business Memory
              </h3>
              {[
                { icon: "⚡", title: "Siap dalam Menit", desc: "Dokumen tender keuangan sudah tersedia — tidak perlu kumpulkan dari nol setiap kali ada tender." },
                { icon: "🔒", title: "Versi Terbaru Otomatis", desc: "Business Memory selalu menyajikan dokumen terbaru — tidak ada risiko pakai laporan keuangan yang sudah kedaluwarsa." },
                { icon: "🤝", title: "Sinergi dengan Compliance", desc: "Data keuangan di Finance Center otomatis mendukung proses SBU, ISO, dan sertifikasi lainnya." },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3">
                  <div className="text-xl flex-shrink-0">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PAKET / HARGA ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest text-center mb-2">
            Model Layanan
          </p>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Pilih Level yang Sesuai Kebutuhan
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: <FileText className="h-6 w-6 text-emerald-600" />,
                title: "Digital Filing",
                sub: "Level 1",
                desc: "Digitalisasi & arsip dokumen keuangan dan perpajakan dengan reminder otomatis.",
                items: ["Financial Document Vault", "Tax Center & arsip SPT", "Financial Calendar + reminder", "Notifikasi WA & Email"],
                cta: "Mulai Filing",
                highlight: false,
              },
              {
                icon: <Zap className="h-6 w-6 text-white" />,
                title: "Finance Office",
                sub: "Level 2 — Paling Populer",
                desc: "Semua fitur Level 1 plus Invoice Center, Asset Center, dan AI Financial Assistant.",
                items: ["Semua fitur Digital Filing", "Invoice & Receivable Center", "Asset & Contract Center", "AI Financial & Tax Assistant"],
                cta: "Mulai Finance Office",
                highlight: true,
              },
              {
                icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
                title: "CFO Workspace",
                sub: "Level 3",
                desc: "Platform CFO lengkap dengan analitik lintas proyek, prediksi kas, dan Executive Dashboard.",
                items: ["Semua fitur Finance Office", "Financial Health Score Dashboard", "AI Cash Flow Forecast", "Executive Decision Support"],
                cta: "Konsultasi CFO",
                highlight: false,
              },
            ].map((pkg, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 border-2 ${
                  pkg.highlight
                    ? "bg-emerald-600 border-emerald-500 text-white"
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
                <h3 className={`font-bold mb-0.5 ${pkg.highlight ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {pkg.title}
                </h3>
                <p className={`text-[10px] font-bold mb-3 ${pkg.highlight ? "text-emerald-200" : "text-gray-400"}`}>
                  {pkg.sub}
                </p>
                <p className={`text-xs mb-4 leading-relaxed ${pkg.highlight ? "text-emerald-100" : "text-gray-500 dark:text-muted-foreground"}`}>
                  {pkg.desc}
                </p>
                <ul className="space-y-1.5 mb-5">
                  {pkg.items.map((item, j) => (
                    <li key={j} className={`flex items-start gap-2 text-xs ${pkg.highlight ? "text-emerald-100" : "text-gray-700 dark:text-muted-foreground"}`}>
                      <Check className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${pkg.highlight ? "text-emerald-200" : "text-green-500"}`} />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
                  <Button
                    className={`w-full text-sm ${
                      pkg.highlight
                        ? "bg-white text-emerald-700 hover:bg-emerald-50"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
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
      <section className="py-16 px-4 bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Keuangan Sehat, Pajak Terkendali, Bisnis Siap Tender
          </h2>
          <p className="text-emerald-100 mb-2">
            Jadikan dokumen keuangan perusahaan Anda sebagai aset strategis,
            bukan beban administratif.
          </p>
          <p className="text-emerald-200 text-sm mb-8">
            Konsultasi gratis · Setup mudah · Integrasi dengan semua modul Gustafta
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold gap-2 px-8 h-12"
                data-testid="btn-final-cta"
              >
                <MessageCircle className="h-5 w-5" /> Konsultasi Gratis via WA
              </Button>
            </a>
            <Link href="/jasa-dokumen">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12"
                data-testid="btn-final-jasa-dokumen"
              >
                Lihat Biro Jasa Dokumen <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-emerald-200 mt-5">
            Lihat juga:{" "}
            <Link href="/jasa-dokumen">
              <span className="underline font-semibold cursor-pointer">
                Biro Jasa Dokumen →
              </span>
            </Link>
            {" · "}
            <Link href="/konsultan-keuangan">
              <span className="underline font-semibold cursor-pointer">
                AI untuk Akuntan →
              </span>
            </Link>
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-xs">
        <p className="mb-1">© 2026 Gustafta. Finance & Tax Center Indonesia.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/">
            <span className="hover:text-white cursor-pointer">Beranda</span>
          </Link>
          <Link href="/jasa-dokumen">
            <span className="hover:text-white cursor-pointer">Biro Jasa</span>
          </Link>
          <Link href="/konsultan-pajak">
            <span className="hover:text-white cursor-pointer">Konsultan Pajak</span>
          </Link>
          <Link href="/ruang-simpan">
            <span className="hover:text-white cursor-pointer">Ruang Simpan</span>
          </Link>
          <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer" className="hover:text-white">
            WhatsApp
          </a>
        </div>
      </footer>
    </div>
  );
}
