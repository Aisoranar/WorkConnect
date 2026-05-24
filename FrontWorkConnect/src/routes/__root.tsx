import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import "../styles.css";
import { buildPageHead } from "@/lib/seo";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero opacity-40" />
      <div className="card-gradient relative w-full max-w-md rounded-2xl border border-border p-6 text-center shadow-elegant sm:p-10">
        <h1 className="font-display text-5xl font-bold text-gradient sm:text-7xl">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="btn-brand inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero opacity-40" />
      <div className="card-gradient relative w-full max-w-md rounded-2xl border border-border p-6 text-center shadow-elegant sm:p-10">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
          No se pudo cargar la <span className="text-gradient">página</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocurrió un error. Puedes reintentar o volver al inicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-brand inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface/40 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-surface"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

const baseHead = buildPageHead();

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: baseHead.meta,
    links: [
      ...baseHead.links,
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-palette="enterprise" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      {/* suppressHydrationWarning: extensiones (p. ej. data-gptw) modifican <body> antes de hidratar */}
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors theme="system" position="top-center" />
    </QueryClientProvider>
  );
}
