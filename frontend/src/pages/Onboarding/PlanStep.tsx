import { buildPlan, PLAN_WEEKS } from "../../plan/planTemplate";
import { JOB_END_REASONS, labelFor, URGENT_NEEDS } from "../../profileOptions";
import { StepHeading } from "./OnboardingFields";

// Shows what building a plan means before they commit to it.
function PlanStep({
  jobEndReason,
  urgentNeed,
}: {
  jobEndReason: string | null;
  urgentNeed: string | null;
}) {
  const firstDay = buildPlan(jobEndReason, urgentNeed).filter(
    (task) => task.week === 1 && task.day === 1,
  );
  const shapedBy = [
    labelFor(JOB_END_REASONS, jobEndReason),
    labelFor(URGENT_NEEDS, urgentNeed),
  ].filter(Boolean);

  return (
    <>
      <StepHeading
        title="Want a 30-day plan?"
        subtitle="We'll lay out a few small tasks for each day over four weeks, starting today. Each week opens when it starts, so you won't feel buried."
      />

      {shapedBy.length > 0 && (
        <p className="mt-4 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Shaped around:</span>{" "}
          {shapedBy.join(" · ")}
        </p>
      )}

      <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PLAN_WEEKS.map(({ week, theme }) => (
          <li key={week} className="rounded-xl bg-slate-50 px-3 py-2">
            <span className="block text-xs text-slate-500">Week {week}</span>
            <span className="block text-sm font-medium text-slate-900">
              {theme}
            </span>
          </li>
        ))}
      </ol>

      <h2 className="mt-6 text-sm font-medium text-slate-900">
        Here's what day 1 would look like
      </h2>
      <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
        {firstDay.map((task) => (
          <li key={task.key} className="flex gap-2">
            <span aria-hidden="true" className="text-teal-700">
              ○
            </span>
            {task.title}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-slate-500">
        Not ready? Skip for now. You can build it any time from Home or your
        Plan page.
      </p>
    </>
  );
}

export default PlanStep;
