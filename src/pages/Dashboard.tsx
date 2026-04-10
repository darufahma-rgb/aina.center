import {
  Users, Wallet, CalendarDays, FileText, Sparkles,
  TrendingUp, TrendingDown, Bot, Zap, Clock,
  CheckCircle2, AlertCircle, Activity, ChevronRight,
  BarChart3, Circle,
} from "lucide-react";
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

type InsightTone = "positive" | "negative" | "warning" | "neutral";
interface Insight { id: string; tone: InsightTone; label: string; text: string; link?: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return "Rp " + n.toLocaleString("id-ID");
}

function buildInsights(data: DashboardData): Insight[] {
  const list: Insight[] = [];
  const { insights, draftNotulensi, upcomingAgenda } = data;

  if (insights.notulensiThisWeek > insights.notulensiLastWeek) {
    list.push({ id: "n-up",  tone: "positive", label: "Notulensi",  text: `${insights.notulensiThisWeek} baru minggu ini`, link: "/notulensi" });
  } else if (insights.notulensiThisWeek === 0) {
    list.push({ id: "n-nil", tone: "warning",  label: "Notulensi",  text: "Belum ada notulensi baru minggu ini", link: "/notulensi" });
  } else {
    list.push({ id: "n-ok",  tone: "neutral",  label: "Notulensi",  text: `${insights.notulensiThisWeek} notulensi minggu ini`, link: "/notulensi" });
  }

  if (draftNotulensi > 0)
    list.push({ id: "draft", tone: "warning",  label: "Draft",  text: `${draftNotulensi} notulensi belum difinalkan`, link: "/notulensi" });

  if (insights.balance > 0)
    list.push({ id: "bal+",  tone: "positive", label: "Keuangan", text: "Saldo kas positif — sehat", link: "/keuangan" });
  else if (data.totalExpense > 0)
    list.push({ id: "bal-",  tone: "negative", label: "Keuangan", text: "Pengeluaran melebihi pemasukan", link: "/keuangan" });

  if (insights.fiturThisMonth > 0)
    list.push({ id: "fitur", tone: "positive", label: "Produk",   text: `${insights.fiturThisMonth} fitur baru bulan ini`, link: "/fitur" });

  if (upcomingAgenda > 3)
    list.push({ id: "busy",  tone: "neutral",  label: "Agenda",   text: `${upcomingAgenda} agenda mendatang`, link: "/agenda" });

  return list.slice(0, 5);
}

