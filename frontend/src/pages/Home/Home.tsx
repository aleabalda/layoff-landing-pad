import { useState } from "react";
import { Link } from "react-router";
import AppHeader from "../../components/AppHeader";
import { Card, ErrorNote } from "../../components/Card";
import { useProfile } from "../../ProfileProvider";
import BuildPlanCard from "../../plan/BuildPlanCard";
import PlanTaskList from "../../plan/PlanTaskList";
import { planDayNumber, weekAndDay } from "../../plan/plan";
import { PLAN_LENGTH_DAYS, PLAN_WEEKS } from "../../plan/planTemplate";
import { usePlanTasks } from "../../plan/usePlanTasks";

const MOODS = [
  { value: 1, emoji: "😣", label: "Overwhelmed" },
  { value: 2, emoji: "😔", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Hopeful" },
];

// Demo data until crews are backed by a database.
const CREW_PULSE = [
  "3 of your crew checked in today.",
  "Marcus got an interview!",
];

const LINK_CLASSES =
  "shrink-0 text-sm font-medium text-teal-800 underline-offset-4 hover:underline";

function Home() {
  const { profile } = useProfile();
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const name = profile?.display_name;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-2xl space-y-5 px-4 pb-12">
        <div className="pt-4 pb-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {name ? `Welcome, ${name}` : "Welcome"}
          </h1>
          <p className="mt-2 text-slate-600">
            One day at a time. Here's all you need for today.
          </p>
        </div>

        <section
          aria-labelledby="checkin-heading"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2
            id="checkin-heading"
            className="font-semibold tracking-tight text-slate-900"
          >
            How are you feeling today?
          </h2>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {MOODS.map(({ value, emoji, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={mood === value}
                onClick={() => setMood(value)}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-1 py-3 transition-colors ${
                  mood === value
                    ? "border-teal-600 bg-teal-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span aria-hidden="true" className="text-2xl">
                  {emoji}
                </span>
                <span className="text-[11px] text-slate-600 sm:text-xs">
                  {label}
                </span>
              </button>
            ))}
          </div>

          {mood !== null && (
            <div className="mt-4">
              <label htmlFor="checkin-note" className="text-sm text-slate-600">
                Thanks for checking in. Want to add a sentence? (optional)
              </label>
              <input
                id="checkin-note"
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>
          )}

          {mood === 1 && (
            <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
              That sounds really heavy. You don't have to carry it alone. You
              can call or text{" "}
              <a href="tel:988" className="font-medium underline">
                9-8-8
              </a>{" "}
              any time to talk to someone.
            </p>
          )}
        </section>

        {profile?.plan_start_date ? (
          <TodayPlan startDate={profile.plan_start_date} mood={mood} />
        ) : (
          <BuildPlanCard />
        )}

        <section
          aria-labelledby="crew-heading"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2
            id="crew-heading"
            className="font-semibold tracking-tight text-slate-900"
          >
            Crew pulse
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {CREW_PULSE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <footer className="px-1 pt-3 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-800">
              Having a hard time?
            </span>{" "}
            Call or text{" "}
            <a href="tel:988" className="font-medium text-teal-800 underline">
              9-8-8
            </a>{" "}
            any time for the Suicide Crisis Helpline, or dial{" "}
            <a href="tel:211" className="font-medium text-teal-800 underline">
              211
            </a>{" "}
            for local community services.
          </p>
          <p className="mt-2 text-slate-500">
            Landing Pad is here to support you, but it isn't therapy.
          </p>
        </footer>
      </main>
    </div>
  );
}

function TodayPlan({
  startDate,
  mood,
}: {
  startDate: string;
  mood: number | null;
}) {
  const dayNumber = planDayNumber(startDate);

  if (dayNumber > PLAN_LENGTH_DAYS) {
    return (
      <Card labelledBy="today-heading">
        <h2
          id="today-heading"
          className="font-semibold tracking-tight text-slate-900"
        >
          You finished your 30-day plan
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          That's a whole month of showing up for yourself. Anything you didn't
          get to is still on your plan, with no deadline.
        </p>
        <Link to="/plan" className={`mt-4 inline-block ${LINK_CLASSES}`}>
          Look back at your plan
        </Link>
      </Card>
    );
  }

  return <TodayTasks dayNumber={dayNumber} mood={mood} />;
}

function TodayTasks({
  dayNumber,
  mood,
}: {
  dayNumber: number;
  mood: number | null;
}) {
  const { week, day } = weekAndDay(dayNumber);
  const { tasks, error, toggle } = usePlanTasks({ week, day });
  const isHardDay = mood !== null && mood <= 2;

  // On a hard day, the gentle tasks go first. sort() keeps the rest in order.
  const shown =
    tasks && isHardDay
      ? [...tasks].sort(
          (a, b) =>
            Number(b.energy_level === "low") - Number(a.energy_level === "low"),
        )
      : tasks;

  return (
    <Card labelledBy="today-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-teal-800">
            Day {dayNumber} of {PLAN_LENGTH_DAYS} · Week {week}:{" "}
            {PLAN_WEEKS[week - 1].theme}
          </p>
          <h2
            id="today-heading"
            className="mt-1 font-semibold tracking-tight text-slate-900"
          >
            Today's small wins
          </h2>
        </div>
        <Link to="/plan" className={LINK_CLASSES}>
          Full plan
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {isHardDay
          ? "Running low today? The gentle ones are plenty, and even one counts."
          : "Do what you can. Rest counts as progress too."}
      </p>

      <ErrorNote message={error} />

      {tasks === null && !error && (
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      )}
      {shown && (
        <div className="mt-3">
          <PlanTaskList tasks={shown} onToggle={toggle} />
        </div>
      )}
    </Card>
  );
}

export default Home;
