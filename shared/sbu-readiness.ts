/**
 * Public SBU readiness rubric.
 *
 * This module is deliberately deterministic and safe to bundle in the browser.
 * The visitor's answers are scored locally and must never be sent to analytics.
 */
export const SBU_READINESS_RUBRIC_VERSION = "2026-08-22.v1" as const;

export const SBU_READINESS_JOURNEYS = [
  { value: "first", label: "Mengurus SBU pertama kali" },
  { value: "renewal", label: "Memperpanjang atau memperbarui SBU" },
  { value: "upgrade", label: "Menambah subklasifikasi atau naik kualifikasi" },
] as const;

export const SBU_READINESS_QUALIFICATIONS = [
  { value: "small", label: "Kecil" },
  { value: "medium", label: "Menengah" },
  { value: "large", label: "Besar" },
] as const;

export type SbuReadinessJourney = typeof SBU_READINESS_JOURNEYS[number]["value"];
export type SbuReadinessQualification =
  typeof SBU_READINESS_QUALIFICATIONS[number]["value"];
export type SbuReadinessChoice = "none" | "partial" | "ready";

export type SbuReadinessQuestionId =
  | "classification"
  | "pjbu"
  | "pjtbu"
  | "pjskbu"
  | "skk"
  | "experience"
  | "finance"
  | "documents";

export interface SbuReadinessQuestion {
  id: SbuReadinessQuestionId;
  label: string;
  helper: string;
  weight: number;
  readyStrength: string;
  partialStrength: string;
  gap: string;
  nextStep: string;
}

export const SBU_READINESS_CHOICES = [
  {
    value: "none",
    label: "Belum",
    description: "Belum tersedia atau belum dipetakan.",
    factor: 0,
  },
  {
    value: "partial",
    label: "Sebagian",
    description: "Sudah ada, tetapi belum lengkap atau belum tervalidasi.",
    factor: 0.5,
  },
  {
    value: "ready",
    label: "Siap",
    description: "Sudah tersedia dan telah diperiksa secara internal.",
    factor: 1,
  },
] as const;

export const SBU_READINESS_QUESTIONS: readonly SbuReadinessQuestion[] = [
  {
    id: "classification",
    label: "Klasifikasi dan subklasifikasi yang dituju",
    helper: "Apakah ruang lingkup usaha sudah dipetakan ke klasifikasi dan subklasifikasi SBU yang relevan?",
    weight: 12,
    readyStrength: "Target klasifikasi dan subklasifikasi sudah dipetakan.",
    partialStrength: "Calon klasifikasi sudah ada, meski masih perlu validasi ruang lingkup.",
    gap: "Klasifikasi dan subklasifikasi belum cukup pasti.",
    nextStep: "Petakan pekerjaan utama dan cocokkan dengan klasifikasi/subklasifikasi yang berlaku.",
  },
  {
    id: "pjbu",
    label: "PJBU",
    helper: "Apakah Penanggung Jawab Badan Usaha sudah ditetapkan dan datanya siap?",
    weight: 8,
    readyStrength: "PJBU sudah ditetapkan dan siap diverifikasi.",
    partialStrength: "Kandidat PJBU sudah ada, tetapi datanya belum sepenuhnya siap.",
    gap: "Kesiapan PJBU masih menjadi celah.",
    nextStep: "Tetapkan PJBU dan rapikan data identitas serta hubungan resminya dengan badan usaha.",
  },
  {
    id: "pjtbu",
    label: "PJTBU",
    helper: "Apakah Penanggung Jawab Teknis Badan Usaha sudah sesuai dengan target usaha?",
    weight: 8,
    readyStrength: "PJTBU sudah tersedia untuk target yang dipilih.",
    partialStrength: "Kandidat PJTBU sudah ada, tetapi kecocokannya masih perlu diperiksa.",
    gap: "Kesiapan PJTBU belum memadai.",
    nextStep: "Periksa kebutuhan PJTBU dan kesesuaiannya dengan target klasifikasi serta kualifikasi.",
  },
  {
    id: "pjskbu",
    label: "PJSKBU",
    helper: "Apakah penanggung jawab subklasifikasi telah tersedia untuk ruang lingkup yang dituju?",
    weight: 8,
    readyStrength: "PJSKBU sudah dipetakan untuk subklasifikasi yang dituju.",
    partialStrength: "Kandidat PJSKBU tersedia, tetapi pemetaan subklasifikasinya belum final.",
    gap: "PJSKBU untuk target subklasifikasi belum siap.",
    nextStep: "Petakan kebutuhan PJSKBU per subklasifikasi dan periksa kecocokan personelnya.",
  },
  {
    id: "skk",
    label: "SKK tenaga kerja",
    helper: "Apakah SKK tenaga kerja yang dibutuhkan tersedia, sesuai jenjang, dan masih dapat digunakan?",
    weight: 16,
    readyStrength: "SKK tenaga kerja sudah dipetakan dan siap diperiksa.",
    partialStrength: "Sebagian SKK tenaga kerja sudah tersedia.",
    gap: "Ketersediaan atau kecocokan SKK tenaga kerja masih kurang.",
    nextStep: "Buat matriks kebutuhan SKK: jabatan kerja, jenjang, pemegang, dan status bukti pendukung.",
  },
  {
    id: "experience",
    label: "Pengalaman dan penjualan tahunan",
    helper: "Apakah bukti pengalaman pekerjaan dan data penjualan tahunan sudah tertata untuk target kualifikasi?",
    weight: 16,
    readyStrength: "Bukti pengalaman dan penjualan tahunan sudah tertata.",
    partialStrength: "Sebagian bukti pengalaman atau penjualan tahunan sudah tersedia.",
    gap: "Bukti pengalaman atau penjualan tahunan belum cukup tertata.",
    nextStep: "Inventarisasi kontrak, BAST, nilai pekerjaan, dan rekap penjualan yang relevan.",
  },
  {
    id: "finance",
    label: "Kondisi dan dokumen keuangan",
    helper: "Apakah data keuangan badan usaha sudah tersedia dan selaras dengan target kualifikasi?",
    weight: 12,
    readyStrength: "Data keuangan sudah siap untuk pemeriksaan awal.",
    partialStrength: "Data keuangan tersedia sebagian dan masih perlu dirapikan.",
    gap: "Kesiapan data keuangan masih lemah.",
    nextStep: "Rapikan data keuangan dan periksa kecukupannya terhadap target kualifikasi.",
  },
  {
    id: "documents",
    label: "Kelompok dokumen badan usaha",
    helper: "Apakah akta, NIB, NPWP, data pengurus, dan dokumen pendukung utama sudah terkumpul dan konsisten?",
    weight: 20,
    readyStrength: "Kelompok dokumen badan usaha sudah terkumpul dan konsisten.",
    partialStrength: "Dokumen utama sudah ada, tetapi belum lengkap atau belum konsisten.",
    gap: "Dokumen badan usaha belum lengkap atau belum konsisten.",
    nextStep: "Buat daftar dokumen induk dan tandai data yang berbeda antara akta, NIB, NPWP, serta dokumen pengurus.",
  },
] as const;

