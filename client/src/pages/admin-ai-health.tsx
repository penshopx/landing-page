import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Activity, Lock, ArrowRight, Loader2, CheckCircle2, XCircle, AlertCircle, Cpu } from "lucide-react";

type ProviderHealthEntry = {
  lastSuccess: string | null;
  lastError: string | null;
  lastErrorMsg: string | null;
  successCount: number;
  errorCount: number;
};

type AiHealthData = {
  timestamp: string;
  active: Record<string, boolean>;
  health: Record<string, ProviderHealthEntry>;
};

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5) return "baru saja";
  if (diff < 60) return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)}h lalu`;
}

function ProviderStatus({ name, active, health }: { name: string; active: boolean; health: ProviderHealthEntry }) {
  const hasErrors = health.errorCount > 0;
  const noCalls = health.successCount === 0 && health.errorCount === 0;
  const isHealthy = active && !noCalls && (!hasErrors || health.lastSuccess !== null &&
    health.lastError !== null &&
    new Date(health.lastSuccess) > new Date(health.lastError));

  return (
    <Card data-testid={`card-provider-${name}`}>
      <CardContent className="pt-5 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="font-bold text-gray-900 dark:text-white capitalize">{name}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Key configured? */}
            {active ? (
              <Badge className="bg-emerald-500 text-white text-xs" data-testid={`badge-key-${name}`}>Kunci ✓</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs" data-testid={`badge-key-${name}`}>Tanpa Kunci</Badge>
            )}
            {/* Runtime status */}
            {noCalls ? (
              <Badge variant="outline" className="text-xs text-gray-500" data-testid={`badge-status-${name}`}>Belum dipakai</Badge>
            ) : isHealthy ? (
              <Badge className="bg-emerald-500 text-white text-xs gap-1" data-testid={`badge-status-${name}`}>
                <CheckCircle2 className="h-3 w-3" /> OK
              </Badge>
            ) : hasErrors && health.lastSuccess === null ? (
              <Badge className="bg-red-500 text-white text-xs gap-1" data-testid={`badge-status-${name}`}>
                <XCircle className="h-3 w-3" /> Gagal
              </Badge>
            ) : (
              <Badge className="bg-amber-500 text-white text-xs gap-1" data-testid={`badge-status-${name}`}>
                <AlertCircle className="h-3 w-3" /> Peringatan
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCell label="Sukses" value={health.successCount} testid={`stat-success-${name}`} />
          <StatCell label="Error" value={health.errorCount} testid={`stat-error-${name}`} highlight={health.errorCount > 0} />
          <StatCell label="Sukses terakhir" value={relativeTime(health.lastSuccess)} testid={`stat-last-ok-${name}`} />
          <StatCell label="Error terakhir" value={relativeTime(health.lastError)} testid={`stat-last-err-${name}`} highlight={!!health.lastError} />
        </div>

        {/* Last error message */}
        {health.lastErrorMsg && (
          <div
            className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-400 font-mono break-words"
            data-testid={`text-last-err-msg-${name}`}
          >
            {health.lastErrorMsg}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCell({ label, value, testid, highlight }: { label: string; value: number | string; testid: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-3" data-testid={testid}>
      <div className={`text-lg font-black leading-none ${highlight ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}>{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}

export default function AdminAiHealthPage() {
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const prev = document.title;
    document.title = "Kesehatan AI Provider | Admin Gustafta";
    return () => { document.title = prev; };
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const { data, isLoading, isError, dataUpdatedAt } = useQuery<AiHealthData>({
    queryKey: ["/api/admin/ai-health"],
    enabled: isAdmin,
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <SharedHeader />
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <SharedHeader />
        <div className="max-w-md mx-auto text-center py-24 px-4" data-testid="gate-admin">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-5">
            <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Khusus Admin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Halaman ini hanya untuk admin Gustafta.</p>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2" data-testid="btn-back">Kembali <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
    );
  }

  const providers = data ? Object.keys(data.health) : ["openai", "deepseek", "qwen", "gemini"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background" data-testid="page-admin-ai-health">
      <SharedHeader />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Title */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Kesehatan AI Provider</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" data-testid="text-refresh-status">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Auto-refresh tiap 10 detik
            {dataUpdatedAt ? <span className="text-gray-400">· {new Date(dataUpdatedAt).toLocaleTimeString("id-ID")}</span> : null}
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-4">
          Pantau status setiap AI provider secara real-time — termasuk jumlah panggilan sukses, error, dan pesan error terakhir sejak server terakhir kali restart.
        </p>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sehat</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" /> Ada error, tapi sukses lebih baru</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> Semua panggilan gagal</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-300" /> Belum ada panggilan sejak restart</span>
        </div>

        {isLoading && !data ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
        ) : isError ? (
          <Card>
            <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400" data-testid="text-error">
              Gagal memuat data kesehatan AI. Coba muat ulang halaman.
            </CardContent>
          </Card>
        ) : data ? (
          <div className="space-y-4">
            {providers.map((name) => (
              <ProviderStatus
                key={name}
                name={name}
                active={data.active[name] ?? false}
                health={data.health[name] ?? { lastSuccess: null, lastError: null, lastErrorMsg: null, successCount: 0, errorCount: 0 }}
              />
            ))}
          </div>
        ) : null}

        <div className="flex gap-2 pt-2">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Kembali ke Admin
            </Button>
          </Link>
          <Link href="/admin/system-load">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Activity className="h-3.5 w-3.5" /> Beban Sistem
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
