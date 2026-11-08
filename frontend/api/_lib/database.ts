// Supabase calls for plan personalization.
//
// Every call uses the person's own Auth0 token, so row-level security applies
// just as it does in the browser: these can only read and change their own
// rows, and a bad token fails here, before Gemini is ever called.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Config } from "./config.js";
import { HttpError } from "./helpers.js";
import type { Answers, PlanTask, Profile, TaskUpdate } from "./types.js";
import { blobToBase64 } from "./utils.js";

const PROFILE_COLUMNS =
  "job_end_reason, urgent_need, field, experience_level, city, tags, bio, plan_start_date, resume_path";
const TASK_COLUMNS = "id, week, day, category, energy_level, title, link_url";
const RESUME_BUCKET = "resumes";

export function createUserClient(config: Config, token: string) {
  return createClient(config.supabaseUrl, config.supabaseKey, {
    accessToken: async () => token,
  });
}

export async function getProfile(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("users")
    .select(PROFILE_COLUMNS)
    .maybeSingle();
  if (error || !data) throw new HttpError(401, "Please log in again.");
  return data as Profile;
}

// The unfinished tasks in one week of the plan. Finished ones stay as they are.
// Later weeks are locked on the Plan page, so they're personalized when they
// open. One week (21 to 28 tasks) is also small enough for Gemini to answer
// in time.
export async function getWeekTasks(supabase: SupabaseClient, week: number) {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .eq("week", week)
    .eq("done", false)
    .not("day", "is", null)
    .order("day")
    .order("position");
  if (error) throw new HttpError(500, error.message);
  return data as PlanTask[];
}

// The resume as base64, or null if it can't be read. Personalizing without it
// is better than failing.
export async function downloadResume(supabase: SupabaseClient, path: string) {
  const { data, error } = await supabase.storage.from(RESUME_BUCKET).download(path);
  if (error || !data) {
    console.error("Couldn't download resume", error);
    return null;
  }
  return blobToBase64(data);
}

// Records the attempt and enforces the daily limit. Returns the attempt's ID.
export async function startPersonalization(
  supabase: SupabaseClient,
  answers: Answers,
  usedResume: boolean,
) {
  const { data, error } = await supabase.rpc("start_plan_personalization", {
    new_answers: answers,
    new_used_resume: usedResume,
  });
  if (error) {
    // LP429 is the daily limit, raised by start_plan_personalization().
    throw new HttpError(error.code === "LP429" ? 429 : 400, error.message);
  }
  return data as string;
}

// Saves the rewritten tasks. Returns how many changed.
export async function finishPersonalization(
  supabase: SupabaseClient,
  attemptId: string,
  model: string,
  summary: string,
  updates: TaskUpdate[],
) {
  const { data, error } = await supabase.rpc("finish_plan_personalization", {
    target_id: attemptId,
    new_model: model,
    new_summary: summary,
    updates,
  });
  if (error) throw new HttpError(500, error.message);
  return data as number;
}
