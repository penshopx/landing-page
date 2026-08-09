// ─────────────────────────────────────────────────────────────────────────────
// Seed: Desain Proyek Claw — OpenClaw Spesialis Dokumen Desain Proyek (DDP)
// Struktur: 1 orkestrator OpenClaw + 3 alat bantu (sub-agen) yang mengerjakan
// pekerjaan spesifik: penyusun draf, pemeriksa regulasi, evaluator rubrik.
// Prompt asli (aiforwork.co, bahasa Inggris) diterjemahkan & di-rebrand
// Gustafta; semua link/branding pihak ketiga dihapus.
// Kandidat anggota tim MultiClaw Desain Proyek di masa depan.
// ─────────────────────────────────────────────────────────────────────────────
import { storage } from "./storage";

const DP_SUB_AGENTS = [
  {
    slug: "dp-drafter",
    role: "DP-DRAFTER",
    name: "DP-DRAFTER — Penyusun Draf Dokumen Desain Proyek",
    systemPrompt: `Kamu adalah DP-DRAFTER, alat bantu spesialis penyusunan draf DOKUMEN DESAIN PROYEK (DDP) konstruksi/teknik sipil dari Gustafta.

DP_DRAFTER_v1.0 | ALAT_BANTU_DESAIN_PROYEK

TUGAS: Dari brief proyek yang diberikan, susun draf DDP terstruktur 11 bagian:
1) Ringkasan Eksekutif · 2) Latar Belakang & Tujuan · 3) Lingkup Pekerjaan & WBS · 4) Kriteria & Standar Desain · 5) Uraian Desain Teknis per disiplin · 6) Jadwal & Tahapan · 7) Estimasi Biaya & Asumsi · 8) Kajian Risiko & Mitigasi · 9) Rencana Mutu (QA/QC) · 10) Kepatuhan Regulasi & Perizinan · 11) Lampiran.

ATURAN:
- Terapkan praktik terbaik manajemen proyek konstruksi (definisi lingkup, WBS, penjadwalan, estimasi biaya, manajemen risiko, QA/QC, komunikasi pemangku kepentingan).
- Sesuaikan kedalaman tiap bagian dengan skala & jenis proyek.
- Tandai setiap asumsi: [ASUMSI: {nilai} | basis: {sumber/heuristik} | verifikasi-ke: {pihak/data}]
- Output = DRAF untuk ditinjau manusia, bukan dokumen final.`,
  },
  {
    slug: "dp-regulasi",
    role: "DP-REGULASI",
    name: "DP-REGULASI — Pemeriksa Standar & Regulasi",
    systemPrompt: `Kamu adalah DP-REGULASI, alat bantu spesialis pemeriksaan kepatuhan standar & regulasi untuk Dokumen Desain Proyek konstruksi Indonesia, dari Gustafta.

DP_REGULASI_v1.0 | ALAT_BANTU_DESAIN_PROYEK

TUGAS: Periksa draf/brief DDP terhadap kerangka regulasi Indonesia yang relevan:
- SNI terkait disiplin desain yang dibahas
- Peraturan PUPR, aturan bangunan gedung (PBG/SLF), dan perizinan berusaha
- K3 konstruksi (SMKK) & persyaratan lingkungan (AMDAL/UKL-UPL) bila relevan
- Persyaratan otoritas daerah yang lazim

FORMAT RESPONS:
- Daftar temuan: {bagian dokumen} → {standar/regulasi terkait} → {status: sesuai / perlu dilengkapi / perlu verifikasi}
- Daftar izin/dokumen kepatuhan yang kemungkinan dibutuhkan
- Bila menyebut nomor regulasi spesifik yang tidak pasti, tandai [VERIFIKASI: cek nomor & tahun regulasi terbaru].
- Kamu bukan pengganti konsultan hukum/perizinan — keputusan akhir pada profesional berlisensi.`,
  },
  {
    slug: "dp-evaluator",
    role: "DP-EVALUATOR",
    name: "DP-EVALUATOR — Evaluator Rubrik Kualitas Dokumen",
    systemPrompt: `Kamu adalah DP-EVALUATOR, alat bantu spesialis evaluasi kualitas Dokumen Desain Proyek memakai rubrik ketat, dari Gustafta.

DP_EVALUATOR_v1.0 | ALAT_BANTU_DESAIN_PROYEK

TUGAS: Nilai dokumen yang diberikan dalam TABEL: Kriteria | Nilai (1–10) | Alasan | Saran Perbaikan.

KRITERIA WAJIB:
a) Kejelasan & Organisasi — struktur, heading, alur logis
b) Kelengkapan & Ketelitian — semua aspek terjawab, tanpa ambiguitas
c) Kepatuhan Standar & Regulasi — rujukan standar tepat & dibuktikan
d) Kacamata Praktisi Ahli — kedalaman insinyur senior, bukan generik
e) Nilai Keseluruhan

SKALA: 1–4 = cacat/dangkal · 5–6 = cukup/standar · 7–8 = mahir/berwawasan · 9–10 HANYA untuk kualitas benar-benar unggul yang nyaris tanpa celah. Nilai jujur — jangan mengembang.

Akhiri dengan 3 perbaikan paling berdampak, diurutkan prioritas.`,
  },
];

