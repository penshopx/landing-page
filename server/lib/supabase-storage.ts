/**
 * Supabase Storage helper — server-side only.
 * Generates signed URLs for private bucket objects.
 * NEVER import this from client-side code; service role key lives here.
 */

/**
 * Resolve a download_path to a usable URL.
 * - If download_path is already a full URL (http/https), return it directly.
 *   This supports Google Drive, Dropbox, or any external host as delivery.
 * - Otherwise treat it as a Supabase Storage bucket path and generate a signed URL.
 */
/**
 * True when the download_path is already a full external URL (Google Drive,
 * Dropbox, etc.) that resolveDownloadUrl passes through unchanged. Such links
 * are permanent — no expiry applies.
 */
export function isExternalDownloadUrl(downloadPath: string): boolean {
  return downloadPath.startsWith("http://") || downloadPath.startsWith("https://");
}

export async function resolveDownloadUrl(
  downloadPath: string,
  expiresInSeconds = 86_400,
): Promise<string> {
  if (isExternalDownloadUrl(downloadPath)) {
    return downloadPath;
  }
  return generateSignedDownloadUrl(downloadPath, expiresInSeconds);
}

const BUCKET = "digital-products";

/**
 * Generate a signed download URL for a private Supabase Storage object.
 * @param path  Object path inside the bucket, e.g. "OSS/Template-SPTJM-OSS.docx"
 * @param expiresInSeconds  Link lifetime in seconds (default 86400 = 24 h)
 * @returns Full signed URL the buyer can use to download the file
 */
export async function generateSignedDownloadUrl(
  path: string,
  expiresInSeconds = 86_400,
): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "[SupabaseStorage] SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.",
    );
  }

  // POST /storage/v1/object/sign/<bucket>/<path>
  const endpoint = `${supabaseUrl}/storage/v1/object/sign/${BUCKET}/${path}`;

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: expiresInSeconds }),
  });

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "");
    throw new Error(
      `[SupabaseStorage] Gagal membuat signed URL: HTTP ${resp.status} — ${errBody.slice(0, 300)}`,
    );
  }

  const json = await resp.json();
  // Supabase returns { signedURL: "/storage/v1/object/sign/..." }
  const signedPath: string = json.signedURL || json.signedUrl || "";
  if (!signedPath) {
    throw new Error("[SupabaseStorage] Supabase tidak mengembalikan signedURL.");
  }

  // signedPath already starts with /storage/v1/... — prepend base URL
  return `${supabaseUrl}${signedPath}`;
}
