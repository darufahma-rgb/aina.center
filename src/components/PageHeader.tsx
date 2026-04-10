import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  const { pathname } = useLocation();
  const isDashboard = pathname === "/";

  return (
    <div className="mb-6">
      {!isDashboard && (
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#999] hover:text-[#3E0FA3] transition-colors mb-3 group"
        >
          <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Kembali ke Dashboard
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight">{title}</h1>
          {description && (
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2 shrink-0">{children}</div>
        )}
      </div>
    </div>
  );
}
