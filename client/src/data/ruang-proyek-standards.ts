/**
 * Standar administrasi & dokumentasi proyek — rujukan Ruang Proyek.
 * Katalog dokumen baku per tahapan + template generator dokumen.
 */

export type AdminDocStage = "persiapan" | "pelaksanaan" | "serah_terima";
export type AdminDocStatus = "belum" | "proses" | "selesai" | "tidak_perlu";

export type AdminDoc = {
  id: string;
  key: string;
  label: string;
  stage: AdminDocStage;
  status: AdminDocStatus;
  fileId?: string | null;
  note?: string | null;
};

export const STAGE_LABEL: Record<AdminDocStage, string> = {
  persiapan: "Tahap 1 — Persiapan & Kontrak",
  pelaksanaan: "Tahap 2 — Pelaksanaan",
  serah_terima: "Tahap 3 — Serah Terima & Pemeliharaan",
};

export const STAGE_ORDER: AdminDocStage[] = ["persiapan", "pelaksanaan", "serah_terima"];

// Katalog dokumen standar proyek (konstruksi/pengadaan/jasa umum di Indonesia).
export const STANDARD_ADMIN_DOCS: { key: string; label: string; stage: AdminDocStage }[] = [
  // Persiapan & Kontrak
  { key: "penawaran",      label: "Surat Penawaran Harga",                       stage: "persiapan" },
  { key: "rab",            label: "RAB / Daftar Kuantitas & Harga",              stage: "persiapan" },
  { key: "kontrak",        label: "Kontrak / Surat Perjanjian / SPK",            stage: "persiapan" },
  { key: "spmk",           label: "SPMK (Surat Perintah Mulai Kerja)",           stage: "persiapan" },
  { key: "jaminan_pelaks", label: "Jaminan Pelaksanaan",                         stage: "persiapan" },
  { key: "jadwal",         label: "Jadwal Pelaksanaan (Kurva S)",                stage: "persiapan" },
  { key: "rkk",            label: "RKK / RK3 (Rencana Keselamatan Konstruksi)",  stage: "persiapan" },
  { key: "struktur",       label: "Struktur Organisasi & Personel Proyek",       stage: "persiapan" },
  { key: "mc0",            label: "MC-0 / Mutual Check Awal (0%)",               stage: "persiapan" },
  // Pelaksanaan
  { key: "request",        label: "Request Pekerjaan / Izin Pelaksanaan",        stage: "pelaksanaan" },
  { key: "lap_harian",     label: "Laporan Harian",                              stage: "pelaksanaan" },
  { key: "lap_mingguan",   label: "Laporan Mingguan",                            stage: "pelaksanaan" },
  { key: "lap_bulanan",    label: "Laporan Bulanan / Progres (MC)",              stage: "pelaksanaan" },
  { key: "ba_periksa",     label: "Berita Acara Pemeriksaan Pekerjaan",          stage: "pelaksanaan" },
  { key: "foto",           label: "Dokumentasi Foto 0% / 50% / 100%",            stage: "pelaksanaan" },
  { key: "shopdrawing",    label: "Shop Drawing / Gambar Kerja",                 stage: "pelaksanaan" },
  { key: "addendum",       label: "Addendum / CCO (bila ada perubahan)",         stage: "pelaksanaan" },
  // Serah Terima & Pemeliharaan
  { key: "mc100",          label: "MC-100 / Perhitungan Akhir (100%)",           stage: "serah_terima" },
  { key: "pho",            label: "Berita Acara Serah Terima I (PHO)",           stage: "serah_terima" },
  { key: "asbuilt",        label: "As-Built Drawing",                            stage: "serah_terima" },
  { key: "jaminan_plhr",   label: "Jaminan Pemeliharaan",                        stage: "serah_terima" },
  { key: "fho",            label: "Berita Acara Serah Terima II (FHO)",          stage: "serah_terima" },
  { key: "lap_akhir",      label: "Laporan Akhir Proyek",                        stage: "serah_terima" },
];

// ── Generator dokumen ──────────────────────────────────────────────────────

export type GeneratorField = { name: string; label: string; placeholder?: string; multiline?: boolean };
export type GeneratorTemplate = {
  key: string;
  title: string;
  description: string;
  fields: GeneratorField[];
  render: (p: {
    projectName: string; client: string; location: string;
    contractValue: string; startDate: string; endDate: string;
  }, f: Record<string, string>) => string;
};

