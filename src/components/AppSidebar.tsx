import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Wallet,
  CalendarDays,
  Users,
  Handshake,
  Mail,
  Package,
  Presentation,
  Bot,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useRole } from "@/contexts/RoleContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const navSections = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
    ],
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
    items: [
      { title: "Investor Mode", url: "/investor", icon: Presentation },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role, setRole, isAdmin } = useRole();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          {!collapsed && (
            <div className="animate-slide-in">
              <h1 className="text-sidebar-primary-foreground font-bold text-lg leading-none">AINA</h1>
              <p className="text-sidebar-muted text-xs mt-0.5">Portal</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-sidebar-muted text-[10px] uppercase tracking-wider font-semibold px-3">
              {!collapsed && section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-9">
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="text-sidebar-foreground/70 hover:text-sidebar-primary-foreground hover:bg-sidebar-accent rounded-lg transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="ml-2">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="mx-3 p-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4 text-sidebar-primary" />
                  <span className="text-sidebar-primary-foreground text-xs font-medium">AI Report Assistant</span>
                </div>
                <p className="text-sidebar-muted text-[10px] leading-relaxed">Coming soon — auto-tidy reports & notes</p>
                <Badge variant="outline" className="mt-2 text-[10px] border-sidebar-primary/30 text-sidebar-primary">
                  Preview
                </Badge>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <span className="text-sidebar-muted text-xs">Admin Mode</span>
            <Switch
              checked={isAdmin}
              onCheckedChange={(checked) => setRole(checked ? "admin" : "user")}
              className="data-[state=checked]:bg-sidebar-primary"
            />
          </div>
          <p className="text-sidebar-muted text-[10px] mt-1">
            Viewing as: <span className="text-sidebar-primary-foreground font-medium">{isAdmin ? "Admin" : "User"}</span>
          </p>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
