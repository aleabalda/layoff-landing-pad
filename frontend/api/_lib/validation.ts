// Checks what comes in from the browser and what comes back from the AI.

import { HttpError } from "./helpers.js";
import type { Answers } from "./types.js";
import { toSingleLine } from "./utils.js";

// Must match frontend/src/plan/personalize.ts.
export const ANSWER_LIMITS = {
  situation: 1500,
  goal: 300,
  harder: 600,
  moreOrLess: 300,
};

export const TIME_OPTIONS = [
  "under_30_minutes",
  "about_an_hour",
  "a_few_hours",
  "most_of_the_day",
];

// Must match the check in finish_plan_personalization().
const TITLE_LENGTH = { min: 3, max: 160 };

export function parseAnswers(raw: unknown): Answers {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const text = (key: keyof typeof ANSWER_LIMITS) => {
    const value = typeof input[key] === "string" ? input[key].trim() : "";
    if (value.length > ANSWER_LIMITS[key]) {
      throw new HttpError(400, "One of your answers is too long.");
    }
    return value;
  };

  const time = typeof input.time === "string" ? input.time : null;
  const answers: Answers = {
    situation: text("situation"),
    goal: text("goal"),
    time: time && TIME_OPTIONS.includes(time) ? time : null,
    harder: text("harder"),
    moreOrLess: text("moreOrLess"),
    useResume: input.useResume === true,
  };

  if (!answers.situation) {
    throw new HttpError(400, "Tell us a little about what's going on first.");
  }
  return answers;
}

// The person's local date, which the browser sends as YYYY-MM-DD.
export function parseLocalDate(raw: unknown) {
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  throw new HttpError(400, "That request wasn't valid.");
}

// A task title from the AI as one line of plain text, or null if it's unusable.
export function cleanTitle(raw: string) {
  const title = toSingleLine(raw).replace(/^[-*•]\s*/, "");
  return title.length >= TITLE_LENGTH.min && title.length <= TITLE_LENGTH.max
    ? title
    : null;
}
