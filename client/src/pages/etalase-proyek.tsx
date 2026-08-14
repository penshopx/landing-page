/**
 * Etalase Proyek — portfolio publik proyek yang dipajang dari Ruang Proyek.
 * Publik (tanpa login). Hanya menampilkan field yang diizinkan pemilik.
 */
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, MapPin, Loader2, CalendarDays } from "lucide-react";

type EtalaseItem = {
  name: string; location: string | null; description: string | null;
  status: string; year: string | null; contractValue: number | null; client: string | null;
};

const rupiah = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
const STATUS_LABEL: Record<string, string> = { aktif: "Sedang Berjalan", selesai: "Selesai", tertunda: "Tertunda" };

export default function EtalaseProyekPage() {
  const [, params] = useRoute("/etalase/:userId");
  const userId = params?.userId ?? "";

  const { data: items = [], isLoading, isError } = useQuery<EtalaseItem[]>({
    queryKey: [`/api/etalase/${userId}`],
    enabled: !!userId,
  });

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center mb-8">
          <Award className="h-10 w-10 mx-auto mb-3 text-blue-600" />
          <h1 className="text-2xl font-bold" data-testid="text-etalase-title">Portfolio Proyek</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rekam jejak proyek yang dikelola melalui platform Gustafta.
          </p>
        </div>

        {isLoading ? (
          <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : isError ? (
          <Card className="text-center py-10"><CardContent>
            <p className="text-sm text-muted-foreground">Etalase tidak dapat dimuat. Periksa kembali tautannya.</p>
          </CardContent></Card>
        ) : items.length === 0 ? (
          <Card className="text-center py-10"><CardContent>
            <p className="font-medium mb-1">Belum ada proyek yang dipajang</p>
            <p className="text-sm text-muted-foreground">Pemilik etalase ini belum memajang proyek apa pun.</p>
          </CardContent></Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((p, i) => (
              <Card key={`${p.name}-${i}`} data-testid={`card-etalase-${i}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <Badge variant="secondary">{STATUS_LABEL[p.status] ?? p.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1.5">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {p.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.location}</span>}
                    {p.year && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {p.year}</span>}
                  </div>
                  {p.client && <p className="text-xs">Pemberi kerja: <span className="text-foreground">{p.client}</span></p>}
                  {p.contractValue != null && <p className="text-xs">Nilai kontrak: <span className="font-medium text-foreground">{rupiah(p.contractValue)}</span></p>}
                  {p.description && <p className="text-xs line-clamp-4">{p.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
