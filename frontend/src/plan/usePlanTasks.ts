import { useEffect, useState } from "react";
import { localDate } from "../dates";
import { supabase } from "../supabaseClient";
import type { Category, Energy } from "./planTemplate";

export type PlanTask = {
  id: string;
  week: number;
  day: number;
  category: Category;
  energy_level: Energy;
  title: string;
  link_url: string | null;
  done: boolean;
  personalized_at: string | null;
};

// Fired after a task is ticked or unticked, so other views (the calendar) can
// refresh.
export const PLAN_TASKS_CHANGED = "plan-tasks-changed";

// Fired when task wording changes (personalized or restored), so every list
// of tasks loads them again.
export const PLAN_TASKS_REPLACED = "plan-tasks-replaced";

const COLUMNS =
  "id, week, day, category, energy_level, title, link_url, done, personalized_at";

// Loads the signed-in person's plan tasks: one day's, or the whole plan.
export function usePlanTasks(only?: { week: number; day: number }) {
  const [tasks, setTasks] = useState<PlanTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const week = only?.week;
  const day = only?.day;

  const [version, setVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setVersion((v) => v + 1);
    window.addEventListener(PLAN_TASKS_REPLACED, refresh);
    return () => window.removeEventListener(PLAN_TASKS_REPLACED, refresh);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    let query = supabase.from("tasks").select(COLUMNS).not("day", "is", null);
    if (week !== undefined && day !== undefined) {
      query = query.eq("week", week).eq("day", day);
    }

    query
      .order("week")
      .order("day")
      .order("position")
      .then(({ data, error }) => {
        if (!isCurrent) return;
        if (error) setError(error.message);
        else setTasks(data as PlanTask[]);
      });

    return () => {
      isCurrent = false;
    };
  }, [week, day, version]);

  const setDone = (id: string, done: boolean) =>
    setTasks(
      (current) =>
        current?.map((task) => (task.id === id ? { ...task, done } : task)) ??
        null,
    );

  // Ticking a task also records it as a small win for the Profile page.
  const toggle = async (task: PlanTask) => {
    setError(null);
    setDone(task.id, !task.done);

    const { error } = await supabase.rpc("set_task_done", {
      target_task_id: task.id,
      new_done: !task.done,
      local_date: localDate(),
    });

    if (error) {
      setError("Couldn't save that. Please try again.");
      setDone(task.id, task.done);
    } else {
      window.dispatchEvent(new Event(PLAN_TASKS_CHANGED));
    }
  };

  return { tasks, error, toggle };
}
