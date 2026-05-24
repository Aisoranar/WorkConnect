import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  Sparkles,
  Users,
  Wifi,
} from "lucide-react";
import * as React from "react";
import type { Job } from "@/lib/types";
import { LOW_MATCH_THRESHOLD } from "@/components/JobMatchCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const applicationStatusLabels: Record<string, string> = {
  pendiente: "Pendiente de respuesta",
  "en revisión": "En revisión",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

type Props = {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (job: Job) => void;
  onImproveMatch: (job: Job) => void;
};

export function JobDetailDialog({ job, open, onOpenChange, onApply, onImproveMatch }: Props) {
  if (!job) return null;

  const isLowMatch = job.match < LOW_MATCH_THRESHOLD;
  const applied = job.alreadyApplied;
  const statusLabel = job.applicationStatus
    ? applicationStatusLabels[job.applicationStatus] ?? job.applicationStatus
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-1rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="shrink-0 space-y-2 border-b border-border px-5 py-5 text-left sm:px-6">
          <div className="flex flex-wrap items-center gap-2 pr-6">
            <span className="text-sm text-muted-foreground">{job.company}</span>
            {job.isNew && <Badge className="bg-trust/15 text-trust-glow">Nuevo</Badge>}
            <Badge variant="outline">{job.category}</Badge>
            {job.status === "open" && (
              <Badge className="bg-success/15 text-success">Abierto</Badge>
            )}
          </div>
          <DialogTitle className="font-display text-xl leading-snug sm:text-2xl">
            {job.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalle del proyecto {job.title} de {job.company}
          </DialogDescription>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {isLowMatch ? (
              <button
                type="button"
                onClick={() => onImproveMatch(job)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-warning/50 bg-warning/15 px-3 py-1.5 text-sm font-semibold text-warning"
              >
                <AlertTriangle className="h-4 w-4" />
                Match {job.match}% · Mejorar con IA
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-trust/15 px-3 py-1.5 text-sm font-semibold text-trust-glow">
                <Sparkles className="h-4 w-4" />
                Compatibilidad {job.match}%
              </span>
            )}
            {job.match >= 85 && (
              <Badge className="border-primary/40 bg-primary/10 text-primary-glow">
                Alta compatibilidad
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoTile icon={<DollarSign className="h-4 w-4" />} label="Presupuesto" value={job.budget} />
            <InfoTile
              icon={<MapPin className="h-4 w-4" />}
              label="Ubicación"
              value={job.location}
            />
            <InfoTile
              icon={<Wifi className="h-4 w-4" />}
              label="Modalidad"
              value={job.remote ? "Remoto" : "Presencial"}
            />
            <InfoTile
              icon={<Users className="h-4 w-4" />}
              label="Postulantes"
              value={String(job.applicants)}
            />
            <InfoTile
              icon={<Clock className="h-4 w-4" />}
              label="Publicado"
              value={job.postedAgo}
              className="col-span-2 sm:col-span-4"
            />
          </section>

          {isLowMatch && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
              <p className="font-medium text-warning">Match bajo para postular con confianza</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Tu perfil aún no cubre varias skills clave de este proyecto. Usa el coach IA para ver
                qué aprender y subir tu porcentaje antes de enviar la propuesta.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 border-warning/40"
                onClick={() => {
                  onOpenChange(false);
                  onImproveMatch(job);
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Ver plan para mejorar match
              </Button>
            </div>
          )}

          {applied && (
            <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-glow" />
              <div>
                <p className="font-medium text-primary-glow">Ya postulaste a este proyecto</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Estado: <span className="capitalize">{statusLabel ?? job.applicationStatus}</span>
                </p>
                <Button asChild variant="link" className="mt-1 h-auto p-0 text-xs">
                  <Link
                    to="/dashboard/applications"
                    search={{ job: job.id }}
                    onClick={() => onOpenChange(false)}
                  >
                    Ver detalle de tu postulación →
                  </Link>
                </Button>
              </div>
            </div>
          )}

          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Briefcase className="h-4 w-4 text-primary-glow" />
              Descripción del cliente
            </h3>
            <p className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-surface/40 p-4 text-sm leading-relaxed text-muted-foreground">
              {job.description}
            </p>
          </section>

          {job.skills.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold">Habilidades requeridas</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-border bg-surface/60 px-3 py-1 text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="shrink-0 space-y-2 border-t border-border bg-background p-4 sm:flex sm:gap-2">
          {applied ? (
            <Button asChild variant="outline" className="w-full sm:flex-1">
              <Link
                to="/dashboard/applications"
                search={{ job: job.id }}
                onClick={() => onOpenChange(false)}
              >
                Ver mi postulación
              </Link>
            </Button>
          ) : (
            <>
              {isLowMatch && (
                <Button
                  variant="outline"
                  className="w-full sm:flex-1"
                  onClick={() => {
                    onOpenChange(false);
                    onImproveMatch(job);
                  }}
                >
                  Mejorar match
                </Button>
              )}
              <Button
                className="w-full bg-gradient-primary sm:flex-1"
                onClick={() => {
                  onOpenChange(false);
                  onApply(job);
                }}
              >
                Postular a este proyecto
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoTile({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-surface/30 p-3 ${className ?? ""}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold leading-snug">{value}</p>
    </div>
  );
}
