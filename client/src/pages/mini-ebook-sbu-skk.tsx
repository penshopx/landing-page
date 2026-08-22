import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { SBU_SKK_FUNNEL } from "@/data/pricing";
import { ArrowRight, Check, FileText, LockKeyhole, ShieldCheck } from "lucide-react";

export default function MiniEbookSbuSkk() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", consent: false });
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    if (form.whatsapp.trim() && !form.consent) {
      setError("Persetujuan WhatsApp diperlukan bila Anda mengisi nomor WhatsApp.");
      setState("error");
      return;
    }
    setState("loading");
    setError("");
    try {
      const r = await fetch("/api/sbu-skk/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: form.name, email: form.email, whatsapp: form.whatsapp || undefined, whatsappConsent: form.consent,
        landingPath: window.location.pathname, referrer: document.referrer || undefined,
      })});
      const json = await r.json().catch(() => ({}));
      if (!r.ok || !json.success) throw new Error(json.error || "Formulir belum dapat dikirim.");
      if (json.accessUrl) navigate(json.accessUrl); else setState("success");
    } catch (e) { setError(e instanceof Error ? e.message : "Terjadi kesalahan."); setState("error"); }
  }
  return <div className="min-h-[100dvh] bg-[#f7f3ea] text-[#1c2b2d]"><SharedHeader />
    <main>
      <section className="relative overflow-hidden bg-[#173f43] text-[#f7f3ea]">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-[#e8a83e]/20 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.1fr_.9fr] md:px-8 md:py-24">
          <div className="relative z-10 animate-panel-in"><p className="text-xs font-bold uppercase tracking-[.24em] text-[#e8a83e]">Field guide · akses gratis</p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[.98] tracking-[-.05em] md:text-7xl">{SBU_SKK_FUNNEL.miniEbook.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#d5e3df]">{SBU_SKK_FUNNEL.miniEbook.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">{["20 halaman", "Ringkasan praktis", "Akses 30 hari"].map(x => <span key={x} className="rounded-full border border-[#d5e3df]/25 px-3 py-1.5 text-sm">{x}</span>)}</div>
          </div>
          {state==="success" ? <div className="relative z-10 rounded-2xl border border-white/15 bg-[#f7f3ea] p-8 text-[#1c2b2d] shadow-2xl"><ShieldCheck className="h-10 w-10 text-[#17727a]"/><h2 className="mt-5 font-display text-2xl font-bold">Cek inbox Anda</h2><p className="mt-3 text-sm leading-relaxed text-[#637276]">Tautan akses Mini Ebook telah dikirim ke email yang Anda daftarkan. Jika belum terlihat, periksa folder promosi atau spam.</p><Link href="/ebook-sbu-skk" className="mt-6 inline-flex items-center font-bold text-[#17727a]">Lanjut ke panduan lengkap <ArrowRight className="ml-2 h-4 w-4"/></Link></div> : <form onSubmit={submit} className="relative z-10 rounded-2xl border border-white/15 bg-[#f7f3ea] p-6 text-[#1c2b2d] shadow-2xl md:p-8" aria-label="Form akses Mini Ebook">
            <div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-[#e8a83e] p-3"><FileText className="h-5 w-5" /></div><div><p className="font-display text-xl font-bold">Kirim ke email saya</p><p className="text-sm text-[#637276]">Tanpa kartu. Tanpa komitmen.</p></div></div>
            <label className="mb-4 block text-sm font-semibold">Nama<input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="mt-1.5 w-full rounded-lg border border-[#cbd1ca] bg-white px-3 py-3 outline-none focus:ring-2 focus:ring-[#e8a83e]" /></label>
            <label className="mb-4 block text-sm font-semibold">Email kerja<input required type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} className="mt-1.5 w-full rounded-lg border border-[#cbd1ca] bg-white px-3 py-3 outline-none focus:ring-2 focus:ring-[#e8a83e]" /></label>
            <label className="mb-4 block text-sm font-semibold">WhatsApp <span className="font-normal text-[#637276]">(opsional)</span><input value={form.whatsapp} onChange={e => setForm({...form,whatsapp:e.target.value})} className="mt-1.5 w-full rounded-lg border border-[#cbd1ca] bg-white px-3 py-3 outline-none focus:ring-2 focus:ring-[#e8a83e]" /></label>
             <label className="mb-5 flex items-start gap-2 text-xs text-[#637276]"><input type="checkbox" checked={form.consent} onChange={e=>setForm({...form,consent:e.target.checked})} className="mt-0.5" /> Jika saya mengisi nomor WhatsApp, saya setuju dihubungi terkait akses dan informasi produk Gustafta. Persetujuan ini hanya diperlukan bila nomor diisi.</label>
             {error && <p role="alert" aria-live="polite" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button disabled={state==="loading"} className="h-12 w-full bg-[#e8a83e] font-bold text-[#1c2b2d] hover:bg-[#f3bc59]">{state==="loading" ? "Mengirim..." : "Dapatkan Mini Ebook"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-[#637276]"><LockKeyhole className="h-3.5 w-3.5" /> Email hanya untuk pengiriman akses.</p>
          </form>}
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3 md:px-8"><div className="md:col-span-2"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#b07116]">Mulai dari peta</p><h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">Kenali simpulnya sebelum merapikan berkas.</h2><p className="mt-5 max-w-2xl leading-relaxed text-[#637276]">Mini Ebook membantu Anda melihat gambaran transisi SBU-SKK, istilah penting, dan titik cek yang paling sering terlewat. Ini ringkasan untuk orientasi, bukan pengganti panduan lengkap.</p></div><div className="space-y-3">{["Peta masalah SBU-SKK", "Daftar cek awal", "Arah menuju panduan lengkap"].map(x=><div key={x} className="flex gap-3 rounded-xl border border-[#d8d5cb] bg-[#fbfaf6] p-4"><Check className="h-5 w-5 shrink-0 text-[#17727a]" /> <span className="font-semibold">{x}</span></div>)}</div></section>
      <section className="border-t border-[#d8d5cb] bg-[#eee9dc] px-5 py-12 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-[#17727a]" /><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#637276]">Materi ini bersifat edukatif. Proses resmi tetap mengikuti ketentuan instansi dan lembaga berwenang.</p><Link href="/ebook-sbu-skk" className="mt-5 inline-flex items-center font-bold text-[#17727a]">Lihat panduan lengkap <ArrowRight className="ml-2 h-4 w-4" /></Link></section>
    </main>
  </div>;
}