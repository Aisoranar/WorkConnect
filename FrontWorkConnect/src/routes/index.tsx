import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Briefcase, Zap, Shield, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-network.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">WorkConnect</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition hover:text-foreground">Plataforma</a>
            <a href="#how" className="text-sm text-muted-foreground transition hover:text-foreground">Cómo funciona</a>
            <a href="#metrics" className="text-sm text-muted-foreground transition hover:text-foreground">Comunidad</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm text-muted-foreground transition hover:text-foreground sm:inline">
              Entrar
            </Link>
            <Button asChild size="sm" className="bg-gradient-primary shadow-glow">
              <Link to="/register">
                Empezar
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)",
          }}
        />
        <div className="container relative mx-auto px-6 py-24 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary-glow" />
              <span>Matching potenciado por IA · Beta abierta</span>
            </div>
            <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Convierte tu talento en <span className="text-gradient">ingresos reales</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
              Infraestructura digital para el empleo juvenil. Conectamos freelancers con proyectos según habilidades, reputación y compatibilidad real.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-primary shadow-glow">
                <Link to="/register">
                  Encontrar trabajo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border bg-surface/40 backdrop-blur">
                <Link to="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-20 max-w-4xl animate-float">
            <div className="card-gradient relative overflow-hidden rounded-3xl border border-border p-8 shadow-elegant">
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  { label: "Compatibilidad IA", value: "96%", icon: Sparkles },
                  { label: "Proyectos abiertos", value: "1,247", icon: Briefcase },
                  { label: "Tiempo de match", value: "< 2 min", icon: Zap },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-border bg-surface/60 p-5">
                    <Icon className="mb-3 h-5 w-5 text-primary-glow" />
                    <div className="font-display text-3xl font-bold">{value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Diseñado para quienes empiezan</h2>
          <p className="mt-4 text-muted-foreground">
            Tres pilares que diferencian a WorkConnect del resto del mercado freelance.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            { icon: Sparkles, title: "Matching por IA", desc: "Analizamos skills, experiencia y estilo para sugerirte solo los proyectos donde realmente puedes ganar." },
            { icon: Shield, title: "Reputación verificada", desc: "Cada entrega construye tu score. Las marcas ven evidencia real, no promesas vacías." },
            { icon: TrendingUp, title: "Crecimiento medible", desc: "Dashboard con métricas claras: ganancias, tasa de respuesta y proyección de tu carrera." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-gradient group relative overflow-hidden rounded-2xl border border-border p-8 shadow-card transition hover:border-primary/50">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <Icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="container mx-auto px-6 py-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <div className="mb-3 text-sm font-medium uppercase tracking-wider text-primary-glow">Flujo</div>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">De cero a primer cliente en <span className="text-gradient">una semana</span></h2>
            <p className="mt-4 text-muted-foreground">
              Sin formularios eternos ni curaduría manual. Crea tu perfil, deja que la IA te recomiende y postúlate con un clic.
            </p>
          </div>
          <ol className="space-y-4">
            {[
              "Construye tu perfil con habilidades reales.",
              "La IA analiza tu fit con proyectos abiertos.",
              "Postúlate con propuesta personalizada.",
              "Entrega, cobra y suma reputación.",
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-4 rounded-xl border border-border bg-surface/40 p-4 backdrop-blur">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-sm font-bold">
                  {i + 1}
                </div>
                <span className="pt-1 text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="metrics" className="container mx-auto px-6 py-24">
        <div className="card-gradient rounded-3xl border border-border p-12 shadow-elegant">
          <div className="grid gap-8 text-center md:grid-cols-4">
            {[
              { value: "+500", label: "Talentos registrados" },
              { value: "+120", label: "Proyectos completados" },
              { value: "95%", label: "Satisfacción cliente" },
              { value: "$8.4k", label: "Ganancia promedio" },
            ].map((m) => (
              <div key={m.label}>
                <div className="font-display text-5xl font-bold text-gradient">{m.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-surface/40 p-10 text-center backdrop-blur">
          <div className="mb-4 flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary-glow text-primary-glow" />
            ))}
          </div>
          <p className="font-display text-2xl leading-snug">
            "En tres semanas conseguí más clientes que en todo un año buscando en redes sociales. El matching es brutalmente preciso."
          </p>
          <div className="mt-6 text-sm text-muted-foreground">
            Lucía M. · Diseñadora UI · Lima
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-32">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-primary p-16 text-center shadow-elegant">
          <div className="absolute inset-0 bg-gradient-hero opacity-60" />
          <div className="relative">
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">¿Listo para tu siguiente proyecto?</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
              Crea tu perfil gratis y deja que la IA haga el trabajo pesado por ti.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8 shadow-glow">
              <Link to="/register">
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-primary">
              <Zap className="h-3 w-3 text-primary-foreground" />
            </div>
            <span>© 2026 WorkConnect</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="transition hover:text-foreground">Privacidad</a>
            <a href="#" className="transition hover:text-foreground">Términos</a>
            <a href="#" className="transition hover:text-foreground">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
