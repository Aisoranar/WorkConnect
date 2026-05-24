import { platformModules, type ModuleStatus } from "@/lib/modules";
import { Building2, GraduationCap, Layers } from "lucide-react";

const statusStyles: Record<ModuleStatus, string> = {
  mvp: "chip chip-primary",
  partial: "chip chip-warning",
  progress: "chip chip-trust",
  planned: "chip chip-muted",
};

const audienceIcon = {
  empresa: Building2,
  joven: GraduationCap,
  ambos: Layers,
} as const;

export function PlatformModules() {
  return (
    <section id="modulos" className="container mx-auto px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary-glow">Arquitectura</p>
        <h2 className="section-heading mt-2">Módulos de la plataforma</h2>
        <p className="mt-4 text-muted-foreground">
          Cada pieza ataca un pedazo del pitch: conectar conocimiento del empresario con experiencia del
          talento joven, vía IA y micro-presupuestos.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:mt-14 md:grid-cols-2 lg:grid-cols-3">
        {platformModules.map((mod) => {
          const Icon = audienceIcon[mod.audience];
          return (
            <article
              key={mod.id}
              className="card-paper flex flex-col p-6"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">{mod.code}</span>
                <span
                  className={`shrink-0 uppercase tracking-wide ${statusStyles[mod.status]}`}
                >
                  {mod.statusLabel}
                </span>
              </div>
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary-glow" />
                <h3 className="font-display text-lg font-semibold">{mod.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground/80">Problema:</span> {mod.problem}
              </p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{mod.solution}</p>
            </article>
          );
        })}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
        Manual de usuario, casos de uso y documentación técnica en{" "}
        <strong className="text-foreground/80">README.md</strong> en la raíz del repositorio.
      </p>
    </section>
  );
}
