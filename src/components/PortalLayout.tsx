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
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Nav config ─────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
        "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0",
        active
          ? "nav-active-pill text-white"
          : "text-purple-300/40 hover:text-purple-200/70 hover:bg-white/[0.06]",
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
        "flex items-center gap-3 px-3 h-9 rounded-xl text-[13px] font-medium transition-all duration-200 w-full",
        active
          ? "nav-active-pill text-white font-semibold"
          : "text-purple-200/50 hover:text-purple-100/80 hover:bg-white/[0.05]",
      )}
    >
      <item.icon className="h-[15px] w-[15px] shrink-0" />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

// ─── Desktop sidebar ─────────────────────────────────────────────────────────

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
      style={{ boxShadow: "1px 0 0 rgba(255,255,255,0.04)" }}
    >
      {/* ── Icon rail ───────────────────────────────────────────────── */}
      <div
        className="w-14 flex flex-col items-center pt-4 pb-3 shrink-0"
        style={{
          background: "rgba(14,8,38,0.85)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <img
          src="/logo.png"
          alt="AINA"
          className="h-10 w-10 object-contain mb-5 shrink-0"
          style={{ filter: "drop-shadow(0 0 12px rgba(180,140,255,0.80))" }}
        />

        <div className="flex flex-col items-center gap-1 flex-1 w-full px-2">
          {allItems.map((item) => (
            <RailLink key={item.url} item={item} />
          ))}
        </div>

        {!expanded && (
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-2 shrink-0"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-neo-primary)" }}
            title={user?.username}
          >
            {initials}
          </div>
        )}
      </div>

      {/* ── Nav panel ───────────────────────────────────────────────── */}
      {expanded && (
        <div
          className="w-[216px] flex flex-col overflow-hidden"
          style={{
            background: "rgba(12,6,32,0.80)",
            backdropFilter: "blur(32px) saturate(180%)",
            WebkitBackdropFilter: "blur(32px) saturate(180%)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="px-4 pt-5 pb-4 flex items-center justify-between shrink-0">
            <div className="min-w-0">
              <h1 className="font-bold text-[14px] leading-tight text-white tracking-tight">AINA Centre</h1>
              <p className="text-[9px] mt-0.5 font-semibold tracking-[0.20em] uppercase" style={{ color: "rgba(180,160,220,0.40)" }}>
                Management
              </p>
            </div>
            <button
              onClick={onToggle}
              className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.07] shrink-0"
              style={{ color: "rgba(180,160,220,0.45)" }}
              title="Tutup panel"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="mx-4 mb-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }} />

          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p
                  className="text-[9px] uppercase tracking-[0.20em] font-bold px-3 pt-3 pb-1"
                  style={{ color: "rgba(180,160,220,0.32)" }}
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
                <div className="mx-1 my-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }} />
                <div>
                  <p
                    className="text-[9px] uppercase tracking-[0.20em] font-bold px-3 pt-2 pb-1"
                    style={{ color: "rgba(180,160,220,0.32)" }}
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
          <div className="p-3 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div
              className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.18)" }}
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-neo-primary)" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white truncate">{user?.username}</p>
                <Badge
                  className="text-[9px] px-1.5 py-0 h-4 border-none mt-0.5"
                  style={isAdmin
                    ? { background: "rgba(139,92,246,0.30)", color: "#d8b4fe" }
                    : { background: "rgba(255,255,255,0.07)", color: "rgba(200,180,255,0.65)" }}
                >
                  {isAdmin ? "Admin" : "User"}
                </Badge>
              </div>
              <button
                onClick={onLogout}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/[0.08] transition-colors shrink-0"
                style={{ color: "rgba(180,160,220,0.50)" }}
                data-testid="button-logout"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expand handle */}
      {!expanded && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full flex items-center justify-center text-white z-10"
          style={{
            background: "hsl(265,60%,28%)",
            border: "1px solid rgba(139,92,246,0.35)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.50)",
          }}
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
        background: "rgba(10,5,28,0.88)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 -4px 30px rgba(0,0,0,0.50)",
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
              className={cn("h-5 w-5 transition-all duration-200", active ? "text-purple-400" : "text-purple-300/30")}
            />
            <span
              className={cn("text-[10px] font-semibold transition-all duration-200", active ? "text-purple-300" : "text-purple-300/30")}
            >
              {item.title}
            </span>
            {active && (
              <div
                className="absolute bottom-1 w-4 h-0.5 rounded-full"
                style={{ background: "var(--gradient-primary)" }}
              />
            )}
          </Link>
        );
      })}
      <button
        className="flex-1 flex flex-col items-center justify-center gap-0.5"
        onClick={onMoreClick}
      >
        <MoreHorizontal className="h-5 w-5 text-purple-300/30" />
        <span className="text-[10px] font-semibold text-purple-300/30">Lainnya</span>
      </button>
    </nav>
  );
}

