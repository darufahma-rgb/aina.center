import {
  FileText, CalendarDays, Users, TrendingUp,
  CheckCircle2, AlertCircle, Sparkles, Clock,
  ArrowRight, MoreHorizontal, Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Notulensi, Agenda } from "../../shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InsightData {
  notulensiThisWeek: number;
  agendaThisMonth: number;
  fiturThisMonth: number;
  completedFitur: number;
  totalFitur: number;
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
  latestFitur: any[];
  insights: InsightData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return "Rp " + n.toLocaleString("id-ID");
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return d;
  }
}

// ─── Progress ring ────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 56, stroke = 5, color = "#5B21B6" }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

// ─── Stat card (DoDo style — label top, ring + value) ─────────────────────────

function ProgressCard({
  label, sublabel, pct, value, color = "#5B21B6", link,
}: {
  label: string; sublabel: string; pct: number; value: string | number; color?: string; link?: string;
}) {
  const inner = (
    <div
      className="flex-1 rounded-2xl p-4 flex flex-col gap-3 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
      style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#999]">{sublabel}</p>
        <p className="text-[14px] font-bold text-[#1A1A1A] mt-0.5">{label}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="relative flex items-center justify-center">
          <ProgressRing pct={pct} color={color} />
          <span className="absolute text-[12px] font-bold text-[#1A1A1A]" style={{ transform: "rotate(90deg)" }}>
            {pct}%
          </span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#1A1A1A] leading-none">{value}</p>
        </div>
      </div>
    </div>
  );
  return link ? <Link to={link} className="flex flex-1">{inner}</Link> : inner;
}

// ─── Agenda / To-do card ──────────────────────────────────────────────────────

