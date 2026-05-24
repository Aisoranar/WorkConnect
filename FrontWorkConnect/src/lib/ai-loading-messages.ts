/** Mensajes rotativos para estados de carga con IA — tono sistemático y cercano */

export const JOB_MATCH_COACH_STEPS = [
  "Iniciando análisis de compatibilidad…",
  "Leyendo habilidades que pide el proyecto…",
  "Cruzando tu perfil con la vacante…",
  "Midiendo nivel de afinidad técnica…",
  "Detectando skills que te faltan…",
  "Calculando tu % de match real…",
  "Priorizando qué aprender primero…",
  "Preparando recomendaciones personalizadas…",
] as const;

export function jobMatchCoachSteps(jobTitle?: string, skills?: string[]): string[] {
  const stack = skills?.length ? skills.slice(0, 3).join(", ") : "el stack del proyecto";
  const title = jobTitle ? `«${jobTitle}»` : "este proyecto";

  return [
    "Encendiendo motor de matching IA…",
    `Explorando ${title}…`,
    `Mapeando requisitos: ${stack}…`,
    "Comparando con tu perfil actual…",
    "Midiendo brechas de compatibilidad…",
    "Afinando porcentaje de match…",
    "Buscando skills con más impacto…",
    "Redactando tu plan para postular…",
  ];
}

export const SKILL_MARKET_STEPS = [
  "Escaneando proyectos abiertos…",
  "Contando demanda por habilidad…",
  "Detectando tendencias del mercado…",
  "Comparando con tu stack actual…",
  "Priorizando oportunidades de aprendizaje…",
  "Generando recomendaciones con IA…",
] as const;

export const SKILL_LESSON_STEPS = [
  "Preparando tu mini lección…",
  "Estructurando conceptos básicos…",
  "Adaptando ejemplos a tu perfil…",
  "Seleccionando primeros pasos prácticos…",
  "Casi listo para estudiar…",
] as const;

export const SKILL_QUIZ_STEPS = [
  "Diseñando preguntas de evaluación…",
  "Calibrando nivel básico…",
  "Verificando claridad de opciones…",
  "Preparando tu certificación…",
] as const;
