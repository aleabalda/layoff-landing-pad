import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router";

const PILLARS = [
  {
    name: "Steady",
    summary: "Look after yourself first.",
    points: [
      "Daily check-ins that take one tap",
      "Ways to manage stress and rebuild a routine",
      "Guided reflection to make sense of what happened",
    ],
  },
  {
    name: "Rebuild",
    summary: "Get the practical stuff under control.",
    points: [
      "A first-week checklist for EI, severance and benefits",
      "Help finding and closing your skill gaps",
      "An honest answer to “Why did you leave?”",
    ],
  },
  {
    name: "Crew",
    summary: "Go through it with people who get it.",
    points: [
      "A small group of 4–6 people in a similar spot",
      "An accountability buddy to check in with",
      "Mentors who've landed new jobs and come back to help",
    ],
  },
];

const WEEKS = [
  {
    week: "Week 1",
    theme: "Land",
    description:
      "Take care of urgent admin, tell the people who matter, rest, and set a basic routine.",
  },
  {
    week: "Week 2",
    theme: "Reflect",
    description:
      "Look at what you liked and didn't about your old job, your strengths, and what you want next.",
  },
  {
    week: "Week 3",
    theme: "Rebuild",
    description:
      "Close skill gaps, update your resume and LinkedIn, and practise telling your story.",
  },
  {
    week: "Week 4",
    theme: "Relaunch",
    description:
      "Send targeted applications, have networking conversations, and practise interviewing.",
  },
];

const SITUATIONS = [
  {
    title: "Laid off",
    description:
      "Get organized fast, and get a steady reminder that it wasn't personal.",
  },
  {
    title: "Let go",
    description:
      "Work through what happened and find a confident way to explain it in interviews.",
  },
  {
    title: "I quit",
    description:
      "Recover from burnout and explore what's next before rushing back.",
  },
];

const PROMISES = [
  {
    title: "Private by default",
    description:
      "Your moods and journal stay yours. Your crew only sees what you choose to share, and former employers never see anything.",
  },
  {
    title: "Support, not therapy",
    description:
      "We say that plainly, and point you to crisis lines and affordable counselling when you need more.",
  },
  {
    title: "No guilt, ever",
    description:
      "No red badges and no “you're behind.” On a hard day, rest counts as progress.",
  },
];

const PREVIEW_MOODS = ["😣", "😔", "😐", "🙂", "😊"];

const PREVIEW_WINS = [
  { task: "Take a 15-minute walk", done: true },
  { task: "Update your LinkedIn headline", done: false },
  { task: "Reply in your crew chat", done: false },
];

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";

