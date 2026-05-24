import { Link } from "@tanstack/react-router";
import {
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  Sparkles,
  Target,
} from "lucide-react";
import type { Application } from "@/lib/types";
import type { ProjectCoaching } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  "en revisión": "En revisión",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

const statusChip: Record<string, string> = {
  pendiente: "chip chip-muted",
  "en revisión": "chip chip-primary",
  aceptada: "chip chip-success",
  rechazada: "chip border-destructive/40 bg-destructive/10 text-destructive",
};

function formatSentDate(sentAt?: string, sentAgo?: string): string {
  if (sentAt) {
    try {
      return new Intl.DateTimeFormat("es", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(sentAt));
    } catch {
      /* fallback */
    }
  }
  return sentAgo ?? "—";
}

type Props = {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coaching?: ProjectCoaching | null;
  onRequestCoaching?: () => void;
  coachingLoading?: boolean;
};

export function ApplicationDetailSheet({
  application,
  open,
  onOpenChange,
  coaching,
  onRequestCoaching,
  coachingLoading,
}: Props) {
  if (!application) return null;

  const job = application.job;
  const statusLabel = statusLabels[application.status] ?? application.status;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 space-y-1 border-b border-border px-6 py-5 text-left">
          <div className="flex flex-wrap items-start justify-between gap-2 pr-8">
            <SheetTitle className="font-display text-lg leading-snug">{application.jobTitle}</SheetTitle>
            <span className={`shrink-0 capitalize ${statusChip[application.status] ?? "chip chip-muted"}`}>
              {statusLabel}
            </span>
          </div>
          <SheetDescription className="text-left">
            {application.company}
            {job?.category ? ` · ${job.category}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="grid grid-cols-2 gap-3 text-sm">
            <StatCard
              icon={<DollarSign className="h-4 w-4 text-primary-glow" />}
              label="Tu propuesta"
              value={application.price}
            />
            <StatCard
              icon={<Clock className="h-4 w-4 text-primary-glow" />}
              label="Plazo ofrecido"
              value={application.deliveryTime ?? "—"}
            />
            {application.match != null && (
              <StatCard
                icon={<Target className="h-4 w-4 text-primary-glow" />}
                label="Match al postular"
                value={`${application.match}%`}
              />
            )}
            <StatCard
              icon={<Calendar className="h-4 w-4 text-primary-glow" />}
              label="Enviada"
              value={formatSentDate(application.sentAt, application.sentAgo)}
              small
            />
          </section>

          {application.proposal && (
            <section>
              <h3 className="text-sm font-semibold">Tu mensaje al cliente</h3>
              <p className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-surface/40 p-4 text-sm leading-relaxed text-muted-foreground">
                {application.proposal}
              </p>
            </section>
          )}

          {job && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Briefcase className="h-4 w-4 text-primary-glow" />
                Detalle del proyecto
              </h3>
              <div className="rounded-xl border border-border bg-surface/30 p-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{job.budget}</Badge>
                  {job.remote && <Badge variant="secondary">Remoto</Badge>}
                  {job.status === "open" && <Badge className="bg-success/15 text-success">Abierto</Badge>}
                  {job.status !== "open" && (
                    <Badge variant="outline" className="capitalize">
                      Proyecto {job.status}
                    </Badge>
                  )}
                </div>
                {(job.location || job.remote) && (
                  <p className="mt-3 flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {job.location}
                  </p>
                )}
                {job.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary-glow"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                  {job.description}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground/80">
                  Publicado {job.postedAgo}
                </p>
              </div>
            </section>
          )}

          {application.status === "aceptada" && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary-glow" />
                Coaching para la entrega
              </h3>
              {coaching ? (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs">
                  <p className="font-medium text-primary-glow">
                    Match {coaching.match_percent}% · consejos IA
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                    {coaching.strengths_to_leverage.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  {coaching.delivery_tips.length > 0 && (
                    <>
                      <p className="mt-3 font-medium text-foreground">Entrega</p>
                      <ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
                        {coaching.delivery_tips.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {coaching.communication_tips.length > 0 && (
                    <>
                      <p className="mt-3 font-medium text-foreground">Comunicación</p>
                      <ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
                        {coaching.communication_tips.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ) : onRequestCoaching ? (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={coachingLoading}
                  onClick={onRequestCoaching}
                >
                  {coachingLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generar consejos con IA
                </Button>
              ) : null}
            </section>
          )}

          {application.status === "pendiente" && (
            <p className="rounded-lg border border-border/80 bg-muted/20 p-3 text-xs text-muted-foreground">
              El cliente está revisando tu propuesta. Te notificaremos cuando cambie el estado.
            </p>
          )}

          {application.status === "rechazada" && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-muted-foreground">
              Esta postulación no fue seleccionada. Puedes mejorar tu perfil y postular a proyectos similares
              en Explorar.
            </p>
          )}
        </div>

        <div className="shrink-0 space-y-2 border-t border-border bg-background p-4">
          {application.jobId && (
            <Button asChild variant="outline" className="w-full">
              <Link to="/dashboard/explore" onClick={() => onOpenChange(false)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver proyecto en explorar
              </Link>
            </Button>
          )}
          {application.status === "aceptada" && (
            <Button asChild className="w-full bg-gradient-primary">
              <Link to="/dashboard/messages" onClick={() => onOpenChange(false)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Ir a mensajes con el cliente
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatCard({
  icon,
  label,
  value,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/30 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`mt-1 font-semibold ${small ? "text-xs leading-snug" : "font-display"}`}>{value}</p>
    </div>
  );
}
