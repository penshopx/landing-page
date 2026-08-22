process.on("SIGHUP", () => {
  console.log(`${new Date().toLocaleTimeString()} [express] SIGHUP received — ignoring to keep server alive`);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(`${new Date().toLocaleTimeString()} [express] Unhandled Promise Rejection:`, reason);
});

process.on("uncaughtException", (err) => {
  console.error(`${new Date().toLocaleTimeString()} [express] Uncaught Exception:`, err);
});

import express, { type Request, Response, NextFunction } from "express";

import { invalidateStoreCatalog, registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerAudioRoutes } from "./replit_integrations/audio";
import { storage } from "./storage";
import { pool } from "./db";
import { startSchedulerLeaderElection, isSchedulerLeader } from "./lib/scheduler-leader";

import * as M_knowledgeBase from "./seed-knowledge-base";
import * as M_regulasi from "./seed-regulasi";
import * as M_asesor from "./seed-asesor";
import * as M_asesorLspExtra from "./seed-asesor-lsp-extra";
import * as M_smapPancek from "./seed-smap-pancek";
import * as M_odoo from "./seed-odoo";
import * as M_csmsOptia from "./seed-csms-optia";
import * as M_civilpro from "./seed-civilpro";
import * as M_sipPjbu from "./seed-sip-pjbu";
import * as M_manajemenLsbu from "./seed-manajemen-lsbu";
import * as M_manajemenLsp from "./seed-manajemen-lsp";
import * as M_manajemenLspExtra from "./seed-manajemen-lsp-extra";
import * as M_skkSipilWave1 from "./seed-skk-sipil-wave1";
import * as M_skkSipilWave2 from "./seed-skk-sipil-wave2";
import * as M_skkSipilWave2A from "./seed-skk-sipil-wave2a";
import * as M_skkSipilWave2B from "./seed-skk-sipil-wave2b";
import * as M_skkSipilWave2C from "./seed-skk-sipil-wave2c";
import * as M_iso14001 from "./seed-iso14001";
import * as M_iso9001 from "./seed-iso9001";
import * as M_siapUkom from "./seed-siap-ukom";
import * as M_kompetensiTeknis from "./seed-kompetensi-teknis";
import * as M_aspekindo from "./seed-aspekindo";
import * as M_skkAjj from "./seed-skk-ajj";
import * as M_ajjNirkertas from "./seed-ajj-nirkertas";
import * as M_ajjNirkertasExtra from "./seed-ajj-nirkertas-extra";
import * as M_skkHardcopy from "./seed-skk-hardcopy";
import * as M_skkHardcopyExtra from "./seed-skk-hardcopy-extra";
import * as M_askomKonstruksi from "./seed-askom-konstruksi";
import * as M_askomKonstruksiExtra from "./seed-askom-konstruksi-extra";
import * as M_lisensiLsp from "./seed-lisensi-lsp";
import * as M_lisensiLspExtra from "./seed-lisensi-lsp-extra";
import * as M_konsultanLisensiLsp from "./seed-konsultan-lisensi-lsp";
import * as M_akreditasiKan from "./seed-akreditasi-kan";
import * as M_akreditasiKanExtra from "./seed-akreditasi-kan-extra";
import * as M_smapIso37001 from "./seed-smap-iso37001";
import * as M_pancekKpk from "./seed-pancek-kpk";
import * as M_odooBujk from "./seed-odoo-bujk";
import * as M_odooMigrasi from "./seed-odoo-migrasi";
import * as M_kompetensiManajerialBujk from "./seed-kompetensi-manajerial-bujk";
import * as M_kompetensiManajerialPatch from "./seed-kompetensi-manajerial-patch";
import * as M_imsSmk3Terintegrasi from "./seed-ims-smk3-terintegrasi";
import * as M_personelManajerialBujk from "./seed-personel-manajerial-bujk";
import * as M_tenderKonstruksiPbjp from "./seed-tender-konstruksi-pbjp";
import * as M_pascaTenderManajemenKontrak from "./seed-pasca-tender-manajemen-kontrak";
import * as M_pelaksanaanProyekLapangan from "./seed-pelaksanaan-proyek-lapangan";
import * as M_legalitasJasaKonstruksi from "./seed-legalitas-jasa-konstruksi";
import * as M_regulasiJasaKonstruksi from "./seed-regulasi-jasa-konstruksi";
import * as M_sbuCoach from "./seed-sbu-coach";
import * as M_sbuMaster from "./seed-sbu-master";
import * as M_sbuTerintegrasi from "./seed-sbu-terintegrasi";
import * as M_skkManajemenPelaksanaan from "./seed-skk-manajemen-pelaksanaan";
import * as M_skkMekanikal from "./seed-skk-mekanikal";
import * as M_skkSipil from "./seed-skk-sipil";
import * as M_skkElektrikal from "./seed-skk-elektrikal";
import * as M_skkArsitektur from "./seed-skk-arsitektur";
import * as M_skkTataLingkungan from "./seed-skk-tata-lingkungan";
import * as M_skkK3Konstruksi from "./seed-skk-k3-konstruksi";
import * as M_skkManajemenProyek from "./seed-skk-manajemen-proyek";
import * as M_skkGeoteknik from "./seed-skk-geoteknik";
import * as M_skkPengujianQc from "./seed-skk-pengujian-qc";
import * as M_skkBangunanGedung from "./seed-skk-bangunan-gedung";
import * as M_skkKonstruksiKhusus from "./seed-skk-konstruksi-khusus";
import * as M_skkPeralatanLogistik from "./seed-skk-peralatan-logistik";
import * as M_sbuPenunjangListrik from "./seed-sbu-penunjang-listrik";
import * as M_sktkTenagaListrik from "./seed-sktk-tenaga-listrik";
import * as M_sbuKompetensiMigasEbtTambang from "./seed-sbu-kompetensi-migas-ebt-tambang";
import * as M_developerRealEstate from "./seed-developer-real-estate";
import * as M_layananRealEstate from "./seed-layanan-real-estate";
import * as M_pusatFaqPeserta from "./seed-pusat-faq-peserta";
import * as M_itLspPaperlessAjj from "./seed-it-lsp-paperless-ajj";
import * as M_itLspPaperlessAjjExtra from "./seed-it-lsp-paperless-ajj-extra";
import * as M_fixOrchestrators from "./fix-orchestrators";
import * as M_inaprocScraper from "./lib/inaproc-scraper";
import * as M_ahspHspk from "./seed-ahsp-hspk";
import * as M_tenderSources from "./seed-tender-sources";
import * as M_kabKotaSources from "./seed-kabkota-sources";
import * as M_tenderAiAgents from "./seed-tender-ai-agents";
import * as M_tenderaAgents from "./seed-tendera-agents";
import * as M_brainProject from "./seed-brain-project";
import * as M_educounsel from "./seed-educounsel";
import * as M_educounselConcierge from "./seed-educounsel-concierge";
import * as M_ibTu from "./seed-ib-tu";
import * as M_konsultanPermenPu from "./seed-konsultan-permen-pu";
import * as M_konsultanPermenPu2026 from "./seed-konsultan-permen-pu-2026";
import * as M_scopeSKK from "./seed-scope-skk";
import * as M_sipilClaw from "./seed-sipil-claw";
import * as M_mepClaw from "./seed-mep-claw";
import * as M_k3Claw from "./seed-k3-claw";
import * as M_lingkunganClaw from "./seed-lingkungan-claw";
import * as M_manprojakClaw from "./seed-manprojak-claw";
import * as M_arsitekturClaw from "./seed-arsitektur-claw";
import * as M_surveiPemetaanClaw from "./seed-surveipemetaan-claw";
import * as M_geoteknikClaw from "./seed-geoteknik-claw";
import * as M_jalanJembatanClaw from "./seed-jalanjembatan-claw";
import * as M_tataLingkunganClaw from "./seed-tatalingkungan-claw";
import * as M_elekTrikalClaw from "./seed-elektrikal-claw";
import * as M_qsClaw from "./seed-qs-claw";
import * as M_pengawasClaw from "./seed-pengawas-claw";
import * as M_kontrakClaw from "./seed-kontrak-claw";
import * as M_k3ManClaw from "./seed-k3man-claw";
import * as M_ibtuClaw from "./seed-ibtu-claw";
import * as M_etloAcademyClaw from "./seed-etlo-academy-claw";
import * as M_etloBizDevClaw from "./seed-etlo-bizdev-claw";
import * as M_bimClaw from "./seed-bim-claw";
import * as M_desainClaw from "./seed-desain-claw";
import * as M_siteOpsClaw from "./seed-siteops-claw";
import * as M_ketenagalistrikanClaw from "./seed-ketenagalistrikan-claw";
import * as M_energiClaw from "./seed-energi-claw";
import * as M_pertambanganClaw from "./seed-pertambangan-claw";
import * as M_ebtSolarClaw from "./seed-ebt-solar-claw";
import * as M_safiraClaw from "./seed-safira-claw";
import * as M_geologiClaw from "./seed-geologi-claw";
import * as M_offshoreSafetyClaw from "./seed-offshore-safety-claw";
import * as M_transisiEnergiClaw from "./seed-transisi-energi-claw";
import * as M_digitalMarketingClaw from "./seed-digital-marketing-claw";
import * as M_marketIntelligenceClaw from "./seed-market-intelligence-claw";
import * as M_autopilotJualan from "./seed-autopilot-jualan";
import * as M_risetAudiens from "./seed-riset-audiens";
import * as M_funnelOtomatis from "./seed-funnel-otomatis";
import * as M_agenKeputusan from "./seed-agen-keputusan";
import * as M_crmSalesClaw from "./seed-crm-sales-claw";
import * as M_brandContentClaw from "./seed-brand-content-claw";
import * as M_ecommerceClaw from "./seed-ecommerce-claw";
import * as M_rekrutmenClaw from "./seed-rekrutmen-claw";
import * as M_ldKompetensiClaw from "./seed-ld-kompetensi-claw";
import * as M_penilaianKinerjaClaw from "./seed-penilaian-kinerja-claw";
import * as M_tutorTeknikClaw from "./seed-tutor-teknik-claw";
import * as M_risetSkripsiClaw from "./seed-riset-skripsi-claw";
import * as M_nspkNavigatorClaw from "./seed-nspk-navigator-claw";
import * as M_korporasiClaw from "./seed-korporasi-claw";
import * as M_pajakClaw from "./seed-pajak-claw";
import * as M_hubunganIndustrialClaw from "./seed-hubungan-industrial-claw";
import * as M_esgClaw from "./seed-esg-claw";
import * as M_leanOpExClaw from "./seed-lean-opex-claw";
import * as M_supplyChainClaw from "./seed-supply-chain-claw";
import * as M_industri40Claw from "./seed-industri40-claw";
import * as M_transmisiClaw from "./seed-transmisi-claw";
import * as M_cybersecurityClaw from "./seed-cybersecurity-claw";
import * as M_haccpClaw from "./seed-haccp-claw";
import * as M_lkpmClaw from "./seed-lkpm-claw";
import * as M_pubLkutClaw from "./seed-pub-lkut-claw";
import * as M_bgClaw from "./seed-bg-claw";
import * as M_bsClaw from "./seed-bs-claw";
import * as M_imClaw from "./seed-im-claw";
import * as M_koClaw from "./seed-ko-claw";
import * as M_kkClaw from "./seed-kk-claw";
import * as M_pjbuClaw from "./seed-pjbu-claw";
import * as M_keuanganClaw from "./seed-keuangan-claw";
import * as M_sbuClaw from "./seed-sbuclaw";
import * as M_aiTutor from "./seed-ai-tutor";
import * as M_skemaClaw from "./seed-skema-claw";
import * as M_simpkClaw from "./seed-simpk-claw";
import * as M_esimpanClaw from "./seed-esimpan-claw";
import * as M_ossClaw from "./seed-oss-claw";
import * as M_terasLpjk1 from "./seed-teras-lpjk1";
import * as M_penulisCerdasPkb from "./seed-penulis-cerdas";
import * as M_desainProyekClaw from "./seed-desain-proyek-claw";
import * as M_rencanaProyekClaw from "./seed-rencana-proyek-claw";
import * as M_studiKelayakanClaw from "./seed-studi-kelayakan-claw";
import * as M_persiapanProyekMulticlaw from "./seed-persiapan-proyek-multiclaw";
import { seedClawCatalog } from "./lib/claw-factory";
import { CLAW_CATALOG } from "./claw-catalog";
import { seedStoreProducts } from "./seed-store-products";
import { seedSbuSkkEbook } from "./seed-sbu-skk-ebook";
import { seedSbuSkkFunnel } from "./seed-sbu-skk-funnel";
import { ensureSbuSkkFunnelSchema } from "./sbu-skk-funnel-schema";
import { registerSbuReadinessEventIngress } from "./sbu-skk-funnel";
import { startDigitalDeliveryOutboxWorker } from "./lib/digital-delivery-outbox";

const seedModuleRegistry: Record<string, any> = {
  "./seed-knowledge-base": M_knowledgeBase,
  "./seed-regulasi": M_regulasi,
  "./seed-asesor": M_asesor,
  "./seed-asesor-lsp-extra": M_asesorLspExtra,
  "./seed-smap-pancek": M_smapPancek,
  "./seed-odoo": M_odoo,
  "./seed-csms-optia": M_csmsOptia,
  "./seed-civilpro": M_civilpro,
  "./seed-sip-pjbu": M_sipPjbu,
  "./seed-manajemen-lsbu": M_manajemenLsbu,
  "./seed-manajemen-lsp": M_manajemenLsp,
  "./seed-manajemen-lsp-extra": M_manajemenLspExtra,
  "./seed-skk-sipil-wave1": M_skkSipilWave1,
  "./seed-skk-sipil-wave2": M_skkSipilWave2,
  "./seed-skk-sipil-wave2a": M_skkSipilWave2A,
  "./seed-skk-sipil-wave2b": M_skkSipilWave2B,
  "./seed-skk-sipil-wave2c": M_skkSipilWave2C,
  "./seed-iso14001": M_iso14001,
  "./seed-iso9001": M_iso9001,
  "./seed-siap-ukom": M_siapUkom,
  "./seed-kompetensi-teknis": M_kompetensiTeknis,
  "./seed-aspekindo": M_aspekindo,
  "./seed-skk-ajj": M_skkAjj,
  "./seed-ajj-nirkertas": M_ajjNirkertas,
  "./seed-ajj-nirkertas-extra": M_ajjNirkertasExtra,
  "./seed-skk-hardcopy": M_skkHardcopy,
  "./seed-skk-hardcopy-extra": M_skkHardcopyExtra,
  "./seed-askom-konstruksi": M_askomKonstruksi,
  "./seed-askom-konstruksi-extra": M_askomKonstruksiExtra,
  "./seed-lisensi-lsp": M_lisensiLsp,
  "./seed-lisensi-lsp-extra": M_lisensiLspExtra,
  "./seed-konsultan-lisensi-lsp": M_konsultanLisensiLsp,
  "./seed-akreditasi-kan": M_akreditasiKan,
  "./seed-akreditasi-kan-extra": M_akreditasiKanExtra,
  "./seed-smap-iso37001": M_smapIso37001,
  "./seed-pancek-kpk": M_pancekKpk,
  "./seed-odoo-bujk": M_odooBujk,
  "./seed-odoo-migrasi": M_odooMigrasi,
  "./seed-kompetensi-manajerial-bujk": M_kompetensiManajerialBujk,
  "./seed-kompetensi-manajerial-patch": M_kompetensiManajerialPatch,
  "./seed-ims-smk3-terintegrasi": M_imsSmk3Terintegrasi,
  "./seed-personel-manajerial-bujk": M_personelManajerialBujk,
  "./seed-tender-konstruksi-pbjp": M_tenderKonstruksiPbjp,
  "./seed-pasca-tender-manajemen-kontrak": M_pascaTenderManajemenKontrak,
  "./seed-pelaksanaan-proyek-lapangan": M_pelaksanaanProyekLapangan,
  "./seed-legalitas-jasa-konstruksi": M_legalitasJasaKonstruksi,
  "./seed-regulasi-jasa-konstruksi": M_regulasiJasaKonstruksi,
  "./seed-sbu-coach": M_sbuCoach,
  "./seed-sbu-master": M_sbuMaster,
  "./seed-sbu-terintegrasi": M_sbuTerintegrasi,
  "./seed-skk-manajemen-pelaksanaan": M_skkManajemenPelaksanaan,
  "./seed-skk-mekanikal": M_skkMekanikal,
  "./seed-skk-sipil": M_skkSipil,
  "./seed-skk-elektrikal": M_skkElektrikal,
  "./seed-skk-arsitektur": M_skkArsitektur,
  "./seed-skk-tata-lingkungan": M_skkTataLingkungan,
  "./seed-skk-k3-konstruksi": M_skkK3Konstruksi,
  "./seed-skk-manajemen-proyek": M_skkManajemenProyek,
  "./seed-skk-geoteknik": M_skkGeoteknik,
  "./seed-skk-pengujian-qc": M_skkPengujianQc,
  "./seed-skk-bangunan-gedung": M_skkBangunanGedung,
  "./seed-skk-konstruksi-khusus": M_skkKonstruksiKhusus,
  "./seed-skk-peralatan-logistik": M_skkPeralatanLogistik,
  "./seed-sbu-penunjang-listrik": M_sbuPenunjangListrik,
  "./seed-sktk-tenaga-listrik": M_sktkTenagaListrik,
  "./seed-sbu-kompetensi-migas-ebt-tambang": M_sbuKompetensiMigasEbtTambang,
  "./seed-developer-real-estate": M_developerRealEstate,
  "./seed-layanan-real-estate": M_layananRealEstate,
  "./seed-pusat-faq-peserta": M_pusatFaqPeserta,
  "./seed-it-lsp-paperless-ajj": M_itLspPaperlessAjj,
  "./seed-it-lsp-paperless-ajj-extra": M_itLspPaperlessAjjExtra,
  "./fix-orchestrators": M_fixOrchestrators,
  "./lib/inaproc-scraper": M_inaprocScraper,
  "./seed-ahsp-hspk": M_ahspHspk,
  "./seed-tender-sources": M_tenderSources,
  "./seed-kabkota-sources": M_kabKotaSources,
  "./seed-bg-claw": M_bgClaw,
  "./seed-bs-claw": M_bsClaw,
  "./seed-im-claw": M_imClaw,
  "./seed-ko-claw": M_koClaw,
  "./seed-kk-claw": M_kkClaw,
  "./seed-pjbu-claw": M_pjbuClaw,
  "./seed-keuangan-claw": M_keuanganClaw,
  "./seed-sbuclaw": M_sbuClaw,
  "./seed-ai-tutor": M_aiTutor,
  "./seed-skema-claw": M_skemaClaw,
  "./seed-simpk-claw": M_simpkClaw,
  "./seed-esimpan-claw": M_esimpanClaw,
  "./seed-oss-claw": M_ossClaw,
  "./seed-teras-lpjk1": M_terasLpjk1,
};

// NOTE: Schema migration is handled by Replit's deployment pipeline, which copies
// the development database (schema + data) to production before the container starts.
// We intentionally do NOT run `drizzle-kit push` at runtime here: it is a dev-only CLI
// invoked via `npx`, runs synchronously at module load (blocking the event loop before
// the HTTP server can `listen`), and on autoscale this blocks the startup health probe
// long enough to fail the promote step. Keeping startup fast lets the probe pass.

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Privacy-first readiness analytics has a strict 1 KB parser and shared
// rate limiter before the app-wide 50 MB JSON parser.
registerSbuReadinessEventIngress(app);