export interface SbuReadinessAnswers {
  journey: SbuReadinessJourney;
  qualification: SbuReadinessQualification;
  classification: SbuReadinessChoice;
  pjbu: SbuReadinessChoice;
  pjtbu: SbuReadinessChoice;
  pjskbu: SbuReadinessChoice;
  skk: SbuReadinessChoice;
  experience: SbuReadinessChoice;
  finance: SbuReadinessChoice;
  documents: SbuReadinessChoice;
}

export type SbuReadinessBand = "foundation" | "organize" | "validate";
export type SbuReadinessDestination = "mini-ebook" | "ebook" | "ai-specialist";
export type SbuReadinessEventType = "result" | "cta";

export interface SbuReadinessDimensionResult {
  id: SbuReadinessQuestionId;
  label: string;
  weight: number;
  points: number;
  state: SbuReadinessChoice;
  strength: string | null;
  gap: string | null;
  nextStep: string | null;
}

export interface SbuReadinessResult {
  rubricVersion: typeof SBU_READINESS_RUBRIC_VERSION;
  score: number;
  band: SbuReadinessBand;
  bandLabel: string;
  summary: string;
  recommendedDestination: SbuReadinessDestination;
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
  breakdown: SbuReadinessDimensionResult[];
}

const ANSWER_KEYS = [
  "journey",
  "qualification",
  ...SBU_READINESS_QUESTIONS.map((question) => question.id),
] as const;

const CHOICE_FACTORS: Record<SbuReadinessChoice, number> = {
  none: 0,
  partial: 0.5,
  ready: 1,
};

function isAllowedValue(value: unknown, allowed: readonly string[]): boolean {
  return typeof value === "string" && allowed.includes(value);
}

export function validateSbuReadinessAnswers(input: unknown): string[] {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return ["Jawaban assessment harus berupa objek."];
  }

  const object = input as Record<string, unknown>;
  const errors: string[] = [];
  const unknownKeys = Object.keys(object).filter(
    (key) => !(ANSWER_KEYS as readonly string[]).includes(key),
  );
  if (unknownKeys.length > 0) {
    errors.push("Assessment memuat field yang tidak diizinkan.");
  }

  if (!isAllowedValue(
    object.journey,
    SBU_READINESS_JOURNEYS.map((item) => item.value),
  )) {
    errors.push("Tujuan pengurusan SBU belum dipilih.");
  }
  if (!isAllowedValue(
    object.qualification,
    SBU_READINESS_QUALIFICATIONS.map((item) => item.value),
  )) {
    errors.push("Target kualifikasi belum dipilih.");
  }

  for (const question of SBU_READINESS_QUESTIONS) {
    if (!isAllowedValue(object[question.id], ["none", "partial", "ready"])) {
      errors.push(`${question.label} belum dijawab.`);
    }
  }

  return errors;
}

