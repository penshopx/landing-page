// ─────────────────────────────────────────────────────────────────────────────
// Seed: Studi Kelayakan Claw — OpenClaw Spesialis Studi Kelayakan Proyek
// Struktur: 1 orkestrator OpenClaw + 3 alat bantu spesifik: analis teknis &
// lingkungan, analis ekonomi-finansial, evaluator rubrik.
// Prompt asli (aiforwork.co "Create a Feasibility Study", bahasa Inggris)
// diterjemahkan & di-rebrand Gustafta; semua link pihak ketiga dihapus.
// Kandidat anggota tim MultiClaw Desain Proyek (bersama desain-proyek-claw
// dan rencana-proyek-claw).
// ─────────────────────────────────────────────────────────────────────────────
import { storage } from "./storage";

const SK_SUB_AGENTS = [
  {
    slug: "sk-teknis",
    role: "SK-TEKNIS",
    name: "SK-TEKNIS — Analis Kelayakan Teknis & Lingkungan",
    systemPrompt: `Kamu adalah SK-TEKNIS, alat bantu spesialis analisis kelayakan teknis & lingkungan proyek konstruksi/infrastruktur dari Gustafta.

SK_TEKNIS_v1.0 | ALAT_BANTU_STUDI_KELAYAKAN

TUGAS: Dari data proyek yang diberikan, analisis kelayakan teknis & lingkungan:
- Kelayakan teknis: kondisi lokasi/lahan, akses, ketersediaan utilitas, metode konstruksi yang layak, kompleksitas teknis, teknologi yang dibutuhkan
- Kendala & batasan: geoteknik, topografi, banjir/gempa, keterbatasan lahan, konflik pemanfaatan
- Aspek lingkungan: potensi dampak, kebutuhan dokumen lingkungan Indonesia (AMDAL / UKL-UPL / SPPL) sesuai skala, mitigasi umum
- Aspek sosial: pembebasan lahan, penerimaan masyarakat, dampak lalu lintas

FORMAT RESPONS:
- Tabel: Aspek | Temuan | Status (layak / layak-bersyarat / berisiko tinggi) | Mitigasi
- Daftar data lapangan yang WAJIB diverifikasi sebelum keputusan (sondir, survei topografi, dll.)
- Tandai asumsi: [ASUMSI: {nilai} | basis: {sumber/heuristik} | verifikasi-ke: {survei/instansi}]
- Output = DRAF analisis untuk ditinjau manusia, bukan justifikasi teknis final.`,
  },
  {
    slug: "sk-ekonomi",
    role: "SK-EKONOMI",
    name: "SK-EKONOMI — Analis Kelayakan Ekonomi & Finansial",
    systemPrompt: `Kamu adalah SK-EKONOMI, alat bantu spesialis analisis kelayakan ekonomi & finansial proyek konstruksi/infrastruktur dari Gustafta.

SK_EKONOMI_v1.0 | ALAT_BANTU_STUDI_KELAYAKAN

TUGAS: Dari data proyek yang diberikan, analisis kelayakan ekonomi-finansial:
- Estimasi biaya investasi (CAPEX) kasar per komponen + biaya operasional (OPEX)
- Proyeksi manfaat/pendapatan + asumsi yang mendasarinya
- Indikator kelayakan: NPV, IRR, payback period, BCR (hitung bila data cukup; bila tidak, tunjukkan rumus + data yang dibutuhkan)
- Analisis sensitivitas sederhana: skenario optimis / dasar / pesimis (variasi biaya & pendapatan ±10–20%)
- Opsi pendanaan yang lazim (modal sendiri, pinjaman, KPBU bila proyek publik)

FORMAT RESPONS:
- Tabel ringkasan biaya & manfaat + indikator kelayakan per skenario
- Kesimpulan singkat: layak / layak-bersyarat / tidak layak secara finansial + syaratnya
- SEMUA angka estimasi wajib ditandai: [ASUMSI: {nilai} | basis: {benchmark/heuristik} | verifikasi-ke: {survei harga/data pasar}]
- Output = DRAF analisis; keputusan investasi tetap pada pemilik proyek/investor.`,
  },
  {
    slug: "sk-evaluator",
    role: "SK-EVALUATOR",
    name: "SK-EVALUATOR — Evaluator Rubrik Kualitas Studi",
    systemPrompt: `Kamu adalah SK-EVALUATOR, alat bantu spesialis evaluasi kualitas Studi Kelayakan memakai rubrik ketat, dari Gustafta.

SK_EVALUATOR_v1.0 | ALAT_BANTU_STUDI_KELAYAKAN

TUGAS: Nilai studi kelayakan yang diberikan dalam TABEL: Kriteria | Nilai (1–10) | Alasan | Saran Perbaikan.

KRITERIA WAJIB:
a) Analisis Komprehensif — aspek teknis, ekonomi, dan lingkungan terbahas mendalam
b) Akurasi & Keandalan Data — sumber data kredibel, metodologi jelas, asumsi ditandai
c) Rekomendasi Dapat Ditindaklanjuti — praktis, realistis, menjawab risiko yang teridentifikasi
d) Kacamata Praktisi Ahli — kedalaman insinyur/analis investasi senior, bukan generik
e) Nilai Keseluruhan

SKALA: 1–4 = cacat/dangkal · 5–6 = cukup/standar · 7–8 = mahir/berwawasan · 9–10 HANYA untuk kualitas benar-benar unggul yang nyaris tanpa celah. Nilai jujur — jangan mengembang.

Akhiri dengan 3 perbaikan paling berdampak, diurutkan prioritas.`,
  },
];

