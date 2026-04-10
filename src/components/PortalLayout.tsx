import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Wallet, CalendarDays,
  Sparkles, Mail, Package, Users, Handshake, Presentation,
  Wand2, UserCog, LogOut, Bell, Settings, Plus, HelpCircle,
  ChevronDown, Search, X, Menu,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ProfileModal } from "@/components/ProfileModal";
import AIChatWidget from "@/components/AIChatWidget";
import { BottomNav } from "@/components/BottomNav";

// ─── Nav config ───────────────────────────────────────────────────────────────

const PANTAU_NAV = [
  { title: "Dashboard",  url: "/",          icon: LayoutDashboard, exact: true  },
  { title: "Agenda",     url: "/agenda",    icon: CalendarDays,    exact: false },
  { title: "Keuangan",   url: "/keuangan",  icon: Wallet,          exact: false },
  { title: "Notulensi",  url: "/notulensi", icon: FileText,        exact: false },
];

const ORGANISASI_NAV = [
  { title: "Anggota",    url: "/anggota",    icon: Users,      exact: false },
  { title: "Relasi",     url: "/relasi",     icon: Handshake,  exact: false },
  { title: "Surat",      url: "/surat",      icon: Mail,       exact: false },
  { title: "Inventaris", url: "/inventaris", icon: Package,    exact: false },
];

const TOOLS_NAV = [
  { title: "AI Report",     url: "/ai-report", icon: Wand2,         exact: false },
  { title: "Investor Mode", url: "/investor",  icon: Presentation,  exact: false },
  { title: "Fitur Terbaru", url: "/fitur",     icon: Sparkles,      exact: false },
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
  { label: "Modul", items: [
    { title: "Surat",         url: "/surat",      icon: Mail,         exact: false },
    { title: "Inventaris",    url: "/inventaris", icon: Package,      exact: false },
    { title: "Anggota",       url: "/anggota",    icon: Users,        exact: false },
    { title: "Relasi",        url: "/relasi",     icon: Handshake,    exact: false },
    { title: "Investor Mode", url: "/investor",   icon: Presentation, exact: false },
    { title: "Fitur Terbaru", url: "/fitur",      icon: Sparkles,     exact: false },
  ]},
  { label: "Tools", items: [
    { title: "AI Report", url: "/ai-report", icon: Wand2, exact: false },
  ]},
];

export const ADMIN_SECTION = {
  label: "Administration",
  items: [{ title: "Kelola Pengguna", url: "/admin/users", icon: UserCog, exact: false }],
};

// ─── Sidebar width ────────────────────────────────────────────────────────────

const SIDEBAR_W      = 200;
const SIDEBAR_MARGIN = 12;
const ACCENT         = "#3E0FA3";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useIsActive(url: string, exact: boolean) {
  const { pathname } = useLocation();
  return exact ? pathname === url : pathname.startsWith(url);
}

// ─── Nav link item ────────────────────────────────────────────────────────────

function NavItem({
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
        "flex items-center gap-3 px-3 h-10 rounded-2xl text-[13px] font-medium w-full transition-all duration-150 group",
        active
          ? "nav-active"
          : "text-white/75 hover:bg-white/[0.12] hover:text-white",
      )}
    >
      <item.icon
        className={cn("h-[17px] w-[17px] shrink-0 transition-colors", active ? "text-[#3E0FA3]" : "text-white/50 group-hover:text-white")}
      />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

// ─── Sidebar component ────────────────────────────────────────────────────────

