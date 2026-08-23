import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Film, HardHat } from "lucide-react";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import promoVideoUrl from "@assets/generated_videos/gustafta_promo_24s_web.mp4";
import promoVideoWebmUrl from "@assets/generated_videos/gustafta_promo_24s_web.webm";
import promoPosterUrl from "@assets/generated_videos/gustafta_promo_24s_poster.jpg";
import explainerVideoUrl from "@assets/generated_videos/gustafta_explainer.mp4";
import explainerVideoWebmUrl from "@assets/generated_videos/gustafta_explainer.webm";
import explainerPosterUrl from "@assets/generated_videos/gustafta_explainer_poster.jpg";
import constructionReadinessUrl from "@assets/generated_images/gustafta-konstruksi-01-kesiapan.png";
import constructionPlanningUrl from "@assets/generated_images/gustafta-konstruksi-02-perencanaan.png";
import constructionExecutionUrl from "@assets/generated_images/gustafta-konstruksi-03-pelaksanaan.png";
import constructionMonitoringUrl from "@assets/generated_images/gustafta-konstruksi-04-monitoring.png";
import constructionHandoverUrl from "@assets/generated_images/gustafta-konstruksi-05-serah-terima.png";
import constructionWorkflowVideoUrl from "@assets/generated_videos/gustafta-konstruksi-workflow.mp4";
import constructionWorkflowVideoWebmUrl from "@assets/generated_videos/gustafta-konstruksi-workflow.webm";

const videoSlides = [
  {
    webm: promoVideoWebmUrl,
    mp4: promoVideoUrl,
    poster: promoPosterUrl,
    title: "Gustafta dalam 24 detik",
    caption: "Satu titik awal untuk kesiapan, peluang, dan pekerjaan konstruksi.",
  },
  {
    webm: explainerVideoWebmUrl,
    mp4: explainerVideoUrl,
    poster: explainerPosterUrl,
    title: "Cara kerja yang punya konteks",
    caption: "Dari dokumen dan pengetahuan, menuju langkah kerja yang dapat dijalankan.",
  },
];

const constructionWorkflowSlides = [
  {
    kind: "image" as const,
    src: constructionReadinessUrl,
    alt: "Manajer proyek meninjau dokumen tender dan gambar kerja dalam ruang kerja digital",
    number: "01",
    eyebrow: "Kesiapan & tender",
    title: "Pekerjaan dimulai dari konteks yang lengkap.",
    caption: "Persyaratan, dokumen, dan peluang tender dirapikan lebih dahulu agar tim tahu apa yang harus disiapkan.",
    gustafta: "Tender dan Bedah Dokumen membantu menemukan kebutuhan, risiko, dan tindak lanjut sejak awal.",
  },
  {
    kind: "image" as const,
    src: constructionPlanningUrl,
    alt: "Engineer menyusun rencana bangunan, jadwal, dan koordinasi pekerjaan",
    number: "02",
    eyebrow: "Perencanaan",
    title: "Rencana kerja tidak lagi berdiri sendiri.",
    caption: "Gambar, jadwal, metode, dan pengetahuan tim bertemu dalam konteks yang dapat dipahami bersama.",
    gustafta: "Brain Project dan Dokumen Proyek menjaga rencana, SOP, serta pengalaman tim tetap terhubung.",
  },
  {
    kind: "image" as const,
    src: constructionExecutionUrl,
    alt: "Tim konstruksi melaksanakan pekerjaan lapangan dengan pengawasan digital",
    number: "03",
    eyebrow: "Pelaksanaan",
    title: "Keputusan lapangan tetap berada di jalurnya.",
    caption: "Tim mengerjakan proyek dengan akses pada dokumen, arahan, dan keputusan terbaru yang dibutuhkan.",
    gustafta: "Ruang Proyek menyatukan percakapan, dokumen, dan perkembangan pekerjaan dalam satu tempat.",
  },
  {
    kind: "image" as const,
    src: constructionMonitoringUrl,
    alt: "Engineer memeriksa mutu dan kemajuan pembangunan melalui tablet di lapangan",
    number: "04",
    eyebrow: "Monitoring & mutu",
    title: "Progres dibaca sebelum menjadi masalah.",
    caption: "Temuan, foto, dan perkembangan lapangan dapat ditelusuri agar tindak lanjut tidak terlambat.",
    gustafta: "Ruang Proyek dan Asisten AI membantu merangkum progres serta menemukan pekerjaan yang perlu ditindaklanjuti.",
  },
  {
    kind: "image" as const,
    src: constructionHandoverUrl,
    alt: "Tim proyek menyerahkan bangunan dan mengarsipkan pengetahuan pekerjaan",
    number: "05",
    eyebrow: "Serah terima",
    title: "Pekerjaan selesai, pengetahuannya tetap hidup.",
    caption: "Dokumen akhir, keputusan, dan pembelajaran proyek tidak hilang ketika bangunan diserahterimakan.",
    gustafta: "Ruang Simpan menjaga arsip dan pengetahuan agar siap digunakan kembali pada pekerjaan berikutnya.",
  },
  {
    kind: "video" as const,
    webm: constructionWorkflowVideoWebmUrl,
    mp4: constructionWorkflowVideoUrl,
    poster: constructionExecutionUrl,
    number: "06",
    eyebrow: "Ringkasan bergerak",
    title: "Satu alur kerja, terhubung dari awal hingga akhir.",
    caption: "Lihat bagaimana informasi bergerak bersama pekerjaan konstruksi tanpa memutus peran profesional di dalamnya.",
    gustafta: "Gustafta mengisi celah di antara dokumen, keputusan, pekerjaan lapangan, dan pengetahuan organisasi.",
  },
];

