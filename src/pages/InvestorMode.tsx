import { useState, useEffect } from "react";
import {
  Target, Lightbulb, Shield, Sparkles, TrendingUp, Rocket,
  Eye, EyeOff, Edit2, Wallet, BarChart3, Settings2, LayoutList,
  CheckCheck, ChevronRight, ArrowLeft, Presentation, Handshake,
  CircleDot, Save, X,
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

// ─── Sections definition ──────────────────────────────────────────────────────

const SECTIONS = [
  { key: "about",      badge: "Tentang Kami",  defaultTitle: "Tentang AINA",                   icon: Target,    defaultContent: "AINA adalah platform manajemen organisasi internal yang dirancang untuk meningkatkan efisiensi operasional dan transparansi dengan pendekatan berbasis data." },
  { key: "problem",    badge: "Masalah",        defaultTitle: "Masalah yang Kami Selesaikan",   icon: Lightbulb, defaultContent: "Organisasi modern sering kesulitan mengelola dokumentasi, komunikasi, dan pelaporan internal secara efisien. AINA hadir sebagai solusi terintegrasi." },
  { key: "strengths",  badge: "Keunggulan",     defaultTitle: "Keunggulan Kami",                icon: Shield,    defaultContent: "AI-powered assistance • Role-based access control • Real-time collaboration • Modular architecture • Audit trail menyeluruh" },
  { key: "milestones", badge: "Pencapaian",     defaultTitle: "Milestone & Pencapaian",         icon: CheckCheck,defaultContent: "MVP Launch Q1 2026 • Beta Testing Q2 2026 • Public Release Q3 2026 • Enterprise Features Q4 2026" },
  { key: "roadmap",    badge: "Roadmap",        defaultTitle: "Arah Pengembangan",              icon: Rocket,    defaultContent: "Phase 1: Core modules (selesai) • Phase 2: AI integration (berjalan) • Phase 3: Mobile app • Phase 4: Enterprise features" },
];

const formatRp = (n: number) => "Rp " + Number(n).toLocaleString("id-ID");

// ─── Presentation Section ─────────────────────────────────────────────────────

function PresentationSection({
  num, badge, title, content, icon: Icon,
}: {
  num: number; badge: string; title: string; content: string; icon: any;
}) {
  return (
    <section className="flex items-start gap-6 py-10 border-b border-border/30 last:border-0" data-testid={`present-section-${num}`}>
      <div className="text-[80px] font-black text-foreground/[0.04] leading-none shrink-0 select-none hidden md:block w-[72px] text-right">
        {String(num).padStart(2, "0")}
      </div>
      <div className="flex-1 space-y-4 min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{badge}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{title}</h2>
        <p className="text-base text-foreground/70 leading-relaxed whitespace-pre-line">{content}</p>
      </div>
    </section>
  );
}

// ─── Financial Summary Presentation ──────────────────────────────────────────

function FinancialPresentation({ showSponsor, hideAmounts }: { showSponsor: boolean; hideAmounts: boolean }) {
  const { data: summary } = useQuery<any>({ queryKey: ["/api/finance/summary"] });
  if (!summary) return null;

  const balance = Number(summary.balance ?? 0);
  const income = Number(summary.totalIncome ?? 0);
  const received = Number(summary.totalReceived ?? 0);
  const pledged = Number(summary.totalPledged ?? 0);
  const fundingPct = pledged > 0 ? Math.min((received / pledged) * 100, 100) : 0;

  const val = (n: number) => hideAmounts ? "—" : formatRp(n);

  return (
    <section className="flex items-start gap-6 py-10 border-b border-border/30" data-testid="present-section-financial">
      <div className="text-[80px] font-black text-foreground/[0.04] leading-none shrink-0 select-none hidden md:block w-[72px] text-right">
        ₊
      </div>
      <div className="flex-1 space-y-6 min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Wallet className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Keuangan</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold leading-tight">Ringkasan Keuangan</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Saldo Tersedia</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-primary" : "text-destructive"}`}>{val(balance)}</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Total Pemasukan</p>
            <p className="text-2xl font-bold text-green-600">{val(income)}</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Dana Sponsor Diterima</p>
            <p className="text-2xl font-bold text-amber-600">{val(received)}</p>
            {!hideAmounts && pledged > 0 && (
              <p className="text-xs text-muted-foreground mt-1">dari {formatRp(pledged)} dijanjikan</p>
            )}
          </div>
        </div>

        {showSponsor && summary.sponsorList?.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Sponsor ({summary.activeSponsor} aktif dari {summary.totalSponsor} total)
            </p>
            <div className="space-y-2.5">
              {summary.sponsorList.slice(0, 5).map((sp: any) => {
                const pct = Number(sp.pledgedAmount) > 0
                  ? Math.min((Number(sp.receivedAmount) / Number(sp.pledgedAmount)) * 100, 100)
                  : 0;
                const statusLabel: Record<string, string> = { prospect: "Prospek", confirmed: "Dikonfirmasi", active: "Aktif", completed: "Selesai", withdrawn: "Batal" };
                return (
                  <div key={sp.id} className="flex items-center gap-4" data-testid={`present-sponsor-${sp.id}`}>
                    <div className="w-32 shrink-0">
                      <p className="text-sm font-medium truncate">{sp.name}</p>
                      <Badge variant="secondary" className="text-[9px] mt-0.5">{statusLabel[sp.status] ?? sp.status}</Badge>
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
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

// ─── Feature Cards Presentation ───────────────────────────────────────────────

function FeaturedFeaturesPresentation({ fitur }: { fitur: FiturTerbaru[] }) {
  if (fitur.length === 0) return null;
  const statusColor: Record<string, string> = {
    completed: "text-green-600 bg-green-500/10",
    in_progress: "text-blue-600 bg-blue-500/10",
    planned: "text-amber-600 bg-amber-500/10",
    on_hold: "text-muted-foreground bg-muted",
  };
  const statusLabel: Record<string, string> = { completed: "Selesai", in_progress: "Berjalan", planned: "Direncanakan", on_hold: "Tertunda" };

  return (
    <section className="flex items-start gap-6 py-10 border-b border-border/30" data-testid="present-section-features">
      <div className="text-[80px] font-black text-foreground/[0.04] leading-none shrink-0 select-none hidden md:block w-[72px] text-right">
        ✦
      </div>
      <div className="flex-1 space-y-4 min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Fitur Unggulan</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold leading-tight">Kemampuan Utama AINA</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fitur.map((f) => (
            <div key={f.id} className="flex items-start gap-3 p-4 rounded-xl border bg-card/60 hover:bg-card transition-colors" data-testid={`present-feature-${f.id}`}>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <CircleDot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{f.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.category}</p>
                <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-1.5 ${statusColor[f.status] ?? "bg-muted text-muted-foreground"}`}>
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

// ─── Presentation View ────────────────────────────────────────────────────────

function PresentationView({
  contents, config, allFitur, onExit, isAdmin,
}: {
  contents: InvestorContent[]; config: InvestorConfig;
  allFitur: FiturTerbaru[]; onExit?: () => void; isAdmin: boolean;
}) {
  const getContent = (key: string) => contents.find((c) => c.key === key);

  const visibleSections = SECTIONS.filter((s) => {
    const item = getContent(s.key);
    return item ? item.isVisible : true;
  });

  const featuredFitur = config.featuredFiturIds.length > 0
    ? allFitur.filter((f) => config.featuredFiturIds.includes(f.id))
    : allFitur.filter((f) => f.isInvestorVisible);

  let sectionNum = 0;

  return (
    <div className="min-h-full bg-background">
      {/* Control bar (admin only) */}
      {isAdmin && onExit && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onExit} data-testid="button-exit-presentation">
              <ArrowLeft className="h-3.5 w-3.5" /> Keluar Presentasi
            </Button>
          </div>
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
            Mode Presentasi — tampilan investor
          </Badge>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-5 sm:px-8 pb-20">
        {/* Hero */}
        <div className="text-center py-16 sm:py-20 space-y-5" data-testid="present-hero">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg">
            <span className="text-primary-foreground font-black text-2xl">A</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">AINA Portal</h1>
            <p className="text-lg text-muted-foreground font-medium">Internal Management System</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-xs px-3 py-1">
              {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </Badge>
          </div>
          <div className="w-16 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 mx-auto" />
        </div>

        {/* Text content sections */}
        {visibleSections.map((s) => {
          const item = getContent(s.key);
          sectionNum++;
          return (
            <PresentationSection
              key={s.key}
              num={sectionNum}
              badge={s.badge}
              title={item?.title ?? s.defaultTitle}
              content={item?.content ?? s.defaultContent}
              icon={s.icon}
            />
          );
        })}

        {/* Financial summary */}
        {config.showFinancial && (
          <FinancialPresentation showSponsor={config.showSponsor} hideAmounts={config.hideAmounts} />
        )}

        {/* Featured features */}
        <FeaturedFeaturesPresentation fitur={featuredFitur} />

        {/* Footer */}
        <div className="py-12 text-center space-y-2">
          <div className="w-8 h-0.5 bg-primary/30 mx-auto" />
          <p className="text-xs text-muted-foreground mt-4">AINA — Sistem Portal Internal</p>
          <p className="text-[10px] text-muted-foreground/50">Dokumen ini bersifat konfidensial untuk keperluan presentasi investor</p>
        </div>
      </div>
    </div>
  );
}

// ─── Content Edit Dialog ──────────────────────────────────────────────────────

function ContentEditDialog({ item, onClose, onSave }: {
  item: InvestorContent; onClose: () => void; onSave: (data: any) => void;
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
        <Label>Konten</Label>
        <p className="text-xs text-muted-foreground">Gunakan • untuk poin-poin. Tekan Enter untuk baris baru.</p>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="font-mono text-sm" data-testid="input-investor-content" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={() => onSave({ title, content })} data-testid="button-save-investor">Simpan</Button>
      </DialogFooter>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

function AdminPanel({
  contents, allFitur, config, onConfigChange, onSaveConfig,
  isSavingConfig,
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
    mutationFn: ({ key, data }: { key: string; data: any }) => apiRequest("PUT", `/api/investor-content/${key}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/investor-content"] }); setEditingItem(null); toast({ title: "Konten diperbarui" }); },
    onError: (e: any) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const toggleVisibility = useMutation({
    mutationFn: ({ id, isVisible }: { id: number; isVisible: boolean }) => apiRequest("PATCH", `/api/investor-content/${id}/visibility`, { isVisible }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/investor-content"] }); toast({ title: "Visibilitas diperbarui" }); },
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
          <TabsTrigger value="content" className="text-xs flex-1 gap-1.5"><LayoutList className="h-3.5 w-3.5" /> Konten</TabsTrigger>
          <TabsTrigger value="features" className="text-xs flex-1 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Fitur</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs flex-1 gap-1.5"><Settings2 className="h-3.5 w-3.5" /> Pengaturan</TabsTrigger>
        </TabsList>

        {/* ── Content Tab ── */}
        <TabsContent value="content" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">Kelola teks yang tampil di setiap seksi presentasi.</p>
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
                      <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{title}</p>
                          {!isVisible && <Badge variant="secondary" className="text-[9px]">Tersembunyi</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{content}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item && (
                        <>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
                            title={isVisible ? "Sembunyikan" : "Tampilkan"}
                            onClick={() => toggleVisibility.mutate({ id: item.id, isVisible: !isVisible })}
                            data-testid={`button-toggle-${s.key}`}
                          >
                            {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => setEditingItem(item)}
                            data-testid={`button-edit-${s.key}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {!item && (
                        <Button
                          variant="ghost" size="sm" className="text-xs text-primary h-7"
                          onClick={() => updateContent.mutate({ key: s.key, data: { title: s.defaultTitle, content: s.defaultContent, order: SECTIONS.indexOf(s) + 1 } })}
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
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Pilih fitur yang ditampilkan kepada investor. Jika tidak ada yang dipilih, semua fitur bertanda "investor visible" akan tampil.</p>
          </div>
          {allFitur.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Belum ada data fitur. Tambahkan di halaman Fitur Terbaru.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {allFitur.map((f) => {
                const selected = config.featuredFiturIds.includes(f.id);
                const statusColor: Record<string, string> = { completed: "text-green-600", in_progress: "text-blue-600", planned: "text-amber-600", on_hold: "text-muted-foreground" };
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleFitur(f.id)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-all ${selected ? "border-primary/50 bg-primary/[0.04]" : "border-muted hover:border-border hover:bg-muted/40"}`}
                    data-testid={`button-toggle-fitur-${f.id}`}
                  >
                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                      {selected && <X className="h-2.5 w-2.5 text-primary-foreground" style={{ transform: "rotate(45deg)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        {f.isInvestorVisible && <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-600">investor visible</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{f.category} · <span className={`capitalize ${statusColor[f.status] ?? ""}`}>{f.status.replace("_", " ")}</span></p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {config.featuredFiturIds.length > 0 ? `${config.featuredFiturIds.length} fitur dipilih` : "Otomatis: fitur investor-visible"}
            </p>
            {config.featuredFiturIds.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => onConfigChange({ ...config, featuredFiturIds: [] })}>
                Reset pilihan
              </Button>
            )}
          </div>
          <Button className="w-full gap-2 h-9" onClick={onSaveConfig} disabled={isSavingConfig} data-testid="button-save-fitur-config">
            <Save className="h-3.5 w-3.5" /> {isSavingConfig ? "Menyimpan..." : "Simpan Pilihan Fitur"}
          </Button>
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">Kendalikan informasi apa yang muncul di presentasi investor.</p>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Ringkasan Keuangan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  key: "showFinancial",
                  label: "Tampilkan seksi keuangan",
                  description: "Menampilkan ringkasan saldo, pemasukan, dan sponsor di presentasi",
                },
                {
                  key: "showSponsor",
                  label: "Tampilkan detail sponsor",
                  description: "Nama sponsor dan progress bar pendanaan",
                },
                {
                  key: "hideAmounts",
                  label: "Sembunyikan nominal (jumlah uang)",
                  description: "Tampilkan progress % saja, tanpa angka rupiah",
                },
              ].map(({ key, label, description }) => {
                const val = config[key as keyof InvestorConfig] as boolean;
                return (
                  <div key={key} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <button
                      onClick={() => onConfigChange({ ...config, [key]: !val })}
                      className={`h-6 w-11 rounded-full transition-colors shrink-0 mt-0.5 relative ${val ? "bg-primary" : "bg-muted"}`}
                      data-testid={`toggle-${key}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${val ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>Catatan keamanan:</strong> Investor Mode tidak pernah menampilkan transaksi individual, catatan internal, data anggota/relasi, atau informasi sensitif lainnya. Hanya ringkasan agregat yang tampil.
            </p>
          </div>

          <Button className="w-full gap-2 h-9" onClick={onSaveConfig} disabled={isSavingConfig} data-testid="button-save-settings">
            <Save className="h-3.5 w-3.5" /> {isSavingConfig ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Edit content dialog */}
      <Dialog open={!!editingItem} onOpenChange={(v) => !v && setEditingItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Konten Seksi</DialogTitle></DialogHeader>
          {editingItem && (
            <ContentEditDialog
              item={editingItem}
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

  // Load config from investorContent
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
    mutationFn: () => apiRequest("PUT", "/api/investor-content/_config", {
      title: "Featured Config",
      content: JSON.stringify(localConfig),
      isVisible: false,
      order: 99,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investor-content"] });
      toast({ title: "Pengaturan disimpan" });
    },
    onError: (e: any) => toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" }),
  });

  // Non-admin: only show presentation
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

  // Admin: show control panel + presentation dialog
  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Investor Mode" description="Kelola presentasi untuk investor dan pemangku kepentingan">
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
          <p className="text-sm font-medium">Panel Kontrol Admin</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atur konten, pilih fitur yang ditampilkan, dan kendalikan visibilitas informasi keuangan. Klik "Lihat Presentasi" untuk melihat tampilan investor sesungguhnya.
          </p>
        </div>
      </div>

      {/* Security summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Transaksi individual", shown: false },
          { label: "Catatan rapat internal", shown: false },
          { label: "Data anggota & relasi", shown: false },
          { label: "Log audit sistem", shown: false },
        ].map((item) => (
          <div key={item.label} className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${item.shown ? "border-green-500/30 bg-green-500/5" : "border-border bg-muted/30"}`}>
            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${item.shown ? "bg-green-500" : "bg-muted-foreground/40"}`} />
            <span className={item.shown ? "text-green-700" : "text-muted-foreground line-through"}>
              {item.label}
            </span>
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

      {/* Presentation Dialog */}
      <Dialog open={presentationOpen} onOpenChange={setPresentationOpen}>
        <DialogContent className="max-w-none w-screen h-screen p-0 m-0 rounded-none overflow-y-auto [&>button:last-child]:hidden" data-testid="dialog-presentation">
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
