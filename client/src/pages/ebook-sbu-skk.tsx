import { FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { PAYMENT_BASE_URL } from "@/lib/payment-base";
import { SBU_SKK_EBOOK, SBU_SKK_FUNNEL } from "@/data/pricing";
import cover from "@assets/0_cover_Ebook_SBU-SKK_1787296306789.png";
import {
  ArrowRight,
  Check,
  FileCheck2,
  Headphones,
  Package,
  ShieldCheck,
} from "lucide-react";

type OrderKey = "tutor" | "bundle" | "ai-specialist";

type ManualOrder = {
  title: string;
  price: string;
  description: string;
  cta: string;
};

const manualOffers: Record<OrderKey, ManualOrder> = {
  bundle: {
    title: SBU_SKK_FUNNEL.bundle.title,
    price: SBU_SKK_FUNNEL.bundle.priceLabel,
    description: "Ebook, toolkit, dan Tutor AI selama 30 hari.",
    cta: "Pesan bundle via WhatsApp",
  },
  tutor: {
    title: SBU_SKK_FUNNEL.tutor.title,
    price: SBU_SKK_FUNNEL.tutor.addOnPriceLabel,
    description: "Pendamping edukatif 30 hari dengan 100 pesan dan rujukan halaman.",
    cta: "Pesan Tutor via WhatsApp",
  },
  "ai-specialist": {
    title: "AI Specialist SBU-SKK",
    price: SBU_SKK_FUNNEL.aiSpecialist.licensePriceLabel,
    description: `Lisensi sekali bayar. Premium hosting terpisah ${SBU_SKK_FUNNEL.aiSpecialist.hostingMonthlyLabel}.`,
    cta: "Tanyakan lisensi",
  },
};

export default function EbookSbuSkkPage() {
  const [order, setOrder] = useState<OrderKey | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", whatsappConsent: false });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const checkout = `${PAYMENT_BASE_URL}/c/checkout?variant_ids=${SBU_SKK_EBOOK.scalev.variantId}&qty=1`;

  useEffect(() => {
    document.title = `${SBU_SKK_EBOOK.title} | Gustafta`;
  }, []);

  function closeOrder() {
    if (submitting) return;
    setOrder(null);
    setError("");
  }

  async function submitManualOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order || submitting) return;

    if (form.phone.trim() && !form.whatsappConsent) {
      setError("Persetujuan WhatsApp diperlukan bila Anda mengisi nomor WhatsApp.");
      return;
    }

    setSubmitting(true);
    setError("");

    const buyer = {
      name: form.name.trim(),
      email: form.email.trim(),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      whatsappConsent: form.phone.trim() ? form.whatsappConsent : false,
    };

    try {
      const response = await fetch("/api/sbu-skk/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerKey: order, buyer }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.waOrderUrl) {
        throw new Error(payload.error || "Permintaan belum dapat dibuat.");
      }

      window.open(payload.waOrderUrl, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Permintaan belum dapat dibuat.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f3ea] text-[#1c2b2d]">
      <SharedHeader />
      <main>
        <section className="overflow-hidden bg-[#173f43] text-[#f7f3ea]">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1fr_.7fr] md:px-8 md:py-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#e8a83e]">
                Panduan kerja · SBU / SKK
              </p>
              <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold leading-[.95] tracking-[-.05em] md:text-7xl">
                {SBU_SKK_EBOOK.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#d5e3df]">
                {SBU_SKK_EBOOK.subtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                {[
                  `${SBU_SKK_EBOOK.pages} halaman ebook`,
                  `${SBU_SKK_EBOOK.toolkitPages} halaman toolkit`,
                  "Akses aman via email",
                ].map((item) => (
                  <span key={item} className="rounded-full border border-white/20 px-3 py-1.5">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 bg-[#e8a83e] px-7 font-bold text-[#1c2b2d] hover:bg-[#f3bc59]">
                  <a href={checkout} target="_blank" rel="noopener noreferrer">
                    Beli panduan — {SBU_SKK_EBOOK.priceLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-12 border-white/25 bg-transparent text-[#f7f3ea]">
                  <Link href="/mini-ebook-sbu-skk">Mulai dari ringkasan gratis</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 border-[#e8a83e]/60 bg-transparent text-[#e8a83e]">
                  <Link href={SBU_SKK_FUNNEL.readiness.landingPath}>
                    Cek kesiapan SBU
                  </Link>
                </Button>
              </div>
            </div>
            <img
              src={cover}
              alt={`Sampul ${SBU_SKK_EBOOK.title}`}
              className="mx-auto w-full max-w-sm rounded shadow-2xl shadow-black/30"
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {SBU_SKK_EBOOK.benefits.map((benefit) => (
              <div key={benefit} className="rounded-2xl border border-[#d8d5cb] bg-[#fbfaf6] p-6">
                <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-[#17727a] text-[#e8a83e]">
                  <Check className="h-5 w-5" />
                </div>
                <p className="font-semibold leading-relaxed">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-[#d8d5cb] bg-[#eee9dc] px-5 py-16">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#b07116]">Empat cara mulai</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold">
              Pilih kedalaman yang sesuai meja kerja Anda.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#e8a83e] bg-[#fbfaf6] p-6 md:col-span-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-xl font-bold">Ebook + Toolkit</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#637276]">
                      {SBU_SKK_EBOOK.pages} halaman panduan utama + toolkit {SBU_SKK_EBOOK.toolkitPages} halaman.
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-xl font-bold text-[#17727a]">{SBU_SKK_EBOOK.priceLabel}</p>
                </div>
                <Button asChild className="mt-6 bg-[#17727a]">
                  <a href={checkout} target="_blank" rel="noopener noreferrer">
                    Checkout Scalev <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
              {(Object.entries(manualOffers) as [OrderKey, ManualOrder][]).map(([key, offer]) => (
                <div key={key} className="rounded-2xl border border-[#d8d5cb] bg-[#fbfaf6] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-xl font-bold">{offer.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#637276]">{offer.description}</p>
                    </div>
                    <p className="shrink-0 font-display text-xl font-bold text-[#17727a]">{offer.price}</p>
                  </div>
                  <Button onClick={() => setOrder(key)} variant="outline" className="mt-6 border-[#17727a] text-[#17727a]">
                    {offer.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-16 text-center">
          <FileCheck2 className="mx-auto h-8 w-8 text-[#17727a]" />
          <h2 className="mt-4 font-display text-3xl font-bold">Dibuat untuk keputusan yang lebih tertib</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-[#637276]">
            Gunakan panduan sebagai rujukan kerja. Isinya bukan keputusan resmi LPJK, LSBU, atau otoritas;
            verifikasi selalu mengikuti ketentuan dan kanal resmi yang berlaku.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-semibold text-[#17727a]">
            <span><Package className="mr-1 inline h-4 w-4" />Produk digital</span>
            <span><Headphones className="mr-1 inline h-4 w-4" />Akses email</span>
            <span><ShieldCheck className="mr-1 inline h-4 w-4" />Checkout aman</span>
          </div>
        </section>
      </main>

      {order && (
        <div role="dialog" aria-modal="true" aria-labelledby="manual-order-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1c2b2d]/60 p-5">
          <form onSubmit={submitManualOrder} className="w-full max-w-md rounded-2xl bg-[#fbfaf6] p-7">
            <h2 id="manual-order-title" className="font-display text-2xl font-bold">Pesan melalui WhatsApp</h2>
            <p className="mt-2 text-sm text-[#637276]">
              Admin akan mengirim instruksi pembayaran untuk {manualOffers[order].title}.
            </p>
            <label htmlFor="manual-order-name" className="mt-5 block text-sm font-semibold">
              Nama
            </label>
            <input id="manual-order-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 w-full rounded-lg border border-[#d8d5cb] bg-white px-3 py-3 outline-none focus:ring-2 focus:ring-[#e8a83e]" />
            <label htmlFor="manual-order-email" className="mt-3 block text-sm font-semibold">
              Email
            </label>
            <input id="manual-order-email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5 w-full rounded-lg border border-[#d8d5cb] bg-white px-3 py-3 outline-none focus:ring-2 focus:ring-[#e8a83e]" />
            <label htmlFor="manual-order-phone" className="mt-3 block text-sm font-semibold">
              Nomor WhatsApp <span className="font-normal text-[#637276]">(opsional)</span>
            </label>
            <input id="manual-order-phone" type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1.5 w-full rounded-lg border border-[#d8d5cb] bg-white px-3 py-3 outline-none focus:ring-2 focus:ring-[#e8a83e]" />
            <label className="mt-3 flex items-start gap-2 text-xs text-[#637276]">
              <input type="checkbox" checked={form.whatsappConsent} onChange={(event) => setForm({ ...form, whatsappConsent: event.target.checked })} className="mt-0.5" />
              Jika saya mengisi nomor WhatsApp, saya setuju dihubungi untuk pesanan ini. Persetujuan ini hanya diperlukan bila nomor diisi.
            </label>
            <p aria-live="polite" className="mt-3 text-sm text-red-700">{error}</p>
            <div className="mt-5 flex gap-2">
              <Button type="button" variant="outline" disabled={submitting} onClick={closeOrder} className="flex-1">Batal</Button>
              <Button type="submit" disabled={submitting} className="flex-1 bg-[#17727a]">
                {submitting ? "Menyiapkan..." : "Lanjut ke WhatsApp"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}