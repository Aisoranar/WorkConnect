import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LogoLink } from "@/components/Logo";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  badge?: string;
};

export function AuthLayout({ title, subtitle, children, footer, badge }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero opacity-50" />
      <div
        className="pointer-events-none absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-1/4 h-64 w-64 rounded-full bg-primary-glow/10 blur-3xl"
        aria-hidden
      />

      <header className="relative z-10 border-b border-border glass">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">
          <LogoLink size="lg" />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver al inicio</span>
            <span className="sm:hidden">Inicio</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-md">
          <div className="card-paper border-border/80 p-6 shadow-elegant sm:p-8">
            {badge && (
              <p className="mb-3 inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-primary-glow">
                {badge}
              </p>
            )}
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[1.65rem]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && (
              <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            )}
          </div>
          <p className="mt-6 text-center text-[11px] text-muted-foreground/80">
            Conexión cifrada · Tus datos están protegidos según nuestra política de privacidad.
          </p>
        </div>
      </main>
    </div>
  );
}

/** Campo de formulario auth con icono opcional */
export function AuthField({
  id,
  label,
  labelExtra,
  icon: Icon,
  className,
  children,
}: {
  id: string;
  label: string;
  labelExtra?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium leading-none text-foreground">
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        )}
        {children}
      </div>
    </div>
  );
}
