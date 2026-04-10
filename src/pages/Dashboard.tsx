import {
  Users, Wallet, CalendarDays, FileText, Sparkles,
  TrendingUp, ArrowRight, Bot, Clock, CheckCircle2
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
}

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function statusColor(status: string) {
  if (status === "completed") return "text-green-500";
  if (status === "in_progress") return "text-amber-500";
  return "text-muted-foreground";
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const { data, isLoading } = useQuery<DashboardData>({ queryKey: ["/api/dashboard"] });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Dashboard" description="Command center — overview of AINA operations" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} title="Total Anggota" value={isLoading ? "—" : data?.totalAnggota ?? 0} subtitle="Anggota aktif" gradient />
        <StatCard icon={Wallet} title="Saldo Tersedia" value={isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)} subtitle="Keuangan bersih" trendUp />
        <StatCard icon={CalendarDays} title="Agenda Mendatang" value={isLoading ? "—" : data?.upcomingAgenda ?? 0} subtitle="Agenda upcoming" />
        <StatCard icon={FileText} title="Notulensi" value={isLoading ? "—" : data?.totalNotulensi ?? 0} subtitle={`${data?.draftNotulensi ?? 0} draft pending`} />
      </div>

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
              <CalendarDays className="h-4 w-4 text-primary" /> Agenda
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

        <Card className="border-dashed border-2 border-primary/20 bg-primary/[0.02]">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-3">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1">AI Report Assistant</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Auto-tidy messy reports, summarize meeting notes, and generate investor-ready content.
            </p>
            <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
          </CardContent>
        </Card>
      </div>

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
            <div className="p-4 rounded-lg bg-success/10">
              <p className="text-xs text-muted-foreground mb-1">Dana Masuk</p>
              <p className="text-lg font-bold text-success">{isLoading ? "—" : formatRp(data?.totalIncome ?? 0)}</p>
            </div>
            <div className="p-4 rounded-lg bg-destructive/10">
              <p className="text-xs text-muted-foreground mb-1">Dana Keluar</p>
              <p className="text-lg font-bold text-destructive">{isLoading ? "—" : formatRp(data?.totalExpense ?? 0)}</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-xs text-muted-foreground mb-1">Saldo Tersedia</p>
              <p className="text-lg font-bold text-primary">{isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
