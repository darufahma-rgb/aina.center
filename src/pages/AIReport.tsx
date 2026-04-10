import { useState, useCallback } from "react";
import {
  Wand2, Copy, Check, Save, Trash2, FileText, TrendingUp,
  Presentation, AlignLeft, AlertTriangle, ChevronDown, ChevronRight,
  Clock, RotateCcw, Sparkles, Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Report } from "../../shared/schema";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportMode = "notulensi" | "progress" | "investor" | "summary";

interface ReportSection {
  key: string;
  label: string;
  content: string;
}

interface GeneratedReport {
  mode: ReportMode;
  title: string;
  sections: ReportSection[];
}

// ─── Mode config ──────────────────────────────────────────────────────────────

const MODES: {
  id: ReportMode;
  label: string;
  icon: any;
  description: string;
  color: string;
  saveLabel: string;
  saveModule: string;
}[] = [
  {
    id: "notulensi",
    label: "Notulensi Rapat",
    icon: FileText,
    description: "Catatan rapat → notulensi terstruktur",
    color: "text-primary",
    saveLabel: "Simpan ke Notulensi",
    saveModule: "notulensi",
  },
  {
    id: "progress",
    label: "Laporan Progress",
    icon: TrendingUp,
    description: "Update internal → laporan kemajuan",
    color: "text-violet-600",
    saveLabel: "Simpan sebagai Laporan",
    saveModule: "progress",
  },
  {
    id: "investor",
    label: "Ringkasan Investor",
    icon: Presentation,
    description: "Catatan internal → ringkasan investor",
    color: "text-amber-600",
    saveLabel: "Simpan sebagai Ringkasan",
    saveModule: "investor",
  },
  {
    id: "summary",
    label: "Ringkasan Singkat",
    icon: AlignLeft,
    description: "Teks panjang → poin-poin singkat",
    color: "text-purple-600",
    saveLabel: "Simpan Ringkasan",
    saveModule: "summary",
  },
];

const MODE_MAP = Object.fromEntries(MODES.map((m) => [m.id, m]));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sectionsToText(sections: ReportSection[]): string {
  return sections
    .map((s) => `**${s.label}**\n${s.content}`)
    .join("\n\n");
}

