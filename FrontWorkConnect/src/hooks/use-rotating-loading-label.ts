import { useEffect, useState } from "react";

/**
 * Rota mensajes de carga mientras `active` es true.
 */
export function useRotatingLoadingLabel(
  messages: readonly string[],
  active = true,
  intervalMs = 2200,
): { label: string; stepIndex: number } {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!active || messages.length === 0) {
      setStepIndex(0);
      return;
    }

    const id = window.setInterval(() => {
      setStepIndex((prev) => (prev + 1) % messages.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [active, messages, intervalMs]);

  const label = messages.length > 0 ? messages[stepIndex % messages.length] : "";

  return { label, stepIndex };
}
