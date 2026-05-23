import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  Briefcase,
  Zap,
  Shield,
  TrendingUp,
  Star,
  Building2,
  GraduationCap,
  Wand2,
  Handshake,
} from "lucide-react";
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
            <a href="#problem" className="text-sm text-muted-foreground transition hover:text-foreground">
              Problemática
            </a>
            <a href="#how" className="text-sm text-muted-foreground transition hover:text-foreground">
              Cómo funciona
            </a>
            <a href="#features" className="text-sm text-muted-foreground transition hover:text-foreground">
              Plataforma
            </a>
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
              <span>IA que traduce necesidades de empresa → proyectos para jóvenes talento</span>
            </div>
            <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Experiencia real para jóvenes.{" "}
              <span className="text-gradient">Soluciones reales para empresas.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
              Las PYMEs no tienen presupuesto para un equipo completo ni saben redactar un brief técnico.
              Los jóvenes no tienen portafolio. WorkConnect los conecta con micro-proyectos acotados y
              matching inteligente.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-primary shadow-glow">
                <Link to="/register">
                  Soy talento joven
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border bg-surface/40 backdrop-blur">
                <Link to="/register">Tengo una empresa</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Dos problemas, una plataforma</h2>
          <p className="mt-4 text-muted-foreground">
            No es solo freelance: es un puente entre el conocimiento del empresario y la energía del talento
            que empieza.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="card-gradient rounded-2xl border border-border p-8 shadow-card">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Joven sin experiencia</h3>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li>· Necesita proyectos reales para su CV y entrevistas.</li>
              <li>· A menudo no conoce los problemas concretos de las PYMEs locales.</li>
              <li>· Puede aceptar presupuestos modestos a cambio de reputación y casos.</li>
            </ul>
          </div>
          <div className="card-gradient rounded-2xl border border-border p-8 shadow-card">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Empresa con poco presupuesto</h3>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li>· Resuelve problemas de su rubro pero no sabe plantear un proyecto digital.</li>
              <li>· Necesita web, catálogo o herramientas simples sin pagar una agencia.</li>
              <li>· Publica su necesidad; la IA la convierte en requerimiento claro.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-border bg-surface/20">
        <div className="container mx-auto px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-medium uppercase tracking-wider text-primary-glow">Flujo</div>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              De &quot;vendo papa y quiero una web&quot; a proyecto listo
            </h2>
          </div>
          <ol className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            {[
              {
                icon: Building2,
                title: "La empresa describe su necesidad",
                desc: "En lenguaje cotidiano y con el presupuesto que sí tiene.",
              },
              {
                icon: Wand2,
                title: "La IA estructura el requerimiento",
                desc: "Título, alcance, entregables y habilidades que un joven puede ejecutar.",
              },
              {
                icon: Briefcase,
                title: "El joven elige y postula",
                desc: "Ve compatibilidad, mejora su propuesta con IA y gana el proyecto.",
              },
              {
                icon: Handshake,
                title: "Entrega, reputación, siguiente paso",
                desc: "La empresa obtiene su producto; el joven suma casos para el mercado laboral.",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <li
                key={title}
                className="flex items-start gap-4 rounded-xl border border-border bg-surface/40 p-5 backdrop-blur"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2 font-medium">
                    <Icon className="h-4 w-4 text-primary-glow" />
                    {title}
                  </div>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Herramientas del MVP</h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Wand2,
              title: "Brief con IA",
              desc: "Convierte solicitudes vagas en proyectos publicables sin consultoría previa.",
            },
            {
              icon: Sparkles,
              title: "Matching por habilidades",
              desc: "Sugerencias de fit para que el joven invierta tiempo donde puede ganar.",
            },
            {
              icon: Shield,
              title: "Reputación verificada",
              desc: "Cada entrega suma score visible para la siguiente empresa o empleador.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="card-gradient group relative overflow-hidden rounded-2xl border border-border p-8 shadow-card transition hover:border-primary/50"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <Icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6 py-24">
        <div className="card-gradient rounded-3xl border border-border p-12 shadow-elegant">
          <div className="grid gap-8 text-center md:grid-cols-3">
            {[
              { value: "↓ costo", label: "Para la empresa vs. agencia tradicional" },
              { value: "↑ casos", label: "Para el joven en semanas, no años" },
              { value: "IA + humano", label: "Estructura el proyecto; la entrega es talento real" },
            ].map((m) => (
              <div key={m.label}>
                <div className="font-display text-4xl font-bold text-gradient">{m.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-surface/40 p-10 text-center backdrop-blur">
          <div className="mb-4 flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary-glow text-primary-glow" />
            ))}
          </div>
          <p className="font-display text-2xl leading-snug">
            &quot;Publicamos lo que necesitábamos sin saber de tecnología. En dos semanas teníamos la web y un
            estudiante con un caso real en su portafolio.&quot;
          </p>
          <div className="mt-6 text-sm text-muted-foreground">Cliente demo · WorkConnect seed</div>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-32">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-primary p-16 text-center shadow-elegant">
          <div className="absolute inset-0 bg-gradient-hero opacity-60" />
          <div className="relative">
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              ¿Empresa o talento joven?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
              Regístrate como cliente para publicar con IA, o como freelancer para explorar micro-proyectos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="shadow-glow">
                <Link to="/register">
                  Crear cuenta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
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
            <a href="#problem" className="transition hover:text-foreground">
              Problemática
            </a>
            <Link to="/login" className="transition hover:text-foreground">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
