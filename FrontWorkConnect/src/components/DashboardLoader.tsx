import { IsoLogo } from "@/components/Logo";
import { cn } from "@/lib/utils";

type DashboardLoaderProps = {
  label?: string;
  compact?: boolean;
};

export function DashboardLoader({ label = "Cargando datos…", compact = false }: DashboardLoaderProps) {
  return (
    <div
      className={
        compact
          ? "flex items-center justify-center gap-3 py-8 text-sm text-muted-foreground"
          : "flex min-h-[200px] flex-col items-center justify-center gap-4 text-sm text-muted-foreground"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={cn("iso-loader-shell", compact ? "iso-loader-shell--sm" : "iso-loader-shell--auto")}>
        <IsoLogo
          theme="auto"
          alt=""
          className={compact ? "iso-loader-spin size-10" : "iso-loader-spin size-14"}
        />
      </div>
      <p className="dashboard-loader-label">{label}</p>
    </div>
  );
}
