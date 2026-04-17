import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Wallet,
  Users, Handshake, Mail, Package,
  Bot, Presentation, Sparkles, UserCog,
  LogOut, X, Zap, LayoutGrid,
} from "lucide-react";

const ACCENT = "#3E0FA3";

// 2 kiri | center MENU | 2 kanan
const LEFT_ITEMS = [
  { icon: LayoutDashboard, label: "Beranda",   url: "/",         exact: true  },
  { icon: CalendarDays,   label: "Agenda",     url: "/agenda",   exact: false },
];
const RIGHT_ITEMS = [
  { icon: Wallet, label: "Keuangan",    url: "/keuangan", exact: false },
  { icon: Zap,    label: "Update AINA", url: "/fitur",    exact: false },
];

const SECTIONS = [
  {
    label: "Pantau",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",        url: "/",          exact: true  },
      { icon: CalendarDays,    label: "Agenda",            url: "/agenda",    exact: false },
      { icon: Wallet,          label: "Keuangan",          url: "/keuangan",  exact: false },
      { icon: Zap,             label: "Update Fitur AINA", url: "/fitur",     exact: false },
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
      { icon: Bot,          label: "Asisten AINA",  url: "/asisten",  exact: false },
      { icon: Presentation, label: "Investor Mode", url: "/investor", exact: false },
      { icon: Sparkles,     label: "Fitur Terbaru", url: "/fitur",    exact: false },
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

const MENU_ANIM_STYLE = `
  @keyframes bnav-pop {
    0%   { transform: scale(0.7) rotate(-30deg); opacity: 0; }
    60%  { transform: scale(1.15) rotate(8deg);  opacity: 1; }
    100% { transform: scale(1)    rotate(0deg);  opacity: 1; }
  }
  @keyframes bnav-sheet-in {
    0%   { transform: translateY(22px); opacity: 0; }
    100% { transform: translateY(0);    opacity: 1; }
  }
  @keyframes bnav-item-in {
    0%   { transform: translateY(12px) scale(0.92); opacity: 0; }
    100% { transform: translateY(0)    scale(1);    opacity: 1; }
  }
  @keyframes bnav-ring {
    0%   { box-shadow: 0 0 0 0 rgba(91,33,182,0.55); }
    70%  { box-shadow: 0 0 0 10px rgba(91,33,182,0);  }
    100% { box-shadow: 0 0 0 0 rgba(91,33,182,0);    }
  }
`;

export function BottomNav({ user, isAdmin, onLogout, onProfileOpen }: BottomNavProps) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => setAiOpen((e as CustomEvent<boolean>).detail);
    window.addEventListener("aiChatStateChange", handler as EventListener);
    return () => window.removeEventListener("aiChatStateChange", handler as EventListener);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  function toggleMenu() {
    setOpen((v) => {
      if (!v) setAnimKey((k) => k + 1);
      return !v;
    });
  }

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

  const BAR_HEIGHT = "62px";
  const SHEET_HEIGHT = "78svh";

  return (
    <>
      <style>{MENU_ANIM_STYLE}</style>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Floating AI button ── */}
      {!open && (
        <button
          onClick={handleAI}
          className="lg:hidden fixed z-50 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{
            bottom: `calc(${BAR_HEIGHT} + env(safe-area-inset-bottom) + 10px)`,
            right: 14,
            width: 36,
            height: 36,
            background: aiOpen ? ACCENT : "rgba(255,255,255,0.95)",
            boxShadow: aiOpen
              ? `0 4px 18px ${ACCENT}66`
              : "0 2px 12px rgba(0,0,0,0.15)",
            border: aiOpen ? "none" : `1.5px solid rgba(62,15,163,0.18)`,
          }}
          aria-label="AI Asisten"
        >
          <Bot
            className="h-4 w-4"
            style={{ color: aiOpen ? "#fff" : ACCENT }}
          />
        </button>
      )}

      {/* ── Container ── */}
      <div
        className="lg:hidden fixed left-0 right-0 bottom-0 z-50"
        style={{
          height: open ? SHEET_HEIGHT : "auto",
          transition: "height 0.38s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* ── Expanded panel ── */}
        <div
          className="absolute inset-0 bg-white overflow-y-auto"
          style={{
            bottom: BAR_HEIGHT,
            borderRadius: "20px 20px 0 0",
            borderTop: "1.5px solid rgba(62,15,163,0.12)",
            borderLeft: "1px solid rgba(0,0,0,0.06)",
            borderRight: "1px solid rgba(0,0,0,0.06)",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            transform: open ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.28s ease, transform 0.35s cubic-bezier(0.32,0.72,0,1)",
            animation: open ? `bnav-sheet-in 0.38s cubic-bezier(0.32,0.72,0,1) both` : "none",
          }}
        >
          {/* User header */}
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

          {/* Nav sections */}
          <div className="px-4 pt-3 pb-6 space-y-4">
            {SECTIONS.map((section, si) => (
              <div
                key={section.label}
                style={{
                  animation: open
                    ? `bnav-item-in 0.32s cubic-bezier(0.34,1.2,0.64,1) ${80 + si * 55}ms both`
                    : "none",
                }}
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">
                  {section.label}
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {section.items.map((item) => {
                    const active = isActive(item.url, item.exact);
                    return (
                      <Link
                        key={item.url + item.label}
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

            {isAdmin && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">Admin</p>
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

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">AI</p>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => { setOpen(false); handleAI(); }}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: aiOpen ? `${ACCENT}12` : "rgba(0,0,0,0.03)",
                    border: aiOpen ? `1.5px solid ${ACCENT}30` : "1.5px solid transparent",
                  }}
                >
                  <Bot className="h-[18px] w-[18px]" style={{ color: aiOpen ? ACCENT : "#888" }} />
                  <span className="text-[9px] font-semibold" style={{ color: aiOpen ? ACCENT : "#666" }}>AI Asisten</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── WHITE bottom bar ── */}
        <div
          className="absolute left-0 right-0 bottom-0 flex items-center"
          style={{
            height: `calc(${BAR_HEIGHT} + env(safe-area-inset-bottom))`,
            paddingBottom: "env(safe-area-inset-bottom)",
            background: "#fff",
            boxShadow: "0 -1px 0 rgba(0,0,0,0.07), 0 -4px 20px rgba(0,0,0,0.06)",
          }}
        >
          {/* LEFT items */}
          {LEFT_ITEMS.map(({ icon: Icon, label, url, exact }) => {
            const active = isActive(url, exact) && !open;
            return (
              <Link
                key={url}
                to={url}
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-[3px] flex-1 py-2 transition-all active:scale-90"
              >
                <Icon
                  className="h-[20px] w-[20px]"
                  style={{ color: active ? ACCENT : "#9CA3AF" }}
                />
                <span
                  className="text-[9px] font-semibold tracking-wide"
                  style={{ color: active ? ACCENT : "#9CA3AF" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          {/* CENTER — prominent MENU button */}
          <div className="flex flex-col items-center justify-center flex-1 py-1 gap-[3px]">
            <button
              key={animKey}
              onClick={toggleMenu}
              className="flex items-center justify-center rounded-full"
              style={{
                width: 38,
                height: 38,
                background: `linear-gradient(135deg, #5B21B6 0%, ${ACCENT} 100%)`,
                animation: open
                  ? `bnav-pop 0.38s cubic-bezier(0.34,1.56,0.64,1) both, bnav-ring 0.5s ease-out 0.1s both`
                  : undefined,
                transition: "transform 0.18s ease",
              }}
            >
              {/* Icon crossfade */}
              <span style={{ position: "relative", display: "flex", width: 17, height: 17 }}>
                <LayoutGrid
                  className="h-[17px] w-[17px] text-white absolute inset-0"
                  style={{
                    opacity: open ? 0 : 1,
                    transform: open ? "scale(0.4) rotate(90deg)" : "scale(1) rotate(0deg)",
                    transition: "opacity 0.22s ease, transform 0.28s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
                <X
                  className="h-[17px] w-[17px] text-white absolute inset-0"
                  style={{
                    opacity: open ? 1 : 0,
                    transform: open ? "scale(1) rotate(0deg)" : "scale(0.4) rotate(-90deg)",
                    transition: "opacity 0.22s ease, transform 0.28s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </span>
            </button>
            <span
              className="text-[9px] font-extrabold tracking-widest uppercase"
              style={{
                color: ACCENT,
                transition: "opacity 0.2s ease",
              }}
            >
              {open ? "Tutup" : "Menu"}
            </span>
          </div>

          {/* RIGHT items */}
          {RIGHT_ITEMS.map(({ icon: Icon, label, url, exact }) => {
            const active = isActive(url, exact) && !open;
            return (
              <Link
                key={url}
                to={url}
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-[3px] flex-1 py-2 transition-all active:scale-90"
              >
                <Icon
                  className="h-[20px] w-[20px]"
                  style={{ color: active ? ACCENT : "#9CA3AF" }}
                />
                <span
                  className="text-[9px] font-semibold tracking-wide"
                  style={{ color: active ? ACCENT : "#9CA3AF" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
