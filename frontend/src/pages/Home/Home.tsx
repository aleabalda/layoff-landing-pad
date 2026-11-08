import { useState } from "react";
import { Link } from "react-router";
import AppHeader from "../../components/AppHeader";
import { Card, ErrorNote } from "../../components/Card";
import Calendar from "./Calendar/Calendar";
import CrewPulse from "./CrewPulse";
import FriendRequests from "./FriendRequests";
import SimilarPeople from "./SimilarPeople";
import { useProfile } from "../../ProfileProvider";
import BuildPlanCard from "../../plan/BuildPlanCard";
import PlanTaskList from "../../plan/PlanTaskList";
import { planDayNumber, weekAndDay } from "../../plan/plan";
import { PLAN_LENGTH_DAYS, PLAN_WEEKS } from "../../plan/planTemplate";
import { usePlanTasks } from "../../plan/usePlanTasks";

// Values must match the check on checkins.mood (1-6) in the database.
const MOODS = [
  { value: 1, emoji: "😣", label: "Overwhelmed" },
  { value: 2, emoji: "😔", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Hopeful" },
  { value: 6, emoji: "🤩", label: "Excited" },
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

      <main className="space-y-5 px-4 pb-12 sm:px-6">
        <div className="pt-4 pb-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {name ? `Welcome, ${name}` : "Welcome"}
          </h1>
          <p className="mt-2 text-slate-600">
            One day at a time. Here's all you need for today.
          </p>
        </div>

        {/*
          The 30-day plan and calendar are the main, widest column.
            1280px+:     today | calendar and plan (2x wide) | people
            1024-1279px: calendar and plan | today, then people
            Phones:      today, calendar and plan, people
          The mood buttons wrap to fit their card, so "today" can be narrow.
        */}
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(20rem,1fr)_minmax(0,2fr)_minmax(19rem,1fr)]">
          <div className="min-w-0 space-y-5 lg:col-start-2 lg:row-start-1 xl:col-start-1">
            <section
              aria-labelledby="checkin-heading"
              className="@container rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2
                id="checkin-heading"
                className="font-semibold tracking-tight text-slate-900"
              >
                How are you feeling today?
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-2 @xs:grid-cols-3 @[40rem]:grid-cols-6">
                {MOODS.map(({ value, emoji, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mood === value}
                    onClick={() => setMood(value)}
                    className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-3 py-3 transition-colors ${
                      mood === value
                        ? "border-teal-600 bg-teal-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span aria-hidden="true" className="text-2xl">
                      {emoji}
                    </span>
                    <span className="text-xs whitespace-nowrap text-slate-600">
                      {label}
                    </span>
                  </button>
                ))}
              </div>

              {mood !== null && (
                <div className="mt-4">
                  <label
                    htmlFor="checkin-note"
                    className="text-sm text-slate-600"
                  >
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
                  That sounds really heavy. You don't have to carry it alone.
                  You can call or text{" "}
                  <a href="tel:988" className="font-medium underline">
                    9-8-8
                  </a>{" "}
                  any time to talk to someone.
                </p>
              )}
            </section>

            <CrewPulse />
          </div>

          <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-span-2 lg:row-start-1 xl:col-start-2 xl:row-span-1">
            {profile?.plan_start_date ? (
              <TodayPlan startDate={profile.plan_start_date} mood={mood} />
            ) : (
              <BuildPlanCard />
            )}
            <Calendar />
          </div>

          <aside
            aria-label="People"
            className="min-w-0 space-y-5 lg:col-start-2 lg:row-start-2 xl:col-start-3 xl:row-start-1"
          >
            <FriendRequests />
            <SimilarPeople />
          </aside>
        </div>

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
