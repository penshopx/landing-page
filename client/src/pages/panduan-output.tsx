import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText, CheckSquare, Table2, Calculator, ClipboardList, ExternalLink } from "lucide-react";

const KATEGORI = [
  {
    slug: "tender",
    icon: "🏗️",
    label: "Tender & Pengadaan",
    warna: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
    warnaLabel: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    chatbot: "tender-hub",
    inputContoh: "Nama paket tender + nilai pagu + persyaratan utama",
    outputContoh: [
      "✅ Checklist kelengkapan dokumen administrasi",
      "📊 Scoring kelayakan SBU & SKK",
      "⚠️ Daftar risiko kontrak + rekomendasi mitigasi",
      "📋 Strategi penawaran harga dalam format tabel",
    ],
    promptContoh: "📋 Buatkan Checklist Dokumen Tender saya sekarang",
  },
  {
    slug: "rab-boq",
    icon: "💰",
    label: "RAB & Quantity Surveying",
    warna: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
    warnaLabel: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    chatbot: "kalkulator-estimator-konstruksi",
    inputContoh: "Jenis pekerjaan + lokasi + dimensi / volume",
    outputContoh: [
      "💰 Tabel RAB: No | Uraian | Vol | Sat | Harga | Jumlah",
      "📊 Bill of Quantities siap submit",
      "⚖️ Perbandingan harga satuan per daerah",
      "🔢 Rincian perhitungan volume langkah demi langkah",
    ],
    promptContoh: "💰 Buatkan RAB — sebutkan jenis pekerjaan & lokasinya",
  },
  {
    slug: "k3-hse",
    icon: "⛑️",
    label: "K3 & HSE",
    warna: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800",
    warnaLabel: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    chatbot: "k3l-keselamatan-konstruksi",
    inputContoh: "Jenis proyek + lokasi + pekerjaan berisiko tinggi",
    outputContoh: [
      "📋 HSE Plan lengkap format tabel siap submit",
      "⚠️ HIRA: Bahaya | Lokasi | Likelihood | Severity | Kontrol",
      "✅ JSA (Job Safety Analysis) per aktivitas",
      "📄 Checklist Inspeksi K3 Harian siap cetak",
    ],
    promptContoh: "📋 Buatkan HSE Plan untuk proyek saya — sebutkan jenis proyek",
  },
  {
    slug: "iso",
    icon: "🏅",
    label: "ISO & Sistem Manajemen",
    warna: "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800",
    warnaLabel: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
    chatbot: "ims-terintegrasi-hub",
    inputContoh: "Kondisi dokumen & praktik yang sudah ada saat ini",
    outputContoh: [
      "📊 Gap Analysis: Klausul | Status | Gap | Prioritas",
      "🗺️ Roadmap sertifikasi: Fase 1 → 2 → 3 + timeline",
      "📋 Template prosedur wajib siap isi",
      "✅ Checklist Audit Internal per klausul",
    ],
    promptContoh: "📊 Lakukan Gap Analysis ISO — jawab pertanyaan klausul per klausul",
  },
  {
    slug: "sbu-skk",
    icon: "🎓",
    label: "SBU & SKK Konstruksi",
    warna: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800",
    warnaLabel: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
    chatbot: "sbu-hub",
    inputContoh: "Subklasifikasi yang dituju + data perusahaan / tenaga",
    outputContoh: [
      "✅ Checklist dokumen pengajuan SBU lengkap",
      "📊 Gap kualifikasi: syarat vs kondisi saat ini",
      "🗺️ Roadmap upgrade kelas SBU bertahap",
      "📄 Template portofolio SKK siap isi",
    ],
    promptContoh: "✅ Generate Checklist Kesiapan Pengajuan SBU lengkap",
  },
  {
    slug: "kontrak-legal",
    icon: "⚖️",
    label: "Kontrak & Legal",
    warna: "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800",
    warnaLabel: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
    chatbot: "dokumen-kontrak-klaim",
    inputContoh: "Teks klausul kontrak atau deskripsi sengketa / klaim",
    outputContoh: [
      "📊 Scoring risiko: Klausul | Risiko | Rekomendasi",
      "📄 Draft klaim EOT formal siap kirim",
      "⚠️ Red-flag klausul berbahaya + alternatif teks",
      "✅ Checklist dokumen pendukung klaim",
    ],
    promptContoh: "⚖️ Analisis klausul kontrak ini — paste teks klausul",
  },
  {
    slug: "ai-spesialis",
    icon: "🤖",
    label: "AI Spesialis (Tim Orchestrator)",
    warna: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    warnaLabel: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    chatbot: "agen-keputusan-orchestrator",
    inputContoh: "Deskripsi masalah / kebutuhan → tim delegasi ke spesialis yang tepat",
    outputContoh: [
      "📊 Analisis dari 6–10 spesialis berbeda dalam 1 sesi",
      "📋 Output gabungan: laporan + checklist + rekomendasi",
      "🎯 Action Plan terkoordinasi dari seluruh tim",
      "✅ Deliverable per divisi dalam format tabel terstruktur",
    ],
    promptContoh: "🚀 Mulai analisis — deskripsikan kebutuhan atau masalah utama",
  },
];

