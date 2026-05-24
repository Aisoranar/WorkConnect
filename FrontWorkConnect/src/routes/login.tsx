import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { AuthField, AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth";
import { guardGuestOnly } from "@/lib/auth-guard";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión · WorkConnect" },
      {
        name: "description",
        content:
          "Accede a tu cuenta WorkConnect para gestionar proyectos, postulaciones y tu perfil profesional.",
      },
    ],
  }),
  beforeLoad: () => {
    guardGuestOnly();
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      await navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      badge="Acceso a tu cuenta"
      title="Inicia sesión en WorkConnect"
      subtitle="Gestiona tus proyectos, postulaciones y herramientas de carrera desde un solo lugar."
      footer={
        <>
          ¿Aún no tienes cuenta?{" "}
          <Link to="/register" className="font-medium text-primary-glow hover:underline">
            Crear cuenta gratis
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthField id="email" label="Correo electrónico" icon={Mail}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="nombre@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="border-border bg-surface/60 pl-10"
          />
        </AuthField>

        <AuthField
          id="password"
          label="Contraseña"
          icon={Lock}
          labelExtra={
            <Link
              to="/forgot-password"
              className="text-xs font-normal text-primary-glow hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          }
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Introduce tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="border-border bg-surface/60 pl-10"
          />
        </AuthField>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="h-11 w-full bg-gradient-primary text-base font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando sesión…
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
