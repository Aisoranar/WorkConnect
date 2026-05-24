import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Briefcase,
  Zap,
  Shield,
  Star,
  Building2,
  GraduationCap,
  Wand2,
  Handshake,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformModules } from "@/components/PlatformModules";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import heroImg from "@/assets/hero-network.jpg";

const navLinks = [
  { href: "#problem", label: "Problemática" },
  { href: "#how", label: "Cómo funciona" },
  { href: "#modulos", label: "Módulos" },
  { href: "#features", label: "Plataforma" },
] as const;

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-50 glass">
        <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <div className="logo-mark h-8 w-8 shrink-0 sm:h-9 sm:w-9">
              <Zap className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
            </div>
            <span className="truncate font-display text-base font-bold tracking-tight sm:text-lg">WorkConnect</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map(({ href, label }) => (
              <a key={href} href={href} className="text-sm text-muted-foreground transition hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="hidden text-sm text-muted-foreground transition hover:text-foreground sm:inline">
              Entrar
            </Link>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/register">
                Empezar
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Abrir menú">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw-2rem,20rem)] border-border">
                <SheetHeader>
                  <SheetTitle className="font-display text-left">WorkConnect</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1">
                  {navLinks.map(({ href, label }) => (
                    <a
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-surface"
                    >
                      {label}
                    </a>
                  ))}
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-surface"
                  >
                    Entrar
                  </Link>
                  <Button asChild className="mt-4 w-full">
                    <Link to="/register" onClick={() => setMenuOpen(false)}>
                      Crear cuenta
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-hero">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)",
          }}
        />
        <div className="container relative mx-auto px-4 py-16 sm:px-6 sm:py-24 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 tag-line max-w-full text-left sm:text-center">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="text-pretty">IA que traduce necesidades de empresa → proyectos para jóvenes talento</span>
            </div>
            <h1 className="text-balance text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl lg:text-7xl">
              Transformamos pequeños proyectos en{" "}
              <span className="text-gradient">experiencia profesional real.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:mt-6 sm:text-lg">
              Las PYMEs describen su problema y presupuesto; la IA lo convierte en un requerimiento técnico claro.
              Los jóvenes postulan, entregan y construyen portafolio, reputación y un perfil con QR — no solo
              ejercicios de curso.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/register">
                  Soy talento joven
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full border-border bg-surface/40 backdrop-blur sm:w-auto">
                <Link to="/register">Tengo una empresa</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="container mx-auto px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-heading">Dos problemas, una plataforma</h2>
          <p className="mt-4 text-muted-foreground">
            No es solo freelance: es un puente entre el conocimiento del empresario y la energía del talento
            que empieza.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:mt-16 sm:gap-6 md:grid-cols-2">
          <div className="card-paper p-6 sm:p-8">
            <div className="logo-mark mb-5 inline-flex h-12 w-12">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Joven sin experiencia</h3>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li>· Necesita proyectos reales para su CV y entrevistas.</li>
              <li>· A menudo no conoce los problemas concretos de las PYMEs locales.</li>
              <li>· Puede aceptar presupuestos modestos a cambio de reputación y casos.</li>
            </ul>
          </div>
          <div className="card-paper p-6 sm:p-8">
            <div className="logo-mark mb-5 inline-flex h-12 w-12">
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
        <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-medium uppercase tracking-wider text-primary-glow">Flujo</div>
            <h2 className="section-heading text-balance">
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
                <div className="logo-mark h-8 w-8 shrink-0 text-sm font-bold">
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

      <PlatformModules />

      <section id="features" className="container mx-auto px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-heading">Herramientas del MVP</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:mt-16 sm:gap-6 md:grid-cols-3">
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
              className="card-paper group relative overflow-hidden p-6 transition hover:shadow-lift sm:p-8"
            >
              <div className="logo-mark mb-5 inline-flex h-12 w-12">
                <Icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 sm:px-6 sm:py-24">
        <div className="card-paper rounded-organic-xl p-6 shadow-elegant sm:p-10 md:p-12">
          <div className="grid gap-6 text-center sm:gap-8 md:grid-cols-3">
            {[
              { value: "↓ costo", label: "Para la empresa vs. agencia tradicional" },
              { value: "↑ casos", label: "Para el joven en semanas, no años" },
              { value: "IA + humano", label: "Estructura el proyecto; la entrega es talento real" },
            ].map((m) => (
              <div key={m.label}>
                <div className="font-display text-3xl font-bold text-gradient sm:text-4xl">{m.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-3xl rounded-organic-xl card-note p-6 text-center sm:p-10">
          <div className="mb-4 flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary-glow text-primary-glow" />
            ))}
          </div>
          <p className="font-display text-lg leading-snug sm:text-2xl">
            &quot;Publicamos lo que necesitábamos sin saber de tecnología. En dos semanas teníamos la web y un
            estudiante con un caso real en su portafolio.&quot;
          </p>
          <div className="mt-6 text-sm text-muted-foreground">Cliente demo · WorkConnect seed</div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20 sm:px-6 sm:pb-32">
        <div className="relative overflow-hidden rounded-organic-xl border border-border bg-primary p-8 text-center shadow-elegant sm:p-12 md:p-16">
          <div className="absolute inset-0 bg-gradient-hero opacity-60" />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              ¿Empresa o talento joven?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
              Regístrate como cliente para publicar con IA, o como freelancer para explorar micro-proyectos.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:justify-center">
              <Button asChild size="lg" variant="secondary" className="w-full shadow-soft sm:w-auto">
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
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="logo-mark h-6 w-6">
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
