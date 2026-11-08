// Kinds must match the check in
// supabase/migrations/20261108080000_calendar_events.sql.
export type EventKind = "interview" | "deadline" | "networking" | "other";

// Colors were checked for colorblind separation. Every event also shows its
// kind as text, so color is never the only cue.
export const EVENT_KINDS: { value: EventKind; label: string; dot: string }[] = [
  { value: "interview", label: "Interview", dot: "bg-teal-600" },
  { value: "deadline", label: "Deadline", dot: "bg-amber-600" },
  { value: "networking", label: "Networking", dot: "bg-violet-600" },
  { value: "other", label: "Other", dot: "bg-slate-400" },
];

export const kindInfo = (kind: string) =>
  EVENT_KINDS.find((k) => k.value === kind) ?? EVENT_KINDS[3];

export type CalendarEvent = {
  id: string;
  title: string;
  kind: EventKind;
  event_date: string;
  start_time: string | null;
  notes: string | null;
};

export type CalendarPlanTask = {
  id: string;
  week: number;
  day: number;
  title: string;
  done: boolean;
};

export type CalendarApplication = {
  id: string;
  company: string;
  job_title: string;
  applied_on: string;
};

export const EVENT_TITLE_MAX = 120;
export const EVENT_NOTES_MAX = 500;

// "14:30:00" -> "2:30 PM"
export function formatEventTime(time: string | null) {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
