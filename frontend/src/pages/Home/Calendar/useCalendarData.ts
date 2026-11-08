import { useCallback, useEffect, useState } from "react";
import { PLAN_TASKS_CHANGED } from "../../../plan/usePlanTasks";
import { dateForPlanDay } from "../../../plan/plan";
import { supabase } from "../../../supabaseClient";
import type {
  CalendarApplication,
  CalendarEvent,
  CalendarPlanTask,
} from "./calendarTypes";

const groupBy = <T>(items: T[], key: (item: T) => string) => {
  const groups: Record<string, T[]> = {};
  for (const item of items) (groups[key(item)] ??= []).push(item);
  return groups;
};

// Everything the calendar shows between two local dates (inclusive), grouped
// by date. Plan tasks are loaded once for the whole plan.
export function useCalendarData(
  from: string,
  to: string,
  planStartDate: string | null | undefined,
) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [applications, setApplications] = useState<CalendarApplication[]>([]);
  const [planTasks, setPlanTasks] = useState<CalendarPlanTask[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      supabase
        .from("calendar_events")
        .select("id, title, kind, event_date, start_time, notes")
        .gte("event_date", from)
        .lte("event_date", to)
        .order("event_date")
        .order("start_time", { nullsFirst: true }),
      supabase
        .from("job_applications")
        .select("id, company, job_title, applied_on")
        .gte("applied_on", from)
        .lte("applied_on", to),
    ]).then(([eventsResult, appsResult]) => {
      if (!isCurrent) return;
      const failed = eventsResult.error ?? appsResult.error;
      if (failed) {
        setError(failed.message);
        return;
      }
      setError(null);
      setEvents(eventsResult.data as CalendarEvent[]);
      setApplications(appsResult.data as CalendarApplication[]);
    });

    return () => {
      isCurrent = false;
    };
  }, [from, to]);

  const loadPlan = useCallback(async () => {
    if (!planStartDate) return;
    const { data, error } = await supabase
      .from("tasks")
      .select("id, week, day, title, done")
      .not("day", "is", null)
      .order("position");
    if (error) setError(error.message);
    else setPlanTasks(data as CalendarPlanTask[]);
  }, [planStartDate]);

  // Reload when a task is ticked elsewhere on the page (Today's small wins).
  useEffect(() => {
    loadPlan();
    window.addEventListener(PLAN_TASKS_CHANGED, loadPlan);
    return () => window.removeEventListener(PLAN_TASKS_CHANGED, loadPlan);
  }, [loadPlan]);

  const addEvent = (event: CalendarEvent) =>
    setEvents((current) =>
      [...current, event].sort(
        (a, b) =>
          a.event_date.localeCompare(b.event_date) ||
          (a.start_time ?? "").localeCompare(b.start_time ?? ""),
      ),
    );
  const removeEvent = (id: string) =>
    setEvents((current) => current.filter((e) => e.id !== id));

  return {
    eventsByDate: groupBy(events, (e) => e.event_date),
    applicationsByDate: groupBy(applications, (a) => a.applied_on),
    planByDate: planStartDate
      ? groupBy(planTasks, (t) => dateForPlanDay(planStartDate, t.week, t.day))
      : {},
    error,
    addEvent,
    removeEvent,
  };
}
