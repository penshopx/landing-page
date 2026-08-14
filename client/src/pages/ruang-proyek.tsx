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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  FolderKanban, Plus, Trash2, ArrowLeft, FileText, ClipboardList,
  Calculator, MessageCircle, HardDrive, TrendingUp, TrendingDown, Loader2,
} from "lucide-react";

type ChecklistItem = { id: string; label: string; done: boolean };
type CostItem = { id: string; label: string; type: "biaya" | "pendapatan"; amount: number };
type Project = {
  id: string; name: string; client: string | null; location: string | null;
  description: string | null; status: string; contractValue: number | null;
  startDate: string | null; endDate: string | null;
  checklist: ChecklistItem[]; costItems: CostItem[]; linkedFileIds: string[];
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

const DEFAULT_CHECKLIST = [
  "Kontrak / SPK ditandatangani",
  "RAB / penawaran disetujui",
  "Dokumen legalitas perusahaan lengkap",
  "Jadwal pelaksanaan disusun",
  "Berita acara serah terima (BAST)",
];

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
    return (
      <div className="min-h-screen bg-background">
        <SharedHeader />
        <div className="container mx-auto px-4 py-24 text-center max-w-lg">
          <FolderKanban className="h-12 w-12 mx-auto mb-4 text-blue-600" />
          <h1 className="text-2xl font-bold mb-2">Ruang Proyek</h1>
          <p className="text-muted-foreground mb-6">
            Satu ruang kerja untuk setiap proyek Anda: dokumen, checklist administrasi,
            hitung biaya & rugi-laba, dan konsultasi AI. Masuk dulu untuk mulai.
          </p>
          <Button asChild data-testid="button-login-ruang-proyek">
            <a href="/api/login">Masuk untuk Mulai</a>
          </Button>
        </div>
      </div>
    );
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
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderKanban className="h-8 w-8 text-blue-600" /> Ruang Proyek
          </h1>
          <p className="text-muted-foreground mt-1">
            Satu ruang untuk setiap proyek: dokumen, checklist, costing & rugi-laba, konsultasi AI.
          </p>
        </div>
        <Button onClick={onCreate} data-testid="button-create-project">
          <Plus className="h-4 w-4 mr-2" /> Proyek Baru
        </Button>
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
            const doneCount = p.checklist.filter((c) => c.done).length;
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
                  <p>Checklist: {doneCount}/{p.checklist.length} · Dokumen: {p.linkedFileIds.length}</p>
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
      // Isi checklist awal supaya user tidak mulai dari nol.
      return await apiRequest("PATCH", `/api/ruang-proyek/projects/${created.id}`, {
        checklist: DEFAULT_CHECKLIST.map((label) => ({ id: newId(), label, done: false })),
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

      <Tabs defaultValue="costing">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="costing" data-testid="tab-costing"><Calculator className="h-4 w-4 mr-1" /> Costing & Rugi-Laba</TabsTrigger>
          <TabsTrigger value="checklist" data-testid="tab-checklist"><ClipboardList className="h-4 w-4 mr-1" /> Checklist</TabsTrigger>
          <TabsTrigger value="dokumen" data-testid="tab-dokumen"><FileText className="h-4 w-4 mr-1" /> Dokumen</TabsTrigger>
          <TabsTrigger value="konsultasi" data-testid="tab-konsultasi"><MessageCircle className="h-4 w-4 mr-1" /> Konsultasi AI</TabsTrigger>
        </TabsList>

        <TabsContent value="costing">
          <CostingTab project={project} onSave={(costItems) => patchMut.mutate({ costItems })} saving={patchMut.isPending} />
        </TabsContent>
        <TabsContent value="checklist">
          <ChecklistTab project={project} onSave={(checklist) => patchMut.mutate({ checklist })} saving={patchMut.isPending} />
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
      </Tabs>
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

function ChecklistTab({ project, onSave, saving }: { project: Project; onSave: (items: ChecklistItem[]) => void; saving: boolean }) {
  const [label, setLabel] = useState("");
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Tambah butir administrasi, mis. 'Jaminan pelaksanaan terbit'"
            value={label} onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && label.trim()) { onSave([...project.checklist, { id: newId(), label: label.trim(), done: false }]); setLabel(""); } }}
            data-testid="input-checklist-label" />
          <Button disabled={!label.trim() || saving} data-testid="button-add-checklist"
            onClick={() => { onSave([...project.checklist, { id: newId(), label: label.trim(), done: false }]); setLabel(""); }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {project.checklist.map((c) => (
            <div key={c.id} className="flex items-center gap-3 group" data-testid={`row-checklist-${c.id}`}>
              <Checkbox checked={c.done} disabled={saving}
                onCheckedChange={(v) => onSave(project.checklist.map((x) => x.id === c.id ? { ...x, done: !!v } : x))}
                data-testid={`checkbox-${c.id}`} />
              <span className={`text-sm flex-1 ${c.done ? "line-through text-muted-foreground" : ""}`}>{c.label}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" disabled={saving}
                onClick={() => onSave(project.checklist.filter((x) => x.id !== c.id))}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
          {project.checklist.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Checklist kosong.</p>}
        </div>
      </CardContent>
    </Card>
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
