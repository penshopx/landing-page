// Notifikasi WA internal via Fonnte — untuk briefing/alert ke nomor founder.
// Token diambil dari secret FONNTE_API_TOKEN (fallback FONNTE_API_KEY),
// nomor tujuan dari env NOTIFICATION_PHONE.

export interface FonnteNotifyResult {
  sent: boolean;
  reason?: string;
}

export async function sendFonnteNotification(message: string, target?: string): Promise<FonnteNotifyResult> {
  const token = process.env.FONNTE_API_TOKEN || process.env.FONNTE_API_KEY;
  const phone = target || process.env.NOTIFICATION_PHONE;

  if (!token) return { sent: false, reason: "FONNTE_API_TOKEN belum diset" };
  if (!phone) return { sent: false, reason: "NOTIFICATION_PHONE belum diset" };

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token },
      body: new URLSearchParams({ target: phone, message, countryCode: "62" }),
    });
    const json = (await res.json()) as { status?: boolean; reason?: string };
    if (json.status) return { sent: true };
    return { sent: false, reason: json.reason || `HTTP ${res.status}` };
  } catch (err) {
    return { sent: false, reason: (err as Error).message };
  }
}
