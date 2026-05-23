import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Wand2, Loader2, Send } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { createJob, queryKeys, structureProjectBrief, type StructuredProject } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard/publish")({
  beforeLoad: () => {
    const user = getStoredUser();
    if (user && user.role !== "client" && user.role !== "admin") {
      throw redirect({ to: "/dashboard/explore" });
    }
  },
  component: PublishProjectPage,
});

function PublishProjectPage() {
  const queryClient = useQueryClient();
  const [rawNeed, setRawNeed] = useState(
    "Vendo productos en mi ciudad y necesito una página sencilla para que la gente me encuentre y me contacte por WhatsApp.",
  );
  const [budget, setBudget] = useState("800");
  const [businessContext, setBusinessContext] = useState("");
  const [structured, setStructured] = useState<StructuredProject | null>(null);

  const structureMutation = useMutation({
    mutationFn: () =>
      structureProjectBrief({
        raw_need: rawNeed,
        budget,
        business_context: businessContext || undefined,
      }),
    onSuccess: (data) => {
      setStructured(data);
      toast.success("Requerimiento listo para jóvenes talento");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      createJob({
        title: structured!.title,
        description: structured!.description,
        budget: structured!.budget,
        category: structured!.category,
        remote: structured!.remote,
        skills: structured!.skills,
        company: getStoredUser()?.name,
      }),
    onSuccess: () => {
      toast.success("Proyecto publicado. Los jóvenes ya pueden postular.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
      setStructured(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Publicar proyecto</h1>
        <p className="mt-2 text-muted-foreground">
          Cuéntanos tu necesidad en tus palabras. La IA la convierte en un requerimiento claro para
          jóvenes que buscan experiencia — sin pagar un equipo completo.
        </p>
      </div>

      <div className="card-gradient space-y-5 rounded-2xl border border-border p-6 shadow-card">
        <div className="space-y-2">
          <Label>¿Qué necesitas resolver? (como se lo contarías a un amigo)</Label>
          <Textarea
            value={rawNeed}
            onChange={(e) => setRawNeed(e.target.value)}
            rows={4}
            className="border-border bg-surface/60"
            placeholder="Ej: Tengo un negocio de distribución, necesito una web simple para que me contacten..."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Presupuesto disponible (USD)</Label>
            <Input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="500"
              className="border-border bg-surface/60"
            />
          </div>
          <div className="space-y-2">
            <Label>Tu negocio (opcional)</Label>
            <Input
              value={businessContext}
              onChange={(e) => setBusinessContext(e.target.value)}
              placeholder="Ej: Distribución de alimentos · Barranquilla"
              className="border-border bg-surface/60"
            />
          </div>
        </div>
        <Button
          className="bg-gradient-primary shadow-glow"
          disabled={structureMutation.isPending || rawNeed.length < 20}
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

      {structured && (
        <div className="card-gradient space-y-5 rounded-2xl border border-primary/30 p-6 shadow-card">
          <div className="flex items-center gap-2 text-sm text-primary-glow">
            <Sparkles className="h-4 w-4" />
            {structured.summary}
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Título del proyecto</div>
            <div className="font-display text-xl font-semibold">{structured.title}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Descripción (lo que verán los jóvenes)</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{structured.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-border px-3 py-1 text-xs">{structured.category}</span>
            <span className="rounded-full border border-border px-3 py-1 text-xs">{structured.budget}</span>
            {structured.skills.map((s) => (
              <span key={s} className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary-glow">
                {s}
              </span>
            ))}
          </div>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {structured.deliverables.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <Button
            className="w-full bg-gradient-primary shadow-glow"
            disabled={publishMutation.isPending}
            onClick={() => publishMutation.mutate()}
          >
            {publishMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Publicar y recibir postulaciones
          </Button>
        </div>
      )}
    </div>
  );
}
