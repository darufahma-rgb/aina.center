import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Wallet, CalendarDays,
  Sparkles, Mail, Package, Users, Handshake, Presentation,
  Wand2, UserCog, LogOut, X, Bell, Plus, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Nav config ───────────────────────────────────────────────────────────────

const PRIMARY_NAV = [
  { title: "Dashboard",     url: "/",           icon: LayoutDashboard, exact: true  },
  { title: "Notulensi",     url: "/notulensi",  icon: FileText,        exact: false },
  { title: "Agenda",        url: "/agenda",     icon: CalendarDays,    exact: false },
  { title: "Keuangan",      url: "/keuangan",   icon: Wallet,          exact: false },
  { title: "Fitur Terbaru", url: "/fitur",      icon: Sparkles,        exact: false },
  { title: "AI Report",     url: "/ai-report",  icon: Wand2,           exact: false },
];

const MODUL_NAV = [
  { title: "Surat",         url: "/surat",      icon: Mail,            exact: false },
  { title: "Inventaris",    url: "/inventaris", icon: Package,         exact: false },
  { title: "Anggota",       url: "/anggota",    icon: Users,           exact: false },
  { title: "Relasi",        url: "/relasi",     icon: Handshake,       exact: false },
  { title: "Investor Mode", url: "/investor",   icon: Presentation,    exact: false },
];

const ADMIN_NAV = [
  { title: "Kelola Pengguna", url: "/admin/users", icon: UserCog, exact: false },
];

export const NAV_SECTIONS = [
  { label: "Overview",      items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard, exact: true }] },
  { label: "Operations",    items: [
    { title: "Notulensi", url: "/notulensi", icon: FileText,     exact: false },
    { title: "Agenda",    url: "/agenda",    icon: CalendarDays, exact: false },
    { title: "Keuangan",  url: "/keuangan",  icon: Wallet,       exact: false },
  ]},
  { label: "Documentation", items: [
    { title: "Fitur Terbaru", url: "/fitur",      icon: Sparkles, exact: false },
    { title: "Surat",         url: "/surat",      icon: Mail,     exact: false },
    { title: "Inventaris",    url: "/inventaris", icon: Package,  exact: false },
  ]},
  { label: "Organization", items: [
    { title: "Anggota", url: "/anggota", icon: Users,     exact: false },
    { title: "Relasi",  url: "/relasi",  icon: Handshake, exact: false },
  ]},
  { label: "Presentation", items: [
    { title: "Investor Mode", url: "/investor", icon: Presentation, exact: false },
  ]},
  { label: "Tools", items: [
    { title: "AI Report", url: "/ai-report", icon: Wand2, exact: false },
  ]},
];

export const ADMIN_SECTION = {
  label: "Administration",
  items: [{ title: "Kelola Pengguna", url: "/admin/users", icon: UserCog, exact: false }],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useIsActive(url: string, exact: boolean) {
  const { pathname } = useLocation();
  return exact ? pathname === url : pathname.startsWith(url);
}

const ALL_NAV = [...PRIMARY_NAV, ...MODUL_NAV];
const RAIL_WIDTH = 64;

// ─── Icon rail item (collapsed) ───────────────────────────────────────────────

function RailIcon({
  item,
  onOpen,
}: {
  item: { title: string; url: string; icon: any; exact: boolean };
  onOpen: () => void;
}) {
  const active = useIsActive(item.url, item.exact);
  return (
    <Link
      to={item.url}
      title={item.title}
      onClick={onOpen}
      className={cn(
        "flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-150 shrink-0",
        active
          ? "bg-violet-100 text-violet-700"
          : "text-foreground/35 hover:text-foreground/65 hover:bg-black/[0.05]",
      )}
    >
      <item.icon className="h-[18px] w-[18px]" />
    </Link>
  );
}

// ─── Full panel nav item (expanded) ───────────────────────────────────────────

function PanelLink({
  item,
  onClick,
}: {
  item: { title: string; url: string; icon: any; exact: boolean };
  onClick?: () => void;
}) {
  const active = useIsActive(item.url, item.exact);
  return (
    <Link
      to={item.url}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 h-10 rounded-2xl text-[13px] font-medium w-full transition-all duration-150",
        active
          ? "bg-violet-100 text-violet-700 font-semibold"
          : "text-foreground/55 hover:text-foreground/80 hover:bg-black/[0.04]",
      )}
    >
      <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-violet-600" : "text-foreground/35")} />
      <span className="truncate">{item.title}</span>
      {active && <ChevronRight className="h-3.5 w-3.5 ml-auto text-violet-400" />}
    </Link>
  );
}

// ─── Sidebar (icon rail + floating full panel) ────────────────────────────────

