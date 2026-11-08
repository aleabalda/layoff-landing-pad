import { type FormEvent, useState } from "react";
import { supabase } from "../../../supabaseClient";
import {
  type CalendarEvent,
  EVENT_KINDS,
  EVENT_NOTES_MAX,
  EVENT_TITLE_MAX,
  type EventKind,
} from "./calendarTypes";

const EVENT_COLUMNS = "id, title, kind, event_date, start_time, notes";

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
          className="cursor-pointer rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? "Saving..." : "Save event"}
        </button>
      </div>
    </form>
  );
}

export default AddEventForm;
