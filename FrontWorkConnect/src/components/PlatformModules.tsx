import { platformModules, type ModuleStatus } from "@/lib/modules";
import { Building2, GraduationCap, Layers } from "lucide-react";

const statusStyles: Record<ModuleStatus, string> = {
  mvp: "border-primary/40 bg-primary/10 text-primary-glow",
  partial: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  progress: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  planned: "border-border bg-surface/60 text-muted-foreground",
};

const audienceIcon = {
  empresa: Building2,
  joven: GraduationCap,
  ambos: Layers,
} as const;

export function PlatformModules() {
  return (
    <section id="modulos" className="container mx-auto px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary-glow">Arquitectura</p>
        <h2 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">Módulos de la plataforma</h2>
        <p className="mt-4 text-muted-foreground">
          Cada pieza ataca un pedazo del pitch: conectar conocimiento del empresario con experiencia del
          talento joven, vía IA y micro-presupuestos.
        </p>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {platformModules.map((mod) => {
          const Icon = audienceIcon[mod.audience];
          return (
            <article
              key={mod.id}
              className="card-gradient flex flex-col rounded-2xl border border-border p-6 shadow-card"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">{mod.code}</span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusStyles[mod.status]}`}
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
