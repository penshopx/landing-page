import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, FileText } from "lucide-react";

type MiniEbookAsset = {
  slug: string;
  title: string;
  pages: number;
  sizeBytes: number;
};

type Access = {
  valid: boolean;
  name: string;
  expiresAt: string;
  asset: MiniEbookAsset | null;
  downloadUrl: string;
};

function formatFileSize(sizeBytes?: number) {
  if (!sizeBytes || sizeBytes < 0) return null;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MiniEbookSbuSkkAccess() {
  const { token } = useParams<{ token: string }>();
  const { data, error, isLoading } = useQuery<Access>({
    queryKey: ["sbu-lead-access", token],
    queryFn: async () => {
      const response = await fetch(`/api/sbu-skk/lead/access/${token}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.valid) {
        throw new Error(payload?.error || "Tautan akses tidak valid atau sudah kedaluwarsa.");
      }

      return payload;
    },
    enabled: !!token,
  });

  const assetDetails = data?.asset
    ? [data.asset.pages ? `${data.asset.pages} halaman` : null, formatFileSize(data.asset.sizeBytes)]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="min-h-[100dvh] bg-[#f7f3ea] text-[#1c2b2d]">
      <SharedHeader />
      <main className="mx-auto max-w-2xl px-5 py-20">
        <div className="rounded-2xl border border-[#d8d5cb] bg-[#fbfaf6] p-7 text-center shadow-sm md:p-12">
          {isLoading ? (
            <>
              <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-[#d8d5cb]" />
              <p className="mt-4">Menyiapkan akses...</p>
            </>
          ) : error ? (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
              <h1 className="mt-5 font-display text-3xl font-bold">Akses tidak tersedia</h1>
              <p className="mt-3 text-[#637276]">{error.message}</p>
            </>
          ) : (
            <>
              <FileText className="mx-auto h-12 w-12 text-[#17727a]" />
              <h1 className="mt-5 font-display text-3xl font-bold">Mini Ebook siap dibaca</h1>
              <p className="mt-3 text-[#637276]">
                {data?.asset?.title || "Materi Mini Ebook"}
              </p>
              {assetDetails && <p className="mt-1 text-sm text-[#637276]">{assetDetails}</p>}
              {data?.downloadUrl && (
                <Button asChild className="mt-7 h-12 bg-[#e8a83e] font-bold text-[#1c2b2d]">
                  <a href={data.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Unduh Mini Ebook
                  </a>
                </Button>
              )}
              <p className="mt-6 text-sm text-[#637276]">
                Setelah membaca ringkasan, Anda dapat melanjutkan ke{" "}
                <a className="font-bold text-[#17727a]" href="/ebook-sbu-skk">
                  panduan lengkap
                </a>.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}