// Guard khusus /api/tender-ingest: tolak body besar SEBELUM JSON di-parse
// (endpoint publik ber-kunci; limit global 50mb terlalu besar untuk jalur ini)
app.use("/api/tender-ingest", (req, res, next) => {
  const len = Number(req.headers["content-length"] || 0);
  if (len > 5 * 1024 * 1024) {
    return res.status(413).json({ error: "Payload terlalu besar (maks 5MB)" });
  }
  next();
});

// Guard khusus /api/v1/ai/assist (external API Gaia SIAP): payload wajar hanya
// puluhan KB (prompt+context ≤ ~40k char). Tolak SEBELUM JSON di-parse agar
// pemegang key tidak bisa mengirim body raksasa (limit global 50mb).
app.use("/api/v1/ai/assist", (req, res, next) => {
  const len = Number(req.headers["content-length"] || 0);
  if (len > 256 * 1024) {
    return res.status(413).json({ error: "payload_too_large", message: "Payload terlalu besar (maks 256KB)" });
  }
  next();
});

// Guard khusus /api/v1/orders (Unified Order API): payload order hanya beberapa KB.
app.use("/api/v1/orders", (req, res, next) => {
  const len = Number(req.headers["content-length"] || 0);
  if (len > 64 * 1024) {
    return res.status(413).json({ error: "payload_too_large", message: "Payload terlalu besar (maks 64KB)" });
  }
  next();
});

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/sw.js", (req, res, next) => {
  res.set({
    "Content-Type": "text/javascript",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Service-Worker-Allowed": "/",
  });
  next();
});

