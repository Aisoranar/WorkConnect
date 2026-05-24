import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  CreditCard,
  FileUp,
  Link2,
  Loader2,
  Package,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";
import { guardRequireAuth } from "@/lib/auth-guard";
import {
  addWorkspaceDeliverable,
  addWorkspaceTask,
  deleteWorkspaceDeliverable,
  fetchPayments,
  fetchWorkspaceByJob,
  registerPayment,
  toggleWorkspaceTask,
  updateWorkspaceStatus,
  type PaymentRecord,
  type WorkspaceData,
} from "@/lib/api";
import { ApiState } from "@/components/ApiState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStoredUser } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/workspace/$jobId")({
  beforeLoad: () => {
    guardRequireAuth();
  },
  component: WorkspacePage,
});

const statusLabels: Record<string, string> = {
  in_progress: "En progreso",
  delivered: "Entregado",
  revision: "En revisión",
  completed: "Completado",
  paid: "Pagado",
};

const statusColors: Record<string, string> = {
  in_progress: "chip chip-primary",
  delivered: "chip chip-trust",
  revision: "chip chip-muted",
  completed: "chip chip-success",
  paid: "chip chip-success",
};

function WorkspacePage() {
  const { jobId } = Route.useParams();
  const queryClient = useQueryClient();
  const me = getStoredUser();
  const qk = ["workspace", jobId];

  const { data: workspace, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk,
    queryFn: () => fetchWorkspaceByJob(Number(jobId)),
  });

  const statusMut = useMutation({
    mutationFn: (status: WorkspaceData["status"]) =>
      updateWorkspaceStatus(workspace!.id, status),
    onSuccess: () => {
      toast.success("Estado actualizado");
      void queryClient.invalidateQueries({ queryKey: qk });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [newTask, setNewTask] = useState("");
  const taskMut = useMutation({
    mutationFn: (title: string) => addWorkspaceTask(workspace!.id, title),
    onSuccess: () => {
      setNewTask("");
      void queryClient.invalidateQueries({ queryKey: qk });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (taskId: number) => toggleWorkspaceTask(taskId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk }),
    onError: (e: Error) => toast.error(e.message),
  });

  const [delivTitle, setDelivTitle] = useState("");
  const [delivType, setDelivType] = useState<"link" | "note" | "file">("link");
  const [delivUrl, setDelivUrl] = useState("");
  const [delivFile, setDelivFile] = useState<File | null>(null);

  const delivMut = useMutation({
    mutationFn: () =>
      addWorkspaceDeliverable(workspace!.id, {
        title: delivTitle,
        type: delivType,
        url: delivType === "link" ? delivUrl : undefined,
        file: delivType === "file" ? delivFile ?? undefined : undefined,
      }),
    onSuccess: () => {
      setDelivTitle("");
      setDelivUrl("");
      setDelivFile(null);
      toast.success("Entregable agregado");
      void queryClient.invalidateQueries({ queryKey: qk });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteWorkspaceDeliverable(id),
    onSuccess: () => {
      toast.success("Entregable eliminado");
      void queryClient.invalidateQueries({ queryKey: qk });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const paymentsQuery = useQuery({
    queryKey: ["workspace-payments", workspace?.id],
    queryFn: () => fetchPayments(workspace!.id),
    enabled: Boolean(workspace),
  });

  const [payAmount, setPayAmount] = useState("");
  const [payCurrency, setPayCurrency] = useState<"COP" | "USD">("COP");
  const [payMethod, setPayMethod] = useState("transfer");
  const [payRef, setPayRef] = useState("");

  const payMut = useMutation({
    mutationFn: () =>
      registerPayment(workspace!.id, {
        amount: payAmount,
        currency: payCurrency,
        method: payMethod,
        reference: payRef || undefined,
      }),
    onSuccess: () => {
      setPayAmount("");
      setPayRef("");
      toast.success("Pago registrado");
      void queryClient.invalidateQueries({ queryKey: qk });
      void queryClient.invalidateQueries({ queryKey: ["workspace-payments", workspace?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isFreelancer = me?.id === workspace?.freelancer_id;
  const isClient = me?.id === workspace?.client_id;

  const nextActions: { label: string; status: WorkspaceData["status"]; show: boolean }[] = [
    { label: "Marcar como entregado", status: "delivered", show: isFreelancer && workspace?.status === "in_progress" },
    { label: "Solicitar revisión", status: "revision", show: isClient && workspace?.status === "delivered" },
    { label: "Devolver a progreso", status: "in_progress", show: isClient && workspace?.status === "revision" },
    { label: "Aprobar entrega", status: "completed", show: isClient && (workspace?.status === "delivered" || workspace?.status === "revision") },
    { label: "Marcar como pagado", status: "paid", show: isClient && workspace?.status === "completed" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard/my-projects" className="truncate">
          <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
          Volver
        </Link>
      </Button>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        {!workspace ? (
          <div className="card-inset p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              No hay workspace para este proyecto. Se crea al aceptar una postulación.
            </p>
          </div>
        ) : (
          <>
            <div className="card-paper p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-xl font-bold">
                    <span className="text-gradient">{workspace.job?.title}</span>
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {workspace.job?.company ?? ""} · {workspace.job?.budget}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Freelancer: {workspace.freelancer?.name} · Cliente: {workspace.client?.name}
                  </p>
                </div>
                <span className={`${statusColors[workspace.status]} capitalize`}>
                  {statusLabels[workspace.status]}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {nextActions
                  .filter((a) => a.show)
                  .map((a) => (
                    <Button
                      key={a.status}
                      size="sm"
                      variant={a.status === "completed" || a.status === "paid" ? "default" : "outline"}
                      disabled={statusMut.isPending}
                      onClick={() => statusMut.mutate(a.status)}
                    >
                      {statusMut.isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                      {a.label}
                    </Button>
                  ))}
              </div>
            </div>

            <div className="card-paper p-4 sm:p-6">
              <h2 className="font-semibold">Tareas</h2>
              <ul className="mt-3 space-y-2">
                {workspace.tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => toggleMut.mutate(t.id)}
                      className="shrink-0"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <span className={t.completed ? "line-through text-muted-foreground" : ""}>
                      {t.title}
                    </span>
                  </li>
                ))}
              </ul>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newTask.trim()) taskMut.mutate(newTask.trim());
                }}
              >
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Nueva tarea..."
                  className="flex-1 border-border bg-surface/60"
                />
                <Button type="submit" size="sm" disabled={!newTask.trim() || taskMut.isPending}>
                  <Plus className="mr-1 h-3 w-3" />
                  Agregar
                </Button>
              </form>
            </div>

            <div className="card-paper p-4 sm:p-6">
              <h2 className="font-semibold">Entregables</h2>
              {workspace.deliverables.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No hay entregables aún.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {workspace.deliverables.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {d.type === "file" ? (
                          <FileUp className="h-4 w-4 shrink-0 text-primary-glow" />
                        ) : d.type === "link" ? (
                          <Link2 className="h-4 w-4 shrink-0 text-primary-glow" />
                        ) : (
                          <StickyNote className="h-4 w-4 shrink-0 text-primary-glow" />
                        )}
                        <div className="min-w-0">
                          <span className="font-medium">{d.title}</span>
                          {d.url && (
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-2 text-xs text-primary-glow underline"
                            >
                              Abrir
                            </a>
                          )}
                          {d.file_name && (
                            <span className="ml-2 text-xs text-muted-foreground">{d.file_name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{d.user?.name}</span>
                        <button type="button" onClick={() => deleteMut.mutate(d.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 space-y-2 rounded-lg border border-dashed border-border p-3">
                <div className="flex gap-2">
                  <Input
                    value={delivTitle}
                    onChange={(e) => setDelivTitle(e.target.value)}
                    placeholder="Título del entregable"
                    className="flex-1 border-border bg-surface/60"
                  />
                  <select
                    value={delivType}
                    onChange={(e) => setDelivType(e.target.value as "link" | "note" | "file")}
                    className="rounded-lg border border-border bg-surface/60 px-2 text-sm"
                  >
                    <option value="link">Enlace</option>
                    <option value="file">Archivo</option>
                    <option value="note">Nota</option>
                  </select>
                </div>
                {delivType === "link" && (
                  <Input
                    value={delivUrl}
                    onChange={(e) => setDelivUrl(e.target.value)}
                    placeholder="https://..."
                    className="border-border bg-surface/60"
                  />
                )}
                {delivType === "file" && (
                  <Input
                    type="file"
                    onChange={(e) => setDelivFile(e.target.files?.[0] ?? null)}
                    className="border-border bg-surface/60"
                  />
                )}
                <Button
                  size="sm"
                  disabled={!delivTitle.trim() || delivMut.isPending}
                  onClick={() => delivMut.mutate()}
                >
                  {delivMut.isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                  <Plus className="mr-1 h-3 w-3" />
                  Agregar entregable
                </Button>
              </div>
            </div>
            <div className="card-paper p-4 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold">
                <CreditCard className="h-5 w-5 text-primary-glow" />
                Pagos
              </h2>

              {(paymentsQuery.data ?? []).length > 0 && (
                <ul className="mt-3 space-y-2">
                  {(paymentsQuery.data ?? []).map((p: PaymentRecord) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                    >
                      <div>
                        <span className="font-semibold">
                          {p.amount} {p.currency}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground capitalize">
                          {p.method}
                        </span>
                        {p.reference && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            Ref: {p.reference}
                          </span>
                        )}
                      </div>
                      <span className="chip chip-success text-[10px] capitalize">{p.status}</span>
                    </li>
                  ))}
                </ul>
              )}

              {isClient && (workspace.status === "completed" || workspace.status === "delivered") && (
                <div className="mt-4 space-y-2 rounded-lg border border-dashed border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    Registra el pago al talento. Esto marca el proyecto como pagado.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="Monto"
                      className="flex-1 border-border bg-surface/60"
                    />
                    <select
                      value={payCurrency}
                      onChange={(e) => setPayCurrency(e.target.value as "COP" | "USD")}
                      className="rounded-lg border border-border bg-surface/60 px-2 text-sm"
                    >
                      <option value="COP">COP</option>
                      <option value="USD">USD</option>
                    </select>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="rounded-lg border border-border bg-surface/60 px-2 text-sm"
                    >
                      <option value="transfer">Transferencia</option>
                      <option value="manual">Efectivo</option>
                      <option value="platform">Plataforma</option>
                    </select>
                  </div>
                  <Input
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="Referencia (opcional)"
                    className="border-border bg-surface/60"
                  />
                  <Button
                    size="sm"
                    disabled={!payAmount.trim() || payMut.isPending}
                    onClick={() => payMut.mutate()}
                  >
                    {payMut.isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                    <CreditCard className="mr-1 h-3 w-3" />
                    Registrar pago
                  </Button>
                </div>
              )}

              {workspace.status === "paid" && (
                <p className="mt-3 rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-success">
                  Este proyecto fue pagado. El talento puede añadirlo a su portafolio.
                </p>
              )}
            </div>
          </>
        )}
      </ApiState>
    </div>
  );
}
