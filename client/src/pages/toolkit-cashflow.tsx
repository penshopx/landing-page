import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Wallet, ListChecks, Gauge, FileText, ClipboardCheck,
  CalendarCheck, ShieldAlert, Info, Copy, Printer, Plus, Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  TRACKER_7_TITIK, ZERO_DEFECT_ITEMS, RED_FLAGS, FRIDAY_REVIEW,
  SURAT_TEMPLATES, BUFFER_TARGETS, TRIAGE_QUADRANTS,
} from "@/data/cashflow-toolkit";

function fmt(n: number) { return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }); }

// ── persist kecil di localStorage ────────────────────────────────────────────
function usePersisted<T>(key: string, initial: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw);
      // buang nilai korup: null/undefined atau tipe tidak cocok dengan nilai awal
      if (parsed === null || parsed === undefined) return initial;
      if (Array.isArray(initial) !== Array.isArray(parsed)) return initial;
      if (typeof parsed !== typeof initial) return initial;
      return parsed as T;
    } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

const TOOLS = [
  { key: "triage", label: "Cash Triage", icon: Wallet },
  { key: "tracker", label: "Termin Tracker", icon: ListChecks },
  { key: "buffer", label: "Buffer & Runway", icon: Gauge },
  { key: "surat", label: "Surat Generator", icon: FileText },
  { key: "zerodefect", label: "Zero-Defect", icon: ClipboardCheck },
  { key: "friday", label: "Friday Review", icon: CalendarCheck },
  { key: "redflags", label: "Red Flags", icon: ShieldAlert },
] as const;
type ToolKey = typeof TOOLS[number]["key"];