function Sidebar({
  open,
  onOpen,
  onClose,
  user,
  isAdmin,
  onLogout,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  user: any;
  isAdmin: boolean;
  onLogout: () => void;
}) {
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";
  const { pathname } = useLocation();

  // Close full panel on route change
  useEffect(() => { onClose(); }, [pathname]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll when full panel is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* ── Backdrop (only when full panel is open) ───────────────── */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 transition-all duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        style={{ background: "rgba(15,15,20,0.35)", backdropFilter: "blur(2px)" }}
        aria-hidden="true"
      />

      {/* ── Icon rail — always visible ────────────────────────────── */}
      <div
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col items-center py-4 gap-1"
        style={{
          width: RAIL_WIDTH,
          background: "#ffffff",
          borderRight: "1px solid hsl(var(--border))",
        }}
      >
        {/* Logo button — toggles full panel */}
        <button
          onClick={() => (open ? onClose() : onOpen())}
          className="h-10 w-10 rounded-2xl flex items-center justify-center mb-2 transition-all duration-150 hover:scale-105 active:scale-95 shrink-0"
          style={{ background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,70%,50%))" }}
          aria-label="Toggle sidebar"
        >
          <img
            src="/logo.png"
            alt="AINA"
            className="h-5 w-5 object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </button>

        {/* Nav icons */}
        <div className="flex-1 flex flex-col items-center gap-1 w-full px-2.5 overflow-hidden">
          {PRIMARY_NAV.map((item) => (
            <RailIcon key={item.url} item={item} onOpen={onOpen} />
          ))}

          {/* Divider */}
          <div className="w-8 border-t my-1" style={{ borderColor: "hsl(var(--border))" }} />

          {MODUL_NAV.map((item) => (
            <RailIcon key={item.url} item={item} onOpen={onOpen} />
          ))}

          {isAdmin && ADMIN_NAV.map((item) => (
            <RailIcon key={item.url} item={item} onOpen={onOpen} />
          ))}
        </div>

        {/* User avatar at bottom */}
        <button
          onClick={() => (open ? onClose() : onOpen())}
          className="h-9 w-9 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 transition-all hover:opacity-80 active:scale-95"
          style={{ background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,70%,50%))" }}
          title={user?.username}
        >
          {initials}
        </button>
      </div>

      {/* ── Full floating panel — slides over icon rail ───────────── */}
      <div
        className={cn(
          "fixed top-0 bottom-0 z-50 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none",
        )}
        style={{
          left: 0,
          width: 268,
          margin: "10px",
          height: "calc(100vh - 20px)",
          borderRadius: 24,
          background: "#ffffff",
          boxShadow: "0 24px 60px rgba(0,0,0,0.16), 0 8px 20px rgba(0,0,0,0.10)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,70%,50%))" }}
            >
              <img
                src="/logo.png"
                alt="AINA"
                className="h-5 w-5 object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
            <div>
              <p className="font-bold text-[14px] text-foreground leading-tight">AINA Centre</p>
              <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-muted-foreground/50">Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-black/[0.05] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-5 border-t mb-2" style={{ borderColor: "hsl(var(--border))" }} />

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5" style={{ scrollbarWidth: "none" }}>
          {PRIMARY_NAV.map((item) => (
            <PanelLink key={item.url} item={item} onClick={onClose} />
          ))}

          <div className="pt-4 pb-1">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Modul</p>
              <Plus className="h-3 w-3 text-muted-foreground/30" />
            </div>
            {MODUL_NAV.map((item) => (
              <PanelLink key={item.url} item={item} onClick={onClose} />
            ))}
          </div>

          {isAdmin && (
            <div className="pt-2 pb-1">
              <div className="px-3 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Admin</p>
              </div>
              {ADMIN_NAV.map((item) => (
                <PanelLink key={item.url} item={item} onClick={onClose} />
              ))}
            </div>
          )}
        </div>

        <div className="mx-5 border-t mt-2" style={{ borderColor: "hsl(var(--border))" }} />

        {/* User footer */}
        <div className="px-3 py-4 shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-black/[0.04] transition-colors group cursor-default">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,70%,50%))" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-foreground truncate">{user?.username}</p>
              <p className="text-[10px] text-muted-foreground/55">{isAdmin ? "Admin" : "User"}</p>
            </div>
            <button
              onClick={onLogout}
              className="h-7 w-7 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 text-muted-foreground/35 transition-all opacity-0 group-hover:opacity-100"
              data-testid="button-logout"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Portal layout ────────────────────────────────────────────────────────────

interface PortalLayoutProps { children: ReactNode; }

export function PortalLayout({ children }: PortalLayoutProps) {
  const { user, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";

  const handleLogout = async () => {
    try { await logout(); }
    catch { toast({ title: "Gagal logout", variant: "destructive" }); }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Sidebar (icon rail + floating panel) */}
      <Sidebar
        open={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
        user={user}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      {/* Content — always offset by icon rail width */}
      <div
        className="flex flex-col min-h-screen transition-none"
        style={{ marginLeft: RAIL_WIDTH }}
      >
        {/* Top header */}
        <header
          className="h-14 flex items-center justify-between px-5 shrink-0 sticky top-0 z-30"
          style={{
            background: "rgba(250,247,243,0.90)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          <p className="text-[12px] font-medium text-muted-foreground hidden sm:block">
            AINA Centre Management Portal
          </p>
          <p className="text-[13px] font-bold text-foreground sm:hidden">AINA Centre</p>

          <div className="flex items-center gap-2">
            <button className="h-8 w-8 rounded-xl flex items-center justify-center text-foreground/45 hover:bg-black/[0.05] transition-all">
              <Bell className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold transition-all hover:opacity-80 active:scale-95"
              style={{ background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,70%,50%))" }}
              title={user?.username}
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