function Sidebar({
  user,
  isAdmin,
  onLogout,
  mobileOpen,
  onMobileClose,
  onProfileOpen,
}: {
  user: any;
  isAdmin: boolean;
  onLogout: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onProfileOpen: () => void;
}) {
  const displayName = user?.displayName || user?.username || "??";
  const initials = displayName.slice(0, 2).toUpperCase();

  const [helpDismissed, setHelpDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem("helpCardDismissed") === "true"; }
    catch { return false; }
  });

  const dismissHelp = () => {
    setHelpDismissed(true);
    try { localStorage.setItem("helpCardDismissed", "true"); } catch {}
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "sidebar-panel fixed top-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        style={{
          left: SIDEBAR_MARGIN,
          top: SIDEBAR_MARGIN,
          bottom: SIDEBAR_MARGIN,
          width: SIDEBAR_W,
          height: `calc(100vh - ${SIDEBAR_MARGIN * 2}px)`,
          borderRadius: 24,
          background: ACCENT,
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        {/* ── Logo ─────────────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-4 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.18)" }}
            >
              <img
                src="/logo.png"
                alt="AINA"
                className="h-5 w-5 object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
            <span className="font-bold text-[15px] text-white leading-none">AINA Centre</span>
          </Link>
        </div>

        {/* ── User profile ─────────────────────────────────────────── */}
        <div className="px-4 pb-5 shrink-0 flex flex-col items-center text-center">
          <button
            onClick={onProfileOpen}
            className="h-[72px] w-[72px] rounded-full flex items-center justify-center text-white text-xl font-bold mb-2.5 shrink-0 overflow-hidden hover:opacity-90 transition-opacity active:scale-95"
            style={{ background: ACCENT }}
            title="Edit Profil"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </button>
          <button
            onClick={onProfileOpen}
            className="flex items-center gap-1 hover:opacity-70 transition-opacity"
          >
            <p className="text-[14px] font-semibold text-white">{displayName}</p>
            <ChevronDown className="h-3.5 w-3.5 text-white/50" />
          </button>
          <p className="text-[12px] text-white/60 mt-0.5">{isAdmin ? "Administrator" : "Anggota"}</p>
        </div>

        {/* ── Divider ──────────────────────────────────────────────── */}
        <div className="mx-4 border-t border-white/[0.15] mb-2 shrink-0" />

        {/* ── Nav ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 py-1" style={{ scrollbarWidth: "none" }}>

          {/* Pantau */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-3 mb-1.5 mt-1">Pantau</p>
          <div className="space-y-0.5">
            {PANTAU_NAV.map((item) => (
              <NavItem key={item.url} item={item} onClick={onMobileClose} />
            ))}
          </div>

          {/* Organisasi */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-3 mb-1.5 mt-4">Organisasi</p>
          <div className="space-y-0.5">
            {ORGANISASI_NAV.map((item) => (
              <NavItem key={item.url} item={item} onClick={onMobileClose} />
            ))}
          </div>

          {/* Tools */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-3 mb-1.5 mt-4">Tools</p>
          <div className="space-y-0.5">
            {TOOLS_NAV.map((item) => (
              <NavItem key={item.url} item={item} onClick={onMobileClose} />
            ))}
          </div>

          {/* Admin */}
          {isAdmin && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-3 mb-1.5 mt-4">Admin</p>
              <div className="space-y-0.5 pb-2">
                {ADMIN_NAV.map((item) => (
                  <NavItem key={item.url} item={item} onClick={onMobileClose} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Help center dark card ─────────────────────────────────── */}
        {!helpDismissed && (
          <div className="p-3 pb-4 shrink-0">
            <div className="p-4 relative rounded-2xl" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.20)" }}>
              {/* Dismiss button */}
              <button
                onClick={dismissHelp}
                className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 transition-all"
                title="Tutup"
              >
                <X className="h-3 w-3" />
              </button>

              {/* Question circle */}
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center mb-3 shrink-0"
                style={{ background: "rgba(255,255,255,0.25)" }}
              >
                <HelpCircle className="h-4 w-4 text-white" />
              </div>

              <p className="text-[13px] font-semibold text-white mb-1 leading-tight">Bantuan Portal</p>
              <p className="text-[11px] text-white/60 mb-3 leading-relaxed">Ada pertanyaan? Hubungi admin atau lihat panduan.</p>

              <button
                onClick={onLogout}
                data-testid="button-logout"
                className="w-full h-8 rounded-xl text-[12px] font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:bg-white/20 active:scale-95"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar
              </button>
            </div>
          </div>
        )}

        {/* ── Logout-only when help card is dismissed ──────────────── */}
        {helpDismissed && (
          <div className="p-3 pb-4 shrink-0">
            <button
              onClick={onLogout}
              data-testid="button-logout"
              className="w-full h-9 rounded-2xl text-[12px] font-semibold text-white/60 flex items-center justify-center gap-1.5 transition-all hover:bg-white/[0.12] hover:text-white active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

// ─── Page tabs ────────────────────────────────────────────────────────────────

const PAGE_TABS = [
  { title: "Dashboard",  url: "/" },
  { title: "Notulensi",  url: "/notulensi" },
  { title: "Agenda",     url: "/agenda" },
  { title: "Keuangan",   url: "/keuangan" },
];

// ─── Portal layout ────────────────────────────────────────────────────────────

interface PortalLayoutProps { children: ReactNode; }

export function PortalLayout({ children }: PortalLayoutProps) {
  const { user, isAdmin, logout } = useAuth();
  const { toast } = useToast();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    try { await logout(); }
    catch { toast({ title: "Gagal logout", variant: "destructive" }); }
  };

  const contentLeft = SIDEBAR_W + SIDEBAR_MARGIN * 2;

  return (
    <div className="min-h-screen bg-background flex" style={{ overflowX: "clip", maxWidth: "100vw" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <Sidebar
        user={user}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onProfileOpen={() => setProfileOpen(true)}
      />

      {/* ── Main content — white card ────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-none lg:ml-[224px] lg:mr-3 lg:mt-3 lg:mb-3"
      >
        {/* White card wrapper */}
        <div
          className="flex-1 flex flex-col bg-white lg:rounded-3xl"
          style={{ overflow: "hidden", border: "1px solid rgba(0,0,0,0.10)" }}
        >
          {/* ── Top bar ──────────────────────────────────────────── */}
          <header className="flex items-center justify-between px-5 py-3.5 border-b shrink-0" style={{ borderColor: "rgba(0,0,0,0.09)" }}>

            {/* Left: mobile menu + page tabs */}
            <div className="flex items-center gap-1">
              <button
                className="lg:hidden h-8 w-8 rounded-xl flex items-center justify-center text-[#999] hover:bg-black/[0.05] mr-1"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </button>

              <nav className="hidden sm:flex items-center gap-0.5">
                {PAGE_TABS.map((tab) => {
                  const active = tab.url === "/" ? pathname === "/" : pathname.startsWith(tab.url);
                  return (
                    <Link
                      key={tab.url}
                      to={tab.url}
                      className={cn(
                        "px-3 h-8 rounded-xl text-[13px] font-medium transition-all flex items-center",
                        active
                          ? "text-[#1A1A1A] font-semibold"
                          : "text-[#999] hover:text-[#555] hover:bg-black/[0.04]",
                      )}
                    >
                      {tab.title}
                      {active && (
                        <span
                          className="ml-2 h-1.5 w-1.5 rounded-full inline-block"
                          style={{ background: ACCENT }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: search + controls */}
            <div className="flex items-center gap-2">
              <div className="relative hidden md:flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#bbb] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari atau ketik perintah"
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  className="h-8 pl-8 pr-3 rounded-xl text-[12px] bg-black/[0.04] border-0 text-[#555] placeholder:text-[#bbb] focus:outline-none focus:ring-2 focus:ring-black/10 transition-all w-44 focus:w-52"
                />
              </div>

              <button className="h-8 w-8 rounded-xl flex items-center justify-center text-[#999] hover:bg-black/[0.05] transition-all">
                <Bell className="h-4 w-4" />
              </button>

              <button
                className="h-8 w-8 rounded-xl flex items-center justify-center text-[#999] hover:bg-black/[0.05] transition-all"
                onClick={() => setProfileOpen(true)}
                title="Profil"
              >
                <Settings className="h-4 w-4" />
              </button>

              <button
                className="h-8 w-8 sm:w-auto sm:px-3.5 rounded-xl text-[12px] font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
                style={{ background: ACCENT }}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Tambah Baru</span>
              </button>
            </div>
          </header>

          {/* ── Page content ──────────────────────────────────────── */}
          <main className="flex-1 p-4 sm:p-5 pb-24 lg:pb-10 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* ── Profile Modal ────────────────────────────────────────────── */}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* ── AI Customer Service Chat Widget ──────────────────────────── */}
      <AIChatWidget />

      {/* ── Mobile bottom nav ────────────────────────────────────────── */}
      <BottomNav sidebarOpen={mobileOpen} onSidebarClose={() => setMobileOpen(false)} />
    </div>
  );
}
