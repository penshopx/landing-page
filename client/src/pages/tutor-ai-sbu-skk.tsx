import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { SharedHeader } from "@/components/shared-header";
import { Button } from "@/components/ui/button";
import { SBU_SKK_EBOOK, SBU_SKK_FUNNEL } from "@/data/pricing";
import { ArrowLeft, BookOpen, Clock3, Send, ShieldAlert } from "lucide-react";

type Status = {
  entitled: boolean;
  status: string;
  expiresAt?: string;
  quotaUsed: number;
  quotaTotal: number;
  agentId: number | null;
};

type Citation = {
  source: string;
  page: number | string;
};

type Message = {
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
};

export default function TutorAiSbuSkk() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  async function refreshStatus() {
    const response = await fetch("/api/sbu-skk/tutor/status", { credentials: "include" });

    if (response.status === 401) {
      setError("login");
      return;
    }
    if (!response.ok) {
      throw new Error("Status Tutor belum tersedia.");
    }

    setStatus(await response.json());
  }

  useEffect(() => {
    refreshStatus()
      .catch((statusError) => setError(statusError instanceof Error ? statusError.message : "Status Tutor belum tersedia."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim() || streaming || !status?.agentId) return;

    const text = input.trim();
    let fullText = "";
    let citations: Citation[] = [];
    setInput("");
    setMessages((current) => [...current, { role: "user", text }, { role: "assistant", text: "" }]);
    setStreaming(true);

    const updateAssistant = (updates: Partial<Message>) => {
      setMessages((current) => {
        const next = [...current];
        const last = next.length - 1;
        next[last] = { ...next[last], ...updates };
        return next;
      });
    };

    try {
      const response = await fetch("/api/messages/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agentId: String(status.agentId),
          role: "user",
          content: text,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Respons Tutor tidak dapat dimuat.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;

        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const streamEvent = JSON.parse(line.slice(6));

            if (streamEvent.type === "chunk") {
              fullText += streamEvent.content || "";
              updateAssistant({ text: fullText });
            }

            if (streamEvent.type === "citations" && Array.isArray(streamEvent.citations)) {
              citations = streamEvent.citations.filter(
                (citation: Citation) => citation?.source && citation?.page !== undefined,
              );
              updateAssistant({ citations });
            }

            if (streamEvent.type === "complete") {
              fullText = streamEvent.message?.content || fullText;
              const completedCitations = Array.isArray(streamEvent.message?.citations)
                ? streamEvent.message.citations
                : Array.isArray(streamEvent.citations)
                  ? streamEvent.citations
                  : citations;

              citations = completedCitations.filter(
                (citation: Citation) => citation?.source && citation?.page !== undefined,
              );
              updateAssistant({ text: fullText, citations });
            }
          } catch {
            // Ignore malformed SSE payloads while preserving the streamed response.
          }
        }
      }
    } catch (sendError) {
      updateAssistant({
        text: sendError instanceof Error ? sendError.message : "Terjadi kesalahan.",
      });
    } finally {
      setStreaming(false);
      refreshStatus().catch(() => {
        // The completed response remains visible even if quota refresh is temporarily unavailable.
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#f7f3ea]">
        <SharedHeader />
        <main className="mx-auto max-w-2xl px-5 py-24">
          <div className="h-7 w-2/3 animate-pulse rounded bg-[#d8d5cb]" />
          <div className="mt-4 h-32 animate-pulse rounded bg-[#e8e1d2]" />
        </main>
      </div>
    );
  }

  if (error === "login") {
    return (
      <div className="min-h-[100dvh] bg-[#f7f3ea]">
        <SharedHeader />
        <main className="mx-auto max-w-xl px-5 py-24 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-[#b07116]" />
          <h1 className="mt-5 font-display text-4xl font-bold">Masuk untuk memakai Tutor</h1>
          <p className="mt-4 text-[#637276]">Akses Tutor terhubung dengan akun dan entitlement pembelian Anda.</p>
          <Button asChild className="mt-7 bg-[#17727a]">
            <Link href="/login">Masuk ke Gustafta</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (!status?.entitled) {
    return (
      <div className="min-h-[100dvh] bg-[#f7f3ea]">
        <SharedHeader />
        <main className="mx-auto max-w-5xl px-5 py-16 md:py-24">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#b07116]">Pendamping belajar SBU-SKK</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-none md:text-7xl">
            Tanya isi panduan. Dapatkan arah kerja.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#637276]">
            {SBU_SKK_FUNNEL.tutor.title} membantu menjelaskan isi ebook dan toolkit dengan rujukan halaman.
            Bukan keputusan resmi LPJK, LSBU, atau otoritas.
          </p>
          <div className="mt-10 rounded-2xl border border-[#d8d5cb] bg-[#fbfaf6] p-7 md:max-w-md">
            <p className="font-display text-2xl font-bold">{SBU_SKK_FUNNEL.tutor.addOnPriceLabel}</p>
            <p className="mt-1 text-sm text-[#637276]">30 hari · 100 pesan</p>
            <Button asChild className="mt-6 w-full bg-[#e8a83e] font-bold text-[#1c2b2d]">
              <Link href="/ebook-sbu-skk">Lihat cara memesan</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const remaining = status.quotaTotal - status.quotaUsed;

  return (
    <div className="min-h-[100dvh] bg-[#173f43] text-[#f7f3ea]">
      <header className="border-b border-white/10 px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href="/ebook-sbu-skk" className="text-[#d5e3df]" aria-label="Kembali ke halaman ebook">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <p className="font-display font-bold">Tutor AI SBU-SKK</p>
            <p className="text-xs text-[#a9c4bd]">
              Berbasis ebook {SBU_SKK_EBOOK.pages} halaman + toolkit {SBU_SKK_EBOOK.toolkitPages} halaman
            </p>
          </div>
          <div className="text-right text-xs text-[#d5e3df]">
            <p>{remaining} pesan tersisa</p>
            <p>{status.expiresAt ? `Berakhir ${new Date(status.expiresAt).toLocaleDateString("id-ID")}` : "Akses aktif"}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100dvh-73px)] max-w-5xl flex-col px-5 py-8">
        <div className="mb-6 rounded-xl border border-[#d5e3df]/15 bg-white/5 p-4 text-sm text-[#d5e3df]">
          <BookOpen className="mr-2 inline h-4 w-4 text-[#e8a83e]" />
          Tanyakan istilah, urutan dokumen, atau bagian panduan. Tutor akan menyebut halaman/sumber bila tersedia.
        </div>
        <div className="flex-1 space-y-5">
          {messages.length === 0 && (
            <div className="py-20 text-center text-[#a9c4bd]">
              <p className="font-display text-2xl font-bold text-[#f7f3ea]">Mulai dari satu pertanyaan kerja</p>
              <p className="mt-2">Contoh: “Apa yang perlu saya cek sebelum memperbarui SBU?”</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`max-w-3xl rounded-2xl p-4 ${message.role === "user" ? "ml-auto bg-[#e8a83e] text-[#1c2b2d]" : "border border-white/10 bg-white/10"}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{message.text || "Menelusuri sumber..."}</p>
              {!!message.citations?.length && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-white/15 pt-2 text-xs text-[#d5e3df]">
                  {message.citations.map((citation, citationIndex) => (
                    <span key={`${citation.source}-${citation.page}-${citationIndex}`} className="rounded-full border border-white/15 px-2 py-1">
                      {citation.source} · Hal. {citation.page}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={bottom} />
        </div>
        <form onSubmit={send} className="mt-6 flex gap-2">
          <label htmlFor="tutor-input" className="sr-only">Pertanyaan untuk Tutor</label>
          <input id="tutor-input" value={input} onChange={(event) => setInput(event.target.value)} disabled={streaming || remaining <= 0} placeholder={remaining <= 0 ? "Kuota habis" : "Tulis pertanyaan Anda..."} className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-[#f7f3ea] outline-none placeholder:text-[#a9c4bd] focus:ring-2 focus:ring-[#e8a83e]" />
          <Button type="submit" disabled={streaming || remaining <= 0} className="bg-[#e8a83e] text-[#1c2b2d]" aria-label="Kirim pertanyaan">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="mt-3 flex items-center gap-1 text-xs text-[#a9c4bd]">
          <Clock3 className="h-3.5 w-3.5" />
          Jawaban bersifat edukatif, bukan keputusan resmi lembaga.
        </p>
      </main>
    </div>
  );
}