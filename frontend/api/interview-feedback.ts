// POST /api/interview-feedback
//
// Gives Confidence Room feedback on one answer, typed or spoken, with Google
// Gemini, and saves the answer and feedback to the person's session.

import { getConfig } from "./_lib/config.js";
import { createUserClient } from "./_lib/database.js";
import { generateJson } from "./_lib/gemini.js";
import { getBearerToken, handle, readJsonBody } from "./_lib/helpers.js";
import {
  assertUnderAnswerLimit,
  getAnswers,
  getSession,
  saveAnswer,
} from "./_lib/interview/database.js";
import { assertCanAnswer } from "./_lib/interview/progress.js";
import {
  buildFeedbackPrompt,
  FEEDBACK_SCHEMA,
  FEEDBACK_SYSTEM_PROMPT,
} from "./_lib/interview/prompts.js";
import { cleanFeedback, parseAnswerRequest } from "./_lib/interview/validation.js";

export function POST(request: Request) {
  return handle("interview-feedback", () => giveFeedback(request));
}

async function giveFeedback(request: Request) {
  const token = getBearerToken(request);
  const config = getConfig();
  const input = parseAnswerRequest(await readJsonBody(request));

  const supabase = createUserClient(config, token);
  const session = await getSession(supabase, input.sessionId);
  const answers = await getAnswers(supabase, session.id);
  const question = assertCanAnswer(session, answers, input.questionId);

  await assertUnderAnswerLimit(supabase);

  const result = await generateJson({
    apiKey: config.geminiKey,
    model: config.model,
    system: FEEDBACK_SYSTEM_PROMPT,
    prompt: buildFeedbackPrompt(session, question, input.answer, input.spoken),
    schema: FEEDBACK_SCHEMA,
  });
  const feedback = cleanFeedback(result.data);

  const answerId = await saveAnswer(supabase, {
    ...input,
    feedback,
    model: result.model,
  });
  return { answerId, feedback };
}
