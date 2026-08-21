import { pool } from "../db";

export const DATABASE_OBJECT_PREFIX = "db-object:";

export type DatabaseDigitalProductFile = {
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  content: Buffer;
};

export function isDatabaseDigitalProductPath(downloadPath: string): boolean {
  return downloadPath.startsWith(DATABASE_OBJECT_PREFIX);
}

export function databaseStorageKey(downloadPath: string): string {
  if (!isDatabaseDigitalProductPath(downloadPath)) {
    throw new Error("[DigitalProductStorage] downloadPath bukan database object.");
  }
  const storageKey = downloadPath.slice(DATABASE_OBJECT_PREFIX.length).trim();
  if (!storageKey) {
    throw new Error("[DigitalProductStorage] storage key kosong.");
  }
  return storageKey;
}

export async function databaseDigitalProductExists(downloadPath: string): Promise<boolean> {
  const storageKey = databaseStorageKey(downloadPath);
  const result = await pool.query(
    `SELECT 1 FROM digital_product_files WHERE storage_key = $1 LIMIT 1`,
    [storageKey],
  );
  return result.rowCount === 1;
}

export async function readDatabaseDigitalProduct(
  downloadPath: string,
): Promise<DatabaseDigitalProductFile> {
  const storageKey = databaseStorageKey(downloadPath);
  const result = await pool.query<{
    storage_key: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    sha256: string;
    content: Buffer;
  }>(
    `SELECT storage_key, file_name, mime_type, size_bytes, sha256, content
       FROM digital_product_files
      WHERE storage_key = $1
      LIMIT 1`,
    [storageKey],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("[DigitalProductStorage] File privat tidak ditemukan.");
  }
  return {
    storageKey: row.storage_key,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    sha256: row.sha256,
    content: Buffer.isBuffer(row.content) ? row.content : Buffer.from(row.content),
  };
}