import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendPromotionEvent } from "@/lib/promotion-attribution";

type Placement = "homepage" | "store";
type CanonicalKind = "product" | "package";
type CampaignItem = {
  canonicalKind: CanonicalKind;
  canonicalId: string | number;
  role: "primary" | "support";
  name: string;
  description?: string;
  price: number;
  currency: string;
  ctaUrl: string;
};
type Campaign = { id: string | number; hook?: string; items: CampaignItem[] };

export default function PromotionCheckoutPage() {
  const { toast } = useToast();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const campaignId = params.get("campaign_id") ?? "";
  const promotionEventId = params.get("promotion_event_id") ?? "";
  const placement = params.get("placement") as Placement;
  const canonicalKind = params.get("kind") as CanonicalKind;
  const canonicalId = params.get("id") ?? "";
  const validParams = !!campaignId && !!promotionEventId
    && (placement === "homepage" || placement === "store")
    && (canonicalKind === "product" || canonicalKind === "package")
    && !!canonicalId;

  const { data, isLoading } = useQuery<{ campaign: Campaign | null }>({
    queryKey: ["/api/promotions/active", placement, campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/promotions/active?placement=${placement}`, { credentials: "include" });
      if (!response.ok) throw new Error("Kampanye tidak tersedia.");
      return response.json();
    },
    enabled: validParams,
    retry: false,
  });
  const campaign = data?.campaign;
  const item = campaign?.id != null && String(campaign.id) === campaignId
    ? campaign.items.find((candidate) =>
      candidate.canonicalKind === canonicalKind && String(candidate.canonicalId) === canonicalId)
    : undefined;

  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [orderRef, setOrderRef] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!item) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/promotions/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          promotionEventId,
          placement,
          canonicalKind,
          canonicalId,
          buyer,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || result.error || "Pesanan belum dapat dibuat.");

      sendPromotionEvent({
        campaignId,
        placement,
        eventType: "lead",
        item: { canonicalKind, canonicalId },
      });
      setOrderRef(String(result.order_ref ?? ""));
      const nextUrl = result.payment_url || result.wa_order_url;
      if (nextUrl) window.location.assign(nextUrl);
    } catch (error: any) {
      toast({
        title: "Pesanan belum diproses",
        description: error?.message || "Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SharedHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <Link href={placement === "store" ? "/store" : "/"} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>
        ) : !validParams || !item ? (
          <Card data-testid="promotion-checkout-unavailable">
            <CardContent className="py-12 text-center">
              <h1 className="text-2xl font-bold">Penawaran tidak tersedia</h1>
              <p className="mt-2 text-muted-foreground">Kampanye sudah berakhir atau solusi tidak lagi memenuhi syarat.</p>
              <Button asChild className="mt-6"><Link href="/store">Lihat Store</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_.9fr]" data-testid="promotion-checkout">
            <Card className="border-indigo-200">
              <CardHeader>
                <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  <ShieldCheck className="h-4 w-4" /> Harga & identitas diverifikasi server
                </div>
                <CardTitle className="text-2xl">{item.name}</CardTitle>
                {campaign?.hook && <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{campaign.hook}</p>}
              </CardHeader>
              <CardContent className="space-y-4">
                {item.description && <p className="leading-relaxed text-muted-foreground">{item.description}</p>}
                <p className="text-3xl font-bold">{formatPrice(item.price, item.currency || "IDR")}</p>
                <a href={item.ctaUrl} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                  Lihat detail resmi <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Data pemesan</CardTitle></CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={submit}>
                  <div className="space-y-2">
                    <Label htmlFor="promotion-name">Nama lengkap</Label>
                    <Input id="promotion-name" required maxLength={120} value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promotion-email">Email</Label>
                    <Input id="promotion-email" type="email" required maxLength={200} value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promotion-phone">Nomor WhatsApp</Label>
                    <Input id="promotion-phone" inputMode="tel" maxLength={30} value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} />
                  </div>
                  <Button className="w-full bg-indigo-700 hover:bg-indigo-800" type="submit" disabled={submitting} data-testid="promotion-checkout-submit">
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Buat pesanan aman
                  </Button>
                  {orderRef && <p className="text-center text-xs text-muted-foreground">Referensi: {orderRef}</p>}
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}