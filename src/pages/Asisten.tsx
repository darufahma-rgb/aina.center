import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Paperclip, X, CheckCircle2, AlertCircle, ExternalLink,
  Bot, User, Loader2, Trash2, Zap, CalendarDays, FileText,
  Wallet, Search, BarChart3, Users, Handshake,
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
  suggestions?: string[];
  file?: { name: string; size: number; preview?: string };
  timestamp: Date;
}

// ─── Thinking States ──────────────────────────────────────────────────────────

const THINKING_STATES = [
  "Menganalisis perintah...",
  "Memeriksa data portal...",
  "Memproses permintaan...",
  "Menyiapkan respons...",
  "Mengeksekusi tindakan...",
];

// ─── Quick Prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { icon: Zap,         text: "Berikan briefing lengkap status portal AINA saat ini",   label: "Briefing Harian",  color: "#3E0FA3" },
  { icon: CalendarDays,text: "Ada rapat divisi besok jam 10 pagi di ruang utama",       label: "Buat Agenda",      color: "#0891b2" },
  { icon: FileText,    text: "Buat notulensi: Rapat koordinasi dengan keputusan menambah program baru dan tindak lanjut penyusunan proposal", label: "Buat Notulensi", color: "#059669" },
  { icon: Wallet,      text: "Catat pengeluaran operasional bulan ini: ATK Rp 250.000 tanggal hari ini kategori Operasional", label: "Catat Keuangan", color: "#d97706" },
  { icon: Search,      text: "Cari semua rapat yang berhubungan dengan koordinasi",    label: "Cari Data",        color: "#7c3aed" },
  { icon: BarChart3,   text: "Analisis kondisi keuangan dan agenda bulan ini",         label: "Analisis",         color: "#dc2626" },
];

// ─── Tool Metadata ────────────────────────────────────────────────────────────

