// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT REGISTRY + GAIA PUBLISHING — Admin UI (V1: Export Bundle)
// Gustafta = MASTER product database; GAIA Store = published commerce view.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const PRODUCT_TYPES = [
  "AI_SPECIALIST", "AI_WORKSPACE", "DIGITAL_WORKSPACE", "DOCUMENT_AI", "DIGITAL_TOOL",
  "MINI_APP", "GENERATOR", "ASSESSMENT", "KNOWLEDGE_PRODUCT", "EBOOK", "MODULE",
  "TEMPLATE", "CHECKLIST", "BUSINESS_KIT", "E_COURSE", "DIGITAL_CONSULTATION",
  "DOCUMENT_TOOL", "KNOWLEDGE", "PRODUCTIVITY_TOOL", "OTHER_DIGITAL_PRODUCT",
];
const BILLING_TYPES = ["FREE", "ONE_TIME", "MONTHLY", "LICENSE_PLUS_MONTHLY"];
const STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED", "DEPRECATED"];

type RegistryProduct = {
  id: number; productId: string; name: string; slug: string;
  productType: string; category: string; subcategory: string | null;
  shortDescription: string | null; longDescription: string | null;
  targetUsers: string | null; features: string[]; benefits: string[];
  thumbnail: string | null; gallery: string[]; demoUrl: string | null; productUrl: string | null;
  price: number; currency: string; billingType: string; status: string; version: string;
  engineType: string | null; accessType: string | null; accessUrl: string | null;
  gaiaEnabled: boolean; gaiaFeatured: boolean; gaiaStatus: string;
  lastPublishedAt: string | null; lastPublishedVersion: string | null;
  createdAt: string; updatedAt: string;
};

type ExportHistory = {
  id: number; productId: string; productVersion: string; bundleVersion: string;
  exportStatus: string; checksum: string | null; detail: any; exportedAt: string;
};

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-200 text-gray-700", ACTIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-amber-100 text-amber-800",
  ARCHIVED: "bg-yellow-100 text-yellow-800", DEPRECATED: "bg-red-100 text-red-700",
  INACTIVE: "bg-gray-200 text-gray-600",
};

type SimpleReg = { id: number; name: string; slug: string; description: string | null; status: string; level?: number };
type PkgProduct = { id: number; productId: number; accessLevel: string; usageLimit: number | null; isRequired: boolean; sortOrder: number; productName: string; productSlug: string; productType: string; productRegistryId: string };
type Pkg = {
  id: number; packageId: string; solutionId: number; sectorId: number; tierId: number;
  name: string; slug: string; description: string | null; status: string;
  durationValue: number; durationUnit: string; price: number; currency: string; version: number;
  gaiaEnabled: boolean; products: PkgProduct[];
};
type MatrixRow = { packageId: string; version: number; status: string; solution: string; sector: string; tier: string; duration: string; price: number; access: { product: string; productId: string; level: string; usageLimit: number | null }[] };
const gaiaColor: Record<string, string> = {
  NOT_READY: "bg-gray-200 text-gray-600", READY: "bg-blue-100 text-blue-800",
  PUBLISHED: "bg-green-100 text-green-800", UPDATE_AVAILABLE: "bg-orange-100 text-orange-800",
};

const EMPTY_FORM = {
  name: "", slug: "", productType: "AI_SPECIALIST", category: "", subcategory: "",
  shortDescription: "", longDescription: "", targetUsers: "",
  featuresText: "", benefitsText: "", thumbnail: "", galleryText: "",
  demoUrl: "", productUrl: "", price: 0, currency: "IDR", billingType: "ONE_TIME",
  engineType: "", accessType: "", accessUrl: "", status: "DRAFT",
  visibility: "INTERNAL_ONLY", standaloneEnabled: false, subscriptionEnabled: false,
  dpEnabled: false, aiEnabled: false, usageProfile: [] as string[], storageProfile: "",
};

