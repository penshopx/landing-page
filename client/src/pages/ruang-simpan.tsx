import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  HardDrive, Upload, Search, FolderOpen, File, FileText, Image,
  FileSpreadsheet, Loader2, Trash2, Download, Pencil, Plus, LogIn,
  Sparkles, CheckCircle2, Clock, AlertCircle, X, Shield, Wrench,
  Calculator, Award, BarChart3, Folder, ChevronRight, RefreshCw,
  Brain, Eye, Link2, Info, Check, ArrowRight, Zap, Lock,
  DatabaseZap, ScanSearch, BrainCircuit, ClipboardList, Star,
  KeyRound, History, UserCheck, CalendarClock, UserX, ChevronDown, ChevronUp,
  Activity, Handshake, Building2, CheckCheck, XCircle, ToggleLeft, ToggleRight,
  Bot, Wand2, MessageSquare, ExternalLink,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { RUANG_SIMPAN_PLANS } from "@/data/pricing";
import { useContactNumbers } from "@/lib/contact";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RSFolder { id: string; name: string; color: string; icon: string; is_default: boolean; file_count: number; folder_bytes: number; sort_order: number; }
interface RSFile {
  id: string; original_name: string; mime_type: string; size_bytes: number;
  description?: string; tags?: string[]; kb_status: string; kb_chunk_count?: number;
  folder_id?: string; folder_name?: string; folder_color?: string;
  kelola_doc_id?: string; created_at: string; snippet?: string;
  doc_status?: "draft" | "aktif" | "kadaluarsa" | "arsip";
  allow_biro_jasa?: boolean;
}
interface RSAccessRequest {
  id: string; requester_name: string; requester_email: string;
  company_name: string; purpose: string; requested_permissions: string[];
  status: "pending" | "approved" | "rejected";
  reviewed_at?: string; reviewer_note?: string; grant_id?: string; created_at: string;
}
interface RSOverview {
  folders: RSFolder[];
  usage: { used: number; quota: number; total_files: number; ai_ready: number };
  recent_files: RSFile[];
  stats: { pending: number; failed: number };
}
interface RSAssistant {
  id: number; name: string; slug: string; description: string;
  isActive: boolean; isPublic: boolean; createdAt: string;
  chatUrl: string; configUrl: string;
}
interface RSGrant {
  id: string; grantee_name: string; grantee_email?: string;
  permissions: string[]; purpose: string;
  expires_at?: string; is_active: boolean; revoked_at?: string;
  revoked_reason?: string; created_at: string;
}
interface RSAccessLogEntry {
  id: string; actor_name: string; action: string;
  purpose?: string; meta: any; created_at: string;
}
interface RSPassport {
  file: { id: string; original_name: string; doc_status: string; created_at: string };
  access_log: RSAccessLogEntry[];
  grants: RSGrant[];
  access_requests: RSAccessRequest[];
  stats: { total_downloads: number; active_grants: number; pending_requests: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const FOLDER_ICONS: Record<string, any> = {
  shield: Shield, wrench: Wrench, calculator: Calculator, award: Award,
  "bar-chart": BarChart3, "folder-open": FolderOpen, folder: Folder,
};
const FOLDER_COLORS: Record<string, string> = {
  blue:   "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  slate:  "text-slate-600 bg-slate-100 dark:bg-slate-800/40",
  orange: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  purple: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  red:    "text-red-600 bg-red-100 dark:bg-red-900/30",
  teal:   "text-teal-600 bg-teal-100 dark:bg-teal-900/30",
  gray:   "text-gray-500 bg-gray-100 dark:bg-gray-800/40",
  green:  "text-green-600 bg-green-100 dark:bg-green-900/30",
  pink:   "text-pink-600 bg-pink-100 dark:bg-pink-900/30",
};

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024*1024) return `${(b/1024).toFixed(0)} KB`;
  return `${(b/1024/1024).toFixed(1)} MB`;
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });
}
function mimeIcon(mime: string) {
  if (mime.startsWith("image/"))        return <Image className="h-5 w-5 text-emerald-500" />;
  if (mime === "application/pdf")       return <FileText className="h-5 w-5 text-red-500" />;
  if (mime.includes("spreadsheet") || mime.includes("excel")) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  if (mime.includes("word") || mime.includes("document"))     return <FileText className="h-5 w-5 text-blue-500" />;
  return <File className="h-5 w-5 text-gray-400" />;
}
function mimeLabel(mime: string): string {
  if (mime.startsWith("image/"))        return mime.split("/")[1].toUpperCase();
  if (mime === "application/pdf")       return "PDF";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "XLSX";
  if (mime.includes("word") || mime.includes("document"))     return "DOCX";
  if (mime.startsWith("text/"))         return "TXT";
  return "FILE";
}
function kbBadge(status: string, count?: number) {
  switch (status) {
    case "ready":      return <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1"><Sparkles className="h-2.5 w-2.5" /> AI Siap{count ? ` ·${count}` : ""}</Badge>;
    case "processing": return <Badge className="bg-blue-100 text-blue-600 text-[10px] gap-1 animate-pulse"><Loader2 className="h-2.5 w-2.5 animate-spin" /> Memproses</Badge>;
    case "pending":    return <Badge className="bg-gray-100 text-gray-500 text-[10px] gap-1"><Clock className="h-2.5 w-2.5" /> Antrian</Badge>;
    case "failed":     return <Badge className="bg-red-100 text-red-600 text-[10px] gap-1"><AlertCircle className="h-2.5 w-2.5" /> Gagal</Badge>;
    case "skipped":    return <Badge className="bg-gray-100 text-gray-400 text-[10px]">Tidak Teks</Badge>;
    default:           return null;
  }
}

