import { useState } from "react";
import {
  AlertTriangle,
  Copy,
  FileText,
  Lightbulb,
  Linkedin,
  Loader2,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { CareerCvResult, CareerLinkedInResult } from "@/lib/api";
import { CareerLinkedInPanel } from "@/components/career/CareerLinkedInPanel";
import { toast } from "sonner";

type CareerCvStudioProps = {
  uiLocked: boolean;
  cvLoading: boolean;
  linkedinLoading: boolean;
  cvResult: CareerCvResult | null;
  linkedinResult: CareerLinkedInResult | null;
  candidateName?: string;
  profileLinkedIn?: string | null;
  onGenerateCv: (payload: {
    target_role?: string;
    offer_text?: string;
    cv_draft?: string;
  }) => void;
  onImproveLinkedIn: (payload?: { cv_text?: string; target_role?: string }) => void;
};

const sectionLabels: Record<string, string> = {
  summary: "Resumen profesional",
  skills: "Habilidades",
  experience: "Experiencia",
  projects: "Proyectos",
  education: "Educación",
};

function KeywordChips({ items, variant }: { items: string[]; variant: "ok" | "add" }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((kw) => (
        <span
          key={kw}
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
            variant === "ok"
              ? "border-primary/30 bg-primary/10 text-primary-glow"
              : "border-amber-500/30 bg-amber-500/10 text-amber-200",
          )}
        >
          {kw}
        </span>
      ))}
    </div>
  );
}

