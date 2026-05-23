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
  { title: "Landing fintech Nimbus", tag: "Diseño UI", color: "from-indigo-500/40 to-purple-500/40" },
  { title: "Dashboard analytics Flux", tag: "Frontend", color: "from-blue-500/40 to-cyan-500/40" },
  { title: "App de salud Pingu", tag: "Ilustración", color: "from-pink-500/40 to-violet-500/40" },
];

function Profile() {
  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: fetchStats,
  });

  return (
    <div className="space-y-6">
      <div className="card-gradient relative overflow-hidden rounded-2xl border border-border p-8 shadow-card">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-3xl font-bold shadow-glow">
            MA
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">María Álvarez</h1>
                <p className="text-muted-foreground">Diseñadora UI · Frontend Developer</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Lima, Perú</span>
                  {stats && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary-glow text-primary-glow" />
                      {stats.rating} · {stats.projectsDone} proyectos
                    </span>
                  )}
                </div>
              </div>
              <Button variant="outline">Editar perfil</Button>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Diseño interfaces minimalistas y desarrollo experiencias web modernas. Me especializo en SaaS y productos
              digitales con foco en conversión y micro-interacciones.
            </p>
            <div className="mt-5 flex gap-3">
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
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card-gradient rounded-2xl border border-border p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold">Portfolio</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {portfolio.map((p) => (
                <div key={p.title} className="overflow-hidden rounded-xl border border-border">
                  <div className={`aspect-video bg-gradient-to-br ${p.color}`} />
                  <div className="p-3">
                    <div className="text-xs text-muted-foreground">{p.tag}</div>
                    <div className="mt-0.5 truncate text-sm font-medium">{p.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card-gradient rounded-2xl border border-border p-6 shadow-card">
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

        <aside className="space-y-6">
          <div className="card-gradient rounded-2xl border border-border p-6 shadow-card">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs text-primary-glow">
              <Sparkles className="h-3 w-3" /> IA · Score perfil
            </div>
            <div className="font-display text-5xl font-bold text-gradient">92</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu perfil está optimizado. Añade 2 proyectos más para llegar al 95+.
            </p>
            <Button size="sm" className="mt-4 w-full bg-gradient-primary">Mejorar perfil</Button>
          </div>

          <div className="card-gradient rounded-2xl border border-border p-6 shadow-card">
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
