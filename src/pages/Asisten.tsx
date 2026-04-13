import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Paperclip, X, CheckCircle2, AlertCircle, ExternalLink,
  Sparkles, FileText, CalendarDays, Bot, User, Loader2, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActionResult {
  tool: string;
  success: boolean;
  label: string;
  url?: string;
  data?: Record<string, unknown>;
  error?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ActionResult[];
  file?: { name: string; size: number };
  timestamp: Date;
}

// ─── Suggested Prompts ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: CalendarDays, text: "Ada rapat besok jam 10 di kantor", label: "Buat Agenda" },
  { icon: FileText,     text: "Buat notulensi: Rapat koordinasi divisi tadi dengan keputusan menambah anggaran 10 juta", label: "Buat Notulensi" },
  { icon: Sparkles,     text: "Apa saja agenda yang akan datang?", label: "Cek Agenda" },
  { icon: Bot,          text: "Ringkaskan data portal AINA saat ini", label: "Ringkasan Portal" },
];

// ─── Tool label map ───────────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  create_agenda:            "Agenda Dibuat",
  create_notulensi:         "Notulensi Dibuat",
  save_surat_template:      "Template Surat Disimpan",
  generate_document_report: "Laporan Di-generate",
};

// ─── Markdown-like text renderer ─────────────────────────────────────────────

function RenderContent({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        const withBullet = bold.startsWith("•") || bold.startsWith("-")
          ? `<span class="inline-block w-3 shrink-0 opacity-60">•</span> ${bold.replace(/^[•\-]\s*/, "")}`
          : bold;
        return (
          <p
            key={i}
            className="text-[13.5px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: withBullet }}
          />
        );
      })}
    </div>
  );
}

// ─── Action Card ─────────────────────────────────────────────────────────────

