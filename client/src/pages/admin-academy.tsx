import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  BookOpen,
  GraduationCap,
  ArrowLeft,
  Eye,
  EyeOff,
  Star,
  GripVertical,
  Activity,
  RefreshCw,
} from "lucide-react";

// ─── DnD Kit imports ──────────────────────────────────────────────────────────
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Course = {
  id: number;
  title: string;
  slug: string;
  shortDesc: string;
  description: string;
  category: string;
  subcategory: string;
  color: string;
  emoji: string;
  instructor: string;
  durationMinutes: number;
  price: number;
  level: string;
  isFeatured: boolean;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
  lessonCount: number;
  createdAt: string;
};

type Lesson = {
  id: number;
  courseId: number;
  title: string;
  slug: string;
  content: string;
  videoUrl: string;
  type: string;
  durationMinutes: number;
  sortOrder: number;
  isPreview: boolean;
  isActive: boolean;
};

const BLANK_COURSE = {
  title: "",
  slug: "",
  shortDesc: "",
  description: "",
  category: "onboarding",
  subcategory: "",
  color: "#6366f1",
  emoji: "📚",
  instructor: "Tim Gustafta",
  durationMinutes: 0,
  price: 0,
  level: "beginner",
  isFeatured: false,
  isPublic: true,
  isActive: true,
  sortOrder: 0,
};

