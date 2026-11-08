// Supabase calls for the Confidence Room. Like the rest of the API, these use
// the person's own token, so row-level security limits them to their own rows.

import type { SupabaseClient } from "@supabase/supabase-js";
import { fromDatabaseError, HttpError } from "../helpers.js";
import { DAILY_ANSWER_LIMIT } from "./limits.js";
import type {
  Feedback,
  InterviewProfile,
  InterviewQuestion,
  InterviewSession,
  InterviewSetup,
  InterviewSummary,
  SavedAnswer,
} from "./types.js";

// LP429 is the daily limit, raised by the database functions.
function rpcError(error: { code?: string; message: string }) {
  return new HttpError(error.code === "LP429" ? 429 : 400, error.message);
}

export async function getInterviewProfile(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("users")
    .select("field, experience_level, city, bio, resume_path")
    .maybeSingle();
  if (error || !data) throw new HttpError(401, "Please log in again.");
  return data as InterviewProfile;
}

// Records the session and enforces the daily limit. Returns its ID.
export async function startSession(
  supabase: SupabaseClient,
  setup: InterviewSetup,
  usedResume: boolean,
) {
  const { data, error } = await supabase.rpc("start_interview_session", {
    new_company: setup.company,
    new_role: setup.role,
    new_job_description: setup.jobDescription,
    new_style: setup.style,
    new_used_resume: usedResume,
  });
  if (error) throw rpcError(error);
  return data as string;
}

export async function finishSession(
  supabase: SupabaseClient,
  sessionId: string,
  questions: InterviewQuestion[],
  model: string,
) {
  const { error } = await supabase.rpc("finish_interview_session", {
    target_id: sessionId,
    new_questions: questions,
    new_model: model,
  });
  if (error) throw fromDatabaseError(error);
}

export async function getSession(supabase: SupabaseClient, sessionId: string) {
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("id, company, role, job_description, style, questions, summary, rating, completed_at")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw fromDatabaseError(error);
  if (!data?.questions) throw new HttpError(404, "That interview wasn't found.");
  return data as InterviewSession;
}

// Checked before calling Gemini, so a request over the limit costs nothing.
// save_interview_answer() checks again when saving.
export async function assertUnderAnswerLimit(supabase: SupabaseClient) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("interview_answers")
    .select("id", { count: "exact", head: true })
    .gt("created_at", since);
  if (error) throw fromDatabaseError(error);
  if ((count ?? 0) >= DAILY_ANSWER_LIMIT) {
    throw new HttpError(
      429,
      `You've practised ${DAILY_ANSWER_LIMIT} answers today. Please come back tomorrow.`,
    );
  }
}

export async function saveAnswer(
  supabase: SupabaseClient,
  answer: {
    sessionId: string;
    questionId: string;
    answer: string;
    spoken: boolean;
    feedback: Feedback;
    model: string;
  },
) {
  const { data, error } = await supabase.rpc("save_interview_answer", {
    target_session: answer.sessionId,
    new_question_id: answer.questionId,
    new_answer: answer.answer,
    new_spoken: answer.spoken,
    new_feedback: answer.feedback,
    new_model: answer.model,
  });
  if (error) throw rpcError(error);
  return data as string;
}

// Every answer in a session, oldest first.
export async function getAnswers(supabase: SupabaseClient, sessionId: string) {
  const { data, error } = await supabase
    .from("interview_answers")
    .select("question_id, answer, feedback, created_at")
    .eq("session_id", sessionId)
    .order("created_at");
  if (error) throw fromDatabaseError(error);
  return data as SavedAnswer[];
}

export async function saveSummary(
  supabase: SupabaseClient,
  sessionId: string,
  summary: InterviewSummary,
  rating: number,
) {
  const { error } = await supabase.rpc("save_interview_summary", {
    target_id: sessionId,
    new_summary: summary,
    new_rating: rating,
  });
  if (error) throw rpcError(error);
}
