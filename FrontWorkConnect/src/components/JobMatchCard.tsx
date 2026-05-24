import { AlertTriangle, CheckCircle2, Clock, Sparkles, Users } from "lucide-react";
import type { Job } from "@/lib/types";
import { Button } from "@/components/ui/button";

const LOW_MATCH_THRESHOLD = 50;

type Props = {
  job: Job;
  onApply: () => void;
  onImproveMatch: () => void;
};

export function JobMatchCard({ job, onApply, onImproveMatch }: Props) {
  const isLowMatch = job.match < LOW_MATCH_THRESHOLD;

  return (
    <article className="card-list group flex flex-col p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="rounded-full bg-surface px-2.5 py-1 text-xs text-muted-foreground">
          {job.category}
        </span>
        {isLowMatch ? (
          <button
            type="button"
            onClick={onImproveMatch}
            className="flex max-w-[55%] items-center gap-1 rounded-full border border-warning/50 bg-warning/15 px-2.5 py-1 text-left text-xs font-semibold text-warning transition hover:bg-warning/25"
            title="Ver qué aprender para subir tu match"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular-nums">{job.match}%</span>
            <span className="hidden font-normal underline sm:inline">· ¿Por qué?</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onImproveMatch}
            className="flex items-center gap-1 rounded-full bg-trust/15 px-2.5 py-1 text-xs font-semibold text-trust-glow transition hover:bg-trust/25"
            title="Ver detalle de compatibilidad"
          >
            <Sparkles className="h-3 w-3" />
            {job.match}%
          </button>
        )}
      </div>

      {isLowMatch && (
        <button
          type="button"
          onClick={onImproveMatch}
          className="mb-3 w-full rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-left text-xs text-warning transition hover:bg-warning/10"
        >
          <span className="font-medium">Match bajo.</span>{" "}
          <span className="text-warning/90">
            Pulsa aquí: la IA te dirá qué aprender para poder postular.
          </span>
        </button>
      )}

      <h3 className="font-display text-lg font-semibold leading-snug">{job.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {job.skills.slice(0, 3).map((s) => (
          <span key={s} className="rounded-md border border-border bg-surface/60 px-2 py-0.5 text-xs">
            {s}
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {job.postedAgo}
        {job.applicants > 0 && (
          <>
            <span>·</span>
            <Users className="h-3.5 w-3.5" />
            {job.applicants} postulantes
          </>
        )}
      </div>
      <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
        <span className="font-display font-semibold">{job.budget}</span>
        {job.alreadyApplied ? (
          <Button size="sm" variant="secondary" className="w-full sm:w-auto" disabled>
            <CheckCircle2 className="mr-1 h-4 w-4" />
            {job.applicationStatus ?? "Postulado"}
          </Button>
        ) : (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {isLowMatch && (
              <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={onImproveMatch}>
                Mejorar match
              </Button>
            )}
            <Button size="sm" className="w-full sm:w-auto" onClick={onApply}>
              Postular
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

export { LOW_MATCH_THRESHOLD };
