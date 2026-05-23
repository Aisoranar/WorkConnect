import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, MapPin, Clock, Users } from "lucide-react";
import { fetchJobs, queryKeys } from "@/lib/api";
import { ApiState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/explore")({
  component: Explore,
});

const categories = ["Todos", "Diseño", "Desarrollo", "Video", "Marketing"];

function Explore() {
  const [active, setActive] = useState("Todos");
  const { data: jobs = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.jobs,
    queryFn: fetchJobs,
  });

  const filtered = active === "Todos" ? jobs : jobs.filter((j) => j.category === active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Explorar trabajos</h1>
        <p className="mt-1 text-muted-foreground">Ordenados por compatibilidad IA con tu perfil.</p>
      </div>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                active === c
                  ? "border-primary bg-gradient-primary text-primary-foreground shadow-glow"
                  : "border-border bg-surface/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {filtered.map((job) => (
            <article key={job.id} className="card-gradient flex flex-col rounded-2xl border border-border p-6 shadow-card transition hover:border-primary/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">{job.company}</div>
                  <h3 className="font-display text-lg font-semibold leading-snug">{job.title}</h3>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-xl bg-primary/15 px-3 py-1.5 text-sm font-semibold text-primary-glow">
                  <Sparkles className="h-3.5 w-3.5" />
                  {job.match}%
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{job.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span key={s} className="rounded-md border border-border bg-surface/60 px-2 py-0.5 text-xs">{s}</span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{job.postedAgo}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{job.applicants} postulantes</span>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <div className="font-display text-xl font-bold">{job.budget}</div>
                  <div className="text-xs text-muted-foreground">{job.remote ? "Remoto" : "Presencial"}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Guardar</Button>
                  <Button size="sm" className="bg-gradient-primary">Postular</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </ApiState>
    </div>
  );
}