const line = (s: string) => s + "\n";
const today = () => new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export const GENERATOR_TEMPLATES: GeneratorTemplate[] = [
  {
    key: "spk",
    title: "Surat Perintah Kerja (SPK)",
    description: "Perintah tertulis dari pemberi kerja kepada pelaksana untuk memulai pekerjaan.",
    fields: [
      { name: "nomor", label: "Nomor surat", placeholder: "001/SPK/VIII/2026" },
      { name: "pihak1", label: "Nama & jabatan pihak pemberi kerja", placeholder: "Budi Santoso — Direktur PT Maju" },
      { name: "pihak2", label: "Nama & jabatan pihak pelaksana", placeholder: "Andi Wijaya — Direktur CV Karya" },
      { name: "durasi", label: "Jangka waktu pelaksanaan", placeholder: "90 (sembilan puluh) hari kalender" },
    ],
    render: (p, f) =>
      line(`SURAT PERINTAH KERJA (SPK)`) +
      line(`Nomor: ${f.nomor || "…"}`) + "\n" +
      line(`Yang bertanda tangan di bawah ini:`) +
      line(`PIHAK PERTAMA (Pemberi Kerja): ${f.pihak1 || p.client || "…"}`) +
      line(`PIHAK KEDUA (Pelaksana): ${f.pihak2 || "…"}`) + "\n" +
      line(`PIHAK PERTAMA memerintahkan PIHAK KEDUA untuk melaksanakan pekerjaan:`) +
      line(`  Nama Pekerjaan : ${p.projectName}`) +
      line(`  Lokasi         : ${p.location || "…"}`) +
      line(`  Nilai Pekerjaan: ${p.contractValue || "…"}`) +
      line(`  Jangka Waktu   : ${f.durasi || "…"}`) +
      (p.startDate ? line(`  Mulai Kerja    : ${p.startDate}`) : "") + "\n" +
      line(`Ketentuan:`) +
      line(`1. Pekerjaan dilaksanakan sesuai spesifikasi teknis, gambar, dan RAB yang telah disepakati.`) +
      line(`2. PIHAK KEDUA wajib menjaga mutu, keselamatan kerja (K3), dan ketepatan waktu.`) +
      line(`3. Pembayaran dilakukan sesuai kesepakatan dalam kontrak/perjanjian.`) +
      line(`4. Hal-hal yang belum diatur dalam SPK ini akan diatur kemudian atas kesepakatan kedua pihak.`) + "\n" +
      line(`Diterbitkan pada tanggal ${today()}.`) + "\n" +
      line(`PIHAK PERTAMA,                          PIHAK KEDUA,`) + "\n\n\n" +
      line(`(${(f.pihak1 || "…………………………").split("—")[0].trim()})          (${(f.pihak2 || "…………………………").split("—")[0].trim()})`),
  },
  {
    key: "bast",
    title: "Berita Acara Serah Terima (BAST / PHO)",
    description: "Bukti serah terima hasil pekerjaan dari pelaksana kepada pemberi kerja.",
    fields: [
      { name: "nomor", label: "Nomor berita acara", placeholder: "001/BAST/VIII/2026" },
      { name: "pihak1", label: "Nama & jabatan pihak pemberi kerja" },
      { name: "pihak2", label: "Nama & jabatan pihak pelaksana" },
      { name: "catatan", label: "Catatan hasil pemeriksaan (opsional)", multiline: true, placeholder: "Pekerjaan telah selesai 100% dan diterima dengan baik." },
    ],
    render: (p, f) =>
      line(`BERITA ACARA SERAH TERIMA PEKERJAAN`) +
      line(`Nomor: ${f.nomor || "…"}`) + "\n" +
      line(`Pada hari ini, tanggal ${today()}, yang bertanda tangan di bawah ini:`) +
      line(`PIHAK PERTAMA (Pelaksana)   : ${f.pihak2 || "…"}`) +
      line(`PIHAK KEDUA (Pemberi Kerja) : ${f.pihak1 || p.client || "…"}`) + "\n" +
      line(`Dengan ini menyatakan bahwa PIHAK PERTAMA telah menyelesaikan dan menyerahkan hasil pekerjaan:`) +
      line(`  Nama Pekerjaan : ${p.projectName}`) +
      line(`  Lokasi         : ${p.location || "…"}`) +
      line(`  Nilai Pekerjaan: ${p.contractValue || "…"}`) + "\n" +
      line(`Hasil pemeriksaan bersama: ${f.catatan || "pekerjaan telah selesai dilaksanakan sesuai kontrak dan diterima dengan baik oleh PIHAK KEDUA."}`) + "\n" +
      line(`Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.`) + "\n" +
      line(`PIHAK PERTAMA,                          PIHAK KEDUA,`) + "\n\n\n" +
      line(`(…………………………)                    (…………………………)`),
  },
  {
    key: "progres",
    title: "Laporan Progres Pekerjaan",
    description: "Laporan kemajuan pekerjaan periode tertentu untuk pemberi kerja/pengawas.",
    fields: [
      { name: "periode", label: "Periode laporan", placeholder: "Minggu ke-4, 1–7 Agustus 2026" },
      { name: "progres", label: "Progres fisik saat ini (%)", placeholder: "45" },
      { name: "rencana", label: "Progres rencana (%)", placeholder: "50" },
      { name: "uraian", label: "Uraian pekerjaan yang dilaksanakan", multiline: true, placeholder: "- Pekerjaan struktur lantai 2\n- Pemasangan instalasi listrik" },
      { name: "kendala", label: "Kendala & tindak lanjut (opsional)", multiline: true },
    ],
    render: (p, f) =>
      line(`LAPORAN PROGRES PEKERJAAN`) + "\n" +
      line(`Nama Pekerjaan : ${p.projectName}`) +
      line(`Lokasi         : ${p.location || "…"}`) +
      line(`Pemberi Kerja  : ${p.client || "…"}`) +
      line(`Periode        : ${f.periode || "…"}`) + "\n" +
      line(`Progres fisik  : ${f.progres || "…"}% (rencana ${f.rencana || "…"}%) — deviasi ${f.progres && f.rencana ? (Number(f.progres) - Number(f.rencana)).toFixed(1) : "…"}%`) + "\n" +
      line(`Uraian pekerjaan yang dilaksanakan:`) +
      line(f.uraian || "…") + "\n" +
      (f.kendala ? line(`Kendala & tindak lanjut:`) + line(f.kendala) + "\n" : "") +
      line(`Dibuat tanggal ${today()}.`) + "\n" +
      line(`Pelaksana,                              Mengetahui Pengawas/Direksi,`) + "\n\n\n" +
      line(`(…………………………)                    (…………………………)`),
  },
  {
    key: "penawaran",
    title: "Surat Penawaran Harga",
    description: "Surat penawaran pekerjaan kepada calon pemberi kerja.",
    fields: [
      { name: "nomor", label: "Nomor surat", placeholder: "001/PNW/VIII/2026" },
      { name: "perusahaan", label: "Nama perusahaan Anda", placeholder: "CV Karya Mandiri" },
      { name: "penerima", label: "Ditujukan kepada", placeholder: "Panitia Pengadaan PT Maju" },
      { name: "durasi", label: "Jangka waktu pelaksanaan", placeholder: "90 hari kalender" },
    ],
    render: (p, f) =>
      line(`SURAT PENAWARAN HARGA`) +
      line(`Nomor: ${f.nomor || "…"}`) +
      line(`Perihal: Penawaran Pekerjaan ${p.projectName}`) + "\n" +
      line(`Kepada Yth.`) +
      line(`${f.penerima || p.client || "…"}`) +
      line(`di tempat`) + "\n" +
      line(`Dengan hormat,`) +
      line(`Sehubungan dengan rencana pekerjaan tersebut di atas, kami ${f.perusahaan || "…"} mengajukan penawaran sebagai berikut:`) + "\n" +
      line(`  Nama Pekerjaan : ${p.projectName}`) +
      line(`  Lokasi         : ${p.location || "…"}`) +
      line(`  Nilai Penawaran: ${p.contractValue || "…"} (sudah termasuk pajak)`) +
      line(`  Jangka Waktu   : ${f.durasi || "…"}`) + "\n" +
      line(`Penawaran ini berlaku 30 (tiga puluh) hari kalender sejak tanggal surat. Kami siap melaksanakan pekerjaan sesuai spesifikasi dan ketentuan yang berlaku.`) + "\n" +
      line(`Demikian penawaran ini kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.`) + "\n" +
      line(`${today()}`) +
      line(`Hormat kami,`) +
      line(`${f.perusahaan || "…"}`) + "\n\n\n" +
      line(`(…………………………)`),
  },
];
