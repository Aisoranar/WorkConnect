import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  AlertTriangle,
  MapPin,
  Clock,
  Users,
  Search,
  CheckCircle2,
  Briefcase,
  Star,
  Eye,
} from "lucide-react";
import { fetchFreelancers, fetchJob, fetchJobs, queryKeys, type ExploreJobsFilters } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { ApiState } from "@/components/ApiState";
import { ApplyJobSheet } from "@/components/ApplyJobSheet";
import { JobDetailDialog } from "@/components/JobDetailDialog";
import { JobMatchCoachDialog } from "@/components/JobMatchCoachDialog";
import { LOW_MATCH_THRESHOLD } from "@/components/JobMatchCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Job } from "@/lib/types";

export const Route = createFileRoute("/dashboard/explore")({
  validateSearch: (search: Record<string, unknown>) => ({
    job: typeof search.job === "string" && search.job.trim() !== "" ? search.job.trim() : undefined,
  }),
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
  const { job: highlightJobId } = Route.useSearch();
  const highlightCardRef = useRef<HTMLElement | null>(null);

  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<ExploreJobsFilters["sort"]>("match");
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [coachJob, setCoachJob] = useState<Job | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const autoOpenedJobRef = useRef<string | null>(null);

  const filters: ExploreJobsFilters = useMemo(
    () => ({ category, q: debouncedSearch, sort }),
    [category, debouncedSearch, sort],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...queryKeys.jobs, filters] as const,
    queryFn: () => fetchJobs(filters),
  });

  const highlightJobQuery = useQuery({
    queryKey: queryKeys.job(highlightJobId ?? ""),
    queryFn: () => fetchJob(highlightJobId!),
    enabled: Boolean(highlightJobId),
  });

  const jobs = data?.data ?? [];

  const displayJobs = useMemo(() => {
    if (!highlightJobId) return jobs;

    const highlighted = jobs.find((j) => j.id === highlightJobId) ?? highlightJobQuery.data;
    if (!highlighted) return jobs;

    const rest = jobs.filter((j) => j.id !== highlightJobId);
    if (jobs.some((j) => j.id === highlightJobId)) {
      return [highlighted, ...rest];
    }
    return [highlighted, ...jobs];
  }, [jobs, highlightJobId, highlightJobQuery.data]);

  useEffect(() => {
    if (!highlightJobId || isLoading) return;
    const timer = window.setTimeout(() => {
      highlightCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [highlightJobId, isLoading, displayJobs.length]);

  useEffect(() => {
    if (!highlightJobId) {
      autoOpenedJobRef.current = null;
      return;
    }
    const job = jobs.find((j) => j.id === highlightJobId) ?? highlightJobQuery.data;
    if (job && autoOpenedJobRef.current !== highlightJobId) {
      autoOpenedJobRef.current = highlightJobId;
      setDetailJob(job);
      setDetailOpen(true);
    }
  }, [highlightJobId, highlightJobQuery.data, jobs]);

  function openJobDetail(job: Job) {
    setDetailJob(job);
    setDetailOpen(true);
  }
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

      {highlightJobId && (highlightJobQuery.data || jobs.find((j) => j.id === highlightJobId)) && (
        <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-primary-glow">Tu postulación · </span>
            {(highlightJobQuery.data ?? jobs.find((j) => j.id === highlightJobId))?.title}
          </p>
          <Button asChild variant="ghost" size="sm" className="shrink-0 self-start sm:self-center">
            <Link to="/dashboard/explore" search={{}} replace>
              Ver todos los proyectos
            </Link>
          </Button>
        </div>
      )}

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

        {displayJobs.length === 0 && !highlightJobQuery.isLoading ? (
          <div className="card-inset p-12 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              No hay proyectos con esos filtros. Prueba otra categoría o vuelve más tarde.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 dashboard-stagger">
            {displayJobs.map((job) => (
              <JobCard
                key={job.id}
                ref={job.id === highlightJobId ? highlightCardRef : undefined}
                job={job}
                highlighted={job.id === highlightJobId}
                onViewDetail={() => openJobDetail(job)}
                onApply={() => setApplyJob(job)}
                onImproveMatch={() => setCoachJob(job)}
              />
            ))}
          </div>
        )}
      </ApiState>

      <JobDetailDialog
        job={detailJob}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onApply={(job) => setApplyJob(job)}
        onImproveMatch={(job) => setCoachJob(job)}
      />

      <ApplyJobSheet
        job={applyJob}
        open={Boolean(applyJob)}
        onOpenChange={(open) => !open && setApplyJob(null)}
      />

      <JobMatchCoachDialog
        job={coachJob}
        open={Boolean(coachJob)}
        onOpenChange={(open) => !open && setCoachJob(null)}
      />
    </div>
  );
}

const JobCard = React.forwardRef<
  HTMLElement,
  {
    job: Job;
    highlighted?: boolean;
    onViewDetail: () => void;
    onApply: () => void;
    onImproveMatch: () => void;
  }
>(function JobCard({ job, highlighted, onViewDetail, onApply, onImproveMatch }, ref) {
  const applied = job.alreadyApplied;
  const status = job.applicationStatus;
  const isLowMatch = job.match < LOW_MATCH_THRESHOLD;

  return (
    <article
      ref={ref}
      id={highlighted ? `explore-job-${job.id}` : undefined}
      className={`card-list group flex flex-col p-4 sm:p-6 transition-enterprise ${
        highlighted ? "ring-2 ring-primary/60 shadow-lg shadow-primary/10" : ""
      }`}
    >
      {highlighted && (
        <span className="mb-2 inline-flex w-fit items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-medium text-primary-glow">
          Proyecto de tu postulación
        </span>
      )}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{job.company}</span>
            {job.isNew && <span className="chip chip-trust">Nuevo</span>}
            {job.match >= 85 && (
              <span className="chip chip-primary">Alta compatibilidad</span>
            )}
          </div>
          <button
            type="button"
            onClick={onViewDetail}
            className="text-left font-display text-lg font-semibold leading-snug hover:text-primary-glow"
          >
            {job.title}
          </button>
          <span className="mt-1 inline-block text-xs text-muted-foreground">{job.category}</span>
        </div>
        {isLowMatch ? (
          <button
            type="button"
            onClick={onImproveMatch}
            className="flex shrink-0 items-center gap-1 rounded-xl border border-warning/50 bg-warning/15 px-3 py-1.5 text-sm font-semibold text-warning"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {job.match}%
          </button>
        ) : (
          <button
            type="button"
            onClick={onImproveMatch}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-trust/15 px-3 py-1.5 text-sm font-semibold text-trust-glow"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {job.match}%
          </button>
        )}
      </div>

      {isLowMatch && (
        <button
          type="button"
          onClick={onImproveMatch}
          className="mt-3 w-full rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-left text-xs text-warning"
        >
          <span className="font-medium">Match bajo.</span> Pulsa para ver qué aprender con IA y poder postular.
        </button>
      )}

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

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:mt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {isLowMatch && (
                <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={onImproveMatch}>
                  Mejorar match
                </Button>
              )}
              <Button size="sm" className="w-full sm:w-auto" onClick={onApply}>
                Postular
              </Button>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-primary-glow sm:w-auto"
          onClick={onViewDetail}
        >
          <Eye className="mr-1.5 h-4 w-4" />
          Ver detalle del proyecto
        </Button>
      </div>
    </article>
  );
});

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