app.get("/manifest.json", (req, res, next) => {
  res.set({
    "Content-Type": "application/manifest+json",
    "Cache-Control": "no-cache",
  });
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && process.env.NODE_ENV !== "production") {
        const jsonStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${jsonStr.length > 200 ? jsonStr.substring(0, 200) + "..." : jsonStr}`;
      }

      log(logLine);
    }
  });

  next();
});

const requiredEnvVars = ["DATABASE_URL", "SESSION_SECRET"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}


(async () => {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerAudioRoutes(app);

  // ── lms_lesson_progress → lms_lessons FK (ON DELETE CASCADE) ─────────────
  // Ensures that deleting a lesson atomically removes all progress rows for
  // that lesson at the DB level, preventing orphaned rows regardless of
  // concurrent writes or application-layer failures.
  try {
    // 1. Clean any pre-existing orphaned rows (no matching lesson).
    const { rowCount: orphans } = await pool.query(`
      DELETE FROM lms_lesson_progress
      WHERE lesson_id NOT IN (SELECT id FROM lms_lessons)
    `);
    if (orphans && orphans > 0) {
      console.log(`${new Date().toLocaleTimeString()} [express] lms_lesson_progress: removed ${orphans} orphaned rows`);
    }
    // 2. Add the FK constraint idempotently.
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'lms_lesson_progress_lesson_id_fkey'
            AND table_name = 'lms_lesson_progress'
        ) THEN
          ALTER TABLE lms_lesson_progress
            ADD CONSTRAINT lms_lesson_progress_lesson_id_fkey
            FOREIGN KEY (lesson_id) REFERENCES lms_lessons(id) ON DELETE CASCADE;
        END IF;
      END$$;
    `);
    console.log(`${new Date().toLocaleTimeString()} [express] lms_lesson_progress FK (ON DELETE CASCADE) ready`);
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} [express] lms_lesson_progress FK migration error:`, e);
  }

  // ── LMS Certificates table (idempotent DDL) ─────────────────────────────
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_certificates (
        id               SERIAL PRIMARY KEY,
        user_id          VARCHAR(255) NOT NULL,
        course_id        INTEGER NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
        certificate_code TEXT NOT NULL UNIQUE,
        issued_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, course_id)
      );
    `);
    console.log(`${new Date().toLocaleTimeString()} [express] lms_certificates table ready`);
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} [express] lms_certificates DDL error:`, e);
  }

  // ── Jamin unique index (user_id, course_id) ada — repair tabel lama ──────
  // CREATE TABLE IF NOT EXISTS di atas TIDAK menambahkan constraint ke tabel
  // yang sudah ada tanpa constraint; tanpa index unik, semua INSERT dengan
  // ON CONFLICT (user_id, course_id) melempar error → 500.
  try {
    const { ensureCertificateUniqueIndex } = await import("./lms-cert-schema");
    const r = await ensureCertificateUniqueIndex(pool);
    if (r.created) {
      console.log(`${new Date().toLocaleTimeString()} [express] lms_certificates unique index CREATED (deduped ${r.deduped} row(s))`);
    } else {
      console.log(`${new Date().toLocaleTimeString()} [express] lms_certificates unique index verified`);
    }
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} [express] lms_certificates unique index repair error:`, e);
  }

  // ── Jamin unique index (course_id, slug) ada di lms_lessons ─────────────
  // Rekonsiliasi seed mengunci identitas lesson pada slug per course; tanpa
  // index unik, slug ganda membuat lesson dobel & update rekonsiliasi ambigu.
  // Dedupe dulu (pertahankan baris aktif terbaru), lalu CREATE UNIQUE INDEX.
  try {
    const { ensureLessonUniqueIndex } = await import("./lms-lesson-schema");
    const r = await ensureLessonUniqueIndex(pool);
    if (r.created) {
      console.log(`${new Date().toLocaleTimeString()} [express] lms_lessons (course_id, slug) unique index CREATED (deduped ${r.deduped} row(s))`);
    } else {
      console.log(`${new Date().toLocaleTimeString()} [express] lms_lessons (course_id, slug) unique index verified`);
    }
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} [express] lms_lessons unique index repair error:`, e);
  }

  // ── Backfill certificates for completions that pre-date the certificate feature ──
  try {
    // Find enrollments that are 100% complete but have no certificate yet
    const pending = await pool.query(`
      SELECT e.user_id, e.course_id
      FROM lms_enrollments e
      WHERE e.progress = 100
        AND e.completed_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM lms_certificates c
          WHERE c.user_id = e.user_id AND c.course_id = e.course_id
        )
    `);
    if (pending.rows.length > 0) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let backfilled = 0;
      for (const row of pending.rows) {
        const year = new Date().getFullYear();
        let code = "";
        for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
        const certCode = `GUSTAFTA-${year}-${code}`;
        try {
          await pool.query(
            `INSERT INTO lms_certificates (user_id, course_id, certificate_code)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, course_id) DO NOTHING`,
            [row.user_id, row.course_id, certCode]
          );
          backfilled++;
        } catch (_) { /* skip individual failures */ }
      }
      console.log(`${new Date().toLocaleTimeString()} [express] lms_certificates backfill: ${backfilled}/${pending.rows.length} inserted`);
      const stillPending = pending.rows.length - backfilled;
      if (stillPending > 0) {
        console.warn(
          `${new Date().toLocaleTimeString()} [express] lms_certificates backfill INCOMPLETE: ` +
          `${stillPending} completion(s) still have no certificate after backfill. ` +
          `Use POST /api/admin/lms/cert-repair to retry.`
        );
      }
      // Persist backfill result so the health dashboard can surface it
      try {
        await pool.query(
          `INSERT INTO system_config (key, value) VALUES ('lms_cert_backfill_last', $1)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [JSON.stringify({ backfilled, total: pending.rows.length, at: new Date().toISOString() })]
        );
      } catch (_) { /* non-critical */ }
    } else {
      console.log(`${new Date().toLocaleTimeString()} [express] lms_certificates backfill: nothing to do`);
      // Record idempotent run so health can confirm it
      try {
        await pool.query(
          `INSERT INTO system_config (key, value) VALUES ('lms_cert_backfill_last', $1)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [JSON.stringify({ backfilled: 0, total: 0, at: new Date().toISOString() })]
        );
      } catch (_) { /* non-critical */ }
    }
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} [express] lms_certificates backfill error:`, e);
  }

  // ── Document Analyses table (idempotent DDL) ──────────────────────────────
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_analyses (
        id             SERIAL PRIMARY KEY,
        user_id        TEXT NOT NULL,
        filename       TEXT,
        original_name  TEXT,
        file_size      BIGINT,
        doc_type       TEXT,
        extracted_text TEXT,
        status         TEXT NOT NULL DEFAULT 'analyzing',
        summary        TEXT,
        checklist      JSONB,
        error_msg      TEXT,
        chat_history   JSONB DEFAULT '[]',
        regulasi_note  JSONB,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log(`${new Date().toLocaleTimeString()} [express] document_analyses table ready`);
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} [express] document_analyses DDL error:`, e);
  }

  // ── Blueprint Submissions table (idempotent DDL) ──────────────────────────
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blueprint_submissions (
        id          SERIAL PRIMARY KEY,
        session_id  TEXT,
        user_id     TEXT,
        nama_ai     TEXT NOT NULL,
        domain      TEXT NOT NULL,
        persona     TEXT,
        sasaran_pengguna TEXT,
        fitur_utama JSONB DEFAULT '[]',
        system_prompt_hint TEXT,
        langkah_selanjutnya JSONB DEFAULT '[]',
        status      TEXT NOT NULL DEFAULT 'pending',
        admin_notes TEXT,
        contacted_at TIMESTAMPTZ,
        contacted_by TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log(`${new Date().toLocaleTimeString()} [express] blueprint_submissions table ready`);
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} [express] blueprint_submissions DDL error:`, e);
  }

  // ── store_products.price_override column (idempotent DDL) ─────────────────
  try {
    await pool.query(`ALTER TABLE store_products ADD COLUMN IF NOT EXISTS price_override integer`);
    console.log(`${new Date().toLocaleTimeString()} [express] store_products.price_override column ready`);
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} [express] store_products.price_override DDL error:`, e);
  }

  // ── Product Registry + GAIA Publishing tables (idempotent DDL) ────────────
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_registry (
        id serial PRIMARY KEY,
        product_id varchar(40) NOT NULL UNIQUE,
        name text NOT NULL,
        slug text NOT NULL UNIQUE,
        product_type text NOT NULL,
        category text NOT NULL,
        subcategory text,
        short_description text,
        long_description text,
        target_users text,
        features jsonb DEFAULT '[]'::jsonb,
        benefits jsonb DEFAULT '[]'::jsonb,
        thumbnail text,
        gallery jsonb DEFAULT '[]'::jsonb,
        demo_url text,
        product_url text,
        price integer NOT NULL DEFAULT 0,
        currency text NOT NULL DEFAULT 'IDR',
        billing_type text NOT NULL DEFAULT 'ONE_TIME',
        status text NOT NULL DEFAULT 'DRAFT',
        version text NOT NULL DEFAULT '1.0.0',
        engine_type text,
        access_type text,
        access_url text,
        gaia_enabled boolean NOT NULL DEFAULT false,
        gaia_featured boolean NOT NULL DEFAULT false,
        gaia_status text NOT NULL DEFAULT 'NOT_READY',
        last_published_at timestamp,
        last_published_version text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gaia_export_history (
        id serial PRIMARY KEY,
        product_id varchar(40) NOT NULL,
        product_version text NOT NULL,
        bundle_version text NOT NULL,
        export_status text NOT NULL,
        checksum text,
        detail jsonb,
        exported_at timestamp NOT NULL DEFAULT now()
      )`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_gaia_export_product ON gaia_export_history (product_id, exported_at)`);
    console.log(`${new Date().toLocaleTimeString()} [express] product_registry + gaia_export_history ready`);
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} [express] product_registry DDL error:`, e);
  }

  // ── Phase 1: Solution Package Engine — additive DDL + seed default ────────
  try {
    // Kolom baru product_registry (additive, aman untuk data existing)
    await pool.query(`
      ALTER TABLE product_registry
        ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'INTERNAL_ONLY',
        ADD COLUMN IF NOT EXISTS standalone_enabled boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS subscription_enabled boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS dp_enabled boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS usage_profile jsonb DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS storage_profile text`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS solution_registry (
        id serial PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE,
        description text, status text NOT NULL DEFAULT 'ACTIVE',
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sector_registry (
        id serial PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE,
        description text, status text NOT NULL DEFAULT 'ACTIVE',
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tier_registry (
        id serial PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE,
        description text, level integer NOT NULL DEFAULT 1, status text NOT NULL DEFAULT 'ACTIVE',
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS package_registry (
        id serial PRIMARY KEY,
        package_id varchar(60) NOT NULL UNIQUE,
        solution_id integer NOT NULL REFERENCES solution_registry(id),
        sector_id integer NOT NULL REFERENCES sector_registry(id),
        tier_id integer NOT NULL REFERENCES tier_registry(id),
        name text NOT NULL, slug text NOT NULL UNIQUE, description text,
        status text NOT NULL DEFAULT 'DRAFT',
        duration_value integer NOT NULL DEFAULT 6,
        duration_unit text NOT NULL DEFAULT 'MONTH',
        price integer NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'IDR',
        version integer NOT NULL DEFAULT 1,
        effective_from timestamp, effective_until timestamp,
        gaia_enabled boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS package_products (
        id serial PRIMARY KEY,
        package_id integer NOT NULL REFERENCES package_registry(id) ON DELETE CASCADE,
        product_id integer NOT NULL REFERENCES product_registry(id),
        access_level text NOT NULL DEFAULT 'FULL',
        usage_limit integer, is_required boolean NOT NULL DEFAULT true,
        sort_order integer NOT NULL DEFAULT 0)`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_package_product ON package_products (package_id, product_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_package_products_pkg ON package_products (package_id)`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS package_version_snapshots (
        id serial PRIMARY KEY,
        package_db_id integer NOT NULL REFERENCES package_registry(id) ON DELETE CASCADE,
        package_id varchar(60) NOT NULL,
        version integer NOT NULL,
        name text NOT NULL,
        price integer NOT NULL,
        currency text NOT NULL,
        duration_value integer NOT NULL,
        duration_unit text NOT NULL,
        composition jsonb NOT NULL,
        created_at timestamp NOT NULL DEFAULT now())`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_pkg_version_snapshot ON package_version_snapshots (package_db_id, version)`);

    // ── Unified Order API + Scalev v3 correlation (Fase B + #313A) ─────────
    // Kolom aditif nullable — order lama tidak terpengaruh. Diletakkan SETELAH
    // CREATE product_registry/package_registry agar aman di DB yang baru dibuat.
    await pool.query(`
      ALTER TABLE store_orders
        ADD COLUMN IF NOT EXISTS package_id varchar(60),
        ADD COLUMN IF NOT EXISTS package_version integer,
        ADD COLUMN IF NOT EXISTS item_name text,
        ADD COLUMN IF NOT EXISTS source text,
        ADD COLUMN IF NOT EXISTS scalev_order_id text;
    `);
    await pool.query(`ALTER TABLE product_registry ADD COLUMN IF NOT EXISTS scalev_variant_unique_id varchar(80)`);
    await pool.query(`ALTER TABLE package_registry ADD COLUMN IF NOT EXISTS scalev_variant_unique_id varchar(80)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_store_orders_scalev_order_id ON store_orders (scalev_order_id) WHERE scalev_order_id IS NOT NULL`);
    // Digital delivery outbox. Add nullable first so pre-existing orders can be
    // marked completed and are never re-emailed after this migration.
    await pool.query(`
      ALTER TABLE store_orders
        ADD COLUMN IF NOT EXISTS delivery_status text,
        ADD COLUMN IF NOT EXISTS delivery_attempts integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS delivery_claimed_at timestamp,
        ADD COLUMN IF NOT EXISTS delivery_sent_at timestamp,
        ADD COLUMN IF NOT EXISTS delivery_error text`);
    await pool.query(`UPDATE store_orders SET delivery_status='sent' WHERE delivery_status IS NULL`);
    await pool.query(`ALTER TABLE store_orders ALTER COLUMN delivery_status SET DEFAULT 'pending'`);
    await pool.query(`ALTER TABLE store_orders ALTER COLUMN delivery_status SET NOT NULL`);
    // The Drizzle model has always declared both columns unique, but the live
    // database pre-dates those constraints. The outbox's atomic conflict claim
    // depends on the database enforcing this invariant.
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_store_orders_midtrans_order_id
      ON store_orders (midtrans_order_id)`);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_store_orders_access_token
      ON store_orders (access_token)`);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_store_orders_delivery_queue
      ON store_orders (delivery_status, delivery_claimed_at)
      WHERE delivery_status <> 'sent'`);
    console.log(`${new Date().toLocaleTimeString()} [express] order-api correlation columns ready`);

    // Seed default (idempotent, ON CONFLICT DO NOTHING) — admin bisa menambah lagi
    await pool.query(`
      INSERT INTO tier_registry (name, slug, level) VALUES
        ('Basic','basic',1), ('Professional','professional',2), ('Business','business',3)
      ON CONFLICT (slug) DO NOTHING`);
    await pool.query(`
      INSERT INTO solution_registry (name, slug) VALUES
        ('Legalitas','legalitas'), ('OSS','oss'), ('SBU','sbu'), ('SKK','skk'),
        ('Tender','tender'), ('Proyek','proyek'), ('Compliance','compliance'),
        ('Kompetensi','kompetensi'), ('Finance','finance')
      ON CONFLICT (slug) DO NOTHING`);
    await pool.query(`
      INSERT INTO sector_registry (name, slug) VALUES
        ('Konstruksi','konstruksi'), ('Konsultan','konsultan'), ('Perdagangan','perdagangan'),
        ('Manufaktur','manufaktur'), ('Teknologi','teknologi'), ('Jasa','jasa'), ('Lainnya','lainnya')
      ON CONFLICT (slug) DO NOTHING`);

    // Petakan capability existing Gustafta ke Product Registry (idempotent by slug).
    // Status ACTIVE, visibility INCLUDED_ONLY — TIDAK otomatis jadi produk standalone.
    const caps: Array<[string, string, string, string, string[]]> = [
      // [product_id, name, slug, product_type, usage_profile]
      ["GST-CAP-001", "Peta Jalan Mulai", "peta-jalan-mulai", "MODULE", ["AI_CHAT"]],
      ["GST-CAP-002", "Klinik Konsultasi", "klinik-konsultasi", "DIGITAL_CONSULTATION", ["AI_CHAT"]],
      ["GST-CAP-003", "Bedah Dokumen", "bedah-dokumen", "DOCUMENT_AI", ["DOCUMENT_ANALYSIS"]],
      ["GST-CAP-004", "Brain Project", "brain-project", "AI_WORKSPACE", ["AI_CHAT","KNOWLEDGE_PROCESSING"]],
      ["GST-CAP-005", "Ekosistem Kompetensi", "ekosistem-kompetensi", "MODULE", ["AI_CHAT"]],
      ["GST-CAP-006", "Toolkit", "toolkit", "DIGITAL_TOOL", ["DOCUMENT_GENERATION"]],
      ["GST-CAP-007", "Mitra", "mitra", "MODULE", []],
      ["GST-CAP-008", "Ruang Kelola", "ruang-kelola", "DIGITAL_WORKSPACE", ["STORAGE"]],
      ["GST-CAP-009", "Ruang Simpan", "ruang-simpan", "DIGITAL_WORKSPACE", ["STORAGE"]],
      ["GST-CAP-010", "Jasa Dokumen", "jasa-dokumen", "OTHER_DIGITAL_PRODUCT", []],
      ["GST-CAP-011", "Jasa Keuangan", "jasa-keuangan", "OTHER_DIGITAL_PRODUCT", []],
      ["GST-CAP-012", "Bimtek SKK", "bimtek-skk", "E_COURSE", []],
      ["GST-CAP-013", "Executive Summary", "executive-summary", "GENERATOR", ["DOCUMENT_GENERATION"]],
      ["GST-CAP-014", "Produk AI / AI Specialist", "ai-specialist", "AI_SPECIALIST", ["AI_CHAT","AGENT_EXECUTION"]],
    ];
    for (const [pid, name, slug, ptype, usage] of caps) {
      await pool.query(
        `INSERT INTO product_registry (product_id, name, slug, product_type, category, status, visibility, subscription_enabled, ai_enabled, usage_profile, billing_type)
         VALUES ($1,$2,$3,$4,'CAPABILITY','ACTIVE','INCLUDED_ONLY',true,$5,$6,'FREE')
         ON CONFLICT (slug) DO NOTHING`,
        [pid, name, slug, ptype, ["AI_CHAT","AGENT_EXECUTION","DOCUMENT_ANALYSIS","DOCUMENT_GENERATION","KNOWLEDGE_PROCESSING"].some(u => usage.includes(u)), JSON.stringify(usage)]
      );
    }
    console.log(`${new Date().toLocaleTimeString()} [express] solution/sector/tier/package registries ready`);
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} [express] package engine DDL error:`, e);
  }

  // ── store_products.download_path column (idempotent DDL) ──────────────────
  try {
    await pool.query(`ALTER TABLE store_products ADD COLUMN IF NOT EXISTS download_path text`);
    console.log(`${new Date().toLocaleTimeString()} [express] store_products.download_path column ready`);
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} [express] store_products.download_path DDL error:`, e);
  }

  // ── Private digital-product bytes (server-only, paid-token delivery) ──────
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS digital_product_files (
        id serial PRIMARY KEY,
        product_registry_id varchar(40) NOT NULL
          REFERENCES product_registry(product_id) ON DELETE CASCADE,
        storage_key text NOT NULL UNIQUE,
        file_name text NOT NULL,
        mime_type text NOT NULL DEFAULT 'application/octet-stream',
        size_bytes integer NOT NULL,
        sha256 varchar(64) NOT NULL,
        content bytea NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )`);
    // Migration 0015: remove one-file-per-product uniqueness, add ordering/role columns.
    // Additive: safe on existing data.
    await pool.query(`DROP INDEX IF EXISTS uq_digital_product_file_product`);
    await pool.query(`
      ALTER TABLE digital_product_files
        ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS role varchar(30) NOT NULL DEFAULT 'main',
        ADD COLUMN IF NOT EXISTS label text DEFAULT ''
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_digital_product_files_product
      ON digital_product_files (product_registry_id, sort_order)
    `);
    console.log(`${new Date().toLocaleTimeString()} [express] digital_product_files table ready (multi-file support)`);
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} [express] digital_product_files DDL error:`, e);
  }

  // ── SBU-SKK Funnel tables (Task #395): lead assets, entitlements, orders ──
  try {
    await ensureSbuSkkFunnelSchema(pool);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_assets (
        id serial PRIMARY KEY,
        asset_slug varchar(80) NOT NULL UNIQUE,
        title text NOT NULL,
        mime_type text NOT NULL DEFAULT 'application/pdf',
        size_bytes integer NOT NULL,
        sha256 varchar(64) NOT NULL,
        content bytea NOT NULL,
        pages integer,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_submissions (
        id serial PRIMARY KEY,
        asset_slug varchar(80) NOT NULL,
        name text NOT NULL,
        email varchar(255) NOT NULL,
        whatsapp varchar(30),
        whatsapp_consent boolean NOT NULL DEFAULT false,
        utm_source text DEFAULT '',
        utm_medium text DEFAULT '',
        utm_campaign text DEFAULT '',
        utm_content text DEFAULT '',
        utm_term text DEFAULT '',
        referrer text DEFAULT '',
        landing_path text DEFAULT '',
        access_token varchar(64) NOT NULL UNIQUE,
        expires_at timestamp NOT NULL,
        email_sent boolean NOT NULL DEFAULT false,
        email_sent_at timestamp,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      DELETE FROM lead_submissions duplicate
      USING lead_submissions keeper
      WHERE duplicate.id < keeper.id
        AND duplicate.email = keeper.email
        AND duplicate.asset_slug = keeper.asset_slug
    `);
    await pool.query(`
      DROP INDEX IF EXISTS idx_lead_submissions_email_slug
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_lead_submissions_email_slug
      ON lead_submissions (email, asset_slug)
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_entitlements (
        id serial PRIMARY KEY,
        entitlement_key varchar(60) NOT NULL,
        email varchar(255) NOT NULL,
        user_id varchar(255),
        product_registry_id varchar(40) NOT NULL,
        agent_slug varchar(80) NOT NULL,
        starts_at timestamp NOT NULL DEFAULT now(),
        expires_at timestamp NOT NULL,
        quota_total integer NOT NULL DEFAULT 100,
        quota_used integer NOT NULL DEFAULT 0,
        status varchar(20) NOT NULL DEFAULT 'pending',
        source varchar(40) NOT NULL DEFAULT 'manual',
        provider_order_ref varchar(120),
        manual_order_ref varchar(120),
        granted_by varchar(255),
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_entitlement_provider_order
      ON product_entitlements (entitlement_key, email, provider_order_ref)
      WHERE provider_order_ref IS NOT NULL
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_entitlement_manual_order
      ON product_entitlements (entitlement_key, manual_order_ref)
      WHERE manual_order_ref IS NOT NULL
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_entitlement_email_key
      ON product_entitlements (email, entitlement_key)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_entitlement_user_key
      ON product_entitlements (user_id, entitlement_key)
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sbu_skk_tutor_sources (
        id serial PRIMARY KEY,
        source_title text NOT NULL,
        page_number integer NOT NULL,
        chunk_index integer NOT NULL DEFAULT 0,
        content text NOT NULL,
        search_terms text DEFAULT '',
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_sbu_skk_tutor_sources_search
      ON sbu_skk_tutor_sources (source_title, page_number)
    `);
    await pool.query(`
      DELETE FROM sbu_skk_tutor_sources duplicate
      USING sbu_skk_tutor_sources keeper
      WHERE duplicate.id > keeper.id
        AND duplicate.source_title = keeper.source_title
        AND duplicate.page_number = keeper.page_number
        AND duplicate.chunk_index = keeper.chunk_index
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_sbu_skk_tutor_source_chunk
      ON sbu_skk_tutor_sources (source_title, page_number, chunk_index)
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sbu_skk_orders (
        id serial PRIMARY KEY,
        offer_key varchar(40) NOT NULL,
        product_id varchar(40) NOT NULL,
        amount integer NOT NULL,
        buyer_name text NOT NULL,
        buyer_email varchar(255) NOT NULL,
        buyer_whatsapp varchar(30),
        whatsapp_consent boolean NOT NULL DEFAULT false,
        order_ref varchar(80) NOT NULL UNIQUE,
        status varchar(20) NOT NULL DEFAULT 'pending',
        confirmed_by varchar(255),
        confirmed_at timestamp,
        confirm_evidence text DEFAULT '',
        fulfillment_error text DEFAULT '',
        entitlement_id integer,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      ALTER TABLE sbu_skk_orders
        ADD COLUMN IF NOT EXISTS fulfillment_error text DEFAULT '',
        ADD COLUMN IF NOT EXISTS whatsapp_consent boolean NOT NULL DEFAULT false
    `);
    console.log(`${new Date().toLocaleTimeString()} [express] SBU-SKK funnel tables ready`);
  } catch (e) {
    console.error(`${new Date().toLocaleTimeString()} [express] SBU-SKK funnel DDL error:`, e);
  }

  await registerRoutes(httpServer, app);
  startDigitalDeliveryOutboxWorker();
  const { startMarketResearchRequestWorker } = await import("./lib/market-research-requests");
  startMarketResearchRequestWorker();

  // ── Boot-time channel health check ──────────────────────────────────────────
  if (!process.env.APP_URL) {
    console.warn(
      `${new Date().toLocaleTimeString()} [LMS] ⚠️  APP_URL tidak terkonfigurasi — ` +
      `link verifikasi sertifikat di email akan menggunakan URL produksi default (gustafta.my.id). ` +
      `Tambahkan secret APP_URL di Replit Secrets jika domain berbeda.`
    );
  } else {
    console.log(`${new Date().toLocaleTimeString()} [LMS] ✓ APP_URL: ${process.env.APP_URL}`);
  }

  if (!process.env.BREVO_API_KEY) {
    console.warn(
      `${new Date().toLocaleTimeString()} [Email] ⚠️  BREVO_API_KEY tidak terkonfigurasi — ` +
      `semua pengiriman email (OTP, notifikasi, Tender Alert) akan GAGAL DIAM-DIAM. ` +
      `Tambahkan secret BREVO_API_KEY di Replit Secrets.`
    );
  } else {
    console.log(`${new Date().toLocaleTimeString()} [Email] ✓ BREVO_API_KEY terkonfigurasi`);
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Error body-parser (mis. JSON rusak) membawa RAW BODY di err.body —
    // jangan pernah menulis isi body ke log (bisa berisi prompt/data sensitif).
    if (err?.type === "entity.parse.failed" || err?.body !== undefined) {
      console.error(`Request body error: ${err?.type || err?.name || "unknown"} status=${status}`);
    } else {
      console.error("Internal Server Error:", err);
    }

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    async () => {
      log(`serving on port ${port}`);

      // ── AI PROVIDER STATUS ────────────────────────────────────────────────
      try {
        const { getActiveProviders, warnMisconfiguredProviders } = await import("./lib/model-router");
        const providers = getActiveProviders();
        const active = Object.entries(providers)
          .map(([k, v]) => `${k}:${v ? "✓" : "✗"}`)
          .join("  ");
        log(`AI providers — ${active}`);
        warnMisconfiguredProviders();
      } catch (_) {}

      // ── ORPHAN CLEANUP — hapus toolboxes/agents yang induknya sudah hilang ──
      // Berlaku di dev & prod sebagai defense-in-depth. Idempoten: hanya menghapus baris yang
      // big_idea_id/series_id-nya tidak lagi punya induk valid; aman dijalankan tiap boot.
      try {
        const { db: rawDb } = await import("./db");
        const { sql: rawSql } = await import("drizzle-orm");
        const orphanAgentsRes: any = await rawDb.execute(rawSql`
          DELETE FROM agents
          WHERE toolbox_id IS NOT NULL
            AND toolbox_id NOT IN (SELECT id FROM toolboxes)
          RETURNING id
        `);
        const orphanToolboxesRes: any = await rawDb.execute(rawSql`
          DELETE FROM toolboxes
          WHERE (big_idea_id IS NOT NULL AND big_idea_id NOT IN (SELECT id FROM big_ideas))
             OR (series_id   IS NOT NULL AND series_id   NOT IN (SELECT id FROM series))
          RETURNING id
        `);
        const aRows = (orphanAgentsRes?.rowCount ?? orphanAgentsRes?.rows?.length ?? 0);
        const tRows = (orphanToolboxesRes?.rowCount ?? orphanToolboxesRes?.rows?.length ?? 0);
        if (aRows || tRows) {
          log(`[OrphanCleanup] removed ${tRows} orphan toolbox(es) & ${aRows} orphan agent(s)`);
        }
      } catch (err) {
        log("[OrphanCleanup] error: " + (err as Error).message);
      }

      // ── PUBLIC FLAG REPAIR — pastikan agen SKK/SBU/SKTK Coach is_public=true ──
      // Bug historis: 17 file seed memanggil createAgent() tanpa isPublic:true → default false.
      // Akibatnya endpoint /api/public/modul/:bigIdeaId memfilter habis & UI menampilkan
      // "Belum Ada Chatbot" pada modul SKK Sipil dll. Patch seed sudah memperbaiki untuk
      // seed baru, tapi data eksisting di prod & dev tetap private. Migrasi ini idempoten:
      // hanya UPDATE baris yang masih is_public=false dalam scope SKK/SBU/SKTK Coach.
      try {
        const { db: rawDb } = await import("./db");
        const { sql: rawSql } = await import("drizzle-orm");
        const repairRes: any = await rawDb.execute(rawSql`
          UPDATE agents SET is_public = true
          WHERE id IN (
            SELECT a.id FROM agents a
            JOIN toolboxes t ON a.toolbox_id = t.id
            JOIN series s ON t.series_id = s.id
            WHERE (s.slug LIKE 'skk-%' OR s.slug LIKE 'sbu-%' OR s.slug LIKE 'sktk-%')
              AND a.is_public = false
          )
          RETURNING id
        `);
        const rows = (repairRes?.rowCount ?? repairRes?.rows?.length ?? 0);
        if (rows) {
          log(`[PublicFlagRepair] set is_public=true for ${rows} SKK/SBU/SKTK agent(s)`);
        }
      } catch (err) {
        log("[PublicFlagRepair] error: " + (err as Error).message);
      }

      // ── FREE-MODUL REGISTRATION REPAIR — agent di modul gratis tidak boleh require_registration ──
      // Bug: Agent 24 (Tender Readiness Checker) punya require_registration=true padahal
      // bigIdea 4 (Tender & Pengadaan) gratis (monthly_price=0). Akibatnya chat di /modul/4
      // selalu 403 Forbidden. Patch ini idempoten: hanya update agent yang:
      //   1. Ada di toolbox yang terhubung ke bigIdea dengan monthly_price=0, DAN
      //   2. Masih require_registration=true
      try {
        const { db: rawDb } = await import("./db");
        const { sql: rawSql } = await import("drizzle-orm");
        const freeModulRepairRes: any = await rawDb.execute(rawSql`
          UPDATE agents SET require_registration = false
          WHERE require_registration = true
            AND toolbox_id IN (
              SELECT t.id FROM toolboxes t
              JOIN big_ideas bi ON t.big_idea_id = bi.id
              WHERE (bi.monthly_price IS NULL OR bi.monthly_price = 0)
                AND bi.require_registration = false
            )
          RETURNING id, name
        `);
        const freeRows = (freeModulRepairRes?.rowCount ?? freeModulRepairRes?.rows?.length ?? 0);
        if (freeRows) {
          const names = (freeModulRepairRes?.rows ?? []).map((r: any) => `${r.id}:${r.name}`).join(", ");
          log(`[FreeModulRepair] cleared require_registration for ${freeRows} agent(s): ${names}`);
        }
      } catch (err) {
        log("[FreeModulRepair] error: " + (err as Error).message);
      }


      // ── SUPERADMIN BACKFILL — promote existing users who match SUPERADMIN_PHONE/EMAILS ──
      // Handles the case where the founder account was created before SUPERADMIN_PHONE was set.
      // Idempotent: only promotes users whose role is not already "superadmin". Never downgrades.
      // Non-fatal: a DB error here must never block startup.
      try {
        const rawPhone = process.env.SUPERADMIN_PHONE || "";
        const rawEmails = process.env.SUPERADMIN_EMAILS || "";

        const normalizePhoneLocal = (p: string): string => {
          let d = p.replace(/[^\d]/g, "");
          if (d.startsWith("0")) d = "62" + d.slice(1);
          else if (d.startsWith("8")) d = "62" + d;
          return d;
        };

        const superPhones = rawPhone.split(",").map((p) => normalizePhoneLocal(p.trim())).filter(Boolean);
        const superEmails = rawEmails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

        if (superPhones.length > 0 || superEmails.length > 0) {
          const { db: rawDb } = await import("./db");
          const { sql: rawSql } = await import("drizzle-orm");

          let promoted = 0;

          // Helper: normalise a DB-stored phone to the same 62xxxxxxxxxx form used
          // by normalizePhoneLocal so we can compare apples-to-apples in SQL.
          // We strip every non-digit, then apply the same 0→62 / 8→62 prefix rules.
          const dbPhoneNormSql = rawSql`
            CASE
              WHEN regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE '0%'
                THEN '62' || substring(regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g'), 2)
              WHEN regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE '8%'
                THEN '62' || regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g')
              ELSE regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g')
            END
          `;

          // Promote by phone — normalise both sides so format mismatches are caught
          for (const phone of superPhones) {
            const res: any = await rawDb.execute(rawSql`
              UPDATE users SET role = 'superadmin', updated_at = NOW()
              WHERE (${dbPhoneNormSql}) = ${phone} AND role != 'superadmin'
              RETURNING id, email, phone
            `);
            const rows: any[] = res?.rows ?? [];
            for (const row of rows) {
              log(`[SuperAdminBackfill] Promoted user ${row.id} (${row.email}, phone stored as "${row.phone}") → superadmin (phone match)`);
              promoted++;
            }
          }

          // Promote by email
          for (const email of superEmails) {
            const res: any = await rawDb.execute(rawSql`
              UPDATE users SET role = 'superadmin', updated_at = NOW()
              WHERE LOWER(email) = ${email} AND role != 'superadmin'
              RETURNING id, email
            `);
            const rows: any[] = res?.rows ?? [];
            for (const row of rows) {
              log(`[SuperAdminBackfill] Promoted user ${row.id} (${row.email}) → superadmin (email match)`);
              promoted++;
            }
          }

          if (promoted === 0) {
            log("[SuperAdminBackfill] All matching users already have superadmin role — no changes needed");

            // Sanity-check: if SUPERADMIN_PHONE is configured but no superadmin
            // exists whose normalised phone matches, the env var might be stored in
            // a format that still doesn't match (e.g. country-code prefix other than
            // 0/8/62). Emit a clear WARNING so the operator knows to investigate.
            if (superPhones.length > 0) {
              // Check each phone individually — avoids passing a JS array to rawSql
              // which drizzle serializes as a plain string, not a PG array literal.
              let matchingAdmins = 0;
              for (const sp of superPhones) {
                const checkRes: any = await rawDb.execute(rawSql`
                  SELECT COUNT(*)::int AS cnt
                  FROM users
                  WHERE role = 'superadmin'
                    AND (${dbPhoneNormSql}) = ${sp}
                `);
                matchingAdmins += checkRes?.rows?.[0]?.cnt ?? 0;
              }
              if (matchingAdmins === 0) {
                log(`[SuperAdminBackfill] WARNING: SUPERADMIN_PHONE is set (${superPhones.join(", ")}) but NO superadmin row found with a matching normalised phone. The account may have been registered with a different phone format. Check the 'phone' column in the users table.`);
              }
            }
          }
        }
      } catch (err) {
        log("[SuperAdminBackfill] error (non-fatal): " + (err as Error).message);
      }

      // ── MODUL SLUG SEEDING — auto-generate slug untuk semua big_ideas ──
      // Berlaku di dev & prod. Idempoten: hanya update yang belum punya slug.
      try {
        const { db: rawDb } = await import("./db");
        const { sql: rawSql } = await import("drizzle-orm");

        const nameToModulSlug = (name: string): string => {
          return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, " ")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .substring(0, 60)
            .replace(/-$/, "");
        }

        // Cek apakah kolom slug ada (mungkin belum dimigrasikan)
        const colCheck: any = await rawDb.execute(rawSql`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'big_ideas' AND column_name = 'slug'
        `);
        if ((colCheck?.rows?.length ?? 0) === 0) {
          log("[ModulSlugSeeding] kolom slug belum ada, skip");
        } else {
          const unsluggedRes: any = await rawDb.execute(rawSql`
            SELECT id, name FROM big_ideas WHERE slug IS NULL OR slug = '' ORDER BY id
          `);
          const unslugged: { id: number; name: string }[] = unsluggedRes?.rows ?? [];
          const existingRes: any = await rawDb.execute(rawSql`
            SELECT slug FROM big_ideas WHERE slug IS NOT NULL AND slug != ''
          `);
          const usedSlugs = new Set<string>((existingRes?.rows ?? []).map((r: any) => r.slug));
          let modulSlugCount = 0;
          for (const modul of unslugged) {
            let slug = nameToModulSlug(modul.name);
            if (!slug) slug = `modul-${modul.id}`;
            if (usedSlugs.has(slug)) slug = `${slug}-${modul.id}`;
            usedSlugs.add(slug);
            await rawDb.execute(rawSql`UPDATE big_ideas SET slug = ${slug} WHERE id = ${modul.id}`);
            modulSlugCount++;
          }
          if (modulSlugCount) log(`[ModulSlugSeeding] auto-generated slugs for ${modulSlugCount} modul(s)`);
        }
      } catch (err) {
        log("[ModulSlugSeeding] error: " + (err as Error).message);
      }

      // ── AGENT SLUG SEEDING — auto-generate slug untuk semua agents ──
      try {
        const { db: rawDb } = await import("./db");
        const { sql: rawSql } = await import("drizzle-orm");

        const nameToAgentSlug = (name: string): string => {
          return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, " ")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .substring(0, 80)
            .replace(/-$/, "");
        }

        const colCheck: any = await rawDb.execute(rawSql`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'agents' AND column_name = 'slug'
        `);
        if ((colCheck?.rows?.length ?? 0) === 0) {
          log("[AgentSlugSeeding] kolom slug belum ada, skip");
        } else {
          const unsluggedRes: any = await rawDb.execute(rawSql`
            SELECT id, name FROM agents WHERE slug IS NULL OR slug = '' ORDER BY id
          `);
          const unslugged: { id: number; name: string }[] = unsluggedRes?.rows ?? [];
          const existingRes: any = await rawDb.execute(rawSql`
            SELECT slug FROM agents WHERE slug IS NOT NULL AND slug != ''
          `);
          const usedSlugs = new Set<string>((existingRes?.rows ?? []).map((r: any) => r.slug));
          let agentSlugCount = 0;
          for (const agent of unslugged) {
            let slug = nameToAgentSlug(agent.name);
            if (!slug) slug = `agent-${agent.id}`;
            if (usedSlugs.has(slug)) slug = `${slug}-${agent.id}`;
            usedSlugs.add(slug);
            await rawDb.execute(rawSql`UPDATE agents SET slug = ${slug} WHERE id = ${agent.id}`);
            agentSlugCount++;
          }
          if (agentSlugCount) log(`[AgentSlugSeeding] auto-generated slugs for ${agentSlugCount} agent(s)`);
        }
      } catch (err) {
        log("[AgentSlugSeeding] error: " + (err as Error).message);
      }

      // ── TRC ORCHESTRATOR v3.0 PATCH — upgrade Agent 24 ke synthesis orchestrator ──
      // Seed melewati agent 24 karena ada FEDERATION_MODE v2 marker. Patch ini
      // mendeteksi marker versi baru (TRC_ORCHESTRATOR_v3.0) dan hanya update
      // jika belum diupgrade — idempoten, aman dijalankan tiap boot.
      try {
        const { db: rawDb } = await import("./db");
        const { sql: rawSql } = await import("drizzle-orm");
        const trcCheck: any = await rawDb.execute(rawSql`
          SELECT id FROM agents WHERE id = 24 AND system_prompt NOT LIKE '%TRC_ORCHESTRATOR_v3.0%'
        `);
        const needsUpgrade = (trcCheck?.rowCount ?? trcCheck?.rows?.length ?? 0) > 0;
        if (needsUpgrade) {
          const trcPrompt = `IDENTITAS
Anda adalah Tender Readiness Checker (TRC) — SYNTHESIS ORCHESTRATOR yang mengevaluasi kesiapan BUJK untuk tender secara terpadu. Saat user mengirim data tender, sistem otomatis memanggil dua spesialis paralel:
  • TDCG — Tender Document Checklist Generator (agen 25) — daftar dokumen administrasi, teknis, kualifikasi
  • TRSE — Tender Risk Scoring Engine (agen 26) — matriks risiko 6 kategori + mitigasi

TRC mensintesis hasil TDCG + TRSE menjadi satu laporan readiness terpadu.

═══ ATURAN TRIGGER — WAJIB DIPATUHI ═══
JIKA user memberikan SALAH SATU dari: HPS/nilai paket, jenis pekerjaan, kode SBU, nama proyek, atau lokasi tender →
LANGSUNG eksekusi analisis lengkap. JANGAN tanya dulu.

SALAH (dilarang keras):
"Untuk melengkapi evaluasi, mohon berikan Ringkasan SKK/SBU/Perizinan..."

BENAR (wajib):
Langsung buat skor + tabel + asumsi dari data yang ada.

═══ ALUR EKSEKUSI ═══
1. INIT: Identifikasi data yang tersedia dari pesan user.
2. DISPATCH: Sub-agen TDCG & TRSE dipanggil otomatis oleh sistem (bukan oleh user).
3. AGGREGATE: Gabungkan hasil TDCG + TRSE + analisis TRC sendiri.
4. REFLECT: Pastikan skor 0-100 ada, semua asumsi bertanda [ASUMSI:], sitasi regulasi hadir.
5. DELIVER: Output format di bawah dalam SATU respons terpadu.

Jika user memulai tanpa data apapun → boleh tanya SATU pertanyaan saja:
"Sebutkan nilai HPS, jenis pekerjaan, dan nama BUJK Anda (boleh perkiraan)."
Setelah itu, LANGSUNG score. Tidak ada putaran tanya kedua.

═══ FALLBACK MODE (WAJIB saat data tidak lengkap) ═══
Data yang tidak diberikan user → GUNAKAN ASUMSI INDUSTRI STANDAR.
Format wajib: [ASUMSI: <isi> | basis: <regulasi/heuristik> | verifikasi-ke: <pihak>]
TETAP berikan skor & analisis lengkap. JANGAN tolak menganalisis.

═══ LARANGAN KERAS ═══
❌ JANGAN bertanya lebih dari 1 putaran klarifikasi.
❌ JANGAN minta user "ambil ringkasan dari modul lain" atau "buka chatbot lain".
❌ JANGAN gunakan nama variabel seperti SKK_SUMMARY, SBU_SUMMARY, LICENSING_SUMMARY.
❌ JANGAN tolak skoring dengan alasan "data kurang" — gunakan asumsi.
❌ JANGAN buat respons hanya berisi daftar pertanyaan tanpa output substantif.

═══ FORMAT OUTPUT ═══
# 🎯 Tender Readiness — {nama_bujk | "BUJK Anda"}
**Skor Total: XX/100 | Verdict: GO / GO_WITH_CONDITIONS / NO_GO**

## Readiness 5 Kategori
| Kategori | Skor | Status | Catatan |
|---|---|---|---|
| Legalitas (NIB/IUJK/KBLI) | XX | 🟢🟡🔴 | ... |
| SBU/Subklasifikasi | XX | 🟢🟡🔴 | [ASUMSI bila perlu] |
| SKK Personel | XX | 🟢🟡🔴 | [ASUMSI bila perlu] |
| Finansial (KD/KP/Modal) | XX | 🟢🟡🔴 | [ASUMSI bila perlu] |
| K3-Mutu (SMK3/ISO) | XX | 🟢🟡🔴 | [ASUMSI bila perlu] |

## Dokumen Kritis (dari TDCG)
- ✅/❌/⚠️ [nama dokumen] — [status/catatan]

## Top Risiko (dari TRSE)
1. [risiko] — [mitigasi cepat]
2. ...

## Asumsi yang Perlu Diverifikasi
- [ASUMSI: ... | basis: ... | verifikasi-ke: ...]

## Rekomendasi Aksi 7 Hari
1. ...

---
*Disclaimer: Verifikasi resmi ke OSS, LPJK, LSBU, SIKI-LPJK.*
*Sitasi: Permen PUPR 6/2021, PP 22/2020, Perpres 12/2021.*

TRC_ORCHESTRATOR_v3.0 | FEDERATION_MODE v2`;
          const trcSubAgents = JSON.stringify([
            {"role": "TDCG", "agentId": 25, "description": "Generate checklist dokumen administrasi, teknis, dan kualifikasi tender berdasarkan jenis pekerjaan dan sumber dana"},
            {"role": "TRSE", "agentId": 26, "description": "Skor risiko kepatuhan 6 kategori tender: matriks 5x5, top 5 risiko prioritas + rekomendasi mitigasi"}
          ]);
          const trcGreeting = `Halo! Saya **Tender Readiness Checker** — evaluator kesiapan tender terpadu.

⚡ **Cukup beritahu saya:**
- Nilai HPS / perkiraan nilai paket
- Jenis pekerjaan (konstruksi gedung, jalan, mekanikal, dll.)
- Nama atau profil singkat BUJK Anda (boleh perkiraan)

Saya akan langsung menganalisis kesiapan tender Anda — mencakup skor readiness, checklist dokumen kritis, matriks risiko, dan rekomendasi aksi — dalam **satu respons terpadu**.

Data yang belum tersedia akan saya estimasi dengan standar industri dan ditandai \`[ASUMSI:]\` agar Anda tahu mana yang perlu diverifikasi.

📝 Contoh: *"Tender kami nilai HPS 2M, pekerjaan gedung kantor, BUJK kami kualifikasi Menengah SBU BG009"*`;
          await rawDb.execute(rawSql`
            UPDATE agents
            SET system_prompt = ${trcPrompt},
                agentic_sub_agents = ${trcSubAgents}::jsonb,
                greeting_message = ${trcGreeting}
            WHERE id = 24
          `);
          log("[TRCPatch] Agent 24 upgraded to TRC_ORCHESTRATOR_v3.0 with agenticSubAgents + new greeting");
        } else {
          // System prompt already upgraded — check if greeting still has the old copy-paste instructions
          const greetingCheck: any = await rawDb.execute(rawSql`
            SELECT id FROM agents WHERE id = 24 AND greeting_message LIKE '%SKK_SUMMARY%'
          `);
          if ((greetingCheck?.rowCount ?? greetingCheck?.rows?.length ?? 0) > 0) {
            const trcGreeting = `Halo! Saya **Tender Readiness Checker** — evaluator kesiapan tender terpadu.

⚡ **Cukup beritahu saya:**
- Nilai HPS / perkiraan nilai paket
- Jenis pekerjaan (konstruksi gedung, jalan, mekanikal, dll.)
- Nama atau profil singkat BUJK Anda (boleh perkiraan)

Saya akan langsung menganalisis kesiapan tender Anda — mencakup skor readiness, checklist dokumen kritis, matriks risiko, dan rekomendasi aksi — dalam **satu respons terpadu**.

Data yang belum tersedia akan saya estimasi dengan standar industri dan ditandai \`[ASUMSI:]\` agar Anda tahu mana yang perlu diverifikasi.

📝 Contoh: *"Tender kami nilai HPS 2M, pekerjaan gedung kantor, BUJK kami kualifikasi Menengah SBU BG009"*`;
            await rawDb.execute(rawSql`
              UPDATE agents SET greeting_message = ${trcGreeting} WHERE id = 24
            `);
            log("[TRCPatch] Agent 24 greeting updated to new agentic version");
          }
        }
      } catch (err) {
        log("[TRCPatch] error: " + (err as Error).message);
      }

      // ── SEED BLOCK: berlaku di DEV & PROD ──
      // Sebelumnya di-gate hanya non-production → menyebabkan production tertinggal
      // (mis. 5 chatbot ekstra Lisensi LSP tidak ikut). Semua seed sudah idempotent
      // (cek existence per BigIdea/toolbox, lalu skip), jadi aman dijalankan di prod.
      // Yang clear-and-reseed (IMS, Personel Manajerial, Tender, Pasca Tender, Pelaksanaan,
      // Legalitas) hanya menyentuh data seri-nya sendiri — tidak menghapus chatbot user.
      {
        try {
          const { gustaftaKnowledgeBaseAgent, dokumentenderAgent } = M_knowledgeBase;
          const existingAgents = await storage.getAgents();
          
          const helpdeskExists = existingAgents.some(
            (agent: any) => agent.name === "Gustafta Helpdesk" || agent.name === "Gustafta Assistant"
          );
          if (!helpdeskExists) {
            await storage.createAgent(gustaftaKnowledgeBaseAgent as any);
            log("Gustafta Helpdesk chatbot auto-seeded successfully");
          } else {
            const helpdesk = existingAgents.find(
              (agent: any) => agent.name === "Gustafta Helpdesk" || agent.name === "Gustafta Assistant"
            );
            if (helpdesk) {
              await storage.updateAgent(helpdesk.id, {
                systemPrompt: gustaftaKnowledgeBaseAgent.systemPrompt,
                greetingMessage: gustaftaKnowledgeBaseAgent.greetingMessage,
                conversationStarters: gustaftaKnowledgeBaseAgent.conversationStarters,
                personality: gustaftaKnowledgeBaseAgent.personality,
                tagline: gustaftaKnowledgeBaseAgent.tagline,
                description: gustaftaKnowledgeBaseAgent.description,
              } as any);
              log("Gustafta Helpdesk chatbot updated with latest configuration");
            }
          }

          const dokExists = existingAgents.some(
            (agent: any) => agent.name === "Dokumentender Assistant"
          );
          if (!dokExists) {
            await storage.createAgent(dokumentenderAgent as any);
            log("Dokumentender Assistant chatbot auto-seeded successfully");
          } else {
            const dok = existingAgents.find(
              (agent: any) => agent.name === "Dokumentender Assistant"
            );
            if (dok) {
              await storage.updateAgent(dok.id, {
                systemPrompt: dokumentenderAgent.systemPrompt,
                greetingMessage: dokumentenderAgent.greetingMessage,
                conversationStarters: dokumentenderAgent.conversationStarters,
                personality: dokumentenderAgent.personality,
                tagline: dokumentenderAgent.tagline,
                description: dokumentenderAgent.description,
              } as any);
              log("Dokumentender Assistant chatbot updated with latest configuration");
            }
          }
        } catch (err) {
          log("Failed to auto-seed knowledge base agents: " + (err as Error).message);
        }

        const seedTasks = [
          { name: "Regulasi Jasa Konstruksi", module: "./seed-regulasi", fn: "seedRegulasiJasaKonstruksi" },
          { name: "Asesor Sertifikasi", module: "./seed-asesor", fn: "seedAsesorSertifikasi" },
          { name: "Asesor LSP Extra — Etika/CoI, Regulasi, Integrasi, RCC", module: "./seed-asesor-lsp-extra", fn: "seedAsesorLspExtra" },
          { name: "SMAP & PANCEK", module: "./seed-smap-pancek", fn: "seedSmapPancek" },
          { name: "Odoo Jasa Konstruksi", module: "./seed-odoo", fn: "seedOdooKonstruksi" },
          { name: "CSMS OPTIA v2.0", module: "./seed-csms-optia", fn: "seedCsmsOptia" },
          { name: "CIVILPRO", module: "./seed-civilpro", fn: "seedCivilpro" },
          { name: "SIP-PJBU", module: "./seed-sip-pjbu", fn: "seedSipPjbu" },
          { name: "Manajemen LSBU", module: "./seed-manajemen-lsbu", fn: "seedManajemenLsbu" },
          { name: "Manajemen LSP", module: "./seed-manajemen-lsp", fn: "seedManajemenLsp" },
          { name: "Manajemen LSP Extra", module: "./seed-manajemen-lsp-extra", fn: "seedManajemenLspExtra" },
          { name: "SKK Sipil Wave1", module: "./seed-skk-sipil-wave1", fn: "seedSkkSipilWave1" },
          { name: "SKK Sipil Wave2", module: "./seed-skk-sipil-wave2", fn: "seedSkkSipilWave2" },
          { name: "SKK Sipil Wave2A", module: "./seed-skk-sipil-wave2a", fn: "seedSkkSipilWave2A" },
          { name: "SKK Sipil Wave2B", module: "./seed-skk-sipil-wave2b", fn: "seedSkkSipilWave2B" },
          { name: "SKK Sipil Wave2C", module: "./seed-skk-sipil-wave2c", fn: "seedSkkSipilWave2C" },
          { name: "ISO 14001", module: "./seed-iso14001", fn: "seedIso14001" },
          { name: "ISO 9001", module: "./seed-iso9001", fn: "seedIso9001" },
          { name: "Siap Uji Kompetensi", module: "./seed-siap-ukom", fn: "seedSiapUkom" },
          { name: "Kompetensi Teknis", module: "./seed-kompetensi-teknis", fn: "seedKompetensiTeknis" },
          { name: "Pembinaan ASPEKINDO", module: "./seed-aspekindo", fn: "seedAspekindo" },
          { name: "SKK AJJ — Asesmen Jarak Jauh", module: "./seed-skk-ajj", fn: "seedSkkAjj" },
          { name: "AJJ Nirkertas — Tata Kelola LSP & BNSP", module: "./seed-ajj-nirkertas", fn: "seedAjjNirkertas" },
          { name: "AJJ Nirkertas Extra — Bidang Kompetensi & Skema", module: "./seed-ajj-nirkertas-extra", fn: "seedAjjNirkertasExtra" },
          { name: "SKK Hard Copy — Uji Kompetensi Tatap Muka", module: "./seed-skk-hardcopy", fn: "seedSkkHardcopy" },
          { name: "SKK Hard Copy Extra — Bidang Kompetensi & Skema Tatap Muka", module: "./seed-skk-hardcopy-extra", fn: "seedSkkHardcopyExtra" },
          { name: "ASKOM Konstruksi — Asesor Kompetensi Jasa Konstruksi", module: "./seed-askom-konstruksi", fn: "seedAskomKonstruksi" },
          { name: "ASKOM Konstruksi Extra — BA-UKK, Portofolio, RPL, MUK, Moda Uji, Pelatihan", module: "./seed-askom-konstruksi-extra", fn: "seedAskomKonstruksiExtra" },
          { name: "Lisensi LSP Konstruksi — LPJK & BNSP", module: "./seed-lisensi-lsp", fn: "seedLisensiLsp" },
          { name: "Lisensi LSP Extra — Lisensi Baru, Surveilans, Perpanjangan, Perubahan, Sanksi", module: "./seed-lisensi-lsp-extra", fn: "seedLisensiLspExtra" },
          { name: "Konsultan Lisensi LSP — Toolkit Pendamping LPJK & BNSP", module: "./seed-konsultan-lisensi-lsp", fn: "seedKonsultanLisensiLsp" },
          { name: "Akreditasi LSP oleh KAN — SNI ISO/IEC 17024 + KAN K-09", module: "./seed-akreditasi-kan", fn: "seedAkreditasiKan" },
          { name: "Akreditasi KAN Extra — Asesmen Awal, Surveilans, Re-Akreditasi, Extension Scope, Banding & Sanksi", module: "./seed-akreditasi-kan-extra", fn: "seedAkreditasiKanExtra" },
          { name: "Chatbot SMAP — Sistem Manajemen Anti Penyuapan (SNI ISO 37001:2016)", module: "./seed-smap-iso37001", fn: "seedSmapIso37001" },
          { name: "Chatbot SMAP Nasional & Generator PanCEK KPK (Ver.2 — JAGA.id)", module: "./seed-pancek-kpk", fn: "seedPancekKpk" },
          { name: "Odoo ERP BUJK — Implementasi & Operasional Konstruksi Indonesia", module: "./seed-odoo-bujk", fn: "seedOdooBujk" },
          { name: "Odoo Migrasi Data Legacy → BUJK — Cutover & Go-Live Konstruksi", module: "./seed-odoo-migrasi", fn: "seedOdooMigrasi" },
          { name: "Kompetensi Manajerial BUJK — ASPEKINDO", module: "./seed-kompetensi-manajerial-bujk", fn: "seedKompetensiManajerialBujk" },
          { name: "IMS & SMK3 Terintegrasi", module: "./seed-ims-smk3-terintegrasi", fn: "seedImsSmk3Terintegrasi" },
          { name: "Personel Manajerial BUJK", module: "./seed-personel-manajerial-bujk", fn: "seedPersonelManajerialBujk" },
          { name: "Tender Konstruksi & PBJP", module: "./seed-tender-konstruksi-pbjp", fn: "seedTenderKonstruksiPbjp" },
          { name: "Pasca Tender & Manajemen Kontrak", module: "./seed-pasca-tender-manajemen-kontrak", fn: "seedPascaTenderManajemenKontrak" },
          { name: "Pelaksanaan Proyek Lapangan", module: "./seed-pelaksanaan-proyek-lapangan", fn: "seedPelaksanaanProyekLapangan" },
          { name: "Legalitas Jasa Konstruksi", module: "./seed-legalitas-jasa-konstruksi", fn: "seedLegalitasJasaKonstruksi" },
          { name: "Regulasi Jasa Konstruksi Indonesia", module: "./seed-regulasi-jasa-konstruksi", fn: "seedRegulasiJasaKonstruksi" },
          { name: "SBU Coach Pekerjaan Konstruksi & Konsultan", module: "./seed-sbu-coach", fn: "seedSbuCoach" },
          { name: "SBU Coach All-in-One — Klasifikasi Terintegrasi", module: "./seed-sbu-master", fn: "seedSbuMaster" },
          { name: "SBU Coach — Pekerjaan Konstruksi Terintegrasi (GT & ST)", module: "./seed-sbu-terintegrasi", fn: "seedSbuTerintegrasi" },
          { name: "SKK Coach — Manajemen Pelaksanaan", module: "./seed-skk-manajemen-pelaksanaan", fn: "seedSkkManajemenPelaksanaan" },
          { name: "SKK Coach — Mekanikal", module: "./seed-skk-mekanikal", fn: "seedSkkMekanikal" },
          { name: "SKK Coach — Sipil", module: "./seed-skk-sipil", fn: "seedSkkSipil" },
          { name: "SKK Coach — Elektrikal", module: "./seed-skk-elektrikal", fn: "seedSkkElektrikal" },
          { name: "SKK Coach — Arsitektur", module: "./seed-skk-arsitektur", fn: "seedSkkArsitektur" },
          { name: "SKK Coach — Tata Lingkungan", module: "./seed-skk-tata-lingkungan", fn: "seedSkkTataLingkungan" },
          { name: "SKK Coach — K3 Konstruksi", module: "./seed-skk-k3-konstruksi", fn: "seedSkkK3Konstruksi" },
          { name: "SKK Coach — Manajemen Proyek Konstruksi", module: "./seed-skk-manajemen-proyek", fn: "seedSkkManajemenProyek" },
          { name: "SKK Coach — Geoteknik & Geodesi", module: "./seed-skk-geoteknik", fn: "seedSkkGeoteknik" },
          { name: "SKK Coach — Pengujian & QC Konstruksi", module: "./seed-skk-pengujian-qc", fn: "seedSkkPengujianQc" },
          { name: "SKK Coach — Bangunan Gedung & Utilitas", module: "./seed-skk-bangunan-gedung", fn: "seedSkkBangunanGedung" },
          { name: "SKK Coach — Konstruksi Khusus", module: "./seed-skk-konstruksi-khusus", fn: "seedSkkKonstruksiKhusus" },
          { name: "SKK Coach — Peralatan Konstruksi & Logistik", module: "./seed-skk-peralatan-logistik", fn: "seedSkkPeralatanLogistik" },
          { name: "SBU Coach — Jasa Penunjang Tenaga Listrik", module: "./seed-sbu-penunjang-listrik", fn: "seedSbuPenunjangListrik" },
          { name: "SKTK Coach — Tenaga Teknik Ketenagalistrikan", module: "./seed-sktk-tenaga-listrik", fn: "seedSktkTenagaListrik" },
          { name: "SBU Kompetensi — Migas, EBT, dan Pertambangan", module: "./seed-sbu-kompetensi-migas-ebt-tambang", fn: "seedSbuKompetensiMigasEbtTambang" },
          { name: "DevProperti Pro — Developer Real Estate", module: "./seed-developer-real-estate", fn: "seedDeveloperRealEstate" },
          { name: "EstateCare Pro — Layanan Real Estate", module: "./seed-layanan-real-estate", fn: "seedLayananRealEstate" },
          { name: "IT LSP — Paperless (Nir Kertas) & AJJ", module: "./seed-it-lsp-paperless-ajj", fn: "seedItLspPaperlessAjj" },
          { name: "IT LSP Extra — Panduan Asesi & Asesor Digital", module: "./seed-it-lsp-paperless-ajj-extra", fn: "seedItLspPaperlessAjjExtra" },
        ];

        for (const seed of seedTasks) {
          try {
            const mod = seedModuleRegistry[seed.module];
            if (!mod) throw new Error(`Module ${seed.module} not registered in seedModuleRegistry`);
            await mod[seed.fn]("49465846");
          } catch (err) {
            log(`Failed to seed ${seed.name} ecosystem: ` + (err as Error).message);
          }
        }

        try {
          const { fixOrphanedOrchestrators } = M_fixOrchestrators;
          await fixOrphanedOrchestrators();
        } catch (err) {
          log("Failed to fix orphaned orchestrators: " + (err as Error).message);
        }
      }

      // ── DEDUP: catch-up Apr 2026 dihapus karena DUPLIKAT seedTasks utama ──
      // Akar masalah lama: blok catch-up unconditional menjalankan seed yang sama
      // dua kali per restart → kadang menghapus BigIdea yang baru saja dibuat.
      // Sejak iter 9, semua seed Apr 2026 sudah di seedTasks (loop di atas) dan
      // memiliki idempotency (skip jika sudah grounded). Catch-up unconditional
      // dihapus. Hanya yang BENAR-BENAR belum ada di seedTasks yang ditahan.

      // Catch-up: Pusat FAQ Peserta (TIDAK ada di seedTasks — TAHAN)
      try {
        const { seedPusatFaqPeserta } = M_pusatFaqPeserta;
        await seedPusatFaqPeserta("49465846");
      } catch (err) {
        log("Catch-up Pusat FAQ seed error: " + (err as Error).message);
      }

      // Catch-up: Kompetensi Manajerial BUJK (added Apr 2026)
      try {
        const { seedKompetensiManajerialBujk } = M_kompetensiManajerialBujk;
        const allSeries = await storage.getSeries();
        const kmSeries = allSeries.find((s: any) => s.slug === "kompetensi-manajerial-bujk");
        if (!kmSeries) {
          log("[CatchUp] Seeding Kompetensi Manajerial BUJK (missing)");
          await seedKompetensiManajerialBujk("49465846");
        }
      } catch (err) {
        log("Catch-up Kompetensi Manajerial seed error: " + (err as Error).message);
      }

      // Patch: Kompetensi Manajerial BUJK — tambah SIKaP, Analisis Keuangan, Compliance Tender
      try {
        const { patchKompetensiManajerialBujk } = M_kompetensiManajerialPatch;
        await patchKompetensiManajerialBujk("49465846");
      } catch (err) {
        log("Patch Kompetensi Manajerial error: " + (err as Error).message);
      }

      // Catch-up: IMS & SMK3 Terintegrasi (added Apr 2026)
      try {
        const { seedImsSmk3Terintegrasi } = M_imsSmk3Terintegrasi;
        const allSeries = await storage.getSeries();
        const imsSeries = allSeries.find((s: any) => s.slug === "ims-smk3-terintegrasi");
        if (!imsSeries) {
          log("[CatchUp] Seeding IMS & SMK3 Terintegrasi (missing)");
          await seedImsSmk3Terintegrasi("49465846");
        }
      } catch (err) {
        log("Catch-up IMS & SMK3 seed error: " + (err as Error).message);
      }

      // Catch-up: Personel Manajerial BUJK (added Apr 2026)
      try {
        const { seedPersonelManajerialBujk } = M_personelManajerialBujk;
        const allSeries = await storage.getSeries();
        const pmSeries = allSeries.find((s: any) => s.slug === "personel-manajerial-bujk");
        if (!pmSeries) {
          log("[CatchUp] Seeding Personel Manajerial BUJK (missing)");
          await seedPersonelManajerialBujk("49465846");
        }
      } catch (err) {
        log("Catch-up Personel Manajerial BUJK seed error: " + (err as Error).message);
      }

      // Catch-up: Tender Konstruksi & PBJP (added Apr 2026)
      try {
        const { seedTenderKonstruksiPbjp } = M_tenderKonstruksiPbjp;
        const allSeries = await storage.getSeries();
        const tenderSeries = allSeries.find((s: any) => s.slug === "tender-konstruksi-pbjp");
        if (!tenderSeries) {
          log("[CatchUp] Seeding Tender Konstruksi & PBJP (missing)");
          await seedTenderKonstruksiPbjp("49465846");
        }
      } catch (err) {
        log("Catch-up Tender Konstruksi & PBJP seed error: " + (err as Error).message);
      }

      // Catch-up: Pasca Tender & Manajemen Kontrak (added Apr 2026)
      try {
        const { seedPascaTenderManajemenKontrak } = M_pascaTenderManajemenKontrak;
        const allSeries = await storage.getSeries();
        const pascaSeries = allSeries.find((s: any) => s.slug === "pasca-tender-manajemen-kontrak");
        if (!pascaSeries) {
          log("[CatchUp] Seeding Pasca Tender & Manajemen Kontrak (missing)");
          await seedPascaTenderManajemenKontrak("49465846");
        }
      } catch (err) {
        log("Catch-up Pasca Tender & Manajemen Kontrak seed error: " + (err as Error).message);
      }

      // Catch-up: Pelaksanaan Proyek Lapangan (added Apr 2026)
      try {
        const { seedPelaksanaanProyekLapangan } = M_pelaksanaanProyekLapangan;
        const allSeries = await storage.getSeries();
        const pelaksanaanSeries = allSeries.find((s: any) => s.slug === "pelaksanaan-proyek-lapangan");
        if (!pelaksanaanSeries) {
          log("[CatchUp] Seeding Pelaksanaan Proyek Lapangan (missing)");
          await seedPelaksanaanProyekLapangan("49465846");
        }
      } catch (err) {
        log("Catch-up Pelaksanaan Proyek Lapangan seed error: " + (err as Error).message);
      }

      // Catch-up: Legalitas Jasa Konstruksi (added Apr 2026)
      try {
        const { seedLegalitasJasaKonstruksi } = M_legalitasJasaKonstruksi;
        const allSeries = await storage.getSeries();
        const legalSeries = allSeries.find((s: any) => s.slug === "legalitas-jasa-konstruksi");
        if (!legalSeries) {
          log("[CatchUp] Seeding Legalitas Jasa Konstruksi (missing)");
          await seedLegalitasJasaKonstruksi("49465846");
        }
      } catch (err) {
        log("Catch-up Legalitas Jasa Konstruksi seed error: " + (err as Error).message);
      }

      // Catch-up: Ringkasan Regulasi Konstruksi Indonesia 2025 (added Apr 2026)
      try {
        const { seedRegulasiJasaKonstruksi } = M_regulasiJasaKonstruksi;
        const allSeries = await storage.getSeries();
        const regulasiSeries = allSeries.find((s: any) => s.slug === "ringkasan-regulasi-konstruksi-2025");
        if (!regulasiSeries) {
          log("[CatchUp] Seeding Ringkasan Regulasi Konstruksi Indonesia 2025 (missing)");
          await seedRegulasiJasaKonstruksi("49465846");
        }
      } catch (err) {
        log("Catch-up Ringkasan Regulasi Konstruksi seed error: " + (err as Error).message);
      }

      // Catch-up: SBU Coach Pekerjaan Konstruksi & Konsultan (added Apr 2026)
      try {
        const { seedSbuCoach } = M_sbuCoach;
        const allSeries = await storage.getSeries();
        const sbuCoachSeries = allSeries.find((s: any) => s.slug === "sbu-coach-pekerjaan-konstruksi");
        if (!sbuCoachSeries) {
          log("[CatchUp] Seeding SBU Coach Pekerjaan Konstruksi (missing)");
          await seedSbuCoach("49465846");
        }
      } catch (err) {
        log("Catch-up SBU Coach seed error: " + (err as Error).message);
      }

      // Catch-up: SBU Master Coach All-in-One (added Apr 2026)
      try {
        const { seedSbuMaster } = M_sbuMaster;
        const allSeries = await storage.getSeries();
        const sbuMasterSeries = allSeries.find((s: any) => s.slug === "sbu-master-coach");
        if (!sbuMasterSeries) {
          log("[CatchUp] Seeding SBU Master Coach All-in-One (missing)");
          await seedSbuMaster("49465846");
        }
      } catch (err) {
        log("Catch-up SBU Master seed error: " + (err as Error).message);
      }

      // Catch-up: SBU Terintegrasi Coach (added Apr 2026)
      try {
        const { seedSbuTerintegrasi } = M_sbuTerintegrasi;
        const allSeries = await storage.getSeries();
        const sbuTerintSeries = allSeries.find((s: any) => s.slug === "sbu-terintegrasi-coach");
        if (!sbuTerintSeries) {
          log("[CatchUp] Seeding SBU Terintegrasi Coach (missing)");
          await seedSbuTerintegrasi("49465846");
        }
      } catch (err) {
        log("Catch-up SBU Terintegrasi seed error: " + (err as Error).message);
      }

      // Catch-up: SKK Coach Manajemen Pelaksanaan (added Apr 2026)
      try {
        const { seedSkkManajemenPelaksanaan } = M_skkManajemenPelaksanaan;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "skk-manajemen-pelaksanaan");
        if (!s) {
          log("[CatchUp] Seeding SKK Coach Manajemen Pelaksanaan (missing)");
          await seedSkkManajemenPelaksanaan("49465846");
        }
      } catch (err) {
        log("Catch-up SKK Manajemen Pelaksanaan seed error: " + (err as Error).message);
      }

      // Catch-up: SKK Coach Mekanikal (added Apr 2026)
      try {
        const { seedSkkMekanikal } = M_skkMekanikal;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "skk-mekanikal");
        if (!s) {
          log("[CatchUp] Seeding SKK Coach Mekanikal (missing)");
          await seedSkkMekanikal("49465846");
        }
      } catch (err) {
        log("Catch-up SKK Mekanikal seed error: " + (err as Error).message);
      }

      // Catch-up: SKK Coach Sipil (added Apr 2026)
      try {
        const { seedSkkSipil } = M_skkSipil;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "skk-sipil");
        if (!s) {
          log("[CatchUp] Seeding SKK Coach Sipil (missing)");
          await seedSkkSipil("49465846");
        }
      } catch (err) {
        log("Catch-up SKK Sipil seed error: " + (err as Error).message);
      }

      // Catch-up: SKK Coach Elektrikal (added Apr 2026)
      try {
        const { seedSkkElektrikal } = M_skkElektrikal;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "skk-elektrikal");
        if (!s) {
          log("[CatchUp] Seeding SKK Coach Elektrikal (missing)");
          await seedSkkElektrikal("49465846");
        }
      } catch (err) {
        log("Catch-up SKK Elektrikal seed error: " + (err as Error).message);
      }

      // Catch-up: SKK Coach Arsitektur (added Apr 2026)
      try {
        const { seedSkkArsitektur } = M_skkArsitektur;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "skk-arsitektur");
        if (!s) {
          log("[CatchUp] Seeding SKK Coach Arsitektur (missing)");
          await seedSkkArsitektur("49465846");
        }
      } catch (err) {
        log("Catch-up SKK Arsitektur seed error: " + (err as Error).message);
      }

      // Catch-up: SKK Coach Tata Lingkungan (added Apr 2026)
      try {
        const { seedSkkTataLingkungan } = M_skkTataLingkungan;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "skk-tata-lingkungan");
        if (!s) {
          log("[CatchUp] Seeding SKK Coach Tata Lingkungan (missing)");
          await seedSkkTataLingkungan("49465846");
        }
      } catch (err) {
        log("Catch-up SKK Tata Lingkungan seed error: " + (err as Error).message);
      }

      // Catch-up: SKK Coach K3 Konstruksi (added Apr 2026)
      try {
        const { seedSkkK3Konstruksi } = M_skkK3Konstruksi;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "skk-k3-konstruksi");
        if (!s) {
          log("[CatchUp] Seeding SKK Coach K3 Konstruksi (missing)");
          await seedSkkK3Konstruksi("49465846");
        }
      } catch (err) {
        log("Catch-up SKK K3 Konstruksi seed error: " + (err as Error).message);
      }

      // Catch-up: SKK Coach Manajemen Proyek (added Apr 2026)
      try {
        const { seedSkkManajemenProyek } = M_skkManajemenProyek;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "skk-manajemen-proyek");
        if (!s) {
          log("[CatchUp] Seeding SKK Coach Manajemen Proyek (missing)");
          await seedSkkManajemenProyek("49465846");
        }
      } catch (err) {
        log("Catch-up SKK Manajemen Proyek seed error: " + (err as Error).message);
      }

      // Catch-up: SKK Coach Geoteknik & Geodesi (added Apr 2026)
      try {
        const { seedSkkGeoteknik } = M_skkGeoteknik;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "skk-geoteknik");
        if (!s) {
          log("[CatchUp] Seeding SKK Coach Geoteknik & Geodesi (missing)");
          await seedSkkGeoteknik("49465846");
        }
      } catch (err) {
        log("Catch-up SKK Geoteknik seed error: " + (err as Error).message);
      }

      // Catch-up: SKK Coach Pengujian & QC Konstruksi (added Apr 2026)
      try {
        const { seedSkkPengujianQc } = M_skkPengujianQc;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "skk-pengujian-qc");
        if (!s) {
          log("[CatchUp] Seeding SKK Coach Pengujian & QC (missing)");
          await seedSkkPengujianQc("49465846");
        }
      } catch (err) {
        log("Catch-up SKK Pengujian QC seed error: " + (err as Error).message);
      }

      // Catch-up: SKK Coach Bangunan Gedung & Utilitas (added Apr 2026)
      try {
        const { seedSkkBangunanGedung } = M_skkBangunanGedung;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "skk-bangunan-gedung");
        if (!s) {
          log("[CatchUp] Seeding SKK Coach Bangunan Gedung & Utilitas (missing)");
          await seedSkkBangunanGedung("49465846");
        }
      } catch (err) {
        log("Catch-up SKK Bangunan Gedung seed error: " + (err as Error).message);
      }

      // Catch-up: SKK Coach Konstruksi Khusus (added Apr 2026)
      try {
        const { seedSkkKonstruksiKhusus } = M_skkKonstruksiKhusus;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "skk-konstruksi-khusus");
        if (!s) {
          log("[CatchUp] Seeding SKK Coach Konstruksi Khusus (missing)");
          await seedSkkKonstruksiKhusus("49465846");
        }
      } catch (err) {
        log("Catch-up SKK Konstruksi Khusus seed error: " + (err as Error).message);
      }

      // Catch-up: SKK Coach Peralatan Konstruksi & Logistik (added Apr 2026)
      try {
        const { seedSkkPeralatanLogistik } = M_skkPeralatanLogistik;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "skk-peralatan-logistik");
        if (!s) {
          log("[CatchUp] Seeding SKK Coach Peralatan Konstruksi & Logistik (missing)");
          await seedSkkPeralatanLogistik("49465846");
        }
      } catch (err) {
        log("Catch-up SKK Peralatan Logistik seed error: " + (err as Error).message);
      }

      // Catch-up: SBU Penunjang Tenaga Listrik (added Apr 2026)
      try {
        const { seedSbuPenunjangListrik } = M_sbuPenunjangListrik;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "sbu-penunjang-listrik");
        if (!s) {
          log("[CatchUp] Seeding SBU Penunjang Tenaga Listrik (missing)");
          await seedSbuPenunjangListrik("49465846");
        }
      } catch (err) {
        log("Catch-up SBU Penunjang Listrik seed error: " + (err as Error).message);
      }

      // Catch-up: SKTK Tenaga Teknik Ketenagalistrikan (added Apr 2026)
      try {
        const { seedSktkTenagaListrik } = M_sktkTenagaListrik;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "sktk-tenaga-listrik");
        if (!s) {
          log("[CatchUp] Seeding SKTK Tenaga Teknik Ketenagalistrikan (missing)");
          await seedSktkTenagaListrik("49465846");
        }
      } catch (err) {
        log("Catch-up SKTK Tenaga Listrik seed error: " + (err as Error).message);
      }

      // Catch-up: SBU Kompetensi Migas, EBT, dan Pertambangan (added Apr 2026)
      try {
        const { seedSbuKompetensiMigasEbtTambang } = M_sbuKompetensiMigasEbtTambang;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "sbu-kompetensi-migas-ebt-tambang");
        if (!s) {
          log("[CatchUp] Seeding SBU Kompetensi Migas, EBT & Pertambangan (missing)");
          await seedSbuKompetensiMigasEbtTambang("49465846");
        }
      } catch (err) {
        log("Catch-up SBU Kompetensi Migas seed error: " + (err as Error).message);
      }

      // Catch-up: DevProperti Pro — Developer Real Estate (added Apr 2026)
      try {
        const { seedDeveloperRealEstate } = M_developerRealEstate;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "developer-real-estate");
        if (!s) {
          log("[CatchUp] Seeding DevProperti Pro — Developer Real Estate (missing)");
          await seedDeveloperRealEstate("49465846");
        }
      } catch (err) {
        log("Catch-up DevProperti Pro seed error: " + (err as Error).message);
      }

      // Catch-up: EstateCare Pro — Layanan Real Estate (added Apr 2026)
      try {
        const { seedLayananRealEstate } = M_layananRealEstate;
        const allSeries = await storage.getSeries();
        const s = allSeries.find((x: any) => x.slug === "layanan-real-estate");
        if (!s) {
          log("[CatchUp] Seeding EstateCare Pro — Layanan Real Estate (missing)");
          await seedLayananRealEstate("49465846");
        }
      } catch (err) {
        log("Catch-up EstateCare Pro seed error: " + (err as Error).message);
      }

      try {
        const { seedLegalCases } = await import("./seed-legal-cases");
        await seedLegalCases();
      } catch (err) {
        log("Legal cases seed error: " + (err as Error).message);
      }

      // Catch-up: LexCom — AI Hukum Indonesia (additive patch — always runs)
      try {
        const { seedLexCom } = await import("./seed-lexcom");
        const { created, skipped } = await seedLexCom("49465846");
        if (!skipped) log(`[CatchUp] LexCom patch selesai — ${created} item baru`);
      } catch (err) {
        log("Catch-up LexCom seed error: " + (err as Error).message);
      }

      // Catch-up: LexSkripsi — Chatbot Skripsi Hukum (Multi-Agent)
      try {
        const { seedLexSkripsi } = await import("./seed-lexskripsi");
        const { created, skipped } = await seedLexSkripsi("49465846");
        if (!skipped) log(`[CatchUp] LexSkripsi selesai — ${created} item baru`);
        else log("[Seed LexSkripsi] Series sudah ada dan lengkap, skip.");
      } catch (err) {
        log("Catch-up LexSkripsi seed error: " + (err as Error).message);
      }

      // Patch: LexSkripsi — tambah AGENT-SIDANG + KB Draft Graciella
      try {
        const { patchLexSkripsiSidang } = await import("./patch-lexskripsi-sidang");
        const { created, skipped } = await patchLexSkripsiSidang();
        if (!skipped) log(`[Patch LexSkripsi Sidang] AGENT-SIDANG selesai — ${created} item baru`);
      } catch (err) {
        log("Patch LexSkripsi Sidang error: " + (err as Error).message);
      }

      // Patch: LexSkripsi — fix agenticSubAgents orchestrator (pastikan 4 sub-agen)
      try {
        const { patchLexSkripsiFixSubAgents } = await import("./patch-lexskripsi-fixsubagets");
        const { fixed } = await patchLexSkripsiFixSubAgents();
        if (fixed) log("[Patch LexSkripsi SubAgents] agenticSubAgents 4 sub-agen verified/fixed");
      } catch (err) {
        log("Patch LexSkripsi SubAgents Fix error: " + (err as Error).message);
      }

      // Patch: LexSkripsi — update KB final semua 4 sub-agen (Bab I-V Graciella)
      try {
        const { patchLexSkripsiKbFinal } = await import("./patch-lexskripsi-kb-final");
        const { added, skipped } = await patchLexSkripsiKbFinal();
        if (!skipped) log(`[Patch LexSkripsi KB Final] ${added} KB entries ditambahkan`);
      } catch (err) {
        log("Patch LexSkripsi KB Final error: " + (err as Error).message);
      }

      // Patch: LexSkripsi — upgrade semua 5 agent ke persona Dosen Pembimbing Skripsi v2.0
      try {
        const { patchLexSkripsiPromptV2 } = await import("./patch-lexskripsi-prompt-v2");
        const { updated, skipped } = await patchLexSkripsiPromptV2();
        if (!skipped) log(`[Patch LexSkripsi Prompt v2] ${updated}/5 agent diupgrade ke Dosen Pembimbing v2.0`);
      } catch (err) {
        log("Patch LexSkripsi Prompt v2 error: " + (err as Error).message);
      }

      // Patch: LexSkripsi — Onboarding 3 Ruang + Tone Sparring Partner v3.0
      try {
        const { patchLexSkripsiOnboardingV3 } = await import("./patch-lexskripsi-onboarding-v3");
        const { updated, skipped } = await patchLexSkripsiOnboardingV3();
        if (!skipped) log(`[Patch LexSkripsi Onboarding v3] ${updated}/5 agent diupgrade ke Sparring Partner v3.0`);
      } catch (err) {
        log("Patch LexSkripsi Onboarding v3 error: " + (err as Error).message);
      }

      // Patch: LexSkripsi — Persona v4: Pakar berpengalaman + prolific writer + sparring
      try {
        const { patchLexSkripsiPersonaV4 } = await import("./patch-lexskripsi-persona-v4");
        const { updated, skipped } = await patchLexSkripsiPersonaV4();
        if (!skipped) log(`[Patch LexSkripsi Persona v4] ${updated}/5 agent diupgrade ke Pakar + Sparring`);
      } catch (err) {
        log("Patch LexSkripsi Persona v4 error: " + (err as Error).message);
      }

      // Patch: LexSkripsi Complete v5 — isi field kosong + KB tambahan komprehensif
      try {
        const { patchLexSkripsiCompleteV5 } = await import("./patch-lexskripsi-complete-v5");
        const { done, skipped } = await patchLexSkripsiCompleteV5();
        if (!skipped) log(`[Patch LexSkripsi Complete v5] Selesai — field lengkap + KB tambahan`);
      } catch (err) {
        log("Patch LexSkripsi Complete v5 error: " + (err as Error).message);
      }

      // Patch: LexSkripsi AGENT-NOTION — sub-agent Notion workspace manager
      try {
        const { patchLexSkripsiNotionAgent } = await import("./patch-lexskripsi-notion-agent");
        const { done, skipped } = await patchLexSkripsiNotionAgent();
        if (!skipped) log(`[Patch AGENT-NOTION] Selesai — AGENT-NOTION aktif sebagai sub-agent ke-5`);
      } catch (err) {
        log("Patch AGENT-NOTION error: " + (err as Error).message);
      }

      // Patch: LexSkripsi NOTION-ORCH-FIX — tambah AGENT-NOTION ke agenticSubAgents orchestrator
      try {
        const { patchLexSkripsiNotionOrchFix } = await import("./patch-lexskripsi-notion-orchestrator-fix");
        const { done, skipped } = await patchLexSkripsiNotionOrchFix();
        if (!skipped) log(`[Patch NOTION-ORCH-FIX] AGENT-NOTION berhasil masuk ke orchestrator`);
      } catch (err) {
        log("Patch NOTION-ORCH-FIX error: " + (err as Error).message);
      }

      // Patch: LexSkripsi Level 4 — SYNTHESIS ORCHESTRATOR + FALLBACK + HANDOVER + STATE_MACHINE 7-langkah
      try {
        const { patchLexSkripsiLevel4 } = await import("./patch-lexskripsi-level4-upgrade");
        const { done, skipped } = await patchLexSkripsiLevel4();
        if (!skipped) log(`[Patch LexSkripsi Level 4] SYNTHESIS ORCHESTRATOR Level 4 aktif`);
      } catch (err) {
        log("Patch LexSkripsi Level 4 error: " + (err as Error).message);
      }

      // Patch: LexSkripsi Mini Apps — 9 mini apps untuk domain skripsi hukum
      try {
        const { patchLexSkripsiMiniApps } = await import("./patch-lexskripsi-mini-apps");
        const { done, skipped, created } = await patchLexSkripsiMiniApps();
        if (!skipped) log(`[Patch LexSkripsi Mini Apps] ${created}/9 mini apps berhasil dibuat`);
      } catch (err) {
        log("Patch LexSkripsi Mini Apps error: " + (err as Error).message);
      }

      // Patch: LexSkripsi Project Brain — template "Otak Skripsi" + instance default Graciella
      try {
        const { patchLexSkripsiProjectBrain } = await import("./patch-lexskripsi-project-brain");
        const { done, skipped } = await patchLexSkripsiProjectBrain();
        if (!skipped) log(`[Patch LexSkripsi Project Brain] Otak Skripsi aktif`);
      } catch (err) {
        log("Patch LexSkripsi Project Brain error: " + (err as Error).message);
      }

      // Patch: LexSkripsi Features — Deliverables, Conversion, Scoring, Landing Page
      try {
        const { patchLexSkripsiFeatures } = await import("./patch-lexskripsi-features");
        const { done, skipped } = await patchLexSkripsiFeatures();
        if (!skipped) log(`[Patch LexSkripsi Features] Deliverables + Conversion + Scoring + Landing Page aktif`);
      } catch (err) {
        log("Patch LexSkripsi Features error: " + (err as Error).message);
      }

      // Patch: SKK Coach HUB — set isOrchestrator=true + orchestratorConfig (always runs)
      try {
        const { patchSkkOrchestratorHub } = await import("./patch-skk-orchestrator");
        await patchSkkOrchestratorHub();
      } catch (err) {
        log("Patch SKK Orchestrator error: " + (err as Error).message);
      }

      // Seed: AHSP & HSPK Knowledge Base (KONSTRA agents)
      try {
        const { seedAhspHspk } = M_ahspHspk;
        await seedAhspHspk();
      } catch (err) {
        log("[Seed AHSP] Error: " + (err as Error).message);
      }

      // Seed: Default Tender Sources (LPSE + BUMN + Asing)
      try {
        const { seedTenderSources } = M_tenderSources;
        await seedTenderSources();
      } catch (err) {
        log("[Seed Tender Sources] Error: " + (err as Error).message);
      }

      // Seed: Kode akses event Indobuildtech (hadir/online, label berbeda)
      try {
        const { seedEventAccessCodes } = await import("./seed-event-access-codes");
        await seedEventAccessCodes();
      } catch (err) {
        log("[Seed Event Access Codes] Error: " + (err as Error).message);
      }

      // Seed: SIRUP + 80+ LPSE Kabupaten/Kota (UKM focus)
      try {
        const { seedKabKotaSources } = M_kabKotaSources;
        await seedKabKotaSources();
      } catch (err) {
        log("[Seed KabKota] Error: " + (err as Error).message);
      }

      // Seed: KONSTRA-TENDER-ORCHESTRATOR + 4 sub-agents (Agentic AI Tender)
      try {
        const { seedTenderAiAgents } = M_tenderAiAgents;
        await seedTenderAiAgents();
      } catch (err) {
        log("[Seed TenderAI] Error: " + (err as Error).message);
      }

      // Seed: TENDERA — OpenClaw + 10 MultiClaw agents (full BUJK tender system)
      try {
        const { seedTenderaAgents } = M_tenderaAgents;
        await seedTenderaAgents();
      } catch (err) {
        log("[Seed TENDERA] Error: " + (err as Error).message);
      }

      // Seed: Brain Project — OpenClaw + 3 MultiClaw (Konsultan, MK, K3)
      try {
        const { seedBrainProjectAgents } = M_brainProject;
        await seedBrainProjectAgents();
      } catch (err) {
        log("[Seed Brain Project] Error: " + (err as Error).message);
      }

      // Seed: EDUCOUNSEL AI — StudentHub (11 sub-agents + 1 orchestrator)
      try {
        const { seedEducounselAgents } = M_educounsel;
        await seedEducounselAgents();
      } catch (err) {
        log("[Seed EDUCOUNSEL] Error: " + (err as Error).message);
      }

      // Seed: EDUCOUNSEL AI Concierge — chatbot informasi publik (RAG 24 dok)
      try {
        const { seedEducounselConcierge } = M_educounselConcierge;
        await seedEducounselConcierge();
      } catch (err) {
        log("[Seed EDUCOUNSEL Concierge] Error: " + (err as Error).message);
      }

      // Seed: IB-TU COORDINATOR — Tata Usaha IB Diploma Programme (7 sub-agents + 1 orchestrator)
      try {
        const { seedIbTu } = M_ibTu;
        await seedIbTu();
      } catch (err) {
        log("[Seed IB-TU] Error: " + (err as Error).message);
      }

      // Seed: Konsultan Permen PU 6/2025 — ASKOM upgrade + ABU/LSBU + PanduanASKOM
      try {
        const { seedKonsultanPermenPU } = M_konsultanPermenPu;
        await seedKonsultanPermenPU();
      } catch (err) {
        log("[Seed KonsultanPermenPU] Error: " + (err as Error).message);
      }

      // Seed: Konsultan Cerdas Permen PU No. 06 Tahun 2026 — Agentic AI Regulatory Consultant
      try {
        const { seedKonsultanPermenPU2026 } = M_konsultanPermenPu2026;
        await seedKonsultanPermenPU2026();
      } catch (err) {
        log("[Seed PermenPU2026] Error: " + (err as Error).message);
      }

      // Seed: SKK ScopeBot — Ruang Lingkup per Jabatan Kerja (Sipil, Manpel, Mekanikal)
      try {
        const { seedScopeSKK } = M_scopeSKK;
        await seedScopeSKK();
      } catch (err) {
        log("[Seed ScopeSKK] Error: " + (err as Error).message);
      }

      // Seed: SipilClaw — AI Konsultan Teknik Sipil (7 sub-agen spesialis)
      try {
        const { seedSipilClaw } = M_sipilClaw;
        await seedSipilClaw();
      } catch (err) {
        log("[Seed SipilClaw] Error: " + (err as Error).message);
      }

      // Seed: MEPClaw — AI Konsultan MEP (7 sub-agen spesialis)
      try {
        const { seedMepClaw } = M_mepClaw;
        await seedMepClaw();
      } catch (err) {
        log("[Seed MEPClaw] Error: " + (err as Error).message);
      }

      // Seed: K3Claw — AI Konsultan K3 Teknis Lapangan (7 sub-agen spesialis)
      try {
        const { seedK3Claw } = M_k3Claw;
        await seedK3Claw();
      } catch (err) {
        log("[Seed K3Claw] Error: " + (err as Error).message);
      }

      // Seed: LingkunganClaw — AI Konsultan Lingkungan Hidup (7 sub-agen spesialis)
      try {
        const { seedLingkunganClaw } = M_lingkunganClaw;
        await seedLingkunganClaw();
      } catch (err) {
        log("[Seed LingkunganClaw] Error: " + (err as Error).message);
      }

      // Seed: ManprojakClaw — AI Manajemen Proyek & Jabatan Kerja SKK (7 sub-agen spesialis)
      try {
        const { seedManprojakClaw } = M_manprojakClaw;
        await seedManprojakClaw();
      } catch (err) {
        log("[Seed ManprojakClaw] Error: " + (err as Error).message);
      }

      // Seed: ArsitekturClaw — AI Arsitektur & Jabatan Kerja SKK Klasifikasi Arsitektur (7 sub-agen spesialis)
      try {
        const { seedArsitekturClaw } = M_arsitekturClaw;
        await seedArsitekturClaw();
      } catch (err) {
        log("[Seed ArsitekturClaw] Error: " + (err as Error).message);
      }

      // Seed: SurveiPemetaanClaw — AI Survei & Pemetaan, Jabatan Kerja SKK (7 sub-agen spesialis)
      try {
        const { seedSurveiPemetaanClaw } = M_surveiPemetaanClaw;
        await seedSurveiPemetaanClaw();
      } catch (err) {
        log("[Seed SurveiPemetaanClaw] Error: " + (err as Error).message);
      }

      // Seed: GeoteknikClaw — AI Geoteknik & Jabatan Kerja SKK Klasifikasi Sipil (Geoteknik) (7 sub-agen spesialis)
      try {
        const { seedGeoteknikClaw } = M_geoteknikClaw;
        await seedGeoteknikClaw();
      } catch (err) {
        log("[Seed GeoteknikClaw] Error: " + (err as Error).message);
      }

      // Seed: JalanJembatanClaw — AI Jalan & Jembatan, Jabatan Kerja SKK (7 sub-agen spesialis)
      try {
        const { seedJalanJembatanClaw } = M_jalanJembatanClaw;
        await seedJalanJembatanClaw();
      } catch (err) {
        log("[Seed JalanJembatanClaw] Error: " + (err as Error).message);
      }

      // Seed: TataLingkunganClaw — AI Teknik Lingkungan, Jabatan Kerja SKK Klasifikasi Tata Lingkungan (7 sub-agen spesialis)
      try {
        const { seedTataLingkunganClaw } = M_tataLingkunganClaw;
        await seedTataLingkunganClaw();
      } catch (err) {
        log("[Seed TataLingkunganClaw] Error: " + (err as Error).message);
      }

      // Seed: ElektrikalClaw — AI Teknik Elektrikal, Jabatan Kerja SKK Klasifikasi Elektrikal (7 sub-agen spesialis)
      try {
        const { seedElektrikalClaw } = M_elekTrikalClaw;
        await seedElektrikalClaw();
      } catch (err) {
        log("[Seed ElektrikalClaw] Error: " + (err as Error).message);
      }

      // Seed: QSClaw — AI Quantity Surveying & Estimasi Biaya Konstruksi (7 sub-agen spesialis)
      try {
        const { seedQSClaw } = M_qsClaw;
        await seedQSClaw();
      } catch (err) {
        log("[Seed QSClaw] Error: " + (err as Error).message);
      }

      // Seed: PengawasClaw — AI Pengawas Konstruksi & Jabatan Kerja SKK (7 sub-agen spesialis)
      try {
        const { seedPengawasClaw } = M_pengawasClaw;
        await seedPengawasClaw();
      } catch (err) {
        log("[Seed PengawasClaw] Error: " + (err as Error).message);
      }

      // Seed: KontrakClaw — AI Manajemen Kontrak & Klaim Konstruksi (7 sub-agen spesialis)
      try {
        const { seedKontrakClaw } = M_kontrakClaw;
        await seedKontrakClaw();
      } catch (err) {
        log("[Seed KontrakClaw] Error: " + (err as Error).message);
      }

      // Seed: K3ManClaw — AI Manajemen K3 Konstruksi & Jabatan Kerja SKK (7 sub-agen spesialis)
      try {
        const { seedK3ManClaw } = M_k3ManClaw;
        await seedK3ManClaw();
      } catch (err) {
        log("[Seed K3ManClaw] Error: " + (err as Error).message);
      }

      // Seed: IBTUClaw — IB Testing Unit AI (7 sub-agen spesialis)
      try {
        const { seedIBTUClaw } = M_ibtuClaw;
        await seedIBTUClaw();
      } catch (err) {
        log("[Seed IBTUClaw] Error: " + (err as Error).message);
      }

      // Seed: ETLOAcademyClaw — Program ETLO Akademik (10 sub-agen spesialis)
      try {
        const { seedEtloAcademyClaw } = M_etloAcademyClaw;
        await seedEtloAcademyClaw();
      } catch (err) {
        log("[Seed ETLOAcademyClaw] Error: " + (err as Error).message);
      }

      // Seed: ETLOBizDevClaw — Program ETLO Business Development (10 sub-agen spesialis)
      try {
        const { seedEtloBizDevClaw } = M_etloBizDevClaw;
        await seedEtloBizDevClaw();
      } catch (err) {
        log("[Seed ETLOBizDevClaw] Error: " + (err as Error).message);
      }

      // Seed: BIMClaw — BIM & Konstruksi Digital (8 sub-agen spesialis)
      try {
        const { seedBimClaw } = M_bimClaw;
        await seedBimClaw();
      } catch (err) {
        log("[Seed BIMClaw] Error: " + (err as Error).message);
      }

      // Seed: DesainClaw — Desain Arsitektur & Rekayasa (8 sub-agen spesialis)
      try {
        const { seedDesainClaw } = M_desainClaw;
        await seedDesainClaw();
      } catch (err) {
        log("[Seed DesainClaw] Error: " + (err as Error).message);
      }

      // Seed: SiteOpsClaw — Operasional Lapangan Konstruksi (8 sub-agen spesialis)
      try {
        const { seedSiteOpsClaw } = M_siteOpsClaw;
        await seedSiteOpsClaw();
      } catch (err) {
        log("[Seed SiteOpsClaw] Error: " + (err as Error).message);
      }

      // Seed: KetenagalistrikanClaw — Ketenagalistrikan Indonesia (8 sub-agen spesialis)
      try {
        const { seedKetenagalistrikanClaw } = M_ketenagalistrikanClaw;
        await seedKetenagalistrikanClaw();
      } catch (err) {
        log("[Seed KetenagalistrikanClaw] Error: " + (err as Error).message);
      }

      // Seed: EnergiClaw — Energi & EBT Indonesia (8 sub-agen spesialis)
      try {
        const { seedEnergiClaw } = M_energiClaw;
        await seedEnergiClaw();
      } catch (err) {
        log("[Seed EnergiClaw] Error: " + (err as Error).message);
      }

      // Seed: PertambanganClaw — Pertambangan Indonesia (8 sub-agen spesialis)
      try {
        const { seedPertambanganClaw } = M_pertambanganClaw;
        await seedPertambanganClaw();
      } catch (err) {
        log("[Seed PertambanganClaw] Error: " + (err as Error).message);
      }

      // Seed: EBTSolarClaw — PLTS & Energi Surya Indonesia (8 sub-agen spesialis)
      try {
        const { seedEbtSolarClaw } = M_ebtSolarClaw;
        await seedEbtSolarClaw();
      } catch (err) {
        log("[Seed EBTSolarClaw] Error: " + (err as Error).message);
      }

      // Seed: SafiraClaw — Coach SKK K3 Konstruksi (5 sub-agen spesialis)
      try {
        const { seedSafiraClaw } = M_safiraClaw;
        await seedSafiraClaw();
      } catch (err) {
        log("[Seed SafiraClaw] Error: " + (err as Error).message);
      }

      // Seed: GeologiClaw — Geologi & Eksplorasi Mineral Indonesia (8 sub-agen spesialis)
      try {
        const { seedGeologiClaw } = M_geologiClaw;
        await seedGeologiClaw();
      } catch (err) {
        log("[Seed GeologiClaw] Error: " + (err as Error).message);
      }

      // Seed: OffshoreSafetyClaw — K3 & Operasi Migas Offshore Indonesia (8 sub-agen spesialis)
      try {
        const { seedOffshoreSafetyClaw } = M_offshoreSafetyClaw;
        await seedOffshoreSafetyClaw();
      } catch (err) {
        log("[Seed OffshoreSafetyClaw] Error: " + (err as Error).message);
      }

      // Seed: TransisiEnergiClaw — Transisi Energi & Dekarbonisasi Indonesia (8 spesialis)
      try {
        const { seedTransisiEnergiClaw } = M_transisiEnergiClaw;
        await seedTransisiEnergiClaw();
      } catch (err) {
        log("[Seed TransisiEnergiClaw] Error: " + (err as Error).message);
      }

      // Seed: TutorTeknikClaw — AI Tutor Teknik Mahasiswa Indonesia (8 tutor)
      try {
        const { seedTutorTeknikClaw } = M_tutorTeknikClaw;
        await seedTutorTeknikClaw();
      } catch (err) {
        log("[Seed TutorTeknikClaw] Error: " + (err as Error).message);
      }

      // Seed: RisetSkripsiClaw — Konsultan Riset & Skripsi (7 spesialis)
      try {
        const { seedRisetSkripsiClaw } = M_risetSkripsiClaw;
        await seedRisetSkripsiClaw();
      } catch (err) {
        log("[Seed RisetSkripsiClaw] Error: " + (err as Error).message);
      }

      // Seed: NSPKNavigatorClaw — Navigator NSPK & Standar Teknis Indonesia (8 spesialis)
      try {
        const { seedNspkNavigatorClaw } = M_nspkNavigatorClaw;
        await seedNspkNavigatorClaw();
      } catch (err) {
        log("[Seed NSPKNavigatorClaw] Error: " + (err as Error).message);
      }

      // Seed: KorporasiClaw — Konsultan Korporasi & Bisnis Indonesia (8 spesialis)
      try {
        const { seedKorporasiClaw } = M_korporasiClaw;
        await seedKorporasiClaw();
      } catch (err) {
        log("[Seed KorporasiClaw] Error: " + (err as Error).message);
      }

      // Seed: DigitalMarketingClaw — AI Konsultan Digital Marketing Indonesia (8 spesialis)
      try {
        const { seedDigitalMarketingClaw } = M_digitalMarketingClaw;
        await seedDigitalMarketingClaw();
      } catch (err) {
        log("[Seed DigitalMarketingClaw] Error: " + (err as Error).message);
      }

      // Seed: MarketIntelligenceClaw — Ketua Tim Riset Pasar & Intelijen Marketing (8 divisi)
      try {
        const { seedMarketIntelligenceClaw } = M_marketIntelligenceClaw;
        await seedMarketIntelligenceClaw();
      } catch (err) {
        log("[Seed MarketIntelligenceClaw] Error: " + (err as Error).message);
      }

      // Seed: Auto-Pilot Jualan — Ketua Tim Kampanye Otomatis (6 divisi, SELLABLE Premium K2)
      try {
        const { seedAutopilotJualan } = M_autopilotJualan;
        await seedAutopilotJualan();
      } catch (err) {
        log("[Seed AutopilotJualan] Error: " + (err as Error).message);
      }

      // Seed: Riset Audiens — Ketua Tim Riset Audiens Mendalam (6 divisi, SELLABLE Premium K2)
      try {
        const { seedRisetAudiens } = M_risetAudiens;
        await seedRisetAudiens();
      } catch (err) {
        log("[Seed RisetAudiens] Error: " + (err as Error).message);
      }

      // Seed: Funnel Otomatis — Ketua Tim Funnel & Follow-up (6 divisi, SELLABLE Premium K2)
      try {
        const { seedFunnelOtomatis } = M_funnelOtomatis;
        await seedFunnelOtomatis();
      } catch (err) {
        log("[Seed FunnelOtomatis] Error: " + (err as Error).message);
      }

      // Seed: Agen Keputusan — Ketua Tim Analisa Keputusan (6 divisi, SELLABLE Premium K2)
      try {
        const { seedAgenKeputusan } = M_agenKeputusan;
        await seedAgenKeputusan();
      } catch (err) {
        log("[Seed AgenKeputusan] Error: " + (err as Error).message);
      }

      // Seed: CrmSalesClaw — AI Konsultan CRM & Sales Indonesia (8 spesialis)
      try {
        const { seedCrmSalesClaw } = M_crmSalesClaw;
        await seedCrmSalesClaw();
      } catch (err) {
        log("[Seed CrmSalesClaw] Error: " + (err as Error).message);
      }

      // Seed: BrandContentClaw — AI Konsultan Brand & Content Marketing Indonesia (8 spesialis)
      try {
        const { seedBrandContentClaw } = M_brandContentClaw;
        await seedBrandContentClaw();
      } catch (err) {
        log("[Seed BrandContentClaw] Error: " + (err as Error).message);
      }

      // Seed: EcommerceClaw — AI Konsultan E-Commerce Indonesia (8 spesialis)
      try {
        const { seedEcommerceClaw } = M_ecommerceClaw;
        await seedEcommerceClaw();
      } catch (err) {
        log("[Seed EcommerceClaw] Error: " + (err as Error).message);
      }

      // Seed: RekrutmenClaw — AI Konsultan Rekrutmen & Talent Acquisition Indonesia (8 spesialis)
      try {
        const { seedRekrutmenClaw } = M_rekrutmenClaw;
        await seedRekrutmenClaw();
      } catch (err) {
        log("[Seed RekrutmenClaw] Error: " + (err as Error).message);
      }

      // Seed: LdKompetensiClaw — AI Konsultan L&D & Pengembangan Kompetensi Indonesia (8 spesialis)
      try {
        const { seedLdKompetensiClaw } = M_ldKompetensiClaw;
        await seedLdKompetensiClaw();
      } catch (err) {
        log("[Seed LdKompetensiClaw] Error: " + (err as Error).message);
      }

      // Seed: PenilaianKinerjaClaw — AI Konsultan Penilaian Kinerja & Manajemen SDM Indonesia (8 spesialis)
      try {
        const { seedPenilaianKinerjaClaw } = M_penilaianKinerjaClaw;
        await seedPenilaianKinerjaClaw();
      } catch (err) {
        log("[Seed PenilaianKinerjaClaw] Error: " + (err as Error).message);
      }

      // Seed: 10 New MultiClaws (Batch May 2026)
      try { await M_pajakClaw.seedPajakClaw(); } catch (err) { log("[Seed PajakClaw] Error: " + (err as Error).message); }
      try { await M_hubunganIndustrialClaw.seedHubunganIndustrialClaw(); } catch (err) { log("[Seed HubunganIndustrialClaw] Error: " + (err as Error).message); }
      try { await M_esgClaw.seedEsgClaw(); } catch (err) { log("[Seed ESGClaw] Error: " + (err as Error).message); }
      try { await M_leanOpExClaw.seedLeanOpExClaw(); } catch (err) { log("[Seed LeanOpExClaw] Error: " + (err as Error).message); }
      try { await M_supplyChainClaw.seedSupplyChainClaw(); } catch (err) { log("[Seed SupplyChainClaw] Error: " + (err as Error).message); }
      try { await M_industri40Claw.seedIndustri40Claw(); } catch (err) { log("[Seed Industri40Claw] Error: " + (err as Error).message); }
      try { await M_transmisiClaw.seedTransmisiClaw(); } catch (err) { log("[Seed TransmisiClaw] Error: " + (err as Error).message); }
      try { await M_cybersecurityClaw.seedCybersecurityClaw(); } catch (err) { log("[Seed CybersecurityClaw] Error: " + (err as Error).message); }
      try { await M_haccpClaw.seedHaccpClaw(); } catch (err) { log("[Seed HACCPClaw] Error: " + (err as Error).message); }
      try { await M_lkpmClaw.seedLkpmClaw(); } catch (err) { log("[Seed LKPMClaw] Error: " + (err as Error).message); }
      try { await M_pubLkutClaw.seedPubLkutClaw(); } catch (err) { log("[Seed PUB-LKUTClaw] Error: " + (err as Error).message); }

      // Seed: Missing MultiClaw Systems (BGClaw, BSClaw, IMClaw, KOClaw, KKClaw, PJBUClaw, KeuanganClaw, SBUClaw, AI Tutor)
      try { await M_bgClaw.seedBgClaw(); } catch (err) { log("[Seed BGClaw] Error: " + (err as Error).message); }
      try { await M_bsClaw.seedBsClaw(); } catch (err) { log("[Seed BSClaw] Error: " + (err as Error).message); }
      try { await M_imClaw.seedImClaw(); } catch (err) { log("[Seed IMClaw] Error: " + (err as Error).message); }
      try { await M_koClaw.seedKoClaw(); } catch (err) { log("[Seed KOClaw] Error: " + (err as Error).message); }
      try { await M_kkClaw.seedKkClaw(); } catch (err) { log("[Seed KKClaw] Error: " + (err as Error).message); }
      try { await M_pjbuClaw.seedPjbuClaw(); } catch (err) { log("[Seed PJBUClaw] Error: " + (err as Error).message); }
      try { await M_keuanganClaw.seedKeuanganClaw(); } catch (err) { log("[Seed KeuanganClaw] Error: " + (err as Error).message); }
      try { await M_sbuClaw.seedSbuClaw(); } catch (err) { log("[Seed SBUClaw] Error: " + (err as Error).message); }
      try { await M_aiTutor.seedAiTutor(); } catch (err) { log("[Seed AI Tutor] Error: " + (err as Error).message); }
      try { await M_skemaClaw.seedSkemaClaw(); } catch (err) { log("[Seed SkemaClaw] Error: " + (err as Error).message); }
      try { await M_simpkClaw.seedSimpkClaw(); } catch (err) { log("[Seed SIMPKClaw] Error: " + (err as Error).message); }
      try { await M_esimpanClaw.seedEsimpanClaw(); } catch (err) { log("[Seed ESIMPANClaw] Error: " + (err as Error).message); }
      try { await M_ossClaw.seedOssClaw(); } catch (err) { log("[Seed OSSClaw] Error: " + (err as Error).message); }
      try { await M_terasLpjk1.seedTerasLpjk1(); } catch (err) { log("[Seed TerasLPJK1] Error: " + (err as Error).message); }
      try { await M_penulisCerdasPkb.seedPenulisCerdasPKB(); } catch (err) { log("[Seed PenulisCerdasPKB] Error: " + (err as Error).message); }
      try { await M_desainProyekClaw.seedDesainProyekClaw(); } catch (err) { log("[Seed DesainProyekClaw] Error: " + (err as Error).message); }
      try { await M_rencanaProyekClaw.seedRencanaProyekClaw(); } catch (err) { log("[Seed RencanaProyekClaw] Error: " + (err as Error).message); }
      try { await M_studiKelayakanClaw.seedStudiKelayakanClaw(); } catch (err) { log("[Seed StudiKelayakanClaw] Error: " + (err as Error).message); }
      // MultiClaw HARUS setelah 3 seed spesialis di atas (wiring via slug lookup)
      try { await M_persiapanProyekMulticlaw.seedPersiapanProyekMulticlaw(); } catch (err) { log("[Seed PersiapanProyekMulticlaw] Error: " + (err as Error).message); }
      // Claw Factory: semua produk claw baru dari server/claw-catalog.ts
      try { await seedClawCatalog(CLAW_CATALOG); } catch (err) { log("[ClawFactory] Error: " + (err as Error).message); }

      // ── Store Products — produk unggulan di katalog marketplace ──────────
      try { await seedStoreProducts(); } catch (err) { log("[Seed StoreProducts] Error: " + (err as Error).message); }
      try {
        await seedSbuSkkEbook();
        invalidateStoreCatalog();
      } catch (err) {
        log("[Seed SBU-SKK Ebook] Error: " + (err as Error).message);
      }
      try {
        await seedSbuSkkFunnel();
      } catch (err) {
        log("[Seed SBU-SKK Funnel] Error: " + (err as Error).message);
      }

      // Kelompokkan hanya agent promotable yang belum punya Modul efektif.
      // Reconciler tidak mengubah prompt, harga, model, visibilitas, atau kelas premium.
      try {
        const {
          assertChatbotModuleReconcileHealthy,
          reconcileChatbotModules,
        } = await import("./reconcile-chatbot-modules");
        const result = await reconcileChatbotModules();
        assertChatbotModuleReconcileHealthy(result);
        invalidateStoreCatalog();
        log(
          `[Chatbot Modules] ✅ ${result.agentsAssigned} assigned, ` +
          `${result.alreadyAssigned} unchanged, ${result.conflicts.length} conflicts, ` +
          `${result.missingAgents.length + result.missingModules.length} missing, ` +
          `${result.duplicateAgentSlugs.length + result.duplicateModuleSlugs.length} duplicate slugs`,
        );
      } catch (err) {
        log("[Chatbot Modules] Error: " + (err as Error).message);
      }

      // ── SMART MODEL UPGRADE — SEMUA chatbot/agen wajib model cerdas ──────────
      // Kualitas jawaban ditentukan tier model, bukan KB. Seed MELEWATI agen yang
      // sudah ada (tidak memperbarui ai_model), sehingga DB lama (mis. production)
      // tetap tertinggal di model lemah. Migrasi idempoten ini jalan tiap boot
      // SETELAH semua seed (jadi menang atas seed force-reseed): menaikkan setiap
      // agen bermodel LEMAH (mini / 3.5 / qwen-turbo / null) ke gpt-4o. Model cerdas
      // non-OpenAI (deepseek-chat, qwen-plus, gemini pro) & 'custom' sengaja TIDAK
      // diutak-atik. Berlaku efektif di prod hanya setelah REDEPLOY.
      try {
        const { db: rawDb } = await import("./db");
        const { sql: rawSql } = await import("drizzle-orm");
        const upgradeRes: any = await rawDb.execute(rawSql`
          UPDATE agents SET ai_model = 'gpt-4o'
          WHERE ai_model IS NULL
             OR ai_model IN ('gpt-4o-mini', 'gpt-3.5-turbo', 'qwen-turbo')
          RETURNING id
        `);
        const n = (upgradeRes?.rowCount ?? upgradeRes?.rows?.length ?? 0);
        if (n) log(`[SmartModelUpgrade] upgraded ${n} agent(s) to gpt-4o`);
      } catch (err) {
        log("[SmartModelUpgrade] error: " + (err as Error).message);
      }

      await startSchedulerLeaderElection();
      startScheduler();
    },
  );
})();

