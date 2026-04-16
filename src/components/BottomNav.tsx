import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Wallet, FileText,
  Users, Handshake, Mail, Package,
  Bot, Presentation, Sparkles, UserCog,
  LogOut, X, LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT = "#3E0FA3";

const BOTTOM_ITEMS = [
  { icon: LayoutDashboard, label: "Beranda",   url: "/",          exact: true  },
  { icon: CalendarDays,   label: "Agenda",     url: "/agenda",    exact: false },
  { icon: Wallet,         label: "Keuangan",   url: "/keuangan",  exact: false },
  { icon: FileText,       label: "Notulensi",  url: "/notulensi", exact: false },
];

const SECTIONS = [
  {
    label: "Pantau",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",  url: "/",          exact: true  },
      { icon: CalendarDays,    label: "Agenda",      url: "/agenda",    exact: false },
      { icon: Wallet,          label: "Keuangan",    url: "/keuangan",  exact: false },
      { icon: FileText,        label: "Notulensi",   url: "/notulensi", exact: false },
    ],
  },
  {
    label: "Organisasi",
    items: [
      { icon: Users,     label: "Anggota",    url: "/anggota",    exact: false },
      { icon: Handshake, label: "Relasi",     url: "/relasi",     exact: false },
      { icon: Mail,      label: "Surat",      url: "/surat",      exact: false },
      { icon: Package,   label: "Inventaris", url: "/inventaris", exact: false },
    ],
  },
  {
    label: "Tools",
    items: [
      { icon: Bot,          label: "Asisten AINA",  url: "/asisten",   exact: false },
      { icon: Presentation, label: "Investor Mode", url: "/investor",  exact: false },
      { icon: Sparkles,     label: "Fitur Terbaru", url: "/fitur",     exact: false },
    ],
  },
];

const ADMIN_ITEMS = [
  { icon: UserCog, label: "Kelola Pengguna", url: "/admin/users", exact: false },
];

interface BottomNavProps {
  user?: any;
  isAdmin?: boolean;
  onLogout?: () => void;
  onProfileOpen?: () => void;
}