function bandForScore(score: number): Pick<
  SbuReadinessResult,
  "band" | "bandLabel" | "summary" | "recommendedDestination"
> {
  if (score < 40) {
    return {
      band: "foundation",
      bandLabel: "Fondasi perlu dibangun",
      summary:
        "Beberapa prasyarat inti masih perlu dipetakan sebelum proses SBU ditata lebih jauh.",
      recommendedDestination: "mini-ebook",
    };
  }
  if (score < 70) {
    return {
      band: "organize",
      bandLabel: "Perlu penataan terarah",
      summary:
        "Fondasi awal sudah terlihat, tetapi masih ada gap penting yang perlu dirapikan secara sistematis.",
      recommendedDestination: "ebook",
    };
  }
  return {
    band: "validate",
    bandLabel: "Siap divalidasi lebih lanjut",
    summary:
      "Banyak prasyarat awal sudah tersedia. Langkah berikutnya adalah memvalidasi kecocokan dan konsistensinya.",
    recommendedDestination: "ai-specialist",
  };
}

export function assessSbuReadiness(input: SbuReadinessAnswers): SbuReadinessResult {
  const errors = validateSbuReadinessAnswers(input);
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }

  const breakdown = SBU_READINESS_QUESTIONS.map((question) => {
    const state = input[question.id];
    const points = Math.round(question.weight * CHOICE_FACTORS[state]);
    return {
      id: question.id,
      label: question.label,
      weight: question.weight,
      points,
      state,
      strength:
        state === "ready"
          ? question.readyStrength
          : state === "partial"
            ? question.partialStrength
            : null,
      gap: state === "ready" ? null : question.gap,
      nextStep: state === "ready" ? null : question.nextStep,
    } satisfies SbuReadinessDimensionResult;
  });

  const score = breakdown.reduce((total, item) => total + item.points, 0);
  const band = bandForScore(score);
  const journeyLabel =
    SBU_READINESS_JOURNEYS.find((item) => item.value === input.journey)?.label
    ?? "Tujuan SBU";
  const qualificationLabel =
    SBU_READINESS_QUALIFICATIONS.find((item) => item.value === input.qualification)?.label
    ?? "target";

  const strengths = [
    `${journeyLabel} dengan target kualifikasi ${qualificationLabel} sudah ditentukan.`,
    ...breakdown
      .filter((item) => item.strength)
      .sort((a, b) => b.points - a.points || b.weight - a.weight)
      .map((item) => item.strength as string),
  ].slice(0, 4);

  const prioritizedGaps = breakdown
    .filter((item) => item.gap)
    .sort(
      (a, b) =>
        (b.weight - b.points) - (a.weight - a.points)
        || b.weight - a.weight,
    );
  const gaps = prioritizedGaps.length > 0
    ? prioritizedGaps.slice(0, 4).map((item) => item.gap as string)
    : ["Tetap periksa kesesuaian data dan persyaratan melalui kanal resmi."];

  const offerStep: Record<SbuReadinessDestination, string> = {
    "mini-ebook":
      "Mulai dari Mini Ebook SBU-SKK untuk memahami peta masalah dan istilah penting.",
    ebook:
      "Gunakan Ebook + Toolkit SBU-SKK untuk menata persyaratan dan dokumen secara sistematis.",
    "ai-specialist":
      "Validasikan gap dan kasus spesifik bersama AI Specialist SBU-SKK sebelum mengambil langkah berikutnya.",
  };
  const gapSteps = prioritizedGaps
    .slice(0, 2)
    .map((item) => item.nextStep as string);
  if (gapSteps.length === 0) {
    gapSteps.push("Susun snapshot data dan dokumen yang siap untuk divalidasi.");
  }
  if (gapSteps.length === 1) {
    gapSteps.push("Cocokkan hasil awal ini dengan ketentuan dan kanal resmi yang berlaku.");
  }
  const nextSteps = [
    ...gapSteps,
    offerStep[band.recommendedDestination],
  ].filter((step, index, all) => all.indexOf(step) === index).slice(0, 3);

  return {
    rubricVersion: SBU_READINESS_RUBRIC_VERSION,
    score,
    ...band,
    strengths,
    gaps,
    nextSteps,
    breakdown,
  };
}