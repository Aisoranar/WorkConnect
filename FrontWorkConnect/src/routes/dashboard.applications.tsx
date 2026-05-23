import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchApplications, queryKeys } from "@/lib/api";
import { ApiState } from "@/components/ApiState";

export const Route = createFileRoute("/dashboard/applications")({
  component: Applications,
});

const statusColors: Record<string, string> = {
  pendiente: "bg-muted text-muted-foreground",
  "en revisión": "bg-primary/15 text-primary-glow",
  aceptada: "bg-success/20 text-success",
  rechazada: "bg-destructive/15 text-destructive",
};

function Applications() {
  const { data: applications = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.applications,
    queryFn: fetchApplications,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Mis postulaciones</h1>
        <p className="mt-1 text-muted-foreground">Seguimiento de propuestas enviadas.</p>
      </div>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        <div className="card-gradient overflow-hidden rounded-2xl border border-border shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Proyecto</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Propuesta</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Enviado</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="border-b border-border/50 transition last:border-0 hover:bg-surface/30">
                  <td className="px-6 py-4 font-medium">{a.jobTitle}</td>
                  <td className="px-6 py-4 text-muted-foreground">{a.company}</td>
                  <td className="px-6 py-4 font-display font-semibold">{a.price}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusColors[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{a.sentAgo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ApiState>
    </div>
  );
}
