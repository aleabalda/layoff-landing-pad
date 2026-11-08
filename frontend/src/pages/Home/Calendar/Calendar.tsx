import { type KeyboardEvent, useRef, useState } from "react";
import { addDays, localDate } from "../../../dates";
import { useProfile } from "../../../ProfileProvider";
import DayDetails from "./DayDetails";
import { EVENT_KINDS, kindInfo } from "./calendarTypes";
import { useCalendarData } from "./useCalendarData";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_DOTS = 3;

// The first of a month as "YYYY-MM-01", from any date in it.
const monthOf = (isoDate: string) => `${isoDate.slice(0, 7)}-01`;

function monthGrid(monthStart: string) {
  const [year, month] = monthStart.split("-").map(Number);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const gridStart = addDays(monthStart, -firstWeekday);
  const weeks = Math.ceil((firstWeekday + daysInMonth) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));
}

function Calendar({ className = "" }: { className?: string }) {
  const { profile } = useProfile();
  const [today] = useState(() => localDate());
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => monthOf(today));
  const gridRef = useRef<HTMLDivElement>(null);

  const days = monthGrid(month);
  const {
    eventsByDate,
    applicationsByDate,
    planByDate,
    error,
    addEvent,
    removeEvent,
  } = useCalendarData(days[0], days[days.length - 1], profile?.plan_start_date);

  const [year, monthNumber] = month.split("-").map(Number);
  const monthLabel = new Date(year, monthNumber - 1, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" },
  );

  const goToMonth = (offset: number) => {
    const next = new Date(year, monthNumber - 1 + offset, 1);
    const nextMonth = localDate(next);
    setMonth(nextMonth);
    setSelected(monthOf(today) === nextMonth ? today : nextMonth);
  };

  const select = (date: string) => {
    setSelected(date);
    if (monthOf(date) !== month) setMonth(monthOf(date));
  };

  // Arrow keys move between days, like a date picker.
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const move = moves[event.key];
    if (move === undefined) return;
    event.preventDefault();
    const next = addDays(selected, move);
    select(next);
    requestAnimationFrame(() =>
      gridRef.current
        ?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)
        ?.focus(),
    );
  };

  return (
    <section
      aria-labelledby="calendar-heading"
      className={`@container flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="calendar-heading"
            className="font-semibold tracking-tight text-slate-900"
          >
            Calendar
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Interviews, deadlines and your plan, all in one place.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="Previous month"
            className="cursor-pointer rounded-lg px-2.5 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            ‹
          </button>
          <p
            aria-live="polite"
            className="min-w-36 text-center text-sm font-medium text-slate-900"
          >
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label="Next month"
            className="cursor-pointer rounded-lg px-2.5 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            ›
          </button>
          {selected !== today && (
            <button
              type="button"
              onClick={() => select(today)}
              className="ml-1 cursor-pointer rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          Couldn't load the calendar: {error}
        </p>
      )}

      <div className="mt-5 grid gap-5 @xl:flex-1 @xl:grid-cols-[minmax(0,1fr)_minmax(14rem,0.8fr)] @xl:items-stretch">
        <div ref={gridRef} className="flex flex-col">
          <div
            aria-hidden="true"
            className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500"
          >
            {WEEKDAYS.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 @xl:flex-1 @xl:auto-rows-fr">
            {days.map((date) => {
              const events = eventsByDate[date] ?? [];
              const apps = applicationsByDate[date] ?? [];
              const plan = planByDate[date] ?? [];
              const planDone = plan.filter((t) => t.done).length;
              const inMonth = monthOf(date) === month;
              const isToday = date === today;
              const isSelected = date === selected;
              const dayNumber = Number(date.slice(8));

              const summary = [
                new Date(`${date}T12:00`).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }),
                isToday && "today",
                ...events.map((e) => `${kindInfo(e.kind).label}: ${e.title}`),
                plan.length > 0 && `plan: ${planDone} of ${plan.length} done`,
                apps.length > 0 &&
                  `${apps.length} application${apps.length === 1 ? "" : "s"} sent`,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <button
                  key={date}
                  type="button"
                  data-date={date}
                  aria-label={summary}
                  aria-pressed={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => select(date)}
                  onKeyDown={handleKeyDown}
                  className={`flex min-h-12 cursor-pointer flex-col @[28rem]:min-h-16 items-stretch rounded-lg border p-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 ${
                    isSelected
                      ? "border-teal-600 bg-teal-50"
                      : inMonth
                        ? "border-slate-100 bg-slate-50 hover:border-slate-300"
                        : "border-transparent hover:border-slate-200"
                  }`}
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs tabular-nums ${
                      isToday
                        ? "bg-teal-700 font-semibold text-white"
                        : inMonth
                          ? "font-medium text-slate-800"
                          : "text-slate-400"
                    }`}
                  >
                    {dayNumber}
                  </span>

                  {events.length > 0 && (
                    <span className="mt-1 flex flex-wrap items-center gap-1">
                      {events.slice(0, MAX_DOTS).map((e) => (
                        <span
                          key={e.id}
                          className={`size-2 rounded-full ring-2 ring-white ${kindInfo(e.kind).dot}`}
                        />
                      ))}
                      {events.length > MAX_DOTS && (
                        <span className="text-[10px] leading-none text-slate-500">
                          +{events.length - MAX_DOTS}
                        </span>
                      )}
                    </span>
                  )}

                  <span className="mt-auto hidden items-center justify-between gap-1 pt-1 text-[10px] leading-none text-slate-500 tabular-nums @[28rem]:flex">
                    <span>
                      {plan.length > 0 ? `${planDone}/${plan.length}` : ""}
                    </span>
                    <span>{apps.length > 0 ? `📨${apps.length}` : ""}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <ul
            aria-label="Legend"
            className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600"
          >
            {EVENT_KINDS.map((kind) => (
              <li key={kind.value} className="flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${kind.dot}`}
                  aria-hidden="true"
                />
                {kind.label}
              </li>
            ))}
            <li className="hidden @[28rem]:list-item">
              <span className="tabular-nums">2/3</span> plan tasks done
            </li>
            <li className="hidden @[28rem]:list-item">📨 applications sent</li>
          </ul>
        </div>

        <DayDetails
          date={selected}
          isToday={selected === today}
          events={eventsByDate[selected] ?? []}
          planTasks={planByDate[selected] ?? []}
          applications={applicationsByDate[selected] ?? []}
          onAdded={addEvent}
          onRemoved={removeEvent}
        />
      </div>
    </section>
  );
}

export default Calendar;
