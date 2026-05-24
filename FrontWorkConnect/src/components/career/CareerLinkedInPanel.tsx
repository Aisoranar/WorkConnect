import { Copy, Download, ExternalLink, Linkedin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CareerCvResult, CareerLinkedInResult } from "@/lib/api";
import {
  buildLinkedInCopyPack,
  defaultCvPdfFileName,
  downloadCvPdf,
  LINKEDIN_RESUME_HELP_URL,
  linkedInProfileOrHelpUrl,
} from "@/lib/cv-pdf";
import { toast } from "sonner";

type CareerLinkedInPanelProps = {
  cvResult: CareerCvResult | null;
  linkedinResult: CareerLinkedInResult | null;
  linkedinLoading: boolean;
  uiLocked: boolean;
  candidateName?: string;
  targetRole?: string;
  profileLinkedIn?: string | null;
  onSyncWithCv: () => void;
};

export function CareerLinkedInPanel({
  cvResult,
  linkedinResult,
  linkedinLoading,
  uiLocked,
  candidateName,
  targetRole,
  profileLinkedIn,
  onSyncWithCv,
}: CareerLinkedInPanelProps) {
  if (!cvResult && !linkedinResult) {
    return null;
  }

  const profileUrl = linkedInProfileOrHelpUrl(profileLinkedIn);

  function handleDownloadPdf(variant: "standard" | "linkedin") {
    if (!cvResult?.cv_text?.trim()) {
      toast.error("Genera primero tu CV con IA.");
      return;
    }
    try {
      downloadCvPdf({
        cvText: cvResult.cv_text,
        fileName: defaultCvPdfFileName(candidateName, variant),
        variant,
        candidateName,
        targetRole,
        linkedin: linkedinResult,
        profileUrl: profileLinkedIn ?? undefined,
      });
      toast.success(
        variant === "linkedin"
          ? "PDF listo para subir en LinkedIn"
          : "PDF descargado",
      );
    } catch {
      toast.error("No se pudo generar el PDF.");
    }
  }

  return (
    <div className="space-y-4">
      {cvResult && (
        <div className="card-paper border-primary/20 p-4 sm:p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Download className="h-5 w-5 text-primary-glow" />
            Descargar CV en PDF
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Texto seleccionable, una columna y tamaño apto para ATS y para la sección
            «Añadir currículum» de LinkedIn.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleDownloadPdf("standard")}>
              <Download className="mr-2 h-4 w-4" />
              PDF estándar (ATS)
            </Button>
            <Button
              className="bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90"
              onClick={() => handleDownloadPdf("linkedin")}
            >
              <Linkedin className="mr-2 h-4 w-4" />
              PDF para LinkedIn
            </Button>
          </div>
        </div>
      )}

      <div className="card-paper p-4 sm:p-5">
        <h3 className="flex items-center gap-2 font-semibold">
          <Linkedin className="h-5 w-5 text-[#0A66C2]" />
          Alinear perfil de LinkedIn
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Genera headline, «Acerca de» y bullets coherentes con tu CV. Luego sube el PDF y pega
          los textos en tu perfil.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={uiLocked || !cvResult}
            onClick={onSyncWithCv}
          >
            {linkedinLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Linkedin className="mr-2 h-4 w-4" />
            )}
            {linkedinLoading ? "Sincronizando…" : "Alinear LinkedIn con este CV"}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={profileUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1 h-4 w-4" />
              Abrir mi LinkedIn
            </a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={LINKEDIN_RESUME_HELP_URL} target="_blank" rel="noreferrer">
              Cómo subir el PDF
            </a>
          </Button>
        </div>

        {!cvResult && (
          <p className="mt-3 text-xs text-amber-200/90">
            Primero genera tu CV con IA para poder alinear LinkedIn y descargar el PDF.
          </p>
        )}
      </div>

      {linkedinResult && (
        <div className="card-paper p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground">Textos para tu perfil</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(
                  buildLinkedInCopyPack(linkedinResult, cvResult?.cv_text),
                );
                toast.success("Pack LinkedIn copiado");
              }}
            >
              <Copy className="mr-1 h-3.5 w-3.5" />
              Copiar todo
            </Button>
          </div>

          <div className="mt-4 space-y-4">
            <LinkedInField
              label="Headline"
              value={linkedinResult.headline}
              hint="Pégalo en el titular de tu perfil (máx. 220 caracteres)"
            />
            <LinkedInField
              label="Acerca de"
              value={linkedinResult.about}
              multiline
              hint="Sección «Acerca de» del perfil"
            />
            {linkedinResult.experience_bullets?.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Bullets de experiencia
                </p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {linkedinResult.experience_bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="text-primary-glow">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      linkedinResult.experience_bullets.map((x) => `• ${x}`).join("\n"),
                    );
                    toast.success("Bullets copiados");
                  }}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copiar bullets
                </Button>
              </div>
            )}
          </div>

          {(linkedinResult.upload_tips?.length ?? 0) > 0 && (
            <div className="mt-5 rounded-lg border border-[#0A66C2]/30 bg-[#0A66C2]/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#70b5f9]">
                Pasos en LinkedIn
              </p>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                {linkedinResult.upload_tips!.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
                <li>Descarga «PDF para LinkedIn» arriba y súbelo como currículum</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LinkedInField({
  label,
  value,
  hint,
  multiline,
}: {
  label: string;
  value: string;
  hint?: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-primary-glow">{label}</p>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            toast.success(`${label} copiado`);
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <p
        className={
          multiline
            ? "mt-2 whitespace-pre-wrap text-sm text-foreground"
            : "mt-2 text-sm font-medium text-foreground"
        }
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
