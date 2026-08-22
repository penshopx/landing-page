import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Bot,
  BookOpen,
  ChevronDown,
  HelpCircle,
  Loader2,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/lib/format-message";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WidgetMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AgentMetadata {
  id: string;
  name: string;
  slug: string;
  availability: "ready";
  greetingMessage: string;
  conversationStarters: string[];
}

// ---------------------------------------------------------------------------
// Widget config
// ---------------------------------------------------------------------------

export interface ChaesaWidgetConfig {
  /** Metadata fetch URL, e.g. /api/agents/gustafta-assistant */
  metadataEndpoint: string;
  /** Canonical agent slug sent to /api/messages/stream */
  agentSlug: string;
  /** Session-ID prefix, e.g. "chaesa" */
  sessionPrefix: string;
  /** Panel placement side */
  placement: "left" | "right";
  /** Panel/dialog accessible label */
  ariaLabel: string;
  /** Title shown in the panel header */
  title: string;
  /** Label on the launcher button */
  launcherLabel: string;
  /** Ready status text */
  statusReady: string;
  /** Loading status text */
  statusLoading: string;
  /** Error status text */
  statusError: string;
  /** Textarea placeholder when ready */
  placeholderReady: string;
  /** Textarea placeholder while loading */
  placeholderLoading: string;
  /** Textarea placeholder when unavailable */
  placeholderUnavailable: string;
  /** data-testid prefix, e.g. "helpdesk" → button-helpdesk-toggle */
  testIdPrefix: string;
  /** Icon shown on the launcher button */
  LauncherIcon: React.ComponentType<{ className?: string }>;
}

// ---------------------------------------------------------------------------
// Pre-built configs
// ---------------------------------------------------------------------------

export const helpdeskConfig: ChaesaWidgetConfig = {
  metadataEndpoint: "/api/agents/gustafta-assistant",
  agentSlug: "gustafta-helpdesk",
  sessionPrefix: "chaesa",
  placement: "right",
  ariaLabel: "Help Desk Pekerjaan",
  title: "Help Desk Pekerjaan",
  launcherLabel: "Help Desk Pekerjaan",
  statusReady: "SBU, SKK, Tender, dan Proyek",
  statusLoading: "Menyiapkan layanan",
  statusError: "Layanan tidak tersedia",
  placeholderReady: "Tanya soal SBU, SKK, Tender, atau Proyek...",
  placeholderLoading: "Menyiapkan Help Desk...",
  placeholderUnavailable: "Help Desk belum tersedia",
  testIdPrefix: "helpdesk",
  LauncherIcon: HelpCircle,
};

export const platformGuideConfig: ChaesaWidgetConfig = {
  metadataEndpoint: "/api/agents/gustafta-platform-guide",
  agentSlug: "gustafta-platform-guide",
  sessionPrefix: "panduan-gustafta",
  placement: "left",
  ariaLabel: "Panduan Gustafta",
  title: "Panduan Gustafta",
  launcherLabel: "Panduan Gustafta",
  statusReady: "Panduan interaktif platform",
  statusLoading: "Memuat panduan",
  statusError: "Panduan tidak tersedia",
  placeholderReady: "Tanya cara menggunakan Gustafta...",
  placeholderLoading: "Memuat Panduan Gustafta...",
  placeholderUnavailable: "Panduan belum tersedia",
  testIdPrefix: "platform-guide",
  LauncherIcon: BookOpen,
};

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

