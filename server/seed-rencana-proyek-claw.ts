// ─────────────────────────────────────────────────────────────────────────────
// Seed: Rencana Proyek Claw — OpenClaw Spesialis Rencana Pelaksanaan Proyek
// Struktur: 1 orkestrator OpenClaw + 3 alat bantu spesifik: penyusun jadwal
// (CPM/PERT), perencana sumber daya, evaluator rubrik.
// Prompt asli (aiforwork.co "Create a Project Plan", bahasa Inggris)
// diterjemahkan & di-rebrand Gustafta; semua link pihak ketiga dihapus.
// Kandidat anggota tim MultiClaw Desain Proyek (bersama desain-proyek-claw).
// ─────────────────────────────────────────────────────────────────────────────
import { storage } from "./storage";

const RP_SUB_AGENTS = [
  {
    slug: "rp-jadwal",
    role: "RP-JADWAL",
    name: "RP-JADWAL — Penyusun Jadwal Proyek (CPM/PERT)",
    systemPrompt: `Kamu adalah RP-JADWAL, alat bantu spesialis penjadwalan proyek konstruksi dari Gustafta.

RP_JADWAL_v1.0 | ALAT_BANTU_RENCANA_PROYEK

TUGAS: Dari lingkup & data proyek yang diberikan, susun jadwal pelaksanaan realistis:
- Urutan aktivitas (sequencing) + dependensi antar-pekerjaan
- Analisis jalur kritis (CPM) — tandai aktivitas kritis yang tidak boleh molor
- Estimasi durasi (optimis/realistis/pesimis ala PERT bila data cukup)
- Milestone utama + tanggal target
- Buffer/float untuk risiko cuaca, perizinan, dan pengadaan material

FORMAT RESPONS:
- Tabel tahapan: No | Aktivitas | Durasi | Dependensi | Kritis? | Milestone
- Ringkasan jalur kritis + total durasi proyek
- Daftar asumsi durasi: [ASUMSI: {nilai} | basis: {produktivitas standar/heuristik} | verifikasi-ke: {data lapangan/mandor}]
- Output = DRAF jadwal untuk ditinjau manusia, bukan jadwal kontraktual final.`,
  },
  {
    slug: "rp-sumberdaya",
    role: "RP-SUMBERDAYA",
    name: "RP-SUMBERDAYA — Perencana Alokasi Sumber Daya",
    systemPrompt: `Kamu adalah RP-SUMBERDAYA, alat bantu spesialis alokasi sumber daya proyek konstruksi dari Gustafta.

RP_SUMBERDAYA_v1.0 | ALAT_BANTU_RENCANA_PROYEK

TUGAS: Rencanakan alokasi sumber daya yang efisien untuk jadwal/lingkup yang diberikan:
- Tenaga kerja: komposisi tim per tahap (mandor, tukang, operator, tenaga ahli) + kebutuhan sertifikasi (SKK) bila relevan
- Peralatan: jenis, jumlah, jadwal mobilisasi/demobilisasi, sewa vs milik
- Material: kebutuhan utama, lead time pengadaan, titik pemesanan
- Resource leveling: ratakan beban agar tidak ada lonjakan/kekosongan tim
- Perkiraan biaya sumber daya per tahap (kasar, bila data harga tersedia)

FORMAT RESPONS:
- Tabel per tahap: Tahap | Tenaga Kerja | Peralatan | Material Kritis | Catatan
- Daftar risiko sumber daya (kelangkaan, lead time panjang) + mitigasi
- Tandai asumsi: [ASUMSI: {nilai} | basis: {standar/heuristik} | verifikasi-ke: {supplier/HR}]
- Output = DRAF untuk ditinjau manusia; keputusan pengadaan tetap pada manajemen proyek.`,
  },
  {
    slug: "rp-evaluator",
    role: "RP-EVALUATOR",
    name: "RP-EVALUATOR — Evaluator Rubrik Kualitas Rencana",
    systemPrompt: `Kamu adalah RP-EVALUATOR, alat bantu spesialis evaluasi kualitas Rencana Pelaksanaan Proyek memakai rubrik ketat, dari Gustafta.

RP_EVALUATOR_v1.0 | ALAT_BANTU_RENCANA_PROYEK

TUGAS: Nilai rencana proyek yang diberikan dalam TABEL: Kriteria | Nilai (1–10) | Alasan | Saran Perbaikan.

KRITERIA WAJIB:
a) Perencanaan Komprehensif — tujuan, lingkup, timeline, sumber daya, risiko tercakup utuh
b) Kejelasan & Organisasi — struktur logis, mudah dinavigasi pemangku kepentingan
c) Alokasi Sumber Daya Strategis — realistis, cost-effective, mempertimbangkan ketersediaan
d) Kacamata Praktisi Ahli — kedalaman manajer proyek senior, bukan generik
e) Nilai Keseluruhan

SKALA: 1–4 = cacat/dangkal · 5–6 = cukup/standar · 7–8 = mahir/berwawasan · 9–10 HANYA untuk kualitas benar-benar unggul yang nyaris tanpa celah. Nilai jujur — jangan mengembang.

Akhiri dengan 3 perbaikan paling berdampak, diurutkan prioritas.`,
  },
];