const VISIBILITIES = ["INCLUDED_ONLY", "STANDALONE_ONLY", "INCLUDED_AND_STANDALONE", "INTERNAL_ONLY", "DP_ONLY"];
const USAGE_KEYS = ["AI_CHAT", "DOCUMENT_ANALYSIS", "DOCUMENT_GENERATION", "KNOWLEDGE_PROCESSING", "AGENT_EXECUTION", "STORAGE"];

function toPayload(f: typeof EMPTY_FORM) {
  const lines = (t: string) => t.split("\n").map(s => s.trim()).filter(Boolean);
  return {
    name: f.name, slug: f.slug, productType: f.productType, category: f.category,
    subcategory: f.subcategory || null, shortDescription: f.shortDescription,
    longDescription: f.longDescription, targetUsers: f.targetUsers,
    features: lines(f.featuresText), benefits: lines(f.benefitsText),
    thumbnail: f.thumbnail || null, gallery: lines(f.galleryText),
    demoUrl: f.demoUrl || null, productUrl: f.productUrl || null,
    price: Number(f.price) || 0, currency: f.currency, billingType: f.billingType,
    engineType: f.engineType || null, accessType: f.accessType || null,
    accessUrl: f.accessUrl || null, status: f.status,
    visibility: f.visibility, standaloneEnabled: f.standaloneEnabled,
    subscriptionEnabled: f.subscriptionEnabled, dpEnabled: f.dpEnabled,
    aiEnabled: f.aiEnabled, usageProfile: f.usageProfile, storageProfile: f.storageProfile || null,
  };
}

