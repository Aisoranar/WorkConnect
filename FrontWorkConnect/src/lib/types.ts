export type Job = {
  id: string;
  title: string;
  company: string;
  budget: string;
  location: string;
  remote: boolean;
  status?: string;
  category: string;
  description: string;
  skills: string[];
  match: number;
  postedAgo: string;
  applicants: number;
  alreadyApplied?: boolean;
  applicationStatus?: string | null;
  isNew?: boolean;
};

export type JobsListMeta = {
  total: number;
  categories: string[];
};

export type FreelancerCard = {
  id: number;
  name: string;
  username: string | null;
  city: string | null;
  bio: string | null;
  rating: number;
  verified: boolean;
  skills: { id: number; name: string; level?: string }[];
  applications_count?: number;
};

export type JobApplicationDetail = {
  id: number;
  proposal: string;
  price: string;
  delivery_time: string;
  status: string;
  created_at?: string;
  user: {
    id: number;
    name: string;
    username?: string | null;
    city?: string | null;
    rating?: number;
    skills?: { name: string; level?: string }[];
  };
};

export type Application = {
  id: string;
  jobId?: string;
  jobTitle: string;
  company: string;
  price: string;
  status: "pendiente" | "aceptada" | "rechazada" | "en revisión";
  sentAgo: string;
};

export type Message = {
  id: string;
  name: string;
  avatar: string;
  preview: string;
  time: string;
  unread: number;
};

export type Stats = {
  role: "freelancer" | "client";
  rating: number;
  hasRating?: boolean;
  projectsDone: number;
  earnings: string;
  responseRate: number;
  hints: {
    rating: string;
    projects: string;
    earnings: string;
    response: string;
  };
  applicationsPending?: number;
  applicationsTotal?: number;
  openJobs?: number;
  activeJobs?: number;
  totalJobs?: number;
  applicationsReceived?: number;
  applicationsPendingReview?: number;
  talentPool?: number;
};

export type ProfileSkill = {
  id: number;
  name: string;
  category?: string | null;
  level?: string | null;
};

export type PortfolioItem = {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  url: string | null;
  technologies: string[];
};

export type UserProfile = {
  id: number;
  name: string;
  username: string | null;
  email?: string;
  role: string;
  city: string | null;
  avatar: string | null;
  bio: string | null;
  rating: number;
  verified: boolean;
  github: string | null;
  linkedin: string | null;
  experience: string | null;
  skills: ProfileSkill[];
  portfolio: PortfolioItem[];
  created_at: string;
};

export type GitHubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  html_url: string;
  stars: number;
  updated_at: string;
};

export type GitHubGeneratedProfile = {
  bio: string;
  skills: string[];
  summary: string;
  source: string;
};

export type ApplyContextSkill = {
  name: string;
  level: number;
  level_label: string;
};

export type SkillRecommendation = {
  skill: string;
  display_name: string;
  demand_percent: number;
  open_jobs: number;
  why_learn: string;
  impact_on_match: string;
  priority: "alta" | "media" | "baja";
};

export type SkillRecommendationsResult = {
  profile_score: number;
  profile_tips: string[];
  your_skills: string[];
  market_summary: string;
  top_demanded: { skill: string; count: number }[];
  recommendations: SkillRecommendation[];
  source: string;
};

export type JobMatchCoachMissingSkill = {
  skill: string;
  display_name: string;
  why_learn: string;
  priority: "alta" | "media" | "baja";
};

export type JobMatchCoach = {
  job_id: number;
  job_title: string;
  company: string;
  current_match: number;
  alert_level: "low" | "medium" | "ok";
  alert_message: string;
  summary: string;
  matched_skills: string[];
  missing_skills: JobMatchCoachMissingSkill[];
  profile_tips: string[];
  profile_score: number;
  estimated_match_after: number;
  ready_to_apply: boolean;
  apply_advice: string;
  source: string;
};

export type SkillQuizQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type SkillQuizStart = {
  quiz_id: string;
  skill: string;
  passing_score: number;
  questions: SkillQuizQuestion[];
  source?: string;
};

export type SkillQuizReviewItem = {
  concept?: string;
  question: string;
  your_answer: string;
  correct_answer: string;
  why_yours_was_wrong?: string;
  explanation: string;
  example?: string;
};

export type SkillQuizResult = {
  passed: boolean;
  score: number;
  correct_count: number;
  total: number;
  passing_score: number;
  skill: string;
  message: string;
  review: SkillQuizReviewItem[];
  can_add_to_profile: boolean;
  study_tip: string | null;
};

export type LearnSkillResult = {
  skill: string;
  overview: string;
  why_for_you: string;
  basics: { concept: string; explanation: string; example?: string }[];
  first_steps: string[];
  practice_idea: string;
  add_to_profile_tip: string;
  source?: string;
};

export type ApplyContext = {
  job: {
    id: number;
    title: string;
    company: string;
    budget: string;
  };
  proposal: {
    message: string;
    price: string;
    delivery_time: string;
  };
  cv: {
    name: string;
    initials: string;
    headline: string;
    city: string | null;
    bio: string | null;
    verified: boolean;
    trust_score: number;
    professional_score: number;
    trust_label: string;
    skills: ApplyContextSkill[];
    match: number;
  };
};
