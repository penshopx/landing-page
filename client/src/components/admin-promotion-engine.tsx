import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, Loader2, Pause, Send, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type CatalogItem = { canonicalKind: "product" | "package"; canonicalId: string | number; name: string; description?: string; category?: string; type?: string; price?: number; currency?: string; ctaUrl?: string; ctaLabel?: string; eligibility?: string };
type Recommendation = CatalogItem & { score?: number; confidence?: number; reasons?: string[]; breakdown?: Record<string, number> };
type Campaign = { id: string | number; name: string; status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED"; placements?: string[]; segment?: string; problem?: string; hook?: string; cta?: string; reason?: string; startsAt?: string; endsAt?: string; items?: CatalogItem[]; performance?: { funnel7d?: Record<string, number>; funnel30d?: Record<string, number>; revenue30d?: { orders?: number; revenue?: number } } };
const list = <T,>(payload: T[] | { items?: T[]; campaigns?: T[]; recommendations?: T[] } | undefined, key: "items" | "campaigns" | "recommendations") => Array.isArray(payload) ? payload : payload?.[key] ?? [];
const period = (o: any, days: 7 | 30) => o?.[days] ?? o?.[`window${days}`] ?? o?.windows?.[days] ?? o?.windows?.[String(days)] ?? {};
const TAXONOMY_LABELS: Record<string, string> = {
  general: "Umum",
  contractor: "Kontraktor",
  consultant: "Konsultan",
  sme_owner: "Pemilik UMKM",
  professional: "Profesional",
  enterprise: "Perusahaan",
  tender_readiness: "Kesiapan tender",
  certification_sbu_skk: "Sertifikasi SBU/SKK",
  document_analysis: "Analisis dokumen",
  knowledge_management: "Manajemen pengetahuan",
  productivity_automation: "Produktivitas & otomasi",
  hse_safety: "K3 & keselamatan",
  market_research: "Riset pasar",
  general_discovery: "Penemuan solusi umum",
};
const toLocalDateTime = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

export function AdminPromotionEngine() {
  const client = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<CatalogItem[]>([]);
  const [primaryKey, setPrimaryKey] = useState("");
  const roundedNow = () => { const d = new Date(); d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0); return toLocalDateTime(d); };
  const plusDays = () => { const d = new Date(); d.setDate(d.getDate() + 7); d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0); return toLocalDateTime(d); };
  const [form, setForm] = useState({ name: "", segment: "general", problem: "", hook: "", ctaLabel: "Lihat solusi", selectionReason: "", startsAt: roundedNow(), endsAt: plusDays(), placements: ["homepage", "store"] as string[] });
  const catalogQ = useQuery<any>({ queryKey: ["/api/admin/promotions/catalog"], queryFn: () => apiRequest("GET", "/api/admin/promotions/catalog"), staleTime: 0 });
  const overviewQ = useQuery<any>({ queryKey: ["/api/admin/promotions/overview"], queryFn: () => apiRequest("GET", "/api/admin/promotions/overview"), staleTime: 0 });
  const recommendationQ = useQuery<any>({ queryKey: ["/api/admin/promotions/recommendations"], queryFn: () => apiRequest("GET", "/api/admin/promotions/recommendations"), staleTime: 0 });
  const campaignsQ = useQuery<any>({ queryKey: ["/api/admin/promotions/campaigns"], queryFn: () => apiRequest("GET", "/api/admin/promotions/campaigns"), staleTime: 0 });
  const invalidate = () => Promise.all(["catalog", "overview", "recommendations", "campaigns"].map(key => client.invalidateQueries({ queryKey: [`/api/admin/promotions/${key}`] })));
  const create = useMutation({ mutationFn: () => {
    const payload: Record<string, unknown> = {
      ...form,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      items: selected.map(item => ({ canonicalKind: item.canonicalKind, canonicalId: item.canonicalId, role: `${item.canonicalKind}-${item.canonicalId}` === primaryKey ? "primary" : "support" })),
    };
    if (!form.problem) delete payload.problem;
    return apiRequest("POST", "/api/admin/promotions/campaigns", payload);
  }, onSuccess: () => { toast({ title: "Draft kampanye disimpan" }); setSelected([]); setPrimaryKey(""); invalidate(); }, onError: () => toast({ title: "Draft belum tersimpan", description: "Periksa data lalu coba lagi.", variant: "destructive" }) });
  const action = useMutation({ mutationFn: ({ id, type }: { id: string | number; type: "publish" | "pause" }) => apiRequest("POST", `/api/admin/promotions/campaigns/${id}/${type}`), onSuccess: (_, v) => { toast({ title: v.type === "publish" ? "Kampanye dipublikasikan" : "Kampanye dijeda" }); invalidate(); }, onError: () => toast({ title: "Status belum diperbarui", variant: "destructive" }) });
  const catalog = useMemo(() => list<CatalogItem>(catalogQ.data, "items"), [catalogQ.data]);
  const recommendations = useMemo(() => list<Recommendation>(recommendationQ.data, "recommendations"), [recommendationQ.data]);
  const campaigns = useMemo(() => list<Campaign>(campaignsQ.data, "campaigns"), [campaignsQ.data]);
  const segments = catalogQ.data?.segments ?? [{ value: "general", label: "Umum" }];
  const problems = catalogQ.data?.problems ?? [];
  const valid = !!form.name.trim() && selected.length > 0 && !!primaryKey && form.placements.length > 0 && !!form.hook.trim() && !!form.ctaLabel.trim() && !!form.selectionReason.trim() && !!form.startsAt && !!form.endsAt && new Date(form.endsAt) > new Date(form.startsAt);
  const toggle = (item: CatalogItem) => setSelected(old => { const key = `${item.canonicalKind}-${item.canonicalId}`; if (old.some(x => `${x.canonicalKind}-${x.canonicalId}` === key)) { const next = old.filter(x => `${x.canonicalKind}-${x.canonicalId}` !== key); if (primaryKey === key) setPrimaryKey(next[0] ? `${next[0].canonicalKind}-${next[0].canonicalId}` : ""); return next; } if (old.length >= 3) return old; if (!primaryKey) setPrimaryKey(key); return [...old, item]; });
  const stats = (days: 7 | 30) => period(overviewQ.data, days);

  return <section className="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-card to-violet-50/50 p-4 sm:p-6 space-y-6" data-testid="admin-promotion-engine">
    <div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-700">Promotion console</p><h2 className="mt-1 text-xl font-bold">Satu rekomendasi, dengan alasan yang terlihat</h2></div><div className="text-xs text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-indigo-600" /> Utamakan keputusan yang dapat ditinjau</div></div>
    <div className="grid gap-3 md:grid-cols-2" data-testid="promotion-funnel">{([7, 30] as const).map(days => { const f = stats(days); const impressions = Number(f.impression ?? 0); const clicks = Number(f.click ?? 0); const trials = Number(f.trial ?? 0); const leads = Number(f.lead ?? 0); const orders = Number(f.order ?? 0); const rate = (n: number, d: number) => d ? `${((n / d) * 100).toFixed(1)}%` : "—"; return <div key={days} className="rounded-lg border bg-card p-4"><div className="flex justify-between text-sm font-semibold"><span>Funnel {days} hari</span><BarChart3 className="h-4 w-4 text-indigo-500" /></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs">{["impression","click","search","trial","lead","order","return_visit"].map(key => <div key={key}><p className="text-muted-foreground capitalize">{key.replace("_", " ")}</p><p className="mt-0.5 font-bold">{f[key] ?? 0}</p></div>)}</div><p className="mt-3 text-[11px] text-muted-foreground">CTR {rate(clicks, impressions)} · Trial {rate(trials, clicks)} · Lead {rate(leads, trials)} · Order {rate(orders, leads)}</p></div>})}</div>
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-lg border bg-card p-4"><h3 className="font-semibold">Rekomendasi berdasarkan bukti</h3><p className="mt-1 text-xs text-muted-foreground">Pilih tepat satu utama, lalu maksimal dua pendukung.</p><div className="mt-3 space-y-2 max-h-64 overflow-auto">{recommendationQ.isLoading || catalogQ.isLoading ? <div className="h-20 animate-pulse rounded bg-muted" /> : (recommendations.length ? recommendations : catalog).map(item => { const key = `${item.canonicalKind}-${item.canonicalId}`; const active = selected.some(x => `${x.canonicalKind}-${x.canonicalId}` === key); const recommendation = item as Recommendation; return <div key={key} className={`rounded-md border p-3 ${active ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : ""}`}><button type="button" onClick={() => toggle(item)} className="w-full text-left"><div className="flex justify-between gap-3"><span className="font-medium text-sm">{item.name}</span><span className="text-xs font-semibold text-indigo-600">Skor {Number(recommendation.score ?? 0)} · yakin {Number(recommendation.confidence ?? 0)}%</span></div><p className="mt-1 text-xs text-muted-foreground">{item.description || item.category || "Tidak ada ringkasan"}</p><p className="mt-2 text-[11px] text-muted-foreground">{recommendation.reasons?.join(" · ")}</p><p className="mt-1 text-[10px] text-muted-foreground">Permintaan {recommendation.breakdown?.demand ?? 0} · Kesiapan {recommendation.breakdown?.readiness ?? 0} · Performa {recommendation.breakdown?.performance ?? 0} · Bukti {recommendation.breakdown?.externalEvidence ?? 0}</p></button>{active && <button type="button" onClick={() => setPrimaryKey(key)} className="mt-2 text-[11px] font-semibold text-indigo-700 underline" data-testid={`promotion-primary-${item.canonicalId}`}>{primaryKey === key ? "Solusi utama" : "Jadikan solusi utama"}</button>}</div>; })}</div></div>
    <form className="rounded-lg border bg-card p-4 space-y-3 min-w-0" onSubmit={e => { e.preventDefault(); create.mutate(); }} data-testid="admin-promotion-form"><h3 className="font-semibold">Rancang kampanye</h3><Input required placeholder="Nama kampanye" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><select className="h-9 rounded-md border bg-background px-2 text-sm min-w-0" value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })}>{segments.map((s: any) => { const key = s.value ?? s.key ?? s; return <option key={key} value={key}>{s.label ?? s.name ?? TAXONOMY_LABELS[key] ?? key}</option>; })}</select><select className="h-9 rounded-md border bg-background px-2 text-sm min-w-0" value={form.problem} onChange={e => setForm({ ...form, problem: e.target.value })}><option value="">Otomatis dari solusi utama</option>{problems.map((p: any) => { const key = p.value ?? p.key ?? p; return <option key={key} value={key}>{p.label ?? p.name ?? TAXONOMY_LABELS[key] ?? key}</option>; })}</select></div><Input required placeholder="CTA" value={form.ctaLabel} onChange={e => setForm({ ...form, ctaLabel: e.target.value })} /><Input required placeholder="Hook yang tampil" value={form.hook} onChange={e => setForm({ ...form, hook: e.target.value })} /><Textarea required placeholder="Mengapa solusi ini dipilih?" value={form.selectionReason} onChange={e => setForm({ ...form, selectionReason: e.target.value })} /><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><Input required type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} /><Input required type="datetime-local" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} /></div><div className="flex flex-wrap gap-3 text-xs">{["homepage","store"].map(place => <label key={place} className="flex gap-1.5 items-center"><input type="checkbox" checked={form.placements.includes(place)} onChange={() => setForm({ ...form, placements: form.placements.includes(place) ? form.placements.filter(p => p !== place) : [...form.placements, place] })} /> {place === "homepage" ? "Beranda" : "Store"}</label>)}</div><Button type="submit" disabled={!valid || create.isPending} className="w-full bg-indigo-700 hover:bg-indigo-800">{create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Simpan draft ({selected.length}/3)</Button>{create.isError && <p className="text-xs text-destructive">Draft belum tersimpan. Periksa koneksi lalu coba lagi.</p>}</form></div>
    <div className="rounded-lg border bg-card p-4" data-testid="promotion-campaign-history"><h3 className="font-semibold">Riwayat kampanye</h3><div className="mt-3 space-y-2">{campaignsQ.isLoading ? <div className="h-14 animate-pulse rounded bg-muted" /> : campaigns.length ? campaigns.map(c => { const f = c.performance?.funnel30d ?? {}; const primary = c.items?.find(i => (i as any).role === "primary"); const ratio = (n: number, d: number) => d ? `${((n / d) * 100).toFixed(1)}%` : "—"; return <div key={c.id} className="border-t pt-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.status} · {(c.placements ?? []).join(", ")} · {c.startsAt ? new Date(c.startsAt).toLocaleDateString("id-ID") : "tanpa jadwal"} — {c.endsAt ? new Date(c.endsAt).toLocaleDateString("id-ID") : "—"}</p><p className="mt-1 text-xs text-muted-foreground">Utama: {primary?.name ?? "Belum dipilih"}</p></div>{c.status === "ACTIVE" ? <Button size="sm" variant="outline" onClick={() => action.mutate({ id: c.id, type: "pause" })} data-testid={`promotion-pause-${c.id}`}><Pause className="mr-1 h-3.5 w-3.5" /> Jeda</Button> : (c.status === "DRAFT" || c.status === "PAUSED") ? <Button size="sm" onClick={() => action.mutate({ id: c.id, type: "publish" })} data-testid={`promotion-publish-${c.id}`}><Send className="mr-1 h-3.5 w-3.5" /> Publikasikan</Button> : null}</div><p className="mt-2 text-[11px] text-muted-foreground">30 hari: {f.impression ?? 0} impresi · {f.click ?? 0} klik · {f.trial ?? 0} trial · {f.return_visit ?? 0} kembali · {f.lead ?? 0} lead · {f.order ?? 0} order · CTR {ratio(Number(f.click ?? 0), Number(f.impression ?? 0))} · Rp {Number(c.performance?.revenue30d?.revenue ?? 0).toLocaleString("id-ID")}</p></div> }) : <p className="py-5 text-sm text-muted-foreground">Belum ada kampanye. Mulai dari rekomendasi di atas.</p>}</div></div>
  </section>;
}