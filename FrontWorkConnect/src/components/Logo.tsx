import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

export const LOGO_SRC = "/Logo.png";
export const ISO_LOGO_SRC = "/isoLogo.png";

/** Alturas alineadas sidebar ↔ header principal (logo 3.25rem · iso 2.25rem) */
export const DASHBOARD_BRAND = {
  wordmark: "h-[3.25rem]",
  iso: "size-9",
  headerExpanded: "4.75rem",
  headerCollapsed: "3.25rem",
} as const;

export const dashboardHeaderCssVars = {
  "--dashboard-header-h": DASHBOARD_BRAND.headerExpanded,
  "--dashboard-header-h-collapsed": DASHBOARD_BRAND.headerCollapsed,
} as React.CSSProperties;

type LogoProps = Omit<React.ComponentProps<"img">, "src" | "alt"> & {
  size?: "sm" | "md" | "lg";
  /** Fondo claro para que el wordmark se lea sobre sidebar oscuro */
  surface?: boolean;
  alt?: string;
};

const shellSizeMap = {
  sm: "h-9 sm:h-10",
  md: "h-10 sm:h-11",
  lg: DASHBOARD_BRAND.wordmark,
};

const isoSizeMap = {
  sm: "size-8",
  md: "size-9",
  lg: DASHBOARD_BRAND.iso,
};

export function Logo({ size = "md", surface = false, className, alt = "WorkConnect", ...props }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center",
        shellSizeMap[size],
        surface && "rounded-lg bg-white px-2.5 py-1 shadow-sm",
      )}
    >
      <img
        src={LOGO_SRC}
        alt={alt}
        draggable={false}
        loading="eager"
        decoding="async"
        className={cn("block h-full w-auto max-w-none object-contain object-left", className)}
        {...props}
      />
    </span>
  );
}

type LogoLinkProps = {
  to?: "/" | string;
  size?: LogoProps["size"];
  surface?: boolean;
  className?: string;
  logoClassName?: string;
};

export function LogoLink({
  to = "/",
  size = "md",
  surface = false,
  className,
  logoClassName,
}: LogoLinkProps) {
  return (
    <Link to={to} className={cn("inline-flex shrink-0 items-center", className)}>
      <Logo size={size} surface={surface} className={logoClassName} />
    </Link>
  );
}

type SidebarBrandLogoProps = {
  to?: "/" | string;
  size?: LogoProps["size"];
  className?: string;
};

/** Wordmark expandido · iso cuadrado al colapsar el sidebar */
export function SidebarBrandLogo({ to = "/", size = "lg", className }: SidebarBrandLogoProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Link
      to={to}
      className={cn(
        "flex min-w-0 items-center overflow-hidden transition-[padding] duration-200 ease-linear",
        collapsed && "mx-auto justify-center",
        className,
      )}
    >
      {collapsed ? (
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md",
            isoSizeMap[size],
          )}
        >
          <img
            src={ISO_LOGO_SRC}
            alt="WorkConnect"
            draggable={false}
            loading="eager"
            decoding="async"
            className="size-full object-contain"
          />
        </span>
      ) : (
        <Logo size={size} />
      )}
    </Link>
  );
}