interface ChaesaWidgetProps {
  config?: ChaesaWidgetConfig;
  /** Controlled open state */
  isOpen?: boolean;
  /** Called when the widget wants to open or close */
  onOpenChange?: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// ChaesaWidget
// ---------------------------------------------------------------------------

export function ChaesaWidget({
  config = helpdeskConfig,
  isOpen: controlledOpen,
  onOpenChange,
}: ChaesaWidgetProps) {
  const isControlled = controlledOpen !== undefined;

  // Internal open state (used when uncontrolled)
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (isControlled) {
        onOpenChange?.(next);
      } else {
        setInternalOpen(next);
      }
    },
    [isControlled, onOpenChange],
  );

  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const [sessionId] = useState(() => {
    const randomPart =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${config.sessionPrefix}-${randomPart}`;
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const {
    data: agent,
    isLoading,
    isFetching,
    isError,
    isRefetchError,
    refetch,
  } = useQuery<AgentMetadata>({
    queryKey: [config.metadataEndpoint],
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const isUnavailable = isError || isRefetchError;
  const isReady = agent?.availability === "ready" && !isUnavailable;
  const { testIdPrefix, LauncherIcon } = config;

  // Unmount cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // Abort in-flight request when panel closes (controlled)
  useEffect(() => {
    if (isControlled && !controlledOpen) {
      abortRef.current?.abort();
    }
  }, [isControlled, controlledOpen]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || isStreaming || !agent || !isReady) return;

      setInput("");

      const userMsg: WidgetMessage = {
        id: `${testIdPrefix}-u-${Date.now()}`,
        role: "user",
        content: msg,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      const assistantId = `${testIdPrefix}-a-${Date.now()}`;
      let assistantContent = "";
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        abortRef.current = new AbortController();
        const res = await fetch("/api/messages/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: config.agentSlug,
            role: "user",
            content: msg,
            sessionId,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg =
            errData.error || "Maaf, tidak bisa menjawab saat ini. Coba lagi.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: errMsg } : m,
            ),
          );
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
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: assistantContent }
                      : m,
                  ),
                );
              }
              if (parsed.type === "error" || parsed.error) {
                const errMsg =
                  parsed.error ||
                  "Maaf, asisten sedang tidak tersedia. Coba lagi dalam beberapa saat.";
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: errMsg } : m,
                  ),
                );
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        if (!assistantContent) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "Maaf, asisten sedang sibuk. Coba kirim pesan lagi dalam beberapa saat.",
                  }
                : m,
            ),
          );
        }
      } catch (err: unknown) {
        const error = err as { name?: string };
        if (error?.name === "AbortError") {
          if (mountedRef.current) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId && !m.content
                  ? { ...m, content: "Permintaan dihentikan." }
                  : m,
              ),
            );
          }
          return;
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Maaf, terjadi kesalahan. Coba lagi." }
              : m,
          ),
        );
      } finally {
        abortRef.current = null;
        if (mountedRef.current) setIsStreaming(false);
      }
    },
    [
      input,
      isStreaming,
      agent,
      isReady,
      sessionId,
      config.agentSlug,
      testIdPrefix,
    ],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = agent?.conversationStarters ?? [];

  const closeWidget = () => {
    abortRef.current?.abort();
    setOpen(false);
  };

  // Placement classes
  const cornerClass =
    config.placement === "right"
      ? "fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end"
      : "fixed bottom-6 left-6 z-50 flex flex-col gap-3 items-start";

  // Mobile: panel can be wider
  const panelClass =
    "w-80 sm:w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden bg-card";

  // Mobile launcher: icon-only; desktop: full label
  const launcherClass =
    "flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 relative bg-primary text-primary-foreground sm:px-4 sm:py-3";

  return (
    <>
      <div className={cornerClass}>
        {isOpen && (
          <div
            className={panelClass}
            style={{
              height: "500px",
              maxHeight: "calc(100dvh - env(safe-area-inset-bottom, 0px) - 5rem)",
            }}
            role="dialog"
            aria-label={config.ariaLabel}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">
                    {config.title}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full inline-block",
                        isReady
                          ? "bg-green-500"
                          : isLoading || isFetching
                            ? "bg-amber-500 animate-pulse"
                            : "bg-red-500",
                      )}
                    />
                    {isReady
                      ? config.statusReady
                      : isLoading || isFetching
                        ? config.statusLoading
                        : config.statusError}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeWidget}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                data-testid={`button-${testIdPrefix}-close`}
                aria-label={`Tutup ${config.ariaLabel}`}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>

            {/* Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {isLoading && !agent && (
                <div
                  className="h-full min-h-72 flex flex-col items-center justify-center gap-3 px-6 text-center"
                  data-testid={`${testIdPrefix}-loading-state`}
                >
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Menyiapkan {config.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Kami sedang memeriksa konfigurasi asisten resmi.
                    </p>
                  </div>
                </div>
              )}

              {isUnavailable && (
                <div
                  className="h-full min-h-72 flex flex-col items-center justify-center gap-3 px-6 text-center"
                  role="alert"
                  data-testid={`${testIdPrefix}-unavailable-state`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {config.title} belum dapat digunakan
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Konfigurasi asisten sedang tidak tersedia. Tidak ada data
                      pengganti yang ditampilkan.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="gap-2"
                    data-testid={`button-${testIdPrefix}-retry`}
                  >
                    {isFetching ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Coba lagi
                  </Button>
                </div>
              )}

              {isReady && messages.length === 0 && (
                <div className="py-3">
                  <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold text-xs">
                        {agent!.name}
                      </p>
                      <p className="text-muted-foreground text-[10px] leading-snug mt-0.5 whitespace-pre-line">
                        {agent!.greetingMessage}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                    Mulai dengan pertanyaan ini:
                  </p>
                  <div className="space-y-1.5">
                    {quickPrompts.map((prompt, i) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="w-full p-2.5 rounded-lg border border-border hover:border-primary/40 bg-background hover:bg-primary/5 text-left transition-all flex items-start gap-2 group"
                        data-testid={`${testIdPrefix}-starter-${i}`}
                      >
                        <HelpCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                        <span className="text-[11px] text-muted-foreground group-hover:text-foreground leading-snug">
                          {prompt}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2 text-xs",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm border border-border",
                    )}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : msg.content ? (
                      <>
                        <MessageContent text={msg.content} className="text-xs" />
                        <div
                          className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/70"
                          data-testid={`${testIdPrefix}-ai-transparency`}
                        >
                          <Bot className="w-2.5 h-2.5" />
                          <span>
                            Disiapkan oleh asisten AI — periksa hal penting
                            sebelum dipakai
                          </span>
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

            {/* Footer */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isReady
                      ? config.placeholderReady
                      : isLoading || isFetching
                        ? config.placeholderLoading
                        : config.placeholderUnavailable
                  }
                  className="resize-none text-xs min-h-[36px] max-h-24 py-2"
                  rows={1}
                  disabled={isStreaming || !isReady}
                  data-testid={`input-${testIdPrefix}-message`}
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isStreaming || !isReady}
                  size="sm"
                  className="h-9 w-9 p-0 rounded-lg flex-shrink-0"
                  data-testid={`button-${testIdPrefix}-send`}
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

        {/* Launcher button */}
        <button
          onClick={() => setOpen(!isOpen)}
          className={launcherClass}
          data-testid={`button-${testIdPrefix}-toggle`}
          title={config.ariaLabel}
          aria-label={
            isOpen ? `Tutup ${config.ariaLabel}` : `Buka ${config.ariaLabel}`
          }
        >
          {isOpen ? (
            <>
              <X className="w-5 h-5" />
              <span className="font-semibold text-sm hidden sm:inline">
                Tutup
              </span>
            </>
          ) : (
            <>
              <LauncherIcon className="w-5 h-5" />
              <span className="font-semibold text-sm hidden sm:inline">
                {config.launcherLabel}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                  isReady
                    ? "bg-green-400"
                    : isLoading || isFetching
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
