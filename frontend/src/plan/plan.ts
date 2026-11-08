import { addDays, daysBetween, localDate } from "../dates";
import { supabase } from "../supabaseClient";
import { DAYS_PER_WEEK, PLAN_LENGTH_DAYS, buildPlan } from "./planTemplate";

// Builds the person's plan from the template and saves it, starting today.
// Safe to call again: if they already have a plan, nothing changes. Returns
// the plan's start date.
export async function createPlan(
  exitType: string | null,
  need: string | null,
): Promise<string> {
  const { data, error } = await supabase.rpc("create_plan", {
    new_start_date: localDate(),
    new_tasks: buildPlan(exitType, need),
  });
  if (error) throw error;
  return data as string;
}

// Day 1 is the start date. Can be past PLAN_LENGTH_DAYS once the plan is over.
export function planDayNumber(startDate: string, today = localDate()) {
  // A start date a day ahead (time zones) still counts as day 1.
  return Math.max(1, daysBetween(startDate, today) + 1);
}

export function isPlanFinished(startDate: string) {
  return planDayNumber(startDate) > PLAN_LENGTH_DAYS;
}

export function weekAndDay(dayNumber: number) {
  return {
    week: Math.ceil(dayNumber / DAYS_PER_WEEK),
    day: ((dayNumber - 1) % DAYS_PER_WEEK) + 1,
  };
}

export function dateForPlanDay(startDate: string, week: number, day: number) {
  return addDays(startDate, (week - 1) * DAYS_PER_WEEK + day - 1);
}
