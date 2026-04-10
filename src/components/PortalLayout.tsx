import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Wallet, CalendarDays,
  Sparkles, Mail, Package, Users, Handshake, Presentation,
  Wand2, UserCog, LogOut, MoreHorizontal, Menu, X,
  Plus, Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Nav config ──────────────────────────────────────────────────────────────

const PRIMARY_NAV = [
  { title: "Overview",      url: "/",           icon: LayoutDashboard, exact: true  },
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
    { title: "Notulensi",   url: "/notulensi",  icon: FileText,     exact: false },
    { title: "Agenda",      url: "/agenda",     icon: CalendarDays, exact: false },
    { title: "Keuangan",    url: "/keuangan",   icon: Wallet,       exact: false },
  ]},
  { label: "Documentation", items: [
    { title: "Fitur Terbaru", url: "/fitur",    icon: Sparkles, exact: false },
    { title: "Surat",         url: "/surat",    icon: Mail,     exact: false },
    { title: "Inventaris",    url: "/inventaris", icon: Package, exact: false },
  ]},
  { label: "Organization", items: [
    { title: "Anggota",  url: "/anggota",  icon: Users,        exact: false },
    { title: "Relasi",   url: "/relasi",   icon: Handshake,    exact: false },
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

// ─── Sidebar nav item ─────────────────────────────────────────────────────────

function SidebarLink({ item, onClick }: { item: { title: string; url: string; icon: any; exact: boolean }; onClick?: () => void }) {
  const active = useIsActive(item.url, item.exact);
  return (
    <Link
      to={item.url}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 h-9 rounded-xl text-[13px] font-medium w-full transition-all duration-150",
        active
          ? "bg-violet-100 text-violet-700 font-semibold"
          : "text-foreground/55 hover:text-foreground/80 hover:bg-black/[0.04]",
      )}
    >
      <item.icon className={cn("h-[15px] w-[15px] shrink-0", active ? "text-violet-600" : "text-foreground/40")} />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

// ─── White sidebar ────────────────────────────────────────────────────────────

function DesktopSidebar({ user, isAdmin, onLogout }: { user: any; isAdmin: boolean; onLogout: () => void }) {
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div
      className="fixed left-0 top-0 bottom-0 w-[240px] flex flex-col z-30"
      style={{ background: "#fff", borderRight: "1px solid hsl(var(--border))" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 shrink-0">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,70%,50%))" }}>
          <img src="/logo.png" alt="AINA" className="h-5 w-5 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
        </div>
        <div>
          <p className="font-bold text-[14px] text-foreground leading-tight tracking-tight">AINA Centre</p>
          <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-muted-foreground/60">Management</p>
        </div>
      </div>

      {/* Primary nav */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5" style={{ scrollbarWidth: "none" }}>
        {PRIMARY_NAV.map((item) => <SidebarLink key={item.url} item={item} />)}

        {/* Modul section */}
        <div className="pt-4 pb-1">
          <div className="flex items-center justify-between px-3 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Modul</p>
            <Plus className="h-3 w-3 text-muted-foreground/40" />
          </div>
          {MODUL_NAV.map((item) => <SidebarLink key={item.url} item={item} />)}
        </div>

        {/* Admin section */}
        {isAdmin && (
          <div className="pt-2 pb-1">
            <div className="flex items-center px-3 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Admin</p>
            </div>
            {ADMIN_NAV.map((item) => <SidebarLink key={item.url} item={item} />)}
          </div>
        )}
      </div>

      {/* User + logout */}
      <div className="px-3 py-4 shrink-0 border-t" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-black/[0.04] transition-colors group">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,70%,50%))" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-foreground truncate">{user?.username}</p>
            <p className="text-[10px] text-muted-foreground/60">{isAdmin ? "Admin" : "User"}</p>
          </div>
          <button
            onClick={onLogout}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-black/[0.06] transition-colors shrink-0 opacity-0 group-hover:opacity-100"
            data-testid="button-logout"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile bottom nav ────────────────────────────────────────────────────────

const MOBILE_NAV = [
  { title: "Home",      url: "/",           icon: LayoutDashboard, exact: true  },
  { title: "Notulensi", url: "/notulensi",  icon: FileText,        exact: false },
  { title: "Keuangan",  url: "/keuangan",   icon: Wallet,          exact: false },
  { title: "Agenda",    url: "/agenda",     icon: CalendarDays,    exact: false },
];

function MobileBottomNav({ onMoreClick }: { onMoreClick: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
      style={{ height: "60px", background: "#0f0f12", borderTop: "1px solid rgba(255,255,255,0.06)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {MOBILE_NAV.map((item) => {
        const active = item.exact ? pathname === item.url : pathname.startsWith(item.url);
        return (
          <Link key={item.url} to={item.url} className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all">
            <item.icon className={cn("h-5 w-5 transition-colors", active ? "text-violet-400" : "text-white/30")} />
            <span className={cn("text-[10px] font-semibold", active ? "text-violet-300" : "text-white/30")}>{item.title}</span>
          </Link>
        );
      })}
      <button className="flex-1 flex flex-col items-center justify-center gap-0.5" onClick={onMoreClick}>
        <MoreHorizontal className="h-5 w-5 text-white/30" />
        <span className="text-[10px] font-semibold text-white/30">Lainnya</span>
      </button>
    </nav>
  );
}

// ─── Mobile nav sheet ─────────────────────────────────────────────────────────

function MobileNavSheet({ open, onClose, user, isAdmin, onLogout }: { open: boolean; onClose: () => void; user: any; isAdmin: boolean; onLogout: () => void }) {
  const allItems = [...PRIMARY_NAV, ...MODUL_NAV, ...(isAdmin ? ADMIN_NAV : [])];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[260px] p-0" style={{ background: "#fff", borderRight: "1px solid hsl(var(--border))" }}>
        <SheetTitle className="sr-only">Navigasi</SheetTitle>
        <div className="flex flex-col h-full">
          <div className="px-5 pt-5 pb-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,70%,50%))" }}>
                <img src="/logo.png" alt="AINA" className="h-4 w-4 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
              </div>
              <p className="font-bold text-[14px] text-foreground">AINA Centre</p>
            </div>
            <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-black/[0.06] transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
            {allItems.map((item) => <SidebarLink key={item.url} item={item} onClick={onClose} />)}
          </div>
          <div className="p-3 border-t shrink-0" style={{ borderColor: "hsl(var(--border))" }}>
            <button onClick={onLogout} className="flex items-center gap-2.5 px-3 h-9 w-full rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-black/[0.04] transition-colors">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Portal layout ────────────────────────────────────────────────────────────

interface PortalLayoutProps { children: ReactNode; }

export function PortalLayout({ children }: PortalLayoutProps) {
  const { user, isAdmin, logout } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";
  const sidebarWidth = isMobile ? 0 : 240;

  const handleLogout = async () => {
    try { await logout(); }
    catch { toast({ title: "Gagal logout", variant: "destructive" }); }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {!isMobile && <DesktopSidebar user={user} isAdmin={isAdmin} onLogout={handleLogout} />}

      {/* Content wrapper */}
      <div className="flex flex-col min-h-screen" style={{ marginLeft: sidebarWidth }}>

        {/* Top header */}
        <header
          className="h-14 flex items-center justify-between px-5 shrink-0 sticky top-0 z-20"
          style={{ background: "rgba(250,247,243,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid hsl(var(--border))" }}
        >
          {isMobile ? (
            <>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-foreground/60 hover:bg-black/[0.05] transition-colors"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="AINA" className="h-6 w-6 object-contain" />
                  <span className="font-bold text-sm text-foreground">AINA Centre</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-8 w-8 rounded-xl flex items-center justify-center text-foreground/50 hover:bg-black/[0.05] transition-colors">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,70%,50%))" }}>
                  {initials}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-[12px] text-muted-foreground font-medium">AINA Centre Management Portal</p>
              <div className="flex items-center gap-3">
                <button className="h-8 w-8 rounded-xl flex items-center justify-center text-foreground/50 hover:bg-black/[0.05] transition-colors">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,70%,50%))" }}>
                  {initials}
                </div>
              </div>
            </>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile nav */}
      {isMobile && (
        <>
          <MobileBottomNav onMoreClick={() => setMobileMenuOpen(true)} />
          <MobileNavSheet
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            user={user}
            isAdmin={isAdmin}
            onLogout={handleLogout}
          />
        </>
      )}
    </div>
  );
}
