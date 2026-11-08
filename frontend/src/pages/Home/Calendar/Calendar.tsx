import { type KeyboardEvent, useRef, useState } from "react";
import { addDays, localDate } from "../../../dates";
import { moodInfo } from "../../../moods";
import DayDetails from "./DayDetails";
import { EVENT_KINDS, kindInfo } from "./calendarTypes";
import { useCalendarData } from "./useCalendarData";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Event lines shown per day before "+N".
const MAX_LINES = 3;

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
  const [today] = useState(() => localDate());
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => monthOf(today));
  const gridRef = useRef<HTMLDivElement>(null);

  const days = monthGrid(month);
  const {
    eventsByDate,
    applicationsByDate,
    followUpsByDate,
    checkinByDate,
    upcoming,
    error,
    addEvent,
    removeEvent,
  } = useCalendarData(days[0], days[days.length - 1]);

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
            Interviews, deadlines, follow-ups and how you’ve been feeling.
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
              const followUps = followUpsByDate[date] ?? [];
              const mood = moodInfo(checkinByDate[date]?.mood);
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
                mood && `feeling ${mood.label.toLowerCase()}`,
                ...events.map((e) => `${kindInfo(e.kind).label}: ${e.title}`),
                followUps.length > 0 &&
                  `${followUps.length} follow-up${followUps.length === 1 ? "" : "s"} due`,
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
                  className={`flex min-h-16 cursor-pointer flex-col @[28rem]:min-h-20 items-stretch rounded-lg border p-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 ${
                    isSelected
                      ? "border-teal-600 bg-teal-50"
                      : inMonth
                        ? "border-slate-100 bg-slate-50 hover:border-slate-300"
                        : "border-transparent hover:border-slate-200"
                  }`}
                >
                  {/* Top: the date, and applications sent on wide calendars. */}
                  <span className="flex items-start justify-between gap-0.5">
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
                    {apps.length > 0 && (
                      <span className="hidden text-[10px] leading-6 text-slate-500 tabular-nums @[28rem]:inline">
                        📨{apps.length}
                      </span>
                    )}
                  </span>

                  {/* Middle: that day's mood, centered. */}
                  <span
                    aria-hidden="true"
                    className="flex flex-1 items-center justify-center text-xl leading-none @[28rem]:text-2xl"
                  >
                    {mood?.emoji}
                  </span>

                  {/* Bottom: a line per event, across the day. */}
                  {(events.length > 0 || followUps.length > 0) && (
                    <span className="mt-1 flex w-full flex-col gap-0.5">
                      {events.slice(0, MAX_LINES).map((e) => (
                        <span
                          key={e.id}
                          className={`block h-1 w-full rounded-full @[28rem]:h-1.5 ${kindInfo(e.kind).dot}`}
                        />
                      ))}
                      {followUps.length > 0 && (
                        // Dashed, so follow-ups differ by shape, not just color.
                        <span className="block w-full border-t-2 border-dashed border-slate-500" />
                      )}
                      {events.length > MAX_LINES && (
                        <span className="text-right text-[10px] leading-none text-slate-500">
                          +{events.length - MAX_LINES}
                        </span>
                      )}
                    </span>
                  )}
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
                  className={`h-1.5 w-4 rounded-full ${kind.dot}`}
                  aria-hidden="true"
                />
                {kind.label}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span
                className="w-4 border-t-2 border-dashed border-slate-500"
                aria-hidden="true"
              />
              Follow-up due
            </li>
            <li>🙂 your check-in</li>
            <li className="hidden @[28rem]:list-item">📨 applications sent</li>
          </ul>
        </div>

        <DayDetails
          date={selected}
          isToday={selected === today}
          today={today}
          events={eventsByDate[selected] ?? []}
          checkin={checkinByDate[selected]}
          followUps={followUpsByDate[selected] ?? []}
          applications={applicationsByDate[selected] ?? []}
          upcoming={upcoming}
          onAdded={addEvent}
          onRemoved={removeEvent}
        />
      </div>
    </section>
  );
}

export default Calendar;