export function CareerCvStudio({
  uiLocked,
  cvLoading,
  linkedinLoading,
  cvResult,
  linkedinResult,
  candidateName,
  profileLinkedIn,
  onGenerateCv,
  onImproveLinkedIn,
}: CareerCvStudioProps) {
  const [targetRole, setTargetRole] = useState("");
  const [offerContext, setOfferContext] = useState("");
  const [cvDraft, setCvDraft] = useState("");
  const [activeSection, setActiveSection] = useState<string>("full");

  function handleGenerate(fromDraft: boolean) {
    onGenerateCv({
      target_role: targetRole.trim() || undefined,
      offer_text: offerContext.trim() || undefined,
      cv_draft: fromDraft ? cvDraft.trim() || undefined : undefined,
    });
  }

  const sections = cvResult?.sections ?? {};
  const sectionKeys = Object.keys(sections).filter((k) => sections[k]?.trim());

  return (
    <div className="space-y-4">
      <div className="card-paper overflow-hidden p-0">
        <div className="border-b border-border bg-gradient-to-br from-primary/15 via-transparent to-transparent p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold sm:text-xl">
            <FileText className="h-5 w-5 text-primary-glow" />
            Estudio de CV con IA
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Genera o mejora tu currículum optimizado para ATS: palabras clave, bullets con impacto,
            puntuación y adaptación a una vacante concreta.
          </p>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cv-target-role" className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary-glow" />
                Puesto objetivo
              </Label>
              <Input
                id="cv-target-role"
                placeholder="Ej: Desarrollador Full Stack Junior"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                disabled={uiLocked}
                className="border-border bg-surface/60"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cv-offer">Vacante (opcional — adapta keywords)</Label>
              <Textarea
                id="cv-offer"
                rows={3}
                placeholder="Pega requisitos de la oferta para personalizar el CV…"
                value={offerContext}
                onChange={(e) => setOfferContext(e.target.value)}
                disabled={uiLocked}
                className="border-border bg-surface/60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cv-draft">Tu CV actual (opcional — para mejorarlo)</Label>
            <Textarea
              id="cv-draft"
              rows={5}
              placeholder="Pega aquí tu CV si ya tienes uno y quieres que la IA lo refine…"
              value={cvDraft}
              onChange={(e) => setCvDraft(e.target.value)}
              disabled={uiLocked}
              className="border-border bg-surface/60 font-mono text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-gradient-primary"
              disabled={uiLocked}
              onClick={() => handleGenerate(false)}
            >
              {cvLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {cvLoading ? "Optimizando…" : "Generar CV con IA"}
            </Button>
            <Button
              variant="outline"
              disabled={uiLocked || !cvDraft.trim()}
              onClick={() => handleGenerate(true)}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Mejorar mi CV actual
            </Button>
            <Button
              variant="outline"
              disabled={uiLocked}
              onClick={() => onImproveLinkedIn({ target_role: targetRole.trim() || undefined })}
            >
              {linkedinLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Linkedin className="mr-2 h-4 w-4" />
              )}
              Optimizar LinkedIn
            </Button>
          </div>
        </div>
      </div>

      {cvResult && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card-paper p-4 sm:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Puntuación ATS
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-primary-glow">
                {cvResult.ats_score ?? 0}%
              </p>
              <Progress value={cvResult.ats_score ?? 0} className="mt-3 h-2" />
              {cvResult.role_fit_summary && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {cvResult.role_fit_summary}
                </p>
              )}
            </div>

            <div className="card-paper p-4 sm:col-span-1 lg:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Palabras clave ATS
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">Incluidas / detectadas</p>
              <div className="mt-1.5">
                <KeywordChips items={cvResult.ats_keywords ?? []} variant="ok" />
              </div>
              {(cvResult.keywords_to_add?.length ?? 0) > 0 && (
                <>
                  <p className="mt-3 text-[11px] text-muted-foreground">Conviene añadir</p>
                  <div className="mt-1.5">
                    <KeywordChips items={cvResult.keywords_to_add} variant="add" />
                  </div>
                </>
              )}
            </div>
          </div>

          {(cvResult.improvements?.length > 0 || cvResult.format_tips?.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {cvResult.improvements?.length > 0 && (
                <div className="card-paper p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-glow">
                    <Sparkles className="h-4 w-4" />
                    Mejoras aplicadas
                  </h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {cvResult.improvements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {cvResult.format_tips?.length > 0 && (
                <div className="card-paper p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-glow">
                    <Lightbulb className="h-4 w-4" />
                    Tips de formato ATS
                  </h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {cvResult.format_tips.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {cvResult.red_flags?.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                Revisa antes de enviar
              </h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {cvResult.red_flags.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {cvResult.bullet_upgrades?.length > 0 && (
            <div className="card-paper p-4">
              <h3 className="text-sm font-semibold text-primary-glow">Bullets mejorados</h3>
              <ul className="mt-3 space-y-3">
                {cvResult.bullet_upgrades.map((b, i) => (
                  <li key={i} className="rounded-lg border border-border bg-surface/30 p-3 text-sm">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {sectionLabels[b.section] ?? b.section}
                    </span>
                    <p className="mt-1 text-destructive/80 line-through">{b.before}</p>
                    <p className="mt-2 font-medium text-foreground">{b.after}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card-paper p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">CV listo para copiar</h3>
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant={activeSection === "full" ? "default" : "outline"}
                  onClick={() => setActiveSection("full")}
                >
                  Completo
                </Button>
                {sectionKeys.map((key) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={activeSection === key ? "default" : "outline"}
                    onClick={() => setActiveSection(key)}
                  >
                    {sectionLabels[key] ?? key}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const text =
                      activeSection === "full"
                        ? cvResult.cv_text
                        : (sections[activeSection] ?? cvResult.cv_text);
                    void navigator.clipboard.writeText(text);
                    toast.success("Copiado al portapapeles");
                  }}
                >
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  Copiar
                </Button>
              </div>
            </div>
            <pre className="mt-3 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-surface/40 p-4 text-xs leading-relaxed text-muted-foreground">
              {activeSection === "full"
                ? cvResult.cv_text
                : (sections[activeSection] ?? cvResult.cv_text)}
            </pre>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Fuente IA: {cvResult.source} · Descarga el PDF abajo o alinea LinkedIn con un clic.
            </p>
          </div>

          <CareerLinkedInPanel
            cvResult={cvResult}
            linkedinResult={linkedinResult}
            linkedinLoading={linkedinLoading}
            uiLocked={uiLocked}
            candidateName={candidateName}
            targetRole={targetRole}
            profileLinkedIn={profileLinkedIn}
            onSyncWithCv={() =>
              onImproveLinkedIn({
                cv_text: cvResult.cv_text,
                target_role: targetRole.trim() || undefined,
              })
            }
          />
        </>
      )}
    </div>
  );
}
