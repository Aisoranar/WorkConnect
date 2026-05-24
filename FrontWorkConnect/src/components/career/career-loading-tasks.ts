export type CareerLoadingTask = {
  id: string;
  title: string;
  steps: string[];
};

export const CAREER_LOADING_TASKS = {
  profile: {
    id: "profile",
    title: "Analizando tu perfil",
    steps: [
      "Leyendo skills y portfolio",
      "Evaluando fortalezas y brechas",
      "Generando tips ATS y LinkedIn",
      "Preparando acciones prioritarias",
    ],
  },
  achievements: {
    id: "achievements",
    title: "Descubriendo tus logros",
    steps: [
      "Leyendo tu experiencia",
      "Transformando frases débiles",
      "Redactando bullets de impacto",
    ],
  },
  cv: {
    id: "cv",
    title: "Generando CV ATS",
    steps: ["Estructurando secciones", "Optimizando palabras clave", "Pulido final"],
  },
  linkedin: {
    id: "linkedin",
    title: "Optimizando LinkedIn",
    steps: ["Creando headline", "Redactando sección Acerca de", "Generando bullets de experiencia"],
  },
  offer: {
    id: "offer",
    title: "Analizando la oferta",
    steps: [
      "Leyendo requisitos de la vacante",
      "Extrayendo skills necesarias",
      "Comparando con tu perfil",
      "Calculando compatibilidad",
    ],
  },
  studyPlan: {
    id: "studyPlan",
    title: "Creando plan de estudio",
    steps: [
      "Analizando la oferta",
      "Detectando brechas de conocimiento",
      "Armando cronograma por semanas",
      "Buscando cursos gratuitos",
      "Finalizando recomendaciones",
    ],
  },
  readiness: {
    id: "readiness",
    title: "Evaluando si estás preparado",
    steps: ["Comparando perfil vs vacante", "Calculando nivel de confianza", "Generando consejos"],
  },
  role: {
    id: "role",
    title: "Diseñando tu ruta profesional",
    steps: [
      "Investigando el rol objetivo",
      "Analizando gaps de tu perfil",
      "Armando plan de estudio y postulación",
    ],
  },
  interviewStart: {
    id: "interviewStart",
    title: "Preparando entrevista",
    steps: ["Revisando contexto de la vacante", "Generando primera pregunta técnica"],
  },
  interviewEval: {
    id: "interviewEval",
    title: "Evaluando tu respuesta",
    steps: ["Analizando contenido", "Puntuando y generando feedback", "Preparando siguiente pregunta"],
  },
} as const satisfies Record<string, CareerLoadingTask>;
