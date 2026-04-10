import {
  LayoutDashboard, FileText, Sparkles, Wallet, CalendarDays, Users,
  Handshake, Mail, Package, Presentation, Wand2, LogOut, UserCog,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const navSections = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { title: "Notulensi", url: "/notulensi", icon: FileText },
      { title: "Agenda", url: "/agenda", icon: CalendarDays },
      { title: "Keuangan", url: "/keuangan", icon: Wallet },
    ],
  },
  {
    label: "Documentation",
    items: [
      { title: "Fitur Terbaru", url: "/fitur", icon: Sparkles },
      { title: "Surat", url: "/surat", icon: Mail },
      { title: "Inventaris", url: "/inventaris", icon: Package },
    ],
  },
  {
    label: "Organization",
    items: [
      { title: "Anggota", url: "/anggota", icon: Users },
      { title: "Relasi", url: "/relasi", icon: Handshake },
    ],
  },
  {
    label: "Presentation",
    items: [{ title: "Investor Mode", url: "/investor", icon: Presentation }],
  },
  {
    label: "Tools",
    items: [{ title: "AI Report Assistant", url: "/ai-report", icon: Wand2 }],
  },
];

const adminNavSection = {
  label: "Administration",
  items: [{ title: "Kelola Pengguna", url: "/admin/users", icon: UserCog }],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, isAdmin, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast({ title: "Gagal logout", variant: "destructive" });
    }
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";

  const renderSection = (section: typeof navSections[0], key: string) => (
    <SidebarGroup key={key}>
      {!collapsed && (
        <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold px-3 mb-0.5"
          style={{ color: "hsl(var(--sidebar-muted))" }}>
          {section.label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {section.items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="h-9 rounded-lg">
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-2.5 px-3 text-sm rounded-lg transition-all duration-150"
                  style={{ color: "hsl(var(--sidebar-foreground) / 0.65)" }}
                  activeClassName="font-medium"
                  activeStyle={{
                    background: "hsl(var(--sidebar-accent))",
                    color: "hsl(var(--sidebar-foreground))",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0" style={{ boxShadow: "2px 0 12px rgba(0,0,0,0.08)" }}>
      {/* Logo */}
      <SidebarHeader className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-neo-primary)" }}
          >
            <span className="text-white font-bold text-sm">A</span>
          </div>
          {!collapsed && (
            <div className="animate-slide-in">
              <h1 className="font-bold text-base leading-none" style={{ color: "hsl(var(--sidebar-foreground))" }}>
                AINA
              </h1>
              <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--sidebar-muted))" }}>
                Portal Internal
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-2 pt-1">
        {navSections.map((section) => renderSection(section, section.label))}

        {isAdmin && (
          <>
            <div className="mx-3 my-2 border-t" style={{ borderColor: "hsl(var(--sidebar-border))" }} />
            {renderSection(adminNavSection, "admin")}
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 border-t" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-1">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold"
              style={{ background: "var(--gradient-primary)" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "hsl(var(--sidebar-foreground))" }}>
                {user?.username}
              </p>
              <Badge variant={isAdmin ? "default" : "secondary"} className="text-[9px] px-1.5 py-0 h-4 mt-0.5">
                {isAdmin ? "Admin" : "User"}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg shrink-0"
              style={{ color: "hsl(var(--sidebar-muted))" }}
              onClick={handleLogout}
              data-testid="button-logout"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 mx-auto"
            style={{ color: "hsl(var(--sidebar-muted))" }}
            onClick={handleLogout}
            data-testid="button-logout-collapsed"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
