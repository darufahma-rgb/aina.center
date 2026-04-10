import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Wallet, FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Beranda",   url: "/"          },
  { icon: CalendarDays,   label: "Agenda",    url: "/agenda"    },
  { icon: Wallet,         label: "Keuangan",  url: "/keuangan"  },
  { icon: FileText,       label: "Notulensi", url: "/notulensi" },
  { icon: Users,          label: "Anggota",   url: "/anggota"   },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div
        className="flex items-center justify-around rounded-2xl px-1 py-0.5"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.10)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.06)",
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