const TOOL_META: Record<string, { label: string; color: string }> = {
  create_agenda:            { label: "Agenda Dibuat",            color: "#0891b2" },
  create_notulensi:         { label: "Notulensi Dibuat",         color: "#059669" },
  update_agenda_status:     { label: "Status Agenda Diperbarui", color: "#0891b2" },
  create_keuangan:          { label: "Transaksi Dicatat",        color: "#d97706" },
  add_relasi:               { label: "Relasi Ditambahkan",       color: "#7c3aed" },
  save_surat_template:      { label: "Template Surat Disimpan",  color: "#059669" },
  search_portal:            { label: "Pencarian Selesai",        color: "#3E0FA3" },
  get_full_briefing:        { label: "Briefing Data Diambil",    color: "#3E0FA3" },
  generate_document_report: { label: "Laporan Di-generate",      color: "#d97706" },
  add_anggota:              { label: "Anggota Ditambahkan",      color: "#059669" },
};

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function RenderContent({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="space-y-2">
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n");
        return (
          <div key={pi} className="space-y-0.5">
            {lines.map((line, li) => {
              if (!line.trim()) return null;
              const isBullet = /^[•\-\*]\s/.test(line);
              const content = line
                .replace(/^[•\-\*]\s*/, "")
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>");
              if (isBullet) {
                return (
                  <div key={li} className="flex gap-2">
                    <span className="text-[#3E0FA3] mt-0.5 flex-shrink-0 text-[11px]">▸</span>
                    <p className="text-[13.5px] leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />
                  </div>
                );
              }
              const isHeading = /^#{1,3}\s/.test(line) || (line.endsWith(":") && line.length < 60);
              if (isHeading) {
                return (
                  <p key={li} className="text-[13px] font-semibold text-[#1A1A1A] mt-1"
                     dangerouslySetInnerHTML={{ __html: content.replace(/^#+\s*/, "") }} />
                );
              }
              return <p key={li} className="text-[13.5px] leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Action Card ─────────────────────────────────────────────────────────────

function ActionCard({ action }: { action: ActionResult }) {
  const meta = TOOL_META[action.tool] ?? { label: action.tool, color: "#666" };
  if (!action.success) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[12px] font-semibold text-red-700">{meta.label} — Gagal</p>
          <p className="text-[11px] text-red-500 mt-0.5">{action.error}</p>
        </div>
      </div>
    );
  }

  const data = action.data ?? {};
  let detail: string | null = null;
  if (action.tool === "create_agenda") detail = `${String(data.date ?? "")} ${String(data.time ?? "")} · ${String(data.location ?? "")}`;
  if (action.tool === "create_notulensi") detail = `Status: ${data.status} · ${data.date}`;
  if (action.tool === "create_keuangan") detail = `${data.type === "income" ? "Pemasukan" : "Pengeluaran"} · ${data.description}`;
  if (action.tool === "add_relasi") detail = `${data.institution} · ${data.role}`;
  if (action.tool === "save_surat_template") detail = (data.fields as string[])?.length ? `${(data.fields as string[]).length} field terdeteksi: ${(data.fields as string[]).slice(0, 3).join(", ")}` : null;
  if (action.tool === "search_portal") detail = `Query: "${data.query}" · ${data.totalFound} hasil`;
  if (action.tool === "add_anggota") detail = `${data.role} · ${data.division}`;
  if (action.tool === "update_agenda_status") detail = `Status baru: ${data.newStatus}`;

  return (
    <div className="flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5"
         style={{ borderColor: `${meta.color}30`, backgroundColor: `${meta.color}08` }}>
      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: meta.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold" style={{ color: meta.color }}>{action.label}</p>
        {detail && <p className="text-[11px] text-[#666] mt-0.5">{detail}</p>}
      </div>
      {action.url && (
        <Link to={action.url} className="flex-shrink-0">
          <Button variant="ghost" size="icon"
                  className="h-6 w-6 hover:bg-black/5"
                  style={{ color: meta.color }}>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      )}
    </div>
  );
}

// ─── Suggestion Chip ──────────────────────────────────────────────────────────

function SuggestionChip({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#3E0FA3]/20 bg-[#3E0FA3]/5 hover:bg-[#3E0FA3]/10 hover:border-[#3E0FA3]/40 text-[11.5px] text-[#3E0FA3] font-medium transition-all"
    >
      <Zap className="h-2.5 w-2.5" />
      {text}
    </button>
  );
}

// ─── Thinking Indicator ───────────────────────────────────────────────────────

function ThinkingIndicator({ state }: { state: string }) {
  return (
    <div className="flex gap-3 justify-start">
      <div className="h-8 w-8 rounded-xl bg-[#3E0FA3] flex items-center justify-center flex-shrink-0">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="bg-white border border-black/[0.08] rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#3E0FA3] animate-bounce"
                 style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <span className="text-[12px] text-muted-foreground">{state}</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AsistenPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingState, setThinkingState] = useState(THINKING_STATES[0]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const thinkingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Cycle through thinking states
  useEffect(() => {
    if (isLoading) {
      let idx = 0;
      thinkingRef.current = setInterval(() => {
        idx = (idx + 1) % THINKING_STATES.length;
        setThinkingState(THINKING_STATES[idx]);
      }, 1800);
    } else {
      if (thinkingRef.current) clearInterval(thinkingRef.current);
      setThinkingState(THINKING_STATES[0]);
    }
    return () => { if (thinkingRef.current) clearInterval(thinkingRef.current); };
  }, [isLoading]);

  const handleFile = useCallback((file: File) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "text/plain", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Format tidak didukung", description: "Upload PNG, JPG, WebP, PDF, atau TXT.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 10 MB.", variant: "destructive" });
      return;
    }
    setAttachedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = e => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const removeFile = () => { setAttachedFile(null); setFilePreview(null); };

  const getHistory = (msgs: ChatMessage[]) => msgs.map(m => ({ role: m.role, content: m.content }));

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text && !attachedFile) return;
    if (isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text || `[File: ${attachedFile?.name}]`,
      file: attachedFile ? { name: attachedFile.name, size: attachedFile.size, preview: filePreview ?? undefined } : undefined,
      timestamp: new Date(),
    };

    const historySnapshot = [...messages];
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAttachedFile(null);
    setFilePreview(null);
    setIsLoading(true);

    try {
      const form = new FormData();
      form.append("message", text || `Saya mengupload file: ${attachedFile?.name}`);
      form.append("history", JSON.stringify(getHistory(historySnapshot)));
      if (attachedFile) form.append("file", attachedFile);

      const response = await fetch("/api/assistant/chat", {
        method: "POST", body: form, credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Gagal." }));
        throw new Error(err.message ?? "Error");
      }

      const data = await response.json() as { reply: string; actions: ActionResult[]; suggestions: string[] };

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        actions: data.actions,
        suggestions: data.suggestions,
        timestamp: new Date(),
      }]);
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Sistem mengalami kendala: ${e.message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => { setMessages([]); setInput(""); removeFile(); };

  const msgCount = messages.filter(m => m.role === "user").length;

  return (
    <div
      className="flex flex-col animate-fade-in"
      style={{ height: "calc(100vh - 80px)" }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 mb-4">
        <PageHeader title="Asisten AINA" description="AI eksekutif — kendalikan seluruh portal dengan perintah natural">
          <div className="flex items-center gap-2">
            {msgCount > 0 && (
              <span className="text-[11px] text-muted-foreground bg-black/[0.05] px-2.5 py-1 rounded-full">
                {msgCount} perintah
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-[#3E0FA3]/30 text-[#3E0FA3] hover:bg-[#3E0FA3]/8"
              onClick={() => sendMessage("Berikan briefing lengkap status portal AINA saat ini")}
              disabled={isLoading}
            >
              <Zap className="h-3.5 w-3.5" />
              Briefing Harian
            </Button>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={clearChat}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </PageHeader>
      </div>

      {/* ── Chat Area ───────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex-1 overflow-y-auto pb-4 space-y-5",
          isDragging && "ring-2 ring-[#3E0FA3] ring-inset rounded-2xl bg-[#3E0FA3]/5",
        )}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{ scrollbarWidth: "thin" }}
      >
        {messages.length === 0 ? (
          /* ── Empty State ─────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="relative h-20 w-20 mb-5">
              <div className="absolute inset-0 rounded-2xl bg-[#3E0FA3] opacity-10 animate-pulse" />
              <div className="relative h-full w-full rounded-2xl bg-[#3E0FA3] flex items-center justify-center">
                <Bot className="h-9 w-9 text-white" />
              </div>
            </div>
            <h3 className="text-[16px] font-bold text-[#1A1A1A] mb-1">Asisten AINA</h3>
            <p className="text-[12.5px] text-muted-foreground max-w-sm mb-1">
              Sistem AI eksekutif yang mengendalikan seluruh modul portal.
            </p>
            <p className="text-[11.5px] text-muted-foreground/70 max-w-sm mb-8">
              Buat agenda, catat keuangan, buat notulensi, upload template surat — cukup dengan satu kalimat.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full max-w-2xl">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(p.text); textareaRef.current?.focus(); }}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-black/[0.08] bg-white hover:shadow-sm transition-all text-left group"
                  style={{ borderLeft: `3px solid ${p.color}` }}
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                       style={{ backgroundColor: `${p.color}15` }}>
                    <p.icon className="h-4 w-4" style={{ color: p.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: p.color }}>{p.label}</p>
                    <p className="text-[11.5px] text-[#555] leading-snug truncate">{p.text.slice(0, 55)}{p.text.length > 55 ? "…" : ""}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground/60">
              <Paperclip className="h-3 w-3" />
              <span>Drag & drop gambar untuk analisis template surat otomatis</span>
            </div>
          </div>
        ) : (
          /* ── Messages ──────────────────────────────────────────────── */
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>

                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-xl bg-[#3E0FA3] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}

                <div className={cn("max-w-[78%] space-y-2", msg.role === "user" ? "items-end" : "items-start")}>
                  {/* Bubble */}
                  <div className={cn(
                    "rounded-2xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-[#3E0FA3] text-white rounded-tr-md shadow-sm"
                      : "bg-white border border-black/[0.08] text-[#1A1A1A] rounded-tl-md shadow-sm"
                  )}>
                    {/* File preview (user) */}
                    {msg.file && msg.role === "user" && (
                      <div className="mb-2.5">
                        {msg.file.preview ? (
                          <img src={msg.file.preview} alt={msg.file.name}
                               className="max-h-40 rounded-lg object-cover mb-1.5 border border-white/20" />
                        ) : null}
                        <div className={cn("flex items-center gap-1.5 text-[11px]",
                          msg.role === "user" ? "text-white/70" : "text-muted-foreground")}>
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[160px]">{msg.file.name}</span>
                          <span>· {Math.round(msg.file.size / 1024)} KB</span>
                        </div>
                      </div>
                    )}

                    {msg.role === "assistant"
                      ? <RenderContent text={msg.content} />
                      : <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    }
                  </div>

                  {/* Action cards */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="space-y-1.5">
                      {msg.actions.map((a, i) => <ActionCard key={i} action={a} />)}
                    </div>
                  )}

                  {/* Suggestion chips */}
                  {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestions.map((s, i) => (
                        <SuggestionChip key={i} text={s} onClick={() => sendMessage(s)} />
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground px-1">
                    {msg.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && <ThinkingIndicator state={thinkingState} />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input Area ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 pt-3 border-t border-black/[0.07]">
        {/* File preview */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2">
            {filePreview ? (
              <div className="relative">
                <img src={filePreview} alt="preview" className="h-14 w-auto rounded-lg object-cover border border-black/10" />
                <button onClick={removeFile}
                        className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm hover:bg-red-600">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#3E0FA3]/8 border border-[#3E0FA3]/20 rounded-lg px-3 py-1.5">
                <Paperclip className="h-3 w-3 text-[#3E0FA3]" />
                <span className="text-[12px] text-[#3E0FA3] font-medium truncate max-w-[200px]">{attachedFile.name}</span>
                <span className="text-[11px] text-[#3E0FA3]/60">{Math.round(attachedFile.size / 1024)} KB</span>
                <button onClick={removeFile} className="ml-1 text-[#3E0FA3]/60 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <p className="text-[11px] text-[#3E0FA3]/70 italic">
              {filePreview ? "AI akan menganalisis isi template ini secara otomatis" : "File siap dikirim"}
            </p>
          </div>
        )}

        <div className="flex items-end gap-2">
          <Button
            variant="ghost" size="icon"
            className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-[#3E0FA3] hover:bg-[#3E0FA3]/8 rounded-xl"
            onClick={() => fileInputRef.current?.click()}
            title="Upload gambar template surat atau dokumen"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input ref={fileInputRef} type="file" className="hidden"
                 accept="image/*,.pdf,.txt"
                 onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Berikan perintah... (Enter kirim · Shift+Enter baris baru)"
            rows={1}
            className="flex-1 resize-none min-h-[42px] max-h-[160px] rounded-xl border-black/[0.12] focus:border-[#3E0FA3]/50 focus:ring-[#3E0FA3]/20 text-[13.5px] py-2.5 px-3.5 leading-relaxed bg-white"
            style={{ scrollbarWidth: "thin" }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 160) + "px";
            }}
            disabled={isLoading}
          />

          <Button
            onClick={() => sendMessage()}
            disabled={(!input.trim() && !attachedFile) || isLoading}
            size="icon"
            className="h-10 w-10 flex-shrink-0 rounded-xl bg-[#3E0FA3] hover:bg-[#3E0FA3]/90 shadow-sm"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-[10px] text-muted-foreground/60">
            10 tools aktif: agenda · notulensi · keuangan · relasi · surat · anggota · search · briefing · laporan · status
          </p>
          <p className="text-[10px] text-muted-foreground/60">gpt-4o-mini · vision enabled</p>
        </div>
      </div>
    </div>
  );
}
