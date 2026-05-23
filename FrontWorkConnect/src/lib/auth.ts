const TOKEN_KEY = "workconnect_token";
const USER_KEY = "workconnect_user";

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

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://172.20.10.14:8000/api";

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

export function setSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

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
  const response = await fetch(`${API_BASE}/register`, {
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

export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: "POST",
        headers: authHeaders(),
      });
    } catch {
      // ignore network errors on logout
    }
  }
  clearSession();
}
