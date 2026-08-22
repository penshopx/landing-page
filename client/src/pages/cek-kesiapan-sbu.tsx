import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { SBU_SKK_FUNNEL } from "@/data/pricing";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  assessSbuReadiness,
  SBU_READINESS_CHOICES,
  SBU_READINESS_JOURNEYS,
  SBU_READINESS_QUALIFICATIONS,
  SBU_READINESS_QUESTIONS,
  SBU_READINESS_RUBRIC_VERSION,
  validateSbuReadinessAnswers,
  type SbuReadinessAnswers,
  type SbuReadinessDestination,
  type SbuReadinessResult,
} from "@shared/sbu-readiness";

const destinations: Record<SbuReadinessDestination, { href: string; label: string; detail: string }> = {
  "mini-ebook": {
    href: SBU_SKK_FUNNEL.miniEbook.landingPath,
    label: "Mulai dari Mini Ebook",
    detail: "Pahami peta masalah dan istilah penting lebih dulu.",
  },
  ebook: {
    href: SBU_SKK_FUNNEL.bundle.landingPath,
    label: "Buka Ebook + Toolkit",
    detail: "Tata persyaratan dan dokumen dengan panduan kerja lengkap.",
  },
  "ai-specialist": {
    href: SBU_SKK_FUNNEL.aiSpecialist.landingPath,
    label: "Temui AI Specialist",
    detail: "Bawa kasus spesifik Anda ke pendamping edukatif.",
  },
};

type ReadinessEvent =
  | {
      eventType: "result";
      band: SbuReadinessResult["band"];
      rubricVersion: typeof SBU_READINESS_RUBRIC_VERSION;
    }
  | {
      eventType: "cta";
      band: SbuReadinessResult["band"];
      destination: SbuReadinessDestination;
      rubricVersion: typeof SBU_READINESS_RUBRIC_VERSION;
    };

