// Shared types for the Confidence Room (mock interview) API.

export const INTERVIEW_STYLES = ["mixed", "behavioural", "technical"] as const;
export type InterviewStyle = (typeof INTERVIEW_STYLES)[number];

export const QUESTION_TYPES = ["behavioural", "technical"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

// What the person filled in before starting, after validation.
export type InterviewSetup = {
  company: string;
  role: string;
  jobDescription: string;
  style: InterviewStyle;
  questionCount: number;
  useResume: boolean;
};

export type InterviewQuestion = {
  id: string;
  type: QuestionType;
  question: string;
  looking_for: string;
  tip: string;
};

export type InterviewSession = {
  id: string;
  company: string;
  role: string;
  job_description: string | null;
  style: InterviewStyle;
  questions: InterviewQuestion[] | null;
  summary: InterviewSummary | null;
  rating: number | null;
  completed_at: string | null;
};

// The final answer to each question, with its feedback.
export type SavedAnswer = {
  question_id: string;
  answer: string;
  feedback: Feedback;
  created_at: string;
};

// The review at the end of an interview.
export type InterviewSummary = {
  headline: string;
  overall: string;
  strengths: string[];
  areas_to_improve: string[];
  next_steps: string[];
  questions: { id: string; rating: number; note: string }[];
};

export type Feedback = {
  overall: string;
  strengths: string[];
  improvements: string[];
  stronger_answer: string;
  follow_up: string;
};

// The parts of the person's profile the AI gets to see.
export type InterviewProfile = {
  field: string | null;
  experience_level: string | null;
  city: string | null;
  bio: string | null;
  resume_path: string | null;
};
