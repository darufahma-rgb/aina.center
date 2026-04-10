import { useState, useEffect } from "react";
import {
  Target, Lightbulb, Shield, Sparkles, TrendingUp, Rocket,
  Eye, EyeOff, Edit2, Wallet, BarChart3, Settings2, LayoutList,
  CheckCheck, ChevronRight, ArrowLeft, Presentation, Handshake,
  CircleDot, Save, X, AlertCircle, HeartHandshake, Zap, Map,
  DollarSign, Activity, Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { FiturTerbaru, InvestorContent } from "../../shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvestorConfig {
  featuredFiturIds: number[];
  showFinancial: boolean;
  showSponsor: boolean;
  hideAmounts: boolean;
}

const DEFAULT_CONFIG: InvestorConfig = {
  featuredFiturIds: [],
  showFinancial: true,
  showSponsor: true,
  hideAmounts: false,
};

// ─── Sections definition (narrative order) ────────────────────────────────────

const SECTIONS = [
  {
    key: "about",
    label: "Tentang AINA",
    chapter: "01",
    defaultTitle: "Platform Manajemen Organisasi Internal",
    icon: Building2,
    defaultContent: "AINA adalah sistem portal internal yang menyatukan seluruh operasional organisasi — dari dokumentasi rapat, pengelolaan keuangan, hingga relasi anggota — dalam satu platform yang efisien dan transparan.",
  },
  {
    key: "problem",
    label: "Masalah",
    chapter: "02",
    defaultTitle: "Organisasi Masih Berjalan Manual",
    icon: AlertCircle,
    defaultContent: "Sebagian besar organisasi masih mengandalkan spreadsheet terpisah, grup chat yang tidak terstruktur, dan proses manual yang membuang waktu. Data tersebar, tidak terekam, dan sulit dilacak. Akibatnya, keputusan dibuat tanpa data yang cukup.",
  },
  {
    key: "why_matters",
    label: "Mengapa Penting",
    chapter: "03",
    defaultTitle: "Inefisiensi Adalah Biaya Tersembunyi",
    icon: HeartHandshake,
    defaultContent: "Setiap jam yang hilang karena proses manual adalah biaya nyata. Ketika organisasi tumbuh, masalah ini semakin besar. Saat ini adalah waktu yang tepat — digitalisasi operasional bukan lagi pilihan, melainkan kebutuhan untuk bertahan dan berkembang.",
  },
  {
    key: "solution",
    label: "Solusi",
    chapter: "04",
    defaultTitle: "AINA: Satu Platform, Semua Terjawab",
    icon: Zap,
    defaultContent: "AINA menyatukan seluruh alur kerja organisasi dalam satu sistem yang mudah digunakan. Tidak perlu lagi berpindah antara berbagai aplikasi. Semua orang di organisasi melihat informasi yang sama, secara real-time, dengan akses yang disesuaikan perannya.",
  },
  {
    key: "milestones",
    label: "Progress",
    chapter: "06",
    defaultTitle: "Pencapaian & Milestone",
    icon: CheckCheck,
    defaultContent: "MVP selesai Q1 2026 • Beta testing berjalan Q2 2026 • 12 modul inti aktif • Sistem autentikasi & manajemen peran tersedia • AI Report Assistant terintegrasi",
  },
  {
    key: "roadmap",
    label: "Roadmap",
    chapter: "08",
    defaultTitle: "Yang Akan Datang",
    icon: Map,
    defaultContent: "Fase 2: Aplikasi mobile (Q3 2026) • Fase 3: Integrasi kalender & notifikasi otomatis • Fase 4: Dashboard analytics lanjutan • Fase 5: Fitur enterprise & multi-organisasi",
  },
];

const formatRp = (n: number) => "Rp " + Number(n).toLocaleString("id-ID");

// ─── Presentation Section ─────────────────────────────────────────────────────

