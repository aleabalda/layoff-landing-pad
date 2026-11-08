// Settings for the personalization API, read from the environment.
//
// Set these in frontend/.env locally and in Vercel's project settings when
// deployed:
//   GEMINI_API_KEY (or LLM_API_KEY)    secret, never prefixed with VITE_
//   GEMINI_MODEL                        optional, defaults to DEFAULT_MODEL
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (or SUPABASE_URL / SUPABASE_ANON_KEY)

import { HttpError } from "./helpers.js";

export const DEFAULT_MODEL = "gemini-3.8-flash";

// Stays under the 60-second limit set for this function in vercel.json.
export const GEMINI_TIMEOUT_MS = 55_000;

export type Config = {
  supabaseUrl: string;
  supabaseKey: string;
  geminiKey: string;
  model: string;
};

export function getConfig(): Config {
  const env = process.env;
  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const supabaseKey =
    env.SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const geminiKey = env.GEMINI_API_KEY ?? env.LLM_API_KEY;

  if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error("personalize-plan is missing Supabase or Gemini settings");
    throw new HttpError(500, "Personalization isn't set up yet.");
  }

  return {
    supabaseUrl,
    supabaseKey,
    geminiKey,
    model: env.GEMINI_MODEL || DEFAULT_MODEL,
  };
}