function ActionCard({ action }: { action: ActionResult }) {
  const toolLabel = TOOL_LABELS[action.tool] ?? action.tool;
  if (!action.success) {
    return (
      <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[12px] font-semibold text-red-700">{toolLabel} — Gagal</p>
          <p className="text-[11px] text-red-600 mt-0.5">{action.error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5">
      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-green-800">{action.label}</p>
        {action.data && action.tool === "create_agenda" && (
          <p className="text-[11px] text-green-700 mt-0.5">
            {String(action.data.date ?? "")} · {String(action.data.time ?? "")} · {String(action.data.location ?? "")}
          </p>
        )}
        {action.data && action.tool === "create_notulensi" && (
          <p className="text-[11px] text-green-700 mt-0.5">
            Status: {String(action.data.status ?? "draft")} · {String(action.data.date ?? "")}
          </p>
        )}
        {action.data && action.tool === "save_surat_template" && (
          <p className="text-[11px] text-green-700 mt-0.5">Tersimpan sebagai template surat</p>
        )}
        {action.data && action.tool === "generate_document_report" && (
          <p className="text-[11px] text-green-700 mt-0.5">Mode: {String(action.data.mode ?? "")}</p>
        )}
      </div>
      {action.url && (
        <Link to={action.url} className="flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-green-700 hover:text-green-900 hover:bg-green-100">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AsistenPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFile = useCallback((file: File) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "text/plain", "application/pdf"];
    if (!allowed.includes(file.type) && !file.name.endsWith(".txt")) {
      toast({ title: "Format tidak didukung", description: "Upload PNG, JPG, PDF, atau TXT.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 10 MB.", variant: "destructive" });
      return;
    }
    setAttachedFile(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const getHistory = (msgs: ChatMessage[]) =>
    msgs.map(m => ({ role: m.role, content: m.content }));

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !attachedFile) return;
    if (isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text || (attachedFile ? `[File: ${attachedFile.name}]` : ""),
      file: attachedFile ? { name: attachedFile.name, size: attachedFile.size } : undefined,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setAttachedFile(null);
    setIsLoading(true);

    try {
      const form = new FormData();
      form.append("message", text || `Saya mengupload file: ${attachedFile?.name}`);
      form.append("history", JSON.stringify(getHistory(messages)));
      if (attachedFile) form.append("file", attachedFile);

      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        body: form,
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Gagal menghubungi asisten." }));
        throw new Error(err.message ?? "Error");
      }

      const data = await response.json() as { reply: string; actions: ActionResult[] };

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        actions: data.actions,
        timestamp: new Date(),
      }]);
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Maaf, terjadi kesalahan: ${e.message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
    setAttachedFile(null);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in" style={{ minHeight: "calc(100vh - 80px)" }}>
      <PageHeader
        title="Asisten AINA"
        description="Ketik perintah — AI langsung ambil tindakan di portal"
      >
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={clearChat}>
            <Trash2 className="h-3.5 w-3.5" /> Bersihkan
          </Button>
        )}
      </PageHeader>

      {/* ── Chat Area ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex-1 overflow-y-auto px-0 pb-4 space-y-4",
          isDragging && "ring-2 ring-primary ring-inset rounded-2xl bg-primary/5"
        )}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {messages.length === 0 ? (
          /* ── Empty State ─────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-[#3E0FA3]/10 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-[#3E0FA3]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-1">Asisten AINA siap membantu</h3>
            <p className="text-[13px] text-muted-foreground max-w-xs mb-8">
              Ketik perintah atau upload file — AI akan langsung membuat agenda, notulensi, menyimpan template surat, dan lainnya.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s.text); textareaRef.current?.focus(); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-black/[0.08] bg-white hover:bg-[#3E0FA3]/5 hover:border-[#3E0FA3]/30 transition-all text-left group"
                >
                  <div className="h-8 w-8 rounded-lg bg-[#3E0FA3]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#3E0FA3]/20 transition-colors">
                    <s.icon className="h-4 w-4 text-[#3E0FA3]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#3E0FA3] uppercase tracking-wide mb-0.5">{s.label}</p>
                    <p className="text-[12px] text-[#444] leading-snug">{s.text}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Messages ────────────────────────────────── */
          <div className="space-y-5 pt-2">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-xl bg-[#3E0FA3] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={cn("max-w-[80%] space-y-1", msg.role === "user" ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3",
                      msg.role === "user"
                        ? "bg-[#3E0FA3] text-white rounded-tr-md"
                        : "bg-white border border-black/[0.08] text-[#1A1A1A] rounded-tl-md"
                    )}
                  >
                    {msg.file && (
                      <div className={cn(
                        "flex items-center gap-2 text-[11px] mb-2 pb-2 border-b",
                        msg.role === "user" ? "border-white/20 text-white/80" : "border-black/10 text-muted-foreground"
                      )}>
                        <Paperclip className="h-3 w-3" />
                        <span className="truncate max-w-[160px]">{msg.file.name}</span>
                        <span className="opacity-70">({Math.round(msg.file.size / 1024)} KB)</span>
                      </div>
                    )}
                    {msg.role === "assistant" ? (
                      <RenderContent text={msg.content} />
                    ) : (
                      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="space-y-1.5">
                      {msg.actions.map((a, i) => <ActionCard key={i} action={a} />)}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground px-1">
                    {msg.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-xl bg-[#3E0FA3] flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-black/[0.08] rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 text-[#3E0FA3] animate-spin" />
                  <span className="text-[13px] text-muted-foreground">Sedang memproses...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input Area ────────────────────────────────────────────────────── */}
      <div className="pt-3 border-t border-black/[0.07] mt-2">
        {/* File preview */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="flex items-center gap-2 bg-[#3E0FA3]/8 border border-[#3E0FA3]/20 rounded-lg px-3 py-1.5 text-[12px] text-[#3E0FA3]">
              <Paperclip className="h-3 w-3" />
              <span className="truncate max-w-[200px] font-medium">{attachedFile.name}</span>
              <span className="text-[#3E0FA3]/60">({Math.round(attachedFile.size / 1024)} KB)</span>
              <button onClick={() => setAttachedFile(null)} className="ml-1 hover:text-red-500 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* File button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-[#3E0FA3] hover:bg-[#3E0FA3]/8"
            onClick={() => fileInputRef.current?.click()}
            title="Upload file (gambar template surat, PDF, teks)"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.txt"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />

          {/* Text input */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik perintah... (Enter untuk kirim, Shift+Enter untuk baris baru)"
            rows={1}
            className="flex-1 resize-none min-h-[42px] max-h-[140px] rounded-xl border-black/[0.12] focus:border-[#3E0FA3]/50 focus:ring-[#3E0FA3]/20 text-[13.5px] py-2.5 px-3.5 leading-relaxed"
            style={{ scrollbarWidth: "thin" }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 140) + "px";
            }}
            disabled={isLoading}
          />

          {/* Send button */}
          <Button
            onClick={sendMessage}
            disabled={(!input.trim() && !attachedFile) || isLoading}
            size="icon"
            className="h-10 w-10 flex-shrink-0 rounded-xl bg-[#3E0FA3] hover:bg-[#3E0FA3]/90"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Asisten AINA dapat membuat agenda, notulensi, dan template surat secara langsung.
        </p>
      </div>
    </div>
  );
}