function CallsToAction({ onDark = false }: { onDark?: boolean }) {
  const { isAuthenticated } = useAuth0();

  const primary = `inline-flex justify-center rounded-lg px-5 py-3 text-sm font-medium transition-colors ${FOCUS_RING} ${
    onDark
      ? "bg-white text-slate-900 hover:bg-teal-50"
      : "bg-slate-900 text-white hover:bg-slate-700"
  }`;
  const secondary = `inline-flex justify-center rounded-lg border px-5 py-3 text-sm font-medium transition-colors ${FOCUS_RING} ${
    onDark
      ? "border-slate-600 text-white hover:bg-slate-800"
      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
  }`;

  if (isAuthenticated) {
    return (
      <Link to="/home" className={primary}>
        Go to your home
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link to="/register" className={primary}>
        Get started free
      </Link>
      <Link to="/login" className={secondary}>
        Log in
      </Link>
    </div>
  );
}

// An illustration of the home screen, so it's hidden from screen readers.
function HomePreview() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70"
    >
      <p className="text-sm font-semibold tracking-tight text-slate-900">
        How are you feeling today?
      </p>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {PREVIEW_MOODS.map((emoji, index) => (
          <span
            key={emoji}
            className={`rounded-xl border py-2 text-center text-xl ${
              index === 3 ? "border-teal-600 bg-teal-50" : "border-slate-200"
            }`}
          >
            {emoji}
          </span>
        ))}
      </div>

      <p className="mt-6 text-sm font-semibold tracking-tight text-slate-900">
        Today's 3 small wins
      </p>
      <ul className="mt-3 space-y-2.5 text-sm">
        {PREVIEW_WINS.map(({ task, done }) => (
          <li key={task} className="flex items-center gap-3">
            <span
              className={`flex size-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                done
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-slate-300"
              }`}
            >
              {done && "✓"}
            </span>
            <span
              className={
                done ? "text-slate-400 line-through" : "text-slate-700"
              }
            >
              {task}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-6 rounded-lg bg-teal-50 px-3 py-2.5 text-sm text-teal-900">
        3 of your crew checked in today.
      </p>
    </div>
  );
}

function Landing() {
  const { error, isAuthenticated } = useAuth0();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-5 sm:px-6">
        <div>
          <Link
            to="/"
            className={`rounded text-sm font-semibold tracking-tight text-slate-700 ${FOCUS_RING}`}
          >
            Layoff Landing Pad
          </Link>

          <nav
            aria-label="Page sections"
            className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm"
          >
            <a
              href="#how-it-works"
              className="text-slate-600 hover:text-slate-900 text-xs"
            >
              How it works
            </a>
            <a
              href="#safety"
              className="text-slate-600 hover:text-slate-900 text-xs"
            >
              Our safety approach
            </a>
          </nav>
        </div>

        <nav
          aria-label="Account"
          className="flex shrink-0 items-center gap-5 text-sm"
        >
          {isAuthenticated ? (
            <Link
              to="/home"
              className={`rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-700 ${FOCUS_RING}`}
            >
              Go to your home
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="font-medium text-slate-700 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className={`rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-700 ${FOCUS_RING}`}
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        {error && (
          <p
            role="alert"
            className="mx-auto mt-2 max-w-6xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-6"
          >
            We couldn't log you in: {error.message}
          </p>
        )}

        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-20 lg:pb-28">
          <div>
            <p className="text-sm font-medium text-teal-800">
              For anyone who's been laid off, let go, or quit
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Losing your job is hard. Bouncing back shouldn't be lonely.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-pretty text-slate-600">
              Landing Pad gives you a personalized 30-day plan and a small crew
              of people going through the same thing, so you can steady
              yourself, rebuild, and relaunch.
            </p>
            <div className="mt-8">
              <CallsToAction />
            </div>
          </div>

          <HomePreview />
        </section>

        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-balance">
                Losing a job takes more than your paycheque
              </h2>
              <p className="mt-4 text-pretty text-slate-600">
                It knocks out your income, your routine, your sense of who you
                are, and your work friendships all at once. Most job-search
                tools only deal with finding the next job. We help with the rest
                of it too.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {PILLARS.map(({ name, summary, points }) => (
                <article
                  key={name}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                >
                  <h3 className="text-xl font-semibold tracking-tight text-teal-800">
                    {name}
                  </h3>
                  <p className="mt-1 font-medium">{summary}</p>
                  <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                    {points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-4 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-balance">
                Your 30-day reset, one week at a time
              </h2>
              <p className="mt-4 text-pretty text-slate-600">
                Each week unlocks gradually, so you won't feel buried on day
                one.
              </p>
            </div>

            <ol className="mt-12 grid gap-8 md:grid-cols-4 md:gap-6">
              {WEEKS.map(({ week, theme, description }) => (
                <li key={week} className="border-t-2 border-teal-700 pt-4">
                  <p className="text-sm text-slate-500">{week}</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight">
                    {theme}
                  </h3>
                  <p className="mt-2 text-sm text-pretty text-slate-600">
                    {description}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-20 rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
              <h2 className="text-2xl font-semibold tracking-tight text-balance">
                Built around how your job ended
              </h2>
              <p className="mt-2 text-pretty text-slate-600">
                Each situation feels different, so your plan starts from yours.
              </p>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {SITUATIONS.map(({ title, description }) => (
                  <div key={title}>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-pretty text-slate-600">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <CallsToAction />
              </div>
            </div>
          </div>
        </section>

        <section
          id="safety"
          className="scroll-mt-4 border-y border-slate-200 bg-white py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance">
              Built with care for hard days
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {PROMISES.map(({ title, description }) => (
                <div key={title}>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-pretty text-slate-600">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 py-20 text-white">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              The first 30 days decide a lot. Nobody should go through them
              alone.
            </h2>
            <p className="mt-4 text-slate-300">
              Start with one check-in. We'll take it from there.
            </p>
            <div className="mt-8 flex justify-center">
              <CallsToAction onDark />
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-600 sm:px-6">
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
    </div>
  );
}

export default Landing;
