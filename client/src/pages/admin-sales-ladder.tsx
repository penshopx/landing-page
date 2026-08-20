import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CircleAlert, Eye, Layers3, Pencil, Plus, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type RegistryProduct = {
  id: number; productId: string; name: string; status: string; price: number;
  currency: string; productType: string; category: string; coverageStatus: "MAPPED" | "INDEPENDENT" | "UNDECIDED";
  coverageNote?: string; ladderRefs?: Array<{ id: number; name: string; slug: string; stage: string }>;
};
type RegistryPackage = { id?: number; packageId: string; name: string; status?: string; price?: number; currency?: string };
type LadderNode = {
  id: number; ladderId: number; stage: string; nodeType: "TRIGGER" | "PRODUCT" | "PACKAGE" | "PLACEHOLDER";
  productRegistryId?: string; packageRegistryId?: string; label?: string; description?: string; sortOrder: number; isActive: boolean;
  product?: RegistryProduct; package?: RegistryPackage;
};
type LadderEdge = { id: number; ladderId: number; fromNodeId: number; toNodeId: number; relationType: string; ruleText?: string; sortOrder: number; isActive: boolean };
type Ladder = { id: number; slug: string; name: string; description?: string; status: string; nodes: LadderNode[]; edges: LadderEdge[]; warnings?: string[] };
type LadderPayload = {
  stages: string[]; relationTypes: string[]; ladderStatuses: string[]; ladders: Ladder[];
  inventory: RegistryProduct[]; packages: RegistryPackage[]; summary: {
    totalActiveProducts: number; mappedProducts: number; independentProducts: number; undecidedProducts: number;
  };
};
type NodeDraft = {
  stage: string;
  nodeType: LadderNode["nodeType"];
  productRegistryId: string;
  packageRegistryId: string;
  label: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};
type EdgeDraft = { fromNodeId: string; toNodeId: string; relationType: string; ruleText: string; sortOrder: number; isActive: boolean };

const stages = ["L0", "L1", "L2", "L3", "L4", "L5"];
const types = ["TRIGGER", "PRODUCT", "PACKAGE", "PLACEHOLDER"] as const;
const fallbackRelations = ["NEXT_STEP", "BONUS", "UPSELL", "CROSS_SELL", "BUNDLE", "RECURRING"];
const money = (price?: number, currency = "IDR") => `${currency} ${Number(price || 0).toLocaleString("id-ID")}`;
const chip: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800", DRAFT: "bg-amber-100 text-amber-800", ARCHIVED: "bg-slate-100 text-slate-600",
  MAPPED: "bg-emerald-100 text-emerald-800", INDEPENDENT: "bg-sky-100 text-sky-800", UNDECIDED: "bg-rose-100 text-rose-800",
};

