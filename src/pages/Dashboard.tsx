import {
  Users, Wallet, CalendarDays, FileText, Sparkles,
  TrendingUp, TrendingDown, ArrowRight, Bot, Clock,
  CheckCircle2, AlertCircle, Minus, Zap, Activity,
  BarChart3, MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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

// ─── Insight generation ───────────────────────────────────────────────────────

type InsightTone = "positive" | "negative" | "neutral" | "warning";

interface Insight {
  id: string;
  tone: InsightTone;
  icon: any;
  label: string;
  text: string;
  link?: string;
}

function buildInsights(data: DashboardData): Insight[] {
  const { insights, draftNotulensi, upcomingAgenda } = data;
  const list: Insight[] = [];

  // ── Activity: notulensi week-over-week ──────────────────────────────────────
  if (insights.notulensiThisWeek > 0 || insights.notulensiLastWeek > 0) {
    if (insights.notulensiThisWeek > insights.notulensiLastWeek) {
      list.push({
        id: "notulensi-up",
        tone: "positive",
        icon: FileText,
        label: "Aktivitas Notulensi",
        text: `${insights.notulensiThisWeek} notulensi baru minggu ini — naik dari ${insights.notulensiLastWeek} minggu lalu.`,
        link: "/notulensi",
      });
    } else if (insights.notulensiThisWeek < insights.notulensiLastWeek) {
      list.push({
        id: "notulensi-down",
        tone: "neutral",
        icon: FileText,
        label: "Aktivitas Notulensi",
        text: `${insights.notulensiThisWeek} notulensi minggu ini vs ${insights.notulensiLastWeek} minggu lalu — aktivitas menurun.`,
        link: "/notulensi",
      });
    } else if (insights.notulensiThisWeek > 0) {
      list.push({
        id: "notulensi-stable",
        tone: "neutral",
        icon: FileText,
        label: "Aktivitas Notulensi",
        text: `${insights.notulensiThisWeek} notulensi minggu ini — aktivitas stabil dibanding minggu lalu.`,
        link: "/notulensi",
      });
    }
  } else {
    list.push({
      id: "notulensi-none",
      tone: "warning",
      icon: FileText,
      label: "Aktivitas Notulensi",
      text: "Belum ada notulensi baru minggu ini. Dokumentasi rapat perlu diperbarui.",
      link: "/notulensi",
    });
  }

  // ── Operational: draft notulensi ─────────────────────────────────────────────
  if (draftNotulensi > 0) {
    list.push({
      id: "draft-pending",
      tone: "warning",
      icon: AlertCircle,
      label: "Draft Tertunda",
      text: `${draftNotulensi} notulensi masih berstatus draft — perlu difinalkan sebelum arsip.`,
      link: "/notulensi",
    });
  }

  // ── Financial: balance & expense trend ───────────────────────────────────────
  if (insights.balance > 0) {
    if (insights.expenseThisMonth > 0 && insights.expenseLastMonth > 0) {
      const expPct = ((insights.expenseThisMonth - insights.expenseLastMonth) / insights.expenseLastMonth) * 100;
      if (expPct > 20) {
        list.push({
          id: "expense-up",
          tone: "warning",
          icon: TrendingUp,
          label: "Tren Pengeluaran",
          text: `Pengeluaran bulan ini naik ${expPct.toFixed(0)}% dibanding bulan lalu. Perlu perhatian.`,
          link: "/keuangan",
        });
      } else if (expPct < -10) {
        list.push({
          id: "expense-down",
          tone: "positive",
          icon: TrendingDown,
          label: "Tren Pengeluaran",
          text: `Pengeluaran bulan ini turun ${Math.abs(expPct).toFixed(0)}% dibanding bulan lalu — efisiensi meningkat.`,
          link: "/keuangan",
        });
      } else {
        list.push({
          id: "balance-healthy",
          tone: "positive",
          icon: Wallet,
          label: "Kondisi Keuangan",
          text: `Saldo kas positif dan pengeluaran stabil. Kondisi keuangan sehat.`,
          link: "/keuangan",
        });
      }
    } else {
      list.push({
        id: "balance-positive",
        tone: "positive",
        icon: Wallet,
        label: "Kondisi Keuangan",
        text: `Saldo kas positif — kondisi keuangan terjaga dengan baik.`,
        link: "/keuangan",
      });
    }
  } else if (data.totalIncome > 0 || data.totalExpense > 0) {
    list.push({
      id: "balance-low",
      tone: "negative",
      icon: Wallet,
      label: "Kondisi Keuangan",
      text: `Saldo kas negatif atau nol — pengeluaran melebihi pemasukan. Perlu tindakan segera.`,
      link: "/keuangan",
    });
  }

  // ── Product: feature activity ─────────────────────────────────────────────────
  if (insights.totalFitur > 0) {
    if (insights.fiturThisMonth > 0) {
      list.push({
        id: "fitur-active",
        tone: "positive",
        icon: Sparkles,
        label: "Pengembangan Produk",
        text: `${insights.fiturThisMonth} fitur baru ditambahkan bulan ini.${insights.topCategory ? ` Kategori paling aktif: ${insights.topCategory}.` : ""}`,
        link: "/fitur",
      });
    } else if (insights.topCategory) {
      list.push({
        id: "fitur-category",
        tone: "neutral",
        icon: Sparkles,
        label: "Pengembangan Produk",
        text: `${insights.completedFitur} dari ${insights.totalFitur} fitur sudah selesai. Kategori terbanyak: ${insights.topCategory}.`,
        link: "/fitur",
      });
    }
  }

  // ── Operational: upcoming agenda ─────────────────────────────────────────────
  if (upcomingAgenda > 2) {
    list.push({
      id: "agenda-busy",
      tone: "neutral",
      icon: CalendarDays,
      label: "Agenda Mendatang",
      text: `${upcomingAgenda} agenda mendatang dalam antrean — pastikan semua peserta sudah diberitahu.`,
      link: "/agenda",
    });
  } else if (upcomingAgenda === 0 && data.totalNotulensi > 0) {
    list.push({
      id: "agenda-empty",
      tone: "neutral",
      icon: CalendarDays,
      label: "Agenda",
      text: "Tidak ada agenda mendatang yang terdaftar. Waktu yang baik untuk merencanakan sesi berikutnya.",
      link: "/agenda",
    });
  }

  // Return top 4 most relevant insights
  return list.slice(0, 4);
}

// ─── Tone → style mapping ─────────────────────────────────────────────────────

const TONE_STYLE: Record<InsightTone, { bg: string; orb: string; icon: string; badge: string; shadow: string }> = {
  positive: {
    bg: "bg-emerald-50",
    orb: "bg-emerald-100",
    icon: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    shadow: "0 2px 8px rgba(16,185,129,0.12)",
  },
  negative: {
    bg: "bg-rose-50",
    orb: "bg-rose-100",
    icon: "text-rose-600",
    badge: "bg-rose-100 text-rose-700",
    shadow: "0 2px 8px rgba(244,63,94,0.12)",
  },
  warning: {
    bg: "bg-amber-50",
    orb: "bg-amber-100",
    icon: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    shadow: "0 2px 8px rgba(245,158,11,0.12)",
  },
  neutral: {
    bg: "bg-white",
    orb: "bg-secondary",
    icon: "text-muted-foreground",
    badge: "bg-secondary text-muted-foreground",
    shadow: "var(--shadow-neo-xs)",
  },
};

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: Insight }) {
  const style = TONE_STYLE[insight.tone];
  const Icon = insight.icon;

  const content = (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl ${style.bg} h-full transition-all duration-150 hover:scale-[1.01]`}
      style={{ boxShadow: style.shadow }}
      data-testid={`insight-card-${insight.id}`}
    >
      <div className={`h-8 w-8 rounded-lg ${style.orb} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`h-3.5 w-3.5 ${style.icon}`} />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${style.badge}`}>
          {insight.label}
        </span>
        <p className="text-sm text-foreground/80 leading-relaxed">{insight.text}</p>
      </div>
    </div>
  );

  if (insight.link) {
    return <Link to={insight.link} className="block">{content}</Link>;
  }
  return content;
}

// ─── Insight Layer ────────────────────────────────────────────────────────────

function InsightLayer({ data }: { data: DashboardData }) {
  if (!data.insights) return null;
  const insights = buildInsights(data);
  if (insights.length === 0) return null;

  return (
    <div className="space-y-3" data-testid="insight-layer">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Ringkasan Situasi</h2>
        <span className="text-xs text-muted-foreground">— apa yang sedang terjadi</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function statusColor(status: string) {
  if (status === "completed") return "text-violet-600";
  if (status === "in_progress") return "text-primary";
  return "text-muted-foreground";
}

// ─── Insight Skeleton ─────────────────────────────────────────────────────────

function InsightSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-muted animate-pulse" />
        <div className="h-4 w-36 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl border bg-muted/30 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const { data, isLoading } = useQuery<DashboardData>({ queryKey: ["/api/dashboard"] });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Dashboard" description="Command center — situasi dan aktivitas terkini AINA" />

      {/* ── Insight Layer ── */}
      {isLoading ? <InsightSkeleton /> : data?.insights ? <InsightLayer data={data} /> : null}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        title="Total Anggota"    value={isLoading ? "—" : data?.totalAnggota ?? 0}              subtitle="Anggota aktif"                               gradient />
        <StatCard icon={Wallet}       title="Saldo Tersedia"   value={isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)}   subtitle="Keuangan bersih"    color="green" />
        <StatCard icon={CalendarDays} title="Agenda Mendatang" value={isLoading ? "—" : data?.upcomingAgenda ?? 0}            subtitle="Agenda upcoming"    color="violet" />
        <StatCard icon={FileText}     title="Notulensi"        value={isLoading ? "—" : data?.totalNotulensi ?? 0}            subtitle={`${data?.draftNotulensi ?? 0} draft pending`} color="purple" />
      </div>

      {/* ── Notulensi + Agenda ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Notulensi Terbaru
              </CardTitle>
              <Link to="/notulensi">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  Lihat Semua <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : (data?.recentNotulensi?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada notulensi.</p>
            ) : data?.recentNotulensi.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <Badge variant={item.status === "final" ? "default" : "secondary"} className="text-[10px] capitalize">
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> Agenda Mendatang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : (data?.upcomingAgendaList?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada agenda.</p>
            ) : data?.upcomingAgendaList.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.date} · {item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Features + AI CTA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Fitur Terbaru AINA
              </CardTitle>
              <Link to="/fitur">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  Lihat Semua <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Memuat...</p>
              ) : (data?.latestFitur?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada fitur.</p>
              ) : data?.latestFitur.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`h-4 w-4 ${statusColor(f.status)}`} />
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">Impact: {f.impact}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] capitalize">{f.status.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {isAdmin ? (
          <Link to="/ai-report" className="block h-full">
            <div
              className="rounded-xl h-full cursor-pointer transition-all duration-150 hover:scale-[1.01]"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-neo-primary)" }}
            >
              <div className="p-5 flex flex-col items-center justify-center text-center h-full">
                <div className="h-13 w-13 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 p-3">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">AI Report Assistant</h3>
                <p className="text-xs text-white/70 leading-relaxed mb-4">
                  Ubah catatan mentah menjadi notulensi, laporan progress, atau ringkasan investor dalam hitungan detik.
                </p>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/20 text-white/90">
                  <Zap className="h-2.5 w-2.5" /> GPT-4o mini · Aktif
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <div
            className="rounded-xl h-full"
            style={{ background: "linear-gradient(135deg, hsl(215,25%,94%), hsl(215,25%,90%))", boxShadow: "var(--shadow-neo-sm)" }}
          >
            <div className="p-5 flex flex-col items-center justify-center text-center h-full">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Bot className="h-6 w-6 text-primary/60" />
              </div>
              <h3 className="text-sm font-semibold mb-1 text-foreground">AI Report Assistant</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Fitur AI tersedia untuk admin — otomatis susun laporan dari catatan mentah.
              </p>
              <Badge variant="secondary" className="text-[10px]">Admin Only</Badge>
            </div>
          </div>
        )}
      </div>

      {/* ── Financial Summary ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Ringkasan Keuangan
            </CardTitle>
            {isAdmin && (
              <Link to="/keuangan">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  Detail <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Dana Masuk</p>
              <p className="text-lg font-bold text-emerald-600">{isLoading ? "—" : formatRp(data?.totalIncome ?? 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-destructive/8 border border-destructive/15">
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Dana Keluar</p>
              <p className="text-lg font-bold text-destructive">{isLoading ? "—" : formatRp(data?.totalExpense ?? 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/8 border border-primary/15">
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Saldo Tersedia</p>
              <p className="text-lg font-bold text-primary">{isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
