import type { ReactNode } from "react";
import { daysAgo, formatDate } from "../../dates";
import { JOB_STATUSES } from "../../profileOptions";

const WEEKS = 8;
const COLUMN_AREA_PX = 96;

type Props = { applications: { status: string; applied_on: string }[] };

// Hover and keyboard-focus readout for one mark. Every value it shows is also
// printed on the chart or in the application list beside it.
function Tooltip({ value, label }: { value: string; label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs whitespace-nowrap text-slate-300 shadow-lg group-hover:block group-focus-visible:block"
    >
      <strong className="block text-sm font-semibold text-white">{value}</strong>
      {label}
    </span>
  );
}

function Mark({
  label,
  tooltip,
  className,
  children,
}: {
  label: string;
  tooltip: ReactNode;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      tabIndex={0}
      aria-label={label}
      className={`group relative rounded outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${className}`}
    >
      {children}
      {tooltip}
    </div>
  );
}

function JobProgress({ applications }: Props) {
  const total = applications.length;

  const stages = JOB_STATUSES.map(({ value, label }) => {
    const count = applications.filter((app) => app.status === value).length;
    return { value, label, count, share: total ? count / total : 0 };
  });
  const maxStage = Math.max(1, ...stages.map((stage) => stage.count));

  const reachedInterview = applications.filter(
    (app) => app.status === "interviewing" || app.status === "offer",
  ).length;

  // Week 0 is the last 7 days including today; older weeks run left.
  const weeks = Array.from({ length: WEEKS }, (_, index) => {
    const week = WEEKS - 1 - index;
    const start = daysAgo(week * 7 + 6);
    const end = daysAgo(week * 7);
    const count = applications.filter(
      (app) => app.applied_on >= start && app.applied_on <= end,
    ).length;
    return { week, start, end, count };
  });
  const maxWeek = Math.max(1, ...weeks.map((week) => week.count));

  return (
    <div className="space-y-6 rounded-xl bg-slate-50 p-4">
      <section aria-labelledby="pipeline-heading">
        <h4
          id="pipeline-heading"
          className="text-sm font-medium text-slate-900"
        >
          Where things stand
        </h4>
        <p className="mt-1 text-xs text-slate-600">
          {reachedInterview > 0
            ? `${reachedInterview} of ${total} reached an interview or offer.`
            : "Every application is a step forward, even before you hear back."}
        </p>

        <ul className="mt-4 space-y-2.5">
          {stages.map((stage) => {
            const percent = Math.round(stage.share * 100);
            const summary = `${stage.label}: ${stage.count} of ${total} (${percent}%)`;
            return (
              <li
                key={stage.value}
                className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 text-xs"
              >
                <span className="text-slate-700">{stage.label}</span>
                <Mark
                  label={summary}
                  className="flex h-6 items-center gap-2"
                  tooltip={
                    <Tooltip
                      value={`${stage.count} · ${percent}%`}
                      label={stage.label}
                    />
                  }
                >
                  {stage.count > 0 && (
                    // Square at the baseline, rounded at the tip.
                    <span
                      className="h-4 rounded-r bg-teal-600 transition-[filter] group-hover:brightness-110"
                      style={{ width: `${(stage.count / maxStage) * 85}%` }}
                    />
                  )}
                  <span className="font-medium text-slate-900 tabular-nums">
                    {stage.count}
                  </span>
                </Mark>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="weekly-heading">
        <h4 id="weekly-heading" className="text-sm font-medium text-slate-900">
          Applications per week
        </h4>
        <p className="mt-1 text-xs text-slate-600">The last {WEEKS} weeks.</p>

        <div
          className="mt-4 flex items-end justify-between gap-1 border-b border-slate-200"
          style={{ height: COLUMN_AREA_PX + 20 }}
        >
          {weeks.map((week) => {
            const range = `${formatDate(week.start)} – ${formatDate(week.end)}`;
            const heightPx = (week.count / maxWeek) * COLUMN_AREA_PX;
            return (
              <Mark
                key={week.week}
                label={`${range}: ${week.count} applications`}
                className="flex h-full flex-1 flex-col items-center justify-end"
                tooltip={
                  <Tooltip
                    value={`${week.count} ${week.count === 1 ? "application" : "applications"}`}
                    label={week.week === 0 ? `This week · ${range}` : range}
                  />
                }
              >
                {week.count > 0 && (
                  <span className="mb-1 text-[11px] font-medium text-slate-700 tabular-nums">
                    {week.count}
                  </span>
                )}
                {week.count > 0 && (
                  // Rounded at the cap, square on the baseline.
                  <span
                    className="w-full max-w-6 rounded-t bg-teal-600 transition-[filter] group-hover:brightness-110"
                    style={{ height: heightPx }}
                  />
                )}
              </Mark>
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
          <span>{WEEKS} weeks ago</span>
          <span>This week</span>
        </div>
      </section>
    </div>
  );
}

export default JobProgress;
