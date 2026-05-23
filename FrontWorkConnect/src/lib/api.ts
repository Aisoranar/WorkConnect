import type {
  Application,
  ApplyContext,
  FreelancerCard,
  Job,
  JobApplicationDetail,
  JobsListMeta,
  Message,
  Stats,
} from "./types";
import { authHeaders } from "./auth";

function resolveApiBase(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://127.0.0.1:8000/api";
  }
  return "http://127.0.0.1:8000/api";
}

const API_BASE = resolveApiBase();

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

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(await parseApiError(response));

  return response.json() as Promise<T>;
}

export const queryKeys = {
  jobs: ["jobs"] as const,
  myJobs: ["my-jobs"] as const,
  applications: ["applications"] as const,
  messages: ["messages"] as const,
  stats: ["stats"] as const,
  talent: (username: string) => ["talent", username] as const,
  jobApplications: (jobId: string) => ["job-applications", jobId] as const,
  job: (jobId: string) => ["job", jobId] as const,
  freelancers: (filters: string) => ["freelancers", filters] as const,
};

type JobsListResponse = { data: Job[]; meta?: JobsListMeta };

export type PublicTalent = {
  id: number;
  name: string;
  username: string;
  role: string;
  city: string | null;
  bio: string | null;
  rating: number;
  verified: boolean;
  github: string | null;
  linkedin: string | null;
  experience: string | null;
  skills: { id: number; name: string; level?: string }[];
  portfolio: {
    id: number;
    title: string;
    description: string | null;
    url: string | null;
    technologies: string[] | null;
  }[];
};

export type TalentProfileResponse = {
  data: PublicTalent;
  meta: { projects_completed: number; reviews_count: number };
};

export type ExploreJobsFilters = {
  category?: string;
  q?: string;
  sort?: "match" | "recent" | "budget";
};

export function fetchJobs(filters: ExploreJobsFilters = {}): Promise<JobsListResponse> {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== "Todos") {
    params.set("category", filters.category);
  }
  if (filters.q?.trim()) {
    params.set("q", filters.q.trim());
  }
  if (filters.sort) {
    params.set("sort", filters.sort);
  }
  const qs = params.toString();

  return apiGet<JobsListResponse>(`/jobs${qs ? `?${qs}` : ""}`);
}

export function fetchFreelancers(q?: string): Promise<FreelancerCard[]> {
  const params = new URLSearchParams({ role: "freelancer" });
  if (q?.trim()) {
    params.set("q", q.trim());
  }
  return apiGet<{ data: FreelancerCard[] }>(`/users?${params}`).then((r) => r.data);
}

export function fetchMyJobs(): Promise<Job[]> {
  return apiGet<ApiListResponse<Job>>("/my-jobs").then((r) => r.data);
}

export function fetchJob(jobId: string): Promise<Job> {
  return apiGet<ApiItemResponse<Job>>(`/jobs/${jobId}?legacy=1`).then((r) => r.data);
}

export function fetchJobApplications(jobId: string): Promise<JobApplicationDetail[]> {
  return apiGet<ApiListResponse<JobApplicationDetail>>(`/my-jobs/${jobId}/applications`).then(
    (r) => r.data,
  );
}

export function updateApplicationStatus(
  applicationId: number,
  status: "aceptada" | "rechazada" | "pendiente",
): Promise<void> {
  return apiPatch(`/applications/${applicationId}`, { status }).then(() => undefined);
}

export function fetchTalentProfile(username: string): Promise<TalentProfileResponse> {
  return apiGet<TalentProfileResponse>(`/talent/${encodeURIComponent(username)}`);
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

export type PayCurrency = "COP" | "USD";

export type StructuredProject = {
  title: string;
  description: string;
  category: string;
  skills: string[];
  deliverables: string[];
  budget: string;
  currency: PayCurrency;
  budget_amount: number;
  recommended_technologies: string[];
  solution_type: string;
  estimated_time: string;
  difficulty_level: string;
  remote: boolean;
  summary: string;
  source: string;
};

export function structureProjectBrief(payload: {
  raw_need: string;
  currency: PayCurrency;
  budget_amount: number;
  business_context?: string;
}): Promise<StructuredProject> {
  return apiPost<ApiItemResponse<StructuredProject>>("/ai/structure-project", payload).then(
    (r) => r.data,
  );
}

export function createJob(payload: {
  title: string;
  description: string;
  budget: string;
  location?: string;
  remote?: boolean;
  category?: string;
  company?: string;
  skills?: string[];
}): Promise<{ id: string; message: string }> {
  return apiPost<{ message: string; data: { id: number } }>("/jobs", payload).then((r) => ({
    id: String(r.data.id),
    message: r.message,
  }));
}

export function submitApplication(
  jobId: string | number,
  payload: { proposal: string; price: string; delivery_time: string },
): Promise<void> {
  return apiPost<{ message: string }>(`/jobs/${jobId}/apply`, payload).then(() => undefined);
}
