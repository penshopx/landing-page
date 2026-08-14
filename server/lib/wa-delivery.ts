// WA (Fonnte) delivery helper with EXPLICIT failure logging.
//
// Latar: beberapa blok fire-and-forget WA di routes memakai pola
// `fetch(...).catch(() => {})` — kegagalan Fonnte hilang tanpa jejak di log.
// Untuk pengiriman yang penting (order/lead/permintaan biro jasa), kegagalan
// harus SELALU tercatat dengan prefix yang mudah dicari: `[WA] Delivery failed`.
//
// Fungsi ini tidak pernah melempar (aman untuk fire-and-forget) dan
// mengembalikan hasil terstruktur bagi pemanggil yang ingin bereaksi.

export interface WaDeliveryResult {
  sent: boolean;
  reason?: string;
}

export const WA_FAILURE_LOG_PREFIX = "[WA] Delivery failed";

export async function sendWaMessage(opts: {
  /** Nomor tujuan (format apapun yang diterima Fonnte). */
  target: string;
  /** Isi pesan WA. */
  message: string;
  /** Token Fonnte; default dari FONNTE_API_TOKEN / FONNTE_API_KEY. */
  token?: string;
  /** Konteks untuk log, mis. `order scalev_123` atau `lead 45`. */
  context: string;
  /** Kode negara Fonnte (default "62"). */
  countryCode?: string;
  /** Injeksi fetch untuk pengujian. */
  fetchImpl?: typeof fetch;
  /** Injeksi logger untuk pengujian (default console.error). */
  logError?: (msg: string) => void;
}): Promise<WaDeliveryResult> {
  const token = opts.token || process.env.FONNTE_API_TOKEN || process.env.FONNTE_API_KEY;
  const doFetch = opts.fetchImpl || fetch;
  const logError = opts.logError || ((msg: string) => console.error(msg));

  const fail = (reason: string): WaDeliveryResult => {
    logError(`${WA_FAILURE_LOG_PREFIX} for ${opts.context}: ${reason}`);
    return { sent: false, reason };
  };

  if (!token) return fail("FONNTE_API_TOKEN/FONNTE_API_KEY belum dikonfigurasi");
  if (!opts.target) return fail("nomor tujuan kosong");

  try {
    const res = await doFetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token },
      body: new URLSearchParams({
        target: opts.target,
        message: opts.message,
        countryCode: opts.countryCode ?? "62",
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { status?: boolean; reason?: string };
    if (res.ok && json.status === true) return { sent: true };
    return fail(json.reason || `HTTP ${res.status}`);
  } catch (err: any) {
    return fail(err?.message || "unknown fetch error");
  }
}
