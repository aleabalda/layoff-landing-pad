import Situations from "./Situations";

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

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-4 bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="gap-10 lg:flex lg:items-end lg:justify-between">
          <h2 className="max-w-xl font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl">
            Your 30-day reset, one week at a time
          </h2>
          <p className="mt-4 max-w-sm text-lg text-pretty text-muted lg:mt-0">
            Each week unlocks gradually, so you won't feel buried on day one.
          </p>
        </div>

        <div
          aria-hidden="true"
          className="mt-14 h-2 rounded-full bg-linear-to-r from-lilac via-peach to-sun"
        />
        <ol className="mt-5 grid gap-4 md:grid-cols-4">
          {WEEKS.map(({ week, theme, description }) => (
            <li key={week} className="rounded-3xl bg-mist p-6">
              <p className="text-sm font-semibold text-muted">{week}</p>
              <h3 className="mt-2 font-display text-3xl font-bold tracking-tight">
                {theme}
              </h3>
              <p className="mt-3 text-sm text-pretty text-muted">
                {description}
              </p>
            </li>
          ))}
        </ol>

        <Situations />
      </div>
    </section>
  );
}

export default HowItWorks;
