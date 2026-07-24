/**
 * Product Bible — Referensi Internal Superadmin
 *
 * Satu halaman yang mendokumentasikan seluruh produk, fitur, ketentuan akses,
 * harga, dan aturan bisnis Gustafta. Hanya bisa diakses superadmin.
 *
 * Update setiap kali ada perubahan model bisnis, pricing, atau ketentuan fitur.
 */

import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Crown, Shield, ArrowLeft, Lock, Unlock, CheckCircle2, XCircle, AlertTriangle,
  Package, CreditCard, HardDrive, Zap, BookOpen, GraduationCap, Award, Wrench,
  FileText, Users2, TrendingUp, ClipboardList, Database, Layers, Info,
  CircleDollarSign, Scale, RefreshCw, Building2, ShoppingBag, Plus, Minus,
  LayoutGrid, Clock, BatteryLow, Moon,
} from "lucide-react";
import {
  PRICING, MARKETPLACE, HOSTING_PERIODS, SERVICE_TIERS,
  CREDIT_PACKS, RUANG_SIMPAN_PLANS, KLINIK_SESI, KLINIK_PAKET,
} from "@/data/pricing";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminMeData {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function YaBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
      <CheckCircle2 className="h-3.5 w-3.5" /> Ya
    </span>
  );
}
function TidakBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-rose-500 dark:text-rose-400 font-medium text-xs">
      <XCircle className="h-3.5 w-3.5" /> Tidak
    </span>
  );
}
function GerbangBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-xs">
      <Lock className="h-3 w-3" /> {label}
    </span>
  );
}
function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-base">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
function RuleCard({ icon: Icon, color, title, children }: { icon: any; color: string; title: string; children: React.ReactNode }) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="pt-4 pb-3 space-y-1">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        <div className="text-sm text-muted-foreground pl-6 space-y-1">{children}</div>
      </CardContent>
    </Card>
  );
}

