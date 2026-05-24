import { useEffect, useRef, useState } from "react";
import type { CareerLoadingTask } from "@/components/career/career-loading-tasks";
import { useSimulatedAiProgress } from "@/hooks/use-simulated-ai-progress";

export type CareerLoadingPhase = "idle" | "loading" | "success" | "closing";

const SUCCESS_MS = 1600;
const CLOSE_MS = 450;

/**
 * Orquesta modal de IA: congela la tarea activa, muestra éxito y cierra sin quedar colgado.
 */
export function useCareerAiLoading(activeTask: CareerLoadingTask | null) {
  const [frozenTask, setFrozenTask] = useState<CareerLoadingTask | null>(null);
  const [phase, setPhase] = useState<CareerLoadingPhase>("idle");
  const wasLoadingRef = useRef(false);

  const isActive = activeTask !== null;
  const stepCount = frozenTask?.steps.length ?? activeTask?.steps.length ?? 1;

  const { progress, stepIndex, isComplete, reset } = useSimulatedAiProgress(
    isActive,
    stepCount,
    phase === "loading",
  );

  useEffect(() => {
    if (!activeTask) {
      return;
    }
    setFrozenTask(activeTask);
    setPhase("loading");
    wasLoadingRef.current = true;
    reset();
  }, [activeTask?.id, reset]);

  useEffect(() => {
    if (!isActive && wasLoadingRef.current && phase === "loading" && frozenTask) {
      wasLoadingRef.current = false;
      setPhase("success");
    }
  }, [isActive, phase, frozenTask]);

  useEffect(() => {
    if (phase !== "success") {
      return;
    }

    const toClosing = window.setTimeout(() => setPhase("closing"), SUCCESS_MS);
    return () => window.clearTimeout(toClosing);
  }, [phase]);

  useEffect(() => {
    if (phase !== "closing") {
      return;
    }

    const toIdle = window.setTimeout(() => {
      setPhase("idle");
      setFrozenTask(null);
      reset();
    }, CLOSE_MS);

    return () => window.clearTimeout(toIdle);
  }, [phase, reset]);

  const open = phase !== "idle";
  const displayProgress = phase === "success" || phase === "closing" ? 100 : progress;
  const displayStepIndex =
    phase === "success" || phase === "closing"
      ? Math.max(0, (frozenTask?.steps.length ?? 1) - 1)
      : stepIndex;

  return {
    open,
    phase,
    task: frozenTask,
    progress: displayProgress,
    stepIndex: displayStepIndex,
    isComplete: isComplete || phase === "success" || phase === "closing",
  };
}
