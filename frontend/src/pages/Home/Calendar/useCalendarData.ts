import { useCallback, useEffect, useState } from "react";
import { addDays, localDate } from "../../../dates";
import { CHECKIN_CHANGED } from "../../../moods";
import { supabase } from "../../../supabaseClient";
import {
  type CalendarApplication,
  type CalendarCheckin,
  type CalendarEvent,
  FOLLOW_UP_AFTER_DAYS,
  type FollowUp,
} from "./calendarTypes";

const groupBy = <T>(items: T[], key: (item: T) => string) => {
  const groups: Record<string, T[]> = {};
  for (const item of items) (groups[key(item)] ??= []).push(item);
  return groups;
};

const EVENT_COLUMNS = "id, title, kind, event_date, start_time, notes";
const UPCOMING_DAYS = 14;
const UPCOMING_LIMIT = 6;

type Upcoming =
  | { type: "event"; date: string; event: CalendarEvent }
  | { type: "followUp"; date: string; followUp: FollowUp };

// Everything the calendar shows between two local dates (inclusive), grouped
// by date, plus a short "coming up" list that ignores the month on screen.
export function useCalendarData(from: string, to: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [applications, setApplications] = useState<CalendarApplication[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [checkins, setCheckins] = useState<CalendarCheckin[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [openFollowUps, setOpenFollowUps] = useState<FollowUp[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [today] = useState(() => localDate());

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      supabase
        .from("calendar_events")
        .select(EVENT_COLUMNS)
        .gte("event_date", from)
        .lte("event_date", to)
        .order("event_date")
        .order("start_time", { nullsFirst: true }),
      // Sent this month, or due a follow-up this month.
      supabase
        .from("job_applications")
        .select("id, company, job_title, applied_on, status")
        .gte("applied_on", addDays(from, -FOLLOW_UP_AFTER_DAYS))
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
      const apps = appsResult.data as (CalendarApplication & {
        status: string;
      })[];
      setApplications(apps.filter((a) => a.applied_on >= from));
      setFollowUps(
        apps
          .filter((a) => a.status === "applied")
          .map((a) => ({
            ...a,
            due: addDays(a.applied_on, FOLLOW_UP_AFTER_DAYS),
          }))
          .filter((f) => f.due >= from && f.due <= to),
      );
    });

    return () => {
      isCurrent = false;
    };
  }, [from, to]);

  const loadCheckins = useCallback(async () => {
    const { data, error } = await supabase
      .from("checkins")
      .select("date, mood, note")
      .gte("date", from)
      .lte("date", to);
    if (error) setError(error.message);
    else setCheckins(data as CalendarCheckin[]);
  }, [from, to]);

  // Reload when today's check-in is saved on the same page.
  useEffect(() => {
    loadCheckins();
    window.addEventListener(CHECKIN_CHANGED, loadCheckins);
    return () => window.removeEventListener(CHECKIN_CHANGED, loadCheckins);
  }, [loadCheckins]);

  // "Coming up": the next two weeks of events, plus any follow-ups that are
  // due or overdue, whatever month is on screen.
  const loadUpcoming = useCallback(async () => {
    const [eventsResult, appsResult] = await Promise.all([
      supabase
        .from("calendar_events")
        .select(EVENT_COLUMNS)
        .gte("event_date", today)
        .lte("event_date", addDays(today, UPCOMING_DAYS))
        .order("event_date")
        .order("start_time", { nullsFirst: true })
        .limit(UPCOMING_LIMIT),
      supabase
        .from("job_applications")
        .select("id, company, job_title, applied_on")
        .eq("status", "applied")
        .lte("applied_on", addDays(today, UPCOMING_DAYS - FOLLOW_UP_AFTER_DAYS))
        .order("applied_on")
        .limit(UPCOMING_LIMIT),
    ]);
    const failed = eventsResult.error ?? appsResult.error;
    if (failed) {
      setError(failed.message);
      return;
    }
    setUpcomingEvents(eventsResult.data as CalendarEvent[]);
    setOpenFollowUps(
      (appsResult.data as CalendarApplication[]).map((a) => ({
        ...a,
        due: addDays(a.applied_on, FOLLOW_UP_AFTER_DAYS),
      })),
    );
  }, [today]);

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  const sortEvents = (list: CalendarEvent[]) =>
    [...list].sort(
      (a, b) =>
        a.event_date.localeCompare(b.event_date) ||
        (a.start_time ?? "").localeCompare(b.start_time ?? ""),
    );

  const addEvent = (event: CalendarEvent) => {
    setEvents((current) => sortEvents([...current, event]));
    loadUpcoming();
  };
  const removeEvent = (id: string) => {
    setEvents((current) => current.filter((e) => e.id !== id));
    setUpcomingEvents((current) => current.filter((e) => e.id !== id));
  };

  const upcoming: Upcoming[] = [
    ...upcomingEvents.map((event) => ({
      type: "event" as const,
      date: event.event_date,
      event,
    })),
    ...openFollowUps.map((followUp) => ({
      type: "followUp" as const,
      date: followUp.due,
      followUp,
    })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, UPCOMING_LIMIT);

  return {
    eventsByDate: groupBy(events, (e) => e.event_date),
    applicationsByDate: groupBy(applications, (a) => a.applied_on),
    followUpsByDate: groupBy(followUps, (f) => f.due),
    checkinByDate: Object.fromEntries(checkins.map((c) => [c.date, c])),
    upcoming,
    today,
    error,
    addEvent,
    removeEvent,
  };
}

export type { Upcoming };
