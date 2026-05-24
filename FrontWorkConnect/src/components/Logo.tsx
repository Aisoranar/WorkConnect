import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

/** Wordmark e iso según fondo: claro → *Black · oscuro → default */
export const BRAND_LOGO = {
  wordmark: { light: "/LogoBlack.png", dark: "/Logo.png" },
  iso: { light: "/isoLogoBlack.png", dark: "/isoLogo.png" },
} as const;

/** @deprecated Usar BRAND_LOGO */
export const LOGO_SRC = BRAND_LOGO.wordmark.dark;
/** @deprecated Usar BRAND_LOGO */
export const ISO_LOGO_SRC = BRAND_LOGO.iso.dark;

export type BrandTheme = "auto" | "light" | "dark";

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

type BrandImageProps = Omit<React.ComponentProps<"img">, "src" | "alt"> & {
  variant: "wordmark" | "iso";
  theme?: BrandTheme;
  alt?: string;
};

export function BrandImage({
  variant,
  theme = "auto",
  className,
  alt = "WorkConnect",
  ...props
}: BrandImageProps) {
  const { light, dark } = BRAND_LOGO[variant];

  if (theme === "light") {
    return <img src={light} alt={alt} className={className} draggable={false} {...props} />;
  }

  if (theme === "dark") {
    return <img src={dark} alt={alt} className={className} draggable={false} {...props} />;
  }

  return (
    <picture className={cn("contents", className?.includes("size-full") && "block size-full")}>
      <source media="(prefers-color-scheme: dark)" srcSet={dark} />
      <img
        src={light}
        alt={alt}
        draggable={false}
        className={className}
        {...props}
      />
    </picture>
  );
}

type LogoProps = Omit<React.ComponentProps<"img">, "src" | "alt"> & {
  size?: "sm" | "md" | "lg";
  theme?: BrandTheme;
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

export function Logo({
  size = "md",
  theme = "auto",
  surface = false,
  className,
  alt = "WorkConnect",
  ...props
}: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center",
        shellSizeMap[size],
        surface && "rounded-lg bg-white px-2.5 py-1 shadow-sm",
      )}
    >
      <BrandImage
        variant="wordmark"
        theme={theme}
        alt={alt}
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
  theme?: BrandTheme;
  surface?: boolean;
  className?: string;
  logoClassName?: string;
};

export function LogoLink({
  to = "/",
  size = "md",
  theme = "auto",
  surface = false,
  className,
  logoClassName,
}: LogoLinkProps) {
  return (
    <Link to={to} className={cn("inline-flex shrink-0 items-center", className)}>
      <Logo size={size} theme={theme} surface={surface} className={logoClassName} />
    </Link>
  );
}

type SidebarBrandLogoProps = {
  to?: "/" | string;
  size?: LogoProps["size"];
  className?: string;
};

/** Wordmark expandido · iso cuadrado al colapsar — sidebar siempre oscuro */
export function SidebarBrandLogo({ to = "/dashboard", size = "lg", className }: SidebarBrandLogoProps) {
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
          <BrandImage
            variant="iso"
            theme="dark"
            alt="WorkConnect"
            loading="eager"
            decoding="async"
            className="size-full object-contain"
          />
        </span>
      ) : (
        <Logo size={size} theme="dark" />
      )}
    </Link>
  );
}

type IsoLogoProps = {
  theme?: BrandTheme;
  className?: string;
  alt?: string;
};

export function IsoLogo({ theme = "auto", className, alt = "WorkConnect" }: IsoLogoProps) {
  return (
    <BrandImage
      variant="iso"
      theme={theme}
      alt={alt}
      loading="eager"
      decoding="async"
      className={className}
    />
  );
}
