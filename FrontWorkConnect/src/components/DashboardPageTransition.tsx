import { Outlet, useRouterState } from "@tanstack/react-router";

/** Re-monta el contenido al cambiar de ruta con animación de entrada */
export function DashboardPageTransition() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div key={pathname} className="dashboard-page">
      <Outlet />
    </div>
  );
}
