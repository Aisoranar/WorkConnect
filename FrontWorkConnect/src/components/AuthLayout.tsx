import { LogoLink } from "@/components/Logo";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero opacity-50" />
      <header className="relative z-10 border-b border-border glass">
        <div className="container mx-auto flex h-14 items-center px-4 sm:h-16 sm:px-6">
          <LogoLink size="lg" />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-md">
          <div className="card-paper p-6 shadow-elegant sm:p-8">
            <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 border-t border-border pt-6 text-center text-sm">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