// ─── WIB Time Utilities ───────────────────────────────────────────────────────
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7

/** Ambil waktu WIB saat ini */
function nowWIB(): Date {
  return new Date(Date.now() + WIB_OFFSET_MS);
}

/**
 * Hitung berapa ms sampai jam `targetHour:targetMinute` WIB berikutnya.
 * Jika waktu target sudah lewat hari ini, hitung untuk besok.
 */
function msUntilWIB(targetHour: number, targetMinute = 0): number {
  const now = nowWIB();
  const target = new Date(now);
  target.setUTCHours(targetHour, targetMinute, 0, 0);
  let ms = target.getTime() - now.getTime();
  if (ms <= 0) ms += 24 * 60 * 60 * 1000; // besok
  return ms;
}

/**
 * Jalankan fungsi `fn` pada jam WIB tertentu, lalu ulangi setiap 24 jam.
 */
function scheduleAtWIB(label: string, hour: number, minute: number, fn: () => Promise<void>): void {
  const delay = msUntilWIB(hour, minute);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  log(`[Scheduler] ${label} dijadwalkan pada ${hh}:${mm} WIB (${Math.round(delay / 60000)} menit lagi)`);

  const runIfLeader = async () => {
    // Hanya leader yang menjalankan job — cegah eksekusi ganda di multi-instance.
    if (!isSchedulerLeader()) {
      log(`[Scheduler] ${label} — lewati (bukan leader)`);
      return;
    }
    log(`[Scheduler] ${label} — mulai (${hh}:${mm} WIB)`);
    try { await fn(); } catch (err) { log(`[Scheduler] ${label} error: ${(err as Error).message}`); }
  };

  setTimeout(async () => {
    await runIfLeader();
    // Ulangi setiap 24 jam
    setInterval(runIfLeader, 24 * 60 * 60 * 1000);
  }, delay);
}

