import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle, XCircle, Loader2, GraduationCap, Calendar, User, BookOpen } from "lucide-react";

interface CertificateData {
  studentName: string;
  course: {
    title: string;
    emoji: string;
    color: string;
    instructor: string;
    category: string;
  };
  issuedAt: string;
  certificateCode: string;
}

export default function LmsVerify() {
  const { code } = useParams<{ code: string }>();

  const { data, isLoading, isError } = useQuery<CertificateData>({
    queryKey: ["/api/lms/certificate", code],
    queryFn: () =>
      fetch(`/api/lms/certificate/${encodeURIComponent(code ?? "")}`)
        .then(r => {
          if (!r.ok) throw new Error("Tidak ditemukan");
          return r.json();
        }),
    retry: false,
    enabled: !!code,
  });

  const issuedDate = data?.issuedAt
    ? new Date(data.issuedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const accentColor = data?.course?.color || "#6366f1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-slate-800 hover:text-indigo-600 transition-colors">
            Gustafta Academy
          </Link>
          <Link href="/lms" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
            <GraduationCap className="w-4 h-4" />
            Learning Center
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Page title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Verifikasi Sertifikat</h1>
            <p className="text-slate-500 text-sm">
              Kode: <span className="font-mono font-semibold text-slate-700">{code}</span>
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <p className="text-slate-500">Memverifikasi sertifikat…</p>
            </div>
          )}

          {/* Not found / invalid */}
          {isError && !isLoading && (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="w-9 h-9 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">Sertifikat Tidak Valid</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Kode sertifikat <span className="font-mono font-semibold">{code}</span> tidak ditemukan
                  dalam database Gustafta Academy. Pastikan kode yang Anda masukkan sudah benar.
                </p>
              </div>
              <div className="w-full max-w-xs mt-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-700">
                Jika Anda yakin sertifikat ini valid, hubungi{" "}
                <a href="mailto:hello@gustafta.my.id" className="underline font-medium">
                  hello@gustafta.my.id
                </a>
              </div>
            </div>
          )}

          {/* Valid certificate */}
          {data && !isLoading && (
            <div className="bg-white rounded-2xl border-2 shadow-md overflow-hidden" style={{ borderColor: accentColor + "66" }}>
              {/* Top stripe */}
              <div className="h-2 w-full" style={{ backgroundColor: accentColor }} />

              <div className="p-8">
                {/* Valid badge */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                    style={{ backgroundColor: accentColor + "18", color: accentColor }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Sertifikat Valid &amp; Asli
                  </div>
                </div>

                {/* Issued to */}
                <div className="text-center mb-6">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Diberikan kepada</p>
                  <h2 className="text-3xl font-bold text-slate-800 mb-1">{data.studentName}</h2>
                  <p className="text-slate-500 text-sm">telah berhasil menyelesaikan kursus</p>
                </div>

                {/* Course info */}
                <div
                  className="rounded-xl p-5 mb-6 text-center"
                  style={{ backgroundColor: accentColor + "12" }}
                >
                  <div className="text-4xl mb-2">{data.course?.emoji || "🎓"}</div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: accentColor }}>
                    {data.course?.title}
                  </h3>
                  {data.course?.instructor && (
                    <p className="text-slate-500 text-sm">Instruktur: {data.course.instructor}</p>
                  )}
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <User className="w-3.5 h-3.5" />
                      Penerima
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">{data.studentName}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Tanggal Terbit
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">{issuedDate}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      Kursus
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">{data.course?.title}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Award className="w-3.5 h-3.5" />
                      Kode Sertifikat
                    </div>
                    <p className="font-mono font-semibold text-slate-800 text-xs break-all">{data.certificateCode || code}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: accentColor }}
                    >
                      G
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Gustafta Academy</p>
                      <p className="text-xs text-slate-400">gustafta.my.id/academy</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-right">
                    Diverifikasi otomatis oleh<br />sistem Gustafta Academy
                  </p>
                </div>
              </div>

              {/* Bottom stripe */}
              <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
            </div>
          )}

          {/* Back link */}
          <div className="text-center mt-8">
            <Link href="/lms" className="text-sm text-slate-400 hover:text-indigo-600 transition-colors">
            ← Kembali ke Learning Center
          </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white">
        © {new Date().getFullYear()} Gustafta Academy — Platform AI &amp; Sertifikasi Profesional
      </footer>
    </div>
  );
}
