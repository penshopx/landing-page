import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPromotionEventId, sendPromotionEvent } from "@/lib/promotion-attribution";

type CampaignItem = {
  canonicalKind: "product" | "package";
  canonicalId: string | number;
  role: "primary" | "support";
  name?: string;
  description?: string;
  category?: string;
  type?: string;
  price?: number;
  currency?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  ctaEvent?: "trial" | "lead";
  eligibility?: string;
  snapshot?: Record<string, unknown>;
  current?: Record<string, unknown>;
};
type Campaign = { id: string | number; hook?: string; ctaLabel?: string; selectionReason?: string; items?: CampaignItem[] };

const value = (item: CampaignItem, key: keyof CampaignItem) =>
  item[key] ?? item.current?.[key as string] ?? item.snapshot?.[key as string];

export function PromotionCampaign({ placement }: { placement: "homepage" | "store" }) {
  const { data } = useQuery<Campaign | { campaign?: Campaign } | null>({
    queryKey: ["/api/promotions/active", placement],
    queryFn: async () => {
      const res = await fetch(`/api/promotions/active?placement=${placement}`, { credentials: "include" });
      if (!res.ok) throw new Error("Campaign unavailable");
      return res.json();
    },
    retry: false,
  });
  const campaign = (data && "campaign" in data ? data.campaign : data) as Campaign | null | undefined;
  const items = useMemo(() => campaign?.items ?? [], [campaign]);
  const primary = items.find((item) => item.role === "primary");
  const support = items.filter((item) => item.role === "support");
  const checkoutEventId = useMemo(
    () => campaign && primary ? createPromotionEventId() : "",
    [campaign?.id, primary?.canonicalKind, primary?.canonicalId],
  );

  useEffect(() => {
    if (!campaign || !primary) return;
    const item = { canonicalKind: primary.canonicalKind, canonicalId: primary.canonicalId };
    const impressionKey = `gustafta_promotion_impression_${campaign.id}_${placement}`;
    const visitKey = `gustafta_promotion_visit_${campaign.id}_${placement}`;
    const returnSessionKey = `gustafta_promotion_return_${campaign.id}_${placement}`;
    try {
      if (!localStorage.getItem(impressionKey)) {
        sendPromotionEvent({ campaignId: campaign.id, placement, eventType: "impression", item });
        localStorage.setItem(impressionKey, "1");
      }
      if (localStorage.getItem(visitKey) && !sessionStorage.getItem(returnSessionKey)) {
        sendPromotionEvent({ campaignId: campaign.id, placement, eventType: "return_visit", item });
        sessionStorage.setItem(returnSessionKey, "1");
      }
      localStorage.setItem(visitKey, new Date().toISOString());
    } catch {
      sendPromotionEvent({ campaignId: campaign.id, placement, eventType: "impression", item });
    }
  }, [campaign, placement, primary]);

  if (!campaign || !primary) return <div className="hidden" data-testid={`promotion-fallback-${placement}`} />;
  const primaryName = String(value(primary, "name") ?? "Solusi pilihan");
  const primaryDescription = String(value(primary, "description") ?? "");
  const url = String(value(primary, "ctaUrl") ?? "/store");
  const price = value(primary, "price");
  const currency = String(value(primary, "currency") ?? "IDR");
  const priceText = typeof price === "number" ? new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(price) : null;
  const isPaid = typeof price === "number" && price > 0;
  const checkoutUrl = isPaid
    ? `/promotion-checkout?${new URLSearchParams({
      campaign_id: String(campaign.id),
      promotion_event_id: checkoutEventId,
      placement,
      kind: primary.canonicalKind,
      id: String(primary.canonicalId),
    }).toString()}`
    : url;

  return (
    <section className="px-4 py-10 bg-[radial-gradient(circle_at_8%_10%,rgba(99,102,241,.18),transparent_32%),linear-gradient(115deg,#eef2ff,#f8fafc_58%,#e0e7ff)] dark:bg-none dark:bg-slate-950" data-testid={`promotion-campaign-${placement}`}>
      <div className="max-w-5xl mx-auto rounded-2xl border border-indigo-200/80 bg-card/85 backdrop-blur shadow-[0_18px_45px_-30px_rgba(49,46,129,.65)] overflow-hidden">
        <div className="grid md:grid-cols-[1.45fr_.8fr]">
          <div className="p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-indigo-700 dark:text-indigo-300"><Sparkles className="h-3.5 w-3.5" /> Pilihan untuk kebutuhan Anda</div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{campaign.hook || primaryName}</h2>
            {campaign.hook && <p className="mt-2 text-base font-semibold text-indigo-700 dark:text-indigo-300">{primaryName}</p>}
            {primaryDescription && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{primaryDescription}</p>}
            {campaign.selectionReason && <p className="mt-4 border-l-2 border-indigo-400 pl-3 text-sm text-slate-600 dark:text-slate-300">{campaign.selectionReason}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild className="bg-indigo-700 hover:bg-indigo-800 text-white" data-testid={`promotion-cta-${placement}`}>
                <a href={checkoutUrl} onClick={() => {
                  const item = { canonicalKind: primary.canonicalKind, canonicalId: primary.canonicalId };
                  sendPromotionEvent({ campaignId: campaign.id, placement, eventType: "click", item, eventId: checkoutEventId });
                  if (!isPaid && primary.ctaEvent) {
                    sendPromotionEvent({ campaignId: campaign.id, placement, eventType: primary.ctaEvent, item });
                  }
                }}>{isPaid ? "Pesan sekarang" : String(value(primary, "ctaLabel") ?? campaign.ctaLabel ?? "Lihat solusi")}<ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
              {isPaid && <a href={url} className="text-sm font-semibold text-indigo-700 underline-offset-4 hover:underline dark:text-indigo-300">Lihat detail resmi</a>}
              {priceText && <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{priceText}</span>}
            </div>
          </div>
          <aside className="border-t md:border-t-0 md:border-l border-indigo-100 bg-indigo-50/65 p-6 dark:bg-indigo-950/30 dark:border-indigo-900">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Dipertimbangkan bersama</p>
            <div className="mt-4 space-y-3">
              {support.length ? support.map((item) => <div key={`${item.canonicalKind}-${item.canonicalId}`} className="flex gap-2 text-sm text-slate-700 dark:text-slate-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" /><span>{String(value(item, "name") ?? "Solusi pendukung")}</span></div>) : <p className="text-sm leading-relaxed text-slate-500">Satu rekomendasi yang jelas, tanpa pilihan yang mengaburkan keputusan.</p>}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}