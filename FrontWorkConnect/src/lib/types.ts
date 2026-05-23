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
  rating: number;
  projectsDone: number;
  earnings: string;
  responseRate: number;
};

export type ApplyContextSkill = {
  name: string;
  level: number;
  level_label: string;
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
