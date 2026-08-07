/**
 * Supabase Storage helper — server-side only.
 * Generates signed URLs for private bucket objects.
 * NEVER import this from client-side code; service role key lives here.
 */

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
