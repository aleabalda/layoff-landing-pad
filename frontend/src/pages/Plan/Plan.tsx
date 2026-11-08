import { useState } from "react";
import AppHeader from "../../components/AppHeader";
import { Card, ErrorNote } from "../../components/Card";
import { formatDate, formatWeekdayDate } from "../../dates";
import { useProfile } from "../../ProfileProvider";
import BuildPlanCard from "../../plan/BuildPlanCard";
import PersonalizePlanCard from "../../plan/PersonalizePlanCard";
import PlanTaskList from "../../plan/PlanTaskList";
import { dateForPlanDay, planDayNumber, weekAndDay } from "../../plan/plan";
import {
  DAYS_PER_WEEK,
  PLAN_LENGTH_DAYS,
  PLAN_WEEKS,
} from "../../plan/planTemplate";
import { type PlanTask, usePlanTasks } from "../../plan/usePlanTasks";

function Plan() {
  const { profile } = useProfile();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl space-y-5 px-4 pb-12 sm:px-6">
        <div className="pt-4 pb-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Your 30-day plan
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Each week opens when it starts, so you won't feel buried on day one.
            Skipped a day? That's fine. Nothing here expires.
          </p>
        </div>

        {profile?.plan_start_date ? (
          <PlanWeeks startDate={profile.plan_start_date} />
        ) : (
          <BuildPlanCard />
        )}
      </main>
    </div>
  );
}

function PlanWeeks({ startDate }: { startDate: string }) {
  const { tasks, error, toggle } = usePlanTasks();
  const dayNumber = planDayNumber(startDate);
  const isFinished = dayNumber > PLAN_LENGTH_DAYS;
  const today = isFinished ? null : weekAndDay(dayNumber);
  const openWeeks = today ? today.week : PLAN_WEEKS.length;
  const [selectedWeek, setSelectedWeek] = useState(openWeeks);

  const doneCount = tasks?.filter((task) => task.done).length ?? 0;
  const totalCount = tasks?.length ?? 0;
  const week = PLAN_WEEKS[selectedWeek - 1];

  const weekTasks = (number: number) =>
    tasks?.filter((task) => task.week === number) ?? [];

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      {/* Left: overview and personalization. On wide screens it stays in view
          while the days scroll. If it's taller than the screen (say, with the
          personalization form open), it scrolls on its own. The padding and
          negative margin keep card shadows and focus rings from being clipped. */}
      <div className="space-y-5 lg:sticky lg:top-4 lg:-m-1 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:overscroll-contain lg:p-1">
        <Card labelledBy="plan-progress-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2
              id="plan-progress-heading"
              className="font-semibold tracking-tight text-slate-900"
            >
              {today ? `Day ${dayNumber} of ${PLAN_LENGTH_DAYS}` : "Plan complete"}
            </h2>
            {tasks && (
              <p className="text-sm text-slate-600 tabular-nums">
                {doneCount} of {totalCount} done
              </p>
            )}
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Tasks done"
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-valuenow={doneCount}
          >
            <div
              className="h-full rounded-full bg-teal-600 transition-[width]"
              style={{
                width: totalCount ? `${(doneCount / totalCount) * 100}%` : 0,
              }}
            />
          </div>

          <h3 className="mt-6 text-sm font-medium text-slate-900">Weeks</h3>
          <ol className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {PLAN_WEEKS.map(({ week: number, theme }) => {
              const isOpen = number <= openWeeks;
              const isSelected = number === selectedWeek;
              const isCurrent = today?.week === number;
              const inWeek = weekTasks(number);
              const doneInWeek = inWeek.filter((task) => task.done).length;
              return (
                <li key={number}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    disabled={!isOpen}
                    onClick={() => setSelectedWeek(number)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${
                      isSelected
                        ? "border-teal-600 bg-teal-50"
                        : isOpen
                          ? "border-slate-200 hover:bg-slate-50"
                          : "border-dashed border-slate-200 bg-slate-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-xs text-slate-500">
                        Week {number}
                        {isCurrent && (
                          <span className="font-medium text-teal-800"> · Now</span>
                        )}
                      </span>
                      <span
                        className={`block text-sm font-medium ${
                          isOpen ? "text-slate-900" : "text-slate-400"
                        }`}
                      >
                        {theme}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-xs text-slate-500 tabular-nums">
                      {isOpen
                        ? tasks && `${doneInWeek}/${inWeek.length} done`
                        : `Opens ${formatDate(dateForPlanDay(startDate, number, 1))}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </Card>

        {!isFinished && tasks && (
          <PersonalizePlanCard
            week={today?.week ?? PLAN_WEEKS.length}
            hasPersonalizedTasks={tasks.some(
              (task) => task.week === today?.week && task.personalized_at,
            )}
          />
        )}
      </div>

      {/* Right: the selected week's days */}
      <Card labelledBy="week-heading">
        <h2
          id="week-heading"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Week {week.week}: {week.theme}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{week.description}</p>

        <ErrorNote message={error} />

        {tasks === null && !error && (
          <p className="mt-4 text-sm text-slate-500">Loading...</p>
        )}

        {tasks && (
          <ol className="mt-5 space-y-4">
            {Array.from({ length: DAYS_PER_WEEK }, (_, index) => index + 1).map(
              (day) => (
                <PlanDay
                  key={day}
                  dayNumber={(week.week - 1) * DAYS_PER_WEEK + day}
                  date={dateForPlanDay(startDate, week.week, day)}
                  isToday={today?.week === week.week && today.day === day}
                  tasks={tasks.filter(
                    (task) => task.week === week.week && task.day === day,
                  )}
                  onToggle={toggle}
                />
              ),
            )}
          </ol>
        )}
      </Card>
    </div>
  );
}

function PlanDay({
  dayNumber,
  date,
  isToday,
  tasks,
  onToggle,
}: {
  dayNumber: number;
  date: string;
  isToday: boolean;
  tasks: PlanTask[];
  onToggle: (task: PlanTask) => void;
}) {
  const allDone = tasks.length > 0 && tasks.every((task) => task.done);

  return (
    <li
      aria-current={isToday ? "date" : undefined}
      className={`rounded-xl border p-4 ${
        isToday ? "border-teal-600 bg-teal-50/40" : "border-slate-100"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-900">
          Day {dayNumber}
          <span className="font-normal text-slate-500">
            {" "}
            · {formatWeekdayDate(date)}
          </span>
        </h3>
        {isToday ? (
          <span className="rounded-full bg-teal-700 px-2 py-0.5 text-[11px] font-medium text-white">
            Today
          </span>
        ) : (
          allDone && (
            <span className="text-[11px] font-medium text-teal-800">
              ✓ All done
            </span>
          )
        )}
      </div>
      <div className="mt-2">
        <PlanTaskList tasks={tasks} onToggle={onToggle} />
      </div>
    </li>
  );
}

export default Plan;
