import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";
import { LogoutConfirmButton } from "@/components/LogoutConfirmButton";
import { getStoredUser } from "@/lib/auth";
import {
  getDashboardNav,
  isDashboardNavActive,
  moreMenuItems,
  moreNavIcon,
} from "@/lib/dashboard-nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function DashboardBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = getStoredUser()?.role ?? "freelancer";
  const config = getDashboardNav(role);
  const extraItems = moreMenuItems(config);
  const [moreOpen, setMoreOpen] = useState(false);

  const MoreIcon = moreNavIcon;
  const moreActive =
    extraItems.some((item) => isDashboardNavActive(pathname, item.url)) ||
    isDashboardNavActive(pathname, "/dashboard/settings");

  return (
    <>
      <nav
        className="dashboard-bottom-nav md:hidden"
        aria-label="Navegación principal"
      >
        <ul className="flex items-stretch justify-around gap-0.5 px-1 pt-1">
          {config.bottomBar.map((item) => {
            const active = isDashboardNavActive(pathname, item.url);
            return (
              <li key={item.url} className="min-w-0 flex-1">
                <Link
                  to={item.url}
                  className={cn(
                    "dashboard-bottom-nav__item",
                    active && "dashboard-bottom-nav__item--active",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="truncate">{item.shortLabel}</span>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "dashboard-bottom-nav__item w-full",
                moreActive && "dashboard-bottom-nav__item--active",
              )}
              aria-label="Más opciones"
              aria-expanded={moreOpen}
            >
              <MoreIcon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">Más</span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl border-border px-4 pb-8 pt-2">
          <SheetHeader className="pb-2 text-left">
            <SheetTitle className="font-display text-base">Más opciones</SheetTitle>
          </SheetHeader>
          <ul className="space-y-1">
            {extraItems.map((item) => {
              const active = isDashboardNavActive(pathname, item.url);
              return (
                <li key={`${item.url}-${item.title}`}>
                  <Link
                    to={item.url}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                      active
                        ? "bg-primary/15 text-primary-glow"
                        : "text-foreground hover:bg-surface",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                to="/dashboard/settings"
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                  isDashboardNavActive(pathname, "/dashboard/settings")
                    ? "bg-primary/15 text-primary-glow"
                    : "text-foreground hover:bg-surface",
                )}
              >
                <Settings className="h-5 w-5 shrink-0" />
                Configuración
              </Link>
            </li>
            <li>
              <LogoutConfirmButton onBeforeLogout={() => setMoreOpen(false)}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-surface hover:text-foreground"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Salir
                </button>
              </LogoutConfirmButton>
            </li>
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
