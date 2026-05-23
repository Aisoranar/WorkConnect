import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getStoredUser, isAuthenticated } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Bell, Search } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
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
  const user = getStoredUser();
  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border glass px-4 md:px-6">
            <SidebarTrigger />
            <div className="hidden flex-1 items-center gap-2 rounded-xl border border-border bg-surface/40 px-3 py-2 text-sm text-muted-foreground md:flex md:max-w-md">
              <Search className="h-4 w-4" />
              <input
                placeholder="Buscar proyectos, freelancers o skills…"
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button className="relative rounded-lg border border-border bg-surface/40 p-2 transition hover:bg-surface">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary-glow" />
              </button>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold shadow-glow"
                title={user?.name}
              >
                {initials}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
