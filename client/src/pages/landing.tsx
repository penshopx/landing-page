import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  FolderKanban,
  FolderOpen,
  GraduationCap,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Wrench,
} from "lucide-react";
import type { MouseEventHandler, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { SBU_SKK_EBOOK, SBU_SKK_FUNNEL, SBU_SKK_RENEWAL_HUB } from "@/data/pricing";
import { trackLead } from "@/lib/meta-pixel";
import { LandingConstructionWorkflowCarousel, LandingVideoCarousel } from "@/components/landing-media-carousel";
import "./landing.css";

const funnel = SBU_SKK_FUNNEL;
const ebook = SBU_SKK_EBOOK;
const renewalHub = SBU_SKK_RENEWAL_HUB;

function ActionLink({ href, children, testId, light = false, onClick }: {
  href: string; children: ReactNode; testId?: string; light?: boolean; onClick?: () => void;
}) {
  return (
    <Button asChild size="lg" data-testid={testId} className={light
      ? "h-12 rounded-xl bg-[#f4c95d] px-5 font-bold text-[#173847] shadow-[0_10px_24px_rgba(244,201,93,.2)] transition-transform hover:-translate-y-0.5 hover:bg-[#ffda78]"
      : "h-12 rounded-xl bg-[#173847] px-5 font-bold text-[#f7f1e6] shadow-[0_10px_24px_rgba(23,56,71,.16)] transition-transform hover:-translate-y-0.5 hover:bg-[#24566a]"}>
      <Link href={href} onClick={onClick}>{children}</Link>
    </Button>
  );
}

function Session({ number, label, title, body, href, icon: Icon, accent, testId, nativeAnchor = false, onClick }: {
  number: string; label: string; title: string; body: string; href: string;
  icon: typeof Building2; accent: string; testId: string;
  nativeAnchor?: boolean; onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const className = "group relative flex min-h-[280px] flex-col overflow-hidden rounded-[1.5rem] border border-[#d4ded8] bg-[#fffaf1] p-6 shadow-[0_12px_34px_rgba(23,56,71,.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#8baeb0] hover:shadow-[0_20px_42px_rgba(23,56,71,.13)]";
  const content = (
    <>
      <span className={`absolute right-0 top-0 h-1.5 w-24 ${accent}`} />
      <div className="mb-10 flex items-center justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent} ${accent.includes("173847") ? "text-[#f7f1e6]" : "text-[#173847]"}`}><Icon className="h-5 w-5" /></span>
        <span className="font-mono text-xs font-bold tracking-[.2em] text-[#8a9b98]">{number}</span>
      </div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#b55e45]">{label}</p>
      <h3 className="font-display text-2xl font-semibold tracking-[-.04em] text-[#173847]">{title}</h3>
      <p className="mt-3 max-w-[29ch] text-sm leading-6 text-[#607373]">{body}</p>
      <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-bold text-[#173847] group-hover:text-[#b55e45]">
        Buka ruang ini <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </>
  );

  if (nativeAnchor) {
    return <a href={href} onClick={onClick} data-testid={testId} className={className}>{content}</a>;
  }

  return (
    <Link href={href} data-testid={testId} className={className}>
      {content}
    </Link>
  );
}

function Capability({ icon: Icon, title, body, href }: { icon: typeof Search; title: string; body: string; href: string }) {
  return (
    <Link href={href} className="group flex gap-4 rounded-2xl border border-[#d7e0da] bg-[#fffaf1] p-5 transition-colors hover:border-[#9bb8b7]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e1efea] text-[#b55e45]"><Icon className="h-5 w-5" /></span>
      <span><strong className="font-display text-lg text-[#173847]">{title}</strong><span className="mt-1 block text-sm leading-6 text-[#687a78]">{body}</span><span className="mt-3 flex items-center gap-1 text-xs font-bold text-[#173847]">Jelajahi <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span></span>
    </Link>
  );
}

function ExternalToolCard({ step, label, title, body, href, icon: Icon, testId, dark = false }: {
  step?: string;
  label?: string;
  title: string;
  body: string;
  href: string;
  icon: typeof ClipboardCheck;
  testId: string;
  dark?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={testId}
      aria-label={`${title} — buka aplikasi eksternal di tab baru`}
      className={dark
        ? "group flex min-h-[240px] flex-col rounded-2xl border border-[#52777d] bg-[#214c5b] p-5 text-[#f7f1e6] transition-transform hover:-translate-y-1"
        : "group flex min-h-[240px] flex-col rounded-2xl border border-[#d4ded8] bg-[#fffaf1] p-5 transition-transform hover:-translate-y-1 hover:border-[#8baeb0]"}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={dark
          ? "flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4c95d] text-[#173847]"
          : "flex h-10 w-10 items-center justify-center rounded-xl bg-[#e1efea] text-[#173847]"}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className={dark
          ? "font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#f4c95d]"
          : "font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#b55e45]"}>
          {label ?? `Langkah ${step}`}
        </span>
      </div>
      <h3 className={dark
        ? "mt-8 font-display text-xl font-semibold text-[#f7f1e6]"
        : "mt-8 font-display text-xl font-semibold text-[#173847]"}>
        {title}
      </h3>
      <p className={dark
        ? "mt-2 text-sm leading-6 text-[#c7d5d3]"
        : "mt-2 text-sm leading-6 text-[#687a78]"}>
        {body}
      </p>
      <span className={dark
        ? "mt-auto flex items-center gap-2 pt-5 text-xs font-bold text-[#f4c95d]"
        : "mt-auto flex items-center gap-2 pt-5 text-xs font-bold text-[#173847]"}>
        Buka aplikasi eksternal
        <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </a>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const workspaceHref = isAuthenticated ? "/dashboard" : "/login";
  const lead = (content_name: string) => trackLead({ content_name });
  const scrollToRenewalHub: MouseEventHandler<HTMLAnchorElement> = (event) => {
    event.preventDefault();
    const target = document.getElementById("jalur-sbu-skk");
    if (!target) return;
    window.history.pushState(null, "", "#jalur-sbu-skk");
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="landing-page min-h-[100dvh] overflow-x-hidden bg-[#f7f1e6] text-[#173847]" data-testid="page-landing">
      <SharedHeader />
      <div className="border-b border-[#e2d9c8] bg-[#f0e8d9] px-4 py-2.5 text-center text-xs font-medium text-[#607373]">
        <span className="mr-2 inline-block rounded-full bg-[#173847] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f7f1e6]">Platform konstruksi</span>
        Satu tempat untuk memahami, memenangkan, dan menjalankan pekerjaan.
      </div>

      <section className="relative overflow-hidden bg-[#173847] px-5 pb-20 pt-16 text-[#f7f1e6] md:pb-28 md:pt-24">
        <div className="absolute -right-36 -top-44 h-[42rem] w-[42rem] rounded-full border-[76px] border-[#c96f52]/25" />
        <div className="absolute bottom-[-15rem] left-[-10rem] h-[34rem] w-[34rem] rounded-full border border-[#9cc4c6]/30" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#9cc4c6]/40 bg-[#9cc4c6]/10 px-3 py-1.5 text-xs font-semibold text-[#c7e2df]"><Layers3 className="h-3.5 w-3.5" /> Ekosistem kerja Indonesia</div>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[.97] tracking-[-.07em] md:text-7xl">Kerja konstruksi<br /><span className="text-[#f4c95d]">lebih terarah.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#c7d5d3] md:text-lg">Gustafta menyatukan pengetahuan, dokumen, peluang tender, dan ruang proyek untuk kontraktor serta profesional konstruksi Indonesia.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ActionLink href={funnel.readiness.landingPath} testId="cta-hero-cek-kesiapan" light onClick={() => lead("Cek Kesiapan SBU — Hero")}>Cek kesiapan SBU <ArrowRight className="h-4 w-4" /></ActionLink>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-[#7b9ca3] bg-transparent px-5 font-semibold text-[#f7f1e6] hover:bg-[#f7f1e6]/10" data-testid="cta-hero-jelajahi"><a href="#platform">Lihat seluruh platform</a></Button>
            </div>
            <p className="mt-5 text-xs text-[#9db5bc]">Untuk BUJK, administrator legalitas, konsultan, biro jasa, dan tim proyek.</p>
          </div>
          <div className="relative hidden lg:block">
            <div className="rotate-2 rounded-[1.75rem] bg-[#f7f1e6] p-7 text-[#173847] shadow-[0_30px_80px_rgba(0,0,0,.28)]">
              <div className="mb-8 flex items-center justify-between border-b border-[#d6dfd8] pb-4"><span className="font-display text-lg font-bold">Gustafta / 00</span><span className="rounded-full bg-[#f4c95d] px-2 py-1 font-mono text-[10px] font-bold">RUANG KERJA</span></div>
              <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#b55e45]">Mulai dari sini</p>
              <p className="mt-3 font-display text-3xl font-semibold leading-tight">Apa yang sedang Anda bangun?</p>
              <div className="mt-8 space-y-3 text-sm text-[#607373]">
                {["Legalitas dan kompetensi", "Peluang tender baru", "Pekerjaan yang sedang berjalan"].map((item) => <div key={item} className="flex items-center gap-2 border-b border-[#e7ded0] pb-3"><Check className="h-4 w-4 text-[#b55e45]" />{item}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        <LandingVideoCarousel />
        <section className="px-5 py-20 md:py-24" id="layanan">
          <div className="mx-auto max-w-6xl"><div className="mb-10 max-w-2xl"><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b55e45]">Satu ekosistem, banyak pintu masuk</p><h2 className="font-display text-4xl font-semibold leading-tight tracking-[-.06em] md:text-5xl">Dari pertanyaan pertama sampai pekerjaan selesai.</h2></div><div className="grid gap-4 md:grid-cols-3">
            <Link href="/klinik-konsultasi" className="rounded-[1.5rem] bg-[#173847] p-7 text-[#f7f1e6] transition-transform hover:-translate-y-1"><Stethoscope className="mb-14 h-6 w-6 text-[#f4c95d]" /><h3 className="font-display text-2xl font-semibold">Klinik Konsultasi</h3><p className="mt-2 text-sm leading-6 text-[#c7d5d3]">Bawa pertanyaan SBU, SKK, tender, atau operasional ke ruang konsultasi yang tepat.</p><span className="mt-6 flex items-center gap-2 text-sm font-bold text-[#f4c95d]">Masuk ke klinik <ChevronRight className="h-4 w-4" /></span></Link>
            <Link href="/bedah-dokumen" className="rounded-[1.5rem] border border-[#d4ded8] bg-[#fffaf1] p-7 transition-transform hover:-translate-y-1"><FileCheck2 className="mb-14 h-6 w-6 text-[#c96f52]" /><h3 className="font-display text-2xl font-semibold">Bedah Dokumen</h3><p className="mt-2 text-sm leading-6 text-[#687a78]">Baca berkas kerja dengan lebih cepat dan temukan bagian yang perlu ditindaklanjuti.</p><span className="mt-6 flex items-center gap-2 text-sm font-bold">Bedah dokumen <ChevronRight className="h-4 w-4" /></span></Link>
            <Link href="/brain-project" className="rounded-[1.5rem] border border-[#d4ded8] bg-[#e1efea] p-7 transition-transform hover:-translate-y-1"><Sparkles className="mb-14 h-6 w-6 text-[#b55e45]" /><h3 className="font-display text-2xl font-semibold">Brain Project</h3><p className="mt-2 text-sm leading-6 text-[#607373]">Rakit pengetahuan organisasi menjadi konteks kerja yang dapat dipakai tim.</p><span className="mt-6 flex items-center gap-2 text-sm font-bold">Kenali Brain Project <ChevronRight className="h-4 w-4" /></span></Link>
          </div></div>
        </section>
        <section className="border-y border-[#d4ded8] bg-[#f0e8d9] px-5 py-20 md:py-24" data-testid="section-knowledge-to-ai"><div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[.85fr_1.15fr]"><div><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b55e45]">Dari pengetahuan menjadi AI</p><h2 className="font-display text-4xl font-semibold leading-tight tracking-[-.06em] md:text-5xl">Pengetahuan lapangan tidak berhenti di kepala satu orang.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#607373]">Regulasi, SOP, metode kerja, dan pengalaman tim dapat dirapikan menjadi fondasi yang lebih mudah dicari dan digunakan kembali.</p><Link href="/brain-project" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#173847]">Bangun fondasi pengetahuan <ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-3 sm:grid-cols-2">{["Regulasi & kebijakan", "Dokumen & SOP", "Metode kerja", "Pengalaman profesional"].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#d4ded8] bg-[#fffaf1] p-4 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9cc4c6] text-[#173847]"><Check className="h-4 w-4" /></span>{item}</div>)}</div></div></section>
        <LandingConstructionWorkflowCarousel />
        <section className="px-5 py-20 md:py-24" data-testid="section-journey"><div className="mx-auto max-w-6xl"><div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b55e45]">Cara kerja Gustafta</p><h2 className="font-display text-4xl font-semibold tracking-[-.06em] md:text-5xl">Satu alur yang bisa Anda lihat.</h2></div><p className="max-w-sm text-sm leading-6 text-[#687a78]">Temukan, pahami, kerjakan, lalu simpan konteksnya untuk langkah berikutnya.</p></div><div className="grid gap-3 md:grid-cols-4">{[["01","Temukan","Peluang dan pertanyaan masuk ke ruang yang tepat."],["02","Pahami","Dokumen dan pengetahuan diringkas menjadi konteks."],["03","Kerjakan","Tim mengambil langkah dengan alat yang sesuai."],["04","Simpan","Hasil kerja menjadi referensi untuk pekerjaan berikutnya."]].map(([n,t,b]) => <div key={n} className="border-l-2 border-[#c96f52] px-5 py-2"><span className="font-mono text-xs font-bold text-[#b55e45]">{n}</span><h3 className="mt-5 font-display text-xl font-semibold">{t}</h3><p className="mt-2 text-sm leading-6 text-[#687a78]">{b}</p></div>)}</div></div></section>
        <section className="px-5 py-20 md:py-28" id="platform">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b55e45]">Empat ruang prioritas</p><h2 className="max-w-3xl font-display text-4xl font-semibold leading-tight tracking-[-.06em] md:text-5xl">Pilih pekerjaan yang ingin<br />Anda gerakkan hari ini.</h2></div><p className="max-w-xs text-sm leading-6 text-[#687a78]">Tidak perlu mempelajari semuanya sekaligus. Mulai dari sesi yang paling dekat dengan pekerjaan Anda.</p></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Session number="01" label="Legalitas" title="SBU" body="Cek kesiapan badan usaha dan ubah regulasi menjadi daftar kerja yang jelas." href="#jalur-sbu-skk" icon={ShieldCheck} accent="bg-[#f4c95d]" testId="session-sbu" nativeAnchor onClick={scrollToRenewalHub} />
              <Session number="02" label="Kompetensi" title="SKK" body="Temukan jalur kompetensi, pembaruan, dan pendampingan untuk tenaga konstruksi." href="/skk" icon={GraduationCap} accent="bg-[#9cc4c6]" testId="session-skk" />
              <Session number="03" label="Peluang" title="Tender" body="Baca peluang, siapkan dokumen, dan masuk ke proses tender dengan konteks." href="/tender" icon={Search} accent="bg-[#c96f52]" testId="session-tender" />
              <Session number="04" label="Pelaksanaan" title="Proyek" body="Jaga dokumen, keputusan, dan progres pekerjaan tetap berada dalam satu ruang." href="/ruang-proyek" icon={FolderKanban} accent="bg-[#173847] text-[#f7f1e6]" testId="session-proyek" />
            </div>
          </div>
        </section>

        <section className="border-y border-[#d4ded8] bg-[#e7f0eb] px-5 py-20 md:py-24">
          <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b55e45]">Bukan hanya AI</p><h2 className="font-display text-4xl font-semibold leading-tight tracking-[-.06em] md:text-5xl">Peralatan yang mengikuti alur kerja nyata.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#607373]">Gustafta dirancang sebagai ekosistem: pengetahuan untuk memutuskan, alat untuk menyiapkan, dan ruang untuk menyelesaikan.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Capability icon={FolderOpen} title="Ruang Simpan" body="Dokumen perusahaan tersusun dan mudah ditemukan saat dibutuhkan." href="/ruang-simpan" />
              <Capability icon={FileCheck2} title="Bedah Dokumen" body="Baca dokumen kerja dengan lebih cepat sebelum mengambil keputusan." href="/bedah-dokumen" />
              <Capability icon={BriefcaseBusiness} title="Klinik Konsultasi" body="Bawa pertanyaan spesifik ke ruang konsultasi yang tepat." href="/klinik-konsultasi" />
              <Capability icon={Sparkles} title="Asisten AI" body="Gunakan AI ketika konteksnya sudah jelas dan bantuan memang diperlukan." href="/asisten-ai" />
              <Capability icon={BookOpen} title="Ebook & panduan" body="Pelajari dasar kerja melalui dokumentasi yang bisa dipakai ulang." href="/ebook" />
              <Capability icon={Wrench} title="Mini Apps" body="Percepat pekerjaan kecil yang sering menghabiskan waktu tim." href="/mini-apps" />
            </div>
          </div>
        </section>

        <section
          className="scroll-mt-28 border-y border-[#d4ded8] bg-[#f0e8d9] px-5 py-20 md:scroll-mt-64 md:py-28"
          id="jalur-sbu-skk"
          data-testid="section-renewal-hub"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_.8fr] lg:items-end">
              <div>
                <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b55e45]">Jalur persiapan dokumen</p>
                <h2 className="max-w-3xl font-display text-4xl font-semibold leading-tight tracking-[-.06em] md:text-5xl">
                  Perpanjangan SBU & SKK, tanpa berpindah arah.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[#607373]">
                Mulai dari pemeriksaan kesiapan, lanjutkan ke alat penyusunan yang sesuai, lalu periksa kembali hasilnya sebelum masuk ke proses resmi.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.55fr_.65fr]">
              <div className="rounded-[1.5rem] bg-[#173847] p-5 md:p-7" data-testid="renewal-path-sbu">
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#f4c95d]">Jalur 01 / Badan Usaha</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-[#f7f1e6]">Persiapan perpanjangan SBU</h3>
                  </div>
                  <p className="max-w-xs text-xs leading-5 text-[#c7d5d3]">Periksa LKUT, siapkan laporannya, lalu lengkapi area SMAP dan PUB yang relevan.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <ExternalToolCard
                    step={renewalHub.sbu[0].step}
                    title={renewalHub.sbu[0].title}
                    body={renewalHub.sbu[0].description}
                    href={renewalHub.sbu[0].href}
                    icon={ClipboardCheck}
                    testId="external-link-lkut-readiness"
                    dark
                  />
                  <ExternalToolCard
                    step={renewalHub.sbu[1].step}
                    title={renewalHub.sbu[1].title}
                    body={renewalHub.sbu[1].description}
                    href={renewalHub.sbu[1].href}
                    icon={FileCheck2}
                    testId="external-link-lkut-report"
                    dark
                  />
                  <ExternalToolCard
                    step={renewalHub.sbu[2].step}
                    title={renewalHub.sbu[2].title}
                    body={renewalHub.sbu[2].description}
                    href={renewalHub.sbu[2].href}
                    icon={ShieldCheck}
                    testId="external-link-smap-pub"
                    dark
                  />
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[#d4ded8] bg-[#e1efea] p-5 md:p-7" data-testid="renewal-path-skk">
                <div className="mb-6">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#b55e45]">Jalur 02 / Tenaga Kerja</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-[#173847]">Persiapan perpanjangan SKK</h3>
                  <p className="mt-3 text-xs leading-5 text-[#607373]">Gunakan ringkasan eksekutif sebagai bahan kerja sebelum proses pembaruan kompetensi.</p>
                </div>
                <ExternalToolCard
                  step={renewalHub.skk.step}
                  title={renewalHub.skk.title}
                  body={renewalHub.skk.description}
                  href={renewalHub.skk.href}
                  icon={GraduationCap}
                  testId="external-link-executive-summary-skk"
                />
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#d4ded8] bg-[#fffaf1] p-4 text-xs leading-5 text-[#607373]" data-testid="renewal-external-notice">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[#b55e45]" aria-hidden="true" />
              <p>
                <strong className="text-[#173847]">Alat bantu, bukan pengajuan resmi.</strong>{" "}
                Setiap kartu membuka aplikasi eksternal di tab baru. Pemeriksaan akhir dan proses resmi tetap mengikuti ketentuan serta instansi yang berwenang.
              </p>
            </div>

            <div className="mt-5 grid gap-5 rounded-[1.5rem] border border-[#d4ded8] bg-[#fffaf1] p-5 md:grid-cols-[.9fr_1.1fr] md:p-7" data-testid="renewal-path-oss">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#b55e45]">Ritme kepatuhan / OSS</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[#173847]">Kewajiban tahunan LKPM</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#687a78]">
                  Jaga pelaporan Laporan Kegiatan Penanaman Modal tetap masuk dalam kalender kerja tahunan badan usaha.
                </p>
              </div>
              <ExternalToolCard
                label="Kewajiban tahunan"
                title={renewalHub.annualOss.title}
                body={renewalHub.annualOss.description}
                href={renewalHub.annualOss.href}
                icon={Building2}
                testId="external-link-lkpm-oss"
              />
            </div>
          </div>
        </section>

        <section className="px-5 py-20 md:py-28" id="dukungan-sbu-skk" data-testid="section-sbu">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b55e45]">01 / SBU</p><h2 className="font-display text-4xl font-semibold leading-tight tracking-[-.06em] md:text-5xl">Bangun kesiapan sebelum mengajukan.</h2><p className="mt-5 text-sm leading-7 text-[#687a78]">Funnel resmi SBU-SKK dimulai dari diagnosis, lalu bergerak ke panduan gratis, paket kerja, atau pendamping khusus. Pilih tingkat bantuan yang sesuai tanpa menebak-nebak.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href={funnel.readiness.landingPath} data-testid="cta-funnel-readiness" className="rounded-2xl border border-[#d4ded8] bg-[#fffaf1] p-5 transition-transform hover:-translate-y-1"><ClipboardCheck className="mb-8 h-5 w-5 text-[#b55e45]" /><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b55e45]">01 / Diagnosa</p><h3 className="mt-2 font-display text-xl font-semibold">{funnel.readiness.title}</h3><p className="mt-2 text-sm leading-6 text-[#687a78]">Gambaran awal area yang perlu dibereskan.</p></Link>
              <Link href={funnel.miniEbook.landingPath} data-testid="cta-funnel-mini-ebook" className="rounded-2xl border border-[#d4ded8] bg-[#fffaf1] p-5 transition-transform hover:-translate-y-1"><BookOpen className="mb-8 h-5 w-5 text-[#b55e45]" /><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b55e45]">02 / Mulai gratis</p><h3 className="mt-2 font-display text-xl font-semibold">{funnel.miniEbook.title}</h3><p className="mt-2 text-sm leading-6 text-[#687a78]">{funnel.miniEbook.subtitle}</p></Link>
              <Link href={funnel.bundle.landingPath} data-testid="cta-funnel-bundle" className="rounded-2xl border border-[#d4ded8] bg-[#e1efea] p-5 transition-transform hover:-translate-y-1"><FileCheck2 className="mb-8 h-5 w-5 text-[#173847]" /><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b55e45]">03 / Kerja terarah</p><h3 className="mt-2 font-display text-xl font-semibold">{funnel.bundle.title}</h3><p className="mt-2 text-sm leading-6 text-[#607373]">{ebook.pages} halaman + toolkit {ebook.toolkitPages} halaman — {funnel.bundle.priceLabel}.</p></Link>
              <Link href={funnel.aiSpecialist.landingPath} data-testid="cta-funnel-ai-specialist" className="rounded-2xl border border-[#173847] bg-[#173847] p-5 text-[#f7f1e6] transition-transform hover:-translate-y-1"><Sparkles className="mb-8 h-5 w-5 text-[#f4c95d]" /><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f4c95d]">04 / Kasus spesifik</p><h3 className="mt-2 font-display text-xl font-semibold">{funnel.aiSpecialist.title}</h3><p className="mt-2 text-sm leading-6 text-[#c7d5d3]">Pendamping khusus untuk kebutuhan SBU-SKK yang lebih kompleks.</p></Link>
            </div>
          </div>
        </section>

        <section className="border-y border-[#d4ded8] bg-[#173847] px-5 py-20 text-[#f7f1e6] md:py-24" data-testid="section-skk">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
            <div><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#f4c95d]">02 / SKK</p><h2 className="font-display text-4xl font-semibold leading-tight tracking-[-.06em] md:text-5xl">Kompetensi yang bisa dibuktikan di lapangan.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-[#c7d5d3]">Jaga jalur kompetensi tenaga konstruksi tetap jelas: pahami kebutuhan, siapkan proses uji, dan temukan pendampingan yang relevan untuk tim Anda.</p></div>
            <div className="rounded-[1.5rem] border border-[#52777d] bg-[#214c5b] p-7">
              <div className="flex items-start justify-between gap-5"><div><GraduationCap className="mb-8 h-6 w-6 text-[#f4c95d]" /><h3 className="font-display text-2xl font-semibold">Portal dan layanan SKK</h3></div><span className="font-mono text-xs tracking-[.2em] text-[#9cc4c6]">SKK / 02</span></div>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#c7d5d3]">Masuk ke ekosistem kompetensi untuk membaca jalur yang tersedia, lalu gunakan layanan uji kompetensi saat Anda siap.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/skk" data-testid="primary-link-skk" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f4c95d] px-4 text-sm font-bold text-[#173847] transition-transform hover:-translate-y-0.5">Buka Portal SKK <ArrowRight className="h-4 w-4" /></Link><Link href="/klinik-uji-kompetensi" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#7b9ca3] px-4 text-sm font-semibold text-[#f7f1e6] transition-colors hover:bg-[#f7f1e6]/10">Lihat Bimtek SKK <ChevronRight className="h-4 w-4" /></Link></div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 md:py-24" data-testid="section-tender">
          <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.15fr_.85fr]">
            <div className="order-2 rounded-[1.5rem] border border-[#d4ded8] bg-[#fffaf1] p-7 md:order-1"><div className="mb-10 flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c96f52] text-[#fff8ec]"><Search className="h-5 w-5" /></span><span className="font-mono text-xs font-bold tracking-[.2em] text-[#8a9b98]">TENDER / 03</span></div><h3 className="font-display text-2xl font-semibold">Dari peluang ke dokumen penawaran.</h3><p className="mt-3 max-w-lg text-sm leading-6 text-[#687a78]">Baca peluang dengan konteks, satukan kebutuhan administrasi, dan masuk ke tahap persiapan dengan ruang kerja yang lebih rapi.</p><Link href="/tender" data-testid="primary-link-tender" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#173847] hover:text-[#b55e45]">Jelajahi Tender <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div>
            <div className="order-1 md:order-2"><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b55e45]">03 / Tender</p><h2 className="font-display text-4xl font-semibold leading-tight tracking-[-.06em] md:text-5xl">Peluang yang dibaca sebelum dikejar.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#687a78]">Tender bukan sekadar daftar proyek. Gustafta membantu Anda berpindah dari menemukan peluang ke menyiapkan respons yang masuk akal.</p></div>
          </div>
        </section>

        <section className="border-y border-[#d4ded8] bg-[#e7f0eb] px-5 py-20 md:py-24" data-testid="section-proyek">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[.85fr_1.15fr]">
            <div><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b55e45]">04 / Proyek</p><h2 className="font-display text-4xl font-semibold leading-tight tracking-[-.06em] md:text-5xl">Satu ruang untuk pekerjaan yang sedang berjalan.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#687a78]">Jaga keputusan, berkas, dan ritme tim tetap terhubung dari awal sampai serah terima. Ruang proyek memberi konteks setelah peluang dimenangkan.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/ruang-proyek" data-testid="primary-link-proyek" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#173847] px-4 text-sm font-bold text-[#f7f1e6] transition-transform hover:-translate-y-0.5">Buka Ruang Proyek <ArrowRight className="h-4 w-4" /></Link><Link href="/dokumen-proyek" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#9db5bc] px-4 text-sm font-semibold text-[#173847] hover:bg-[#d7e8e1]">Kelola Dokumen Proyek <FileCheck2 className="h-4 w-4" /></Link></div></div>
            <div className="relative min-h-[250px] overflow-hidden rounded-[1.5rem] bg-[#c8ddd4] p-7"><div className="absolute -right-10 -top-14 h-48 w-48 rounded-full border-[28px] border-[#f4c95d]/70" /><div className="relative"><FolderKanban className="mb-16 h-6 w-6 text-[#173847]" /><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#b55e45]">Workspace / Aktif</p><p className="mt-3 max-w-xs font-display text-3xl font-semibold leading-tight text-[#173847]">Dokumen yang menemukan konteksnya.</p></div></div>
          </div>
        </section>

        <section className="px-5 py-20 md:py-24"><div className="mx-auto max-w-6xl"><div className="mb-10 max-w-2xl"><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b55e45]">Ruang untuk setiap peran</p><h2 className="font-display text-4xl font-semibold tracking-[-.06em] md:text-5xl">Satu platform, sudut pandang yang berbeda.</h2></div><div className="grid gap-4 md:grid-cols-3"><Link href="/kontraktor" className="rounded-2xl border border-[#d4ded8] bg-[#fffaf1] p-6 hover:border-[#9bb8b7]"><Building2 className="mb-10 h-5 w-5 text-[#b55e45]" /><h3 className="font-display text-xl font-semibold">Kontraktor & BUJK</h3><p className="mt-2 text-sm leading-6 text-[#687a78]">Rapikan legalitas, peluang, dan dokumen pekerjaan dalam satu alur.</p></Link><Link href="/konsultan-iso" className="rounded-2xl border border-[#d4ded8] bg-[#e1efea] p-6 hover:border-[#9bb8b7]"><BriefcaseBusiness className="mb-10 h-5 w-5 text-[#173847]" /><h3 className="font-display text-xl font-semibold">Konsultan & biro jasa</h3><p className="mt-2 text-sm leading-6 text-[#607373]">Bawa metode dan pengetahuan layanan Anda menjadi sistem kerja yang dapat digunakan ulang.</p></Link><Link href="/ruang-kelola" className="rounded-2xl border border-[#d4ded8] bg-[#173847] p-6 text-[#f7f1e6] hover:border-[#9cc4c6]"><FolderOpen className="mb-10 h-5 w-5 text-[#f4c95d]" /><h3 className="font-display text-xl font-semibold">Manajemen organisasi</h3><p className="mt-2 text-sm leading-6 text-[#c7d5d3]">Pantau kesiapan dan kelola pekerjaan dari ruang yang lebih terstruktur.</p></Link></div></div></section>
        <section className="border-y border-[#d4ded8] bg-[#f0e8d9] px-5 py-20 md:py-24" data-testid="section-faq"><div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[.8fr_1.2fr]"><div><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b55e45]">Pertanyaan umum</p><h2 className="font-display text-4xl font-semibold leading-tight tracking-[-.06em]">Mulai tanpa harus memahami semuanya.</h2></div><div className="space-y-2">{[["Apa itu Gustafta?","Gustafta adalah platform kerja untuk kontraktor dan profesional konstruksi: pengetahuan, dokumen, peluang, dan ruang proyek berada dalam satu ekosistem."],["Apakah saya harus langsung membeli paket?","Tidak. Anda dapat menjelajahi ruang platform atau memulai dari Cek Kesiapan SBU sebelum memilih jalur bantuan."],["Di mana saya mulai jika memiliki pertanyaan spesifik?","Gunakan Klinik Konsultasi untuk membawa pertanyaan ke ruang yang sesuai, lalu lanjutkan dengan alat kerja yang relevan."]].map(([q,a]) => <details key={q} className="group rounded-xl border border-[#d4ded8] bg-[#fffaf1] p-5"><summary className="cursor-pointer list-none font-display font-semibold">{q}<ChevronRight className="float-right h-5 w-5 transition-transform group-open:rotate-90" /></summary><p className="mt-3 max-w-xl text-sm leading-6 text-[#687a78]">{a}</p></details>)}</div></div></section>
        <section className="bg-[#c96f52] px-5 py-20 text-[#fff8ec] md:py-24"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#ffe0b7]">Langkah pertama tidak perlu besar</p><h2 className="max-w-2xl font-display text-4xl font-semibold leading-tight tracking-[-.06em] md:text-5xl">Bangun fondasi kerja Anda hari ini.</h2></div><ActionLink href={funnel.readiness.landingPath} testId="cta-final-cek-kesiapan" light onClick={() => lead("Cek Kesiapan SBU — Final CTA")}>Mulai cek kesiapan <ArrowRight className="h-4 w-4" /></ActionLink></div></section>
      </main>

      <footer className="bg-[#173847] px-5 py-10 text-[#c7d5d3]"><div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm md:flex-row md:items-center md:justify-between"><div><p className="font-display text-xl font-bold text-[#f7f1e6]">Gustafta<span className="text-[#f4c95d]">.</span></p><p className="mt-1 text-xs text-[#9db5bc]">Ekosistem kerja untuk praktisi konstruksi.</p></div><nav className="flex flex-wrap gap-x-6 gap-y-3"><Link href="/produk" className="transition-colors hover:text-[#f4c95d]">Produk</Link><Link href="/pricing" className="transition-colors hover:text-[#f4c95d]">Paket platform</Link><Link href="/documentation" className="transition-colors hover:text-[#f4c95d]">Dokumentasi</Link><Link href={workspaceHref} className="transition-colors hover:text-[#f4c95d]">Workspace</Link></nav></div></footer>
    </div>
  );
}