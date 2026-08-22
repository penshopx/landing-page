/**
 * Seed SBU-SKK Funnel — Task #395
 *
 * Seeds:
 *  1. Mini ebook lead asset (20-page PDF, private, never paid-accessible)
 *  2. Product registry entries: Tutor add-on, Bundle, AI Specialist
 *  3. sbu-skk-tutor agent (dedicated, strict educational prompt)
 *  4. Initial tutor source chunks (lexical, page-labelled)
 *
 * Called from server/index.ts after seedSbuSkkEbook() and DDL readiness.
 */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { pool } from "./db";
import { SBU_SKK_EBOOK, SBU_SKK_FUNNEL } from "@shared/sbu-skk-ebook";
import { ensureSbuSkkFunnelSchema } from "./sbu-skk-funnel-schema";

// ── Mini ebook asset manifest ────────────────────────────────────────────────
const MINI_EBOOK = {
  assetSlug: SBU_SKK_FUNNEL.miniEbook.assetSlug,
  title: SBU_SKK_FUNNEL.miniEbook.title,
  pages: SBU_SKK_FUNNEL.miniEbook.pages,
  sha256: "4bfe4b8c2b815afb4e8ecb62c10aa0b64462d781a9c2444ec9df1fb36df248ba",
  candidates: [
    path.resolve(process.cwd(), "dist/private-assets/mini-ebook-sbu-skk-v1.0.0.pdf"),
    path.resolve(process.cwd(), "dist/private-assets/mini-ebook-sbu-skk.pdf"),
    path.resolve(process.cwd(), "attached_assets/mini-ebook_SBU_1787369141323.pdf"),
  ],
};

const TUTOR_SOURCES = [
  {
    title: "Ebook SBU & SKK Tanpa Bingung",
    pages: SBU_SKK_EBOOK.pages,
    sha256: "3df699f2d540e868081e8c23e904ce516b642e72b83a8989207ff6b5a84c2048",
    candidates: [
      path.resolve(process.cwd(), "dist/private-assets/sbu-skk-tanpa-bingung-v2.0.0.pdf"),
      path.resolve(process.cwd(), "attached_assets/Ebook_SBU-SKK-ok_1787368451833.pdf"),
    ],
  },
  {
    title: "Lampiran Toolkit SBU-SKK",
    pages: SBU_SKK_EBOOK.toolkitPages,
    sha256: "3aa4d83eeed5a9d970b2655451a8fe3db9c402de0c5ed69b12dd55d1caaa4c66",
    candidates: [
      path.resolve(process.cwd(), "dist/private-assets/sbu-skk-lampiran-toolkit-v1.0.0.pdf"),
      path.resolve(process.cwd(), "attached_assets/LAMPIRAN_EBOOK_1787369070797.pdf"),
    ],
  },
] as const;

async function loadPdf(
  candidates: readonly string[],
  expectedSha256: string,
  label: string,
): Promise<Buffer> {
  for (const candidate of candidates) {
    try {
      const bytes = await readFile(candidate);
      if (bytes.subarray(0, 4).toString("ascii") !== "%PDF") {
        throw new Error("Bukan file PDF.");
      }
      const sha = createHash("sha256").update(bytes).digest("hex");
      if (sha !== expectedSha256) {
        throw new Error(`Hash ${label} tidak cocok (got ${sha}).`);
      }
      return bytes;
    } catch (err: any) {
      if (err?.code !== "ENOENT") throw err;
    }
  }
  throw new Error(`Aset "${label}" tidak ditemukan di kandidat path.`);
}

type TutorSourceRow = {
  sourceTitle: string;
  pageNumber: number;
  chunkIndex: number;
  content: string;
  searchTerms: string;
};