function sendEvent(payload: ReadinessEvent) {
  void fetch("/api/sbu-skk/readiness/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}

export default function CekKesiapanSbuPage() {
  const [answers, setAnswers] = useState<Partial<SbuReadinessAnswers>>({});
  const [result, setResult] = useState<SbuReadinessResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    document.title = "Cek Kesiapan SBU | Gustafta";
  }, []);

  const answeredCount = useMemo(
    () => ["journey", "qualification", ...SBU_READINESS_QUESTIONS.map((q) => q.id)]
      .filter((key) => Boolean(answers[key as keyof SbuReadinessAnswers])).length,
    [answers],
  );
  const totalQuestions = SBU_READINESS_QUESTIONS.length + 2;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  function setAnswer<K extends keyof SbuReadinessAnswers>(key: K, value: SbuReadinessAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
    if (errors.length) setErrors([]);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateSbuReadinessAnswers(answers);
    if (validation.length) {
      setErrors(validation);
      document.getElementById("sbu-assessment-errors")?.focus();
      return;
    }
    const assessment = assessSbuReadiness(answers as SbuReadinessAnswers);
    setResult(assessment);
    sendEvent({ eventType: "result", band: assessment.band, rubricVersion: SBU_READINESS_RUBRIC_VERSION });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setAnswers({});
    setErrors([]);
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div data-testid="sbu-readiness-page" className="min-h-[100dvh] bg-[#f7f3ea] text-[#1c2b2d]">
      <SharedHeader />
      <main>
        <section className="relative overflow-hidden bg-[#173f43] text-[#f7f3ea]">
          <div className="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full bg-[#e8a83e]/15 blur-3xl" />
          <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
            <Link href="/mini-ebook-sbu-skk" className="relative inline-flex items-center gap-2 text-sm text-[#d5e3df] transition-colors hover:text-[#e8a83e]">
              <ArrowLeft className="h-4 w-4" /> Kembali ke peta SBU-SKK
            </Link>
            <div className="relative mt-12 grid gap-10 md:grid-cols-[1fr_320px] md:items-end">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.22em] text-[#e8a83e]">
                  <ClipboardCheck className="h-4 w-4" /> Orientasi awal · 5 menit
                </p>
                <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold leading-[.96] tracking-[-.055em] md:text-7xl">
                  Seberapa tertata langkah SBU Anda?
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#d5e3df]">
                  Jawab berdasarkan kondisi nyata hari ini. Hasilnya membantu Anda melihat urutan pekerjaan pertama — bukan menggantikan pemeriksaan resmi.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/[.07] p-5 backdrop-blur-sm">
                <div className="flex items-end justify-between">
                  <p className="text-sm font-semibold text-[#d5e3df]">Progres pengisian</p>
                  <p className="font-mono text-sm text-[#e8a83e]">{answeredCount}/{totalQuestions}</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15" aria-label={`${progress}% selesai`}>
                  <div className="h-full rounded-full bg-[#e8a83e] transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#b8ceca]">Tidak ada nama, kontak, atau dokumen yang diminta.</p>
              </div>
            </div>
          </div>
        </section>

        {result ? (
          <ResultView result={result} onReset={reset} />
        ) : (
          <form data-testid="sbu-readiness-form" onSubmit={submit} className="mx-auto max-w-4xl px-5 py-12 md:px-8 md:py-16">
            <div className="mb-10 rounded-2xl border border-[#d8d5cb] bg-[#eee9dc] p-5 text-sm leading-relaxed text-[#526467]">
              <ShieldCheck className="mb-3 h-5 w-5 text-[#17727a]" />
              Ini adalah self-assessment edukatif. Pilih <strong className="text-[#1c2b2d]">Belum</strong> jika ragu; hasil yang jujur lebih berguna daripada hasil yang terlihat tinggi.
            </div>

            <fieldset className="border-b border-[#d8d5cb] pb-10">
              <legend className="font-display text-2xl font-bold">Mulai dari arah Anda</legend>
              <p className="mt-2 text-sm text-[#637276]">Dua konteks ini membantu membaca hasil dengan lebih tepat.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <ChoiceField label="Perjalanan SBU" value={answers.journey} options={SBU_READINESS_JOURNEYS} onChange={(v) => setAnswer("journey", v as SbuReadinessAnswers["journey"])} />
                <ChoiceField label="Target kualifikasi" value={answers.qualification} options={SBU_READINESS_QUALIFICATIONS} onChange={(v) => setAnswer("qualification", v as SbuReadinessAnswers["qualification"])} />
              </div>
            </fieldset>

            <div className="pt-10">
              <div className="flex items-end justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#b07116]">Delapan titik cek</p><h2 className="mt-2 font-display text-3xl font-bold">Apa yang sudah ada di meja?</h2></div>
                <span className="hidden text-sm text-[#637276] md:block">Pilih satu per baris</span>
              </div>
              <div className="mt-8 space-y-4">
                {SBU_READINESS_QUESTIONS.map((question, index) => (
                  <fieldset key={question.id} className="rounded-2xl border border-[#d8d5cb] bg-[#fbfaf6] p-5 transition-shadow focus-within:shadow-lg focus-within:shadow-[#173f43]/5 md:p-6">
                    <legend className="sr-only">{question.label}</legend>
                    <div className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dcebea] font-mono text-xs font-bold text-[#17727a]">{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold leading-snug">{question.label}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-[#637276]">{question.helper}</p>
                        <div className="mt-5 grid gap-2 sm:grid-cols-3">
                          {SBU_READINESS_CHOICES.map((choice) => {
                            const selected = answers[question.id] === choice.value;
                            return <label key={choice.value} className={`cursor-pointer rounded-xl border p-3 transition-all hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-[#17727a] focus-within:ring-offset-2 ${selected ? "border-[#17727a] bg-[#dcebea] ring-2 ring-[#17727a]/20" : "border-[#d8d5cb] bg-[#f7f3ea] hover:border-[#17727a]/50"}`}>
                              <input type="radio" name={question.id} value={choice.value} checked={selected} onChange={() => setAnswer(question.id, choice.value)} className="sr-only" />
                              <span className="flex items-center gap-2 text-sm font-bold">{selected ? <Check className="h-4 w-4 text-[#17727a]" /> : <span className="h-4 w-4 rounded-full border border-[#9baaa7]" />}{choice.label}</span>
                              <span className="mt-1 block text-xs leading-relaxed text-[#637276]">{choice.description}</span>
                            </label>;
                          })}
                        </div>
                      </div>
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>
            {errors.length > 0 && <div id="sbu-assessment-errors" tabIndex={-1} role="alert" aria-live="polite" className="mt-8 rounded-xl border border-[#b94b3b]/30 bg-[#fff0eb] p-4 text-sm text-[#8c3025] outline-none"><TriangleAlert className="mr-2 inline h-4 w-4" />{errors[0]}</div>}
            <Button data-testid="sbu-readiness-submit" type="submit" className="mt-8 h-13 w-full bg-[#e8a83e] py-4 font-bold text-[#1c2b2d] hover:bg-[#f3bc59] md:w-auto md:px-8">Lihat hasil assessment <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </form>
        )}
      </main>
    </div>
  );
}

function ChoiceField({ label, value, options, onChange }: { label: string; value?: string; options: readonly { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <div><label className="text-sm font-semibold">{label}</label><div className="mt-2 grid gap-2">{options.map((option) => <label key={option.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-[#17727a] focus-within:ring-offset-2 ${value === option.value ? "border-[#17727a] bg-[#dcebea] font-bold" : "border-[#d8d5cb] bg-[#fbfaf6] hover:border-[#17727a]/50"}`}><input type="radio" name={label} checked={value === option.value} onChange={() => onChange(option.value)} className="accent-[#17727a]" />{option.label}</label>)}</div></div>;
}

function ResultView({ result, onReset }: { result: SbuReadinessResult; onReset: () => void }) {
  const primary = destinations[result.recommendedDestination];
  const steps = result.nextSteps;
  useEffect(() => {
    document.getElementById("sbu-readiness-result-heading")?.focus();
  }, []);
  return <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16" data-testid="sbu-readiness-result">
    <div className="grid gap-8 lg:grid-cols-[.78fr_1.22fr]">
      <div className="rounded-3xl bg-[#173f43] p-7 text-[#f7f3ea] shadow-xl shadow-[#173f43]/10 md:p-10">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#e8a83e]">Hasil orientasi Anda</p>
        <div data-testid="sbu-readiness-score" className="mt-9 font-display text-8xl font-bold leading-none tracking-[-.08em] text-[#e8a83e]">{result.score}<span className="text-3xl tracking-normal text-[#b8ceca]">/100</span></div>
        <h2 id="sbu-readiness-result-heading" tabIndex={-1} data-testid="sbu-readiness-band" className="mt-5 font-display text-2xl font-bold outline-none">{result.bandLabel}</h2>
        <p className="mt-3 leading-relaxed text-[#d5e3df]">{result.summary}</p>
        <div className="mt-9 border-t border-white/15 pt-5 text-sm text-[#b8ceca]"><Sparkles className="mr-2 inline h-4 w-4 text-[#e8a83e]" />Hasil dihitung lokal di perangkat Anda.</div>
      </div>
      <div>
        <div data-testid="sbu-readiness-disclaimer" className="rounded-2xl border-2 border-[#e8a83e]/60 bg-[#fff8e9] p-5 text-sm leading-relaxed text-[#5c4a25]"><TriangleAlert className="mr-2 inline h-5 w-5 text-[#b07116]" /><strong>Catatan penting:</strong> ini hanya indikasi awal, bukan jaminan kesiapan dan bukan keputusan resmi LSBU, LPJK, atau OSS. Verifikasi tetap harus mengikuti ketentuan dan kanal resmi yang berlaku.</div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <InfoList title="Yang sudah terlihat" items={result.strengths} positive />
          <InfoList title="Yang perlu diprioritaskan" items={result.gaps} />
        </div>
      </div>
    </div>
    <div className="mt-10 rounded-2xl border border-[#d8d5cb] bg-[#eee9dc] p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-[#b07116]">Tiga langkah berikutnya</p>
      <ol className="mt-5 grid gap-4 md:grid-cols-3">{steps.map((step, index) => <li key={`${step}-${index}`} className="flex gap-3"><span className="font-mono text-sm font-bold text-[#17727a]">0{index + 1}</span><span className="text-sm font-semibold leading-relaxed">{step}</span></li>)}</ol>
    </div>
    <div className="mt-10 rounded-2xl border border-[#17727a] bg-[#dcebea] p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#17727a]">Arah yang disarankan</p><h2 className="mt-2 font-display text-2xl font-bold">{primary.label}</h2><p className="mt-2 text-sm text-[#526467]">{primary.detail}</p></div>
      <Button asChild className="mt-5 shrink-0 bg-[#17727a] text-[#f7f3ea] hover:bg-[#125e65] md:mt-0">
        <Link
          data-testid="sbu-readiness-primary-cta"
          href={primary.href}
          onClick={() => onCtaEvent(result.recommendedDestination, result.band)}
        >
          {primary.label}<ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#d8d5cb] pt-6">
      <button data-testid="sbu-readiness-reset" type="button" onClick={onReset} className="inline-flex items-center gap-2 text-sm font-bold text-[#17727a] hover:text-[#b07116]"><RotateCcw className="h-4 w-4" /> Ulangi atau edit jawaban</button>
      <span className="text-sm text-[#637276]">Ingin mulai dari materi lain?</span>
      <Link data-testid="sbu-readiness-cta-mini-ebook" href={destinations["mini-ebook"].href} onClick={() => onCtaEvent("mini-ebook", result.band)} className="text-sm font-bold text-[#17727a] hover:text-[#b07116]">Mini Ebook</Link>
      <Link data-testid="sbu-readiness-cta-ebook" href={destinations.ebook.href} onClick={() => onCtaEvent("ebook", result.band)} className="text-sm font-bold text-[#17727a] hover:text-[#b07116]">Ebook + Toolkit</Link>
      <Link data-testid="sbu-readiness-cta-ai-specialist" href={destinations["ai-specialist"].href} onClick={() => onCtaEvent("ai-specialist", result.band)} className="text-sm font-bold text-[#17727a] hover:text-[#b07116]">AI Specialist</Link>
    </div>
  </section>;
}

function onCtaEvent(destination: SbuReadinessDestination, band: SbuReadinessResult["band"]) {
  sendEvent({ eventType: "cta", band, destination, rubricVersion: SBU_READINESS_RUBRIC_VERSION });
}

function InfoList({ title, items, positive = false }: { title: string; items: string[]; positive?: boolean }) {
  return <div><h3 className="font-display text-xl font-bold">{title}</h3><ul className="mt-4 space-y-3">{items.map((item) => <li key={item} className="flex gap-3 text-sm leading-relaxed text-[#526467]"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${positive ? "text-[#17727a]" : "text-[#b07116]"}`} />{item}</li>)}</ul></div>;
}