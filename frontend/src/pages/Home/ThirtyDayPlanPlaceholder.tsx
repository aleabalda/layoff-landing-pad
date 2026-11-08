import { ComingSoon } from "./CalendarPlaceholder";

// PLACEHOLDER: the 30-day plan is being built separately. Replace this
// component's body with the real plan; Home.tsx only renders
// <ThirtyDayPlanPlaceholder />, so it can be swapped (or renamed) without
// touching the page layout.
//
// The database already has a `tasks` table for it (user_id, week 1-4, title,
// energy_level, is_checklist, link_url, done), with row-level security so
// people only see their own tasks.

const WEEKS = [
  { week: 1, label: "Week 1", focus: "Steady yourself" },
  { week: 2, label: "Week 2", focus: "Get organized" },
  { week: 3, label: "Week 3", focus: "Reach out" },
  { week: 4, label: "Week 4", focus: "Build momentum" },
];

function ThirtyDayPlanPlaceholder() {
  return (
    <section
      aria-labelledby="plan-heading"
      className="rounded-2xl border border-dashed border-slate-300 bg-white p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="plan-heading"
          className="font-semibold tracking-tight text-slate-900"
        >
          Your 30-day plan
        </h2>
        <ComingSoon />
      </div>
      <p className="mt-1 text-sm text-slate-600">
        A week-by-week plan built around what you told us you need most.
      </p>

      {/* Empty week rows, just to hold the space. */}
      <ol aria-hidden="true" className="mt-5 space-y-3 select-none">
        {WEEKS.map(({ week, label, focus }) => (
          <li
            key={week}
            className="flex items-center gap-4 rounded-xl bg-slate-50 p-4"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
              {week}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-600">
                {label} · {focus}
              </p>
              <div className="mt-2 h-2 w-3/4 rounded-full bg-slate-200" />
              <div className="mt-1.5 h-2 w-1/2 rounded-full bg-slate-200" />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default ThirtyDayPlanPlaceholder;
