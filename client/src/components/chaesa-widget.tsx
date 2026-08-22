import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Bot,
  ChevronDown,
  HelpCircle,
  Loader2,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/lib/format-message";

interface WidgetMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface HelpdeskAgent {
  id: string;
  name: string;
  slug: "gustafta-helpdesk";
  availability: "ready";
  greetingMessage: string;
  conversationStarters: string[];
}

export function ChaesaWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() => {
    const randomPart = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `chaesa-${randomPart}`;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const {
    data: helpdeskAgent,
    isLoading: isHelpdeskLoading,
    isFetching: isHelpdeskFetching,
    isError: isHelpdeskError,
    isRefetchError: isHelpdeskRefetchError,
    refetch: refetchHelpdesk,
  } = useQuery<HelpdeskAgent>({
    queryKey: ["/api/agents/gustafta-assistant"],
    retry: 2,
    retryDelay: attempt => Math.min(1000 * (2 ** attempt), 5000),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const isHelpdeskUnavailable = isHelpdeskError || isHelpdeskRefetchError;
  const isHelpdeskReady =
    helpdeskAgent?.availability === "ready" && !isHelpdeskUnavailable;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isStreaming || !helpdeskAgent || !isHelpdeskReady) return;

    setInput("");

    const userMsg: WidgetMessage = { id: `u-${Date.now()}`, role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const assistantId = `a-${Date.now()}`;
    let assistantContent = "";
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/messages/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: helpdeskAgent.slug,
          role: "user",
          content: msg,
          sessionId,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || "Maaf, tidak bisa menjawab saat ini. Coba lagi.";
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: errMsg } : m));
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              assistantContent += parsed.content;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              ));
            }
            // Handle server-sent error events (all providers failed, rate-limit, etc.)
            if (parsed.type === "error" || parsed.error) {
              const errMsg = parsed.error || "Maaf, asisten sedang tidak tersedia. Coba lagi dalam beberapa saat.";
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: errMsg } : m
              ));
            }
          } catch {}
        }
      }
      // If stream ended with no content at all, show a friendly fallback
      if (!assistantContent) {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: "Maaf, asisten sedang sibuk. Coba kirim pesan lagi dalam beberapa saat." }
            : m
        ));
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        if (mountedRef.current) {
          setMessages(prev => prev.map(m =>
            m.id === assistantId && !m.content
              ? { ...m, content: "Permintaan dihentikan." }
              : m
          ));
        }
        return;
      }
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: "Maaf, terjadi kesalahan. Coba lagi." } : m
      ));
    } finally {
      abortRef.current = null;
      if (mountedRef.current) setIsStreaming(false);
    }
  }, [input, isStreaming, helpdeskAgent, isHelpdeskReady, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = helpdeskAgent?.conversationStarters ?? [];

  const closeWidget = () => {
    abortRef.current?.abort();
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
        {isOpen && (
          <div
            className="w-80 sm:w-96 rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden bg-card"
            style={{ height: "500px" }}
            role="dialog"
            aria-label="Gustafta Help Desk"
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">Gustafta Help Desk</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full inline-block",
                        isHelpdeskReady
                          ? "bg-green-500"
                          : isHelpdeskLoading || isHelpdeskFetching
                            ? "bg-amber-500 animate-pulse"
                            : "bg-red-500",
                      )}
                    />
                    {isHelpdeskReady
                      ? "Asisten resmi platform"
                      : isHelpdeskLoading || isHelpdeskFetching
                        ? "Menyiapkan layanan"
                        : "Layanan tidak tersedia"}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeWidget}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                data-testid="button-helpdesk-close"
                aria-label="Tutup Gustafta Help Desk"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {isHelpdeskLoading && !helpdeskAgent && (
                <div className="h-full min-h-72 flex flex-col items-center justify-center gap-3 px-6 text-center" data-testid="helpdesk-loading-state">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Menyiapkan Help Desk</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Kami sedang memeriksa konfigurasi asisten resmi.
                    </p>
                  </div>
                </div>
              )}

              {isHelpdeskUnavailable && (
                <div className="h-full min-h-72 flex flex-col items-center justify-center gap-3 px-6 text-center" role="alert" data-testid="helpdesk-unavailable-state">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Help Desk belum dapat digunakan</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Konfigurasi asisten sedang tidak tersedia. Tidak ada data pengganti yang ditampilkan.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetchHelpdesk()}
                    disabled={isHelpdeskFetching}
                    className="gap-2"
                    data-testid="button-helpdesk-retry"
                  >
                    {isHelpdeskFetching
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <RefreshCw className="h-3.5 w-3.5" />}
                    Coba lagi
                  </Button>
                </div>
              )}

              {isHelpdeskReady && messages.length === 0 && (
                <div className="py-3">
                  <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold text-xs">{helpdeskAgent.name}</p>
                      <p className="text-muted-foreground text-[10px] leading-snug mt-0.5 whitespace-pre-line">
                        {helpdeskAgent.greetingMessage}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Mulai dengan pertanyaan ini:</p>
                  <div className="space-y-1.5">
                    {quickPrompts.map((prompt, i) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="w-full p-2.5 rounded-lg border border-border hover:border-primary/40 bg-background hover:bg-primary/5 text-left transition-all flex items-start gap-2 group"
                        data-testid={`helpdesk-starter-${i}`}
                      >
                        <HelpCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                        <span className="text-[11px] text-muted-foreground group-hover:text-foreground leading-snug">{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2 text-xs",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm border border-border"
                    )}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : msg.content ? (
                      <>
                        <MessageContent text={msg.content} className="text-xs" />
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/70" data-testid="label-ai-transparency">
                          <Bot className="w-2.5 h-2.5" />
                          <span>Disiapkan oleh asisten AI — periksa hal penting sebelum dipakai</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Memproses...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isHelpdeskReady
                      ? "Tanya tentang SBU-SKK atau fitur Gustafta..."
                      : isHelpdeskLoading || isHelpdeskFetching
                        ? "Menyiapkan Help Desk..."
                        : "Help Desk belum tersedia"
                  }
                  className="resize-none text-xs min-h-[36px] max-h-24 py-2"
                  rows={1}
                  disabled={isStreaming || !isHelpdeskReady}
                  data-testid="input-helpdesk-message"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isStreaming || !isHelpdeskReady}
                  size="sm"
                  className="h-9 w-9 p-0 rounded-lg flex-shrink-0"
                  data-testid="button-helpdesk-send"
                >
                  {isStreaming ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 relative bg-primary text-primary-foreground"
          data-testid="button-helpdesk-toggle"
          title="Gustafta Help Desk"
          aria-label={isOpen ? "Tutup Gustafta Help Desk" : "Buka Gustafta Help Desk"}
        >
          {isOpen ? (
            <>
              <X className="w-5 h-5" />
              <span className="font-semibold text-sm">Tutup</span>
            </>
          ) : (
            <>
              <HelpCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Gustafta Help Desk</span>
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                  isHelpdeskReady
                    ? "bg-green-400"
                    : isHelpdeskLoading || isHelpdeskFetching
                      ? "bg-amber-400 animate-pulse"
                      : "bg-red-400",
                )}
              />
            </>
          )}
        </button>
      </div>
    </>
  );
}