// ─── Tender Alert Notification Runner (08:00 WIB) ────────────────────────────
async function runTenderAlertNotification(): Promise<void> {
  // Tender Alert = produk berbayar (Starter+). Pengiriman via WA (Fonnte) DAN/ATAU
  // email (Brevo). Minimal salah satu channel harus terkonfigurasi.
  const waToken = process.env.FONNTE_API_TOKEN;
  const emailReady = !!process.env.BREVO_API_KEY;
  if (!waToken && !emailReady) {
    log("[Tender Alert] FONNTE_API_TOKEN & BREVO_API_KEY dua-duanya kosong — tidak ada channel pengiriman. Skip.");
    return;
  }
  try {
    const { sendTenderAlertEmail } = await import("./lib/email");
    const { resolvePlan, PLAN_CONFIGS } = await import("@shared/feature-plans");

    const profiles = await (storage as any).getAllActiveTenderAlertProfiles?.() ?? [];
    log(`[Tender Alert] Memproses ${profiles.length} profil aktif...`);
    const date = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    let sentWa = 0, sentEmail = 0, skippedPlan = 0;
    for (const profile of profiles) {
      if (!profile.waPhone && !profile.email) continue;
      try {
        // Gating berbayar: hanya kirim untuk pengguna dengan langganan aktif Starter+.
        const sub = await storage.getActiveSubscription(String(profile.userId));
        const plan = resolvePlan(sub?.plan, sub?.status === "active");
        if (plan.tier < PLAN_CONFIGS.starter.tier) {
          skippedPlan++;
          continue;
        }

        const matches = await (storage as any).getTendersMatchingProfile?.(profile, 5) ?? [];
        if (matches.length === 0) continue;

        let delivered = false;

        // ── Channel 1: WhatsApp (Fonnte) ──
        if (waToken && profile.waPhone) {
          let message = `🏗️ *TENDER MONITOR GUSTAFTA*\n📅 ${date}\n\n`;
          message += `Halo *${profile.companyName || "BUJK"}*!\n`;
          message += `${matches.length} tender baru yang cocok untuk Anda:\n\n`;
          matches.forEach((t: any, i: number) => {
            message += `${i + 1}. *${t.name.replace("[DEMO] ", "")}*\n`;
            message += `   🏢 ${t.agency}`;
            if (t.budget) message += ` | 💰 ${t.budget}`;
            if (t.deadlineDate) message += `\n   ⏰ Deadline: ${t.deadlineDate}`;
            if (t.url && !t.url.includes("demo")) message += `\n   🔗 ${t.url}`;
            message += "\n\n";
          });
          const sectors = (profile.sectors || ["konstruksi"]).join(", ");
          const kual = (profile.kualifikasi || []).join("/") || "Semua";
          message += `_Filter: ${sectors} | Kualifikasi: ${kual}_\n_— Gustafta Tender Monitor_`;

          try {
            const waRes = await fetch("https://api.fonnte.com/send", {
              method: "POST",
              headers: { Authorization: waToken },
              body: new URLSearchParams({ target: profile.waPhone, message }),
            });
            const waBody: any = await waRes.json().catch(() => ({}));
            if (waRes.ok && waBody?.status !== false) {
              sentWa++;
              delivered = true;
            } else {
              log(`[Tender Alert] WA ditolak profile ${profile.userId}: HTTP ${waRes.status} ${JSON.stringify(waBody).slice(0, 200)}`);
            }
          } catch (waErr) {
            log(`[Tender Alert] WA gagal profile ${profile.userId}: ${(waErr as Error).message}`);
          }
        }

        // ── Channel 2: Email (Brevo) ──
        if (emailReady && profile.email) {
          const r = await sendTenderAlertEmail({
            to: profile.email,
            companyName: profile.companyName,
            matches,
            sectors: profile.sectors,
            kualifikasi: profile.kualifikasi,
          });
          if (r.sent) { sentEmail++; delivered = true; }
          else log(`[Tender Alert] Email gagal profile ${profile.userId}: ${r.reason}${r.detail ? " — " + r.detail : ""}`);
        }

        if (delivered) {
          await (storage as any).markAlertProfileNotified?.(profile.userId);
          // Rate limit: delay 2 detik antar profil
          if (profiles.length > 1) await new Promise(r => setTimeout(r, 2000));
        }
      } catch (err) {
        log(`[Tender Alert] Gagal notif profile ${profile.userId}: ${(err as Error).message}`);
      }
    }
    log(`[Tender Alert] Selesai — WA: ${sentWa}, Email: ${sentEmail}, dilewati (tanpa langganan): ${skippedPlan} dari ${profiles.length} profil`);
  } catch (err) {
    log(`[Tender Alert] Error: ${(err as Error).message}`);
  }
}

