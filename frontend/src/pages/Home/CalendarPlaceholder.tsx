import { useState } from "react";

// PLACEHOLDER: the calendar isn't built yet. Replace this component's body
// with the real calendar; Home.tsx only renders <CalendarPlaceholder />, so it
// can be swapped (or renamed) without touching the page layout.

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function CalendarPlaceholder() {
  // Read once, so re-renders show the same month.
  const [today] = useState(() => new Date());
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const monthName = today.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <section
      aria-labelledby="calendar-heading"
      className="rounded-2xl border border-dashed border-slate-300 bg-white p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="calendar-heading"
          className="font-semibold tracking-tight text-slate-900"
        >
          Calendar
        </h2>
        <ComingSoon />
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Interviews, deadlines and your plan, all in one place.
      </p>

      {/* A static preview of this month, just to hold the space. */}
      <div aria-hidden="true" className="mt-5 select-none">
        <p className="mb-2 text-sm font-medium text-slate-700">{monthName}</p>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {WEEKDAYS.map((day, i) => (
            <span key={i} className="py-1 font-medium text-slate-400">
              {day}
            </span>
          ))}
          {cells.map((day, i) => (
            <span
              key={i}
              className={`rounded-lg py-2 ${
                day === today.getDate()
                  ? "bg-teal-600 font-semibold text-white"
                  : day
                    ? "bg-slate-50 text-slate-400"
                    : ""
              }`}
            >
              {day}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ComingSoon() {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      Coming soon
    </span>
  );
}

export default CalendarPlaceholder;
