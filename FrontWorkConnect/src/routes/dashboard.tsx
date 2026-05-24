import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { DashboardPageTransition } from "@/components/DashboardPageTransition";
import { authHeaders, clearSession, getStoredUser, isAuthenticated } from "@/lib/auth";
import { getApiBaseUrl, queryKeys } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardBottomNav } from "@/components/DashboardBottomNav";
import { LogoLink, dashboardHeaderCssVars } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { Bell, Search } from "lucide-react";

const TOKEN_REVALIDATE_MS = 10 * 60 * 1000;

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ context }) => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }

    // fetchQuery with staleTime: skips the network call if data was fetched recently.
    // On success it populates the queryKeys.me cache, so dashboard.profile.tsx's
    // useQuery(queryKeys.me) gets fresh data without a second request.
    // On 401 it throws a router redirect (no window.location.replace race condition).
    try {
      await context.queryClient.fetchQuery<UserProfile>({
        queryKey: queryKeys.me,
        queryFn: async () => {
          const res = await fetch(`${getApiBaseUrl()}/me`, {
            headers: authHeaders(false),
          });
          if (res.status === 401) {
            clearSession();
            throw redirect({ to: "/login" });
          }
          if (!res.ok) throw new Error(`Error ${res.status}`);
          return ((await res.json()) as { data: UserProfile }).data;
        },
        staleTime: TOKEN_REVALIDATE_MS,
      });
    } catch (err) {
      if (isRedirect(err)) throw err;
      // Network error: let the route render; queries will show the error state.
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard · WorkConnect" },
      { name: "description", content: "Tu panel personal en WorkConnect." },
    ],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17.5rem",
          "--sidebar-width-icon": "3.25rem",
          ...dashboardHeaderCssVars,
        } as React.CSSProperties
      }
    >
      <DashboardShell />
    </SidebarProvider>
  );
}

function DashboardShell() {
  const user = getStoredUser();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <div className="flex h-dvh w-full min-w-0 overflow-hidden">
      <DashboardSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className={cn(
            "z-40 flex shrink-0 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur-md supports-backdrop-filter:bg-card/80 sm:gap-3 sm:px-4 md:px-6",
            "max-md:h-16 transition-[height] duration-200 ease-linear",
            collapsed
              ? "md:h-(--dashboard-header-h-collapsed)"
              : "md:h-(--dashboard-header-h)",
          )}
        >
          <LogoLink size="lg" className="md:hidden" />
          <SidebarTrigger className="hidden shrink-0 md:inline-flex" />
          <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-surface/40 px-3 py-1.5 text-sm text-muted-foreground transition focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-ring md:flex md:max-w-md">
            <Search className="h-4 w-4" />
            <input
              placeholder="Buscar proyectos, freelancers o skills…"
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <button className="btn-icon-enterprise relative p-2" aria-label="Notificaciones">
              <Bell className="h-4 w-4" />
              <span className="dashboard-notify-dot absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary-glow" />
            </button>
            <div
              className={cn(
                "logo-mark h-8 w-8 rounded-full text-xs font-semibold sm:h-9 sm:w-9 sm:text-sm",
              )}
              title={user?.name}
            >
              {initials}
            </div>
          </div>
        </header>
        <main className="dashboard-main min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-8">
          <DashboardPageTransition />
        </main>
      </div>
      <DashboardBottomNav />
    </div>
  );
}
