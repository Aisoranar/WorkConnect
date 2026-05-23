export type ModuleStatus = "mvp" | "partial" | "progress" | "planned";

export type PlatformModule = {
  id: string;
  code: string;
  title: string;
  audience: "empresa" | "joven" | "ambos";
  problem: string;
  solution: string;
  status: ModuleStatus;
  statusLabel: string;
  routes?: string[];
};

export const MODULE_STATUS_LABEL: Record<ModuleStatus, string> = {
  mvp: "MVP listo",
  partial: "Parcial",
  progress: "En desarrollo",
  planned: "Planificado",
};

export const platformModules: PlatformModule[] = [
  {
    id: "m1",
    code: "M1",
    title: "Identidad y acceso",
    audience: "ambos",
    problem: "Entrar a la plataforma con rol claro (empresa o talento).",
    solution: "Registro, login, recuperar contraseña y correo de bienvenida.",
    status: "mvp",
    statusLabel: MODULE_STATUS_LABEL.mvp,
    routes: ["/register", "/login"],
  },
  {
    id: "m3",
    code: "M3",
    title: "Solicitud de la empresa",
    audience: "empresa",
    problem: "No sabe redactar un brief técnico («vendo papa y quiero una web»).",
    solution: "Formulario en lenguaje cotidiano + presupuesto disponible.",
    status: "mvp",
    statusLabel: MODULE_STATUS_LABEL.mvp,
    routes: ["/dashboard/publish"],
  },
  {
    id: "m4",
    code: "M4",
    title: "IA → requerimiento",
    audience: "empresa",
    problem: "La necesidad no está estructurada para un desarrollador junior.",
    solution: "La IA genera título, alcance, entregables y skills del proyecto.",
    status: "mvp",
    statusLabel: MODULE_STATUS_LABEL.mvp,
  },
  {
    id: "m5",
    code: "M5",
    title: "Micro-proyectos",
    audience: "ambos",
    problem: "No hay presupuesto para agencia; el joven no encuentra trabajos reales.",
    solution: "Marketplace de proyecticos con presupuesto visible y categoría.",
    status: "mvp",
    statusLabel: MODULE_STATUS_LABEL.mvp,
    routes: ["/dashboard/explore"],
  },
  {
    id: "m6",
    code: "M6",
    title: "Matching inteligente",
    audience: "joven",
    problem: "Pierde tiempo postulando a lo que no puede ejecutar.",
    solution: "Score de compatibilidad por habilidades y perfil.",
    status: "mvp",
    statusLabel: MODULE_STATUS_LABEL.mvp,
  },
  {
    id: "m7",
    code: "M7",
    title: "Postulación y propuesta",
    audience: "joven",
    problem: "No sabe venderse ni qué precio pedir.",
    solution: "Postula con precio/plazo; IA mejora la carta de presentación.",
    status: "mvp",
    statusLabel: MODULE_STATUS_LABEL.mvp,
    routes: ["/dashboard/applications"],
  },
  {
    id: "m8",
    code: "M8",
    title: "Selección de talento",
    audience: "empresa",
    problem: "«¿Cuál joven acepto por este presupuesto?»",
    solution: "Revisar postulaciones y aceptar al que encaje (en roadmap).",
    status: "partial",
    statusLabel: MODULE_STATUS_LABEL.partial,
  },
  {
    id: "m13",
    code: "M13",
    title: "Portafolio público + QR",
    audience: "joven",
    problem: "En ferias no puede mostrar evidencia rápida de su trabajo.",
    solution: "Perfil público escaneable; reclutador ve casos y rating.",
    status: "progress",
    statusLabel: MODULE_STATUS_LABEL.progress,
    routes: ["/talento/:username"],
  },
  {
    id: "m14",
    code: "M14",
    title: "Trayectoria laboral",
    audience: "joven",
    problem: "Sin proyectos en el CV no compite en entrevistas.",
    solution: "Cada entrega suma reputación; «10 proyectos → mejor empleo».",
    status: "partial",
    statusLabel: MODULE_STATUS_LABEL.partial,
  },
  {
    id: "m15",
    code: "M15",
    title: "Presupuesto acotado",
    audience: "empresa",
    problem: "Optimizar costos sin contratar equipo completo.",
    solution: "Micro-presupuesto explícito (ej. $200.000 COP) en publicación y postulación.",
    status: "mvp",
    statusLabel: MODULE_STATUS_LABEL.mvp,
  },
  {
    id: "m17",
    code: "M17",
    title: "Mis proyectos (empresa)",
    audience: "empresa",
    problem: "No ve en un solo lugar lo que publicó y quién postuló.",
    solution: "Panel de proyectos propios con conteo de postulantes.",
    status: "progress",
    statusLabel: MODULE_STATUS_LABEL.progress,
    routes: ["/dashboard/my-projects"],
  },
  {
    id: "m9",
    code: "M9",
    title: "Entrega y cierre",
    audience: "ambos",
    problem: "Falta seguimiento hasta el «productico» terminado.",
    solution: "Estados en progreso → entregado → pagado (planificado).",
    status: "planned",
    statusLabel: MODULE_STATUS_LABEL.planned,
  },
  {
    id: "m16",
    code: "M16",
    title: "Sectores y rubros",
    audience: "joven",
    problem: "No conoce los problemas típicos de las PYMEs locales.",
    solution: "Categorías por sector y proyectos reales de cada industria.",
    status: "planned",
    statusLabel: MODULE_STATUS_LABEL.planned,
  },
];