// ═════════════════════════════ T1: CASH TRIAGE ══════════════════════════════
interface TriageRow { id: string; nama: string; nilai: number; kuadran: string }
function CashTriage() {
  const [rows, setRows] = usePersisted<TriageRow[]>("cfpbj-triage", []);
  const [nama, setNama] = useState(""); const [nilai, setNilai] = useState(0); const [kuadran, setKuadran] = useState("kritis");
  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    rows.forEach(r => { t[r.kuadran] = (t[r.kuadran] || 0) + r.nilai; });
    return t;
  }, [rows]);
  const colorMap: Record<string, string> = { red: "border-red-500/30 bg-red-500/5 text-red-400", amber: "border-amber-500/30 bg-amber-500/5 text-amber-400", blue: "border-blue-500/30 bg-blue-500/5 text-blue-400", slate: "border-slate-500/30 bg-slate-500/5 text-slate-400" };
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-xs text-cyan-300">Cash Triage Matrix: saat kas terbatas, jangan bayar siapa yang paling berisik — bayar berdasarkan kuadran prioritas. Masukkan semua kewajiban Anda, kelompokkan, dan patuhi urutannya.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/3 p-4 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px_170px_auto] gap-2">
          <input value={nama} onChange={e => setNama(e.target.value)} placeholder="Kewajiban (cth: upah tukang minggu ini)" data-testid="input-triage-nama"
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
          <input type="number" value={nilai || ""} onChange={e => setNilai(+e.target.value)} placeholder="Nilai (Rp)" data-testid="input-triage-nilai"
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
          <select value={kuadran} onChange={e => setKuadran(e.target.value)} data-testid="select-triage-kuadran"
            className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-xs text-white focus:outline-none">
            {TRIAGE_QUADRANTS.map(q => <option key={q.key} value={q.key}>{q.label}</option>)}
          </select>
          <Button size="sm" data-testid="button-triage-tambah" disabled={!nama.trim() || nilai <= 0}
            onClick={() => { setRows([...rows, { id: `${Date.now()}`, nama: nama.trim(), nilai, kuadran }]); setNama(""); setNilai(0); }}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {TRIAGE_QUADRANTS.map(q => (
          <div key={q.key} className={`rounded-2xl border p-4 ${colorMap[q.warna]}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold">{q.label}</p>
              <p className="text-xs font-semibold">{fmt(totals[q.key] || 0)}</p>
            </div>
            <p className="text-[10px] opacity-70 mb-0.5">Contoh: {q.contoh}</p>
            <p className="text-[10px] opacity-90 mb-2">Aksi: {q.aksi}</p>
            <div className="space-y-1">
              {rows.filter(r => r.kuadran === q.key).map(r => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-950/40 px-2.5 py-1.5">
                  <span className="text-[11px] text-white truncate">{r.nama}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-300">{fmt(r.nilai)}</span>
                    <button onClick={() => setRows(rows.filter(x => x.id !== r.id))} className="text-slate-500 hover:text-red-400" data-testid={`button-triage-hapus-${r.id}`}><Trash2 className="h-3 w-3" /></button>
                  </span>
                </div>
              ))}
              {rows.filter(r => r.kuadran === q.key).length === 0 && <p className="text-[10px] opacity-50 italic">Belum ada item.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════ T2: TERMIN TRACKER 7-TITIK ═══════════════════════
interface TrackerState { termin: string; nilai: number; titik: number; sejak: string }
function TerminTracker() {
  const [s, setS] = usePersisted<TrackerState>("cfpbj-tracker", { termin: "", nilai: 0, titik: 1, sejak: "" });
  const hariDiTitik = useMemo(() => {
    if (!s.sejak) return 0;
    const d = Math.floor((Date.now() - new Date(s.sejak).getTime()) / 86400000);
    return isNaN(d) || d < 0 ? 0 : d;
  }, [s.sejak]);
  const aktif = TRACKER_7_TITIK.find(t => t.no === s.titik) ?? TRACKER_7_TITIK[0];
  const lewat = hariDiTitik > aktif.batasWajarHari;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-xs text-cyan-300">Uang termin Anda "berjalan" melewati 7 titik birokrasi. Tandai posisinya — bila melewati batas wajar di satu titik, itulah tempat follow-up Anda hari ini. Jangan menagih ke titik yang salah.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/3 p-4 grid sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Termin yang dilacak</label>
          <input value={s.termin} onChange={e => setS({ ...s, termin: e.target.value })} placeholder="cth: Termin II — Rp 500 jt" data-testid="input-tracker-termin"
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Posisi sekarang</label>
          <select value={s.titik} onChange={e => setS({ ...s, titik: +e.target.value, sejak: s.sejak })} data-testid="select-tracker-titik"
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-xs text-white focus:outline-none">
            {TRACKER_7_TITIK.map(t => <option key={t.no} value={t.no}>Titik {t.no} — {t.nama}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Masuk titik ini sejak</label>
          <input type="date" value={s.sejak} onChange={e => setS({ ...s, sejak: e.target.value })} data-testid="input-tracker-sejak"
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none" />
        </div>
      </div>
      {s.sejak && (
        <div className={`rounded-2xl border p-4 ${lewat ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`} data-testid="status-tracker">
          <p className={`text-sm font-bold ${lewat ? "text-red-400" : "text-emerald-400"}`}>
            {lewat ? `⚠ Sudah ${hariDiTitik} hari di Titik ${aktif.no} (batas wajar ±${aktif.batasWajarHari} hari) — waktunya follow-up!` : `✓ ${hariDiTitik} hari di Titik ${aktif.no} — masih dalam batas wajar (±${aktif.batasWajarHari} hari).`}
          </p>
          <p className="text-xs text-slate-300 mt-1">Pemegang berkas: <span className="text-white">{aktif.pemegang}</span></p>
          <p className="text-xs text-slate-400 mt-0.5">Tip: {aktif.tip}</p>
        </div>
      )}
      <div className="space-y-1.5">
        {TRACKER_7_TITIK.map(t => {
          const passed = t.no < s.titik; const current = t.no === s.titik;
          return (
            <div key={t.no} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${current ? "border-cyan-500/40 bg-cyan-500/8" : passed ? "border-emerald-500/20 bg-emerald-500/4" : "border-white/8 bg-white/2"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${current ? "bg-cyan-500 text-white" : passed ? "bg-emerald-600 text-white" : "bg-white/10 text-slate-400"}`}>{passed ? "✓" : t.no}</div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold ${current ? "text-cyan-300" : "text-white"}`}>{t.nama}</p>
                <p className="text-[10px] text-slate-500">{t.pemegang} · batas wajar ±{t.batasWajarHari} hari</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════ T3: BUFFER & RUNWAY ══════════════════════════════
function BufferCalc() {
  const [saldo, setSaldo] = usePersisted("cfpbj-buf-saldo", 0);
  const [burn, setBurn] = usePersisted("cfpbj-buf-burn", 0);
  const [kontrak, setKontrak] = usePersisted("cfpbj-buf-kontrak", 0);
  const [sumber, setSumber] = usePersisted<"APBN" | "APBD">("cfpbj-buf-sumber", "APBD");
  const runway = burn > 0 ? Math.floor(saldo / (burn / 30)) : 0;
  const tgt = BUFFER_TARGETS[sumber];
  const bufMin = kontrak * tgt.min / 100, bufMax = kontrak * tgt.max / 100;
  const status = runway >= 30 ? "hijau" : runway >= 21 ? "kuning" : "merah";
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-xs text-cyan-300">Buffer adalah oksigen perusahaan: cadangan yang TIDAK boleh disentuh untuk operasional harian. Target: {BUFFER_TARGETS.APBN.min}-{BUFFER_TARGETS.APBN.max}% nilai kontrak (APBN) atau {BUFFER_TARGETS.APBD.min}-{BUFFER_TARGETS.APBD.max}% (APBD — termin lebih sering telat).</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/3 p-4 grid sm:grid-cols-2 gap-3">
        {[
          { label: "Saldo kas sekarang (Rp)", val: saldo, set: setSaldo, tid: "input-buffer-saldo" },
          { label: "Pengeluaran rutin per bulan / burn rate (Rp)", val: burn, set: setBurn, tid: "input-buffer-burn" },
          { label: "Nilai kontrak proyek (Rp)", val: kontrak, set: setKontrak, tid: "input-buffer-kontrak" },
        ].map(f => (
          <div key={f.tid}>
            <label className="text-xs text-slate-400 block mb-1.5">{f.label}</label>
            <input type="number" value={f.val || ""} onChange={e => f.set(+e.target.value)} data-testid={f.tid}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
            {f.val > 0 && <p className="text-[10px] text-slate-500 mt-1">{fmt(f.val)}</p>}
          </div>
        ))}
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Sumber anggaran</label>
          <select value={sumber} onChange={e => setSumber(e.target.value as "APBN" | "APBD")} data-testid="select-buffer-sumber"
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-xs text-white focus:outline-none">
            <option value="APBN">APBN (pusat)</option>
            <option value="APBD">APBD (daerah)</option>
          </select>
        </div>
      </div>
      {(saldo > 0 || burn > 0) && (
        <div className={`rounded-2xl border p-5 ${status === "hijau" ? "border-emerald-500/30 bg-emerald-500/5" : status === "kuning" ? "border-amber-500/30 bg-amber-500/5" : "border-red-500/30 bg-red-500/5"}`} data-testid="hasil-buffer">
          <div className="text-center mb-4">
            <p className="text-[10px] text-slate-500 mb-1">Runway (dengan saldo sekarang)</p>
            <p className={`text-3xl font-bold ${status === "hijau" ? "text-emerald-400" : status === "kuning" ? "text-amber-400" : "text-red-400"}`}>
              {burn > 0 ? `${runway} hari ${status === "hijau" ? "🟢" : status === "kuning" ? "🟡" : "🔴"}` : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {status === "hijau" ? "Sehat. Kunci buffer, jangan kendor." : status === "kuning" ? "Zona waspada (< 30 hari). Percepat penagihan, rem pengeluaran non-kritis." : "KRITIS (< 21 hari). Aktifkan protokol darurat: triase kewajiban + kejar termin terdekat."}
            </p>
          </div>
          {kontrak > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/3 border border-white/8 p-2.5"><p className="text-[9px] text-slate-500 mb-0.5">Target buffer minimum ({tgt.min}% · {sumber})</p><p className="text-xs font-bold text-white">{fmt(bufMin)}</p></div>
              <div className="rounded-lg bg-white/3 border border-white/8 p-2.5"><p className="text-[9px] text-slate-500 mb-0.5">Target buffer aman ({tgt.max}%)</p><p className="text-xs font-bold text-white">{fmt(bufMax)}</p></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════ T4: SURAT GENERATOR ══════════════════════════════
function SuratGenerator() {
  const { toast } = useToast();
  const [tplId, setTplId] = useState(SURAT_TEMPLATES[0].id);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [hasil, setHasil] = useState("");
  const tpl = SURAT_TEMPLATES.find(t => t.id === tplId)!;
  function cetak() {
    const w = window.open("", "_blank"); if (!w) return;
    const esc = hasil.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    w.document.write(`<html><head><title>${tpl.nama}</title><style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.6;max-width:720px;margin:40px auto;white-space:pre-wrap}</style></head><body>${esc}</body></html>`);
    w.document.close(); w.print();
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-xs text-cyan-300">12 template surat resmi siap pakai untuk mengawal arus kas: dari menanyakan status pembayaran sampai somasi. Pilih sesuai tahapan — mulai dari yang paling santun.</p>
      </div>
      <div>
        <label className="text-xs text-slate-400 block mb-1.5">Pilih template</label>
        <select value={tplId} onChange={e => { setTplId(e.target.value); setHasil(""); }} data-testid="select-surat-template"
          className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs text-white focus:outline-none">
          {SURAT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
        </select>
        <p className="text-[10px] text-slate-500 mt-1.5">Kapan dipakai: {tpl.kapan}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/3 p-4 grid sm:grid-cols-2 gap-3">
        {tpl.fields.map(f => (
          <div key={f.key} className={f.multiline ? "sm:col-span-2" : ""}>
            <label className="text-xs text-slate-400 block mb-1.5">{f.label}</label>
            {f.multiline ? (
              <textarea rows={3} value={fields[f.key] || ""} onChange={e => setFields({ ...fields, [f.key]: e.target.value })} placeholder={f.placeholder} data-testid={`input-surat-${f.key}`}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
            ) : (
              <input value={fields[f.key] || ""} onChange={e => setFields({ ...fields, [f.key]: e.target.value })} placeholder={f.placeholder} data-testid={`input-surat-${f.key}`}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
            )}
          </div>
        ))}
      </div>
      <Button className="w-full" onClick={() => setHasil(tpl.render(fields))} data-testid="button-surat-generate">
        <FileText className="h-4 w-4 mr-2" />Buat Draft Surat
      </Button>
      {hasil && (
        <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
          <pre className="text-xs text-slate-200 whitespace-pre-wrap font-mono max-h-96 overflow-auto mb-3" data-testid="text-surat-hasil">{hasil}</pre>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" data-testid="button-surat-salin"
              onClick={() => { navigator.clipboard.writeText(hasil); toast({ title: "Tersalin", description: "Draft surat disalin ke clipboard." }); }}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />Salin
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={cetak} data-testid="button-surat-cetak">
              <Printer className="h-3.5 w-3.5 mr-1.5" />Cetak / PDF
            </Button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Draft ini alat bantu — sesuaikan dengan kondisi & kontrak Anda. Untuk somasi/langkah hukum, pertimbangkan pendampingan penasihat hukum.</p>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════ T5: ZERO-DEFECT CHECKLIST ════════════════════════
function ZeroDefect() {
  const [checked, setChecked] = usePersisted<Record<string, boolean>>("cfpbj-zerodefect", {});
  const done = ZERO_DEFECT_ITEMS.filter(i => checked[i.id]).length;
  const pct = Math.round(done / ZERO_DEFECT_ITEMS.length * 100);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-xs text-cyan-300">Satu berkas kurang = alasan sah menunda pembayaran berminggu-minggu. Jangan ajukan tagihan sebelum semua tercentang. Berkas zero-defect adalah senjata Anda.</p>
      </div>
      <div className={`rounded-2xl border p-4 ${pct === 100 ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-white/3"}`}>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-slate-400">Kesiapan berkas</p>
          <p className={`text-xs font-bold ${pct === 100 ? "text-emerald-400" : "text-white"}`} data-testid="text-zerodefect-progres">{done}/{ZERO_DEFECT_ITEMS.length} ({pct}%) {pct === 100 ? "— SIAP DIAJUKAN ✓" : ""}</p>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-cyan-500"}`} style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="space-y-1.5">
        {ZERO_DEFECT_ITEMS.map(i => (
          <label key={i.id} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer ${checked[i.id] ? "border-emerald-500/25 bg-emerald-500/4" : "border-white/8 bg-white/2 hover:bg-white/4"}`}>
            <input type="checkbox" checked={!!checked[i.id]} onChange={e => setChecked({ ...checked, [i.id]: e.target.checked })} data-testid={`checkbox-zerodefect-${i.id}`} className="mt-0.5 accent-emerald-500" />
            <span>
              <span className={`text-xs font-semibold block ${checked[i.id] ? "text-emerald-300" : "text-white"}`}>{i.nama}</span>
              <span className="text-[10px] text-slate-500">{i.detail}</span>
            </span>
          </label>
        ))}
      </div>
      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setChecked({})} data-testid="button-zerodefect-reset">Reset untuk tagihan berikutnya</Button>
    </div>
  );
}

// ═════════════════════════ T6: FRIDAY REVIEW ════════════════════════════════
function FridayReview() {
  const [notes, setNotes] = usePersisted<Record<string, string>>("cfpbj-friday", {});
  const { toast } = useToast();
  function salin() {
    const teks = `FRIDAY REVIEW — ${new Date().toLocaleDateString("id-ID")}\n\n` + FRIDAY_REVIEW.map(a => `■ ${a.agenda}\n${notes[a.id] || "-"}`).join("\n\n");
    navigator.clipboard.writeText(teks); toast({ title: "Tersalin", description: "Hasil Friday Review disalin — tempel ke WA grup tim Anda." });
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-xs text-cyan-300">Ritual Jumat 30 menit: rapat triase kas mingguan. Perusahaan yang mati bukan yang masalahnya besar — tapi yang tidak pernah mengecek. Isi tiap agenda, salin hasilnya ke grup tim.</p>
      </div>
      {FRIDAY_REVIEW.map(a => (
        <div key={a.id} className="rounded-2xl border border-white/10 bg-white/3 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 rounded px-1.5 py-0.5">{a.menit}</span>
            <p className="text-xs font-semibold text-white">{a.agenda}</p>
          </div>
          <p className="text-[10px] text-slate-500 mb-2">{a.pertanyaan}</p>
          <textarea rows={2} value={notes[a.id] || ""} onChange={e => setNotes({ ...notes, [a.id]: e.target.value })} placeholder="Catatan minggu ini..." data-testid={`input-friday-${a.id}`}
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none" />
        </div>
      ))}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={salin} data-testid="button-friday-salin"><Copy className="h-3.5 w-3.5 mr-1.5" />Salin Hasil Review</Button>
        <Button variant="outline" onClick={() => setNotes({})} data-testid="button-friday-reset">Reset</Button>
      </div>
    </div>
  );
}

// ═════════════════════════ T7: RED FLAGS SCANNER ════════════════════════════
function RedFlagsScanner() {
  const [flags, setFlags] = usePersisted<Record<string, boolean>>("cfpbj-redflags", {});
  const skor = RED_FLAGS.filter(r => flags[r.id]).reduce((a, r) => a + r.bobot, 0);
  const maxSkor = RED_FLAGS.reduce((a, r) => a + r.bobot, 0);
  const level = skor === 0 ? null : skor <= 5 ? "rendah" : skor <= 12 ? "sedang" : "tinggi";
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-xs text-cyan-300">Baca kontrak/SPK Anda, lalu centang klausul berbahaya yang Anda temukan. Skor risiko dihitung otomatis. Untuk bedah otomatis oleh AI, gunakan fitur Bedah Dokumen.</p>
      </div>
      {level && (
        <div className={`rounded-2xl border p-4 text-center ${level === "rendah" ? "border-emerald-500/30 bg-emerald-500/5" : level === "sedang" ? "border-amber-500/30 bg-amber-500/5" : "border-red-500/30 bg-red-500/5"}`} data-testid="hasil-redflags">
          <p className={`text-2xl font-bold ${level === "rendah" ? "text-emerald-400" : level === "sedang" ? "text-amber-400" : "text-red-400"}`}>Skor Risiko: {skor}/{maxSkor} — {level.toUpperCase()}</p>
          <p className="text-xs text-slate-400 mt-1">
            {level === "rendah" ? "Relatif aman — tetap perhatikan mitigasi pada poin yang tercentang." : level === "sedang" ? "Perlu negosiasi klausul sebelum tanda tangan, atau perkuat mitigasi." : "Kontrak berisiko tinggi bagi kas Anda. Nego ulang klausul kritis / konsultasikan sebelum tanda tangan."}
          </p>
        </div>
      )}
      <div className="space-y-1.5">
        {RED_FLAGS.map(r => (
          <label key={r.id} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer ${flags[r.id] ? "border-red-500/25 bg-red-500/4" : "border-white/8 bg-white/2 hover:bg-white/4"}`}>
            <input type="checkbox" checked={!!flags[r.id]} onChange={e => setFlags({ ...flags, [r.id]: e.target.checked })} data-testid={`checkbox-redflag-${r.id}`} className="mt-0.5 accent-red-500" />
            <span>
              <span className={`text-xs font-semibold block ${flags[r.id] ? "text-red-300" : "text-white"}`}>{r.klausul} <span className="text-[9px] text-slate-500">(bobot {r.bobot})</span></span>
              <span className="text-[10px] text-slate-500 block">Bahaya: {r.bahaya}</span>
              {flags[r.id] && <span className="text-[10px] text-amber-300/90 block mt-0.5">Mitigasi: {r.mitigasi}</span>}
            </span>
          </label>
        ))}
      </div>
      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setFlags({})} data-testid="button-redflags-reset">Reset scanner</Button>
    </div>
  );
}

