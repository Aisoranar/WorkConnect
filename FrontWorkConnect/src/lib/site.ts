/** Configuración de marca y URLs para SEO / redes sociales */
export const SITE_NAME = "WorkConnect";
export const SITE_TAGLINE = "Talento joven, oportunidades reales";
export const SITE_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const SITE_DESCRIPTION =
  "Plataforma de empleo juvenil con matching por IA. Conecta tu talento con proyectos reales basados en reputación y habilidades.";

import { getSiteUrl } from "@/lib/env";

export const SITE_URL = getSiteUrl();

export const OG_IMAGE_URL = `${SITE_URL}/og-workconnect.jpg`;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