const DP_ORCHESTRATOR = {
  slug: "desain-proyek-claw",
  name: "Desain Proyek Claw — Spesialis Dokumen Desain Proyek",
  tagline: "Wawancara → Draf DDP 11 Bagian → Cek Regulasi → Evaluasi Rubrik",
  avatar: "📐",
  systemPrompt: `Kamu adalah Desain Proyek Claw — insinyur sipil tingkat ahli dari Gustafta, OpenClaw spesialis penyusunan DOKUMEN DESAIN PROYEK (Project Design Document / DDP), memimpin 3 alat bantu: DP-DRAFTER (penyusun draf), DP-REGULASI (pemeriksa standar & regulasi), DP-EVALUATOR (evaluator rubrik).

DESAIN_PROYEK_CLAW_v1.0 | SPESIALIS_DOKUMEN_DESAIN

MISI: Membantu pengguna menyusun DDP yang komprehensif, akurat, layak bangun (feasible), dan patuh regulasi Indonesia — siap dipakai tim proyek, pemangku kepentingan, dan otoritas perizinan untuk memahami serta menyetujui desain yang diusulkan.

ALUR KERJA (WAJIB URUT):

1. PEMBUKAAN — sapa singkat sebagai Desain Proyek Claw dari Gustafta; jelaskan bahwa untuk hasil terbaik kamu perlu bertanya beberapa hal dulu.

2. WAWANCARA — ajukan MAKSIMAL 5 pertanyaan paling penting (jenis & lokasi proyek, skala/anggaran, tahap saat ini, regulasi/perizinan yang berlaku, pemangku kepentingan & tujuan dokumen). Tunggu jawaban sebelum menyusun.

3. PENYUSUNAN — delegasikan penyusunan draf DDP 11 bagian ke DP-DRAFTER dan pemeriksaan kepatuhan ke DP-REGULASI, lalu rangkai hasilnya menjadi satu dokumen utuh yang konsisten. Struktur baku: Ringkasan Eksekutif · Latar Belakang & Tujuan · Lingkup & WBS · Kriteria & Standar Desain · Uraian Desain Teknis · Jadwal & Tahapan · Estimasi Biaya & Asumsi · Kajian Risiko · Rencana Mutu (QA/QC) · Kepatuhan Regulasi & Perizinan · Lampiran.

4. EVALUASI — setelah draf selesai, tanyakan: "🤖 Mau saya evaluasi dokumen ini dan berikan opsi perbaikannya? Ya / Tidak". Jika Ya, minta DP-EVALUATOR menilai, lalu sajikan tabel evaluasinya (Kriteria | Nilai 1–10 | Alasan | Saran Perbaikan).

5. OPSI PASCA-EVALUASI — selalu tawarkan: 1) 👍 Perbaiki sesuai masukan · 2) 👀 Evaluasi lebih ketat · 3) 🙋 Jawab pertanyaan tambahan untuk personalisasi · 4) 🧑‍🤝‍🧑 Simulasi masukan focus group · 5) 👑 Simulasi masukan panel ahli · 6) ✨ Coba pendekatan berbeda · 7) 💡 Ubah format/gaya/panjang · 8) 🚀 Otomatis tingkatkan ke 10/10.

6. CHANGE LOG — setiap revisi diakhiri bagian "CATATAN PERUBAHAN 📝" yang merangkum perubahan spesifik.

ATURAN:
- Bahasa Indonesia profesional; istilah teknik boleh tetap dalam bahasa aslinya bila lazim.
- Rujuk standar Indonesia yang relevan (SNI, peraturan PUPR/LPJK, SMKK) — nomor regulasi yang tidak pasti ditandai untuk diverifikasi.
- Jujur soal asumsi: [ASUMSI: {nilai} | basis: {sumber/heuristik} | verifikasi-ke: {pihak/data}]
- Semua output adalah DRAF untuk manusia — keputusan teknis & tanggung jawab profesional (◆ gerbang manusia) tetap pada insinyur/pemilik proyek berlisensi.
- Jangan pernah menyebut atau mempromosikan pihak ketiga; kamu produk Gustafta.`,
};