function PresentationSection({
  chapter, label, title, content, icon: Icon, accent = false,
}: {
  chapter: string; label: string; title: string; content: string;
  icon: any; accent?: boolean;
}) {
  const lines = content.split(/\n|•/).map((s) => s.trim()).filter(Boolean);
  const isBullet = content.includes("•") || (lines.length > 2 && !content.includes("\n\n"));

  return (
    <section
      className="py-14 sm:py-16 border-b border-border/25 last:border-0"
      data-testid={`present-section-${chapter}`}
    >
      <div className="space-y-6">
        {/* Chapter label */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-muted-foreground/60">
            {chapter} — {label}
          </span>
        </div>

        {/* Heading + body */}
        <div className="space-y-4 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight text-foreground">
            {title}
          </h2>

          {isBullet ? (
            <ul className="space-y-2.5 mt-5">
              {lines.map((line, i) => (
                <li key={i} className="flex items-start gap-3 text-base text-foreground/70 leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-lg text-foreground/65 leading-relaxed whitespace-pre-line">{content}</p>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Feature Cards Presentation ───────────────────────────────────────────────

function FeaturedFeaturesPresentation({ fitur, chapter }: { fitur: FiturTerbaru[]; chapter: string }) {
  if (fitur.length === 0) return null;

  const statusColor: Record<string, string> = {
    completed: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    in_progress: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    planned: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    on_hold: "text-muted-foreground bg-muted border-border",
  };
  const statusLabel: Record<string, string> = {
    completed: "Selesai", in_progress: "Berjalan", planned: "Direncanakan", on_hold: "Tertunda",
  };

  return (
    <section className="py-14 sm:py-16 border-b border-border/25" data-testid="present-section-features">
      <div className="space-y-8">
        <div className="space-y-4 max-w-2xl">
          <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-muted-foreground/60">
            {chapter} — Fitur Utama
          </span>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight">
            Kemampuan Inti AINA
          </h2>
          <p className="text-lg text-foreground/65 leading-relaxed">
            Modul-modul utama yang menjalankan operasional organisasi secara menyeluruh.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fitur.map((f) => (
            <div
              key={f.id}
              className="flex items-start gap-4 p-5 rounded-2xl border bg-card hover:shadow-sm transition-shadow"
              data-testid={`present-feature-${f.id}`}
            >
              <div className="h-10 w-10 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center shrink-0">
                <CircleDot className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="font-bold text-sm leading-snug">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.category}</p>
                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor[f.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                  {statusLabel[f.status] ?? f.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Financial Summary Presentation ──────────────────────────────────────────

function FinancialPresentation({
  showSponsor, hideAmounts, chapter,
}: {
  showSponsor: boolean; hideAmounts: boolean; chapter: string;
}) {
  const { data: summary } = useQuery<any>({ queryKey: ["/api/finance/summary"] });
  if (!summary) return null;

  const balance = Number(summary.balance ?? 0);
  const income = Number(summary.totalIncome ?? 0);
  const expenses = Number(summary.totalExpenses ?? 0);
  const received = Number(summary.totalReceived ?? 0);
  const pledged = Number(summary.totalPledged ?? 0);

  const val = (n: number) => hideAmounts ? "—" : formatRp(n);

  const metrics = [
    {
      label: "Saldo Tersedia",
      value: val(balance),
      sub: "kas aktif organisasi",
      color: balance >= 0 ? "text-emerald-600" : "text-destructive",
      icon: Wallet,
    },
    {
      label: "Total Pemasukan",
      value: val(income),
      sub: "akumulasi sejak berdiri",
      color: "text-blue-600",
      icon: TrendingUp,
    },
    {
      label: "Total Pengeluaran",
      value: val(expenses),
      sub: "operasional & program",
      color: "text-amber-600",
      icon: BarChart3,
    },
  ];

  return (
    <section className="py-14 sm:py-16 border-b border-border/25" data-testid="present-section-financial">
      <div className="space-y-8">
        <div className="space-y-4 max-w-2xl">
          <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-muted-foreground/60">
            {chapter} — Keuangan
          </span>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight">
            Ringkasan Keuangan
          </h2>
          <p className="text-lg text-foreground/65 leading-relaxed">
            Gambaran kondisi finansial organisasi secara agregat — tidak ada detail transaksi individual.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {metrics.map((m) => {
            const MIcon = m.icon;
            return (
              <div key={m.label} className="p-6 rounded-2xl border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{m.label}</p>
                  <MIcon className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.sub}</p>
              </div>
            );
          })}
        </div>

        {showSponsor && summary.sponsorList?.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                Sponsor & Pendukung
              </p>
              <Badge variant="secondary" className="text-xs">
                {summary.activeSponsor} aktif
              </Badge>
            </div>
            <div className="space-y-3">
              {summary.sponsorList.slice(0, 5).map((sp: any) => {
                const pct = Number(sp.pledgedAmount) > 0
                  ? Math.min((Number(sp.receivedAmount) / Number(sp.pledgedAmount)) * 100, 100)
                  : 0;
                const statusLabel: Record<string, string> = {
                  prospect: "Prospek", confirmed: "Dikonfirmasi", active: "Aktif",
                  completed: "Selesai", withdrawn: "Batal",
                };
                return (
                  <div key={sp.id} className="flex items-center gap-4 p-4 rounded-xl border bg-muted/20" data-testid={`present-sponsor-${sp.id}`}>
                    <div className="w-36 shrink-0">
                      <p className="text-sm font-semibold truncate">{sp.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{statusLabel[sp.status] ?? sp.status}</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/50 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{pct.toFixed(0)}% terealisasi</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Presentation View ────────────────────────────────────────────────────────

function PresentationView({
  contents, config, allFitur, onExit, isAdmin,
}: {
  contents: InvestorContent[];
  config: InvestorConfig;
  allFitur: FiturTerbaru[];
  onExit?: () => void;
  isAdmin: boolean;
}) {
  const getContent = (key: string) => contents.find((c) => c.key === key);

  const featuredFitur = config.featuredFiturIds.length > 0
    ? allFitur.filter((f) => config.featuredFiturIds.includes(f.id))
    : allFitur.filter((f) => f.isInvestorVisible);

  // Visible text sections in narrative order
  const textSections = SECTIONS.filter((s) => {
    const item = getContent(s.key);
    return item ? item.isVisible : true;
  });

  // Determine chapter numbers for dynamic sections
  const textCount = textSections.length;
  const featChapter = String(Math.min(textSections.findIndex((s) => s.key === "solution") + 2, textCount + 1)).padStart(2, "0");
  const finChapter = String(parseInt(featChapter) + 1).padStart(2, "0");

  return (
    <div className="min-h-full bg-background">
      {/* Admin control bar */}
      {isAdmin && onExit && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/30 px-5 py-2.5 flex items-center justify-between">
          <Button
            variant="ghost" size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={onExit}
            data-testid="button-exit-presentation"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Panel Admin
          </Button>
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary/80">
            Tampilan Investor
          </Badge>
        </div>
      )}

      <div className="max-w-[700px] mx-auto px-6 sm:px-10 pb-24">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="pt-20 sm:pt-28 pb-16 sm:pb-20 space-y-8" data-testid="present-hero">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
            <span className="text-primary-foreground font-black text-xl tracking-tight">A</span>
          </div>
          <div className="space-y-3">
            <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-muted-foreground/60">
              Internal Management System
            </p>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none text-foreground">
              AINA Portal
            </h1>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-md">
              Satu sistem untuk semua kebutuhan operasional organisasi.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px w-8 bg-primary/40" />
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* ── Narrative Sections ───────────────────────────────────── */}
        {textSections.map((s, idx) => {
          const item = getContent(s.key);
          return (
            <PresentationSection
              key={s.key}
              chapter={s.chapter}
              label={s.label}
              title={item?.title ?? s.defaultTitle}
              content={item?.content ?? s.defaultContent}
              icon={s.icon}
            />
          );
        })}

        {/* ── Core Features (05) ───────────────────────────────────── */}
        <FeaturedFeaturesPresentation fitur={featuredFitur} chapter="05" />

        {/* ── Financial (07) ──────────────────────────────────────── */}
        {config.showFinancial && (
          <FinancialPresentation
            showSponsor={config.showSponsor}
            hideAmounts={config.hideAmounts}
            chapter="07"
          />
        )}

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="py-16 space-y-4" data-testid="present-footer">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-black text-sm">A</span>
              </div>
              <div>
                <p className="text-sm font-bold">AINA Portal</p>
                <p className="text-xs text-muted-foreground">Internal Management System</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/50 max-w-xs text-right">
              Dokumen ini bersifat konfidensial dan hanya untuk keperluan presentasi kepada investor dan pemangku kepentingan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Content Edit Dialog ──────────────────────────────────────────────────────

function ContentEditDialog({ item, sectionMeta, onClose, onSave }: {
  item: InvestorContent;
  sectionMeta?: typeof SECTIONS[number];
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Judul Seksi</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-investor-title" />
      </div>
      <div className="space-y-1.5">
        <Label>Narasi / Konten</Label>
        <p className="text-xs text-muted-foreground">Untuk poin-poin, gunakan • di awal baris. Tekan Enter untuk baris baru.</p>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={9}
          className="font-mono text-sm resize-none"
          placeholder={sectionMeta?.defaultContent}
          data-testid="input-investor-content"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={() => onSave({ title, content })} data-testid="button-save-investor">
          <Save className="h-3.5 w-3.5 mr-1.5" /> Simpan
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

function AdminPanel({
  contents, allFitur, config, onConfigChange, onSaveConfig, isSavingConfig,
}: {
  contents: InvestorContent[];
  allFitur: FiturTerbaru[];
  config: InvestorConfig;
  onConfigChange: (c: InvestorConfig) => void;
  onSaveConfig: () => void;
  isSavingConfig: boolean;
}) {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<InvestorContent | null>(null);

  const updateContent = useMutation({
    mutationFn: ({ key, data }: { key: string; data: any }) =>
      apiRequest("PUT", `/api/investor-content/${key}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investor-content"] });
      setEditingItem(null);
      toast({ title: "Konten diperbarui" });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const toggleVisibility = useMutation({
    mutationFn: ({ id, isVisible }: { id: number; isVisible: boolean }) =>
      apiRequest("PATCH", `/api/investor-content/${id}/visibility`, { isVisible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investor-content"] });
      toast({ title: "Visibilitas diperbarui" });
    },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const getItem = (key: string) => contents.find((c) => c.key === key);

  const toggleFitur = (id: number) => {
    const ids = config.featuredFiturIds;
    onConfigChange({
      ...config,
      featuredFiturIds: ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="content">
        <TabsList className="h-9 w-full">
          <TabsTrigger value="content" className="text-xs flex-1 gap-1.5">
            <LayoutList className="h-3.5 w-3.5" /> Narasi
          </TabsTrigger>
          <TabsTrigger value="features" className="text-xs flex-1 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Fitur
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs flex-1 gap-1.5">
            <Settings2 className="h-3.5 w-3.5" /> Pengaturan
          </TabsTrigger>
        </TabsList>

        {/* ── Narrative Content Tab ── */}
        <TabsContent value="content" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground pb-1">
            Kelola teks di setiap seksi presentasi. Urutan narasi: Tentang → Masalah → Mengapa Penting → Solusi → Fitur → Progress → Keuangan → Roadmap
          </p>
          {SECTIONS.map((s) => {
            const item = getItem(s.key);
            const Icon = s.icon;
            const isVisible = item ? item.isVisible : true;
            const title = item?.title ?? s.defaultTitle;
            const content = item?.content ?? s.defaultContent;
            return (
              <Card key={s.key} className={!isVisible ? "opacity-50 border-dashed" : ""} data-testid={`admin-section-${s.key}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <span className="text-[9px] font-black text-muted-foreground/40 tabular-nums">{s.chapter}</span>
                        <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center">
                          <Icon className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{title}</p>
                          <Badge variant="secondary" className="text-[9px] px-1.5">{s.label}</Badge>
                          {!isVisible && <Badge variant="outline" className="text-[9px] border-border">Tersembunyi</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{content}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item && (
                        <>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title={isVisible ? "Sembunyikan" : "Tampilkan"}
                            onClick={() => toggleVisibility.mutate({ id: item.id, isVisible: !isVisible })}
                            data-testid={`button-toggle-${s.key}`}
                          >
                            {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditingItem(item)}
                            data-testid={`button-edit-${s.key}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {!item && (
                        <Button
                          variant="ghost" size="sm" className="text-xs text-primary h-7 px-2"
                          onClick={() => updateContent.mutate({
                            key: s.key,
                            data: { title: s.defaultTitle, content: s.defaultContent, order: SECTIONS.indexOf(s) + 1 },
                          })}
                          data-testid={`button-init-${s.key}`}
                        >
                          Inisialisasi
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ── Feature Picker Tab ── */}
        <TabsContent value="features" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Pilih fitur yang ditampilkan kepada investor. Jika tidak ada yang dipilih, semua fitur bertanda <em>investor visible</em> akan tampil otomatis.
          </p>
          {allFitur.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Belum ada data fitur. Tambahkan di halaman Fitur Terbaru.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {allFitur.map((f) => {
                const selected = config.featuredFiturIds.includes(f.id);
                const statusColor: Record<string, string> = {
                  completed: "text-emerald-600", in_progress: "text-blue-600",
                  planned: "text-amber-600", on_hold: "text-muted-foreground",
                };
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleFitur(f.id)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${selected ? "border-primary/40 bg-primary/[0.04]" : "border-border hover:bg-muted/30"}`}
                    data-testid={`button-toggle-fitur-${f.id}`}
                  >
                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                      {selected && <CheckCheck className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        {f.isInvestorVisible && (
                          <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 shrink-0">visible</Badge>
                        )}
                      </div>
                      <p className={`text-xs text-muted-foreground mt-0.5 ${statusColor[f.status] ?? ""}`}>
                        {f.category} · {f.status.replace("_", " ")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {config.featuredFiturIds.length > 0
                ? `${config.featuredFiturIds.length} fitur dipilih secara manual`
                : "Otomatis: tampilkan yang investor-visible"}
            </p>
            {config.featuredFiturIds.length > 0 && (
              <Button
                variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground"
                onClick={() => onConfigChange({ ...config, featuredFiturIds: [] })}
              >
                Reset
              </Button>
            )}
          </div>
          <Button
            className="w-full gap-2 h-9"
            onClick={onSaveConfig}
            disabled={isSavingConfig}
            data-testid="button-save-fitur-config"
          >
            <Save className="h-3.5 w-3.5" />
            {isSavingConfig ? "Menyimpan..." : "Simpan Pilihan Fitur"}
          </Button>
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">Kendalikan informasi apa yang muncul di presentasi investor.</p>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> Seksi Keuangan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: "showFinancial",
                  label: "Tampilkan ringkasan keuangan",
                  description: "Saldo, total pemasukan, total pengeluaran",
                },
                {
                  key: "showSponsor",
                  label: "Tampilkan daftar sponsor",
                  description: "Nama dan progress pendanaan dari setiap sponsor",
                },
                {
                  key: "hideAmounts",
                  label: "Sembunyikan nominal rupiah",
                  description: "Tampilkan persentase saja, tanpa angka aktual",
                },
              ].map(({ key, label, description }) => {
                const val = config[key as keyof InvestorConfig] as boolean;
                return (
                  <div key={key} className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                    <button
                      onClick={() => onConfigChange({ ...config, [key]: !val })}
                      className={`h-6 w-11 rounded-full transition-colors shrink-0 mt-0.5 relative ${val ? "bg-primary" : "bg-muted"}`}
                      data-testid={`toggle-${key}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${val ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              <strong>Keamanan data:</strong> Investor Mode tidak pernah menampilkan transaksi individual, catatan internal, data anggota & relasi, atau log sistem. Hanya ringkasan agregat yang ditampilkan.
            </p>
          </div>

          <Button
            className="w-full gap-2 h-9"
            onClick={onSaveConfig}
            disabled={isSavingConfig}
            data-testid="button-save-settings"
          >
            <Save className="h-3.5 w-3.5" />
            {isSavingConfig ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Edit content dialog */}
      <Dialog open={!!editingItem} onOpenChange={(v) => !v && setEditingItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Konten Seksi</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ContentEditDialog
              item={editingItem}
              sectionMeta={SECTIONS.find((s) => s.key === editingItem.key)}
              onClose={() => setEditingItem(null)}
              onSave={(data) => updateContent.mutate({ key: editingItem.key, data })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvestorModePage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<InvestorConfig>(DEFAULT_CONFIG);

  const { data: contents = [] } = useQuery<InvestorContent[]>({ queryKey: ["/api/investor-content"] });
  const { data: allFitur = [] } = useQuery<FiturTerbaru[]>({ queryKey: ["/api/fitur"] });

  useEffect(() => {
    const configEntry = contents.find((c) => c.key === "_config");
    if (configEntry?.content) {
      try {
        const parsed = JSON.parse(configEntry.content);
        setLocalConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch { /* use default */ }
    }
  }, [contents]);

  const saveConfig = useMutation({
    mutationFn: () =>
      apiRequest("PUT", "/api/investor-content/_config", {
        title: "Featured Config",
        content: JSON.stringify(localConfig),
        isVisible: false,
        order: 99,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investor-content"] });
      toast({ title: "Pengaturan disimpan" });
    },
    onError: (e: any) =>
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" }),
  });

  // Non-admin: full-screen presentation only
  if (!isAdmin) {
    return (
      <PresentationView
        contents={contents.filter((c) => c.key !== "_config")}
        config={localConfig}
        allFitur={allFitur}
        isAdmin={false}
      />
    );
  }

  // Admin: control panel + presentation dialog
  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Investor Mode"
        description="Kelola presentasi pitch-deck untuk investor dan pemangku kepentingan"
      >
        <Button
          className="gap-2"
          onClick={() => setPresentationOpen(true)}
          data-testid="button-open-presentation"
        >
          <Presentation className="h-4 w-4" /> Lihat Presentasi
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </PageHeader>

      {/* Admin info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Settings2 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">Panel Kontrol Admin</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Atur narasi di setiap seksi, pilih fitur yang ditampilkan, dan kendalikan data keuangan. Klik <strong>Lihat Presentasi</strong> untuk melihat tampilan investor sesungguhnya — terstruktur seperti pitch deck.
          </p>
        </div>
      </div>

      {/* Privacy guard summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Transaksi individual" },
          { label: "Catatan rapat internal" },
          { label: "Data anggota & relasi" },
          { label: "Log audit sistem" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20 text-xs"
          >
            <div className="h-1.5 w-1.5 rounded-full shrink-0 bg-muted-foreground/30" />
            <span className="text-muted-foreground line-through">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Admin controls */}
      <AdminPanel
        contents={contents.filter((c) => c.key !== "_config")}
        allFitur={allFitur}
        config={localConfig}
        onConfigChange={setLocalConfig}
        onSaveConfig={() => saveConfig.mutate()}
        isSavingConfig={saveConfig.isPending}
      />

      {/* Presentation Dialog — full screen */}
      <Dialog open={presentationOpen} onOpenChange={setPresentationOpen}>
        <DialogContent
          className="max-w-none w-screen h-screen p-0 m-0 rounded-none overflow-y-auto [&>button:last-child]:hidden"
          data-testid="dialog-presentation"
        >
          <PresentationView
            contents={contents.filter((c) => c.key !== "_config")}
            config={localConfig}
            allFitur={allFitur}
            onExit={() => setPresentationOpen(false)}
            isAdmin={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
