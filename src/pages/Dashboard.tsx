import {
  Users, Wallet, CalendarDays, FileText, Sparkles,
  TrendingUp, TrendingDown, ArrowRight, Bot,
  CheckCircle2, AlertCircle, Zap, Activity,
  Clock, Circle, ChevronRight, BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Notulensi, Agenda, FiturTerbaru } from "../../shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InsightData {
  notulensiThisWeek: number;
  notulensiLastWeek: number;
  agendaThisMonth: number;
  agendaLastMonth: number;
  fiturThisMonth: number;
  completedFitur: number;
  inProgressFitur: number;
  totalFitur: number;
  topCategory: string | null;
  incomeThisMonth: number;
  incomeLastMonth: number;
  expenseThisMonth: number;
  expenseLastMonth: number;
  balance: number;
}

interface DashboardData {
  totalAnggota: number;
  upcomingAgenda: number;
  totalNotulensi: number;
  draftNotulensi: number;
  saldoTersedia: number;
  totalIncome: number;
  totalExpense: number;
  recentNotulensi: Notulensi[];
  upcomingAgendaList: Agenda[];
  latestFitur: FiturTerbaru[];
  insights: InsightData;
}

type InsightTone = "positive" | "negative" | "neutral" | "warning";

interface Insight {
  id: string;
  tone: InsightTone;
  icon: any;
  label: string;
  text: string;
  link?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  return "Rp " + n.toLocaleString("id-ID");
}

function buildInsights(data: DashboardData): Insight[] {
  const { insights, draftNotulensi, upcomingAgenda } = data;
  const list: Insight[] = [];

  if (insights.notulensiThisWeek > insights.notulensiLastWeek) {
    list.push({ id: "notulensi-up", tone: "positive", icon: FileText, label: "Notulensi", text: `${insights.notulensiThisWeek} baru minggu ini — naik dari ${insights.notulensiLastWeek} minggu lalu.`, link: "/notulensi" });
  } else if (insights.notulensiThisWeek === 0) {
    list.push({ id: "notulensi-none", tone: "warning", icon: FileText, label: "Notulensi", text: "Belum ada notulensi baru minggu ini.", link: "/notulensi" });
  } else {
    list.push({ id: "notulensi-stable", tone: "neutral", icon: FileText, label: "Notulensi", text: `${insights.notulensiThisWeek} notulensi minggu ini — stabil.`, link: "/notulensi" });
  }

  if (draftNotulensi > 0) {
    list.push({ id: "draft-pending", tone: "warning", icon: AlertCircle, label: "Draft Pending", text: `${draftNotulensi} notulensi masih draft — perlu difinalkan.`, link: "/notulensi" });
  }

  if (insights.balance > 0) {
    list.push({ id: "balance-healthy", tone: "positive", icon: Wallet, label: "Keuangan", text: `Saldo kas positif — kondisi keuangan sehat.`, link: "/keuangan" });
  } else if (data.totalIncome > 0 || data.totalExpense > 0) {
    list.push({ id: "balance-low", tone: "negative", icon: Wallet, label: "Keuangan", text: `Saldo kas negatif — pengeluaran melebihi pemasukan.`, link: "/keuangan" });
  }

  if (insights.fiturThisMonth > 0) {
    list.push({ id: "fitur-active", tone: "positive", icon: Sparkles, label: "Produk", text: `${insights.fiturThisMonth} fitur baru bulan ini.${insights.topCategory ? ` Kategori: ${insights.topCategory}.` : ""}`, link: "/fitur" });
  }

  if (upcomingAgenda > 2) {
    list.push({ id: "agenda-busy", tone: "neutral", icon: CalendarDays, label: "Agenda", text: `${upcomingAgenda} agenda mendatang — pastikan semua peserta siap.`, link: "/agenda" });
  }

  return list.slice(0, 4);
}

const TONE: Record<InsightTone, { bg: string; dot: string; label: string; text: string }> = {
  positive: { bg: "bg-emerald-50 border-emerald-100", dot: "bg-emerald-400", label: "text-emerald-700 bg-emerald-100", text: "text-emerald-800" },
  negative:  { bg: "bg-rose-50 border-rose-100",      dot: "bg-rose-400",    label: "text-rose-700 bg-rose-100",     text: "text-rose-800"   },
  warning:   { bg: "bg-amber-50 border-amber-100",    dot: "bg-amber-400",   label: "text-amber-700 bg-amber-100",   text: "text-amber-800"  },
  neutral:   { bg: "bg-white border-border",           dot: "bg-violet-400",  label: "text-violet-700 bg-violet-100", text: "text-foreground" },
};

