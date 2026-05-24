import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { SidebarBrandLogo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { Settings, LogOut } from "lucide-react";
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

const sidebarBtnClass =
  "h-11 rounded-xl px-3 text-[0.9375rem] md:h-12 md:px-4 md:text-base lg:h-[3.25rem] lg:px-4 lg:text-[1.0625rem] [&>svg]:size-5 lg:[&>svg]:size-[1.35rem] group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!h-9 group-data-[collapsible=icon]:!w-9 group-data-[collapsible=icon]:!min-w-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:[&>svg]:!size-5";

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
      <SidebarHeader className="flex h-(--dashboard-header-h) shrink-0 items-center border-b border-sidebar-border bg-sidebar px-4 transition-[height] duration-200 ease-linear group-data-[collapsible=icon]:h-(--dashboard-header-h-collapsed) group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        <SidebarBrandLogo size="lg" />
      </SidebarHeader>
      <SidebarContent className="px-2 py-3 md:px-3 group-data-[collapsible=icon]:px-1.5 group-data-[collapsible=icon]:py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs uppercase tracking-wider md:text-sm">
            {config.groupLabel}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 md:gap-2 group-data-[collapsible=icon]:items-center">
              {items.map((item) => {
                const active = isDashboardNavActive(pathname, item.url);
                return (
                  <SidebarMenuItem key={`${item.url}-${item.title}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      size="lg"
                      tooltip={item.title}
                      className={sidebarBtnClass}
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
      <SidebarFooter className="shrink-0 border-t border-sidebar-border bg-sidebar p-2 md:p-3 group-data-[collapsible=icon]:p-1.5">
        <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip="Configuración"
              className={sidebarBtnClass}
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
              tooltip="Salir"
              className={cn(sidebarBtnClass, "text-muted-foreground")}
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