const TONE_STYLE: Record<InsightTone, { dot: string; badge: string; text: string }> = {
  positive: { dot: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700", text: "text-emerald-800" },
  negative: { dot: "bg-rose-400",    badge: "bg-rose-100 text-rose-700",       text: "text-rose-800"   },
  warning:  { dot: "bg-amber-400",   badge: "bg-amber-100 text-amber-700",     text: "text-amber-800"  },
  neutral:  { dot: "bg-violet-400",  badge: "bg-violet-100 text-violet-700",   text: "text-slate-700"  },
};

// ─── Left panel stat tile ─────────────────────────────────────────────────────

function StatTile({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <div className="rounded-2xl p-3.5 flex flex-col gap-1.5 cursor-default select-none transition-colors hover:bg-white/[0.06]"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between">
        <Icon className="h-3.5 w-3.5 text-white/25" />
      </div>
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
    </div>
  );
}

// ─── Left panel — notulensi list item ─────────────────────────────────────────

function NotulensiListItem({ item, active }: { item: Notulensi; active: boolean }) {
  const initials = (item.title ?? "?").slice(0, 2).toUpperCase();
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-3 py-3 mx-2 rounded-2xl cursor-pointer transition-all duration-150 group relative",
        active ? "text-white" : "hover:bg-white/[0.05]",
      )}
      style={active ? {
        background: "linear-gradient(135deg, hsl(265,83%,50%) 0%, hsl(285,70%,42%) 100%)",
        boxShadow: "0 4px 16px rgba(124,58,237,0.30)",
      } : {}}
    >
      <div
        className={cn("h-9 w-9 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0", active ? "bg-white/20 text-white" : "text-white")}
        style={active ? {} : { background: "rgba(124,58,237,0.35)" }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[13px] font-semibold leading-tight truncate", active ? "text-white" : "text-white/80")}>{item.title}</p>
        <p className={cn("text-[11px] mt-0.5 truncate", active ? "text-white/60" : "text-white/35")}>{item.date}</p>
        <span
          className={cn(
            "inline-block mt-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
            active
              ? "bg-white/20 text-white/80"
              : item.status === "final"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-amber-500/20 text-amber-400",
          )}
        >
          {item.status}
        </span>
      </div>
      <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity", active ? "opacity-60 text-white/60" : "text-white/30")} />
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const { data, isLoading } = useQuery<DashboardData>({ queryKey: ["/api/dashboard"] });

  const insights = data ? buildInsights(data) : [];
  const nextAgenda = data?.upcomingAgendaList?.[0];
  const activeNotulensi = data?.recentNotulensi?.[0];

  return (
    // Break out of PortalLayout's p-5 padding → full-bleed 3-column layout
    <div className="-m-5 flex" style={{ height: "calc(100vh - 3.5rem)" }}>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* LEFT DARK PANEL                                                  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div
        className="w-[300px] shrink-0 flex flex-col overflow-hidden"
        style={{ background: "#0F0F12", borderRight: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Stats grid 2×2 */}
        <div className="p-4 grid grid-cols-2 gap-2.5 shrink-0">
          <StatTile label="Notulensi"   value={isLoading ? "—" : data?.totalNotulensi   ?? 0} icon={FileText}     />
          <StatTile label="Agenda"      value={isLoading ? "—" : data?.upcomingAgenda   ?? 0} icon={CalendarDays} />
          <StatTile label="Anggota"     value={isLoading ? "—" : data?.totalAnggota     ?? 0} icon={Users}        />
          <StatTile label="Draft"       value={isLoading ? "—" : data?.draftNotulensi   ?? 0} icon={AlertCircle}  />
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-white/30" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/35">Notulensi</span>
          </div>
          <Link to="/notulensi">
            <span className="text-[10px] text-white/25 hover:text-white/50 transition-colors">Semua →</span>
          </Link>
        </div>

        {/* Notulensi list — scrollable */}
        <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "none" }}>
          {isLoading ? (
            <div className="space-y-2 px-4 py-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />)}
            </div>
          ) : (data?.recentNotulensi?.length ?? 0) === 0 ? (
            <div className="px-5 py-8 text-center">
              <FileText className="h-7 w-7 text-white/15 mx-auto mb-2" />
              <p className="text-xs text-white/25">Belum ada notulensi</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {data?.recentNotulensi.map((item, idx) => (
                <Link key={item.id} to="/notulensi">
                  <NotulensiListItem item={item} active={idx === 0} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Financial quick row at bottom */}
        <div className="px-4 py-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/25 mb-2">Kas Bersih</p>
          <p className="text-xl font-bold text-white mb-1.5">{isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)}</p>
          <div className="flex gap-3 text-[11px]">
            <span className="text-emerald-400">↑ {isLoading ? "—" : formatRp(data?.totalIncome ?? 0)}</span>
            <span className="text-rose-400">↓ {isLoading ? "—" : formatRp(data?.totalExpense ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* CENTER — main content                                            */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto bg-background" style={{ scrollbarWidth: "thin" }}>

        {/* Header band */}
        <div
          className="px-7 py-5 sticky top-0 z-10 flex items-center justify-between gap-4"
          style={{ background: "rgba(248,248,252,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Command Center</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">AINA Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {[
              { label: "Fitur", value: data?.insights?.totalFitur ?? 0, color: "bg-violet-100 text-violet-700" },
              { label: "Anggota", value: data?.totalAnggota ?? 0, color: "bg-blue-100 text-blue-700" },
            ].map(({ label, value, color }) => (
              <span key={label} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold", color)}>
                {isLoading ? "—" : value} {label}
              </span>
            ))}
          </div>
        </div>

        <div className="px-7 py-5 space-y-6">

          {/* Insights */}
          {(isLoading || insights.length > 0) && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Situasi Saat Ini</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {isLoading
                  ? [1,2,3].map(i => <div key={i} className="h-9 w-40 rounded-full bg-muted/40 animate-pulse" />)
                  : insights.map((ins) => {
                    const s = TONE_STYLE[ins.tone];
                    const pill = (
                      <span className={cn("inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-medium cursor-pointer hover:opacity-80 transition-opacity", s.badge)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", s.dot)} />
                        <span className="font-bold">{ins.label}:</span>
                        {ins.text}
                      </span>
                    );
                    return ins.link
                      ? <Link key={ins.id} to={ins.link}>{pill}</Link>
                      : <span key={ins.id}>{pill}</span>;
                  })
                }
              </div>
            </section>
          )}

          {/* Agenda section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Agenda Mendatang</h2>
                {!isLoading && (
                  <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                    {data?.upcomingAgendaList?.length ?? 0}
                  </span>
                )}
              </div>
              <Link to="/agenda" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                Lihat Semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex gap-3">
                {[1,2,3].map(i => <div key={i} className="w-56 h-28 rounded-2xl bg-muted/40 animate-pulse shrink-0" />)}
              </div>
            ) : (data?.upcomingAgendaList?.length ?? 0) === 0 ? (
              <div className="bg-white rounded-2xl border border-border p-5 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <CalendarDays className="h-7 w-7 text-muted-foreground/25 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada agenda mendatang.</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {data?.upcomingAgendaList.map((item, idx) => (
                  <Link key={item.id} to="/agenda" className="shrink-0">
                    <div
                      className="w-56 rounded-2xl p-4 border transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer select-none"
                      style={idx === 0 ? {
                        background: "linear-gradient(135deg, hsl(265,83%,55%) 0%, hsl(285,70%,46%) 100%)",
                        border: "none",
                        boxShadow: "0 8px 24px rgba(124,58,237,0.30)",
                        color: "#fff",
                      } : {
                        background: "#fff",
                        borderColor: "hsl(var(--border))",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      <span
                        className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-2.5",
                          idx === 0 ? "bg-white/20 text-white/80" : "bg-violet-100 text-violet-600")}
                      >{item.status}</span>
                      <p className={cn("text-[13px] font-semibold leading-snug mb-2 line-clamp-2", idx === 0 ? "text-white" : "text-foreground")}>{item.title}</p>
                      <p className={cn("text-[11px] flex items-center gap-1.5", idx === 0 ? "text-white/60" : "text-muted-foreground")}>
                        <Clock className="h-3 w-3" />{item.date} · {item.time}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Fitur grid */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fitur Terbaru</h2>
              </div>
              <Link to="/fitur" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                Lihat Semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />)}
              </div>
            ) : (data?.latestFitur?.length ?? 0) === 0 ? (
              <div className="bg-white rounded-2xl border border-border p-5 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <Sparkles className="h-7 w-7 text-muted-foreground/25 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada fitur.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {data?.latestFitur.map((item) => {
                  const cfg: Record<string, { bg: string; text: string; label: string }> = {
                    completed:   { bg: "bg-emerald-50 border border-emerald-100", text: "text-emerald-700", label: "Selesai" },
                    in_progress: { bg: "bg-violet-50 border border-violet-100",   text: "text-violet-700", label: "Aktif"   },
                    planned:     { bg: "bg-gray-50 border border-gray-100",       text: "text-gray-500",  label: "Planned" },
                    on_hold:     { bg: "bg-amber-50 border border-amber-100",     text: "text-amber-700", label: "Ditunda" },
                  };
                  const c = cfg[item.status] ?? cfg.planned;
                  const dots = { low: 1, medium: 2, high: 3 }[item.impact] ?? 1;
                  return (
                    <div key={item.id} className="bg-white rounded-2xl border border-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-[13px] font-semibold text-foreground leading-snug">{item.name}</p>
                        <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0", c.bg, c.text)}>{c.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2">{item.category}</p>
                      <div className="flex items-center gap-1">
                        {[0,1,2].map(i => (
                          <div key={i} className={cn("h-1 w-5 rounded-full", i < dots ? "bg-violet-400" : "bg-muted")} />
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1 capitalize">{item.impact}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Financial summary */}
          <section className="pb-6">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ringkasan Keuangan</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Dana Masuk",  value: data?.totalIncome  ?? 0, color: "emerald", Icon: TrendingUp   },
                { label: "Dana Keluar", value: data?.totalExpense ?? 0, color: "rose",    Icon: TrendingDown },
                { label: "Saldo Bersih",value: data?.saldoTersedia?? 0, color: "violet",  Icon: Wallet       },
              ].map(({ label, value, color, Icon }) => (
                <div key={label} className="bg-white rounded-2xl border border-border p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className={`h-3.5 w-3.5 text-${color}-500`} />
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                  </div>
                  <p className={`text-base font-bold text-${color}-600`}>{isLoading ? "—" : formatRp(value)}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* RIGHT FLOATING PANEL                                             */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div
        className="hidden xl:flex w-[280px] shrink-0 flex-col overflow-y-auto"
        style={{ background: "#F0F0F5", borderLeft: "1px solid hsl(var(--border))", scrollbarWidth: "none" }}
      >
        <div className="p-4 space-y-4">

          {/* ── Purple AI card (like the deal card in ref) ── */}
          <div
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, hsl(265,83%,52%) 0%, hsl(285,70%,40%) 100%)",
              boxShadow: "0 12px 32px rgba(124,58,237,0.30)",
            }}
          >
            {/* Decorative glow orb */}
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)", transform: "translate(30%,-30%)" }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-bold uppercase tracking-widest bg-white/20 text-white/80 px-2.5 py-1 rounded-full">AI Assistant</span>
                <Bot className="h-4 w-4 text-white/60" />
              </div>

              <h3 className="text-base font-bold text-white leading-tight mb-1">AI Report<br />Assistant</h3>
              <p className="text-[11px] text-white/60 leading-relaxed mb-3">
                Ubah catatan mentah menjadi notulensi atau laporan investor secara otomatis.
              </p>

              <div className="space-y-2 mb-4">
                {[
                  { label: "Notulensi otomatis", check: true },
                  { label: "Ringkasan rapat",    check: true },
                  { label: "Laporan investor",   check: true },
                ].map(({ label, check }) => (
                  <div key={label} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white/60 shrink-0" />
                    <span className="text-[12px] text-white/70">{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/15 text-white/80">
                  <Zap className="h-2.5 w-2.5" /> GPT-4o mini · Aktif
                </span>
              </div>

              {isAdmin ? (
                <Link to="/ai-report">
                  <button className="w-full h-9 rounded-xl bg-white text-violet-700 text-xs font-bold hover:bg-white/90 transition-colors active:scale-[0.98]">
                    Buka AI Report →
                  </button>
                </Link>
              ) : (
                <button disabled className="w-full h-9 rounded-xl bg-white/20 text-white/40 text-xs font-bold cursor-not-allowed">
                  Hanya untuk Admin
                </button>
              )}
            </div>
          </div>

          {/* ── Lime/yellow next agenda card (like the Task card in ref) ── */}
          <div
            className="rounded-3xl p-5"
            style={{ background: "#CCFF44", boxShadow: "0 8px 24px rgba(180,220,0,0.25)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-bold uppercase tracking-widest bg-black/10 text-black/60 px-2.5 py-1 rounded-full">Agenda Berikutnya</span>
              <CalendarDays className="h-4 w-4 text-black/40" />
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-black/10 rounded-full animate-pulse" />
                <div className="h-3 w-3/4 bg-black/10 rounded-full animate-pulse" />
              </div>
            ) : nextAgenda ? (
              <>
                <h3 className="text-sm font-bold text-black/80 leading-tight mb-1.5 line-clamp-2">{nextAgenda.title}</h3>
                <p className="text-[11px] text-black/50 mb-3 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />{nextAgenda.date} · {nextAgenda.time}
                </p>
                {nextAgenda.location && (
                  <p className="text-[11px] text-black/40 mb-3">📍 {nextAgenda.location}</p>
                )}
                {nextAgenda.pic && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-black/15 flex items-center justify-center text-[9px] font-bold text-black/60">
                      {nextAgenda.pic.slice(0,2).toUpperCase()}
                    </div>
                    <span className="text-[11px] text-black/55 font-medium">{nextAgenda.pic}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Link to="/agenda" className="flex-1">
                    <button className="w-full h-8 rounded-xl bg-black/15 text-black/70 text-[11px] font-bold hover:bg-black/20 transition-colors">
                      Detail
                    </button>
                  </Link>
                  <Link to="/agenda">
                    <button className="h-8 px-3 rounded-xl bg-black text-white text-[11px] font-bold hover:bg-black/80 transition-colors">
                      →
                    </button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm font-bold text-black/40">Tidak ada agenda</p>
                <Link to="/agenda">
                  <p className="text-[11px] text-black/35 mt-1 hover:text-black/60 transition-colors">Tambah agenda →</p>
                </Link>
              </div>
            )}
          </div>

          {/* ── Insight summary mini-list ── */}
          <div className="rounded-3xl p-4" style={{ background: "#fff", border: "1px solid hsl(var(--border))", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Highlights</p>
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-8 rounded-xl bg-muted/30 animate-pulse" />)}
              </div>
            ) : insights.length === 0 ? (
              <p className="text-xs text-muted-foreground">Belum ada insight.</p>
            ) : (
              <div className="space-y-2">
                {insights.map((ins) => {
                  const s = TONE_STYLE[ins.tone];
                  return (
                    <div key={ins.id} className="flex items-start gap-2">
                      <div className={cn("h-1.5 w-1.5 rounded-full shrink-0 mt-1.5", s.dot)} />
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground">{ins.label} </span>
                        <span className="text-[11px] text-foreground/70">{ins.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
