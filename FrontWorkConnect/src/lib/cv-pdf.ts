import { jsPDF } from "jspdf";
import type { CareerLinkedInResult } from "@/lib/api";

export type CvPdfVariant = "standard" | "linkedin";

export type DownloadCvPdfOptions = {
  cvText: string;
  fileName: string;
  variant?: CvPdfVariant;
  candidateName?: string;
  targetRole?: string;
  linkedin?: CareerLinkedInResult | null;
  profileUrl?: string | null;
};

const MARGIN_MM = 16;
const LINE_HEIGHT_MM = 5.2;
const TITLE_SIZE = 14;
const BODY_SIZE = 10;
const SMALL_SIZE = 9;

function slugifyFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
}

function buildLinkedInPdfBody(options: DownloadCvPdfOptions): string {
  const parts: string[] = [];
  const li = options.linkedin;

  if (li?.headline) {
    parts.push(li.headline.toUpperCase());
    parts.push("");
  } else if (options.targetRole) {
    parts.push(options.targetRole.toUpperCase());
    parts.push("");
  }

  if (options.candidateName) {
    parts.push(options.candidateName);
  }
  if (options.profileUrl) {
    parts.push(options.profileUrl);
  }
  if (parts.length > 0) {
    parts.push("");
  }

  parts.push(options.cvText.trim());

  if (li?.about) {
    parts.push("");
    parts.push("ACERCA DE (LinkedIn)");
    parts.push(li.about.trim());
  }

  return parts.join("\n");
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  pageHeight: number,
  bottomMargin: number,
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  let y = startY;

  for (const line of lines) {
    if (y > pageHeight - bottomMargin) {
      doc.addPage();
      y = MARGIN_MM;
    }
    doc.text(line, x, y);
    y += LINE_HEIGHT_MM;
  }

  return y;
}

/**
 * PDF con texto seleccionable (ATS / LinkedIn). Una columna, Helvetica, A4.
 */
export function downloadCvPdf(options: DownloadCvPdfOptions): void {
  const variant = options.variant ?? "standard";
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - MARGIN_MM * 2;
  let y = MARGIN_MM;

  if (variant === "linkedin") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(TITLE_SIZE);
    y = addWrappedText(doc, "CURRICULUM VITAE", MARGIN_MM, y, maxWidth, pageHeight, MARGIN_MM);
    y += 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(SMALL_SIZE);
    doc.setTextColor(80, 80, 80);
    y = addWrappedText(
      doc,
      "Formato optimizado para subir en LinkedIn (Perfil → Añadir sección → Recomendado → Añadir currículum)",
      MARGIN_MM,
      y,
      maxWidth,
      pageHeight,
      MARGIN_MM,
    );
    doc.setTextColor(0, 0, 0);
    y += 4;
  }

  const body =
    variant === "linkedin" ? buildLinkedInPdfBody(options) : options.cvText.trim();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(BODY_SIZE);
  addWrappedText(doc, body, MARGIN_MM, y, maxWidth, pageHeight, MARGIN_MM);

  doc.save(options.fileName.endsWith(".pdf") ? options.fileName : `${options.fileName}.pdf`);
}

export function defaultCvPdfFileName(candidateName?: string, variant: CvPdfVariant = "standard"): string {
  const base = candidateName ? slugifyFileName(candidateName) : "WorkConnect";
  return variant === "linkedin" ? `CV_LinkedIn_${base}.pdf` : `CV_${base}.pdf`;
}

export function buildLinkedInCopyPack(
  linkedin: CareerLinkedInResult,
  cvText?: string,
): string {
  const sections = [
    "=== HEADLINE ===",
    linkedin.headline,
    "",
    "=== ACERCA DE ===",
    linkedin.about,
    "",
    "=== EXPERIENCIA (bullets) ===",
    ...(linkedin.experience_bullets ?? []).map((b) => `• ${b}`),
    "",
    "=== DESTACAR EN PERFIL ===",
    ...(linkedin.featured_suggestions ?? []).map((s) => `• ${s}`),
  ];

  if (cvText?.trim()) {
    sections.push("", "=== CV (referencia) ===", cvText.trim());
  }

  return sections.join("\n");
}

/** Enlace al perfil del usuario o a LinkedIn genérico */
export function linkedInProfileOrHelpUrl(profileLinkedIn?: string | null): string {
  if (profileLinkedIn?.trim()) {
    return profileLinkedIn.trim();
  }
  return "https://www.linkedin.com/in/me/";
}

export const LINKEDIN_RESUME_HELP_URL =
  "https://www.linkedin.com/help/linkedin/answer/a552399";
