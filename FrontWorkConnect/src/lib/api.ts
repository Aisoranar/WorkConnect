import type { Application, Job, Message, Stats } from "./types";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://172.20.10.14:8000/api";

type ApiListResponse<T> = { data: T[] };
type ApiItemResponse<T> = { data: T };

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const queryKeys = {
  jobs: ["jobs"] as const,
  applications: ["applications"] as const,
  messages: ["messages"] as const,
  stats: ["stats"] as const,
};

export function fetchJobs(): Promise<Job[]> {
  return apiGet<ApiListResponse<Job>>("/jobs").then((r) => r.data);
}

export function fetchApplications(): Promise<Application[]> {
  return apiGet<ApiListResponse<Application>>("/applications").then((r) => r.data);
}

export function fetchMessages(): Promise<Message[]> {
  return apiGet<ApiListResponse<Message>>("/messages").then((r) => r.data);
}

export function fetchStats(): Promise<Stats> {
  return apiGet<ApiItemResponse<Stats>>("/stats").then((r) => r.data);
}

export function getApiBaseUrl(): string {
  return API_BASE;
}
