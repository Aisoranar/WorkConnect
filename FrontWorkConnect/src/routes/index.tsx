import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Briefcase,
  Star,
  Building2,
  GraduationCap,
  Wand2,
  Handshake,
  Menu,
  CheckCircle2,
  TrendingUp,
  QrCode,
} from "lucide-react";
import { Logo, LogoLink } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { PlatformModules } from "@/components/PlatformModules";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import heroImg from "@/assets/heroImage.jpg";
import { handleLandingNavClick, scrollToSection } from "@/lib/smooth-scroll";

const navLinks = [
  { href: "#problem", label: "Problemática" },
  { href: "#how", label: "Cómo funciona" },
  { href: "#modulos", label: "Módulos" },
  { href: "#features", label: "Plataforma" },
] as const;

const heroStats = [
  { value: "IA", label: "Brief automático" },
  { value: "92%", label: "Match perfil" },
  { value: "QR", label: "Perfil verificable" },
] as const;

const stripStats = [
  { value: "↓70%", label: "Costo vs. agencia", icon: TrendingUp },
  { value: "2 sem", label: "Primer entregable", icon: Briefcase },
  { value: "100%", label: "Casos reales en CV", icon: GraduationCap },
  { value: "24/7", label: "Matching activo", icon: Sparkles },
] as const;

export const Route = createFileRoute("/")({
  component: Landing,
});

