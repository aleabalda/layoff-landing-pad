// Checks what comes in from the browser and what comes back from the AI for
// the Confidence Room.

import { HttpError } from "../helpers.js";
import { toSingleLine } from "../utils.js";
import {
  ANSWER_MAX_LENGTH,
  DEFAULT_QUESTION_COUNT,
  QUESTION_COUNTS,
  SETUP_LIMITS,
} from "./limits.js";
import {
  type Feedback,
  type InterviewSummary,
  INTERVIEW_STYLES,
  type InterviewQuestion,
  type InterviewSetup,
  type InterviewStyle,
  QUESTION_TYPES,
  type QuestionType,
} from "./types.js";

const asRecord = (raw: unknown) =>
  (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

const asText = (raw: unknown) => (typeof raw === "string" ? raw.trim() : "");

export function parseSetup(raw: unknown): InterviewSetup {
  const input = asRecord(raw);
  const company = asText(input.company);
  const role = asText(input.role);
  const jobDescription = asText(input.jobDescription);

  if (!company || !role) {
    throw new HttpError(400, "Please add the company and the role.");
  }
  if (
    company.length > SETUP_LIMITS.company ||
    role.length > SETUP_LIMITS.role ||
    jobDescription.length > SETUP_LIMITS.jobDescription
  ) {
    throw new HttpError(400, "One of your answers is too long.");
  }

  const style = INTERVIEW_STYLES.includes(input.style as InterviewStyle)
    ? (input.style as InterviewStyle)
    : "mixed";
  const questionCount = QUESTION_COUNTS.includes(input.questionCount as number)
    ? (input.questionCount as number)
    : DEFAULT_QUESTION_COUNT;

  return {
    company,
    role,
    jobDescription,
    style,
    questionCount,
    useResume: input.useResume === true,
  };
}

export function parseAnswerRequest(raw: unknown) {
  const input = asRecord(raw);
  const sessionId = asText(input.sessionId);
  const questionId = asText(input.questionId);
  const answer = asText(input.answer);

  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || !/^q\d{1,2}$/.test(questionId)) {
    throw new HttpError(400, "That request wasn't valid.");
  }
  if (!answer) throw new HttpError(400, "Add an answer first.");
  if (answer.length > ANSWER_MAX_LENGTH) {
    throw new HttpError(400, "That answer is too long. Try keeping it under a few minutes.");
  }

  return { sessionId, questionId, answer, spoken: input.spoken === true };
}

// One line of text, or "" if it's missing or too long to be sensible.
function cleanLine(raw: unknown, maxLength: number) {
  const text = toSingleLine(typeof raw === "string" ? raw : "");
  return text.length <= maxLength ? text : text.slice(0, maxLength).trimEnd() + "…";
}

// The AI's questions, numbered q1, q2... Drops any that are unusable.
export function cleanQuestions(raw: unknown, count: number): InterviewQuestion[] {
  const items = asRecord(raw).questions;
  if (!Array.isArray(items)) return [];

  const questions: InterviewQuestion[] = [];
  for (const item of items) {
    const record = asRecord(item);
    const question = cleanLine(record.question, 400);
    if (question.length < 10) continue;
    const type = QUESTION_TYPES.includes(record.type as QuestionType)
      ? (record.type as QuestionType)
      : "behavioural";
    questions.push({
      id: `q${questions.length + 1}`,
      type,
      question,
      looking_for: cleanLine(record.looking_for, 300),
      tip: cleanLine(record.tip, 300),
    });
    if (questions.length === count) break;
  }
  return questions;
}

export function cleanFeedback(raw: unknown): Feedback {
  const record = asRecord(raw);
  const list = (value: unknown) =>
    (Array.isArray(value) ? value : [])
      .map((item) => cleanLine(item, 400))
      .filter(Boolean)
      .slice(0, 4);

  const feedback: Feedback = {
    overall: cleanLine(record.overall, 800),
    strengths: list(record.strengths),
    improvements: list(record.improvements),
    // Kept as paragraphs, since it reads like a spoken answer.
    stronger_answer:
      typeof record.stronger_answer === "string"
        ? record.stronger_answer.trim().slice(0, 1500)
        : "",
    follow_up: cleanLine(record.follow_up, 400),
  };

  if (!feedback.overall) {
    throw new HttpError(
      502,
      "The AI's feedback didn't come through properly. Please try again.",
    );
  }
  return feedback;
}

const clampRating = (raw: unknown) => {
  const rating = Math.round(Number(raw));
  return Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : null;
};

// The AI's end-of-interview review. Notes are kept only for real question IDs.
export function cleanSummary(raw: unknown, questionIds: string[]) {
  const record = asRecord(raw);
  const list = (value: unknown) =>
    (Array.isArray(value) ? value : [])
      .map((item) => cleanLine(item, 400))
      .filter(Boolean)
      .slice(0, 4);

  const rating = clampRating(record.rating);
  const summary: InterviewSummary = {
    headline: cleanLine(record.headline, 200),
    overall: cleanLine(record.overall, 1200),
    strengths: list(record.strengths),
    areas_to_improve: list(record.areas_to_improve),
    next_steps: list(record.next_steps),
    questions: (Array.isArray(record.questions) ? record.questions : [])
      .map((item) => {
        const entry = asRecord(item);
        return {
          id: asText(entry.id),
          rating: clampRating(entry.rating) ?? 3,
          note: cleanLine(entry.note, 400),
        };
      })
      .filter((entry, index, all) =>
        questionIds.includes(entry.id) &&
        all.findIndex((other) => other.id === entry.id) === index,
      ),
  };

  if (!rating || !summary.overall) {
    throw new HttpError(
      502,
      "The AI's review didn't come through properly. Please try again.",
    );
  }
  return { summary, rating };
}
