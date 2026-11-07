import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import { Link } from "react-router";

const MOODS = [
  { value: 1, emoji: "😣", label: "Overwhelmed" },
  { value: 2, emoji: "😔", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Hopeful" },
];

// Tasks are sized to how the person is feeling today.
const LOW_ENERGY_TASKS = [
  "Take a 15-minute walk",
  "Update your LinkedIn headline",
  "Reply in your crew chat",
];

const HIGH_ENERGY_TASKS = [
  "Apply to 2 roles",
  "Practise your story out loud",
  "Ask a former colleague for a reference",
];

// Demo data until crews are backed by a database.
const CREW_PULSE = [
  "3 of your crew checked in today.",
  "Marcus got an interview!",
];

function Home() {
  const { logout, user } = useAuth0();
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [doneTasks, setDoneTasks] = useState<string[]>([]);

  const name = user?.given_name ?? user?.nickname;
  const tasks = mood && mood >= 4 ? HIGH_ENERGY_TASKS : LOW_ENERGY_TASKS;

  const toggleTask = (task: string) =>
    setDoneTasks((done) =>
      done.includes(task) ? done.filter((t) => t !== task) : [...done, task],
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 py-6">
        <Link
          to="/"
          className="text-sm font-semibold tracking-tight text-slate-500 hover:text-slate-900"
        >
          Layoff Landing Pad
        </Link>
        <button
          type="button"
          onClick={() =>
            logout({ logoutParams: { returnTo: window.location.origin } })
          }
          className="cursor-pointer text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          Log out
        </button>
      </header>

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

        <section
          aria-labelledby="wins-heading"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2
            id="wins-heading"
            className="font-semibold tracking-tight text-slate-900"
          >
            Today's 3 small wins
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Do what you can. Rest counts as progress too.
          </p>

          <ul className="mt-4 space-y-1">
            {tasks.map((task) => {
              const done = doneTasks.includes(task);
              return (
                <li key={task}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleTask(task)}
                      className="size-4 accent-teal-700"
                    />
                    <span
                      className={
                        done ? "text-slate-400 line-through" : "text-slate-800"
                      }
                    >
                      {task}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

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

export default Home;
