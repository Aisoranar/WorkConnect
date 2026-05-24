import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { AuthField, AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/lib/auth";
import { guardGuestOnly } from "@/lib/auth-guard";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña · WorkConnect" },
      {
        name: "description",
        content: "Solicita un enlace seguro para restablecer la contraseña de tu cuenta WorkConnect.",
      },
    ],
  }),
  beforeLoad: () => {
    guardGuestOnly();
  },
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      setSuccess(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el correo. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      badge="Recuperación de acceso"
      title="¿Olvidaste tu contraseña?"
      subtitle="Te enviaremos un enlace seguro a tu correo para crear una nueva contraseña."
      footer={
        <>
          <Link to="/login" className="font-medium text-primary-glow hover:underline">
            Volver a iniciar sesión
          </Link>
        </>
      }
    >
      {success ? (
        <div className="space-y-4 rounded-xl border border-primary/25 bg-primary/10 p-4 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary-glow" />
          <p className="text-sm leading-relaxed text-foreground">{success}</p>
          <p className="text-xs text-muted-foreground">
            Si no lo ves en unos minutos, revisa spam o promociones.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Ir a iniciar sesión</Link>
          </Button>
        </div>
      ) : (
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
                Enviando enlace…
              </>
            ) : (
              "Enviar enlace de recuperación"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
