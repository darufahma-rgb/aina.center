import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Wallet, FileText, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Beranda",   url: "/"          },
  { icon: CalendarDays,   label: "Agenda",    url: "/agenda"    },
  { icon: Wallet,         label: "Keuangan",  url: "/keuangan"  },
  { icon: FileText,       label: "Notulensi", url: "/notulensi" },
  { icon: Users,          label: "Anggota",   url: "/anggota"   },
];

interface BottomNavProps {
  sidebarOpen?: boolean;
  onSidebarClose?: () => void;
}

export function BottomNav({ sidebarOpen = false, onSidebarClose }: BottomNavProps) {
  const { pathname } = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 flex justify-center"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))", paddingTop: 8 }}
    >
      {/* Collapsed — single close button when sidebar is open */}
      <div
        className="absolute inset-x-3 bottom-0 flex justify-center items-end"
        style={{
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          pointerEvents: sidebarOpen ? "auto" : "none",
          opacity: sidebarOpen ? 1 : 0,
          transform: sidebarOpen ? "scale(1)" : "scale(0.85)",
          transition: "opacity 0.22s ease, transform 0.22s ease",
        }}
      >
        <button
          onClick={onSidebarClose}
          className="flex items-center gap-2 px-5 h-11 rounded-2xl font-semibold text-[13px] active:scale-95 transition-transform"
          style={{
            background: "#1A1A1A",
            color: "#fff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
          }}
        >
          <X className="h-4 w-4" />
          Tutup
        </button>
      </div>

      {/* Expanded — full 5-tab bar when sidebar is closed */}
      <div
        className="w-full flex items-center justify-around rounded-2xl px-1 py-0.5"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.10)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.06)",
          opacity: sidebarOpen ? 0 : 1,
          transform: sidebarOpen ? "scale(0.95)" : "scale(1)",
          pointerEvents: sidebarOpen ? "none" : "auto",
          transition: "opacity 0.18s ease, transform 0.18s ease",
        }}
      >
        {NAV_ITEMS.map(({ icon: Icon, label, url }) => {
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
      </div>
    </nav>
  );
}
