import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, ChevronRight, PlusCircle, Users } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { fetchMyJobs, queryKeys } from "@/lib/api";
import { ApiState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/my-projects")({
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user) throw redirect({ to: "/login" });
    if (user.role !== "client" && user.role !== "admin") {
      throw redirect({ to: "/dashboard/explore" });
    }
  },
  component: MyProjectsPage,
});

const statusLabel: Record<string, string> = {
  open: "Abierto",
  closed: "Cerrado",
  in_progress: "En progreso",
};

function MyProjectsPage() {
  const query = useQuery({
    queryKey: queryKeys.myJobs,
    queryFn: fetchMyJobs,
  });

  const jobs = query.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Mis proyectos</h1>
          <p className="mt-2 text-muted-foreground">
            Proyectos que publicaste en WorkConnect. Entra a cada uno para ver postulaciones y
            aceptar talento.
          </p>
        </div>
        <Button asChild className="bg-gradient-primary shadow-glow">
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
          <div className="card-gradient rounded-2xl border border-dashed border-border p-12 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Aún no has publicado ningún proyecto.</p>
            <Button asChild className="mt-6 bg-gradient-primary shadow-glow">
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
                  className="card-gradient flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-6 shadow-card transition hover:border-primary/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold">{job.title}</h2>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase">
                        {statusLabel[job.status ?? "open"] ?? job.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {job.budget} · {job.category} · {job.postedAgo}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm">
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
