import type { Application, ApplyContext, Job, Message, Stats } from "./types";
import { authHeaders } from "./auth";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://172.20.10.14:8000/api";

type ApiListResponse<T> = { data: T[] };
type ApiItemResponse<T> = { data: T };

async function parseApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
    if (body.errors) return Object.values(body.errors).flat().join(" ");
    return body.message ?? `Error ${response.status}`;
  } catch {
    return `Error ${response.status}: ${response.statusText}`;
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(false),
  });

  if (!response.ok) throw new Error(await parseApiError(response));

  return response.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(await parseApiError(response));

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

export function fetchApplyContext(jobId: string | number): Promise<ApplyContext> {
  return apiGet<ApiItemResponse<ApplyContext>>(`/jobs/${jobId}/apply-context`).then((r) => r.data);
}

export function improveProposal(jobId: string | number, message: string): Promise<string> {
  return apiPost<ApiItemResponse<{ message: string }>>("/ai/improve-proposal", {
    job_id: Number(jobId),
    message,
  }).then((r) => r.data.message);
}

export function submitApplication(
  jobId: string | number,
  payload: { proposal: string; price: string; delivery_time: string },
): Promise<void> {
  return apiPost<{ message: string }>(`/jobs/${jobId}/apply`, payload).then(() => undefined);
}