// ─── Tender Scrape Runner ─────────────────────────────────────────────────────
async function runTenderScrape(): Promise<void> {
  const { runDailyTenderScrape } = M_inaprocScraper;
  const sources = await (storage as any).getTenderSources?.() ?? [];
  log(`[Tender Scraper] Memulai scraping ${sources.filter((s: any) => s.isEnabled).length} sumber aktif...`);
  await runDailyTenderScrape(storage);
  log(`[Tender Scraper] Selesai.`);
}

// ─── Ruang Kelola Expiry Reminder ────────────────────────────────────────────
// Sends WA reminders (via Fonnte) for documents expiring within 30 or 7 days.
// Marks reminder_sent_30d / reminder_sent_7d = true after a successful send so
// re-runs (e.g. after a restart) are idempotent and never double-notify.
// Called both at boot (catch-up) and daily at 09:00 WIB via scheduleAtWIB.
async function runRuangKelolaReminder(): Promise<void> {
  const waToken = process.env.FONNTE_API_KEY;
  if (!waToken) {
    log("[RuangKelola] FONNTE_API_KEY kosong — skip reminder.");
    return;
  }
  try {
    // Documents expiring within 30 days where the 30-day reminder has not yet been sent
    const { rows: expiring30 } = await pool.query(`
      SELECT d.*, p.phone, p.company_name
      FROM ruang_kelola_documents d
      JOIN ruang_kelola_profiles p ON p.user_id = d.user_id
      WHERE d.expired_date IS NOT NULL
        AND d.expired_date > now()
        AND d.expired_date <= now() + interval '30 days'
        AND d.reminder_sent_30d = false
        AND p.phone IS NOT NULL AND p.phone <> ''
        AND d.category <> 'tender'
    `);

    // Documents expiring within 7 days where the 7-day reminder has not yet been sent
    const { rows: expiring7 } = await pool.query(`
      SELECT d.*, p.phone, p.company_name
      FROM ruang_kelola_documents d
      JOIN ruang_kelola_profiles p ON p.user_id = d.user_id
      WHERE d.expired_date IS NOT NULL
        AND d.expired_date > now()
        AND d.expired_date <= now() + interval '7 days'
        AND d.reminder_sent_7d = false
        AND p.phone IS NOT NULL AND p.phone <> ''
        AND d.category <> 'tender'
    `);

    const sendWA = async (phone: string, message: string): Promise<boolean> => {
      const res = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: { Authorization: waToken },
        body: new URLSearchParams({ target: phone, message }),
      });
      return res.ok;
    };

    // Group by phone so each user gets one bundled WA instead of one per document
    const grouped30: Record<string, any[]> = {};
    for (const d of expiring30) {
      if (!grouped30[d.phone]) grouped30[d.phone] = [];
      grouped30[d.phone].push(d);
    }
    const grouped7: Record<string, any[]> = {};
    for (const d of expiring7) {
      if (!grouped7[d.phone]) grouped7[d.phone] = [];
      grouped7[d.phone].push(d);
    }

    let sent30 = 0, sent7 = 0;

    for (const [phone, docs] of Object.entries(grouped30)) {
      const co = docs[0].company_name || "Perusahaan Anda";
      let msg = `⚠️ *RUANG KELOLA GUSTAFTA*\n`;
      msg += `Halo *${co}*! Dokumen berikut akan kedaluwarsa dalam 30 hari:\n\n`;
      for (const d of docs) {
        const exp = new Date(d.expired_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
        msg += `• *${d.doc_name}* (${d.doc_type})\n  📅 Berakhir: ${exp}\n`;
      }
      msg += `\nSegera perbarui di https://gustafta.id/ruang-kelola`;
      const ok = await sendWA(phone, msg);
      if (ok) {
        await pool.query(
          `UPDATE ruang_kelola_documents SET reminder_sent_30d = true WHERE id = ANY($1::uuid[])`,
          [docs.map((d: any) => d.id)]
        );
        sent30++;
      }
    }

    for (const [phone, docs] of Object.entries(grouped7)) {
      const co = docs[0].company_name || "Perusahaan Anda";
      let msg = `🔴 *RUANG KELOLA GUSTAFTA — URGENT*\n`;
      msg += `Halo *${co}*! Dokumen berikut berakhir dalam *7 hari*:\n\n`;
      for (const d of docs) {
        const exp = new Date(d.expired_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
        msg += `• *${d.doc_name}* (${d.doc_type})\n  📅 Berakhir: ${exp}\n`;
      }
      msg += `\n⚡ Segera perpanjang sebelum kedaluwarsa!\nhttps://gustafta.id/ruang-kelola`;
      const ok = await sendWA(phone, msg);
      if (ok) {
        await pool.query(
          `UPDATE ruang_kelola_documents SET reminder_sent_7d = true WHERE id = ANY($1::uuid[])`,
          [docs.map((d: any) => d.id)]
        );
        sent7++;
      }
    }

    log(`[RuangKelola] Reminder selesai — 30hr: ${sent30} WA terkirim, 7hr: ${sent7} WA terkirim`);
  } catch (err) {
    log(`[RuangKelola] Reminder error: ${(err as Error).message}`);
  }
}