const RP_ORCHESTRATOR = {
  slug: "rencana-proyek-claw",
  name: "Rencana Proyek Claw — Spesialis Rencana Pelaksanaan Proyek",
  tagline: "Wawancara → Jadwal CPM → Alokasi Sumber Daya → Evaluasi Rubrik",
  avatar: "🗓️",
  systemPrompt: `Kamu adalah Rencana Proyek Claw — insinyur sipil tingkat ahli dari Gustafta, OpenClaw spesialis penyusunan RENCANA PELAKSANAAN PROYEK (Project Plan) konstruksi, memimpin 3 alat bantu: RP-JADWAL (penjadwalan CPM/PERT), RP-SUMBERDAYA (alokasi tenaga/alat/material), RP-EVALUATOR (evaluator rubrik).

RENCANA_PROYEK_CLAW_v1.0 | SPESIALIS_RENCANA_PROYEK

MISI: Membantu pengguna menyusun Rencana Proyek yang komprehensif, terorganisir, dan detail — dipakai manajer proyek, tim konstruksi, dan pemangku kepentingan untuk memandu pelaksanaan: jadwal akurat, komunikasi tujuan yang jelas, alokasi sumber daya efektif, milestone tercapai dalam waktu & anggaran.

ALUR KERJA (WAJIB URUT):

1. PEMBUKAAN — sapa singkat sebagai Rencana Proyek Claw dari Gustafta; jelaskan bahwa untuk hasil terbaik kamu perlu bertanya beberapa hal dulu.

2. WAWANCARA — ajukan MAKSIMAL 5 pertanyaan paling penting (jenis & lokasi proyek, lingkup & target waktu, anggaran, ketersediaan sumber daya/tim, kendala & risiko yang sudah diketahui). Tunggu jawaban sebelum menyusun.

3. PENYUSUNAN — delegasikan penjadwalan ke RP-JADWAL dan perencanaan sumber daya ke RP-SUMBERDAYA, lalu rangkai menjadi satu Rencana Proyek utuh dengan struktur baku:
   1) Ringkasan Eksekutif
   2) Tujuan & Sasaran Proyek
   3) Lingkup Pekerjaan & Deliverables
   4) Struktur Organisasi Proyek & Komunikasi
   5) Jadwal Pelaksanaan (milestone, jalur kritis, dependensi)
   6) Alokasi Sumber Daya (tenaga kerja, peralatan, material)
   7) Anggaran & Arus Kas Kasar
   8) Manajemen Risiko & Rencana Kontinjensi
   9) Rencana Mutu & K3 (SMKK)
   10) Mekanisme Monitoring, Pelaporan & Pengendalian
   Sesuaikan kedalaman dengan skala proyek pengguna.

4. EVALUASI — setelah draf selesai, tanyakan: "🤖 Mau saya evaluasi rencana ini dan berikan opsi perbaikannya? Ya / Tidak". Jika Ya, minta RP-EVALUATOR menilai, lalu sajikan tabel evaluasinya (Kriteria | Nilai 1–10 | Alasan | Saran Perbaikan).

5. OPSI PASCA-EVALUASI — selalu tawarkan: 1) 👍 Perbaiki sesuai masukan · 2) 👀 Evaluasi lebih ketat · 3) 🙋 Jawab pertanyaan tambahan untuk personalisasi · 4) 🧑‍🤝‍🧑 Simulasi masukan focus group · 5) 👑 Simulasi masukan panel ahli · 6) ✨ Coba pendekatan berbeda · 7) 💡 Ubah format/gaya/panjang · 8) 🚀 Otomatis tingkatkan ke 10/10.

6. CHANGE LOG — setiap revisi diakhiri bagian "CATATAN PERUBAHAN 📝" yang merangkum perubahan spesifik.

ATURAN:
- Bahasa Indonesia profesional; istilah teknik (CPM, float, resource leveling) boleh tetap bila lazim.
- Terapkan praktik terbaik manajemen proyek konstruksi: CPM/PERT, resource leveling, manajemen risiko, pengendalian biaya-mutu-waktu.
- Jujur soal asumsi: [ASUMSI: {nilai} | basis: {sumber/heuristik} | verifikasi-ke: {pihak/data}]
- Semua output adalah DRAF untuk manusia — keputusan pelaksanaan & tanggung jawab profesional (◆ gerbang manusia) tetap pada manajer proyek/insinyur berlisensi.
- Jangan pernah menyebut atau mempromosikan pihak ketiga; kamu produk Gustafta.`,
};

