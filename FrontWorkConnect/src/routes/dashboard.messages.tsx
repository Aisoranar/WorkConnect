import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMessages, queryKeys } from "@/lib/api";
import { ApiState } from "@/components/ApiState";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/dashboard/messages")({
  component: Messages,
});

function Messages() {
  const isMobile = useIsMobile();
  const { data: messages = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.messages,
    queryFn: fetchMessages,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  const resolvedActiveId = activeId ?? messages[0]?.id ?? null;
  const active = messages.find((m) => m.id === resolvedActiveId);

  const thread = active
    ? [
        { from: "them", text: `Hola María, vi tu portfolio y me encantó.` },
        { from: "me", text: `¡Gracias! Cuéntame más sobre el proyecto.` },
        { from: "them", text: active.preview },
      ]
    : [];

  function selectConversation(id: string) {
    setActiveId(id);
    if (isMobile) setShowThread(true);
  }

  function backToList() {
    setShowThread(false);
  }

  const showList = !isMobile || !showThread;
  const showConversation = !isMobile || showThread;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">
          <span className="text-gradient">Mensajes</span>
        </h1>
        <p className="mt-1 text-muted-foreground">Conversaciones con clientes y colaboradores.</p>
      </div>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        {!active ? (
          <p className="text-sm text-muted-foreground">No hay conversaciones.</p>
        ) : (
          <div className="card-paper grid h-[min(600px,calc(100dvh-11rem))] overflow-hidden md:grid-cols-[minmax(0,320px)_1fr]">
            {showList && (
              <div className={`border-border bg-surface/30 ${showConversation && !isMobile ? "border-r" : "md:border-r"}`}>
                {messages.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selectConversation(m.id)}
                    className={`flex w-full items-center gap-3 border-b border-border/50 p-3 text-left transition hover:bg-surface/60 sm:p-4 ${
                      resolvedActiveId === m.id ? "bg-surface/70" : ""
                    }`}
                  >
                    <div className="logo-mark h-9 w-9 shrink-0 rounded-full text-sm font-semibold sm:h-10 sm:w-10">
                      {m.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{m.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{m.time}</span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{m.preview}</p>
                    </div>
                    {m.unread > 0 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {m.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {showConversation && (
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-2 border-b border-border bg-surface/30 px-3 py-3 sm:gap-3 sm:px-6 sm:py-4">
                  {isMobile && (
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={backToList} aria-label="Volver">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="logo-mark h-9 w-9 shrink-0 rounded-full text-sm font-semibold sm:h-10 sm:w-10">
                    {active.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{active.name}</div>
                    <div className="text-xs text-success">● En línea</div>
                  </div>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-6">
                  {thread.map((msg, i) => (
                    <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm sm:max-w-[75%] sm:px-4 sm:py-2.5 ${
                          msg.from === "me"
                            ? "rounded-organic-md bg-primary text-primary-foreground"
                            : "border border-border bg-surface/60"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 border-t border-border bg-surface/30 p-3 sm:p-4">
                  <input
                    placeholder="Escribe un mensaje…"
                    className="min-w-0 flex-1 rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary sm:px-4 sm:py-2.5"
                  />
                  <Button size="icon" className="shrink-0" aria-label="Enviar">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </ApiState>
    </div>
  );
}