// ─── Top stat chip ─────────────────────────────────────────────────────────────

function StatChip({ icon: Icon, label, value, color = "purple" }: { icon: any; label: string; value: string | number; color?: "purple" | "green" | "blue" | "amber" }) {
  const colors = {
    purple: "bg-violet-50 border-violet-100 text-violet-700",
    green:  "bg-emerald-50 border-emerald-100 text-emerald-700",
    blue:   "bg-blue-50 border-blue-100 text-blue-700",
    amber:  "bg-amber-50 border-amber-100 text-amber-700",
  };
  return (
    <div className={cn("flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-150 hover:shadow-sm cursor-default", colors[color])}>
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60">{label}</p>
        <p className="text-sm font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Agenda task card ──────────────────────────────────────────────────────────

function AgendaCard({ item, active }: { item: Agenda; active: boolean }) {
  return (
    <div
      className={cn(
        "flex-shrink-0 w-64 rounded-2xl p-4 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer select-none",
        active
          ? "text-white border-transparent"
          : "bg-white border-border",
      )}
      style={active ? {
        background: "linear-gradient(135deg, hsl(265,83%,55%) 0%, hsl(285,75%,48%) 100%)",
        boxShadow: "0 8px 28px rgba(124,58,237,0.35)",
      } : {
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
            active ? "bg-white/20 text-white/90" : "bg-violet-50 text-violet-600",
          )}
        >
          {item.status}
        </span>
        <Clock className={cn("h-3.5 w-3.5", active ? "text-white/60" : "text-muted-foreground")} />
      </div>
      <p className={cn("text-sm font-semibold leading-tight mb-2 line-clamp-2", active ? "text-white" : "text-foreground")}>{item.title}</p>
      <div className={cn("flex items-center gap-1.5 text-xs", active ? "text-white/65" : "text-muted-foreground")}>
        <CalendarDays className="h-3 w-3" />
        <span>{item.date}</span>
        <span>·</span>
        <span>{item.time}</span>
      </div>
      {item.pic && (
        <div className={cn("flex items-center gap-1.5 mt-2 text-[11px]", active ? "text-white/60" : "text-muted-foreground")}>
          <Users className="h-3 w-3" />
          <span className="truncate">{item.pic}</span>
        </div>
      )}
    </div>
  );
}

// ─── Notulensi card ───────────────────────────────────────────────────────────

function NotulensiCard({ item }: { item: Notulensi }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{item.title}</p>
        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0",
            item.status === "final"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-amber-50 text-amber-700 border border-amber-100",
          )}
        >
          {item.status}
        </span>
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <CalendarDays className="h-3 w-3" /> {item.date}
      </p>
      {(item.decisions?.length ?? 0) > 0 && (
        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-1 pl-0.5">{item.decisions.length} keputusan</p>
      )}
    </div>
  );
}

// ─── Fitur card ───────────────────────────────────────────────────────────────

function FiturCard({ item }: { item: FiturTerbaru }) {
  const statusCfg: Record<string, { bg: string; text: string; label: string }> = {
    completed:   { bg: "bg-emerald-50", text: "text-emerald-600", label: "Selesai" },
    in_progress: { bg: "bg-violet-50",  text: "text-violet-600",  label: "Aktif"   },
    planned:     { bg: "bg-gray-50",    text: "text-gray-500",    label: "Planned"  },
    on_hold:     { bg: "bg-amber-50",   text: "text-amber-600",   label: "Ditunda"  },
  };
  const cfg = statusCfg[item.status] ?? statusCfg.planned;
  const impactDots = { low: 1, medium: 2, high: 3 }[item.impact] ?? 1;

  return (
    <div className="bg-white rounded-2xl border border-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-foreground leading-snug">{item.name}</p>
        <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 border", cfg.bg, cfg.text, cfg.bg.replace("bg-", "border-").replace("-50", "-100"))}>
          {cfg.label}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground truncate mb-2">{item.category}</p>
      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className={cn("h-1.5 w-5 rounded-full", i < impactDots ? "bg-violet-400" : "bg-muted")}
          />
        ))}
        <span className="text-[10px] text-muted-foreground ml-1 capitalize">{item.impact}</span>
      </div>
    </div>
  );
}

