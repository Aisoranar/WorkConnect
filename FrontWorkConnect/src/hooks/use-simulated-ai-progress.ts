import { useCallback, useEffect, useState } from "react";

const RAMP_TARGET = 82;
const WAIT_CAP = 96;

/**
 * Progreso simulado: sube rápido hasta ~82%, luego avanza lento hasta 96% mientras la IA responde.
 */
export function useSimulatedAiProgress(
  isActive: boolean,
  stepCount: number,
  enabled = true,
) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const reset = useCallback(() => {
    setProgress(0);
    setStepIndex(0);
    setIsComplete(false);
    setIsFinalizing(false);
  }, []);

  useEffect(() => {
    if (!enabled || !isActive) {
      return;
    }

    setIsComplete(false);
    setIsFinalizing(false);
    setProgress(10);
    setStepIndex(0);

    const intervalMs = 380;

    const tick = window.setInterval(() => {
      setProgress((prev) => {
        let next: number;

        if (prev < RAMP_TARGET) {
          next = prev + 4 + Math.random() * 7;
          next = Math.min(RAMP_TARGET, next);
        } else {
          setIsFinalizing(true);
          next = prev + 0.35 + Math.random() * 0.55;
          next = Math.min(WAIT_CAP, next);
        }

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

    setIsFinalizing(false);
    setProgress(100);
    setStepIndex(Math.max(0, stepCount - 1));
    setIsComplete(true);
  }, [isActive, stepCount, enabled, isComplete]);

  return { progress, stepIndex, isComplete, isFinalizing, reset };
}
