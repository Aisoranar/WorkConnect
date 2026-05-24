import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Compass,
  Send,
  MessageSquare,
  User,
  PlusCircle,
  Briefcase,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";

export type DashboardNavItem = {
  title: string;
  /** Etiqueta corta para la bottom bar */
  shortLabel: string;
  url: string;
  icon: LucideIcon;
};

export type DashboardNavConfig = {
  groupLabel: string;
  /** Bottom bar en móvil (máx. 4 + «Más») */
  bottomBar: DashboardNavItem[];
  /** Solo sidebar desktop — Perfil y extras */
  sidebarOnly: DashboardNavItem[];
};

const freelancerBottomBar: DashboardNavItem[] = [
  { title: "Inicio", shortLabel: "Inicio", url: "/dashboard", icon: LayoutDashboard },
  { title: "Explorar proyectos", shortLabel: "Explorar", url: "/dashboard/explore", icon: Compass },
  { title: "Mis postulaciones", shortLabel: "Postulaciones", url: "/dashboard/applications", icon: Send },
  { title: "Mensajes", shortLabel: "Mensajes", url: "/dashboard/messages", icon: MessageSquare },
];

const freelancerSidebarOnly: DashboardNavItem[] = [
  { title: "Asistente carrera", shortLabel: "Carrera", url: "/dashboard/career", icon: Sparkles },
  { title: "Mi perfil", shortLabel: "Perfil", url: "/dashboard/profile", icon: User },
];

const clientBottomBar: DashboardNavItem[] = [
  { title: "Inicio", shortLabel: "Inicio", url: "/dashboard", icon: LayoutDashboard },
  { title: "Publicar proyecto", shortLabel: "Publicar", url: "/dashboard/publish", icon: PlusCircle },
  { title: "Mis proyectos", shortLabel: "Proyectos", url: "/dashboard/my-projects", icon: Briefcase },
  { title: "Mensajes", shortLabel: "Mensajes", url: "/dashboard/messages", icon: MessageSquare },
];

const clientSidebarOnly: DashboardNavItem[] = [
  { title: "Explorar talento", shortLabel: "Talento", url: "/dashboard/explore", icon: Compass },
  { title: "Mi perfil", shortLabel: "Perfil", url: "/dashboard/profile", icon: User },
];

const adminBottomBar: DashboardNavItem[] = [
  { title: "Inicio", shortLabel: "Inicio", url: "/dashboard", icon: LayoutDashboard },
  { title: "Explorar proyectos", shortLabel: "Explorar", url: "/dashboard/explore", icon: Compass },
  { title: "Mis postulaciones", shortLabel: "Postulaciones", url: "/dashboard/applications", icon: Send },
  { title: "Mensajes", shortLabel: "Mensajes", url: "/dashboard/messages", icon: MessageSquare },
];

const adminSidebarOnly: DashboardNavItem[] = [
  { title: "Asistente carrera", shortLabel: "Carrera", url: "/dashboard/career", icon: Sparkles },
  { title: "Publicar (demo)", shortLabel: "Publicar", url: "/dashboard/publish", icon: PlusCircle },
  { title: "Admin", shortLabel: "Admin", url: "/dashboard", icon: Briefcase },
  { title: "Mi perfil", shortLabel: "Perfil", url: "/dashboard/profile", icon: User },
];

export const moreNavIcon = MoreHorizontal;

export function getDashboardNav(role: string | undefined): DashboardNavConfig {
  if (role === "client") {
    return { groupLabel: "Empresa", bottomBar: clientBottomBar, sidebarOnly: clientSidebarOnly };
  }
  if (role === "admin") {
    return { groupLabel: "Administración", bottomBar: adminBottomBar, sidebarOnly: adminSidebarOnly };
  }
  return { groupLabel: "Talento joven", bottomBar: freelancerBottomBar, sidebarOnly: freelancerSidebarOnly };
}

export function isDashboardNavActive(pathname: string, url: string): boolean {
  if (url === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/dashboard/";
  }
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function allSidebarNavItems(config: DashboardNavConfig): DashboardNavItem[] {
  return [...config.bottomBar, ...config.sidebarOnly];
}

export function moreMenuItems(config: DashboardNavConfig): DashboardNavItem[] {
  return config.sidebarOnly;
}