// ═════════════════════════════════ PAGE ═════════════════════════════════════
export default function ToolkitCashflowPage() {
  const [tool, setTool] = useState<ToolKey>("triage");
  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/toolkit" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors" data-testid="link-kembali-toolkit">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-400" /> Toolkit CASHFLOW-PBJ
            </h1>
            <p className="text-xs text-slate-400">7 alat arus kas kontraktor proyek pemerintah — dari metode "Kas Merah, RAB Hijau". Data tersimpan di perangkat Anda.</p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap mb-5">
          {TOOLS.map(t => (
            <button key={t.key} onClick={() => setTool(t.key)} data-testid={`tab-${t.key}`}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${tool === t.key ? "bg-emerald-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"}`}>
              <t.icon className="h-3.5 w-3.5" />{t.label}
            </button>
          ))}
        </div>
        {tool === "triage" && <CashTriage />}
        {tool === "tracker" && <TerminTracker />}
        {tool === "buffer" && <BufferCalc />}
        {tool === "surat" && <SuratGenerator />}
        {tool === "zerodefect" && <ZeroDefect />}
        {tool === "friday" && <FridayReview />}
        {tool === "redflags" && <RedFlagsScanner />}
        <div className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
          <p className="text-xs text-violet-300">Butuh pendampingan yang paham konteks Anda? Konsultasikan dengan <span className="font-semibold">Pak Arga & 7 AI Spesialis CASHFLOW-PBJ</span> di Klinik Konsultasi — dari diagnosis kas sampai draft surat yang disesuaikan kasus Anda.</p>
        </div>
      </div>
    </div>
  );
}