// ─── Right panel skeleton ──────────────────────────────────────────────────────

function PanelSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const { data, isLoading } = useQuery<DashboardData>({ queryKey: ["/api/dashboard"] });

  const insights = data ? buildInsights(data) : [];

  return (
    <div className="animate-fade-in min-h-screen">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Command Center</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">AINA Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Situasi dan aktivitas terkini organisasi</p>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-2">
            <StatChip icon={FileText}     label="Notulensi"      value={isLoading ? "—" : data?.totalNotulensi ?? 0}    color="purple" />
            <StatChip icon={CalendarDays} label="Agenda Aktif"   value={isLoading ? "—" : data?.upcomingAgenda ?? 0}    color="blue"   />
            <StatChip icon={Sparkles}     label="Fitur Dibangun" value={isLoading ? "—" : data?.insights?.totalFitur ?? 0} color="amber" />
            <StatChip icon={Users}        label="Anggota"        value={isLoading ? "—" : data?.totalAnggota ?? 0}      color="green"  />
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT: left content + right panel ─────────────────────── */}
      <div className="flex gap-5 items-start">

        {/* ── LEFT — main content ───────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Insights */}
          {(isLoading || insights.length > 0) && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Ringkasan Situasi</h2>
                <span className="text-xs text-muted-foreground">— apa yang sedang terjadi</span>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {insights.map((insight) => {
                    const t = TONE[insight.tone];
                    const Icon = insight.icon;
                    const card = (
                      <div className={cn("flex items-start gap-3 p-4 rounded-2xl border hover:shadow-sm transition-all duration-150 hover:-translate-y-0.5", t.bg)}>
                        <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", t.dot)} />
                        <div className="flex-1 min-w-0 space-y-1">
                          <span className={cn("inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full", t.label)}>
                            {insight.label}
                          </span>
                          <p className={cn("text-sm leading-relaxed", t.text)}>{insight.text}</p>
                        </div>
                      </div>
                    );
                    return insight.link ? (
                      <Link key={insight.id} to={insight.link}>{card}</Link>
                    ) : (
                      <div key={insight.id}>{card}</div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Agenda — horizontal scroll task cards */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Agenda Mendatang</h2>
                {!isLoading && (
                  <span className="text-[10px] font-bold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full border border-violet-100">
                    {data?.upcomingAgendaList?.length ?? 0} agenda
                  </span>
                )}
              </div>
              <Link to="/agenda">
                <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                  Lihat Semua <ChevronRight className="h-3 w-3" />
                </button>
              </Link>
            </div>

            {isLoading ? (
              <div className="flex gap-3 overflow-hidden">
                {[1,2,3].map(i => <div key={i} className="flex-shrink-0 w-64 h-32 rounded-2xl bg-muted/40 animate-pulse" />)}
              </div>
            ) : (data?.upcomingAgendaList?.length ?? 0) === 0 ? (
              <div className="bg-white rounded-2xl border border-border p-5 text-center" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <CalendarDays className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada agenda mendatang.</p>
                <Link to="/agenda"><p className="text-xs text-primary mt-1 hover:underline">Tambah agenda</p></Link>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {data?.upcomingAgendaList.map((item, idx) => (
                  <AgendaCard key={item.id} item={item} active={idx === 0} />
                ))}
              </div>
            )}
          </section>

          {/* Notulensi grid */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Notulensi Terbaru</h2>
              </div>
              <Link to="/notulensi">
                <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                  Lihat Semua <ChevronRight className="h-3 w-3" />
                </button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse" />)}
              </div>
            ) : (data?.recentNotulensi?.length ?? 0) === 0 ? (
              <div className="bg-white rounded-2xl border border-border p-5 text-center" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada notulensi.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {data?.recentNotulensi.map((item) => <NotulensiCard key={item.id} item={item} />)}
              </div>
            )}
          </section>

          {/* Fitur grid */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Fitur Terbaru AINA</h2>
              </div>
              <Link to="/fitur">
                <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                  Lihat Semua <ChevronRight className="h-3 w-3" />
                </button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />)}
              </div>
            ) : (data?.latestFitur?.length ?? 0) === 0 ? (
              <div className="bg-white rounded-2xl border border-border p-5 text-center" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada fitur.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {data?.latestFitur.map((item) => <FiturCard key={item.id} item={item} />)}
              </div>
            )}
          </section>

          {/* Financial summary */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Ringkasan Keuangan</h2>
              </div>
              {isAdmin && (
                <Link to="/keuangan">
                  <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                    Detail <ChevronRight className="h-3 w-3" />
                  </button>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-emerald-100 p-4 hover:shadow-sm transition-all" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dana Masuk</p>
                </div>
                <p className="text-lg font-bold text-emerald-600">{isLoading ? "—" : formatRp(data?.totalIncome ?? 0)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-rose-100 p-4 hover:shadow-sm transition-all" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dana Keluar</p>
                </div>
                <p className="text-lg font-bold text-rose-600">{isLoading ? "—" : formatRp(data?.totalExpense ?? 0)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-violet-100 p-4 hover:shadow-sm transition-all" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-3.5 w-3.5 text-violet-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saldo Bersih</p>
                </div>
                <p className="text-lg font-bold text-violet-600">{isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)}</p>
              </div>
            </div>
          </section>
        </div>

        {/* ── RIGHT — floating dark panel ───────────────────────────────── */}
        <div
          className="hidden xl:flex flex-col w-72 shrink-0 rounded-3xl overflow-hidden sticky top-20"
          style={{
            background: "hsl(240,14%,11%)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.14)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Panel header */}
          <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Smart Assistant</p>
            </div>
            <h3 className="text-sm font-bold text-white">AI Report Assistant</h3>
          </div>

          {/* AI section */}
          {isAdmin ? (
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <div
                className="rounded-2xl p-4 mb-3"
                style={{ background: "linear-gradient(135deg, hsl(265,83%,40%) 0%, hsl(285,75%,32%) 100%)", boxShadow: "0 4px 16px rgba(124,58,237,0.30)" }}
              >
                <Bot className="h-7 w-7 text-white/80 mb-2" />
                <p className="text-xs text-white/70 leading-relaxed mb-3">
                  Ubah catatan mentah menjadi notulensi, laporan progress, atau ringkasan investor secara otomatis.
                </p>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/15 text-white/80">
                  <Zap className="h-2.5 w-2.5" /> GPT-4o mini · Aktif
                </span>
              </div>
              <Link to="/ai-report">
                <button
                  className="w-full h-9 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, hsl(265,83%,55%), hsl(285,75%,48%))", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}
                >
                  Buka AI Report →
                </button>
              </Link>
            </div>
          ) : (
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)" }}>
                <Bot className="h-6 w-6 text-white/25 mb-2" />
                <p className="text-xs text-white/35 leading-relaxed">AI Report tersedia untuk admin.</p>
              </div>
            </div>
          )}

          {/* Insight summary in panel */}
          <div className="px-5 py-4 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Highlights</p>
            {isLoading ? (
              <PanelSkeleton />
            ) : insights.length === 0 ? (
              <p className="text-xs text-white/25">Belum ada insight.</p>
            ) : (
              <div className="space-y-2">
                {insights.map((insight) => {
                  const Icon = insight.icon;
                  const dotColor = {
                    positive: "bg-emerald-400",
                    negative: "bg-rose-400",
                    warning:  "bg-amber-400",
                    neutral:  "bg-violet-400",
                  }[insight.tone];
                  return (
                    <div key={insight.id} className="flex items-start gap-2.5 p-3 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer">
                      <div className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", dotColor)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-0.5">{insight.label}</p>
                        <p className="text-[12px] text-white/65 leading-snug">{insight.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Financial quick view */}
          <div className="px-5 pb-5">
            <div className="rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2.5">Kas Bersih</p>
              <p className="text-2xl font-bold text-white mb-1">{isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)}</p>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-emerald-400">↑ {isLoading ? "—" : formatRp(data?.totalIncome ?? 0)}</span>
                <span className="text-rose-400">↓ {isLoading ? "—" : formatRp(data?.totalExpense ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
