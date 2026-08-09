// ─────────────────────────────────────────────────────────────────────────────
// Seed: Persiapan Proyek MultiClaw — orkestrator level atas yang memimpin
// 3 OpenClaw spesialis persiapan proyek konstruksi:
//   1. studi-kelayakan-claw  (Studi Kelayakan — layak atau tidak?)
//   2. desain-proyek-claw    (Dokumen Desain Proyek — apa yang dibangun?)
//   3. rencana-proyek-claw   (Rencana Pelaksanaan — bagaimana membangunnya?)
// Setiap spesialis punya alat bantunya sendiri (orkestrasi berjenjang).
// Wiring via slug lookup — TIDAK PERNAH hardcode ID (prod & dev ID beda).
// ─────────────────────────────────────────────────────────────────────────────
import { storage } from "./storage";

const MC_MEMBER_SLUGS = [
  { slug: "studi-kelayakan-claw", role: "STUDI-KELAYAKAN", desc: "Studi Kelayakan Claw — analisis teknis, ekonomi (NPV/IRR/payback), lingkungan; kesimpulan layak/tidak" },
  { slug: "desain-proyek-claw", role: "DESAIN-PROYEK", desc: "Desain Proyek Claw — Dokumen Desain Proyek 11 bagian (lingkup, WBS, standar, kepatuhan regulasi)" },
  { slug: "rencana-proyek-claw", role: "RENCANA-PROYEK", desc: "Rencana Proyek Claw — rencana pelaksanaan (jadwal CPM, alokasi sumber daya, risiko, monitoring)" },
];

const MC_ORCHESTRATOR = {
  slug: "persiapan-proyek-multiclaw",
  name: "Persiapan Proyek MultiClaw — Direktur Tim Persiapan Proyek Konstruksi",
  tagline: "Studi Kelayakan → Desain Proyek → Rencana Pelaksanaan · 3 Tim Spesialis",
  avatar: "🏗️",
  systemPrompt: `Kamu adalah Persiapan Proyek MultiClaw — Direktur Tim Persiapan Proyek Konstruksi dari Gustafta, MultiClaw yang mengorkestrasi 3 OpenClaw spesialis (masing-masing memimpin alat bantunya sendiri):
- STUDI-KELAYAKAN: menilai layak/tidaknya proyek (teknis, ekonomi NPV/IRR/payback, lingkungan)
- DESAIN-PROYEK: menyusun Dokumen Desain Proyek (DDP) 11 bagian
- RENCANA-PROYEK: menyusun Rencana Pelaksanaan (jadwal CPM, sumber daya, risiko, monitoring)

PERSIAPAN_PROYEK_MULTICLAW_v1.0 | DIREKTUR_PERSIAPAN_PROYEK

MISI: Dari SATU gagasan proyek, pandu pengguna melewati seluruh tahap persiapan — dari "apakah layak?" sampai "dokumen siap & rencana eksekusi jelas" — dengan mendelegasikan ke spesialis yang tepat dan merangkai hasilnya menjadi PAKET PERSIAPAN PROYEK yang koheren.

CARA KERJA:

1. PEMBUKAAN — sapa singkat sebagai Direktur Persiapan Proyek dari Gustafta; tanyakan gagasan proyek pengguna dan sudah sampai tahap mana (baru ide / sudah yakin layak / sudah ada desain).

2. DIAGNOSIS & RUTE — tentukan titik masuk yang tepat:
   - Baru ide / belum yakin layak → mulai dari STUDI-KELAYAKAN
   - Sudah yakin layak, butuh dokumen desain → DESAIN-PROYEK
   - Desain sudah ada, butuh rencana eksekusi → RENCANA-PROYEK
   - Minta paket lengkap → jalankan berurutan: kelayakan → desain → rencana
   Jelaskan rutenya ke pengguna sebelum mulai, dan konfirmasi.

3. DELEGASI — serahkan pekerjaan ke spesialis sesuai rute. Teruskan konteks yang sudah terkumpul (jawaban wawancara, hasil tahap sebelumnya) agar pengguna tidak ditanya hal yang sama dua kali.

4. SINTESIS — rangkai hasil antar-tahap menjadi konsisten: kesimpulan studi kelayakan menjadi premis desain; lingkup desain menjadi dasar jadwal & sumber daya rencana pelaksanaan. Tandai kontradiksi antar-dokumen bila ada.

5. RINGKASAN DIREKTUR — akhiri setiap tahap besar dengan ringkasan eksekutif singkat: status, keputusan yang dibutuhkan dari pengguna (◆ gerbang manusia), dan tahap berikutnya.

ATURAN:
- Bahasa Indonesia profesional.
- JANGAN kerjakan sendiri pekerjaan spesialis — delegasikan; tugasmu memimpin, merutekan, dan merangkai.
- Jika proyek jelas TIDAK layak menurut studi kelayakan, sampaikan jujur dan sarankan berhenti/revisi gagasan — jangan lanjut ke desain hanya demi menyenangkan pengguna.
- Jujur soal asumsi: [ASUMSI: {nilai} | basis: {sumber/heuristik} | verifikasi-ke: {pihak/data}]
- Semua output adalah DRAF untuk manusia — keputusan investasi & tanggung jawab profesional (◆ gerbang manusia) tetap pada pemilik proyek/insinyur berlisensi.
- Jangan pernah menyebut atau mempromosikan pihak ketiga; kamu produk Gustafta.`,
};

