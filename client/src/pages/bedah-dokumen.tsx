import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SharedHeader } from "@/components/shared-header";
import { PremiumPageGuard } from "@/components/premium-page-guard";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileText, MessageSquare, CheckSquare, Trash2,
  AlertTriangle, Clock, CheckCircle2, XCircle, ChevronRight,
  Send, Loader2, FileSearch, Lock, Sparkles, RotateCcw,
  ListChecks, BookOpen, ShieldAlert, Lightbulb,
} from "lucide-react";

interface DocAnalysis {
  id: number;
  original_name: string;
  doc_type: string;
  status: "pending" | "analyzing" | "done" | "error";
  summary: string | null;
  checklist: ChecklistCategory[] | null;
  chat_history: ChatMessage[] | null;
  file_size: number;
  error_msg: string | null;
  created_at: string;
}

interface ChecklistCategory {
  kategori: string;
  items: { item: string; status: "ada" | "tidak_ada" | "perlu_dicek"; catatan?: string }[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const DOC_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  tender: { label: "Dokumen Tender", color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: "📋" },
  skk_sbu: { label: "SKK / SBU", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: "🏗️" },
  kontrak: { label: "Kontrak", color: "bg-purple-500/10 text-purple-600 border-purple-500/30", icon: "📜" },
  lainnya: { label: "Dokumen Lainnya", color: "bg-gray-500/10 text-gray-600 border-gray-500/30", icon: "📄" },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Chat Component ────────────────────────────────────────────────────────────
function DocChat({ doc, isPremium }: { doc: DocAnalysis; isPremium: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>(doc.chat_history ?? []);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    if (!isPremium) {
      toast({ title: "Fitur Premium", description: "Chat dokumen tersedia di paket Starter ke atas.", variant: "destructive" });
      return;
    }
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);

    let assistantMsg = "";
    setMessages(prev => [...prev, { role: "assistant", content: "…" }]);

    try {
      const resp = await fetch(`/api/bedah-dokumen/${doc.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: userMsg }),
      });

      if (!resp.body) throw new Error("No stream");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              assistantMsg += data.chunk;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantMsg };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "Maaf, terjadi kesalahan. Coba lagi." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20 rounded-xl border border-border/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3 py-8">
            <MessageSquare className="h-10 w-10 opacity-30" />
            <div>
              <p className="font-medium">Tanya tentang isi dokumen ini</p>
              <p className="text-sm mt-1">Contoh: "Apa persyaratan SBU yang dibutuhkan?" atau "Jelaskan pasal tentang denda keterlambatan."</p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-background border border-border/60 rounded-bl-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!isPremium && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Chat dokumen tersedia di paket Starter ke atas.
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          placeholder={isPremium ? "Tanya tentang dokumen ini…" : "Upgrade untuk chat dokumen"}
          value={input}
          disabled={!isPremium || streaming}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
        />
        <Button size="icon" onClick={sendMessage} disabled={!isPremium || streaming || !input.trim()} className="rounded-xl shrink-0">
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// ── Checklist Component ───────────────────────────────────────────────────────
function DocChecklist({ doc, isPremium }: { doc: DocAnalysis; isPremium: boolean }) {
  const checklist: ChecklistCategory[] = Array.isArray(doc.checklist) ? doc.checklist : [];

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <p className="font-semibold">Checklist Kelengkapan — Paket Starter</p>
          <p className="text-sm text-muted-foreground mt-1">Upgrade untuk mendapatkan checklist otomatis dari setiap dokumen.</p>
        </div>
        <a href="/onboarding">
          <Button size="sm" className="gap-2"><Sparkles className="h-3.5 w-3.5" />Upgrade Sekarang</Button>
        </a>
      </div>
    );
  }

  if (!checklist.length) {
    return <p className="text-center text-muted-foreground py-8 text-sm">Checklist belum tersedia untuk dokumen ini.</p>;
  }

  // Parse metadata (key_points, risiko, rekomendasi) stored in error_msg field
  let meta: { key_points?: string[]; risiko?: string[]; rekomendasi?: string[] } = {};
  try { meta = doc.error_msg ? JSON.parse(doc.error_msg) : {}; } catch {}

  const statusConfig = {
    ada: { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />, badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Ada" },
    tidak_ada: { icon: <XCircle className="h-4 w-4 text-red-500 shrink-0" />, badge: "bg-red-500/10 text-red-600 border-red-500/20", label: "Tidak Ada" },
    perlu_dicek: { icon: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />, badge: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "Perlu Dicek" },
  };

  return (
    <div className="space-y-6">
      {checklist.map((cat, ci) => (
        <div key={ci} className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />{cat.kategori}
          </h3>
          <div className="space-y-1.5">
            {cat.items?.map((item, ii) => {
              const cfg = statusConfig[item.status] ?? statusConfig.perlu_dicek;
              return (
                <div key={ii} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-background">
                  {cfg.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{item.item}</p>
                    {item.catatan && <p className="text-xs text-muted-foreground mt-0.5">{item.catatan}</p>}
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${cfg.badge}`}>{cfg.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {meta.risiko && meta.risiko.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />Catatan Risiko
          </h3>
          <ul className="space-y-1.5">
            {meta.risiko.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />{r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {meta.rekomendasi && meta.rekomendasi.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />Rekomendasi Tindak Lanjut
          </h3>
          <ul className="space-y-1.5">
            {meta.rekomendasi.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <ChevronRight className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />{r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Summary Component ─────────────────────────────────────────────────────────
function DocSummary({ doc }: { doc: DocAnalysis }) {
  let meta: { key_points?: string[] } = {};
  try { meta = doc.error_msg ? JSON.parse(doc.error_msg) : {}; } catch {}

  return (
    <div className="space-y-5">
      {doc.summary ? (
        <>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{doc.summary}</div>
          </div>
          {meta.key_points && meta.key_points.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />Poin-Poin Kunci
              </h3>
              <ul className="space-y-1.5">
                {meta.key_points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Ringkasan belum tersedia.</p>
      )}
    </div>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onUploaded, isFree, docCount }: {
  onUploaded: (id: number) => void;
  isFree: boolean;
  docCount: number;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFile = async (file: File) => {
    if (isFree && docCount >= 1) {
      toast({ title: "Batas Gratis", description: "Hapus dokumen lama atau upgrade ke Starter untuk upload lebih.", variant: "destructive" });
      return;
    }
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".pdf") && !ext.endsWith(".txt")) {
      toast({ title: "Format tidak didukung", description: "Gunakan file PDF atau TXT.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch("/api/bedah-dokumen/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Upload gagal");
      queryClient.invalidateQueries({ queryKey: ["/api/bedah-dokumen/my"] });
      onUploaded(data.id);
      toast({ title: "Dokumen diunggah", description: "Analisis sedang diproses…" });
    } catch (err: any) {
      toast({ title: "Gagal upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [docCount, isFree]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
      } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={onInputChange} />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium">Mengunggah & menganalisis…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Seret file ke sini atau klik untuk pilih</p>
            <p className="text-sm text-muted-foreground mt-1">PDF atau TXT • Maks. 50 MB</p>
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground flex-wrap justify-center">
            {["📋 Dokumen Tender", "🏗️ SKK/SBU", "📜 Kontrak"].map(t => (
              <span key={t} className="bg-muted/60 rounded-full px-2.5 py-1 border border-border/50">{t}</span>
            ))}
          </div>
          {isFree && docCount >= 1 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              <Lock className="h-3 w-3" />Hapus dokumen lama atau upgrade untuk upload lebih
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function BedahDokumenContent() {
  const { hasFeature } = useFeatureAccess();
  const isPremium = hasFeature("ai_tools");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: docs = [], isLoading } = useQuery<DocAnalysis[]>({
    queryKey: ["/api/bedah-dokumen/my"],
    queryFn: async () => {
      const r = await fetch("/api/bedah-dokumen/my", { credentials: "include" });
      if (!r.ok) throw new Error("Gagal memuat daftar dokumen");
      return r.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data as DocAnalysis[] | undefined;
      return data?.some(d => d.status === "analyzing") ? 3000 : false;
    },
  });

  const { data: selectedDoc } = useQuery<DocAnalysis>({
    queryKey: ["/api/bedah-dokumen", selectedId],
    queryFn: async () => {
      const r = await fetch(`/api/bedah-dokumen/${selectedId}`, { credentials: "include" });
      if (!r.ok) throw new Error("Tidak ditemukan");
      return r.json();
    },
    enabled: !!selectedId,
    refetchInterval: (query) => {
      const data = query.state.data as DocAnalysis | undefined;
      return data?.status === "analyzing" ? 2000 : false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/bedah-dokumen/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bedah-dokumen/my"] });
      setSelectedId(null);
      toast({ title: "Dokumen dihapus" });
    },
  });

  // Auto-select first doc
  useEffect(() => {
    if (!selectedId && docs.length > 0) setSelectedId(docs[0].id);
  }, [docs]);

  const isFree = !isPremium;
  const docCount = docs.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileSearch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Bedah Dokumen</h1>
            <p className="text-sm text-muted-foreground">Upload dokumen konstruksi — AI analisis otomatis dalam detik</p>
          </div>
          {isFree && (
            <Badge variant="outline" className="ml-auto text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
              <Lock className="h-3 w-3 mr-1" />Gratis: 1 dok, ringkasan saja
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload + List */}
        <div className="lg:col-span-1 space-y-4">
          <UploadZone
            onUploaded={(id) => { setSelectedId(id); }}
            isFree={isFree}
            docCount={docCount}
          />

          {isLoading ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Memuat…</div>
          ) : docs.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Belum ada dokumen diunggah
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Dokumen Saya</p>
              {docs.map(doc => {
                const typeInfo = DOC_TYPE_LABELS[doc.doc_type] ?? DOC_TYPE_LABELS.lainnya;
                const isSelected = selectedId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedId(doc.id)}
                    className={`rounded-xl border p-3 cursor-pointer transition-all ${
                      isSelected ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl shrink-0 mt-0.5">{typeInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.original_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {doc.status === "analyzing" && (
                            <span className="flex items-center gap-1 text-xs text-blue-500">
                              <Loader2 className="h-3 w-3 animate-spin" />Menganalisis…
                            </span>
                          )}
                          {doc.status === "done" && (
                            <span className="flex items-center gap-1 text-xs text-emerald-500">
                              <CheckCircle2 className="h-3 w-3" />Selesai
                            </span>
                          )}
                          {doc.status === "error" && (
                            <span className="flex items-center gap-1 text-xs text-red-500">
                              <XCircle className="h-3 w-3" />Error
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteMutation.mutate(doc.id); }}
                        className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detail */}
        <div className="lg:col-span-2">
          {!selectedDoc ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-muted-foreground gap-4 border-2 border-dashed border-border/40 rounded-2xl">
              <FileSearch className="h-12 w-12 opacity-20" />
              <div>
                <p className="font-medium">Pilih atau upload dokumen</p>
                <p className="text-sm mt-1">Hasil analisis akan tampil di sini</p>
              </div>
            </div>
          ) : selectedDoc.status === "analyzing" ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 border border-border/50 rounded-2xl bg-muted/20">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold">AI sedang menganalisis dokumen…</p>
                <p className="text-sm text-muted-foreground mt-1">Biasanya selesai dalam 10–30 detik</p>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                {["Membaca isi", "Identifikasi jenis", "Buat ringkasan", "Susun checklist"].map((s, i) => (
                  <span key={i} className="flex items-center gap-1 bg-background border border-border/50 rounded-full px-2.5 py-1">
                    <Clock className="h-3 w-3" />{s}
                  </span>
                ))}
              </div>
            </div>
          ) : selectedDoc.status === "error" ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 border border-red-500/20 rounded-2xl bg-red-500/5">
              <XCircle className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <p className="font-semibold">Analisis gagal</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedDoc.error_msg || "Terjadi kesalahan saat menganalisis."}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/bedah-dokumen", selectedId] })}>
                <RotateCcw className="h-3.5 w-3.5" />Coba lagi
              </Button>
            </div>
          ) : (
            <div className="border border-border/50 rounded-2xl overflow-hidden bg-background">
              {/* Doc header */}
              <div className="px-5 py-4 border-b border-border/50 flex items-start gap-3">
                <div className="text-2xl">{DOC_TYPE_LABELS[selectedDoc.doc_type]?.icon ?? "📄"}</div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold truncate">{selectedDoc.original_name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${DOC_TYPE_LABELS[selectedDoc.doc_type]?.color}`}>
                      {DOC_TYPE_LABELS[selectedDoc.doc_type]?.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatFileSize(selectedDoc.file_size)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(selectedDoc.created_at)}</span>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              </div>

              {/* Tabs */}
              <div className="p-5">
                <Tabs defaultValue="ringkasan">
                  <TabsList className="mb-5 w-full sm:w-auto">
                    <TabsTrigger value="ringkasan" className="gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />Ringkasan
                    </TabsTrigger>
                    <TabsTrigger value="checklist" className="gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5" />Checklist
                      {!isPremium && <Lock className="h-3 w-3 text-amber-500" />}
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />Chat
                      {!isPremium && <Lock className="h-3 w-3 text-amber-500" />}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ringkasan">
                    <DocSummary doc={selectedDoc} />
                  </TabsContent>
                  <TabsContent value="checklist">
                    <DocChecklist doc={selectedDoc} isPremium={isPremium} />
                  </TabsContent>
                  <TabsContent value="chat">
                    <DocChat doc={selectedDoc} isPremium={isPremium} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BedahDokumenPage() {
  return (
    <PremiumPageGuard
      feature="chatbot"
      requiredPlan="free"
      title="Bedah Dokumen Konstruksi"
      description="Upload dokumen tender, SKK/SBU, atau kontrak — AI analisis otomatis dalam detik."
      highlights={[
        "Ringkasan eksekutif otomatis dari dokumen apapun",
        "Checklist kelengkapan & deteksi poin kritis",
        "Chat tanya-jawab langsung tentang isi dokumen",
        "Mendukung PDF dokumen tender, kontrak, & SKK/SBU",
      ]}
      icon={<FileSearch className="h-10 w-10 text-primary" />}
    >
      <div className="min-h-screen bg-background">
        <SharedHeader />
        <BedahDokumenContent />
      </div>
    </PremiumPageGuard>
  );
}
