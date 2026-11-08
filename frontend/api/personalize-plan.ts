// POST /api/personalize-plan
//
// Rewrites the signed-in person's tasks for the current week of their plan with
// Google Gemini, using what they told us on the Plan page and, if they agree,
// their resume.
//
// The pieces live in api/_lib/. Vercel turns every file in api/ into its own
// endpoint unless its name starts with "_", so only this file is a route.

import { getConfig } from "./_lib/config.js";
import {
  createUserClient,
  downloadResume,
  finishPersonalization,
  getProfile,
  getWeekTasks,
  startPersonalization,
} from "./_lib/database.js";
import { askGemini } from "./_lib/gemini.js";
import { getBearerToken, handle, HttpError, readJsonBody } from "./_lib/helpers.js";
import { buildPrompt, toTaskRefs, toTaskUpdates } from "./_lib/prompt.js";
import { planWeekOn } from "./_lib/utils.js";
import { parseAnswers, parseLocalDate } from "./_lib/validation.js";

export function POST(request: Request) {
  return handle("personalize-plan", () => personalize(request));
}

async function personalize(request: Request) {
  const token = getBearerToken(request);
  const config = getConfig();

  const body = await readJsonBody(request);
  const answers = parseAnswers(body.answers);
  const today = parseLocalDate(body.today);

  const supabase = createUserClient(config, token);
  const profile = await getProfile(supabase);
  if (!profile.plan_start_date) throw new HttpError(400, "Build your plan first.");

  const week = planWeekOn(profile.plan_start_date, today);
  if (!week) throw new HttpError(400, "You've finished your 30-day plan.");

  const tasks = await getWeekTasks(supabase, week);
  if (!tasks.length) {
    throw new HttpError(400, "You've done every task this week, so there's nothing left to personalize.");
  }

  const useResume = answers.useResume && !!profile.resume_path;
  const attemptId = await startPersonalization(supabase, answers, useResume);
  const resume =
    useResume && profile.resume_path
      ? await downloadResume(supabase, profile.resume_path)
      : null;

  const refs = toTaskRefs(tasks);
  const suggestions = await askGemini(
    config.geminiKey,
    config.model,
    buildPrompt(profile, answers, week, refs, !!resume),
    resume,
  );

  const updated = await finishPersonalization(
    supabase,
    attemptId,
    suggestions.model, // The fallback, if the main model was busy.
    suggestions.summary,
    toTaskUpdates(suggestions, refs),
  );

  return { summary: suggestions.summary, updated, week };
}
