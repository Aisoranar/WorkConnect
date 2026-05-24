/**
 * WorkConnect — Paleta dashboard empresarial (referencia para el equipo)
 *
 * Fuente activa: FrontWorkConnect/src/styles.css
 * Verificar en navegador: <html data-palette="enterprise">
 *
 * Estilo: sidebar navy oscuro + área de contenido gris claro + acento índigo
 */

/** @type {import('tailwindcss').Config['theme']} */
export const workConnectThemeExtend = {
  colors: {
    enterprise: {
      sidebar: "#1E2130",
      "sidebar-hover": "#2A3047",
      canvas: "#F0F2F5",
      card: "#FFFFFF",
      ink: "#1E293B",
      muted: "#64748B",
    },
    brand: {
      deep: "#4F46E5",
      main: "#6366F1",
      light: "#818CF8",
      glow: "#A5B4FC",
    },
    trust: {
      DEFAULT: "#7C6CF0",
      light: "#818CF8",
    },
    success: {
      DEFAULT: "#059669",
      dark: "#34D399",
    },
    error: {
      DEFAULT: "#DC2626",
      dark: "#F87171",
    },
    warning: {
      DEFAULT: "#D97706",
      dark: "#FBBF24",
    },
  },
};

/** Uso semántico — modo claro */
export const semanticTokensLight = {
  background: "#F0F2F5",
  foreground: "#1E293B",
  primary: "#6366F1",
  primaryHover: "#4F46E5",
  accent: "#818CF8",
  surface: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  muted: "#64748B",
  sidebar: "#1E2130",
  sidebarForeground: "#94A3B8",
  trust: "#7C6CF0",
  success: "#059669",
  destructive: "#DC2626",
};

/** Uso semántico — modo oscuro */
export const semanticTokensDark = {
  background: "#0F1219",
  foreground: "#E2E8F0",
  primary: "#818CF8",
  primaryHover: "#6366F1",
  accent: "#818CF8",
  surface: "#1A1F2E",
  card: "#1E2433",
  border: "#2D3548",
  muted: "#94A3B8",
  sidebar: "#141824",
  sidebarForeground: "#94A3B8",
  trust: "#A78BFA",
  success: "#34D399",
  destructive: "#F87171",
};

export default workConnectThemeExtend;
