// ─────────────────────────────────────────────────────────────────────────────
// CLAW FACTORY — mesin produksi produk premium OpenClaw/MultiClaw.
//
// Tujuan: produk baru = ENTRI DATA di server/claw-catalog.ts (±40 baris),
// bukan file seed 200-baris yang di-copy-paste. Mesin ini yang:
//   • merakit system prompt orkestrator & alat bantu dari template baku Gustafta
//     (alur wawancara→penyusunan→evaluasi→opsi→CHANGE LOG, aturan [ASUMSI],
//     ◆ gerbang manusia, larangan promosi pihak ketiga)
//   • membuat evaluator rubrik OTOMATIS untuk setiap claw (tidak perlu ditulis)
//   • seed dengan pola aman: rekonsiliasi idempotent (bukan early-return),
//     wiring via slug lookup (ID prod ≠ dev), post-create updateAgent untuk
//     isPublic/isListed/premiumClass (createAgent men-drop ketiganya).
//
// 4 produk pertama (desain-proyek, rencana-proyek, studi-kelayakan, persiapan-
// proyek-multiclaw) tetap di file seed lamanya — produk BARU masuk katalog.
// ─────────────────────────────────────────────────────────────────────────────
import { storage } from "../storage";

export interface ClawToolDef {
  slug: string;          // unik global, ex: "rab-volume"
  role: string;          // ex: "RAB-VOLUME"
  name: string;          // nama lengkap alat bantu
  mission: string;       // TUGAS: apa yang dikerjakan (boleh multi-baris)
  format?: string;       // FORMAT RESPONS (opsional; default disediakan)
}

export interface ClawDef {
  kind: "openclaw";
  slug: string;
  name: string;          // "X Claw — Spesialis ..."
  tagline: string;
  avatar: string;        // 1 emoji
  category: string;      // ex: "construction"
  docLabel: string;      // sebutan hasil kerja, ex: "Rencana Anggaran Biaya (RAB)"
  mission: string;       // paragraf MISI orkestrator
  interviewTopics: string[];   // topik untuk maks-5 pertanyaan wawancara
  structure: string[];   // bagian-bagian dokumen hasil
  tools: ClawToolDef[];  // alat bantu spesifik (evaluator dibuat otomatis)
  evaluatorCriteria: string[]; // kriteria a..d (e = Nilai Keseluruhan otomatis)
  extraRules?: string[]; // aturan tambahan khusus produk (opsional)
  licenseClass: number;  // default produk spesialis: 2
  licensePrice: number;  // ex: 2_500_000
  monthlyPrice: number;  // ex: 199_000
}

export interface MultiClawDef {
  kind: "multiclaw";
  slug: string;
  name: string;
  tagline: string;
  avatar: string;
  category: string;
  mission: string;       // misi direktur
  routing: string;       // penjelasan rute/diagnosis antar-anggota (multi-baris)
  members: { slug: string; role: string; desc: string }[]; // slug OpenClaw anggota
  extraRules?: string[];
  licenseClass: number;  // default multiclaw: 3
  licensePrice: number;
  monthlyPrice: number;
}

export type CatalogEntry = ClawDef | MultiClawDef;

// ── Blok baku Gustafta ───────────────────────────────────────────────────────
const RULE_ASUMSI = "Jujur soal asumsi: [ASUMSI: {nilai} | basis: {sumber/heuristik} | verifikasi-ke: {pihak/data}]";
const RULE_HUMAN_GATE = "Semua output adalah DRAF untuk manusia — keputusan akhir & tanggung jawab profesional (◆ gerbang manusia) tetap pada pengguna/profesional berlisensi.";
const RULE_NO_THIRD_PARTY = "Jangan pernah menyebut atau mempromosikan pihak ketiga; kamu produk Gustafta.";
const RULE_BAHASA = "Bahasa Indonesia profesional; istilah teknis boleh tetap dalam bahasa aslinya bila lazim.";

const POST_EVAL_OPTIONS =
  "1) 👍 Perbaiki sesuai masukan · 2) 👀 Evaluasi lebih ketat · 3) 🙋 Jawab pertanyaan tambahan untuk personalisasi · " +
  "4) 🧑‍🤝‍🧑 Simulasi masukan focus group · 5) 👑 Simulasi masukan panel ahli · 6) ✨ Coba pendekatan berbeda · " +
  "7) 💡 Ubah format/gaya/panjang · 8) 🚀 Otomatis tingkatkan ke 10/10";

