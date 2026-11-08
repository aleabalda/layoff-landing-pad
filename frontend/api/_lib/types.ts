// Shared types for the plan personalization API.

export const ENERGIES = ["low", "medium", "high"] as const;
export type Energy = (typeof ENERGIES)[number];

// What the person told us on the Plan page, after validation.
export type Answers = {
  situation: string;
  goal: string;
  time: string | null;
  harder: string;
  moreOrLess: string;
  useResume: boolean;
};

// The parts of the person's profile the AI gets to see.
export type Profile = {
  job_end_reason: string | null;
  urgent_need: string | null;
  field: string | null;
  experience_level: string | null;
  city: string | null;
  tags: string[];
  bio: string | null;
  plan_start_date: string | null;
  resume_path: string | null;
};

export type PlanTask = {
  id: string;
  week: number;
  day: number;
  category: string;
  energy_level: string;
  title: string;
  link_url: string | null;
};

// One rewritten task, as the AI returned it.
export type SuggestedTask = { ref: string; title: string; energy: Energy };

export type Suggestions = { summary: string; tasks: SuggestedTask[] };

// What finish_plan_personalization() saves.
export type TaskUpdate = { id: string; title: string; energy: Energy };
