import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className, gradient }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", gradient && "gradient-primary text-primary-foreground border-0", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className={cn("text-xs font-medium", gradient ? "text-primary-foreground/70" : "text-muted-foreground")}>{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className={cn("text-xs", gradient ? "text-primary-foreground/60" : "text-muted-foreground")}>{subtitle}</p>}
            {trend && (
              <p className={cn("text-xs font-medium", trendUp ? "text-success" : "text-destructive", gradient && "text-primary-foreground/80")}>
                {trend}
              </p>
            )}
          </div>
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", gradient ? "bg-primary-foreground/10" : "bg-primary/10")}>
            <Icon className={cn("h-5 w-5", gradient ? "text-primary-foreground" : "text-primary")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
