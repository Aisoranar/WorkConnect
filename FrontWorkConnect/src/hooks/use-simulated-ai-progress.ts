import { useEffect, useState } from "react";

/**
 * Progreso simulado mientras la IA responde (no hay streaming real en el API).
 * Sube hasta ~95% y salta a 100% al terminar.
 */
export function useSimulatedAiProgress(isActive: boolean, stepCount: number) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    setProgress(8);
    setStepIndex(0);

    const tick = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev >= 94 ? 94 : prev + 2 + Math.random() * 5;
        const idx = Math.min(stepCount - 1, Math.floor((next / 100) * stepCount));
        setStepIndex(idx);
        return next;
      });
    }, 450);

    return () => window.clearInterval(tick);
  }, [isActive, stepCount]);

  useEffect(() => {
    if (isActive) {
      return;
    }

    if (progress > 0 && progress < 100) {
      setProgress(100);
      setStepIndex(Math.max(0, stepCount - 1));
      const reset = window.setTimeout(() => {
        setProgress(0);
        setStepIndex(0);
      }, 700);
      return () => window.clearTimeout(reset);
    }
  }, [isActive, progress, stepCount]);

  return { progress, stepIndex };
}
