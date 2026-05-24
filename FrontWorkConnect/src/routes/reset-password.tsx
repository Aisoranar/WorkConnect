import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAuthenticated, resetPassword } from "@/lib/auth";
import { toast } from "sonner";

const searchSchema = z.object({
  token: z.string().optional().catch(""),
  email: z.string().optional().catch(""),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Nueva contraseña · WorkConnect" }],
  }),
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token: tokenFromUrl, email: emailFromUrl } = Route.useSearch();
  const [email, setEmail] = useState(emailFromUrl ?? "");
  const [token] = useState(tokenFromUrl ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const missingToken = !token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      toast.success(data.message);
      await navigate({ to: "/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura para tu cuenta de WorkConnect."
      footer={
        <Link to="/forgot-password" className="font-medium text-primary-glow hover:underline">
          Solicitar otro enlace
        </Link>
      }
    >
      {missingToken ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          El enlace no es válido. Solicita uno nuevo desde recuperar contraseña.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={Boolean(emailFromUrl)}
              className="border-border bg-surface/60"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="border-border bg-surface/60"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirmar contraseña</Label>
            <Input
              id="password_confirmation"
              type="password"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              className="border-border bg-surface/60"
            />
          </div>
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando…" : "Guardar contraseña"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
