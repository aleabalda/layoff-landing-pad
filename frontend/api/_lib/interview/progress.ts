// The one-question-at-a-time rule for mock interviews. The database enforces
// it too (save_interview_answer()); checking here first means a request that
// breaks it never reaches Gemini.

import { HttpError } from "../helpers.js";
import type { InterviewQuestion, InterviewSession, SavedAnswer } from "./types.js";

// Throws unless this question is the one being worked on: every earlier
// question answered, and no later one. Retrying the current question is fine.
export function assertCanAnswer(
  session: InterviewSession,
  answers: SavedAnswer[],
  questionId: string,
) {
  if (session.completed_at) {
    throw new HttpError(400, "This interview is finished. Start a new one to keep practising.");
  }
  const questions = session.questions ?? [];
  const position = questions.findIndex((q) => q.id === questionId);
  if (position === -1) throw new HttpError(404, "That question wasn't found.");

  const answered = new Set(answers.map((a) => a.question_id));
  const skipsAhead = questions.slice(0, position).some((q) => !answered.has(q.id));
  const goesBack = questions.slice(position + 1).some((q) => answered.has(q.id));
  if (skipsAhead || goesBack) {
    throw new HttpError(400, "Questions are answered one at a time, in order.");
  }
  return questions[position];
}

// Each question with its most recent answer, in interview order. Throws if any
// question hasn't been answered yet.
export function finalAnswers(questions: InterviewQuestion[], answers: SavedAnswer[]) {
  return questions.map((question) => {
    const attempts = answers.filter((a) => a.question_id === question.id);
    const latest = attempts.at(-1);
    if (!latest) throw new HttpError(400, "Answer every question first.");
    return { question, answer: latest, attempts: attempts.length };
  });
}
