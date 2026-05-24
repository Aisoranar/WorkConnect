import type {
  Application,
  ApplyContext,
  FreelancerCard,
  GitHubGeneratedProfile,
  GitHubRepo,
  Job,
  JobApplicationDetail,
  JobsListMeta,
  Message,
  PortfolioItem,
  ProfileSkill,
  Stats,
  UserProfile,
} from "./types";
import { authHeaders, clearSession } from "./auth";

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

// Cuando el servidor devuelve 401, el token ya no es válido: limpia la sesión
// y redirige a /login con replace para no dejar el estado roto en el historial.
function handleUnauthorized(): void {
  clearSession();
  window.location.replace("/login");
}

async function parseApiError(response: Response): Promise<string> {
  if (response.status === 401) {
    handleUnauthorized();
    return "Sesión expirada. Redirigiendo a inicio de sesión…";
  }
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

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return response.json() as Promise<T>;
}

async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: authHeaders(false),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
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
  me: ["me"] as const,
  jobs: ["jobs"] as const,
  myJobs: ["my-jobs"] as const,
  applications: ["applications"] as const,
  messages: ["messages"] as const,
  stats: ["stats"] as const,
  talent: (username: string) => ["talent", username] as const,
  jobApplications: (jobId: string) => ["job-applications", jobId] as const,
  job: (jobId: string) => ["job", jobId] as const,
  freelancers: (filters: string) => ["freelancers", filters] as const,
  githubRepos: (username: string) => ["github-repos", username] as const,
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

// ─── Perfil propio ────────────────────────────────────────────────────────────

export function fetchMe(): Promise<UserProfile> {
  return apiGet<{ data: UserProfile }>("/me").then((r) => r.data);
}

export type UpdateProfilePayload = {
  name?: string;
  username?: string | null;
  city?: string | null;
  bio?: string | null;
  github?: string | null;
  linkedin?: string | null;
  experience?: string | null;
  skill_ids?: number[];
  skill_names?: string[];
};

export function updateProfile(userId: number, data: UpdateProfilePayload): Promise<UserProfile> {
  return apiPut<{ data: UserProfile }>(`/users/${userId}`, data).then((r) => r.data);
}

export async function uploadAvatar(file: File): Promise<{ avatar: string }> {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await fetch(`${API_BASE}/users/avatar`, {
    method: "POST",
    headers: authHeaders(false),
    body: formData,
  });
  if (response.status === 401) {
    clearSession();
    window.location.replace("/login");
    return { avatar: "" };
  }
  if (!response.ok) throw new Error(await (response.json() as Promise<{ message?: string }>).then((b) => b.message ?? `Error ${response.status}`));
  return response.json() as Promise<{ message: string; avatar: string }>;
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export type PortfolioPayload = {
  title: string;
  description?: string | null;
  url?: string | null;
  technologies?: string[];
};

export function createPortfolioProject(data: PortfolioPayload): Promise<PortfolioItem> {
  return apiPost<{ data: PortfolioItem }>("/portfolio", data).then((r) => r.data);
}

export function updatePortfolioProject(id: number, data: Partial<PortfolioPayload>): Promise<PortfolioItem> {
  return apiPut<{ data: PortfolioItem }>(`/portfolio/${id}`, data).then((r) => r.data);
}

export function deletePortfolioProject(id: number): Promise<void> {
  return apiDelete(`/portfolio/${id}`);
}

export async function uploadPortfolioImage(projectId: number, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch(`${API_BASE}/portfolio/${projectId}/image`, {
    method: "POST",
    headers: authHeaders(false),
    body: formData,
  });
  if (response.status === 401) { clearSession(); window.location.replace("/login"); return ""; }
  if (!response.ok) throw new Error(`Error ${response.status}`);
  return (response.json() as Promise<{ image: string }>).then((b) => b.image);
}

// ─── GitHub ───────────────────────────────────────────────────────────────────

export function fetchGithubRepos(username: string): Promise<GitHubRepo[]> {
  const params = new URLSearchParams({ username });
  return apiGet<{ data: GitHubRepo[] }>(`/github/repos?${params}`).then((r) => r.data);
}

// ─── IA — perfil ─────────────────────────────────────────────────────────────

export function improveBio(bio: string): Promise<string> {
  return apiPost<{ data: { bio: string } }>("/ai/improve-bio", { bio }).then((r) => r.data.bio);
}

export function generateProfileFromGithub(
  repos: Pick<GitHubRepo, "name" | "description" | "language" | "topics">[],
  currentBio?: string | null,
): Promise<GitHubGeneratedProfile> {
  return apiPost<{ data: GitHubGeneratedProfile }>("/ai/github-profile", {
    repos,
    current_bio: currentBio ?? null,
  }).then((r) => r.data);
}

export function fetchAllSkills(): Promise<ProfileSkill[]> {
  return apiGet<{ data: ProfileSkill[] }>("/skills").then((r) => r.data);
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
