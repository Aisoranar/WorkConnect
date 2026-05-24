import type { ReactNode } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DashboardLoader } from "@/components/DashboardLoader";

type ApiStateProps = {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry?: () => void;
  children: ReactNode;
};

export function ApiState({ isLoading, isError, error, onRetry, children }: ApiStateProps) {
  if (isLoading) {
    return <DashboardLoader />;
  }

  if (isError) {
    return (
      <div className="card-inset border-destructive/30 p-6 text-center">
        <p className="text-sm text-destructive">No se pudo conectar con el servidor.</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {error?.message ?? "Error desconocido"}
        </p>
        {import.meta.env.DEV && (
          <p className="mt-1 text-xs text-muted-foreground">API: {getApiBaseUrl()}</p>
        )}
        {onRetry && (
          <Button size="sm" variant="outline" className="mt-4" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