const DOC_STATUS_CFG = {
  draft:      { label: "Draft",      cls: "bg-amber-100 text-amber-700 border-amber-200", icon: Pencil },
  aktif:      { label: "Aktif",      cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  kadaluarsa: { label: "Kadaluarsa", cls: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
  arsip:      { label: "Arsip",      cls: "bg-gray-100 text-gray-500 border-gray-200", icon: FolderOpen },
} as const;

function docStatusBadge(status?: string) {
  const cfg = DOC_STATUS_CFG[(status || "aktif") as keyof typeof DOC_STATUS_CFG] || DOC_STATUS_CFG.aktif;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${cfg.cls}`}>
      <Icon className="h-2.5 w-2.5" />{cfg.label}
    </span>
  );
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    download: "Download",
    view: "Lihat",
    grant_access: "Beri Kuasa",
    revoke_access: "Cabut Kuasa",
    status_change: "Ubah Status",
    upload: "Upload",
    biro_jasa_toggle: "Toggle Biro Jasa",
    access_requested: "Permintaan Masuk",
    request_rejected: "Permintaan Ditolak",
  };
  return map[action] || action;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const ONBOARDING_KEY = "rs-onboarding-v1-dismissed";

export default function RuangSimpanPage() {
  const contact = useContactNumbers();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importingUrl, setImportingUrl] = useState(false);
  const [showImportUrl, setShowImportUrl] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importDesc, setImportDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<RSFile | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardFolderId, setWizardFolderId] = useState<string>("all");
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() => {
    try { return !!localStorage.getItem(ONBOARDING_KEY); } catch { return false; }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dismissOnboarding = () => {
    try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
    setOnboardingDismissed(true);
  };

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery<RSOverview>({
    queryKey: ["/api/ruang-simpan/overview"],
    enabled: !!user,
    refetchInterval: 8000, // Poll for kb_status updates
  });

  const { data: files = [], isLoading: filesLoading, refetch: refetchFiles } = useQuery<RSFile[]>({
    queryKey: ["/api/ruang-simpan/files", activeFolder],
    queryFn: () => apiRequest("GET", `/api/ruang-simpan/files${activeFolder !== "all" ? `?folder_id=${activeFolder}` : ""}`),
    enabled: !!user && !searchQuery,
    refetchInterval: 8000,
  });

  const { data: searchResults, isLoading: searching } = useQuery<{ results: RSFile[]; query: string }>({
    queryKey: ["/api/ruang-simpan/search", searchQuery],
    queryFn: () => apiRequest("GET", `/api/ruang-simpan/search?q=${encodeURIComponent(searchQuery)}`),
    enabled: !!user && searchQuery.length >= 2,
  });

  const { data: myAssistants = [], refetch: refetchAssistants } = useQuery<RSAssistant[]>({
    queryKey: ["/api/ruang-simpan/my-assistants"],
    enabled: !!user,
  });

  // ── Upload handler ────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const file = fileList[0];
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (activeFolder !== "all") fd.append("folder_id", activeFolder);

      const res = await fetch("/api/ruang-simpan/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        if (json.quota_exceeded) {
          toast({ title: "Kuota storage penuh", description: json.error, variant: "destructive" });
        } else {
          toast({ title: "Upload gagal", description: json.error || "Coba lagi", variant: "destructive" });
        }
        return;
      }
      toast({ title: `${file.name} berhasil diunggah`, description: "AI sedang memproses dokumen…" });
      qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/files"] });
      qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/overview"] });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [activeFolder, toast, qc]);

  // ── Import dari URL handler ───────────────────────────────────────────────
  const handleImportFromUrl = useCallback(async () => {
    if (!importUrl.trim()) return;
    setImportingUrl(true);
    try {
      const res = await fetch("/api/ruang-simpan/import-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: importUrl.trim(),
          folder_id: activeFolder !== "all" ? activeFolder : undefined,
          description: importDesc.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Import gagal", description: json.error || "Coba lagi", variant: "destructive" });
        return;
      }
      toast({ title: "Dokumen berhasil diimpor", description: "AI sedang memproses isi dokumen…" });
      setShowImportUrl(false);
      setImportUrl("");
      setImportDesc("");
      qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/files"] });
      qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/overview"] });
    } finally {
      setImportingUrl(false);
    }
  }, [importUrl, importDesc, activeFolder, toast, qc]);

  const deleteFile = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/ruang-simpan/files/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/files"] });
      qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/overview"] });
      setSelectedFile(null);
      toast({ title: "File dihapus" });
    },
    onError: () => toast({ title: "Gagal menghapus file", variant: "destructive" }),
  });

  // ── Drag & drop ─────────────────────────────────────────────────────────
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const displayFiles = searchQuery.length >= 2 ? (searchResults?.results || []) : files;
  const usage = overview?.usage;
  const usagePct = usage ? Math.min(100, Math.round((usage.used / usage.quota) * 100)) : 0;

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return <RuangSimpanLandingPage />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <SharedHeader />

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-7">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <HardDrive className="h-4 w-4 text-indigo-400" />
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Ruang Simpan</span>
              <span className="text-white/20 text-xs">·</span>
              <span className="text-xs text-white/50 italic">Memori Bisnis</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold">Dokumen Tersimpan. Pengetahuan Hidup.</h1>
            <p className="text-indigo-200 text-xs mt-1 max-w-md">
              Google Drive menyimpan file. Gustafta memahami isinya — lalu menjadikannya pengetahuan yang bisa dicari, ditanya, dan digunakan oleh semua AI Anda.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 min-w-[180px]">
            <div className="flex items-center gap-2 text-xs text-indigo-200 w-full justify-between">
              <span>{formatBytes(usage?.used || 0)}</span>
              <span className="text-white/40">/</span>
              <span>15 MB gratis</span>
              <span className={`font-bold ml-auto ${usagePct > 80 ? "text-red-400" : usagePct > 50 ? "text-amber-400" : "text-emerald-400"}`}>{usagePct}%</span>
            </div>
            <Progress value={usagePct} className="h-1.5 w-full bg-white/10" />
            <div className="flex gap-2 text-[10px] text-indigo-300">
              <span>{usage?.total_files || 0} file</span>
              <span>·</span>
              <span className="text-emerald-400">{usage?.ai_ready || 0} siap AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Onboarding Banner ── */}
      {!onboardingDismissed && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <BrainCircuit className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-foreground">Selamat datang di Memori Bisnis Anda</span>
                  <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 text-[10px] border-0">Baru</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3 max-w-2xl">
                  Selama ini dokumen perusahaan Anda tersimpan — tapi sulit <em>ditemukan</em> saat dibutuhkan.
                  Gustafta tidak hanya menyimpan file, melainkan <strong>memahami isinya</strong> sehingga bisa dicari, ditanya, dan digunakan oleh semua AI Anda.
                </p>
                <div className="flex flex-wrap gap-3 mb-3">
                  {[
                    { icon: ScanSearch, text: "Cari isi dokumen, bukan cuma nama file" },
                    { icon: BrainCircuit, text: "AI menjawab berdasarkan dokumen Anda" },
                    { icon: DatabaseZap, text: "Semua file otomatis jadi konteks AI" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white dark:bg-card rounded-lg px-2.5 py-1.5 border border-border shadow-sm">
                      <Icon className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  💡 Mulai dengan upload satu dokumen — misalnya portofolio proyek, SOP, atau SKK tenaga ahli.
                </p>
              </div>
              <button
                onClick={dismissOnboarding}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                title="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="max-w-7xl mx-auto px-4 py-5 flex gap-5">

        {/* ── Sidebar ── */}
        <div className="w-56 shrink-0 hidden lg:block">
          <div className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden">
            {/* Upload + Import buttons */}
            <div className="p-3 border-b border-border space-y-1.5">
              <Button
                size="sm" className="w-full gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? "Mengunggah…" : "Upload File"}
              </Button>
              <Button
                size="sm" variant="outline" className="w-full gap-1.5"
                onClick={() => setShowImportUrl(true)}
                disabled={importingUrl}
              >
                <Link2 className="h-3.5 w-3.5" />
                Import dari Link
              </Button>
              <input ref={fileInputRef} type="file" className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.csv,.jpg,.jpeg,.png,.webp"
                onChange={e => handleUpload(e.target.files)} />
            </div>
            {/* Folder list */}
            <div className="p-2">
              <button
                onClick={() => setActiveFolder("all")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                  ${activeFolder === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
              >
                <HardDrive className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 text-left truncate">Semua File</span>
                <span className="text-[10px] opacity-60">{usage?.total_files || 0}</span>
              </button>
              {overviewLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="mt-1 space-y-0.5">
                  {overview?.folders.map(f => {
                    const Icon = FOLDER_ICONS[f.icon] || Folder;
                    const isActive = activeFolder === f.id;
                    return (
                      <button key={f.id}
                        onClick={() => setActiveFolder(f.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                          ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1 text-left truncate">{f.name}</span>
                        <span className="text-[10px] opacity-60">{f.file_count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                onClick={() => setShowNewFolder(true)}
                className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Folder Baru
              </button>
            </div>

            {/* Buat AI Asisten */}
            <div className="px-3 pb-2">
              <button
                onClick={() => { setWizardFolderId(activeFolder); setShowWizard(true); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm"
              >
                <Bot className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 text-left truncate">Buat AI Asisten</span>
                <Wand2 className="h-3 w-3 opacity-80" />
              </button>
            </div>

            {/* AI Asisten Saya */}
            {myAssistants.length > 0 && (
              <div className="px-3 pb-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">AI Asisten Saya</p>
                <div className="space-y-1">
                  {myAssistants.map(asst => (
                    <div key={asst.id} className="rounded-xl border border-border bg-muted/30 px-2.5 py-2 space-y-1.5">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="h-3 w-3 text-white" />
                        </div>
                        <p className="text-[11px] font-semibold text-foreground leading-tight truncate flex-1">{asst.name}</p>
                      </div>
                      <div className="flex gap-1">
                        <a href={asst.chatUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <button className="w-full flex items-center justify-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors">
                            <MessageSquare className="h-2.5 w-2.5" /> Chat
                          </button>
                        </a>
                        <a href={asst.configUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <button className="w-full flex items-center justify-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors">
                            <ExternalLink className="h-2.5 w-2.5" /> Kelola
                          </button>
                        </a>
                        <button
                          onClick={async () => {
                            if (!confirm(`Hapus "${asst.name}"?`)) return;
                            await apiRequest("DELETE", `/api/ruang-simpan/assistants/${asst.id}`);
                            refetchAssistants();
                          }}
                          className="flex items-center justify-center px-2 py-1 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/30 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI info box */}
            <div className="m-3 mt-1 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/30">
              <div className="flex items-center gap-1.5 mb-1">
                <Brain className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-bold text-violet-700 dark:text-violet-400">Konteks AI</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Dokumen dengan badge <span className="text-emerald-600 font-semibold">AI Siap</span> dapat digunakan sebagai konteks oleh fitur Klinik, Bedah Dokumen, Brain Project, dan lainnya.
              </p>
            </div>
          </div>
        </div>

        {/* ── Main area ── */}
        <div className="flex-1 min-w-0">

          {/* Search + toolbar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") setSearchQuery(search); }}
                placeholder="Cari file atau isi dokumen…"
                className="pl-9"
              />
            </div>
            {search && (
              <Button size="sm" onClick={() => setSearchQuery(search)} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cari"}
              </Button>
            )}
            {searchQuery && (
              <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSearchQuery(""); }}>
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { refetchFiles(); refetchOverview(); }}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {/* Mobile upload + import */}
            <Button size="sm" className="lg:hidden gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="lg:hidden gap-1.5" onClick={() => setShowImportUrl(true)}>
              <Link2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Search results hint */}
          {searchQuery && (
            <p className="text-xs text-muted-foreground mb-3">
              {searching ? "Mencari…" : `${searchResults?.results.length || 0} hasil untuk "${searchQuery}"`}
            </p>
          )}

          {/* Drop zone + files */}
          <div
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            className={`min-h-[300px] rounded-2xl transition-all ${isDragging ? "ring-2 ring-primary ring-offset-2 bg-primary/5" : ""}`}
          >
            {filesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : displayFiles.length === 0 ? (
              <EmptyState isDragging={isDragging} onUploadClick={() => fileInputRef.current?.click()} isSearch={!!searchQuery} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {displayFiles.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onClick={() => setSelectedFile(file)}
                    onDelete={() => { if (confirm(`Hapus "${file.original_name}"?`)) deleteFile.mutate(file.id); }}
                  />
                ))}
              </div>
            )}
            {isDragging && (
              <div className="fixed inset-0 bg-primary/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
                <div className="bg-white dark:bg-card rounded-2xl p-10 shadow-2xl border-2 border-dashed border-primary text-center">
                  <Upload className="h-10 w-10 text-primary mx-auto mb-3" />
                  <p className="font-bold text-lg">Lepas untuk upload</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── File detail dialog ── */}
      {selectedFile && (
        <FileDetailDialog
          file={selectedFile}
          folders={overview?.folders || []}
          onClose={() => setSelectedFile(null)}
          onDelete={() => { if (confirm(`Hapus "${selectedFile.original_name}"?`)) deleteFile.mutate(selectedFile.id); }}
          onUpdated={() => { qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/files"] }); setSelectedFile(null); }}
        />
      )}

      {/* ── New folder dialog ── */}
      {showNewFolder && (
        <NewFolderDialog
          onClose={() => setShowNewFolder(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/overview"] }); setShowNewFolder(false); }}
        />
      )}

      {/* ── AI Asisten Wizard ── */}
      {showWizard && (
        <AIAssistantWizard
          folderId={wizardFolderId}
          folderName={wizardFolderId === "all" ? "Semua File" : (overview?.folders.find(f => f.id === wizardFolderId)?.name ?? "Folder")}
          onClose={() => setShowWizard(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ["/api/ruang-simpan/my-assistants"] }); }}
        />
      )}

      {/* ── Import dari URL dialog ── */}
      <Dialog open={showImportUrl} onOpenChange={v => { if (!importingUrl) setShowImportUrl(v); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-indigo-500" />
              Import dari Link
            </DialogTitle>
          </DialogHeader>

          {/* Supported sources */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: "Google Drive", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
              { label: "Google Docs", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
              { label: "OneDrive", color: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800" },
              { label: "SharePoint", color: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800" },
              { label: "URL Publik", color: "bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
            ].map(s => (
              <span key={s.label} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.color}`}>
                {s.label}
              </span>
            ))}
          </div>

          <div className="space-y-3 py-1">
            <div>
              <Label className="text-xs mb-1.5 block">Link dokumen <span className="text-red-500">*</span></Label>
              <Input
                placeholder="https://drive.google.com/file/d/… atau link publik lain"
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && importUrl.trim()) handleImportFromUrl(); }}
                disabled={importingUrl}
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Pastikan link bisa diakses siapapun tanpa login (mode "Siapapun dengan link dapat melihat").
              </p>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Deskripsi <span className="text-muted-foreground">(opsional)</span></Label>
              <Input
                placeholder="cth: Kontrak proyek Gedung X tahun 2024"
                value={importDesc}
                onChange={e => setImportDesc(e.target.value)}
                disabled={importingUrl}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportUrl(false)} disabled={importingUrl}>
              Batal
            </Button>
            <Button onClick={handleImportFromUrl} disabled={!importUrl.trim() || importingUrl} className="gap-1.5">
              {importingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
              {importingUrl ? "Mengimpor…" : "Import Dokumen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── File Card ──────────────────────────────────────────────────────────────────

function FileCard({ file, onClick, onDelete }: { file: RSFile; onClick: () => void; onDelete: () => void }) {
  const isImage = file.mime_type.startsWith("image/");
  return (
    <div className="bg-white dark:bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          {mimeIcon(file.mime_type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">{file.original_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{mimeLabel(file.mime_type)}</span>
            <span className="text-[10px] text-muted-foreground">{formatBytes(file.size_bytes)}</span>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Snippet from search */}
      {file.snippet && (
        <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1"
          dangerouslySetInnerHTML={{ __html: file.snippet }} />
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {kbBadge(file.kb_status, file.kb_chunk_count)}
          {docStatusBadge(file.doc_status)}
          {file.allow_biro_jasa && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40">
              <Handshake className="h-2.5 w-2.5" /> Biro Jasa
            </span>
          )}
          {file.folder_name && (
            <Badge variant="outline" className="text-[10px]">{file.folder_name}</Badge>
          )}
          {file.kelola_doc_id && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40">
              <ClipboardList className="h-2.5 w-2.5" /> Kelola
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{formatDate(file.created_at)}</span>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ isDragging, onUploadClick, isSearch }: { isDragging: boolean; onUploadClick: () => void; isSearch: boolean }) {
  if (isSearch) return (
    <div className="text-center py-20 bg-white dark:bg-card rounded-2xl border border-border">
      <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
      <p className="font-semibold text-foreground mb-1">Tidak ditemukan</p>
      <p className="text-sm text-muted-foreground">Coba kata kunci lain.</p>
    </div>
  );
  return (
    <div
      onClick={onUploadClick}
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors
        ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
    >
      <div className="flex justify-center mb-4 gap-3 opacity-60">
        <FileText className="h-8 w-8 text-blue-400" />
        <Image className="h-8 w-8 text-emerald-400" />
        <FileSpreadsheet className="h-8 w-8 text-green-500" />
      </div>
      <p className="font-bold text-foreground text-lg mb-1">Tambahkan Pengetahuan ke Memori Bisnis</p>
      <p className="text-sm text-muted-foreground mb-4">Drag & drop atau klik untuk pilih file<br />PDF · DOCX · XLSX · JPG · PNG · TXT · maks 20MB</p>
      <Button size="sm" className="gap-1.5" onClick={e => { e.stopPropagation(); onUploadClick(); }}>
        <Upload className="h-4 w-4" /> Pilih File
      </Button>
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Brain className="h-3.5 w-3.5 text-violet-500" />
        <span>Setiap file yang ditambahkan memperkaya pengetahuan AI tentang perusahaan Anda</span>
      </div>
    </div>
  );
}

// ── Preview Helpers ────────────────────────────────────────────────────────────

function PreviewImage({ fileId, alt }: { fileId: string; alt: string }) {
  const [err, setErr] = useState(false);
  if (err) return (
    <div className="flex flex-col items-center justify-center py-14 bg-muted/30 rounded-xl border border-border text-muted-foreground">
      <FileText className="h-8 w-8 mb-2 opacity-40" />
      <p className="text-sm">Gambar tidak dapat dimuat</p>
    </div>
  );
  return (
    <div className="rounded-xl overflow-hidden bg-muted border border-border">
      <img src={`/api/ruang-simpan/files/${fileId}/preview`} alt={alt}
        className="w-full max-h-[60vh] object-contain"
        onError={() => setErr(true)} />
    </div>
  );
}

function PreviewPdf({ fileId, name }: { fileId: string; name: string }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  return (
    <div className="relative rounded-xl overflow-hidden border border-border" style={{ minHeight: "65vh" }}>
      {!loaded && !err && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {err ? (
        <div className="flex flex-col items-center justify-center py-14 bg-muted/30 text-muted-foreground">
          <FileText className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm font-semibold mb-1">Preview tidak tersedia</p>
          <p className="text-xs text-center max-w-xs">File mungkin belum diproses atau tidak tersedia. Gunakan tombol Download, atau klik Proses Ulang di tab Info.</p>
        </div>
      ) : (
        <iframe
          src={`/api/ruang-simpan/files/${fileId}/preview`}
          title={name}
          className="w-full"
          style={{ height: "65vh" }}
          onLoad={() => setLoaded(true)}
          onError={() => setErr(true)}
        />
      )}
    </div>
  );
}

// ── File Detail Dialog ─────────────────────────────────────────────────────────

function FileDetailDialog({ file, folders, onClose, onDelete, onUpdated }: {
  file: RSFile; folders: RSFolder[]; onClose: () => void; onDelete: () => void; onUpdated: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"info" | "preview" | "paspor">("info");
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(file.description || "");
  const [folderId, setFolderId] = useState(file.folder_id || "");
  const [docStatus, setDocStatus] = useState<string>(file.doc_status || "aktif");
  const [allowBiroJasa, setAllowBiroJasa] = useState<boolean>(file.allow_biro_jasa ?? false);
  const [saving, setSaving] = useState(false);
  const [showGrant, setShowGrant] = useState(false);
  const [showPassportLog, setShowPassportLog] = useState(false);
  const [processingReqId, setProcessingReqId] = useState<string | null>(null);
  const [bedahLoading, setBedahLoading] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const isImage = file.mime_type.startsWith("image/");

  // Proses ulang ekstraksi dari Object Storage
  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      const res = await fetch(`/api/ruang-simpan/files/${file.id}/reprocess`, {
        method: "POST", credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses ulang");
      toast({ title: "Sedang diproses ulang…", description: "Status akan berubah ke 'AI Siap' dalam beberapa detik." });
      // Poll sampai selesai
      let tries = 0;
      const poll = setInterval(async () => {
        tries++;
        onUpdated(); // refetch daftar file
        if (tries >= 20) clearInterval(poll); // max 40 detik
      }, 2000);
      setTimeout(() => clearInterval(poll), 42000);
    } catch (err: any) {
      toast({ title: "Gagal proses ulang", description: err.message, variant: "destructive" });
    } finally {
      setReprocessing(false);
    }
  };

  // Buka file RS di Bedah Dokumen
  const openInBedahDokumen = async () => {
    setBedahLoading(true);
    try {
      const res = await fetch(`/api/bedah-dokumen/from-rs/${file.id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuka file");
      onClose();
      navigate(`/bedah-dokumen?doc=${data.id}`);
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    } finally {
      setBedahLoading(false);
    }
  };

  // Passport (access log + grants)
  const { data: passport, isLoading: passportLoading, refetch: refetchPassport } = useQuery<RSPassport>({
    queryKey: [`/api/ruang-simpan/files/${file.id}/passport`],
    queryFn: () => apiRequest("GET", `/api/ruang-simpan/files/${file.id}/passport`),
    enabled: tab === "paspor",
  });

  const revokeGrant = useMutation({
    mutationFn: (grantId: string) => apiRequest("DELETE", `/api/ruang-simpan/files/${file.id}/grants/${grantId}`),
    onSuccess: () => { toast({ title: "Kuasa berhasil dicabut" }); refetchPassport(); },
    onError: () => toast({ title: "Gagal mencabut kuasa", variant: "destructive" }),
  });

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiRequest("PATCH", `/api/ruang-simpan/files/${file.id}`, {
        description: desc || null,
        folder_id: folderId || null,
        doc_status: docStatus,
        allow_biro_jasa: allowBiroJasa,
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      toast({ title: "File diperbarui" });
      onUpdated();
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    } finally { setSaving(false); }
  };

  // Toggle biro jasa langsung (tanpa masuk edit mode)
  const toggleBiroJasa = async (val: boolean) => {
    setAllowBiroJasa(val);
    try {
      const res = await apiRequest("PATCH", `/api/ruang-simpan/files/${file.id}`, {
        allow_biro_jasa: val,
      });
      if (!res.ok) { setAllowBiroJasa(!val); throw new Error(); }
      toast({ title: val ? "Dokumen sekarang terlihat biro jasa" : "Dokumen disembunyikan dari biro jasa" });
      onUpdated();
    } catch {
      setAllowBiroJasa(!val);
      toast({ title: "Gagal mengubah pengaturan", variant: "destructive" });
    }
  };

  const approveRequest = async (reqId: string, expiresDays = 30) => {
    setProcessingReqId(reqId);
    try {
      const res = await apiRequest("PATCH",
        `/api/ruang-simpan/files/${file.id}/access-requests/${reqId}/approve`,
        { expires_days: expiresDays }
      );
      if (!res.ok) throw new Error();
      toast({ title: "Permintaan disetujui — Kuasa Digital otomatis dibuat" });
      refetchPassport();
    } catch {
      toast({ title: "Gagal menyetujui permintaan", variant: "destructive" });
    } finally { setProcessingReqId(null); }
  };

  const rejectRequest = async (reqId: string) => {
    setProcessingReqId(reqId);
    try {
      const res = await apiRequest("PATCH",
        `/api/ruang-simpan/files/${file.id}/access-requests/${reqId}/reject`, {}
      );
      if (!res.ok) throw new Error();
      toast({ title: "Permintaan ditolak" });
      refetchPassport();
    } catch {
      toast({ title: "Gagal menolak permintaan", variant: "destructive" });
    } finally { setProcessingReqId(null); }
  };

  return (
    <>
      <Dialog open onOpenChange={v => !v && onClose()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {mimeIcon(file.mime_type)}
              <span className="truncate">{file.original_name}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border pb-2">
            {(["info", "preview", "paspor"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}>
                {t === "info" ? "📄 Info" : t === "preview" ? "👁️ Preview" : "🛡️ Paspor Dokumen"}
              </button>
            ))}
          </div>

          {tab === "info" && (
            <div className="space-y-4">
              {/* Image preview */}
              {isImage && (
                <div className="rounded-xl overflow-hidden bg-muted">
                  <img src={`/api/ruang-simpan/files/${file.id}/preview`} alt={file.original_name}
                    className="w-full max-h-64 object-contain" />
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Ukuran</p>
                  <p className="font-semibold">{formatBytes(file.size_bytes)}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Diunggah</p>
                  <p className="font-semibold">{formatDate(file.created_at)}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Status AI</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {kbBadge(file.kb_status, file.kb_chunk_count)}
                    {(file.kb_status === "failed" || file.kb_status === "ready" || file.kb_status === "pending") && (
                      <button
                        onClick={handleReprocess}
                        disabled={reprocessing || file.kb_status === "processing"}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 disabled:opacity-50 transition-colors dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40"
                        title="Proses ulang ekstraksi teks dari file asli"
                      >
                        <RefreshCw className={`h-2.5 w-2.5 ${reprocessing ? "animate-spin" : ""}`} />
                        {reprocessing ? "Memproses…" : "Proses Ulang"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Status Dokumen</p>
                  {editing ? (
                    <Select value={docStatus} onValueChange={setDocStatus}>
                      <SelectTrigger className="h-6 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="aktif">Aktif</SelectItem>
                        <SelectItem value="kadaluarsa">Kadaluarsa</SelectItem>
                        <SelectItem value="arsip">Arsip</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    docStatusBadge(file.doc_status)
                  )}
                </div>
              </div>

              {/* Edit fields */}
              {editing ? (
                <div className="space-y-3">
                  <div className="grid gap-1.5">
                    <Label>Folder</Label>
                    <Select value={folderId} onValueChange={setFolderId}>
                      <SelectTrigger><SelectValue placeholder="Tanpa folder" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tanpa folder</SelectItem>
                        {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Deskripsi</Label>
                    <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Keterangan singkat…" />
                  </div>
                </div>
              ) : (
                file.description && (
                  <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                    <p className="text-[10px] uppercase tracking-wide mb-1 font-semibold text-foreground">Deskripsi</p>
                    {file.description}
                  </div>
                )
              )}

              {/* Biro Jasa toggle */}
              <div className={`rounded-xl border p-3 transition-colors ${
                allowBiroJasa
                  ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40"
                  : "bg-muted/30 border-border"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Handshake className={`h-3.5 w-3.5 ${allowBiroJasa ? "text-blue-600" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-bold ${allowBiroJasa ? "text-blue-700 dark:text-blue-400" : "text-foreground"}`}>
                        Izinkan Biro Jasa Melihat Dokumen Ini
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {allowBiroJasa
                        ? "Dokumen ini muncul di katalog biro jasa. Mereka hanya bisa melihat nama & deskripsi, dan harus mengajukan permintaan — kamu yang memutuskan apakah memberi akses."
                        : "Aktifkan agar biro jasa bisa menemukan dokumen ini dan mengajukan permintaan akses. Persetujuan tetap di tangan kamu."}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleBiroJasa(!allowBiroJasa)}
                    className={`shrink-0 w-10 h-5 rounded-full transition-colors relative ${
                      allowBiroJasa ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    title={allowBiroJasa ? "Matikan akses biro jasa" : "Aktifkan akses biro jasa"}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      allowBiroJasa ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              </div>

              {/* AI context info + Bedah AI button */}
              {file.kb_status === "ready" && (
                <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-violet-600" />
                    <span className="text-xs font-bold text-violet-700 dark:text-violet-400">Gunakan di AI</span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs h-8"
                    onClick={() => openInBedahDokumen()}
                    disabled={bedahLoading}
                  >
                    {bedahLoading
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Membuka…</>
                      : <><ScanSearch className="h-3.5 w-3.5" /> Bedah &amp; Tanya AI</>
                    }
                  </Button>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Atau chat dengan AI manapun — dokumen ini otomatis jadi konteks saat kamu menanyakan hal yang relevan.
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === "preview" && (
            <div className="space-y-3">
              {file.kb_status === "pending" || file.kb_status === "failed" ? (
                <div className="flex flex-col items-center justify-center py-14 text-muted-foreground bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40">
                  <RefreshCw className="h-8 w-8 mb-3 text-amber-500 opacity-80" />
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">File belum diproses</p>
                  <p className="text-xs text-center max-w-xs leading-relaxed text-amber-600 dark:text-amber-500">
                    Buka tab <strong>Info</strong> dan klik tombol <strong>Proses Ulang</strong> untuk mengekstrak konten file ini.
                  </p>
                  <button
                    onClick={() => setTab("info")}
                    className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-400 underline"
                  >
                    → Ke tab Info
                  </button>
                </div>
              ) : file.mime_type.startsWith("image/") ? (
                <PreviewImage fileId={file.id} alt={file.original_name} />
              ) : file.mime_type === "application/pdf" ? (
                <PreviewPdf fileId={file.id} name={file.original_name} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-border">
                  <FileText className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm font-semibold mb-1">Preview tidak tersedia</p>
                  <p className="text-xs text-center max-w-xs leading-relaxed">
                    Tipe file <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{file.mime_type}</span> tidak mendukung preview langsung. Gunakan tombol Download.
                  </p>
                </div>
              )}
              {file.kb_status === "ready" && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Konten ditampilkan langsung dari server — tidak perlu download.
                </p>
              )}
            </div>
          )}

          {tab === "paspor" && (
            <div className="space-y-4">
              {passportLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : passport ? (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-xl p-2.5 text-center border border-indigo-100 dark:border-indigo-900/30">
                      <Download className="h-3.5 w-3.5 text-indigo-500 mx-auto mb-1" />
                      <p className="text-base font-black text-indigo-700 dark:text-indigo-400">{passport.stats.total_downloads}</p>
                      <p className="text-[10px] text-muted-foreground">Download</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-2.5 text-center border border-emerald-100 dark:border-emerald-900/30">
                      <KeyRound className="h-3.5 w-3.5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-base font-black text-emerald-700 dark:text-emerald-400">{passport.stats.active_grants}</p>
                      <p className="text-[10px] text-muted-foreground">Kuasa Aktif</p>
                    </div>
                    <div className={`rounded-xl p-2.5 text-center border ${
                      passport.stats.pending_requests > 0
                        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                        : "bg-gray-50 dark:bg-gray-900/20 border-gray-100 dark:border-gray-800/30"
                    }`}>
                      <Handshake className={`h-3.5 w-3.5 mx-auto mb-1 ${passport.stats.pending_requests > 0 ? "text-amber-500" : "text-gray-400"}`} />
                      <p className={`text-base font-black ${passport.stats.pending_requests > 0 ? "text-amber-700 dark:text-amber-400" : "text-foreground"}`}>
                        {passport.stats.pending_requests}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Menunggu</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/20 rounded-xl p-2.5 text-center border border-gray-100 dark:border-gray-800/30">
                      <Activity className="h-3.5 w-3.5 text-gray-500 mx-auto mb-1" />
                      <p className="text-base font-black text-foreground">{passport.access_log.length}</p>
                      <p className="text-[10px] text-muted-foreground">Aktivitas</p>
                    </div>
                  </div>

                  {/* Active Grants */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-indigo-500" /> Kuasa Digital Aktif
                      </p>
                      <Button size="sm" variant="outline" className="h-6 text-[11px] gap-1 px-2"
                        onClick={() => setShowGrant(true)}>
                        <Plus className="h-3 w-3" /> Beri Kuasa
                      </Button>
                    </div>
                    {passport.grants.filter(g => g.is_active).length === 0 ? (
                      <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                        Belum ada kuasa aktif. Klik "Beri Kuasa" untuk memberi akses ke konsultan atau biro jasa.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {passport.grants.filter(g => g.is_active).map(g => (
                          <div key={g.id} className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="text-sm font-semibold">{g.grantee_name}</span>
                                  {g.grantee_email && <span className="text-[10px] text-muted-foreground">({g.grantee_email})</span>}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">Tujuan: {g.purpose}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex gap-1">
                                    {g.permissions.map(p => (
                                      <span key={p} className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{p === "view" ? "Lihat" : "Download"}</span>
                                    ))}
                                  </div>
                                  {g.expires_at && (
                                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                                      <CalendarClock className="h-2.5 w-2.5" />
                                      Sampai {formatDate(g.expires_at)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button onClick={() => {
                                if (confirm(`Cabut kuasa untuk ${g.grantee_name}?`)) revokeGrant.mutate(g.id);
                              }} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Cabut kuasa">
                                <UserX className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Revoked grants (collapsed) */}
                  {passport.grants.filter(g => !g.is_active).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                        <UserX className="h-3 w-3" /> {passport.grants.filter(g => !g.is_active).length} kuasa sudah dicabut
                      </p>
                    </div>
                  )}

                  {/* Permintaan Akses Biro Jasa */}
                  {passport.access_requests && passport.access_requests.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
                        <Handshake className="h-3.5 w-3.5 text-blue-500" />
                        Permintaan Akses Biro Jasa
                        {passport.stats.pending_requests > 0 && (
                          <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                            {passport.stats.pending_requests} menunggu
                          </span>
                        )}
                      </p>
                      <div className="space-y-2">
                        {passport.access_requests.map(r => (
                          <div key={r.id} className={`rounded-xl border p-3 ${
                            r.status === "pending"
                              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                              : r.status === "approved"
                              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                              : "bg-muted/30 border-border opacity-70"
                          }`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="text-sm font-semibold truncate">{r.requester_name}</span>
                                  <span className="text-[10px] text-muted-foreground shrink-0">({r.company_name})</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mb-1">📧 {r.requester_email}</p>
                                <p className="text-xs text-muted-foreground truncate">Tujuan: {r.purpose}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <div className="flex gap-1">
                                    {r.requested_permissions.map(p => (
                                      <span key={p} className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{p === "view" ? "Lihat" : "Download"}</span>
                                    ))}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(r.created_at)}</span>
                                </div>
                              </div>
                              {r.status === "pending" && (
                                <div className="flex flex-col gap-1.5 shrink-0">
                                  <button
                                    onClick={() => approveRequest(r.id, 30)}
                                    disabled={processingReqId === r.id}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 px-2.5 py-1 rounded-lg transition-colors"
                                  >
                                    {processingReqId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                                    Setuju
                                  </button>
                                  <button
                                    onClick={() => rejectRequest(r.id)}
                                    disabled={processingReqId === r.id}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 disabled:opacity-50 px-2.5 py-1 rounded-lg transition-colors"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Tolak
                                  </button>
                                </div>
                              )}
                              {r.status !== "pending" && (
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${
                                  r.status === "approved"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}>
                                  {r.status === "approved" ? "✓ Disetujui" : "✗ Ditolak"}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Access Log */}
                  <div>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-2 w-full"
                      onClick={() => setShowPassportLog(v => !v)}>
                      <History className="h-3.5 w-3.5 text-indigo-500" /> Riwayat Aktivitas ({passport.access_log.length})
                      {showPassportLog ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                    </button>
                    {showPassportLog && (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {passport.access_log.length === 0 ? (
                          <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/30 rounded-lg">Belum ada aktivitas tercatat.</p>
                        ) : passport.access_log.map(log => (
                          <div key={log.id} className="flex items-center gap-2 text-[11px] text-foreground bg-muted/30 rounded-lg px-3 py-2">
                            <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-semibold">{actionLabel(log.action)}</span>
                            <span className="text-muted-foreground">oleh {log.actor_name}</span>
                            {log.purpose && <span className="text-muted-foreground">— {log.purpose}</span>}
                            <span className="ml-auto text-muted-foreground shrink-0">{formatDate(log.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}

          <DialogFooter className="flex-row flex-wrap gap-2">
            <a href={`/api/ruang-simpan/files/${file.id}/download`} download={file.original_name}>
              <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Download</Button>
            </a>
            {tab === "info" && (
              editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Batal</Button>
                  <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Simpan</Button>
                </>
              ) : (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
              )
            )}
            {tab === "paspor" && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowGrant(true)}>
                <KeyRound className="h-3.5 w-3.5" /> Beri Kuasa Digital
              </Button>
            )}
            <Button variant="destructive" size="sm" className="gap-1.5 ml-auto" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /> Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Modal */}
      {showGrant && (
        <GrantModal
          fileId={file.id}
          fileName={file.original_name}
          onClose={() => setShowGrant(false)}
          onGranted={() => { setShowGrant(false); refetchPassport(); }}
        />
      )}
    </>
  );
}

// ── Grant Access Modal ─────────────────────────────────────────────────────────

function GrantModal({ fileId, fileName, onClose, onGranted }: {
  fileId: string; fileName: string; onClose: () => void; onGranted: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["view"]);
  const [expiresDays, setExpiresDays] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const togglePerm = (p: string) => {
    setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const submit = async () => {
    if (!name.trim() || !purpose.trim() || permissions.length === 0) {
      toast({ title: "Isi nama, tujuan, dan minimal 1 izin akses", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const res = await apiRequest("POST", `/api/ruang-simpan/files/${fileId}/grants`, {
        grantee_name: name.trim(),
        grantee_email: email.trim() || undefined,
        permissions,
        purpose: purpose.trim(),
        expires_days: expiresDays ? parseInt(expiresDays) : null,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal");
      toast({ title: `Kuasa digital diberikan ke ${name}` });
      onGranted();
    } catch (e: any) {
      toast({ title: e.message || "Gagal memberi kuasa", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-indigo-500" /> Beri Kuasa Digital
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">Untuk: {fileName}</p>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-3">
            <p className="text-[11px] text-indigo-700 dark:text-indigo-400 leading-relaxed">
              <strong>Kuasa Digital</strong> memberi seseorang hak akses terbatas ke dokumen ini. Anda bisa mencabutnya kapan saja. Semua aktivitas tercatat otomatis.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Nama Penerima Kuasa *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="cth: Biro Jasa XYZ / Pak Ahmad" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Email (opsional)</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@perusahaan.com" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Tujuan Pemberian Kuasa *</Label>
            <Input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="cth: Tender PLN 2026, Audit ISO, Due Diligence" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Izin Akses *</Label>
            <div className="flex gap-2">
              {[
                { val: "view", label: "Lihat", desc: "Baca dokumen" },
                { val: "download", label: "Download", desc: "Unduh file" },
              ].map(p => (
                <button key={p.val} onClick={() => togglePerm(p.val)}
                  className={`flex-1 border-2 rounded-xl p-2.5 text-left transition-colors ${
                    permissions.includes(p.val)
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-border hover:border-indigo-200"
                  }`}>
                  <p className={`text-xs font-bold ${permissions.includes(p.val) ? "text-indigo-700 dark:text-indigo-400" : "text-foreground"}`}>{p.label}</p>
                  <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Masa Berlaku (opsional)</Label>
            <Select value={expiresDays} onValueChange={setExpiresDays}>
              <SelectTrigger><SelectValue placeholder="Tidak terbatas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tidak terbatas</SelectItem>
                <SelectItem value="7">7 hari</SelectItem>
                <SelectItem value="30">30 hari</SelectItem>
                <SelectItem value="90">90 hari</SelectItem>
                <SelectItem value="180">6 bulan</SelectItem>
                <SelectItem value="365">1 tahun</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit} disabled={saving || !name.trim() || !purpose.trim() || permissions.length === 0}
            className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Beri Kuasa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── New Folder Dialog ──────────────────────────────────────────────────────────

const FOLDER_COLOR_OPTIONS = ["blue","slate","orange","purple","red","teal","gray","green","pink"];
const FOLDER_ICON_OPTIONS  = [
  { value: "folder",      label: "Folder" },
  { value: "folder-open", label: "Folder Buka" },
  { value: "shield",      label: "Legalitas" },
  { value: "wrench",      label: "Teknis" },
  { value: "calculator",  label: "Keuangan" },
  { value: "award",       label: "Sertifikasi" },
  { value: "bar-chart",   label: "Tender" },
];

function NewFolderDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [icon, setIcon] = useState("folder");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await apiRequest("POST", "/api/ruang-simpan/folders", { name, color, icon });
      if (!res.ok) throw new Error("Gagal");
      toast({ title: `Folder "${name}" dibuat` });
      onCreated();
    } catch { toast({ title: "Gagal membuat folder", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Folder Baru</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label>Nama Folder *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="cth: Dokumen Proyek A" maxLength={100} />
          </div>
          <div className="grid gap-1.5">
            <Label>Warna</Label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLOR_OPTIONS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-2 ring-primary" : "hover:scale-110"}`}
                  style={{ backgroundColor: { blue:"#3b82f6",slate:"#64748b",orange:"#f97316",purple:"#a855f7",red:"#ef4444",teal:"#14b8a6",gray:"#9ca3af",green:"#22c55e",pink:"#ec4899" }[c] }}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Ikon</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FOLDER_ICON_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={create} disabled={!name.trim() || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Buat Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Landing Page (unauthenticated) ────────────────────────────────────────────

const PLAN_COLOR_MAP: Record<string, { badge: string; ring: string; btn: string; glow: string }> = {
  gray:   { badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300", ring: "border-border", btn: "bg-gray-800 hover:bg-gray-700 text-white", glow: "" },
  blue:   { badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", ring: "border-blue-300 dark:border-blue-700", btn: "bg-blue-600 hover:bg-blue-700 text-white", glow: "" },
  indigo: { badge: "bg-indigo-600 text-white", ring: "border-indigo-500 ring-2 ring-indigo-400/30", btn: "bg-indigo-600 hover:bg-indigo-700 text-white", glow: "shadow-indigo-200 dark:shadow-indigo-900/40 shadow-xl" },
  violet: { badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", ring: "border-violet-300 dark:border-violet-700", btn: "bg-violet-600 hover:bg-violet-700 text-white", glow: "" },
};

function RuangSimpanLandingPage() {
  const contact = useContactNumbers();
  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white overflow-hidden">
        {/* grid accent */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "linear-gradient(rgba(99,102,241,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.3) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-1.5 text-indigo-300 text-xs font-semibold mb-6">
            <HardDrive className="h-3.5 w-3.5" /> Ruang Simpan — Beta
          </div>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
            Bangun{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Memori Bisnis
            </span>{" "}
            perusahaan Anda.
          </h1>
          <p className="text-indigo-200 text-base sm:text-lg max-w-2xl mx-auto mb-3 leading-relaxed">
            Ruang Simpan bukan tempat menyimpan file. Ini adalah tempat AI Gustafta
            mengenal perusahaan Anda — agar setiap fitur bekerja dengan konteks yang nyata.
          </p>
          <p className="text-indigo-400/80 text-sm max-w-xl mx-auto mb-8 italic">
            "Karena bisnis yang baik tidak bergantung pada ingatan seseorang."
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/masuk">
              <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                <LogIn className="h-4 w-4" /> Mulai Gratis — 15 MB
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
                Lihat Tarif Sewa <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
          {/* social proof mini */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-indigo-300/70">
            <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Data terenkripsi</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Khusus pemilik akun</span>
            <span className="flex items-center gap-1.5"><Brain className="h-3 w-3" /> AI siap dalam menit</span>
          </div>
        </div>
      </section>

      {/* ── MASALAH ──────────────────────────────────────────────────────────── */}
      <section className="bg-muted/30 border-y border-border py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl font-bold text-foreground mb-8">
            Google Drive menyimpan dokumen. Gustafta Ruang Simpan <em>mengaktifkannya.</em>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Google Drive column */}
            <div className="bg-white dark:bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Folder className="h-4 w-4 text-gray-400" />
                </div>
                <span className="font-bold text-muted-foreground">Google Drive / OneDrive</span>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {[
                  "Simpan file ✓  — tapi AI tidak tahu isinya",
                  "Cari nama file — tidak bisa cari isi dokumen",
                  "Buka manual setiap kali butuh",
                  "Tidak terhubung ke proses bisnis konstruksi",
                  "Storage besar, tapi dokumen mati",
                ].map(t => (
                  <li key={t} className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            {/* Ruang Simpan column */}
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <HardDrive className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-indigo-700 dark:text-indigo-300">Gustafta Ruang Simpan</span>
              </div>
              <ul className="space-y-2.5 text-sm text-foreground">
                {[
                  "Simpan file + AI baca & pahami isinya",
                  "Cari di dalam isi dokumen (full-text)",
                  "Konteks otomatis ke Klinik, Bedah Dokumen, Tender",
                  "Terintegrasi Ruang Kelola — link dokumen legal langsung",
                  "15 MB gratis, upgrade saat sudah butuh lebih",
                ].map(t => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CARA KERJA ───────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Cara Kerja</p>
        <h2 className="text-center text-2xl font-bold text-foreground mb-2">Rapikan. Hubungkan. Gunakan Kembali.</h2>
        <p className="text-center text-sm text-muted-foreground mb-10 max-w-xl mx-auto">Tiga langkah yang mengubah dokumen yang berserakan menjadi pengetahuan yang bekerja untuk Anda.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: "1", icon: Upload, title: "Tambahkan Pengetahuan", desc: "Drag & drop PDF, DOCX, XLSX, foto scan, atau PNG. Anda sedang mengisi Memori Bisnis perusahaan, bukan sekadar upload file.", color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
            { step: "2", icon: BrainCircuit, title: "AI Memahami & Menghubungkan", desc: "Gustafta membaca isi dokumen, mengindeks maknanya, dan menghubungkannya ke seluruh konteks perusahaan Anda.", color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30" },
            { step: "3", icon: Sparkles, title: "Gunakan di Semua Workroom", desc: "Buka Klinik, Bedah Dokumen, Brain Project — AI langsung punya konteks. Anda tidak perlu upload ulang.", color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" },
          ].map(({ step, icon: Icon, title, desc, color }) => (
            <div key={step} className="relative text-center bg-white dark:bg-card border border-border rounded-2xl p-6">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-4`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow">{step}</div>
              <h3 className="font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FITUR DETAIL ─────────────────────────────────────────────────────── */}
      <section className="bg-muted/20 border-y border-border py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Fitur Utama</p>
          <h2 className="text-center text-2xl font-bold text-foreground mb-10">Semuanya sudah terhubung</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: ScanSearch,    color:"text-blue-600 bg-blue-50 dark:bg-blue-900/20",    title:"Cari Isi Dokumen",        desc:"Full-text search ke dalam konten PDF, DOCX, dan TXT — bukan hanya nama file." },
              { icon: BrainCircuit,  color:"text-violet-600 bg-violet-50 dark:bg-violet-900/20", title:"Konteks AI Otomatis",    desc:"Semua fitur AI Gustafta otomatis membaca dokumen Anda saat Anda menggunakannya." },
              { icon: ClipboardList, color:"text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20", title:"Link ke Ruang Kelola", desc:"Hubungkan file scan dengan catatan SBU, NIB, SKK — satu klik dari dashboard." },
              { icon: FolderOpen,    color:"text-orange-600 bg-orange-50 dark:bg-orange-900/20", title:"Folder Terstruktur",    desc:"7 kategori default: Legalitas, Teknis, Tender, SDM, dan lainnya. Buat folder sendiri." },
              { icon: Shield,        color:"text-red-600 bg-red-50 dark:bg-red-900/20",     title:"Kuasa Digital & Audit",   desc:"Beri akses terbatas ke konsultan/biro jasa. Riwayat download & setiap perubahan tercatat otomatis." },
              { icon: DatabaseZap,   color:"text-teal-600 bg-teal-50 dark:bg-teal-900/20",  title:"Preview & Download",      desc:"Lihat gambar langsung di browser. Download kapan saja, tanpa batas." },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white dark:bg-card border border-border rounded-xl p-5">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 px-4 max-w-5xl mx-auto">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Tarif Sewa</p>
        <h2 className="text-center text-2xl font-bold text-foreground mb-2">Mulai gratis, upgrade saat butuh</h2>
        <p className="text-center text-sm text-muted-foreground mb-10 max-w-xl mx-auto">
          Harga terjangkau karena nilai utamanya bukan ukuran storage — melainkan integrasi AI
          yang membuat dokumen Anda bekerja untuk bisnis konstruksi Anda.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RUANG_SIMPAN_PLANS.map(plan => {
            const colors = PLAN_COLOR_MAP[plan.color] || PLAN_COLOR_MAP.gray;
            return (
              <div
                key={plan.key}
                className={`relative bg-white dark:bg-card border-2 rounded-2xl p-5 flex flex-col transition-transform hover:-translate-y-1 ${colors.ring} ${colors.glow}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold ${colors.badge}`}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-4">
                  <p className="font-bold text-foreground">{plan.label}</p>
                  <div className="mt-1.5">
                    <span className="text-2xl font-black text-foreground">{plan.price}</span>
                    {plan.amount > 0 && <span className="text-xs text-muted-foreground ml-1">/bulan</span>}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs font-semibold text-foreground">
                    <HardDrive className="h-3 w-3" /> {plan.storage}
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-foreground mb-5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.limits.map(l => (
                    <li key={l} className="flex items-start gap-1.5 text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>

                {plan.ctaHref.startsWith("http") ? (
                  <a href={plan.ctaHref} target="_blank" rel="noopener noreferrer">
                    <button className={`w-full py-2 rounded-xl text-sm font-bold transition-colors ${colors.btn}`}>
                      {plan.cta}
                    </button>
                  </a>
                ) : (
                  <Link href={plan.ctaHref}>
                    <button className={`w-full py-2 rounded-xl text-sm font-bold transition-colors ${colors.btn}`}>
                      {plan.cta}
                    </button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="bg-muted/20 border-t border-border py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-xl font-bold text-foreground mb-8">Pertanyaan Umum</h2>
          <div className="space-y-4">
            {[
              { q: "Apakah dokumen saya aman?", a: "Ya. Setiap dokumen hanya bisa diakses oleh pemilik akun. Kami tidak berbagi data Anda dengan siapapun. Semua akses tercatat di audit log." },
              { q: "Format file apa saja yang didukung?", a: "PDF, DOCX, XLSX (data tabel), JPG, PNG, TXT, CSV, dan Markdown. Maks 20 MB per file." },
              { q: "Berapa lama AI memproses dokumen saya?", a: "Biasanya kurang dari 1 menit untuk PDF dan TXT. File gambar memerlukan OCR — sekitar 1–3 menit tergantung kompleksitas." },
              { q: "Apakah 15 MB gratis cukup untuk mencoba?", a: "Cukup untuk 3–5 dokumen SBU, NIB, atau NIK ukuran standar. Tujuannya agar Anda bisa merasakan manfaat AI sebelum memutuskan upgrade." },
              { q: "Bisakah saya batalkan langganan kapan saja?", a: "Ya. Tidak ada kontrak jangka panjang. Batalkan kapan saja dan data Anda tetap aman selama 30 hari setelah pembatalan." },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white dark:bg-card border border-border rounded-xl p-4">
                <p className="font-semibold text-sm text-foreground mb-1.5">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 py-16 px-4 text-center text-white">
        <h2 className="text-2xl sm:text-3xl font-black mb-3">Mulai gratis hari ini.</h2>
        <p className="text-indigo-200 mb-7 max-w-md mx-auto text-sm leading-relaxed">
          15 MB cukup untuk membuktikan bahwa dokumen Anda bisa bekerja lebih keras dari sekadar diarsipkan.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/masuk">
            <Button size="lg" className="gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-8">
              <LogIn className="h-4 w-4" /> Buat Akun Gratis
            </Button>
          </Link>
          <a href={`https://wa.me/${contact.secondary}?text=Halo%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20Ruang%20Simpan`} target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10">
              Tanya via WhatsApp
            </Button>
          </a>
        </div>
      </section>

      {/* footer gap */}
      <div className="h-12 bg-background" />
    </div>
  );
}

// ── AI Assistant Wizard ────────────────────────────────────────────────────────

const ASSISTANT_TYPES = [
  { value: "umum",    label: "Asisten Umum Perusahaan", icon: "🏢", desc: "Untuk pertanyaan umum seputar dokumen perusahaan" },
  { value: "cs",      label: "Customer Service",        icon: "🎧", desc: "Membantu pelanggan dengan produk & layanan" },
  { value: "legal",   label: "Legal Assistant",          icon: "⚖️", desc: "Kontrak, peraturan, dan dokumen hukum" },
  { value: "hr",      label: "HR Assistant",             icon: "👥", desc: "Kebijakan SDM, tunjangan, dan prosedur" },
  { value: "tender",  label: "Tender Assistant",         icon: "📋", desc: "RKS, pengadaan, dan persyaratan tender" },
  { value: "project", label: "Project Assistant",        icon: "🏗️", desc: "Dokumen proyek, spesifikasi, dan jadwal" },
  { value: "iso",     label: "ISO / Quality Assistant",  icon: "✅", desc: "Standar mutu, audit, dan SOP" },
  { value: "sales",   label: "Sales Assistant",          icon: "💼", desc: "Produk, proposal, dan strategi penjualan" },
  { value: "finance", label: "Finance Assistant",        icon: "💰", desc: "Laporan keuangan dan kebijakan keuangan" },
  { value: "custom",  label: "Custom",                   icon: "⚡", desc: "Asisten umum berbasis dokumen Anda" },
];

interface WizardResult { agent_id: string; slug: string; name: string; file_count: number; chunk_count: number; chat_url: string; }

function AIAssistantWizard({ folderId, folderName, onClose, onCreated }: {
  folderId: string; folderName: string; onClose: () => void; onCreated?: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | "done">(1);
  const [name, setName] = useState(folderName !== "Semua File" ? `${folderName} Assistant` : "AI Assistant Saya");
  const [type, setType] = useState("umum");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WizardResult | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[] | null>(null); // null = all

  // Fetch AI-ready files for this folder
  const { data: readyFilesData } = useQuery<RSFile[]>({
    queryKey: ["rs-ready-files", folderId],
    queryFn: async () => {
      const url = folderId && folderId !== "all"
        ? `/api/ruang-simpan/files?folder_id=${folderId}`
        : `/api/ruang-simpan/files`;
      const res = await fetch(url, { credentials: "include" });
      const all: RSFile[] = await res.json();
      return all.filter(f => f.kb_status === "ready");
    },
    staleTime: 30_000,
  });
  const readyFiles: RSFile[] = readyFilesData || [];

  // When files load for the first time, default to all selected
  const effectiveSelected: string[] = selectedFileIds ?? readyFiles.map(f => f.id);
  const toggleFile = (id: string) => {
    const current = selectedFileIds ?? readyFiles.map(f => f.id);
    setSelectedFileIds(
      current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    );
  };
  const toggleAll = () => {
    if (effectiveSelected.length === readyFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(readyFiles.map(f => f.id));
    }
  };

  const generate = async () => {
    if (!name.trim()) { toast({ title: "Nama asisten diperlukan", variant: "destructive" }); return; }
    if (effectiveSelected.length === 0) { toast({ title: "Pilih minimal 1 dokumen", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const data = await apiRequest("POST", "/api/ruang-simpan/generate-assistant", {
        folder_id: folderId === "all" ? undefined : folderId,
        name: name.trim(),
        assistant_type: type,
        file_ids: effectiveSelected,
      });
      setResult(data);
      setStep("done");
      onCreated?.();
    } catch (err: any) {
      toast({ title: "Gagal membuat AI Asisten", description: err?.message || "Coba lagi", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const selectedType = ASSISTANT_TYPES.find(t => t.value === type) || ASSISTANT_TYPES[0];

  return (
    <Dialog open onOpenChange={v => !v && !loading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            {step === "done" ? "AI Asisten Siap! 🎉" : "Buat AI Asisten"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        {step !== "done" && (
          <div className="flex items-center gap-2 mb-1">
            {([1, 2, 3] as const).map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                  step === s ? "bg-primary text-primary-foreground" : step > s ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {(step as number) > s ? <Check className="h-3 w-3" /> : s}
                </div>
                {s < 3 && <div className={`h-0.5 flex-1 rounded transition-colors ${(step as number) > s ? "bg-emerald-400" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-4 py-1">
            <p className="text-sm text-muted-foreground">
              Beri nama AI Asisten yang akan dibuat dari dokumen di <span className="font-semibold text-foreground">{folderName}</span>.
            </p>
            <div>
              <Label className="text-xs mb-1.5 block font-semibold">Nama AI Asisten</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="cth: HR Assistant, Tender Helper, Legal AI…"
                autoFocus
                onKeyDown={e => e.key === "Enter" && name.trim() && setStep(2)}
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Nama ini yang akan tampil saat Anda membuka chat.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: File selection */}
        {step === 2 && (
          <div className="space-y-3 py-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pilih dokumen yang akan dijadikan sumber pengetahuan AI.</p>
            </div>
            {readyFiles.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Tidak ada dokumen berstatus "AI Siap" di folder ini.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b border-border">
                  <button onClick={toggleAll} className="hover:text-foreground transition-colors font-medium">
                    {effectiveSelected.length === readyFiles.length ? "Batalkan semua" : "Pilih semua"}
                  </button>
                  <span className={effectiveSelected.length === 0 ? "text-destructive" : ""}>
                    {effectiveSelected.length}/{readyFiles.length} dipilih
                  </span>
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {readyFiles.map(f => {
                    const checked = effectiveSelected.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        onClick={() => toggleFile(f.id)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all ${
                          checked
                            ? "border-primary/40 bg-primary/5"
                            : "border-border hover:border-border hover:bg-muted/30 opacity-60"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked ? "bg-primary border-primary" : "border-muted-foreground"
                        }`}>
                          {checked && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate leading-tight">{f.original_name}</p>
                          <p className="text-[10px] text-muted-foreground">{f.kb_chunk_count ?? 0} potongan</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Type + Confirm */}
        {step === 3 && (
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">Pilih jenis asisten, lalu konfirmasi untuk membuat.</p>
            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {ASSISTANT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`text-left p-2 rounded-xl border transition-all ${
                    type === t.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <div className="text-sm mb-0.5">{t.icon}</div>
                  <p className="text-[11px] font-semibold leading-tight text-foreground">{t.label}</p>
                </button>
              ))}
            </div>
            <div className="bg-muted/40 rounded-xl border border-border px-3 py-2 text-[11px] text-muted-foreground space-y-0.5">
              <p><span className="font-semibold text-foreground">{name}</span> · {selectedType.icon} {selectedType.label}</p>
              <p>{effectiveSelected.length} dari {readyFiles.length} dokumen dipilih · Model GPT-4o</p>
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && result && (
          <div className="space-y-4 py-1">
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-emerald-700 dark:text-emerald-400">{result.name}</p>
                <p className="text-xs text-muted-foreground">{result.file_count} dokumen · {result.chunk_count} potongan teks diproses</p>
              </div>
            </div>
            <div className="space-y-2">
              <a href={result.chat_url} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <MessageSquare className="h-4 w-4" /> Mulai Chat Sekarang
                </Button>
              </a>
              <a href={`/builder/${result.slug}`} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" className="w-full gap-2 text-xs">
                  <Wand2 className="h-3.5 w-3.5" /> Kustomisasi di Dashboard
                </Button>
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              AI Asisten ini sepenuhnya dapat diedit — persona, prompt, knowledge, mini apps — semuanya bisa disesuaikan di Builder.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step !== "done" && (
            <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Batal</Button>
          )}
          {step === 1 && (
            <Button size="sm" onClick={() => setStep(2)} disabled={!name.trim()} className="gap-1.5">
              Lanjut <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {step === 2 && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>← Kembali</Button>
              <Button size="sm" onClick={() => setStep(3)} disabled={effectiveSelected.length === 0} className="gap-1.5">
                Lanjut <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} disabled={loading}>← Kembali</Button>
              <Button size="sm" onClick={generate} disabled={loading || effectiveSelected.length === 0} className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0">
                {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Membuat…</> : <><Wand2 className="h-3.5 w-3.5" /> Generate Sekarang</>}
              </Button>
            </>
          )}
          {step === "done" && (
            <Button variant="outline" size="sm" onClick={onClose}>Tutup</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
