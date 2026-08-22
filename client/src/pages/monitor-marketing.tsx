import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, RefreshCw, MessageSquare, Copy, Check, CalendarDays,
  Megaphone, Heart, Handshake, Search, Clock, AlertCircle, Target,
  ShieldCheck, ExternalLink, BarChart3, RotateCcw,
  Loader2, ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DailyDoc {
  id: number | string;
  name: string;
  description: string;
  createdAt: string;
  content: string;
}
interface Stream {
  key: string;
  title: string;
  subtitle: string;
  group: "produksi" | "riset";
  slug: string;
  exists: boolean;
  canAccess: boolean;
  agentId: number | string | null;
  agentName: string | null;
  avatar: string | null;
  tagline: string | null;
  docs: DailyDoc[];
}
interface Overview {
  orchestrator: { id: number | string; name: string; tagline: string | null; avatar: string | null } | null;
  streams: Stream[];
}

type MarketDecision = "promote" | "monitor" | "product_gap";
type MarketConfidence = "low" | "medium" | "high";

interface MarketEvidence {
  id: string;
  kind: "market" | "internal";
  title: string;
  summary: string;
  publisher?: string;
  publishedAt?: string;
  url?: string;
}

interface RecommendedProduct {
  id: string;
  source: "registry" | "store";
  name: string;
  productType: string;
  category: string;
  description: string;
  targetUsers: string;
  officialUrl: string | null;
  price: number | null;
}

