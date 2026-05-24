import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, MapPin, X } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import {
  fetchJob,
  fetchJobApplications,
  queryKeys,
  updateApplicationStatus,
} from "@/lib/api";
import { ApiState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/my-projects/$jobId")({
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user) throw redirect({ to: "/login" });
    if (user.role !== "client" && user.role !== "admin") {
      throw redirect({ to: "/dashboard/explore" });
    }
  },
  component: MyProjectDetailPage,
});

function MyProjectDetailPage() {
  const { jobId } = Route.useParams();
  const queryClient = useQueryClient();

  const jobQuery = useQuery({
    queryKey: queryKeys.job(jobId),
    queryFn: () => fetchJob(jobId),
  });

  const applicationsQuery = useQuery({
    queryKey: queryKeys.jobApplications(jobId),
    queryFn: () => fetchJobApplications(jobId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "aceptada" | "rechazada" }) =>
      updateApplicationStatus(id, status),
    onSuccess: () => {
      toast.success("Estado actualizado");
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobApplications(jobId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myJobs });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const job = jobQuery.data;
  const applications = applicationsQuery.data ?? [];
  const loading = jobQuery.isLoading || applicationsQuery.isLoading;
  const error = jobQuery.error ?? applicationsQuery.error;

  return (
    <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 max-w-full">
        <Link to="/dashboard/my-projects" className="truncate">
          <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
          Volver a mis proyectos
        </Link>
      </Button>

      <ApiState
        isLoading={loading}
        isError={Boolean(error)}
        error={error}
        onRetry={() => {
          void jobQuery.refetch();
          void applicationsQuery.refetch();
        }}
      >
        {job && (
          <>
            <div className="card-paper p-4 shadow-card sm:p-6">
              <h1 className="font-display text-xl font-bold sm:text-2xl">
                <span className="text-gradient">{job.title}</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {job.budget} · {job.category}
              </p>
              {job.location && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </p>
              )}
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {job.description}
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-semibold">
                Postulaciones ({applications.length})
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Revisa propuestas y acepta al talento que encaje con tu presupuesto.
              </p>

              {applications.length === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Nadie ha postulado aún. Los jóvenes lo verán en Explorar proyectos.
                </p>
              ) : (
                <ul className="mt-6 space-y-4">
                  {applications.map((app) => (
                    <li
                      key={app.id}
                      className="card-list p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{app.user.name}</div>
                          {app.user.city && (
                            <div className="text-xs text-muted-foreground">{app.user.city}</div>
                          )}
                          {app.user.skills && app.user.skills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {app.user.skills.slice(0, 5).map((s) => (
                                <span
                                  key={s.name}
                                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary-glow"
                                >
                                  {s.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span
                          className={`capitalize ${
                            app.status === "aceptada"
                              ? "chip chip-success"
                              : app.status === "rechazada"
                                ? "chip border-destructive/40 bg-destructive/10 text-destructive"
                                : "chip chip-primary"
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {app.proposal}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <span>
                          <strong>Oferta:</strong> {app.price}
                        </span>
                        <span>
                          <strong>Plazo:</strong> {app.delivery_time}
                        </span>
                      </div>

                      {app.status === "pendiente" && (
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <Button
                            size="sm"
                            className="w-full sm:w-auto"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ id: app.id, status: "aceptada" })
                            }
                          >
                            {statusMutation.isPending ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="mr-1 h-3 w-3" />
                            )}
                            Aceptar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ id: app.id, status: "rechazada" })
                            }
                          >
                            <X className="mr-1 h-3 w-3" />
                            Rechazar
                          </Button>
                          {app.user.username && (
                            <Button asChild size="sm" variant="ghost" className="w-full sm:w-auto">
                              <Link to="/talento/$username" params={{ username: app.user.username! }}>
                                Ver perfil
                              </Link>
                            </Button>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </ApiState>
    </div>
  );
}
