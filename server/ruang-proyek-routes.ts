/**
 * Ruang Proyek — ruang kerja per proyek (login).
 * Menyatukan: dokumen (link ke Ruang Simpan), checklist administrasi,
 * costing & rugi-laba per proyek.
 *
 * SECURITY: isAuthenticated · ownership per user_id · Zod validation ·
 *           UUID guard · sanitized errors.
 */
import type { Express } from "express";
import { pool } from "./db";
import { isAuthenticated } from "./replit_integrations/auth";
import { z } from "zod";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractUid(req: any, res: any): string | null {
  const uid = req.user?.claims?.sub || req.user?.id || null;
  if (!uid) { res.status(401).json({ error: "Tidak terautentikasi" }); return null; }
  return String(uid);
}

function safeErr(res: any, e: unknown, ctx: string) {
  console.error(`[RuangProyek] ${ctx}:`, e);
  res.status(500).json({ error: "Terjadi kesalahan di server" });
}

const checklistItemSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(300),
  done: z.boolean(),
});

const costItemSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(300),
  type: z.enum(["biaya", "pendapatan"]),
  amount: z.number().finite().min(0).max(1e15),
});

const createSchema = z.object({
  name: z.string().trim().min(1, "Nama proyek wajib diisi").max(200),
  client: z.string().trim().max(200).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(["aktif", "selesai", "tertunda"]).optional(),
  contractValue: z.number().int().min(0).max(1e15).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

const patchSchema = createSchema.partial().extend({
  checklist: z.array(checklistItemSchema).max(200).optional(),
  costItems: z.array(costItemSchema).max(500).optional(),
  linkedFileIds: z.array(z.string().regex(UUID_RE)).max(200).optional(),
});

function mapRow(r: any) {
  // jsonb bisa saja tersimpan sebagai string (lihat memory jsonb-double-encoding) — normalisasi saat baca.
  const arr = (v: any) => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
  };
  return {
    id: r.id,
    name: r.name,
    client: r.client,
    location: r.location,
    description: r.description,
    status: r.status,
    contractValue: r.contract_value === null ? null : Number(r.contract_value),
    startDate: r.start_date,
    endDate: r.end_date,
    checklist: arr(r.checklist),
    costItems: arr(r.cost_items),
    linkedFileIds: arr(r.linked_file_ids),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// DDL idempotent — dijalankan saat boot (drizzle push dihindari di proyek ini).
async function ensureRuangProyekTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ruang_proyek_projects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id text NOT NULL,
      name text NOT NULL,
      client text,
      location text,
      description text,
      status text NOT NULL DEFAULT 'aktif',
      contract_value bigint,
      start_date date,
      end_date date,
      checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
      cost_items jsonb NOT NULL DEFAULT '[]'::jsonb,
      linked_file_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_ruang_proyek_user ON ruang_proyek_projects (user_id, created_at);
  `);
}

export function registerRuangProyekRoutes(app: Express) {
  ensureRuangProyekTable().catch((e) => console.error("[RuangProyek] ensure table failed:", e));
  // ── List proyek milik user ──
  app.get("/api/ruang-proyek/projects", isAuthenticated, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    try {
      const { rows } = await pool.query(
        `SELECT * FROM ruang_proyek_projects WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      res.json(rows.map(mapRow));
    } catch (e) { safeErr(res, e, "GET list"); }
  });

  // ── Buat proyek ──
  app.post("/api/ruang-proyek/projects", isAuthenticated, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Data tidak valid" });
    const d = parsed.data;
    try {
      const { rows } = await pool.query(
        `INSERT INTO ruang_proyek_projects (user_id, name, client, location, description, status, contract_value, start_date, end_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [userId, d.name, d.client ?? null, d.location ?? null, d.description ?? null, d.status ?? "aktif",
         d.contractValue ?? null, d.startDate ?? null, d.endDate ?? null]
      );
      res.status(201).json(mapRow(rows[0]));
    } catch (e) { safeErr(res, e, "POST create"); }
  });

  // ── Detail ──
  app.get("/api/ruang-proyek/projects/:id", isAuthenticated, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: "ID tidak valid" });
    try {
      const { rows } = await pool.query(
        `SELECT * FROM ruang_proyek_projects WHERE id = $1 AND user_id = $2`,
        [req.params.id, userId]
      );
      if (!rows[0]) return res.status(404).json({ error: "Proyek tidak ditemukan" });
      res.json(mapRow(rows[0]));
    } catch (e) { safeErr(res, e, "GET detail"); }
  });

  // ── Ubah (field parsial) ──
  app.patch("/api/ruang-proyek/projects/:id", isAuthenticated, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: "ID tidak valid" });
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Data tidak valid" });
    const d = parsed.data;

    const sets: string[] = [];
    const vals: any[] = [];
    const put = (col: string, v: any) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };

    if (d.name !== undefined) put("name", d.name);
    if (d.client !== undefined) put("client", d.client ?? null);
    if (d.location !== undefined) put("location", d.location ?? null);
    if (d.description !== undefined) put("description", d.description ?? null);
    if (d.status !== undefined) put("status", d.status);
    if (d.contractValue !== undefined) put("contract_value", d.contractValue ?? null);
    if (d.startDate !== undefined) put("start_date", d.startDate ?? null);
    if (d.endDate !== undefined) put("end_date", d.endDate ?? null);
    if (d.checklist !== undefined) put("checklist", JSON.stringify(d.checklist));
    if (d.costItems !== undefined) put("cost_items", JSON.stringify(d.costItems));
    if (d.linkedFileIds !== undefined) {
      // Anti-IDOR: setiap file yang dikaitkan harus milik user ini di Ruang Simpan.
      if (d.linkedFileIds.length > 0) {
        try {
          const { rows } = await pool.query(
            `SELECT id FROM ruang_simpan_files WHERE id = ANY($1::uuid[]) AND user_id = $2`,
            [d.linkedFileIds, userId]
          );
          if (rows.length !== new Set(d.linkedFileIds).size) {
            return res.status(400).json({ error: "Ada file yang tidak ditemukan di Ruang Simpan Anda" });
          }
        } catch (e) { return safeErr(res, e, "PATCH validate files"); }
      }
      put("linked_file_ids", JSON.stringify(d.linkedFileIds));
    }
    if (sets.length === 0) return res.status(400).json({ error: "Tidak ada perubahan" });
    sets.push(`updated_at = now()`);

    vals.push(req.params.id, userId);
    try {
      const { rows } = await pool.query(
        `UPDATE ruang_proyek_projects SET ${sets.join(", ")}
         WHERE id = $${vals.length - 1} AND user_id = $${vals.length} RETURNING *`,
        vals
      );
      if (!rows[0]) return res.status(404).json({ error: "Proyek tidak ditemukan" });
      res.json(mapRow(rows[0]));
    } catch (e) { safeErr(res, e, "PATCH update"); }
  });

  // ── Hapus ──
  app.delete("/api/ruang-proyek/projects/:id", isAuthenticated, async (req: any, res) => {
    const userId = extractUid(req, res);
    if (!userId) return;
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: "ID tidak valid" });
    try {
      const { rowCount } = await pool.query(
        `DELETE FROM ruang_proyek_projects WHERE id = $1 AND user_id = $2`,
        [req.params.id, userId]
      );
      if (!rowCount) return res.status(404).json({ error: "Proyek tidak ditemukan" });
      res.json({ ok: true });
    } catch (e) { safeErr(res, e, "DELETE"); }
  });
}
