import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, FileCheck2, TrendingUp, Truck, MessageCircle, Globe, ShieldCheck,
} from "lucide-react";
import { trackLead } from "@/lib/meta-pixel";
import { useContactNumbers } from "@/lib/contact";

export default function DokumenProyekPage() {
  const contact = useContactNumbers();
  const waSewa = contact.waLink(
    "Halo Gustafta, saya ingin cek ketersediaan sewa peralatan konstruksi. Alat yang dibutuhkan: "
  );

  const RAK = [
    {
      id: "jasa-dokumen",
      icon: <FileCheck2 className="h-6 w-6 text-blue-600" />,
      title: "Jasa Dokumen",
      sub: "Perijinan · Sertifikasi · Persiapan Tender",
      desc: "Pengurusan NIB/OSS, SBU, SKK, ISO, SMK3, hingga pendampingan dokumen tender LPSE — dikerjakan tim manusia berpengalaman.",
      href: "/jasa-dokumen",
      cta: "Lihat Jasa Dokumen",
      badgeCls: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      badge: "Tim Manusia",
    },
    {
      id: "jasa-keuangan",
      icon: <TrendingUp className="h-6 w-6 text-emerald-600" />,
      title: "Jasa Keuangan",
      sub: "Pembukuan Proyek · Cashflow · Laporan",
      desc: "Pembukuan proyek konstruksi, penyusunan cashflow, dan laporan keuangan sederhana untuk kebutuhan bank, pajak, dan tender.",
      href: "/jasa-keuangan",
      cta: "Lihat Jasa Keuangan",
      badgeCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      badge: "Tim Manusia",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SharedHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">
            Layanan Jasa Manusia
          </span>
          <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight" data-testid="text-dokumen-proyek-title">
            Dokumen Proyek
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Satu pintu untuk kebutuhan non-AI proyek Anda: pengurusan dokumen, pengelolaan
            keuangan, dan sewa peralatan konstruksi — dikerjakan dan didampingi tim manusia.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <a
              href="https://dokumenproyek.com"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-dokumenproyek-com"
            >
              <Globe className="h-5 w-5" /> Kunjungi dokumenproyek.com <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {RAK.map((r) => (
            <div
              key={r.id}
              className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:shadow-lg transition-shadow"
              data-testid={`card-dokumen-proyek-${r.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {r.icon}
                </div>
                <Badge className={`${r.badgeCls} border-0`}>{r.badge}</Badge>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1">{r.title}</h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">{r.sub}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5 flex-1">{r.desc}</p>
              <Button asChild variant="outline" className="gap-2 w-full">
                <Link href={r.href} data-testid={`link-${r.id}`}>
                  {r.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}

          {/* Sewa Peralatan Konstruksi — perantara via WhatsApp */}
          <div
            className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 hover:shadow-lg transition-shadow"
            data-testid="card-dokumen-proyek-sewa-peralatan"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-0">Perantara</Badge>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1">Sewa Peralatan Konstruksi</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
              Alat Berat · Scaffolding · Alat Ukur · Genset
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5 flex-1">
              Butuh alat untuk proyek berjalan? Kirim daftar kebutuhan Anda — tim kami carikan
              dan hubungkan dengan penyedia alat di jaringan mitra. Ketersediaan dan harga
              dikonfirmasi langsung via WhatsApp.
            </p>
            <Button
              asChild
              className="gap-2 w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => trackLead({ content_name: "Sewa Peralatan WA CTA" })}
            >
              <a href={waSewa} target="_blank" rel="noopener noreferrer" data-testid="link-sewa-peralatan-wa">
                <MessageCircle className="h-4 w-4" /> Cek Ketersediaan via WA
              </a>
            </Button>
          </div>
        </div>

        {/* Etalase dokumenproyek.com */}
        <div className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-900 border border-blue-200 dark:border-blue-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-slate-900 dark:text-white mb-1">
              Etalase resmi: dokumenproyek.com
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Ketiga layanan di atas juga tersedia di etalase khusus jasa kami. Kirim ke rekan
              Anda yang butuh jasa dokumen, keuangan, atau sewa alat — tanpa perlu akun Gustafta.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2 shrink-0">
            <a href="https://dokumenproyek.com" target="_blank" rel="noopener noreferrer" data-testid="link-dokumenproyek-com-2">
              Buka Etalase <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </main>
    </div>
  );
}
