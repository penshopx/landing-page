import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Blocks, CheckSquare, Calculator, FileText, ShieldCheck,
  ClipboardList, TrendingUp, Wand2, LogIn, Bot, Zap,
} from "lucide-react";

const CONTOH_APPS = [
  { icon: <Calculator className="h-5 w-5 text-blue-600" />, nama: "Kalkulator & Estimator RAB", desc: "Hitung estimasi biaya, volume pekerjaan, dan cashflow proyek dengan formula siap pakai." },
  { icon: <CheckSquare className="h-5 w-5 text-emerald-600" />, nama: "Checklist Go/No-Go Tender", desc: "Cek kelengkapan file, format, dan validitas administrasi sebelum submit ke LPSE." },
  { icon: <FileText className="h-5 w-5 text-orange-600" />, nama: "Generator Dokumen", desc: "Draft kontrak, SPK, MoU, metode pelaksanaan, hingga executive summary dari data proyek Anda." },
  { icon: <ShieldCheck className="h-5 w-5 text-red-600" />, nama: "Radar Risiko & Compliance", desc: "Petakan risiko proyek dan matriks kepatuhan dokumen tender secara otomatis." },
  { icon: <ClipboardList className="h-5 w-5 text-violet-600" />, nama: "Laporan & Tracker Proyek", desc: "Snapshot proyek, log isu, action tracker, dan laporan internal siap kirim ke WhatsApp." },
  { icon: <TrendingUp className="h-5 w-5 text-cyan-600" />, nama: "Marketing & Penjualan", desc: "Kalender konten, script penjualan, copy media sosial, dan proposal — dari data usaha Anda." },
];

const LANGKAH = [
  { no: "1", judul: "Pilih atau rakit Asisten AI", desc: "Setiap asisten AI di akun Anda punya rak Mini Apps-nya sendiri." },
  { no: "2", judul: "AI membuatkan aplikasinya", desc: "Sekali klik, AI menyusun mini apps yang paling relevan dengan bidang asisten Anda." },
  { no: "3", judul: "Langsung dipakai kerja", desc: "Isi data, jalankan, dan hasilnya tersimpan — bisa diekspor atau dikirim via WhatsApp." },
];

export default function MiniAppsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SharedHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-xs font-bold text-violet-400 uppercase tracking-widest mb-4">
            Aplikasi Kerja di Dalam Dashboard
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight" data-testid="text-mini-apps-title">
            Mini Apps
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            50+ aplikasi kerja praktis — kalkulator, checklist, generator dokumen, tracker proyek —
            yang dibuatkan otomatis oleh AI, khusus untuk bidang kerja Anda. Bukan aplikasi umum:
            setiap asisten AI Anda punya perangkat kerjanya sendiri.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
              <a href="/login" data-testid="link-mini-apps-login">
                <LogIn className="h-5 w-5" /> Masuk & Buka Mini Apps
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2">
              <Link href="/asisten-ai" data-testid="link-mini-apps-asisten">
                <Bot className="h-5 w-5" /> Lihat Asisten AI Dulu
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-14">
        {/* Contoh kategori */}
        <div className="mb-14">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">Contoh Isi Raknya</p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Dari Hitung RAB Sampai Script Penjualan</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CONTOH_APPS.map((a) => (
              <div key={a.nama} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-md transition-shadow" data-testid={`card-mini-app-${a.nama.slice(0,10)}`}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">{a.icon}</div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1.5 text-sm">{a.nama}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-5">
            …dan puluhan jenis lainnya: gap analysis, risk register, KPI report, meeting notes, HSE plan, dan banyak lagi.
          </p>
        </div>

        {/* Cara kerja */}
        <div className="mb-14">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">Cara Kerjanya</p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Tiga Langkah, Langsung Kerja</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {LANGKAH.map((l) => (
              <div key={l.no} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-black flex items-center justify-center mx-auto mb-3">{l.no}</div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1.5 text-sm">{l.judul}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA akhir */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 md:p-10 text-center text-white">
          <Blocks className="h-10 w-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-black mb-2">Siap Punya Perangkat Kerja Sendiri?</h2>
          <p className="text-violet-100 text-sm mb-6 max-w-xl mx-auto">
            Masuk ke dashboard, pilih asisten AI Anda, dan biarkan AI menyusun mini apps
            yang paling relevan untuk pekerjaan Anda hari ini.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold gap-2">
              <a href="/login" data-testid="link-mini-apps-login-2">
                <LogIn className="h-5 w-5" /> Masuk / Daftar
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2">
              <Link href="/pricing" data-testid="link-mini-apps-pricing">
                <Zap className="h-4 w-4" /> Lihat Paket & Harga
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
