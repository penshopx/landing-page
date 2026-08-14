/**
 * Ruang Proyek — ruang kerja per proyek (login).
 * Satu tempat per proyek: dokumen (Ruang Simpan), checklist administrasi,
 * costing & rugi-laba, dan konsultasi AI.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  FolderKanban, Plus, Trash2, ArrowLeft, FileText, ClipboardList,
  Calculator, MessageCircle, HardDrive, TrendingUp, TrendingDown, Loader2,
  Wand2, Copy, Printer, CheckCircle2, Award, ExternalLink, Compass,
} from "lucide-react";
import { RuangProyekPanduan } from "@/components/ruang-proyek-panduan";
import RuangProyekLanding from "@/pages/ruang-proyek-landing";
import { Switch } from "@/components/ui/switch";
import {
  STANDARD_ADMIN_DOCS, STAGE_LABEL, STAGE_ORDER, GENERATOR_TEMPLATES,
  type AdminDoc, type AdminDocStage, type AdminDocStatus, type GeneratorTemplate,
} from "@/data/ruang-proyek-standards";

type ChecklistItem = { id: string; label: string; done: boolean };
type CostItem = { id: string; label: string; type: "biaya" | "pendapatan"; amount: number };
type Project = {
  id: string; name: string; client: string | null; location: string | null;
  description: string | null; status: string; contractValue: number | null;
  startDate: string | null; endDate: string | null;
  checklist: ChecklistItem[]; adminDocs: AdminDoc[]; costItems: CostItem[]; linkedFileIds: string[];
  isShowcased: boolean; showValue: boolean; showClient: boolean;
  createdAt: string; updatedAt: string;
};
type RsFile = { id: string; original_name: string; mime_type: string; size_bytes: number };

const rupiah = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const STATUS_LABEL: Record<string, string> = { aktif: "Aktif", selesai: "Selesai", tertunda: "Tertunda" };
const STATUS_COLOR: Record<string, string> = {
  aktif: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  selesai: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  tertunda: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const DOC_STATUS_LABEL: Record<AdminDocStatus, string> = {
  belum: "Belum", proses: "Proses", selesai: "Selesai", tidak_perlu: "Tidak perlu",
};
const DOC_STATUS_COLOR: Record<AdminDocStatus, string> = {
  belum: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  proses: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  selesai: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  tidak_perlu: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 line-through",
};

const seedAdminDocs = (): AdminDoc[] =>
  STANDARD_ADMIN_DOCS.map((d) => ({ id: newId(), key: d.key, label: d.label, stage: d.stage, status: "belum" as AdminDocStatus }));

export default function RuangProyekPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/ruang-proyek/projects"],
    enabled: !!user,
  });

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  if (!authLoading && !user) {
    return <RuangProyekLanding />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {!selected ? (
          <ProjectList
            projects={projects}
            isLoading={isLoading || authLoading}
            onOpen={setSelectedId}
            onCreate={() => setCreateOpen(true)}
          />
        ) : (
          <ProjectDetail project={selected} onBack={() => setSelectedId(null)} />
        )}
      </div>
      <CreateProjectDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(p) => { setCreateOpen(false); setSelectedId(p.id); qc.invalidateQueries({ queryKey: ["/api/ruang-proyek/projects"] }); }}
      />
    </div>
  );
}

function ProjectList({ projects, isLoading, onOpen, onCreate }: {
  projects: Project[]; isLoading: boolean; onOpen: (id: string) => void; onCreate: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const showcasedCount = projects.filter((p) => p.isShowcased).length;
  const etalaseUrl = user?.id ? `${window.location.origin}/etalase/${user.id}` : null;
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderKanban className="h-8 w-8 text-blue-600" /> Ruang Proyek
          </h1>
          <p className="text-muted-foreground mt-1">
            Standar administrasi & dokumentasi proyek: dokumen baku per tahapan, generator dokumen, costing & rugi-laba.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {etalaseUrl && showcasedCount > 0 && (
            <Button variant="outline" data-testid="button-copy-etalase"
              onClick={() => { navigator.clipboard.writeText(etalaseUrl).then(() => toast({ title: "Tautan etalase disalin", description: "Bagikan ke calon klien Anda." })); }}>
              <Award className="h-4 w-4 mr-2" /> Salin Tautan Portfolio ({showcasedCount})
            </Button>
          )}
          <Button onClick={onCreate} data-testid="button-create-project">
            <Plus className="h-4 w-4 mr-2" /> Proyek Baru
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FolderKanban className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">Belum ada proyek</p>
            <p className="text-sm text-muted-foreground mb-4">Buat proyek pertama Anda — misalnya pekerjaan konstruksi, pengadaan, atau jasa.</p>
            <Button onClick={onCreate} variant="outline" data-testid="button-create-project-empty">
              <Plus className="h-4 w-4 mr-2" /> Buat Proyek
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {projects.map((p) => {
            const laba = p.costItems.reduce((s, c) => s + (c.type === "pendapatan" ? c.amount : -c.amount), 0);
            const relevantDocs = p.adminDocs.filter((d) => d.status !== "tidak_perlu");
            const doneCount = relevantDocs.filter((d) => d.status === "selesai").length;
            return (
              <Card key={p.id} className="cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => onOpen(p.id)} data-testid={`card-project-${p.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <Badge className={STATUS_COLOR[p.status] ?? ""} variant="secondary">{STATUS_LABEL[p.status] ?? p.status}</Badge>
                  </div>
                  {p.client && <p className="text-sm text-muted-foreground">{p.client}{p.location ? ` · ${p.location}` : ""}</p>}
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  {p.contractValue != null && <p>Nilai kontrak: <span className="font-medium text-foreground">{rupiah(p.contractValue)}</span></p>}
                  <p>Administrasi: {doneCount}/{relevantDocs.length} dokumen selesai · Arsip: {p.linkedFileIds.length}</p>
                  {p.costItems.length > 0 && (
                    <p className={laba >= 0 ? "text-green-600" : "text-red-600"}>
                      {laba >= 0 ? "Laba" : "Rugi"} sementara: {rupiah(Math.abs(laba))}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function CreateProjectDialog({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (p: Project) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", client: "", location: "", contractValue: "", description: "" });

  const createMut = useMutation({
    mutationFn: async () => {
      const body: any = {
        name: form.name.trim(),
        client: form.client.trim() || null,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
      };
      const cv = Number(form.contractValue.replace(/[^\d]/g, ""));
      if (form.contractValue.trim() && Number.isFinite(cv)) body.contractValue = cv;
      const created: Project = await apiRequest("POST", "/api/ruang-proyek/projects", body);
      // Isi standar administrasi proyek supaya user langsung punya rujukan lengkap.
      return await apiRequest("PATCH", `/api/ruang-proyek/projects/${created.id}`, {
        adminDocs: seedAdminDocs(),
      }) as Project;
    },
    onSuccess: (p) => {
      setForm({ name: "", client: "", location: "", contractValue: "", description: "" });
      onCreated(p);
    },
    onError: (e: any) => toast({ title: "Gagal membuat proyek", description: e?.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Proyek Baru</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nama proyek *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Pembangunan Ruko 2 Lantai" data-testid="input-project-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pemberi kerja / klien</Label>
              <Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} data-testid="input-project-client" />
            </div>
            <div>
              <Label>Lokasi</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} data-testid="input-project-location" />
            </div>
          </div>
          <div>
            <Label>Nilai kontrak (Rp)</Label>
            <Input inputMode="numeric" value={form.contractValue}
              onChange={(e) => setForm({ ...form, contractValue: e.target.value })}
              placeholder="Contoh: 250000000" data-testid="input-project-value" />
          </div>
          <div>
            <Label>Catatan singkat</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button disabled={!form.name.trim() || createMut.isPending} onClick={() => createMut.mutate()} data-testid="button-submit-project">
            {createMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Buat Proyek
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const patchMut = useMutation({
    mutationFn: (body: Partial<Project>) => apiRequest("PATCH", `/api/ruang-proyek/projects/${project.id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/ruang-proyek/projects"] }),
    onError: (e: any) => toast({ title: "Gagal menyimpan", description: e?.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/ruang-proyek/projects/${project.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/ruang-proyek/projects"] }); onBack(); },
    onError: (e: any) => toast({ title: "Gagal menghapus", description: e?.message, variant: "destructive" }),
  });

  const pendapatan = project.costItems.filter((c) => c.type === "pendapatan").reduce((s, c) => s + c.amount, 0);
  const biaya = project.costItems.filter((c) => c.type === "biaya").reduce((s, c) => s + c.amount, 0);
  const laba = pendapatan - biaya;

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-projects"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{[project.client, project.location].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={project.status} onValueChange={(v) => patchMut.mutate({ status: v as any })}>
            <SelectTrigger className="w-32" data-testid="select-project-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="tertunda">Tertunda</SelectItem>
              <SelectItem value="selesai">Selesai</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" data-testid="button-delete-project"
            onClick={() => { if (confirm("Hapus proyek ini? Dokumen di Ruang Simpan tidak ikut terhapus.")) deleteMut.mutate(); }}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Ringkasan rugi-laba */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Pendapatan</p>
          <p className="text-lg font-bold text-green-600" data-testid="text-total-pendapatan">{rupiah(pendapatan)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Biaya</p>
          <p className="text-lg font-bold text-red-600" data-testid="text-total-biaya">{rupiah(biaya)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">{laba >= 0 ? "Laba" : "Rugi"}</p>
          <p className={`text-lg font-bold ${laba >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-laba">{rupiah(Math.abs(laba))}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="administrasi">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="administrasi" data-testid="tab-administrasi"><ClipboardList className="h-4 w-4 mr-1" /> Administrasi Proyek</TabsTrigger>
          <TabsTrigger value="generator" data-testid="tab-generator"><Wand2 className="h-4 w-4 mr-1" /> Generator Dokumen</TabsTrigger>
          <TabsTrigger value="costing" data-testid="tab-costing"><Calculator className="h-4 w-4 mr-1" /> Costing & Rugi-Laba</TabsTrigger>
          <TabsTrigger value="dokumen" data-testid="tab-dokumen"><FileText className="h-4 w-4 mr-1" /> Arsip Dokumen</TabsTrigger>
          <TabsTrigger value="konsultasi" data-testid="tab-konsultasi"><MessageCircle className="h-4 w-4 mr-1" /> Konsultasi AI</TabsTrigger>
          <TabsTrigger value="panduan" data-testid="tab-panduan"><Compass className="h-4 w-4 mr-1" /> Panduan Alur</TabsTrigger>
        </TabsList>

        <TabsContent value="administrasi">
          <AdminDocsTab project={project} onSave={(adminDocs) => patchMut.mutate({ adminDocs })} saving={patchMut.isPending} />
        </TabsContent>
        <TabsContent value="generator">
          <GeneratorTab project={project} />
        </TabsContent>
        <TabsContent value="costing">
          <CostingTab project={project} onSave={(costItems) => patchMut.mutate({ costItems })} saving={patchMut.isPending} />
        </TabsContent>
        <TabsContent value="dokumen">
          <DokumenTab project={project} onSave={(linkedFileIds) => patchMut.mutate({ linkedFileIds })} />
        </TabsContent>
        <TabsContent value="konsultasi">
          <Card><CardContent className="pt-6 text-center space-y-3">
            <MessageCircle className="h-10 w-10 mx-auto text-blue-600" />
            <p className="font-medium">Konsultasikan proyek ini dengan Asisten AI</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Tanyakan strategi tender, administrasi kontrak, atau kepatuhan dokumen.
              Sebutkan nama proyek Anda agar jawabannya relevan.
            </p>
            <Button asChild data-testid="link-konsultasi-klinik">
              <Link href="/klinik-konsultasi">Buka Klinik Konsultasi</Link>
            </Button>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="panduan">
          <RuangProyekPanduan />
        </TabsContent>
      </Tabs>

      {/* Pajang ke Portfolio (etalase publik) */}
      <Card className="mt-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Pajang ke Portfolio</p>
                <p className="text-xs text-muted-foreground max-w-md">
                  Tampilkan proyek ini di etalase publik Anda sebagai bukti rekam jejak ke calon klien.
                  Nilai kontrak & nama klien hanya tampil bila Anda izinkan.
                </p>
              </div>
            </div>
            <Switch checked={project.isShowcased}
              onCheckedChange={(v) => patchMut.mutate({ isShowcased: v } as any)}
              data-testid="switch-showcase" />
          </div>
          {project.isShowcased && (
            <div className="mt-3 pl-8 space-y-2">
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={project.showValue}
                  onCheckedChange={(v) => patchMut.mutate({ showValue: v } as any)}
                  data-testid="switch-show-value" />
                Tampilkan nilai kontrak di etalase
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={project.showClient}
                  onCheckedChange={(v) => patchMut.mutate({ showClient: v } as any)}
                  data-testid="switch-show-client" />
                Tampilkan nama pemberi kerja di etalase
              </label>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function CostingTab({ project, onSave, saving }: { project: Project; onSave: (items: CostItem[]) => void; saving: boolean }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"biaya" | "pendapatan">("biaya");

  const add = () => {
    const amt = Number(amount.replace(/[^\d]/g, ""));
    if (!label.trim() || !Number.isFinite(amt) || amt <= 0) return;
    onSave([...project.costItems, { id: newId(), label: label.trim(), type, amount: amt }]);
    setLabel(""); setAmount("");
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="sm:w-36" data-testid="select-cost-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="biaya">Biaya</SelectItem>
              <SelectItem value="pendapatan">Pendapatan</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder={type === "biaya" ? "Contoh: Material besi & semen" : "Contoh: Termin 1 (30%)"}
            value={label} onChange={(e) => setLabel(e.target.value)} data-testid="input-cost-label" />
          <Input placeholder="Jumlah (Rp)" inputMode="numeric" className="sm:w-44"
            value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="input-cost-amount" />
          <Button onClick={add} disabled={saving} data-testid="button-add-cost"><Plus className="h-4 w-4" /></Button>
        </div>

        {project.costItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Belum ada baris. Tambahkan pendapatan (nilai kontrak/termin) dan biaya (material, upah, dll)
            — rugi-laba dihitung otomatis di atas.
          </p>
        ) : (
          <div className="divide-y">
            {project.costItems.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 gap-2" data-testid={`row-cost-${c.id}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="secondary" className={c.type === "pendapatan" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}>
                    {c.type === "pendapatan" ? "Masuk" : "Keluar"}
                  </Badge>
                  <span className="text-sm truncate">{c.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium">{rupiah(c.amount)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={saving}
                    onClick={() => onSave(project.costItems.filter((x) => x.id !== c.id))} data-testid={`button-remove-cost-${c.id}`}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminDocsTab({ project, onSave, saving }: { project: Project; onSave: (docs: AdminDoc[]) => void; saving: boolean }) {
  const [customLabel, setCustomLabel] = useState("");
  const [customStage, setCustomStage] = useState<AdminDocStage>("pelaksanaan");
  // Proyek lama (dibuat sebelum fitur ini) bisa punya adminDocs kosong — tawarkan isi standar.
  const docs = project.adminDocs;

  const setStatus = (id: string, status: AdminDocStatus) =>
    onSave(docs.map((d) => (d.id === id ? { ...d, status } : d)));

  return (
    <div className="space-y-4">
      {docs.length === 0 && (
        <Card><CardContent className="pt-6 text-center space-y-3">
          <ClipboardList className="h-8 w-8 mx-auto text-blue-600" />
          <p className="text-sm text-muted-foreground">Proyek ini belum punya daftar administrasi standar.</p>
          <Button onClick={() => onSave(seedAdminDocs())} disabled={saving} data-testid="button-seed-admin-docs">
            Isi Standar Administrasi Proyek ({STANDARD_ADMIN_DOCS.length} dokumen)
          </Button>
        </CardContent></Card>
      )}

      {STAGE_ORDER.map((stage) => {
        const stageDocs = docs.filter((d) => d.stage === stage);
        if (stageDocs.length === 0) return null;
        const relevant = stageDocs.filter((d) => d.status !== "tidak_perlu");
        const done = relevant.filter((d) => d.status === "selesai").length;
        return (
          <Card key={stage}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">{STAGE_LABEL[stage]}</CardTitle>
                <Badge variant="secondary" className={done === relevant.length && relevant.length > 0 ? DOC_STATUS_COLOR.selesai : ""}>
                  {done}/{relevant.length} selesai
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="divide-y">
              {stageDocs.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 py-2 group" data-testid={`row-admindoc-${d.key}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {d.status === "selesai" && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
                    <span className={`text-sm truncate ${d.status === "tidak_perlu" ? "line-through text-muted-foreground" : ""}`}>{d.label}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Select value={d.status} onValueChange={(v) => setStatus(d.id, v as AdminDocStatus)} disabled={saving}>
                      <SelectTrigger className="h-8 w-32 text-xs" data-testid={`select-status-${d.key}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(DOC_STATUS_LABEL) as AdminDocStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{DOC_STATUS_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" disabled={saving}
                      onClick={() => onSave(docs.filter((x) => x.id !== d.id))} data-testid={`button-remove-doc-${d.key}`}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium mb-2">Tambah dokumen khusus proyek ini</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={customStage} onValueChange={(v) => setCustomStage(v as AdminDocStage)}>
              <SelectTrigger className="sm:w-64" data-testid="select-custom-stage"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGE_ORDER.map((s) => <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Nama dokumen, mis. 'Izin lingkungan warga'"
              value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} data-testid="input-custom-doc" />
            <Button disabled={!customLabel.trim() || saving} data-testid="button-add-custom-doc"
              onClick={() => {
                onSave([...docs, { id: newId(), key: `custom-${newId()}`, label: customLabel.trim(), stage: customStage, status: "belum" }]);
                setCustomLabel("");
              }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GeneratorTab({ project }: { project: Project }) {
  const { toast } = useToast();
  const [tplKey, setTplKey] = useState<string>(GENERATOR_TEMPLATES[0].key);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");

  const tpl = GENERATOR_TEMPLATES.find((t) => t.key === tplKey)!;

  const generate = () => {
    setOutput(tpl.render({
      projectName: project.name,
      client: project.client ?? "",
      location: project.location ?? "",
      contractValue: project.contractValue != null ? rupiah(project.contractValue) : "",
      startDate: project.startDate ?? "",
      endDate: project.endDate ?? "",
    }, fields));
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(output); toast({ title: "Tersalin", description: "Dokumen disalin — tempel di Word/Docs untuk dirapikan." }); }
    catch { toast({ title: "Gagal menyalin", variant: "destructive" }); }
  };

  const print = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<pre style="font-family: 'Times New Roman', serif; font-size: 12pt; white-space: pre-wrap; padding: 2cm;">${output.replace(/</g, "&lt;")}</pre>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div>
            <Label>Jenis dokumen</Label>
            <Select value={tplKey} onValueChange={(v) => { setTplKey(v); setFields({}); setOutput(""); }}>
              <SelectTrigger data-testid="select-generator-template"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GENERATOR_TEMPLATES.map((t) => <SelectItem key={t.key} value={t.key}>{t.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{tpl.description}</p>
          </div>
          <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2">
            Data proyek (nama, klien, lokasi, nilai kontrak) diambil otomatis. Lengkapi sisanya:
          </p>
          {tpl.fields.map((f) => (
            <div key={f.name}>
              <Label className="text-sm">{f.label}</Label>
              {f.multiline ? (
                <Textarea rows={3} placeholder={f.placeholder} value={fields[f.name] ?? ""}
                  onChange={(e) => setFields({ ...fields, [f.name]: e.target.value })} data-testid={`input-gen-${f.name}`} />
              ) : (
                <Input placeholder={f.placeholder} value={fields[f.name] ?? ""}
                  onChange={(e) => setFields({ ...fields, [f.name]: e.target.value })} data-testid={`input-gen-${f.name}`} />
              )}
            </div>
          ))}
          <Button className="w-full" onClick={generate} data-testid="button-generate-doc">
            <Wand2 className="h-4 w-4 mr-2" /> Buat Dokumen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Hasil</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!output} onClick={copy} data-testid="button-copy-doc">
                <Copy className="h-3.5 w-3.5 mr-1" /> Salin
              </Button>
              <Button variant="outline" size="sm" disabled={!output} onClick={print} data-testid="button-print-doc">
                <Printer className="h-3.5 w-3.5 mr-1" /> Cetak
              </Button>
            </div>
          </div>
          {output ? (
            <Textarea rows={22} value={output} onChange={(e) => setOutput(e.target.value)}
              className="font-mono text-xs" data-testid="textarea-doc-output" />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">
              Pilih jenis dokumen, lengkapi isian, lalu klik "Buat Dokumen".
              Hasilnya bisa diedit langsung, disalin, atau dicetak.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DokumenTab({ project, onSave }: { project: Project; onSave: (ids: string[]) => void }) {
  const { data: files = [], isLoading } = useQuery<RsFile[]>({ queryKey: ["/api/ruang-simpan/files"] });
  const linked = files.filter((f) => project.linkedFileIds.includes(f.id));
  const unlinked = files.filter((f) => !project.linkedFileIds.includes(f.id));

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Dokumen proyek ini ({linked.length})</p>
          {linked.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada dokumen yang dikaitkan. Pilih dari Ruang Simpan di bawah.</p>
          ) : (
            <div className="space-y-1">
              {linked.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded bg-muted/40" data-testid={`row-linked-${f.id}`}>
                  <span className="truncate">{f.original_name}</span>
                  <Button variant="ghost" size="sm" className="h-7"
                    onClick={() => onSave(project.linkedFileIds.filter((id) => id !== f.id))} data-testid={`button-unlink-${f.id}`}>
                    Lepas
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2 flex items-center gap-2"><HardDrive className="h-4 w-4" /> Dari Ruang Simpan</p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : unlinked.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {files.length === 0 ? <>Belum ada file di Ruang Simpan. <Link href="/ruang-simpan" className="text-blue-600 underline">Unggah dulu di sana</Link>.</> : "Semua file sudah dikaitkan."}
            </p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {unlinked.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted/40" data-testid={`row-unlinked-${f.id}`}>
                  <span className="truncate">{f.original_name}</span>
                  <Button variant="outline" size="sm" className="h-7"
                    onClick={() => onSave([...project.linkedFileIds, f.id])} data-testid={`button-link-${f.id}`}>
                    Kaitkan
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
