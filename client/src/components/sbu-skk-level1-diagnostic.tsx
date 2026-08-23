import { FormEvent, useState } from "react";
import {
  SBU_READINESS_CHOICES,
  SBU_READINESS_JOURNEYS,
  SBU_READINESS_QUALIFICATIONS,
  SBU_READINESS_QUESTIONS,
  type SbuReadinessAnswers,
} from "@shared/sbu-readiness";
import {
  SKK_READINESS_CHOICES,
  SKK_READINESS_JOURNEYS,
  SKK_READINESS_LEVELS,
  SKK_READINESS_QUESTIONS,
  type SkkReadinessAnswers,
  type SbuSkkLevel1DiagnosticType,
  type SbuSkkLevel1Result,
} from "@shared/sbu-skk-level1";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Building2,
  Check,
  ClipboardCheck,
  LockKeyhole,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

export interface LevelOneDiagnosticAccess {
  eligible: true;
  choices: Array<{
    type: SbuSkkLevel1DiagnosticType;
    title: string;
    description: string;
  }>;
  selectedType: SbuSkkLevel1DiagnosticType | null;
  result: SbuSkkLevel1Result | null;
}

interface Props {
  token: string;
  access: LevelOneDiagnosticAccess;
}

type DiagnosticAnswers =
  | Partial<SbuReadinessAnswers>
  | Partial<SkkReadinessAnswers>;

