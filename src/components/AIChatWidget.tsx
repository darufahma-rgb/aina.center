import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Apa saja fitur portal ini?",
  "Cara export laporan PDF?",
  "Bagaimana cara tambah anggota?",
  "Cara buat notulensi baru?",
];

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Halo! Saya Asisten Virtual AINA Centre 👋\n\nSaya siap membantu Anda dengan pertanyaan seputar portal ini. Ada yang bisa saya bantu?",
      }]);
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Listen for open/close commands from BottomNav
  useEffect(() => {
    const handler = (e: Event) => {
      const shouldOpen = (e as CustomEvent<boolean>).detail;
      setOpen(shouldOpen);
    };
    window.addEventListener("setAIChatOpen", handler as EventListener);
    return () => window.removeEventListener("setAIChatOpen", handler as EventListener);
  }, []);

  // Notify BottomNav when state changes (e.g., closed via X inside widget)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("aiChatStateChange", { detail: open }));
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    setShowQuick(false);

    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.ok) throw new Error("Gagal mendapatkan respons.");
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Maaf, terjadi kesalahan. Coba lagi dalam beberapa saat ya 🙏",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* ── Floating bubble (desktop only) ─────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "hidden lg:flex fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl items-center justify-center transition-all duration-300",
          open ? "scale-90 opacity-80" : "scale-100 hover:scale-110",
        )}
        style={{ background: "linear-gradient(135deg, #3E0FA3, #7C3AED)" }}
        aria-label="Buka asisten AINA"
      >
        {open
          ? <X className="h-6 w-6 text-white" />
          : <MessageCircle className="h-6 w-6 text-white" />
        }
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-green-400 rounded-full border-2 border-white" />
        )}
      </button>

      {/* ── Chat panel ─────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed z-50 flex flex-col rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right",
          "bottom-[88px] left-3 right-3 lg:bottom-24 lg:left-auto lg:right-6 lg:w-[360px]",
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-90 pointer-events-none",
        )}
        style={{
          height: 520,
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 shrink-0"
          style={{ background: "linear-gradient(135deg, #1E0A3C, #3E0FA3)" }}
        >
          <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-tight">Asisten AINA</p>
            <p className="text-[11px] text-white/60">AI · Online</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: "thin" }}>
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2.5 items-end",
                m.role === "user" ? "flex-row-reverse" : "flex-row",
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mb-0.5",
                  m.role === "assistant"
                    ? "bg-gradient-to-br from-[#3E0FA3] to-[#7C3AED]"
                    : "bg-gradient-to-br from-[#1A1A1A] to-[#444]",
                )}
              >
                {m.role === "assistant"
                  ? <Bot className="h-3.5 w-3.5 text-white" />
                  : <User className="h-3.5 w-3.5 text-white" />
                }
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed",
                  m.role === "assistant"
                    ? "bg-[#F5F3FF] text-[#1A1A1A] rounded-bl-sm"
                    : "text-white rounded-br-sm",
                )}
                style={m.role === "user" ? { background: "linear-gradient(135deg, #3E0FA3, #7C3AED)" } : undefined}
              >
                {m.content.split("\n").map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < m.content.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-2.5 items-end">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#3E0FA3] to-[#7C3AED] flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-[#F5F3FF]">
                <Loader2 className="h-4 w-4 text-[#3E0FA3] animate-spin" />
              </div>
            </div>
          )}

          {/* Quick prompts */}
          {showQuick && messages.length <= 1 && !loading && (
            <div className="pt-1 space-y-2">
              <p className="text-[11px] text-[#bbb] font-medium text-center">Pertanyaan cepat:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-[#3E0FA3]/30 text-[#3E0FA3] bg-[#F5F3FF] hover:bg-[#EDE9FE] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="px-3 py-3 shrink-0 flex items-center gap-2"
          style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pertanyaan Anda..."
            disabled={loading}
            className="flex-1 h-10 rounded-xl px-3.5 text-[13px] border border-black/[0.09] bg-[#FAFAFA] text-[#1A1A1A] placeholder:text-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#3E0FA3]/30 focus:border-[#3E0FA3]/40 disabled:opacity-50 transition-all"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="h-10 w-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:opacity-85 active:scale-95 shrink-0"
            style={{ background: "linear-gradient(135deg, #3E0FA3, #7C3AED)" }}
          >
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </>
  );
}
