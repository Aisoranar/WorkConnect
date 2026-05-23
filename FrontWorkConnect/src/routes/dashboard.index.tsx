import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Star, Briefcase, Wallet, Sparkles, ArrowUpRight, PlusCircle } from "lucide-react";
import { fetchJobs, fetchStats, queryKeys } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { ApiState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const jobsQuery = useQuery({ queryKey: queryKeys.jobs, queryFn: fetchJobs });
  const statsQuery = useQuery({ queryKey: queryKeys.stats, queryFn: fetchStats });

  const isLoading = jobsQuery.isLoading || statsQuery.isLoading;
  const isError = jobsQuery.isError || statsQuery.isError;
  const error = jobsQuery.error ?? statsQuery.error;

  const refetch = () => {
    void jobsQuery.refetch();
    void statsQuery.refetch();
  };

  const jobs = jobsQuery.data ?? [];
  const stats = statsQuery.data;
  const topMatches = [...jobs].sort((a, b) => b.match - a.match).slice(0, 3);
  const user = getStoredUser();
  const role = user?.role ?? "freelancer";
  const firstName = user?.name?.split(" ")[0] ?? "talento";

  const isClient = role === "client" || role === "admin";

  return (
    <div className="space-y-8">
      <div className="card-gradient relative overflow-hidden rounded-2xl border border-border p-8 shadow-card">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs text-primary-glow">
            <Sparkles className="h-3 w-3" />
            <span>{isClient ? "Publica con IA · Recibe postulaciones" : "Micro-proyectos con matching IA"}</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Hola, {firstName} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isClient
              ? "Describe tu necesidad en tus palabras; nosotros la convertimos en requerimiento para jóvenes talento."
              : "Explora proyectos reales de empresas locales, postula y suma experiencia a tu portafolio."}
          </p>
          <Button asChild className="mt-5 bg-gradient-primary shadow-glow">
            <Link to={isClient ? "/dashboard/publish" : "/dashboard/explore"}>
              {isClient ? (
                <>
                  Publicar proyecto
                  <PlusCircle className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  Ver proyectos
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Link>
          </Button>
        </div>
      </div>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {stats && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { label: "Rating", value: stats.rating.toFixed(1), icon: Star, hint: "+0.2 este mes" },
                { label: "Proyectos", value: stats.projectsDone, icon: Briefcase, hint: "+4 nuevos" },
                { label: "Ganancias", value: stats.earnings, icon: Wallet, hint: "+18% vs mes pasado" },
                { label: "Respuesta", value: `${stats.responseRate}%`, icon: TrendingUp, hint: "Top 10%" },
              ].map(({ label, value, icon: Icon, hint }) => (
                <div key={label} className="card-gradient rounded-2xl border border-border p-5 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
                    <Icon className="h-4 w-4 text-primary-glow" />
                  </div>
                  <div className="mt-3 font-display text-3xl font-bold">{value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold">Mejores matches por IA</h2>
                  <p className="text-sm text-muted-foreground">Proyectos seleccionados para tu perfil hoy.</p>
                </div>
                <Link to="/dashboard/explore" className="text-sm text-primary-glow hover:underline">
                  Ver todos
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {topMatches.map((job) => (
                  <article key={job.id} className="card-gradient group flex flex-col rounded-2xl border border-border p-6 shadow-card transition hover:border-primary/50">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="rounded-full bg-surface px-2.5 py-1 text-xs text-muted-foreground">{job.category}</span>
                      <div className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary-glow">
                        <Sparkles className="h-3 w-3" />
                        {job.match}%
                      </div>
                    </div>
                    <h3 className="font-display text-lg font-semibold leading-snug">{job.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {job.skills.slice(0, 3).map((s) => (
                        <span key={s} className="rounded-md border border-border bg-surface/60 px-2 py-0.5 text-xs">{s}</span>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-5">
                      <span className="font-display font-semibold">{job.budget}</span>
                      <Button size="sm" variant="secondary">Postular</Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </>
        )}
      </ApiState>
    </div>
  );
}
