import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bell,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Shield,
  User,
  UserCircle,
  Loader2,
} from "lucide-react";
import { fetchMe, changePassword, queryKeys } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { ApiState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoutConfirmButton } from "@/components/LogoutConfirmButton";
import { toast } from "sonner";

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
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
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
                  <dd className="break-all font-medium">{profile.email}</dd>
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
                <Link to="/dashboard/profile" search={{ edit: undefined, skill: undefined }}>
                  <User className="mr-2 h-4 w-4" />
                  Editar perfil público y skills
                </Link>
              </Button>
              {profile.username && (
                <Button asChild variant="ghost" size="sm" className="text-primary-glow">
                  <Link
                    to="/talento/$username"
                    params={{ username: profile.username }}
                    target="_blank"
                  >
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
                Las notificaciones de postulaciones, mensajes y coincidencias aparecen en el icono
                de campana del panel.
              </p>
            </section>

            <ChangePasswordSection />

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

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      }),
    onSuccess: (data) => {
      toast.success(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isValid = currentPassword.length >= 1 && newPassword.length >= 8 && newPassword === confirmPassword;

  return (
    <section className="card-paper space-y-4 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <Shield className="h-5 w-5 text-primary-glow" />
        Cambiar contraseña
      </h2>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="current_password">Contraseña actual</Label>
          <div className="relative">
            <Input
              id="current_password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowCurrent(!showCurrent)}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new_password">Nueva contraseña</Label>
          <div className="relative">
            <Input
              id="new_password"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirmar nueva contraseña</Label>
          <Input
            id="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>
          )}
        </div>

        <Button
          className="w-full sm:w-auto"
          disabled={!isValid || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Lock className="mr-2 h-4 w-4" />
          Cambiar contraseña
        </Button>
      </div>
    </section>
  );
}
