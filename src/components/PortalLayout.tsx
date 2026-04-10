import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Wallet, CalendarDays,
  Sparkles, Mail, Package, Users, Handshake, Presentation,
  Wand2, UserCog, Menu, MoreHorizontal, LogOut, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Nav config ────────────────────────────────────────────────────────────────

export const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Operations",
    items: [
      { title: "Notulensi", url: "/notulensi", icon: FileText, exact: false },
      { title: "Agenda", url: "/agenda", icon: CalendarDays, exact: false },
      { title: "Keuangan", url: "/keuangan", icon: Wallet, exact: false },
    ],
  },
  {
    label: "Documentation",
    items: [
      { title: "Fitur Terbaru", url: "/fitur", icon: Sparkles, exact: false },
      { title: "Surat", url: "/surat", icon: Mail, exact: false },
      { title: "Inventaris", url: "/inventaris", icon: Package, exact: false },
    ],
  },
  {
    label: "Organization",
    items: [
      { title: "Anggota", url: "/anggota", icon: Users, exact: false },
      { title: "Relasi", url: "/relasi", icon: Handshake, exact: false },
    ],
  },
  {
    label: "Presentation",
    items: [{ title: "Investor Mode", url: "/investor", icon: Presentation, exact: false }],
  },
  {
    label: "Tools",
    items: [{ title: "AI Report", url: "/ai-report", icon: Wand2, exact: false }],
  },
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

// ─── Rail icon button ─────────────────────────────────────────────────────────

function RailLink({ item }: { item: { title: string; url: string; icon: any; exact: boolean } }) {
  const active = useIsActive(item.url, item.exact);
  return (
    <Link
      to={item.url}
      title={item.title}
      className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0",
        active ? "nav-active-pill text-white" : "text-purple-300/50 hover:text-purple-200/70 hover:bg-white/5",
      )}
    >
      <item.icon className="h-[18px] w-[18px]" />
    </Link>
  );
}

// ─── Panel nav link ───────────────────────────────────────────────────────────

