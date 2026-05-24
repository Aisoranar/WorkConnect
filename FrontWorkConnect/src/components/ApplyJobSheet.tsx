import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Sparkles, Wand2, Loader2, ShieldCheck } from "lucide-react";
import type { Job } from "@/lib/types";
import {
  fetchApplyContext,
  improveProposal,
  queryKeys,
  submitApplication,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ApplyJobSheetProps = {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ApplyJobSheet({ job, open, onOpenChange }: ApplyJobSheetProps) {
  const queryClient = useQueryClient();
  const jobId = job?.id;

  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");

  const contextQuery = useQuery({
    queryKey: ["apply-context", jobId],
    queryFn: () => fetchApplyContext(jobId!),
    enabled: open && Boolean(jobId),
  });

  useEffect(() => {
    if (contextQuery.data) {
      setMessage(contextQuery.data.proposal.message);
      setPrice(contextQuery.data.proposal.price);
      setDeliveryTime(contextQuery.data.proposal.delivery_time);
    }
  }, [contextQuery.data]);

  const improveMutation = useMutation({
    mutationFn: () => improveProposal(jobId!, message),
    onSuccess: (text) => {
      setMessage(text);
      toast.success("Propuesta mejorada con IA");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitApplication(jobId!, {
        proposal: message,
        price,
        delivery_time: deliveryTime,
      }),
    onSuccess: () => {
      toast.success("Propuesta y hoja de vida enviadas");
      void queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ctx = contextQuery.data;
  const cv = ctx?.cv;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] max-w-4xl overflow-y-auto border-border bg-background p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-4 py-4 text-left sm:px-6 sm:py-5">
          <DialogTitle className="font-display text-lg sm:text-xl">
            Aplicar a «{job?.title ?? "…"}»
          </DialogTitle>
          <DialogDescription>
            Esto es lo que verá el cliente: tu propuesta y tu hoja de vida.
          </DialogDescription>
        </DialogHeader>

        {contextQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Preparando tu postulación…
          </div>
        )}

        {contextQuery.isError && (
          <p className="px-6 py-8 text-sm text-destructive">{contextQuery.error.message}</p>
        )}

        {ctx && cv && (
          <div className="grid gap-0 lg:grid-cols-2">
            {/* Propuesta */}
            <div className="space-y-5 border-b border-border p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <div>
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-primary-glow">
                  Tu propuesta
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposal-message">Mensaje al cliente</Label>
                <Textarea
                  id="proposal-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="resize-none border-border bg-surface/60"
                />
                <p className="text-xs text-muted-foreground">
                  La IA puede mejorar tu propuesta antes de enviarla.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-primary/30"
                  disabled={improveMutation.isPending || !message.trim()}
                  onClick={() => improveMutation.mutate()}
                >
                  {improveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4 text-primary-glow" />
                  )}
                  Mejorar con IA
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="proposal-price">Precio (USD)</Label>
                  <Input
                    id="proposal-price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1200"
                    className="border-border bg-surface/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposal-time">Tiempo</Label>
                  <Input
                    id="proposal-time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="2 semanas"
                    className="border-border bg-surface/60"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Tu Trust Score y skills verificadas se enviarán automáticamente como parte de tu hoja
                de vida.
              </p>

              <Button
                className="w-full"
                disabled={submitMutation.isPending || !message.trim() || !price.trim()}
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Enviar propuesta + hoja de vida
              </Button>
            </div>

            {/* Preview CV */}
            <div className="bg-surface/20 p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Hoja de vida (preview)
                </h3>
                <span className="text-xs text-muted-foreground">Lo que verá el cliente</span>
              </div>

              <div className="card-paper p-5">
                <div className="flex gap-4">
                  <div className="logo-mark h-14 w-14 shrink-0 text-lg font-bold">
                    {cv.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-lg font-semibold">{cv.name}</h4>
                      {cv.verified && (
                        <ShieldCheck className="h-4 w-4 text-primary-glow" aria-label="Verificado" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{cv.headline}</p>
                    {cv.city && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {cv.city}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-surface/50 p-3 text-center">
                    <div className="text-xs text-muted-foreground">Trust Score</div>
                    <div className="font-display text-3xl font-bold text-gradient-trust">{cv.trust_score}</div>
                    <div className="text-xs text-trust-glow">{cv.trust_label}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-surface/50 p-3 text-center">
                    <div className="text-xs text-muted-foreground">Profesional</div>
                    <div className="font-display text-3xl font-bold">{cv.professional_score}</div>
                  </div>
                </div>

                {cv.bio && (
                  <div className="mt-5">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Sobre mí
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{cv.bio}</p>
                  </div>
                )}

                <div className="mt-5">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Skills verificadas
                  </div>
                  <ul className="space-y-1.5">
                    {cv.skills.map((s) => (
                      <li
                        key={s.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{s.name}</span>
                        <span className="text-muted-foreground">· {s.level}/5</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 rounded-xl border border-trust/30 bg-trust/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Match con este proyecto</span>
                    <span className="flex items-center gap-1 font-display text-2xl font-bold text-gradient-trust">
                      <Sparkles className="h-4 w-4 text-trust-glow" />
                      {cv.match}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Calculado por IA según skills y experiencia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
