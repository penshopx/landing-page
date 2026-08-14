/**
 * Landing Ruang Proyek — halaman jualan (PAS) untuk pengunjung yang belum login.
 * Dirender oleh /ruang-proyek saat user belum masuk.
 */
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  FolderKanban, ClipboardList, Wand2, Calculator, HardDrive, MessageCircle,
  Award, CheckCircle2, ArrowRight, AlertTriangle, Compass,
} from "lucide-react";

const FITUR = [
  { icon: ClipboardList, judul: "Administrasi Proyek", desc: "Daftar dokumen baku per tahapan terisi otomatis — persiapan, pelaksanaan, serah terima. Tambah dokumen khusus, coret yang tidak perlu." },
  { icon: Wand2, judul: "Generator Dokumen", desc: "Draf SPK, BAST, dan laporan progres dibuat dalam hitungan detik — tinggal isi, salin, cetak." },
  { icon: Calculator, judul: "Costing & Rugi-Laba", desc: "Catat pendapatan & biaya per proyek — laba/rugi terhitung otomatis, ketahuan sejak dini kalau mulai merah." },
  { icon: HardDrive, judul: "Arsip Dokumen", desc: "Kaitkan kontrak, invoice, jaminan dari Ruang Simpan — semua dokumen proyek ada di satu tempat." },
  { icon: MessageCircle, judul: "Konsultasi AI", desc: "Bawa konteks proyek ke Asisten AI — strategi tender, administrasi kontrak, sampai kepatuhan dokumen." },
  { icon: Compass, judul: "Panduan Alur", desc: "Peta 6 langkah yang menuntun dari dokumen masuk sampai proyek selesai — tidak ada yang tercecer." },
];

export default function RuangProyekLanding() {
  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      {/* HERO — Problem */}
      <section className="container mx-auto px-4 pt-14 pb-10 text-center max-w-3xl">
        <p className="text-xs font-semibold tracking-widest text-blue-600 mb-3">RUANG PROYEK · RUANG KERJA DIGITAL PER PROYEK</p>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
          Proyek Jalan, Tapi Berkasnya<br />Berserakan di Mana-mana?
        </h1>
        <p className="text-muted-foreground mb-6">
          Kontrak di laci, invoice di email, catatan biaya di buku tulis, dan baru sadar ada dokumen
          kurang saat mau menagih termin. Ruang Proyek menyatukan semuanya — satu ruang kerja rapi untuk
          setiap proyek Anda.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" data-testid="button-landing-login">
            <a href="/api/login">Masuk & Buat Proyek Pertama <ArrowRight className="h-4 w-4 ml-1.5" /></a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#fitur" data-testid="link-landing-fitur">Lihat Isinya</a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Gratis dipakai — cukup masuk dengan akun Gustafta.</p>
      </section>

      {/* Agitate */}
      <section className="container mx-auto px-4 pb-12 max-w-2xl">
        <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Satu dokumen tercecer = satu termin tertunda.</p>
              <p className="text-muted-foreground text-xs">
                Berkas tagihan ditolak karena BAST belum lengkap, jaminan pelaksanaan kadaluarsa tanpa ada
                yang sadar, biaya proyek baru dihitung setelah selesai — dan ternyata rugi. Masalahnya bukan
                kerjaannya, tapi tidak ada sistem yang mengawal administrasinya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution — fitur */}
      <section id="fitur" className="container mx-auto px-4 pb-12 max-w-4xl">
        <h2 className="text-xl font-bold text-center mb-2">Satu Ruang per Proyek, Enam Alat di Dalamnya</h2>
        <p className="text-xs text-muted-foreground text-center mb-8">Buat proyek → daftar administrasi standar langsung terisi → tinggal kerjakan dan centang.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FITUR.map((f) => (
            <div key={f.judul} className="rounded-xl border p-4">
              <f.icon className="h-5 w-5 text-blue-600 mb-2" />
              <p className="text-sm font-semibold">{f.judul}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portfolio */}
      <section className="container mx-auto px-4 pb-12 max-w-3xl">
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-6">
          <div className="flex items-start gap-3">
            <Award className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Bonus: Portfolio Publik untuk Menang Klien Berikutnya</p>
              <p className="text-sm text-muted-foreground mb-3">
                Proyek yang sudah rapi bisa dipajang ke etalase publik Anda dengan satu saklar — calon klien
                melihat rekam jejak nyata, bukan sekadar klaim. Nilai kontrak & nama klien tetap tersembunyi
                kecuali Anda izinkan.
              </p>
              <ul className="space-y-1">
                {["Tautan portfolio siap dibagikan via WA atau proposal", "Anda kendalikan penuh apa yang tampil", "Matikan saklar — langsung hilang dari etalase"].map((t) => (
                  <li key={t} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA akhir */}
      <section className="container mx-auto px-4 pb-16 text-center max-w-2xl">
        <FolderKanban className="h-10 w-10 mx-auto mb-3 text-blue-600" />
        <h2 className="text-xl font-bold mb-2">Proyek Berikutnya, Mulai dengan Rapi</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Masuk, buat proyek pertama, dan daftar administrasi standar langsung tersedia. Gratis.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" data-testid="button-landing-login-bottom">
            <a href="/api/login">Masuk untuk Mulai</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/toolkit-cashflow" data-testid="link-landing-toolkit">Coba Toolkit Arus Kas (Gratis)</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