function PanelLink({ item }: { item: { title: string; url: string; icon: any; exact: boolean } }) {
  const active = useIsActive(item.url, item.exact);
  return (
    <Link
      to={item.url}
      className={cn(
        "flex items-center gap-3 px-3 h-10 rounded-xl text-[13px] font-medium transition-all duration-150 w-full",
        active
          ? "nav-active-pill text-white font-semibold"
          : "text-purple-200/55 hover:text-purple-100/80 hover:bg-white/5",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

// ─── Two-panel desktop sidebar ────────────────────────────────────────────────

function DesktopSidebar({
  expanded,
  onToggle,
  user,
  isAdmin,
  onLogout,
}: {
  expanded: boolean;
  onToggle: () => void;
  user: any;
  isAdmin: boolean;
  onLogout: () => void;
}) {
  const allSections = isAdmin ? [...NAV_SECTIONS, ADMIN_SECTION] : NAV_SECTIONS;
  const allItems = allSections.flatMap((s) => s.items);
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div
      className="fixed left-0 top-0 bottom-0 flex z-30 transition-all duration-300"
      style={{ boxShadow: "6px 0 30px rgba(10,5,30,0.45)" }}
    >
      {/* ── Icon rail (always visible) ──────────────────────────────── */}
      <div
        className="w-14 flex flex-col items-center pt-4 pb-3 shrink-0"
        style={{ background: "hsl(250,53%,7%)" }}
      >
        {/* Logo */}
        <div
          className="h-9 w-9 rounded-xl overflow-hidden mb-5 shrink-0"
          style={{ boxShadow: "0 4px 16px rgba(124,58,237,0.45)" }}
        >
          <img src="/logo.png" alt="AINA" className="h-full w-full object-cover" />
        </div>

        {/* Nav icons */}
        <div className="flex flex-col items-center gap-1 flex-1 w-full px-2">
          {allItems.map((item) => (
            <RailLink key={item.url} item={item} />
          ))}
        </div>

        {/* Rail user avatar */}
        {!expanded && (
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-2 shrink-0"
            style={{ background: "var(--gradient-primary)" }}
            title={user?.username}
          >
            {initials}
          </div>
        )}
      </div>

      {/* ── Nav panel (collapsible) ─────────────────────────────────── */}
      {expanded && (
        <div
          className="w-[216px] flex flex-col overflow-hidden"
          style={{ background: "hsl(250,50%,9%)" }}
        >
          {/* Brand header */}
          <div className="px-4 pt-5 pb-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="min-w-0">
                <h1 className="font-bold text-[14px] leading-tight text-white">AINA Centre</h1>
                <p className="text-[9px] mt-0.5 font-semibold tracking-widest uppercase" style={{ color: "rgba(180,160,220,0.45)" }}>
                  Management
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 shrink-0"
              style={{ color: "rgba(180,160,220,0.5)" }}
              title="Tutup panel"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="mx-4 mb-3 border-t" style={{ borderColor: "rgba(124,58,237,0.12)" }} />

          {/* Nav sections */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p
                  className="text-[9px] uppercase tracking-[0.18em] font-bold px-3 pt-3 pb-1"
                  style={{ color: "rgba(180,160,220,0.38)" }}
                >
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <PanelLink key={item.url} item={item} />
                  ))}
                </div>
              </div>
            ))}

            {isAdmin && (
              <>
                <div className="mx-1 my-2 border-t" style={{ borderColor: "rgba(124,58,237,0.12)" }} />
                <div>
                  <p
                    className="text-[9px] uppercase tracking-[0.18em] font-bold px-3 pt-2 pb-1"
                    style={{ color: "rgba(180,160,220,0.38)" }}
                  >
                    {ADMIN_SECTION.label}
                  </p>
                  <div className="space-y-0.5">
                    {ADMIN_SECTION.items.map((item) => (
                      <PanelLink key={item.url} item={item} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User footer */}
          <div className="p-3 border-t shrink-0" style={{ borderColor: "rgba(124,58,237,0.12)" }}>
            <div
              className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
              style={{ background: "rgba(124,58,237,0.10)" }}
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                style={{ background: "var(--gradient-primary)" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white truncate">{user?.username}</p>
                <Badge
                  className="text-[9px] px-1.5 py-0 h-4 border-none mt-0.5"
                  style={isAdmin
                    ? { background: "rgba(124,58,237,0.35)", color: "#d8b4fe" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(200,180,255,0.7)" }}
                >
                  {isAdmin ? "Admin" : "User"}
                </Badge>
              </div>
              <button
                onClick={onLogout}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
                style={{ color: "rgba(180,160,220,0.55)" }}
                data-testid="button-logout"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expand handle (when collapsed) */}
      {!expanded && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full flex items-center justify-center text-white z-10 border border-purple-800/40"
          style={{ background: "hsl(265,60%,30%)", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
          title="Buka panel"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ─── Mobile bottom nav ────────────────────────────────────────────────────────

const MOBILE_NAV = [
  { title: "Home", url: "/", icon: LayoutDashboard, exact: true },
  { title: "Notulensi", url: "/notulensi", icon: FileText, exact: false },
  { title: "Keuangan", url: "/keuangan", icon: Wallet, exact: false },
  { title: "Agenda", url: "/agenda", icon: CalendarDays, exact: false },
];

function MobileBottomNav({ onMoreClick }: { onMoreClick: () => void }) {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
      style={{
        height: "60px",
        background: "hsl(250,53%,7%)",
        borderTop: "1px solid rgba(124,58,237,0.18)",
        boxShadow: "0 -4px 20px rgba(10,5,30,0.50)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {MOBILE_NAV.map((item) => {
        const active = item.exact ? pathname === item.url : pathname.startsWith(item.url);
        return (
          <Link
            key={item.url}
            to={item.url}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-150"
          >
            <item.icon
              className={cn("h-5 w-5", active ? "text-purple-400" : "text-purple-300/35")}
            />
            <span
              className={cn("text-[10px] font-semibold", active ? "text-purple-300" : "text-purple-300/35")}
            >
              {item.title}
            </span>
          </Link>
        );
      })}
      {/* More */}
      <button
        className="flex-1 flex flex-col items-center justify-center gap-0.5"
        onClick={onMoreClick}
      >
        <MoreHorizontal className="h-5 w-5 text-purple-300/35" />
        <span className="text-[10px] font-semibold text-purple-300/35">Lainnya</span>
      </button>
    </nav>
  );
}

// ─── Mobile nav sheet (full menu) ────────────────────────────────────────────

function MobileNavSheet({
  open,
  onClose,
  user,
  isAdmin,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  user: any;
  isAdmin: boolean;
  onLogout: () => void;
}) {
  const allSections = isAdmin ? [...NAV_SECTIONS, ADMIN_SECTION] : NAV_SECTIONS;
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-[280px] p-0 border-r-0"
        style={{ background: "hsl(250,50%,9%)", boxShadow: "6px 0 30px rgba(10,5,30,0.55)" }}
      >
        <SheetTitle className="sr-only">Navigasi</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-xl overflow-hidden shrink-0"
                style={{ boxShadow: "0 4px 16px rgba(124,58,237,0.45)" }}
              >
                <img src="/logo.png" alt="AINA" className="h-full w-full object-cover" />
              </div>
              <div>
                <h1 className="font-bold text-[14px] text-white leading-tight">AINA Centre</h1>
                <p className="text-[9px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: "rgba(180,160,220,0.45)" }}>
                  Management
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/10"
              style={{ color: "rgba(180,160,220,0.55)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mx-4 border-t" style={{ borderColor: "rgba(124,58,237,0.12)" }} />

          {/* Nav */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {allSections.map((section) => (
              <div key={section.label}>
                <p
                  className="text-[9px] uppercase tracking-[0.18em] font-bold px-3 pt-3 pb-1"
                  style={{ color: "rgba(180,160,220,0.38)" }}
                >
                  {section.label}
                </p>
                {section.items.map((item) => (
                  <div key={item.url} onClick={onClose}>
                    <PanelLink item={item} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* User footer */}
          <div className="p-4 border-t shrink-0" style={{ borderColor: "rgba(124,58,237,0.12)" }}>
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{ background: "rgba(124,58,237,0.10)" }}>
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                style={{ background: "var(--gradient-primary)" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isAdmin ? "#d8b4fe" : "rgba(200,180,255,0.6)" }}
                >
                  {isAdmin ? "Admin" : "User"}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10"
                style={{ color: "rgba(180,160,220,0.55)" }}
                data-testid="button-logout-mobile"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Portal Layout ────────────────────────────────────────────────────────────

interface PortalLayoutProps {
  children: ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const { user, isAdmin, logout } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";
  const sidebarWidth = isMobile ? 0 : sidebarExpanded ? 272 : 56;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast({ title: "Gagal logout", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <DesktopSidebar
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded((v) => !v)}
          user={user}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
      )}

      {/* Content wrapper */}
      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 shrink-0 sticky top-0 z-20 glass-header">
          {isMobile ? (
            <>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="AINA" className="h-7 w-7 rounded-lg" style={{ boxShadow: "0 2px 8px rgba(124,58,237,0.35)" }} />
                  <span className="font-bold text-sm text-foreground">AINA Centre</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold border-none"
                  style={isAdmin
                    ? { background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,75%,50%))", color: "white" }
                    : {}}
                  variant={isAdmin ? "default" : "secondary"}
                >
                  {isAdmin ? "Admin" : "User"}
                </Badge>
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                  style={{ background: "var(--gradient-primary)", boxShadow: "0 2px 8px rgba(124,58,237,0.35)" }}
                >
                  {initials}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {!sidebarExpanded && (
                  <button
                    onClick={() => setSidebarExpanded(true)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className="text-xs px-2.5 py-0.5 rounded-full font-semibold border-none"
                  style={isAdmin
                    ? { background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,75%,50%))", color: "white", boxShadow: "0 2px 8px rgba(124,58,237,0.28)" }
                    : {}}
                  variant={isAdmin ? "default" : "secondary"}
                >
                  {isAdmin ? "Admin" : "User"}
                </Badge>
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold cursor-default"
                  style={{ background: "var(--gradient-primary)", boxShadow: "0 2px 10px rgba(124,58,237,0.35)" }}
                  title={user?.username}
                >
                  {initials}
                </div>
              </div>
            </>
          )}
        </header>

        {/* Page content */}
        <main className={cn("flex-1 overflow-auto p-4 md:p-6 animate-fade-in", isMobile && "pb-20")}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <MobileBottomNav onMoreClick={() => setMobileMenuOpen(true)} />}

      {/* Mobile full nav sheet */}
      <MobileNavSheet
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />
    </div>
  );
}
