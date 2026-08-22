import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Film, Image as ImageIcon } from "lucide-react";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import promoVideoUrl from "@assets/generated_videos/gustafta_promo_24s_web.mp4";
import promoPosterUrl from "@assets/generated_videos/gustafta_promo_24s_poster.jpg";
import explainerVideoUrl from "@assets/generated_videos/gustafta_explainer.mp4";
import explainerPosterUrl from "@assets/generated_videos/gustafta_explainer_poster.jpg";
import identityCoverUrl from "@assets/G01_1781941962427.png";
import assistedProfessionalUrl from "@assets/G03_1781941962428.png";
import agentNetworkUrl from "@assets/G05_1781941962429.png";
import workDialogueUrl from "@assets/G07_1781941962430.png";

const videoSlides = [
  {
    src: promoVideoUrl,
    poster: promoPosterUrl,
    title: "Gustafta dalam 24 detik",
    caption: "Satu titik awal untuk kesiapan, peluang, dan pekerjaan konstruksi.",
  },
  {
    src: explainerVideoUrl,
    poster: explainerPosterUrl,
    title: "Cara kerja yang punya konteks",
    caption: "Dari dokumen dan pengetahuan, menuju langkah kerja yang dapat dijalankan.",
  },
];

const identitySlides = [
  {
    src: identityCoverUrl,
    alt: "Sampul Trilogi Gustafta dengan identitas geometris berwarna biru",
    eyebrow: "Identitas",
    title: "Dari monolog ke dialog",
    caption: "Gustafta memberi bahasa bersama agar keputusan kerja tidak berhenti di satu kepala.",
    fit: "object-contain",
  },
  {
    src: assistedProfessionalUrl,
    alt: "Profesional menggunakan antarmuka data digital di meja kerja",
    eyebrow: "Profesional terbantu AI",
    title: "Analisis tetap berpihak pada pengalaman",
    caption: "AI membantu membaca konteks; profesional tetap memegang pertimbangan di lapangan.",
    fit: "object-cover",
  },
  {
    src: agentNetworkUrl,
    alt: "Jaringan modul biru yang terhubung mengelilingi satu titik pusat",
    eyebrow: "Jaringan agen",
    title: "Keahlian yang saling menemukan",
    caption: "Setiap ruang kerja terhubung tanpa menghilangkan peran manusia di dalamnya.",
    fit: "object-cover",
  },
  {
    src: workDialogueUrl,
    alt: "Visual identitas Gustafta untuk kolaborasi dan percakapan kerja",
    eyebrow: "Kerja bersama",
    title: "Konteks yang bergerak bersama tim",
    caption: "Dari pertanyaan awal sampai keputusan berikutnya, pengetahuan tetap dapat diajak berdialog.",
    fit: "object-cover",
  },
];

