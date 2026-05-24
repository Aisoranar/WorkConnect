import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { CareerLoadingPhase } from "@/hooks/use-career-ai-loading";

type CareerAiLoadingModalProps = {
  open: boolean;
  phase: CareerLoadingPhase;
  title: string;
  subtitle?: string;
  steps: string[];
  progress: number;
  currentStepIndex: number;
  isFinalizing?: boolean;
};

export function CareerAiLoadingModal({
  open,
  phase,
  title,
  subtitle,
  steps,
  progress,
  currentStepIndex,
  isFinalizing = false,
}: CareerAiLoadingModalProps) {
  const pct = Math.min(100, Math.round(progress));
  const isSuccess = phase === "success" || phase === "closing";
  const isClosing = phase === "closing";
  const stepLabel = isSuccess
    ? "Análisis completado con éxito"
    : isFinalizing
      ? "Finalizando respuesta de la IA…"
      : (steps[currentStepIndex] ?? steps[steps.length - 1] ?? "Procesando…");

  return (
    <Dialog open={open}>
      <DialogContent
        className={cn(
          "max-w-md overflow-hidden border-primary/20 bg-background/95 backdrop-blur-md transition-all duration-500 sm:max-w-md [&>button]:hidden",
          isClosing && "scale-95 opacity-0",
          isSuccess && !isClosing && "border-primary/40 shadow-[0_0_40px_-8px_hsl(var(--primary)/0.45)]",
        )}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {isSuccess ? (
          <div className="relative py-2">
            <div
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.18),transparent_70%)]"
              aria-hidden
            />
            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  "relative flex h-20 w-20 items-center justify-center rounded-full",
                  "bg-gradient-to-br from-primary/30 to-primary-glow/10 ring-2 ring-primary/50",
                  !isClosing && "animate-in zoom-in-50 duration-500",
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 rounded-full bg-primary/20",
                    !isClosing && "animate-ping",
                  )}
                  aria-hidden
                />
                <CheckCircle2
                  className={cn(
                    "relative h-11 w-11 text-primary-glow",
                    !isClosing && "animate-in zoom-in-75 duration-700 delay-150",
                  )}
                />
              </div>

              <DialogHeader className="mt-5 space-y-2">
                <DialogTitle className="flex items-center justify-center gap-2 font-display text-xl">
                  <Sparkles className="h-5 w-5 text-primary-glow" />
                  ¡Listo!
                </DialogTitle>
                <DialogDescription className="text-center text-sm">
                  <span className="block font-medium text-foreground">{title}</span>
                  <span className="mt-1 block text-muted-foreground">
                    Resultado generado. Revísalo en la pestaña.
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 w-full">
                <Progress value={100} className="h-1.5 opacity-80" />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {steps.length} pasos completados · 100%
                </p>
              </div>

              <ul className="mt-4 max-h-[140px] w-full space-y-1 overflow-y-auto rounded-lg border border-primary/20 bg-primary/5 p-2 text-left">
                {steps.map((step, i) => (
                  <li
                    key={`${i}-${step}`}
                    className="flex items-center gap-2 text-[11px] text-foreground/80"
                  >
                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary/30 text-[8px] text-primary-glow">
                      ✓
                    </span>
                    <span className="line-clamp-1">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display">
                <Loader2 className="h-5 w-5 animate-spin text-primary-glow" />
                {title}
              </DialogTitle>
              <DialogDescription>
                {subtitle && (
                  <span className="block font-medium text-foreground/90">{subtitle}</span>
                )}
                <span className="mt-1 block">
                  NVIDIA Developers está procesando tu solicitud. No cierres esta ventana.
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="flex items-end justify-between gap-2 text-sm">
                <span className="line-clamp-2 font-medium text-foreground">{stepLabel}</span>
                <span className="shrink-0 tabular-nums text-primary-glow">{pct}%</span>
              </div>

              <Progress value={pct} className="h-2" />

              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>
                  Paso {Math.min(currentStepIndex + 1, steps.length)} de {steps.length}
                  {currentStepIndex > 0 && (
                    <span className="text-foreground/50"> · {currentStepIndex} completados</span>
                  )}
                </span>
                <span>
                  {isFinalizing ? "Un momento más…" : pct < 80 ? "En progreso…" : "Casi listo…"}
                </span>
              </div>

              <div className="rounded-lg border border-border/60 bg-surface/40">
                <div className="border-b border-border/50 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Pipeline de análisis
                  </p>
                </div>
                <ul className="max-h-[220px] space-y-0 overflow-y-auto p-2 pr-1">
                  {steps.map((step, i) => {
                    const status =
                      i < currentStepIndex ? "done" : i === currentStepIndex ? "active" : "pending";

                    return (
                      <li
                        key={`${i}-${step}`}
                        className={cn(
                          "flex items-start gap-2 rounded-md px-1.5 py-1.5 text-xs transition-colors",
                          status === "done" && "text-foreground/75",
                          status === "active" && "bg-primary/10 font-medium text-primary-glow",
                          status === "pending" && "text-muted-foreground/55",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] transition-all",
                            status === "done" && "bg-primary/25 text-primary-glow",
                            status === "active" && "animate-pulse bg-primary/35 ring-2 ring-primary/40",
                            status === "pending" && "bg-muted text-muted-foreground",
                          )}
                        >
                          {status === "done" ? "✓" : i + 1}
                        </span>
                        <span className="leading-snug">
                          {step}
                          {status === "active" && (
                            <span className="ml-1 inline-block animate-pulse text-[10px] text-primary-glow/80">
                              …
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                {isFinalizing
                  ? "La IA está cerrando el análisis; suele ser cuestión de segundos."
                  : "Suele tardar entre 8 y 25 segundos con el modelo rápido de NVIDIA."}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
