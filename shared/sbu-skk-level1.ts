import {
  assessSbuReadiness,
  type SbuReadinessAnswers,
  type SbuReadinessChoice,
  validateSbuReadinessAnswers,
} from "./sbu-readiness";

export const SBU_SKK_LEVEL1_VERSION = "2026-08-24.v1" as const;

export type SbuSkkLevel1DiagnosticType = "sbu" | "skk";
export type SbuSkkLevel1StatusKey = "foundation" | "organize" | "validate";

export interface SbuSkkLevel1Result {
  type: SbuSkkLevel1DiagnosticType;
  score: number;
  statusKey: SbuSkkLevel1StatusKey;
  statusLabel: string;
  rubricVersion: string;
}

export const SKK_READINESS_JOURNEYS = [
  { value: "first", label: "Mengurus SKK pertama kali" },
  { value: "renewal", label: "Memperpanjang atau memperbarui SKK" },
  { value: "upgrade", label: "Naik jenjang atau menambah jabatan kerja" },
] as const;

export const SKK_READINESS_LEVELS = [
  { value: "operator", label: "Operator" },
  { value: "technician", label: "Teknisi / Analis" },
  { value: "expert", label: "Ahli" },
] as const;

export const SKK_READINESS_CHOICES = [
  {
    value: "none",
    label: "Belum",
    description: "Belum tersedia atau belum dipetakan.",
  },
  {
    value: "partial",
    label: "Sebagian",
    description: "Sudah ada, tetapi belum lengkap atau belum diperiksa.",
  },
  {
    value: "ready",
    label: "Siap",
    description: "Sudah tersedia dan telah diperiksa secara internal.",
  },
] as const;

export type SkkReadinessJourney =
  typeof SKK_READINESS_JOURNEYS[number]["value"];
export type SkkReadinessLevel =
  typeof SKK_READINESS_LEVELS[number]["value"];
export type SkkReadinessQuestionId =
  | "target"
  | "education"
  | "experience"
  | "competency"
  | "portfolio"
  | "employment"
  | "assessment"
  | "documents";

export interface SkkReadinessQuestion {
  id: SkkReadinessQuestionId;
  label: string;
  helper: string;
  weight: number;
}

export const SKK_READINESS_QUESTIONS: readonly SkkReadinessQuestion[] = [
  {
    id: "target",
    label: "Target jabatan kerja dan jenjang",
    helper: "Apakah jabatan kerja serta jenjang SKK yang dituju sudah ditentukan?",
    weight: 12,
  },
  {
    id: "education",
    label: "Pendidikan dan bidang keilmuan",
    helper: "Apakah ijazah serta bidang pendidikan sudah dipetakan terhadap target SKK?",
    weight: 12,
  },
  {
    id: "experience",
    label: "Pengalaman kerja relevan",
    helper: "Apakah durasi dan jenis pengalaman kerja relevan sudah memenuhi pemeriksaan awal?",
    weight: 16,
  },
  {
    id: "competency",
    label: "Unit kompetensi",
    helper: "Apakah unit kompetensi untuk jabatan kerja yang dituju sudah dipahami dan dipetakan?",
    weight: 14,
  },
  {
    id: "portfolio",
    label: "Portofolio dan bukti proyek",
    helper: "Apakah bukti proyek, peran, keluaran pekerjaan, dan dokumentasi pendukung sudah tertata?",
    weight: 18,
  },
  {
    id: "employment",
    label: "Riwayat kerja dan referensi",
    helper: "Apakah riwayat kerja, surat pengalaman, atau referensi pemberi kerja sudah tersedia?",
    weight: 10,
  },
  {
    id: "assessment",
    label: "Persiapan uji kompetensi",
    helper: "Apakah materi teori, teknis, dan wawancara sudah pernah dipelajari atau disimulasikan?",
    weight: 10,
  },
  {
    id: "documents",
    label: "Dokumen administrasi",
    helper: "Apakah identitas, ijazah, pasfoto, CV, dan dokumen pengajuan utama sudah konsisten?",
    weight: 8,
  },
] as const;

export interface SkkReadinessAnswers {
  journey: SkkReadinessJourney;
  targetLevel: SkkReadinessLevel;
  target: SbuReadinessChoice;
  education: SbuReadinessChoice;
  experience: SbuReadinessChoice;
  competency: SbuReadinessChoice;
  portfolio: SbuReadinessChoice;
  employment: SbuReadinessChoice;
  assessment: SbuReadinessChoice;
  documents: SbuReadinessChoice;
}

const SKK_ANSWER_KEYS = [
  "journey",
  "targetLevel",
  ...SKK_READINESS_QUESTIONS.map((question) => question.id),
] as const;

function isAllowedValue(value: unknown, allowed: readonly string[]): boolean {
  return typeof value === "string" && allowed.includes(value);
}

export function validateSkkReadinessAnswers(input: unknown): string[] {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return ["Jawaban assessment harus berupa objek."];
  }
  const object = input as Record<string, unknown>;
  const errors: string[] = [];
  if (Object.keys(object).some(
    (key) => !(SKK_ANSWER_KEYS as readonly string[]).includes(key),
  )) {
    errors.push("Assessment memuat field yang tidak diizinkan.");
  }
  if (!isAllowedValue(
    object.journey,
    SKK_READINESS_JOURNEYS.map((item) => item.value),
  )) {
    errors.push("Tujuan pengurusan SKK belum dipilih.");
  }
  if (!isAllowedValue(
    object.targetLevel,
    SKK_READINESS_LEVELS.map((item) => item.value),
  )) {
    errors.push("Target jenjang SKK belum dipilih.");
  }
  for (const question of SKK_READINESS_QUESTIONS) {
    if (!isAllowedValue(object[question.id], ["none", "partial", "ready"])) {
      errors.push(`${question.label} belum dijawab.`);
    }
  }
  return errors;
}

function normalizedStatus(score: number): Pick<
  SbuSkkLevel1Result,
  "statusKey" | "statusLabel"
> {
  if (score < 40) {
    return { statusKey: "foundation", statusLabel: "Fondasi perlu dibangun" };
  }
  if (score < 70) {
    return { statusKey: "organize", statusLabel: "Perlu penataan terarah" };
  }
  return { statusKey: "validate", statusLabel: "Siap divalidasi lebih lanjut" };
}

function assessSkkReadiness(input: unknown): SbuSkkLevel1Result {
  const errors = validateSkkReadinessAnswers(input);
  if (errors.length > 0) throw new Error(errors[0]);
  const answers = input as SkkReadinessAnswers;
  const factor: Record<SbuReadinessChoice, number> = {
    none: 0,
    partial: 0.5,
    ready: 1,
  };
  const score = SKK_READINESS_QUESTIONS.reduce(
    (total, question) =>
      total + Math.round(question.weight * factor[answers[question.id]]),
    0,
  );
  return {
    type: "skk",
    score,
    ...normalizedStatus(score),
    rubricVersion: `${SBU_SKK_LEVEL1_VERSION}.skk`,
  };
}

export function assessSbuSkkLevel1(
  type: SbuSkkLevel1DiagnosticType,
  input: unknown,
): SbuSkkLevel1Result {
  if (type === "skk") return assessSkkReadiness(input);

  const errors = validateSbuReadinessAnswers(input);
  if (errors.length > 0) throw new Error(errors[0]);
  const assessed = assessSbuReadiness(input as SbuReadinessAnswers);
  return {
    type: "sbu",
    score: assessed.score,
    statusKey: assessed.band,
    statusLabel: assessed.bandLabel,
    rubricVersion: `${SBU_SKK_LEVEL1_VERSION}.sbu`,
  };
}