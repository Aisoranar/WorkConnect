import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useRotatingLoadingLabel } from "@/hooks/use-rotating-loading-label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Props = {
  messages: readonly string[];
  active?: boolean;
  className?: string;
  /** Muestra lista de pasos con el activo resaltado */
  showStepList?: boolean;
};

export function AiLoadingPanel({
  messages,
  active = true,
  className,
  showStepList = true,
}: Props) {
  const { label, stepIndex } = useRotatingLoadingLabel(messages, active);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }
    setProgress(12);
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 88) return p + (Math.random() > 0.7 ? 1 : 0);
        return Math.min(88, p + 4 + Math.random() * 10);
      });
    }, 450);
    return () => window.clearInterval(id);
  }, [active]);

  const visibleSteps = showStepList ? messages.slice(0, Math.min(5, messages.length)) : [];

  return (
    <div className={cn("space-y-5 py-6", className)}>
      <div className="relative flex justify-center">
        <div className="absolute h-14 w-14 animate-ping rounded-full bg-primary/20" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/30">
          <Sparkles className="h-6 w-6 text-primary-glow" />
        </div>
      </div>

      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-foreground transition-all duration-300">
          {label}
        </p>
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Procesando con IA
        </div>
      </div>

      <Progress value={progress} className="h-1.5 bg-surface" />

      {showStepList && visibleSteps.length > 0 && (
        <ul className="space-y-1.5 rounded-lg border border-border/60 bg-surface/30 p-3">
          {visibleSteps.map((step, i) => {
            const done = i < stepIndex % messages.length;
            const current = i === stepIndex % visibleSteps.length;

            return (
              <li
                key={step}
                className={cn(
                  "flex items-center gap-2 text-xs transition-colors duration-300",
                  current && "font-medium text-primary-glow",
                  done && !current && "text-muted-foreground",
                  !done && !current && "text-muted-foreground/45",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px]",
                    current && "bg-primary text-primary-foreground",
                    done && !current && "bg-success/20 text-success",
                    !done && !current && "bg-muted",
                  )}
                >
                  {done && !current ? "✓" : current ? "…" : ""}
                </span>
                <span className="line-clamp-1">{step}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
