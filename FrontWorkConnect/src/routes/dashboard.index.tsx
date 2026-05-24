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
  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs,
    queryFn: () => fetchJobs({ sort: "match" }),
  });
  const statsQuery = useQuery({ queryKey: queryKeys.stats, queryFn: fetchStats });

  const isLoading = jobsQuery.isLoading || statsQuery.isLoading;
  const isError = jobsQuery.isError || statsQuery.isError;
  const error = jobsQuery.error ?? statsQuery.error;

  const refetch = () => {
    void jobsQuery.refetch();
    void statsQuery.refetch();
  };

  const jobs = jobsQuery.data?.data ?? [];
  const stats = statsQuery.data;
  const topMatches = [...jobs].sort((a, b) => b.match - a.match).slice(0, 3);
  const user = getStoredUser();
  const role = user?.role ?? "freelancer";
  const firstName = user?.name?.split(" ")[0] ?? "talento";

  const isClient = role === "client" || role === "admin";

  return (
    <div className="space-y-6 sm:space-y-8">
          <div className="card-hero p-5 sm:p-8 md:p-10">
            <div className="relative pl-3 sm:pl-4">
              <div className="tag-line mb-3 max-w-full sm:mb-4">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-pretty">{isClient ? "Publica con IA · Recibe postulaciones" : "Micro-proyectos con matching IA"}</span>
              </div>
              <h1 className="page-heading">
                Hola, <span className="text-gradient">{firstName}</span> 👋
              </h1>
              <p className="mt-1 text-muted-foreground">
                {isClient
                  ? "Describe tu necesidad en tus palabras; nosotros la convertimos en requerimiento para jóvenes talento."
                  : "Explora proyectos reales de empresas locales, postula y suma experiencia a tu portafolio."}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-3">
                <Button asChild className="w-full sm:w-auto">
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
                {isClient && (
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link to="/dashboard/my-projects">
                      <Briefcase className="mr-1 h-4 w-4" />
                      Mis proyectos
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {stats && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {[
                { label: "Rating", value: stats.rating.toFixed(1), icon: Star, hint: "+0.2 este mes" },
                { label: "Proyectos", value: stats.projectsDone, icon: Briefcase, hint: "+4 nuevos" },
                { label: "Ganancias", value: stats.earnings, icon: Wallet, hint: "+18% vs mes pasado" },
                { label: "Respuesta", value: `${stats.responseRate}%`, icon: TrendingUp, hint: "Top 10%" },
              ].map(({ label, value, icon: Icon, hint }) => (
                <div key={label} className="card-stat p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
                    <Icon className="h-4 w-4 text-primary-glow" />
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold sm:mt-3 sm:text-3xl">{value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold sm:text-xl">Mejores matches por IA</h2>
                  <p className="text-sm text-muted-foreground">Proyectos seleccionados para tu perfil hoy.</p>
                </div>
                <Link to="/dashboard/explore" className="link-enterprise shrink-0 text-sm text-primary-glow hover:underline">
                  Ver todos
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {topMatches.map((job) => (
                  <article key={job.id} className="card-list group flex flex-col p-4 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="rounded-full bg-surface px-2.5 py-1 text-xs text-muted-foreground">{job.category}</span>
                      <div className="flex items-center gap-1 rounded-full bg-trust/15 px-2.5 py-1 text-xs font-semibold text-trust-glow">
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
                    <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
                      <span className="font-display font-semibold">{job.budget}</span>
                      <Button size="sm" className="w-full sm:w-auto">Postular</Button>
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