function timeAgo(dateStr: string | Date) {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Editable Section ─────────────────────────────────────────────────────────

function EditableSection({
  section,
  onChange,
}: {
  section: ReportSection;
  onChange: (content: string) => void;
}) {
  return (
    <div className="space-y-1" data-testid={`section-${section.key}`}>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {section.label}
      </label>
      <Textarea
        value={section.content}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm resize-none min-h-[60px] font-mono text-foreground/90"
        rows={Math.max(2, section.content.split("\n").length + 1)}
        data-testid={`textarea-section-${section.key}`}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIReportPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [rawText, setRawText] = useState("");
  const [selectedMode, setSelectedMode] = useState<ReportMode>("notulensi");
  const [generated, setGenerated] = useState<GeneratedReport | null>(null);
  const [editedSections, setEditedSections] = useState<ReportSection[]>([]);
  const [copied, setCopied] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // ── Saved reports history ──
  const { data: savedReports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  // ── Generate mutation ──
  const generate = useMutation({
    mutationFn: async (data: { rawText: string; mode: ReportMode }) => {
      const res = await apiRequest("POST", "/api/ai-report/generate", data);
      return res.json() as Promise<GeneratedReport>;
    },
    onSuccess: (result) => {
      setGenerated(result);
      setEditedSections(result.sections.map((s) => ({ ...s })));
      toast({ title: "Laporan berhasil dibuat", description: "Periksa dan edit hasilnya sebelum menyimpan." });
    },
    onError: (e: any) => {
      toast({ title: "Gagal memproses", description: e.message ?? "Coba lagi.", variant: "destructive" });
    },
  });

  // ── Save report mutation ──
  const saveReport = useMutation({
    mutationFn: (payload: any) => apiRequest("POST", "/api/reports", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({ title: "Laporan disimpan", description: "Tersedia di riwayat laporan." });
    },
    onError: (e: any) => {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    },
  });

  // ── Save to notulensi mutation ──
  const saveToNotulensi = useMutation({
    mutationFn: async () => {
      const sections = editedSections;
      const titleSection = sections.find((s) => s.key === "judul");
      const tanggalSection = sections.find((s) => s.key === "tanggal");
      const pesertaSection = sections.find((s) => s.key === "peserta");
      const ringkasanSection = sections.find((s) => s.key === "ringkasan");
      const keputusanSection = sections.find((s) => s.key === "keputusan");
      const tindakLanjutSection = sections.find((s) => s.key === "tindak_lanjut");

      const participants = (pesertaSection?.content ?? "")
        .split(/[,\n]+/)
        .map((p) => p.replace(/^[•\-\*]\s*/, "").trim())
        .filter(Boolean);

      const decisions = (keputusanSection?.content ?? "")
        .split(/\n/)
        .map((d) => d.replace(/^[•\-\*]\s*/, "").trim())
        .filter(Boolean);

      const actionItems = (tindakLanjutSection?.content ?? "")
        .split(/\n/)
        .map((a) => a.replace(/^[•\-\*]\s*/, "").trim())
        .filter(Boolean);

      const notulensiData = {
        title: titleSection?.content ?? generated?.title ?? "Notulensi",
        date: tanggalSection?.content ?? new Date().toLocaleDateString("id-ID"),
        participants,
        summary: ringkasanSection?.content ?? "",
        decisions,
        actionItems,
        status: "draft",
      };

      const res = await apiRequest("POST", "/api/notulensi", notulensiData);
      const saved = await res.json();

      // Also save to reports with relatedId
      await apiRequest("POST", "/api/reports", {
        title: notulensiData.title,
        mode: "notulensi",
        rawInput: rawText,
        generatedOutput: JSON.stringify(editedSections),
        savedToModule: "notulensi",
        relatedId: saved.id,
      });

      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notulensi"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Disimpan ke Notulensi",
        description: "Notulensi baru berhasil dibuat dari hasil laporan.",
      });
    },
    onError: (e: any) => {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    },
  });

  // ── Delete mutation ──
  const deleteReport = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setDeleteId(null);
      toast({ title: "Laporan dihapus" });
    },
  });

  // ── Handlers ──

  const handleGenerate = () => {
    if (!rawText.trim()) {
      toast({ title: "Isi kolom teks terlebih dahulu", variant: "destructive" });
      return;
    }
    generate.mutate({ rawText, mode: selectedMode });
  };

  const handleSectionChange = useCallback((key: string, content: string) => {
    setEditedSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, content } : s))
    );
  }, []);

  const handleCopy = async () => {
    const text = sectionsToText(editedSections);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Disalin ke clipboard" });
  };

  const handleSave = () => {
    if (!generated) return;
    saveReport.mutate({
      title: editedSections.find((s) => s.key === "judul")?.content ?? generated.title,
      mode: generated.mode,
      rawInput: rawText,
      generatedOutput: JSON.stringify(editedSections),
      savedToModule: null,
      relatedId: null,
    });
  };

  const handleReset = () => {
    setGenerated(null);
    setEditedSections([]);
    setRawText("");
  };

  const handleLoadHistory = (r: Report) => {
    try {
      const sections: ReportSection[] = JSON.parse(r.generatedOutput);
      setGenerated({ mode: r.mode, title: r.title, sections });
      setEditedSections(sections);
      setRawText(r.rawInput);
      setSelectedMode(r.mode);
      setHistoryOpen(false);
      toast({ title: "Laporan dimuat dari riwayat" });
    } catch {
      toast({ title: "Gagal memuat", variant: "destructive" });
    }
  };

  const modeConfig = MODE_MAP[selectedMode];
  const ModeIcon = modeConfig.icon;
  const isNotulensiMode = selectedMode === "notulensi";

  // Non-admin: access denied
  if (!isAdmin) {
    return (
      <div className="space-y-5 animate-fade-in">
        <PageHeader title="AI Report Assistant" description="Ubah catatan mentah menjadi laporan terstruktur" />
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-semibold">Fitur Khusus Admin</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              AI Report Assistant hanya tersedia untuk admin. Hubungi admin untuk akses lebih lanjut.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="AI Report Assistant"
        description="Ubah catatan mentah menjadi laporan terstruktur menggunakan AI"
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-primary/30 text-primary gap-1">
            <Sparkles className="h-3 w-3" /> GPT-4o mini
          </Badge>
          {generated && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground"
              onClick={handleReset}
              data-testid="button-reset"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          )}
        </div>
      </PageHeader>

      {/* ── Review Reminder ── */}
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          <strong>Periksa hasil AI sebelum menyimpan.</strong> AI menyusun ulang berdasarkan teks input — tidak mengarang data, nama, tanggal, atau keputusan yang tidak ada. Selalu verifikasi output sebelum disimpan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* ── Left: Input ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">1. Tempel Catatan Mentah</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Paste catatan rapat, update progress, atau teks lainnya di sini...

Contoh:
- Rapat tgl 10 April 2026, dihadiri Budi, Siti, Anton
- Membahas progress aplikasi portal
- Fitur login sudah selesai
- Kendala: deployment masih bermasalah
- Diputuskan: target launch 1 Mei
- Follow up: Anton cek server`}
                className="min-h-[220px] text-sm resize-none font-mono"
                data-testid="textarea-raw-input"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{rawText.length} karakter</span>
                {rawText.length > 0 && (
                  <button
                    className="text-muted-foreground hover:text-foreground underline text-[11px]"
                    onClick={() => setRawText("")}
                    data-testid="button-clear-input"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">2. Pilih Format Output</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {MODES.map((mode) => {
                const Icon = mode.icon;
                const active = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`w-full text-left flex items-start gap-3 rounded-lg border p-3 transition-all ${
                      active
                        ? "border-primary/50 bg-primary/[0.05]"
                        : "border-muted hover:border-border hover:bg-muted/40"
                    }`}
                    data-testid={`button-mode-${mode.id}`}
                  >
                    <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${active ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium leading-tight ${active ? "text-primary" : ""}`}>{mode.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{mode.description}</p>
                    </div>
                    {active && (
                      <div className="ml-auto shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Button
            className="w-full gap-2 h-11"
            onClick={handleGenerate}
            disabled={generate.isPending || !rawText.trim()}
            data-testid="button-generate"
          >
            {generate.isPending ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Buat Laporan
              </>
            )}
          </Button>
        </div>

        {/* ── Right: Output ── */}
        <div className="space-y-4">
          {!generated && !generate.isPending && (
            <Card className="border-dashed">
              <CardContent className="p-10 text-center space-y-3">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
                  <Wand2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Output akan muncul di sini</p>
                <p className="text-xs text-muted-foreground/70">
                  Paste catatan, pilih format, lalu klik "Buat Laporan"
                </p>
              </CardContent>
            </Card>
          )}

          {generate.isPending && (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Menyusun laporan...</p>
              </CardContent>
            </Card>
          )}

          {generated && !generate.isPending && (
            <>
              {/* Header bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ModeIcon className={`h-4 w-4 ${modeConfig.color}`} />
                  <span className="text-sm font-medium">{modeConfig.label}</span>
                  <Badge variant="secondary" className="text-[10px]">Dapat diedit</Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={handleCopy}
                    data-testid="button-copy"
                  >
                    {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Disalin!" : "Salin Semua"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={handleSave}
                    disabled={saveReport.isPending}
                    data-testid="button-save-report"
                  >
                    <Save className="h-3 w-3" />
                    Simpan
                  </Button>
                </div>
              </div>

              {/* Sections */}
              <Card>
                <CardContent className="p-5 space-y-4">
                  {editedSections.map((section) => (
                    <EditableSection
                      key={section.key}
                      section={section}
                      onChange={(content) => handleSectionChange(section.key, content)}
                    />
                  ))}
                </CardContent>
              </Card>

              {/* Save to module action */}
              <Card className="border-primary/20 bg-primary/[0.02]">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <ModeIcon className={`h-4 w-4 text-primary`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {isNotulensiMode ? "Simpan langsung ke Notulensi" : "Simpan sebagai laporan"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isNotulensiMode
                        ? "Akan membuat notulensi baru dengan data yang sudah diekstrak. Pastikan semua bagian sudah benar."
                        : "Laporan akan disimpan di riwayat dan bisa dibuka kembali kapan saja."}
                    </p>
                  </div>
                  {isNotulensiMode ? (
                    <Button
                      size="sm"
                      className="shrink-0 gap-1.5"
                      onClick={() => saveToNotulensi.mutate()}
                      disabled={saveToNotulensi.isPending}
                      data-testid="button-save-to-notulensi"
                    >
                      {saveToNotulensi.isPending ? "Menyimpan..." : (
                        <><FileText className="h-3.5 w-3.5" /> Simpan ke Notulensi</>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      onClick={handleSave}
                      disabled={saveReport.isPending}
                      data-testid="button-save-module"
                    >
                      <Save className="h-3.5 w-3.5" /> {modeConfig.saveLabel}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* ── Saved Reports History ── */}
      {savedReports.length > 0 && (
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-toggle-history"
            >
              {historyOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Clock className="h-3.5 w-3.5" />
              Riwayat Laporan ({savedReports.length})
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedReports.map((r) => {
                const mc = MODE_MAP[r.mode as ReportMode];
                const Icon = mc?.icon ?? FileText;
                return (
                  <Card
                    key={r.id}
                    className="hover:shadow-sm transition-shadow cursor-pointer group"
                    onClick={() => handleLoadHistory(r)}
                    data-testid={`card-report-${r.id}`}
                  >
                    <CardContent className="p-3.5 flex items-start gap-3">
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{r.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 capitalize">{mc?.label ?? r.mode}</Badge>
                          {r.savedToModule && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 text-primary border-primary/30">
                              → {r.savedToModule}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(r.createdAt)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}
                        data-testid={`button-delete-report-${r.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* ── Delete confirmation ── */}
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus laporan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Riwayat laporan ini akan dihapus. Jika sudah disimpan ke modul lain, data di modul tersebut tidak terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteReport.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