const RUBRIC_SCALE =
  "SKALA: 1–4 = cacat/dangkal · 5–6 = cukup/standar · 7–8 = mahir/berwawasan · " +
  "9–10 HANYA untuk kualitas benar-benar unggul yang nyaris tanpa celah. Nilai jujur — jangan mengembang.";

const marker = (slug: string, suffix = "v1.0") =>
  slug.toUpperCase().replace(/-/g, "_") + "_" + suffix;

// ── Perakit prompt ───────────────────────────────────────────────────────────
export function buildToolPrompt(claw: ClawDef, tool: ClawToolDef): string {
  return `Kamu adalah ${tool.role}, alat bantu spesialis dari Gustafta untuk ${claw.docLabel}.

${marker(tool.slug)} | ALAT_BANTU_${marker(claw.slug, "").replace(/_$/, "")}

TUGAS:
${tool.mission.trim()}

${tool.format ? "FORMAT RESPONS:\n" + tool.format.trim() + "\n\n" : ""}ATURAN:
- ${RULE_ASUMSI}
- Output = DRAF untuk ditinjau manusia, bukan hasil final.
- ${RULE_NO_THIRD_PARTY}`;
}

export function buildEvaluatorDef(claw: ClawDef): ClawToolDef {
  const prefix = claw.slug.split("-").map(w => w[0]).join("").toUpperCase();
  return {
    slug: `${claw.slug}-evaluator`,
    role: `${prefix}-EVALUATOR`,
    name: `${prefix}-EVALUATOR — Evaluator Rubrik Kualitas`,
    mission:
      `Nilai ${claw.docLabel} yang diberikan dalam TABEL: Kriteria | Nilai (1–10) | Alasan | Saran Perbaikan.\n\n` +
      `KRITERIA WAJIB:\n` +
      claw.evaluatorCriteria.map((c, i) => `${"abcd"[i]}) ${c}`).join("\n") +
      `\ne) Nilai Keseluruhan\n\n${RUBRIC_SCALE}\n\nAkhiri dengan 3 perbaikan paling berdampak, diurutkan prioritas.`,
  };
}

export function buildOrchestratorPrompt(claw: ClawDef, allTools: ClawToolDef[]): string {
  const toolList = allTools.map(t => `- ${t.role}: ${t.name.split("—")[1]?.trim() || t.name}`).join("\n");
  const structureList = claw.structure.map((s, i) => `   ${i + 1}) ${s}`).join("\n");
  const rules = [RULE_BAHASA, RULE_ASUMSI, RULE_HUMAN_GATE, RULE_NO_THIRD_PARTY, ...(claw.extraRules || [])];
  return `Kamu adalah ${claw.name.split("—")[0].trim()} — pakar tingkat ahli dari Gustafta, OpenClaw spesialis ${claw.docLabel}, memimpin ${allTools.length} alat bantu:
${toolList}

${marker(claw.slug)} | SPESIALIS

MISI: ${claw.mission.trim()}

ALUR KERJA (WAJIB URUT):

1. PEMBUKAAN — sapa singkat sebagai ${claw.name.split("—")[0].trim()} dari Gustafta; jelaskan bahwa untuk hasil terbaik kamu perlu bertanya beberapa hal dulu.

2. WAWANCARA — ajukan MAKSIMAL 5 pertanyaan paling penting (${claw.interviewTopics.join(", ")}). Tunggu jawaban sebelum menyusun.

3. PENYUSUNAN — delegasikan pekerjaan spesifik ke alat bantu yang sesuai, lalu rangkai hasilnya menjadi satu ${claw.docLabel} utuh dan konsisten dengan struktur baku:
${structureList}
   Sesuaikan kedalaman dengan skala kebutuhan pengguna.

4. EVALUASI — setelah draf selesai, tanyakan: "🤖 Mau saya evaluasi hasil ini dan berikan opsi perbaikannya? Ya / Tidak". Jika Ya, minta evaluator menilai, lalu sajikan tabel evaluasinya (Kriteria | Nilai 1–10 | Alasan | Saran Perbaikan).

5. OPSI PASCA-EVALUASI — selalu tawarkan: ${POST_EVAL_OPTIONS}.

6. CHANGE LOG — setiap revisi diakhiri bagian "CATATAN PERUBAHAN 📝" yang merangkum perubahan spesifik.

ATURAN:
${rules.map(r => `- ${r}`).join("\n")}`;
}

