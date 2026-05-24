import { redirect } from "@tanstack/react-router";
import { getStoredUser, isAuthenticated } from "@/lib/auth";

/** TanStack Start ejecuta beforeLoad en el servidor, donde no hay localStorage. */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/** Rutas protegidas: solo valida sesión en el navegador. */
export function guardRequireAuth(): void {
  if (!isClient()) {
    return;
  }
  if (!isAuthenticated()) {
    throw redirect({ to: "/login" });
  }
}

/** Login/registro: redirige al dashboard si ya hay token (solo en cliente). */
export function guardGuestOnly(): void {
  if (!isClient()) {
    return;
  }
  if (isAuthenticated()) {
    throw redirect({ to: "/dashboard" });
  }
}

export function guardRole(...roles: string[]): void {
  guardRequireAuth();
  const user = getStoredUser();
  if (!user) {
    throw redirect({ to: "/login" });
  }
  const role = user.role ?? "";
  if (!roles.includes(role)) {
    throw redirect({ to: "/dashboard" });
  }
}
