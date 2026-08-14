/**
 * /ebook-kas-merah — halaman jual ebook premium "KAS MERAH, RAB HIJAU"
 * Level 1 (pancingan): Bab 1 bisa dibaca gratis langsung di halaman ini.
 * Level 2 (premium): beli via WA (order manual), harga simulasi dari pricing.ts.
 */
import { useState } from "react";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useContactNumbers } from "@/lib/contact";
import { CASHFLOW_EBOOK } from "@/data/pricing";
import {
  BookOpen, CheckCircle2, ArrowRight, Lock, ChevronDown, ChevronUp,
  FileText, Scale, Wallet, AlertTriangle,
} from "lucide-react";

const DAFTAR_ISI = [
  { bab: "Bab 1", judul: "Satu Proyek, Dua Realita — kisah Pak R: untung Rp 420 juta, minus Rp 1,1 miliar", gratis: true },
  { bab: "Bab 2", judul: "Lima Akar, Satu Penyakit — profit ≠ cash flow, kontrak asimetris, tanpa buffer" },
  { bab: "Bab 3", judul: "Tiga Keputusan yang Anda Kira Menyelamatkan — Padahal Membunuh (Spiral Kematian)" },
  { bab: "Bab 4", judul: "Cash Triage Matrix — siapa dibayar duluan saat uang tidak cukup" },
  { bab: "Bab 5", judul: "Termin Tracker 7-Titik — melacak uang Anda di birokrasi tanpa meneror PPK" },
  { bab: "Bab 6", judul: "Buffer Protocol 10–15% — menghitung oksigen cadangan perusahaan" },
  { bab: "Bab 7", judul: "Dokumen Zero-Defect — agar berkas Anda diproses PPK paling pertama" },
  { bab: "Bab 8", judul: "Hukum & Eskalasi — bunga keterlambatan, somasi, Right to Suspend" },
  { bab: "Bab 9", judul: "Dari Bertahan ke Bertumbuh — Overlap Test, Runway, mindset CEO" },
  { bab: "Lampiran A1–A6", judul: "Lembar kerja Triage, tracker Excel, kalkulator buffer, 12 template surat & WA, checklist Zero-Defect, tabel payung hukum" },
];

const BULAN_TABLES = [
  { bulan: "Bulan ke-1: Masih Napas", warna: "border-emerald-500/30", rows: [["Kas masuk: DP 20%", "+Rp 700.000.000"], ["Kas keluar: mobilisasi, sewa, DP material & subkon", "–Rp 520.000.000"], ["Saldo akhir", "+Rp 180.000.000 ✅"]] },
  { bulan: "Bulan ke-2: Mulai Sesak", warna: "border-emerald-500/30", rows: [["Kas masuk (termin belum jatuh tempo)", "Rp 0"], ["Kas keluar: upah mingguan, BBM, material tahap 2", "–Rp 480.000.000"], ["Saldo kumulatif", "–Rp 300.000.000 ⚠️"]] },
  { bulan: "Bulan ke-3: Telepon Berdering", warna: "border-amber-500/40", rows: [["Kas masuk", "Rp 0"], ["Kas keluar: upah, material, sewa alat", "–Rp 450.000.000"], ["Saldo kumulatif", "–Rp 750.000.000 🔴"]] },
  { bulan: "Bulan ke-4: Sesak Napas", warna: "border-red-500/50", rows: [["Kas masuk (BAST belum ditandatangani)", "Rp 0"], ["Kas keluar: upah nunggak 3 minggu, somasi subkon", "–Rp 350.000.000"], ["Saldo kumulatif", "–Rp 1.100.000.000 🔴🔴"]] },
];