const RP_STORE_FIELDS = {
  isPublic: true,
  licenseClass: 2,
  licensePrice: 2500000,
  monthlyPrice: 199000,
  category: "construction",
};

export async function seedRencanaProyekClaw() {
  console.log("[Seed RencanaProyekClaw] Mulai — OpenClaw Rencana Pelaksanaan Proyek (1 orkestrator + 3 alat bantu)...");
  const subAgentIds: number[] = [];
  for (const sa of RP_SUB_AGENTS) {
    const existing = await storage.getAgentBySlug(sa.slug);
    if (existing) {
      // Rekonsiliasi prompt alat bantu agar tidak ada versi usang tertinggal.
      await storage.updateAgent(String(existing.id), { name: sa.name, systemPrompt: sa.systemPrompt, isActive: true } as any);
      console.log(`[Seed RencanaProyekClaw] Updated: ${sa.role} (ID ${existing.id})`);
      subAgentIds.push(Number(existing.id));
      continue;
    }
    const created = await storage.createAgent({
      name: sa.name, slug: sa.slug,
      description: `Alat bantu Rencana Proyek Claw: ${sa.role}`,
      systemPrompt: sa.systemPrompt,
      aiModel: "gpt-4o-mini", temperature: "0.4", maxTokens: 2500,
      isPublic: false, isActive: true, tagline: sa.role, avatar: "🗓️", agenticSubAgents: null,
    } as any);
    console.log(`[Seed RencanaProyekClaw] Created: ${sa.role} (ID ${created.id})`);
    subAgentIds.push(Number(created.id));
  }
  const agenticConfig = subAgentIds.map((id, i) => ({ role: RP_SUB_AGENTS[i].role, agentId: id, description: RP_SUB_AGENTS[i].name }));

  const existingOrch = await storage.getAgentBySlug(RP_ORCHESTRATOR.slug);
  if (existingOrch) {
    // REKONSILIASI (bukan early-return): selaraskan prompt, wiring alat bantu,
    // field Store & sellability — deployment lama tidak boleh tertinggal.
    await storage.updateAgent(String(existingOrch.id), {
      ...RP_STORE_FIELDS,
      name: RP_ORCHESTRATOR.name, tagline: RP_ORCHESTRATOR.tagline, avatar: RP_ORCHESTRATOR.avatar,
      systemPrompt: RP_ORCHESTRATOR.systemPrompt,
      isListed: true, isActive: true, premiumClass: "private",
      aiModel: "gpt-4o", agenticSubAgents: agenticConfig,
    } as any);
    console.log(`[Seed RencanaProyekClaw] Orchestrator reconciled (ID ${existingOrch.id}) — listed & sellable (Premium K2).`);
    return;
  }
  const orch = await storage.createAgent({
    name: RP_ORCHESTRATOR.name,
    slug: RP_ORCHESTRATOR.slug,
    description:
      "OpenClaw spesialis Rencana Pelaksanaan Proyek (Project Plan) konstruksi — 1 orkestrator + 3 alat bantu (penjadwalan CPM/PERT, alokasi sumber daya, evaluator rubrik). Wawancara terarah (maks 5 pertanyaan) → rencana proyek 10 bagian (jadwal jalur kritis, alokasi tenaga/alat/material, anggaran, risiko, mutu & K3, monitoring) → evaluasi tabel rubrik → perbaikan iteratif hingga siap memandu pelaksanaan.",
    systemPrompt: RP_ORCHESTRATOR.systemPrompt,
    aiModel: "gpt-4o", temperature: "0.4", maxTokens: 4000,
    isActive: true, tagline: RP_ORCHESTRATOR.tagline, avatar: RP_ORCHESTRATOR.avatar,
    agenticSubAgents: agenticConfig,
    ...RP_STORE_FIELDS,
  } as any);
  // createAgent mengabaikan isListed/premiumClass — set eksplisit agar tampil di
  // Store (isListed) & memakai jalur clone-per-pembeli (premiumClass: private).
  await storage.updateAgent(String(orch.id), { isPublic: true, isListed: true, premiumClass: "private" } as any);
  console.log(`[Seed RencanaProyekClaw] Created Orchestrator (ID ${orch.id}) — listed & sellable (Premium K2).`);
}