function CarouselNavigation({
  active,
  count,
  onNext,
  onPrevious,
  onSelect,
  label,
}: {
  active: number;
  count: number;
  onNext: () => void;
  onPrevious: () => void;
  onSelect: (index: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-current/15 pt-4">
      <div className="flex gap-1.5" role="group" aria-label={`Pilih slide ${label}`}>
        {Array.from({ length: count }, (_, index) => (
          <button
            aria-label={`Tampilkan slide ${index + 1}`}
            aria-pressed={active === index}
            className={`h-2.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${
              active === index ? "w-7 bg-[#f4c95d]" : "w-2.5 bg-current/25 hover:bg-current/45"
            }`}
            data-testid={`${label}-dot-${index + 1}`}
            key={index}
            onClick={() => onSelect(index)}
            type="button"
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          aria-label={`Slide sebelumnya ${label}`}
          className="h-10 w-10 rounded-full border-[#8baeb0] bg-transparent text-current hover:bg-current/10"
          data-testid={`${label}-previous`}
          onClick={onPrevious}
          size="icon"
          type="button"
          variant="outline"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          aria-label={`Slide berikutnya ${label}`}
          className="h-10 w-10 rounded-full border-[#8baeb0] bg-transparent text-current hover:bg-current/10"
          data-testid={`${label}-next`}
          onClick={onNext}
          size="icon"
          type="button"
          variant="outline"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function useCarouselState(count: number) {
  const [api, setApi] = useState<CarouselApi>();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!api) return;
    const updateActive = () => setActive(api.selectedScrollSnap());
    updateActive();
    api.on("select", updateActive);
    api.on("reInit", updateActive);
    return () => {
      api.off("select", updateActive);
      api.off("reInit", updateActive);
    };
  }, [api]);

  const previous = useCallback(() => {
    const target = (active - 1 + count) % count;
    setActive(target);
    api?.scrollTo(target);
  }, [active, api, count]);
  const next = useCallback(() => {
    const target = (active + 1) % count;
    setActive(target);
    api?.scrollTo(target);
  }, [active, api, count]);
  const select = useCallback((index: number) => {
    setActive(index);
    api?.scrollTo(index);
  }, [api]);

  return { active, next, previous, select, setApi };
}

export function LandingVideoCarousel() {
  const { active, next, previous, select, setApi } = useCarouselState(videoSlides.length);

  return (
    <section
      aria-labelledby="landing-video-heading"
      className="border-b border-[#d4ded8] bg-[#e7f0eb] px-5 py-12 md:py-16"
      data-testid="landing-video-carousel"
    >
      <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[.42fr_.58fr] lg:items-end">
        <div className="lg:pb-5">
          <div className="mb-4 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b55e45]">
            <Film className="h-4 w-4" /> Lihat cara kerjanya
          </div>
          <h2 className="font-display text-3xl font-semibold leading-[1.02] tracking-[-.055em] text-[#173847] md:text-4xl" id="landing-video-heading">
            Bukan tambahan. Ini ruang kerja Anda.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#607373]">
            Putar pengantar singkat untuk melihat bagaimana Gustafta menyatukan pekerjaan yang biasanya terpisah.
          </p>
        </div>
        <Carousel
          className="min-w-0 rounded-[1.5rem] bg-[#173847] p-2 text-[#f7f1e6] shadow-[0_20px_45px_rgba(23,56,71,.16)]"
          opts={{ loop: true }}
          setApi={setApi}
          data-testid="landing-video-carousel-region"
          tabIndex={0}
        >
          <CarouselContent className="ml-0">
            {videoSlides.map((slide, index) => (
              <CarouselItem className="pl-0" key={slide.src} role="tabpanel" aria-label={`${index + 1} dari ${videoSlides.length}: ${slide.title}`}>
                <figure>
                  <div className="aspect-video overflow-hidden rounded-[1.05rem] bg-[#102a35]">
                    <video
                      aria-label={slide.title}
                      className="h-full w-full object-cover"
                      controls
                      onEnded={() => index === 0 && select(1)}
                      playsInline
                      poster={slide.poster}
                      preload="metadata"
                      src={slide.src}
                      data-testid={`landing-video-slide-${index + 1}`}
                    >
                      Browser Anda belum mendukung pemutaran video.
                    </video>
                  </div>
                  <figcaption className="px-3 pb-2 pt-4">
                    <p className="font-display text-xl font-semibold tracking-[-.03em]">{slide.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#c7d5d3]">{slide.caption}</p>
                  </figcaption>
                </figure>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="px-3 pb-3">
            <CarouselNavigation active={active} count={videoSlides.length} label="landing-video" onNext={next} onPrevious={previous} onSelect={select} />
          </div>
        </Carousel>
      </div>
    </section>
  );
}

export function LandingIdentityCarousel() {
  const { active, next, previous, select, setApi } = useCarouselState(identitySlides.length);

  return (
    <section aria-labelledby="identity-carousel-heading" className="overflow-hidden bg-[#f7f1e6] px-5 py-20 md:py-24" data-testid="landing-identity-carousel">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#b55e45]">
              <ImageIcon className="h-4 w-4" /> Bahasa Gustafta
            </div>
            <h2 className="max-w-2xl font-display text-4xl font-semibold leading-tight tracking-[-.06em] text-[#173847] md:text-5xl" id="identity-carousel-heading">
              Teknologi yang membuat percakapan kerja lebih bernilai.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-[#687a78]">Geser untuk melihat prinsip yang membentuk cara Gustafta membantu profesional konstruksi.</p>
        </div>
        <Carousel
          className="min-w-0"
          opts={{ loop: true }}
          setApi={setApi}
          data-testid="landing-identity-carousel-region"
          tabIndex={0}
        >
          <CarouselContent className="ml-0">
            {identitySlides.map((slide, index) => (
              <CarouselItem className="pl-0" key={slide.src} role="tabpanel" aria-label={`${index + 1} dari ${identitySlides.length}: ${slide.title}`}>
                <article className="grid overflow-hidden rounded-[1.65rem] border border-[#d4ded8] bg-[#fffaf1] md:grid-cols-[1.12fr_.88fr]">
                  <div className="aspect-[4/3] overflow-hidden bg-[#dce9e5] md:aspect-[16/10]">
                    <img
                      alt={slide.alt}
                      className={`h-full w-full ${slide.fit}`}
                      data-testid={`landing-identity-slide-${index + 1}`}
                      decoding="async"
                      loading="lazy"
                      src={slide.src}
                    />
                  </div>
                  <div className="flex min-h-[260px] flex-col p-6 md:p-9">
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[.2em] text-[#b55e45]">{slide.eyebrow}</p>
                    <h3 className="mt-5 max-w-sm font-display text-3xl font-semibold leading-[1.02] tracking-[-.05em] text-[#173847]">{slide.title}</h3>
                    <p className="mt-5 max-w-sm text-sm leading-7 text-[#607373]">{slide.caption}</p>
                    <span className="mt-auto pt-7 font-mono text-xs font-bold tracking-[.2em] text-[#8a9b98]">0{index + 1} / 0{identitySlides.length}</span>
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-5 text-[#173847]">
            <CarouselNavigation active={active} count={identitySlides.length} label="landing-identity" onNext={next} onPrevious={previous} onSelect={select} />
          </div>
        </Carousel>
      </div>
    </section>
  );
}