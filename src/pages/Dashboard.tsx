import {
  FileText, CalendarDays, Sparkles, Users,
  TrendingUp, Clock, Search, Filter, ArrowUpDown,
  MoreHorizontal, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Notulensi, Agenda, FiturTerbaru } from "../../shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InsightData {
  notulensiThisWeek: number;
  notulensiLastWeek: number;
  agendaThisMonth: number;
  fiturThisMonth: number;
  completedFitur: number;
  inProgressFitur: number;
  totalFitur: number;
  topCategory: string | null;
  incomeThisMonth: number;
  expenseThisMonth: number;
  balance: number;
  [key: string]: any;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return "Rp " + n.toLocaleString("id-ID");
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon: Icon }: { label: string; value: string | number; sub?: string; color: string; icon: any }) {
  return (
    <div className={cn("rounded-3xl p-5 flex flex-col justify-between min-h-[110px]", color)}>
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-2xl bg-black/10 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-black/60" style={{ height: 18, width: 18 }} />
        </div>
        <MoreHorizontal className="h-4 w-4 text-black/30" />
      </div>
      <div>
        <p className="text-[12px] font-semibold text-black/55 mb-0.5">{label}</p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-black/80 leading-none">{value}</span>
          {sub && <span className="text-[11px] text-black/45 mb-0.5">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Kanban card ──────────────────────────────────────────────────────────────

interface KanbanCardData {
  id: number | string;
  title: string;
  description?: string;
  date?: string;
  tags: { label: string; color: string }[];
  pic?: string;
  count?: { icon: any; value: number }[];
  link: string;
}

function KanbanCard({ card }: { card: KanbanCardData }) {
  return (
    <Link to={card.link}>
      <div className="bg-white rounded-2xl p-4 hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 cursor-pointer" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* Tags */}
        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {card.tags.map((t, i) => (
              <span key={i} className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", t.color)}>{t.label}</span>
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-[13px] font-semibold text-foreground leading-snug mb-2">{card.title}</p>

        {/* Description */}
        {card.description && (
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">{card.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
            {card.date && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {card.date}
              </span>
            )}
            {card.count?.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                <c.icon className="h-3 w-3" />
                {c.value}
              </span>
            ))}
          </div>
          {card.pic && (
            <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,70%,50%))" }}>
              {card.pic.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────

function KanbanColumn({ title, count, cards, loading }: { title: string; count: number; cards: KanbanCardData[]; loading: boolean }) {
  return (
    <div className="flex-1 min-w-[220px] flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
        <span className="text-[11px] font-semibold text-muted-foreground bg-black/[0.06] px-2 py-0.5 rounded-full">
          {loading ? "—" : count}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-3 flex-1">
        {loading ? (
          <>
            {[1, 2].map(i => <div key={i} className="h-28 rounded-2xl bg-white/80 animate-pulse" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }} />)}
          </>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed p-6 text-center" style={{ borderColor: "hsl(var(--border))" }}>
            <p className="text-[12px] text-muted-foreground/50">Tidak ada item</p>
          </div>
        ) : (
          cards.map(card => <KanbanCard key={card.id} card={card} />)
        )}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const { data, isLoading } = useQuery<DashboardData>({ queryKey: ["/api/dashboard"] });
  const [search, setSearch] = useState("");

  // Completion rate
  const total = data?.totalNotulensi ?? 0;
  const final = (data?.recentNotulensi ?? []).filter(n => n.status === "final").length;
  const completionPct = total > 0 ? Math.round((final / total) * 100) : 0;

  // Build kanban data from API
  const notulensi = data?.recentNotulensi ?? [];
  const agendaList = data?.upcomingAgendaList ?? [];
  const fiturList = data?.latestFitur ?? [];

  const searchLower = search.toLowerCase();

  const STATUS_COLOR: Record<string, string> = {
    final:       "bg-emerald-100 text-emerald-700",
    draft:       "bg-amber-100 text-amber-700",
    completed:   "bg-emerald-100 text-emerald-700",
    in_progress: "bg-violet-100 text-violet-700",
    planned:     "bg-blue-100 text-blue-700",
    on_hold:     "bg-gray-100 text-gray-600",
  };

  const draftCards: KanbanCardData[] = notulensi
    .filter(n => n.status === "draft" && (!search || n.title?.toLowerCase().includes(searchLower)))
    .map(n => ({
      id: n.id,
      title: n.title,
      description: n.notes ?? "",
      date: n.date,
      tags: [
        { label: "Notulensi", color: "bg-slate-100 text-slate-600" },
        { label: "Draft",     color: STATUS_COLOR.draft },
      ],
      pic: n.facilitator ?? undefined,
      count: (n.decisions?.length ?? 0) > 0 ? [{ icon: CheckCircle2, value: n.decisions.length }] : undefined,
      link: "/notulensi",
    }));

  const agendaCards: KanbanCardData[] = agendaList
    .filter(a => !search || a.title?.toLowerCase().includes(searchLower))
    .map(a => ({
      id: a.id,
      title: a.title,
      description: a.description ?? "",
      date: `${a.date} · ${a.time}`,
      tags: [
        { label: "Agenda", color: "bg-blue-100 text-blue-700" },
        { label: a.status ?? "upcoming", color: "bg-slate-100 text-slate-600" },
      ],
      pic: a.pic ?? undefined,
      link: "/agenda",
    }));

  const fiturCards: KanbanCardData[] = fiturList
    .filter(f => f.status === "in_progress" && (!search || f.name?.toLowerCase().includes(searchLower)))
    .map(f => ({
      id: f.id,
      title: f.name,
      description: f.description ?? "",
      date: f.createdAt ? new Date(f.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : undefined,
      tags: [
        { label: f.category ?? "Fitur", color: "bg-violet-100 text-violet-700" },
        { label: "Aktif", color: STATUS_COLOR.in_progress },
      ],
      link: "/fitur",
    }));

  const finalCards: KanbanCardData[] = notulensi
    .filter(n => n.status === "final" && (!search || n.title?.toLowerCase().includes(searchLower)))
    .map(n => ({
      id: n.id,
      title: n.title,
      date: n.date,
      tags: [
        { label: "Notulensi", color: "bg-slate-100 text-slate-600" },
        { label: "Final",     color: STATUS_COLOR.final },
      ],
      pic: n.facilitator ?? undefined,
      count: (n.decisions?.length ?? 0) > 0 ? [{ icon: CheckCircle2, value: n.decisions.length }] : undefined,
      link: "/notulensi",
    }));

  return (
    <div className="animate-fade-in">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">AINA Dashboard</h1>

        {/* View tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.06)" }}>
          {["Board", "List", "Workflow"].map((tab) => (
            <button
              key={tab}
              className={cn(
                "px-3 h-7 rounded-lg text-[12px] font-semibold transition-all",
                tab === "Board"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search + filter bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari item..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl text-[13px] bg-white border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
          />
        </div>
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground/60">
          <button className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Filter className="h-3.5 w-3.5" /> Filter
          </button>
          <span className="text-border">|</span>
          <button className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowUpDown className="h-3.5 w-3.5" /> Sort by
          </button>
        </div>
      </div>

      {/* ── Stat cards row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        <StatCard
          label="Total Notulensi"
          value={isLoading ? "—" : data?.totalNotulensi ?? 0}
          sub={data?.insights?.notulensiThisWeek ? `+${data.insights.notulensiThisWeek} minggu ini` : undefined}
          color="bg-[#C4B5F8]"
          icon={FileText}
        />
        <StatCard
          label="Agenda Aktif"
          value={isLoading ? "—" : data?.upcomingAgenda ?? 0}
          sub={isLoading ? undefined : `${data?.totalAnggota ?? 0} anggota`}
          color="bg-[#F4A18A]"
          icon={CalendarDays}
        />
        <StatCard
          label="Penyelesaian"
          value={isLoading ? "—" : `${completionPct}%`}
          sub={isLoading ? undefined : `${data?.insights?.completedFitur ?? 0} fitur selesai`}
          color="bg-[#A8B4F0]"
          icon={CheckCircle2}
        />
      </div>

      {/* ── Kanban board ────────────────────────────────────────────────── */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>

        <KanbanColumn
          title="Draft"
          count={draftCards.length}
          cards={draftCards}
          loading={isLoading}
        />

        <KanbanColumn
          title="Agenda Mendatang"
          count={agendaCards.length}
          cards={agendaCards}
          loading={isLoading}
        />

        <KanbanColumn
          title="Fitur Aktif"
          count={fiturCards.length}
          cards={fiturCards}
          loading={isLoading}
        />

        <KanbanColumn
          title="Final / Selesai"
          count={finalCards.length}
          cards={finalCards}
          loading={isLoading}
        />

      </div>

      {/* ── Financial quick summary ─────────────────────────────────────── */}
      {isAdmin && (
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border border-border" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dana Masuk</p>
              <p className="text-sm font-bold text-emerald-600">{isLoading ? "—" : formatRp(data?.totalIncome ?? 0)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border border-border" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <AlertCircle className="h-4 w-4 text-rose-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dana Keluar</p>
              <p className="text-sm font-bold text-rose-600">{isLoading ? "—" : formatRp(data?.totalExpense ?? 0)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border border-border" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <Sparkles className="h-4 w-4 text-violet-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saldo Bersih</p>
              <p className="text-sm font-bold text-violet-600">{isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)}</p>
            </div>
          </div>
          <Link to="/keuangan" className="bg-white rounded-2xl px-4 py-3 flex items-center gap-2 border border-border hover:border-violet-200 hover:bg-violet-50 transition-all text-[12px] font-semibold text-muted-foreground hover:text-violet-700" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            Detail Keuangan →
          </Link>
        </div>
      )}
    </div>
  );
}
