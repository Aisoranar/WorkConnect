import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMessages, queryKeys } from "@/lib/api";
import { ApiState } from "@/components/ApiState";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/messages")({
  component: Messages,
});

function Messages() {
  const { data: messages = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.messages,
    queryFn: fetchMessages,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const resolvedActiveId = activeId ?? messages[0]?.id ?? null;
  const active = messages.find((m) => m.id === resolvedActiveId);

  const thread = active
    ? [
        { from: "them", text: `Hola María, vi tu portfolio y me encantó.` },
        { from: "me", text: `¡Gracias! Cuéntame más sobre el proyecto.` },
        { from: "them", text: active.preview },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Mensajes</h1>
        <p className="mt-1 text-muted-foreground">Conversaciones con clientes y colaboradores.</p>
      </div>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        {!active ? (
          <p className="text-sm text-muted-foreground">No hay conversaciones.</p>
        ) : (
          <div className="card-gradient grid h-[600px] overflow-hidden rounded-2xl border border-border shadow-card md:grid-cols-[320px_1fr]">
            <div className="border-r border-border bg-surface/30">
              {messages.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveId(m.id)}
                  className={`flex w-full items-center gap-3 border-b border-border/50 p-4 text-left transition hover:bg-surface/60 ${
                    resolvedActiveId === m.id ? "bg-surface/70" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold">
                    {m.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.time}</span>
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

            <div className="flex flex-col">
              <div className="flex items-center gap-3 border-b border-border bg-surface/30 px-6 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold">
                  {active.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold">{active.name}</div>
                  <div className="text-xs text-success">● En línea</div>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-6">
                {thread.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.from === "me"
                          ? "bg-gradient-primary text-primary-foreground"
                          : "border border-border bg-surface/60"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-border bg-surface/30 p-4">
                <input
                  placeholder="Escribe un mensaje…"
                  className="flex-1 rounded-xl border border-border bg-surface/60 px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                />
                <Button size="icon" className="bg-gradient-primary shadow-glow">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </ApiState>
    </div>
  );
}
