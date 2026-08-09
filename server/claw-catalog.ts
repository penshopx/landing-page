// ─────────────────────────────────────────────────────────────────────────────
// KATALOG CLAW — daftar produk premium yang di-seed oleh Claw Factory.
//
// Produk baru = tambahkan SATU entri di array ini (bukan file seed baru).
// Alur produksi dari prompt aiforwork:
//   1. User menempelkan JSON prompt mentah (tidak perlu dipotong/diterjemahkan)
//   2. Agent mengonversinya jadi entri ClawDef: terjemahkan → buang semua
//      link/branding aiforwork → pecah jadi misi orkestrator + 2–3 alat bantu
//      spesifik → petakan criteria ke evaluatorCriteria (evaluator dibuat
//      otomatis oleh factory, tidak perlu ditulis)
//   3. Boot berikutnya: factory seed → produk tampil di Store (Premium Privat)
//
// Konvensi harga: OpenClaw spesialis = K2 / 2.5jt / 199rb ·
//                 MultiClaw = K3 / 5jt / 299rb (ubah per entri bila perlu).
// Slug alat bantu harus unik GLOBAL (awali dengan singkatan claw-nya).
// 4 produk pertama (desain-proyek-claw, rencana-proyek-claw,
// studi-kelayakan-claw, persiapan-proyek-multiclaw) tetap di file seed lamanya.
// ─────────────────────────────────────────────────────────────────────────────
import type { CatalogEntry } from "./lib/claw-factory";

export const CLAW_CATALOG: CatalogEntry[] = [
  // ── Contoh format (hapus komentar ini saat entri pertama masuk) ──
  // {
  //   kind: "openclaw",
  //   slug: "rab-claw",
  //   name: "RAB Claw — Spesialis Rencana Anggaran Biaya",
  //   tagline: "Wawancara → Volume & AHSP → RAB Lengkap → Evaluasi Rubrik",
  //   avatar: "🧮",
  //   category: "construction",
  //   docLabel: "Rencana Anggaran Biaya (RAB)",
  //   mission: "Membantu pengguna menyusun RAB yang akurat dan dapat dipertanggungjawabkan...",
  //   interviewTopics: ["jenis & lokasi proyek", "gambar/desain yang tersedia", "acuan harga satuan", "target anggaran", "format keluaran yang dibutuhkan"],
  //   structure: ["Ringkasan Anggaran", "Uraian Volume Pekerjaan", "Analisis Harga Satuan", "Rekapitulasi per Divisi", "Asumsi & Basis Estimasi"],
  //   tools: [
  //     { slug: "rab-volume", role: "RAB-VOLUME", name: "RAB-VOLUME — Penghitung Volume Pekerjaan", mission: "Hitung volume pekerjaan per item dari data desain..." },
  //     { slug: "rab-ahsp", role: "RAB-AHSP", name: "RAB-AHSP — Analis Harga Satuan (AHSP)", mission: "Susun analisis harga satuan mengacu AHSP PUPR..." },
  //   ],
  //   evaluatorCriteria: [
  //     "Akurasi Perhitungan — volume & harga satuan konsisten dan dapat ditelusuri",
  //     "Kelengkapan Item — tidak ada pekerjaan besar yang terlewat",
  //     "Basis Estimasi Jelas — semua asumsi ditandai dan sumber acuan disebut",
  //     "Kacamata Praktisi Ahli — kedalaman estimator senior, bukan generik",
  //   ],
  //   licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  // },
];