export default function EbookKasMerahPage() {
  const { waLink } = useContactNumbers();
  const [bacaBab1, setBacaBab1] = useState(false);
  const beliMsg = `Halo Gustafta, saya mau beli ebook "${CASHFLOW_EBOOK.judul}" (${CASHFLOW_EBOOK.hargaLabel}).`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <SharedHeader />

      {/* HERO */}
      <section className="max-w-3xl mx-auto px-4 pt-14 pb-10 text-center">
        <Badge variant="outline" className="mb-4 border-orange-500/40 text-orange-300">EBOOK PREMIUM · CASHFLOW-PBJ</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-2">{CASHFLOW_EBOOK.judul}</h1>
        <p className="text-sm text-slate-400 mb-6">{CASHFLOW_EBOOK.subjudul}</p>
        <blockquote className="text-lg sm:text-xl text-slate-100 italic leading-relaxed mb-6">
          "Proyek Anda untung Rp 420 juta di atas kertas.<br />
          Rekening Anda minus Rp 1,1 miliar di bulan ke-4.<br />
          <span className="text-orange-300 not-italic font-semibold">Buku ini menjelaskan bagaimana kedua kalimat itu bisa benar sekaligus — dan apa yang harus Anda lakukan agar tidak mengalaminya lagi.</span>"
        </blockquote>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-500">
            <a href={waLink(beliMsg)} target="_blank" rel="noopener noreferrer" data-testid="link-beli-ebook">
              Beli Ebook — {CASHFLOW_EBOOK.hargaLabel} <ArrowRight className="h-4 w-4 ml-1.5" />
            </a>
          </Button>
          <Button size="lg" variant="outline" onClick={() => { setBacaBab1(true); document.getElementById("bab1")?.scrollIntoView({ behavior: "smooth" }); }} data-testid="button-baca-bab1">
            <BookOpen className="h-4 w-4 mr-1.5" /> Baca Bab 1 Gratis
          </Button>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">Harga simulasi — dikirim sebagai file digital setelah pembayaran dikonfirmasi via WhatsApp.</p>
      </section>

      {/* Untuk siapa */}
      <section className="max-w-3xl mx-auto px-4 pb-10 grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-sm font-semibold text-emerald-300 mb-1">Buku ini untuk:</p>
          <p className="text-xs text-slate-400">Kontraktor UKM (CV / perorangan) yang mengerjakan proyek pemerintah Rp 500 juta – Rp 10 miliar, yang pernah — atau sedang — mengalami kas minus sementara RAB bilang untung.</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-semibold text-red-300 mb-1">Buku ini BUKAN untuk:</p>
          <p className="text-xs text-slate-400">Kontraktor besar dengan CFO dan tim treasury. Jika Anda punya tim keuangan 5 orang, buku ini terlalu dasar untuk Anda.</p>
        </div>
      </section>

      {/* Yang didapat */}
      <section className="max-w-3xl mx-auto px-4 pb-10">
        <h2 className="text-lg font-bold text-white text-center mb-4">Yang Anda Dapat Sampai Halaman Terakhir</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: Wallet, t: "Tiga sistem siap pakai: Cash Triage Matrix, Termin Tracker 7-Titik, Buffer Protocol" },
            { icon: FileText, t: "12 template surat & script WhatsApp yang bisa di-copy-paste Senin pagi" },
            { icon: Scale, t: "Hak hukum Anda: UU 2/2017, Perpres 46/2025, bunga keterlambatan, Right to Suspend" },
            { icon: AlertTriangle, t: "Cara membaca arus kas SEBELUM kas mulai merah — bukan sesudah" },
          ].map((x) => (
            <div key={x.t} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <x.icon className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300">{x.t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daftar isi */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-lg font-bold text-white text-center mb-4">Isi Buku — 9 Bab + 6 Lampiran (±200 halaman)</h2>
        <div className="rounded-2xl border border-slate-800 divide-y divide-slate-800/70">
          {DAFTAR_ISI.map((d) => (
            <div key={d.bab} className="flex items-start gap-3 p-3.5" data-testid={`row-toc-${d.bab.replace(/\s/g, "-").toLowerCase()}`}>
              {d.gratis
                ? <Badge className="shrink-0 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">GRATIS</Badge>
                : <Lock className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />}
              <p className="text-xs text-slate-300"><span className="font-semibold text-white">{d.bab}.</span> {d.judul}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BAB 1 GRATIS */}
      <section id="bab1" className="max-w-3xl mx-auto px-4 pb-12">
        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 overflow-hidden">
          <button className="w-full flex items-center justify-between gap-2 p-5 text-left" onClick={() => setBacaBab1((v) => !v)} data-testid="button-toggle-bab1">
            <div>
              <Badge className="mb-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">BAB 1 — BACA GRATIS</Badge>
              <p className="font-bold text-white">Satu Proyek, Dua Realita</p>
              <p className="text-xs text-slate-500">Kisah Pak R — dan mengapa "untung" tidak sama dengan "punya uang"</p>
            </div>
            {bacaBab1 ? <ChevronUp className="h-5 w-5 text-slate-500 shrink-0" /> : <ChevronDown className="h-5 w-5 text-slate-500 shrink-0" />}
          </button>

          {bacaBab1 && (
            <div className="px-5 pb-6 space-y-4 text-sm text-slate-300 leading-relaxed" data-testid="content-bab1">
              <p>Namanya tidak penting. Sebut saja Pak R.</p>
              <p>CV-nya sudah 9 tahun di industri konstruksi. Bukan pemain besar — 12 orang tim inti, 3 mandor, satu kantor ruko di pinggir jalan kabupaten. Tapi rekam jejaknya bersih: tidak pernah blacklist, tidak pernah putus kontrak. Proyek pemerintah rata-rata Rp 2–4 miliar.</p>
              <p>Tahun ini Pak R menang tender. Nilai kontrak <strong className="text-white">Rp 3,5 miliar</strong>, sumber dana APBN. Di RAB, profit margin 12% — <strong className="text-white">Rp 420 juta</strong>. Malam itu dia bilang ke istrinya, "Tahun ini kita lega."</p>
              <p>Ini yang terjadi kemudian:</p>

              <div className="grid sm:grid-cols-2 gap-3">
                {BULAN_TABLES.map((b) => (
                  <div key={b.bulan} className={`rounded-lg border ${b.warna} bg-slate-950/60 p-3`}>
                    <p className="text-xs font-semibold text-white mb-2">{b.bulan}</p>
                    {b.rows.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 text-[11px] py-0.5 border-b border-slate-800/50 last:border-0">
                        <span className="text-slate-500">{k}</span>
                        <span className={`shrink-0 font-mono ${v.startsWith("–") || v.includes("🔴") ? "text-red-400" : "text-slate-300"}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <p className="text-base text-white font-semibold text-center py-2">
                Proyeknya untung Rp 420 juta.<br />Perusahaannya minus Rp 1,1 miliar.<br />
                <span className="text-orange-300">Dan kedua kalimat itu benar — pada saat yang sama.</span>
              </p>

              <p>Ini bukan sulap. Bukan manipulasi akuntansi. Ini desain struktural industri konstruksi yang jarang diajarkan di mana pun: <strong className="text-white">profit dicatat saat pekerjaan selesai; cash flow adalah oksigen yang harus ada hari ini.</strong> Anda tidak bisa membayar upah tukang pakai proyeksi profit bulan depan.</p>
              <p>Pak R tidak rugi. Pak R tidak ditipu. Pak R hanya tidak pernah diberi tahu bahwa RAB dan rekening bank berbicara dua bahasa yang berbeda — dan tidak ada satu pun sistem di mejanya yang menerjemahkan.</p>
              <p>Yang menyelamatkan Pak R adalah satu keputusan di bulan ke-5: <strong className="text-white">dia berhenti menebak, dan mulai mencatat.</strong> Bukan software ERP Rp 50 juta. Bukan konsultan. Satu spreadsheet. Empat kolom. Di-update setiap Jumat sore.</p>

              <div className="rounded-lg border-2 border-slate-700 bg-slate-900 p-4 italic text-slate-300">
                <p className="font-semibold not-italic text-white mb-1">🔑 Satu kalimat dari bab ini:</p>
                Profit adalah cerita yang Anda ceritakan ke keluarga saat Lebaran. Cash flow adalah cerita yang rekening bank ceritakan ke Anda setiap hari. Dan rekening bank tidak pernah berbohong.
              </div>

              <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-center">
                <p className="text-sm text-white font-semibold mb-1">Bab 2–9 + 6 lampiran alat kerja menunggu di versi lengkap.</p>
                <p className="text-xs text-slate-400 mb-3">Termasuk 3 sistem siap pakai, 12 template surat & WA, dan tabel payung hukum Anda.</p>
                <Button asChild className="bg-orange-600 hover:bg-orange-500">
                  <a href={waLink(beliMsg)} target="_blank" rel="noopener noreferrer" data-testid="link-beli-ebook-bab1">
                    Beli Ebook Lengkap — {CASHFLOW_EBOOK.hargaLabel}
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Cross-sell */}
      <section className="max-w-3xl mx-auto px-4 pb-16 text-center space-y-3">
        <p className="text-xs text-slate-500">Mau sistemnya langsung jalan tanpa buka spreadsheet?</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/cashflow-pbj" data-testid="link-ke-cashflow-pbj">Lihat Paket Aplikasi CASHFLOW-PBJ</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/toolkit-cashflow" data-testid="link-ke-toolkit">Coba Toolkit Gratis</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