const MC_STORE_FIELDS = {
  isPublic: true,
  licenseClass: 3,
  licensePrice: 5000000,
  monthlyPrice: 299000,
  category: "construction",
};

export async function seedPersiapanProyekMulticlaw() {
  console.log("[Seed PersiapanProyekMulticlaw] Mulai — MultiClaw Persiapan Proyek (3 OpenClaw spesialis)...");
  // Wiring via slug lookup — anggota harus sudah ter-seed (seed spesialis berjalan lebih dulu di boot).
  const agenticConfig: { role: string; agentId: number; description: string }[] = [];
  for (const m of MC_MEMBER_SLUGS) {
    const member = await storage.getAgentBySlug(m.slug);
    if (!member) {
      console.log(`[Seed PersiapanProyekMulticlaw] ⚠️ Anggota '${m.slug}' belum ada — MultiClaw ditunda (jalankan ulang setelah seed spesialis).`);
      return;
    }
    agenticConfig.push({ role: m.role, agentId: Number(member.id), description: m.desc });
  }

  const existingOrch = await storage.getAgentBySlug(MC_ORCHESTRATOR.slug);
  if (existingOrch) {
    // REKONSILIASI (bukan early-return): selaraskan prompt, wiring anggota,
    // field Store & sellability — ID anggota bisa beda antar-environment.
    await storage.updateAgent(String(existingOrch.id), {
      ...MC_STORE_FIELDS,
      name: MC_ORCHESTRATOR.name, tagline: MC_ORCHESTRATOR.tagline, avatar: MC_ORCHESTRATOR.avatar,
      systemPrompt: MC_ORCHESTRATOR.systemPrompt,
      isListed: true, isActive: true, premiumClass: "private",
      aiModel: "gpt-4o", agenticSubAgents: agenticConfig,
    } as any);
    console.log(`[Seed PersiapanProyekMulticlaw] Reconciled (ID ${existingOrch.id}) — listed & sellable (Premium K3).`);
    return;
  }
  const orch = await storage.createAgent({
    name: MC_ORCHESTRATOR.name,
    slug: MC_ORCHESTRATOR.slug,
    description:
      "MultiClaw Direktur Persiapan Proyek Konstruksi — mengorkestrasi 3 tim OpenClaw spesialis (total 12 agen): Studi Kelayakan (teknis·ekonomi·lingkungan, NPV/IRR), Desain Proyek (DDP 11 bagian, kepatuhan SNI/PUPR), dan Rencana Pelaksanaan (jadwal CPM, sumber daya, risiko). Dari satu gagasan proyek → rute cerdas antar-tahap → paket persiapan proyek utuh yang konsisten, dengan gerbang keputusan manusia di tiap tahap.",
    systemPrompt: MC_ORCHESTRATOR.systemPrompt,
    aiModel: "gpt-4o", temperature: "0.4", maxTokens: 4000,
    isActive: true, tagline: MC_ORCHESTRATOR.tagline, avatar: MC_ORCHESTRATOR.avatar,
    agenticSubAgents: agenticConfig,
    ...MC_STORE_FIELDS,
  } as any);
  // createAgent mengabaikan isListed/premiumClass — set eksplisit agar tampil di
  // Store (isListed) & memakai jalur clone-per-pembeli (premiumClass: private).
  await storage.updateAgent(String(orch.id), { isPublic: true, isListed: true, premiumClass: "private" } as any);
  console.log(`[Seed PersiapanProyekMulticlaw] Created (ID ${orch.id}) — listed & sellable (Premium K3).`);
}
