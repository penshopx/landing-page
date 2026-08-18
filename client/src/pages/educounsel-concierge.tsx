import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, Send, Loader2, ArrowLeft, School, Globe2, Compass,
  Brain, Sparkles, Handshake, Flag, UserRound, ShieldCheck,
} from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; isStreaming?: boolean };

// Bersihkan simbol markdown yang kadang lolos dari model (###, **, $$, >, dll.)
function cleanMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, "")            // ### heading
    .replace(/\*\*\*|\*\*|(?<!\w)\*(?!\w)/g, "") // ***, **, * emphasis
    .replace(/`{1,3}/g, "")                   // backticks
    .replace(/\${2,}/g, "")                   // $$ math blocks
    .replace(/^>\s?/gm, "")                   // > blockquote
    .replace(/^\s*[-•]\s+/gm, "• ")           // - bullet → •
    .replace(/<\/?[a-zA-Z][^>]*>/g, "");      // <tag>
}

// Session ID per pengunjung — WAJIB dikirim agar riwayat percakapan di server
// ter-scope per sesi (tanpa ini, history global agen bocor antar pengunjung).
function getSessionId(): string {
  const KEY = "educounsel_concierge_session";
  let sid = sessionStorage.getItem(KEY);
  if (!sid) {
    sid = `web_${(crypto as any).randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
    sessionStorage.setItem(KEY, sid);
  }
  return sid;
}

type Lang = "id" | "en";

const QUICK_START: { icon: JSX.Element; label: Record<Lang, string>; prompt: Record<Lang, string> }[] = [
  { icon: <GraduationCap className="h-4 w-4" />, label: { en: "🎓 What is EDUCOUNSEL?", id: "🎓 Apa itu EDUCOUNSEL?" }, prompt: { en: "What is EDUCOUNSEL?", id: "Apa itu EDUCOUNSEL?" } },
  { icon: <UserRound className="h-4 w-4" />, label: { en: "🧑‍🏫 I'm a Counselor", id: "🧑‍🏫 Saya Konselor" }, prompt: { en: "I'm a counselor. How can EDUCOUNSEL support my counseling work?", id: "Saya konselor. Bagaimana EDUCOUNSEL mendukung pekerjaan konseling saya?" } },
  { icon: <School className="h-4 w-4" />, label: { en: "🏫 I'm from a School", id: "🏫 Saya dari Sekolah" }, prompt: { en: "I'm from a school. How can EDUCOUNSEL work in our school?", id: "Saya dari sekolah. Bagaimana EDUCOUNSEL bisa diterapkan di sekolah kami?" } },
  { icon: <Globe2 className="h-4 w-4" />, label: { en: "🌎 International Education", id: "🌎 Pendidikan Internasional" }, prompt: { en: "How does EDUCOUNSEL support international education preparation?", id: "Bagaimana EDUCOUNSEL mendukung persiapan pendidikan internasional?" } },
  { icon: <Flag className="h-4 w-4" />, label: { en: "🇮🇩 National School", id: "🇮🇩 Sekolah Nasional" }, prompt: { en: "How does EDUCOUNSEL work for national schools?", id: "Bagaimana EDUCOUNSEL bekerja untuk sekolah nasional di Indonesia?" } },
  { icon: <Compass className="h-4 w-4" />, label: { en: "🧭 Career Counseling", id: "🧭 Konseling Karier" }, prompt: { en: "How does EDUCOUNSEL support career counseling?", id: "Bagaimana EDUCOUNSEL mendukung konseling karier?" } },
  { icon: <Brain className="h-4 w-4" />, label: { en: "🧠 How does the AI work?", id: "🧠 Bagaimana AI-nya bekerja?" }, prompt: { en: "How does the AI and Education Memory work in EDUCOUNSEL?", id: "Bagaimana AI dan Education Memory bekerja di EDUCOUNSEL?" } },
  { icon: <Sparkles className="h-4 w-4" />, label: { en: "💡 What makes it different?", id: "💡 Apa bedanya EDUCOUNSEL?" }, prompt: { en: "What makes EDUCOUNSEL different from an LMS, AI tutor, or career assessment platform?", id: "Apa yang membedakan EDUCOUNSEL dari LMS, AI tutor, atau platform tes karier?" } },
  { icon: <Handshake className="h-4 w-4" />, label: { en: "🤝 Partnership Opportunities", id: "🤝 Peluang Kemitraan" }, prompt: { en: "What partnership opportunities does EDUCOUNSEL offer for counselors and schools?", id: "Peluang kemitraan apa yang ditawarkan EDUCOUNSEL untuk konselor dan sekolah?" } },
];

