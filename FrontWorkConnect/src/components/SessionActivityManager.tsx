import { useCallback, useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import {
  getLastSessionActivity,
  isAuthenticated,
  logout,
  SESSION_CHANGE_EVENT,
  SESSION_IDLE_MS,
  SESSION_PROMPT_MS,
  bootstrapSessionOnPageLoad,
  touchSessionActivity,
} from "@/lib/auth";
import { toast } from "sonner";

const IDLE_CHECK_MS = 15_000;
const ACTIVITY_THROTTLE_MS = 8_000;

function formatIdleDuration(ms: number): string {
  if (ms < 60_000) {
    const sec = Math.round(ms / 1000);
    return sec === 1 ? "1 segundo" : `${sec} segundos`;
  }
  const min = Math.round(ms / 60_000);
  return min === 1 ? "1 minuto" : `${min} minutos`;
}

export function SessionActivityManager() {
  const [sessionActive, setSessionActive] = useState(() => isAuthenticated());
  const [promptOpen, setPromptOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_PROMPT_MS / 1000);
  const promptOpenRef = useRef(false);
  const lastThrottleRef = useRef(0);

  useEffect(() => {
    const sync = () => setSessionActive(isAuthenticated());
    sync();
    window.addEventListener(SESSION_CHANGE_EVENT, sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(SESSION_CHANGE_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const performLogout = useCallback(async (reason: "timeout" | "manual") => {
    promptOpenRef.current = false;
    setPromptOpen(false);
    await logout();
    if (reason === "timeout") {
      toast.info("Sesión cerrada por inactividad.");
    }
    window.location.replace("/login");
  }, []);

  const registerActivity = useCallback(() => {
    if (!isAuthenticated() || promptOpenRef.current) {
      return;
    }
    const now = Date.now();
    if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) {
      return;
    }
    lastThrottleRef.current = now;
    touchSessionActivity();
  }, []);

  useEffect(() => {
    if (!sessionActive) {
      return;
    }

    bootstrapSessionOnPageLoad();

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted || isAuthenticated()) {
        bootstrapSessionOnPageLoad();
      }
    };
    window.addEventListener("pageshow", onPageShow);

    const events: (keyof WindowEventMap)[] = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "focus",
    ];

    for (const event of events) {
      window.addEventListener(event, registerActivity, { passive: true });
    }

    const idleTimer = window.setInterval(() => {
      if (!isAuthenticated() || !sessionActive || promptOpenRef.current) {
        return;
      }
      const idleFor = Date.now() - getLastSessionActivity();
      if (idleFor >= SESSION_IDLE_MS) {
        promptOpenRef.current = true;
        setPromptOpen(true);
      }
    }, IDLE_CHECK_MS);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      for (const event of events) {
        window.removeEventListener(event, registerActivity);
      }
      window.clearInterval(idleTimer);
    };
  }, [registerActivity, sessionActive]);

  useEffect(() => {
    if (!promptOpen) {
      return;
    }

    const totalSec = SESSION_PROMPT_MS / 1000;
    setSecondsLeft(totalSec);

    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(tick);
          void performLogout("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [promptOpen, performLogout]);

  const handleStay = () => {
    touchSessionActivity();
    lastThrottleRef.current = Date.now();
    promptOpenRef.current = false;
    setPromptOpen(false);
    toast.success(`Sesión extendida ${formatIdleDuration(SESSION_IDLE_MS)} más.`);
  };

  if (!sessionActive && !promptOpen) {
    return null;
  }

  const pct = Math.round((secondsLeft / (SESSION_PROMPT_MS / 1000)) * 100);

  return (
    <AlertDialog open={promptOpen}>
      <AlertDialogContent
        className="max-w-md border-primary/25"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 font-display">
            <Clock className="h-5 w-5 text-primary-glow" />
            ¿Sigues ahí?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Llevas más de {formatIdleDuration(SESSION_IDLE_MS)} sin actividad. Si sigues
                trabajando, confirma para mantener la sesión otros {formatIdleDuration(SESSION_IDLE_MS)}.
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Cierre automático</span>
                  <span className="tabular-nums font-medium text-foreground">{secondsLeft}s</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={() => void performLogout("manual")}>
            Cerrar sesión
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-gradient-primary"
            onClick={(e) => {
              e.preventDefault();
              handleStay();
            }}
          >
            Sigo aquí (+{formatIdleDuration(SESSION_IDLE_MS)})
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
