import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMessages,
  fetchChatMessages,
  sendChatMessage,
  fetchMe,
  queryKeys,
  type ChatMessageItem,
} from "@/lib/api";
import { ApiState } from "@/components/ApiState";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/messages")({
  component: Messages,
});

function Messages() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: queryKeys.me, queryFn: fetchMe });
  const myId = meQuery.data?.id;

  const {
    data: conversations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.messages,
    queryFn: fetchMessages,
  });

  const [activeContactId, setActiveContactId] = useState<number | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((m) => String(m.id) === String(activeContactId));

  const chatQuery = useQuery({
    queryKey: ["chat-messages", activeContactId],
    queryFn: () => fetchChatMessages(activeContactId!),
    enabled: activeContactId !== null,
    refetchInterval: 5000,
  });

  const sendMut = useMutation({
    mutationFn: (msg: string) => sendChatMessage(activeContactId!, msg),
    onSuccess: () => {
      setNewMessage("");
      void queryClient.invalidateQueries({ queryKey: ["chat-messages", activeContactId] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatQuery.data]);

  function selectConversation(id: string) {
    setActiveContactId(Number(id));
    if (isMobile) setShowThread(true);
  }

  function handleSend() {
    const text = newMessage.trim();
    if (!text || !activeContactId) return;
    sendMut.mutate(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const showList = !isMobile || !showThread;
  const showConversation = !isMobile || showThread;
  const chatMessages: ChatMessageItem[] = chatQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">
          <span className="text-gradient">Mensajes</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Conversaciones con clientes y colaboradores.
        </p>
      </div>

      <ApiState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
        {conversations.length === 0 ? (
          <div className="card-paper flex flex-col items-center gap-3 p-10 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay conversaciones aún. Cuando alguien te contacte o apliques a un proyecto, los
              mensajes aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="card-paper grid h-[min(600px,calc(100dvh-11rem))] overflow-hidden md:grid-cols-[minmax(0,320px)_1fr]">
            {showList && (
              <div
                className={`border-border bg-surface/30 overflow-y-auto ${showConversation && !isMobile ? "border-r" : "md:border-r"}`}
              >
                {conversations.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selectConversation(m.id)}
                    className={`row-enterprise flex w-full items-center gap-3 border-b border-border/50 p-3 text-left sm:p-4 ${
                      String(activeContactId) === m.id ? "bg-surface/70" : ""
                    }`}
                  >
                    <div className="logo-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold sm:h-10 sm:w-10">
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

            {showConversation && activeConv && (
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-2 border-b border-border bg-surface/30 px-3 py-3 sm:gap-3 sm:px-6 sm:py-4">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setShowThread(false)}
                      aria-label="Volver"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="logo-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold sm:h-10 sm:w-10">
                    {activeConv.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{activeConv.name}</div>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-6">
                  {chatQuery.isLoading && (
                    <p className="text-center text-xs text-muted-foreground">Cargando mensajes...</p>
                  )}
                  {chatMessages.map((msg) => {
                    const isMine = msg.sender_id === myId;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm sm:max-w-[75%] sm:px-4 sm:py-2.5 ${
                            isMine
                              ? "rounded-organic-md bg-primary text-primary-foreground"
                              : "border border-border bg-surface/60"
                          }`}
                        >
                          {msg.message}
                          <div
                            className={`mt-1 text-[10px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString("es-CO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 border-t border-border bg-surface/30 p-3 sm:p-4">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="min-w-0 flex-1 rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary sm:px-4 sm:py-2.5"
                    disabled={sendMut.isPending}
                  />
                  <Button
                    size="icon"
                    className="shrink-0"
                    aria-label="Enviar"
                    disabled={!newMessage.trim() || sendMut.isPending}
                    onClick={handleSend}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {showConversation && !activeConv && (
              <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Selecciona una conversación para ver los mensajes.
                </p>
              </div>
            )}
          </div>
        )}
      </ApiState>
    </div>
  );
}