function LandingHeader({
  menuOpen,
  setMenuOpen,
}: {
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <LogoLink size="lg" className="shrink-0" />
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="landing-nav-link"
              onClick={(e) => handleLandingNavClick(e, href)}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="landing-nav-link hidden sm:inline">
            Entrar
          </Link>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/register">
              Empezar gratis
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
                <SheetTitle className="font-display text-left">
                  <Logo size="md" />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {navLinks.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-muted"
                    onClick={(e) =>
                      handleLandingNavClick(e, href, {
                        onBeforeScroll: () => setMenuOpen(false),
                        delayMs: 320,
                      })
                    }
                  >
                    {label}
                  </a>
                ))}
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-muted"
                >
                  Entrar
                </Link>
                <Button asChild className="mt-4 w-full">
                  <Link to="/register" onClick={() => setMenuOpen(false)}>
                    Crear cuenta gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.length > 1) {
      window.requestAnimationFrame(() => {
        scrollToSection(hash.slice(1));
      });
    }
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <LandingHeader menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* ── HERO ── */}
      <section className="landing-hero relative overflow-hidden">
        <img
          src={heroImg}
          alt=""
          aria-hidden
          className="landing-hero__image"
          fetchPriority="high"
        />
        <div className="container relative mx-auto px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
          <div className="flex justify-center lg:justify-end">
            <div className="landing-hero-glass w-full max-w-xl lg:max-w-lg">
              <div className="landing-eyebrow landing-hero-glass__eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                Puente empresa ↔ talento joven
              </div>
              <h1 className="mt-4 text-balance font-display text-3xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:mt-5 sm:text-4xl lg:text-5xl">
                De &quot;necesito una web&quot; a{" "}
                <span className="text-gradient">proyecto publicado con IA</span>
              </h1>
              <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Las PYMEs describen su necesidad en lenguaje cotidiano. La IA la convierte en
                requerimiento técnico. Los jóvenes postulan, entregan y construyen{" "}
                <strong className="font-semibold text-foreground">portafolio real + perfil QR</strong>.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild size="lg" className="h-12 w-full px-6 text-base sm:w-auto">
                  <Link to="/register">
                    Soy talento joven
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="landing-hero-glass__btn-secondary h-12 w-full px-6 text-base shadow-soft sm:w-auto"
                >
                  <Link to="/register">Publicar como empresa</Link>
                </Button>
              </div>
              <div className="landing-hero-glass__stats mt-6 flex flex-wrap gap-6 border-t pt-5">
                {heroStats.map(({ value, label }) => (
                  <div key={label}>
                    <div className="font-display text-xl font-bold text-primary">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="landing-stat-strip" aria-label="Métricas clave">
        <div className="container mx-auto grid grid-cols-2 px-4 sm:px-6 md:grid-cols-4">
          {stripStats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="landing-stat-item">
              <Icon className="mx-auto mb-2 h-5 w-5 text-primary" aria-hidden />
              <div className="font-display text-2xl font-bold sm:text-3xl">{value}</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section id="problem" className="landing-section scroll-mt-18 container mx-auto px-4 py-16 sm:scroll-mt-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-section-label">El problema</p>
          <h2 className="section-heading mt-3">Dos mundos que no se entienden</h2>
          <p className="mt-4 text-muted-foreground">
            No es otro marketplace genérico: conectamos la necesidad real del empresario con la
            energía del talento que empieza.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <article className="landing-path-card">
            <div className="landing-feature-icon mb-5">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-bold">Talento joven</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tiene skills, le falta el caso real que abra la primera entrevista.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Proyectos reales para CV y portafolio",
                "Presupuestos accesibles = más oportunidades",
                "Reputación verificada con cada entrega",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </article>
          <article className="landing-path-card">
            <div className="landing-feature-icon mb-5">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-bold">PYME / empresa</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Sabe su negocio, no sabe pedir un proyecto digital ni pagar una agencia.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Describe en tus palabras — la IA estructura",
                "Web, catálogo o herramienta sin consultoría previa",
                "Micro-presupuesto, entrega concreta",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* ── HOW ── */}
      <section id="how" className="landing-section landing-band-dark scroll-mt-18 border-y border-border sm:scroll-mt-20">
        <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="landing-section-label">Proceso</p>
            <h2 className="section-heading mt-3 text-balance">
              Cuatro pasos. Cero fricción.
            </h2>
            <p className="mt-4 text-muted-foreground">
              De la idea en lenguaje cotidiano al proyecto listo para postular.
            </p>
          </div>
          <ol className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Building2,
                title: "Describe tu necesidad",
                desc: "Presupuesto y contexto en lenguaje normal.",
              },
              {
                icon: Wand2,
                title: "IA estructura",
                desc: "Alcance, skills y entregables claros.",
              },
              {
                icon: Briefcase,
                title: "Talento postula",
                desc: "Match por habilidades + propuesta con IA.",
              },
              {
                icon: Handshake,
                title: "Entrega y reputación",
                desc: "Producto para la empresa, caso para el CV.",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <li key={title} className="landing-step">
                <div className="landing-step__num mb-3">{i + 1}</div>
                <div className="mb-1 flex items-center gap-2 font-semibold text-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  {title}
                </div>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <PlatformModules />

      {/* ── FEATURES ── */}
      <section id="features" className="landing-section scroll-mt-18 bg-muted/40 py-16 sm:scroll-mt-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="landing-section-label">Plataforma</p>
            <h2 className="section-heading mt-3">Herramientas que venden el pitch</h2>
            <p className="mt-4 text-muted-foreground">
              Cada función resuelve un punto del flujo empresa → IA → talento → entrega.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Wand2,
                title: "Brief con IA",
                desc: "Convierte solicitudes vagas en proyectos publicables sin consultoría previa.",
                tag: "Core MVP",
              },
              {
                icon: Sparkles,
                title: "Matching inteligente",
                desc: "Compatibilidad por skills para que el talento invierta tiempo donde puede ganar.",
                tag: "IA",
              },
              {
                icon: QrCode,
                title: "Perfil + QR",
                desc: "Reputación verificada visible en ferias, entrevistas y próximas postulaciones.",
                tag: "Trust",
              },
            ].map(({ icon: Icon, title, desc, tag }) => (
              <article key={title} className="card-paper flex flex-col p-6 sm:p-8">
                <div className="mb-4 flex items-center justify-between">
                  <div className="landing-feature-icon">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="chip chip-primary">{tag}</span>
                </div>
                <h3 className="font-display text-lg font-bold">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="container mx-auto px-4 py-16 sm:px-6 sm:py-20">
        <div className="landing-testimonial mx-auto max-w-3xl p-8 sm:p-10">
          <span className="landing-testimonial__quote" aria-hidden>
            &ldquo;
          </span>
          <div className="relative flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" />
            ))}
          </div>
          <blockquote className="relative mt-6 text-center font-display text-xl font-medium leading-snug sm:text-2xl">
            Publicamos lo que necesitábamos sin saber de tecnología. En dos semanas teníamos la web
            y un estudiante con un caso real en su portafolio.
          </blockquote>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <div className="logo-mark h-11 w-11 rounded-full text-sm font-bold">PS</div>
            <div className="text-center sm:text-left">
              <p className="font-semibold">Panadería El Sol</p>
              <p className="text-sm text-muted-foreground">Cliente demo · WorkConnect seed</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DUAL CTA ── */}
      <section className="container mx-auto px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-heading">¿Por dónde entras tú?</h2>
          <p className="mt-3 text-muted-foreground">
            Elige tu camino. Registro gratis en menos de un minuto.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          <article className="landing-path-card flex flex-col">
            <div className="landing-feature-icon mb-4">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-bold">Soy talento joven</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">
              Explora micro-proyectos, postula con IA y construye tu portafolio con casos reales.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/register">
                Crear perfil de talento
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </article>
          <article className="landing-path-card flex flex-col">
            <div className="landing-feature-icon mb-4">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-bold">Tengo una empresa</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">
              Publica tu necesidad, deja que la IA arme el requerimiento y recibe postulaciones.
            </p>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link to="/register">
                Publicar mi primer proyecto
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </article>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="container mx-auto px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="landing-cta-final relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/80">
              Empieza hoy
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
              El primer proyecto no debería costar una agencia
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/85">
              Únete a WorkConnect y convierte necesidades locales en experiencia profesional real.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-12 w-full min-w-[200px] bg-white text-primary hover:bg-white/90 sm:w-auto"
              >
                <Link to="/register">
                  Crear cuenta gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 w-full min-w-[200px] border-white/40 bg-transparent text-white hover:bg-white/10 sm:w-auto"
              >
                <Link to="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <Logo size="md" />
            <p className="text-xs text-muted-foreground">© 2026 · Todos los derechos reservados</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="landing-nav-link"
                onClick={(e) => handleLandingNavClick(e, href)}
              >
                {label}
              </a>
            ))}
            <Link to="/login" className="landing-nav-link">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
