import { useCallback, useEffect, useState } from "react";

/**
 * Progreso simulado mientras la IA responde (no hay streaming real en el API).
 * Sube hasta ~94% y salta a 100% al terminar; el padre decide cuándo resetear.
 */
export function useSimulatedAiProgress(
  isActive: boolean,
  stepCount: number,
  enabled = true,
) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const reset = useCallback(() => {
    setProgress(0);
    setStepIndex(0);
    setIsComplete(false);
  }, []);

  useEffect(() => {
    if (!enabled || !isActive) {
      return;
    }

    setIsComplete(false);
    setProgress(8);
    setStepIndex(0);

    const intervalMs = stepCount > 6 ? 520 : 450;
    const increment = stepCount > 6 ? 1.5 : 2;

    const tick = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev >= 94 ? 94 : prev + increment + Math.random() * (stepCount > 6 ? 3.5 : 5);
        const idx = Math.min(stepCount - 1, Math.floor((next / 100) * stepCount));
        setStepIndex(idx);
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(tick);
  }, [isActive, stepCount, enabled]);

  useEffect(() => {
    if (isActive || !enabled || isComplete) {
      return;
    }

    setProgress(100);
    setStepIndex(Math.max(0, stepCount - 1));
    setIsComplete(true);
  }, [isActive, stepCount, enabled, isComplete]);

  return { progress, stepIndex, isComplete, reset };
}
