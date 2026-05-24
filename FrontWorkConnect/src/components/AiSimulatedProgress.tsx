import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IsoLogo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const STEPS = [
  "Analizando tu necesidad…",
  "Definiendo alcance del proyecto…",
  "Sugiriendo tecnologías…",
  "Redactando requerimiento…",
  "Finalizando borrador…",
] as const;

type AiSimulatedProgressProps = {
  active: boolean;
  className?: string;
};

export function AiSimulatedProgress({ active, className }: AiSimulatedProgressProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % STEPS.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-100 flex items-center justify-center bg-background/75 px-6 backdrop-blur-md animate-in fade-in duration-200",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Procesando con IA"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="iso-loader-shell iso-loader-shell--auto">
          <IsoLogo theme="auto" alt="" className="iso-loader-spin size-16 sm:size-20" />
        </div>
        <p
          key={stepIndex}
          className="mt-6 font-display text-base font-semibold text-foreground animate-in fade-in duration-300 sm:text-lg"
        >
          {STEPS[stepIndex]}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          La IA está estructurando tu proyecto
        </p>
      </div>
    </div>,
    document.body,
  );
}
