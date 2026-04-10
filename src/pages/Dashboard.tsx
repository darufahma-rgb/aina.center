import {
  LayoutDashboard, Users, Wallet, CalendarDays, FileText, Sparkles,
  TrendingUp, ArrowRight, Bot, Clock, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { useRole } from "@/contexts/RoleContext";
import { Link } from "react-router-dom";

const recentNotulensi = [
  { title: "Sprint Review — Week 14", date: "7 Apr 2026", status: "Final" },
  { title: "Board Strategy Meeting", date: "3 Apr 2026", status: "Draft" },
  { title: "Partnership Discussion — XYZ Corp", date: "1 Apr 2026", status: "Final" },
];

const upcomingAgenda = [
  { name: "Team Standup", date: "11 Apr", time: "09:00", status: "Confirmed" },
  { name: "Investor Pitch Prep", date: "14 Apr", time: "14:00", status: "Pending" },
  { name: "Product Demo Day", date: "18 Apr", time: "10:00", status: "Confirmed" },
];

const latestFeatures = [
  { name: "AI Report Summarizer", status: "In Progress", impact: "High" },
  { name: "Role-Based Dashboard", status: "Completed", impact: "Medium" },
  { name: "Investor Export PDF", status: "Planned", impact: "High" },
];

export default function Dashboard() {
  const { isAdmin } = useRole();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Dashboard" description="Command center — overview of AINA operations" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} title="Total Anggota" value={12} subtitle="3 divisi aktif" gradient />
        <StatCard icon={Wallet} title="Saldo Tersedia" value="Rp 14.250.000" trend="+8.2% bulan ini" trendUp />
        <StatCard icon={CalendarDays} title="Agenda Mendatang" value={7} subtitle="3 minggu ke depan" />
        <StatCard icon={FileText} title="Notulensi" value={24} subtitle="4 draft pending" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Notulensi */}
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
            {recentNotulensi.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <Badge variant={item.status === "Final" ? "default" : "secondary"} className="text-[10px]">
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Agenda */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> Agenda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAgenda.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.date} · {item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Features */}
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
              {latestFeatures.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`h-4 w-4 ${f.status === "Completed" ? "text-success" : f.status === "In Progress" ? "text-warning" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">Impact: {f.impact}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{f.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Feature Placeholder */}
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

      {/* Financial Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Ringkasan Keuangan
            </CardTitle>
            <Link to="/keuangan">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                Detail <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-success/10">
              <p className="text-xs text-muted-foreground mb-1">Dana Masuk</p>
              <p className="text-lg font-bold text-success">Rp 22.500.000</p>
            </div>
            <div className="p-4 rounded-lg bg-destructive/10">
              <p className="text-xs text-muted-foreground mb-1">Dana Keluar</p>
              <p className="text-lg font-bold text-destructive">Rp 8.250.000</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-xs text-muted-foreground mb-1">Saldo Tersedia</p>
              <p className="text-lg font-bold text-primary">Rp 14.250.000</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
