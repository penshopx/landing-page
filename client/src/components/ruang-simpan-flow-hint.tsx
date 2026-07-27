/**
 * RuangSimpanFlowHint
 * Tiga chip alur "Simpan → AI Baca → Jawaban Akurat" yang mengingatkan
 * pengguna untuk memulai dari Ruang Simpan.
 * variant="dark"  → latar gelap (hero berwarna)
 * variant="light" → latar terang (card/panel)
 */

import { Link } from "wouter";

interface Props {
  variant?: "dark" | "light";
  className?: string;
}

const steps = [
  { icon: "📁", label: "Dokumen & catatan\ntersimpan rapi" },
  { icon: "🧠", label: "AI membaca &\nmemahami konteks" },
  { icon: "💬", label: "Jawaban lebih\nterarah & akurat" },
];

export function RuangSimpanFlowHint({ variant = "dark", className = "" }: Props) {
  const isDark = variant === "dark";

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
        {steps.map((step, i) => (
          <div key={step.icon} className="flex items-center gap-1 sm:gap-2">
            <div
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 min-w-[90px] ${
                isDark
                  ? "bg-white/10 backdrop-blur-sm"
                  : "bg-muted/60 border border-border"
              }`}
            >
              <span className="text-lg leading-none">{step.icon}</span>
              <span
                className={`text-[10px] text-center leading-tight whitespace-pre-line ${
                  isDark ? "text-blue-100" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={`text-sm hidden sm:block ${
                  isDark ? "text-blue-300/60" : "text-muted-foreground/50"
                }`}
              >
                →
              </span>
            )}
          </div>
        ))}
      </div>
      <Link
        href="/ruang-simpan"
        className={`text-[11px] font-medium underline underline-offset-2 transition-opacity hover:opacity-80 ${
          isDark ? "text-blue-200/70" : "text-muted-foreground"
        }`}
      >
        Mulai dari Ruang Simpan →
      </Link>
    </div>
  );
}
