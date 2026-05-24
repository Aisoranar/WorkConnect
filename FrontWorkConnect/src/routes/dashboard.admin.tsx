import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Briefcase,
  Send,
  ShieldCheck,
  TrendingUp,
  Clock,
  GraduationCap,
  Star,
  BarChart3,
} from "lucide-react";
import { guardRole } from "@/lib/auth-guard";
import { fetchAdminStats, type AdminStats } from "@/lib/api";
import { ApiState } from "@/components/ApiState";

export const Route = createFileRoute("/dashboard/admin")({
  beforeLoad: () => {
    guardRole("admin");
  },
  component: AdminPage,
});

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="card-paper p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function AdminPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary-glow">
          <ShieldCheck className="h-3.5 w-3.5" />
          Panel de administración
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
          <span className="text-gradient">Admin WorkConnect</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vista general de la plataforma: usuarios, proyectos y postulaciones.
        </p>
      </div>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<Users className="h-4 w-4 text-primary-glow" />}
                label="Usuarios totales"
                value={data.users.total}
                sub={`${data.users.freelancers} talentos · ${data.users.clients} empresas · ${data.users.admins} admins`}
              />
              <StatCard
                icon={<Briefcase className="h-4 w-4 text-primary-glow" />}
                label="Proyectos"
                value={data.jobs.total}
                sub={`${data.jobs.open} abiertos · ${data.jobs.closed} cerrados`}
              />
              <StatCard
                icon={<Send className="h-4 w-4 text-primary-glow" />}
                label="Postulaciones"
                value={data.applications.total}
                sub={`${data.applications.accepted} aceptadas · ${data.applications.pending} pendientes`}
              />
              <StatCard
                icon={<TrendingUp className="h-4 w-4 text-primary-glow" />}
                label="Tasa de aceptación"
                value={
                  data.applications.total > 0
                    ? `${Math.round((data.applications.accepted / data.applications.total) * 100)}%`
                    : "0%"
                }
                sub={`${data.applications.rejected} rechazadas`}
              />
            </div>

            {data.metrics && (
              <div className="card-paper p-4 sm:p-6">
                <h2 className="flex items-center gap-2 font-semibold">
                  <GraduationCap className="h-5 w-5 text-primary-glow" />
                  Métricas de impacto (universidades)
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Datos para medir el impacto de la plataforma en la empleabilidad juvenil.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5 text-primary-glow" />
                      Rating promedio
                    </div>
                    <p className="mt-1 font-display text-xl font-bold">{data.metrics.avg_rating}/5</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BarChart3 className="h-3.5 w-3.5 text-primary-glow" />
                      Tasa de aceptación
                    </div>
                    <p className="mt-1 font-display text-xl font-bold">{data.metrics.acceptance_rate}%</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5 text-primary-glow" />
                      Reseñas totales
                    </div>
                    <p className="mt-1 font-display text-xl font-bold">{data.metrics.total_reviews}</p>
                  </div>
                </div>

                {data.metrics.top_skills.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium">Top 10 habilidades en la plataforma</h3>
                    <div className="mt-2 space-y-1.5">
                      {data.metrics.top_skills.map((s, i) => (
                        <div key={s.name} className="flex items-center gap-2 text-sm">
                          <span className="w-5 text-xs text-muted-foreground">{i + 1}.</span>
                          <span className="flex-1 font-medium">{s.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{
                                  width: `${Math.min(100, (s.users_count / Math.max(1, data.metrics!.top_skills[0].users_count)) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="w-8 text-right text-xs text-muted-foreground">
                              {s.users_count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card-paper p-4 sm:p-6">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Clock className="h-5 w-5 text-primary-glow" />
                  Usuarios recientes
                </h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Rol</th>
                        <th className="px-3 py-2">Ciudad</th>
                        <th className="px-3 py-2">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_users.map((u) => (
                        <tr key={u.id} className="border-b border-border/50 last:border-0">
                          <td className="px-3 py-2 font-medium">{u.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`chip ${
                                u.role === "admin"
                                  ? "chip-primary"
                                  : u.role === "client"
                                    ? "chip-trust"
                                    : "chip-muted"
                              } text-[10px] capitalize`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{u.city ?? "—"}</td>
                          <td className="px-3 py-2 tabular-nums">{u.rating > 0 ? u.rating.toFixed(1) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card-paper p-4 sm:p-6">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Briefcase className="h-5 w-5 text-primary-glow" />
                  Proyectos recientes
                </h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Título</th>
                        <th className="px-3 py-2">Empresa</th>
                        <th className="px-3 py-2">Presupuesto</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2">Categoría</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_jobs.map((j) => (
                        <tr key={j.id} className="border-b border-border/50 last:border-0">
                          <td className="max-w-[180px] truncate px-3 py-2 font-medium">{j.title}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {j.company ?? j.owner?.name ?? "—"}
                          </td>
                          <td className="px-3 py-2 font-semibold">{j.budget}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`chip text-[10px] capitalize ${
                                j.status === "open" ? "chip-success" : "chip-muted"
                              }`}
                            >
                              {j.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{j.category ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </ApiState>
    </div>
  );
}
