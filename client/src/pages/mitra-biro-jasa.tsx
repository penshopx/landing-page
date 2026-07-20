import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import {
  Check, ArrowRight, MessageCircle, FolderOpen, Bell, TrendingUp,
  Users, Zap, ChevronRight, BarChart3, Layers, ClipboardList,
  RefreshCcw, DollarSign, AlertTriangle,
} from "lucide-react";
import { trackLead } from "@/lib/meta-pixel";

const WA_URL =
  "https://wa.me/6282299417818?text=Halo%20Gustafta%2C%20saya%20tertarik%20menjadi%20Mitra%20Business%20Memory%20untuk%20biro%20jasa%20saya.%20Mohon%20info%20lebih%20lanjut.";

function handleWaClick() {
  trackLead({ content_name: "Mitra Biro Jasa WhatsApp CTA" });
}

export default function MitraBiroJasaPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-background" data-testid="page-mitra-biro-jasa">
      <SharedHeader />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 py-20 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-indigo-400 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-semibold mb-6">
            <Users className="h-3.5 w-3.5" />
            Khusus untuk Biro Jasa &amp; Konsultan Konstruksi
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Anda Punya 200+ Klien.<br />
            <span className="text-yellow-300">Tapi Berapa yang Sedang Butuh Anda — Sekarang?</span>
          </h1>
          <p className="text-base md:text-lg text-blue-100 mb-4 max-w-2xl mx-auto leading-relaxed">
            Gustafta Business Memory mengubah portofolio klien biro jasa Anda
            menjadi <strong className="text-white">mesin penjualan yang bekerja otomatis</strong> —
            mengingatkan, merekomendasikan, dan membuka peluang omzet baru setiap bulan.
          </p>
          <p className="text-sm text-blue-200 mb-8 font-semibold">
            Bukan software. Bukan storage. Ini Platform Pertumbuhan Biro Jasa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg"
                className="bg-yellow-400 text-slate-900 hover:bg-yellow-300 font-bold gap-2 px-8 h-12"
                data-testid="btn-hero-mitra-biro-jasa">
                <MessageCircle className="h-5 w-5" /> Saya Tertarik — Hubungi Kami
              </Button>
            </a>
            <a href="#model-baru">
              <Button size="lg" variant="outline"
                className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12">
                Lihat Cara Kerjanya <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
          <div className="flex flex-wrap gap-6 text-xs text-blue-200 mt-8 justify-center">
            {["Tidak perlu ganti cara kerja Anda", "Klien tetap mengenal nama biro jasa Anda", "Recurring income baru tanpa effort ekstra"].map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-yellow-300" />{s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN — SITUASI NYATA ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800">
              Situasi Nyata Biro Jasa Hari Ini
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Apakah Ini Juga Pengalaman Anda?
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              {
                icon: "📂",
                title: "Dokumen klien tersebar di mana-mana",
                desc: "Folder Google Drive, WA, email, laptop lama. Ketika klien telepon, Anda harus mencari-cari dulu.",
              },
              {
                icon: "😤",
                title: "Klien harus kirim dokumen berulang",
                desc: '"Pak, kirim ulang akta & NIB dong." Padahal mereka sudah pernah kirim 2 tahun lalu. Klien mulai tidak sabar.',
              },
              {
                icon: "📅",
                title: "Tidak tahu siapa yang mau expired",
                desc: "Ada klien yang SKK-nya habis minggu depan. Anda baru tahu ketika mereka sudah kecewa karena tidak diingatkan.",
              },
            ].map((p) => (
              <div key={p.title}
                className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-white dark:bg-card p-5 flex flex-col gap-3">
                <span className="text-3xl">{p.icon}</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{p.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* The Pitch Question */}
          <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-8 text-center">
            <div className="text-4xl mb-4">🤔</div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3">
              Satu pertanyaan sederhana:
            </h3>
            <p className="text-base md:text-lg text-blue-800 dark:text-blue-200 font-semibold mb-2">
              "Dari semua klien aktif Anda — berapa yang SBU, SKK, atau ISO-nya
              akan habis dalam <span className="underline decoration-blue-400">90 hari ke depan?</span>"
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Jika Anda tidak bisa menjawab dalam satu menit — di situlah Gustafta masuk.
            </p>
          </div>
        </div>
      </section>

      {/* ── SOLUSI: CLIENT PORTFOLIO INTELLIGENCE ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800">
              Solusi
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Client Portfolio Intelligence
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Bukan sekadar tempat menyimpan dokumen. Ini adalah platform yang mengubah
              portofolio klien Anda menjadi <strong>peluang bisnis yang terlihat dan dapat ditindaklanjuti</strong>.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              CRM + Document Management + Reminder Engine + AI Assistant — dalam satu platform
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {[
              {
                icon: FolderOpen,
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-950/30",
                title: "Client Memory",
                desc: "Seluruh dokumen dan riwayat klien tersimpan terpusat. Tidak perlu minta kirim ulang.",
              },
              {
                icon: ClipboardList,
                color: "text-violet-600",
                bg: "bg-violet-50 dark:bg-violet-950/30",
                title: "Client Timeline",
                desc: "Perjalanan layanan dari NIB hingga ISO. Gustafta tahu klien ada di tahap mana.",
              },
              {
                icon: TrendingUp,
                color: "text-emerald-600",
                bg: "bg-emerald-50 dark:bg-emerald-950/30",
                title: "Opportunity Engine",
                desc: "AI merekomendasikan layanan berikutnya. \"Klien ini siap ditawari ISO\" — otomatis.",
              },
              {
                icon: Bell,
                color: "text-orange-600",
                bg: "bg-orange-50 dark:bg-orange-950/30",
                title: "Renewal Center",
                desc: "Semua dokumen yang akan habis masa berlakunya — terurut prioritas, siap ditindaklanjuti.",
              },
            ].map((f) => (
              <div key={f.title}
                className={`rounded-2xl ${f.bg} border border-white/60 dark:border-white/5 p-5 flex flex-col gap-3`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${f.bg}`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Dashboard Preview — Text Mockup */}
          <div className="rounded-2xl border bg-slate-900 text-white p-6 font-mono text-xs leading-relaxed max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4 text-slate-400 text-[10px]">
              <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
              Dashboard Biro Jasa — Portofolio Klien
            </div>
            <div className="space-y-2">
              {[
                { co: "PT Maju Jaya", doc: "SBU", status: "⚠️ Habis 28 hari lagi", action: "→ Hubungi sekarang" },
                { co: "PT Konstruksi Nusantara", doc: "SKK x3", status: "⚠️ Habis 45 hari lagi", action: "→ Siapkan berkas" },
                { co: "PT ABC Sejahtera", doc: "ISO 9001", status: "🔴 Expired 7 hari lagi", action: "→ PRIORITAS" },
                { co: "PT Delta Bangun", doc: "—", status: "💡 Belum punya SMAP", action: "→ Tawarkan layanan baru" },
                { co: "PT Karya Mandiri", doc: "SBU ✓ SKK ✓", status: "✅ Siap ikut Tender", action: "→ Rekomendasikan tender" },
              ].map((r) => (
                <div key={r.co}
                  className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-1.5 border-b border-slate-700">
                  <span className="text-white font-semibold w-44 truncate">{r.co}</span>
                  <span className="text-slate-400 w-20">{r.doc}</span>
                  <span className="text-yellow-300 flex-1">{r.status}</span>
                  <span className="text-blue-400 text-[10px]">{r.action}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-[10px] mt-4">
              Potensi omzet bulan depan: <span className="text-emerald-400 font-bold">Rp 87.000.000</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── MODEL BARU ── */}
      <section id="model-baru" className="py-16 px-4 bg-gray-50 dark:bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800">
              Ubah Model Bisnis Anda
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Dari Pendapatan Proyek<br />ke Pendapatan Berulang
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Before */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-card p-7">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">
                ❌ Model Lama
              </div>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                {[
                  "Cari klien baru",
                  "Urus dokumen (SBU/SKK/ISO/dll)",
                  "Selesai — dibayar sekali",
                  "Hubungan selesai",
                  "Klien perlu lagi? Harus dicari lagi",
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl bg-gray-50 dark:bg-muted/30 border p-4 text-center">
                <p className="text-xs text-gray-400">Pendapatan per klien</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-300 mt-1">Rp 5 jt</p>
                <p className="text-[10px] text-gray-400">Satu kali transaksi — lalu selesai</p>
              </div>
            </div>

            {/* After */}
            <div className="rounded-2xl border-2 border-emerald-400 bg-white dark:bg-card p-7 shadow-lg shadow-emerald-500/10">
              <div className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-5">
                ✅ Model Baru dengan Gustafta
              </div>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                {[
                  "Urus dokumen seperti biasa",
                  "Simpan di Business Memory klien",
                  "Monitoring masa berlaku otomatis",
                  "Reminder proaktif ke klien",
                  "Perpanjangan = klien kembali otomatis",
                  "Tawarkan layanan berikutnya (ISO, SMAP, Tender)",
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
                <p className="text-xs text-emerald-600">Pendapatan per klien per bulan</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">Rp 99–299 rb</p>
                <p className="text-[10px] text-emerald-600">Recurring — setiap bulan — dari seluruh portofolio</p>
              </div>
            </div>
          </div>

          {/* Kalkulasi Potensi */}
          <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 text-center">
              📊 Hitung Potensi Recurring Income Anda
            </h3>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              {[
                { label: "Jika 100 klien × Rp 99.000/bln", value: "Rp 9,9 juta", sub: "per bulan" },
                { label: "Jika 200 klien × Rp 150.000/bln", value: "Rp 30 juta", sub: "per bulan" },
                { label: "Jika 500 klien × Rp 199.000/bln", value: "Rp 99,5 juta", sub: "per bulan" },
              ].map((c) => (
                <div key={c.label} className="rounded-xl bg-white dark:bg-card border p-5">
                  <p className="text-[10px] text-gray-500 mb-2">{c.label}</p>
                  <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">{c.value}</p>
                  <p className="text-xs text-gray-400">{c.sub}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-4 italic">
              Ilustrasi potensi. Harga dan hasil aktual tergantung paket yang dipilih dan aktivitas biro jasa.
            </p>
          </div>
        </div>
      </section>

      {/* ── UNTUK SIAPA ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Cocok untuk Anda yang Bergerak di Bidang Ini
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { emoji: "📋", label: "Biro Jasa SBU & SKK", desc: "Kelola ratusan sertifikasi klien — monitor expiry, proaktif follow up, recurring dari perpanjangan tahunan." },
              { emoji: "📜", label: "Konsultan ISO & SMAP", desc: "Pantau status sertifikasi seluruh portofolio klien. AI merekomendasikan klien mana yang siap upgrade." },
              { emoji: "🏗️", label: "Konsultan Tender & LKPP", desc: "Track kelengkapan dokumen tender klien, ingatkan deadline, identifikasi siapa yang siap ikut tender baru." },
              { emoji: "⚖️", label: "Konsultan Hukum & Notaris", desc: "Kelola dokumen legal klien — akta, kontrak, perizinan — dalam satu platform terstruktur." },
              { emoji: "💰", label: "Konsultan Pajak & Akuntan", desc: "Pantau kewajiban rutin klien, ingatkan deadline, buka peluang layanan berlangganan." },
              { emoji: "🌱", label: "Konsultan OSS & Perizinan", desc: "Digitalisasi seluruh perjalanan perizinan klien dari NIB hingga SLF — siap dilihat kapan saja." },
            ].map((p) => (
              <div key={p.label}
                className="rounded-2xl border bg-gray-50 dark:bg-muted/20 p-5 flex flex-col gap-3">
                <span className="text-2xl">{p.emoji}</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{p.label}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BROADCAST WA TEMPLATE ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800">
              Cara Anda Menjual ke Klien
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Template Broadcast WA yang Sudah Terbukti
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Ini yang Anda kirim ke klien-klien Anda — untuk memperkenalkan layanan baru
              "Document Management Service" yang didukung Gustafta Business Memory.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <div className="rounded-2xl bg-white dark:bg-card border border-green-200 dark:border-green-800 shadow-lg overflow-hidden">
              <div className="bg-green-600 px-5 py-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-semibold">Template Broadcast WhatsApp</span>
              </div>
              <div className="p-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
                <p><em>Yth. Rekan-rekan perusahaan yang kami dampingi.</em></p>
                <p>Apakah Anda pernah mengalami kondisi seperti ini?</p>
                <div className="space-y-1 pl-2 border-l-2 border-green-200">
                  <p>📂 Dokumen perusahaan tersimpan di banyak tempat</p>
                  <p>📅 Tidak tahu kapan SBU / SKK / ISO akan habis</p>
                  <p>🔄 Harus mengirim dokumen yang sama berulang kali</p>
                </div>
                <p>Kini kami hadir dengan layanan baru:</p>
                <p className="font-bold text-green-700 dark:text-green-400">
                  Document Management Service — powered by Gustafta Business Memory
                </p>
                <div className="space-y-1 pl-2">
                  <p>✅ Dokumen Anda tersimpan rapi dan mudah dicari</p>
                  <p>✅ Pengingat otomatis sebelum dokumen expired</p>
                  <p>✅ Riwayat layanan perusahaan Anda tercatat lengkap</p>
                  <p>✅ Siap dikirim ulang kapan pun tanpa repot</p>
                </div>
                <p>Mulai dari Rp 99.000/bulan.</p>
                <p className="font-semibold">Balas pesan ini dengan <span className="text-green-700 dark:text-green-400">DAFTAR</span> untuk informasi lebih lanjut.</p>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">
              Template ini menjadi milik Anda — dikirim atas nama biro jasa Anda sendiri.
            </p>
          </div>
        </div>
      </section>

      {/* ── CARA MEMULAI ── */}
      <section className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              3 Langkah Menjadi Mitra Business Memory
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                step: "01",
                icon: MessageCircle,
                title: "Hubungi Tim Kami",
                desc: 'Kirim WA dengan teks "MITRA". Tim kami akan menjelaskan paket dan proses onboarding — kurang dari 30 menit.',
              },
              {
                step: "02",
                icon: Layers,
                title: "Setup Portofolio Klien",
                desc: "Kami membantu Anda migrasi data klien ke dalam platform. Input data klien, dokumen aktif, dan masa berlaku.",
              },
              {
                step: "03",
                icon: RefreshCcw,
                title: "Mulai Recurring Income",
                desc: "Kirim broadcast ke klien. Aktifkan langganan. Nikmati pendapatan bulanan yang datang dari aset yang selama ini tidur.",
              },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border bg-gray-50 dark:bg-muted/20 p-6 text-center flex flex-col gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mx-auto">
                  {s.step}
                </div>
                <s.icon className="h-6 w-6 text-blue-600 mx-auto" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{s.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARLY MITRA OFFER ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-semibold mb-6">
            <AlertTriangle className="h-3.5 w-3.5" />
            Penawaran Early Adopter — Terbatas
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            50 Biro Jasa Pertama Mendapatkan Harga Founding Partner
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-8 max-w-xl mx-auto">
            Biro jasa yang bergabung di fase awal mendapatkan harga khusus yang dikunci selamanya,
            onboarding langsung dari founder, dan fitur prioritas sebelum dirilis ke publik.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: DollarSign, title: "Harga Founding Partner", desc: "Dikunci di harga awal — tidak naik meski platform berkembang." },
              { icon: Users, title: "Akses Langsung ke Founder", desc: "Onboarding 1-on-1 dan feedback loop langsung untuk pengembangan fitur." },
              { icon: Zap, title: "Fitur Eksklusif Lebih Awal", desc: "Renewal Center dan Opportunity Engine tersedia lebih awal untuk founding partners." },
            ].map((b) => (
              <div key={b.title} className="rounded-xl border border-orange-200 dark:border-orange-800 bg-white dark:bg-card p-5 text-left">
                <b.icon className="h-5 w-5 text-orange-500 mb-3" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{b.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-800 to-blue-900 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-4xl mb-4">🤝</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Mulai Ubah Portofolio Klien Anda<br />Menjadi Pendapatan Berulang
          </h2>
          <p className="text-blue-200 text-sm mb-3 leading-relaxed max-w-xl mx-auto">
            Anda sudah punya aset yang paling berharga: <strong className="text-white">kepercayaan ratusan klien</strong>.
            Gustafta membantu Anda mengaktifkannya.
          </p>
          <p className="text-blue-300 text-sm font-semibold mb-8">
            Balas WA dengan teks <strong className="text-yellow-300">MITRA</strong> untuk mulai percakapan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer">
              <Button size="lg"
                className="bg-yellow-400 text-slate-900 hover:bg-yellow-300 font-bold gap-2 px-8 h-12"
                data-testid="btn-cta-final-mitra-biro-jasa">
                <MessageCircle className="h-5 w-5" /> Saya Tertarik — Hubungi Kami
              </Button>
            </a>
            <Link href="/jasa-dokumen">
              <Button size="lg" variant="outline"
                className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12">
                Lihat Layanan Jasa Dokumen <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-blue-300 text-xs mt-6">
            Tidak ada kewajiban. Percakapan awal gratis — kami bantu analisis potensi portofolio klien Anda.
          </p>
        </div>
      </section>

      {/* ── FOOTER MINIMAL ── */}
      <footer className="border-t bg-gray-50 dark:bg-muted/10 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">GUSTAFTA — Mitra Business Memory</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Platform Pertumbuhan Biro Jasa Konstruksi</p>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-blue-600">Beranda</Link>
            <Link href="/jasa-dokumen" className="hover:text-blue-600">Jasa Dokumen</Link>
            <Link href="/klinik-konsultasi" className="hover:text-blue-600">Klinik Konsultasi</Link>
            <a href={WA_URL} onClick={handleWaClick} target="_blank" rel="noopener noreferrer"
              className="hover:text-blue-600 flex items-center gap-1">
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
