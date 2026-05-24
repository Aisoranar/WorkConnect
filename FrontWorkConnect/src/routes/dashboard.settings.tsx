import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ExternalLink,
  Lock,
  Mail,
  MapPin,
  Shield,
  User,
  UserCircle,
} from "lucide-react";
import { fetchMe, queryKeys } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { ApiState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";
import { LogoutConfirmButton } from "@/components/LogoutConfirmButton";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

const roleLabels: Record<string, string> = {
  freelancer: "Talento joven",
  client: "Empresa / cliente",
  admin: "Administrador",
};

function SettingsPage() {
  const stored = getStoredUser();
  const { data: profile, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
  });

  const role = profile?.role ?? stored?.role ?? "freelancer";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="page-heading">
          <span className="text-gradient">Configuración</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Cuenta, sesión y preferencias de la plataforma.
        </p>
      </div>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        {profile && (
          <div className="space-y-4">
            <section className="card-paper space-y-4 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <UserCircle className="h-5 w-5 text-primary-glow" />
                Tu cuenta
              </h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Nombre</dt>
                  <dd className="font-medium">{profile.name}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" /> Email
                  </dt>
                  <dd className="font-medium break-all">{profile.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Rol</dt>
                  <dd className="font-medium">{roleLabels[role] ?? role}</dd>
                </div>
                {profile.city && (
                  <div>
                    <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> Ciudad
                    </dt>
                    <dd className="font-medium">{profile.city}</dd>
                  </div>
                )}
              </dl>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  Editar perfil público y skills
                </Link>
              </Button>
              {profile.username && (
                <Button asChild variant="ghost" size="sm" className="text-primary-glow">
                  <Link to="/talento/$username" params={{ username: profile.username }} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver perfil público
                  </Link>
                </Button>
              )}
            </section>

            <section className="card-paper space-y-3 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Bell className="h-5 w-5 text-primary-glow" />
                Notificaciones
              </h2>
              <p className="text-sm text-muted-foreground">
                Próximamente podrás elegir alertas por email y en la app (postulaciones, mensajes,
                match).
              </p>
              <div className="rounded-lg border border-dashed border-border bg-surface/30 px-4 py-3 text-xs text-muted-foreground">
                Por ahora revisa el icono de campana en el panel cuando haya novedades.
              </div>
            </section>

            <section className="card-paper space-y-3 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Shield className="h-5 w-5 text-primary-glow" />
                Seguridad
              </h2>
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                Para cambiar contraseña usa «Olvidé mi contraseña» en la pantalla de inicio de
                sesión con tu mismo email.
              </p>
            </section>

            <section className="card-paper border-destructive/20 p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold text-destructive">Sesión</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cierra sesión en este navegador de forma segura.
              </p>
              <LogoutConfirmButton>
                <Button variant="destructive" className="mt-4 w-full sm:w-auto">
                  Cerrar sesión
                </Button>
              </LogoutConfirmButton>
            </section>
          </div>
        )}
      </ApiState>
    </div>
  );
}
