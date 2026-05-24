import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { careerProjectTips, fetchApplications, queryKeys, type ProjectCoaching } from "@/lib/api";
import { ApiState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/applications")({
  component: Applications,
});

const statusColors: Record<string, string> = {
  pendiente: "chip chip-muted",
  "en revisión": "chip chip-primary",
  aceptada: "chip chip-success",
  rechazada: "chip border-destructive/40 bg-destructive/10 text-destructive",
};

function CoachingTips({ coaching }: { coaching: ProjectCoaching }) {
  return (
    <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
      <p className="font-semibold text-primary-glow">Coaching IA · match {coaching.match_percent}%</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
        {coaching.strengths_to_leverage.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function Applications() {
  const [coachingByJob, setCoachingByJob] = useState<Record<string, ProjectCoaching>>({});

  const { data: applications = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.applications,
    queryFn: fetchApplications,
  });

  const tipsMut = useMutation({
    mutationFn: (jobId: string) => careerProjectTips(Number(jobId)),
    onSuccess: (data, jobId) => {
      setCoachingByJob((prev) => ({ ...prev, [jobId]: data }));
      toast.success("Consejos de entrega listos");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">
          Mis <span className="text-gradient">postulaciones</span>
        </h1>
        <p className="mt-1 text-muted-foreground">Seguimiento de propuestas enviadas.</p>
      </div>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes postulaciones aún.</p>
        ) : (
          <>
            <ul className="space-y-3 md:hidden">
              {applications.map((a) => (
                <li key={a.id} className="card-list space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 font-medium leading-snug">{a.jobTitle}</div>
                    <span className={`shrink-0 capitalize ${statusColors[a.status] ?? "chip chip-muted"}`}>
                      {a.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Cliente</div>
                      <div className="truncate">{a.company}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Propuesta</div>
                      <div className="font-display font-semibold">{a.price}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Enviado {a.sentAgo}</div>
                  {a.status === "aceptada" && a.jobId && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={tipsMut.isPending}
                        onClick={() => tipsMut.mutate(a.jobId!)}
                      >
                        {tipsMut.isPending ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1 h-3 w-3" />
                        )}
                        Consejos para este proyecto
                      </Button>
                      {coachingByJob[a.jobId] && <CoachingTips coaching={coachingByJob[a.jobId]} />}
                    </>
                  )}
                </li>
              ))}
            </ul>

            <div className="card-paper hidden overflow-hidden md:block">
              <div className="table-scroll">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b border-border bg-surface/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 lg:px-6">Proyecto</th>
                      <th className="px-4 py-3 lg:px-6">Cliente</th>
                      <th className="px-4 py-3 lg:px-6">Propuesta</th>
                      <th className="px-4 py-3 lg:px-6">Estado</th>
                      <th className="px-4 py-3 lg:px-6">Enviado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-border/50 transition row-enterprise last:border-0"
                      >
                        <td className="px-4 py-4 font-medium lg:px-6">{a.jobTitle}</td>
                        <td className="px-4 py-4 text-muted-foreground lg:px-6">{a.company}</td>
                        <td className="px-4 py-4 font-display font-semibold lg:px-6">{a.price}</td>
                        <td className="px-4 py-4 lg:px-6">
                          <span className={`capitalize ${statusColors[a.status] ?? "chip chip-muted"}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground lg:px-6">{a.sentAgo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </ApiState>
    </div>
  );
}
