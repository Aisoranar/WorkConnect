import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { until: 22, label: "Analizando tu necesidad…" },
  { until: 45, label: "Definiendo alcance del proyecto…" },
  { until: 68, label: "Sugiriendo tecnologías…" },
  { until: 88, label: "Redactando requerimiento…" },
  { until: 100, label: "Finalizando borrador…" },
] as const;

type AiSimulatedProgressProps = {
  active: boolean;
  className?: string;
};

export function AiSimulatedProgress({ active, className }: AiSimulatedProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }

    setProgress(4);

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current;
        return Math.min(92, current + 2 + Math.random() * 6);
      });
    }, 380);

    return () => window.clearInterval(interval);
  }, [active]);

  if (!active) return null;

  const display = Math.round(progress);
  const step =
    STEPS.find((s) => display <= s.until)?.label ?? STEPS[STEPS.length - 1].label;

  return (
    <div
      className={cn(
        "rounded-xl border border-primary/25 bg-primary/5 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-start gap-3">
        <div className="logo-mark h-9 w-9 shrink-0">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{step}</p>
            <span className="font-display shrink-0 text-sm font-bold text-primary-glow">{display}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface/80">
            <div
              className="h-full rounded-full bg-gradient-primary transition-[width] duration-300 ease-out"
              style={{ width: `${display}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            La IA está estructurando tu proyecto. Esto puede tardar unos segundos.
          </p>
        </div>
      </div>
    </div>
  );
}