export default function AdminRegistry() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<RegistryProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [previewJson, setPreviewJson] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data: products = [], isLoading } = useQuery<RegistryProduct[]>({
    queryKey: ["/api/admin/registry/products"],
  });
  const { data: history = [] } = useQuery<ExportHistory[]>({
    queryKey: ["/api/admin/registry/export-history"],
  });
  const { data: solutions = [] } = useQuery<SimpleReg[]>({ queryKey: ["/api/admin/registry/solutions"] });
  const { data: sectors = [] } = useQuery<SimpleReg[]>({ queryKey: ["/api/admin/registry/sectors"] });
  const { data: tiers = [] } = useQuery<SimpleReg[]>({ queryKey: ["/api/admin/registry/tiers"] });
  const { data: packages = [] } = useQuery<Pkg[]>({ queryKey: ["/api/admin/registry/packages"] });
  const { data: matrix = [] } = useQuery<MatrixRow[]>({ queryKey: ["/api/admin/registry/access-matrix"] });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["/api/admin/registry/products"] });
    qc.invalidateQueries({ queryKey: ["/api/admin/registry/export-history"] });
    qc.invalidateQueries({ queryKey: ["/api/admin/registry/packages"] });
    qc.invalidateQueries({ queryKey: ["/api/admin/registry/access-matrix"] });
  };
  const invalidateReg = (path: string) => qc.invalidateQueries({ queryKey: [`/api/admin/registry/${path}`] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) return apiRequest("PATCH", `/api/admin/registry/products/${editing.id}`, toPayload(form));
      return apiRequest("POST", "/api/admin/registry/products", toPayload(form));
    },
    onSuccess: () => { invalidate(); setEditing(null); setCreating(false); toast({ title: "Produk tersimpan" }); },
    onError: (e: any) => toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" }),
  });

  const action = async (p: RegistryProduct, path: string, body?: any) => {
    setBusyId(p.id);
    try {
      await apiRequest("POST", `/api/admin/registry/products/${p.id}/${path}`, body);
      invalidate();
      toast({ title: "Berhasil" });
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally { setBusyId(null); }
  };

  const publish = async (p: RegistryProduct) => {
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/admin/registry/products/${p.id}/publish`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const missing = Array.isArray(err.missing) ? `\nKurang: ${err.missing.join(", ")}` : "";
        throw new Error((err.error || `HTTP ${res.status}`) + missing);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${p.slug}-${p.version}-gaia-bundle.zip`;
      a.click();
      URL.revokeObjectURL(url);
      invalidate();
      toast({ title: "Published to GAIA", description: "Bundle zip berhasil diunduh." });
    } catch (e: any) {
      toast({ title: "Publish gagal", description: e.message, variant: "destructive" });
      invalidate();
    } finally { setBusyId(null); }
  };

  const preview = async (p: RegistryProduct) => {
    try {
      const res = await fetch(`/api/admin/registry/products/${p.id}/payload`, { credentials: "include" });
      setPreviewJson(JSON.stringify(await res.json(), null, 2));
    } catch (e: any) {
      toast({ title: "Gagal preview", description: e.message, variant: "destructive" });
    }
  };

  const openEdit = (p: RegistryProduct) => {
    setForm({
      name: p.name, slug: p.slug, productType: p.productType, category: p.category,
      subcategory: p.subcategory || "", shortDescription: p.shortDescription || "",
      longDescription: p.longDescription || "", targetUsers: p.targetUsers || "",
      featuresText: (p.features || []).join("\n"), benefitsText: (p.benefits || []).join("\n"),
      thumbnail: p.thumbnail || "", galleryText: (p.gallery || []).join("\n"),
      demoUrl: p.demoUrl || "", productUrl: p.productUrl || "",
      price: p.price, currency: p.currency, billingType: p.billingType,
      engineType: p.engineType || "", accessType: p.accessType || "", accessUrl: p.accessUrl || "",
      status: p.status,
      visibility: (p as any).visibility || "INTERNAL_ONLY",
      standaloneEnabled: !!(p as any).standaloneEnabled,
      subscriptionEnabled: !!(p as any).subscriptionEnabled,
      dpEnabled: !!(p as any).dpEnabled,
      aiEnabled: !!(p as any).aiEnabled,
      usageProfile: (p as any).usageProfile || [],
      storageProfile: (p as any).storageProfile || "",
    });
    setEditing(p);
  };

  const shown = products.filter(p =>
    (!filterType || p.productType === filterType) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.productId.toLowerCase().includes(search.toLowerCase()))
  );

  const set = (k: keyof typeof EMPTY_FORM) => (e: any) => setForm(f => ({ ...f, [k]: e.target?.value ?? e }));

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-registry-title">Product Registry</h1>
            <p className="text-sm text-muted-foreground">Gustafta = Master • GAIA = Published Commerce View</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin"><Button variant="outline" size="sm" data-testid="link-back-admin">← Admin</Button></Link>
            <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setCreating(true); }} data-testid="button-create-product">+ Create Product</Button>
          </div>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="products" data-testid="tab-products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="solutions" data-testid="tab-solutions">Solutions</TabsTrigger>
            <TabsTrigger value="sectors" data-testid="tab-sectors">Sectors</TabsTrigger>
            <TabsTrigger value="tiers" data-testid="tab-tiers">Tiers</TabsTrigger>
            <TabsTrigger value="packages" data-testid="tab-packages">Packages ({packages.length})</TabsTrigger>
            <TabsTrigger value="matrix" data-testid="tab-matrix">Access Matrix</TabsTrigger>
            <TabsTrigger value="gaia" data-testid="tab-gaia">GAIA Publishing</TabsTrigger>
          </TabsList>

          <TabsContent value="solutions"><SimpleRegistryTab path="solutions" title="Solution Registry" items={solutions} onChanged={() => invalidateReg("solutions")} /></TabsContent>
          <TabsContent value="sectors"><SimpleRegistryTab path="sectors" title="Sector Registry" items={sectors} onChanged={() => invalidateReg("sectors")} /></TabsContent>
          <TabsContent value="tiers"><SimpleRegistryTab path="tiers" title="Tier Registry" items={tiers} hasLevel onChanged={() => invalidateReg("tiers")} /></TabsContent>
          <TabsContent value="packages">
            <PackagesTab packages={packages} solutions={solutions} sectors={sectors} tiers={tiers} products={products} onChanged={invalidate} />
          </TabsContent>
          <TabsContent value="matrix">
            <Card>
              <CardHeader><CardTitle className="text-base">Access Matrix — SOLUTION × SECTOR × TIER</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {matrix.length === 0 && <p className="text-sm text-muted-foreground">Belum ada package. Buat package di tab Packages.</p>}
                {matrix.map((m) => (
                  <div key={m.packageId + m.version} className="border rounded-md p-3" data-testid={`matrix-${m.packageId}`}>
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-mono text-xs">{m.packageId}</span>
                      <Badge variant="outline">v{m.version}</Badge>
                      <Badge className={statusColor[m.status] || ""}>{m.status}</Badge>
                      <span className="font-medium">{m.solution} × {m.sector} × {m.tier}</span>
                      <span className="text-muted-foreground text-xs">• {m.duration} • Rp {m.price.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                      {m.access.length === 0 && <span className="text-xs text-muted-foreground">Belum ada produk.</span>}
                      {m.access.map((a) => (
                        <div key={a.productId} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
                          <span>{a.product}</span>
                          <span className="flex items-center gap-1">
                            <Badge variant="outline" className={a.level === "FULL" ? "border-green-400 text-green-700" : a.level === "LIMITED" ? "border-amber-400 text-amber-700" : "border-gray-400 text-gray-600"}>{a.level}</Badge>
                            {a.usageLimit != null && <span className="text-muted-foreground">limit {a.usageLimit}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Input placeholder="Cari nama / Product ID…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" data-testid="input-search" />
              <select className="border rounded-md px-2 text-sm bg-white" value={filterType} onChange={e => setFilterType(e.target.value)} data-testid="select-filter-type">
                <option value="">Semua Tipe</option>
                {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {isLoading ? <p className="text-sm text-muted-foreground">Memuat…</p> :
              shown.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">Belum ada produk di registry. Klik "Create Product".</CardContent></Card> :
              <div className="space-y-3">
                {shown.map(p => (
                  <Card key={p.id} data-testid={`card-product-${p.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">{p.productId}</span>
                            <Badge className={statusColor[p.status] || ""}>{p.status}</Badge>
                            <Badge className={gaiaColor[p.gaiaStatus] || ""}>GAIA: {p.gaiaStatus}</Badge>
                            <span className="text-xs text-muted-foreground">v{p.version}</span>
                          </div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.productType} • {p.category} • {p.billingType === "FREE" ? "FREE" : `${p.currency} ${p.price.toLocaleString("id-ID")}`}
                            {p.lastPublishedAt && <> • Last published v{p.lastPublishedVersion} — {new Date(p.lastPublishedAt).toLocaleString("id-ID")}</>}
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => openEdit(p)} data-testid={`button-edit-${p.id}`}>Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => preview(p)} data-testid={`button-preview-${p.id}`}>Preview</Button>
                          <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => action(p, "version", { level: "minor" })} data-testid={`button-version-${p.id}`}>Create Version</Button>
                          <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => action(p, "duplicate")} data-testid={`button-duplicate-${p.id}`}>Duplicate</Button>
                          {p.status === "ARCHIVED"
                            ? <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => action(p, "restore")} data-testid={`button-restore-${p.id}`}>Restore</Button>
                            : <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => action(p, "archive")} data-testid={`button-archive-${p.id}`}>Archive</Button>}
                          <Button size="sm" disabled={busyId === p.id} onClick={() => publish(p)} data-testid={`button-publish-${p.id}`}>Publish to GAIA</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>}
          </TabsContent>

          <TabsContent value="gaia" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Status Publikasi</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {products.length === 0 && <p className="text-sm text-muted-foreground">Belum ada produk.</p>}
                {products.map(p => (
                  <div key={p.id} className="flex items-center justify-between border-b last:border-0 py-2 text-sm flex-wrap gap-2" data-testid={`row-gaia-${p.id}`}>
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-muted-foreground mr-2">{p.productId}</span>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">v{p.version}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={gaiaColor[p.gaiaStatus] || ""}>{p.gaiaStatus}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {p.lastPublishedAt ? `v${p.lastPublishedVersion} • ${new Date(p.lastPublishedAt).toLocaleString("id-ID")}` : "Belum pernah publish"}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Export History</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {history.length === 0 && <p className="text-sm text-muted-foreground">Belum ada export.</p>}
                {history.map(h => (
                  <div key={h.id} className="flex items-center justify-between border-b last:border-0 py-2 text-sm flex-wrap gap-2" data-testid={`row-history-${h.id}`}>
                    <div className="min-w-0">
                      <span className="font-mono text-xs">{h.productId}</span>
                      <span className="text-xs text-muted-foreground ml-2">v{h.productVersion}</span>
                      <span className="text-xs text-muted-foreground ml-2">{new Date(h.exportedAt).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={h.exportStatus === "SUCCESS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}>{h.exportStatus}</Badge>
                      {h.checksum && <span className="font-mono text-[10px] text-muted-foreground">{h.checksum.slice(0, 12)}…</span>}
                      {h.detail?.missing && <span className="text-xs text-red-600">Kurang: {h.detail.missing.join(", ")}</span>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={creating || !!editing} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit — ${editing.productId} (v${editing.version})` : "Create Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Nama *</Label><Input value={form.name} onChange={set("name")} data-testid="input-name" /></div>
            <div><Label>Slug *</Label><Input value={form.slug} onChange={set("slug")} data-testid="input-slug" /></div>
            <div>
              <Label>Product Type *</Label>
              <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={form.productType} onChange={set("productType")} data-testid="select-type">
                {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><Label>Kategori *</Label><Input value={form.category} onChange={set("category")} placeholder="mis. TENDER, EBOOK, SBU" data-testid="input-category" /></div>
            <div><Label>Subkategori</Label><Input value={form.subcategory} onChange={set("subcategory")} /></div>
            <div>
              <Label>Status</Label>
              <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={form.status} onChange={set("status")} disabled={!editing} data-testid="select-status">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {!editing && <p className="text-[11px] text-muted-foreground mt-1">Produk baru selalu DRAFT.</p>}
            </div>
            <div className="md:col-span-2"><Label>Deskripsi Singkat</Label><Textarea rows={2} value={form.shortDescription} onChange={set("shortDescription")} data-testid="input-short-desc" /></div>
            <div className="md:col-span-2"><Label>Deskripsi Panjang</Label><Textarea rows={4} value={form.longDescription} onChange={set("longDescription")} /></div>
            <div className="md:col-span-2"><Label>Target Users</Label><Input value={form.targetUsers} onChange={set("targetUsers")} /></div>
            <div><Label>Features (1 per baris)</Label><Textarea rows={3} value={form.featuresText} onChange={set("featuresText")} /></div>
            <div><Label>Benefits (1 per baris)</Label><Textarea rows={3} value={form.benefitsText} onChange={set("benefitsText")} /></div>
            <div><Label>Thumbnail URL</Label><Input value={form.thumbnail} onChange={set("thumbnail")} /></div>
            <div><Label>Gallery URLs (1 per baris)</Label><Textarea rows={2} value={form.galleryText} onChange={set("galleryText")} /></div>
            <div><Label>Demo URL</Label><Input value={form.demoUrl} onChange={set("demoUrl")} /></div>
            <div><Label>Product URL</Label><Input value={form.productUrl} onChange={set("productUrl")} /></div>
            <div><Label>Harga (0 = FREE)</Label><Input type="number" value={form.price} onChange={set("price")} data-testid="input-price" /></div>
            <div>
              <Label>Billing Type</Label>
              <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={form.billingType} onChange={set("billingType")} data-testid="select-billing">
                {BILLING_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div><Label>Engine Type</Label><Input value={form.engineType} onChange={set("engineType")} placeholder="mis. GUSTAFTA_AGENT" /></div>
            <div><Label>Access Type</Label><Input value={form.accessType} onChange={set("accessType")} placeholder="mis. LOGIN_GUSTAFTA / DOWNLOAD" /></div>
            <div className="md:col-span-2"><Label>Access URL</Label><Input value={form.accessUrl} onChange={set("accessUrl")} /></div>
            <div>
              <Label>Visibility</Label>
              <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={form.visibility} onChange={set("visibility")} data-testid="select-visibility">
                {VISIBILITIES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div><Label>Storage Profile</Label><Input value={form.storageProfile} onChange={set("storageProfile")} placeholder="mis. OBJECT_STORAGE" /></div>
            <div className="md:col-span-2 flex flex-wrap gap-4 text-sm">
              {([["standaloneEnabled","Standalone"],["subscriptionEnabled","Subscription"],["gaiaEnabled" as any,null],["dpEnabled","DP Store"],["aiEnabled","AI"]] as [string, string | null][]).filter(([,l]) => l).map(([k, l]) => (
                <label key={k} className="flex items-center gap-1.5">
                  <input type="checkbox" checked={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.checked }))} data-testid={`check-${k}`} />
                  {l}
                </label>
              ))}
            </div>
            <div className="md:col-span-2">
              <Label>Usage Profile</Label>
              <div className="flex flex-wrap gap-3 text-xs mt-1">
                {USAGE_KEYS.map(u => (
                  <label key={u} className="flex items-center gap-1">
                    <input type="checkbox" checked={form.usageProfile.includes(u)}
                      onChange={e => setForm(f => ({ ...f, usageProfile: e.target.checked ? [...f.usageProfile, u] : f.usageProfile.filter(x => x !== u) }))} />
                    {u}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Batal</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-product">
              {saveMutation.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payload preview */}
      <Dialog open={!!previewJson} onOpenChange={(o) => !o && setPreviewJson(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>GAIA PRODUCT PAYLOAD v1 (whitelist)</DialogTitle></DialogHeader>
          <pre className="text-xs bg-gray-100 rounded p-3 overflow-x-auto" data-testid="text-payload-preview">{previewJson}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Solution / Sector / Tier CRUD (soft archive, tanpa delete) ─────────────
function SimpleRegistryTab({ path, title, items, hasLevel, onChanged }: {
  path: string; title: string; items: SimpleReg[]; hasLevel?: boolean; onChanged: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [level, setLevel] = useState(1);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await apiRequest("POST", `/api/admin/registry/${path}`, hasLevel ? { name, level } : { name });
      setName(""); onChanged(); toast({ title: `${title}: tersimpan` });
    } catch (e: any) { toast({ title: "Gagal", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const setStatus = async (item: SimpleReg, status: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/registry/${path}/${item.id}`, { status });
      onChanged();
    } catch (e: any) { toast({ title: "Gagal", description: e.message, variant: "destructive" }); }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Nama baru…" value={name} onChange={e => setName(e.target.value)} className="max-w-xs" data-testid={`input-new-${path}`} />
          {hasLevel && <Input type="number" className="w-20" value={level} onChange={e => setLevel(parseInt(e.target.value) || 1)} title="Level" />}
          <Button size="sm" onClick={create} disabled={busy || !name.trim()} data-testid={`button-add-${path}`}>Tambah</Button>
        </div>
        <div className="space-y-1">
          {items.map(it => (
            <div key={it.id} className="flex items-center justify-between border-b last:border-0 py-2 text-sm" data-testid={`row-${path}-${it.id}`}>
              <div>
                <span className="font-medium">{it.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{it.slug}</span>
                {hasLevel && <span className="text-xs text-muted-foreground ml-2">level {it.level}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColor[it.status] || ""}>{it.status}</Badge>
                {it.status === "ACTIVE"
                  ? <>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(it, "INACTIVE")}>Nonaktifkan</Button>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(it, "ARCHIVED")}>Arsip</Button>
                    </>
                  : <Button size="sm" variant="ghost" onClick={() => setStatus(it, "ACTIVE")}>Aktifkan</Button>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Package Builder: SOLUTION × SECTOR × TIER × DURATION → produk + akses ──
function PackagesTab({ packages, solutions, sectors, tiers, products, onChanged }: {
  packages: Pkg[]; solutions: SimpleReg[]; sectors: SimpleReg[]; tiers: SimpleReg[];
  products: RegistryProduct[]; onChanged: () => void;
}) {
  const { toast } = useToast();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Pkg | null>(null);
  const [b, setB] = useState({ solutionId: 0, sectorId: 0, tierId: 0, durationValue: 6, durationUnit: "MONTH", price: 0, name: "" });
  const [comp, setComp] = useState<Record<number, { checked: boolean; accessLevel: string; usageLimit: string }>>({});
  const [busy, setBusy] = useState(false);

  const activeItems = (arr: SimpleReg[]) => arr.filter(s => s.status === "ACTIVE");

  const openComposition = (pkg: Pkg) => {
    const next: typeof comp = {};
    for (const p of products) {
      const existing = pkg.products.find(x => x.productId === p.id);
      next[p.id] = { checked: !!existing, accessLevel: existing?.accessLevel || "FULL", usageLimit: existing?.usageLimit != null ? String(existing.usageLimit) : "" };
    }
    setComp(next);
    setEditingPkg(pkg);
  };

  const createPkg = async () => {
    setBusy(true);
    try {
      await apiRequest("POST", "/api/admin/registry/packages", b);
      setShowBuilder(false); onChanged(); toast({ title: "Package dibuat (DRAFT)" });
    } catch (e: any) { toast({ title: "Gagal", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const saveComposition = async () => {
    if (!editingPkg) return;
    setBusy(true);
    try {
      const list = Object.entries(comp).filter(([, v]) => v.checked).map(([pid, v], i) => ({
        productId: parseInt(pid), accessLevel: v.accessLevel,
        usageLimit: v.usageLimit.trim() === "" ? null : parseInt(v.usageLimit), sortOrder: i,
      }));
      await apiRequest("PUT", `/api/admin/registry/packages/${editingPkg.id}/products`, { products: list });
      setEditingPkg(null); onChanged(); toast({ title: "Komposisi tersimpan" });
    } catch (e: any) { toast({ title: "Gagal", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const setPkgStatus = async (pkg: Pkg, status: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/registry/packages/${pkg.id}`, { status });
      onChanged(); toast({ title: `Package → ${status}` });
    } catch (e: any) {
      let msg = e.message;
      toast({ title: "Gagal", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setB({ solutionId: activeItems(solutions)[0]?.id || 0, sectorId: activeItems(sectors)[0]?.id || 0, tierId: activeItems(tiers)[0]?.id || 0, durationValue: 6, durationUnit: "MONTH", price: 0, name: "" }); setShowBuilder(true); }} data-testid="button-create-package">+ Create Package</Button>
      </div>
      {packages.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Belum ada package. Package = Solution × Sector × Tier × Durasi.</CardContent></Card>}
      {packages.map(pkg => (
        <Card key={pkg.id} data-testid={`card-package-${pkg.id}`}>
          <CardContent className="py-4 space-y-2">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">{pkg.packageId}</span>
                  <Badge variant="outline">v{pkg.version}</Badge>
                  <Badge className={statusColor[pkg.status] || ""}>{pkg.status}</Badge>
                </div>
                <div className="font-semibold">{pkg.name}</div>
                <div className="text-xs text-muted-foreground">
                  {pkg.durationValue} {pkg.durationUnit === "YEAR" ? "Tahun" : "Bulan"} • Rp {pkg.price.toLocaleString("id-ID")} • {pkg.products.length} produk
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => openComposition(pkg)} data-testid={`button-compose-${pkg.id}`}>Products & Access</Button>
                {pkg.status === "DRAFT" && <Button size="sm" onClick={() => setPkgStatus(pkg, "ACTIVE")} data-testid={`button-publish-pkg-${pkg.id}`}>Publish</Button>}
                {pkg.status === "ACTIVE" && <Button size="sm" variant="outline" onClick={() => setPkgStatus(pkg, "PAUSED")}>Pause</Button>}
                {pkg.status === "PAUSED" && <Button size="sm" onClick={() => setPkgStatus(pkg, "ACTIVE")}>Resume</Button>}
                {pkg.status !== "ARCHIVED"
                  ? <Button size="sm" variant="outline" onClick={() => setPkgStatus(pkg, "ARCHIVED")}>Archive</Button>
                  : <Button size="sm" variant="outline" onClick={() => setPkgStatus(pkg, "DRAFT")}>Restore</Button>}
              </div>
            </div>
            {pkg.products.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                {pkg.products.map(pp => (
                  <div key={pp.id} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
                    <span>{pp.productName}</span>
                    <span className="flex items-center gap-1">
                      <Badge variant="outline">{pp.accessLevel}</Badge>
                      {pp.usageLimit != null && <span className="text-muted-foreground">limit {pp.usageLimit}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Package Builder */}
      <Dialog open={showBuilder} onOpenChange={o => !o && setShowBuilder(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Package</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {([["solutionId", "Solution", solutions], ["sectorId", "Sector", sectors], ["tierId", "Tier", tiers]] as [string, string, SimpleReg[]][]).map(([key, label, arr]) => (
              <div key={key}>
                <Label>{label}</Label>
                <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={(b as any)[key]} onChange={e => setB(x => ({ ...x, [key]: parseInt(e.target.value) }))} data-testid={`select-pkg-${key}`}>
                  {activeItems(arr).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Durasi</Label>
                <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={b.durationValue} onChange={e => setB(x => ({ ...x, durationValue: parseInt(e.target.value) }))} data-testid="select-pkg-duration">
                  {[1, 3, 6, 12].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <Label>Satuan</Label>
                <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={b.durationUnit} onChange={e => setB(x => ({ ...x, durationUnit: e.target.value }))}>
                  <option value="MONTH">Bulan</option><option value="YEAR">Tahun</option>
                </select>
              </div>
            </div>
            <div><Label>Harga (Rp)</Label><Input type="number" value={b.price} onChange={e => setB(x => ({ ...x, price: parseInt(e.target.value) || 0 }))} data-testid="input-pkg-price" /></div>
            <div><Label>Nama (opsional — otomatis jika kosong)</Label><Input value={b.name} onChange={e => setB(x => ({ ...x, name: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowBuilder(false)}>Batal</Button>
            <Button onClick={createPkg} disabled={busy || !b.solutionId || !b.sectorId || !b.tierId} data-testid="button-save-package">Save Draft</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Composition & Access editor */}
      <Dialog open={!!editingPkg} onOpenChange={o => !o && setEditingPkg(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Products & Access — {editingPkg?.packageId} (v{editingPkg?.version})</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Mengubah komposisi package ACTIVE akan menaikkan versinya (customer lama tidak terdampak).</p>
          <div className="space-y-1.5">
            {products.filter(p => p.status === "ACTIVE").map(p => {
              const c = comp[p.id] || { checked: false, accessLevel: "FULL", usageLimit: "" };
              return (
                <div key={p.id} className="flex items-center gap-2 text-sm border rounded px-2 py-1.5" data-testid={`comp-row-${p.id}`}>
                  <input type="checkbox" checked={c.checked} onChange={e => setComp(x => ({ ...x, [p.id]: { ...c, checked: e.target.checked } }))} />
                  <span className="flex-1 min-w-0 truncate">{p.name} <span className="text-xs text-muted-foreground">({p.productId})</span></span>
                  <select className="border rounded h-7 px-1 text-xs bg-white" value={c.accessLevel} disabled={!c.checked} onChange={e => setComp(x => ({ ...x, [p.id]: { ...c, accessLevel: e.target.value } }))}>
                    <option>FULL</option><option>LIMITED</option><option>VIEW_ONLY</option>
                  </select>
                  <Input className="w-20 h-7 text-xs" placeholder="limit" disabled={!c.checked} value={c.usageLimit} onChange={e => setComp(x => ({ ...x, [p.id]: { ...c, usageLimit: e.target.value } }))} />
                </div>
              );
            })}
            {products.filter(p => p.status === "ACTIVE").length === 0 && <p className="text-sm text-muted-foreground">Tidak ada produk ACTIVE di Registry.</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditingPkg(null)}>Batal</Button>
            <Button onClick={saveComposition} disabled={busy} data-testid="button-save-composition">Simpan Komposisi</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
