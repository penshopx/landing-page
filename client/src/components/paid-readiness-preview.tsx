import { useEffect } from "react";
import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { SBU_SKK_EBOOK } from "@/data/pricing";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

type PreviewKind = "sbu" | "skk" | "kompetensi";

const CONTENT: Record<PreviewKind, {
  eyebrow: string;
  title: string;
  description: string;
  checks: string[];
  selectedLabel: string;
}> = {
  sbu: {
    eyebrow: "Preview Cek Kesiapan SBU",
    title: "Ketahui apa yang dinilai sebelum memilih diagnosis SBU.",
    description:
      "Diagnosis SBU memeriksa kesiapan awal badan usaha tanpa menggantikan verifikasi LSBU, LPJK, OSS, atau penilaian profesional.",
    checks: [
      "Target perjalanan dan kualifikasi SBU",
      "Personel, pengalaman, serta bukti pekerjaan",
      "Keuangan, sistem manajemen, dan kelengkapan dokumen",
    ],
    selectedLabel: "Cek Kesiapan SBU",
  },
  skk: {
    eyebrow: "Preview Cek Kesiapan SKK",
    title: "Ketahui apa yang dinilai sebelum memilih diagnosis SKK.",
    description:
      "Diagnosis SKK memeriksa kesiapan awal tenaga kerja untuk target jabatan dan jenjang yang dipilih.",
    checks: [
      "Target jabatan kerja dan jenjang SKK",
      "Pendidikan, pengalaman, serta unit kompetensi",
      "Portofolio, bukti kerja, dan persiapan uji",
    ],
    selectedLabel: "Cek Kesiapan SKK",
  },
  kompetensi: {
    eyebrow: "Preview Diagnosis Kompetensi",
    title: "Mulai dari diagnosis SKK yang terukur, bukan hasil AI gratis.",
    description:
      "Pemeriksaan Level 1 memakai rubrik deterministik agar skor stabil. Analisis gap dan rencana pengembangan tersedia pada level lanjutan.",
    checks: [
      "Konteks tujuan sertifikasi dan target jenjang",
      "Bukti pengalaman serta portofolio pekerjaan",
      "Kesiapan dokumen dan proses asesmen",
    ],
    selectedLabel: "Cek Kesiapan SKK",
  },
};

export function PaidReadinessPreview({ kind }: { kind: PreviewKind }) {
  const content = CONTENT[kind];

  useEffect(() => {
    document.title = `${content.eyebrow} | Gustafta`;
  }, [content.eyebrow]);

  return (
    <div className="min-h-[100dvh] bg-[#06131d] text-white">
      <SharedHeader />
      <main>
        <section className="relative overflow-hidden border-b border-sky-300/15">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(56,189,248,.2),transparent_40%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.05fr_.95fr] md:px-8 md:py-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-sky-300">
                {content.eyebrow}
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-[-.04em] md:text-6xl">
                {content.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                {content.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 bg-sky-400 px-7 font-bold text-slate-950 hover:bg-sky-300">
                  <Link href="/ebook-sbu-skk">
                    Lihat Paket Level 1
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <span className="flex items-center text-sm text-slate-400">
                  <ShieldCheck className="mr-2 h-4 w-4 text-sky-300" />
                  Akses diagnosis setelah order paid
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-sky-300/25 bg-sky-300/[.07] p-6 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-sky-300/15 px-3 py-1 text-xs font-bold text-sky-200">
                  Hasil Level 1
                </span>
                <LockKeyhole className="h-5 w-5 text-sky-300" />
              </div>
              <div className="mt-9 space-y-4">
                <div className="h-4 w-28 rounded bg-white/10" />
                <div className="h-20 rounded-2xl border border-white/10 bg-black/20" />
                <div className="h-14 rounded-2xl border border-white/10 bg-black/20" />
              </div>
              <p className="mt-6 text-sm leading-relaxed text-slate-300">
                Skor dan status hanya terbuka melalui tautan akses paket yang
                sudah dibayar. Jawaban mentah tidak disimpan.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <BookOpenCheck className="h-8 w-8 text-sky-300" />
              <h2 className="mt-4 text-3xl font-bold tracking-tight">
                Yang diperiksa
              </h2>
              <p className="mt-3 leading-relaxed text-slate-400">
                Preview ini menunjukkan ruang lingkupnya. Pengisian, skor, dan
                status dilakukan di halaman akses pembeli.
              </p>
            </div>
            <div className="grid gap-3">
              {content.checks.map((check) => (
                <div
                  key={check}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-5"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
                  <p className="font-medium text-slate-200">{check}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0a2030] px-5 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">
              Satu order · satu pilihan
            </p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Pilih “{content.selectedLabel}” setelah membeli.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-slate-300">
              Paket {SBU_SKK_EBOOK.priceLabel} berisi e-book utama{" "}
              {SBU_SKK_EBOOK.pages} halaman, Lampiran Toolkit{" "}
              {SBU_SKK_EBOOK.toolkitPages} halaman, dan satu diagnosis pilihan
              SBU atau SKK.
            </p>
            <Button asChild className="mt-8 h-12 bg-sky-400 px-7 font-bold text-slate-950 hover:bg-sky-300">
              <Link href="/ebook-sbu-skk">
                Pelajari Paket Level 1
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}