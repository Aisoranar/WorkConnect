import { platformModules, type ModuleStatus, type PlatformModule } from "@/lib/modules";
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

function ModuleCard({ mod }: { mod: PlatformModule }) {
  const Icon = audienceIcon[mod.audience];

  return (
    <article className="modules-marquee__card card-paper flex flex-col p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
          {mod.code}
        </span>
        <span className={`shrink-0 uppercase tracking-wide ${statusStyles[mod.status]}`}>
          {mod.statusLabel}
        </span>
      </div>
      <div className="mb-2 flex items-center gap-2.5">
        <div className="landing-feature-icon h-9 w-9">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-display text-base font-bold leading-snug">{mod.title}</h3>
      </div>
      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Problema:</span> {mod.problem}
      </p>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {mod.solution}
      </p>
    </article>
  );
}

export function PlatformModules() {
  const marqueeItems = [...platformModules, ...platformModules];

  return (
    <section
      id="modulos"
      className="landing-section scroll-mt-[4.5rem] py-16 sm:scroll-mt-20 sm:py-24"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-section-label">Arquitectura</p>
          <h2 className="section-heading mt-3">Módulos de la plataforma</h2>
          <p className="mt-4 text-muted-foreground">
            Cada pieza ataca un pedazo del pitch: conectar conocimiento del empresario con
            experiencia del talento joven, vía IA y micro-presupuestos.
          </p>
        </div>
      </div>

      <div className="modules-marquee mt-12" aria-label="Módulos de la plataforma en desplazamiento">
        <div className="modules-marquee__track">
          {marqueeItems.map((mod, index) => (
            <ModuleCard key={`${mod.id}-${index}`} mod={mod} />
          ))}
        </div>
      </div>

      <p className="container mx-auto mt-10 max-w-2xl px-4 text-center text-xs text-muted-foreground sm:px-6">
        Manual de usuario, casos de uso y documentación técnica en{" "}
        <strong className="text-foreground/80">README.md</strong> en la raíz del repositorio.
      </p>
    </section>
  );
}
