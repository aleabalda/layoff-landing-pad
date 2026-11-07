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
    <section id="how-it-works" className="scroll-mt-4 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Your 30-day reset, one week at a time
          </h2>
          <p className="mt-4 text-pretty text-slate-600">
            Each week unlocks gradually, so you won't feel buried on day one.
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

        <Situations />
      </div>
    </section>
  );
}

export default HowItWorks;