interface OpportunityReport {
  id: number;
  reportDate: string;
  generatedBy: "scheduler" | "manual" | "request";
  sourceCount: number;
  internalSignalWindowDays: number;
  payload: {
    generatedAt: string;
    periodDays: number;
    executiveSummary: string;
    methodologyNotice: string;
    marketSignals: Array<{ title: string; summary: string; evidenceIds: string[] }>;
    evidence: MarketEvidence[];
    recommendations: Array<{
      rank: number;
      decision: MarketDecision;
      need: string;
      segment: string;
      product: RecommendedProduct | null;
      rationale: string;
      confidence: MarketConfidence;
      evidenceIds: string[];
      suggestedMessage: string;
      suggestedChannels: string[];
      durationDays: number | null;
    }>;
    caveats: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface ResearchProduct {
  id: string;
  name: string;
  productType: string;
  category: string;
  description: string;
  targetUsers: string;
  officialUrl: string | null;
  price: number | null;
}

type ResearchRequestStatus = "queued" | "running" | "completed" | "failed";
interface ResearchRequest {
  id: number;
  requestedBy: string;
  topic: string;
  productId: string | null;
  productName: string | null;
  objective: string;
  targetSegment: string;
  marketScope: string;
  status: ResearchRequestStatus;
  attemptCount: number;
  retryOfId: number | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  report: OpportunityReport | null;
}

const DECISION_LABEL: Record<MarketDecision, string> = {
  promote: "Promosikan",
  monitor: "Pantau",
  product_gap: "Gap Produk",
};

const CONFIDENCE_LABEL: Record<MarketConfidence, string> = {
  high: "Keyakinan tinggi",
  medium: "Keyakinan sedang",
  low: "Keyakinan rendah",
};

const STREAM_ICON: Record<string, React.ReactNode> = {
  "materi-iklan": <Megaphone className="w-5 h-5" />,
  retensi: <Heart className="w-5 h-5" />,
  closing: <Handshake className="w-5 h-5" />,
  "riset-lokal": <Search className="w-5 h-5" />,
  "riset-global": <Search className="w-5 h-5" />,
  "riset-pasar": <Search className="w-5 h-5" />,
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function StreamCard({ stream }: { stream: Stream }) {
  const { toast } = useToast();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const doc = stream.docs[selectedIdx];

  const handleCopy = async () => {
    if (!doc) return;
    try {
      await navigator.clipboard.writeText(doc.content);
      setCopied(true);
      toast({ title: "Tersalin", description: "Isi materi disalin ke clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Gagal menyalin", variant: "destructive" });
    }
  };

  return (
    <Card data-testid={`card-stream-${stream.key}`}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {STREAM_ICON[stream.key] ?? <CalendarDays className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base" data-testid={`text-stream-title-${stream.key}`}>{stream.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{stream.subtitle}</p>
          </div>
          {stream.exists && stream.canAccess && stream.agentId != null && (
            <Link href={`/chat/${stream.agentId}`}>
              <Button variant="ghost" size="sm" data-testid={`button-chat-${stream.key}`}>
                <MessageSquare className="w-4 h-4 mr-1" /> Chat
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!stream.exists ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Agen ini belum dibuat.
          </p>
        ) : !stream.canAccess ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Anda tidak punya akses ke agen ini.
          </p>
        ) : stream.docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada hasil harian. Tim akan bekerja otomatis tiap pagi (06:30 WIB), atau tekan
            <span className="font-medium"> "Jalankan Sekarang"</span> di atas.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {stream.docs.slice(0, 7).map((d, i) => (
                <button
                  key={String(d.id)}
                  onClick={() => setSelectedIdx(i)}
                  data-testid={`button-date-${stream.key}-${i}`}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    i === selectedIdx
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {new Date(d.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </button>
              ))}
            </div>
            {doc && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5" data-testid={`text-docdate-${stream.key}`}>
                    <CalendarDays className="w-3.5 h-3.5" /> {formatDate(doc.createdAt)}
                  </p>
                  <Button variant="outline" size="sm" onClick={handleCopy} data-testid={`button-copy-${stream.key}`}>
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? "Tersalin" : "Salin"}
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted/30 p-4">
                  <pre className="whitespace-pre-wrap break-words text-sm font-sans leading-relaxed" data-testid={`text-content-${stream.key}`}>
                    {doc.content || "(kosong)"}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OpportunityReportCard({ report }: { report: OpportunityReport }) {
  const { toast } = useToast();
  const [copiedRank, setCopiedRank] = useState<number | null>(null);
  const evidenceById = new Map(report.payload.evidence.map((item) => [item.id, item]));

  const copyMessage = async (rank: number, message: string) => {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopiedRank(rank);
      toast({ title: "Pesan promosi tersalin", description: "Tinjau kembali sebelum dipublikasikan." });
      setTimeout(() => setCopiedRank(null), 2000);
    } catch {
      toast({ title: "Gagal menyalin", variant: "destructive" });
    }
  };

  return (
    <Card className="border-violet-500/30" data-testid="card-opportunity-report">
      <CardHeader className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg" data-testid="text-opportunity-title">
                Peta Kebutuhan & Rekomendasi Solusi
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(report.payload.generatedAt)} · {report.sourceCount} sumber pasar
                {report.generatedBy === "request"
                  ? " · riset publik terarah"
                  : ` · sinyal agregat ${report.internalSignalWindowDays} hari`}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit border-violet-500/40 text-violet-700 dark:text-violet-300">
            <ShieldCheck className="w-3 h-3 mr-1" /> Khusus Superadmin
          </Badge>
        </div>
        <p className="text-sm leading-relaxed" data-testid="text-opportunity-summary">
          {report.payload.executiveSummary}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {report.payload.marketSignals.length > 0 && (
          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-500" /> Sinyal Pasar Utama
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {report.payload.marketSignals.map((signal, index) => (
                <div key={`${signal.title}-${index}`} className="space-y-1">
                  <p className="text-sm font-medium">{signal.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{signal.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Rekomendasi untuk Ditinjau</h3>
          {report.payload.recommendations.map((recommendation) => {
            const citedEvidence = recommendation.evidenceIds
              .map((id) => evidenceById.get(id))
              .filter((item): item is MarketEvidence => Boolean(item));
            return (
              <div
                key={`${report.id}-${recommendation.rank}`}
                className="rounded-lg border p-4 space-y-3"
                data-testid={`card-recommendation-${recommendation.rank}`}
              >
                <div className="flex flex-wrap items-start gap-2 justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">#{recommendation.rank}</span>
                      <Badge
                        variant={recommendation.decision === "promote" ? "default" : "secondary"}
                        className={recommendation.decision === "product_gap" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : ""}
                      >
                        {DECISION_LABEL[recommendation.decision]}
                      </Badge>
                      <Badge variant="outline">{CONFIDENCE_LABEL[recommendation.confidence]}</Badge>
                    </div>
                    <p className="font-semibold mt-2">{recommendation.need}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Segmen: {recommendation.segment}</p>
                  </div>
                  {recommendation.product && (
                    <div className="sm:text-right">
                      <p className="text-sm font-semibold text-primary">{recommendation.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {recommendation.product.productType.replaceAll("_", " ")} · {recommendation.product.category}
                      </p>
                      {recommendation.product.officialUrl && (
                        <a
                          href={recommendation.product.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                          data-testid={`link-product-${recommendation.rank}`}
                        >
                          Buka tautan resmi <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{recommendation.rationale}</p>

                {citedEvidence.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {citedEvidence.map((evidence) => evidence.url ? (
                      <a
                        key={evidence.id}
                        href={evidence.url}
                        target="_blank"
                        rel="noreferrer"
                        title={evidence.summary}
                        className="inline-flex items-center gap-1 text-xs rounded-md border px-2 py-1 hover:border-primary/50"
                      >
                        {evidence.id} · {evidence.publisher || "Sumber pasar"} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span
                        key={evidence.id}
                        title={evidence.summary}
                        className="inline-flex items-center gap-1 text-xs rounded-md border px-2 py-1 text-muted-foreground"
                      >
                        {evidence.id} · Sinyal agregat
                      </span>
                    ))}
                  </div>
                )}

                {recommendation.suggestedMessage && (
                  <div className="rounded-md bg-muted/40 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold">Draf pesan promosi</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(recommendation.rank, recommendation.suggestedMessage)}
                        data-testid={`button-copy-recommendation-${recommendation.rank}`}
                      >
                        {copiedRank === recommendation.rank ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        {copiedRank === recommendation.rank ? "Tersalin" : "Salin"}
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{recommendation.suggestedMessage}</p>
                    <p className="text-xs text-muted-foreground">
                      Kanal: {recommendation.suggestedChannels.join(", ") || "Belum ditentukan"}
                      {recommendation.durationDays ? ` · Durasi saran: ${recommendation.durationDays} hari` : ""}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-xs leading-relaxed text-muted-foreground" data-testid="text-methodology-notice">
            <span className="font-semibold text-foreground">Batas interpretasi:</span>{" "}
            {report.payload.methodologyNotice}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const REQUEST_STATUS_LABEL: Record<ResearchRequestStatus, string> = {
  queued: "Menunggu antrean",
  running: "Sedang dianalisis",
  completed: "Selesai",
  failed: "Perlu ditinjau",
};

function RequestStatus({ status, requestId }: { status: ResearchRequestStatus; requestId: number }) {
  const tone = status === "completed"
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : status === "failed"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : status === "running"
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return (
    <Badge variant="outline" className={`gap-1.5 ${tone}`} data-testid={`request-status-${requestId}`}>
      {(status === "queued" || status === "running") && <Loader2 className="h-3 w-3 animate-spin" />}
      {REQUEST_STATUS_LABEL[status]}
    </Badge>
  );
}

function CustomResearchWorkflow() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [productId, setProductId] = useState("");
  const [objective, setObjective] = useState("");
  const [targetSegment, setTargetSegment] = useState("");
  const [marketScope, setMarketScope] = useState("Indonesia");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const { data: productData, isLoading: productsLoading, error: productsError } =
    useQuery<{ products: ResearchProduct[] }>({ queryKey: ["/api/marketing-team/research-products"] });
  const {
    data: requestData,
    isLoading: requestsLoading,
    error: requestsError,
  } = useQuery<{ requests: ResearchRequest[] }>({
    queryKey: ["/api/marketing-team/research-requests"],
    refetchInterval: (query) => {
      const requests = (query.state.data as { requests?: ResearchRequest[] } | undefined)?.requests ?? [];
      return requests.some((request) => request.status === "queued" || request.status === "running") ? 5000 : false;
    },
  });

  const createRequest = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/marketing-team/research-requests", {
        topic: topic.trim(),
        productId: productId || null,
        objective: objective.trim(),
        targetSegment: targetSegment.trim(),
        marketScope: marketScope.trim(),
      });
    },
    onSuccess: () => {
      toast({ title: "Permintaan riset masuk", description: "Tim akan mengolah bukti dan menyusun laporan privat." });
      setTopic("");
      setProductId("");
      setObjective("");
      setTargetSegment("");
      setMarketScope("Indonesia");
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-team/research-requests"] });
    },
    onError: (error: any) => toast({
      title: "Permintaan belum terkirim",
      description: error?.message || "Periksa koneksi lalu coba lagi.",
      variant: "destructive",
    }),
  });

  const retryRequest = useMutation({
    mutationFn: async (id: number) =>
      apiRequest("POST", `/api/marketing-team/research-requests/${id}/retry`),
    onSuccess: () => {
      toast({ title: "Percobaan baru dibuat", description: "Run sebelumnya tetap tersimpan sebagai jejak audit." });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-team/research-requests"] });
    },
    onError: (error: any) => toast({
      title: "Gagal membuat percobaan baru",
      description: error?.message || "Coba lagi beberapa saat.",
      variant: "destructive",
    }),
  });

  const requests = requestData?.requests ?? [];
  const selectedRequest = requests.find((request) => request.id === selectedRequestId);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (topic.trim().length < 3 || objective.trim().length < 10) {
      setFormError("Topik minimal 3 karakter dan tujuan riset minimal 10 karakter.");
      return;
    }
    setFormError("");
    createRequest.mutate();
  };

  return (
    <section className="space-y-4" data-testid="custom-research-workflow">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">Minta riset terarah</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Ajukan pertanyaan pasar dengan konteks yang cukup. Hasilnya tetap privat, dapat ditinjau, dan tidak pernah dipublikasikan otomatis.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Card className="border-primary/20 bg-card/80" data-testid="card-research-request-form">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Brief untuk analis</CardTitle>
            <p className="text-xs text-muted-foreground">Kolom bertanda wajib membantu kami menguji pertanyaan yang sama.</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit} data-testid="research-request-form">
              <div className="space-y-1.5">
                <Label htmlFor="research-topic">Topik riset <span className="text-destructive">*</span></Label>
                <Input id="research-topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Contoh: kebutuhan pelaporan stok toko kecil" data-testid="input-research-topic" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="research-product">Produk pembanding <span className="font-normal text-muted-foreground">(opsional)</span></Label>
                <select id="research-product" value={productId} onChange={(event) => setProductId(event.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" disabled={productsLoading} data-testid="select-research-product">
                  <option value="">{productsLoading ? "Memuat katalog resmi…" : "Tanpa produk — cari gap kebutuhan"}</option>
                  {(productData?.products ?? []).map((product) => <option key={product.id} value={product.id}>{product.name} · {product.category}</option>)}
                </select>
                {productsError && <p className="text-xs text-destructive">Katalog produk tidak dapat dimuat. Anda masih dapat mengajukan topik gap.</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="research-objective">Tujuan keputusan <span className="text-destructive">*</span></Label>
                <Textarea id="research-objective" value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Keputusan apa yang ingin didukung oleh bukti ini?" rows={3} data-testid="textarea-research-objective" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="research-segment">Segmen sasaran</Label>
                  <Input id="research-segment" value={targetSegment} onChange={(event) => setTargetSegment(event.target.value)} placeholder="Contoh: pemilik toko 1–3 cabang" data-testid="input-research-segment" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="research-scope">Cakupan pasar</Label>
                  <Input id="research-scope" value={marketScope} onChange={(event) => setMarketScope(event.target.value)} placeholder="Contoh: Indonesia, 12 bulan" data-testid="input-research-scope" />
                </div>
              </div>
              {formError && <p className="text-sm text-destructive" data-testid="research-form-error">{formError}</p>}
              <Button type="submit" className="w-full sm:w-auto" disabled={createRequest.isPending} data-testid="button-submit-research">
                {createRequest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                {createRequest.isPending ? "Mengirim brief…" : "Kirim permintaan riset"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden" data-testid="card-research-history">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Riwayat permintaan</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Pembaruan otomatis saat run masih berjalan.</p>
              </div>
              <Badge variant="secondary">{requests.length} run</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {requestsLoading ? (
              <div className="space-y-3 p-4"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
            ) : requestsError ? (
              <div className="p-6 text-sm text-muted-foreground" data-testid="research-history-error">Riwayat belum dapat dimuat. Muat ulang halaman untuk mencoba lagi.</div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center"><Search className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-2 text-sm font-medium">Belum ada permintaan custom</p><p className="mt-1 text-xs text-muted-foreground">Brief pertama Anda akan muncul di sini.</p></div>
            ) : (
              <div className="divide-y">
                {requests.map((request) => (
                  <div key={request.id} className="space-y-2 p-4 transition-colors hover:bg-muted/20" data-testid={`research-request-row-${request.id}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <button type="button" className="min-w-0 text-left" onClick={() => setSelectedRequestId(selectedRequestId === request.id ? null : request.id)} data-testid={`button-open-request-${request.id}`}>
                        <p className="line-clamp-2 text-sm font-semibold">{request.topic}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Run #{request.id} · {new Date(request.createdAt).toLocaleString("id-ID")} · percobaan {request.attemptCount}</p>
                      </button>
                      <RequestStatus status={request.status} requestId={request.id} />
                    </div>
                    {request.lastError && <p className="rounded-md border border-destructive/20 bg-destructive/5 p-2 text-xs text-destructive" data-testid={`research-request-error-${request.id}`}>{request.lastError}</p>}
                    <div className="flex flex-wrap items-center gap-2">
                      {request.status === "completed" && request.report && <Button type="button" variant="outline" size="sm" onClick={() => setSelectedRequestId(request.id)} data-testid={`button-custom-report-${request.id}`}>Buka laporan <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>}
                      {(request.status === "failed" || request.status === "completed") && <Button type="button" variant="ghost" size="sm" onClick={() => retryRequest.mutate(request.id)} disabled={retryRequest.isPending} data-testid={`button-retry-request-${request.id}`}><RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Coba lagi</Button>}
                    </div>
                    {selectedRequestId === request.id && request.report && (
                      <div className="pt-2" data-testid={`custom-report-${request.id}`}><OpportunityReportCard report={request.report} /></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default function MonitorMarketing() {
  const { toast } = useToast();
  const [selectedReportIdx, setSelectedReportIdx] = useState(0);
  const { data: adminMe, isLoading: adminLoading } = useQuery<{ isAdmin: boolean; isSuperAdmin: boolean; role: string }>({ queryKey: ["/api/admin/me"] });
  const isSuperAdminUser = adminMe?.isSuperAdmin === true;
  const { data, isLoading, error } = useQuery<Overview>({
    queryKey: ["/api/marketing-team/overview"],
    enabled: isSuperAdminUser,
  });
  const { data: reportData, isLoading: reportsLoading, error: reportsError } = useQuery<{ reports: OpportunityReport[] }>({
    queryKey: ["/api/marketing-team/opportunity-reports"],
    enabled: isSuperAdminUser,
  });

  const sweepMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/research/sweep");
      return res;
    },
    onSuccess: () => {
      toast({ title: "Tim marketing dijalankan", description: "Hasil baru sedang dibuat. Muat ulang sebentar lagi untuk melihatnya." });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-team/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-team/opportunity-reports"] });
      setSelectedReportIdx(0);
    },
    onError: (e: any) => {
      toast({ title: "Gagal menjalankan", description: e?.message || "Coba lagi.", variant: "destructive" });
    },
  });

  const streams = data?.streams ?? [];
  const produksi = streams.filter((s) => s.group === "produksi");
  const riset = streams.filter((s) => s.group === "riset");
  const reports = reportData?.reports ?? [];
  const selectedReport = reports[selectedReportIdx] ?? reports[0];

  const lastUpdated = streams
    .flatMap((s) => s.docs.map((d) => new Date(d.createdAt).getTime()))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a)[0];

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!isSuperAdminUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full" data-testid="card-access-denied">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-lg font-bold" data-testid="text-access-denied">Akses Terbatas</h1>
              <p className="text-sm text-muted-foreground mt-1">Halaman ini hanya dapat dibuka oleh Super Admin Gustafta.</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2" data-testid="button-back-dashboard">
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
               <h1 className="text-2xl font-bold" data-testid="text-page-title">Monitor Kebutuhan Pasar</h1>
               <p className="text-sm text-muted-foreground">Tinjau riset, rekomendasi solusi, dan bahan promosi dari Tim Marketing.</p>
            </div>
          </div>
          <Button
            onClick={() => sweepMutation.mutate()}
            disabled={sweepMutation.isPending}
            data-testid="button-run-now"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${sweepMutation.isPending ? "animate-spin" : ""}`} />
            {sweepMutation.isPending ? "Menjalankan…" : "Jalankan Sekarang"}
          </Button>
        </div>

        {/* Orchestrator + last updated */}
        {data?.orchestrator && (
          <Card data-testid="card-orchestrator">
            <CardContent className="flex flex-wrap items-center gap-4 py-4">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-xl shrink-0">
                {data.orchestrator.avatar || <Megaphone className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" data-testid="text-orchestrator-name">{data.orchestrator.name}</p>
                <p className="text-xs text-muted-foreground">{data.orchestrator.tagline || "Ketua tim yang mengoordinasi semua anggota marketing."}</p>
              </div>
              {lastUpdated && (
                <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-last-updated">
                  <Clock className="w-3 h-3" /> Terakhir: {formatDate(new Date(lastUpdated).toISOString())}
                </Badge>
              )}
              <Link href={`/chat/${data.orchestrator.id}`}>
                <Button variant="outline" size="sm" data-testid="button-chat-orchestrator">
                  <MessageSquare className="w-4 h-4 mr-1" /> Tanya Ketua Tim
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <CustomResearchWorkflow />

        {error && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Gagal memuat data. Coba muat ulang halaman.
            </CardContent>
          </Card>
        )}

        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Peta Kebutuhan & Rekomendasi
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Laporan privat untuk membantu keputusan promosi—bukan publikasi otomatis.</p>
            </div>
            {reports.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {reports.slice(0, 14).map((report, index) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReportIdx(index)}
                    data-testid={`button-report-date-${index}`}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                      (selectedReport?.id === report.id)
                        ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium"
                        : "border-border text-muted-foreground hover:border-violet-500/50"
                    }`}
                  >
                    {new Date(report.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    {" · "}
                    {new Date(report.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    {report.generatedBy === "manual" ? " manual" : ""}
                  </button>
                ))}
              </div>
            )}
          </div>

          {reportsLoading ? (
            <Card><CardContent className="py-6 space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-28 w-full" />
            </CardContent></Card>
          ) : reportsError ? (
            <Card><CardContent className="py-6 text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Gagal memuat arsip rekomendasi.
            </CardContent></Card>
          ) : selectedReport ? (
            <OpportunityReportCard report={selectedReport} />
          ) : (
            <Card data-testid="card-report-empty">
              <CardContent className="py-8 text-center space-y-2">
                <Target className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="font-medium">Belum ada laporan kebutuhan pasar</p>
                <p className="text-sm text-muted-foreground">
                  Tekan “Jalankan Sekarang” untuk membuat laporan pertama dari riset dan katalog resmi.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="py-6 space-y-3">
                <Skeleton className="h-6 w-2/3" /><Skeleton className="h-24 w-full" />
              </CardContent></Card>
            ))}
          </div>
        ) : (
          <>
            {produksi.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Hasil Kerja Harian</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {produksi.map((s) => <StreamCard key={s.key} stream={s} />)}
                </div>
              </section>
            )}
            {riset.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Riset & Intelijen Pasar</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {riset.map((s) => <StreamCard key={s.key} stream={s} />)}
                </div>
              </section>
            )}
          </>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Semua hasil di sini masih berupa <span className="font-medium">draf</span>. Keputusan akhir tetap di tangan Anda sebelum dipublikasikan (gerbang manusia).
        </p>
      </div>
    </div>
  );
}
