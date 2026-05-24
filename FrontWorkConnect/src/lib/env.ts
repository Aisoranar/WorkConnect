/**
 * Única fuente de variables de FrontWorkConnect/.env (prefijo VITE_).
 *
 * Solo deben existir URLs públicas aquí. Claves de IA, DB y correo van en
 * el .env del backend (Laravel), nunca en el front.
 */

function readVite(key: "VITE_API_URL" | "VITE_SITE_URL"): string | undefined {
  const value = import.meta.env[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed === "" ? undefined : trimmed;
}

/** URL base del API (sin barra final). Obligatoria en .env para entornos fijos (LAN, producción). */
export function getApiBaseUrl(): string {
  const fromEnv = readVite("VITE_API_URL");
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (import.meta.env.DEV) {
    console.warn(
      "[WorkConnect] Define VITE_API_URL en FrontWorkConnect/.env (ej. http://172.20.10.14:8000/api)",
    );
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8000/api`;
  }

  return "http://127.0.0.1:8000/api";
}

/** URL pública del sitio (SEO, OG, QR). */
export function getSiteUrl(): string {
  return (readVite("VITE_SITE_URL") ?? "http://localhost:8080").replace(/\/$/, "");
}
