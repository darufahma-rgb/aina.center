import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Wallet, FileText, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { icon: LayoutDashboard, label: "Beranda",    url: "/"          },
  { icon: CalendarDays,   label: "Agenda",     url: "/agenda"    },
  { icon: Wallet,         label: "Keuangan",   url: "/keuangan"  },
  { icon: FileText,       label: "Notulensi",  url: "/notulensi" },
];

interface BottomNavProps {
  sidebarOpen?: boolean;
  onSidebarClose?: () => void;
}

export function BottomNav({ sidebarOpen = false, onSidebarClose }: BottomNavProps) {
  const { pathname } = useLocation();
  const [aiOpen, setAiOpen] = useState(false);

  // Keep aiOpen in sync if the chat is closed from within the widget
  useEffect(() => {
    const handler = (e: Event) => {
      const open = (e as CustomEvent<boolean>).detail;
      setAiOpen(open);
    };
    window.addEventListener("aiChatStateChange", handler as EventListener);
    return () => window.removeEventListener("aiChatStateChange", handler as EventListener);
  }, []);

  function handleAI() {
    const next = !aiOpen;
    setAiOpen(next);
    window.dispatchEvent(new CustomEvent("setAIChatOpen", { detail: next }));
  }

  return (
    <>
      {/* ── Full nav bar (hidden when sidebar open) ──────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3"
        style={{
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          paddingTop: 8,
          opacity: sidebarOpen ? 0 : 1,
          transform: sidebarOpen ? "translateY(100%)" : "translateY(0)",
          pointerEvents: sidebarOpen ? "none" : "auto",
          transition: "opacity 0.25s ease, transform 0.25s ease",
        }}
      >
        <div
          className="flex items-center justify-around rounded-2xl px-1 py-0.5"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.10)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {NAV_LINKS.map(({ icon: Icon, label, url }) => {
            const active = url === "/" ? pathname === "/" : pathname.startsWith(url);
            return (
              <Link
                key={url}
                to={url}
                className={cn(
                  "flex flex-col items-center gap-[3px] py-2 px-3 rounded-xl transition-all min-w-0 relative",
                  active ? "text-[#3E0FA3]" : "text-[#bbb]",
                )}
              >
                {active && (
                  <span
                    className="absolute top-1.5 left-1/2 -translate-x-1/2 h-1 w-5 rounded-full"
                    style={{ background: "#3E0FA3" }}
                  />
                )}
                <Icon className={cn("h-[22px] w-[22px] shrink-0 mt-1", active ? "text-[#3E0FA3]" : "text-[#bbb]")} />
                <span className={cn("text-[9px] font-bold tracking-wide", active ? "text-[#3E0FA3]" : "text-[#bbb]")}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* AI Asisten tab */}
          <button
            onClick={handleAI}
            className={cn(
              "flex flex-col items-center gap-[3px] py-2 px-3 rounded-xl transition-all min-w-0 relative",
              aiOpen ? "text-[#3E0FA3]" : "text-[#bbb]",
            )}
          >
            {aiOpen && (
              <span
                className="absolute top-1.5 left-1/2 -translate-x-1/2 h-1 w-5 rounded-full"
                style={{ background: "#3E0FA3" }}
              />
            )}
            <Sparkles className={cn("h-[22px] w-[22px] shrink-0 mt-1", aiOpen ? "text-[#3E0FA3]" : "text-[#bbb]")} />
            <span className={cn("text-[9px] font-bold tracking-wide", aiOpen ? "text-[#3E0FA3]" : "text-[#bbb]")}>
              AI Asisten
            </span>
          </button>
        </div>
      </nav>

      {/* ── Close button when sidebar is open ────────────────────── */}
      <button
        onClick={onSidebarClose}
        className="lg:hidden fixed z-[60] h-12 w-12 rounded-full flex items-center justify-center active:scale-90 transition-all"
        style={{
          bottom: "max(20px, calc(env(safe-area-inset-bottom) + 12px))",
          right: 16,
          background: "#1A1A1A",
          boxShadow: "0 4px 20px rgba(0,0,0,0.30)",
          opacity: sidebarOpen ? 1 : 0,
          transform: sidebarOpen ? "scale(1)" : "scale(0.6)",
          pointerEvents: sidebarOpen ? "auto" : "none",
          transition: "opacity 0.22s ease, transform 0.22s ease",
        }}
        aria-label="Tutup sidebar"
      >
        <X className="h-5 w-5 text-white" />
      </button>
    </>
  );
}
