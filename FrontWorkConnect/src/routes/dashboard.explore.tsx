import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  MapPin,
  Clock,
  Users,
  Search,
  CheckCircle2,
  Briefcase,
  Star,
} from "lucide-react";
import { fetchFreelancers, fetchJobs, queryKeys, type ExploreJobsFilters } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { ApiState } from "@/components/ApiState";
import { ApplyJobSheet } from "@/components/ApplyJobSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Job } from "@/lib/types";

export const Route = createFileRoute("/dashboard/explore")({
  component: Explore,
});

function Explore() {
  const role = getStoredUser()?.role ?? "freelancer";
  const isClient = role === "client" || role === "admin";

  if (isClient) {
    return <ExploreTalent />;
  }

  return <ExploreProjects />;
}

function ExploreProjects() {
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<ExploreJobsFilters["sort"]>("match");
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  const filters: ExploreJobsFilters = useMemo(
    () => ({ category, q: debouncedSearch, sort }),
    [category, debouncedSearch, sort],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...queryKeys.jobs, filters] as const,
    queryFn: () => fetchJobs(filters),
  });

  const jobs = data?.data ?? [];
  const categories = useMemo(() => {
    const fromApi = data?.meta?.categories ?? [];
    return ["Todos", ...fromApi.filter((c) => c && c !== "Todos")];
  }, [data?.meta?.categories]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDebouncedSearch(search);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">
          Explorar <span className="text-gradient">proyectos</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Micro-proyectos reales de empresas y PYMEs. Ordenados por compatibilidad con tu perfil.
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, empresa o descripción…"
            className="border-border bg-surface/60 pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="outline" className="flex-1 sm:flex-none">
            Buscar
          </Button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ExploreJobsFilters["sort"])}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm sm:flex-none"
          >
          <option value="match">Mayor compatibilidad</option>
          <option value="recent">Más recientes</option>
          <option value="budget">Mayor presupuesto</option>
        </select>
        </div>
      </form>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        <div className="scroll-chips">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`choice-chip shrink-0 rounded-full border px-4 py-1.5 text-sm ${
                category === c
                  ? "choice-chip--active border-primary bg-primary text-primary-foreground shadow-soft"
                  : "border-border bg-surface/40 text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {data?.meta && (
          <p className="text-sm text-muted-foreground">
            {data.meta.total} proyecto{data.meta.total === 1 ? "" : "s"} disponibles
          </p>
        )}

        {jobs.length === 0 ? (
          <div className="card-inset p-12 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              No hay proyectos con esos filtros. Prueba otra categoría o vuelve más tarde.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 dashboard-stagger">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onApply={() => setApplyJob(job)} />
            ))}
          </div>
        )}
      </ApiState>

      <ApplyJobSheet
        job={applyJob}
        open={Boolean(applyJob)}
        onOpenChange={(open) => !open && setApplyJob(null)}
      />
    </div>
  );
}

function JobCard({ job, onApply }: { job: Job; onApply: () => void }) {
  const applied = job.alreadyApplied;
  const status = job.applicationStatus;

  return (
    <article className="card-list group flex flex-col p-4 sm:p-6 transition-enterprise">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{job.company}</span>
            {job.isNew && <span className="chip chip-trust">Nuevo</span>}
            {job.match >= 85 && (
              <span className="chip chip-primary">Alta compatibilidad</span>
            )}
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug">{job.title}</h3>
          <span className="mt-1 inline-block text-xs text-muted-foreground">{job.category}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-trust/15 px-3 py-1.5 text-sm font-semibold text-trust-glow">
          <Sparkles className="h-3.5 w-3.5" />
          {job.match}%
        </div>
      </div>

      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{job.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {job.skills.slice(0, 6).map((s) => (
          <span key={s} className="rounded-md border border-border bg-surface/60 px-2 py-0.5 text-xs">
            {s}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {job.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {job.postedAgo}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {job.applicants} postulante{job.applicants === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-display text-lg font-bold sm:text-xl">{job.budget}</div>
          <div className="text-xs text-muted-foreground">{job.remote ? "Remoto" : "Presencial"}</div>
        </div>
        {applied ? (
          <div className="flex items-center gap-2 text-sm text-primary-glow">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-pretty">Postulaste · {status}</span>
          </div>
        ) : (
          <Button size="sm" className="w-full sm:w-auto" onClick={onApply}>
            Postular
          </Button>
        )}
      </div>
    </article>
  );
}

function ExploreTalent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const query = useQuery({
    queryKey: queryKeys.freelancers(debouncedSearch),
    queryFn: () => fetchFreelancers(debouncedSearch),
  });

  const freelancers = query.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">
          Explorar <span className="text-gradient-trust">talento</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Jóvenes con skills verificadas. Publica un proyecto o contáctalos desde su perfil público.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setDebouncedSearch(search);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, ciudad o bio…"
          className="min-w-0 border-border bg-surface/60"
        />
        <Button type="submit" variant="outline" className="w-full sm:w-auto">
          Buscar
        </Button>
      </form>

      <ApiState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        <div className="dashboard-stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {freelancers.map((f) => (
            <article
              key={f.id}
              className="card-paper p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display font-semibold">{f.name}</h3>
                  {f.city && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {f.city}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-primary-glow text-primary-glow" />
                  {f.rating.toFixed(1)}
                </div>
              </div>
              {f.bio && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{f.bio}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                {f.skills?.slice(0, 4).map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary-glow"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
              {f.username && (
                <Button asChild size="sm" variant="outline" className="mt-4 w-full">
                  <Link to="/talento/$username" params={{ username: f.username }}>
                    Ver perfil y QR
                  </Link>
                </Button>
              )}
            </article>
          ))}
        </div>
      </ApiState>
    </div>
  );
}
