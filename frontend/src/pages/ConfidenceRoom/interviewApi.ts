import { postApi } from "../../apiClient";
import { supabase } from "../../supabaseClient";

// Must match frontend/api/_lib/interview/limits.ts.
export const SETUP_LIMITS = { company: 120, role: 120, jobDescription: 8000 };
export const QUESTION_COUNTS = [5, 8, 10];
export const DEFAULT_QUESTION_COUNT = 8;
export const ANSWER_MAX_LENGTH = 6000;

export type InterviewStyle = "mixed" | "behavioural" | "technical";
export type QuestionType = "behavioural" | "technical";

export const STYLE_OPTIONS: { value: InterviewStyle; label: string; hint: string }[] = [
  {
    value: "mixed",
    label: "A mix",
    hint: "Behavioural and technical, like most real interviews.",
  },
  {
    value: "behavioural",
    label: "Behavioural",
    hint: "How you work, handle situations and get along with people.",
  },
  {
    value: "technical",
    label: "Technical",
    hint: "The skills and know-how the role needs.",
  },
];

// Must match frontend/api/_lib/interview/limits.ts.
export const RATING_LABELS: Record<number, string> = {
  1: "Getting started",
  2: "Building",
  3: "Solid foundation",
  4: "Interview-ready",
  5: "Standout",
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  behavioural: "Behavioural",
  technical: "Technical",
};

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

export type Feedback = {
  overall: string;
  strengths: string[];
  improvements: string[];
  stronger_answer: string;
  follow_up: string;
};

export type InterviewAnswer = {
  id: string;
  question_id: string;
  answer: string;
  spoken: boolean;
  feedback: Feedback;
  created_at: string;
};

export type InterviewSummary = {
  headline: string;
  overall: string;
  strengths: string[];
  areas_to_improve: string[];
  next_steps: string[];
  questions: { id: string; rating: number; note: string }[];
};

export type InterviewSession = {
  id: string;
  company: string;
  role: string;
  job_description: string | null;
  style: InterviewStyle;
  used_resume: boolean;
  questions: InterviewQuestion[];
  summary: InterviewSummary | null;
  rating: number | null;
  completed_at: string | null;
  created_at: string;
};

export type SessionSummary = InterviewSession & { answeredCount: number };

const SESSION_COLUMNS =
  "id, company, role, job_description, style, used_resume, questions, summary, rating, completed_at, created_at";

// Has Gemini write the questions. Returns the new session's ID.
export async function createInterview(setup: InterviewSetup) {
  const { sessionId } = await postApi<{ sessionId: string }>(
    "/api/interview-questions",
    { setup },
  );
  return sessionId;
}

// Ends the interview: an overall review and rating of every answer.
export async function finishInterview(sessionId: string) {
  return postApi<{ summary: InterviewSummary; rating: number }>(
    "/api/interview-summary",
    { sessionId },
  );
}

// A fresh session for the same job, with new questions.
export function practiseAgain(session: InterviewSession) {
  return createInterview({
    company: session.company,
    role: session.role,
    jobDescription: session.job_description ?? "",
    style: session.style,
    questionCount: QUESTION_COUNTS.includes(session.questions.length)
      ? session.questions.length
      : DEFAULT_QUESTION_COUNT,
    useResume: session.used_resume,
  });
}

export async function getFeedback(request: {
  sessionId: string;
  questionId: string;
  answer: string;
  spoken: boolean;
}) {
  const { answerId, feedback } = await postApi<{
    answerId: string;
    feedback: Feedback;
  }>("/api/interview-feedback", request);
  return { answerId, feedback };
}

// Recent sessions with how many questions have been answered.
export async function listSessions(): Promise<SessionSummary[]> {
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(SESSION_COLUMNS)
    .not("questions", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  const sessions = data as InterviewSession[];
  if (!sessions.length) return [];

  const { data: answers, error: answersError } = await supabase
    .from("interview_answers")
    .select("session_id, question_id")
    .in(
      "session_id",
      sessions.map((session) => session.id),
    );
  if (answersError) throw answersError;

  return sessions.map((session) => ({
    ...session,
    answeredCount: new Set(
      (answers ?? [])
        .filter((answer) => answer.session_id === session.id)
        .map((answer) => answer.question_id),
    ).size,
  }));
}

export async function loadSession(sessionId: string) {
  const [session, answers] = await Promise.all([
    supabase
      .from("interview_sessions")
      .select(SESSION_COLUMNS)
      .eq("id", sessionId)
      .not("questions", "is", null)
      .maybeSingle(),
    supabase
      .from("interview_answers")
      .select("id, question_id, answer, spoken, feedback, created_at")
      .eq("session_id", sessionId)
      .order("created_at"),
  ]);
  if (session.error) throw session.error;
  if (answers.error) throw answers.error;
  if (!session.data) return null;
  return {
    session: session.data as InterviewSession,
    answers: answers.data as InterviewAnswer[],
  };
}

export async function deleteSession(sessionId: string) {
  const { error } = await supabase
    .from("interview_sessions")
    .delete()
    .eq("id", sessionId);
  if (error) throw error;
}

// What gets read aloud after an answer: the gist, not every bullet.
export function feedbackToSpeech(feedback: Feedback) {
  return [
    feedback.overall,
    feedback.improvements.length
      ? `To make it stronger: ${feedback.improvements.join(" ")}`
      : "",
    feedback.follow_up ? `They might follow up with: ${feedback.follow_up}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function summaryToSpeech(summary: InterviewSummary, rating: number) {
  return [
    `Overall, ${rating} out of 5: ${RATING_LABELS[rating]}.`,
    summary.headline,
    summary.overall,
    summary.next_steps.length ? `Before the real thing: ${summary.next_steps.join(" ")}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// Per-browser settings, like voice mode. Storage can be unavailable (private
// windows), so failures fall back to the default.
export function readSetting(key: string, fallback: boolean) {
  try {
    const value = localStorage.getItem(`confidenceRoom.${key}`);
    return value === null ? fallback : value === "true";
  } catch {
    return fallback;
  }
}

export function saveSetting(key: string, value: boolean) {
  try {
    localStorage.setItem(`confidenceRoom.${key}`, String(value));
  } catch {
    // Not saved; it still applies until the page closes.
  }
}
