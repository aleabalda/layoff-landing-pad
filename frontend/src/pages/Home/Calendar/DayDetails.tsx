import { useState } from "react";
import { moodInfo } from "../../../moods";
import { supabase } from "../../../supabaseClient";
import AddEventForm from "./AddEventForm";
import ComingUp from "./ComingUp";
import DayAgenda from "./DayAgenda";
import type {
  CalendarApplication,
  CalendarCheckin,
  CalendarEvent,
  FollowUp,
} from "./calendarTypes";
import type { Upcoming } from "./useCalendarData";

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
            className="cursor-pointer rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800"
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

      <DayAgenda
        events={events}
        followUps={followUps}
        applications={applications}
        onDeleteEvent={remove}
      />

      <ComingUp upcoming={upcoming} today={today} />
    </div>
  );
}

export default DayDetails;