const BLANK_LESSON = {
  title: "",
  slug: "",
  content: "",
  videoUrl: "",
  type: "article",
  durationMinutes: 5,
  sortOrder: 0,
  isPreview: false,
  isActive: true,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ─── Course Form Dialog ────────────────────────────────────────────────────────
function CourseDialog({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Course>;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({ ...BLANK_COURSE, ...initial });

  useEffect(() => {
    setForm({ ...BLANK_COURSE, ...initial });
  }, [initial, open]);

  const mut = useMutation({
    mutationFn: () =>
      isEdit
        ? apiRequest("PATCH", `/api/admin/lms/courses/${initial!.id}`, form)
        : apiRequest("POST", "/api/admin/lms/courses", form),
    onSuccess: () => {
      toast({ title: isEdit ? "Kursus diperbarui" : "Kursus dibuat" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lms/courses"] });
      onSaved();
      onClose();
    },
    onError: (e: any) =>
      toast({ title: "Gagal", description: e?.message || "Coba lagi.", variant: "destructive" }),
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Kursus" : "Tambah Kursus Baru"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Judul *</Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  set("title", e.target.value);
                  if (!isEdit) set("slug", slugify(e.target.value));
                }}
                placeholder="Panduan SBU Konstruksi"
              />
            </div>
            <div className="space-y-1">
              <Label>Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
                placeholder="panduan-sbu-konstruksi"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Deskripsi Singkat</Label>
            <Input
              value={form.shortDesc}
              onChange={(e) => set("shortDesc", e.target.value)}
              placeholder="Satu kalimat tentang kursus ini"
            />
          </div>

          <div className="space-y-1">
            <Label>Deskripsi Lengkap</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Jelaskan isi dan manfaat kursus..."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["onboarding", "konstruksi", "tender", "legalitas", "k3", "demo", "lainnya"].map(
                    (c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Subkategori</Label>
              <Input
                value={form.subcategory}
                onChange={(e) => set("subcategory", e.target.value)}
                placeholder="SBU, SKK, PBJP…"
              />
            </div>
            <div className="space-y-1">
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => set("level", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["beginner", "intermediate", "advanced"].map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Emoji</Label>
              <Input
                value={form.emoji}
                onChange={(e) => set("emoji", e.target.value)}
                placeholder="📚"
              />
            </div>
            <div className="space-y-1">
              <Label>Warna</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                  className="h-9 w-12 rounded border cursor-pointer"
                />
                <Input
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Durasi (menit)</Label>
              <Input
                type="number"
                value={form.durationMinutes}
                onChange={(e) => set("durationMinutes", parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label>Harga (Rp)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => set("price", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Instruktur</Label>
            <Input
              value={form.instructor}
              onChange={(e) => set("instructor", e.target.value)}
              placeholder="Tim Gustafta"
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => set("isPublic", e.target.checked)}
              />
              <span className="text-sm">Publik</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => set("isFeatured", e.target.checked)}
              />
              <span className="text-sm">Unggulan</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
              />
              <span className="text-sm">Aktif</span>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mut.isPending}>
            Batal
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Simpan Perubahan" : "Buat Kursus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lesson Form Dialog ────────────────────────────────────────────────────────
function LessonDialog({
  open,
  onClose,
  courseId,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  courseId: number;
  initial?: Partial<Lesson>;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({ ...BLANK_LESSON, ...initial });

  useEffect(() => {
    setForm({ ...BLANK_LESSON, ...initial });
  }, [initial, open]);

  const mut = useMutation({
    mutationFn: () =>
      isEdit
        ? apiRequest("PATCH", `/api/admin/lms/lessons/${initial!.id}`, form)
        : apiRequest("POST", `/api/admin/lms/courses/${courseId}/lessons`, form),
    onSuccess: () => {
      toast({ title: isEdit ? "Lesson diperbarui" : "Lesson dibuat" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lms/courses", courseId, "lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lms/courses"] });
      onSaved();
      onClose();
    },
    onError: (e: any) =>
      toast({ title: "Gagal", description: e?.message || "Coba lagi.", variant: "destructive" }),
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Lesson" : "Tambah Lesson Baru"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Judul *</Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  set("title", e.target.value);
                  if (!isEdit) set("slug", slugify(e.target.value));
                }}
                placeholder="Apa itu SKK?"
              />
            </div>
            <div className="space-y-1">
              <Label>Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
                placeholder="apa-itu-skk"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipe</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Artikel</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Durasi (menit)</Label>
              <Input
                type="number"
                value={form.durationMinutes}
                onChange={(e) => set("durationMinutes", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {form.type === "video" && (
            <div className="space-y-1">
              <Label>URL Video</Label>
              <Input
                value={form.videoUrl}
                onChange={(e) => set("videoUrl", e.target.value)}
                placeholder="https://youtube.com/..."
              />
            </div>
          )}

          <div className="space-y-1">
            <Label>Konten (Markdown)</Label>
            <Textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              rows={12}
              placeholder="# Judul Lesson&#10;&#10;Tulis konten dalam format Markdown..."
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPreview}
                onChange={(e) => set("isPreview", e.target.checked)}
              />
              <span className="text-sm">Preview gratis</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
              />
              <span className="text-sm">Aktif</span>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mut.isPending}>
            Batal
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Simpan Perubahan" : "Tambah Lesson"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sortable Lesson Row ───────────────────────────────────────────────────────
function SortableLessonRow({
  lesson,
  index,
  onEdit,
  onDelete,
}: {
  lesson: Lesson;
  index: number;
  onEdit: (l: Lesson) => void;
  onDelete: (l: Lesson) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-muted/40 rounded-lg px-3 py-2 text-sm"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Seret untuk mengubah urutan"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <span className="text-muted-foreground w-5 text-right flex-shrink-0">{index + 1}.</span>
      <span className="flex-1 font-medium truncate">{lesson.title}</span>
      <span className="text-muted-foreground text-xs">{lesson.type}</span>
      <span className="text-muted-foreground text-xs">{lesson.durationMinutes}m</span>
      {lesson.isPreview && (
        <Badge variant="secondary" className="text-xs py-0">preview</Badge>
      )}
      {!lesson.isActive && (
        <Badge variant="outline" className="text-xs py-0 text-muted-foreground">
          nonaktif
        </Badge>
      )}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 flex-shrink-0"
        onClick={() => onEdit(lesson)}
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 flex-shrink-0 text-destructive"
        onClick={() => onDelete(lesson)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

// ─── Lessons Panel (inline, per-course) ───────────────────────────────────────
function LessonsPanel({ course }: { course: Course }) {
  const { toast } = useToast();
  const [lessonDialog, setLessonDialog] = useState<{ open: boolean; initial?: Partial<Lesson> }>({
    open: false,
  });
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);
  const [localLessons, setLocalLessons] = useState<Lesson[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const { data: lessons = [], isLoading, isError: lessonsError } = useQuery<Lesson[]>({
    queryKey: ["/api/admin/lms/courses", course.id, "lessons"],
    queryFn: () => apiRequest("GET", `/api/admin/lms/courses/${course.id}/lessons`),
  });

  // Sync local state with server data:
  // - Same IDs → update data fields (title, active, etc.) while preserving local drag order
  // - IDs changed (add/remove) → reset fully to server order
  useEffect(() => {
    setLocalLessons((prev) => {
      const serverMap = new Map(lessons.map((l) => [l.id, l]));
      const prevIds = new Set(prev.map((l) => l.id));
      const nextIds = new Set(lessons.map((l) => l.id));
      const sameSet =
        prevIds.size === nextIds.size && [...prevIds].every((id) => nextIds.has(id));
      if (sameSet) {
        // Keep local drag order, but refresh every item's data from server
        return prev.map((l) => serverMap.get(l.id) ?? l);
      }
      return lessons;
    });
  }, [lessons]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const delMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/lms/lessons/${id}`),
    onSuccess: () => {
      toast({ title: "Lesson dihapus" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lms/courses", course.id, "lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lms/courses"] });
      setDeleteLesson(null);
    },
    onError: (e: any) =>
      toast({ title: "Gagal hapus", description: e?.message, variant: "destructive" }),
  });

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = localLessons.findIndex((l) => l.id === active.id);
      const newIndex = localLessons.findIndex((l) => l.id === over.id);
      const reordered = arrayMove(localLessons, oldIndex, newIndex);

      // Optimistic update
      setLocalLessons(reordered);
      setIsSavingOrder(true);

      try {
        // Persist each lesson's new sortOrder
        await Promise.all(
          reordered.map((lesson, idx) =>
            apiRequest("PATCH", `/api/admin/lms/lessons/${lesson.id}`, { sortOrder: idx + 1 })
          )
        );
        queryClient.invalidateQueries({ queryKey: ["/api/admin/lms/courses", course.id, "lessons"] });
      } catch {
        toast({ title: "Gagal menyimpan urutan", variant: "destructive" });
        setLocalLessons(lessons); // revert
      } finally {
        setIsSavingOrder(false);
      }
    },
    [localLessons, lessons, course.id, toast]
  );

  return (
    <div className="pl-6 pb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {localLessons.length} lesson{localLessons.length !== 1 ? "s" : ""}
          {isSavingOrder && <Loader2 className="w-3 h-3 animate-spin" />}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setLessonDialog({ open: true })}
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Lesson
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : lessonsError ? (
        <p className="text-sm text-destructive">Gagal memuat lessons. Coba muat ulang.</p>
      ) : localLessons.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Belum ada lesson.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localLessons.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {localLessons.map((l, idx) => (
                <SortableLessonRow
                  key={l.id}
                  lesson={l}
                  index={idx}
                  onEdit={(lesson) => setLessonDialog({ open: true, initial: lesson })}
                  onDelete={setDeleteLesson}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <LessonDialog
        open={lessonDialog.open}
        onClose={() => setLessonDialog({ open: false })}
        courseId={course.id}
        initial={lessonDialog.initial}
        onSaved={() => {}}
      />

      <AlertDialog open={!!deleteLesson} onOpenChange={(o) => !o && setDeleteLesson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteLesson?.title}" akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteLesson && delMut.mutate(deleteLesson.id)}
            >
              {delMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Sortable Course Card ─────────────────────────────────────────────────────
function SortableCourseCard({
  course,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  course: Course;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: course.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={!course.isActive ? "opacity-60" : undefined}>
        {/* Course row */}
        <div className="flex items-center gap-3 p-4">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
            aria-label="Seret untuk mengubah urutan"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Expand toggle */}
          <button
            className="text-muted-foreground flex-shrink-0"
            onClick={onToggle}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Color dot + emoji */}
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 cursor-pointer"
            style={{ backgroundColor: course.color + "22", border: `2px solid ${course.color}44` }}
            onClick={onToggle}
          >
            {course.emoji}
          </span>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold truncate">{course.title}</span>
              {course.isFeatured && (
                <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
              )}
              {!course.isActive && (
                <Badge variant="outline" className="text-xs py-0">nonaktif</Badge>
              )}
              {!course.isPublic && (
                <EyeOff className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span className="capitalize">{course.category}</span>
              {course.subcategory && <span>· {course.subcategory}</span>}
              <span>· {course.level}</span>
              <span>· {course.durationMinutes}m</span>
              <span>· {course.lessonCount} lesson</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onEdit}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expanded: lessons */}
        {expanded && (
          <div className="border-t">
            <LessonsPanel course={course} />
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── LMS Health Card ──────────────────────────────────────────────────────────
type LmsHealth = {
  seedStatus: string;
  seeding: boolean;
  counts: {
    totalCourses: number;
    activeCourses: number;
    totalLessons: number;
    totalEnrollments: number;
  };
};

function SeedStatusBadge({ status, seeding }: { status: string; seeding: boolean }) {
  if (seeding || status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
        <Loader2 className="w-3 h-3 animate-spin" />
        Seeding…
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        Seed selesai
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        Seed error
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        Seed dilewati (sudah ada)
      </span>
    );
  }
  // idle or unknown
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
      {status || "Tidak diketahui"}
    </span>
  );
}

function LmsHealthCard({
  health,
  isLoading,
  onRefresh,
  updatedAt,
}: {
  health: LmsHealth | undefined;
  isLoading: boolean;
  onRefresh: () => void;
  updatedAt: number;
}) {
  const lastUpdated = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <Card className="mb-6 border-2">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-sm">Status LMS</span>
            {health && (
              <SeedStatusBadge status={health.seedStatus} seeding={health.seeding} />
            )}
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">Diperbarui {lastUpdated}</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {isLoading && !health ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat status…
          </div>
        ) : health ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg px-4 py-3 text-center">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {health.counts.totalCourses}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Kursus</p>
            </div>
            <div className="bg-muted/50 rounded-lg px-4 py-3 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {health.counts.activeCourses}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Kursus Aktif & Publik</p>
            </div>
            <div className="bg-muted/50 rounded-lg px-4 py-3 text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {health.counts.totalLessons}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Pelajaran</p>
            </div>
            <div className="bg-muted/50 rounded-lg px-4 py-3 text-center">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {health.counts.totalEnrollments}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Pendaftaran</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-destructive">Gagal memuat status LMS.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminAcademyPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [courseDialog, setCourseDialog] = useState<{ open: boolean; initial?: Partial<Course> }>({
    open: false,
  });
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [deleteEnrollmentCount, setDeleteEnrollmentCount] = useState<number | null>(null);
  const [forceDeleteConfirm, setForceDeleteConfirm] = useState(false);
  const [localCourses, setLocalCourses] = useState<Course[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = "Kelola Academy | Admin Gustafta";
    return () => { document.title = prev; };
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const { data: courses = [], isLoading, isError: coursesError } = useQuery<Course[]>({
    queryKey: ["/api/admin/lms/courses"],
    queryFn: () => apiRequest("GET", "/api/admin/lms/courses"),
    enabled: isAdmin,
  });

  const {
    data: health,
    isLoading: healthLoading,
    refetch: refetchHealth,
    dataUpdatedAt: healthUpdatedAt,
  } = useQuery<{
    seedStatus: string;
    seeding: boolean;
    counts: {
      totalCourses: number;
      activeCourses: number;
      totalLessons: number;
      totalEnrollments: number;
    };
  }>({
    queryKey: ["/api/admin/lms/health"],
    queryFn: () => apiRequest("GET", "/api/admin/lms/health"),
    enabled: isAdmin,
    // Poll every 5 s while seeding; otherwise don't auto-refetch
    refetchInterval: isSeeding ? 5000 : false,
    staleTime: 30_000,
  });

  // Sync isSeeding flag from health data to enable/disable polling
  useEffect(() => {
    if (health) setIsSeeding(health.seeding);
  }, [health]);

  // Sync local state with server data:
  // - Same IDs → update data fields (title, active, lessonCount, etc.) while preserving local drag order
  // - IDs changed (add/remove) → reset fully to server order
  useEffect(() => {
    setLocalCourses((prev) => {
      const serverMap = new Map(courses.map((c) => [c.id, c]));
      const prevIds = new Set(prev.map((c) => c.id));
      const nextIds = new Set(courses.map((c) => c.id));
      const sameSet =
        prevIds.size === nextIds.size && [...prevIds].every((id) => nextIds.has(id));
      if (sameSet) {
        // Keep local drag order, but refresh every item's data from server
        return prev.map((c) => serverMap.get(c.id) ?? c);
      }
      return courses;
    });
  }, [courses]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch enrollment count whenever a course is selected for deletion
  useEffect(() => {
    if (!deleteCourse) {
      setDeleteEnrollmentCount(null);
      setForceDeleteConfirm(false);
      return;
    }
    apiRequest("GET", `/api/admin/lms/courses/${deleteCourse.id}/stats`)
      .then((data: any) => setDeleteEnrollmentCount(data.enrollmentCount ?? 0))
      // -1 signals fetch error — blocks delete until admin retries
      .catch(() => setDeleteEnrollmentCount(-1));
  }, [deleteCourse]);

  const delMut = useMutation({
    mutationFn: ({ id, force }: { id: number; force?: boolean }) =>
      apiRequest("DELETE", `/api/admin/lms/courses/${id}${force ? "?force=true" : ""}`),
    onSuccess: () => {
      toast({ title: "Kursus dihapus" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lms/courses"] });
      setDeleteCourse(null);
      setForceDeleteConfirm(false);
    },
    onError: (e: any) =>
      toast({ title: "Gagal hapus", description: e?.message, variant: "destructive" }),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: number) =>
      apiRequest("PATCH", `/api/admin/lms/courses/${id}`, { isActive: false }),
    onSuccess: () => {
      toast({ title: "Kursus dinonaktifkan", description: "Data siswa tetap aman." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lms/courses"] });
      setDeleteCourse(null);
    },
    onError: (e: any) =>
      toast({ title: "Gagal nonaktifkan", description: e?.message, variant: "destructive" }),
  });

  const handleCourseDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = localCourses.findIndex((c) => c.id === active.id);
      const newIndex = localCourses.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(localCourses, oldIndex, newIndex);

      // Optimistic update
      setLocalCourses(reordered);
      setIsSavingOrder(true);

      try {
        await Promise.all(
          reordered.map((course, idx) =>
            apiRequest("PATCH", `/api/admin/lms/courses/${course.id}`, { sortOrder: idx + 1 })
          )
        );
        queryClient.invalidateQueries({ queryKey: ["/api/admin/lms/courses"] });
      } catch {
        toast({ title: "Gagal menyimpan urutan", variant: "destructive" });
        setLocalCourses(courses); // revert
      } finally {
        setIsSavingOrder(false);
      }
    },
    [localCourses, courses, toast]
  );

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <GraduationCap className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Akses ditolak. Hanya admin.</p>
        <Button asChild variant="outline">
          <Link href="/admin">← Kembali ke Admin</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SharedHeader />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-1" /> Admin
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Kelola Academy</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {localCourses.length} kursus terdaftar
                {isSavingOrder && <Loader2 className="w-3 h-3 animate-spin" />}
              </p>
            </div>
          </div>
          <Button onClick={() => setCourseDialog({ open: true })}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Kursus
          </Button>
        </div>

        {/* LMS Health Dashboard */}
        <LmsHealthCard
          health={health}
          isLoading={healthLoading}
          onRefresh={() => refetchHealth()}
          updatedAt={healthUpdatedAt}
        />

        {/* Courses list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : coursesError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-destructive font-medium">Gagal memuat daftar kursus.</p>
              <p className="text-sm text-muted-foreground">Coba muat ulang halaman.</p>
            </CardContent>
          </Card>
        ) : localCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
              <p className="text-muted-foreground">Belum ada kursus. Tambahkan kursus pertama!</p>
              <Button onClick={() => setCourseDialog({ open: true })}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Kursus
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCourseDragEnd}
          >
            <SortableContext
              items={localCourses.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {localCourses.map((course) => (
                  <SortableCourseCard
                    key={course.id}
                    course={course}
                    expanded={expanded.has(course.id)}
                    onToggle={() => toggleExpand(course.id)}
                    onEdit={() => setCourseDialog({ open: true, initial: course })}
                    onDelete={() => setDeleteCourse(course)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Course create/edit dialog */}
      <CourseDialog
        open={courseDialog.open}
        onClose={() => setCourseDialog({ open: false })}
        initial={courseDialog.initial}
        onSaved={() => {}}
      />

      {/* Delete course confirm */}
      <AlertDialog open={!!deleteCourse} onOpenChange={(o) => !o && setDeleteCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {forceDeleteConfirm ? "Konfirmasi hapus paksa?" : "Hapus kursus?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {forceDeleteConfirm ? (
                  <>
                    <p>
                      Anda akan menghapus permanen{" "}
                      <strong>"{deleteCourse?.title}"</strong> beserta{" "}
                      <strong>{deleteEnrollmentCount} data siswa</strong>. Tindakan ini{" "}
                      <strong>tidak dapat dibatalkan</strong>.
                    </p>
                    <p className="text-destructive font-medium">
                      Semua progress dan sertifikat siswa akan ikut terhapus.
                    </p>
                  </>
                ) : deleteEnrollmentCount === null ? (
                  <p className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Memeriksa data siswa…
                  </p>
                ) : deleteEnrollmentCount === -1 ? (
                  <div className="space-y-2">
                    <p className="text-destructive">
                      Gagal memeriksa jumlah siswa yang terdaftar. Hapus dibatalkan untuk
                      keamanan.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDeleteEnrollmentCount(null);
                        if (deleteCourse) {
                          apiRequest("GET", `/api/admin/lms/courses/${deleteCourse.id}/stats`)
                            .then((data: any) =>
                              setDeleteEnrollmentCount(data.enrollmentCount ?? 0)
                            )
                            .catch(() => setDeleteEnrollmentCount(-1));
                        }
                      }}
                    >
                      Coba lagi
                    </Button>
                  </div>
                ) : deleteEnrollmentCount > 0 ? (
                  <>
                    <p>
                      Kursus <strong>"{deleteCourse?.title}"</strong> memiliki{" "}
                      <strong>{deleteEnrollmentCount} siswa terdaftar</strong>.
                    </p>
                    <p>
                      Disarankan untuk <strong>nonaktifkan</strong> kursus agar siswa tidak
                      kehilangan progress mereka. Hapus paksa hanya jika Anda yakin data siswa
                      boleh dihapus.
                    </p>
                  </>
                ) : (
                  <p>
                    "{deleteCourse?.title}" beserta semua lesson-nya akan dihapus permanen.
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-wrap gap-2">
            <AlertDialogCancel onClick={() => setForceDeleteConfirm(false)}>
              Batal
            </AlertDialogCancel>
            {!forceDeleteConfirm && deleteEnrollmentCount !== null && deleteEnrollmentCount > 0 ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => deleteCourse && deactivateMut.mutate(deleteCourse.id)}
                  disabled={deactivateMut.isPending}
                >
                  {deactivateMut.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  Nonaktifkan saja
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setForceDeleteConfirm(true)}
                >
                  Hapus paksa…
                </Button>
              </>
            ) : (
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() =>
                  deleteCourse &&
                  delMut.mutate({
                    id: deleteCourse.id,
                    // Only send force=true when admin has explicitly gone through
                    // the force-confirm step. Never infer from enrollment count.
                    force: forceDeleteConfirm,
                  })
                }
                disabled={
                  delMut.isPending ||
                  deleteEnrollmentCount === null ||
                  deleteEnrollmentCount === -1
                }
              >
                {delMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