// ─── Mobile nav sheet ─────────────────────────────────────────────────────────

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
        style={{
          background: "rgba(10,5,28,0.92)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "8px 0 40px rgba(0,0,0,0.60)",
        }}
      >
        <SheetTitle className="sr-only">Navigasi</SheetTitle>
        <div className="flex flex-col h-full">
          <div className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="AINA"
                className="h-10 w-10 object-contain shrink-0"
                style={{ filter: "drop-shadow(0 0 12px rgba(180,140,255,0.80))" }}
              />
              <div>
                <h1 className="font-bold text-[14px] text-white leading-tight tracking-tight">AINA Centre</h1>
                <p className="text-[9px] font-semibold tracking-[0.20em] uppercase mt-0.5" style={{ color: "rgba(180,160,220,0.40)" }}>
                  Management
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/[0.07]"
              style={{ color: "rgba(180,160,220,0.50)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mx-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }} />

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {allSections.map((section) => (
              <div key={section.label}>
                <p
                  className="text-[9px] uppercase tracking-[0.20em] font-bold px-3 pt-3 pb-1"
                  style={{ color: "rgba(180,160,220,0.32)" }}
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

          <div className="p-4 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div
              className="flex items-center gap-3 px-2 py-2 rounded-xl"
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.18)" }}
            >
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-neo-primary)" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isAdmin ? "#d8b4fe" : "rgba(200,180,255,0.55)" }}
                >
                  {isAdmin ? "Admin" : "User"}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/[0.08]"
                style={{ color: "rgba(180,160,220,0.50)" }}
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

// ─── Floating aurora orbs ─────────────────────────────────────────────────────

function AuroraOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {/* Top-right primary orb */}
      <div
        className="orb-float-1 absolute rounded-full"
        style={{
          width: 700,
          height: 700,
          top: "-18%",
          right: "-12%",
          background: "radial-gradient(circle at 40% 40%, hsl(265,83%,55%) 0%, hsl(285,75%,45%) 35%, transparent 70%)",
          filter: "blur(90px)",
          opacity: 0.18,
        }}
      />
      {/* Bottom-left secondary orb */}
      <div
        className="orb-float-2 absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          bottom: "-20%",
          left: "-10%",
          background: "radial-gradient(circle at 60% 60%, hsl(255,80%,60%) 0%, hsl(245,70%,45%) 40%, transparent 70%)",
          filter: "blur(80px)",
          opacity: 0.15,
        }}
      />
      {/* Center accent orb */}
      <div
        className="orb-float-3 absolute rounded-full"
        style={{
          width: 450,
          height: 450,
          top: "30%",
          left: "40%",
          background: "radial-gradient(circle at 50% 50%, hsl(280,90%,65%) 0%, hsl(265,80%,50%) 40%, transparent 70%)",
          filter: "blur(100px)",
          opacity: 0.10,
        }}
      />
      {/* Top-left subtle orb */}
      <div
        className="orb-float-4 absolute rounded-full"
        style={{
          width: 350,
          height: 350,
          top: "5%",
          left: "15%",
          background: "radial-gradient(circle at 50% 50%, hsl(245,90%,60%) 0%, transparent 70%)",
          filter: "blur(70px)",
          opacity: 0.10,
        }}
      />
    </div>
  );
}

// ─── Portal Layout ─────────────────────────────────────────────────────────────

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
    <div className="min-h-screen bg-background relative">
      {/* Floating aurora orbs — always visible */}
      <AuroraOrbs />

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
        className="flex flex-col min-h-screen transition-all duration-300 relative z-10"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Frosted glass header */}
        <header className="h-14 flex items-center justify-between px-4 shrink-0 sticky top-0 z-20 glass-header">
          {isMobile ? (
            <>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="h-9 w-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ color: "rgba(200,180,255,0.55)" }}
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <img
                    src="/logo.png"
                    alt="AINA"
                    className="h-7 w-7 object-contain"
                    style={{ filter: "drop-shadow(0 0 8px rgba(180,140,255,0.75))" }}
                  />
                  <span className="font-bold text-sm text-white tracking-tight">AINA Centre</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold border-none"
                  style={isAdmin
                    ? { background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,75%,50%))", color: "white" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(200,180,255,0.65)" }}
                >
                  {isAdmin ? "Admin" : "User"}
                </Badge>
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                  style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-neo-primary)" }}
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
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.07]"
                    style={{ color: "rgba(200,180,255,0.55)" }}
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className="text-xs px-2.5 py-0.5 rounded-full font-semibold border-none"
                  style={isAdmin
                    ? { background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,75%,50%))", color: "white", boxShadow: "0 2px 10px rgba(124,58,237,0.35)" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(200,180,255,0.65)" }}
                >
                  {isAdmin ? "Admin" : "User"}
                </Badge>
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold cursor-default"
                  style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-neo-primary)" }}
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
