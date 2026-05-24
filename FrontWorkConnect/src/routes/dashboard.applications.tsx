import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronRight, Eye } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { careerProjectTips, fetchApplications, queryKeys, type ProjectCoaching } from "@/lib/api";
import type { Application } from "@/lib/types";
import { ApiState } from "@/components/ApiState";
import { ApplicationDetailSheet } from "@/components/ApplicationDetailSheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/applications")({
  validateSearch: (search: Record<string, unknown>) => ({
    job: typeof search.job === "string" && search.job.trim() !== "" ? search.job.trim() : undefined,
  }),
  component: Applications,
});

const statusColors: Record<string, string> = {
  pendiente: "chip chip-muted",
  "en revisión": "chip chip-primary",
  aceptada: "chip chip-success",
  rechazada: "chip border-destructive/40 bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  "en revisión": "En revisión",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

type StatusFilter = "all" | Application["status"];

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
  const { job: highlightJobId } = Route.useSearch();
  const autoOpenedRef = useRef<string | null>(null);

  const [coachingByJob, setCoachingByJob] = useState<Record<string, ProjectCoaching>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: applications = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.applications,
    queryFn: fetchApplications,
  });

  const filtered = useMemo(() => {
    if (statusFilter === "all") return applications;
    return applications.filter((a) => a.status === statusFilter);
  }, [applications, statusFilter]);

  const counts = useMemo(() => {
    const c = { all: applications.length, pendiente: 0, aceptada: 0, rechazada: 0, "en revisión": 0 };
    for (const a of applications) {
      if (a.status in c) c[a.status as keyof typeof c]++;
    }
    return c;
  }, [applications]);

  const tipsMut = useMutation({
    mutationFn: (jobId: string) => careerProjectTips(Number(jobId)),
    onSuccess: (data, jobId) => {
      setCoachingByJob((prev) => ({ ...prev, [jobId]: data }));
      toast.success("Consejos de entrega listos");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openDetail(app: Application) {
    setSelected(app);
    setDetailOpen(true);
  }

  useEffect(() => {
    if (!highlightJobId || applications.length === 0) {
      if (!highlightJobId) autoOpenedRef.current = null;
      return;
    }
    const app = applications.find((a) => a.jobId === highlightJobId);
    if (app && autoOpenedRef.current !== highlightJobId) {
      autoOpenedRef.current = highlightJobId;
      openDetail(app);
    }
  }, [highlightJobId, applications]);

  function requestCoachingForSelected() {
    if (!selected?.jobId) return;
    tipsMut.mutate(selected.jobId);
  }

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "Todas", count: counts.all },
    { key: "pendiente", label: "Pendientes", count: counts.pendiente },
    { key: "aceptada", label: "Aceptadas", count: counts.aceptada },
    { key: "rechazada", label: "Rechazadas", count: counts.rechazada },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">
          Mis <span className="text-gradient">postulaciones</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Revisa el detalle de cada propuesta: mensaje, plazo, proyecto y estado.
        </p>
      </div>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes postulaciones aún.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    statusFilter === tab.key
                      ? "border-primary bg-primary/15 text-primary-glow"
                      : "border-border text-muted-foreground hover:bg-surface/60",
                  )}
                >
                  {tab.label}
                  <span className="ml-1 opacity-70">({tab.count})</span>
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay postulaciones con este filtro.</p>
            ) : (
              <>
                <ul className="space-y-3 md:hidden">
                  {filtered.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => openDetail(a)}
                        className="card-list w-full space-y-3 p-4 text-left transition hover:border-primary/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 font-medium leading-snug">{a.jobTitle}</div>
                          <span
                            className={`shrink-0 capitalize ${statusColors[a.status] ?? "chip chip-muted"}`}
                          >
                            {statusLabels[a.status] ?? a.status}
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
                        {a.proposal && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">{a.proposal}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Enviado {a.sentAgo}</span>
                          {a.match != null && <span>Match {a.match}%</span>}
                        </div>
                        <span className="inline-flex items-center text-xs font-medium text-primary-glow">
                          Ver detalle
                          <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                        </span>
                        {a.status === "aceptada" && a.jobId && coachingByJob[a.jobId] && (
                          <CoachingTips coaching={coachingByJob[a.jobId]} />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="card-paper hidden overflow-hidden md:block">
                  <div className="table-scroll">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="border-b border-border bg-surface/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 lg:px-6">Proyecto</th>
                          <th className="px-4 py-3 lg:px-6">Cliente</th>
                          <th className="px-4 py-3 lg:px-6">Propuesta</th>
                          <th className="px-4 py-3 lg:px-6">Plazo</th>
                          <th className="px-4 py-3 lg:px-6">Match</th>
                          <th className="px-4 py-3 lg:px-6">Estado</th>
                          <th className="px-4 py-3 lg:px-6">Enviado</th>
                          <th className="px-4 py-3 lg:px-6" />
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((a) => (
                          <tr
                            key={a.id}
                            className="border-b border-border/50 transition row-enterprise last:border-0"
                          >
                            <td className="max-w-[200px] px-4 py-4 lg:px-6">
                              <div className="font-medium">{a.jobTitle}</div>
                              {a.proposal && (
                                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{a.proposal}</p>
                              )}
                            </td>
                            <td className="px-4 py-4 text-muted-foreground lg:px-6">{a.company}</td>
                            <td className="px-4 py-4 font-display font-semibold lg:px-6">{a.price}</td>
                            <td className="px-4 py-4 text-muted-foreground lg:px-6">
                              {a.deliveryTime ?? "—"}
                            </td>
                            <td className="px-4 py-4 tabular-nums lg:px-6">
                              {a.match != null ? `${a.match}%` : "—"}
                            </td>
                            <td className="px-4 py-4 lg:px-6">
                              <span
                                className={`capitalize ${statusColors[a.status] ?? "chip chip-muted"}`}
                              >
                                {statusLabels[a.status] ?? a.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-muted-foreground lg:px-6">{a.sentAgo}</td>
                            <td className="px-4 py-4 lg:px-6">
                              <Button size="sm" variant="outline" onClick={() => openDetail(a)}>
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                Detalle
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </ApiState>

      <ApplicationDetailSheet
        application={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        coaching={selected?.jobId ? coachingByJob[selected.jobId] : null}
        onRequestCoaching={
          selected?.status === "aceptada" && selected.jobId ? requestCoachingForSelected : undefined
        }
        coachingLoading={tipsMut.isPending}
      />
    </div>
  );
}
