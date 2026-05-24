import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Settings, Zap, LogOut } from "lucide-react";
import { getStoredUser, logout } from "@/lib/auth";
import {
  allSidebarNavItems,
  getDashboardNav,
  isDashboardNavActive,
} from "@/lib/dashboard-nav";
import { useIsMobile } from "@/hooks/use-mobile";
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

export function DashboardSidebar() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = getStoredUser()?.role ?? "freelancer";
  const config = getDashboardNav(role);
  const items = allSidebarNavItems(config);

  async function handleLogout() {
    await logout();
    queryClient.clear();
    await navigate({ to: "/login", replace: true });
  }

  if (isMobile) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4 md:p-5">
        <Link to="/" className="flex items-center gap-3">
          <div className="logo-mark h-10 w-10 shrink-0 md:h-11 md:w-11">
            <Zap className="h-5 w-5 text-primary-foreground md:h-[1.35rem] md:w-[1.35rem]" />
          </div>
          <span className="font-display text-base font-bold tracking-tight group-data-[collapsible=icon]:hidden md:text-lg lg:text-xl">
            WorkConnect
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3 md:px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs uppercase tracking-wider md:text-sm">
            {config.groupLabel}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 md:gap-2">
              {items.map((item) => {
                const active = isDashboardNavActive(pathname, item.url);
                return (
                  <SidebarMenuItem key={`${item.url}-${item.title}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      size="lg"
                      className="h-11 rounded-xl px-3 text-[0.9375rem] md:h-12 md:px-4 md:text-base lg:h-[3.25rem] lg:px-4 lg:text-[1.0625rem] [&>svg]:size-5 lg:[&>svg]:size-[1.35rem]"
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2 md:p-3">
        <SidebarMenu className="gap-1.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="h-11 rounded-xl px-3 text-[0.9375rem] md:h-12 md:px-4 md:text-base lg:h-[3.25rem] lg:px-4 lg:text-[1.0625rem] [&>svg]:size-5 lg:[&>svg]:size-[1.35rem]"
            >
              <Link to="/dashboard/profile" className="flex items-center gap-3">
                <Settings className="shrink-0" />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              size="lg"
              className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[0.9375rem] text-muted-foreground md:h-12 md:px-4 md:text-base lg:h-[3.25rem] lg:px-4 lg:text-[1.0625rem] [&>svg]:size-5 lg:[&>svg]:size-[1.35rem]"
              onClick={() => void handleLogout()}
            >
              <LogOut className="shrink-0" />
              <span>Salir</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
