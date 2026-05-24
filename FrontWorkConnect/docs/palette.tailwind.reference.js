/**
 * WorkConnect — Paleta crema + púrpura (referencia para el equipo)
 *
 * Fuente activa: FrontWorkConnect/src/styles.css
 * Verificar en navegador: <html data-palette="purple">
 *
 * Colores base (referencia del diseño):
 *   #FAF7E4  crema fondo
 *   #563B9C  púrpura profundo
 *   #6A41C3  púrpura principal
 *   #8A5DFE  lavanda / acento
 *   #FFF7D0  crema highlight
 */

/** @type {import('tailwindcss').Config['theme']} */
export const workConnectThemeExtend = {
  colors: {
    cream: {
      base: "#FAF7E4",
      highlight: "#FFF7D0",
      paper: "#FFFDF8",
    },
    purple: {
      deep: "#563B9C",
      main: "#6A41C3",
      light: "#8A5DFE",
      glow: "#A585FF",
    },
    neutral: {
      ink: "#2A1F47",
      muted: "#6B5B8A",
      "ink-dark": "#FAF7E4",
      "muted-dark": "#A89BC4",
    },
    surface: {
      light: "#FFF7D0",
      dark: "#221830",
      "card-dark": "#2A1F3D",
      "bg-dark": "#181022",
    },
    success: {
      DEFAULT: "#3D8B6E",
      dark: "#5CB892",
    },
    error: {
      DEFAULT: "#C04E42",
      dark: "#E07066",
    },
    warning: {
      DEFAULT: "#B8891A",
      dark: "#D4A832",
    },
  },
};

/** Uso semántico — modo claro */
export const semanticTokensLight = {
  background: "#FAF7E4",
  foreground: "#2A1F47",
  primary: "#6A41C3",
  primaryHover: "#563B9C",
  accent: "#8A5DFE",
  surface: "#FFF7D0",
  card: "#FFFDF8",
  border: "color-mix(#563B9C 14%, #FAF7E4)",
  muted: "#6B5B8A",
  trust: "#8A5DFE",
  success: "#3D8B6E",
  destructive: "#C04E42",
};

/** Uso semántico — modo oscuro */
export const semanticTokensDark = {
  background: "#181022",
  foreground: "#FAF7E4",
  primary: "#8A5DFE",
  primaryHover: "#6A41C3",
  accent: "#8A5DFE",
  surface: "#221830",
  card: "#2A1F3D",
  border: "color-mix(#563B9C 55%, #181022)",
  muted: "#A89BC4",
  trust: "#8A5DFE",
  success: "#5CB892",
  destructive: "#E07066",
};

export default workConnectThemeExtend;
