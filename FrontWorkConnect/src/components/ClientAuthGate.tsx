import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { isAuthenticated, touchSessionActivity } from "@/lib/auth";

type ClientAuthGateProps = {
  children: React.ReactNode;
};

/**
 * Evita flash de contenido sin sesión tras hidratar (SSR no lee localStorage).
 */
export function ClientAuthGate({ children }: ClientAuthGateProps) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      void navigate({ to: "/login", replace: true });
      return;
    }
    touchSessionActivity();
    setReady(true);
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary-glow" />
        <p className="text-sm">Restaurando tu sesión…</p>
      </div>
    );
  }

  return <>{children}</>;
}
