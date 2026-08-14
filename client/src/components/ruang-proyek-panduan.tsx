/**
 * Panduan Alur — peta integrasi fitur Gustafta di sekitar Ruang Proyek.
 * Dipakai sebagai tab di detail proyek dan dialog di daftar proyek.
 */
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HardDrive, FileSearch, ClipboardList, Calculator, MessageCircle,
  Wallet, Award, ArrowDown, ArrowRight, Lightbulb,
} from "lucide-react";

type LangkahType = {
  no: number;
  icon: React.ElementType;
  fitur: string;
  judul: string;
  desc: string;
  href?: string;
  hrefLabel?: string;
  tips?: string;
};

const LANGKAH: LangkahType[] = [
  {
    no: 1, icon: HardDrive, fitur: "Ruang Simpan",
    judul: "Simpan semua dokumen proyek di satu brankas",
    desc: "Begitu ada dokumen baru — kontrak, SPK, BAST, invoice, jaminan — unggah ke Ruang Simpan dulu. Ini sumber kebenaran tunggal; fitur lain mengambil dari sini.",
    href: "/ruang-simpan", hrefLabel: "Buka Ruang Simpan",
    tips: "Beri nama file yang jelas (mis. 'SPK-RukoMawar-2026.pdf') supaya mudah dikaitkan ke proyek.",
  },
  {
    no: 2, icon: FileSearch, fitur: "Bedah Dokumen",
    judul: "Periksa dokumen penting sebelum ditandatangani / diajukan",
    desc: "Kontrak baru atau berkas tagihan? Jalankan Bedah Dokumen — AI memeriksa klausul berbahaya (red flags) dan kelengkapan berkas sebelum terlambat.",
    href: "/bedah-dokumen", hrefLabel: "Buka Bedah Dokumen",
    tips: "Prioritaskan: kontrak sebelum tanda tangan, dan berkas tagihan sebelum diajukan ke PPK.",
  },
  {
    no: 3, icon: ClipboardList, fitur: "Ruang Proyek — Administrasi & Arsip",
    judul: "Lacak kelengkapan administrasi per tahapan",
    desc: "Di tab Administrasi Proyek, tandai status tiap dokumen baku (persiapan → pelaksanaan → serah terima). Kaitkan file dari Ruang Simpan lewat tab Arsip Dokumen supaya semuanya rapi per proyek.",
    tips: "Target: kolom 'selesai' penuh SEBELUM masa serah terima — jangan menumpuk di akhir.",
  },
  {
    no: 4, icon: Calculator, fitur: "Ruang Proyek — Costing & Toolkit",
    judul: "Awasi rugi-laba dan arus kas setiap minggu",
    desc: "Catat pendapatan & biaya di tab Costing. Untuk arus kas harian (prioritas bayar, posisi termin, buffer), pakai Toolkit CASHFLOW-PBJ — gratis.",
    href: "/toolkit-cashflow", hrefLabel: "Buka Toolkit CASHFLOW-PBJ",
    tips: "Jadwalkan Friday Review 30 menit tiap Jumat — ada panduannya di dalam toolkit.",
  },
  {
    no: 5, icon: MessageCircle, fitur: "Klinik Konsultasi",
    judul: "Konsultasikan keputusan sulit ke AI Spesialis",
    desc: "Termin macet? Klausul aneh? Ragu ambil proyek baru? Tanyakan ke Pak Arga & spesialis lain — sebutkan nama proyek dan angka dari tab Costing supaya jawabannya tajam.",
    href: "/klinik-konsultasi", hrefLabel: "Buka Klinik Konsultasi",
  },
  {
    no: 6, icon: Award, fitur: "Portfolio (Etalase Proyek)",
    judul: "Pajang proyek selesai untuk menarik klien baru",
    desc: "Setelah proyek selesai dan administrasinya rapi, aktifkan 'Pajang ke Portfolio'. Proyek tampil di etalase publik Anda — bagikan tautannya ke calon klien sebagai bukti rekam jejak.",
    tips: "Hanya info yang Anda izinkan yang tampil — nilai kontrak & nama klien tersembunyi kecuali Anda buka.",
  },
];

export function RuangProyekPanduan() {
  return (
    <div className="space-y-3" data-testid="panduan-alur-ruang-proyek">
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-4 pb-4 text-sm">
          <p className="font-semibold mb-1">Peta Alur: dari dokumen masuk sampai proyek dipajang</p>
          <p className="text-muted-foreground text-xs">
            Ruang Proyek adalah pusatnya — fitur lain berputar di sekelilingnya. Ikuti urutan ini
            supaya tidak ada dokumen tercecer, tagihan telat, atau keputusan tanpa data.
          </p>
        </CardContent>
      </Card>

      {LANGKAH.map((l, i) => (
        <div key={l.no}>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <l.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">LANGKAH {l.no} · {l.fitur.toUpperCase()}</p>
                  <p className="font-medium text-sm">{l.judul}</p>
                  <p className="text-xs text-muted-foreground mt-1">{l.desc}</p>
                  {l.tips && (
                    <p className="text-xs mt-2 flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                      <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {l.tips}
                    </p>
                  )}
                  {l.href && (
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <Link href={l.href} data-testid={`link-panduan-${l.no}`}>{l.hrefLabel} <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {i < LANGKAH.length - 1 && (
            <div className="flex justify-center py-1"><ArrowDown className="h-4 w-4 text-muted-foreground/50" /></div>
          )}
        </div>
      ))}
    </div>
  );
}
