import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, ChevronRight, PlusCircle, Users } from "lucide-react";
import { guardRole } from "@/lib/auth-guard";
import { fetchMyJobs, queryKeys } from "@/lib/api";
import { ApiState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/my-projects")({
  beforeLoad: () => {
    guardRole("client", "admin");
  },
  component: MyProjectsPage,
});

const statusLabel: Record<string, string> = {
  open: "Abierto",
  closed: "Cerrado",
  in_progress: "En progreso",
};

const statusStyles: Record<string, string> = {
  open: "chip chip-success",
  closed: "chip chip-muted",
  in_progress: "chip chip-trust",
};

function MyProjectsPage() {
  const query = useQuery({
    queryKey: queryKeys.myJobs,
    queryFn: fetchMyJobs,
  });

  const jobs = query.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="page-heading">
            Mis <span className="text-gradient">proyectos</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Proyectos que publicaste en WorkConnect. Entra a cada uno para ver postulaciones y
            aceptar talento.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/dashboard/publish">
            <PlusCircle className="mr-2 h-4 w-4" />
            Publicar nuevo
          </Link>
        </Button>
      </div>

      <ApiState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {jobs.length === 0 ? (
          <div className="card-inset p-12 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Aún no has publicado ningún proyecto.</p>
            <Button asChild className="mt-6">
              <Link to="/dashboard/publish">Publicar con IA</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  to="/dashboard/my-projects/$jobId"
                  params={{ jobId: job.id }}
                  className="card-list flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold">{job.title}</h2>
                      <span className={statusStyles[job.status ?? "open"] ?? "chip chip-muted"}>
                        {statusLabel[job.status ?? "open"] ?? job.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {job.budget} · {job.category} · {job.postedAgo}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
                  </div>
                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                    <div className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm sm:px-4">
                      <Users className="h-4 w-4 text-primary-glow" />
                      {job.applicants} postulaciones
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </ApiState>
    </div>
  );
}
