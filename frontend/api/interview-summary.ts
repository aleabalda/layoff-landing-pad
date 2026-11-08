// POST /api/interview-summary
//
// Ends a Confidence Room mock interview: Google Gemini reviews every final
// answer and gives an overall rating and summary, which is saved with the
// session. Asking again for a finished interview returns the saved summary.

import { getConfig } from "./_lib/config.js";
import { createUserClient } from "./_lib/database.js";
import { generateJson } from "./_lib/gemini.js";
import { getBearerToken, handle, HttpError, readJsonBody } from "./_lib/helpers.js";
import { getAnswers, getSession, saveSummary } from "./_lib/interview/database.js";
import { finalAnswers } from "./_lib/interview/progress.js";
import {
  buildSummaryPrompt,
  SUMMARY_SCHEMA,
  SUMMARY_SYSTEM_PROMPT,
} from "./_lib/interview/prompts.js";
import { cleanSummary } from "./_lib/interview/validation.js";

export function POST(request: Request) {
  return handle("interview-summary", () => summarize(request));
}

async function summarize(request: Request) {
  const token = getBearerToken(request);
  const config = getConfig();
  const body = await readJsonBody(request);
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
    throw new HttpError(400, "That request wasn't valid.");
  }

  const supabase = createUserClient(config, token);
  const session = await getSession(supabase, sessionId);
  if (session.summary && session.rating) {
    return { summary: session.summary, rating: session.rating };
  }

  const questions = session.questions ?? [];
  const answers = finalAnswers(questions, await getAnswers(supabase, session.id));

  const result = await generateJson({
    apiKey: config.geminiKey,
    model: config.model,
    system: SUMMARY_SYSTEM_PROMPT,
    prompt: buildSummaryPrompt(session, answers),
    schema: SUMMARY_SCHEMA,
  });
  const { summary, rating } = cleanSummary(
    result.data,
    questions.map((q) => q.id),
  );

  await saveSummary(supabase, session.id, summary, rating);
  return { summary, rating };
}
