import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Compass,
  Send,
  MessageSquare,
  User,
  Settings,
  Zap,
  LogOut,
  PlusCircle,
  Briefcase,
} from "lucide-react";
import { getStoredUser, logout } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const freelancerItems = [
  { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
  { title: "Explorar proyectos", url: "/dashboard/explore", icon: Compass },
  { title: "Mis postulaciones", url: "/dashboard/applications", icon: Send },
  { title: "Mensajes", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Mi perfil", url: "/dashboard/profile", icon: User },
];

const clientItems = [
  { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
  { title: "Publicar proyecto", url: "/dashboard/publish", icon: PlusCircle },
  { title: "Mis proyectos", url: "/dashboard/my-projects", icon: Briefcase },
  { title: "Explorar talento", url: "/dashboard/explore", icon: Compass },
  { title: "Mensajes", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Mi perfil", url: "/dashboard/profile", icon: User },
];

const adminItems = [
  ...freelancerItems.slice(0, 1),
  { title: "Publicar (demo)", url: "/dashboard/publish", icon: PlusCircle },
  ...freelancerItems.slice(1),
  { title: "Admin", url: "/dashboard", icon: Briefcase },
];

export function DashboardSidebar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = getStoredUser()?.role ?? "freelancer";

  async function handleLogout() {
    await logout();
    queryClient.clear();
    await navigate({ to: "/login", replace: true });
  }

  const items =
    role === "client" ? clientItems : role === "admin" ? adminItems : freelancerItems;

  const groupLabel =
    role === "client"
      ? "Empresa"
      : role === "admin"
        ? "Administración"
        : "Talento joven";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-base font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            WorkConnect
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/dashboard/profile" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              className="flex w-full items-center gap-2 text-muted-foreground"
              onClick={() => void handleLogout()}
            >
              <LogOut className="h-4 w-4" />
              <span>Salir</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
