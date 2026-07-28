/**
 * RSFilePicker — Reusable dialog untuk memilih file dari Ruang Simpan.
 * Bisa dipakai oleh modul mana pun (KB Agent, Jasa Dokumen, Jasa Keuangan, dll.)
 *
 * Props:
 *   open         — buka/tutup dialog
 *   onOpenChange — callback buka/tutup
 *   onSelect     — dipanggil dengan RSPickerFile yang dipilih
 *   title        — judul dialog (opsional)
 *   description  — deskripsi dialog (opsional)
 *   accept       — filter mime_type (opsional, misal ["application/pdf","application/msword"])
 */

import { useState, useEffect } from "react";
import { Search, FileText, File, Image, Music, Video, Loader2, FolderOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface RSPickerFile {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  description?: string;
  tags?: string[];
  kb_status?: string;
  folder_name?: string;
  created_at: string;
}

interface RSFilePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: RSPickerFile) => void;
  title?: string;
  description?: string;
  /** Filter jenis mime_type. Jika tidak diisi, semua file ditampilkan. */
  accept?: string[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <Image className="w-5 h-5 text-blue-500 shrink-0" />;
  if (mimeType.startsWith("video/")) return <Video className="w-5 h-5 text-purple-500 shrink-0" />;
  if (mimeType.startsWith("audio/")) return <Music className="w-5 h-5 text-orange-500 shrink-0" />;
  if (mimeType === "application/pdf") return <FileText className="w-5 h-5 text-red-500 shrink-0" />;
  return <File className="w-5 h-5 text-muted-foreground shrink-0" />;
}

const KB_STATUS_BADGE: Record<string, { label: string; class: string }> = {
  ready: { label: "Siap RAG", class: "bg-green-100 text-green-700 border-green-200" },
  processing: { label: "Memproses", class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  pending: { label: "Menunggu", class: "bg-gray-100 text-gray-600 border-gray-200" },
  failed: { label: "Gagal", class: "bg-red-100 text-red-700 border-red-200" },
  skipped: { label: "Dilewati", class: "bg-gray-100 text-gray-400 border-gray-200" },
};

export function RSFilePicker({
  open,
  onOpenChange,
  onSelect,
  title = "Pilih dari Ruang Simpan",
  description = "Pilih dokumen yang sudah tersimpan di Ruang Simpan Anda.",
  accept,
}: RSFilePickerProps) {
  const [files, setFiles] = useState<RSPickerFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setError(null);
    setLoading(true);
    fetch("/api/ruang-kelola/simpan-files", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Gagal memuat file");
        return r.json();
      })
      .then((data: RSPickerFile[]) => {
        setFiles(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [open]);

  const filtered = files.filter((f) => {
    const matchSearch =
      !search ||
      f.original_name.toLowerCase().includes(search.toLowerCase()) ||
      (f.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.folder_name || "").toLowerCase().includes(search.toLowerCase());
    const matchAccept = !accept || accept.length === 0 || accept.some((a) => f.mime_type.startsWith(a.replace("*", "")));
    return matchSearch && matchAccept;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="w-4 h-4 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>

        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama file, deskripsi, folder…"
              className="pl-9 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-1">
            {loading && (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Memuat file…</span>
              </div>
            )}
            {!loading && error && (
              <div className="text-center py-10 text-sm text-destructive">{error}</div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-10 text-sm text-muted-foreground">
                {search ? "Tidak ada file yang cocok." : "Belum ada file di Ruang Simpan."}
              </div>
            )}
            {!loading &&
              !error &&
              filtered.map((f) => {
                const kbBadge = f.kb_status ? KB_STATUS_BADGE[f.kb_status] : null;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelect(f);
                      onOpenChange(false);
                    }}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group border border-transparent hover:border-border"
                  >
                    <FileIcon mimeType={f.mime_type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary">
                        {f.original_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{formatBytes(f.size_bytes)}</span>
                        {f.folder_name && (
                          <span className="text-xs text-muted-foreground">📁 {f.folder_name}</span>
                        )}
                        {kbBadge && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 h-4 ${kbBadge.class}`}
                          >
                            {kbBadge.label}
                          </Badge>
                        )}
                      </div>
                      {f.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {f.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      tabIndex={-1}
                    >
                      Pilih
                    </Button>
                  </button>
                );
              })}
          </div>
        </ScrollArea>

        <div className="px-4 py-3 border-t flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {filtered.length} file ditemukan
          </span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
