import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";

type ApiStateProps = {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry?: () => void;
  children: ReactNode;
};

export function ApiState({ isLoading, isError, error, onRetry, children }: ApiStateProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary-glow" />
        Cargando datos…
      </div>
    );
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
