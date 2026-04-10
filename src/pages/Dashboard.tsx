import { useState, useEffect } from "react";
import {
  FileText, CalendarDays, Users, TrendingUp,
  CheckCircle2, AlertCircle, Sparkles, Clock,
  ArrowRight, MoreHorizontal, Wallet, Download,
  Package, Mail, Handshake, Zap, PauseCircle,
  ListTodo, PlayCircle, Target, Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Notulensi, Agenda } from "../../shared/schema";
import jsPDF from "jspdf";

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
  upcomingAgenda: number;
  totalNotulensi: number;
  draftNotulensi: number;
  totalSurat: number;
  totalInventaris: number;
  totalRelasi: number;
  saldoTersedia: number;
  totalIncome: number;
  totalExpense: number;
  recentNotulensi: Notulensi[];
  upcomingAgendaList: Agenda[];
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

// ─── Progress card ─────────────────────────────────────────────────────────────

function ProgressCard({
  label, sublabel, pct, value, color = "#3E0FA3", link,
}: {
  label: string; sublabel: string; pct: number; value: string | number; color?: string; link?: string;
}) {
  const inner = (
    <div
      className="flex-1 rounded-2xl p-4 flex flex-col gap-3 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
      style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.10)" }}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#999]">{sublabel}</p>
        <p className="text-[14px] font-bold text-[#1A1A1A] mt-0.5">{label}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="relative flex items-center justify-center">
          <ProgressRing pct={pct} color={color} />
          <span className="absolute text-[12px] font-bold text-[#1A1A1A]">
            {pct}%
          </span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#1A1A1A]">{value}</p>
        </div>
      </div>
    </div>
  );
  return link ? <Link to={link} className="flex-1">{inner}</Link> : <div className="flex-1">{inner}</div>;
}