export default function AdminSalesLadder() {
  const { toast } = useToast();
  const client = useQueryClient();
  const me = useQuery<{ isSuperAdmin?: boolean }>({ queryKey: ["/api/admin/me"] });
  const desk = useQuery<LadderPayload>({ queryKey: ["/api/admin/sales-ladder"], enabled: me.data?.isSuperAdmin === true });
  const [selectedId, setSelectedId] = useState<number>();
  const [inventorySearch, setInventorySearch] = useState("");
  const [coverageFilter, setCoverageFilter] = useState("ALL");
  const [dialog, setDialog] = useState<"ladder" | "node" | "edge" | "preview" | null>(null);
  const [editingLadder, setEditingLadder] = useState<Ladder>();
  const [editingNode, setEditingNode] = useState<LadderNode>();
  const [editingEdge, setEditingEdge] = useState<LadderEdge>();
  const [ladderDraft, setLadderDraft] = useState({ name: "", description: "" });
  const [nodeDraft, setNodeDraft] = useState<NodeDraft>(emptyNode());
  const [edgeDraft, setEdgeDraft] = useState<EdgeDraft>(emptyEdge());
  const [preview, setPreview] = useState<Ladder | null>(null);
  const current = desk.data?.ladders.find(l => l.id === selectedId) || desk.data?.ladders[0];
  const relations = desk.data?.relationTypes?.length ? desk.data.relationTypes : fallbackRelations;
  const close = () => { setDialog(null); setEditingLadder(undefined); setEditingNode(undefined); setEditingEdge(undefined); };
  const refresh = () => client.invalidateQueries({ queryKey: ["/api/admin/sales-ladder"] });
  const mutation = useMutation({
    mutationFn: ({ method, url, body }: { method: string; url: string; body?: unknown }) => apiRequest(method, url, body),
    onSuccess: () => { refresh(); toast({ title: "Perubahan tersimpan" }); close(); },
    onError: (error: Error) => toast({ title: "Perubahan gagal", description: error.message, variant: "destructive" }),
  });
  const busy = mutation.isPending;
  const submitLadder = () => {
    if (!ladderDraft.name.trim()) return toast({ title: "Nama ladder wajib diisi", variant: "destructive" });
    mutation.mutate({ method: editingLadder ? "PATCH" : "POST", url: editingLadder ? `/api/admin/sales-ladder/ladders/${editingLadder.id}` : "/api/admin/sales-ladder/ladders", body: ladderDraft });
  };
  const submitNode = () => {
    const registryId = nodeDraft.nodeType === "PRODUCT" ? nodeDraft.productRegistryId : nodeDraft.nodeType === "PACKAGE" ? nodeDraft.packageRegistryId : "";
    if (nodeDraft.nodeType === "PRODUCT" && !registryId) return toast({ title: "Pilih produk registry", variant: "destructive" });
    if (nodeDraft.nodeType === "PACKAGE" && !registryId) return toast({ title: "Pilih package registry", variant: "destructive" });
    if ((nodeDraft.nodeType === "TRIGGER" || nodeDraft.nodeType === "PLACEHOLDER") && !nodeDraft.label.trim()) return toast({ title: "Label wajib diisi", variant: "destructive" });
    const body = {
      stage: nodeDraft.stage, nodeType: nodeDraft.nodeType, label: nodeDraft.nodeType === "TRIGGER" || nodeDraft.nodeType === "PLACEHOLDER" ? nodeDraft.label : undefined,
      description: nodeDraft.description || undefined, productRegistryId: nodeDraft.nodeType === "PRODUCT" ? nodeDraft.productRegistryId : null,
      packageRegistryId: nodeDraft.nodeType === "PACKAGE" ? nodeDraft.packageRegistryId : null, sortOrder: nodeDraft.sortOrder, isActive: nodeDraft.isActive,
    };
    mutation.mutate({ method: editingNode ? "PATCH" : "POST", url: editingNode ? `/api/admin/sales-ladder/nodes/${editingNode.id}` : `/api/admin/sales-ladder/ladders/${current?.id}/nodes`, body });
  };
  const submitEdge = () => {
    if (!edgeDraft.fromNodeId || !edgeDraft.toNodeId || edgeDraft.fromNodeId === edgeDraft.toNodeId) return toast({ title: "Pilih source dan target berbeda", variant: "destructive" });
    const body = { ...edgeDraft, fromNodeId: Number(edgeDraft.fromNodeId), toNodeId: Number(edgeDraft.toNodeId) };
    mutation.mutate({ method: editingEdge ? "PATCH" : "POST", url: editingEdge ? `/api/admin/sales-ladder/edges/${editingEdge.id}` : `/api/admin/sales-ladder/ladders/${current?.id}/edges`, body });
  };
  const remove = (url: string, label: string) => { if (window.confirm(`Hapus ${label}?`)) mutation.mutate({ method: "DELETE", url }); };
  const openNewNode = () => { setEditingNode(undefined); setNodeDraft(emptyNode()); setDialog("node"); };
  const openEditNode = (node: LadderNode) => { setEditingNode(node); setNodeDraft({ stage: node.stage, nodeType: node.nodeType, productRegistryId: node.productRegistryId || "", packageRegistryId: node.packageRegistryId || "", label: node.label || "", description: node.description || "", sortOrder: node.sortOrder, isActive: node.isActive }); setDialog("node"); };
  const openNewEdge = () => { setEditingEdge(undefined); setEdgeDraft(emptyEdge(relations[0])); setDialog("edge"); };
  const openEditEdge = (edge: LadderEdge) => { setEditingEdge(edge); setEdgeDraft({ fromNodeId: String(edge.fromNodeId), toNodeId: String(edge.toNodeId), relationType: edge.relationType, ruleText: edge.ruleText || "", sortOrder: edge.sortOrder, isActive: edge.isActive }); setDialog("edge"); };
  const products = desk.data?.inventory || [];
  const visibleProducts = useMemo(() => products.filter(p => (!inventorySearch || `${p.name} ${p.productId} ${p.category}`.toLowerCase().includes(inventorySearch.toLowerCase())) && (coverageFilter === "ALL" || p.coverageStatus === coverageFilter)), [products, inventorySearch, coverageFilter]);

  if (me.isLoading || (me.data?.isSuperAdmin && desk.isLoading)) return <Loading />;
  if (me.isError || me.data?.isSuperAdmin !== true) return <Denied />;
  if (desk.isError) return <StateCard title="Sales Ladder tidak tersedia" action={<Button onClick={() => desk.refetch()}>Coba lagi</Button>} />;

  return <div className="min-h-[100dvh] bg-[#f4f1e9] text-[#263b37]">
    <header className="bg-[#283f3a] text-[#f7f1e5]"><div className="mx-auto max-w-[1500px] px-4 py-5 md:px-8"><Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-xs text-[#d9a66a]" data-testid="link-back-admin">← Kembali ke Admin</Link><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-[#d9a66a]"><Layers3 className="h-4 w-4" />Gustafta / strategy table</div><h1 className="mt-1 font-serif text-3xl">Sales ladder desk</h1><p className="mt-1 text-sm text-[#c2d0c5]">Rakit customer journey. Temukan celah katalog.</p></div><div className="text-right text-xs text-[#c2d0c5]"><b className="font-mono text-xl text-[#f1c58e]">{desk.data?.summary.totalActiveProducts ?? 0}</b><div>produk aktif di registry</div></div></div></div></header>
    <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 md:px-8">
      {current?.warnings?.map((warning, i) => <div key={i} className="flex gap-2 rounded-lg border border-[#e4b38f] bg-[#fff4e8] px-4 py-3 text-sm text-[#864831]" data-testid="editor-warning"><CircleAlert className="h-4 w-4 shrink-0" />{warning}</div>)}
      <div className="grid gap-5 lg:grid-cols-[285px_1fr]">
        <aside className="space-y-4">
          <Card className="border-[#d9d1c2] bg-[#fffdf7]"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-sm uppercase tracking-[.15em] text-[#6e756c]">Ladders</CardTitle><Button size="icon" variant="ghost" data-testid="button-create-ladder" onClick={() => { setEditingLadder(undefined); setLadderDraft({ name: "", description: "" }); setDialog("ladder"); }}><Plus className="h-4 w-4" /></Button></div></CardHeader><CardContent className="space-y-1">{(desk.data?.ladders || []).map(l => <button key={l.id} data-testid={`card-ladder-${l.id}`} onClick={() => setSelectedId(l.id)} className={`w-full rounded-lg border px-3 py-3 text-left ${current?.id === l.id ? "border-[#ad5b3f] bg-[#f5e6d4]" : "border-transparent hover:border-[#d9d1c2]"}`}><div className="flex justify-between gap-2"><span className="truncate font-medium">{l.name}</span><span className="text-xs">{l.nodes.length}</span></div><Badge className={`mt-2 text-[10px] ${chip[l.status] || ""}`}>{l.status}</Badge></button>)}{!desk.data?.ladders.length && <p className="py-7 text-center text-sm text-[#747b72]">Belum ada ladder.</p>}</CardContent></Card>
          <Card className="border-[#d9d1c2] bg-[#283f3a] text-[#f7f1e5]"><CardContent className="p-5"><p className="text-[10px] uppercase tracking-[.16em] text-[#d9a66a]">Coverage pulse</p><div className="mt-3 grid grid-cols-3 gap-2 text-center">{[["totalActiveProducts", "aktif"], ["mappedProducts", "mapped"], ["undecidedProducts", "belum diputuskan"]].map(([key, label]) => <div key={key}><b className="text-xl">{desk.data?.summary[key as keyof LadderPayload["summary"]] ?? 0}</b><small className="block text-[10px] text-[#c2d0c5]">{label}</small></div>)}</div></CardContent></Card>
        </aside>
        <section className="space-y-5">
          {!current ? <StateCard title="Mulai customer journey" action={<Button onClick={() => setDialog("ladder")}>Buat ladder</Button>} /> : <>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-serif text-3xl">{current.name}</h2><Badge className={chip[current.status]}>{current.status}</Badge></div><p className="mt-1 text-sm text-[#747b72]">{current.description || "Belum ada brief."}</p></div><div className="flex flex-wrap gap-2"><div className="flex rounded border border-[#d9d1c2] bg-[#fffdf7] p-0.5">{(desk.data?.ladderStatuses || ["DRAFT", "ACTIVE", "ARCHIVED"]).map(status => <Button key={status} size="sm" variant={current.status === status ? "default" : "ghost"} data-testid={`button-status-${status}`} disabled={busy} onClick={() => mutation.mutate({ method: "PATCH", url: `/api/admin/sales-ladder/ladders/${current.id}`, body: { status } })}>{status}</Button>)}</div><Button variant="outline" data-testid="button-edit-ladder" onClick={() => { setEditingLadder(current); setLadderDraft({ name: current.name, description: current.description || "" }); setDialog("ladder"); }}><Pencil className="mr-2 h-4 w-4" />Edit</Button><Button variant="outline" data-testid="button-preview-ladder" onClick={async () => { try { setPreview(await apiRequest("GET", `/api/admin/sales-ladder/ladders/${current.id}/preview`)); setDialog("preview"); } catch (e: any) { toast({ title: "Preview gagal", description: e.message, variant: "destructive" }); } }}><Eye className="mr-2 h-4 w-4" />Preview</Button><Button variant="destructive" data-testid="button-delete-ladder" disabled={busy} onClick={() => remove(`/api/admin/sales-ladder/ladders/${current.id}`, "ladder")}><Trash2 className="mr-2 h-4 w-4" />Hapus</Button></div></div>
            <div className="flex gap-2"><Button className="bg-[#ad5b3f] hover:bg-[#914b36]" data-testid="button-add-node" onClick={openNewNode}><Plus className="mr-2 h-4 w-4" />Tambah node</Button><Button variant="outline" data-testid="button-add-edge" onClick={openNewEdge}><ArrowRight className="mr-2 h-4 w-4" />Tambah relasi</Button></div>
            <Journey ladder={current} onEditNode={openEditNode} onDeleteNode={n => remove(`/api/admin/sales-ladder/nodes/${n.id}`, "node")} onEditEdge={openEditEdge} onDeleteEdge={e => remove(`/api/admin/sales-ladder/edges/${e.id}`, "relasi")} onToggleEdge={e => mutation.mutate({ method: "PATCH", url: `/api/admin/sales-ladder/edges/${e.id}`, body: { isActive: !e.isActive } })} />
          </>}
        </section>
      </div>
      <Coverage inventory={visibleProducts} search={inventorySearch} setSearch={setInventorySearch} filter={coverageFilter} setFilter={setCoverageFilter} onChange={(product, status, note) => mutation.mutate({ method: "PATCH", url: `/api/admin/sales-ladder/coverage/${product.productId}`, body: { status, note: note || undefined } })} busy={busy} />
    </main>
    {dialog === "ladder" && <Modal title={editingLadder ? "Edit ladder" : "Ladder baru"} close={close}><Label>Nama *</Label><Input data-testid="input-ladder-name" value={ladderDraft.name} onChange={e => setLadderDraft({ ...ladderDraft, name: e.target.value })} /><Label className="mt-3">Deskripsi</Label><Textarea data-testid="input-ladder-description" value={ladderDraft.description} onChange={e => setLadderDraft({ ...ladderDraft, description: e.target.value })} /><Button className="mt-4 w-full bg-[#ad5b3f]" data-testid="button-save-ladder" disabled={busy} onClick={submitLadder}>{busy ? "Menyimpan…" : "Simpan ladder"}</Button></Modal>}
    {dialog === "node" && <NodeModal draft={nodeDraft} setDraft={setNodeDraft} editing={!!editingNode} products={products} packages={desk.data?.packages || []} busy={busy} close={close} submit={submitNode} />}
    {dialog === "edge" && <EdgeModal draft={edgeDraft} setDraft={setEdgeDraft} editing={!!editingEdge} nodes={current?.nodes || []} relations={relations} busy={busy} close={close} submit={submitEdge} />}
    {dialog === "preview" && preview && <PreviewModal ladder={preview} warnings={preview.warnings || []} close={close} />}
  </div>;
}

function emptyNode(): NodeDraft { return { stage: "L0", nodeType: "TRIGGER", productRegistryId: "", packageRegistryId: "", label: "", description: "", sortOrder: 0, isActive: true }; }
function emptyEdge(relationType = "NEXT_STEP"): EdgeDraft { return { fromNodeId: "", toNodeId: "", relationType, ruleText: "", sortOrder: 0, isActive: true }; }
function Loading() { return <div className="min-h-[100dvh] bg-[#f4f1e9] p-8"><div className="mx-auto max-w-6xl animate-pulse space-y-4"><div className="h-10 w-1/3 rounded bg-[#ded8c8]" /><div className="h-52 rounded bg-[#e8e3d7]" /></div></div>; }
function Denied() { return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f4f1e9] p-6 text-[#263b37]" data-testid="sales-ladder-denied"><Card className="max-w-md border-[#d8cdb9] bg-[#fffdf7] text-[#263b37]"><CardContent className="p-8 text-center"><ShieldCheck className="mx-auto mb-4 h-10 w-10 text-[#ad5b3f]" /><h1 className="font-serif text-2xl font-semibold text-[#263b37]">Akses terbatas</h1><p className="mt-2 text-sm text-[#5f685f]">Sales Ladder desk hanya tersedia untuk Super Admin.</p></CardContent></Card></div>; }
function StateCard({ title, action }: { title: string; action?: ReactNode }) { return <Card className="border-dashed border-[#cbbda7] bg-transparent"><CardContent className="p-12 text-center"><CircleAlert className="mx-auto mb-3 text-[#ad5b3f]" /><h2 className="font-serif text-2xl">{title}</h2>{action && <div className="mt-4">{action}</div>}</CardContent></Card>; }
function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#263b37]/45 p-4"><div className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-xl border border-[#d9d1c2] bg-[#fffdf7] p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-2xl">{title}</h2><Button size="icon" variant="ghost" onClick={close}><X className="h-4 w-4" /></Button></div>{children}</div></div>; }

function Journey({ ladder, onEditNode, onDeleteNode, onEditEdge, onDeleteEdge, onToggleEdge }: { ladder: Ladder; onEditNode: (n: LadderNode) => void; onDeleteNode: (n: LadderNode) => void; onEditEdge: (e: LadderEdge) => void; onDeleteEdge: (e: LadderEdge) => void; onToggleEdge: (e: LadderEdge) => void }) {
  return <><Card className="overflow-x-auto border-[#d9d1c2] bg-[#fffdf7]"><CardHeader><CardTitle className="text-sm uppercase tracking-[.15em] text-[#6e756c]">Journey editor / L0–L5</CardTitle></CardHeader><CardContent><div className="grid min-w-[920px] grid-cols-6 gap-3">{stages.map(stage => <div key={stage} className="min-h-[190px] rounded-xl bg-[#f4f1e9] p-2"><div className="mb-3 border-b border-[#ded6c8] pb-2 font-mono text-xs font-bold text-[#ad5b3f]">{stage}</div>{ladder.nodes.filter(n => n.stage === stage).sort((a, b) => a.sortOrder - b.sortOrder).map(node => <NodeCard key={node.id} node={node} onEdit={() => onEditNode(node)} onDelete={() => onDeleteNode(node)} />)}</div>)}</div></CardContent></Card><Card className="border-[#d9d1c2] bg-[#fffdf7]"><CardHeader><CardTitle className="text-sm uppercase tracking-[.15em] text-[#6e756c]">Relationship rules</CardTitle></CardHeader><CardContent className="space-y-2">{ladder.edges.length ? [...ladder.edges].sort((a, b) => a.sortOrder - b.sortOrder).map(edge => <div key={edge.id} className={`flex flex-wrap items-center gap-2 rounded-lg border border-[#e3dccf] px-3 py-2 text-sm ${!edge.isActive ? "opacity-50" : ""}`} data-testid={`row-edge-${edge.id}`}><span className="font-mono text-[10px] text-[#747b72]">#{edge.sortOrder}</span><span className="text-xs">{ladder.nodes.find(n => n.id === edge.fromNodeId)?.label || ladder.nodes.find(n => n.id === edge.fromNodeId)?.product?.name || edge.fromNodeId}</span><ArrowRight className="h-3 w-3 text-[#ad5b3f]" /><span>{ladder.nodes.find(n => n.id === edge.toNodeId)?.label || ladder.nodes.find(n => n.id === edge.toNodeId)?.product?.name || edge.toNodeId}</span><Badge variant="outline">{edge.relationType}</Badge>{edge.ruleText && <span className="text-xs text-[#747b72]">{edge.ruleText}</span>}<Button size="sm" variant="ghost" className="ml-auto" data-testid={`button-edit-edge-${edge.id}`} onClick={() => onEditEdge(edge)}><Pencil className="mr-1 h-3 w-3" />Edit</Button><Button size="sm" variant="ghost" onClick={() => onToggleEdge(edge)}>{edge.isActive ? "Jeda" : "Aktifkan"}</Button><Button size="icon" variant="ghost" className="text-[#ad5b3f]" onClick={() => onDeleteEdge(edge)}><Trash2 className="h-4 w-4" /></Button></div>) : <p className="text-sm text-[#747b72]">Belum ada relasi.</p>}</CardContent></Card></>;
}
function NodeCard({ node, onEdit, onDelete }: { node: LadderNode; onEdit: () => void; onDelete: () => void }) {
  const resolved = node.nodeType === "PRODUCT" ? node.product : node.nodeType === "PACKAGE" ? node.package : undefined;
  return <div className={`group mb-2 rounded-lg border bg-[#fffdf7] p-3 shadow-sm ${!node.isActive ? "opacity-55" : ""}`} data-testid={`card-node-${node.id}`}><div className="flex justify-between gap-2"><div><div className="flex items-center gap-1"><Badge variant="outline" className="text-[9px]">{node.nodeType}</Badge><span className="font-mono text-[9px] text-[#747b72]">#{node.sortOrder}</span>{!node.isActive && <Badge variant="outline" className="text-[9px]">NONAKTIF</Badge>}</div><p className="mt-1 text-sm font-medium">{resolved?.name || node.label}</p></div><div className="flex opacity-0 transition group-hover:opacity-100"><Button size="icon" variant="ghost" data-testid={`button-edit-node-${node.id}`} onClick={onEdit}><Pencil className="h-3 w-3" /></Button><Button size="icon" variant="ghost" className="text-[#ad5b3f]" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button></div></div>{resolved && <p className="mt-2 text-[10px] text-[#747b72]">{money(resolved.price, resolved.currency)} · {resolved.status}</p>}{node.description && <p className="mt-2 text-[11px] text-[#747b72]">{node.description}</p>}</div>;
}

function NodeModal({ draft, setDraft, editing, products, packages, busy, close, submit }: { draft: NodeDraft; setDraft: (d: NodeDraft) => void; editing: boolean; products: RegistryProduct[]; packages: RegistryPackage[]; busy: boolean; close: () => void; submit: () => void }) {
  const registry = draft.nodeType === "PRODUCT" ? draft.productRegistryId : draft.packageRegistryId;
  return <Modal title={editing ? "Edit node" : "Tambah node"} close={close}><div className="grid gap-3 sm:grid-cols-2"><div><Label>Stage</Label><select className="h-10 w-full rounded border px-2" value={draft.stage} onChange={e => setDraft({ ...draft, stage: e.target.value })} data-testid="select-node-stage">{stages.map(s => <option key={s}>{s}</option>)}</select></div><div><Label>Tipe</Label><select className="h-10 w-full rounded border px-2" value={draft.nodeType} onChange={e => setDraft({ ...emptyNode(), ...draft, nodeType: e.target.value as LadderNode["nodeType"], productRegistryId: "", packageRegistryId: "", label: "" })} data-testid="select-node-type">{types.map(t => <option key={t}>{t}</option>)}</select></div></div>{draft.nodeType === "PRODUCT" && <div className="mt-3"><Label>Produk registry *</Label><select className="h-10 w-full rounded border px-2" value={registry} onChange={e => setDraft({ ...draft, productRegistryId: e.target.value })} data-testid="select-node-product"><option value="">Pilih produk</option>{products.map(p => <option key={p.productId} value={p.productId}>{p.name} · {p.productId} · {money(p.price, p.currency)}</option>)}</select></div>}{draft.nodeType === "PACKAGE" && <div className="mt-3"><Label>Package registry *</Label><select className="h-10 w-full rounded border px-2" value={registry} onChange={e => setDraft({ ...draft, packageRegistryId: e.target.value })} data-testid="select-node-package"><option value="">Pilih package</option>{packages.map(p => <option key={p.packageId} value={p.packageId}>{p.name} · {p.packageId}</option>)}</select></div>}{(draft.nodeType === "TRIGGER" || draft.nodeType === "PLACEHOLDER") && <div className="mt-3"><Label>Label *</Label><Input data-testid="input-node-label" value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} /></div>}<Label className="mt-3">Deskripsi</Label><Textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><Label>Urutan</Label><Input type="number" min={0} data-testid="input-node-sort-order" value={draft.sortOrder} onChange={e => setDraft({ ...draft, sortOrder: Number(e.target.value) })} /></div><label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" data-testid="input-node-active" checked={draft.isActive} onChange={e => setDraft({ ...draft, isActive: e.target.checked })} />Node aktif</label></div><Button className="mt-4 w-full bg-[#ad5b3f]" data-testid="button-save-node" disabled={busy} onClick={submit}>{busy ? "Menyimpan…" : "Simpan node"}</Button></Modal>;
}
function EdgeModal({ draft, setDraft, editing, nodes, relations, busy, close, submit }: { draft: EdgeDraft; setDraft: (d: EdgeDraft) => void; editing: boolean; nodes: LadderNode[]; relations: string[]; busy: boolean; close: () => void; submit: () => void }) { const option = (n: LadderNode) => `${n.stage} · ${n.label || n.product?.name || n.package?.name || n.id}`; return <Modal title={editing ? "Edit relasi" : "Tambah relasi"} close={close}><Label>Source *</Label><select className="h-10 w-full rounded border px-2" value={draft.fromNodeId} onChange={e => setDraft({ ...draft, fromNodeId: e.target.value })} data-testid="select-edge-from"><option value="">Pilih source</option>{nodes.map(n => <option key={n.id} value={n.id} disabled={String(n.id) === draft.toNodeId}>{option(n)}</option>)}</select><Label className="mt-3">Target *</Label><select className="h-10 w-full rounded border px-2" value={draft.toNodeId} onChange={e => setDraft({ ...draft, toNodeId: e.target.value })} data-testid="select-edge-to"><option value="">Pilih target</option>{nodes.map(n => <option key={n.id} value={n.id} disabled={String(n.id) === draft.fromNodeId}>{option(n)}</option>)}</select><Label className="mt-3">Relation</Label><select className="h-10 w-full rounded border px-2" value={draft.relationType} onChange={e => setDraft({ ...draft, relationType: e.target.value })}>{relations.map(r => <option key={r}>{r}</option>)}</select><Label className="mt-3">Rule text</Label><Input data-testid="input-edge-rule" value={draft.ruleText} onChange={e => setDraft({ ...draft, ruleText: e.target.value })} /><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><Label>Urutan</Label><Input type="number" min={0} data-testid="input-edge-sort-order" value={draft.sortOrder} onChange={e => setDraft({ ...draft, sortOrder: Number(e.target.value) })} /></div><label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" data-testid="input-edge-active" checked={draft.isActive} onChange={e => setDraft({ ...draft, isActive: e.target.checked })} />Relasi aktif</label></div><Button className="mt-4 w-full bg-[#ad5b3f]" data-testid="button-save-edge" disabled={busy || !draft.fromNodeId || !draft.toNodeId || draft.fromNodeId === draft.toNodeId} onClick={submit}>{busy ? "Menyimpan…" : "Simpan relasi"}</Button></Modal>; }

function Coverage({ inventory, search, setSearch, filter, setFilter, onChange, busy }: { inventory: RegistryProduct[]; search: string; setSearch: (s: string) => void; filter: string; setFilter: (s: string) => void; onChange: (p: RegistryProduct, s: "INDEPENDENT" | "UNDECIDED", note: string) => void; busy: boolean }) { const [notes, setNotes] = useState<Record<string, string>>({}); return <Card className="border-[#d9d1c2] bg-[#fffdf7]"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="font-serif text-2xl">Registry coverage</CardTitle><p className="mt-1 text-sm text-[#747b72]">MAPPED dihitung dari node aktif, bukan keputusan manual.</p></div><div className="flex gap-2"><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#9a968d]" /><Input className="pl-8" placeholder="Cari produk…" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-inventory-search" /></div><select className="h-10 rounded border px-2" value={filter} onChange={e => setFilter(e.target.value)} data-testid="select-coverage-filter"><option value="ALL">Semua</option><option value="INDEPENDENT">Berdiri sendiri</option><option value="UNDECIDED">Belum diputuskan</option><option value="MAPPED">Mapped</option></select></div></div></CardHeader><CardContent className="divide-y p-0">{inventory.map(p => <div key={p.productId} className="flex flex-wrap items-center gap-3 px-5 py-4" data-testid={`row-inventory-${p.productId}`}><div className="min-w-[220px] flex-1"><div className="flex items-center gap-2 font-medium">{p.name}<Badge className={chip[p.coverageStatus]}>{p.coverageStatus}</Badge></div><p className="text-xs text-[#747b72]">{p.productId} · {p.productType} · {p.category} · {money(p.price, p.currency)} · {p.status}</p>{p.coverageNote && <p className="mt-1 text-xs text-[#864831]">Catatan: {p.coverageNote}</p>}{p.ladderRefs?.length ? <p className="mt-1 text-xs text-[#747b72]">Ladder: {p.ladderRefs.map(r => `${r.name} (${r.stage})`).join(", ")}</p> : null}</div>{p.coverageStatus === "MAPPED" ? <p className="max-w-xs text-right text-xs text-[#747b72]">Mapped otomatis. Hapus semua node ladder untuk menjadikannya editable.</p> : <div className="flex items-center gap-1"><Input className="w-36" placeholder="Catatan (opsional)" value={notes[p.productId] || ""} onChange={e => setNotes({ ...notes, [p.productId]: e.target.value })} data-testid={`input-coverage-note-${p.productId}`} /><Button size="sm" variant="outline" disabled={busy} data-testid={`button-coverage-independent-${p.productId}`} onClick={() => onChange(p, "INDEPENDENT", notes[p.productId] || "")}>Berdiri sendiri</Button><Button size="sm" variant="outline" disabled={busy} data-testid={`button-coverage-undecided-${p.productId}`} onClick={() => onChange(p, "UNDECIDED", notes[p.productId] || "")}>Belum diputuskan</Button></div>}</div>)}{!inventory.length && <p className="p-10 text-center text-sm text-[#747b72]">Tidak ada produk aktif yang cocok.</p>}</CardContent></Card>; }

function PreviewModal({ ladder, warnings, close }: { ladder?: Ladder; warnings: string[]; close: () => void }) { return <Modal title="Preview customer journey" close={close}>{warnings.map((warning, i) => <div key={i} className="mb-3 rounded border border-[#e4b38f] bg-[#fff4e8] p-3 text-sm text-[#864831]" data-testid="preview-warning">{warning}</div>)}{ladder ? <div className="space-y-3">{stages.map(stage => <div key={stage} className="rounded-lg bg-[#f4f1e9] p-3"><div className="font-mono text-xs font-bold text-[#ad5b3f]">{stage}</div>{ladder.nodes.filter(n => n.stage === stage).map(n => <div key={n.id} className="mt-2 rounded border bg-[#fffdf7] p-2 text-sm"><b>{n.label || n.product?.name || n.package?.name || "Tanpa label"}</b><span className="ml-2 text-xs text-[#747b72]">{n.nodeType} · {n.product ? `${money(n.product.price, n.product.currency)} · ${n.product.status}` : n.package ? `${money(n.package.price, n.package.currency)} · ${n.package.status || "—"}` : ""}</span></div>)}</div>)}<div className="border-t pt-3 text-sm"><b>Relasi</b>{ladder.edges.map(e => <p key={e.id} className="mt-1">{ladder.nodes.find(n => n.id === e.fromNodeId)?.label || ladder.nodes.find(n => n.id === e.fromNodeId)?.product?.name} <ArrowRight className="mx-1 inline h-3 w-3" /> {ladder.nodes.find(n => n.id === e.toNodeId)?.label || ladder.nodes.find(n => n.id === e.toNodeId)?.product?.name} · {e.relationType}{e.ruleText ? ` · ${e.ruleText}` : ""}</p>)}</div></div> : <p>Preview kosong.</p>}</Modal>; }