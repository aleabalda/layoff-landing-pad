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
    <section id="how-it-works" className="scroll-mt-4 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl leading-tight font-medium tracking-tight text-balance sm:text-5xl">
            Your 30-day reset, one week at a time
          </h2>
          <p className="mt-4 text-lg text-pretty text-ink-soft">
            Each week unlocks gradually, so you won't feel buried on day one.
          </p>
        </div>

        <div className="relative mt-16">
          <div
            aria-hidden="true"
            className="absolute top-6 right-[12.5%] left-[12.5%] hidden h-px bg-ink/20 md:block"
          />
          <ol className="relative grid gap-10 md:grid-cols-4 md:gap-6">
            {WEEKS.map(({ week, theme, description }, index) => (
              <li
                key={week}
                className="flex gap-5 md:flex-col md:items-center md:text-center"
              >
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-clay font-display text-xl text-cream ring-8 ring-cream"
                >
                  {index + 1}
                </span>
                <div className="md:mt-5">
                  <p className="text-xs font-medium tracking-widest text-ink-soft uppercase">
                    {week}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-medium tracking-tight">
                    {theme}
                  </h3>
                  <p className="mt-2 text-sm text-pretty text-ink-soft">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <Situations />
      </div>
    </section>
  );
}

export default HowItWorks;
