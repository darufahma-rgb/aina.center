import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText, CalendarDays, Users, TrendingUp,
  CheckCircle2, AlertCircle, Sparkles, Clock,
  ArrowRight, MoreHorizontal, Wallet, Download,
  Package, Mail, Handshake, Zap, PauseCircle,
  ListTodo, PlayCircle, Target, Globe,
  BrainCircuit, Paintbrush2, Landmark, UsersRound, CalendarCheck,
  ClipboardList, Archive, Server, Hammer, Rocket, Layers,
  Send, ExternalLink, Loader2, Bot, Search, BarChart3,
  GitCommit, Bell, Mic, MicOff,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Notulensi, Agenda } from "../../shared/schema";
import jsPDF from "jspdf";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InsightData {
  notulensiThisWeek: number;
  agendaThisMonth: number;
  fiturThisMonth: number;
  completedFitur: number;
  inProgressFitur: number;
  totalFitur: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
  balance: number;
  [key: string]: any;
}

interface DashboardData {
  totalAnggota: number;
  totalAnggotaAll: number;
  upcomingAgenda: number;
  totalNotulensi: number;
  finalNotulensi: number;
  draftNotulensi: number;
  totalSurat: number;
  totalInventaris: number;
  totalRelasi: number;
  saldoTersedia: number;
  totalIncome: number;
  totalExpense: number;
  agendaThisCalMonth: number;
  agendaCompletedThisCalMonth: number;
  recentNotulensi: Notulensi[];
  upcomingAgendaList: Agenda[];
  agendaThisCalMonthList: Agenda[];
  allAgendaList: Agenda[];
  latestFitur: any[];
  recentKeuangan: any[];
  anggotaList: any[];
  insights: InsightData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return "Rp " + n.toLocaleString("id-ID");
}

function formatRpFull(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "2-digit" });
  } catch { return d; }
}