const OUTPUT_TYPES = [
  { icon: <Table2 className="w-5 h-5" />, label: "Tabel & RAB", desc: "Perbandingan, RAB, scoring, Bill of Quantities" },
  { icon: <CheckSquare className="w-5 h-5" />, label: "Checklist", desc: "Audit, evaluasi, kesiapan, gap analysis" },
  { icon: <FileText className="w-5 h-5" />, label: "Dokumen Formal", desc: "Surat, laporan, HSE Plan, template kontrak" },
  { icon: <Calculator className="w-5 h-5" />, label: "Perhitungan", desc: "Volume, RAB, EVM, scoring risiko" },
  { icon: <ClipboardList className="w-5 h-5" />, label: "Action Plan", desc: "Roadmap, rencana tindak, langkah bertahap" },
];

export default function PanduanOutput() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-white/10 text-white border-white/20 text-sm">
            📋 Panduan Mendapatkan Output
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Chatbot Ini Bukan Sekadar Tanya Jawab
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
            Setiap chatbot dirancang menghasilkan <strong className="text-white">dokumen, checklist, tabel, dan template siap pakai</strong> — bukan sekadar jawaban teks.
            Ikuti panduan ini untuk mendapatkan output terbaik.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {OUTPUT_TYPES.map((t, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm">
                {t.icon}
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Langkah */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-2">Cara Mendapatkan Output Terbaik</h2>
        <p className="text-muted-foreground text-center mb-8">3 langkah sederhana</p>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              no: "1",
              emoji: "📥",
              judul: "Siapkan Data Input",
              desc: "Kumpulkan data yang dibutuhkan: nama proyek, dimensi, jenis pekerjaan, atau teks dokumen yang ingin dianalisis.",
              warna: "border-blue-200 bg-blue-50 dark:bg-blue-950/20",
            },
            {
              no: "2",
              emoji: "🚀",
              judul: "Gunakan Starter Prompt",
              desc: 'Klik tombol prompt yang tersedia di halaman chat — atau ketik langsung dengan awalan "Buatkan", "Generate", atau "Hitung".',
              warna: "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20",
            },
            {
              no: "3",
              emoji: "📋",
              judul: "Salin Output Siap Pakai",
              desc: 'Output selalu muncul di blok "📋 OUTPUT SIAP PAKAI" — copy langsung ke Word, Excel, atau kirim ke WhatsApp.',
              warna: "border-violet-200 bg-violet-50 dark:bg-violet-950/20",
            },
          ].map((s) => (
            <div key={s.no} className={`rounded-xl border p-6 ${s.warna}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border flex items-center justify-center font-bold text-sm shadow-sm">
                  {s.no}
                </span>
                <span className="text-2xl">{s.emoji}</span>
              </div>
              <h3 className="font-semibold mb-2">{s.judul}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Tips copy output */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-5 mb-12">
          <p className="font-semibold mb-2 flex items-center gap-2">
            💡 <span>Tips: Minta Format Spesifik</span>
          </p>
          <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>• Tambahkan <strong>"dalam format tabel"</strong> → dapat tabel Markdown siap copy</div>
            <div>• Tambahkan <strong>"siap isi / siap pakai"</strong> → dapat template dengan [ISIAN]</div>
            <div>• Tambahkan <strong>"format Word/Excel"</strong> → struktur yang mudah dipaste</div>
            <div>• Klik <strong>"📄 Buat Dokumen"</strong> setelah chat → output jadi dokumen formal</div>
          </div>
        </div>

        {/* Per Kategori */}
        <h2 className="text-2xl font-bold mb-2">Panduan per Kategori Chatbot</h2>
        <p className="text-muted-foreground mb-8">Input yang tepat → output yang berguna</p>

        <div className="space-y-4">
          {KATEGORI.map((k) => (
            <div key={k.slug} className={`rounded-xl border p-6 ${k.warna}`}>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{k.icon}</span>
                  <div>
                    <Badge className={`${k.warnaLabel} border-0 mb-1`}>{k.label}</Badge>
                    <h3 className="font-semibold text-base">{k.label}</h3>
                  </div>
                </div>
                <Link href={`/bot/${k.chatbot}`}>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    Coba Chatbot <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    📥 Input yang Dibutuhkan
                  </p>
                  <div className="bg-white/60 dark:bg-white/5 rounded-lg px-4 py-3 text-sm">
                    {k.inputContoh}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 mt-4">
                    🚀 Contoh Starter Prompt
                  </p>
                  <div className="bg-white/60 dark:bg-white/5 rounded-lg px-4 py-3 text-sm font-mono text-xs">
                    {k.promptContoh}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    📋 Output yang Dihasilkan
                  </p>
                  <ul className="space-y-1.5">
                    {k.outputContoh.map((o, i) => (
                      <li key={i} className="text-sm bg-white/60 dark:bg-white/5 rounded-lg px-3 py-2">
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center rounded-2xl bg-slate-900 text-white p-10">
          <h2 className="text-2xl font-bold mb-3">Siap Coba Chatbot-nya?</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Pilih chatbot sesuai kebutuhan — langsung hasilkan dokumen, checklist, dan analisis siap pakai.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/store">
              <Button size="lg" className="gap-2 bg-white text-slate-900 hover:bg-slate-100">
                Lihat Semua Chatbot <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/bot/gustafta-helpdesk">
              <Button size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
                Tanya AI Gustafta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
