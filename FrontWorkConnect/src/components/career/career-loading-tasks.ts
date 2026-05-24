export type CareerLoadingTask = {
  id: string;
  title: string;
  subtitle: string;
  steps: string[];
};

export const CAREER_LOADING_TASKS = {
  profile: {
    id: "profile",
    title: "Analizando tu perfil",
    subtitle: "Diagnóstico integral de empleabilidad",
    steps: [
      "Conectando con tu perfil WorkConnect",
      "Leyendo skills, portfolio y experiencia",
      "Investigando estándares del mercado para tu nivel",
      "Evaluando fortalezas diferenciadoras",
      "Detectando brechas y áreas de mejora",
      "Cruzando datos con criterios ATS",
      "Generando tips para CV y LinkedIn",
      "Priorizando acciones de alto impacto",
    ],
  },
  achievements: {
    id: "achievements",
    title: "Descubriendo tus logros",
    subtitle: "De tareas diarias a bullets con impacto",
    steps: [
      "Interpretando tu experiencia y notas",
      "Identificando métricas y resultados ocultos",
      "Investigando verbos de acción del sector",
      "Transformando frases genéricas",
      "Redactando bullets cuantificables",
      "Validando tono profesional y claridad",
    ],
  },
  cv: {
    id: "cv",
    title: "Generando CV ATS",
    subtitle: "Formato legible para reclutadores y sistemas",
    steps: [
      "Recopilando datos de tu perfil",
      "Investigando palabras clave del rol objetivo",
      "Estructurando secciones (resumen, experiencia, skills)",
      "Optimizando encabezados y formato ATS",
      "Ajustando bullets para escaneo rápido",
      "Revisando consistencia y longitud",
      "Aplicando pulido final",
    ],
  },
  linkedin: {
    id: "linkedin",
    title: "Optimizando LinkedIn",
    subtitle: "Visibilidad y posicionamiento profesional",
    steps: [
      "Analizando tu headline actual",
      "Investigando titulares que convierten en tu sector",
      "Redactando headline orientado a búsquedas",
      "Escribiendo sección «Acerca de» con storytelling",
      "Generando bullets de experiencia con impacto",
      "Sugiriendo palabras clave para el algoritmo",
      "Revisando coherencia con tu CV",
    ],
  },
  offer: {
    id: "offer",
    title: "Analizando la oferta",
    subtitle: "Compatibilidad perfil ↔ vacante",
    steps: [
      "Extrayendo texto de la vacante",
      "Identificando requisitos obligatorios vs deseables",
      "Mapeando stack técnico y soft skills",
      "Investigando nivel seniority esperado",
      "Comparando con tu perfil actual",
      "Calculando % de compatibilidad",
      "Detectando brechas críticas",
      "Generando recomendaciones de postulación",
    ],
  },
  studyPlan: {
    id: "studyPlan",
    title: "Creando plan de estudio",
    subtitle: "Ruta personalizada hacia la vacante",
    steps: [
      "Desglosando requisitos de la oferta",
      "Contrastando con tu nivel actual",
      "Investigando temas prioritarios del rol",
      "Detectando brechas de conocimiento",
      "Diseñando cronograma por semanas",
      "Buscando recursos y cursos gratuitos",
      "Definiendo hitos y práctica recomendada",
      "Consolidando plan accionable",
    ],
  },
  readiness: {
    id: "readiness",
    title: "Evaluando si estás preparado",
    subtitle: "Veredicto honesto antes de postular",
    steps: [
      "Leyendo oferta y tu perfil en paralelo",
      "Ponderando requisitos técnicos",
      "Evaluando experiencia demostrable",
      "Calculando nivel de confianza",
      "Identificando riesgos de rechazo temprano",
      "Generando consejos para reforzar postulación",
    ],
  },
  role: {
    id: "role",
    title: "Diseñando tu ruta profesional",
    subtitle: "Estrategia para tu puesto objetivo",
    steps: [
      "Investigando el rol y sus variantes en el mercado",
      "Analizando skills más demandadas",
      "Comparando tu perfil con el benchmark del puesto",
      "Detectando gaps técnicos y de experiencia",
      "Armando plan de estudio priorizado",
      "Definiendo estrategia de postulación y networking",
      "Sintetizando próximos pasos concretos",
    ],
  },
  interviewStart: {
    id: "interviewStart",
    title: "Preparando entrevista",
    subtitle: "Simulación adaptada a la vacante",
    steps: [
      "Cargando contexto de oferta y perfil",
      "Investigando preguntas frecuentes del rol",
      "Calibrando dificultad según seniority",
      "Generando primera pregunta técnica",
      "Preparando criterios de evaluación",
    ],
  },
  interviewEval: {
    id: "interviewEval",
    title: "Evaluando tu respuesta",
    subtitle: "Feedback constructivo en tiempo real",
    steps: [
      "Analizando claridad y estructura",
      "Evaluando profundidad técnica",
      "Detectando omisiones relevantes",
      "Puntuando según rúbrica del rol",
      "Redactando feedback accionable",
      "Generando siguiente pregunta de seguimiento",
    ],
  },
} as const satisfies Record<string, CareerLoadingTask>;
