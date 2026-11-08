import { type FormEvent, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../../supabaseClient";
import {
  type CalendarApplication,
  type CalendarEvent,
  type CalendarPlanTask,
  EVENT_KINDS,
  EVENT_NOTES_MAX,
  EVENT_TITLE_MAX,
  type EventKind,
  formatEventTime,
  kindInfo,
} from "./calendarTypes";

const EVENT_COLUMNS = "id, title, kind, event_date, start_time, notes";

function DayDetails({
  date,
  isToday,
  events,
  planTasks,
  applications,
  onAdded,
  onRemoved,
}: {
  date: string;
  isToday: boolean;
  events: CalendarEvent[];
  planTasks: CalendarPlanTask[];
  applications: CalendarApplication[];
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
    events.length === 0 && planTasks.length === 0 && applications.length === 0;

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

      {planTasks.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Your plan · {planTasks.filter((t) => t.done).length} of{" "}
              {planTasks.length} done
            </h4>
            <Link
              to="/plan"
              className="text-xs font-medium text-teal-800 underline-offset-4 hover:underline"
            >
              Open plan
            </Link>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {planTasks.map((task) => (
              <li key={task.id} className="flex items-start gap-2">
                <span aria-hidden="true" className="text-slate-400">
                  {task.done ? "✓" : "○"}
                </span>
                <span
                  className={
                    task.done ? "text-slate-400 line-through" : "text-slate-800"
                  }
                >
                  <span className="sr-only">
                    {task.done ? "Done: " : "To do: "}
                  </span>
                  {task.title}
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