function AgendaCard({ item }: { item: Agenda }) {
  return (
    <Link to="/agenda">
      <div
        className="rounded-2xl p-4 transition-all duration-150 hover:shadow-md cursor-pointer"
        style={{ background: "#1A1A1A" }}
      >
        <div className="flex items-start justify-between mb-3">
          <span className="chip" style={{ background: "rgba(167,139,250,0.20)", color: "#A78BFA" }}>{item.status ?? "Mendatang"}</span>
          <span className="text-[11px] text-white/40 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.time ?? "—"}
          </span>
        </div>
        <p className="text-[13px] font-semibold text-white leading-snug mb-1 line-clamp-2">{item.title}</p>
        <p className="text-[11px] text-white/45 leading-relaxed line-clamp-2">{item.description ?? ""}</p>
        {item.pic && (
          <div className="mt-3 flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center text-[#1A1A1A] text-[9px] font-bold"
              style={{ background: "#5B21B6" }}
            >
              {item.pic.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[11px] text-white/50">{item.pic}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Notulensi row (DoDo "my assignments") ────────────────────────────────────

function NotulensiRow({ item, index }: { item: Notulensi; index: number }) {
  const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
    final: { bg: "rgba(34,197,94,0.12)", text: "#16a34a" },
    draft: { bg: "rgba(245,158,11,0.12)", text: "#d97706" },
  };
  const color = STATUS_COLOR[item.status ?? "draft"] ?? STATUS_COLOR.draft;

  return (
    <Link to="/notulensi">
      <div className={cn(
        "flex items-center gap-4 py-3 px-2 rounded-2xl transition-all hover:bg-black/[0.03] cursor-pointer",
        index > 0 && "border-t border-black/[0.05]",
      )}>
        {/* Index/avatar */}
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ background: "#5B21B6", color: "#ffffff" }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        {/* Title + date */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{item.title}</p>
          <p className="text-[11px] text-[#999] mt-0.5">{formatDate(item.date)}</p>
        </div>

        {/* Facilitator */}
        {item.facilitator && (
          <p className="text-[11px] text-[#999] hidden sm:block shrink-0">{item.facilitator}</p>
        )}

        {/* Status badge */}
        <span
          className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0"
          style={{ background: color.bg, color: color.text }}
        >
          {item.status === "final" ? "Final" : "Draft"}
        </span>

        {/* Decisions count */}
        {(item.decisions?.length ?? 0) > 0 && (
          <span className="text-[11px] text-[#bbb] shrink-0 hidden md:block">
            <CheckCircle2 className="h-3.5 w-3.5 inline mr-0.5" />
            {item.decisions.length}
          </span>
        )}

        <ArrowRight className="h-4 w-4 text-[#ddd] shrink-0" />
      </div>
    </Link>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { data, isLoading } = useQuery<DashboardData>({ queryKey: ["/api/dashboard"] });

  const total = data?.totalNotulensi ?? 0;
  const final = (data?.recentNotulensi ?? []).filter(n => n.status === "final").length;
  const completionPct = total > 0 ? Math.round((final / total) * 100) : 0;

  const notulensi = data?.recentNotulensi ?? [];
  const agendaList = data?.upcomingAgendaList ?? [];

  const totalFitur = data?.insights?.totalFitur ?? 0;
  const completedFitur = data?.insights?.completedFitur ?? 0;
  const fiturPct = totalFitur > 0 ? Math.round((completedFitur / totalFitur) * 100) : 0;

  const agendaThisMonth = data?.insights?.agendaThisMonth ?? 0;
  const totalAnggota = data?.totalAnggota ?? 0;
  const agendaPct = totalAnggota > 0 ? Math.min(100, Math.round((agendaThisMonth / Math.max(totalAnggota, 1)) * 100)) : 0;

  const displayName = user?.username ?? "—";

  return (
    <div className="animate-fade-in max-w-full">

      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A1A] leading-tight mb-1">
            Halo, {displayName}! <span role="img" aria-label="wave">👋</span>
          </h1>
          <h2 className="text-3xl font-black leading-tight mb-3">
            Apa yang ingin kamu{" "}
            <span style={{ color: "#5B21B6" }}>kelola</span>
            {" "}hari ini?
          </h2>
          <p className="text-[14px] text-[#999] max-w-sm leading-relaxed">
            Pantau agenda, notulensi, dan keuangan organisasi AINA Centre dari satu tempat.
          </p>
        </div>

        {/* Quick stats badges */}
        <div className="flex flex-wrap items-center gap-2 lg:mt-1 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-black/[0.08] text-[12px] font-medium text-[#555]">
            <Users className="h-3.5 w-3.5 text-[#5B21B6]" style={{ filter: "drop-shadow(0 0 3px #5B21B6)" }} />
            {isLoading ? "—" : totalAnggota} Anggota
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-black/[0.08] text-[12px] font-medium text-[#555]">
            <CalendarDays className="h-3.5 w-3.5 text-[#5B21B6]" />
            {isLoading ? "—" : data?.upcomingAgenda ?? 0} Agenda
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-black/[0.08] text-[12px] font-medium text-[#555]">
              <Wallet className="h-3.5 w-3.5 text-[#5B21B6]" />
              {isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)}
            </div>
          )}
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-5">

        {/* ── Left column ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ── Progress cards row ─────────────────────────────────── */}
          <div className="flex gap-3">
            <ProgressCard
              sublabel="Notulensi"
              label="Penyelesaian"
              pct={completionPct}
              value={isLoading ? "—" : total}
              color="#5B21B6"
              link="/notulensi"
            />
            <ProgressCard
              sublabel="Agenda Bulan Ini"
              label="Kehadiran"
              pct={isLoading ? 0 : agendaPct}
              value={isLoading ? "—" : data?.upcomingAgenda ?? 0}
              color="#1A1A1A"
              link="/agenda"
            />
            <ProgressCard
              sublabel="Fitur"
              label="Progress"
              pct={fiturPct}
              value={isLoading ? "—" : completedFitur}
              color="#5B21B6"
              link="/fitur"
            />
          </div>

          {/* ── Agenda mendatang (To-do list) ────────────────────── */}
          <div className="bg-white rounded-3xl p-5 border border-black/[0.06]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#1A1A1A]">
                Agenda Mendatang
                {!isLoading && agendaList.length > 0 && (
                  <span className="ml-2 text-[12px] font-semibold text-[#999]">{agendaList.length} item</span>
                )}
              </h3>
              <div className="flex items-center gap-2 text-[12px] text-[#999]">
                <Link to="/agenda" className="hover:text-[#1A1A1A] transition-colors flex items-center gap-1">
                  <ArrowRight className="h-3.5 w-3.5" /> Semua
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-black/[0.04] animate-pulse" />)}
              </div>
            ) : agendaList.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarDays className="h-8 w-8 text-[#ddd] mx-auto mb-2" />
                <p className="text-[13px] text-[#bbb]">Belum ada agenda mendatang</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {agendaList.slice(0, 4).map((a) => (
                  <AgendaCard key={a.id} item={a} />
                ))}
              </div>
            )}
          </div>

          {/* ── Notulensi terbaru (My assignments) ───────────────── */}
          <div className="bg-white rounded-3xl p-5 border border-black/[0.06]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#1A1A1A]">
                Notulensi Terbaru
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#5B21B6", color: "#ffffff" }}>
                  {isLoading ? "—" : notulensi.length}
                </span>
                <Link to="/notulensi" className="text-[12px] text-[#999] hover:text-[#1A1A1A] transition-colors flex items-center gap-1">
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-2xl bg-black/[0.04] animate-pulse" />)}
              </div>
            ) : notulensi.length === 0 ? (
              <div className="py-10 text-center">
                <FileText className="h-8 w-8 text-[#ddd] mx-auto mb-2" />
                <p className="text-[13px] text-[#bbb]">Belum ada notulensi</p>
              </div>
            ) : (
              <div>
                {notulensi.slice(0, 5).map((n, i) => (
                  <NotulensiRow key={n.id} item={n} index={i} />
                ))}
                <Link
                  to="/notulensi"
                  className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[12px] font-semibold text-[#999] hover:text-[#1A1A1A] hover:bg-black/[0.03] transition-all border-2 border-dashed border-black/[0.08]"
                >
                  <span>+ Tambah Notulensi Baru</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ───────────────────────────────────────────── */}
        <div className="xl:w-72 space-y-5 shrink-0">

          {/* ── Stats summary (right panel top) ──────────────────── */}
          <div className="bg-white rounded-3xl p-5 border border-black/[0.06]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#1A1A1A]">Ringkasan</h3>
              <MoreHorizontal className="h-4 w-4 text-[#ccc]" />
            </div>

            <div className="space-y-3">
              {/* Notulensi */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(200,236,90,0.20)" }}>
                  <FileText className="h-4 w-4 text-[#5a7a00]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[12px] font-semibold text-[#1A1A1A]">Notulensi</p>
                    <p className="text-[12px] font-bold text-[#1A1A1A]">{isLoading ? "—" : total}</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${completionPct}%`, background: "#5B21B6" }} />
                  </div>
                </div>
              </div>

              {/* Agenda */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,0,0,0.05)" }}>
                  <CalendarDays className="h-4 w-4 text-[#555]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[12px] font-semibold text-[#1A1A1A]">Agenda</p>
                    <p className="text-[12px] font-bold text-[#1A1A1A]">{isLoading ? "—" : data?.upcomingAgenda ?? 0}</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (data?.upcomingAgenda ?? 0) * 20)}%`, background: "#1A1A1A" }} />
                  </div>
                </div>
              </div>

              {/* Fitur */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(200,236,90,0.15)" }}>
                  <Sparkles className="h-4 w-4 text-[#5a7a00]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[12px] font-semibold text-[#1A1A1A]">Fitur Selesai</p>
                    <p className="text-[12px] font-bold text-[#1A1A1A]">{isLoading ? "—" : `${completedFitur}/${totalFitur}`}</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${fiturPct}%`, background: "#5B21B6" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Upcoming agenda dates (calendar section) ──────────── */}
          {agendaList.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-black/[0.06]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-4">Jadwal Terdekat</h3>
              <div className="space-y-3">
                {agendaList.slice(0, 3).map((a) => (
                  <Link to="/agenda" key={a.id}>
                    <div className="flex items-start gap-3 py-2 rounded-xl hover:bg-black/[0.03] px-2 -mx-2 transition-all cursor-pointer">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-bold text-white" style={{ background: "#5B21B6" }}>
                        {formatDate(a.date).split(" ")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#1A1A1A] leading-tight truncate">{a.title}</p>
                        <p className="text-[11px] text-[#999] mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {a.time ?? "—"} · {formatDate(a.date)}
                        </p>
                      </div>
                      <MoreHorizontal className="h-4 w-4 text-[#ddd] shrink-0 mt-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Financial summary (admin only) ────────────────────── */}
          {isAdmin && (
            <div className="bg-white rounded-3xl p-5 border border-black/[0.06]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-[#1A1A1A]">Keuangan</h3>
                <Link to="/keuangan" className="text-[11px] font-semibold text-[#5B21B6] hover:opacity-80 transition-opacity">
                  Detail →
                </Link>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between py-2 border-b border-black/[0.05]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-[12px] text-[#555]">Dana Masuk</span>
                  </div>
                  <span className="text-[13px] font-bold text-green-600">{isLoading ? "—" : formatRp(data?.totalIncome ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-black/[0.05]">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                    <span className="text-[12px] text-[#555]">Dana Keluar</span>
                  </div>
                  <span className="text-[13px] font-bold text-rose-600">{isLoading ? "—" : formatRp(data?.totalExpense ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-[#5a7a00]" />
                    <span className="text-[12px] font-semibold text-[#1A1A1A]">Saldo</span>
                  </div>
                  <span
                    className="text-[14px] font-black"
                    style={{ color: (data?.saldoTersedia ?? 0) >= 0 ? "#5a7a00" : "#dc2626" }}
                  >
                    {isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