// ─── Halaman utama ─────────────────────────────────────────────────────────────
export default function ProductBible() {
  const [, navigate] = useLocation();

  const { data: meData, isLoading } = useQuery<AdminMeData>({
    queryKey: ["/api/admin/me"],
    staleTime: 5 * 60 * 1000,
  });

  // Guard: superadmin only
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!meData?.isSuperAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
        <Lock className="h-12 w-12 text-muted-foreground/40" />
        <h1 className="text-xl font-bold">Akses Ditolak</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          Halaman ini hanya bisa diakses oleh Super Admin Gustafta.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Admin
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" /> Admin
              </Button>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-500" />
              <div>
                <h1 className="font-bold text-base leading-none">Product Bible</h1>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Referensi Internal Superadmin · Gustafta Platform</p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 border-purple-400/40 text-purple-600 dark:text-purple-400 text-xs">
            <Shield className="h-3 w-3" /> Superadmin Only
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Notice */}
        <div className="mb-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex gap-2.5 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-amber-800 dark:text-amber-300">
            <strong>Dokumen hidup.</strong> Update halaman ini setiap kali ada perubahan model bisnis, harga, atau ketentuan fitur.
            Sumber harga kanonik: <code className="text-xs bg-amber-100 dark:bg-amber-900/40 px-1 rounded">client/src/data/pricing.ts</code>
          </div>
        </div>

        <Tabs defaultValue="produk">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="produk" className="gap-1.5 text-xs"><Package className="h-3.5 w-3.5" /> Katalog Produk</TabsTrigger>
            <TabsTrigger value="akses" className="gap-1.5 text-xs"><Lock className="h-3.5 w-3.5" /> Akses & Tier</TabsTrigger>
            <TabsTrigger value="kapasitas" className="gap-1.5 text-xs"><LayoutGrid className="h-3.5 w-3.5" /> Kapasitas & Slot</TabsTrigger>
            <TabsTrigger value="harga" className="gap-1.5 text-xs"><CreditCard className="h-3.5 w-3.5" /> Harga & Langganan</TabsTrigger>
            <TabsTrigger value="bisnis" className="gap-1.5 text-xs"><Scale className="h-3.5 w-3.5" /> Aturan Bisnis</TabsTrigger>
            <TabsTrigger value="storage" className="gap-1.5 text-xs"><HardDrive className="h-3.5 w-3.5" /> Storage</TabsTrigger>
            <TabsTrigger value="keputusan" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Log Keputusan</TabsTrigger>
          </TabsList>

          {/* ══ TAB 1: KATALOG PRODUK ══════════════════════════════════════════ */}
          <TabsContent value="produk" className="space-y-6">

            {/* 1. Chatbot AI */}
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={Zap} title="Chatbot AI — 312 Produk" subtitle="Dijual satuan di /store · Diaktifkan dengan Lisensi + Langganan" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: "Chatbot Biasa", desc: "Kosongan, user merakit sendiri", lisensi: "Rp 99.000 (sekali)", badge: "Standar", color: "border-blue-200 dark:border-blue-800" },
                    { label: "Chatbot Premium", desc: "Siap pakai, dikurasi Gustafta atau Creator", lisensi: "Rp 99.000–749.000 (sekali)", badge: "Premium", color: "border-violet-200 dark:border-violet-800" },
                    { label: "Jasa Order", desc: "Custom, belum ada di katalog, dirakit tim Gustafta", lisensi: "Setup Rp 1.499.000–7.490.000 (sekali)", badge: "Jasa", color: "border-amber-200 dark:border-amber-800" },
                  ].map(p => (
                    <div key={p.label} className={`p-3 rounded-lg border-2 ${p.color} bg-muted/30`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{p.label}</span>
                        <Badge variant="outline" className="text-[10px]">{p.badge}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{p.desc}</p>
                      <p className="text-xs font-medium">Lisensi: {p.lisensi}</p>
                      <p className="text-xs text-muted-foreground">+ Langganan bulanan wajib</p>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg space-y-1">
                  <p><strong>67 Tim Multi-Agen</strong> — orchestrator hub, akses via /demo/[slug]</p>
                  <p><strong>245 Chatbot Spesialis</strong> — Engineering (195), Compliance (13), Digitalisasi (9), Bisnis (7), Sertifikasi (6), Marketing (4), Layanan (2)</p>
                  <p><strong>Tipe Output:</strong> 📄 Dokumen · 📊 Audit · ✅ Checklist · 🧮 Kalkulator · 💬 Advisor · 🗺️ Matriks</p>
                </div>
              </CardContent>
            </Card>

            {/* 2. Ekosistem Kompetensi */}
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={Award} title="Ekosistem Kompetensi" subtitle="Tools sertifikasi & kompetensi konstruksi — BUKAN chatbot. Akses via Workroom." />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "SERTIVA", desc: "E-Sertifikat Digital + QR Verifikasi", status: "Live" },
                    { label: "Diagnostik Kompetensi", desc: "Gap Analysis AI — SKK/KKNI", status: "Live" },
                    { label: "Mock Asesmen SKK", desc: "Simulasi Uji Kompetensi BNSP", status: "Live" },
                    { label: "Persiapan Asesmen", desc: "Panduan persiapan asesor", status: "Live" },
                    { label: "Skills Map & Analytics", desc: "Peta kompetensi tim", status: "Gel. 2" },
                    { label: "RPL.AI Automation", desc: "Otomasi RPL via AI", status: "Gel. 3" },
                  ].map(t => (
                    <div key={t.label} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{t.label}</span>
                          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${t.status === "Live" ? "border-emerald-400/40 text-emerald-600" : "border-muted-foreground/30 text-muted-foreground"}`}>
                            {t.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                  <strong>🔐 Ketentuan Akses:</strong> Ekosistem Kompetensi <em>bukan</em> halaman publik gratis.
                  Semua tools ada di dalam <strong>Workroom</strong> dan hanya bisa diakses pengguna berlangganan aktif.
                  Hasil (sertifikat, laporan) otomatis masuk Ruang Simpan pengguna.
                </div>
              </CardContent>
            </Card>

            {/* 3. Workroom */}
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={Wrench} title="Workroom" subtitle="Workspace terpusat — pintu masuk ke semua tools premium" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Isi Workroom</p>
                    <ul className="space-y-1.5 text-sm">
                      {[
                        "Chatbot aktif milik pengguna",
                        "Ekosistem Kompetensi (semua tools)",
                        "Ruang Kelola (manajemen chatbot)",
                        "Ruang Simpan (dokumen & output)",
                        "Klinik Konsultasi AI",
                        "Brain Project (manajemen proyek)",
                        "Tender tools (TENDERA, TenderBot)",
                      ].map(item => (
                        <li key={item} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Syarat Akses</p>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-muted/50 border text-xs">
                        <p className="font-medium">Workroom Basic</p>
                        <p className="text-muted-foreground">Beli ≥1 produk chatbot (lisensi sekali bayar)</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 text-xs">
                        <p className="font-medium text-violet-700 dark:text-violet-300">Workroom Full (+ Ekosistem Kompetensi)</p>
                        <p className="text-muted-foreground">Langganan aktif (Starter / Profesional / Bisnis)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. Ruang Kelola & Ruang Simpan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <SectionTitle icon={ClipboardList} title="Ruang Kelola" subtitle="Manajemen chatbot aktif milik pengguna" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { tier: "Belum beli apapun", akses: "❌ Tidak bisa akses", bg: "bg-muted/30" },
                    { tier: "Beli ≥1 chatbot (Starter)", akses: "✅ Kelola chatbot yang dibeli", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
                    { tier: "Langganan Profesional", akses: "✅ Multi-chatbot + folder", bg: "bg-blue-50 dark:bg-blue-950/20" },
                    { tier: "Langganan Bisnis", akses: "✅ Tim + permission per anggota", bg: "bg-violet-50 dark:bg-violet-950/20" },
                  ].map(r => (
                    <div key={r.tier} className={`p-2.5 rounded-lg border text-xs ${r.bg}`}>
                      <p className="font-medium">{r.tier}</p>
                      <p className="text-muted-foreground">{r.akses}</p>
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground">
                    ⚠️ Akses Starter adalah <em>hak pelanggan</em>, bukan promosi. Framing: "Ruang Kelola Anda sudah aktif."
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <SectionTitle icon={HardDrive} title="Ruang Simpan" subtitle="Storage dokumen — quota mengikuti tier langganan utama" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { tier: "Belum berlangganan", quota: "0 (tidak bisa simpan)", bg: "bg-muted/30" },
                    { tier: "Starter (beli ≥1 produk)", quota: "500 MB", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
                    { tier: "Profesional", quota: "5 GB", bg: "bg-blue-50 dark:bg-blue-950/20" },
                    { tier: "Bisnis", quota: "25 GB", bg: "bg-violet-50 dark:bg-violet-950/20" },
                    { tier: "Enterprise", quota: "Custom / Unlimited", bg: "bg-amber-50 dark:bg-amber-950/20" },
                  ].map(r => (
                    <div key={r.tier} className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${r.bg}`}>
                      <span className="font-medium">{r.tier}</span>
                      <span className="text-muted-foreground font-mono">{r.quota}</span>
                    </div>
                  ))}
                  <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 text-xs">
                    <p className="font-medium text-amber-700 dark:text-amber-300">Storage Add-On (top-up opsional)</p>
                    <p className="text-muted-foreground">+10 GB — Rp 29.000/bulan. Tidak perlu ganti plan. Bukan langganan baru.</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    ⚠️ Tidak ada langganan khusus Ruang Simpan (dihapus). Storage bundled ke langganan utama.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 5. Klinik & Jasa */}
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={TrendingUp} title="Klinik Konsultasi & Jasa Dokumen" subtitle="Layanan berbayar per sesi / per dokumen — tidak memerlukan langganan" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Per Sesi</p>
                    <div className="space-y-1.5">
                      {KLINIK_SESI.map(s => (
                        <div key={s.name} className="flex items-center justify-between text-xs p-2 bg-muted/40 rounded border">
                          <span>{s.name} ({s.duration})</span>
                          <span className="font-mono font-medium">{s.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Paket Klinik</p>
                    <div className="space-y-1.5">
                      {KLINIK_PAKET.map(p => (
                        <div key={p.key} className="flex items-center justify-between text-xs p-2 bg-muted/40 rounded border">
                          <span>{p.name}</span>
                          <span className="font-mono font-medium">{p.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 6. Trilogi & Ebook */}
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={BookOpen} title="Produk Pengetahuan (Buku & Ebook)" subtitle="Produk digital — beli sekali, tidak memerlukan langganan" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="font-semibold mb-1">Trilogi Bundling</p>
                    <p className="text-muted-foreground mb-1">Buku 1+2+3 + AI Mentor + Prompt</p>
                    <p className="font-mono font-bold">Rp 245.000</p>
                    <p className="text-muted-foreground">Harga coret: Rp 445.000</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="font-semibold mb-1">Trilogi Buku I Saja</p>
                    <p className="text-muted-foreground mb-1">Buku I DIALOG + AI Mentor + Prompt</p>
                    <p className="font-mono font-bold">Rp 87.000</p>
                    <p className="text-muted-foreground">Harga coret: Rp 245.000</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="font-semibold mb-1">Ebook DIALOG (satuan)</p>
                    <p className="text-muted-foreground mb-1">PDF saja + trial 7 hari builder</p>
                    <p className="font-mono font-bold">Rp 79.000</p>
                    <p className="text-muted-foreground">Harga coret: Rp 149.000</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ TAB 2: AKSES & TIER ════════════════════════════════════════════ */}
          <TabsContent value="akses" className="space-y-6">

            {/* Pintu Masuk */}
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={Unlock} title="Framework Pintu Masuk" subtitle="Tidak ada yang benar-benar gratis tanpa komitmen — setiap fitur punya gerbang" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    pintu: "Pintu 0 — Belum Beli Apapun",
                    color: "border-l-gray-400",
                    bisa: ["Demo chatbot publik (/demo/[slug])", "Landing page & katalog produk", "Bedah Dokumen (terbatas)"],
                    tidak: ["Workroom", "Ruang Kelola", "Ruang Simpan", "Ekosistem Kompetensi", "Dashboard"],
                  },
                  {
                    pintu: "Pintu 1 — Beli ≥1 Produk Chatbot",
                    color: "border-l-emerald-400",
                    bisa: ["Workroom Basic (1 proyek aktif)", "Ruang Kelola Starter (chatbot yang dibeli)", "Ruang Simpan 500 MB", "Dashboard pengguna"],
                    tidak: ["Ekosistem Kompetensi (butuh langganan)", "Multi-proyek Workroom", "Ruang Kelola multi-chatbot advanced"],
                  },
                  {
                    pintu: "Pintu 2 — Langganan Aktif (Starter/Profesional/Bisnis)",
                    color: "border-l-violet-400",
                    bisa: ["Workroom Full", "Ekosistem Kompetensi lengkap", "Ruang Kelola sesuai tier", "Ruang Simpan sesuai tier", "Semua chatbot yang dimiliki aktif"],
                    tidak: [],
                  },
                ].map(p => (
                  <div key={p.pintu} className={`border-l-4 ${p.color} pl-4 py-2 space-y-2`}>
                    <p className="font-semibold text-sm">{p.pintu}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {p.bisa.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Bisa Akses</p>
                          <ul className="space-y-0.5">
                            {p.bisa.map(b => <li key={b} className="text-xs flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />{b}</li>)}
                          </ul>
                        </div>
                      )}
                      {p.tidak.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tidak Bisa</p>
                          <ul className="space-y-0.5">
                            {p.tidak.map(t => <li key={t} className="text-xs flex gap-1.5 text-muted-foreground"><XCircle className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />{t}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Matriks Fitur */}
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={Layers} title="Matriks Fitur per Tier" subtitle="Ringkasan akses semua fitur utama" />
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-semibold min-w-[180px]">Fitur</th>
                        <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Belum Beli</th>
                        <th className="text-center py-2 px-2 font-semibold text-emerald-600">Beli Produk</th>
                        <th className="text-center py-2 px-2 font-semibold text-blue-600">Profesional</th>
                        <th className="text-center py-2 px-2 font-semibold text-violet-600">Bisnis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        ["Demo Chatbot Publik", true, true, true, true],
                        ["Dashboard Pengguna", false, true, true, true],
                        ["Workroom Basic", false, true, true, true],
                        ["Ruang Kelola Starter", false, true, true, true],
                        ["Ruang Simpan (500 MB)", false, true, true, true],
                        ["Ruang Simpan (5 GB)", false, false, true, true],
                        ["Ruang Simpan (25 GB)", false, false, false, true],
                        ["Ekosistem Kompetensi", false, false, true, true],
                        ["Workroom Full", false, false, true, true],
                        ["Multi-chatbot Kelola", false, false, true, true],
                        ["Akses Tim & Permission", false, false, false, true],
                        ["Klinik Konsultasi", "bayar", "bayar", "bayar", "bayar"],
                        ["Jasa Dokumen", "bayar", "bayar", "bayar", "bayar"],
                        ["Trilogi / Ebook", "bayar", "bayar", "bayar", "bayar"],
                      ].map(([fitur, ...cols]) => (
                        <tr key={String(fitur)} className="hover:bg-muted/30">
                          <td className="py-2 pr-4 font-medium">{fitur}</td>
                          {cols.map((val, i) => (
                            <td key={i} className="py-2 px-2 text-center">
                              {val === true ? <YaBadge /> : val === false ? <TidakBadge /> : <GerbangBadge label="Per transaksi" />}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ TAB: KAPASITAS & SLOT ═════════════════════════════════════════ */}
          <TabsContent value="kapasitas" className="space-y-6">

            {/* Butir 1-4 — apa yang dibuka setiap jenis pembelian */}
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={Unlock} title="Yang Terbuka per Jenis Pembelian (Butir 1–4)" subtitle="Kerangka kanonik — evaluasi efektivitas sambil jalan" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    no: "1",
                    judul: "Chatbot Spesialis + Berlangganan Hosting",
                    contoh: "Beli chatbot K3, Tender, SBU, ISO, dll dari /store",
                    model: "Lisensi sekali bayar + hosting recurring",
                    buka: ["Ruang Kelola (slot aktif sesuai tier)", "Ruang Simpan (500 MB – 25 GB sesuai tier)"],
                    tidak: ["Ekosistem Kompetensi"],
                    color: "border-l-blue-400",
                    bg: "bg-blue-50/50 dark:bg-blue-950/20",
                  },
                  {
                    no: "2",
                    judul: "Chatbot Premium + Berlangganan Hosting",
                    contoh: "Chatbot premium dikurasi Gustafta (premiumClass: private)",
                    model: "Lisensi premium sekali bayar + hosting recurring",
                    buka: ["Ruang Kelola (slot aktif sesuai tier)", "Ruang Simpan (sesuai tier)", "Ekosistem Kompetensi (penuh, via Workroom)"],
                    tidak: [],
                    color: "border-l-violet-400",
                    bg: "bg-violet-50/50 dark:bg-violet-950/20",
                  },
                  {
                    no: "3",
                    judul: "Bedah Dokumen · Brain Project · Klinik Konsultasi",
                    contoh: "Produk tools yang dipakai berulang per proyek/sesi",
                    model: "Berlangganan sendiri (quota/bulan) — ATAU per sesi + bonus 30 hari akses platform",
                    buka: ["Ruang Kelola (slot aktif sesuai tier)", "Ruang Simpan (sesuai tier)", "Ekosistem Kompetensi (selama berlangganan aktif)"],
                    tidak: [],
                    color: "border-l-emerald-400",
                    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
                    catatan: "Klinik per sesi → bonus 30 hari akses platform. Habis → dorong berlangganan.",
                  },
                  {
                    no: "4",
                    judul: "Jasa Dokumen · Bimtek · Executive Summary · Jasa Keuangan",
                    contoh: "Jasa sekali selesai — ada deliverable nyata yang diserahkan",
                    model: "Bayar sekali → terima deliverable → bonus akses platform berbatas waktu",
                    buka: ["Ruang Kelola (slot aktif sesuai tier, selama bonus aktif)", "Ruang Simpan (sesuai tier, selama bonus aktif)", "Ekosistem Kompetensi (selama bonus aktif)"],
                    tidak: [],
                    color: "border-l-amber-400",
                    bg: "bg-amber-50/50 dark:bg-amber-950/20",
                    catatan: "Jasa Dokumen/Executive Summary/Jasa Keuangan → bonus 30 hari. Bimtek → bonus 60 hari. Setelah habis → tawaran berlangganan.",
                  },
                ].map(b => (
                  <div key={b.no} className={`border-l-4 ${b.color} ${b.bg} rounded-r-lg p-4 space-y-2`}>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{b.no}</span>
                      <span className="font-semibold text-sm">{b.judul}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-8">{b.contoh}</p>
                    <p className="text-xs pl-8"><span className="font-medium">Model:</span> {b.model}</p>
                    <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Yang Terbuka</p>
                        <ul className="space-y-0.5">
                          {b.buka.map(item => <li key={item} className="text-xs flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />{item}</li>)}
                        </ul>
                      </div>
                      {b.tidak.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tidak Termasuk</p>
                          <ul className="space-y-0.5">
                            {b.tidak.map(item => <li key={item} className="text-xs flex gap-1.5 text-muted-foreground"><XCircle className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />{item}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                    {b.catatan && (
                      <p className="pl-8 text-[11px] text-amber-700 dark:text-amber-400 flex gap-1.5 items-start">
                        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />{b.catatan}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Kapasitas Ruang Kelola — Slot Chatbot Aktif */}
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={LayoutGrid} title="Kapasitas Ruang Kelola — Slot Chatbot Aktif" subtitle="Analoginya: bisa BELI chatbot sebanyak apapun, tapi yang bisa JALAN bersamaan tergantung tier hosting" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-semibold min-w-[160px]">Tier</th>
                        <th className="text-center py-2 px-3 font-semibold">Chatbot Bisa Dibeli</th>
                        <th className="text-center py-2 px-3 font-semibold">Chatbot Aktif Bersamaan</th>
                        <th className="text-center py-2 px-3 font-semibold">Ruang Simpan</th>
                        <th className="text-center py-2 px-3 font-semibold">Ekosistem Kompetensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        { tier: "Belum berlangganan", beli: "∞", aktif: "0", storage: "—", ekosistem: false, color: "text-muted-foreground", note: "Chatbot tidak bisa jalan" },
                        { tier: "Starter (beli ≥1 produk)", beli: "∞", aktif: "3", storage: "500 MB", ekosistem: false, color: "text-emerald-600" },
                        { tier: "Profesional", beli: "∞", aktif: "10", storage: "5 GB", ekosistem: true, color: "text-blue-600" },
                        { tier: "Bisnis", beli: "∞", aktif: "25", storage: "25 GB", ekosistem: true, color: "text-violet-600" },
                        { tier: "Enterprise", beli: "∞", aktif: "Unlimited", storage: "Custom", ekosistem: true, color: "text-purple-600" },
                      ].map(r => (
                        <tr key={r.tier} className="hover:bg-muted/30">
                          <td className={`py-2.5 pr-4 font-semibold text-xs ${r.color}`}>
                            {r.tier}
                            {r.note && <span className="block font-normal text-muted-foreground">{r.note}</span>}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">∞</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">{r.aktif}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{r.storage}</td>
                          <td className="py-2.5 px-3 text-center">
                            {r.ekosistem ? <YaBadge /> : <TidakBadge />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Kebijakan Chatbot Dormant */}
                <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                    <Moon className="h-4 w-4" /> Kebijakan Chatbot Dormant
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground pl-6">
                    <li className="flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />Chatbot yang dibeli tapi melebihi kuota slot aktif → masuk mode <strong>Dormant</strong> (tidak bisa diakses, tapi tidak dihapus)</li>
                    <li className="flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />Downgrade plan: chatbot yang melebihi slot baru → otomatis Dormant</li>
                    <li className="flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />Upgrade plan: chatbot Dormant langsung aktif kembali — tidak perlu setup ulang</li>
                    <li className="flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />Lisensi tetap milik user selamanya — Dormant bukan pencabutan hak</li>
                    <li className="flex gap-1.5 text-amber-700 dark:text-amber-400"><AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />Notifikasi wajib: "X chatbot Anda sedang Dormant — upgrade untuk mengaktifkan"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Bonus Akses Berbatas Waktu — Butir 3 & 4 */}
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={Clock} title="Bonus Akses Platform — Butir 3 & 4" subtitle="Jembatan ke langganan — bukan pengganti langganan" />
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-semibold">Produk</th>
                        <th className="text-center py-2 px-3 font-semibold">Butir</th>
                        <th className="text-center py-2 px-3 font-semibold">Model</th>
                        <th className="text-center py-2 px-3 font-semibold">Bonus Akses Platform</th>
                        <th className="text-left py-2 px-3 font-semibold">Setelah Habis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        { produk: "Bedah Dokumen", butir: "3", model: "Berlangganan (quota/bln)", bonus: "Selama berlangganan", setelah: "Nonaktif jika berhenti" },
                        { produk: "Brain Project", butir: "3", model: "Berlangganan (per proyek)", bonus: "Selama berlangganan", setelah: "Nonaktif jika berhenti" },
                        { produk: "Klinik Konsultasi (paket)", butir: "3", model: "Per paket + 30 hari akses", bonus: "30 hari", setelah: "Tawaran berlangganan" },
                        { produk: "Klinik Konsultasi (per sesi)", butir: "3", model: "Per sesi", bonus: "30 hari", setelah: "Tawaran berlangganan" },
                        { produk: "Jasa Dokumen", butir: "4", model: "Sekali bayar → deliverable", bonus: "30 hari", setelah: "Tawaran berlangganan" },
                        { produk: "Executive Summary", butir: "4", model: "Sekali bayar → deliverable", bonus: "30 hari", setelah: "Tawaran berlangganan" },
                        { produk: "Jasa Keuangan", butir: "4", model: "Sekali bayar → deliverable", bonus: "30 hari", setelah: "Tawaran berlangganan" },
                        { produk: "Bimtek Uji Kompetensi", butir: "4", model: "Sekali bayar → pelatihan", bonus: "60 hari", setelah: "Tawaran berlangganan" },
                      ].map(r => (
                        <tr key={r.produk} className="hover:bg-muted/30">
                          <td className="py-2 pr-4 font-medium">{r.produk}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant="outline" className="text-[10px]">{r.butir}</Badge>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">{r.model}</td>
                          <td className="py-2 px-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">{r.bonus}</td>
                          <td className="py-2 px-3 text-muted-foreground">{r.setelah}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  ⚠️ <strong>Status:</strong> Ini kerangka yang disepakati — belum diimplementasi sepenuhnya di sistem. Perlu mekanisme bonus access timer di DB dan notifikasi expiry.
                </p>
              </CardContent>
            </Card>

            {/* Upsell Path */}
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={TrendingUp} title="Jalur Upsell Alami" subtitle="Setiap state memiliki tekanan upsell organik" />
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  { trigger: "User beli 4 chatbot, slot Starter penuh (3)", pesan: '"Anda punya 4 chatbot, tapi 1 sedang Dormant. Upgrade Profesional untuk aktifkan semua 10."' },
                  { trigger: "Ruang Simpan 500 MB hampir penuh", pesan: '"Storage Anda 90% penuh. Upgrade ke Profesional untuk 5 GB."' },
                  { trigger: "Bonus 30 hari hampir habis (H-7)", pesan: '"Akses Workroom Anda berakhir 7 hari lagi. Berlangganan untuk tetap bisa mengakses Ruang Simpan & Ekosistem Kompetensi."' },
                  { trigger: "User Butir 1 coba akses Ekosistem Kompetensi", pesan: '"Ekosistem Kompetensi tersedia untuk pengguna Chatbot Premium atau berlangganan Profesional."' },
                ].map((u, i) => (
                  <div key={i} className="p-2.5 rounded-lg border bg-muted/30 space-y-1">
                    <p className="font-medium text-muted-foreground">Trigger: {u.trigger}</p>
                    <p className="italic text-primary/80">{u.pesan}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ TAB 3: HARGA & LANGGANAN ══════════════════════════════════════ */}
          <TabsContent value="harga" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chatbot */}
              <Card>
                <CardHeader className="pb-2">
                  <SectionTitle icon={Zap} title="Harga Chatbot" subtitle="Sekali bayar" />
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b text-xs">
                    <span className="text-muted-foreground">Lisensi Chatbot Biasa</span>
                    <span className="font-mono font-semibold">{PRICING.license.price}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b text-xs">
                    <span className="text-muted-foreground">Starter Kit (5 chatbot)</span>
                    <span className="font-mono font-semibold">{PRICING.starterKit.price}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b text-xs">
                    <span className="text-muted-foreground">Lisensi Chatbot Premium (max)</span>
                    <span className="font-mono font-semibold">Rp 749.000</span>
                  </div>
                </CardContent>
              </Card>

              {/* Langganan Platform */}
              <Card>
                <CardHeader className="pb-2">
                  <SectionTitle icon={CreditCard} title="Langganan Platform" subtitle="Recurring — wajib agar chatbot aktif" />
                </CardHeader>
                <CardContent className="space-y-2">
                  {HOSTING_PERIODS.map(p => (
                    <div key={p.key} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                      <div>
                        <span className="font-medium">{p.name}</span>
                        {p.savings && <span className="text-emerald-600 ml-2">{p.savings}</span>}
                      </div>
                      <span className="font-mono font-semibold">{p.price}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Jasa Setup */}
              <Card>
                <CardHeader className="pb-2">
                  <SectionTitle icon={Building2} title="Jasa Setup (Chatbot Custom)" subtitle="4 tier — tim Gustafta yang merakit" />
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {SERVICE_TIERS.map(t => (
                    <div key={t.tier} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                      <div>
                        <span className="font-medium">{t.tier}: {t.scope}</span>
                        <p className="text-muted-foreground">{t.desc}</p>
                      </div>
                      <span className="font-mono font-semibold">{t.price}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Kredit Pesan */}
              <Card>
                <CardHeader className="pb-2">
                  <SectionTitle icon={Database} title="Kredit Pesan (Top-Up)" subtitle="Opsional — jika kuota bulanan habis" />
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {CREDIT_PACKS.map(p => (
                    <div key={p.label} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                      <div>
                        <span className="font-medium">{p.label} — {p.pesan}</span>
                        <p className="text-muted-foreground">{p.perPesan}</p>
                      </div>
                      <span className="font-mono font-semibold">{p.price}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ══ TAB 4: ATURAN BISNIS ══════════════════════════════════════════ */}
          <TabsContent value="bisnis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RuleCard icon={Scale} color="border-l-violet-400" title="Bagi Hasil Marketplace">
                <p>80% → Creator / 20% → Gustafta</p>
                <p>Dihitung <strong>hanya dari biaya lisensi</strong> (bukan bulanan)</p>
                <p>Biaya bulanan (hosting) 100% ke Gustafta</p>
                <p className="text-amber-600 dark:text-amber-400">⚠️ Jangan hitung bagi hasil dari total pembayaran</p>
              </RuleCard>

              <RuleCard icon={CreditCard} color="border-l-emerald-400" title="Skema Tidak Ada Gratis Permanen">
                <p>Trial hanya 7 hari (bonus Starter Kit)</p>
                <p>Setelah trial → harus berlangganan atau chatbot nonaktif</p>
                <p>Ruang Simpan gratis hanya setelah beli produk (bukan pendaftaran)</p>
              </RuleCard>

              <RuleCard icon={ShoppingBag} color="border-l-blue-400" title="Lisensi = Hak Pakai Permanen">
                <p>Lisensi chatbot dibayar sekali, berlaku selamanya</p>
                <p>Yang berulang hanya biaya hosting/langganan</p>
                <p>Analoginya: domain (lisensi) vs hosting (langganan)</p>
              </RuleCard>

              <RuleCard icon={Users2} color="border-l-amber-400" title="Storage Add-On">
                <p>Tidak ada langganan standalone Ruang Simpan</p>
                <p>Storage quota bundled ke tier langganan utama</p>
                <p>Add-on: +10 GB = Rp 29.000/bulan (opsional, bukan plan baru)</p>
              </RuleCard>

              <RuleCard icon={Building2} color="border-l-indigo-400" title="Ekosistem Kompetensi — Bukan Gratis">
                <p>Tidak disebut "gratis" — disebut "sudah termasuk langganan"</p>
                <p>Tools ada di dalam Workroom, bukan halaman publik</p>
                <p>Akses = hak pelanggan berlangganan aktif</p>
                <p>Hasil/sertifikat masuk Ruang Simpan user secara otomatis</p>
              </RuleCard>

              <RuleCard icon={CircleDollarSign} color="border-l-rose-400" title="Framing Harga yang Benar">
                <p>"Ruang Kelola/Simpan Anda sudah aktif" (bukan "gratis bonus")</p>
                <p>"Sudah termasuk langganan Anda" (bukan "gratis kalau berlangganan")</p>
                <p>"Ekosistem Kompetensi ada di Workroom Anda" (bukan "bisa akses gratis")</p>
                <p className="text-amber-600 dark:text-amber-400">⚠️ Jangan tampilkan harga Rp 0 di mana pun tanpa konteks syarat</p>
              </RuleCard>
            </div>

            {/* Flywheel */}
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={RefreshCw} title="Flywheel Akuisisi" subtitle="Bagaimana pengguna terikat makin dalam" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {[
                    "Beli chatbot",
                    "Dapat Ruang Simpan + Kelola",
                    "Simpan dokumen → switching cost naik",
                    "Berlangganan → buka Workroom",
                    "Pakai Ekosistem Kompetensi",
                    "Hasil masuk Ruang Simpan",
                    "Makin terikat → beli chatbot berikutnya",
                  ].map((step, i, arr) => (
                    <>
                      <div key={step} className="px-3 py-1.5 bg-primary/10 rounded-full font-medium text-primary">{step}</div>
                      {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
                    </>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ TAB 5: STORAGE ════════════════════════════════════════════════ */}
          <TabsContent value="storage" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={HardDrive} title="Ruang Simpan — Detail Tier" subtitle="Semua angka harus sinkron dengan server/ruang-simpan-routes.ts dan pricing.ts" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {RUANG_SIMPAN_PLANS.map(p => (
                    <div key={p.key} className={`p-3 rounded-lg border ${p.highlight ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20" : "bg-muted/30"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{p.label}</span>
                        {p.badge && <Badge variant="outline" className="text-[9px]">{p.badge}</Badge>}
                      </div>
                      <p className="font-mono text-lg font-bold mb-1">{p.storage}</p>
                      <p className="text-xs text-muted-foreground mb-2">{p.perMonth}</p>
                      <ul className="space-y-1">
                        {p.features.map(f => (
                          <li key={f} className="text-[11px] flex gap-1.5 text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 text-xs text-rose-800 dark:text-rose-300">
                  <strong>⚠️ Perubahan yang sudah diputuskan (Juli 2026):</strong>
                  <ul className="mt-1 space-y-1 pl-2">
                    <li>• Langganan standalone Ruang Simpan (Esensial/Profesional/Perusahaan) <strong>DIHAPUS</strong> dari model penjualan</li>
                    <li>• Storage quota sekarang bundled ke tier langganan platform utama</li>
                    <li>• Data RUANG_SIMPAN_PLANS di pricing.ts masih ada untuk referensi UI — perlu diupdate bertahap</li>
                    <li>• Tambah: Storage Add-On +10 GB = Rp 29.000/bulan (belum diimplementasi)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ TAB 6: LOG KEPUTUSAN ══════════════════════════════════════════ */}
          <TabsContent value="keputusan" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <SectionTitle icon={FileText} title="Log Keputusan Model Bisnis" subtitle="Rekam jejak keputusan strategis — tambahkan setiap kali ada perubahan besar" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    tanggal: "Juli 2026",
                    judul: "Hapus Langganan Standalone Ruang Simpan",
                    keputusan: "Storage quota bundled ke tier langganan utama. Tidak ada lagi plan Esensial/Profesional/Perusahaan Ruang Simpan sebagai produk terpisah.",
                    alasan: "Billing terpecah membuat user bingung dan terkesan nickel-and-dime. Satu tagihan per user = lebih premium, lebih sederhana.",
                    dampak: "Perlu update pricing.ts (RUANG_SIMPAN_PLANS), hapus checkout link standalone, tambah Storage Add-On +10 GB.",
                    status: "Diputuskan, belum diimplementasi penuh",
                    statusColor: "text-amber-600",
                  },
                  {
                    tanggal: "Juli 2026",
                    judul: "Ekosistem Kompetensi Masuk Workroom (Gated Langganan)",
                    keputusan: "Ekosistem Kompetensi bukan halaman publik gratis. Semua tools (Mock Asesmen, Diagnostik, SERTIVA) hanya bisa diakses dari dalam Workroom oleh pengguna berlangganan aktif.",
                    alasan: "Tools gratis tanpa gerbang = nilai terdilusi, tidak ada insentif berlangganan, terkesan murahan. Gating ke Workroom = eksklusif, premium, mendorong upsell.",
                    dampak: "/kompetensi-hub tetap ada sebagai landing page publik yang menjelaskan tools, tapi akses hanya dari Workroom.",
                    status: "Diputuskan, perlu implementasi gating",
                    statusColor: "text-amber-600",
                  },
                  {
                    tanggal: "Juli 2026",
                    judul: "Ruang Kelola & Simpan = Hak Pelanggan, Bukan Bonus Gratis",
                    keputusan: "Starter Ruang Kelola (500 MB, 1 proyek) terbuka otomatis setelah beli ≥1 produk chatbot. Framing: 'Akun Anda sudah aktif' bukan 'gratis bonus'.",
                    alasan: "Framing bonus gratis memperlemah posisi produk. Framing hak pelanggan = menghargai user yang sudah beli, mendorong pembelian pertama.",
                    dampak: "Semua copy UI yang bilang 'gratis' untuk Ruang Kelola/Simpan perlu diubah ke framing hak pelanggan.",
                    status: "Diputuskan, belum diimplementasi perubahan copy",
                    statusColor: "text-amber-600",
                  },
                  {
                    tanggal: "Juli 2026",
                    judul: "Bersihkan 35+ Nama Chatbot — AGENT-XXX Prefix Dihapus",
                    keputusan: "Nama chatbot di DB dibersihkan dari prefix AGENT-XXX dan ORCHESTRATOR. Contoh: 'AGENT-DOCGEN — Generator Dokumen CSMS' → 'Generator Dokumen CSMS'.",
                    alasan: "Prefix teknis bocor ke halaman publik. Nama bersih = lebih profesional di store dan landing page.",
                    dampak: "35 chatbot + 5 orchestrator sudah diupdate di DB. Cek berkala: SELECT name FROM agents WHERE name LIKE '% — %'.",
                    status: "Selesai",
                    statusColor: "text-emerald-600",
                  },
                  {
                    tanggal: "Juli 2026",
                    judul: "Output-First Positioning — 312 Chatbot sebagai Generator Dokumen",
                    keputusan: "Semua chatbot diposisikan sebagai generator dokumen, bukan Q&A bot. Store cards, product landing pages, dan catalog mencantumkan tipe output (📄 📊 ✅ 🧮 💬 🗺️).",
                    alasan: "'Chatbot Q&A' tidak menjual. 'Generator dokumen siap pakai' menjawab kebutuhan nyata kontraktor Indonesia.",
                    dampak: "Product_features diupdate untuk 163+ chatbot. Store cards punya micro-label output. Landing page punya section Output yang Dihasilkan.",
                    status: "Selesai",
                    statusColor: "text-emerald-600",
                  },
                  {
                    tanggal: "Juli 2026",
                    judul: "Kapasitas Tier-Based — Slot Chatbot Aktif, Bukan Fixed Minimum",
                    keputusan: "Kapasitas Ruang Kelola (slot chatbot aktif bersamaan) mengikuti tier langganan: Starter=3, Profesional=10, Bisnis=25, Enterprise=unlimited. User bisa BELI chatbot sebanyak apapun — yang dibatasi hanya yang bisa JALAN bersamaan.",
                    alasan: "Fixed minimum (misal '5 chatbot gratis') tidak memberi insentif upgrade. Tier-based menciptakan tekanan upsell alami: user beli 8 chatbot di plan Starter → upgrade sendiri ke Profesional.",
                    dampak: "Perlu implementasi slot enforcement di DB dan UI. Chatbot melebihi kuota → Dormant (tidak dihapus, tidak bisa diakses). Notifikasi dormant wajib ditampilkan.",
                    status: "Diputuskan, belum diimplementasi",
                    statusColor: "text-amber-600",
                  },
                  {
                    tanggal: "Juli 2026",
                    judul: "Kebijakan Chatbot Dormant — Aman saat Downgrade",
                    keputusan: "Chatbot yang melebihi slot aktif → masuk Dormant (tidak bisa diakses tapi tidak dihapus). Upgrade plan → langsung aktif kembali tanpa setup ulang. Lisensi tetap milik user selamanya.",
                    alasan: "User takut downgrade karena khawatir kehilangan chatbot yang sudah dibeli. Kebijakan Dormant menghilangkan rasa takut itu → user lebih berani eksperimen plan, lebih mudah kembali upgrade.",
                    dampak: "Perlu kolom status di tabel agents/subscriptions untuk state Dormant. UI Ruang Kelola harus tampilkan chatbot Dormant dengan badge dan CTA upgrade.",
                    status: "Diputuskan, belum diimplementasi",
                    statusColor: "text-amber-600",
                  },
                  {
                    tanggal: "Juli 2026",
                    judul: "Butir 3 = Berlangganan Sendiri, Butir 4 = Jasa + Bonus Akses 30-60 Hari",
                    keputusan: "Bedah Dokumen/Brain Project/Klinik (Butir 3) = model berlangganan karena dipakai berulang. Klinik per sesi = bonus 30 hari akses platform. Jasa Dokumen/Bimtek/Executive Summary/Jasa Keuangan (Butir 4) = sekali bayar + bonus akses 30 hari (Bimtek 60 hari) sebagai jembatan ke langganan.",
                    alasan: "Butir 3 = tools yang dipakai ulang → cocok recurring. Butir 4 = deliverable sekali selesai → tidak logis dijadikan langganan, tapi perlu akses platform untuk simpan dan gunakan hasil jasa.",
                    dampak: "Perlu mekanisme bonus access timer di DB (expired_at per user). Notifikasi H-7 sebelum bonus habis. Semua Butir 4 harus punya CTA berlangganan setelah delivery.",
                    status: "Diputuskan, belum diimplementasi",
                    statusColor: "text-amber-600",
                  },
                  {
                    tanggal: "Juli 2026",
                    judul: "Ekosistem Kompetensi: Butir 1 TIDAK dapat, Butir 2/3/4 dapat",
                    keputusan: "Chatbot Spesialis (Butir 1) tidak membuka Ekosistem Kompetensi — hanya Ruang Kelola dan Ruang Simpan. Chatbot Premium (Butir 2), Butir 3, dan Butir 4 membuka Ekosistem Kompetensi (selama akses aktif).",
                    alasan: "Ekosistem Kompetensi adalah nilai tambah premium. Butir 1 sudah punya nilai dari chatbot spesialis itu sendiri. Diferensiasi ini mendorong upgrade ke chatbot premium atau langganan lebih tinggi.",
                    dampak: "Perlu flag di DB atau logic: jika user hanya punya chatbot spesialis → blokir Ekosistem Kompetensi. Jika punya ≥1 chatbot premium atau Butir 3/4 aktif → buka akses.",
                    status: "Diputuskan, belum diimplementasi gating di sistem",
                    statusColor: "text-amber-600",
                  },
                ].map((log, i) => (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{log.tanggal}</Badge>
                        <span className="font-semibold text-sm">{log.judul}</span>
                      </div>
                      <span className={`text-xs font-medium ${log.statusColor}`}>{log.status}</span>
                    </div>
                    <div className="px-4 py-3 space-y-2 text-xs">
                      <div><span className="font-medium text-muted-foreground">Keputusan:</span> {log.keputusan}</div>
                      <div><span className="font-medium text-muted-foreground">Alasan:</span> {log.alasan}</div>
                      <div><span className="font-medium text-muted-foreground">Dampak & Tindak Lanjut:</span> {log.dampak}</div>
                    </div>
                  </div>
                ))}

                {/* Tambah log baru */}
                <div className="border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                  <Plus className="h-4 w-4 mx-auto mb-1 opacity-40" />
                  Tambahkan log keputusan baru di file <code className="bg-muted px-1 rounded">client/src/pages/admin/product-bible.tsx</code> setiap kali ada perubahan model bisnis.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
