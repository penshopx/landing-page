import { Link } from "wouter";
import { ArrowRight, BookOpen, Check, ChevronRight, ClipboardCheck, FileText, FolderOpen, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { SharedHeader } from "@/components/shared-header";
import { SBU_SKK_EBOOK, SBU_SKK_FUNNEL } from "@/data/pricing";
import { trackLead } from "@/lib/meta-pixel";

const funnel = SBU_SKK_FUNNEL;
const ebook = SBU_SKK_EBOOK;

function FunnelLink({
  href,
  children,
  testId,
  variant = "default",
  onClick,
}: {
  href: string;
  children: ReactNode;
  testId: string;
  variant?: "default" | "light" | "outline";
  onClick?: () => void;
}) {
  return (
    <Button
      asChild
      size="lg"
      variant={variant === "outline" ? "outline" : "default"}
      className={
        variant === "light"
          ? "h-12 rounded-xl bg-[#f6c65b] px-5 font-bold text-[#172c3b] shadow-[0_8px_24px_rgba(246,198,91,.18)] transition-transform hover:-translate-y-0.5 hover:bg-[#ffd77d]"
          : variant === "outline"
            ? "h-12 rounded-xl border-[#9db5bc] bg-transparent px-5 font-semibold text-[#173847] hover:bg-[#e4eeeb]"
            : "h-12 rounded-xl bg-[#173847] px-5 font-bold text-[#f7f1e6] shadow-[0_8px_24px_rgba(23,56,71,.18)] transition-transform hover:-translate-y-0.5 hover:bg-[#24566a]"
      }
      data-testid={testId}
    >
      <Link href={href} onClick={onClick}>{children}</Link>
    </Button>
  );
}

function StepCard({
  number,
  eyebrow,
  title,
  body,
  href,
  icon: Icon,
  tone,
  testId,
}: {
  number: string;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  icon: typeof ClipboardCheck;
  tone: "gold" | "clay" | "blue" | "ink";
  testId: string;
}) {
  const tones = {
    gold: "bg-[#f6c65b] text-[#173847]",
    clay: "bg-[#c96f52] text-[#fff8ec]",
    blue: "bg-[#9cc4c6] text-[#173847]",
    ink: "bg-[#173847] text-[#f7f1e6]",
  };
  return (
    <Link href={href} data-testid={testId} className="group flex min-h-[260px] flex-col rounded-[1.5rem] border border-[#d6dfd8] bg-[#fffaf1] p-6 shadow-[0_10px_30px_rgba(23,56,71,.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#9db5bc] hover:shadow-[0_18px_38px_rgba(23,56,71,.12)]">
      <div className="mb-8 flex items-center justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></span>
        <span className="font-mono text-xs font-bold tracking-[.2em] text-[#809196]">{number}</span>
      </div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#b25b43]">{eyebrow}</p>
      <h3 className="mb-3 font-display text-2xl font-semibold tracking-[-.03em] text-[#173847]">{title}</h3>
      <p className="mt-auto max-w-[28ch] text-sm leading-6 text-[#5d7073]">{body}</p>
      <span className="mt-5 flex items-center gap-2 text-sm font-bold text-[#173847] transition-colors group-hover:text-[#b25b43]">Lihat langkah <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
    </Link>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const workspaceHref = isAuthenticated ? "/dashboard" : "/login";
  const lead = (content_name: string) => trackLead({ content_name });

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#f7f1e6] text-[#173847]" data-testid="page-landing">
      <SharedHeader />
      <div className="border-b border-[#e1d8c7] bg-[#f1e9da] px-4 py-2.5 text-center text-xs font-medium text-[#5d7073]">
        <span className="mr-2 inline-block rounded-full bg-[#173847] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f7f1e6]">Panduan kerja</span>
        Urutan yang jelas untuk mengambil langkah SBU-SKK tanpa menebak-nebak.
      </div>

      <section className="relative overflow-hidden bg-[#173847] px-5 pb-20 pt-16 text-[#f7f1e6] md:pb-28 md:pt-24">
        <div className="absolute -right-24 -top-32 h-[34rem] w-[34rem] rounded-full border-[70px] border-[#c96f52]/25" />
        <div className="absolute -bottom-48 left-[-8rem] h-[30rem] w-[30rem] rounded-full border-[1px] border-[#9cc4c6]/30" />
        <div className="relative mx-auto grid max-w-6xl items-end gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#9cc4c6]/40 bg-[#9cc4c6]/10 px-3 py-1.5 text-xs font-semibold text-[#c7e2df]">
              <Wrench className="h-3.5 w-3.5" /> Pengetahuan konstruksi Indonesia
            </div>
            <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[.98] tracking-[-.065em] md:text-7xl">
              Ambil langkah<br /><span className="text-[#f6c65b]">SBU-SKK</span> dengan tenang.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#c7d5d3] md:text-lg">
              Gustafta membantu pemilik BUJK dan profesional konstruksi mengubah regulasi menjadi urutan kerja yang bisa dijalankan—mulai dari cek kesiapan, bukan dari katalog AI.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <FunnelLink href={funnel.readiness.landingPath} testId="cta-hero-cek-kesiapan" variant="light" onClick={() => lead("Cek Kesiapan SBU — Hero")}>
                Cek Kesiapan SBU <ArrowRight className="h-4 w-4" />
              </FunnelLink>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-[#7b9ca3] bg-transparent px-5 font-semibold text-[#f7f1e6] hover:bg-[#f7f1e6]/10" data-testid="cta-hero-jelajahi">
                <a href="#platform">Kenali platform</a>
              </Button>
            </div>
            <p className="mt-5 text-xs text-[#9db5bc]">Untuk pemilik dan manajemen BUJK, administrator SBU-SKK, profesional, konsultan, dan biro jasa.</p>
          </div>
          <div className="relative hidden lg:block">
            <div className="ml-auto max-w-sm rotate-2 rounded-[1.75rem] bg-[#f7f1e6] p-7 text-[#173847] shadow-[0_30px_80px_rgba(0,0,0,.25)]">
              <div className="mb-10 flex items-center justify-between border-b border-[#d6dfd8] pb-4">
                <span className="font-display text-lg font-bold">Gustafta / 01</span>
                <span className="rounded-full bg-[#f6c65b] px-2 py-1 font-mono text-[10px] font-bold">KERJA NYATA</span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#b25b43]">Pertanyaan pertama</p>
              <p className="mt-3 font-display text-3xl font-semibold leading-tight">Apakah usaha Anda siap mengajukan SBU?</p>
              <div className="mt-8 space-y-3 text-sm text-[#5d7073]">
                {["Data badan usaha", "Kesesuaian bidang", "Personel & dokumen"].map((x) => <div key={x} className="flex items-center gap-2 border-b border-[#e7ded0] pb-3"><Check className="h-4 w-4 text-[#b25b43]" />{x}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section className="px-5 py-20 md:py-28" id="jalur-sbu-skk">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b25b43]">Jalur utama</p>
                <h2 className="max-w-2xl font-display text-4xl font-semibold leading-tight tracking-[-.05em] md:text-5xl">Mulai dari posisi Anda.<br />Lanjutkan sesuai kebutuhan.</h2>
              </div>
              <p className="max-w-xs text-sm leading-6 text-[#687b7b]">Tidak semua orang perlu paket yang sama. Ikuti empat langkah ini, satu per satu.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StepCard number="01" eyebrow="Diagnosa" title={funnel.readiness.title} body="Dapatkan gambaran awal tentang area yang perlu dibereskan sebelum mengajukan." href={funnel.readiness.landingPath} icon={ClipboardCheck} tone="gold" testId="cta-funnel-readiness" />
              <StepCard number="02" eyebrow="Mulai gratis" title={funnel.miniEbook.title} body={funnel.miniEbook.subtitle} href={funnel.miniEbook.landingPath} icon={BookOpen} tone="clay" testId="cta-funnel-mini-ebook" />
              <StepCard number="03" eyebrow="Kerja terarah" title={funnel.bundle.title} body={`${ebook.pages} halaman panduan + ${ebook.toolkitPages} halaman toolkit dan Tutor AI ${funnel.tutor.durationDays} hari — ${funnel.bundle.priceLabel}.`} href={funnel.bundle.landingPath} icon={FileText} tone="blue" testId="cta-funnel-bundle" />
              <StepCard number="04" eyebrow="Kasus spesifik" title={funnel.aiSpecialist.title} body="Pendamping AI khusus untuk kebutuhan SBU-SKK yang lebih kompleks dan berulang." href={funnel.aiSpecialist.landingPath} icon={Sparkles} tone="ink" testId="cta-funnel-ai-specialist" />
            </div>
          </div>
        </section>

        <section className="border-y border-[#d6dfd8] bg-[#e8f0eb] px-5 py-20 md:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c96f52] text-[#fff8ec]"><ShieldCheck className="h-6 w-6" /></div>
              <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b25b43]">Kenapa urutan ini?</p>
              <h2 className="font-display text-4xl font-semibold leading-tight tracking-[-.05em]">Karena keputusan yang baik dimulai dari konteks.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Bukan tebak-tebakan", "Mulai dari cek kesiapan agar Anda tahu apa yang harus dibereskan lebih dulu."],
                ["Bisa dipakai bekerja", "Panduan dan toolkit disusun untuk menemani proses, bukan sekadar dibaca."],
                ["Tidak menghilangkan pilihan", "Butuh ruang simpan, tender, atau fitur lain? Platform tetap terbuka untuk Anda."],
                ["AI pada waktunya", "Gunakan AI Specialist ketika kasusnya sudah jelas dan pendamping khusus memang membantu."],
              ].map(([title, body]) => <div key={title} className="rounded-2xl border border-[#cbdad2] bg-[#f7f1e6]/70 p-5"><h3 className="mb-2 font-display text-lg font-bold">{title}</h3><p className="text-sm leading-6 text-[#687b7b]">{body}</p></div>)}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 md:py-28" id="platform">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl"><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b25b43]">Tetap satu platform</p><h2 className="font-display text-4xl font-semibold tracking-[-.05em] md:text-5xl">SBU-SKK adalah pintu masuk.<br />Ruang kerja Anda tetap luas.</h2></div>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/ruang-simpan" className="group rounded-[1.5rem] bg-[#173847] p-7 text-[#f7f1e6] transition-transform duration-300 hover:-translate-y-1" data-testid="link-platform-ruang-simpan"><FolderOpen className="mb-14 h-6 w-6 text-[#f6c65b]" /><h3 className="font-display text-2xl font-semibold">Ruang Simpan</h3><p className="mt-2 text-sm leading-6 text-[#b9ceca]">Dokumen perusahaan tersusun, mudah dicari, dan siap menjadi konteks kerja.</p><span className="mt-6 flex items-center gap-2 text-sm font-bold text-[#f6c65b]">Buka ruang kerja <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link>
              <Link href="/tender" className="group rounded-[1.5rem] border border-[#d6dfd8] bg-[#fffaf1] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#9db5bc]" data-testid="link-platform-tender"><Wrench className="mb-14 h-6 w-6 text-[#c96f52]" /><h3 className="font-display text-2xl font-semibold">Tender & proyek</h3><p className="mt-2 text-sm leading-6 text-[#687b7b]">Peralatan untuk membaca peluang, menyiapkan dokumen, dan mengelola pekerjaan.</p><span className="mt-6 flex items-center gap-2 text-sm font-bold">Jelajahi fitur <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link>
              <Link href={workspaceHref} className="group rounded-[1.5rem] border border-[#d6dfd8] bg-[#f6c65b] p-7 transition-transform duration-300 hover:-translate-y-1" data-testid="link-platform-workspace"><Sparkles className="mb-14 h-6 w-6 text-[#173847]" /><h3 className="font-display text-2xl font-semibold">Masuk ke Gustafta</h3><p className="mt-2 text-sm leading-6 text-[#173847]/75">Lanjutkan pekerjaan Anda dan temukan alat yang sesuai saat dibutuhkan.</p><span className="mt-6 flex items-center gap-2 text-sm font-bold">Ke workspace <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link>
            </div>
          </div>
        </section>

        <section className="bg-[#c96f52] px-5 py-20 text-[#fff8ec] md:py-24">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#ffe0b7]">Langkah pertama tidak perlu besar</p><h2 className="max-w-2xl font-display text-4xl font-semibold leading-tight tracking-[-.05em] md:text-5xl">Cek kesiapan Anda sebelum membeli apa pun.</h2></div>
            <FunnelLink href={funnel.readiness.landingPath} testId="cta-final-cek-kesiapan" variant="light" onClick={() => lead("Cek Kesiapan SBU — Final CTA")}>Mulai cek kesiapan <ArrowRight className="h-4 w-4" /></FunnelLink>
          </div>
        </section>
      </main>

      <footer className="bg-[#173847] px-5 py-10 text-[#c7d5d3]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm md:flex-row md:items-center md:justify-between">
          <div><p className="font-display text-xl font-bold text-[#f7f1e6]">Gustafta<span className="text-[#f6c65b]">.</span></p><p className="mt-1 text-xs text-[#9db5bc]">Panduan kerja untuk praktisi konstruksi.</p></div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3"><Link href="/produk" className="transition-colors hover:text-[#f6c65b]">Produk</Link><Link href="/pricing" className="transition-colors hover:text-[#f6c65b]">Paket platform</Link><Link href="/documentation" className="transition-colors hover:text-[#f6c65b]">Dokumentasi</Link></nav>
        </div>
      </footer>
    </div>
  );
}