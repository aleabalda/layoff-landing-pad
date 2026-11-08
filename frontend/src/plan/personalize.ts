import { useEffect, useState } from "react";
import { localDate } from "../dates";
import type { Option } from "../profileOptions";
import { postApi } from "../apiClient";
import { supabase } from "../supabaseClient";
import { PLAN_TASKS_CHANGED, PLAN_TASKS_REPLACED } from "./usePlanTasks";

// Must match frontend/api/personalize-plan.ts.
export const ANSWER_LIMITS = {
  situation: 1500,
  goal: 300,
  harder: 600,
  moreOrLess: 300,
};

export const TIME_OPTIONS: Option[] = [
  { value: "under_30_minutes", label: "Under 30 minutes" },
  { value: "about_an_hour", label: "About an hour" },
  { value: "a_few_hours", label: "A few hours" },
  { value: "most_of_the_day", label: "Most of the day" },
];

export type PersonalizeAnswers = {
  situation: string;
  goal: string;
  time: string | null;
  harder: string;
  moreOrLess: string;
  useResume: boolean;
};

export const EMPTY_ANSWERS: PersonalizeAnswers = {
  situation: "",
  goal: "",
  time: null,
  harder: "",
  moreOrLess: "",
  useResume: true,
};

export type Personalization = {
  answers: PersonalizeAnswers;
  summary: string | null;
  tasks_updated: number | null;
  finished_at: string;
};

function announceNewTasks() {
  window.dispatchEvent(new Event(PLAN_TASKS_REPLACED));
  window.dispatchEvent(new Event(PLAN_TASKS_CHANGED));
}

// Asks our API (which calls Gemini on the server) to rewrite this week's tasks.
export async function personalizePlan(answers: PersonalizeAnswers) {
  const body = await postApi<{ summary?: string; updated?: number }>(
    "/api/personalize-plan",
    { answers, today: localDate() },
  );
  announceNewTasks();
  return { summary: body.summary ?? "", updated: body.updated ?? 0 };
}

export async function restoreOriginalPlan() {
  const { data, error } = await supabase.rpc("restore_original_plan");
  if (error) throw error;
  announceNewTasks();
  return data as number;
}

// The most recent successful personalization, to show and to prefill the form.
export function useLatestPersonalization() {
  const [latest, setLatest] = useState<Personalization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((v) => v + 1);
    window.addEventListener(PLAN_TASKS_REPLACED, refresh);
    return () => window.removeEventListener(PLAN_TASKS_REPLACED, refresh);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    supabase
      .from("plan_personalizations")
      .select("answers, summary, tasks_updated, finished_at")
      .not("finished_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!isCurrent) return;
        setLatest(data as Personalization | null);
        setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [version]);

  return { latest, isLoading };
}
