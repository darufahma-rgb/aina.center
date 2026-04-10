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
  color?: "primary" | "bright" | "mid" | "deep" | "purple" | "violet" | "blue" | "green" | "amber" | "rose";
}

const colorMap: Record<string, { orb: string; text: string; glow: string }> = {
  primary: { orb: "bg-primary/10", text: "text-primary",        glow: "rgba(124,58,237,0.16)" },
  bright:  { orb: "bg-violet-100", text: "text-violet-600",     glow: "rgba(139,92,246,0.16)" },
  mid:     { orb: "bg-purple-100", text: "text-purple-600",     glow: "rgba(109,40,217,0.16)" },
  deep:    { orb: "bg-purple-100", text: "text-purple-800",     glow: "rgba(88,28,135,0.16)"  },
  purple:  { orb: "bg-primary/10", text: "text-primary",        glow: "rgba(124,58,237,0.16)" },
  violet:  { orb: "bg-violet-100", text: "text-violet-600",     glow: "rgba(139,92,246,0.16)" },
  blue:    { orb: "bg-primary/10", text: "text-primary",        glow: "rgba(124,58,237,0.16)" },
  green:   { orb: "bg-violet-100", text: "text-violet-600",     glow: "rgba(139,92,246,0.16)" },
  amber:   { orb: "bg-purple-100", text: "text-purple-600",     glow: "rgba(109,40,217,0.16)" },
  rose:    { orb: "bg-purple-100", text: "text-purple-800",     glow: "rgba(88,28,135,0.16)"  },
};

export function StatCard({
  title, value, subtitle, icon: Icon, trend, trendUp, className, gradient, color = "primary",
}: StatCardProps) {
  const c = colorMap[color] ?? colorMap.primary;

  if (gradient) {
    return (
      <div
        className={cn("rounded-xl p-5 text-white overflow-hidden relative transition-all duration-200", className)}
        style={{
          background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,75%,50%))",
          boxShadow: "0 6px 20px rgba(124,58,237,0.38), 0 2px 6px rgba(124,58,237,0.22)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 55%)" }}
        />
        <div className="relative flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest">{title}</p>
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
      className={cn("bg-white rounded-xl p-5 border border-border transition-all duration-200", className)}
      style={{ boxShadow: "var(--shadow-neo-xs)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-neo-sm)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-neo-xs)"; }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1 min-w-0 mr-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                trendUp
                  ? "bg-primary/10 text-primary"
                  : "bg-purple-100 text-purple-700",
              )}
            >
              {trendUp ? "↑" : "↓"} {trend}
            </span>
          )}
        </div>
        <div
          className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", c.orb)}
          style={{ boxShadow: `0 4px 12px ${c.glow}` }}
        >
          <Icon className={cn("h-5 w-5", c.text)} />
        </div>
      </div>
    </div>
  );
}
