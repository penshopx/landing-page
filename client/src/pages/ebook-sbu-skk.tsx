import { useEffect } from "react";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared-header";
import { PAYMENT_BASE_URL } from "@/lib/payment-base";
import { SBU_SKK_EBOOK } from "@/data/pricing";
import cover from "@assets/0_cover_Ebook_SBU-SKK_1787296306789.png";
import { ArrowRight, BookOpen, Check, FileCheck2, Mail, ShieldCheck } from "lucide-react";

const checkoutUrl =
  `${PAYMENT_BASE_URL}/c/checkout?variant_ids=${SBU_SKK_EBOOK.scalev.variantId}&qty=1`;

export default function EbookSbuSkkPage() {
  useEffect(() => {
    document.title = `${SBU_SKK_EBOOK.title} | Gustafta`;
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#f5f7f8] text-[#12213f] dark:bg-[#081426] dark:text-slate-100">
      <SharedHeader />
      <main>
        <section className="relative overflow-hidden bg-[#122b5a] text-white">
          <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-[#f6bd18]/20 blur-3xl" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_.95fr] md:px-8 md:py-24">
            <div className="relative z-10 animate-panel-in">
              <div className="mb-6 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#f6bd18]">
                <span className="rounded-full border border-[#f6bd18]/40 px-3 py-1">Panduan kerja</span>
                <span className="rounded-full border border-white/20 px-3 py-1">265 halaman</span>
              </div>
              <h1 className="max-w-3xl font-black tracking-[-.04em] text-4xl leading-[1.04] sm:text-6xl md:text-7xl" data-testid="text-sbu-skk-title">
                {SBU_SKK_EBOOK.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-blue-100 md:text-xl">{SBU_SKK_EBOOK.subtitle}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-13 bg-[#f6bd18] px-7 font-black text-[#12213f] hover:bg-[#ffd34d] focus-visible:ring-[#f6bd18]" data-testid="button-sbu-skk-buy">
                  <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">Dapatkan panduannya <ArrowRight className="ml-2 h-4 w-4" /></a>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-13 border-white/35 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white">
                  <a href="#isi">Lihat isi panduan</a>
                </Button>
              </div>
              <p className="mt-5 text-sm text-blue-200">Akses melalui Scalev · pembayaran diproses di halaman checkout resmi</p>
            </div>
            <div className="relative mx-auto w-full max-w-md animate-float">
              <div className="absolute inset-8 rounded-full bg-[#f6bd18]/25 blur-3xl" />
              <img src={cover} alt={`Sampul resmi ${SBU_SKK_EBOOK.title}`} className="relative mx-auto w-full rounded-sm shadow-2xl shadow-[#07132a]/70" data-testid="cover-sbu-skk-hero" />
            </div>
          </div>
        </section>

        <section className="border-b border-[#d8e0e7] bg-[#f6bd18] text-[#12213f]">
          <div className="mx-auto grid max-w-6xl gap-4 px-5 py-5 text-sm font-bold sm:grid-cols-3 md:px-8">
            <span className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> PDF 265 halaman</span>
            <span className="flex items-center gap-2"><FileCheck2 className="h-5 w-5" /> Fokus dokumen dan langkah</span>
            <span className="flex items-center gap-2"><Mail className="h-5 w-5" /> Akses dikirim via email</span>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[.2em] text-[#bd8b00] dark:text-[#f6bd18]">Mengapa panduan ini dibuat</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Regulasi berubah. Cara kerja Anda tidak boleh ikut membingungkan.</h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">Transisi SBU-SKK menuntut lebih dari sekadar membaca aturan. Anda perlu menerjemahkan perubahan menjadi daftar persyaratan, dokumen, dan urutan kerja yang bisa ditindaklanjuti.</p>
          </div>
          <div id="isi" className="mt-12 grid gap-5 md:grid-cols-3">
            {SBU_SKK_EBOOK.benefits.map((benefit, i) => (
              <article key={benefit} className={`rounded-2xl border border-[#d8e0e7] bg-white p-7 shadow-sm dark:border-slate-700 dark:bg-[#10213a] ${i === 1 ? "md:-translate-y-5 md:border-[#f6bd18] md:shadow-xl" : ""}`}>
                <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl bg-[#122b5a] text-[#f6bd18]"><Check className="h-5 w-5" /></div>
                <p className="text-lg font-bold leading-snug">{benefit}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#e9eef2] dark:bg-[#0d1b2e]">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[.85fr_1.15fr] md:px-8 md:py-24">
            <div>
              <p className="text-sm font-black uppercase tracking-[.2em] text-[#bd8b00] dark:text-[#f6bd18]">Untuk siapa</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Dibuat untuk meja kerja konstruksi.</h2>
              <p className="mt-5 leading-relaxed text-slate-600 dark:text-slate-300">Bukan ringkasan populer. Ini bacaan rujukan praktis bagi orang yang harus memastikan proses berjalan rapi.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {SBU_SKK_EBOOK.audience.map((item) => <div key={item} className="flex items-start gap-3 rounded-xl border border-[#d2dbe2] bg-white p-5 font-bold dark:border-slate-700 dark:bg-[#10213a]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#bd8b00] dark:text-[#f6bd18]" />{item}</div>)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-20 md:py-28">
          <h2 className="text-center text-3xl font-black tracking-tight md:text-4xl">Pertanyaan yang mungkin Anda punya</h2>
          <Accordion type="single" collapsible className="mt-10">
            <AccordionItem value="delivery"><AccordionTrigger>Bagaimana ebook diterima?</AccordionTrigger><AccordionContent>Ebook dikirim otomatis melalui email setelah pembayaran terkonfirmasi, melalui tautan akses pesanan yang aman. Tidak ada tautan PDF publik di halaman ini.</AccordionContent></AccordionItem>
            <AccordionItem value="format"><AccordionTrigger>Berapa tebal panduannya?</AccordionTrigger><AccordionContent>{SBU_SKK_EBOOK.pages} halaman dalam format PDF.</AccordionContent></AccordionItem>
            <AccordionItem value="scope"><AccordionTrigger>Apa fokus utama panduan?</AccordionTrigger><AccordionContent>Panduan ini membantu memahami transisi regulasi, menata persyaratan dan dokumen SBU-SKK, serta mengurangi langkah prosedural yang keliru.</AccordionContent></AccordionItem>
          </Accordion>
        </section>

        <section className="bg-[#122b5a] px-5 py-16 text-center text-white md:py-20">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-[#f6bd18]">Mulai dari rujukan yang jelas</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-5xl">Satu panduan untuk membantu Anda bekerja lebih tertib.</h2>
          <p className="mt-5 text-4xl font-black text-[#f6bd18]" data-testid="text-sbu-skk-price">{SBU_SKK_EBOOK.priceLabel}</p>
          <Button asChild size="lg" className="mt-8 bg-[#f6bd18] px-8 font-black text-[#12213f] hover:bg-[#ffd34d]" data-testid="button-sbu-skk-bottom-buy"><a href={checkoutUrl} target="_blank" rel="noopener noreferrer">Beli melalui Scalev <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
        </section>
      </main>
      <footer className="bg-[#0c1b32] px-5 py-8 text-center text-sm text-blue-200"><Link href="/" className="font-bold text-white hover:text-[#f6bd18]">Gustafta</Link><span className="mx-2">·</span>Pengetahuan kerja untuk ekosistem konstruksi Indonesia</footer>
    </div>
  );
}