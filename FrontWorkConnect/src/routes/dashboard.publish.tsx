import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Wand2, Loader2, Send, List, Cpu } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import {
  createJob,
  queryKeys,
  structureProjectBrief,
  type PayCurrency,
  type StructuredProject,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard/publish")({
  beforeLoad: () => {
    const user = getStoredUser();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    if (user.role !== "client" && user.role !== "admin") {
      throw redirect({ to: "/dashboard/explore" });
    }
  },
  component: PublishProjectPage,
});

function formatBudgetLabel(amount: number, currency: PayCurrency): string {
  if (!amount || amount <= 0) return "";
  if (currency === "COP") {
    return `${amount.toLocaleString("es-CO")} COP`;
  }
  return `$${amount.toLocaleString("en-US")} USD`;
}

function PublishProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = getStoredUser();

  const [rawNeed, setRawNeed] = useState("");
  const [currency, setCurrency] = useState<PayCurrency>("COP");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [businessContext, setBusinessContext] = useState("");
  const [draft, setDraft] = useState<StructuredProject | null>(null);

  const parsedAmount = Number(budgetAmount.replace(/\D/g, "")) || 0;

  const structureMutation = useMutation({
    mutationFn: () =>
      structureProjectBrief({
        raw_need: rawNeed.trim(),
        currency,
        budget_amount: parsedAmount,
        business_context: businessContext.trim() || undefined,
      }),
    onSuccess: (data) => {
      setDraft(data);
      toast.success("Requerimiento generado. Revisa tecnologías sugeridas y publica.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMutation = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error("No hay borrador");
      return createJob({
        title: draft.title.trim(),
        description: draft.description.trim(),
        budget: draft.budget.trim(),
        category: draft.category,
        remote: draft.remote,
        location: businessContext.trim() || undefined,
        skills: draft.skills,
        company: user?.name ?? undefined,
      });
    },
    onSuccess: (result) => {
      toast.success(result.message ?? "Proyecto publicado");
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myJobs });
      setDraft(null);
      setRawNeed("");
      setBudgetAmount("");
      setBusinessContext("");
      void navigate({ to: "/dashboard/my-projects" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function updateDraft<K extends keyof StructuredProject>(key: K, value: StructuredProject[K]) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      if (key === "currency" || key === "budget_amount") {
        next.budget = formatBudgetLabel(
          key === "budget_amount" ? (value as number) : prev.budget_amount,
          key === "currency" ? (value as PayCurrency) : prev.currency,
        );
      }
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Publicar proyecto</h1>
          <p className="mt-2 text-muted-foreground">
            Indica cómo pagarás (COP o USD). La IA sugiere WordPress, Laravel, React u otras
            tecnologías según tu necesidad.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/my-projects">
            <List className="mr-2 h-4 w-4" />
            Mis proyectos
          </Link>
        </Button>
      </div>

      <div className="card-gradient space-y-5 rounded-2xl border border-border p-6 shadow-card">
        <div className="space-y-2">
          <Label htmlFor="raw_need">¿Qué necesitas resolver?</Label>
          <Textarea
            id="raw_need"
            value={rawNeed}
            onChange={(e) => setRawNeed(e.target.value)}
            rows={5}
            className="border-border bg-surface/60"
            placeholder="Ej: Vendo pan y necesito una página web con WhatsApp para pedidos..."
          />
        </div>

        <div className="space-y-3">
          <Label>¿En qué moneda pagarás?</Label>
          <div className="flex gap-2">
            {(["COP", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  currency === c
                    ? "border-primary bg-gradient-primary text-primary-foreground shadow-glow"
                    : "border-border bg-surface/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "COP" ? "Pesos colombianos (COP)" : "Dólares (USD)"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="budget_amount">Monto del presupuesto</Label>
            <Input
              id="budget_amount"
              inputMode="numeric"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value.replace(/[^\d]/g, ""))}
              placeholder={currency === "COP" ? "Ej: 200000" : "Ej: 500"}
              className="border-border bg-surface/60"
            />
            {parsedAmount > 0 && (
              <p className="text-xs text-primary-glow">
                Vista previa: {formatBudgetLabel(parsedAmount, currency)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="business">Tu negocio / ciudad</Label>
            <Input
              id="business"
              value={businessContext}
              onChange={(e) => setBusinessContext(e.target.value)}
              placeholder="Ej: Panadería · Barranquilla"
              className="border-border bg-surface/60"
            />
          </div>
        </div>

        <Button
          className="bg-gradient-primary shadow-glow"
          disabled={structureMutation.isPending || rawNeed.trim().length < 20 || parsedAmount < 1}
          onClick={() => structureMutation.mutate()}
        >
          {structureMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Convertir en requerimiento con IA
        </Button>
      </div>

      {draft && (
        <div className="card-gradient space-y-5 rounded-2xl border border-primary/30 p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-2 text-sm text-primary-glow">
            <Sparkles className="h-4 w-4" />
            {draft.summary}
            {draft.source === "local" && (
              <span className="rounded bg-surface px-2 py-0.5 text-[10px] text-muted-foreground">
                IA local
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface/40 p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Tipo de solución</div>
              <div className="mt-1 text-sm font-medium">{draft.solution_type}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Tiempo estimado</div>
              <div className="mt-1 text-sm font-medium">{draft.estimated_time}</div>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Dificultad</div>
              <div className="mt-1 text-sm font-medium">{draft.difficulty_level}</div>
            </div>
          </div>

          {draft.recommended_technologies.length > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Cpu className="h-4 w-4 text-primary-glow" />
                Tecnologías recomendadas para este proyecto
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Según tu necesidad (web sencilla, app, diseño, etc.). El joven puede proponer
                alternativas si las justifica.
              </p>
              <div className="flex flex-wrap gap-2">
                {draft.recommended_technologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-primary/30 bg-surface/80 px-3 py-1 text-xs font-medium text-primary-glow"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="draft_title">Título del proyecto</Label>
            <Input
              id="draft_title"
              value={draft.title}
              onChange={(e) => updateDraft("title", e.target.value)}
              className="border-border bg-surface/60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="draft_desc">Descripción (la verán los jóvenes)</Label>
            <Textarea
              id="draft_desc"
              value={draft.description}
              onChange={(e) => updateDraft("description", e.target.value)}
              rows={10}
              className="border-border bg-surface/60"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label>Moneda</Label>
              <div className="flex gap-1">
                {(["COP", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateDraft("currency", c)}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium ${
                      draft.currency === c
                        ? "border-primary bg-primary/20 text-primary-glow"
                        : "border-border"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="draft_amount">Monto</Label>
              <Input
                id="draft_amount"
                inputMode="numeric"
                value={String(draft.budget_amount || "")}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/\D/g, "")) || 0;
                  updateDraft("budget_amount", n);
                }}
                className="border-border bg-surface/60"
              />
            </div>
            <div className="space-y-2">
              <Label>Presupuesto publicado</Label>
              <div className="flex h-10 items-center rounded-lg border border-border bg-surface/40 px-3 text-sm font-semibold">
                {draft.budget}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="draft_category">Categoría</Label>
            <Input
              id="draft_category"
              value={draft.category}
              onChange={(e) => updateDraft("category", e.target.value)}
              className="border-border bg-surface/60"
            />
          </div>

          {draft.skills.length > 0 && (
            <div>
              <div className="text-xs uppercase text-muted-foreground">Habilidades buscadas</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {draft.skills.map((s) => (
                  <span key={s} className="rounded-full bg-surface px-3 py-1 text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {draft.deliverables.length > 0 && (
            <div>
              <div className="text-xs uppercase text-muted-foreground">Entregables sugeridos</div>
              <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                {draft.deliverables.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            className="w-full bg-gradient-primary shadow-glow"
            disabled={publishMutation.isPending || !draft.title.trim() || !draft.description.trim()}
            onClick={() => publishMutation.mutate()}
          >
            {publishMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Publicar en WorkConnect
          </Button>
        </div>
      )}
    </div>
  );
}
