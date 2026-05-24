import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type CareerAiLoadingModalProps = {
  open: boolean;
  title: string;
  steps: string[];
  progress: number;
  currentStepIndex: number;
};

export function CareerAiLoadingModal({
  open,
  title,
  steps,
  progress,
  currentStepIndex,
}: CareerAiLoadingModalProps) {
  const pct = Math.min(100, Math.round(progress));
  const stepLabel = steps[currentStepIndex] ?? steps[steps.length - 1] ?? "Procesando…";
  const done = pct >= 100;

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md border-primary/20 bg-background/95 backdrop-blur-md sm:max-w-md [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            {done ? (
              <Sparkles className="h-5 w-5 text-primary-glow" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-primary-glow" />
            )}
            {done ? "¡Listo!" : title}
          </DialogTitle>
          <DialogDescription>
            {done
              ? "Resultado generado. Puedes revisarlo en la pestaña."
              : "NVIDIA Developers está procesando tu solicitud. No cierres esta ventana."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-end justify-between gap-2 text-sm">
            <span className="font-medium text-foreground">{stepLabel}</span>
            <span className="tabular-nums text-primary-glow">{pct}%</span>
          </div>

          <Progress value={pct} className="h-2" />

          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>
              Paso {Math.min(currentStepIndex + 1, steps.length)} de {steps.length}
            </span>
            <span>{done ? "Completado" : pct < 94 ? "En progreso…" : "Casi listo…"}</span>
          </div>

          <ul className="space-y-1.5 rounded-lg border border-border/60 bg-surface/40 p-3">
            {steps.map((step, i) => {
              const status =
                done || i < currentStepIndex
                  ? "done"
                  : i === currentStepIndex
                    ? "active"
                    : "pending";

              return (
                <li
                  key={step}
                  className={cn(
                    "flex items-center gap-2 text-xs transition-colors",
                    status === "done" && "text-foreground/80",
                    status === "active" && "font-medium text-primary-glow",
                    status === "pending" && "text-muted-foreground/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px]",
                      status === "done" && "bg-primary/20 text-primary-glow",
                      status === "active" && "bg-primary/30 ring-1 ring-primary/50",
                      status === "pending" && "bg-muted",
                    )}
                  >
                    {status === "done" ? "✓" : i + 1}
                  </span>
                  {step}
                </li>
              );
            })}
          </ul>

          {!done && (
            <p className="text-center text-[11px] text-muted-foreground">
              Suele tardar entre 15 y 60 segundos según la carga del servidor de IA.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
