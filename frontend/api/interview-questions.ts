// POST /api/interview-questions
//
// Starts a Confidence Room mock interview: Google Gemini writes interview
// questions that match the job posting and, if they agree, the person's resume.
// Returns the new session's ID and its questions.

import { getConfig } from "./_lib/config.js";
import { createUserClient, downloadResume } from "./_lib/database.js";
import { generateJson } from "./_lib/gemini.js";
import { getBearerToken, handle, HttpError, readJsonBody } from "./_lib/helpers.js";
import {
  finishSession,
  getInterviewProfile,
  startSession,
} from "./_lib/interview/database.js";
import {
  buildQuestionsPrompt,
  QUESTIONS_SCHEMA,
  QUESTIONS_SYSTEM_PROMPT,
} from "./_lib/interview/prompts.js";
import { cleanQuestions, parseSetup } from "./_lib/interview/validation.js";

export function POST(request: Request) {
  return handle("interview-questions", () => createQuestions(request));
}

async function createQuestions(request: Request) {
  const token = getBearerToken(request);
  const config = getConfig();
  const setup = parseSetup((await readJsonBody(request)).setup);

  const supabase = createUserClient(config, token);
  const profile = await getInterviewProfile(supabase);

  const useResume = setup.useResume && !!profile.resume_path;
  const sessionId = await startSession(supabase, setup, useResume);
  const resume =
    useResume && profile.resume_path
      ? await downloadResume(supabase, profile.resume_path)
      : null;

  const result = await generateJson({
    apiKey: config.geminiKey,
    model: config.model,
    system: QUESTIONS_SYSTEM_PROMPT,
    prompt: buildQuestionsPrompt(setup, profile, !!resume),
    schema: QUESTIONS_SCHEMA,
    pdfBase64: resume,
    pdfLabel: "Their resume (PDF):",
  });

  const questions = cleanQuestions(result.data, setup.questionCount);
  if (questions.length < 3) {
    throw new HttpError(
      502,
      "The AI didn't come up with enough questions. Please try again.",
    );
  }

  await finishSession(supabase, sessionId, questions, result.model);
  return { sessionId, questions };
}
