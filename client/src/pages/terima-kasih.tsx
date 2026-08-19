import { Link } from "wouter";
import {
  BookOpen,
  Bot,
  CheckCircle2,
  LogIn,
  Mail,
  MessageCircle,
} from "lucide-react";
import { useContactNumbers } from "@/lib/contact";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function TerimaKasihPage() {
  const contact = useContactNumbers();
  const waUrl =
    `https://wa.me/${contact.secondary}` +
    "?text=Halo%20Gustafta%2C%20saya%20sudah%20melakukan%20pembayaran%20produk%20digital.%20Mohon%20bantu%20cek%20pesanan%20saya.";

  return (
    <main
      className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 px-4 py-12 sm:py-20"
      data-testid="page-terima-kasih"
    >
      <Card className="mx-auto max-w-2xl overflow-hidden border-emerald-100 bg-white text-slate-900 shadow-xl shadow-emerald-950/5">
        <div className="bg-emerald-600 px-6 py-8 text-center text-white sm:px-10">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold sm:text-3xl">
            Terima kasih, pesanan Anda sudah kami terima
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-emerald-50 sm:text-base">
            Sistem akan memproses produk sesuai konfirmasi pembayaran dari Scalev.
          </p>
        </div>

        <CardContent className="space-y-7 p-6 sm:p-10">
          <section aria-labelledby="next-steps-title">
            <h2 id="next-steps-title" className="text-lg font-bold text-slate-900">
              Langkah berikutnya
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <BookOpen className="mb-3 h-7 w-7 text-emerald-600" aria-hidden="true" />
                <h3 className="font-bold text-slate-900">Ebook atau paket ebook</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Link akses akan dikirim ke email yang digunakan saat checkout.
                  Periksa juga folder Spam atau Promosi.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <Bot className="mb-3 h-7 w-7 text-emerald-600" aria-hidden="true" />
                <h3 className="font-bold text-slate-900">Paket dengan AI Specialist</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Masuk atau daftar memakai email pembelian. Akses AI akan tampil
                  setelah pembayaran selesai dikonfirmasi.
                </p>
              </div>
            </div>
          </section>

          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <Mail className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              Simpan bukti pembayaran. Jika akses belum diterima, hubungi kami dan
              sertakan nama serta email yang digunakan saat checkout.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/login" data-testid="button-login-gustafta">
                <LogIn className="mr-2 h-5 w-5" aria-hidden="true" />
                Masuk ke Gustafta
              </Link>
            </Button>

            <Button asChild size="lg" variant="outline">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-whatsapp-support"
              >
                <MessageCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                Bantuan WhatsApp
              </a>
            </Button>
          </div>

          <p className="text-center text-xs leading-5 text-slate-500">
            Halaman ini tidak menentukan status transaksi. Status pembayaran
            mengikuti konfirmasi resmi dari Scalev.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}