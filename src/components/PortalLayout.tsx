import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Wallet, CalendarDays,
  Sparkles, Mail, Package, Users, Handshake, Presentation,
  Wand2, UserCog, Menu, MoreHorizontal, LogOut, ChevronLeft, ChevronRight, X,
  Bell,
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
          : "text-white/35 hover:text-white/65 hover:bg-white/[0.08]",
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
          : "text-white/40 hover:text-white/75 hover:bg-white/[0.06]",
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
    >
      {/* ── Icon rail ───────────────────────────────────────────────── */}
      <div
        className="w-[60px] flex flex-col items-center pt-4 pb-3 shrink-0"
        style={{
          background: "hsl(240,14%,10%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <img
          src="/logo.png"
          alt="AINA"
          className="h-9 w-9 object-contain mb-5 shrink-0"
          style={{ filter: "drop-shadow(0 0 10px rgba(180,140,255,0.70))" }}
        />

        <div className="flex flex-col items-center gap-1.5 flex-1 w-full px-2">
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
          className="w-[210px] flex flex-col overflow-hidden"
          style={{
            background: "hsl(240,14%,12%)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
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

          <div className="mx-4 mb-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />

          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p
                  className="text-[9px] uppercase tracking-[0.20em] font-bold px-3 pt-3 pb-1"
                  style={{ color: "rgba(180,160,220,0.28)" }}
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
                    style={{ color: "rgba(180,160,220,0.28)" }}
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
          <div className="p-3 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div
              className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
              style={{ background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.18)" }}
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
                    ? { background: "rgba(139,92,246,0.30)", color: "#d8b4fe" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(200,180,255,0.60)" }}
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
        background: "hsl(240,14%,10%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.12)",
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
              className={cn("h-5 w-5 transition-all duration-200", active ? "text-purple-400" : "text-white/30")}
            />
            <span
              className={cn("text-[10px] font-semibold transition-all duration-200", active ? "text-purple-300" : "text-white/30")}
            >
              {item.title}
            </span>
          </Link>
        );
      })}
      <button
        className="flex-1 flex flex-col items-center justify-center gap-0.5"
        onClick={onMoreClick}
      >
        <MoreHorizontal className="h-5 w-5 text-white/30" />
        <span className="text-[10px] font-semibold text-white/30">Lainnya</span>
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
          background: "hsl(240,14%,10%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <SheetTitle className="sr-only">Navigasi</SheetTitle>
        <div className="flex flex-col h-full">
          <div className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="AINA"
                className="h-9 w-9 object-contain shrink-0"
                style={{ filter: "drop-shadow(0 0 10px rgba(180,140,255,0.70))" }}
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

          <div className="mx-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {allSections.map((section) => (
              <div key={section.label}>
                <p
                  className="text-[9px] uppercase tracking-[0.20em] font-bold px-3 pt-3 pb-1"
                  style={{ color: "rgba(180,160,220,0.28)" }}
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

          <div className="p-4 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div
              className="flex items-center gap-3 px-2 py-2 rounded-xl"
              style={{ background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.18)" }}
            >
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

// ─── Portal Layout ─────────────────────────────────────────────────────────────

interface PortalLayoutProps {
  children: ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const { user, isAdmin, logout } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";
  const sidebarWidth = isMobile ? 0 : 60;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast({ title: "Gagal logout", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background relative">

      {/* Desktop sidebar — always icon-only */}
      {!isMobile && (
        <DesktopSidebar
          expanded={false}
          onToggle={() => {}}
          user={user}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
      )}

      {/* Content wrapper */}
      <div
        className="flex flex-col min-h-screen"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Top header — light frosted */}
        <header className="h-14 flex items-center justify-between px-5 shrink-0 sticky top-0 z-20 glass-header">
          {isMobile ? (
            <>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="h-9 w-9 rounded-xl flex items-center justify-center transition-colors text-foreground/60 hover:text-foreground hover:bg-black/[0.05]"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="AINA" className="h-7 w-7 object-contain" />
                  <span className="font-bold text-sm tracking-tight text-foreground">AINA Centre</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-8 w-8 rounded-xl flex items-center justify-center text-foreground/50 hover:bg-black/[0.05] transition-colors">
                  <Bell className="h-4 w-4" />
                </button>
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {initials}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Left: page context */}
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">AINA Centre Management</p>
                </div>
              </div>

              {/* Right: user actions */}
              <div className="flex items-center gap-2">
                <button className="h-8 w-8 rounded-xl flex items-center justify-center text-foreground/45 hover:bg-black/[0.05] transition-colors">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2.5 pl-2 border-l border-border">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-foreground leading-tight">{user?.username}</p>
                    <p className="text-[10px] text-muted-foreground">{isAdmin ? "Admin" : "User"}</p>
                  </div>
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
