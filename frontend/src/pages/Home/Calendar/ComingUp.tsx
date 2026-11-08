import { formatDate } from "../../../dates";
import { formatEventTime, kindInfo } from "./calendarTypes";
import type { Upcoming } from "./useCalendarData";

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

export default ComingUp;
