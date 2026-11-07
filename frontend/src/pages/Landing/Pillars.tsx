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

function Pillars() {
  return (
    <section className="bg-ink py-24 text-cream">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div className="lg:sticky lg:top-12 lg:self-start">
          <h2 className="font-display text-4xl leading-tight font-medium tracking-tight text-balance sm:text-5xl">
            Losing a job takes more than your paycheque
          </h2>
          <p className="mt-6 text-lg text-pretty text-cream/80">
            It knocks out your income, your routine, your sense of who you are,
            and your work friendships all at once. Most job-search tools only
            deal with finding the next job. We help with the rest of it too.
          </p>
        </div>

        <ol className="divide-y divide-cream/15 border-y border-cream/15">
          {PILLARS.map(({ name, summary, points }, index) => (
            <li
              key={name}
              className="grid gap-4 py-10 sm:grid-cols-[5rem_1fr] sm:gap-6"
            >
              <span
                aria-hidden="true"
                className="font-display text-5xl leading-none text-coral italic"
              >
                0{index + 1}
              </span>
              <div>
                <h3 className="font-display text-3xl font-medium tracking-tight">
                  {name}
                </h3>
                <p className="mt-1 text-lg text-cream/90">{summary}</p>
                <ul className="mt-5 space-y-2.5 text-cream/75">
                  {points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span aria-hidden="true" className="text-coral">
                        →
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default Pillars;
