import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface PortalLayoutProps {
  children: ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const { user, isAdmin } = useAuth();
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Glassmorphism header */}
          <header className="h-14 flex items-center justify-between px-5 shrink-0 sticky top-0 z-20 glass-header">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={isAdmin ? "default" : "secondary"}
                className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                style={isAdmin ? {
                  background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,75%,50%))",
                  color: "white",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(124,58,237,0.30)",
                } : {}}
              >
                {isAdmin ? "Admin" : "User"}
              </Badge>
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white cursor-default"
                style={{
                  background: "linear-gradient(135deg, hsl(265,83%,57%), hsl(285,75%,50%))",
                  boxShadow: "0 2px 10px rgba(124,58,237,0.35)",
                }}
                title={user?.username}
              >
                {initials}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