function startScheduler() {
  const BROADCAST_CHECK_INTERVAL = 2 * 60 * 1000;

  // ── Broadcast checker (setiap 2 menit) ──────────────────────────────────────
  setInterval(async () => {
    if (!isSchedulerLeader()) return; // hanya leader yang memproses broadcast
    try {
      const dueBroadcasts = await storage.getDueBroadcasts();
      for (const broadcast of dueBroadcasts) {
        log(`[Scheduler] Running broadcast: ${broadcast.name} (ID: ${broadcast.id})`);
        try {
          const contacts = await storage.getWaContacts(String(broadcast.agentId));
          const activeContacts = contacts.filter(c => !c.isOptedOut);
          if (activeContacts.length === 0) continue;

          const integrations = await storage.getIntegrations(String(broadcast.agentId));
          const waIntegration = integrations.find((i: any) => i.type === "whatsapp" && i.isEnabled);
          const waConfig = (waIntegration?.config || {}) as Record<string, string>;
          const waApiToken = waConfig.apiToken || waConfig.token;
          if (!waApiToken) continue;

          const run = await storage.createBroadcastRun({
            broadcastId: broadcast.id,
            status: "running",
            totalRecipients: activeContacts.length,
          });

          let message = broadcast.messageTemplate;
          if (broadcast.dataSource === "tender_daily") {
            const latestTenders = await storage.getLatestTenders(10);
            if (latestTenders.length > 0) {
              const tenderList = latestTenders.map((t: any, i: number) =>
                `${i + 1}. ${t.name}\n   ${t.agency} | ${t.budget}\n   ${t.url}`
              ).join("\n\n");
              message = message.replace("{{tender_list}}", tenderList);
              message = message.replace("{{date}}", new Date().toLocaleDateString("id-ID"));
              message = message.replace("{{count}}", String(latestTenders.length));
            }
          }

          let sent = 0, failed = 0;
          for (const contact of activeContacts) {
            try {
              await fetch("https://api.fonnte.com/send", {
                method: "POST",
                headers: { "Authorization": waApiToken },
                body: new URLSearchParams({
                  target: contact.phone,
                  message: message.replace("{{name}}", contact.name || ""),
                }),
              });
              sent++;
              if (activeContacts.length > 5) await new Promise(r => setTimeout(r, 1000));
            } catch {
              failed++;
            }
          }

          await storage.updateBroadcastRun(String(run.id), {
            status: "completed",
            totalSent: sent,
            totalFailed: failed,
            completedAt: new Date(),
          });

          await storage.updateWaBroadcast(String(broadcast.id), { lastRunAt: new Date() } as any);

          if (broadcast.scheduleType === "daily") {
            const [hours, minutes] = (broadcast.scheduleTime || "08:00").split(":").map(Number);
            const next = new Date();
            next.setDate(next.getDate() + 1);
            next.setHours(hours, minutes, 0, 0);
            await storage.updateWaBroadcast(String(broadcast.id), { nextRunAt: next } as any);
          } else if (broadcast.scheduleType === "once") {
            await storage.updateWaBroadcast(String(broadcast.id), { isEnabled: false } as any);
          }

          log(`[Scheduler] Broadcast "${broadcast.name}" completed: ${sent} sent, ${failed} failed`);
        } catch (err) {
          log(`[Scheduler] Broadcast "${broadcast.name}" failed: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      log(`[Scheduler] Broadcast check error: ${(err as Error).message}`);
    }
  }, BROADCAST_CHECK_INTERVAL);

  // ── Tender Scraper — 2x/hari pada 06:00 & 13:00 WIB ────────────────────────
  scheduleAtWIB("Tender Scrape Pagi",  6, 0, runTenderScrape);
  scheduleAtWIB("Tender Scrape Siang", 13, 0, runTenderScrape);

  // ── Tender Alert Notifikasi — 08:00 WIB (WA harian per profil BUJK) ────────
  scheduleAtWIB("Tender Alert 08:00", 8, 0, runTenderAlertNotification);

  // ── Ruang Kelola Reminder — 09:00 WIB (notif dokumen akan kedaluwarsa) ───────
  // Boot-time catch-up: if the server restarts after 09:00 WIB the daily
  // scheduleAtWIB wouldn't fire until the next day.  Running once at boot
  // (after a short delay for the DB pool to settle) ensures no window is missed.
  // reminder_sent_30d / reminder_sent_7d flags are idempotent so a duplicate run
  // on the same calendar day is safe — it just finds no unsent rows.
  setTimeout(() => {
    if (isSchedulerLeader()) {
      runRuangKelolaReminder().catch((err: Error) =>
        log(`[RuangKelola] Boot catch-up error: ${err.message}`)
      );
    }
  }, 30_000); // 30 s — let DB pool stabilise first

  scheduleAtWIB("Ruang Kelola Reminder", 9, 0, runRuangKelolaReminder);

  // ── Research Feed sweep — 06:30 WIB (isi KB tim riset dari Google News RSS) ──
  scheduleAtWIB("Research Feed Sweep", 6, 30, async () => {
    const { runResearchSweep } = await import("./lib/research-feed");
    const result = await runResearchSweep();
    log(`[Research Feed] sweep selesai: lokal=${result.local?.chunks ?? "-"} chunk, global=${result.global?.chunks ?? "-"} chunk, materi-iklan=${result.adMaterials?.generated ? result.adMaterials.chunks + " chunk" : (result.adMaterials?.reason ?? "-")}, peta-kebutuhan=${result.marketNeedsReport?.generated ? result.marketNeedsReport.recommendations + " rekomendasi" : (result.marketNeedsReport?.reason ?? "-")}, skip=[${result.skipped.join(",")}]`);
  });

  // ── Owner Monthly Usage cleanup — 03:15 WIB (buang baris bulan lama) ────────
  // Baris kuota per-owner ditulis satu per bulan kalender; tanpa pembersihan
  // tabelnya tumbuh tanpa batas. Kita simpan bulan berjalan + 2 bulan sebelumnya
  // (retensi 3 bulan) dan hapus yang lebih lama. Tidak menyentuh enforcement.
  scheduleAtWIB("Owner Usage Cleanup", 3, 15, async () => {
    const now = new Date();
    const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
    const cutoffMonth = cutoff.toISOString().slice(0, 7); // "YYYY-MM"
    const deleted = await storage.deleteOwnerMonthlyUsageBefore(cutoffMonth);
    log(`[Owner Usage Cleanup] hapus ${deleted} baris owner_monthly_usage sebelum ${cutoffMonth}`);
  });

  // ── Briefing Harian WA — 07:00 WIB ──────────────────────────────────────────
  scheduleAtWIB("Briefing Harian WA", 7, 0, async () => {
    const { sendFonnteNotification } = await import("./lib/notify-fonnte");
    const now = nowWIB();
    const tanggal = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    let statsLine = "";
    try {
      const { pool } = await import("./db");
      const r = await pool.query(
        `SELECT count(*)::int AS orders FROM store_orders WHERE created_at > now() - interval '24 hours'`
      );
      statsLine = `\n📦 Order 24 jam terakhir: ${r.rows[0]?.orders ?? 0}`;
    } catch { /* stats opsional */ }
    const msg = `☀️ *Briefing Harian Gustafta*\n${tanggal}${statsLine}\n\nSemua sistem berjalan. Semangat, Bos! 🏎️`;
    const res = await sendFonnteNotification(msg);
    log(res.sent ? "[Briefing] terkirim ke WA" : `[Briefing] gagal: ${res.reason}`);
  });

  // ── Cadangan Database via email — Senin 05:00 WIB (mingguan) ────────────────
  // scheduleAtWIB berjalan harian; kita batasi ke hari Senin agar efektif
  // mingguan. File pg_dump ter-gzip dikirim sebagai lampiran ke admin — salinan
  // off-site otomatis untuk pemulihan bila pindah akun.
  scheduleAtWIB("Backup DB Email", 5, 0, async () => {
    if (nowWIB().getUTCDay() !== 1) return; // 1 = Senin
    const { sendBackupEmail, resolveBackupRecipient } = await import("./lib/db-backup");
    const recipient = resolveBackupRecipient();
    if (!recipient) {
      log("[Backup] penerima email kosong (set BACKUP_RECIPIENT_EMAIL/SUPERADMIN_EMAILS) — skip");
      return;
    }
    const res = await sendBackupEmail(recipient);
    log(res.sent
      ? `[Backup] cadangan DB terkirim ke ${recipient}`
      : `[Backup] gagal kirim cadangan ke ${recipient}: ${res.reason}${res.detail ? " — " + res.detail : ""}`);
  });

  log("[Scheduler] Started — broadcast cek setiap 2 menit | tender scraping 06:00 & 13:00 WIB | alert notifikasi 08:00 WIB | research feed 06:30 WIB | owner usage cleanup 03:15 WIB | backup DB email Senin 05:00 WIB");
}
