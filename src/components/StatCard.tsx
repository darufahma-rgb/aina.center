import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  gradient?: boolean;
  color?: "blue" | "green" | "amber" | "violet" | "rose";
}

const colorMap = {
  blue:   { orb: "from-blue-500 to-cyan-400",   glow: "rgba(59,130,246,0.25)",   text: "text-blue-600",  bg: "bg-blue-50"  },
  green:  { orb: "from-emerald-500 to-teal-400", glow: "rgba(16,185,129,0.25)",   text: "text-emerald-600", bg: "bg-emerald-50" },
  amber:  { orb: "from-amber-500 to-orange-400", glow: "rgba(245,158,11,0.25)",   text: "text-amber-600", bg: "bg-amber-50"  },
  violet: { orb: "from-violet-500 to-purple-400",glow: "rgba(139,92,246,0.25)",   text: "text-violet-600",bg: "bg-violet-50" },
  rose:   { orb: "from-rose-500 to-pink-400",    glow: "rgba(244,63,94,0.25)",    text: "text-rose-600",  bg: "bg-rose-50"   },
};

export function StatCard({
  title, value, subtitle, icon: Icon, trend, trendUp, className, gradient, color = "blue",
}: StatCardProps) {
  const c = colorMap[color];

  if (gradient) {
    return (
      <div
        className={cn("rounded-xl p-5 text-white overflow-hidden relative transition-all duration-200", className)}
        style={{
          background: "var(--gradient-primary)",
          boxShadow: "var(--shadow-neo-primary)",
        }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }}
        />
        <div className="relative flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-white/70 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
            {trend && <p className="text-xs font-semibold text-white/80">{trend}</p>}
          </div>
          <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-5 transition-all duration-200 group",
        className,
      )}
      style={{ boxShadow: "var(--shadow-neo-sm)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-neo-md)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-neo-sm)"; }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0 mr-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
              )}
            >
              {trendUp ? "↑" : "↓"} {trend}
            </span>
          )}
        </div>
        <div
          className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", c.bg)}
          style={{ boxShadow: `0 4px 12px ${c.glow}` }}
        >
          <Icon className={cn("h-5 w-5", c.text)} />
        </div>
      </div>
    </div>
  );
}