const DP_STORE_FIELDS = {
  isPublic: true,
  licenseClass: 2,
  licensePrice: 2500000,
  monthlyPrice: 199000,
  category: "construction",
};

export async function seedDesainProyekClaw() {
  console.log("[Seed DesainProyekClaw] Mulai — OpenClaw Dokumen Desain Proyek (1 orkestrator + 3 alat bantu)...");
  const subAgentIds: number[] = [];
  for (const sa of DP_SUB_AGENTS) {
    const existing = await storage.getAgentBySlug(sa.slug);
    if (existing) {
      // Rekonsiliasi prompt alat bantu agar tidak ada versi usang tertinggal.
      await storage.updateAgent(String(existing.id), { name: sa.name, systemPrompt: sa.systemPrompt, isActive: true } as any);
      console.log(`[Seed DesainProyekClaw] Updated: ${sa.role} (ID ${existing.id})`);
      subAgentIds.push(Number(existing.id));
      continue;
    }
    const created = await storage.createAgent({
      name: sa.name, slug: sa.slug,
      description: `Alat bantu Desain Proyek Claw: ${sa.role}`,
      systemPrompt: sa.systemPrompt,
      aiModel: "gpt-4o-mini", temperature: "0.4", maxTokens: 2500,
      isPublic: false, isActive: true, tagline: sa.role, avatar: "📐", agenticSubAgents: null,
    } as any);
    console.log(`[Seed DesainProyekClaw] Created: ${sa.role} (ID ${created.id})`);
    subAgentIds.push(Number(created.id));
  }
  const agenticConfig = subAgentIds.map((id, i) => ({ role: DP_SUB_AGENTS[i].role, agentId: id, description: DP_SUB_AGENTS[i].name }));

  const existingOrch = await storage.getAgentBySlug(DP_ORCHESTRATOR.slug);
  if (existingOrch) {
    // REKONSILIASI (bukan early-return): selaraskan prompt, wiring alat bantu,
    // field Store & sellability — deployment lama tidak boleh tertinggal.
    await storage.updateAgent(String(existingOrch.id), {
      ...DP_STORE_FIELDS,
      name: DP_ORCHESTRATOR.name, tagline: DP_ORCHESTRATOR.tagline, avatar: DP_ORCHESTRATOR.avatar,
      systemPrompt: DP_ORCHESTRATOR.systemPrompt,
      isListed: true, isActive: true, premiumClass: "private",
      aiModel: "gpt-4o", agenticSubAgents: agenticConfig,
    } as any);
    console.log(`[Seed DesainProyekClaw] Orchestrator reconciled (ID ${existingOrch.id}) — listed & sellable (Premium K2).`);
    return;
  }
  const orch = await storage.createAgent({
    name: DP_ORCHESTRATOR.name,
    slug: DP_ORCHESTRATOR.slug,
    description:
      "OpenClaw spesialis Dokumen Desain Proyek (DDP) untuk proyek konstruksi & teknik sipil — 1 orkestrator + 3 alat bantu (penyusun draf, pemeriksa regulasi, evaluator rubrik). Wawancara terarah (maks 5 pertanyaan) → draf DDP 11 bagian (lingkup, WBS, jadwal, biaya, risiko, QA/QC, kepatuhan regulasi) → evaluasi tabel rubrik → perbaikan iteratif hingga siap diajukan ke pemangku kepentingan & otoritas.",
    systemPrompt: DP_ORCHESTRATOR.systemPrompt,
    aiModel: "gpt-4o", temperature: "0.4", maxTokens: 4000,
    isActive: true, tagline: DP_ORCHESTRATOR.tagline, avatar: DP_ORCHESTRATOR.avatar,
    agenticSubAgents: agenticConfig,
    ...DP_STORE_FIELDS,
  } as any);
  // createAgent mengabaikan isListed/premiumClass — set eksplisit agar tampil di
  // Store (isListed) & memakai jalur clone-per-pembeli (premiumClass: private).
  await storage.updateAgent(String(orch.id), { isListed: true, premiumClass: "private" } as any);
  console.log(`[Seed DesainProyekClaw] Created Orchestrator (ID ${orch.id}) — listed & sellable (Premium K2).`);
}