export function buildMultiClawPrompt(def: MultiClawDef): string {
  const memberList = def.members.map(m => `- ${m.role}: ${m.desc}`).join("\n");
  const rules = [
    "Bahasa Indonesia profesional.",
    "JANGAN kerjakan sendiri pekerjaan spesialis — delegasikan; tugasmu memimpin, merutekan, dan merangkai.",
    "Teruskan konteks yang sudah terkumpul antar-tahap agar pengguna tidak ditanya hal yang sama dua kali.",
    "Tandai kontradiksi antar-hasil spesialis bila ada; sampaikan jujur meski tidak menyenangkan.",
    RULE_ASUMSI, RULE_HUMAN_GATE, RULE_NO_THIRD_PARTY,
    ...(def.extraRules || []),
  ];
  return `Kamu adalah ${def.name.split("—")[0].trim()} — ${def.name.split("—")[1]?.trim() || "Direktur Tim"} dari Gustafta, MultiClaw yang mengorkestrasi ${def.members.length} OpenClaw spesialis (masing-masing memimpin alat bantunya sendiri):
${memberList}

${marker(def.slug)} | MULTICLAW_DIREKTUR

MISI: ${def.mission.trim()}

CARA KERJA:

1. PEMBUKAAN — sapa singkat; tanyakan kebutuhan pengguna dan sudah sampai tahap mana.

2. DIAGNOSIS & RUTE — tentukan titik masuk dan urutan spesialis yang tepat:
${def.routing.trim()}
   Jelaskan rutenya ke pengguna sebelum mulai, dan konfirmasi.

3. DELEGASI — serahkan pekerjaan ke spesialis sesuai rute, dengan konteks lengkap.

4. SINTESIS — rangkai hasil antar-tahap menjadi konsisten; hasil tahap sebelumnya menjadi premis tahap berikutnya.

5. RINGKASAN DIREKTUR — akhiri setiap tahap besar dengan ringkasan eksekutif: status, keputusan yang dibutuhkan pengguna (◆ gerbang manusia), tahap berikutnya.

ATURAN:
${rules.map(r => `- ${r}`).join("\n")}`;
}

// ── Seeder generik ───────────────────────────────────────────────────────────
async function upsertToolAgent(claw: ClawDef, tool: ClawToolDef): Promise<number> {
  const systemPrompt = buildToolPrompt(claw, tool);
  const existing = await storage.getAgentBySlug(tool.slug);
  if (existing) {
    await storage.updateAgent(String(existing.id), { name: tool.name, systemPrompt, isActive: true } as any);
    return Number(existing.id);
  }
  const created = await storage.createAgent({
    name: tool.name, slug: tool.slug,
    description: `Alat bantu ${claw.name.split("—")[0].trim()}: ${tool.role}`,
    systemPrompt,
    aiModel: "gpt-4o-mini", temperature: "0.4", maxTokens: 2500,
    isPublic: false, isActive: true, tagline: tool.role, avatar: claw.avatar, agenticSubAgents: null,
  } as any);
  return Number(created.id);
}

