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
  SkillRecommendationsResult,
  LearnSkillResult,
} from "./types";
import { authHeaders, clearSession, isAuthenticated, touchSessionActivity } from "./auth";
import { getApiBaseUrl } from "./env";

const API_BASE = getApiBaseUrl();

type ApiListResponse<T> = { data: T[] };
type ApiItemResponse<T> = { data: T };

// Cuando el servidor devuelve 401, el token ya no es válido: limpia la sesión
// y redirige a /login con replace para no dejar el estado roto en el historial.
function handleUnauthorized(): void {
  clearSession();
  window.location.replace("/login");
}

function trackSessionActivity(): void {
  if (isAuthenticated()) {
    touchSessionActivity();
  }
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
  trackSessionActivity();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(false),
  });

  if (!response.ok) throw new Error(await parseApiError(response));

  return response.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  trackSessionActivity();
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(await parseApiError(response));

  return response.json() as Promise<T>;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  trackSessionActivity();
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return response.json() as Promise<T>;
}

async function apiDelete(path: string): Promise<void> {
  trackSessionActivity();
  const response = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: authHeaders(false),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  trackSessionActivity();
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
  skillRecommendations: ["skill-recommendations"] as const,
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

export { getApiBaseUrl } from "./env";

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

// ─── Asistente de carrera ─────────────────────────────────────────────────────

export type ExternalJobListing = {
  id: number;
  title: string;
  company: string;
  location: string | null;
  apply_url: string;
  source: string;
  skills: string[] | null;
  summary: string | null;
  posted_at: string | null;
};

export type CareerProfileAnalysis = {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  hidden_potential: string[];
  ats_tips: string[];
  linkedin_tips: string[];
  priority_actions: string[];
  tips: string[];
  ai_summary?: string;
  source: string;
};

export type CareerAchievements = {
  achievements: { weak: string; strong: string; category: string }[];
  tips: string[];
  source: string;
};

export type CareerCvBulletUpgrade = {
  before: string;
  after: string;
  section: string;
};

export type CareerCvResult = {
  cv_text: string;
  sections: Record<string, string>;
  ats_score: number;
  ats_keywords: string[];
  keywords_to_add: string[];
  improvements: string[];
  format_tips: string[];
  bullet_upgrades: CareerCvBulletUpgrade[];
  red_flags: string[];
  role_fit_summary: string;
  source: string;
};

export type CareerImproveCvPayload = {
  target_role?: string;
  offer_text?: string;
  cv_draft?: string;
};

export type CareerLinkedInResult = {
  headline: string;
  about: string;
  experience_bullets: string[];
  featured_suggestions: string[];
  upload_tips?: string[];
  source: string;
};

export type CareerImproveLinkedInPayload = {
  cv_text?: string;
  target_role?: string;
};

export type CareerOfferAnalysis = {
  role_title: string;
  company: string;
  required_skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  compatibility_percent: number;
  summary: string;
  apply_recommendation: string;
  source: string;
};

export type CareerStudyPlan = {
  weeks: { week: number; focus: string; tasks: string[]; resources: string[] }[];
  milestones: string[];
  practice_projects: string[];
  interview_prep: string[];
  free_courses: { title: string; url: string; provider: string; skills: string[] }[];
  source: string;
};

export type CareerReadiness = {
  ready: boolean;
  confidence_percent: number;
  verdict: string;
  strengths_for_role: string[];
  gaps_to_close: string[];
  improve_before_apply: string[];
  can_apply_now: boolean;
  source: string;
};

export type CareerInterviewStart = {
  question: string;
  topic: string;
  difficulty: string;
  tips: string[];
  source: string;
};

export type CareerInterviewEval = {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  model_answer_hint: string;
  follow_up_question: string;
  source: string;
};

export type ProjectCoaching = {
  match_percent: number;
  strengths_to_leverage: string[];
  delivery_tips: string[];
  communication_tips: string[];
  risk_warnings: string[];
  source: string;
};

async function apiPostForm<T>(path: string, form: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(false),
    body: form,
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return response.json() as Promise<T>;
}

export function fetchExternalJobs(): Promise<ExternalJobListing[]> {
  return apiGet<ApiListResponse<ExternalJobListing>>("/career/external-jobs").then((r) => r.data);
}

export function careerAnalyzeProfile(): Promise<CareerProfileAnalysis> {
  return apiPost<ApiItemResponse<CareerProfileAnalysis>>("/career/analyze-profile", {}).then((r) => r.data);
}

export function careerDiscoverAchievements(notes?: string): Promise<CareerAchievements> {
  return apiPost<ApiItemResponse<CareerAchievements>>("/career/achievements", { notes: notes ?? null }).then(
    (r) => r.data,
  );
}

export function careerImproveCv(payload: CareerImproveCvPayload = {}): Promise<CareerCvResult> {
  return apiPost<ApiItemResponse<CareerCvResult>>("/career/improve-cv", {
    target_role: payload.target_role?.trim() || null,
    offer_text: payload.offer_text?.trim() || null,
    cv_draft: payload.cv_draft?.trim() || null,
  }).then((r) => r.data);
}

export function careerImproveLinkedIn(
  payload: CareerImproveLinkedInPayload = {},
): Promise<CareerLinkedInResult> {
  return apiPost<ApiItemResponse<CareerLinkedInResult>>("/career/improve-linkedin", {
    cv_text: payload.cv_text?.trim() || null,
    target_role: payload.target_role?.trim() || null,
  }).then((r) => r.data);
}

export function careerAnalyzeOffer(offerText: string, file?: File): Promise<CareerOfferAnalysis> {
  const form = new FormData();
  if (offerText.trim()) form.append("offer_text", offerText.trim());
  if (file) form.append("file", file);
  return apiPostForm<ApiItemResponse<CareerOfferAnalysis>>("/career/analyze-offer", form).then((r) => r.data);
}

export function careerStudyPlan(offerText: string, targetRole?: string): Promise<CareerStudyPlan> {
  return apiPost<ApiItemResponse<CareerStudyPlan>>("/career/study-plan", {
    offer_text: offerText,
    target_role: targetRole ?? null,
  }).then((r) => r.data);
}

export function careerTargetRole(targetRole: string): Promise<Record<string, unknown>> {
  return apiPost<ApiItemResponse<Record<string, unknown>>>("/career/target-role", { target_role: targetRole }).then(
    (r) => r.data,
  );
}

export function careerReadiness(offerText: string): Promise<CareerReadiness> {
  return apiPost<ApiItemResponse<CareerReadiness>>("/career/readiness", { offer_text: offerText }).then((r) => r.data);
}

export function careerInterviewStart(context: string, mode = "offer"): Promise<CareerInterviewStart> {
  return apiPost<ApiItemResponse<CareerInterviewStart>>("/career/interview/start", { context, mode }).then(
    (r) => r.data,
  );
}

export function careerInterviewEvaluate(
  question: string,
  answer: string,
  context: string,
): Promise<CareerInterviewEval> {
  return apiPost<ApiItemResponse<CareerInterviewEval>>("/career/interview/evaluate", {
    question,
    answer,
    context,
  }).then((r) => r.data);
}

export function careerProjectTips(jobId: number): Promise<ProjectCoaching> {
  return apiPost<ApiItemResponse<ProjectCoaching>>("/career/project-tips", { job_id: jobId }).then((r) => r.data);
}

export function fetchSkillRecommendations(): Promise<SkillRecommendationsResult> {
  return apiPost<ApiItemResponse<SkillRecommendationsResult>>("/profile/skill-recommendations", {}).then(
    (r) => r.data,
  );
}

export function learnSkillIntro(skill: string): Promise<LearnSkillResult> {
  return apiPost<ApiItemResponse<LearnSkillResult>>("/profile/learn-skill", { skill }).then((r) => r.data);
}
