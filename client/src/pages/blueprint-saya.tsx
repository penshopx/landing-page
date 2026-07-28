import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trackLead } from "@/lib/meta-pixel";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharedHeader } from "@/components/shared-header";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useContactNumbers } from "@/lib/contact";
import {
  Sparkles, Lock, Unlock, ShoppingBag, Wrench, MessageCircle,
  Check, Trash2, ArrowRight, Bot, FileDown, RefreshCw, BookOpen,
  ChevronRight, CreditCard, Loader2,
} from "lucide-react";

const BLUEPRINT_STORAGE_KEY = "gustafta_blueprint_pending";

interface Blueprint {
  namaAI: string;
  domain: string;
  persona: string;
  sasaranPengguna: string;
  fiturUtama: string[];
  systemPromptHint: string;
  langkahSelanjutnya: string[];
  status?: string;
  createdAt?: string;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(iso));
  } catch { return iso; }
}

export default function BlueprintSayaPage() {
  const contact = useContactNumbers();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: adminMe } = useQuery<{ isAdmin: boolean; isSuperAdmin: boolean }>({
    queryKey: ["/api/admin/me"],
    retry: 1,
  });
  const isAdmin = adminMe?.isAdmin === true || adminMe?.isSuperAdmin === true;

  // Ambil active toolbox — diperlukan saat buat agent
  const { data: activeToolbox } = useQuery<{ id: number | string; name: string } | null>({
    queryKey: ["/api/toolboxes/active"],
    enabled: isAuthenticated,
  });

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BLUEPRINT_STORAGE_KEY);
      if (raw) setBlueprint(JSON.parse(raw));
    } catch { setBlueprint(null); }
  }, []);

  const handleDelete = () => {
    localStorage.removeItem(BLUEPRINT_STORAGE_KEY);
    setBlueprint(null);
    setShowDeleteConfirm(false);
  };

  // Mutasi: buat agent langsung dari blueprint → redirect ke halaman konfigurasi
  const importMutation = useMutation({
    mutationFn: async (bp: Blueprint) => {
      // Cek active toolbox terlebih dahulu
      let toolboxId: string | undefined = activeToolbox?.id ? String(activeToolbox.id) : undefined;

      // Jika belum ada active toolbox, ambil toolbox pertama yang tersedia
      if (!toolboxId) {
        const tbData: any[] = await apiRequest("GET", "/api/toolboxes");
        const first = Array.isArray(tbData) ? tbData[0] : null;
        toolboxId = first?.id ? String(first.id) : undefined;
      }

      if (!toolboxId) {
        throw Object.assign(new Error("Belum ada Chatbot aktif."), { code: "MODULE_NO_TOOLBOX" });
      }

      // Pakai fetch langsung agar bisa baca JSON error body secara detail
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: bp.namaAI,
          tagline: bp.domain,
          description: `${bp.persona}\n\nSasaran pengguna: ${bp.sasaranPengguna}`,
          systemPrompt: bp.systemPromptHint,
          toolboxId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw Object.assign(new Error(data.message || data.error || "Gagal membuat agent"), data);
      }

      return data;
    },
    onSuccess: (agent: { id: number | string }) => {
      // Tandai blueprint sebagai sudah diimport
      try {
        const raw = localStorage.getItem(BLUEPRINT_STORAGE_KEY);
        if (raw) {
          const bp = JSON.parse(raw);
          localStorage.setItem(BLUEPRINT_STORAGE_KEY, JSON.stringify({ ...bp, status: "imported" }));
          setBlueprint(prev => prev ? { ...prev, status: "imported" } : prev);
        }
      } catch { /* ignore */ }

      toast({
        title: "✅ Agent Berhasil Dibuat!",
        description: "Mengarahkan ke halaman konfigurasi AI…",
      });

      // Redirect langsung ke dashboard → deep-link ke agent yang baru dibuat
      setTimeout(() => {
        window.location.href = `/dashboard?agent=${agent.id}`;
      }, 600);
    },
    onError: (err: any) => {
      if (err.message === "NO_TOOLBOX" || err.code === "MODULE_NO_TOOLBOX") {
        toast({
          title: "Pilih Chatbot Dulu",
          description: "Buka Builder dan aktifkan Chatbot sebelum mengimport Blueprint.",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
        return;
      }
      if (err.code === "NO_SUBSCRIPTION" || err.reason === "dialog_required") {
        toast({
          title: "Langganan Diperlukan",
          description: "Aktifkan paket untuk mulai merakit AI Anda.",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/pricing"; }, 1500);
        return;
      }
      toast({
        title: "Gagal Import Blueprint",
        description: err.message || "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
    },
  });

  // Admin/superadmin selalu bisa lihat Blueprint penuh tanpa perlu beli paket
  const isUnlocked = blueprint?.status === "unlocked" || isAdmin;
  const waText = blueprint
    ? encodeURIComponent(`Halo Gustafta! Saya sudah menyelesaikan sesi Socratic Dialog. Nama AI: ${blueprint.namaAI} | Domain: ${blueprint.domain}. Saya ingin membeli paket untuk mengakses Blueprint lengkap.`)
    : "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background" data-testid="page-blueprint-saya">
      <SharedHeader />

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* ── EMPTY STATE ── */}
        {!blueprint && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Blueprint</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Blueprint dibuat melalui sesi Socratic Dialog di halaman utama. AI akan menggali potensi Anda lalu menghasilkan Blueprint konfigurasi chatbot yang personal.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <Sparkles className="h-4 w-4" /> Mulai Socratic Dialog
                </Button>
              </Link>
              <Link href="/packs">
                <Button variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" /> Lihat Paket
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ── BLUEPRINT EXISTS ── */}
        {blueprint && (
          <div className="space-y-5">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {isUnlocked
                    ? <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><Unlock className="h-3 w-3" /> Aktif</Badge>
                    : <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1"><Lock className="h-3 w-3" /> Menunggu Pembayaran</Badge>
                  }
                  {blueprint.createdAt && (
                    <span className="text-xs text-gray-400">· {formatDate(blueprint.createdAt)}</span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{blueprint.namaAI}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Domain: <strong>{blueprint.domain}</strong></p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1.5"
                title="Hapus Blueprint"
                data-testid="button-delete-blueprint"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Delete confirm */}
            {showDeleteConfirm && (
              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Hapus Blueprint ini?</p>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Blueprint akan dihapus permanen dari perangkat ini. Anda perlu mengulang sesi Socratic Dialog untuk membuat baru.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowDeleteConfirm(false)}>Batal</Button>
                  <Button size="sm" className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Hapus</Button>
                </div>
              </div>
            )}

            {/* ── UNLOCKED — Full Blueprint ── */}
            {isUnlocked && (
              <div className="rounded-2xl border-2 border-green-200 dark:border-green-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center gap-2">
                  <Unlock className="h-4 w-4 text-white" />
                  <span className="text-white text-sm font-bold">Blueprint Lengkap — Siap Diimport</span>
                </div>
                <div className="p-5 space-y-4">
                  <Section label="Persona AI">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{blueprint.persona}"</p>
                  </Section>
                  <Section label="Sasaran Pengguna">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{blueprint.sasaranPengguna}</p>
                  </Section>
                  <Section label="Fitur Utama">
                    <div className="flex flex-wrap gap-1.5">
                      {blueprint.fiturUtama.map((f, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">{f}</span>
                      ))}
                    </div>
                  </Section>
                  <Section label="System Prompt (Awal)">
                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-zinc-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-mono">{blueprint.systemPromptHint}</p>
                    </div>
                  </Section>
                  <Section label="Langkah Selanjutnya">
                    <div className="space-y-1.5">
                      {blueprint.langkahSelanjutnya.map((s, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">{i + 1}</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{s}</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
                <div className="px-5 pb-5 space-y-2">
                  {isAuthenticated ? (
                    blueprint?.status === "imported" ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                          <Check className="h-4 w-4 text-green-600 shrink-0" />
                          <p className="text-sm text-green-700 dark:text-green-400 font-medium">Blueprint sudah diimport ke Builder</p>
                        </div>
                        <Link href="/dashboard">
                          <Button variant="outline" className="w-full gap-2">
                            <Wrench className="h-4 w-4" /> Buka Builder
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <button
                        disabled={importMutation.isPending}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-60 text-white h-11 font-bold rounded-md flex items-center justify-center gap-2 transition-colors"
                        onClick={() => blueprint && importMutation.mutate(blueprint)}
                      >
                        {importMutation.isPending ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Membuat Agent…</>
                        ) : (
                          <><FileDown className="h-4 w-4" /> Import & Rakit Sekarang</>
                        )}
                      </button>
                    )
                  ) : (
                    <Link href="/login">
                      <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-11 font-bold gap-2">
                        <FileDown className="h-4 w-4" /> Login untuk Import
                      </Button>
                    </Link>
                  )}
                  {!importMutation.isPending && blueprint?.status !== "imported" && isAuthenticated && (
                    <p className="text-xs text-center text-gray-400">Agent langsung dibuat &amp; Anda diarahkan ke halaman konfigurasi AI</p>
                  )}
                </div>
              </div>
            )}

            {/* ── LOCKED — Teaser ── */}
            {!isUnlocked && (
              <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-white" />
                  <span className="text-white text-sm font-bold">Blueprint Siap — Menunggu Aktivasi</span>
                  <Lock className="h-3.5 w-3.5 text-white/80 ml-auto" />
                </div>
                <div className="p-5 space-y-4">
                  {/* Teaser visible */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Domain</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{blueprint.domain}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Fitur</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{blueprint.fiturUtama?.length ?? 0} fitur dirancang</p>
                    </div>
                  </div>

                  {/* Locked items */}
                  <div className="space-y-2">
                    {[
                      { label: "Persona AI", preview: "████████████████████████" },
                      { label: "System Prompt", preview: "██████████ ████████ ████████████ ██████" },
                      { label: "Langkah Perakitan", preview: "3 langkah tersimpan" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 relative overflow-hidden">
                        <Lock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{item.label}</p>
                          <p className="text-xs text-gray-300 dark:text-zinc-600 select-none">{item.preview}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Value props */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">Dengan Starter Kit, Anda bisa:</p>
                    <div className="space-y-1.5">
                      {[
                        "Akses Blueprint lengkap: persona, fitur, system prompt, langkah",
                        "Import Blueprint 1-klik ke Gustafta Builder",
                        "Trial platform 7 hari — coba semua fitur",
                        "3 panduan digital Trilogi Gustafta",
                      ].map((v, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="px-5 pb-5 space-y-2">
                  <a href="/pricing" className="block">
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-11 font-bold gap-2 shadow-md">
                      <CreditCard className="h-4 w-4" /> Lihat Paket &amp; Bayar via Scalev
                    </Button>
                  </a>
                  <p className="text-center text-[11px] text-gray-400">Sekali bayar · Termasuk lisensi + trial 7 hari</p>
                  <div className="flex gap-2 pt-1">
                    <a href={`https://wa.me/${contact.secondary}?text=${waText}`} onClick={() => trackLead({ content_name: "WhatsApp CTA" })} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" className="w-full h-9 text-sm gap-2 border-gray-200 text-gray-500 hover:bg-gray-50">
                        <MessageCircle className="h-4 w-4" /> Tanya via WA
                      </Button>
                    </a>
                    <Link href="/" className="flex-1">
                      <Button variant="ghost" className="w-full h-9 text-sm gap-1 text-gray-400">
                        <RefreshCw className="h-3.5 w-3.5" /> Ulangi Dialog
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Journey chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Socratic Dialog selesai</span>
              <ChevronRight className="h-3 w-3" />
              <span className={isUnlocked ? "flex items-center gap-1 text-green-600 font-medium" : ""}>
                {isUnlocked ? <><Check className="h-3 w-3 text-green-500" /> Paket aktif</> : "Aktifkan paket"}
              </span>
              <ChevronRight className="h-3 w-3" />
              <span>Import ke Builder</span>
              <ChevronRight className="h-3 w-3" />
              <span>Rakit chatbot Anda</span>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
      {children}
    </div>
  );
}