async function upsertOrchestrator(opts: {
  slug: string; name: string; tagline: string; avatar: string; category: string;
  description: string; systemPrompt: string;
  agenticConfig: { role: string; agentId: number; description: string }[];
  licenseClass: number; licensePrice: number; monthlyPrice: number; logTag: string;
}) {
  const storeFields = {
    isPublic: true, category: opts.category,
    licenseClass: opts.licenseClass, licensePrice: opts.licensePrice, monthlyPrice: opts.monthlyPrice,
  };
  const existing = await storage.getAgentBySlug(opts.slug);
  if (existing) {
    // REKONSILIASI (bukan early-return) — prompt/wiring/harga selalu disamakan.
    await storage.updateAgent(String(existing.id), {
      ...storeFields,
      name: opts.name, tagline: opts.tagline, avatar: opts.avatar,
      systemPrompt: opts.systemPrompt, description: opts.description,
      isListed: true, isActive: true, premiumClass: "private",
      aiModel: "gpt-4o", agenticSubAgents: opts.agenticConfig,
    } as any);
    console.log(`[ClawFactory] ${opts.logTag} reconciled (ID ${existing.id}).`);
    return;
  }
  const orch = await storage.createAgent({
    name: opts.name, slug: opts.slug, description: opts.description,
    systemPrompt: opts.systemPrompt,
    aiModel: "gpt-4o", temperature: "0.4", maxTokens: 4000,
    isActive: true, tagline: opts.tagline, avatar: opts.avatar,
    agenticSubAgents: opts.agenticConfig, ...storeFields,
  } as any);
  // createAgent men-drop isPublic/isListed/premiumClass — WAJIB set eksplisit.
  await storage.updateAgent(String(orch.id), { isPublic: true, isListed: true, premiumClass: "private" } as any);
  console.log(`[ClawFactory] ${opts.logTag} created (ID ${orch.id}) — listed & sellable.`);
}

export async function seedOpenClaw(claw: ClawDef) {
  const allTools = [...claw.tools, buildEvaluatorDef(claw)];
  const agenticConfig: { role: string; agentId: number; description: string }[] = [];
  for (const tool of allTools) {
    const id = await upsertToolAgent(claw, tool);
    agenticConfig.push({ role: tool.role, agentId: id, description: tool.name });
  }
  await upsertOrchestrator({
    slug: claw.slug, name: claw.name, tagline: claw.tagline, avatar: claw.avatar, category: claw.category,
    description:
      `OpenClaw spesialis ${claw.docLabel} — 1 orkestrator + ${allTools.length} alat bantu (${allTools.map(t => t.role).join(", ")}). ` +
      `Wawancara terarah (maks 5 pertanyaan) → ${claw.docLabel} ${claw.structure.length} bagian → evaluasi tabel rubrik → perbaikan iteratif.`,
    systemPrompt: buildOrchestratorPrompt(claw, allTools),
    agenticConfig,
    licenseClass: claw.licenseClass, licensePrice: claw.licensePrice, monthlyPrice: claw.monthlyPrice,
    logTag: claw.slug,
  });
}

export async function seedMultiClaw(def: MultiClawDef) {
  const agenticConfig: { role: string; agentId: number; description: string }[] = [];
  for (const m of def.members) {
    const member = await storage.getAgentBySlug(m.slug);
    if (!member) {
      console.log(`[ClawFactory] ⚠️ ${def.slug}: anggota '${m.slug}' belum ada — ditunda ke boot berikutnya.`);
      return;
    }
    agenticConfig.push({ role: m.role, agentId: Number(member.id), description: m.desc });
  }
  await upsertOrchestrator({
    slug: def.slug, name: def.name, tagline: def.tagline, avatar: def.avatar, category: def.category,
    description:
      `MultiClaw — mengorkestrasi ${def.members.length} tim OpenClaw spesialis: ${def.members.map(m => m.desc.split("—")[0].trim()).join(", ")}. ` +
      def.mission.trim().split("\n")[0],
    systemPrompt: buildMultiClawPrompt(def),
    agenticConfig,
    licenseClass: def.licenseClass, licensePrice: def.licensePrice, monthlyPrice: def.monthlyPrice,
    logTag: def.slug,
  });
}

/** Seed seluruh katalog. OpenClaw dulu, MultiClaw belakangan (butuh anggota). */
export async function seedClawCatalog(catalog: CatalogEntry[]) {
  const openclaws = catalog.filter((c): c is ClawDef => c.kind === "openclaw");
  const multiclaws = catalog.filter((c): c is MultiClawDef => c.kind === "multiclaw");
  console.log(`[ClawFactory] Mulai — ${openclaws.length} OpenClaw + ${multiclaws.length} MultiClaw dari katalog...`);
  for (const c of openclaws) {
    try { await seedOpenClaw(c); } catch (err) { console.error(`[ClawFactory] ${c.slug} error: ${(err as Error).message}`); }
  }
  for (const m of multiclaws) {
    try { await seedMultiClaw(m); } catch (err) { console.error(`[ClawFactory] ${m.slug} error: ${(err as Error).message}`); }
  }
  console.log("[ClawFactory] Selesai.");
}
