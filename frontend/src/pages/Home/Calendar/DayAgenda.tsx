import { Link } from "react-router";
import { formatDate } from "../../../dates";
import {
  type CalendarApplication,
  type CalendarEvent,
  type FollowUp,
  formatEventTime,
  kindInfo,
} from "./calendarTypes";

function DayAgenda({
  events,
  followUps,
  applications,
  onDeleteEvent,
}: {
  events: CalendarEvent[];
  followUps: FollowUp[];
  applications: CalendarApplication[];
  onDeleteEvent: (id: string) => void;
}) {
  return (
    <>
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
                  onClick={() => onDeleteEvent(event.id)}
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
    </>
  );
}

export default DayAgenda;
