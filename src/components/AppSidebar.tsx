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
    <SidebarGroup key={key} className="py-0.5">
      {!collapsed && (
        <SidebarGroupLabel
          className="text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-2 mb-0"
          style={{ color: "rgba(180,160,220,0.5)" }}
        >
          {section.label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {section.items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="h-9 p-0">
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-3 px-3 h-9 text-sm rounded-lg transition-all duration-150 w-full"
                  style={{ color: "rgba(200,185,235,0.7)" }}
                  activeClassName="nav-active-pill font-semibold"
                  activeStyle={{ color: "#ffffff" }}
                >
                  <item.icon className="h-[15px] w-[15px] shrink-0" />
                  {!collapsed && <span className="text-[13px]">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0"
      style={{ boxShadow: "4px 0 24px rgba(10,5,30,0.35)" }}
    >
      {/* ── Logo header ─────────────────────────────────────────── */}
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="shrink-0 h-10 w-10 rounded-xl overflow-hidden" style={{ boxShadow: "0 4px 16px rgba(124,58,237,0.45)" }}>
            <img src="/logo.png" alt="AINA" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="animate-slide-in min-w-0">
              <h1 className="font-bold text-[15px] leading-tight text-white tracking-tight">
                AINA Centre
              </h1>
              <p className="text-[10px] mt-0.5 font-medium tracking-widest uppercase" style={{ color: "rgba(180,160,220,0.6)" }}>
                Management
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* ── Navigation ──────────────────────────────────────────── */}
      <SidebarContent className="px-2 pt-0">
        {navSections.map((section) => renderSection(section, section.label))}

        {isAdmin && (
          <>
            <div
              className="mx-3 my-2 border-t"
              style={{ borderColor: "rgba(124,58,237,0.18)" }}
            />
            {renderSection(adminNavSection, "admin")}
          </>
        )}
      </SidebarContent>

      {/* ── User footer ─────────────────────────────────────────── */}
      <SidebarFooter
        className="p-3 border-t"
        style={{ borderColor: "rgba(124,58,237,0.15)" }}
      >
        {!collapsed ? (
          <div
            className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
            style={{ background: "rgba(124,58,237,0.12)" }}
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold"
              style={{ background: "var(--gradient-primary)", boxShadow: "0 2px 8px rgba(124,58,237,0.40)" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-white">
                {user?.username}
              </p>
              <Badge
                variant={isAdmin ? "default" : "secondary"}
                className="text-[9px] px-1.5 py-0 h-4 mt-0.5"
                style={isAdmin ? { background: "rgba(124,58,237,0.4)", color: "#d8b4fe", border: "none" } : {}}
              >
                {isAdmin ? "Admin" : "User"}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg shrink-0 hover:bg-white/10"
              style={{ color: "rgba(180,160,220,0.6)" }}
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
            className="h-9 w-9 mx-auto hover:bg-white/10"
            style={{ color: "rgba(180,160,220,0.6)" }}
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