const CONSTRUCTION_SLIDE_DURATION_MS = 5_200;
const CONSTRUCTION_VIDEO_FALLBACK_MS = 10_000;

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
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === active) {
        void video.play().catch(() => {
          // Browsers may still require a user gesture in restrictive contexts.
        });
        return;
      }

      video.pause();
      video.currentTime = 0;
    });
  }, [active]);

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
              <CarouselItem className="pl-0" key={slide.webm} role="tabpanel" aria-label={`${index + 1} dari ${videoSlides.length}: ${slide.title}`}>
                <figure>
                  <div className="aspect-video overflow-hidden rounded-[1.05rem] bg-[#102a35]">
                    <video
                      aria-label={slide.title}
                      className="h-full w-full object-cover"
                      controls
                      autoPlay
                      muted
                      onEnded={next}
                      playsInline
                      poster={slide.poster}
                      preload="metadata"
                      ref={(video) => {
                        videoRefs.current[index] = video;
                      }}
                      data-testid={`landing-video-slide-${index + 1}`}
                    >
                      <source src={slide.webm} type="video/webm" />
                      <source src={slide.mp4} type="video/mp4" />
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

export function LandingConstructionWorkflowCarousel() {
  const { active, next, select, setApi } = useCarouselState(constructionWorkflowSlides.length);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeSlide = constructionWorkflowSlides[active];
  const videoSlideIndex = constructionWorkflowSlides.length - 1;

  const playActiveVideo = useCallback(() => {
    if (active !== videoSlideIndex) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    void video.play().catch(() => {
      // A canplay/loadeddata retry or the fallback timer will handle this.
    });
  }, [active, videoSlideIndex]);

  const completeActiveVideo = useCallback(() => {
    if (active !== videoSlideIndex) return;
    videoRef.current?.pause();
    select(0);
  }, [active, select, videoSlideIndex]);

  useEffect(() => {
    const delay = activeSlide.kind === "video"
      ? CONSTRUCTION_VIDEO_FALLBACK_MS
      : CONSTRUCTION_SLIDE_DURATION_MS;
    const timer = window.setTimeout(
      activeSlide.kind === "video" ? completeActiveVideo : next,
      delay,
    );
    return () => window.clearTimeout(timer);
  }, [activeSlide.kind, completeActiveVideo, next]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (activeSlide.kind === "video") {
      video.currentTime = 0;
      playActiveVideo();
      const retry = window.setTimeout(playActiveVideo, 250);
      video.addEventListener("canplay", playActiveVideo);
      return () => {
        window.clearTimeout(retry);
        video.removeEventListener("canplay", playActiveVideo);
      };
    }
    video.pause();
    video.currentTime = 0;
  }, [activeSlide.kind, playActiveVideo]);

  return (
    <section
      aria-labelledby="construction-workflow-heading"
      className="overflow-hidden bg-[#091524] px-5 py-20 text-[#f8fafc] md:py-24"
      data-testid="landing-construction-carousel"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[.2em] text-[#67e8f9]">
              <HardHat className="h-4 w-4" /> Konstruksi × Gustafta
            </div>
            <h2
              className="max-w-3xl font-display text-4xl font-semibold leading-tight tracking-[-.06em] md:text-5xl"
              id="construction-workflow-heading"
            >
              Dari dokumen pertama sampai serah terima.
            </h2>
          </div>
          <div className="max-w-sm">
            <p className="text-sm leading-6 text-[#b8c9d9]">
              Ikuti alur otomatis untuk melihat bagaimana Gustafta mengisi pekerjaan konstruksi di setiap tahap.
            </p>
            <div className="mt-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#a78bfa]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#67e8f9]" aria-hidden="true" />
              Berjalan otomatis dan berulang
            </div>
          </div>
        </div>
        <Carousel
          className="min-w-0"
          opts={{ loop: true }}
          setApi={setApi}
          data-testid="landing-construction-carousel-region"
        >
          <CarouselContent className="ml-0">
            {constructionWorkflowSlides.map((slide, index) => (
              <CarouselItem
                aria-label={`${index + 1} dari ${constructionWorkflowSlides.length}: ${slide.title}`}
                className="pl-0"
                key={`${slide.kind}-${slide.number}`}
                role="tabpanel"
              >
                <article className="grid overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#10243a] shadow-[0_26px_70px_rgba(0,0,0,.3)] md:grid-cols-[.86fr_1.14fr]">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#07101d] md:aspect-auto md:min-h-[570px]">
                    {slide.kind === "image" ? (
                      <img
                        alt={slide.alt}
                        className="h-full w-full object-cover"
                        data-testid={`landing-construction-slide-${index + 1}`}
                        decoding="async"
                        loading={index === 0 ? "eager" : "lazy"}
                        src={slide.src}
                      />
                    ) : (
                      <video
                        aria-label={slide.title}
                        autoPlay
                        className="h-full w-full object-cover"
                        data-testid={`landing-construction-slide-${index + 1}`}
                        muted
                        onCanPlay={playActiveVideo}
                        onEnded={completeActiveVideo}
                        onLoadedData={playActiveVideo}
                        onTimeUpdate={(event) => {
                          const video = event.currentTarget;
                          if (
                            Number.isFinite(video.duration)
                            && video.duration > 0
                            && video.duration - video.currentTime <= 0.18
                          ) {
                            completeActiveVideo();
                          }
                        }}
                        playsInline
                        poster={slide.poster}
                        preload="auto"
                        ref={videoRef}
                      >
                        <source src={slide.webm} type="video/webm" />
                        <source src={slide.mp4} type="video/mp4" />
                        Browser Anda belum mendukung pemutaran video.
                      </video>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07101d]/75 via-transparent to-transparent" />
                    <span className="absolute bottom-5 left-5 rounded-full border border-white/25 bg-[#07101d]/75 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#dbeafe] backdrop-blur">
                      Tahap {slide.number}
                    </span>
                  </div>
                  <div className="flex min-h-[360px] flex-col p-7 md:p-11">
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[.2em] text-[#67e8f9]">{slide.eyebrow}</p>
                    <h3 className="mt-5 max-w-lg font-display text-3xl font-semibold leading-[1.05] tracking-[-.05em] text-white md:text-4xl">{slide.title}</h3>
                    <p className="mt-5 max-w-lg text-sm leading-7 text-[#b8c9d9]">{slide.caption}</p>
                    <div className="mt-7 max-w-lg rounded-2xl border border-[#60a5fa]/25 bg-[#0b1b2d] p-5">
                      <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#a78bfa]">Peran Gustafta</p>
                      <p className="text-sm leading-6 text-[#e2e8f0]">{slide.gustafta}</p>
                    </div>
                    <span className="mt-auto pt-8 font-mono text-xs font-bold tracking-[.2em] text-[#71869a]">
                      {slide.number} / 0{constructionWorkflowSlides.length}
                    </span>
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex gap-2" role="group" aria-label="Tahap konstruksi">
              {constructionWorkflowSlides.map((slide, index) => (
                <button
                  aria-label={`Tampilkan tahap ${slide.number}`}
                  aria-pressed={active === index}
                  className={`h-2.5 rounded-full transition-[width,background-color] duration-300 ${
                    active === index ? "w-9 bg-gradient-to-r from-[#22d3ee] to-[#a78bfa]" : "w-2.5 bg-white/25 hover:bg-white/45"
                  }`}
                  data-testid={`landing-construction-dot-${index + 1}`}
                  key={slide.number}
                  onClick={() => select(index)}
                  type="button"
                />
              ))}
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#71869a]">
              Gambar bergeser setiap 5 detik
            </span>
          </div>
        </Carousel>
      </div>
    </section>
  );
}