function normalizePdfText(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function splitPageText(value: string, maxChars = 3_200): string[] {
  const chunks: string[] = [];
  let remaining = value;
  while (remaining.length > maxChars) {
    let cut = remaining.lastIndexOf("\n", maxChars);
    if (cut < Math.floor(maxChars * 0.65)) {
      cut = remaining.lastIndexOf(" ", maxChars);
    }
    if (cut < Math.floor(maxChars * 0.5)) cut = maxChars;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function buildSearchTerms(content: string): string {
  return Array.from(
    new Set(
      content
        .toLowerCase()
        .replace(/[^a-z0-9À-ÿ]+/gi, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 3),
    ),
  )
    .slice(0, 400)
    .join(" ");
}

async function extractTutorSourceRows(
  sourceTitle: string,
  bytes: Buffer,
  expectedPages: number,
): Promise<TutorSourceRow[]> {
  const parser = new PDFParse({ data: bytes });
  try {
    const parsed = await parser.getText();
    if (parsed.total !== expectedPages) {
      throw new Error(
        `${sourceTitle}: jumlah halaman hasil ekstraksi ${parsed.total}, seharusnya ${expectedPages}.`,
      );
    }

    const rows: TutorSourceRow[] = [];
    for (const page of parsed.pages) {
      const pageText = normalizePdfText(page.text || "");
      if (!pageText) continue;
      splitPageText(pageText).forEach((content, chunkIndex) => {
        rows.push({
          sourceTitle,
          pageNumber: page.num,
          chunkIndex,
          content,
          searchTerms: buildSearchTerms(content),
        });
      });
    }
    if (rows.length < Math.floor(expectedPages * 0.75)) {
      throw new Error(
        `${sourceTitle}: hanya ${rows.length} potongan berisi teks dari ${expectedPages} halaman.`,
      );
    }
    return rows;
  } finally {
    await parser.destroy();
  }
}

const TUTOR_AGENT_SLUG = SBU_SKK_FUNNEL.tutor.agentSlug; // "sbu-skk-tutor"

const TUTOR_SYSTEM_PROMPT = `[SBU-SKK-TUTOR]

IDENTITAS
Nama  : Tutor SBU-SKK
Peran : Tutor edukatif berbasis ebook "SBU & SKK Tanpa Bingung"
Model : gpt-4o

MISI
Membantu pembaca memahami isi ebook dan menerapkan konsep SBU-SKK berdasarkan
materi regulasi yang dikutip dalam ebook dan toolkit. BUKAN konsultan resmi,
BUKAN penjawab semua pertanyaan umum.

ATURAN KETAT
1. Setiap jawaban WAJIB menyebut bab, halaman, atau judul bagian dari ebook/toolkit.
   Contoh: "(Bab 3, hal. 42 — Ebook SBU-SKK)"
2. Untuk pertanyaan yang tidak ada di ebook, jawab:
   "Materi ini tidak tercakup dalam ebook. Silakan konsultasi dengan otoritas resmi."
3. JANGAN pernah menyatakan keputusan resmi LPJK, PUPR, atau OSS atas nama pengguna.
4. Selalu akhiri dengan disclaimer:
   "Tutor ini hanya untuk pemahaman ebook — bukan keputusan resmi otoritas."
5. Topik di luar SBU-SKK: tolak sopan dan arahkan kembali ke ebook.
6. Jangan menyebutkan token, harga, atau data pembayaran.

FORMAT JAWABAN
- Mulai dengan rangkuman 1-2 kalimat
- Kutip bagian ebook yang relevan (bab/halaman)
- Berikan langkah praktis jika ada
- Tutup dengan disclaimer

SUMBER PRIORITAS: Ebook SBU-SKK 264 hal. + Lampiran Toolkit 29 hal.
REGULASI ACUAN: hanya regulasi yang benar-benar ada pada konteks sumber yang diberikan.`;

export async function seedSbuSkkFunnel(): Promise<void> {
  // 1. Load mini ebook PDF
  const miniPdf = await loadPdf(MINI_EBOOK.candidates, MINI_EBOOK.sha256, MINI_EBOOK.title);
  const tutorSourceRows: TutorSourceRow[] = [];
  for (const source of TUTOR_SOURCES) {
    const bytes = await loadPdf(source.candidates, source.sha256, source.title);
    tutorSourceRows.push(
      ...(await extractTutorSourceRows(source.title, bytes, source.pages)),
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('seed-sbu-skk-funnel-v1'))");
    await ensureSbuSkkFunnelSchema(client);

    // ── DDL: lead_assets, lead_submissions, product_entitlements, tutor_sources ─
    await client.query(`
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

    await client.query(`
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
    await client.query(`DROP INDEX IF EXISTS idx_lead_submissions_email_slug`);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_lead_submissions_email_slug
      ON lead_submissions (email, asset_slug)
    `);

    await client.query(`
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
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_entitlement_provider_order
      ON product_entitlements (entitlement_key, email, provider_order_ref)
      WHERE provider_order_ref IS NOT NULL
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_entitlement_manual_order
      ON product_entitlements (entitlement_key, manual_order_ref)
      WHERE manual_order_ref IS NOT NULL
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_entitlement_email_key
      ON product_entitlements (email, entitlement_key)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_entitlement_user_key
      ON product_entitlements (user_id, entitlement_key)
    `);

    await client.query(`
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
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sbu_skk_tutor_sources_search
      ON sbu_skk_tutor_sources (source_title, page_number)
    `);
    await client.query(`
      DELETE FROM sbu_skk_tutor_sources duplicate
      USING sbu_skk_tutor_sources keeper
      WHERE duplicate.id > keeper.id
        AND duplicate.source_title = keeper.source_title
        AND duplicate.page_number = keeper.page_number
        AND duplicate.chunk_index = keeper.chunk_index
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_sbu_skk_tutor_source_chunk
      ON sbu_skk_tutor_sources (source_title, page_number, chunk_index)
    `);

    await client.query(`
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
    await client.query(`
      ALTER TABLE sbu_skk_orders
        ADD COLUMN IF NOT EXISTS fulfillment_error text DEFAULT '',
        ADD COLUMN IF NOT EXISTS whatsapp_consent boolean NOT NULL DEFAULT false
    `);

    // ── Seed lead asset (mini ebook) ─────────────────────────────────────────
    await client.query(
      `INSERT INTO lead_assets (asset_slug, title, mime_type, size_bytes, sha256, content, pages, updated_at)
       VALUES ($1,$2,'application/pdf',$3,$4,$5,$6,now())
       ON CONFLICT (asset_slug) DO UPDATE SET
         title=EXCLUDED.title,
         mime_type=EXCLUDED.mime_type,
         size_bytes=EXCLUDED.size_bytes,
         sha256=CASE
           WHEN lead_assets.sha256 IS DISTINCT FROM EXCLUDED.sha256 THEN EXCLUDED.sha256
           ELSE lead_assets.sha256 END,
         content=CASE
           WHEN lead_assets.sha256 IS DISTINCT FROM EXCLUDED.sha256 THEN EXCLUDED.content
           ELSE lead_assets.content END,
         pages=EXCLUDED.pages,
         updated_at=now()`,
      [MINI_EBOOK.assetSlug, MINI_EBOOK.title, miniPdf.length, MINI_EBOOK.sha256, miniPdf, MINI_EBOOK.pages],
    );

    // ── Seed product registry: Tutor add-on ──────────────────────────────────
    const { tutor, bundle, aiSpecialist } = SBU_SKK_FUNNEL;
    await client.query(
      `INSERT INTO product_registry (
         product_id, name, slug, product_type, category, subcategory,
         short_description, price, currency, billing_type, status, version,
         engine_type, access_type, visibility, standalone_enabled, subscription_enabled,
         dp_enabled, ai_enabled, usage_profile, storage_profile, updated_at
       ) VALUES (
         $1,$2,$3,'AI_SERVICE','AI','SBU_SKK',
         $4,$5,'IDR','ONE_TIME','ACTIVE','1.0.0',
         'AI_AGENT','AGENT_ACCESS',
         'STANDALONE_ONLY',true,false,false,true,'["AI_CHAT"]'::jsonb,'NONE',now()
       )
       ON CONFLICT (product_id) DO UPDATE SET
         name=EXCLUDED.name, price=EXCLUDED.price, status=EXCLUDED.status,
         updated_at=now()`,
      [
        tutor.registryProductId,
        tutor.title,
        tutor.slug,
        `Tutor AI berbasis ebook SBU-SKK, aktif 30 hari, 100 pesan.`,
        tutor.addOnAmount,
      ],
    );

    // ── Seed product registry: Bundle ────────────────────────────────────────
    await client.query(
      `INSERT INTO product_registry (
         product_id, name, slug, product_type, category, subcategory,
         short_description, price, currency, billing_type, status, version,
         engine_type, access_type, visibility, standalone_enabled, subscription_enabled,
         dp_enabled, ai_enabled, usage_profile, storage_profile, updated_at
       ) VALUES (
         $1,$2,$3,'BUNDLE','EBOOK','SBU_SKK',
         $4,$5,'IDR','ONE_TIME','ACTIVE','1.0.0',
         'STATIC_ASSET','DOWNLOAD',
         'STANDALONE_ONLY',true,false,true,true,'["AI_CHAT","DOCUMENT_ANALYSIS"]'::jsonb,'PRIVATE_DATABASE_OBJECT',now()
       )
       ON CONFLICT (product_id) DO UPDATE SET
         name=EXCLUDED.name, price=EXCLUDED.price, status=EXCLUDED.status,
         updated_at=now()`,
      [
        bundle.registryProductId,
        bundle.title,
        bundle.slug,
        `Ebook SBU-SKK 264 hal + Lampiran Toolkit 29 hal + Tutor AI 30 hari.`,
        bundle.amount,
      ],
    );

    // ── Seed product registry: AI Specialist ─────────────────────────────────
    await client.query(
      `INSERT INTO product_registry (
         product_id, name, slug, product_type, category, subcategory,
         short_description, price, currency, billing_type, status, version,
         engine_type, access_type, visibility, standalone_enabled, subscription_enabled,
         dp_enabled, ai_enabled, usage_profile, storage_profile, updated_at
       ) VALUES (
         $1,$2,$3,'AI_SPECIALIST','AI','SBU_SKK',
         $4,$5,'IDR','ONE_TIME','ACTIVE','1.0.0',
         'AI_AGENT','AGENT_ACCESS',
         'STANDALONE_ONLY',true,false,false,true,'["AI_CHAT","AGENT_EXECUTION"]'::jsonb,'NONE',now()
       )
       ON CONFLICT (product_id) DO UPDATE SET
         name=EXCLUDED.name, price=EXCLUDED.price, status=EXCLUDED.status,
         updated_at=now()`,
      [
        aiSpecialist.registryProductId,
        aiSpecialist.title,
        aiSpecialist.slug,
        `AI Specialist SBU-SKK (SBUClaw) — lisensi platform, hosted.`,
        aiSpecialist.licenseAmount,
      ],
    );

    // ── Seed sbu-skk-tutor agent ──────────────────────────────────────────────
    // Do not rename or clone sbuclaw-orchestrator.
    const existingTutor = await client.query<{ id: number }>(
      `SELECT id FROM agents WHERE slug=$1 LIMIT 1`,
      [TUTOR_AGENT_SLUG],
    );
    if (existingTutor.rows[0]) {
      await client.query(
        `UPDATE agents SET
           system_prompt=$1,
           name=$2,
           description=$3,
           tagline=$4,
           is_active=true,
           is_public=false,
           ai_model='gpt-4o',
           temperature=0.2,
           max_tokens=1500
         WHERE id=$5`,
        [
          TUTOR_SYSTEM_PROMPT,
          "Tutor AI SBU-SKK",
          "Tutor edukatif berbasis ebook SBU & SKK Tanpa Bingung. Menjawab dengan referensi bab/halaman.",
          "Tutor ebook SBU-SKK — referensi bab & halaman",
          existingTutor.rows[0].id,
        ],
      );
    } else {
      await client.query(
        `INSERT INTO agents (
           user_id, name, slug, description, tagline, system_prompt,
           avatar, is_active, is_public, ai_model, temperature, max_tokens,
           language, category, require_registration, greeting_message, created_at
         ) VALUES (
           '',$1,$2,$3,$4,$5,
           '📖',true,false,'gpt-4o',0.2,1500,
           'id','Edukasi',true,
           'Halo! Saya Tutor SBU-SKK — siap membantu Anda memahami ebook. Tanyakan bab atau topik yang ingin dipelajari.',
           now()
         )`,
        [
          "Tutor AI SBU-SKK",
          TUTOR_AGENT_SLUG,
          "Tutor edukatif berbasis ebook SBU & SKK Tanpa Bingung. Menjawab dengan referensi bab/halaman.",
          "Tutor ebook SBU-SKK — referensi bab & halaman",
          TUTOR_SYSTEM_PROMPT,
        ],
      );
    }

    // ── Reconcile real page-labelled source text from the private PDFs ──────
    await client.query(
      `DELETE FROM sbu_skk_tutor_sources
        WHERE source_title = ANY($1::text[])`,
      [TUTOR_SOURCES.map((source) => source.title)],
    );
    for (const row of tutorSourceRows) {
      await client.query(
        `INSERT INTO sbu_skk_tutor_sources (source_title, page_number, chunk_index, content, search_terms)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (source_title, page_number, chunk_index) DO UPDATE SET
           content=EXCLUDED.content,
           search_terms=EXCLUDED.search_terms`,
        [row.sourceTitle, row.pageNumber, row.chunkIndex, row.content, row.searchTerms],
      );
    }

    await client.query("COMMIT");
    console.log(
      `${new Date().toLocaleTimeString()} [Seed SBU-SKK Funnel] ready — lead asset, 3 registry products, tutor agent, ${tutorSourceRows.length} real PDF chunks`,
    );
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
