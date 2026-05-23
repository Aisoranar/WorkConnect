export type Job = {
  id: string;
  title: string;
  company: string;
  budget: string;
  location: string;
  remote: boolean;
  category: string;
  description: string;
  skills: string[];
  match: number;
  postedAgo: string;
  applicants: number;
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
