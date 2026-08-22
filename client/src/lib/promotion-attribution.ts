type PromotionPlacement = "homepage" | "store";
type PromotionEventType = "impression" | "click" | "search" | "trial" | "lead" | "return_visit";

type PromotionItemIdentity = {
  canonicalKind: "product" | "package";
  canonicalId: string | number;
};

let memorySessionId = "";

function randomOpaqueId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
  return `${prefix}-${random}`.slice(0, 79);
}

export function createPromotionEventId(): string {
  return randomOpaqueId("event");
}

export function getPromotionSessionId(): string {
  if (memorySessionId) return memorySessionId;

  const key = "gustafta_promotion_session";
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      memorySessionId = stored;
      return stored;
    }
    memorySessionId = randomOpaqueId("visitor");
    localStorage.setItem(key, memorySessionId);
    return memorySessionId;
  } catch {
    memorySessionId = randomOpaqueId("visitor");
    return memorySessionId;
  }
}

export function sendPromotionEvent(input: {
  campaignId?: string | number | null;
  placement: PromotionPlacement;
  eventType: PromotionEventType;
  item?: PromotionItemIdentity;
  searchQuery?: string;
  eventId?: string;
}): string {
  const eventId = input.eventId ?? createPromotionEventId();
  void fetch("/api/promotions/events", {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId,
      campaignId: input.campaignId ?? null,
      placement: input.placement,
      eventType: input.eventType,
      sessionId: getPromotionSessionId(),
      canonicalKind: input.item?.canonicalKind,
      canonicalId: input.item?.canonicalId,
      searchQuery: input.searchQuery,
    }),
  }).catch(() => undefined);
  return eventId;
}

export async function trackStoreSearch(searchQuery: string): Promise<void> {
  const query = searchQuery.trim();
  if (!query) return;

  let campaign: any = null;
  try {
    const response = await fetch("/api/promotions/active?placement=store", {
      credentials: "include",
    });
    if (response.ok) campaign = (await response.json())?.campaign ?? null;
  } catch {
    // Search demand still remains useful without campaign attribution.
  }

  const primary = campaign?.items?.find((item: any) => item?.role === "primary");
  sendPromotionEvent({
    campaignId: campaign?.id ?? null,
    placement: "store",
    eventType: "search",
    item: primary
      ? { canonicalKind: primary.canonicalKind, canonicalId: primary.canonicalId }
      : undefined,
    // Sent only to the classifier; the server never persists this raw value.
    searchQuery: query.slice(0, 300),
  });
}