export function SbuSkkLevelOneDiagnostic({ token, access }: Props) {
  const [selectedType, setSelectedType] =
    useState<SbuSkkLevel1DiagnosticType | null>(access.selectedType);
  const [answers, setAnswers] = useState<DiagnosticAnswers>({});
  const [result, setResult] = useState<SbuSkkLevel1Result | null>(
    access.result,
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function choose(type: SbuSkkLevel1DiagnosticType) {
    if (result) return;
    setSelectedType(type);
    setAnswers({});
    setError("");
  }

  function setAnswer(key: string, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedType || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `/api/store/access/${encodeURIComponent(token)}/level-one-diagnostic`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: selectedType, answers }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.result) {
        if (response.status === 409 && payload.result) {
          setSelectedType(payload.result.type);
          setResult(payload.result);
          return;
        }
        throw new Error(payload.error || "Diagnosis belum dapat diproses.");
      }
      setSelectedType(payload.result.type);
      setResult(payload.result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Diagnosis belum dapat diproses.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card
      id="level-one-diagnostic"
      className="border-sky-400/30 bg-sky-400/[.08] text-white"
      data-testid="level-one-diagnostic"
    >
      <CardContent className="p-5 md:p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky-400/15 p-2.5 text-sky-300">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-sky-300">
              Bonus Paket Level 1
            </p>
            <h3 className="mt-1 text-xl font-bold">
              Pilih satu diagnosis kesiapan
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-300">
              Anda mendapatkan Cek Kesiapan SBU <strong>atau</strong> SKK.
              Pilihan dikunci saat hasil dihitung dan tidak dapat ditukar.
            </p>
          </div>
        </div>

        {result ? (
          <DiagnosticResult result={result} />
        ) : selectedType ? (
          <DiagnosticForm
            type={selectedType}
            answers={answers}
            error={error}
            submitting={submitting}
            onAnswer={setAnswer}
            onBack={() => choose(selectedType === "sbu" ? "skk" : "sbu")}
            onSubmit={submit}
          />
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {access.choices.map((choice) => {
              const Icon = choice.type === "sbu" ? Building2 : UserRoundCheck;
              return (
                <button
                  key={choice.type}
                  type="button"
                  onClick={() => choose(choice.type)}
                  className="group rounded-2xl border border-white/15 bg-gray-950/40 p-5 text-left transition hover:-translate-y-0.5 hover:border-sky-300/70 hover:bg-sky-300/10 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  data-testid={`choose-diagnostic-${choice.type}`}
                >
                  <Icon className="h-7 w-7 text-sky-300" />
                  <span className="mt-4 block font-bold">{choice.title}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-gray-400">
                    {choice.description}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DiagnosticForm({
  type,
  answers,
  error,
  submitting,
  onAnswer,
  onBack,
  onSubmit,
}: {
  type: SbuSkkLevel1DiagnosticType;
  answers: DiagnosticAnswers;
  error: string;
  submitting: boolean;
  onAnswer: (key: string, value: string) => void;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isSbu = type === "sbu";
  const contexts = isSbu
    ? [
        {
          key: "journey",
          label: "Perjalanan SBU",
          options: SBU_READINESS_JOURNEYS,
        },
        {
          key: "qualification",
          label: "Target kualifikasi",
          options: SBU_READINESS_QUALIFICATIONS,
        },
      ]
    : [
        {
          key: "journey",
          label: "Perjalanan SKK",
          options: SKK_READINESS_JOURNEYS,
        },
        {
          key: "targetLevel",
          label: "Target jenjang",
          options: SKK_READINESS_LEVELS,
        },
      ];
  const questions = isSbu
    ? SBU_READINESS_QUESTIONS
    : SKK_READINESS_QUESTIONS;
  const choices = isSbu ? SBU_READINESS_CHOICES : SKK_READINESS_CHOICES;

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-6">
      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-5">
        <div>
          <p className="text-sm font-bold text-sky-300">
            Cek Kesiapan {type.toUpperCase()}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Jawab berdasarkan kondisi nyata hari ini.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="border-white/15 bg-transparent text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Ganti ke {isSbu ? "SKK" : "SBU"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {contexts.map((context) => (
          <fieldset key={context.key}>
            <legend className="text-sm font-semibold text-gray-200">
              {context.label}
            </legend>
            <div className="mt-2 grid gap-2">
              {context.options.map((option) => (
                <Choice
                  key={option.value}
                  name={context.key}
                  value={option.value}
                  label={option.label}
                  selected={
                    (answers as Record<string, string | undefined>)[context.key]
                    === option.value
                  }
                  onSelect={() => onAnswer(context.key, option.value)}
                />
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="space-y-3">
        {questions.map((question, index) => (
          <fieldset
            key={question.id}
            className="rounded-2xl border border-white/10 bg-gray-950/35 p-4"
          >
            <legend className="sr-only">{question.label}</legend>
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-400/15 font-mono text-xs font-bold text-sky-300">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{question.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-400">
                  {question.helper}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {choices.map((choice) => (
                    <Choice
                      key={choice.value}
                      name={question.id}
                      value={choice.value}
                      label={choice.label}
                      description={choice.description}
                      selected={
                        (answers as Record<string, string | undefined>)[question.id]
                        === choice.value
                      }
                      onSelect={() => onAnswer(question.id, choice.value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </fieldset>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
        <LockKeyhole className="mr-2 inline h-4 w-4" />
        Setelah tombol ditekan, pilihan {type.toUpperCase()} dikunci. Level 1
        hanya menampilkan skor dan status kesiapan.
      </div>
      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-sky-500 text-white hover:bg-sky-400"
        data-testid="submit-level-one-diagnostic"
      >
        {submitting ? "Menghitung..." : "Hitung dan kunci hasil"}
      </Button>
    </form>
  );
}

function Choice({
  name,
  value,
  label,
  description,
  selected,
  onSelect,
}: {
  name: string;
  value: string;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`cursor-pointer rounded-xl border p-3 text-sm transition focus-within:ring-2 focus-within:ring-sky-300 ${
        selected
          ? "border-sky-300 bg-sky-300/15 text-white"
          : "border-white/10 bg-white/[.03] text-gray-300 hover:border-sky-300/50"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="flex items-center gap-2 font-semibold">
        {selected ? (
          <Check className="h-4 w-4 text-sky-300" />
        ) : (
          <span className="h-4 w-4 rounded-full border border-gray-500" />
        )}
        {label}
      </span>
      {description && (
        <span className="mt-1 block text-xs leading-relaxed text-gray-400">
          {description}
        </span>
      )}
    </label>
  );
}

function DiagnosticResult({ result }: { result: SbuSkkLevel1Result }) {
  return (
    <div
      className="mt-7 rounded-2xl border border-sky-300/40 bg-gray-950/45 p-6 text-center"
      data-testid="level-one-diagnostic-result"
    >
      <Sparkles className="mx-auto h-7 w-7 text-sky-300" />
      <p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-sky-300">
        Hasil Cek Kesiapan {result.type.toUpperCase()}
      </p>
      <p
        className="mt-4 text-7xl font-black tracking-[-.07em] text-white"
        data-testid="level-one-diagnostic-score"
      >
        {result.score}
        <span className="text-2xl font-semibold tracking-normal text-gray-400">
          /100
        </span>
      </p>
      <p
        className="mt-3 text-xl font-bold text-sky-200"
        data-testid="level-one-diagnostic-status"
      >
        {result.statusLabel}
      </p>
    </div>
  );
}