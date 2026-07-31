import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { GraduationCap, Award, Download, ChevronLeft, Loader2, CalendarDays, ExternalLink, Linkedin, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Certificate {
  id: number;
  userId: string;
  courseId: number;
  certificateCode: string;
  issuedAt: string;
  course: {
    id: number;
    title: string;
    emoji: string;
    color: string;
    category: string;
  };
}

async function downloadCertificatePdf(params: {
  studentName: string;
  courseTitle: string;
  courseEmoji: string;
  issuedAt: string;
  certificateCode: string;
  color: string;
}) {
  const { default: jsPDF } = await import("jspdf");
  const { studentName, courseTitle, issuedAt, certificateCode, color } = params;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;
  const H = 210;

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, W, H, "F");

  const r = parseInt(color.slice(1, 3), 16) || 99;
  const g = parseInt(color.slice(3, 5), 16) || 102;
  const b = parseInt(color.slice(5, 7), 16) || 241;
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, W, 8, "F");
  doc.rect(0, H - 8, W, 8, "F");

  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, W - 20, H - 20, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(r, g, b);
  doc.text("GUSTAFTA ACADEMY", W / 2, 24, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("SERTIFIKAT PENYELESAIAN KURSUS", W / 2, 32, { align: "center" });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(50, 37, W - 50, 37);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("Diberikan kepada", W / 2, 50, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(30, 30, 30);
  doc.text(studentName, W / 2, 68, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("telah berhasil menyelesaikan kursus", W / 2, 80, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(r, g, b);
  const titleLines = doc.splitTextToSize(courseTitle, W - 80) as string[];
  doc.text(titleLines, W / 2, 95, { align: "center" });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(50, H - 45, W - 50, H - 45);

  const dateStr = new Date(issuedAt).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Diterbitkan: ${dateStr}`, 30, H - 35);
  doc.text(`Kode Sertifikat: ${certificateCode}`, 30, H - 28);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Verifikasi: gustafta.my.id/lms/verify/${certificateCode}`, W / 2, H - 28, { align: "center" });

  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.8);
  doc.circle(W - 45, H - 35, 12, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.setTextColor(r, g, b);
  doc.text("GUSTAFTA", W - 45, H - 37, { align: "center" });
  doc.text("ACADEMY", W - 45, H - 33, { align: "center" });

  doc.save(`Sertifikat-${courseTitle.replace(/\s+/g, "-")}.pdf`);
}

function CertificateCard({ cert }: { cert: Certificate }) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const issueDate = new Date(cert.issuedAt).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });

  async function handleDownload() {
    setDownloading(true);
    try {
      const certRes = await fetch(`/api/lms/certificate/${cert.certificateCode}`);
      if (!certRes.ok) throw new Error("Gagal memuat data sertifikat");
      const data = await certRes.json();
      await downloadCertificatePdf({
        studentName: data.studentName || "Peserta",
        courseTitle: cert.course?.title || "Kursus",
        courseEmoji: cert.course?.emoji || "🎓",
        issuedAt: cert.issuedAt,
        certificateCode: cert.certificateCode,
        color: cert.course?.color || "#6366f1",
      });
    } catch {
      toast({ title: "Gagal mengunduh sertifikat", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  const color = cert.course?.color || "#6366f1";

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
      data-testid={`card-certificate-${cert.id}`}
    >
      <div className="h-2 w-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{cert.course?.emoji || "🎓"}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-base leading-snug">
              {cert.course?.title || "Kursus"}
            </h3>
            <p className="text-xs text-slate-400 capitalize mt-0.5">{cert.course?.category || ""}</p>
          </div>
          <Award className="w-5 h-5 flex-shrink-0 text-amber-400" />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
          <span>Diterbitkan {issueDate}</span>
        </div>

        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-slate-400 mb-0.5">Kode Sertifikat</p>
          <p className="font-mono text-xs text-slate-700 break-all">{cert.certificateCode}</p>
        </div>

        <div className="flex gap-1.5">
          <a
            href={`/lms/verify/${cert.certificateCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
            data-testid={`link-verify-cert-${cert.id}`}
          >
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <ExternalLink className="w-3 h-3" />
              Verifikasi
            </Button>
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://gustafta.my.id/lms/verify/${cert.certificateCode}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`link-linkedin-share-${cert.id}`}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs text-[#0A66C2] border-[#0A66C2]/30 hover:bg-[#0A66C2]/5">
              <Linkedin className="w-3 h-3" />
              Bagikan ke LinkedIn
            </Button>
          </a>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs px-2.5"
            onClick={() => navigator.clipboard.writeText(`https://gustafta.my.id/lms/verify/${cert.certificateCode}`)}
            title="Salin link verifikasi"
            data-testid={`button-copy-verify-${cert.id}`}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>

        <Button
          onClick={handleDownload}
          disabled={downloading}
          size="sm"
          className="w-full gap-2"
          data-testid={`button-download-cert-${cert.id}`}
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {downloading ? "Membuat PDF…" : "Unduh Sertifikat (PDF)"}
        </Button>
      </div>
    </div>
  );
}

export default function LmsCertificatesPage() {
  const { data: certs, isLoading, error } = useQuery<Certificate[]>({
    queryKey: ["/api/lms/certificates"],
    queryFn: () => fetch("/api/lms/certificates").then(r => {
      if (r.status === 401) throw new Error("unauthenticated");
      return r.json();
    }),
    retry: false,
  });

  const isUnauthenticated = (error as Error)?.message === "unauthenticated";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/lms">
            <button className="flex items-center gap-1.5 text-indigo-200 hover:text-white transition-colors text-sm mb-4">
              <ChevronLeft className="w-4 h-4" />
              Kembali ke Katalog
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-white/15 p-3 rounded-xl backdrop-blur-sm">
              <Award className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Sertifikat Saya</h1>
              <p className="text-indigo-200 text-sm mt-0.5">
                Semua bukti penyelesaian kursus Anda di Gustafta Academy
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-56 animate-pulse border border-slate-200" />
            ))}
          </div>
        )}

        {isUnauthenticated && (
          <div className="text-center py-16" data-testid="certificates-unauthenticated">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-700 mb-1">Login untuk melihat sertifikat Anda</p>
            <p className="text-sm text-slate-400 mb-5">Sertifikat tersimpan di akun Anda.</p>
            <Link href="/login">
              <Button>Masuk / Daftar</Button>
            </Link>
          </div>
        )}

        {!isLoading && !isUnauthenticated && certs?.length === 0 && (
          <div className="text-center py-16" data-testid="certificates-empty">
            <Award className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-700 mb-1">Belum ada sertifikat</p>
            <p className="text-sm text-slate-400 mb-5">
              Selesaikan kursus untuk mendapatkan sertifikat penyelesaian.
            </p>
            <Link href="/lms">
              <Button variant="outline" className="gap-2">
                <BookOpenIcon className="w-4 h-4" />
                Jelajahi Kursus
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && !isUnauthenticated && certs && certs.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-slate-700">
                {certs.length} sertifikat diperoleh
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="certificates-grid">
              {certs.map(cert => (
                <CertificateCard key={cert.id} cert={cert} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}