function formatDateFull(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch { return d; }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

// ─── World clock ───────────────────────────────────────────────────────────────

function WorldClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmtTime = (tz: string) =>
    now.toLocaleTimeString("id-ID", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const fmtDate = (tz: string) =>
    now.toLocaleDateString("id-ID", { timeZone: tz, weekday: "short", day: "numeric", month: "short" });

  const cities = [
    { city: "Jakarta", country: "Indonesia", flag: "🇮🇩", tz: "Asia/Jakarta", label: "WIB" },
    { city: "Kairo",   country: "Mesir",     flag: "🇪🇬", tz: "Africa/Cairo",  label: "EET" },
  ];

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Globe className="h-3.5 w-3.5 text-[#3E0FA3] shrink-0" />
      {cities.map(({ city, country, flag, tz, label }) => (
        <div
          key={tz}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/[0.12] text-[12px]"
          style={{ background: "#F8F9FB" }}
        >
          <span className="text-[13px]">{flag}</span>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-[#1A1A1A] tabular-nums tracking-tight">{fmtTime(tz)}</span>
            <span className="text-[9px] font-medium text-[#999] mt-[1px]">{city} · {label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── World clock dark (for hero banner) ───────────────────────────────────────

function WorldClockDark() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmtTime = (tz: string) =>
    now.toLocaleTimeString("id-ID", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  const cities = [
    { city: "Jakarta", flag: "🇮🇩", tz: "Asia/Jakarta", label: "WIB" },
    { city: "Kairo",   flag: "🇪🇬", tz: "Africa/Cairo",  label: "EET" },
  ];

  return (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
      <Globe className="h-3.5 w-3.5 shrink-0 text-purple-300" />
      {cities.map(({ city, flag, tz, label }) => (
        <div
          key={tz}
          className="flex min-w-[82px] items-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] sm:min-w-[96px] sm:px-3 sm:text-[12px]"
          style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)" }}
        >
          <span className="text-[12px] sm:text-[13px]">{flag}</span>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-white tabular-nums tracking-tight">{fmtTime(tz)}</span>
            <span className="text-[9px] font-medium text-white/50 mt-[1px]">{city} · {label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Progress ring ────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 56, stroke = 5, color = "#3E0FA3" }: { pct: number; size?: number; stroke?: number; color?: string }) {
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

// ─── GitHub Changes Card ────────────────────────────────────────────────────────

const DASHBOARD_GITHUB_REPO = "darciatemantaraglobal-gif/aina.web";

function GitHubChangesCard() {
  const [open, setOpen] = useState(false);
  const [readHashes, setReadHashes] = useState<Set<string>>(new Set());
  const [fetchedRead, setFetchedRead] = useState(false);

  const { data: commits = [] } = useQuery<any[]>({
    queryKey: ["github-commits-dashboard", 20],
    queryFn: async () => {
      const r = await fetch(
        `https://api.github.com/repos/${DASHBOARD_GITHUB_REPO}/commits?per_page=20`,
        { headers: { Accept: "application/vnd.github.v3+json" } }
      );
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (commits.length === 0 || fetchedRead) return;
    const hashes = commits.map((c: any) => c.sha).join(",");
    fetch(`/api/commit-reads?hashes=${hashes}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setReadHashes(new Set(data.readHashes ?? []));
        setFetchedRead(true);
      })
      .catch(() => {});
  }, [commits.length, fetchedRead]);

  const unreadCount = commits.filter((c: any) => !readHashes.has(c.sha)).length;

  const markRead = async (sha: string) => {
    if (readHashes.has(sha)) return;
    setReadHashes(prev => new Set([...prev, sha]));
    try {
      await fetch("/api/commit-reads", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitHash: sha, repo: DASHBOARD_GITHUB_REPO }),
      });
    } catch {}
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      commits.slice(0, 20).forEach((c: any) => markRead(c.sha));
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div
          className="flex-1 rounded-2xl p-2.5 sm:p-4 flex flex-col gap-2 sm:gap-3 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer h-full relative"
          style={{ background: "#ffffff", border: "1px solid rgba(103,65,217,0.16)", boxShadow: "0 2px 8px rgba(62,15,163,0.07)" }}
        >
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-5 min-w-[20px] px-1 rounded-full bg-[#3E0FA3] text-white text-[9px] font-bold flex items-center justify-center z-10">
              {unreadCount}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-[#999] leading-tight line-clamp-2">Pembaruan</p>
            <p className="text-[11px] sm:text-[14px] font-bold text-[#1A1A1A] mt-0.5 truncate">GitHub</p>
          </div>
          <div className="flex items-center justify-between gap-1">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F5F3FF" }}>
              <GitCommit className="h-4 w-4 sm:h-5 sm:w-5 text-[#3E0FA3]" />
            </div>
            <div className="text-right min-w-0">
              <p className="text-lg sm:text-2xl font-black text-[#1A1A1A]">
                {commits.length === 0 ? "—" : unreadCount}
              </p>
              <p className="text-[9px] text-[#999] leading-tight">belum dibaca</p>
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden" side="bottom">
        <div className="p-3 border-b bg-white sticky top-0">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#3E0FA3]" />
            <p className="text-[13px] font-bold text-[#1A1A1A]">Pembaruan GitHub</p>
          </div>
          <p className="text-[11px] text-[#999] mt-0.5">
            {unreadCount > 0 ? `${unreadCount} perubahan belum dibaca` : "Semua perubahan sudah dibaca ✓"}
          </p>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y">
          {commits.length === 0 ? (
            <div className="p-4 text-center text-[12px] text-[#999]">Tidak ada data commit</div>
          ) : (
            commits.map((commit: any) => {
              const isUnread = !readHashes.has(commit.sha);
              const dateStr = commit.commit?.author?.date ?? commit.commit?.committer?.date ?? "";
              const dateLabel = dateStr
                ? new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                : "—";
              return (
                <div
                  key={commit.sha}
                  className={cn("p-3 text-left", isUnread ? "bg-purple-50/60" : "")}
                >
                  <div className="flex items-start gap-2">
                    {isUnread && (
                      <div className="h-1.5 w-1.5 rounded-full bg-[#3E0FA3] shrink-0 mt-1.5" />
                    )}
                    <div className={cn("flex-1 min-w-0", !isUnread && "pl-3.5")}>
                      <p className={cn("text-[12px] line-clamp-2", isUnread ? "font-semibold text-[#1A1A1A]" : "text-[#666]")}>
                        {commit.commit?.message?.split("\n")[0] ?? "—"}
                      </p>
                      <p className="text-[10px] text-[#999] mt-0.5">{dateLabel} · {commit.sha.slice(0, 7)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="p-2 border-t bg-white">
          <Link
            to="/fitur"
            className="flex items-center justify-center gap-1 text-[11px] text-[#3E0FA3] font-semibold hover:underline"
            onClick={() => setOpen(false)}
          >
            Lihat detail di Fitur <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Progress card ─────────────────────────────────────────────────────────────

function ProgressCard({
  label, sublabel, pct, value, color = "#3E0FA3", link,
}: {
  label: string; sublabel: string; pct: number; value: string | number; color?: string; link?: string;
}) {
  const inner = (
    <div
      className="flex-1 rounded-2xl p-2.5 sm:p-4 flex flex-col gap-2 sm:gap-3 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer h-full"
      style={{ background: "#ffffff", border: "1px solid rgba(103,65,217,0.16)", boxShadow: "0 2px 8px rgba(62,15,163,0.07)" }}
    >
      <div className="min-w-0">
        <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-[#999] leading-tight line-clamp-2">{sublabel}</p>
        <p className="text-[11px] sm:text-[14px] font-bold text-[#1A1A1A] mt-0.5 truncate">{label}</p>
      </div>
      <div className="flex items-center justify-between gap-1">
        <div className="relative flex items-center justify-center shrink-0">
          <ProgressRing pct={pct} color={color} size={40} stroke={4} />
          <span className="absolute text-[9px] font-bold text-[#1A1A1A]">
            {pct}%
          </span>
        </div>
        <div className="text-right min-w-0">
          <p className="text-lg sm:text-2xl font-black text-[#1A1A1A]">{value}</p>
        </div>
      </div>
    </div>
  );
  return link ? <Link to={link} className="flex-1 min-w-0">{inner}</Link> : <div className="flex-1 min-w-0">{inner}</div>;
}

// ─── Agenda card (dark) ───────────────────────────────────────────────────────

function AgendaCard({ item }: { item: Agenda }) {
  return (
    <Link to="/agenda">
      <div
        className="rounded-2xl p-3 sm:p-4 transition-all duration-150 hover:shadow-md cursor-pointer"
        style={{ background: "#1A1A1A" }}
      >
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <span className="chip" style={{ background: "rgba(167,139,250,0.20)", color: "#A78BFA" }}>{item.status ?? "Mendatang"}</span>
          <span className="text-[11px] text-white/40 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.time ?? "—"}
          </span>
        </div>
        <p className="text-[13px] font-semibold text-white leading-snug mb-1 line-clamp-2">{item.title}</p>
        <p className="text-[11px] text-white/45 leading-relaxed line-clamp-2">{item.description ?? ""}</p>
        {item.pic && (
          <div className="mt-2 sm:mt-3 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/60">
              {item.pic.slice(0, 1).toUpperCase()}
            </div>
            <span className="text-[11px] text-white/40">{item.pic}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Notulensi row ────────────────────────────────────────────────────────────

function NotulensiRow({ item, index }: { item: Notulensi; index: number }) {
  return (
    <Link to="/notulensi">
      <div className={cn(
        "flex items-center gap-2.5 sm:gap-4 py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-2xl transition-all hover:bg-black/[0.03] cursor-pointer",
        index > 0 && "border-t border-black/[0.08]",
      )}>
        <div
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0"
          style={{ background: "#3E0FA3", color: "#ffffff" }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{item.title}</p>
          <p className="text-[11px] text-[#999] mt-0.5">{formatDate(item.date)} · {item.location ?? "—"}</p>
        </div>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
          item.status === "final"
            ? "bg-green-100 text-green-700"
            : "bg-black/[0.06] text-[#888]",
        )}>
          {item.status === "final" ? "Final" : "Draft"}
        </span>
      </div>
    </Link>
  );
}

// ─── PDF export ───────────────────────────────────────────────────────────────

function generatePDF(data: DashboardData, userName: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 18;
  const col2 = W / 2 + 5;
  let y = 0;

  const line = () => {
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, W - margin, y);
    y += 5;
  };

  const section = (title: string) => {
    y += 2;
    doc.setFillColor(91, 33, 182);
    doc.rect(margin, y, W - margin * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), margin + 4, y + 5.5);
    doc.setTextColor(30, 30, 30);
    y += 12;
  };

  const kv = (label: string, value: string, xOff = 0) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(label, margin + xOff, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(value, margin + xOff + 55, y);
    y += 6;
  };

  const tableHeader = (cols: { label: string; x: number; w: number }[]) => {
    doc.setFillColor(245, 243, 255);
    doc.rect(margin, y - 1, W - margin * 2, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(91, 33, 182);
    cols.forEach(c => doc.text(c.label, c.x, y + 4));
    y += 8;
    doc.setTextColor(30, 30, 30);
  };

  const tableRow = (cols: { text: string; x: number; w: number }[], even: boolean) => {
    if (even) {
      doc.setFillColor(252, 252, 252);
      doc.rect(margin, y - 1, W - margin * 2, 6.5, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    cols.forEach(c => {
      const text = doc.splitTextToSize(c.text, c.w)[0] ?? "";
      doc.text(text, c.x, y + 4);
    });
    y += 7;
  };

  const checkPage = (needed: number = 25) => {
    if (y + needed > 270) {
      doc.addPage();
      y = 18;
    }
  };

  // ── COVER ──────────────────────────────────────────────────────────────
  // Dark purple header band
  doc.setFillColor(30, 10, 60);
  doc.rect(0, 0, W, 48, "F");
  doc.setFillColor(91, 33, 182);
  doc.rect(0, 48, W, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("AINA Centre", margin, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(200, 180, 255);
  doc.text("Laporan Ringkasan Portal Internal", margin, 31);

  doc.setFontSize(8);
  doc.setTextColor(150, 130, 200);
  const now = new Date();
  doc.text(`Dibuat: ${now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`, margin, 40);
  doc.text(`Oleh: ${userName}`, W - margin - 40, 40);

  y = 60;

  // ── RINGKASAN ORGANISASI ───────────────────────────────────────────────
  section("Ringkasan Organisasi");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  kv("Anggota Aktif", `${data.totalAnggota} orang`);
  kv("Total Notulensi", `${data.totalNotulensi} (${data.draftNotulensi} draft)`);
  kv("Agenda Mendatang", `${data.upcomingAgenda} kegiatan`);
  kv("Total Surat", `${data.totalSurat} dokumen`);
  kv("Total Inventaris", `${data.totalInventaris} item`);
  kv("Total Relasi Eksternal", `${data.totalRelasi} mitra`);

  y += 3;
  line();

  // ── KEUANGAN ──────────────────────────────────────────────────────────
  section("Keuangan");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  // Income
  doc.text("Dana Masuk", margin, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  doc.text(formatRpFull(data.totalIncome), margin + 55, y);
  y += 6;

  // Expense
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text("Dana Keluar", margin, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(220, 38, 38);
  doc.text(formatRpFull(data.totalExpense), margin + 55, y);
  y += 6;

  // Saldo
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text("Saldo Tersedia", margin, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(data.saldoTersedia >= 0 ? 22 : 220, data.saldoTersedia >= 0 ? 163 : 38, data.saldoTersedia >= 0 ? 74 : 38);
  doc.text(formatRpFull(data.saldoTersedia), margin + 55, y);
  y += 8;

  doc.setTextColor(30, 30, 30);
  line();

  // ── TRANSAKSI KEUANGAN TERBARU ─────────────────────────────────────────
  checkPage(50);
  section("Transaksi Keuangan Terbaru");

  if (data.recentKeuangan && data.recentKeuangan.length > 0) {
    tableHeader([
      { label: "No", x: margin + 1, w: 8 },
      { label: "Keterangan", x: margin + 12, w: 70 },
      { label: "Jenis", x: margin + 100, w: 25 },
      { label: "Jumlah", x: margin + 128, w: 44 },
    ]);
    data.recentKeuangan.slice(0, 8).forEach((k, i) => {
      checkPage(10);
      tableRow([
        { text: String(i + 1), x: margin + 1, w: 8 },
        { text: k.description ?? k.category ?? "—", x: margin + 12, w: 85 },
        { text: k.type === "income" ? "Masuk" : "Keluar", x: margin + 100, w: 25 },
        { text: formatRpFull(parseFloat(k.amount)), x: margin + 128, w: 44 },
      ], i % 2 === 0);
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Belum ada data transaksi.", margin, y);
    y += 8;
  }

  y += 3;
  line();

  // ── NOTULENSI TERBARU ──────────────────────────────────────────────────
  checkPage(50);
  section("Notulensi Terbaru");

  if (data.recentNotulensi && data.recentNotulensi.length > 0) {
    tableHeader([
      { label: "No", x: margin + 1, w: 8 },
      { label: "Judul", x: margin + 12, w: 90 },
      { label: "Tanggal", x: margin + 118, w: 28 },
      { label: "Status", x: margin + 152, w: 25 },
    ]);
    data.recentNotulensi.forEach((n, i) => {
      checkPage(10);
      tableRow([
        { text: String(i + 1), x: margin + 1, w: 8 },
        { text: n.title, x: margin + 12, w: 100 },
        { text: formatDate(n.date), x: margin + 118, w: 30 },
        { text: n.status === "final" ? "Final" : "Draft", x: margin + 152, w: 25 },
      ], i % 2 === 0);
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Belum ada data notulensi.", margin, y);
    y += 8;
  }

  y += 3;
  line();

  // ── AGENDA ────────────────────────────────────────────────────────────
  checkPage(50);
  section("Agenda");

  const allAgenda = data.allAgendaList ?? data.upcomingAgendaList ?? [];
  if (allAgenda.length > 0) {
    tableHeader([
      { label: "No", x: margin + 1, w: 8 },
      { label: "Kegiatan", x: margin + 12, w: 90 },
      { label: "Tanggal", x: margin + 118, w: 28 },
      { label: "Status", x: margin + 152, w: 30 },
    ]);
    allAgenda.slice(0, 10).forEach((a, i) => {
      checkPage(10);
      tableRow([
        { text: String(i + 1), x: margin + 1, w: 8 },
        { text: a.title, x: margin + 12, w: 100 },
        { text: formatDate(a.date), x: margin + 118, w: 30 },
        { text: a.status ?? "—", x: margin + 152, w: 30 },
      ], i % 2 === 0);
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Belum ada agenda.", margin, y);
    y += 8;
  }

  y += 3;
  line();

  // ── FITUR TERBARU ─────────────────────────────────────────────────────
  checkPage(50);
  section("Fitur / Program Terbaru");

  if (data.latestFitur && data.latestFitur.length > 0) {
    tableHeader([
      { label: "No", x: margin + 1, w: 8 },
      { label: "Nama Fitur", x: margin + 12, w: 80 },
      { label: "Kategori", x: margin + 100, w: 40 },
      { label: "Status", x: margin + 147, w: 35 },
    ]);
    data.latestFitur.forEach((f, i) => {
      checkPage(10);
      tableRow([
        { text: String(i + 1), x: margin + 1, w: 8 },
        { text: f.title ?? f.name ?? "—", x: margin + 12, w: 85 },
        { text: f.category ?? "—", x: margin + 100, w: 44 },
        { text: f.status ?? "—", x: margin + 147, w: 35 },
      ], i % 2 === 0);
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Belum ada data fitur.", margin, y);
    y += 8;
  }

  // ── FOOTER ────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(`AINA Centre Management Portal · ${now.toLocaleDateString("id-ID")}`, margin, 290);
    doc.text(`Halaman ${p} dari ${totalPages}`, W - margin - 22, 290);
  }

  const filename = `laporan-aina-${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// ─── Jarvis Widget ────────────────────────────────────────────────────────────

const JARVIS_PROMPTS = [
  { icon: Zap,          label: "Briefing",   text: "Berikan briefing lengkap status portal AINA saat ini" },
  { icon: CalendarDays, label: "Agenda",     text: "Tampilkan agenda mendatang yang perlu diperhatikan" },
  { icon: Search,       label: "Cari",       text: "Cari semua rapat koordinasi terbaru" },
  { icon: BarChart3,    label: "Analisis",   text: "Analisis kondisi keuangan dan perkembangan bulan ini" },
];

function JarvisWidget() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(() =>
    typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const startVoice = useCallback(() => {
    if (!voiceSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    recognition.start();
  }, [voiceSupported]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleVoice = useCallback(() => {
    if (isListening) stopVoice();
    else startVoice();
  }, [isListening, startVoice, stopVoice]);

  const send = useCallback(async (msg: string) => {
    if (!msg.trim() || loading) return;
    setLoading(true);
    setReply(null);
    try {
      const form = new FormData();
      form.append("message", msg.trim());
      form.append("history", "[]");
      const res = await fetch("/api/assistant/chat", { method: "POST", body: form, credentials: "include" });
      const json = await res.json();
      setReply(json.reply ?? "Tidak ada respons.");
    } catch {
      setReply("Gagal menghubungi AINA Assistant.");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); setInput(""); }
  };

  return (
    <div
      className="rounded-2xl sm:rounded-3xl mb-2 sm:mb-3 overflow-hidden"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(99,102,241,0.14)",
        boxShadow: "0 4px 24px rgba(62,15,163,0.07), 0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* ── Top accent strip ── */}
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg, #4F46E5 0%, #7C3AED 50%, #6366F1 100%)" }}
      />

      <div className="p-3 sm:p-4">
        {/* ── Header row ── */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Icon */}
            <div
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
                boxShadow: "0 2px 8px rgba(99,102,241,0.2)",
              }}
            >
              {loading
                ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" style={{ color: "#6366F1" }} />
                : <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#6366F1" }} />
              }
            </div>
            <div>
              <p className="text-[13px] sm:text-[14px] font-bold text-[#1A1A1A] tracking-tight">AINA Assistant</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${loading ? "animate-pulse" : ""}`}
                  style={{ background: loading ? "#F59E0B" : "#10B981" }}
                />
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: loading ? "#F59E0B" : "#10B981" }}
                >
                  {loading ? "Memproses" : "Online"}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/asisten"
            className="group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-semibold transition-all hover:opacity-80"
            style={{
              background: "rgba(99,102,241,0.08)",
              color: "#6366F1",
              border: "1px solid rgba(99,102,241,0.15)",
            }}
          >
            Buka penuh
            <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* ── Divider ── */}
        <div className="mb-2 sm:mb-3" style={{ height: "1px", background: "linear-gradient(90deg, rgba(99,102,241,0.15), rgba(99,102,241,0.03))" }} />

        {/* ── Response / empty state ── */}
        {/* Quick prompts — always visible as compact scrollable strip */}
        {!loading && (
          <div className="overflow-x-auto -mx-1 px-1 pb-0.5 mb-3">
            <div className="flex items-center gap-1.5 w-max">
              {JARVIS_PROMPTS.map(({ icon: Icon, label, text }) => (
                <button
                  key={label}
                  onClick={() => { send(text); setReply(null); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all active:scale-95 shrink-0"
                  style={{
                    background: "#F5F3FF",
                    border: "1px solid rgba(99,102,241,0.2)",
                    color: "#6366F1",
                  }}
                >
                  <Icon className="h-3 w-3 shrink-0" style={{ color: "#7C3AED" }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.10)" }}
          >
            <div
              className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)" }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#6366F1" }} />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#1A1A1A]">Menganalisis perintah</p>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>AINA sedang memproses permintaanmu...</p>
            </div>
          </div>
        )}

        {reply && !loading && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{
              background: "linear-gradient(135deg, #FAFBFF 0%, #F5F3FF 100%)",
              border: "1px solid rgba(99,102,241,0.12)",
              maxHeight: "320px",
              overflowY: "auto",
            }}
          >
            <div className="flex items-start gap-2.5">
              <div
                className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)" }}
              >
                <Sparkles className="h-3 w-3" style={{ color: "#7C3AED" }} />
              </div>
              <div className="flex-1 min-w-0">
                {reply.split("\n").filter(Boolean).map((line, i) => (
                  <p key={i} className="text-[12px] leading-relaxed text-[#374151] mb-1 last:mb-0">
                    {line.replace(/^[#*-]\s?/, "")}
                  </p>
                ))}
              </div>
            </div>
            <button
              onClick={() => setReply(null)}
              className="mt-3 text-[10px] font-semibold transition-opacity hover:opacity-60"
              style={{ color: "#9CA3AF" }}
            >
              Tutup balasan ×
            </button>
          </div>
        )}

        {/* ── Input row ── */}
        <div
          className="flex items-end gap-2.5 rounded-2xl px-4 py-3.5 transition-all"
          style={{
            background: isListening ? "#F5F3FF" : "#F9FAFB",
            border: isListening ? "1.5px solid #7C3AED" : "1.5px solid #E5E7EB",
            transition: "border-color 0.2s, background 0.2s",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isListening ? "Mendengarkan suara kamu..." : "Tanya AINA sesuatu... (Enter untuk kirim)"}
            rows={2}
            className="flex-1 bg-transparent resize-none text-[13px] outline-none leading-relaxed"
            style={{
              maxHeight: "120px",
              minHeight: "38px",
              color: "#1A1A1A",
            }}
            disabled={loading}
          />

          {/* ── Mic button ── */}
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              disabled={loading}
              title={isListening ? "Hentikan rekaman" : "Bicara ke AINA"}
              className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-90 disabled:opacity-30 relative"
              style={{
                background: isListening
                  ? "linear-gradient(135deg, #7C3AED, #6D28D9)"
                  : "linear-gradient(135deg, #E5E7EB, #D1D5DB)",
                boxShadow: isListening ? "0 0 0 3px rgba(124,58,237,0.25)" : "none",
                transition: "all 0.2s",
              }}
            >
              {isListening && (
                <span
                  className="absolute inset-0 rounded-xl animate-ping"
                  style={{ background: "rgba(124,58,237,0.3)" }}
                />
              )}
              {isListening
                ? <MicOff className="h-3.5 w-3.5 relative z-10" style={{ color: "#fff" }} />
                : <Mic className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
              }
            </button>
          )}

          {/* ── Send button ── */}
          <button
            onClick={() => { send(input); setInput(""); }}
            disabled={!input.trim() || loading}
            className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-90 disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
              boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
            }}
          >
            <Send className="h-3.5 w-3.5 text-white" />
          </button>
        </div>

        <p className="text-[10px] mt-2 text-center" style={{ color: "#D1D5DB" }}>
          Enter untuk kirim · Shift+Enter untuk baris baru
          {voiceSupported && <span> · <span style={{ color: "#A78BFA" }}>🎙 Klik mic untuk berbicara</span></span>}
        </p>
      </div>
    </div>
  );
}

// ─── Online Users Card ────────────────────────────────────────────────────────

interface OnlineUser {
  userId: number;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  lastSeen: string;
  currentPage: string;
}

const PAGE_LABEL: Record<string, string> = {
  "/":           "Dashboard",
  "/notulensi":  "Notulensi",
  "/agenda":     "Agenda",
  "/anggota":    "Anggota",
  "/keuangan":   "Keuangan",
  "/surat":      "Surat",
  "/inventaris": "Inventaris",
  "/asisten":    "Asisten AINA",
  "/fitur":      "Fitur Terbaru",
  "/investor":   "Investor Mode",
};

function getPageLabel(page: string) {
  for (const [prefix, label] of Object.entries(PAGE_LABEL)) {
    if (page === prefix || (prefix !== "/" && page.startsWith(prefix))) return label;
  }
  return "Portal";
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 10) return "baru saja";
  if (diff < 60) return `${diff}d yang lalu`;
  return `${Math.floor(diff / 60)}m yang lalu`;
}

function UserAvatar({ user }: { user: OnlineUser }) {
  const initials = (user.fullName ?? user.username)
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.username}
        className="h-8 w-8 rounded-xl object-cover"
      />
    );
  }
  const colors = ["#3E0FA3", "#1D4ED8", "#047857", "#B45309", "#0284C7", "#BE185D"];
  const color = colors[user.userId % colors.length];
  return (
    <div
      className="h-8 w-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

function OnlineUsersCard() {
  const { data, isLoading } = useQuery<{ online: OnlineUser[]; count: number }>({
    queryKey: ["/api/presence/online"],
    refetchInterval: 30_000,
  });

  const online = data?.online ?? [];

  return (
    <div className="section-card p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-bold text-[#1A1A1A]">Sedang Online</h3>
          {!isLoading && (
            <span
              className="h-5 px-2 rounded-full text-[10px] font-bold flex items-center"
              style={{ background: online.length > 0 ? "#D1FAE5" : "#F3F4F6", color: online.length > 0 ? "#047857" : "#9CA3AF" }}
            >
              {online.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: "#10B981", boxShadow: "0 0 0 3px rgba(16,185,129,0.2)", animation: "pulse 2s infinite" }}
          />
          <span className="text-[10px] text-[#6B7280] font-medium">Live</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-2.5 animate-pulse">
              <div className="h-8 w-8 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 bg-gray-100 rounded-full w-2/3" />
                <div className="h-2 bg-gray-100 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : online.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-[12px] text-[#bbb]">Tidak ada yang online saat ini</p>
        </div>
      ) : (
        <div className="space-y-2">
          {online.map((u) => (
            <div key={u.userId} className="flex items-center gap-2.5 py-1">
              <div className="relative shrink-0">
                <UserAvatar user={u} />
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
                  style={{ background: "#10B981" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#1A1A1A] truncate">
                  {u.fullName ?? u.username}
                </p>
                <p className="text-[10px] text-[#9CA3AF] flex items-center gap-1 truncate">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: "#A78BFA" }}
                  />
                  {getPageLabel(u.currentPage)} · {timeAgo(u.lastSeen)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { data, isLoading } = useQuery<DashboardData>({ queryKey: ["/api/dashboard"] });

  // ── Notulensi ──
  const totalNotulensi = data?.totalNotulensi ?? 0;
  const finalNotulensi = data?.finalNotulensi ?? 0;
  const completionPct = totalNotulensi > 0 ? Math.round((finalNotulensi / totalNotulensi) * 100) : 0;

  const notulensi = data?.recentNotulensi ?? [];
  const agendaList = data?.upcomingAgendaList ?? [];

  // ── Agenda bulan ini ──
  const agendaThisCalMonth = data?.agendaThisCalMonth ?? 0;
  const agendaCompletedThisCalMonth = data?.agendaCompletedThisCalMonth ?? 0;
  const agendaCalMonthList = data?.agendaThisCalMonthList ?? [];
  const agendaCalMonthPct = agendaThisCalMonth > 0 ? Math.round((agendaCompletedThisCalMonth / agendaThisCalMonth) * 100) : 0;
  const currentMonthName = new Date().toLocaleDateString("id-ID", { month: "long" });

  const totalAnggota = data?.totalAnggota ?? 0;

  // ── Fitur ──
  const totalFitur = data?.totalFitur ?? 0;
  const completedFitur = data?.completedFitur ?? 0;
  const inProgressFitur = data?.inProgressFitur ?? 0;
  const fiturPct = totalFitur > 0 ? Math.round((completedFitur / totalFitur) * 100) : 0;

  const displayName = user?.displayName ?? user?.username ?? "—";
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

  const handleExportPDF = () => {
    if (!data) return;
    generatePDF(data, displayName);
  };

  return (
    <div className="animate-fade-in max-w-full">

      {/* ── Greeting hero ─────────────────────────────────────────────── */}
      <div
        className="mb-2 sm:mb-3 rounded-2xl sm:rounded-3xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0F0A1E 0%, #1A0845 35%, #2D0B7A 70%, #1E0654 100%)",
        }}
      >
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glowing orbs */}
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 right-1/3 h-32 w-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)" }} />

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.6), transparent)" }} />

        <div className="relative z-10 px-4 pb-3 pt-3.5 sm:px-5 sm:pb-3.5 sm:pt-4">
          {/* Row 1: greeting + PDF button */}
          <div className="mb-2 flex items-start justify-between gap-3 sm:mb-3">
            <div className="min-w-0 flex-1 pr-1">
              {/* Date label */}
              <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2">
                <div className="h-px w-4 shrink-0" style={{ background: "rgba(167,139,250,0.5)" }} />
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "rgba(167,139,250,0.7)" }}>{today}</p>
              </div>
              {/* Greeting */}
              <h1 className="text-xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                {getGreeting()},
              </h1>
              <h1 className="text-xl sm:text-3xl font-black leading-tight tracking-tight" style={{ color: "#C4B5FD" }}>
                {displayName} 👋
              </h1>
            </div>

            {/* PDF button — top right */}
            <button
              onClick={handleExportPDF}
              disabled={isLoading || !data}
              className="mt-0.5 flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[10px] font-semibold transition-all hover:opacity-80 active:scale-95 disabled:opacity-30 sm:mt-1 sm:h-8 sm:min-w-[94px] sm:px-3 sm:text-[11px]"
              style={{
                background: "rgba(139,92,246,0.2)",
                color: "rgba(196,181,253,0.9)",
                border: "1px solid rgba(139,92,246,0.3)",
              }}
              title="Download laporan PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>

          {/* Divider */}
          <div className="mb-2 sm:mb-2.5" style={{ height: "1px", background: "linear-gradient(90deg, rgba(139,92,246,0.32), rgba(139,92,246,0.08), transparent)" }} />

          {/* Row 2: World clock + Stats in one line */}
          <div className="pb-0.5">
            <div className="flex w-full items-center justify-between gap-3">
              {/* World clock */}
              <WorldClockDark />

              {/* Separator */}
              <div className="h-5 w-px shrink-0 hidden sm:block" style={{ background: "rgba(255,255,255,0.12)" }} />

              {/* Quick stats */}
              <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(196,181,253,0.9)" }}>
                  <Users className="h-3 w-3" style={{ color: "#A78BFA" }} />
                  {isLoading ? "—" : totalAnggota} Anggota
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(196,181,253,0.9)" }}>
                  <CalendarDays className="h-3 w-3" style={{ color: "#A78BFA" }} />
                  {isLoading ? "—" : data?.upcomingAgenda ?? 0} Agenda
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(196,181,253,0.9)" }}>
                    <Wallet className="h-3 w-3" style={{ color: "#A78BFA" }} />
                    {isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile stats */}
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:hidden">
            <div className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-[11px] font-medium" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(196,181,253,0.9)" }}>
              <Users className="h-3 w-3" style={{ color: "#A78BFA" }} />
              {isLoading ? "—" : totalAnggota}
            </div>
            <div className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-[11px] font-medium" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(196,181,253,0.9)" }}>
              <CalendarDays className="h-3 w-3" style={{ color: "#A78BFA" }} />
              {isLoading ? "—" : data?.upcomingAgenda ?? 0}
            </div>
            {isAdmin && (
              <div className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-[11px] font-medium" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(196,181,253,0.9)" }}>
                <Wallet className="h-3 w-3" style={{ color: "#A78BFA" }} />
                <span className="truncate">{isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 6 stat pills ─────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-2 sm:mb-3">
          {[
            { icon: FileText,   label: "Notulensi",  value: data?.totalNotulensi ?? 0,  url: "/notulensi" },
            { icon: CalendarDays, label: "Agenda",   value: data?.upcomingAgenda ?? 0,  url: "/agenda" },
            { icon: Users,      label: "Anggota",    value: data?.totalAnggota ?? 0,    url: "/anggota" },
            { icon: Mail,       label: "Surat",      value: data?.totalSurat ?? 0,      url: "/surat" },
            { icon: Package,    label: "Inventaris", value: data?.totalInventaris ?? 0, url: "/inventaris" },
            { icon: Handshake,  label: "Relasi",     value: data?.totalRelasi ?? 0,     url: "/relasi" },
          ].map(({ icon: Icon, label, value, url }) => (
            <Link key={url} to={url}>
              <div
                className="rounded-2xl p-2 sm:p-2.5 hover:-translate-y-0.5 transition-all cursor-pointer text-center"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(103,65,217,0.16)",
                  boxShadow: "0 2px 10px rgba(62,15,163,0.07)",
                }}
              >
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl mx-auto mb-1.5 sm:mb-2 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)" }}>
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#5B21B6]" />
                </div>
                <p className="text-lg sm:text-xl font-black text-[#1A1A1A]">{value}</p>
                <p className="text-[8.5px] sm:text-[10px] text-[#999] font-semibold uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Jarvis Widget ────────────────────────────────────────────── */}
      <JarvisWidget />

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-2 sm:gap-3">

        {/* ── Left column ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">

          {/* ── Progress cards row ─────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <ProgressCard
              sublabel="Notulensi"
              label="Status Final"
              pct={isLoading ? 0 : completionPct}
              value={isLoading ? "—" : `${finalNotulensi}/${totalNotulensi}`}
              color="#3E0FA3"
              link="/notulensi"
            />
            <ProgressCard
              sublabel={`Agenda · ${currentMonthName}`}
              label="Selesai"
              pct={isLoading ? 0 : agendaCalMonthPct}
              value={isLoading ? "—" : `${agendaCompletedThisCalMonth}/${agendaThisCalMonth}`}
              color="#1A1A1A"
              link="/agenda"
            />
            <GitHubChangesCard />
          </div>

          {/* ── Agenda Bulan Ini ─────────────────────────────────── */}
          <div className="section-card p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <div>
                <h3 className="text-[15px] font-bold text-[#1A1A1A]">
                  Agenda {currentMonthName}
                  {!isLoading && agendaThisCalMonth > 0 && (
                    <span className="ml-2 text-[12px] font-semibold text-[#999]">{agendaThisCalMonth} agenda</span>
                  )}
                </h3>
                {!isLoading && agendaThisCalMonth > 0 && (
                  <p className="text-[11px] text-[#999] mt-0.5">
                    {agendaCompletedThisCalMonth} selesai · {agendaThisCalMonth - agendaCompletedThisCalMonth} mendatang
                  </p>
                )}
              </div>
              <Link to="/agenda" className="text-[12px] text-[#999] hover:text-[#1A1A1A] transition-colors flex items-center gap-1">
                <ArrowRight className="h-3.5 w-3.5" /> Semua
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-black/[0.04] animate-pulse" />)}
              </div>
            ) : agendaCalMonthList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {agendaCalMonthList.slice(0, 4).map((a) => (
                  <AgendaCard key={a.id} item={a} />
                ))}
              </div>
            ) : agendaList.length > 0 ? (
              <>
                <p className="text-[11px] text-[#bbb] mb-3">Tidak ada agenda di bulan ini. Menampilkan agenda mendatang:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {agendaList.slice(0, 4).map((a) => (
                    <AgendaCard key={a.id} item={a} />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-5 text-center">
                <CalendarDays className="h-7 w-7 text-[#ddd] mx-auto mb-1.5" />
                <p className="text-[13px] text-[#bbb]">Belum ada agenda bulan ini</p>
              </div>
            )}
          </div>

          {/* ── Notulensi terbaru ─────────────────────────────────── */}
          <div className="section-card p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <div>
                <h3 className="text-[15px] font-bold text-[#1A1A1A]">Notulensi Terbaru</h3>
                {!isLoading && totalNotulensi > 0 && (
                  <p className="text-[11px] text-[#999] mt-0.5">
                    <span className="font-semibold text-green-600">{finalNotulensi} final</span>
                    {" · "}
                    <span>{data?.draftNotulensi ?? 0} draft</span>
                    {" · "}
                    {totalNotulensi} total
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#3E0FA3", color: "#ffffff" }}>
                  {isLoading ? "—" : totalNotulensi}
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
              <div className="py-5 text-center">
                <FileText className="h-7 w-7 text-[#ddd] mx-auto mb-1.5" />
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
                  <span>Lihat Semua Notulensi</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ───────────────────────────────────────────── */}
        <div className="xl:w-72 space-y-2 sm:space-y-3 shrink-0">

          {/* ── Stats summary ──────────────────────────────────────── */}
          <div className="section-card p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-[#1A1A1A]">Ringkasan Fitur</h3>
              <span className="text-[10px] font-semibold text-[#999] uppercase tracking-wide">Semua Modul</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: FileText,    label: "Notulensi",    value: isLoading ? "—" : String(data?.totalNotulensi ?? 0),   url: "/notulensi",  color: "#3E0FA3", bg: "#EDE9FE" },
                { icon: CalendarDays,label: "Agenda",       value: isLoading ? "—" : String(data?.upcomingAgenda ?? 0),   url: "/agenda",     color: "#1D4ED8", bg: "#DBEAFE" },
                { icon: Users,       label: "Anggota",      value: isLoading ? "—" : String(data?.totalAnggota ?? 0),     url: "/anggota",    color: "#047857", bg: "#D1FAE5" },
                { icon: Wallet,      label: "Keuangan",     value: isLoading ? "—" : (isAdmin ? formatRp(data?.saldoTersedia ?? 0) : "—"), url: "/keuangan",   color: "#B45309", bg: "#FEF3C7" },
                { icon: Mail,        label: "Surat",        value: isLoading ? "—" : String(data?.totalSurat ?? 0),       url: "/surat",      color: "#0284C7", bg: "#E0F2FE" },
                { icon: Package,     label: "Inventaris",   value: isLoading ? "—" : String(data?.totalInventaris ?? 0), url: "/inventaris", color: "#7C3AED", bg: "#F5F3FF" },
                { icon: Bot,         label: "Asisten AINA", value: "AI",                                                  url: "/asisten",    color: "#6D28D9", bg: "#EDE9FE" },
                { icon: Sparkles,    label: "Fitur",        value: isLoading ? "—" : `${inProgressFitur}/${totalFitur}`, url: "/fitur",      color: "#BE185D", bg: "#FCE7F3" },
              ].map(({ icon: Icon, label, value, url, color, bg }) => (
                <Link key={url} to={url}>
                  <div
                    className="rounded-xl p-2.5 flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
                    style={{ background: bg, border: `1px solid ${color}18` }}
                  >
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${color}22` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold truncate" style={{ color: "#374151" }}>{label}</p>
                      <p className="text-[12px] font-black leading-tight truncate" style={{ color }}>{value}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Online Users ───────────────────────────────────────── */}
          <OnlineUsersCard />

          {/* ── Jadwal Terdekat ────────────────────────────────────── */}
          {agendaList.length > 0 && (
            <div className="section-card p-3 sm:p-4">
              <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-3">Jadwal Terdekat</h3>
              <div className="space-y-3">
                {agendaList.slice(0, 3).map((a) => (
                  <Link to="/agenda" key={a.id}>
                    <div className="flex items-start gap-3 py-2 rounded-xl hover:bg-black/[0.03] px-2 -mx-2 transition-all cursor-pointer">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-bold text-white" style={{ background: "#3E0FA3" }}>
                        {formatDate(a.date).split(" ")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#1A1A1A] leading-tight truncate">{a.title}</p>
                        <p className="text-[11px] text-[#999] mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {a.time ?? "—"} · {formatDate(a.date)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Keuangan (admin only) ──────────────────────────────── */}
          {isAdmin && (
            <div className="section-card p-3 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-[#1A1A1A]">Keuangan</h3>
                <Link to="/keuangan" className="text-[11px] font-semibold text-[#3E0FA3] hover:opacity-80 transition-opacity">
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
                    <Wallet className="h-4 w-4 text-[#3E0FA3]" />
                    <span className="text-[12px] font-semibold text-[#1A1A1A]">Saldo</span>
                  </div>
                  <span
                    className="text-[14px] font-black"
                    style={{ color: (data?.saldoTersedia ?? 0) >= 0 ? "#16a34a" : "#dc2626" }}
                  >
                    {isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Fitur AINA Centre ─────────────────────────────────────── */}
      <FiturReviewSection />
    </div>
  );
}

// ─── Fitur Review Section ──────────────────────────────────────────────────────

interface ExtractedFeature {
  id: string;
  category: string;
  title: string;
  explanation: string;
  status: "baru" | "ditingkatkan" | "stabil";
  commitCount: number;
  lastCommitDate: string;
  commits: { sha: string; message: string; date: string }[];
}

const FEAT_STATUS_CFG = {
  baru:         { label: "🆕 Baru",          color: "#5B21B6", bg: "#EDE9FE" },
  ditingkatkan: { label: "⬆️ Ditingkatkan",  color: "#1D4ED8", bg: "#DBEAFE" },
  stabil:       { label: "✓ Stabil",         color: "#374151", bg: "#F3F4F6" },
} as const;

const DASH_CATEGORY_ICON: Record<string, LucideIcon> = {
  "AI & Laporan Cerdas":    BrainCircuit,
  "Tampilan & Pengalaman":  Paintbrush2,
  "Keuangan":               Landmark,
  "Anggota & Relasi":       UsersRound,
  "Agenda & Kegiatan":      CalendarCheck,
  "Notulensi & Rapat":      ClipboardList,
  "Dokumen & Inventaris":   Archive,
  "Sistem & Infrastruktur": Server,
  "Perbaikan & Performa":   Hammer,
  "Fitur Baru":             Rocket,
};

function FiturCard({ f }: { f: ExtractedFeature }) {
  const st = FEAT_STATUS_CFG[f.status] ?? FEAT_STATUS_CFG.stabil;
  const Icon = DASH_CATEGORY_ICON[f.category] ?? Layers;

  return (
    <Link to="/fitur" className="shrink-0" style={{ width: 260 }}>
      <div
        className="h-full rounded-2xl p-4 flex flex-col gap-3 transition-all duration-150 hover:-translate-y-1 cursor-pointer"
        style={{ background: "#ffffff", border: "1px solid rgba(103,65,217,0.16)", boxShadow: "0 2px 10px rgba(62,15,163,0.08)" }}
      >
        {/* Icon + category */}
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#F5F0FF", border: "1.5px solid #C4B5FD" }}
          >
            <Icon className="h-4 w-4" style={{ color: "#7C3AED" }} />
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full truncate"
            style={{ background: "#3E0FA315", color: "#3E0FA3" }}
          >
            {f.category}
          </span>
        </div>

        {/* Title */}
        <p className="text-[14px] font-bold text-[#1A1A1A] leading-snug line-clamp-2">
          {f.title}
        </p>

        {/* Explanation */}
        <p className="text-[12px] text-[#888] leading-relaxed line-clamp-3 flex-1">
          {f.explanation}
        </p>

        {/* Status + commit count */}
        <div className="flex items-center justify-between pt-1 border-t border-black/[0.08]">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: st.bg, color: st.color }}
          >
            {st.label}
          </span>
          <span className="text-[10px] text-[#bbb] flex items-center gap-1">
            <Zap className="h-2.5 w-2.5" />
            {f.commitCount} update
          </span>
        </div>
      </div>
    </Link>
  );
}

function FiturReviewSection() {
  const { data: rawCommits = [], isLoading: loadingCommits } = useQuery<any[]>({
    queryKey: ["/api/github/commits"],
    staleTime: 10 * 60 * 1000,
  });

  const firstSha = rawCommits[0]?.sha ?? "";
  const { data: features = [], isLoading: loadingFeatures } = useQuery<ExtractedFeature[]>({
    queryKey: ["extract-features", firstSha],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/github/extract-features", {
        commits: rawCommits.slice(0, 50),
      });
      return res.json();
    },
    enabled: rawCommits.length > 0,
    staleTime: 30 * 60 * 1000,
  });

  const isLoading = loadingCommits || loadingFeatures;
  const total     = features.length;
  const baru      = features.filter(f => f.status === "baru").length;
  const tingkat   = features.filter(f => f.status === "ditingkatkan").length;
  const stabil    = features.filter(f => f.status === "stabil").length;
  const activePct = total > 0 ? Math.round(((baru + tingkat) / total) * 100) : 0;

  return (
    <div className="mt-3 sm:mt-5 section-card p-3 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-7 w-7 rounded-xl flex items-center justify-center"
              style={{ background: "#3E0FA3" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-[16px] font-bold text-[#1A1A1A]">Fitur AINA Centre</h3>
          </div>
          <p className="text-[12px] text-[#999] ml-9">
            Area fitur aktif berdasarkan riwayat pengembangan terbaru
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Active percentage ring */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#F5F3FF" }}>
            <div className="relative">
              <ProgressRing pct={activePct} size={36} stroke={4} color="#3E0FA3" />
              <span
                className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                style={{ color: "#3E0FA3" }}
              >
                {activePct}%
              </span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#3E0FA3]">Aktif</p>
              <p className="text-[10px] text-[#A78BFA]">{baru + tingkat}/{total} area</p>
            </div>
          </div>

          <Link
            to="/fitur"
            className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
            style={{ background: "#1A1A1A", color: "#ffffff" }}
          >
            Semua Fitur <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Stats pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Area",     value: total,   color: "#3E0FA3", bg: "#F5F3FF", icon: Layers },
          { label: "Baru",           value: baru,    color: "#5B21B6", bg: "#EDE9FE", icon: Sparkles },
          { label: "Ditingkatkan",   value: tingkat, color: "#1D4ED8", bg: "#DBEAFE", icon: TrendingUp },
          { label: "Stabil",         value: stabil,  color: "#6B7280", bg: "#F3F4F6", icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: bg }}>
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}20` }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-black" style={{ color }}>
                {isLoading ? "—" : value}
              </p>
              <p className="text-[10px] font-semibold text-[#888] leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Fitur cards horizontal scroll */}
      {isLoading ? (
        <div className="flex gap-4 pb-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-52 w-64 rounded-2xl bg-black/[0.04] animate-pulse shrink-0" />
          ))}
        </div>
      ) : features.length === 0 ? (
        <div className="py-12 text-center">
          <Sparkles className="h-8 w-8 text-[#ddd] mx-auto mb-2" />
          <p className="text-[13px] text-[#bbb]">Data fitur sedang dimuat...</p>
        </div>
      ) : (
        <div
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.1) transparent" }}
        >
          {features.map((f) => (
            <FiturCard key={f.id} f={f} />
          ))}

          {/* "Lihat semua" card */}
          <Link to="/fitur" className="shrink-0 flex items-center" style={{ width: 180 }}>
            <div
              className="w-full h-full min-h-[200px] rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed transition-all hover:bg-black/[0.02] cursor-pointer"
              style={{ borderColor: "rgba(91,33,182,0.25)" }}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: "#F5F3FF" }}
              >
                <ArrowRight className="h-5 w-5 text-[#3E0FA3]" />
              </div>
              <p className="text-[12px] font-semibold text-[#3E0FA3] text-center px-4">
                Lihat Semua Fitur
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Stat bar helper ──────────────────────────────────────────────────────────

function StatBar({ label, value, pct, color, icon: Icon }: {
  label: string; value: string; pct: number; color: string; icon: any;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[12px] font-semibold text-[#1A1A1A]">{label}</p>
          <p className="text-[12px] font-bold text-[#1A1A1A]">{value}</p>
        </div>
        <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}
