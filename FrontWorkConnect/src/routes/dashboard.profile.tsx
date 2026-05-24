import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Star, Github, Linkedin, Globe, Sparkles } from "lucide-react";
import { fetchStats, queryKeys } from "@/lib/api";
import { ApiState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/profile")({
  component: Profile,
});

const skills = ["React", "TypeScript", "Tailwind CSS", "Figma", "Node.js", "UI Design", "Motion", "Laravel"];

const portfolio = [
  { title: "Landing fintech Nimbus", tag: "Diseño UI", thumb: "portfolio-thumb" },
  { title: "Dashboard analytics Flux", tag: "Frontend", thumb: "portfolio-thumb-alt" },
  { title: "App de salud Pingu", tag: "Ilustración", thumb: "portfolio-thumb-warm" },
];

function Profile() {
  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: fetchStats,
  });

  return (
    <div className="space-y-6">
      <div className="card-hero p-5 sm:p-8">
        <div className="relative flex flex-col gap-5 pl-3 sm:gap-6 sm:pl-4 md:flex-row md:items-start">
          <div className="logo-mark mx-auto h-20 w-20 shrink-0 rounded-organic-md text-2xl font-bold sm:mx-0 sm:h-24 sm:w-24 sm:text-3xl">
            MA
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0 text-center sm:text-left">
                <h1 className="page-heading">
                  María <span className="text-gradient-trust">Álvarez</span>
                </h1>
                <p className="text-muted-foreground">Diseñadora UI · Frontend Developer</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start sm:gap-4">
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Lima, Perú</span>
                  {stats && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary-glow text-primary-glow" />
                      {stats.rating} · {stats.projectsDone} proyectos
                    </span>
                  )}
                </div>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">Editar perfil</Button>
            </div>
            <p className="mt-4 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground sm:text-left">
              Diseño interfaces minimalistas y desarrollo experiencias web modernas. Me especializo en SaaS y productos
              digitales con foco en conversión y micro-interacciones.
            </p>
            <div className="mt-5 flex justify-center gap-3 sm:justify-start">
              <a href="#" className="rounded-lg border border-border bg-surface/60 p-2 transition hover:border-primary/50">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="rounded-lg border border-border bg-surface/60 p-2 transition hover:border-primary/50">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="rounded-lg border border-border bg-surface/60 p-2 transition hover:border-primary/50">
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,320px)]">
        <div className="order-2 space-y-6 lg:order-1">
          <section className="card-paper p-6">
            <h2 className="font-display text-lg font-semibold">Portfolio</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.map((p) => (
                <div key={p.title} className="overflow-hidden rounded-xl border border-border">
                  <div className={p.thumb} />
                  <div className="p-3">
                    <div className="text-xs text-muted-foreground">{p.tag}</div>
                    <div className="mt-0.5 truncate text-sm font-medium">{p.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card-paper p-6">
            <h2 className="font-display text-lg font-semibold">Habilidades</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="rounded-lg border border-border bg-surface/60 px-3 py-1.5 text-sm">
                  {s}
                </span>
              ))}
            </div>
          </section>
        </div>

        <aside className="order-1 space-y-4 sm:space-y-6 lg:order-2">
          <div className="card-note p-5 sm:p-6">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs text-primary-glow">
              <Sparkles className="h-3 w-3" /> IA · Score perfil
            </div>
            <div className="font-display text-4xl font-bold text-gradient-trust sm:text-5xl">92</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu perfil está optimizado. Añade 2 proyectos más para llegar al 95+.
            </p>
            <Button size="sm" className="mt-4 w-full">Mejorar perfil</Button>
          </div>

          <div className="card-note p-5 sm:p-6">
            <h3 className="text-sm font-semibold">Verificaciones</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between"><span>Email</span><span className="text-success">✓ Verificado</span></li>
              <li className="flex justify-between"><span>Identidad</span><span className="text-success">✓ Verificado</span></li>
              <li className="flex justify-between"><span>Pago</span><span className="text-muted-foreground">Pendiente</span></li>
            </ul>
          </div>
        </aside>
      </div>
      </ApiState>
    </div>
  );
}