const UI: Record<Lang, { greeting: string; subtitle: string; explore: string; placeholder: string; preparing: string; footer: string; noAccess: string; retry: string; principle: string }> = {
  id: {
    greeting: "Hai, saya EDUCOUNSEL AI Concierge",
    subtitle: "Saya membantu Anda memahami EDUCOUNSEL — platform Student Development, Career Guidance & Education Pathway untuk sekolah nasional dan internasional.",
    explore: "Apa yang ingin Anda jelajahi?",
    placeholder: "Tanya tentang EDUCOUNSEL…",
    preparing: "Menyiapkan concierge…",
    footer: "Chatbot informasi publik — tidak mengakses data produksi siswa dan tidak menggantikan penilaian konselor profesional.",
    noAccess: "Tidak mengakses data siswa",
    retry: "Maaf, koneksi terputus. Silakan coba kirim ulang pertanyaan Anda.",
    principle: "AI mendukung. Konselor membimbing. Siswa berkembang dan mengambil keputusan.",
  },
  en: {
    greeting: "Hi, I'm EDUCOUNSEL AI Concierge",
    subtitle: "I help you understand EDUCOUNSEL — a Student Development, Career Guidance & Education Pathway platform for national and international schools.",
    explore: "What would you like to explore?",
    placeholder: "Ask about EDUCOUNSEL…",
    preparing: "Preparing the concierge…",
    footer: "Public information chatbot — it does not access student production data and does not replace professional counselor judgment.",
    noAccess: "No student data access",
    retry: "Sorry, the connection dropped. Please resend your question.",
    principle: "AI supports. Counselors guide. Students develop and make decisions.",
  },
};

export default function EducounselConciergePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [lang, setLang] = useState<Lang>(() => (sessionStorage.getItem("educounsel_lang") as Lang) || "id");
  const t = UI[lang];
  function switchLang(l: Lang) { setLang(l); sessionStorage.setItem("educounsel_lang", l); }
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agentData } = useQuery<{ id: string; name: string; tagline?: string; avatar?: string }>({
    queryKey: ["/api/educounsel/concierge"],
    queryFn: async () => {
      const res = await fetch("/api/educounsel/concierge");
      if (!res.ok) throw new Error("EDUCOUNSEL Concierge not found");
      return res.json();
    },
  });
  const agentId = agentData?.id;
  const ready = !!agentId;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming || !agentId) return;
    setInput("");
    setStreaming(true);
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "", isStreaming: true }]);
    const langInstruction = lang === "en" ? "[Reply in English] " : "[Balas dalam Bahasa Indonesia] ";

    try {
      const res = await fetch("/api/messages/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: String(agentId), role: "user", content: langInstruction + text, sessionId: getSessionId(), conversationHistory: history }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") break;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === "chunk") {
              fullContent += evt.content ?? "";
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") updated[updated.length - 1] = { ...last, content: fullContent };
                return updated;
              });
            }
          } catch { /* keep-alive / non-JSON */ }
        }
      }
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant") updated[updated.length - 1] = { ...last, isStreaming: false };
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant" && !last.content) {
          updated[updated.length - 1] = {
            role: "assistant",
            content: t.retry,
          };
        }
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-950 via-slate-950 to-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-white/50 hover:text-white" data-testid="link-back-home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-9 w-9 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-lg">🎓</div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate" data-testid="text-concierge-title">
              EDUCOUNSEL AI Concierge
            </div>
            <div className="text-[11px] text-teal-300/80 truncate">
              Student Development · Career Guidance · Education Pathway — Powered by Gustafta
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex rounded-lg border border-white/15 overflow-hidden text-[11px] font-medium">
              <button
                onClick={() => switchLang("id")}
                className={lang === "id" ? "px-2.5 py-1 bg-teal-600 text-white" : "px-2.5 py-1 text-white/50 hover:text-white"}
                data-testid="button-lang-id"
              >ID</button>
              <button
                onClick={() => switchLang("en")}
                className={lang === "en" ? "px-2.5 py-1 bg-teal-600 text-white" : "px-2.5 py-1 text-white/50 hover:text-white"}
                data-testid="button-lang-en"
              >EN</button>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-white/40">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
              {t.noAccess}
            </div>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {empty ? (
            <div className="pt-6">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">👋</div>
                <h1 className="text-2xl font-bold mb-2" data-testid="text-greeting">
                  {t.greeting} 👋
                </h1>
                <p className="text-white/60 text-sm max-w-md mx-auto">{t.subtitle}</p>
                <p className="text-teal-300/90 text-sm mt-4 font-medium">{t.explore}</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-2.5">
                {QUICK_START.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q.prompt[lang])}
                    disabled={!ready}
                    className="text-left rounded-xl border border-white/10 bg-white/5 hover:bg-teal-500/10 hover:border-teal-500/40 transition-colors px-3.5 py-3 text-sm disabled:opacity-50"
                    data-testid={`button-quickstart-${i}`}
                  >
                    {q.label[lang]}
                  </button>
                ))}
              </div>
              <p className="text-center text-[11px] text-white/30 mt-8">{t.principle}</p>
            </div>
          ) : (
            <div>
              {messages.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={i} className="flex justify-end mb-4">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-teal-700/70 text-sm whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex gap-2.5 mb-4">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-sm">🎓</div>
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 bg-white/5 border border-white/10 text-sm whitespace-pre-wrap leading-relaxed">
                      {cleanMarkdown(msg.content)}
                      {msg.isStreaming && <Loader2 className="inline h-3.5 w-3.5 animate-spin ml-1.5 text-teal-400" />}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-slate-950/80 backdrop-blur sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ready ? t.placeholder : t.preparing}
              disabled={!ready || streaming}
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-teal-500/60 placeholder:text-white/30"
              data-testid="input-concierge-message"
            />
            <Button
              type="submit"
              disabled={!ready || streaming || !input.trim()}
              className="rounded-xl bg-teal-600 hover:bg-teal-500"
              data-testid="button-concierge-send"
            >
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="text-center text-[10px] text-white/25 mt-2">{t.footer}</p>
        </div>
      </div>
    </div>
  );
}
