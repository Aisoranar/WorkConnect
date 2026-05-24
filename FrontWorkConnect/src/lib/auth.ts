import { getApiBaseUrl } from "@/lib/env";

const TOKEN_KEY = "workconnect_token";
const USER_KEY = "workconnect_user";
const LAST_ACTIVITY_KEY = "workconnect_last_activity";

/** 30 min sin actividad → aviso; 60 s para confirmar o cierre automático. */
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const SESSION_PROMPT_MS = 60 * 1000;

export type AuthUser = {
  id: number;
  name: string;
  email?: string;
  username?: string | null;
  role?: string;
};

type LoginResponse = {
  user: AuthUser;
  token: string;
};

type RegisterResponse = LoginResponse & { message?: string };

/** Evita cerrar sesión por 401 paralelos antes de validar /me tras recargar. */
let sessionRevokeOn401Enabled = false;

export function enableSessionRevokeOn401(): void {
  sessionRevokeOn401Enabled = true;
}

export function disableSessionRevokeOn401(): void {
  sessionRevokeOn401Enabled = false;
}

export function shouldRevokeSessionOn401(): boolean {
  return (
    typeof window !== "undefined" &&
    sessionRevokeOn401Enabled &&
    isAuthenticated()
  );
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function touchSessionActivity(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function getLastSessionActivity(): number {
  if (typeof window === "undefined") {
    return Date.now();
  }
  const raw = sessionStorage.getItem(LAST_ACTIVITY_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function clearSessionActivity(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(LAST_ACTIVITY_KEY);
}

export const SESSION_CHANGE_EVENT = "workconnect:session-change";

function notifySessionChange(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function syncStoredUserFromProfile(profile: {
  id: number;
  name: string;
  email?: string;
  username?: string | null;
  role?: string;
}): void {
  if (typeof window === "undefined") {
    return;
  }
  const current = getStoredUser();
  const next: AuthUser = {
    id: profile.id,
    name: profile.name,
    email: profile.email ?? current?.email,
    username: profile.username ?? current?.username ?? null,
    role: profile.role ?? current?.role,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(next));
  notifySessionChange();
}

export function setSession(token: string, user: AuthUser): void {
  disableSessionRevokeOn401();
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  touchSessionActivity();
  notifySessionChange();
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  disableSessionRevokeOn401();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearSessionActivity();
  notifySessionChange();
}

/** Cierra sesión y redirige a login (solo cliente, tras validar token). */
export function revokeSessionAndRedirectToLogin(): void {
  if (typeof window === "undefined") {
    return;
  }
  clearSession();
  window.location.replace("/login");
}

/** Tras recargar: la visita cuenta como actividad si el token sigue en localStorage. */
export function bootstrapSessionOnPageLoad(): void {
  if (typeof window === "undefined" || !isAuthenticated()) {
    return;
  }
  touchSessionActivity();
}

export function authHeaders(json = false): HeadersInit {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
    if (body.errors) {
      return Object.values(body.errors).flat().join(" ");
    }
    return body.message ?? `Error ${response.status}`;
  } catch {
    return `Error ${response.status}`;
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/login`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Comprueba que Laravel esté activo y que VITE_API_URL coincida con php artisan serve.",
    );
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as LoginResponse;
  setSession(data.token, data.user);
  return data;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: string;
}): Promise<RegisterResponse> {
  const response = await fetch(`${getApiBaseUrl()}/register`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as RegisterResponse;
  setSession(data.token, data.user);
  return data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await fetch(`${getApiBaseUrl()}/forgot-password`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as { message: string };
}

export async function resetPassword(payload: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> {
  const response = await fetch(`${getApiBaseUrl()}/reset-password`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as { message: string };
}

export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${getApiBaseUrl()}/logout`, {
        method: "POST",
        headers: authHeaders(),
      });
    } catch {
      // ignore network errors on logout
    }
  }
  clearSession();
}