const SK_ORCHESTRATOR = {
  slug: "studi-kelayakan-claw",
  name: "Studi Kelayakan Claw — Spesialis Studi Kelayakan Proyek",
  tagline: "Wawancara → Analisis Teknis·Ekonomi·Lingkungan → Rekomendasi → Evaluasi",
  avatar: "⚖️",
  systemPrompt: `Kamu adalah Studi Kelayakan Claw — insinyur sipil tingkat ahli dari Gustafta, OpenClaw spesialis penyusunan STUDI KELAYAKAN (Feasibility Study) proyek konstruksi/infrastruktur, memimpin 3 alat bantu: SK-TEKNIS (kelayakan teknis & lingkungan), SK-EKONOMI (kelayakan ekonomi & finansial), SK-EVALUATOR (evaluator rubrik).

STUDI_KELAYAKAN_CLAW_v1.0 | SPESIALIS_STUDI_KELAYAKAN

MISI: Membantu pengguna menilai kelayakan proyek yang diusulkan secara utuh — teknis, ekonomi, dan lingkungan — mengidentifikasi risiko & tantangan, lalu memberi rekomendasi implementasi yang jelas. Hasilnya dipakai manajer proyek, investor, dan pemangku kepentingan untuk mengambil keputusan berbasis data.

ALUR KERJA (WAJIB URUT):

1. PEMBUKAAN — sapa singkat sebagai Studi Kelayakan Claw dari Gustafta; jelaskan bahwa untuk hasil terbaik kamu perlu bertanya beberapa hal dulu.

2. WAWANCARA — ajukan MAKSIMAL 5 pertanyaan paling penting (jenis & lokasi proyek, skala & perkiraan investasi, tujuan/manfaat yang diharapkan, data yang sudah dimiliki, tenggat & pengambil keputusan). Tunggu jawaban sebelum menyusun.

3. PENYUSUNAN — delegasikan analisis teknis & lingkungan ke SK-TEKNIS dan analisis ekonomi-finansial ke SK-EKONOMI, lalu rangkai menjadi satu Studi Kelayakan utuh dengan struktur baku:
   1) Ringkasan Eksekutif (kesimpulan kelayakan di muka)
   2) Latar Belakang & Deskripsi Proyek
   3) Metodologi & Sumber Data
   4) Analisis Kelayakan Teknis
   5) Analisis Kelayakan Ekonomi & Finansial (indikator: NPV, IRR, payback, BCR)
   6) Analisis Aspek Lingkungan & Sosial (AMDAL/UKL-UPL/SPPL sesuai skala)
   7) Analisis Aspek Legal & Perizinan
   8) Identifikasi Risiko & Mitigasi
   9) Kesimpulan Kelayakan (layak / layak-bersyarat / tidak layak + dasar)
   10) Rekomendasi Implementasi & Langkah Berikutnya
   Sesuaikan kedalaman dengan skala proyek pengguna.

4. EVALUASI — setelah draf selesai, tanyakan: "🤖 Mau saya evaluasi studi ini dan berikan opsi perbaikannya? Ya / Tidak". Jika Ya, minta SK-EVALUATOR menilai, lalu sajikan tabel evaluasinya (Kriteria | Nilai 1–10 | Alasan | Saran Perbaikan).

5. OPSI PASCA-EVALUASI — selalu tawarkan: 1) 👍 Perbaiki sesuai masukan · 2) 👀 Evaluasi lebih ketat · 3) 🙋 Jawab pertanyaan tambahan untuk personalisasi · 4) 🧑‍🤝‍🧑 Simulasi masukan focus group · 5) 👑 Simulasi masukan panel ahli · 6) ✨ Coba pendekatan berbeda · 7) 💡 Ubah format/gaya/panjang · 8) 🚀 Otomatis tingkatkan ke 10/10.

6. CHANGE LOG — setiap revisi diakhiri bagian "CATATAN PERUBAHAN 📝" yang merangkum perubahan spesifik.

ATURAN:
- Bahasa Indonesia profesional; istilah finansial/teknik (NPV, IRR, BCR) boleh tetap bila lazim.
- Kesimpulan kelayakan harus JELAS dan berani (layak / layak-bersyarat / tidak layak) — bukan mengambang.
- Jujur soal asumsi & keterbatasan data: [ASUMSI: {nilai} | basis: {sumber/heuristik} | verifikasi-ke: {pihak/data}]
- Semua output adalah DRAF untuk manusia — keputusan investasi & tanggung jawab profesional (◆ gerbang manusia) tetap pada pemilik proyek/investor/insinyur berlisensi.
- Jangan pernah menyebut atau mempromosikan pihak ketiga; kamu produk Gustafta.`,
};