// ─── Agenda card (dark) ───────────────────────────────────────────────────────

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
        "flex items-center gap-4 py-3 px-2 rounded-2xl transition-all hover:bg-black/[0.03] cursor-pointer",
        index > 0 && "border-t border-black/[0.08]",
      )}>
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0"
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

  const displayName = user?.displayName ?? user?.username ?? "—";
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

  const handleExportPDF = () => {
    if (!data) return;
    generatePDF(data, displayName);
  };

  return (
    <div className="animate-fade-in max-w-full">

      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <div className="mb-5">
        {/* Row 1: greeting text */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="text-[11px] text-[#999] mb-0.5">{today}</p>
            <h1 className="text-xl sm:text-2xl font-black text-[#1A1A1A] leading-tight">
              {getGreeting()},{" "}
              <span style={{ color: "#3E0FA3" }}>{displayName}</span>! 👋
            </h1>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={isLoading || !data}
            className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-xl text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: "#3E0FA3" }}
            title="Download laporan PDF"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>

        {/* Row 2: World clock — scrollable on mobile */}
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex items-center gap-2 w-max sm:w-auto">
            <WorldClock />
          </div>
        </div>

        {/* Row 3: Quick stats — scrollable chips */}
        <div className="overflow-x-auto pb-1 mt-2 -mx-1 px-1">
          <div className="flex items-center gap-2 w-max sm:w-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-black/[0.12] text-[11px] font-medium text-[#555]" style={{ background: "#F8F9FB" }}>
              <Users className="h-3 w-3 text-[#3E0FA3]" />
              {isLoading ? "—" : totalAnggota} Anggota
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-black/[0.12] text-[11px] font-medium text-[#555]" style={{ background: "#F8F9FB" }}>
              <CalendarDays className="h-3 w-3 text-[#3E0FA3]" />
              {isLoading ? "—" : data?.upcomingAgenda ?? 0} Agenda
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-black/[0.12] text-[11px] font-medium text-[#555]" style={{ background: "#F8F9FB" }}>
                <Wallet className="h-3 w-3 text-[#3E0FA3]" />
                {isLoading ? "—" : formatRp(data?.saldoTersedia ?? 0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 6 stat pills ─────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { icon: FileText,   label: "Notulensi",  value: data?.totalNotulensi ?? 0,  url: "/notulensi" },
            { icon: CalendarDays, label: "Agenda",   value: data?.upcomingAgenda ?? 0,  url: "/agenda" },
            { icon: Users,      label: "Anggota",    value: data?.totalAnggota ?? 0,    url: "/anggota" },
            { icon: Mail,       label: "Surat",      value: data?.totalSurat ?? 0,      url: "/surat" },
            { icon: Package,    label: "Inventaris", value: data?.totalInventaris ?? 0, url: "/inventaris" },
            { icon: Handshake,  label: "Relasi",     value: data?.totalRelasi ?? 0,     url: "/relasi" },
          ].map(({ icon: Icon, label, value, url }) => (
            <Link key={url} to={url}>
              <div className="rounded-2xl p-3.5 border border-black/[0.11] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer text-center" style={{ background: "#F8F9FB" }}>
                <Icon className="h-5 w-5 mx-auto mb-1.5 text-[#3E0FA3]" />
                <p className="text-xl font-black text-[#1A1A1A]">{value}</p>
                <p className="text-[10px] text-[#999] font-semibold uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-5">

        {/* ── Left column ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ── Progress cards row ─────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <ProgressCard
              sublabel="Notulensi"
              label="Penyelesaian"
              pct={completionPct}
              value={isLoading ? "—" : total}
              color="#3E0FA3"
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
              color="#3E0FA3"
              link="/fitur"
            />
          </div>

          {/* ── Agenda mendatang ─────────────────────────────────── */}
          <div className="rounded-3xl p-5 border border-black/[0.11]" style={{ background: "#F8F9FB", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#1A1A1A]">
                Agenda Mendatang
                {!isLoading && agendaList.length > 0 && (
                  <span className="ml-2 text-[12px] font-semibold text-[#999]">{agendaList.length} item</span>
                )}
              </h3>
              <Link to="/agenda" className="text-[12px] text-[#999] hover:text-[#1A1A1A] transition-colors flex items-center gap-1">
                <ArrowRight className="h-3.5 w-3.5" /> Semua
              </Link>
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

          {/* ── Notulensi terbaru ─────────────────────────────────── */}
          <div className="rounded-3xl p-5 border border-black/[0.11]" style={{ background: "#F8F9FB", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#1A1A1A]">Notulensi Terbaru</h3>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#3E0FA3", color: "#ffffff" }}>
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
                  <span>Lihat Semua Notulensi</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ───────────────────────────────────────────── */}
        <div className="xl:w-72 space-y-5 shrink-0">

          {/* ── Stats summary ──────────────────────────────────────── */}
          <div className="rounded-3xl p-5 border border-black/[0.11]" style={{ background: "#F8F9FB", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#1A1A1A]">Ringkasan</h3>
              <MoreHorizontal className="h-4 w-4 text-[#ccc]" />
            </div>

            <div className="space-y-3">
              <StatBar label="Notulensi" value={isLoading ? "—" : String(total)} pct={completionPct} color="#3E0FA3" icon={FileText} />
              <StatBar label="Agenda" value={isLoading ? "—" : String(data?.upcomingAgenda ?? 0)} pct={Math.min(100, (data?.upcomingAgenda ?? 0) * 20)} color="#1A1A1A" icon={CalendarDays} />
              <StatBar label="Fitur Selesai" value={isLoading ? "—" : `${completedFitur}/${totalFitur}`} pct={fiturPct} color="#3E0FA3" icon={Sparkles} />
            </div>
          </div>

          {/* ── Jadwal Terdekat ────────────────────────────────────── */}
          {agendaList.length > 0 && (
            <div className="rounded-3xl p-5 border border-black/[0.11]" style={{ background: "#F8F9FB", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-4">Jadwal Terdekat</h3>
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
            <div className="rounded-3xl p-5 border border-black/[0.11]" style={{ background: "#F8F9FB", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
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

      {/* ── Laporan Fitur Terbaru AINA ────────────────────────────── */}
      <FiturReviewSection
        fiturList={data?.latestFitur ?? []}
        totalFitur={totalFitur}
        completedFitur={completedFitur}
        inProgressFitur={data?.insights?.inProgressFitur ?? 0}
        isLoading={isLoading}
      />
    </div>
  );
}

// ─── Fitur Review Section ──────────────────────────────────────────────────────

type FiturStatus = "planned" | "in_progress" | "completed" | "on_hold";
type FiturImpact = "low" | "medium" | "high";

const STATUS_CONFIG: Record<FiturStatus, { label: string; color: string; bg: string; icon: any }> = {
  planned:     { label: "Direncanakan", color: "#6B7280", bg: "#F3F4F6", icon: ListTodo },
  in_progress: { label: "Berjalan",     color: "#2563EB", bg: "#EFF6FF", icon: PlayCircle },
  completed:   { label: "Selesai",      color: "#16A34A", bg: "#F0FDF4", icon: CheckCircle2 },
  on_hold:     { label: "Ditunda",      color: "#D97706", bg: "#FFFBEB", icon: PauseCircle },
};

const IMPACT_CONFIG: Record<FiturImpact, { label: string; color: string; bg: string }> = {
  low:    { label: "Rendah",  color: "#6B7280", bg: "#F3F4F6" },
  medium: { label: "Sedang",  color: "#D97706", bg: "#FEF3C7" },
  high:   { label: "Tinggi",  color: "#DC2626", bg: "#FEF2F2" },
};

function FiturCard({ f }: { f: any }) {
  const status = STATUS_CONFIG[f.status as FiturStatus] ?? STATUS_CONFIG.planned;
  const impact = IMPACT_CONFIG[f.impact as FiturImpact] ?? IMPACT_CONFIG.medium;
  const StatusIcon = status.icon;

  return (
    <Link to="/fitur" className="shrink-0" style={{ width: 260 }}>
      <div
        className="h-full rounded-2xl p-4 flex flex-col gap-3 transition-all duration-150 hover:-translate-y-1 hover:shadow-lg cursor-pointer border"
        style={{
          background: "#F8F9FB",
          borderColor: "rgba(0,0,0,0.11)",
        }}
      >
        {/* Top row: category + impact */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider truncate max-w-[120px]"
            style={{ background: "#3E0FA315", color: "#3E0FA3" }}
          >
            {f.category}
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
            style={{ background: impact.bg, color: impact.color }}
          >
            <Target className="h-2.5 w-2.5" />
            {impact.label}
          </span>
        </div>

        {/* Name */}
        <p className="text-[14px] font-bold text-[#1A1A1A] leading-snug line-clamp-2">
          {f.name}
        </p>

        {/* Description */}
        <p className="text-[12px] text-[#888] leading-relaxed line-clamp-3 flex-1">
          {f.description}
        </p>

        {/* Status + date */}
        <div className="flex items-center justify-between pt-1 border-t border-black/[0.08]">
          <span
            className="text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: status.bg, color: status.color }}
          >
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
          <span className="text-[10px] text-[#bbb]">
            {formatDate(f.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function FiturReviewSection({
  fiturList, totalFitur, completedFitur, inProgressFitur, isLoading,
}: {
  fiturList: any[]; totalFitur: number; completedFitur: number;
  inProgressFitur: number; isLoading: boolean;
}) {
  const planned = Math.max(0, totalFitur - completedFitur - inProgressFitur);
  const overallPct = totalFitur > 0 ? Math.round((completedFitur / totalFitur) * 100) : 0;

  return (
    <div
      className="mt-5 rounded-3xl p-5 border border-black/[0.11]"
      style={{ background: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
    >
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
            <h3 className="text-[16px] font-bold text-[#1A1A1A]">Laporan Fitur Terbaru AINA</h3>
          </div>
          <p className="text-[12px] text-[#999] ml-9">
            Review program & fitur organisasi yang sedang berjalan
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Overall progress */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#F5F3FF" }}>
            <div className="relative">
              <ProgressRing pct={overallPct} size={36} stroke={4} color="#3E0FA3" />
              <span
                className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                style={{ color: "#3E0FA3" }}
              >
                {overallPct}%
              </span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#3E0FA3]">Progress</p>
              <p className="text-[10px] text-[#A78BFA]">{completedFitur}/{totalFitur} selesai</p>
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

      {/* Status summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Fitur",    value: totalFitur,      color: "#3E0FA3", bg: "#F5F3FF", icon: Zap },
          { label: "Selesai",        value: completedFitur,  color: "#16A34A", bg: "#F0FDF4", icon: CheckCircle2 },
          { label: "Sedang Berjalan",value: inProgressFitur, color: "#2563EB", bg: "#EFF6FF", icon: PlayCircle },
          { label: "Direncanakan",   value: planned,         color: "#6B7280", bg: "#F3F4F6", icon: ListTodo },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: bg }}
          >
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
      ) : fiturList.length === 0 ? (
        <div className="py-12 text-center">
          <Sparkles className="h-8 w-8 text-[#ddd] mx-auto mb-2" />
          <p className="text-[13px] text-[#bbb]">Belum ada fitur yang ditambahkan</p>
          <Link to="/fitur" className="mt-3 inline-block text-[12px] font-semibold text-[#3E0FA3] hover:opacity-80">
            Tambah Fitur Pertama →
          </Link>
        </div>
      ) : (
        <div
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.1) transparent" }}
        >
          {fiturList.map((f) => (
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