export function BottomNav({ user, isAdmin, onLogout, onProfileOpen }: BottomNavProps) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => setAiOpen((e as CustomEvent<boolean>).detail);
    window.addEventListener("aiChatStateChange", handler as EventListener);
    return () => window.removeEventListener("aiChatStateChange", handler as EventListener);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  function handleAI() {
    const next = !aiOpen;
    setAiOpen(next);
    window.dispatchEvent(new CustomEvent("setAIChatOpen", { detail: next }));
  }

  function isActive(url: string, exact: boolean) {
    return exact ? pathname === url : pathname.startsWith(url);
  }

  const displayName = user?.displayName || user?.username || "—";
  const initials = displayName.slice(0, 2).toUpperCase();

  const SHEET_HEIGHT = "78svh";

  return (
    <>
      {/* ── Backdrop ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Floating AI button (above bottom bar) ── */}
      {!open && (
        <button
          onClick={handleAI}
          className="lg:hidden fixed z-50 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{
            bottom: "calc(72px + env(safe-area-inset-bottom))",
            right: 14,
            width: 36,
            height: 36,
            background: aiOpen ? ACCENT : "#fff",
            boxShadow: aiOpen
              ? `0 4px 18px ${ACCENT}55`
              : "0 2px 12px rgba(0,0,0,0.15)",
            border: aiOpen ? "none" : "1px solid rgba(0,0,0,0.08)",
          }}
          aria-label="AI Asisten"
        >
          <Bot
            className="h-4 w-4"
            style={{ color: aiOpen ? "#fff" : ACCENT }}
          />
        </button>
      )}

      {/* ── Whole command center container ── */}
      <div
        className="lg:hidden fixed left-0 right-0 bottom-0 z-50"
        style={{
          height: open ? SHEET_HEIGHT : "auto",
          transition: "height 0.38s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* ── Expanded panel (scrollable content above bar) ── */}
        <div
          className="absolute inset-0 bottom-[60px] bg-white overflow-y-auto"
          style={{
            borderRadius: "20px 20px 0 0",
            borderTop: "1px solid rgba(0,0,0,0.08)",
            borderLeft: "1px solid rgba(0,0,0,0.06)",
            borderRight: "1px solid rgba(0,0,0,0.06)",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            transition: "opacity 0.25s ease",
          }}
        >
          {/* ── User header ── */}
          <div
            className="flex items-center gap-2.5 px-4 py-3"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
          >
            <button
              onClick={() => { setOpen(false); onProfileOpen?.(); }}
              className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
              style={{ background: ACCENT }}
            >
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                : initials}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{displayName}</p>
              <p className="text-[11px] text-gray-400">{isAdmin ? "Administrator" : "Anggota"}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium px-2.5 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          </div>

          {/* ── Nav sections ── */}
          <div className="px-4 pt-3 pb-5 space-y-4">
            {SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">
                  {section.label}
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {section.items.map((item) => {
                    const active = isActive(item.url, item.exact);
                    return (
                      <Link
                        key={item.url}
                        to={item.url}
                        onClick={() => setOpen(false)}
                        className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all active:scale-95"
                        style={{
                          background: active ? `${ACCENT}12` : "rgba(0,0,0,0.03)",
                          border: active ? `1.5px solid ${ACCENT}30` : "1.5px solid transparent",
                        }}
                      >
                        <item.icon
                          className="h-[18px] w-[18px]"
                          style={{ color: active ? ACCENT : "#888" }}
                        />
                        <span
                          className="text-[9px] font-semibold text-center leading-tight"
                          style={{ color: active ? ACCENT : "#666" }}
                        >
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Admin section */}
            {isAdmin && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">
                  Admin
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {ADMIN_ITEMS.map((item) => {
                    const active = isActive(item.url, item.exact);
                    return (
                      <Link
                        key={item.url}
                        to={item.url}
                        onClick={() => setOpen(false)}
                        className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all active:scale-95"
                        style={{
                          background: active ? `${ACCENT}12` : "rgba(0,0,0,0.03)",
                          border: active ? `1.5px solid ${ACCENT}30` : "1.5px solid transparent",
                        }}
                      >
                        <item.icon className="h-[18px] w-[18px]" style={{ color: active ? ACCENT : "#888" }} />
                        <span className="text-[9px] font-semibold text-center leading-tight" style={{ color: active ? ACCENT : "#666" }}>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Asisten shortcut */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">
                AI
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => { setOpen(false); handleAI(); }}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: aiOpen ? `${ACCENT}12` : "rgba(0,0,0,0.03)",
                    border: aiOpen ? `1.5px solid ${ACCENT}30` : "1.5px solid transparent",
                  }}
                >
                  <Bot
                    className="h-[18px] w-[18px]"
                    style={{ color: aiOpen ? ACCENT : "#888" }}
                  />
                  <span className="text-[9px] font-semibold" style={{ color: aiOpen ? ACCENT : "#666" }}>
                    AI Asisten
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar (always visible) ── */}
        <div
          className="absolute left-0 right-0 bottom-0 flex items-end justify-around bg-white"
          style={{
            height: "calc(60px + env(safe-area-inset-bottom))",
            paddingBottom: "env(safe-area-inset-bottom)",
            borderTop: "1px solid rgba(0,0,0,0.09)",
          }}
        >
          {BOTTOM_ITEMS.map(({ icon: Icon, label, url, exact }) => {
            const active = isActive(url, exact) && !open;
            return (
              <Link
                key={url}
                to={url}
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-[2px] py-1.5 px-2.5 min-w-0 relative"
              >
                {active && (
                  <span
                    className="absolute top-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full"
                    style={{ background: ACCENT }}
                  />
                )}
                <Icon
                  className="h-5 w-5 shrink-0 mt-1"
                  style={{ color: active ? ACCENT : "#bbb" }}
                />
                <span
                  className="text-[8.5px] font-bold tracking-wide"
                  style={{ color: active ? ACCENT : "#bbb" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Menu / Close toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex flex-col items-center gap-[2px] py-1.5 px-2.5 min-w-0 transition-all active:scale-90"
          >
            {open ? (
              <>
                <X className="h-5 w-5 mt-1" style={{ color: ACCENT }} />
                <span className="text-[8.5px] font-bold tracking-wide" style={{ color: ACCENT }}>Tutup</span>
              </>
            ) : (
              <>
                <LayoutGrid className="h-5 w-5 shrink-0 mt-1" style={{ color: "#bbb" }} />
                <span className="text-[8.5px] font-bold tracking-wide" style={{ color: "#bbb" }}>Menu</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