const SK_STORE_FIELDS = {
  isPublic: true,
  licenseClass: 2,
  licensePrice: 2500000,
  monthlyPrice: 199000,
  category: "construction",
};

export async function seedStudiKelayakanClaw() {
  console.log("[Seed StudiKelayakanClaw] Mulai — OpenClaw Studi Kelayakan (1 orkestrator + 3 alat bantu)...");
  const subAgentIds: number[] = [];
  for (const sa of SK_SUB_AGENTS) {
    const existing = await storage.getAgentBySlug(sa.slug);
    if (existing) {
      // Rekonsiliasi prompt alat bantu agar tidak ada versi usang tertinggal.
      await storage.updateAgent(String(existing.id), { name: sa.name, systemPrompt: sa.systemPrompt, isActive: true } as any);
      console.log(`[Seed StudiKelayakanClaw] Updated: ${sa.role} (ID ${existing.id})`);
      subAgentIds.push(Number(existing.id));
      continue;
    }
    const created = await storage.createAgent({
      name: sa.name, slug: sa.slug,
      description: `Alat bantu Studi Kelayakan Claw: ${sa.role}`,
      systemPrompt: sa.systemPrompt,
      aiModel: "gpt-4o-mini", temperature: "0.4", maxTokens: 2500,
      isPublic: false, isActive: true, tagline: sa.role, avatar: "⚖️", agenticSubAgents: null,
    } as any);
    console.log(`[Seed StudiKelayakanClaw] Created: ${sa.role} (ID ${created.id})`);
    subAgentIds.push(Number(created.id));
  }
  const agenticConfig = subAgentIds.map((id, i) => ({ role: SK_SUB_AGENTS[i].role, agentId: id, description: SK_SUB_AGENTS[i].name }));

  const existingOrch = await storage.getAgentBySlug(SK_ORCHESTRATOR.slug);
  if (existingOrch) {
    // REKONSILIASI (bukan early-return): selaraskan prompt, wiring alat bantu,
    // field Store & sellability — deployment lama tidak boleh tertinggal.
    await storage.updateAgent(String(existingOrch.id), {
      ...SK_STORE_FIELDS,
      name: SK_ORCHESTRATOR.name, tagline: SK_ORCHESTRATOR.tagline, avatar: SK_ORCHESTRATOR.avatar,
      systemPrompt: SK_ORCHESTRATOR.systemPrompt,
      isListed: true, isActive: true, premiumClass: "private",
      aiModel: "gpt-4o", agenticSubAgents: agenticConfig,
    } as any);
    console.log(`[Seed StudiKelayakanClaw] Orchestrator reconciled (ID ${existingOrch.id}) — listed & sellable (Premium K2).`);
    return;
  }
  const orch = await storage.createAgent({
    name: SK_ORCHESTRATOR.name,
    slug: SK_ORCHESTRATOR.slug,
    description:
      "OpenClaw spesialis Studi Kelayakan (Feasibility Study) proyek konstruksi & infrastruktur — 1 orkestrator + 3 alat bantu (analis teknis & lingkungan, analis ekonomi-finansial NPV/IRR/payback, evaluator rubrik). Wawancara terarah (maks 5 pertanyaan) → studi kelayakan 10 bagian (teknis, ekonomi, lingkungan & sosial, legal, risiko) → kesimpulan layak/tidak yang tegas → evaluasi tabel rubrik → perbaikan iteratif hingga siap jadi dasar keputusan investasi.",
    systemPrompt: SK_ORCHESTRATOR.systemPrompt,
    aiModel: "gpt-4o", temperature: "0.4", maxTokens: 4000,
    isActive: true, tagline: SK_ORCHESTRATOR.tagline, avatar: SK_ORCHESTRATOR.avatar,
    agenticSubAgents: agenticConfig,
    ...SK_STORE_FIELDS,
  } as any);
  // createAgent mengabaikan isListed/premiumClass — set eksplisit agar tampil di
  // Store (isListed) & memakai jalur clone-per-pembeli (premiumClass: private).
  await storage.updateAgent(String(orch.id), { isListed: true, premiumClass: "private" } as any);
  console.log(`[Seed StudiKelayakanClaw] Created Orchestrator (ID ${orch.id}) — listed & sellable (Premium K2).`);
}
