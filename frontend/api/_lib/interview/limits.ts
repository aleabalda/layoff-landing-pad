// Limits for the Confidence Room.
//
// Field lengths must match frontend/src/pages/ConfidenceRoom/interviewApi.ts,
// and the daily limits must match start_interview_session() and
// save_interview_answer() in supabase/migrations/20261108120000_confidence_room.sql.

export const SETUP_LIMITS = {
  company: 120,
  role: 120,
  jobDescription: 8000,
};

export const QUESTION_COUNTS = [5, 8, 10];
export const DEFAULT_QUESTION_COUNT = 8;

export const ANSWER_MAX_LENGTH = 6000;

// The overall rating at the end of an interview. Must match the check on
// interview_sessions.rating and frontend/src/pages/ConfidenceRoom/interviewApi.ts.
export const RATING_LABELS: Record<number, string> = {
  1: "Getting started",
  2: "Building",
  3: "Solid foundation",
  4: "Interview-ready",
  5: "Standout",
};

export const DAILY_ANSWER_LIMIT = 100;

// How much of a job description goes into each feedback request. The whole
// posting is used for the questions; feedback only needs the gist.
export const FEEDBACK_JOB_DESCRIPTION_CHARS = 3000;
