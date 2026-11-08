import { type FormEvent, useState } from "react";
import { Link } from "react-router";
import { formatDate } from "../../../dates";
import { moodInfo } from "../../../moods";
import { supabase } from "../../../supabaseClient";
import {
  type CalendarApplication,
  type CalendarCheckin,
  type CalendarEvent,
  type FollowUp,
  EVENT_KINDS,
  EVENT_NOTES_MAX,
  EVENT_TITLE_MAX,
  type EventKind,
  formatEventTime,
  kindInfo,
} from "./calendarTypes";
import type { Upcoming } from "./useCalendarData";

const EVENT_COLUMNS = "id, title, kind, event_date, start_time, notes";

function DayDetails({
  date,
  isToday,
  today,
  events,
  checkin,
  followUps,
  applications,
  upcoming,
  onAdded,
  onRemoved,
}: {
  date: string;
  isToday: boolean;
  today: string;
  events: CalendarEvent[];
  checkin: CalendarCheckin | undefined;
  followUps: FollowUp[];
  applications: CalendarApplication[];
  upcoming: Upcoming[];
  onAdded: (event: CalendarEvent) => void;
  onRemoved: (id: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heading = new Date(`${date}T12:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const isEmpty =
    events.length === 0 &&
    followUps.length === 0 &&
    applications.length === 0 &&
    !checkin;
  const mood = moodInfo(checkin?.mood);

  const remove = async (id: string) => {
    setError(null);
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id);
    if (error) setError(error.message);
    else onRemoved(id);
  };

  return (
    <div className="@container mt-6 border-t border-slate-100 pt-5 @xl:mt-0 @xl:border-t-0 @xl:border-l @xl:pt-0 @xl:pl-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">
          {isToday ? `Today · ${heading}` : heading}
        </h3>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
          >
            Add event
          </button>
        )}
      </div>

      {mood ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span aria-hidden="true" className="text-lg leading-5">
            {mood.emoji}
          </span>
          <span>
            <span className="font-medium text-slate-900">
              Feeling {mood.label.toLowerCase()}
            </span>
            {checkin?.note && <> · “{checkin.note}”</>}
          </span>
        </p>
      ) : (
        isToday && (
          <p className="mt-3 text-sm text-slate-500">
            No check-in yet today. Pick how you're feeling above and it'll show
            here.
          </p>
        )
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {isAdding && (
        <AddEventForm
          // A fresh form for each day, so the date is never stale.
          key={date}
          date={date}
          onAdded={(event) => {
            onAdded(event);
            setIsAdding(false);
          }}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {isEmpty && !isAdding && (
        <p className="mt-3 text-sm text-slate-500">
          Nothing planned. A quiet day is fine too.
        </p>
      )}

      {events.length > 0 && (
        <ul className="mt-3 space-y-2">
          {events.map((event) => {
            const kind = kindInfo(event.kind);
            const time = formatEventTime(event.start_time);
            return (
              <li
                key={event.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 p-3"
              >
                <span
                  aria-hidden="true"
                  className={`mt-1.5 size-2.5 shrink-0 rounded-full ${kind.dot}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {event.title}
                  </p>
                  <p className="text-xs text-slate-600">
                    {kind.label}
                    {time && ` · ${time}`}
                  </p>
                  {event.notes && (
                    <p className="mt-1 text-sm whitespace-pre-line text-slate-700">
                      {event.notes}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(event.id)}
                  aria-label={`Delete ${event.title}`}
                  className="cursor-pointer rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {followUps.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Time to follow up
            </h4>
            <Link
              to="/jobs"
              className="text-xs font-medium text-teal-800 underline-offset-4 hover:underline"
            >
              Update status
            </Link>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-slate-800">
            {followUps.map((f) => (
              <li key={f.id}>
                <span aria-hidden="true">↩ </span>
                {f.job_title}{" "}
                <span className="text-slate-500">at {f.company}</span>
                <span className="text-slate-500">
                  {" "}
                  · sent {formatDate(f.applied_on)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {applications.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Applications sent
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-800">
            {applications.map((app) => (
              <li key={app.id}>
                📨 {app.job_title}{" "}
                <span className="text-slate-500">at {app.company}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ComingUp upcoming={upcoming} today={today} />
    </div>
  );
}

// The next two weeks of events, plus follow-ups that are due, whatever month
// is on screen.
function ComingUp({
  upcoming,
  today,
}: {
  upcoming: Upcoming[];
  today: string;
}) {
  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <h4 className="text-xs font-medium tracking-wide text-slate-500 uppercase">
        Coming up
      </h4>
      {upcoming.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Nothing in the next two weeks. Add interviews and deadlines as they
          come up.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {upcoming.map((item) => {
            const when =
              item.date < today
                ? "Overdue"
                : item.date === today
                  ? "Today"
                  : formatDate(item.date);
            if (item.type === "event") {
              const kind = kindInfo(item.event.kind);
              const time = formatEventTime(item.event.start_time);
              return (
                <li
                  key={`e-${item.event.id}`}
                  className="flex items-start gap-2.5 text-sm"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${kind.dot}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-slate-900">
                      {item.event.title}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {when}
                      {time && ` · ${time}`} · {kind.label}
                    </span>
                  </span>
                </li>
              );
            }
            return (
              <li
                key={`f-${item.followUp.id}`}
                className="flex items-start gap-2.5 text-sm"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-2 shrink-0 rounded-full border-2 border-slate-500"
                />
                <span className="min-w-0">
                  <span className="block truncate text-slate-900">
                    Follow up: {item.followUp.job_title}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {when} · {item.followUp.company}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AddEventForm({
  date,
  onAdded,
  onCancel,
}: {
  date: string;
  onAdded: (event: CalendarEvent) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EventKind>("interview");
  const [eventDate, setEventDate] = useState(date);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !eventDate) return;

    setIsSaving(true);
    setError(null);
    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        title: title.trim(),
        kind,
        event_date: eventDate,
        start_time: time || null,
        notes: notes.trim() || null,
      })
      .select(EVENT_COLUMNS)
      .single();
    setIsSaving(false);

    if (error) setError(error.message);
    else onAdded(data as CalendarEvent);
  };

  const inputClasses =
    "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4"
    >
      <div>
        <label
          htmlFor="event-title"
          className="text-xs font-medium text-slate-700"
        >
          What's happening?
        </label>
        <input
          id="event-title"
          type="text"
          value={title}
          maxLength={EVENT_TITLE_MAX}
          required
          autoFocus
          placeholder="e.g. Phone screen with Northwind"
          onChange={(e) => setTitle(e.target.value)}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-3 @sm:grid-cols-3">
        <div>
          <label
            htmlFor="event-kind"
            className="text-xs font-medium text-slate-700"
          >
            Type
          </label>
          <select
            id="event-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as EventKind)}
            className={inputClasses}
          >
            {EVENT_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="event-date"
            className="text-xs font-medium text-slate-700"
          >
            Date
          </label>
          <input
            id="event-date"
            type="date"
            value={eventDate}
            required
            onChange={(e) => setEventDate(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label
            htmlFor="event-time"
            className="text-xs font-medium text-slate-700"
          >
            Time (optional)
          </label>
          <input
            id="event-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="event-notes"
          className="text-xs font-medium text-slate-700"
        >
          Notes (optional)
        </label>
        <textarea
          id="event-notes"
          rows={2}
          value={notes}
          maxLength={EVENT_NOTES_MAX}
          placeholder="Who you're meeting, a link, what to prepare"
          onChange={(e) => setNotes(e.target.value)}
          className={inputClasses}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving || !title.trim()}
          className="cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? "Saving..." : "Save event"}
        </button>
      </div>
    </form>
  );
}

export default DayDetails;
